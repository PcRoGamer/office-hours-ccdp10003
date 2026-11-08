/** Deterministic event-sourced run director owned by SYSTEMS. No rendering or timers. */
import {CARDS,CARD_BY_ID,PERKS,DIRECTIVES,BONUS_PACKETS,createDeck,validateDeck,buildStages,assignDirectives,makeDraft,synergyNames} from './core.js';
const cap=(n,min,max)=>Math.max(min,Math.min(max,n));
const copy=value=>JSON.parse(JSON.stringify(value));
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
const wantedBy={S2:['mira-workstation'],T1:['worker-1','worker-2','worker-3']};
const requiredActions={I1:5,I2:2,I3:3,I4:3,S1:3,S2:2,S3:1,S4:1,P1:2,P2:2,P3:1,P4:1,T1:2,T2:1,T3:1,T4:2};
export function readScores(ledger,{mode='standard',continued=false,retries=0}={}){
  // Only *committed* actions from a frozen ledger, no potentially stale mutable counters.
  const events=ledger.filter(e=>e.committed);
  const cards=new Map(),workers=new Map(),licences=new Map(),notices=new Map(),bonuses=new Map();
  const incidents=[];let correct=0,wrong=0,streak=0,best=0,frame=null,workstationIntact=null;
  for(const e of events){
    if(e.kind==='card-complete'&&!cards.has(e.encounterId))cards.set(e.encounterId,e);
    if(e.kind==='action'&&!e.synthetic){if(e.outcome==='correct'){correct++;best=Math.max(best,++streak);}else if(e.outcome==='wrong'){wrong++;streak=0;}}
    if(e.kind==='worker'&&!workers.has(e.objectId)){workers.set(e.objectId,Boolean(e.outcome==='helped'));if(e.objectId==='mira-workstation')workstationIntact=e.outcome==='helped';}
    if(e.kind==='licence'&&!licences.has(e.objectId))licences.set(e.objectId,e.outcome);
    if(e.kind==='notice'&&!notices.has(e.objectId))notices.set(e.objectId,e.outcome==='safe');
    if(e.kind==='quota-packet'&&!bonuses.has(e.objectId))bonuses.set(e.objectId,e.outcome);
    if(e.kind==='frame')frame=e.outcome;
    if(e.kind==='incident')incidents.push({kind:e.outcome,objectId:e.objectId??null});
  }
  const saved=[...licences.values()].filter(x=>x==='save').length*40;
  const given=[...licences.values()].filter(x=>x==='give').length;
  const filed=[...bonuses.values()].filter(x=>x==='file').length;
  const completed=cards.size;
  const paceMean=completed?[...cards.values()].reduce((sum,e)=>sum+cap(1-e.activeElapsedMs/CARD_BY_ID[e.encounterId].authoredReferenceMs,0,1),0)/completed:0;
  const official={completedWork:40*completed/12,pace:15*paceMean,cleanStreak:15*cap(best/8,0,1),budgetSavings:10*saved/80,bossFileBonus:5*filed};
  const people={coworkerSupport:workers.size?35*[...workers.values()].filter(Boolean).length/workers.size:0,toolAccess:30*given/2,carefulActions:20*correct/Math.max(1,correct+wrong),attentionToHelp:notices.size?15*[...notices.values()].filter(Boolean).length/notices.size:0};
  const score=o=>Math.round(Object.values(o).reduce((a,b)=>a+b,0));
  const officialScore=score(official),peopleScore=score(people);
  const title=officialScore>=85?'Employee of the Day':officialScore>=70?'Employee of the Week Candidate':'Provisional Employee';
  const high=officialScore>=80,pHigh=peopleScore>=80;
  const closing=high?(pHigh?'Employee of the Day. Please stop making the rest of us look functional.':'Record productivity! Your colleagues have filed a missing-chairs report.'):(pHigh?'You missed the target. Everybody made it home. The target is under review.':'A catastrophic shift. The printer is requesting hazard pay.');
  const report={officialScore,peopleScore,official,people,title,closing,highOfficial:high,highPeople:pHigh,completedCardIds:[...cards.keys()],longestCleanActionStreak:best,correctResolvedActions:correct,wrongResolvedActions:wrong,workersEncountered:workers.size,workersHelped:[...workers.values()].filter(Boolean).length,licenceTokensGiven:given,savedLicenceDollars:saved,notificationsEncountered:notices.size,safeNotificationsHandled:[...notices.values()].filter(Boolean).length,bonusPacketOutcomes:Object.fromEntries(bonuses),packetsFiled:filed,frame,workstationIntact,incidents,retries,mode,continued};
  return freeze(report);
}
const assert=(c,message)=>{if(!c)throw Error(message);};
export class NightShiftRun {
  constructor({seed=1,firstRun=false,mode='standard'}={}){
    assert(Number.isSafeInteger(seed),'seed must be integer');assert(['standard','practice'].includes(mode),'invalid mode');
    this.seed=seed>>>0;this.firstRun=Boolean(firstRun);this.mode=mode;
    this.runId=`nightshift-v3:${this.seed}:${this.mode}`;
    this.deck=createDeck(this.seed,{firstRun});assert(validateDeck(this.deck),'invalid deck');
    this.schedule=assignDirectives(this.seed,this.deck,{firstRun});this.stages=buildStages(this.deck);
    this.stageIndex=0;this.hearts=3;this.continueAvailable=true;this.continueUsed=false;this.retries=0;
    this.levels=Object.fromEntries(PERKS.map(p=>[p,0]));this.pickedPerks=[];this.draftHistory=[];this.activeDirective=null;
    this.phase=1;this.quotaPressure=0;this.coolOpeningExtensionMs=0;this.timeBankMs=0;
    this._ledger=[];this._pending=[];this._nextId=1;this._attemptSerial=0;this._activeMs=0;this._attemptKeys=new Set();
    this._resolvedPacketIds=new Set();this._completedIds=new Set();this._paused=false;this._hidden=false;this._finished=null;this._wiped=false;
    this._newAttempt();
  }
  get stage(){return this.stages[this.stageIndex]||{type:'victory'};}
  get status(){return this._finished?'victory':this._wiped?'gameover':this.stage.type==='boss'?this.stage.id:this.stage.type;}
  get attemptId(){return `${this.runId}:attempt:${this._attemptSerial}`;}
  get activeMs(){return this._activeMs;}
  get eventLedger(){return this._ledger.map(e=>freeze({...e}));}
  get currentCardId(){return this.stage.type==='card'?this.stage.id:null;}
  get currentDirective(){return this.activeDirective;}
  get endingSnapshot(){return this._finished;}
  get availableDraft(){return this.stage.type==='promotion'?makeDraft(this.seed,this.stage.slot,this.levels,this.deck,{firstRun:this.firstRun}):[];}
  _newAttempt(){this._attemptSerial++;this._activeMs=0;this._pending=[];this._attemptKeys=new Set();}
  _event(kind,objectId=null,outcome=null,details={}){return freeze({id:`${this.runId}:event:${this._nextId++}`,runId:this.runId,encounterId:this.stage.id??`promotion:${this.stage.slot}`,attemptId:this.attemptId,tActiveMs:this._activeMs,kind,objectId,outcome,synthetic:false,committed:true,...details});}
  _pendingEvent(kind,objectId,outcome,details){this._pending.push(this._event(kind,objectId,outcome,{...details,committed:false}));}
  _flush(){for(const e of this._pending)this._ledger.push(freeze({...e,committed:true}));this._pending=[];}
  _requirePlaying(){assert(!this._finished&&!this._wiped,'run is not active');assert(this.stage.type==='card'||this.stage.type==='boss','action requires playable encounter');}
  pause(isPaused=true){this._paused=Boolean(isPaused);}
  visibility(hidden=true){this._hidden=Boolean(hidden);}
  tickActive(dtMs){this._requirePlaying();assert(Number.isFinite(dtMs)&&dtMs>=0,'invalid active delta');if(!this._paused&&!this._hidden)this._activeMs+=Math.min(dtMs,100);return this._activeMs;}
  recordAction({objectId,outcome='correct',synthetic=false,perkSource=null,gesture='tap'}={}){
    this._requirePlaying();assert(!this._paused&&!this._hidden,'cannot record input while paused or hidden');assert(typeof objectId==='string'&&objectId.length>0,'action needs unique objectId');
    assert(['correct','wrong'].includes(outcome),'invalid action outcome');
    assert(!synthetic||PERKS.includes(perkSource),'synthetic action needs perk provenance');
    const dedupeKey=`action:${objectId}:${outcome}`;
    if(this._attemptKeys.has(dedupeKey))return false;
    // A target already legitimately resolved is never scored again, including via ghost.
    if(outcome==='correct'&&this._attemptKeys.has(`resolved:${objectId}`))return false;
    this._attemptKeys.add(dedupeKey);
    if(outcome==='correct')this._attemptKeys.add(`resolved:${objectId}`);
    this._pendingEvent('action',objectId,outcome,{synthetic,perkSource,gesture});return true;
  }
  recordWorker(objectId,helped){this._requirePlaying();assert((wantedBy[this.stage.id]||[]).includes(objectId),'unavailable worker');const k=`worker:${objectId}`;if(this._attemptKeys.has(k))return false;this._attemptKeys.add(k);this._pendingEvent('worker',objectId,helped?'helped':'not-helped');return true;}
  recordNotice(objectId,{genuine,safelyHandled}={}){this._requirePlaying();assert(typeof objectId==='string'&&objectId.length>0&&typeof genuine==='boolean'&&typeof safelyHandled==='boolean','notice details missing');const k=`notice:${objectId}`;if(this._attemptKeys.has(k))return false;this._attemptKeys.add(k);this._pendingEvent('notice',objectId,safelyHandled?'safe':'missed',{genuine});return true;}
  allocateLicence(worker,choice){this._requirePlaying();assert(this.stage.id==='T4','licences only in T4');assert(['mira','jules'].includes(worker)&&['give','save'].includes(choice),'invalid licence allocation');const k=`licence:${worker}`;if(this._attemptKeys.has(k))return false;this._attemptKeys.add(k);this._pendingEvent('licence',worker,choice,{dollars:40});return true;}
  recordFrame(choice){this._requirePlaying();assert(this.stage.id==='P4'&&['headline','context'].includes(choice),'framing choice only in P4');if(this._attemptKeys.has('frame'))return false;this._attemptKeys.add('frame');this._pendingEvent('frame','presentation',choice);return true;}
  recordIncident(code,objectId){this._requirePlaying();assert(typeof code==='string'&&code.length>0,'invalid incident');this._pendingEvent('incident',objectId??null,code);}
  completeCard(){
    this._requirePlaying();assert(this.stage.type==='card','not on card');const id=this.stage.id;
    assert(!this._completedIds.has(id),'card already committed');
    const actions=this._pending.filter(e=>e.kind==='action'&&e.outcome==='correct'&&!e.synthetic).length;
    assert(actions>=requiredActions[id],`insufficient real actions for ${id}: ${actions}/${requiredActions[id]}`);
    if(wantedBy[id])assert(wantedBy[id].every(w=>this._pending.some(e=>e.kind==='worker'&&e.objectId===w)),`missing visible worker observations ${id}`);
    if(id==='T4')assert(['mira','jules'].every(w=>this._pending.some(e=>e.kind==='licence'&&e.objectId===w)),'both $40 tokens must be allocated');
    if(id==='P4')assert(this._pending.some(e=>e.kind==='frame'),'P4 requires committed framing');
    if(id==='I1')assert(this._pending.filter(e=>e.kind==='notice').length>=2,'I1 must include real and counterfeit notice');
    const activeElapsedMs=Math.round(this._activeMs);this._flush();
    this._ledger.push(this._event('card-complete',id,'completed',{encounterId:id,activeElapsedMs,authoredReferenceMs:CARD_BY_ID[id].authoredReferenceMs}));
    this._completedIds.add(id);
    if(this.levels['time-bank']>0){const unused=Math.max(0,CARD_BY_ID[id].authoredReferenceMs-activeElapsedMs);this.timeBankMs=Math.min(this.levels['time-bank']===2?10000:6000,this.timeBankMs+Math.min(2000,unused));}
    this._advance();return true;
  }
  _advance(){this.stageIndex++;this.phase=1;this._newAttempt();if(this.stage.type==='promotion')this.hearts=Math.min(3,this.hearts+1);if(this.stage.type==='victory')this._end();}
  choosePerk(perk){assert(this.stage.type==='promotion'&&!this._finished&&!this._wiped,'not in promotion');const offers=this.availableDraft;assert(offers.includes(perk),'not a legal draft offer');assert(this.levels[perk]<2,'perk already maxed');this.draftHistory.push(offers);this.levels[perk]++;this.pickedPerks.push(perk);this.activeDirective=this.schedule[this.stage.slot];this._ledger.push(this._event('promotion',perk,`level-${this.levels[perk]}`,{directiveSource:this.activeDirective}));this._advance();return this.activeDirective;}
  recordBossAction(objectId,{kind='counter',outcome='correct'}={}){this._requirePlaying();assert(this.stage.type==='boss','not on boss');assert(['counter','hazard','cover'].includes(kind),'unknown boss action');return this.recordAction({objectId:`${this.stage.id}:p${this.phase}:${objectId}`,outcome,gesture:kind});}
  resolveBossCounter(){this._requirePlaying();assert(this.stage.type==='boss','not a boss');const stage=this.stage.id;
    assert(this._pending.some(e=>e.kind==='action'&&e.gesture==='counter'&&e.outcome==='correct'&&!e.synthetic),'counter needs a real manual action');
    this._flush();this._ledger.push(this._event('boss-counter',`${stage}:bolt:${this.phase}`,'removed'));
    this.coolOpeningExtensionMs=0;
    if(stage==='quota'){
      // An ignored bonus is an explicit expired opportunity; must never reappear.
      const phasePackets=BONUS_PACKETS.filter(id=>id.startsWith(`quota:p${this.phase}:`));
      for(const id of phasePackets)if(!this._resolvedPacketIds.has(id))this._expirePacket(id);
    }
    if(this.phase<3){this.phase++;this._newAttempt();}else this._advance();return this.stage;
  }
  _expirePacket(id){this._resolvedPacketIds.add(id);this._ledger.push(this._event('quota-packet',id,'expired',{phase:this.phase}));}
  resolveBonusPacket(id,choice,{manual=true}={}){
    this._requirePlaying();assert(this.stage.type==='boss'&&this.stage.id==='quota','packet only inside THE QUOTA');
    assert(BONUS_PACKETS.includes(id)&&id.startsWith(`quota:p${this.phase}:`),'bonus packet not in current phase');
    assert(['file','cool','expired'].includes(choice),'invalid packet choice');
    if(this._resolvedPacketIds.has(id))return false;
    assert(choice==='expired'||manual===true,'FILE/COOL requires a player route');
    this._resolvedPacketIds.add(id);
    if(choice==='file')this.quotaPressure=Math.min(2,this.quotaPressure+1);
    if(choice==='cool'){this.quotaPressure=Math.max(0,this.quotaPressure-1);this.coolOpeningExtensionMs+=750;}
    this._ledger.push(this._event('quota-packet',id,choice,{phase:this.phase,pressureAfter:this.quotaPressure,openingExtensionMs:choice==='cool'?750:0}));return true;
  }
  spendTimeBank(){this._requirePlaying();if(this.levels['time-bank']<=0||this.timeBankMs===0)return 0;
    // Scene controls visibility of the <3 s window; runtime cannot infer the scene's timer from reference score clock.
    const capMs=this.levels['time-bank']===2?3000:2000;const spent=Math.min(this.timeBankMs,capMs);
    this.timeBankMs-=spent;this._pendingEvent('time-bank','clock','spent',{spentMs:spent});return spent;
  }
  failAttempt({reason='mistake',damage=true}={}){
    this._requirePlaying();this.retries++;
    this._pending=[];this._attemptKeys.clear();
    if(damage&&this.mode==='standard'){this.hearts=Math.max(0,this.hearts-1);if(this.hearts===0){this._wiped=true;return 'union-break-or-gameover';}}
    this._newAttempt();return 'retry';
  }
  useContinue(){assert(this._wiped&&this.mode==='standard'&&this.continueAvailable,'no union break remaining');this.continueAvailable=false;this.continueUsed=true;this.hearts=3;this._wiped=false;this._newAttempt();return true;}
  acceptGameOver(){assert(this._wiped&&!this.continueAvailable,'union break available');if(!this._finished)this._finished=freeze(readScores(this._ledger,{mode:this.mode,continued:this.continueUsed,retries:this.retries}));return this._finished;}
  _end(){assert(this._completedIds.size===12,'cannot win without twelve distinct card credits');const printer=this._ledger.filter(e=>e.kind==='boss-counter'&&e.objectId?.startsWith('printer:bolt:')).length;const quota=this._ledger.filter(e=>e.kind==='boss-counter'&&e.objectId?.startsWith('quota:bolt:')).length;assert(printer===3&&quota===3,'cannot win without three counters per boss');assert(this._resolvedPacketIds.size===4,'four quota opportunities must be resolved');this._finished=freeze(readScores(this._ledger,{mode:this.mode,continued:this.continueUsed,retries:this.retries}));}
  getScorePreview(){return readScores(this._ledger,{mode:this.mode,continued:this.continueUsed,retries:this.retries});}
  get snapshot(){return copy({schemaVersion:3,seed:this.seed,runId:this.runId,mode:this.mode,status:this.status,stage:this.stage,stageIndex:this.stageIndex,phase:this.phase,hearts:this.hearts,continueAvailable:this.continueAvailable,continueUsed:this.continueUsed,cardDeck:this.deck,directiveSchedule:this.schedule,currentDirective:this.activeDirective,perkLevels:this.levels,pickedPerks:this.pickedPerks,draftHistory:this.draftHistory,completedCardIds:[...this._completedIds],quotaPressure:this.quotaPressure,coolOpeningExtensionMs:this.coolOpeningExtensionMs,timeBankMs:this.timeBankMs,cardAttemptId:this.stage.type==='card'?this.attemptId:null,bossPhaseAttemptId:this.stage.type==='boss'?this.attemptId:null,activeMs:this._activeMs,retries:this.retries,synergies:synergyNames(this.levels),eventLedger:this.eventLedger,endingSnapshot:this._finished});}
}
export function newRun(options){return new NightShiftRun(options);}