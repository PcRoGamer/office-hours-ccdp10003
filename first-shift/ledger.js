/* The receipt is a pair of views of the same committed shift, never a score bank. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') root.FirstShiftLedger = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const CARDS = Object.freeze({ I1: 18000, I3: 12000, S1: 14000, S2: 14000, P1: 14000, P4: 14000, T1: 14000, T4: 14000 });
  const PACKETS = Object.freeze(['qpacket-1', 'qpacket-2', 'qpacket-3', 'qpacket-4']);
  const SUPPORT = Object.freeze(['mira-coffee', 'worker-1', 'worker-2', 'worker-3']);
  const PERKS = Object.freeze(['carbon-copy', 'chain-stamp', 'bank-shot', 'magnet-grip', 'mira-backup', 'safety-net']);
  const clamp01 = n => Math.max(0, Math.min(1, n));
  const frozenCopy = value => {
    if (value && typeof value === 'object') {
      for (const child of Object.values(value)) frozenCopy(child);
      Object.freeze(value);
    }
    return value;
  };
  const copy = value => JSON.parse(JSON.stringify(value));
  const writable = run => {
    if (!run || run.version !== 1 || run.finished) throw new Error('Run is not writable');
  };
  const count = (n, label) => {
    if (!Number.isInteger(n) || n < 0) throw new TypeError(label + ' must be a non-negative integer');
    return n;
  };

  function createRun(runId, seed) {
    if (typeof runId !== 'string' || !runId.trim()) throw new TypeError('A unique runId is required');
    if (!Number.isSafeInteger(seed)) throw new TypeError('An integer seed is required');
    return { version: 1, runId, seed, cards: {}, packets: {}, bolts: [], licences: null, perks: [], directives: [], finished: false };
  }

  // Called only after an encounter completes. Transient attempt data is not scored.
  // actions are ordered manual actions, represented as 'correct' and 'wrong'.
  function commitCard(run, id, result) {
    writable(run);
    if (!Object.hasOwn(CARDS, id)) throw new RangeError('Unknown card: ' + id);
    if (Object.hasOwn(run.cards, id)) return false;
    result = result || {};
    if (!Number.isFinite(result.elapsedMs) || result.elapsedMs < 0) throw new TypeError('elapsedMs must be non-negative');
    const actions = result.actions || [];
    if (!Array.isArray(actions) || actions.some(a => a !== 'correct' && a !== 'wrong')) throw new TypeError('Invalid manual actions');
    const support = result.support || [];
    if (!Array.isArray(support) || support.some(s => !SUPPORT.includes(s)) || new Set(support).size !== support.length) throw new TypeError('Invalid support IDs');
    // Notice IDs are stable unique identifiers. A handled ID must be encountered.
    const notices = result.notices || [];
    if (!Array.isArray(notices) || notices.some(n => !n || typeof n.id !== 'string' || !n.id || typeof n.handled !== 'boolean') || new Set(notices.map(n => n.id)).size !== notices.length) throw new TypeError('Invalid real notices');
    const scamsDismissed = count(result.scamsDismissed || 0, 'scamsDismissed');
    run.cards[id] = { elapsedMs: result.elapsedMs, actions: actions.slice(), support: support.slice(), notices: notices.map(n => ({ id: n.id, handled: n.handled })), scamsDismissed };
    return true;
  }

  function resolvePacket(run, id, decision) {
    writable(run);
    if (!PACKETS.includes(id)) throw new RangeError('Unknown boss packet: ' + id);
    if (decision !== 'file' && decision !== 'cool') throw new TypeError('Packet decision must be file or cool');
    if (Object.hasOwn(run.packets, id)) return false;
    run.packets[id] = decision;
    return true;
  }

  function recordBolt(run, phase) {
    writable(run);
    if (![1, 2, 3].includes(phase)) throw new RangeError('Unknown boss bolt');
    if (run.bolts.includes(phase)) return false;
    run.bolts.push(phase);
    return true;
  }

  // Exactly two original tokens, with SAVE treated as a real disposition.
  function commitLicences(run, targets) {
    writable(run);
    if (run.licences) return false;
    if (!Array.isArray(targets) || targets.length !== 2 || targets.some(x => !['mira', 'jules', 'save'].includes(x))) throw new TypeError('Choose a disposition for each $40 token');
    const assigned = targets.filter(x => x !== 'save').length;
    run.licences = { targets: targets.slice(), assigned, savedDollars: (2 - assigned) * 40 };
    return true;
  }

  function choosePerk(run, id) {
    writable(run);
    if (!PERKS.includes(id)) throw new RangeError('Unknown perk');
    if (run.perks.length >= 4 || run.perks.filter(p => p === id).length >= 2) return false;
    run.perks.push(id);
    return true;
  }
  function recordDirective(run, id) {
    writable(run);
    const allowed = ['fast-or-safe', 'sponsored-workflow', 'mandatory-collaboration', 'double-entry'];
    if (!allowed.includes(id)) throw new RangeError('Unknown directive');
    if (run.directives.includes(id)) return false;
    run.directives.push(id);
    return true;
  }

  function calculate(run) {
    const cards = Object.entries(run.cards);
    const actions = cards.flatMap(([, card]) => card.actions);
    let streak = 0, longest = 0, correct = 0, wrong = 0;
    for (const action of actions) {
      if (action === 'correct') { correct++; longest = Math.max(longest, ++streak); }
      else { wrong++; streak = 0; }
    }
    const support = new Set(cards.flatMap(([, card]) => card.support));
    const notices = new Map();
    for (const [, card] of cards) for (const notice of card.notices) {
      if (!notices.has(notice.id)) notices.set(notice.id, notice.handled);
    }
    const handled = [...notices.values()].filter(Boolean).length;
    const saved = run.licences ? run.licences.savedDollars : 0;
    const assigned = run.licences ? run.licences.assigned : 0;
    const filed = Object.values(run.packets).filter(x => x === 'file').length;
    const cooled = Object.values(run.packets).filter(x => x === 'cool').length;
    const pace = cards.length ? cards.reduce((sum, [id, card]) => sum + clamp01(1 - card.elapsedMs / CARDS[id]), 0) / cards.length : 0;
    const corporateParts = { completedWork: 40 * clamp01(cards.length / 8), pace: 15 * pace, cleanStreak: 15 * clamp01(longest / 8), savings: 10 * clamp01(saved / 80), bossFiles: 5 * filed };
    const peopleParts = { support: 35 * clamp01(support.size / 4), access: 30 * clamp01(assigned / 2), accuracy: 20 * clamp01(correct / Math.max(1, correct + wrong)), notices: 15 * (notices.size ? clamp01(handled / notices.size) : 0) };
    const total = parts => Math.round(Object.values(parts).reduce((a, b) => a + b, 0));
    return { corporate: total(corporateParts), people: total(peopleParts), corporateParts, peopleParts, completedCards: cards.length, correctManual: correct, wrongManual: wrong, longestCleanManualStreak: longest, workersHelped: support.size, encounteredRealNotices: notices.size, safelyHandledRealNotices: handled, filedPackets: filed, cooledPackets: cooled, pressure: Math.min(2, filed), coolOpeningExtensionMs: cooled * 750, savedDollars: saved, licenceTokensAssigned: assigned };
  }

  function finishRun(run) {
    writable(run);
    if (Object.keys(run.cards).length !== 8 || Object.keys(run.packets).length !== 4 || run.bolts.length !== 3 || !run.licences) throw new Error('The shift is incomplete');
    const result = calculate(run);
    run.finished = true;
    return frozenCopy({ ledger: copy(run), scores: result });
  }
  return Object.freeze({ CARDS, PACKETS, SUPPORT, PERKS, createRun, commitCard, resolvePacket, recordBolt, commitLicences, choosePerk, recordDirective, calculate, finishRun });
});
