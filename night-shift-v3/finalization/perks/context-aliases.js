/**
 * Read-only scene compatibility for earned perks.
 * Director uses bare keys. A few independently authored scenes require
 * prefixed aliases, including the historic Mira "perk:teamwork" key.
 *
 * This adapter never changes ledgers, scoring, director state or grants.
 */
export const PERK_IDS = Object.freeze([
  'carbon-copy','chain-stamp','bank-shot','magnet-grip',
  'mira-backup','safety-net','time-bank','focus-lens'
]);

function copyPerks(target, source) {
  if (!source) return;
  if (Array.isArray(source)) {
    for (const p of source) {
      const id = typeof p === 'string' ? p : p?.id;
      if (typeof id !== 'string') continue;
      const key = id.startsWith('perk:') ? id.slice(5) : id;
      const level = typeof p === 'string' ? 1 : Number(p.level ?? p.count ?? 1);
      if (Number.isFinite(level) && level > 0) target[key] = Math.max(target[key] || 0, level);
    }
  } else if (typeof source === 'object') {
    for (const [id, val] of Object.entries(source)) {
      const key = id.startsWith('perk:') ? id.slice(5) : id;
      const level = Number(val);
      if (Number.isFinite(level) && level > 0) target[key] = Math.max(target[key] || 0, level);
    }
  }
}

/** Detached scene-only aliases, never written to the director or ledger. */
export function scenePerkLevels(perks, perkLevels) {
  const view = Object.create(null);
  copyPerks(view, perks);
  copyPerks(view, perkLevels);
  for (const id of PERK_IDS) if (view[id] > 0) view['perk:' + id] = view[id];
  if (view['mira-backup'] > 0) view['perk:teamwork'] = view['mira-backup'];
  return Object.freeze(view);
}

/** Late perk picks are always read from the original run getters. */
export function withScenePerkAliases(run = {}) {
  const view = Object.create(run);
  const read = () => scenePerkLevels(run.perks, run.perkLevels);
  Object.defineProperties(view, {
    perks: {enumerable: true, get: read},
    perkLevels: {enumerable: true, get: read}
  });
  return view;
}

/** Wrap without mutating frozen scene and boss definitions. */
export function withPerkCompatibleDefinitions(definitions) {
  if (!Array.isArray(definitions)) throw new TypeError('Definitions array required');
  return definitions.map(def => ({
    ...def,
    create(context = {}) {
      return def.create.call(def, {...context, run: withScenePerkAliases(context.run)});
    }
  }));
}
