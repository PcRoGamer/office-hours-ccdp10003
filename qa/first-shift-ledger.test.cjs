'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../first-shift/ledger.js');

function fullRun(mask = 0, targets = ['save', 'save']) {
  const run = L.createRun('run-1', 1234);
  for (const id of Object.keys(L.CARDS)) L.commitCard(run, id, { elapsedMs: 0, actions: ['correct'] });
  L.commitLicences(run, targets);
  L.PACKETS.forEach((id, i) => L.resolvePacket(run, id, mask & (1 << i) ? 'file' : 'cool'));
  [1, 2, 3].forEach(phase => L.recordBolt(run, phase));
  return run;
}

test('all sixteen distinct packet masks give their own FILE points, bounded pressure and cooling', () => {
  for (let mask = 0; mask < 16; mask++) {
    const run = fullRun(mask);
    const score = L.calculate(run);
    const files = mask.toString(2).replace(/0/g, '').length;
    assert.equal(score.filedPackets, files);
    assert.equal(score.corporate, 80 + files * 5);
    assert.equal(score.pressure, Math.min(2, files));
    assert.equal(score.coolOpeningExtensionMs, (4 - files) * 750);
    assert.equal(L.resolvePacket(run, L.PACKETS[0], 'file'), false);
    assert.equal(L.calculate(run).corporate, score.corporate);
  }
});

test('each licence disposition conserves the original $80 and correctly affects both lenses', () => {
  for (const [targets, saved, assigned] of [[['save','save'],80,0], [['mira','save'],40,1], [['jules','mira'],0,2], [['jules','jules'],0,2]]) {
    const run = fullRun(0, targets), s = L.calculate(run);
    assert.equal(s.savedDollars, saved);
    assert.equal(s.licenceTokensAssigned, assigned);
    assert.equal(saved + 40 * assigned, 80);
    assert.equal(s.corporateParts.savings, saved / 8);
    assert.equal(s.peopleParts.access, 15 * assigned);
    assert.equal(L.commitLicences(run, ['save','save']), false);
  }
  assert.throws(() => L.commitLicences(L.createRun('x', 1), ['mira']), /each/);
  assert.throws(() => L.commitLicences(L.createRun('x', 1), ['mira', 'clone']), /each/);
});

test('card commits are idempotent and manual streak continues only across committed actions', () => {
  const r = L.createRun('r', 2);
  assert.equal(L.commitCard(r, 'I1', {elapsedMs:9000, actions:['correct','correct','wrong','correct']}), true);
  assert.equal(L.commitCard(r, 'I1', {elapsedMs:0, actions:Array(100).fill('correct')}), false);
  L.commitCard(r, 'I3', {elapsedMs:18000, actions:['correct','correct']});
  const s = L.calculate(r);
  assert.equal(s.completedCards, 2);
  assert.equal(s.correctManual, 5);
  assert.equal(s.wrongManual, 1);
  assert.equal(s.longestCleanManualStreak, 3);
  assert.equal(s.corporateParts.pace, 3.75); // mean of .5 and clamped 0
  assert.equal(s.peopleParts.accuracy, 20 * 5 / 6);
});

test('unique support and notice IDs prevent double credits; no notices earns zero', () => {
  const r = L.createRun('r', 3);
  L.commitCard(r, 'I1', {elapsedMs:1, support:['mira-coffee'], notices:[{id:'notice-a',handled:true}]});
  L.commitCard(r, 'I3', {elapsedMs:1, support:['mira-coffee','worker-1'], notices:[{id:'notice-a',handled:true},{id:'notice-b',handled:false}]});
  const s = L.calculate(r);
  assert.equal(s.workersHelped, 2);
  assert.equal(s.encounteredRealNotices, 2);
  assert.equal(s.safelyHandledRealNotices, 1);
  assert.equal(s.peopleParts.notices, 7.5);
  assert.equal(L.calculate(L.createRun('none', 4)).peopleParts.notices, 0);
});

test('receipt freezes a detached copy of one complete ledger; incomplete and late mutations fail', () => {
  const r = fullRun(15, ['mira','jules']);
  assert.throws(() => L.finishRun(L.createRun('partial', 1)), /incomplete/);
  const receipt = L.finishRun(r);
  assert.equal(receipt.scores.corporate, 90);
  assert.equal(receipt.scores.people, 50);
  assert(Object.isFrozen(receipt.ledger.cards.I1.actions));
  assert.throws(() => L.resolvePacket(r, 'qpacket-1', 'cool'), /not writable/);
  r.cards.I1.actions.push('wrong');
  assert.equal(receipt.ledger.cards.I1.actions.length, 1);
  assert.equal(receipt.scores.wrongManual, 0);
});

test('perfect people score uses actual supported workers, assigned tools and handled real notice', () => {
  const r = L.createRun('perfect', 123);
  for (const id of Object.keys(L.CARDS)) L.commitCard(r, id, {
    elapsedMs:0,
    actions:['correct'],
    support:id === 'T1' ? L.SUPPORT.slice() : [],
    notices:id === 'I3' ? [{id:'signed-mira', handled:true}] : []
  });
  L.commitLicences(r, ['mira','jules']);
  L.PACKETS.forEach(id => L.resolvePacket(r, id, 'file'));
  [1, 2, 3].forEach(phase => L.recordBolt(r, phase));
  const {scores} = L.finishRun(r);
  assert.equal(scores.corporate, 90);
  assert.equal(scores.people, 100);
});

test('invalid identifiers and duplicate perk levels cannot create new resources', () => {
  const r = L.createRun('r', 10);
  assert.throws(() => L.commitCard(r, 'counterfeit', {elapsedMs:0}), /Unknown card/);
  assert.throws(() => L.resolvePacket(r, 'qpacket-5', 'file'), /Unknown/);
  assert.throws(() => L.resolvePacket(r, 'qpacket-1', 'copy'), /decision/);
  assert.equal(L.recordBolt(r, 1), true);
  assert.equal(L.recordBolt(r, 1), false);
  assert.throws(() => L.recordBolt(r, 4), /Unknown/);
  assert.equal(L.choosePerk(r, 'carbon-copy'), true);
  assert.equal(L.choosePerk(r, 'carbon-copy'), true);
  assert.equal(L.choosePerk(r, 'carbon-copy'), false);
  assert.equal(L.recordDirective(r, 'fast-or-safe'), true);
  assert.equal(L.recordDirective(r, 'fast-or-safe'), false);
});
