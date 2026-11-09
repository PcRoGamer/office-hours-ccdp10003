/**
 * SCORE_ENDING: independently verify the committed SYSTEMS event ledger.
 * Never guess missing actions, worker outcomes, points or physical boss counters.
 */
export const BONUS_IDS=Object.freeze(['quota:p1:b1','quota:p2:b1','quota:p3:b1','quota:p3:b2']);
export const REFERENCE_MS=Object.freeze({
 I1:18000,I2:12000,I3:12000,I4:13000,S1:14000,S2:14000,S3:12000,S4:13000,
 P1:14000,P2:12000,P3:12000,P4:14000,T1:14000,T2:12000,T3:12000,T4:14000
});
const ok=(condition,message)=>{if(!condition)throw Error('SCORE_LEDGER: '+message)};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const copy=x=>JSON.parse(JSON.stringify(x));
function freeze(x){if(x&&typeof x==='object'&&!Object.isFrozen(x)){for(const v of Object.values(x))freeze(v);Object.freeze(x)}return x}
function indexUnique(events,kind,key='objectId'){
 const map=new Map();
 for(const e of events.filter(e=>e.kind===kind)){
  ok(typeof e[key]==='string'&&e[key].length>0,kind+' missing identity');
  ok(!map.has(e[key]),'duplicate '+kind+' '+e[key]);map.set(e[key],e);
 }return map;
}
export function verifyFinalLedger(snapshot){
 ok(snapshot&&typeof snapshot==='object','SYSTEMS snapshot required');
 const s=copy(snapshot),deck=s.cardDeck;
 ok(s.schemaVersion===3&&s.status==='victory','completed SYSTEMS v3 victory required');
 ok(Array.isArray(deck)&&deck.length===12&&new Set(deck).size===12,'twelve unique cards required');
 ok(deck.every(id=>Object.hasOwn(REFERENCE_MS,id)),'unknown authored card');
 ok(['I','S','P','T'].every((p,d)=>deck.slice(3*d,3*d+3).every(id=>id[0]===p)),'department sequence invalid');
 ok(Array.isArray(s.draftHistory)&&s.draftHistory.length===5
   &&Array.isArray(s.pickedPerks)&&s.pickedPerks.length===5,'five real promotions required');
 ok(Array.isArray(s.directiveSchedule)&&s.directiveSchedule.length===5
   &&new Set(s.directiveSchedule).size===5,'five distinct directives required');
 ok(Array.isArray(s.eventLedger)&&s.eventLedger.length>0,'event ledger required');
 const ids=new Set();
 for(const e of s.eventLedger){
  ok(e&&typeof e.id==='string'&&!ids.has(e.id),'malformed or duplicate event ID');
  ids.add(e.id);ok(e.runId===s.runId,'event belongs to a different run');
 }
 const events=s.eventLedger.filter(e=>e.committed===true);
 const cards=indexUnique(events,'card-complete','encounterId');
 ok(cards.size===12&&deck.every(id=>cards.has(id)),'twelve physically completed cards required');
 for(const id of deck){
  const e=cards.get(id);
  ok(e.outcome==='completed'&&Number.isFinite(e.activeElapsedMs)&&e.activeElapsedMs>=0
     &&e.authoredReferenceMs===REFERENCE_MS[id],'unproven elapsed time/credit for '+id);
 }
 const promotions=events.filter(e=>e.kind==='promotion');
 ok(promotions.length===5&&promotions.every(e=>s.pickedPerks.includes(e.objectId)),'promotion ledger incomplete');
 const counters=indexUnique(events,'boss-counter');
 ok(counters.size===6,'six actual bolt removals required');
 for(const boss of ['printer','quota'])for(let p=1;p<=3;p++){
  const key=boss+':bolt:'+p,e=counters.get(key);
  ok(e?.outcome==='removed'&&e.encounterId===boss,'missing '+key);
  const before=events.slice(0,events.indexOf(e));
  ok(before.some(a=>a.kind==='action'&&a.outcome==='correct'&&a.synthetic===false
     &&a.gesture==='counter'&&a.attemptId===e.attemptId&&a.encounterId===boss),
    'missing manual counter evidence for '+key);
 }
 const packets=indexUnique(events,'quota-packet');
 ok(packets.size===4,'exactly four bonus dispositions required');
 for(const id of BONUS_IDS){
  const e=packets.get(id);
  ok(e&&e.encounterId==='quota'&&e.synthetic!==true
   &&['file','cool','expired'].includes(e.outcome),'invalid packet '+id);
 }
 const licences=indexUnique(events,'licence');
 ok(licences.size===2&&licences.has('mira')&&licences.has('jules'),'two distinct licences required');
 for(const id of ['mira','jules']){
  const e=licences.get(id);
  ok(e.encounterId==='T4'&&e.synthetic===false&&e.dollars===40
     &&['give','save'].includes(e.outcome),'invalid $40 disposition '+id);
 }
 const savings=[...licences.values()].filter(e=>e.outcome==='save').length*40;
 const given=80-savings;
 ok(savings+given===80,'$80 budget not conserved');
 const frames=events.filter(e=>e.kind==='frame');
 ok(frames.length===1&&frames[0].encounterId==='P4'
  &&['headline','context'].includes(frames[0].outcome),'actual framing decision missing');
 const manual=events.filter(e=>e.kind==='action'&&e.synthetic===false);
 const uniqueManual=new Set(),correct=manual.filter(e=>e.outcome==='correct').length;
 const wrong=manual.filter(e=>e.outcome==='wrong').length;
 let streak=0,best=0;
 for(const e of manual){
  ok(['correct','wrong'].includes(e.outcome),'unknown manual outcome');
  const key=[e.attemptId,e.objectId,e.outcome].join('|');
  ok(!uniqueManual.has(key),'duplicate manual outcome '+key);uniqueManual.add(key);
  if(e.outcome==='correct'){streak++;best=Math.max(best,streak)}else streak=0;
 }
 const workers=indexUnique(events,'worker'),notices=indexUnique(events,'notice');
 const filed=BONUS_IDS.filter(id=>packets.get(id).outcome==='file').length;
 const official={
  completedWork:40,
  pace:15*deck.reduce((sum,id)=>sum+clamp(1-cards.get(id).activeElapsedMs/REFERENCE_MS[id],0,1),0)/12,
  cleanStreak:15*clamp(best/8,0,1),
  budgetSavings:10*savings/80,
  bossFileBonus:5*filed
 };
 const people={
  coworkerSupport:workers.size?35*[...workers.values()].filter(e=>e.outcome==='helped').length/workers.size:0,
  toolAccess:30*given/80,
  carefulActions:20*correct/Math.max(1,correct+wrong),
  attentionToHelp:notices.size?15*[...notices.values()].filter(e=>e.outcome==='safe').length/notices.size:0
 };
 const score=o=>Math.round(Object.values(o).reduce((s,v)=>s+v,0));
 const officialScore=score(official),peopleScore=score(people);
 ok(officialScore>=0&&officialScore<=100&&peopleScore>=0&&peopleScore<=100,'score out of range');
 const a=s.endingSnapshot;
 ok(a&&a.officialScore===officialScore&&a.peopleScore===peopleScore,'frozen score contradicts ledger');
 for(const [key,data] of Object.entries({official,people}))
  for(const [field,value] of Object.entries(data))
   ok(Number.isFinite(a[key]?.[field])&&Math.abs(a[key][field]-value)<1e-8,'component mismatch '+key+'.'+field);
 ok(a.savedLicenceDollars===savings&&a.licenceTokensGiven===given/40
    &&a.packetsFiled===filed,'receipt summary contradicts events');
 for(const id of BONUS_IDS)ok(a.bonusPacketOutcomes?.[id]===packets.get(id).outcome,'receipt packet mismatch '+id);
 return freeze({
  schemaVersion:1,verified:true,source:'SYSTEMS committed eventLedger',runId:s.runId,
  officialScore,peopleScore,official,people,endingSnapshot:a,
  cardIds:[...deck],promotions:5,bossCounters:[...counters.keys()],
  packets:Object.fromEntries(BONUS_IDS.map(id=>[id,packets.get(id).outcome])),
  licence:{givenDollars:given,savedDollars:savings,totalDollars:80,
   choices:Object.fromEntries([...licences].map(([id,e])=>[id,e.outcome]))},
  correctlyResolved:correct,wronglyResolved:wrong,longestCleanActionStreak:best,
  workersObserved:workers.size,workersHelped:[...workers.values()].filter(e=>e.outcome==='helped').length,
  noticesObserved:notices.size,noticesSafe:[...notices.values()].filter(e=>e.outcome==='safe').length,
  frame:frames[0].outcome,continued:s.continueUsed===true,practice:s.mode==='practice',
  eventCount:events.length
 });
}
