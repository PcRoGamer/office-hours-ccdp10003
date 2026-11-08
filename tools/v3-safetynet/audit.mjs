#!/usr/bin/env node
/**
 * Zero-dependency, conservative v3 integration/release safety audit.
 * This deliberately proves only source/asset safety and structural coverage.
 * It does NOT certify actual mechanics, visual fidelity, music or playability.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, relative, dirname, extname, join, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const LEGACY_BLOBS = Object.freeze({
  '2d.html':'c9e2e56edd41e2456d7e10637e92c6724d2bae8e',
  'arcade-classic.html':'43cf98879c78f78628ae9f447db4ee269c1b6c81',
  'arcade-nightshift.html':'a8bd24dc75278c4cd1bc2d623480deb1ec67fa3c',
  'arcade-office-hd.html':'3533177e4843b7f6d0676300d315b97d44a2cb58',
  'arcade-office-genai.html':'96bfd5b400aae100abd87dcca41a253123f8efdd',
  'arcade-v2.html':'aff380a339390950d63f84a7e40e50da39f483ee',
  'arcade-v3.html':'4d723fffede945d948fb0967b3d01ca0b482b12e',
  'arcade.html':'4d723fffede945d948fb0967b3d01ca0b482b12e',
  'index.html':'bfe0406441c07663471461af80e9792b35424684',
  'workday-final.html':'48306f80e5e98b14d743879888d3275e778b337a',
  'workday.html':'274523a8e04389b2e3d0beb596ed212372dc171e',
  'director.html':'44b2b04d6d29342dbf38d51908631de5964c8ea1',
  'gallery.html':'cfcc6df3343d0491b292969fb9bbde8c1b2e1c67',
  'legacy-3d.html':'4434c468ada538700d5316daf73ad19a62f72221'
});
export const IDS_BY_DEPARTMENT = Object.freeze({
  intake:['I1','I2','I3','I4'], services:['S1','S2','S3','S4'],
  pr:['P1','P2','P3','P4'], staff:['T1','T2','T3','T4']
});

export function gitBlobSha(buffer) {
  const bytes = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  return createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
}
export function idsInSource(source) {
  const ids = new Set();
  const re = /\bid\s*:\s*(['"`])([ISPT][1-4])\1/g;
  let hit;
  while ((hit = re.exec(source))) ids.add(hit[2]);
  return ids;
}
export function localReferences(source, extension) {
  const refs = [];
  if (extension === '.html') {
    const tagged = /<(?:script|link|img|audio|source)\b[^>]*?\s(?:src|href)\s*=\s*(["'])(.*?)\1/gi;
    let match;
    while ((match = tagged.exec(source))) refs.push(match[2]);
  }
  if (extension === '.js' || extension === '.mjs') {
    const imports = /\b(?:import\s*(?:[\s\S]*?\bfrom\s*)?|export\s*[\s\S]*?\bfrom\s*)["'](\.{1,2}\/[^"']+)["']|\bimport\s*\(\s*["'](\.{1,2}\/[^"']+)["']\s*\)|\bnew\s+URL\s*\(\s*["'](\.{1,2}\/[^"']+)["']/g;
    let match;
    while ((match = imports.exec(source))) refs.push(match[1] || match[2] || match[3]);
  }
  if (extension === '.css') {
    const css = /url\(\s*(["']?)([^)'"\s]+)\1\s*\)/gi;
    let match;
    while ((match = css.exec(source))) refs.push(match[2]);
  }
  return refs;
}
function filesUnder(folder) {
  if (!existsSync(folder)) return [];
  const found = [];
  for (const item of readdirSync(folder, { withFileTypes: true })) {
    if (item.isDirectory()) found.push(...filesUnder(join(folder,item.name)));
    else if (item.isFile()) found.push(join(folder,item.name));
  }
  return found;
}
function normalizedRef(ref) {
  if (/^(?:https?:|data:|blob:|mailto:|#|\/\/)/i.test(ref)) return null;
  try { return decodeURIComponent(ref.split(/[?#]/,1)[0]); }
  catch { return ref.split(/[?#]/,1)[0]; }
}
export function inspectReference(root, sourceFile, ref) {
  if (/^\/(?!\/)/.test(ref)) return { status:'fail', reason:'Root-absolute URL breaks GitHub Pages project subpaths' };
  const rel = normalizedRef(ref);
  if (!rel || !rel.startsWith('.')) {
    // A plain filename is valid in HTML/CSS; a bare import specifier is external.
    if (!rel || ((extname(sourceFile) === '.js' || extname(sourceFile) === '.mjs') && !ref.startsWith('.'))) return null;
  }
  const path = resolve(dirname(sourceFile), rel);
  if (!(path === root || path.startsWith(root + sep))) return {status:'fail',reason:'Reference escapes the repository root'};
  if (!existsSync(path) || !statSync(path).isFile()) return {status:'fail',reason:'Local asset not found'};
  return {status:'pass'};
}
export function audit(root, { release = false, syntax = true } = {}) {
  root = resolve(root);
  const checks = [];
  const add = (category, id, status, detail) => checks.push({category,id,status,detail});
  for (const [filename, expected] of Object.entries(LEGACY_BLOBS)) {
    const filepath = join(root, filename);
    if (!existsSync(filepath)) { add('legacy',filename,'fail','Legacy release missing'); continue; }
    const actual = gitBlobSha(readFileSync(filepath));
    add('legacy',filename,actual === expected ? 'pass' : 'fail',actual === expected ? 'Byte-identical to pinned main release' : `Legacy release changed: expected ${expected}, got ${actual}`);
  }
  const contractFile = join(root,'design/v3/contract.json');
  let contract;
  try { contract = JSON.parse(readFileSync(contractFile,'utf8')); }
  catch (err) { add('contract','canonical-contract','fail',String(err.message)); }
  if (contract) {
    const ids = Object.values(IDS_BY_DEPARTMENT).flat();
    const valid = contract.card_pool?.length === 16 &&
      ids.every(id => contract.card_pool.some(card => card.id === id)) &&
      contract.scenesPerRun === 12 && contract.promotionPicks === 5 &&
      contract.perkIds?.length === 8 && contract.directives?.length === 5 &&
      contract.bosses?.printer?.requiredCounters === 3 &&
      contract.bosses?.quota?.requiredCounters === 3 &&
      contract.bosses?.quota?.bonusPacketIds?.length === 4;
    add('contract','v3-invariants',valid ? 'pass' : 'fail',valid ? 'Canonical source model retains full v3 scope' : 'Canonical source model lost one or more v3 dimensions');
  }
  const entry = join(root,'night-shift-v3.html');
  add('entry','night-shift-v3.html',existsSync(entry)?'pass':release?'fail':'pending',existsSync(entry)?'Additive v3 route exists':'v3 entry not integrated yet');
  for (const [department, ids] of Object.entries(IDS_BY_DEPARTMENT)) {
    const folder = join(root,'night-shift-v3/scenes',department);
    const sources = filesUnder(folder).filter(f=>/\.m?js$/.test(f));
    const present = new Set();
    for (const file of sources) for (const id of idsInSource(readFileSync(file,'utf8'))) present.add(id);
    for (const id of ids) {
      add('cards',id,present.has(id)?'pass':release?'fail':'pending',present.has(id)?`Definition id found under ${department}/ (not gameplay-verified)`:`Missing ${department} definition id ${id}`);
    }
  }
  for (const boss of ['printer','quota']) {
    const sources=filesUnder(join(root,'night-shift-v3/bosses',boss)).filter(f=>/\.m?js$/.test(f));
    add('bosses',boss,sources.length?'pass':release?'fail':'pending',sources.length?`${sources.length} JS module(s); boss mechanics unverified`:'Boss module not integrated');
  }
  for (const folderName of ['systems','physics','runtime','audio','art']) {
    const sources=filesUnder(join(root,'night-shift-v3',folderName)).filter(f=>/\.m?js$/.test(f));
    add('modules',folderName,sources.length?'pass':release?'fail':'pending',sources.length?`${sources.length} module(s), behavioral readiness not inferred`:'No modules integrated yet');
  }
  const sources = [entry,...filesUnder(join(root,'night-shift-v3')),...filesUnder(join(root,'assets/night-shift-v3'))]
    .filter(f=>existsSync(f) && /\.(html|css|m?js)$/i.test(f));
  for (const file of sources) {
    const extension=extname(file).toLowerCase();
    const contents=readFileSync(file,'utf8');
    for (const ref of localReferences(contents,extension)) {
      const inspected=inspectReference(root,file,ref);
      if (inspected?.status === 'fail') add('references',relative(root,file)+': '+ref,'fail',inspected.reason);
    }
    if (syntax && /\.m?js$/i.test(file)) {
      const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
      if (result.status !== 0) add('syntax',relative(root,file),'fail',(result.stderr || result.error?.message || 'Node syntax check failed').slice(0,800));
    }
  }
  add('runtime-evidence','real-gameplay', 'pending', 'Manual/Playwright gameplay, sound, 16 cards, bosses, fullscreen and HD visual comparison MUST be separately verified. Never auto-promote this to pass.');
  const counts={pass:0,fail:0,pending:0};
  for (const item of checks) counts[item.status]++;
  return {schemaVersion:1,mode:release?'release':'integration',root,counts,checks,ready:counts.fail===0 && (!release || counts.pending===1),visualAccepted:false};
}
export function markdownReport(report) {
  const lines=[`# Night Shift v3 safety audit`, '',`Mode: **${report.mode}**. Ready for source-stage gate: **${report.ready ? 'yes':'no'}**.`, `Checks: ${report.counts.pass} pass / ${report.counts.fail} fail / ${report.counts.pending} pending.`, '', '**Important:** Source checks do not establish gameplay or visual/audio release quality. The runtime-evidence check remains pending even in release mode.', '', '| Status | Category | Check | Detail |','|---|---|---|---|'];
  for (const c of report.checks) lines.push(`| ${c.status} | ${c.category} | ${c.id.replace(/\|/g,'\\|')} | ${c.detail.replace(/\|/g,'\\|').replace(/\n/g,' ')} |`);
  return lines.join('\n')+'\n';
}
function main() {
  const args=process.argv.slice(2);
  const value=key=>{const i=args.indexOf(key);return i<0?undefined:args[i+1]};
  const root=resolve(value('--root') ?? process.cwd());
  const report=audit(root,{release:args.includes('--release')});
  const out=value('--out');
  if (out) {
    const path=resolve(out); mkdirSync(dirname(path),{recursive:true});
    writeFileSync(path,JSON.stringify(report,null,2)+'\n');
    writeFileSync(path.replace(/\.json$/i,'')+'.md',markdownReport(report));
  }
  console.log(`V3_SAFETYNET ${report.mode.toUpperCase()} pass=${report.counts.pass} fail=${report.counts.fail} pending=${report.counts.pending} ready=${report.ready}`);
  for (const c of report.checks.filter(c=>c.status==='fail')) console.error(`[FAIL] ${c.category}/${c.id}: ${c.detail}`);
  if (report.counts.fail || (args.includes('--release') && report.counts.pending > 1)) process.exitCode=1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
