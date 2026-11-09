/**
 * BRIDGE_QA: adversarial contracts against the LEAD's exact score-bridge source.
 * The test imports the real SYSTEMS engine and (until integration) reads bridge
 * text from BRIDGE_REF. No mock scoring engine or fabricated browser evidence.
 *
 * Run: node --test qa/v3-wrap-bridge-provenance.test.mjs
 * Optional: set BRIDGE_REF=origin/agents/v3-lead-systems-bridge-1109
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {newRun} from '../night-shift-v3/systems/engine.js';
import {verifyFinalLedger} from '../night-shift-v3/finalization/scoring/ledger.js';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const path=process.env.BRIDGE_FILE||resolve(root,'night-shift-v3/runtime/score-bridge.js');
const ref=process.env.BRIDGE_REF||'origin/agents/v3-lead-systems-bridge-1109';
const source=existsSync(path)?readFileSync(path,'utf8'):
 execFileSync('git',['show',ref+':night-shift-v3/runtime/score-bridge.js'],{cwd:root,encoding:'utf8'});
// Import a real .mjs file rather than a data: URL, to preserve useful stack traces.
const {mkdtempSync,writeFileSync,rmSync}=await import('node:fs');
const {tmpdir}=await import('node:os');
const {join}=await import('node:path');
const {pathToFileURL}=await import('node:url');
const moduleDir=mkdtempSync(join(tmpdir(),'nightshift-bridge-source-'));
const moduleFile=join(moduleDir,'score-bridge.mjs');
writeFileSync(moduleFile,source,'utf8');
process.once('exit',()=>rmSync(moduleDir,{recursive:true,force:true}));
const {createSceneScoreBridge}=await import(pathToFileURL(moduleFile).href);
const required={I1:5,I2:2,I3:3,I4:3,S1:3,S2:2,S3:1,S4:1,
 P1:2,P2:2,P3:1,P4:1,T1:2,T2:1,T3:1,T4:2};
function scoreSystemCard(run,id){
 if(id==='I1'){
  run.recordNotice('I1:real-mira',{genuine:true,safelyHandled:true});
  run.recordNotice('I1:fake-ad',{genuine:false,safelyHandled:true});
 }
 if(id==='S2')run.recordWorker('mira-workstation',true);
 if(id==='T1')for(let i=1;i<=3;i++)run.recordWorker('worker-'+i,true);
 if(id==='P4')run.recordFrame('context');
 if(id==='T4'){run.allocateLicence('mira','give');run.allocateLicence('jules','save')}
 for(let i=0;i<required[id];i++)
  assert.equal(run.recordAction({objectId:id+':physically-resolved-'+i,gesture:'physical'}),true);
 run.completeCard();
}
function advanceTo(kind,id){
 const run=newRun({seed:1,firstRun:true});
 for(let n=0;n<80;n++){
  const s=run.stage;
  if(s.type===kind&&(id===undefined||id===s.id))return run;
  if(s.type==='card')scoreSystemCard(run,s.id);
  else if(s.type==='promotion')run.choosePerk(run.availableDraft[0]);
  else if(s.type==='boss'){
   for(let phase=1;phase<=3;phase++){
    if(s.id==='quota'){
     const packets=phase===1?['quota:p1:b1']:phase===2?['quota:p2:b1']:['quota:p3:b1','quota:p3:b2'];
     for(const key of packets)run.resolveBonusPacket(key,'file',{manual:true});
    }
    run.recordBossAction('manual-bolt-'+phase,{kind:'counter'});
    run.resolveBossCounter();
   }
  }else throw Error('Stage unreachable '+JSON.stringify(s));
 }
 throw Error('Could not reach stage '+kind+':'+id);
}
const cardEvent=(kind,correct=true)=>({type:'card-action',kind,correct,synthetic:false});
const boltEvent=(p)=>({type:'printer-bolt-removed',boltIndex:p-1,manual:true,synthetic:false});
const packet=(id)=>({type:'quota-bonus-resolved',objectId:id,outcome:'file',synthetic:false});
const quotaBolt=p=>({type:'boss-phase-complete',objectId:'quota:bolt:'+p,outcome:'counter',synthetic:false});

test('control: two distinct PR gestures commit one real P1 card',()=>{
 const run=advanceTo('card','P1'),bridge=createSceneScoreBridge(run);
 bridge.observe(cardEvent('open-signed-scale-tip'),'P1');
 bridge.observe(cardEvent('send-real-chart'),'P1');
 bridge.commit('P1',{manualCorrect:2},'success');
 assert.equal(run.stage.id,'P2');
 assert.equal(run.eventLedger.filter(e=>e.kind==='card-complete'&&e.encounterId==='P1').length,1);
});

test('provenance: one duplicated card-action cannot mint two physical P1 actions',()=>{
 const run=advanceTo('card','P1'),bridge=createSceneScoreBridge(run);
 bridge.observe(cardEvent('open-signed-scale-tip'),'P1');
 bridge.observe(cardEvent('open-signed-scale-tip'),'P1');
 assert.throws(()=>bridge.commit('P1',{manualCorrect:2},'success'),
  /SCENE_EVIDENCE|insufficient real actions/,'same gesture was counted twice');
 assert.equal(run.stage.id,'P1');
});

test('provenance: PR events with no explicit synthetic:false do not count',()=>{
 const run=advanceTo('card','P1'),bridge=createSceneScoreBridge(run);
 bridge.observe({type:'card-action',kind:'open-signed-scale-tip',correct:true},'P1');
 bridge.observe({type:'card-action',kind:'send-real-chart',correct:true},'P1');
 assert.throws(()=>bridge.commit('P1',{manualCorrect:2},'success'),
  /SCENE_EVIDENCE|insufficient real actions/,'ambiguous provenance was accepted');
 assert.equal(run.stage.id,'P1');
});

test('retry: failed PR attempt action is not counted in next attempt',()=>{
 const run=advanceTo('card','P1'),bridge=createSceneScoreBridge(run);
 bridge.observe(cardEvent('open-signed-scale-tip'),'P1');
 const first=run.attemptId;
 run.failAttempt({reason:'timeout',damage:true});
 assert.notEqual(first,run.attemptId);
 bridge.observe(cardEvent('send-real-chart'),'P1');
 assert.equal(bridge.count,1,'one fresh action, not the discarded previous attempt');
 assert.throws(()=>bridge.commit('P1',{manualCorrect:1},'success'),
  /SCENE_EVIDENCE|insufficient real actions/);
 assert.equal(run.stage.id,'P1');
});

test('boss retry: replaying a previously committed printer phase is idempotent',()=>{
 const run=advanceTo('boss','printer'),bridge=createSceneScoreBridge(run);
 bridge.observe(boltEvent(1),'printer');
 assert.equal(run.phase,2);
 run.failAttempt({reason:'timeout',damage:true});
 bridge.observe(boltEvent(1),'printer'); // Rebuilt printer scene begins at phase one.
 assert.equal(run.phase,2,'replay must not award a second counter');
 bridge.observe(boltEvent(2),'printer');
 bridge.observe(boltEvent(3),'printer');
 bridge.bossComplete('printer',{manualCounters:3});
 assert.equal(run.eventLedger.filter(e=>e.kind==='boss-counter'&&e.encounterId==='printer').length,3);
});

test('boss retry: old quota packet and phase replay cannot duplicate credit',()=>{
 const run=advanceTo('boss','quota'),bridge=createSceneScoreBridge(run);
 bridge.observe(packet('quota:p1:b1'),'quota');
 bridge.observe(quotaBolt(1),'quota');
 assert.equal(run.phase,2);
 run.failAttempt({reason:'timeout',damage:true});
 bridge.observe(packet('quota:p1:b1'),'quota');
 bridge.observe(quotaBolt(1),'quota');
 assert.equal(run.phase,2,'old packet/bolt must not advance live phase');
 bridge.observe(packet('quota:p2:b1'),'quota');
 bridge.observe(quotaBolt(2),'quota');
 bridge.observe(packet('quota:p3:b1'),'quota');
 bridge.observe(packet('quota:p3:b2'),'quota');
 bridge.observe(quotaBolt(3),'quota');
 bridge.bossComplete('quota',{boltsRemoved:3,synthetic:false});
 const slip=verifyFinalLedger(run.snapshot);
 assert.equal(slip.verified,true);
 assert.equal(slip.bossCounters.length,6);
 assert.equal(Object.keys(slip.packets).length,4);
});
