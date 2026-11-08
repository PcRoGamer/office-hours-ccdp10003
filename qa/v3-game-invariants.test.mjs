#!/usr/bin/env node
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditDeck,auditRun,auditSeedGenerator,calculateScores,EXPECTED} from './v3-game-invariants.mjs';
const contract=JSON.parse(readFileSync(new URL('../design/v3/contract.json',import.meta.url)));
const curated=contract.curatedFirstRun;
function choice(seed,a){let x=Math.imul((seed+1)>>>0,0x9e3779b1)>>>0;x=(x^(x>>>16))>>>0;x=Math.imul(x,0x85ebca6b)>>>0;x=(x^(x>>>13))>>>0;return a[x%a.length];}
function makeDeck(seed){
  if(seed===0)return [...curated];
  const intake=choice(seed,['I2','I3','I4']);
  const other=['I2','I3','I4'].filter(x=>x!==intake);
  const extra=choice(seed+1,other);
  const services=choice(seed+2,['S3','S4']);
  const pr=choice(seed+3,['P2','P3']);
  const staff=choice(seed+4,['T2','T3']);
  return ['I1',intake,extra,'S1','S2',services,'P1',pr,'P4','T1',staff,'T4'];
}
const makeRun=()=>({schemaVersion:3,seed:0,status:'card',cardDeck:[...curated],completedCardIds:[],
  directiveSchedule:[...contract.directives],draftHistory:[],pickedPerks:[],perkLevels:{},
  printerBoltsRemoved:0,quotaBoltsRemoved:0,quotaPressure:0,licenceTokensGiven:0,savedLicenceDollars:0,
  workersEncountered:0,workersHelped:0,correctResolvedActions:0,wrongResolvedActions:0,
  notificationsEncountered:0,safeNotificationsHandled:0,committedActiveMs:{},quotaBonusPacketOutcomes:{},
  cleanStreakMax:0,eventLedger:[],endingSnapshot:null});
const detects=(r,code)=>assert(auditRun(r,contract).some(x=>x.code===code),`Did not detect ${code}`);
test('canonical 16 IDs, 12-deck topology and actual contract are consistent',()=>{
  assert.deepEqual(contract.card_pool.map(x=>x.id),EXPECTED.cards);
  assert.deepEqual(auditDeck(curated,contract),[]);
  assert.equal(contract.promotionPicks,5);assert.equal(contract.perkIds.length,8);assert.equal(contract.synergies.length,8);
  assert.equal(contract.bosses.printer.requiredCounters,3);
  assert.equal(contract.bosses.quota.requiredCounters,3);
});
test('1,000 FIXTURE seeds validate QA harness, NOT the unfinished production generator',()=>{
  const r=auditSeedGenerator(makeDeck,contract,1000);assert.equal(r.pass,true,JSON.stringify(r));
  assert.equal(r.coverage.length,16);assert.equal(r.totalFailedSeeds,0);
});
test('deck audit detects missing guarantees, duplicate cards and wrong department order',()=>{
  const bad=[...curated];bad[0]='I2';assert(auditDeck(bad,contract).some(x=>x.code==='first-card'));
  bad[1]='I2';assert(auditDeck(bad,contract).some(x=>x.code==='deck-duplicates'));
  const wrong=[...curated];[wrong[3],wrong[9]]=[wrong[9],wrong[3]];assert(auditDeck(wrong,contract).some(x=>x.code==='department-order'));
});
test('an honest incomplete run does not invent points or outcomes',()=>{
  const r=makeRun();assert.deepEqual(auditRun(r,contract),[]);assert.deepEqual(calculateScores(r,contract).corporate,0);
  assert.deepEqual(calculateScores(r,contract).people,0);
});
test('ledger double awards and synthetic player credits are caught',()=>{
  const r=makeRun();r.completedCardIds=['I1','I1'];detects(r,'duplicate-completion');
  r.completedCardIds=[];r.eventLedger=[{id:'a',kind:'card-complete',encounterId:'I1',committed:true},{id:'b',kind:'card-complete',encounterId:'I1',committed:true}];detects(r,'ledger-completion');
  r.eventLedger=[{id:'a',kind:'quota-bonus',objectId:'quota:p1:b1',committed:true},{id:'b',kind:'quota-bonus',objectId:'quota:p1:b1',committed:true}];detects(r,'ledger-packet');
  r.eventLedger=[{id:'a',kind:'manual-action',synthetic:true,committed:true}];detects(r,'synthetic-credit');
});
test('two physical $40 licence tokens conserve money across all 3 legal outcomes',()=>{
  for(const [given,saved] of [[0,80],[1,40],[2,0]]){const r=makeRun();r.completedCardIds=['T4'];r.licenceTokensGiven=given;r.savedLicenceDollars=saved;assert(!auditRun(r,contract).some(x=>x.code==='licence-conservation'));}
  const r=makeRun();r.completedCardIds=['T4'];r.licenceTokensGiven=2;r.savedLicenceDollars=80;detects(r,'licence-conservation');
});
test('all 16 FILE/COOL bonus decisions award exactly +5 each FILE',()=>{
  for(let bits=0;bits<16;bits++){
    const r=makeRun();r.completedCardIds=[...curated];r.savedLicenceDollars=80;
    for(let i=0;i<4;i++)r.quotaBonusPacketOutcomes[EXPECTED.packets[i]]=bits&(1<<i)?'file':'cool';
    const expected=40+10+5*Object.values(r.quotaBonusPacketOutcomes).filter(x=>x==='file').length;
    assert.equal(calculateScores(r,contract).corporate,expected,`packet mask ${bits}`);
  }
});
test('receipts recompute both lenses from one immutable snapshot',()=>{
  const r=makeRun();r.completedCardIds=[...curated];r.committedActiveMs=Object.fromEntries(curated.map(id=>[id,0]));
  r.cleanStreakMax=8;r.savedLicenceDollars=80;r.licenceTokensGiven=0;
  r.workersEncountered=4;r.workersHelped=4;r.correctResolvedActions=10;r.notificationsEncountered=2;r.safeNotificationsHandled=2;
  r.printerBoltsRemoved=3;r.quotaBoltsRemoved=3;r.status='victory';
  r.quotaBonusPacketOutcomes=Object.fromEntries(EXPECTED.packets.map(x=>[x,'file']));r.quotaPressure=2;
  const scores=calculateScores(r,contract);assert.deepEqual([scores.corporate,scores.people],[100,70]);
  r.endingSnapshot={corporate:100,people:70};assert.deepEqual(auditRun(r,contract),[]);
  const frozen=JSON.stringify(r);calculateScores(r,contract);auditRun(r,contract);assert.equal(JSON.stringify(r),frozen);
  r.endingSnapshot.people=100;detects(r,'score-mismatch');
});
test('neither boss can be bypassed, and chart factual values cannot be changed',()=>{
  const r=makeRun();r.completedCardIds=[...curated];r.status='victory';detects(r,'boss-bypass');
  r.status='card';r.chartFacts={before:1240,after:1300};detects(r,'falsified-chart');
});
console.log('NOTE: Production gameplay is NOT PRESENT on the integration branch; seeded run test above exercises an explicitly labelled fixture only.');
