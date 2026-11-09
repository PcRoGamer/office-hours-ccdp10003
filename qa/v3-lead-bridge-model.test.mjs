// Adapter unit-contract fixture. This exercises the REAL SYSTEMS model and the
// lead evidence bridge with authored schema-shaped events, not actual pointer play.
import assert from 'node:assert/strict';
import {newRun} from '../night-shift-v3/systems/engine.js';
import {createSceneScoreBridge} from '../night-shift-v3/runtime/score-bridge.js';
import {verifyFinalLedger} from '../night-shift-v3/finalization/scoring/ledger.js';
function evidence(id){
 const action=(name,objectId)=>({name,objectId});
 if(id==='I1')return {progress:5,notice:{real:'pending',fake:'pending'},actions:Array.from({length:5},(_,i)=>action('approved-manual','form-'+i))};
 if(id==='I2')return {progress:2,actions:[action('shredded-spam','junk-a'),action('shredded-spam','junk-b')]};
 if(id==='I3')return {progress:3,notice:{real:'pending'},actions:[1,2,3].map(i=>action('closed-scam','scam-'+i))};
 if(id==='I4')return {actions:[action('stamp-start','carbon-1'),action('route-node','node-2'),action('route-node','node-3'),action('route-node','node-4')]};
 if(id==='S1')return {filed:[0,1,2]};
 if(id==='S2')return {caught:3,miraWorkstation:'functional'};
 if(id==='S3')return {safePull:true,method:'page-pull'};
 if(id==='S4')return {method:'socket-hold-trace'};
 if(id==='P4')return {framing:'context'};
 if(id[0]==='P')return {manualCorrect:2};
 if(id==='T1')return {workersSeen:3,workerIdsRescued:['mira','jules']};
 if(id==='T2')return {boxesCleared:3,workerCrossedExit:true,manualInteractions:true};
 if(id==='T3')return {clockedOut:true,timedWindowUsed:true,manualInteractions:true};
 if(id==='T4')return {choices:[
  {id:'licence-mira',worker:'MIRA',destination:'GIVE',amount:40,manual:true},
  {id:'licence-jules',worker:'JULES',destination:'SAVE',amount:40,manual:true}],
  totalBudget:80,unallocatedDollars:0};
 throw Error('missing '+id);
}
for(const [seed,firstRun] of [[1,true],[73,false],[1031,false]]){
 const run=newRun({seed,firstRun});const bridge=createSceneScoreBridge(run);
 let cards=0,printers=0,quotas=0;
 for(let i=0;i<60;i++){
  const stage=run.stage;
  if(stage.type==='card'){
   const id=stage.id;
   for(let j=0;j<5;j++)run.tickActive(100);
   if(id[0]==='P'){
    for(let j=0;j<(id==='P3'||id==='P4'?1:2);j++)
     bridge.observe({type:'card-action',correct:true,kind:'manual-verified',objectId:'fixture-'+j,synthetic:false},id);
    // P4's actual game supports one physical framing gesture; model requests one.
   }
   bridge.commit(id,evidence(id),{status:'success'});cards++;
  }else if(stage.type==='promotion'){run.choosePerk(run.availableDraft[0])}
  else if(stage.type==='boss'){
   const id=stage.id;
   if(id==='printer')printers++;else quotas++;
   for(let phase=1;phase<=3;phase++){
    if(id==='quota'){
     const bonus=phase===1?['quota:p1:b1']:phase===2?['quota:p2:b1']:['quota:p3:b1','quota:p3:b2'];
     for(const key of bonus)bridge.observe({type:'quota-bonus-resolved',objectId:key,outcome:'file',synthetic:false},id);
     bridge.observe({type:'boss-phase-complete',objectId:'quota:bolt:'+phase,outcome:'counter',synthetic:false},id);
    }else bridge.observe({type:'printer-bolt-removed',boltIndex:phase-1,manual:true,synthetic:false},id);
   }
   bridge.bossComplete(id,id==='quota'?{boltsRemoved:3,synthetic:false}:{manualCounters:3});
  }else if(stage.type==='victory')break;
  else throw Error('Unexpected stage '+JSON.stringify(stage));
 }
 assert.equal(cards,12);assert.equal(printers,1);assert.equal(quotas,1);
 assert.equal(run.status,'victory');
 const slip=verifyFinalLedger(run.snapshot);
 assert.equal(slip.verified,true);
 assert.equal(slip.cardIds.length,12);
 assert.equal(slip.bossCounters.length,6);
 console.log('PASS real SYSTEMS + schema fixture '+seed,slip.officialScore,slip.peopleScore);
}
console.log('FIXTURE PASS: real SYSTEMS internals validated; DOES NOT certify actual pointer gameplay');
