import test from 'node:test';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {existsSync} from 'node:fs';
import {verifyFinalLedger,BONUS_IDS} from '../night-shift-v3/finalization/scoring/ledger.js';

const candidates=[
 process.env.NIGHTSHIFT_SYSTEMS_ROOT&&resolve(process.env.NIGHTSHIFT_SYSTEMS_ROOT,'engine.js'),
 resolve(import.meta.dirname,'../night-shift-v3/systems/engine.js')
].filter(Boolean);
const enginePath=candidates.find(p=>existsSync(p));
assert.ok(enginePath,'Set NIGHTSHIFT_SYSTEMS_ROOT to actual assembled systems directory; no fixture engine allowed');
const {newRun,readScores}=await import(pathToFileURL(enginePath).href);
const required={I1:5,I2:2,I3:3,I4:3,S1:3,S2:2,S3:1,S4:1,P1:2,P2:2,P3:1,P4:1,T1:2,T2:1,T3:1,T4:2};
function finish({seed=1,firstRun=false,choices=['file','cool','file','cool'],licences=['give','save'],addWrong=false,mode='standard'}={}){
 const run=newRun({seed,firstRun,mode});
 let cardCount=0,promotions=0,bosses=0;
 for(let step=0;step<64;step++){
  const stage=run.stage;
  if(stage.type==='card'){
   cardCount++;
   for(let i=0;i<10;i++)run.tickActive(100);
   if(stage.id==='I1'){
    run.recordNotice('real-notice',{genuine:true,safelyHandled:true});
    run.recordNotice('fake-notice',{genuine:false,safelyHandled:true});
   }
   if(stage.id==='S2')run.recordWorker('mira-workstation',true);
   if(stage.id==='T1')for(let i=1;i<=3;i++)run.recordWorker('worker-'+i,i<3);
   if(stage.id==='P4')run.recordFrame('context');
   if(stage.id==='T4'){
    assert.equal(run.allocateLicence('mira',licences[0]),true);
    assert.equal(run.allocateLicence('jules',licences[1]),true);
   }
   if(addWrong&&stage.id==='I1')run.recordAction({objectId:'mistake',outcome:'wrong'});
   for(let i=0;i<required[stage.id];i++)assert.equal(run.recordAction({objectId:stage.id+':target:'+i}),true);
   run.completeCard();
  }else if(stage.type==='promotion'){
   promotions++;run.choosePerk(run.availableDraft[0]);
  }else if(stage.type==='boss'){
   bosses++;
   for(let phase=1;phase<=3;phase++){
    if(stage.id==='quota'){
     const subset=BONUS_IDS.filter(id=>id.startsWith('quota:p'+phase+':'));
     for(const id of subset){
      const choice=choices[BONUS_IDS.indexOf(id)];
      assert.equal(run.resolveBonusPacket(id,choice),true);
     }
    }
    assert.equal(run.recordBossAction('counter-'+phase,{kind:'counter'}),true);
    run.resolveBossCounter();
   }
  }else if(stage.type==='victory')break;
  else throw Error('Unexpected stage '+JSON.stringify(stage));
 }
 assert.equal(run.status,'victory');
 assert.equal(cardCount,12);
 assert.equal(promotions,5);
 assert.equal(bosses,2);
 return run.snapshot;
}
test('actual SYSTEMS run: twelve cards, five promotions, six physical counters, four bonus packets',()=>{
 const snap=finish({firstRun:true});
 const slip=verifyFinalLedger(snap);
 assert.equal(slip.verified,true);
 assert.equal(slip.cardIds.length,12);
 assert.equal(slip.promotions,5);
 assert.equal(slip.bossCounters.length,6);
 assert.equal(slip.licence.givenDollars+slip.licence.savedDollars,80);
 assert.equal(Object.keys(slip.packets).length,4);
 assert.equal(slip.officialScore,readScores(snap.eventLedger).officialScore);
 assert.equal(slip.peopleScore,readScores(snap.eventLedger).peopleScore);
 assert.ok(Object.isFrozen(slip)&&Object.isFrozen(slip.official));
 assert.equal(verifyFinalLedger(snap).officialScore,slip.officialScore);
});
test('every authored variant appears across 256 genuine SYSTEMS seeded full runs',()=>{
 const cards=new Set();
 for(let seed=1;seed<=256;seed++){
  const snap=finish({seed});
  const slip=verifyFinalLedger(snap);
  slip.cardIds.forEach(c=>cards.add(c));
 }
 assert.equal(cards.size,16);
});
test('all sixteen bonus FILE/COOL masks are bounded and truthful',()=>{
 for(let mask=0;mask<16;mask++){
  const choices=BONUS_IDS.map((_,i)=>mask&(1<<i)?'file':'cool');
  const snap=finish({choices});
  const slip=verifyFinalLedger(snap);
  const filed=choices.filter(x=>x==='file').length;
  assert.equal(slip.official.bossFileBonus,5*filed);
  assert.equal(slip.licence.totalDollars,80);
 }
});
test('both licences: GIVE/SAVE permutations conserve exactly $80',()=>{
 for(const a of ['give','save'])for(const b of ['give','save']){
  const slip=verifyFinalLedger(finish({licences:[a,b]}));
  assert.equal(slip.licence.savedDollars+slip.licence.givenDollars,80);
  assert.equal(slip.licence.choices.mira,a);
  assert.equal(slip.licence.choices.jules,b);
 }
});
test('manual mistakes change score; discarded retries and synthetic assistance cannot earn clean action credit',()=>{
 const clean=verifyFinalLedger(finish());
 const dirty=verifyFinalLedger(finish({addWrong:true}));
 assert.ok(dirty.people.carefulActions<clean.people.carefulActions,'verified wrong action must lower the unrounded accuracy component');
 assert.ok(dirty.longestCleanActionStreak<=clean.longestCleanActionStreak);
});
test('mutations: duplicate event, false receipts, ghost counter, missing packet, forged licence and missing card all fail closed',()=>{
 const cases=[
  s=>s.eventLedger.push({...s.eventLedger[0]}),
  s=>s.endingSnapshot.officialScore=100-s.endingSnapshot.officialScore,
  s=>{const e=s.eventLedger.find(e=>e.kind==='action'&&e.gesture==='counter');e.synthetic=true},
  s=>s.eventLedger.splice(s.eventLedger.findIndex(e=>e.kind==='quota-packet'),1),
  s=>{const e=s.eventLedger.find(e=>e.kind==='licence');e.dollars=100},
  s=>s.eventLedger.splice(s.eventLedger.findIndex(e=>e.kind==='card-complete'),1),
  s=>s.status='card',
  s=>s.eventLedger.push({...s.eventLedger[0],id:'foreign-run',runId:'other'})
 ];
 for(const mutate of cases){
  const snap=finish();mutate(snap);
  assert.throws(()=>verifyFinalLedger(snap),/SCORE_LEDGER:/);
 }
});
test('uncommitted ghost and attempt records never produce a score credit',()=>{
 const s=finish();
 const before=verifyFinalLedger(s);
 s.eventLedger.push({id:'uncommitted-test',runId:s.runId,kind:'action',outcome:'correct',committed:false,synthetic:false});
 const after=verifyFinalLedger(s);
 assert.equal(after.officialScore,before.officialScore);
 assert.equal(after.peopleScore,before.peopleScore);
});