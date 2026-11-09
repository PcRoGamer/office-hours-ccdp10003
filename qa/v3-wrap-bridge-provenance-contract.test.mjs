// Independent SYSTEMS provenance, expiry and retry regression suite.
// This is a real event-ledger test, not a claim of a Chrome playthrough.
import assert from 'node:assert/strict';
import {newRun} from '../night-shift-v3/systems/engine.js';
import {createPrinterMutiny} from '../night-shift-v3/bosses/printer/index.js';
import {createQuotaBoss} from '../night-shift-v3/bosses/quota/quota.mjs';
import {verifyFinalLedger} from '../night-shift-v3/finalization/scoring/ledger.js';
import {recordQuotaPacketFromScene,assertBossRetrySafe} from
  '../night-shift-v3/finalization/bridge/provenance-guards.js';

const required={I1:5,I2:2,I3:3,I4:3,S1:3,S2:2,S3:1,S4:1,
  P1:2,P2:2,P3:1,P4:1,T1:2,T2:1,T3:1,T4:2};
const live={worldWidth:1280,worldHeight:760};
const count=(run,kind)=>run.eventLedger.filter(e=>e.kind===kind).length;
function finishCard(run,id){
  for(let i=0;i<required[id];i++)assert.equal(
    run.recordAction({objectId:id+':human-action:'+i,outcome:'correct',gesture:'physical'}),true);
  if(id==='I1'){run.recordNotice('real',{genuine:true,safelyHandled:true});
    run.recordNotice('fake',{genuine:false,safelyHandled:true});}
  if(id==='S2')run.recordWorker('mira-workstation',true);
  if(id==='T1')for(const x of ['worker-1','worker-2','worker-3'])run.recordWorker(x,true);
  if(id==='P4')run.recordFrame('context');
  if(id==='T4')for(const w of ['mira','jules'])run.allocateLicence(w,w==='mira'?'give':'save');
  assert.equal(run.completeCard(),true);
}
function counter(run){
 const phase=run.phase,id=run.stage.id;
 assert.equal(run.recordBossAction('manual-bolt-'+phase,{kind:'counter'}),true);
 run.resolveBossCounter();
 assert.equal(count(run,'boss-counter')>=phase,true);
}
function advanceTo(run,target){
 for(let i=0;i<60;i++){
  const s=run.stage;
  if(s.type==='boss'&&s.id===target)return;
  if(s.type==='card')finishCard(run,s.id);
  else if(s.type==='promotion')run.choosePerk(run.availableDraft[0]);
  else if(s.type==='boss'){for(let p=0;p<3;p++)counter(run);}
  else throw Error('Unexpected stage '+JSON.stringify(s));
 }
 throw Error('Stage '+target+' not reached');
}
function packet(run,key,outcome,other={}){
 return recordQuotaPacketFromScene(run,{
   type:'quota-bonus-resolved',objectId:key,outcome,synthetic:false,
   phase:run.phase,...other
 });
}

const run=newRun({seed:1,firstRun:true});
advanceTo(run,'printer');
counter(run);
assert.equal(run.phase,2,'SYSTEMS must keep earned phase-1 counter');
const beforePrinter=count(run,'boss-counter');
run.failAttempt({reason:'timeout',damage:true});
assert.equal(count(run,'boss-counter'),beforePrinter,'failed attempt cannot erase committed counters');
const freshPrinter=createPrinterMutiny({viewport:live,run:{currentDirective:'MOVING GOALPOSTS'}});
assert.equal(freshPrinter.snapshot().removed,0,'real printer scene restarts at zero');
assert.throws(()=>assertBossRetrySafe({run,scene:freshPrinter,bossId:'printer'}),
  /retry would lose printer counters/);
let printerCancel=false;
const physicalPrinter={snapshot:()=>({removed:1}),cancelPointer:()=>{printerCancel=true}};
assert.equal(assertBossRetrySafe({run,scene:physicalPrinter,bossId:'printer'}),physicalPrinter);
assert.equal(printerCancel,true,'live pointer must be cancelled before resuming');
for(let i=0;i<2;i++)counter(run);
assert.equal(count(run,'boss-counter'),3);
advanceTo(run,'quota');

const originalBridge=await import('../night-shift-v3/runtime/score-bridge.js').catch(err=>{
 if(err.code==='ERR_MODULE_NOT_FOUND')return null;
 throw err;
});
if(originalBridge){
 const bridge=originalBridge.createSceneScoreBridge(run);
 assert.throws(()=>bridge.observe({type:'quota-bonus-resolved',
   objectId:'quota:p1:b1',outcome:'expired',synthetic:false},'quota'),
   /quota packet not manually resolved/,
   'UNPATCHED lead bridge rejects a genuine bonus timeout: reproduced defect');
 console.log('REPRODUCED: current lead bridge incorrectly rejects expired bonus');
}
assert.throws(()=>packet(run,'quota:p2:b1','file'),/out-of-order|wrong packet phase/);
assert.throws(()=>packet(run,'quota:p1:b1','file',{synthetic:true}),/authored scene event/);
assert.throws(()=>packet(run,'quota:p1:b1','cool',{manual:false}),/marked automatic/);
assert.equal(packet(run,'quota:p1:b1','expired'), 'expired');
assert.equal(run.getScorePreview().packetsFiled,0);
assert.equal(run.getScorePreview().official.bossFileBonus,0);
const firstPacket=count(run,'quota-packet');
assert.throws(()=>packet(run,'quota:p1:b1','file'),/packet already resolved|duplicate or out-of-order/);
assert.equal(count(run,'quota-packet'),firstPacket,'duplicate must never mutate ledger');
counter(run);
assert.equal(run.phase,2);
run.failAttempt({reason:'timeout',damage:true});
const freshQuota=createQuotaBoss({viewport:live,run:{currentDirective:'FAST OR SAFE'}});
assert.equal(freshQuota.snapshot().boltsRemoved,0,'real quota scene starts without restored run data');
assert.throws(()=>assertBossRetrySafe({run,scene:freshQuota,bossId:'quota'}),
  /retry would lose quota counters/);
const physicalQuota={snapshot:()=>({boltsRemoved:1,
 bonusOutcomes:{'quota:p1:b1':'expired'}}),cancelPointer(){}};
assert.equal(assertBossRetrySafe({run,scene:physicalQuota,bossId:'quota'}),physicalQuota);
assert.equal(packet(run,'quota:p2:b1','cool'), 'cool');
counter(run);
assert.equal(run.phase,3);
assert.throws(()=>packet(run,'quota:p3:b2','file'),/out-of-order/);
assert.equal(packet(run,'quota:p3:b1','file'),'file');
assert.equal(packet(run,'quota:p3:b2','file'),'file');
counter(run);
assert.equal(run.status,'victory');
assert.equal(count(run,'boss-counter'),6);
assert.equal(count(run,'quota-packet'),4);
const slip=verifyFinalLedger(run.snapshot);
assert.equal(slip.verified,true);
assert.equal(slip.cardIds.length,12);
assert.equal(run.endingSnapshot.packetsFiled,2);
assert.equal(run.endingSnapshot.bonusPacketOutcomes['quota:p1:b1'],'expired');
assert.equal(run.endingSnapshot.official.bossFileBonus,10);
console.log('PASS: 12 real SYSTEMS card credits, 5 promotions, 6 boss counters, 4 unique packet outcomes');
console.log('PASS: timeout gives zero points; forged/duplicate/early packets fail closed');
console.log('PASS: boss retry guard preserves committed counter and packet provenance');
console.log('PASS: verified immutable dual-score ledger',slip.officialScore,slip.peopleScore);
