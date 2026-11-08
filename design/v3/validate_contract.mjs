#!/usr/bin/env node
// Validate the core Night Shift v3 game topology and score invariants against
// the source GDD. This is design-model QA, NOT a playable game test.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const here = new URL('./', import.meta.url);
const contract = JSON.parse(readFileSync(new URL('contract.json', here), 'utf8'));
const gdd = readFileSync(new URL('../NIGHT_SHIFT_GDD_V3.md', here), 'utf8');
const ids=['I1','I2','I3','I4','S1','S2','S3','S4','P1','P2','P3','P4','T1','T2','T3','T4'];
assert.deepEqual(contract.card_pool.map(c=>c.id),ids,'exact 16-card pool');
assert.equal(new Set(ids).size,16);
for(const c of contract.card_pool){
  assert.match(gdd,new RegExp('\\|\\s*\\*\\*'+c.id+'\\*\\*\\s*\\|'),'GDD missing '+c.id);
  assert(c.imperative&&c.authoredReferenceMs>=1000,'card data invalid '+c.id);
}
assert.equal(contract.scenesPerRun,12);
assert.equal(contract.cardsPerDepartment,3);
for(const d of contract.departments){
  const pool=contract.card_pool.filter(c=>c.department===d);
  assert.equal(pool.length,4,d+' pool length');
  assert.equal(contract.curatedFirstRun.filter(id=>pool.some(c=>c.id===id)).length,3,d+' curated count');
  for(const id of contract.guaranteed[d])assert(contract.curatedFirstRun.includes(id),d+' guarantee '+id);
}
assert.equal(new Set(contract.curatedFirstRun).size,12);
assert.equal(contract.curatedFirstRun[0],'I1');
assert.deepEqual(contract.curatedFirstRun.slice(3,5),['S1','S2']);
assert(contract.curatedFirstRun.indexOf('P1')<contract.curatedFirstRun.indexOf('P4'));
assert(contract.curatedFirstRun.indexOf('T1')<contract.curatedFirstRun.indexOf('T4'));
assert.equal(contract.perkIds.length,8);
assert.equal(new Set(contract.perkIds).size,8);
assert.equal(contract.promotionPicks,5);
assert.equal(contract.perkMaxLevel,2);
assert.equal(contract.synergies.length,8);
for(const pair of contract.synergies)assert(pair.length===2&&pair.every(p=>contract.perkIds.includes(p)),'bad synergy pair');
assert.equal(contract.directives.length,5);
assert.equal(contract.bosses.printer.requiredCounters,3);
assert.equal(contract.bosses.quota.requiredCounters,3);
assert.equal(contract.bosses.quota.bonusPacketIds.length,4);
assert.equal(new Set(contract.bosses.quota.bonusPacketIds).size,4);
assert.equal(contract.bosses.quota.fileBonusPoints,5);
assert.equal(contract.licences.tokens*contract.licences.dollarsPerToken,80);
assert.equal(Object.values(contract.corporateScoreWeights).reduce((a,b)=>a+b,0),100);
assert.equal(Object.values(contract.peopleScoreWeights).reduce((a,b)=>a+b,0),100);
console.log('NIGHT_SHIFT_V3_CORE_CONTRACT_PASS 16 cards / 12 per run / 5 promotions / 8 perks / 2 bosses / 4 packet choices / both score lenses 100');
