// LEAD-owned orchestration. Demo first-card fallback is NOT a replacement for INTAKE's I1.
// Full campaign requires actual 12 authored definitions, both bosses, draft provider and seeded RNG.
import {createFallbackStampScene} from './transitions.js';
import {createSceneScoreBridge} from './score-bridge.js';
import {assertBossRetrySafe} from '../finalization/bridge/provenance-guards.js';
export function createDirector({viewport,canvas,ctx2d,events:externalEvents,audio,options={},scoreFactory=null}){
  let mode='title',paused=false,scene=null,elapsed=0,limit=18,clock=0,hearts=3,attempt=0;
  let result=null,delay=0,sceneIndex=0,perk=null,deck=['I1'],promotion=null,promotionSlot=-1;
  let ledger=[],definitions=new Map(),bosses=new Map(),draftProvider=null,rand=()=>.5;
  let levels={},activeDirective=null,continueUsed=false,practice=false;
  // Every equipped power-up provides one *real* heart-saving retry in each
  // encounter. Its authored specialty remains active across matching scenes.
  let globalGuardSpent=false,lastGlobalGuard=false;
  let fullCampaign=false,currentBoss=null;
  let scoreRun=null,scoreBridge=null,scoreIssue=null;
  const emit=e=>externalEvents?.emit?.(e);
  const scoreProblem=e=>{if(scoreIssue)return;scoreIssue=String(e?.message||e);emit({type:'score-ledger-error',message:scoreIssue})};
  const fail=(why='mistake')=>{
    if(result||!['card','printer','quota'].includes(mode))return;
    result={outcome:'failed',why};
    const guardUsed=!practice&&!globalGuardSpent&&Object.values(levels).some(n=>n>0);
    if(guardUsed)globalGuardSpent=true;
    lastGlobalGuard=guardUsed;
    const damage=!practice&&!guardUsed;
    if(scoreRun&&!scoreIssue)try{
      if(['card','printer','quota'].includes(mode))scoreRun.failAttempt({reason:why,damage});
    }catch(e){scoreProblem(e)}
    if(damage)hearts=Math.max(0,hearts-1);
    audio?.play?.(guardUsed?'promotion':'wrong');
    if(guardUsed)emit({type:'global-perk-save',hearts,why,perkIds:Object.keys(levels).filter(k=>levels[k]>0)});
    emit({type:'damage',hearts,why,guardUsed});
    scene?.cancelPointer?.();mode='recover';emit({type:'recover',hearts});
  };
  const events={emit:e=>{
    emit(e);
    const active=(mode==='card'||mode==='printer'||mode==='quota');
    if(!active||result)return;
    const id=mode==='card'?deck[sceneIndex]:mode;
    if(mode==='card' && e.cardId && e.cardId!==id)return;
    if(mode!=='card' && e.bossId && e.bossId!==id)return;
    if(scoreBridge&&!scoreIssue)try{scoreBridge.observe(e,id)}catch(error){scoreProblem(error)}
    if(['card-failed','boss-failed'].includes(e.type))return fail(e.reason||'scene-failure');
    const complete=mode==='card'?'card-complete':'boss-complete';
    if(e.type!==complete)return;
    const outcome=e.outcome;
    if(outcome==='failed'||outcome==='failure'||outcome==='lose'||outcome===false||outcome?.cleared===false)
      return fail('scene-failure');
    result={...e,evidence:Object.freeze({...e.evidence})};
    if(scoreBridge&&!scoreIssue)try{
      if(mode==='card')scoreBridge.commit(id,e.evidence,e.outcome);
      else scoreBridge.bossComplete(id,e);
    }catch(error){scoreProblem(error)}
    ledger.push(Object.freeze({id,attemptId:e.attemptId||'attempt-'+attempt,
      outcome:e.outcome,evidence:result.evidence,synthetic:false,committed:true}));
    delay=.38;emit({type:'encounter-cleared',id});
  }};
  const runInfo={
    get hearts(){return hearts},
    get perks(){return {...levels}},get perkLevels(){return {...levels}},
    get activeDirective(){return activeDirective},get directive(){return activeDirective},
    get currentDirective(){return activeDirective},get attemptId(){return 'v3-live-'+attempt},
    get completedCards(){return ledger.filter(e=>e.committed).map(e=>e.id)},
    get events(){return ledger.map(e=>({...e}))}
  };
  const shared={viewport,canvas,ctx2d,events,run:runInfo,audio,options,
    input:{screenToWorld:(x,y)=>viewport.screenToWorld(x,y)},hud:{},render:{},
    physics:null,ledger:{snapshot:()=>ledger.map(x=>({...x}))},
    clock:{get active(){return clock}},rng:()=>rand(),effects:{}};
  function registerDefinitions(items){
    if(!Array.isArray(items))throw Error('definitions array required');
    for(const item of items){if(!item||!item.id||typeof item.create!=='function')throw Error('invalid scene definition');
      if(definitions.has(item.id))throw Error('duplicate scene '+item.id);definitions.set(item.id,item);}
  }
  function registerBosses(items){
    if(!Array.isArray(items))throw Error('boss definitions array required');
    for(const item of items){if(!['printer','quota'].includes(item?.id)||typeof item.create!=='function')throw Error('invalid boss definition');
      if(bosses.has(item.id))throw Error('duplicate boss '+item.id);bosses.set(item.id,item);}
  }
  function configureRun({cards,definitions:defs,bosses:bossDefs,draftProvider:provider,rng}={}){
    if(defs)registerDefinitions(defs);
    if(bossDefs)registerBosses(bossDefs);
    if(!cards)return;
    if(cards.length!==12||new Set(cards).size!==12||cards[0]!=='I1')throw Error('12 distinct cards with I1 first required');
    for(const id of cards)if(!definitions.has(id))throw Error('Missing authored scene '+id);
    for(const id of ['printer','quota'])if(!bosses.has(id))throw Error('Missing authored boss '+id);
    if(typeof provider!=='function'||typeof rng!=='function')throw Error('SYSTEMS draft and seeded RNG required');
    if(!['I','I','I','S','S','S','P','P','P','T','T','T'].every((prefix,i)=>cards[i][0]===prefix))
      throw Error('Department slots must be I×3, S×3, P×3, T×3');
    deck=[...cards];draftProvider=provider;rand=rng;fullCampaign=true;
  }
  function enterCard({preserveGuard=false}={}){
    result=null;delay=0;elapsed=0;attempt++;currentBoss=null;
    if(!preserveGuard){globalGuardSpent=false;lastGlobalGuard=false;}
    scene?.dispose?.();scene=null;
    const id=deck[sceneIndex];if(!id){mode='preview-end';return;}
    const def=definitions.get(id);
    // A reference time is a scoring yardstick, not the player's timeout.
    limit=Math.max(26,def?.seconds||0,((def?.authoredReferenceMs||18000)/1000)+9);
    if(def)scene=def.create({...shared,cardId:id});
    else if(!fullCampaign&&id==='I1')scene=createFallbackStampScene({...shared,onPenalty:()=>{
      hearts--;audio?.play?.('wrong');emit({type:'damage',hearts});}});
    else throw Error('Authored scene missing '+id);
    mode='card';scene.enter?.();emit({type:'card-start',id,attempt});
  }
  function enterBoss(id){
    if(!fullCampaign)throw Error('Full boss cannot run without authored definitions');
    result=null;delay=0;elapsed=0;attempt++;globalGuardSpent=false;lastGlobalGuard=false;scene?.dispose?.();
    const def=bosses.get(id);
    if(!def)throw Error('Missing boss '+id);
    currentBoss=id;limit=Math.max(id==='quota'?130:95,(def.authoredReferenceMs||95000)/1000);
    scene=def.create({...shared,events:{emit:e=>events.emit({...e,bossId:id})}});
    mode=id;scene.enter?.();emit({type:'boss-start',id,attempt});
  }
  function start(){
    scene?.dispose?.();scene=null;mode='title';paused=false;hearts=3;clock=0;
    sceneIndex=0;perk=null;promotion=null;promotionSlot=-1;ledger=[];attempt=0;levels={};activeDirective=null;continueUsed=false;globalGuardSpent=false;lastGlobalGuard=false;
    scoreIssue=null;scoreRun=null;scoreBridge=null;
    if(fullCampaign&&typeof scoreFactory==='function'){
      scoreRun=scoreFactory({mode:practice?'practice':'standard'});
      if(!scoreRun||JSON.stringify(scoreRun.deck)!==JSON.stringify(deck))throw Error('SYSTEMS and player campaign have different decks');
      scoreBridge=createSceneScoreBridge(scoreRun);
    }
    enterCard();audio?.play?.('start');
  }
  const previewOffers=[
    {id:'carbon-copy',title:'CARBON COPY',description:'One perfect stamp duplicates a clean approval.',symbol:'▤',detail:'DUPLICATE A REAL ACTION'},
    {id:'bank-shot',title:'BANK SHOT',description:'Angle a file off office walls into a tricky tray.',symbol:'↗',detail:'RICOCHET THROUGH POLICY'},
    {id:'mira-backup',title:'MIRA BACKUP',description:'A coworker catches one office disaster for you.',symbol:'♥',detail:'TEAMWORK IS A SUPERPOWER'}
  ];
  function promote(slot){
    promotionSlot=slot;
    const info=fullCampaign?draftProvider({slot,deck:[...deck],ledger:ledger.map(x=>({...x}))}):
      {offers:previewOffers,directive:'FAST OR SAFE',subject:'Congratulations! We moved the target.'};
    if(!info||!Array.isArray(info.offers)||info.offers.length!==3)throw Error('Promotion requires 3 real offers');
    if(new Set(info.offers.map(x=>x.id)).size!==3)throw Error('Promotion offers must be distinct');
    promotion={...info,slot};mode='promotion';
    emit({type:'promotion',slot,offers:info.offers.map(x=>x.id)});
  }
  function afterClear(){
    const finished=mode;
    scene?.dispose?.();scene=null;
    if(!fullCampaign){promote(0);return;}
    if(finished==='quota'){mode='victory';emit({type:'campaign-cleared',encounters:ledger.length});return;}
    if(finished==='printer'){promote(2);return;}
    if(sceneIndex===2){promote(0);return;}
    if(sceneIndex===5){promote(1);return;}
    if(sceneIndex===8){promote(3);return;}
    if(sceneIndex===11){promote(4);return;}
    sceneIndex++;enterCard();
  }
  function pickPerk(id){
    if(mode!=='promotion'||!promotion?.offers.some(p=>p.id===id))return false;
    if(scoreRun&&!scoreIssue)try{scoreRun.choosePerk(id)}catch(e){scoreProblem(e)}
    perk=id;levels[id]=(levels[id]||0)+1;activeDirective=promotion.directiveId||promotion.directive;audio?.play?.('promotion');emit({type:'perk-picked',id,slot:promotionSlot,level:levels[id],directive:activeDirective});
    if(!fullCampaign){mode='preview-end';return true;}
    switch(promotionSlot){
      case 0:sceneIndex=3;enterCard();break;
      case 1:enterBoss('printer');break;
      case 2:sceneIndex=6;enterCard();break;
      case 3:sceneIndex=9;enterCard();break;
      case 4:enterBoss('quota');break;
      default:throw Error('Unexpected promotion slot '+promotionSlot);
    }return true;
  }
  function update(dt){
    if(paused||!['card','printer','quota'].includes(mode))return;
    clock+=dt;
    if(scoreRun&&!scoreIssue&&!result&&['card','boss'].includes(scoreRun.stage.type))
      try{scoreRun.tickActive(dt*1000)}catch(e){scoreProblem(e)}
    scene?.update?.(dt);
    // Scene update can synchronously emit failure; never advance it as a success.
    if(!['card','printer','quota'].includes(mode)||result?.outcome==='failed')return;
    if(result){delay-=dt;if(delay<=0)afterClear();return;}
    elapsed+=dt;
    if(elapsed>=limit)fail('timeout');
  }
  function retry(){if(mode!=='recover')return false;
    if(hearts===0){
      if(continueUsed&&!practice){mode='gameover';return false;}
      continueUsed=true;hearts=3;
      if(scoreRun&&!scoreIssue)try{scoreRun.useContinue()}catch(e){scoreProblem(e)}
      emit({type:'union-break',hearts});
    }
    if(currentBoss){
      if(scoreRun&&!scoreIssue)try{
        assertBossRetrySafe({run:scoreRun,scene,bossId:currentBoss});
      }catch(e){scoreProblem(e);return false;}
      result=null;delay=0;elapsed=0;attempt++;mode=currentBoss;
      emit({type:'boss-retry-resumed',id:currentBoss,attempt});
    }else enterCard({preserveGuard:true});
    return true;
  }
  function setPractice(value){practice=Boolean(value)}
  function pointer(kind,point){if(paused||!['card','printer','quota'].includes(mode)||result||!scene)return;
    const key={down:'pointerDown',move:'pointerMove',up:'pointerUp',cancel:'cancelPointer'}[kind];scene[key]?.(mode==='printer'?{...point,x:point.x-viewport.worldWidth/2,y:point.y-viewport.worldHeight/2}:point,viewport);}
  function togglePause(force){if(!['card','printer','quota','recover'].includes(mode))return false;
    paused=force===undefined?!paused:!!force;
    if(scoreRun&&!scoreIssue)try{scoreRun.pause(paused)}catch(e){scoreProblem(e)}
    emit({type:'pause',paused});return paused;}
  function snapshot(){return {mode,paused,hearts,clock:Math.max(0,limit-elapsed),elapsed,
    currentCardId:mode==='card'?deck[sceneIndex]:null,currentBoss,imperative:mode==='card'?(definitions.get(deck[sceneIndex])?.imperative||'STAMP GOOD!'):(mode==='printer'?'UNJAM IT!':mode==='quota'?'CLOCK OUT!':''),deck:[...deck],sceneIndex,selectedPerk:perk,promotionSlot,
    result:result?{id:result.cardId||result.bossId,outcome:result.outcome}:null,
    evidence:ledger.map(x=>({...x})),sceneState:scene?.snapshot?.()??null,targets:['card','printer','quota'].includes(mode)?(scene?.snapshot?.()?.targets||[]):[],
    pendingPromotion:promotion?{offers:promotion.offers.map(x=>x.id),directive:promotion.directive,slot:promotionSlot}:null,
    perkLevels:{...levels},activeDirective,continueUsed,practice,
    globalGuardReady:!practice&&!globalGuardSpent&&Object.values(levels).some(n=>n>0),lastGlobalGuard,
    completeCampaign:mode==='victory'&&fullCampaign,fullCampaign,
    scoreIssue,verifiedScoreReady:mode==='victory'&&!scoreIssue&&scoreRun?.status==='victory'};}
  return {registerDefinitions,registerBosses,configureRun,start,update,pointer,retry,togglePause,setPractice,pickPerk,snapshot,
    getSystemsSnapshot:()=>scoreRun?.snapshot??null,
    get mode(){return mode},get paused(){return paused},get time(){return clock},get scene(){return scene},
    get promotion(){return promotion},get hearts(){return hearts}};
}