// Adversarial tests against the real SYSTEMS event-sourced engine.
// This is a model-level campaign, NOT a simulated pointer playthrough.
// Run: node qa/v3-wrap-game.system.test.mjs
import assert from 'node:assert/strict';
import {newRun,readScores} from '../night-shift-v3/systems/engine.js';
import {BONUS_PACKETS} from '../night-shift-v3/systems/core.js';

const required={I1:5,I2:2,I3:3,I4:3,S1:3,S2:2,S3:1,S4:1,
 P1:2,P2:2,P3:1,P4:1,T1:2,T2:1,T3:1,T4:2};
let tests=0;
function check(name,fn){fn();tests++;console.log('PASS '+name);}
function performModelCampaign(choices=['cool','cool','cool','cool'],licences=['save','save'],seed=1){
 const run=newRun({seed,firstRun:true});let promotions=0;
 let actions=0,printer=0,quota=0,packetIndex=0,guard=0;
 while(!run.endingSnapshot&&guard++<80){
  const stage=run.stage;
  if(stage.type==='card'){
   const id=stage.id;
   if(id==='I1'){
    assert.equal(run.recordNotice('mira-verified',{genuine:true,safelyHandled:true}),true);
    assert.equal(run.recordNotice('fake-coupon',{genuine:false,safelyHandled:true}),true);
    assert.equal(run.recordNotice('fake-coupon',{genuine:false,safelyHandled:true}),false);
   }
   if(id==='S2')run.recordWorker('mira-workstation',true);
   if(id==='T1')for(const worker of ['worker-1','worker-2','worker-3'])run.recordWorker(worker,true);
   if(id==='T4'){
     assert.equal(run.allocateLicence('mira',licences[0]),true);
     assert.equal(run.allocateLicence('jules',licences[1]),true);
     assert.equal(run.allocateLicence('jules','give'),false,'A licence cannot be spent twice');
   }
   if(id==='P4')run.recordFrame('context');
   const needed=required[id];
   assert.ok(Number.isInteger(needed),'Unknown authored card '+id);
   for(let i=0;i<needed;i++){
    const objectId=id+':physical-object-'+i;
    assert.equal(run.recordAction({objectId,gesture:'tap'}),true);
    assert.equal(run.recordAction({objectId,gesture:'tap'}),false);
    actions++;
   }
   assert.equal(run.completeCard(),true,'All required manually sourced actions must allow completion');
  }else if(stage.type==='promotion'){
   const offers=run.availableDraft;
   assert.equal(offers.length,3);
   run.choosePerk(offers[0]);
   promotions++;
  }else if(stage.type==='boss'){
   const phase=run.phase;
   if(stage.id==='quota'){
     const phasePackets=BONUS_PACKETS.filter(id=>id.startsWith('quota:p'+phase+':'));
     for(const id of phasePackets){
       const choice=choices[packetIndex++];
       assert.ok(['file','cool','expired'].includes(choice));
       if(choice!=='expired')assert.throws(
        ()=>run.resolveBonusPacket(id,choice,{manual:false}),/requires a player route/);
       assert.equal(run.resolveBonusPacket(id,choice,{manual:true}),true);
       assert.equal(run.resolveBonusPacket(id,choice,{manual:true}),false);
     }
   }
   assert.throws(()=>run.resolveBossCounter(),/manual action/);
   assert.equal(run.recordBossAction('manual-bolt-'+phase,{kind:'counter'}),true);
   assert.equal(run.recordBossAction('manual-bolt-'+phase,{kind:'counter'}),false);
   run.resolveBossCounter();
   if(stage.id==='quota')quota++;else printer++;
  }else{throw Error('Unexpected stage '+JSON.stringify(stage))}
 }
 assert.ok(guard<80,'Infinite campaign');
 assert.ok(run.endingSnapshot,'No immutable final score');
 return {run,final:run.endingSnapshot,promotions,actions,printer,quota};
}
check('Full twelve-card engine campaign commits one event set and both three-counter bosses',()=>{
 const {run,final,promotions,printer,quota}=performModelCampaign();
 assert.equal(promotions,5);
 assert.equal(printer,3);
 assert.equal(quota,3);
 assert.equal(final.completedCardIds.length,12);
 assert.equal(new Set(final.completedCardIds).size,12);
 assert.equal(run.eventLedger.filter(e=>e.kind==='boss-counter').length,6);
 assert.equal(run.eventLedger.filter(e=>e.kind==='quota-packet').length,4);
 assert.ok(run.eventLedger.every(e=>e.committed));
 assert.ok(Object.isFrozen(final));
 assert.ok(Object.isFrozen(final.official));
 assert.equal(run.status,'victory');
});
check('All sixteen binary FILE/COOL routes conserve exactly four unique packets',()=>{
 for(let mask=0;mask<16;mask++){
   const choices=BONUS_PACKETS.map((_,i)=>mask&(1<<i)?'file':'cool');
   const {run,final}=performModelCampaign(choices,['give','save'],mask+6);
   const filed=choices.filter(c=>c==='file').length;
   assert.equal(final.packetsFiled,filed);
   assert.equal(final.official.bossFileBonus,filed*5);
   assert.equal(final.licenceTokensGiven,1);
   assert.equal(final.savedLicenceDollars,40);
   assert.equal(final.licenceTokensGiven*40+final.savedLicenceDollars,80);
   assert.deepEqual(Object.keys(final.bonusPacketOutcomes).sort(),[...BONUS_PACKETS].sort());
   assert.deepEqual(BONUS_PACKETS.map(k=>final.bonusPacketOutcomes[k]),choices);
   assert.ok(run.quotaPressure>=0&&run.quotaPressure<=2);
 }
});
check('All legal two-licence distributions conserve $80 and alter the two score lenses',()=>{
 const outputs=[];
 for(const combination of [['give','give'],['give','save'],['save','give'],['save','save']]){
  const {final}=performModelCampaign(['cool','file','cool','file'],combination,112);
  const given=combination.filter(x=>x==='give').length;
  const saved=combination.filter(x=>x==='save').length*40;
  assert.equal(final.licenceTokensGiven,given);
  assert.equal(final.savedLicenceDollars,saved);
  assert.equal(given*40+saved,80);
  outputs.push([final.official.budgetSavings,final.people.toolAccess]);
 }
 assert.deepEqual(outputs,[[0,30],[5,15],[5,15],[10,0]]);
});
check('Four expired opportunities carry zero bonus, cannot be filed later',()=>{
 const {run,final}=performModelCampaign(['expired','expired','expired','expired']);
 assert.equal(final.packetsFiled,0);
 assert.equal(final.official.bossFileBonus,0);
 assert.equal(Object.values(final.bonusPacketOutcomes).filter(x=>x==='expired').length,4);
 assert.equal(run.eventLedger.filter(e=>e.kind==='quota-packet').length,4);
});
check('Uncommitted failed attempts never mint score or completed work',()=>{
 const run=newRun({seed:19});
 run.recordAction({objectId:'I1:valid-1',outcome:'correct'});
 run.recordAction({objectId:'I1:wrong',outcome:'wrong'});
 assert.equal(run.getScorePreview().correctResolvedActions,0);
 assert.equal(run.failAttempt(), 'retry');
 assert.equal(run.hearts,2);
 assert.equal(run.eventLedger.length,0);
 assert.equal(run.getScorePreview().completedCardIds.length,0);
 assert.throws(()=>run.completeCard(),/insufficient real actions/);
});
check('Pause and tab visibility prevent forged action/clock events',()=>{
 const run=newRun({seed:20});run.tickActive(100);
 const t=run.activeMs;
 run.pause(true);run.tickActive(1000);
 assert.equal(run.activeMs,t);
 assert.throws(()=>run.recordAction({objectId:'fake'}),/paused or hidden/);
 run.pause(false);run.visibility(true);run.tickActive(500);
 assert.equal(run.activeMs,t);
 assert.throws(()=>run.recordAction({objectId:'fake'}),/paused or hidden/);
});
check('Score reader ignores mutable, uncommitted, and synthetic payloads',()=>{
 const raw=[{committed:false,kind:'action',outcome:'correct',synthetic:false},
 {committed:true,kind:'action',outcome:'correct',synthetic:true},
 {committed:true,kind:'quota-packet',objectId:BONUS_PACKETS[0],outcome:'file'},
 {committed:true,kind:'licence',objectId:'mira',outcome:'save'}];
 const report=readScores(raw);
 assert.equal(report.correctResolvedActions,0);
 assert.equal(report.packetsFiled,1);
 assert.equal(report.savedLicenceDollars,40);
 assert.equal(report.completedCardIds.length,0);
 assert.ok(Object.isFrozen(report));
});
console.log(JSON.stringify({pass:true,groups:tests,
  bonusPatterns:16,licenceAllocations:4,artificialInput:'Test-identified modeled physical actions only; NOT real Playwright gestures'},null,2));