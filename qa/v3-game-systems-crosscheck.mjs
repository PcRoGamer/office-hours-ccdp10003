#!/usr/bin/env node
/**
 * Independent cross-branch SYSTEMS model QA (not gameplay or browser acceptance).
 * Give --systems-root to point at a separate checked-out SYSTEMS agent worktree.
 * All mutations use the production module's public API; no private state patches.
 */
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {auditProductionSnapshot} from './v3-game-ledger-audit.mjs';
import {auditSeedGenerator} from './v3-game-invariants.mjs';

const args=process.argv.slice(2);
const option=(name,fallback)=>{const i=args.indexOf(name);return i>=0?args[i+1]:fallback};
const root=resolve(option('--systems-root','.'));
const get=path=>join(root,'night-shift-v3','systems',path);
const corePath=get('core.js'),enginePath=get('engine.js');
const contract=JSON.parse(readFileSync(new URL('../design/v3/contract.json',import.meta.url),'utf8'));
if(!existsSync(corePath)||!existsSync(enginePath)){
  console.error('PRODUCTION_SYSTEMS_NOT_PRESENT: provide --systems-root <checkout-with-night-shift-v3/systems> or merge SYSTEMS PR. No fixture substituted.');
  process.exit(2);
}
const core=await import(pathToFileURL(corePath).href);
const engine=await import(pathToFileURL(enginePath).href);
assert.equal(typeof core.createDeck,'function','production createDeck export required');
assert.equal(typeof core.assignDirectives,'function','production assignDirectives export required');
assert.equal(typeof engine.newRun,'function','production newRun export required');

const report={generatorSeeds:0,fullModelRuns:0,packetMasks:0,independentAuditFailures:[],deterministicFailures:[],coveredCards:new Set(),differentChoices:0};
const gen=auditSeedGenerator(core.createDeck,contract,1000);
assert(gen.pass,'Production generator failed canonical 1,000-seed deck QA: '+JSON.stringify(gen.failures));
for(let seed=0;seed<1000;seed++){
  const first=core.assignDirectives(seed,core.createDeck(seed));
  const second=core.assignDirectives(seed,core.createDeck(seed));
  assert.deepEqual(first,second,'Directive schedule is not deterministic for seed '+seed);
  assert(core.validateSchedule(first,core.createDeck(seed)),'Directive compatibility failed at seed '+seed);
}
report.generatorSeeds=1000;

const required={I1:5,I2:2,I3:3,I4:3,S1:3,S2:2,S3:1,S4:1,P1:2,P2:2,P3:1,P4:1,T1:2,T2:1,T3:1,T4:2};
function finish(seed,{packetMask=15,licenceChoice=['give','give'],workersSaved=3,framing='context',strategy=0}={}){
 const run=engine.newRun({seed,firstRun:seed===0});
 let guard=0;
 while(!run.endingSnapshot&&guard++<30){
  const s=run.stage;
  if(s.type==='card'){
   for(let i=0;i<required[s.id];i++)assert(run.recordAction({objectId:s.id+':object:'+i,gesture:'tap'}));
   if(s.id==='I1'){
     assert(run.recordNotice('genuine-mira',{genuine:true,safelyHandled:true}));
     assert(run.recordNotice('counterfeit-offer',{genuine:false,safelyHandled:true}));
   }
   if(s.id==='S2')assert(run.recordWorker('mira-workstation',true));
   if(s.id==='T1')for(let n=1;n<=3;n++)assert(run.recordWorker('worker-'+n,n<=workersSaved));
   if(s.id==='T4'){
     assert(run.allocateLicence('mira',licenceChoice[0]));
     assert(run.allocateLicence('jules',licenceChoice[1]));
   }
   if(s.id==='P4')assert(run.recordFrame(framing));
   for(let tick=0;tick<8;tick++)run.tickActive(100);
   run.completeCard();report.coveredCards.add(s.id);
  }else if(s.type==='promotion'){
   const offers=run.availableDraft;
   assert.equal(offers.length,3);
   // Different legal physical-build paths; no illegal level-three pick.
   run.choosePerk(offers[strategy%offers.length]);
  }else if(s.type==='boss'){
   if(s.id==='quota'){
    for(const id of core.BONUS_PACKETS.filter(id=>id.startsWith('quota:p'+run.phase+':'))){
     const index=core.BONUS_PACKETS.indexOf(id);
     assert(run.resolveBonusPacket(id,(packetMask>>index)&1?'file':'cool'));
     assert.equal(run.resolveBonusPacket(id,'file'),false,'Bonus packet double-awarded');
    }
   }
   assert(run.recordBossAction('manual-counter',{kind:'counter'}));
   run.resolveBossCounter();
  }else throw Error('unknown production stage '+JSON.stringify(s));
 }
 assert(guard<30,'production stage progression stalled');
 return run.snapshot;
}
for(let seed=0;seed<1000;seed++){
 const scenario=seed%3,licenceChoice=scenario===0?['give','give']:scenario===1?['give','save']:['save','save'];
 const run=finish(seed,{packetMask:seed%16,licenceChoice,workersSaved:seed%2+2,strategy:seed%3,framing:seed%2?'context':'headline'});
 const audit=auditProductionSnapshot(run,contract,{requireVictory:true});
 if(!audit.ok)report.independentAuditFailures.push({seed,issues:audit.problems});
 const rerun=finish(seed,{packetMask:seed%16,licenceChoice,workersSaved:seed%2+2,strategy:seed%3,framing:seed%2?'context':'headline'});
 if(JSON.stringify(run)!==JSON.stringify(rerun))report.deterministicFailures.push(seed);
 report.fullModelRuns++;
}
assert.deepEqual(report.independentAuditFailures,[],'Independent ledger auditor detects production defects');
assert.deepEqual(report.deterministicFailures,[],'Same input history diverged across production replays');
assert.equal(report.coveredCards.size,16,'Some authored cards never appear over 1,000 seeds');
for(let mask=0;mask<16;mask++){
 const snap=finish(100000+mask,{packetMask:mask});
 const actual=snap.endingSnapshot.packetsFiled;
 assert.equal(actual,mask.toString(2).replace(/0/g,'').length,'Incorrect FILE count');
 const score=auditProductionSnapshot(snap,contract,{requireVictory:true});
 assert(score.ok,'Packet mask '+mask+': '+JSON.stringify(score.problems));
 report.packetMasks++;
}
console.log('PRODUCTION_SYSTEMS_MODEL_CROSSCHECK_PASS',JSON.stringify({
 generatorSeeds:report.generatorSeeds,fullModelRuns:report.fullModelRuns,packetMasks:report.packetMasks,
 coveredCards:[...report.coveredCards].sort(),note:'MODEL-ONLY: no real physical pointer, animation, sound or production browser E2E'
}));
