import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { LEGACY_BLOBS, gitBlobSha, workingBlobSha, idsInSource, localReferences, inspectReference, audit, markdownReport } from '../tools/v3-safetynet/audit.mjs';

function fixture() {
  const root=mkdtempSync(join(tmpdir(),'nightshift-safetynet-'));
  const put=(p,text)=>{const dest=join(root,p);mkdirSync(dirname(dest),{recursive:true});writeFileSync(dest,text);};
  put('design/v3/contract.json',JSON.stringify({
    card_pool:Object.entries({I:'intake',S:'services',P:'pr',T:'staff'}).flatMap(([prefix,department])=>[1,2,3,4].map(n=>({id:prefix+n,department}))),
    scenesPerRun:12,promotionPicks:5,perkIds:Array(8).fill('x'),directives:Array(5).fill('x'),
    bosses:{printer:{requiredCounters:3},quota:{requiredCounters:3,bonusPacketIds:Array(4).fill('x')}}
  }));
  return {root,put,cleanup:()=>rmSync(root,{recursive:true,force:true})};
}

test('Git blob SHA uses content bytes, length prefix and null separator',()=>{
  assert.equal(gitBlobSha('hello\n'),'ce013625030ba8dba906f756967f9e9ca394464a');
  assert.equal(gitBlobSha(Buffer.from([0,1,2])),gitBlobSha(Buffer.from([0,1,2])));
  assert.equal(Object.keys(LEGACY_BLOBS).length,14);
});
test('Only explicit authored definition ids are counted, never arbitrary paragraphs',()=>{
  assert.deepEqual([...idsInSource("const cards=[{ id:'I1'}, {id: \"I4\"}, {id: `S2`}]; /* P3 */")].sort(),['I1','I4','S2']);
  assert.deepEqual([...idsInSource('The I1, P2 and T4 should exist')],[]);
});
test('CSS/HTML references parsed without treating external CDN as local',()=>{
  assert.deepEqual(localReferences('<script src="./app.js"></script><link href="./style.css" rel="stylesheet">','.html'),['./app.js','./style.css']);
  assert.deepEqual(localReferences('body{background:url(../art/sky.png)}','.css'),['../art/sky.png']);
});
test('GitHub Pages path traversal, root-absolute and missing assets fail',()=>{
  const f=fixture();
  try {
    f.put('stage/main.js','export default 1;');
    assert.equal(inspectReference(f.root,join(f.root,'stage/index.html'),'./main.js').status,'pass');
    assert.equal(inspectReference(f.root,join(f.root,'stage/index.html'),'./bad.js').status,'fail');
    assert.equal(inspectReference(f.root,join(f.root,'stage/index.html'),'/assets/missing.js').status,'fail');
    assert.equal(inspectReference(f.root,join(f.root,'stage/index.html'),'../../outside.js').status,'fail');
    assert.equal(inspectReference(f.root,join(f.root,'stage/index.html'),'https://example.com/app.js'),null);
  } finally {f.cleanup();}
});
test('No false complete result when game is absent, even if GDD contract is present',()=>{
  const f=fixture();
  try {
    const integration=audit(f.root,{syntax:false});
    const release=audit(f.root,{release:true,syntax:false});
    assert.equal(integration.ready,false); // pinned legacy releases not present
    assert(integration.checks.some(c=>c.category==='cards'&&c.status==='pending'));
    assert(release.checks.some(c=>c.category==='cards'&&c.status==='fail'));
    assert.equal(release.ready,false);
    assert.equal(release.visualAccepted,false);
    assert.match(markdownReport(release),/runtime-evidence/);
  }finally{f.cleanup();}
});
test('Present id is structural only; incomplete boss and missing page cannot pass release',()=>{
  const f=fixture();
  try {
    f.put('night-shift-v3/scenes/intake/cards.js','export const definitions=[{id:"I1"},{id:"I2"},{id:"I3"},{id:"I4"}];');
    const report=audit(f.root,{release:true,syntax:false});
    assert(report.checks.some(c=>c.id==='I1'&&c.status==='pass'));
    assert(report.checks.some(c=>c.id==='S1'&&c.status==='fail'));
    assert(report.checks.some(c=>c.id==='quota'&&c.status==='fail'));
    assert(report.checks.some(c=>c.id==='night-shift-v3.html'&&c.status==='fail'));
  }finally{f.cleanup();}
});

test('Git working-tree hashes respect core.autocrlf without hiding actual edits',()=>{
  const f=fixture();
  try {
    const exec=(args)=>spawnSync('git',args,{cwd:f.root,encoding:'utf8'});
    assert.equal(exec(['init','-q']).status,0);
    assert.equal(exec(['config','core.autocrlf','true']).status,0);
    f.put('hd.html','original\r\n');
    const expected=gitBlobSha(Buffer.from('original\n'));
    assert.equal(workingBlobSha(f.root,'hd.html',join(f.root,'hd.html')),expected);
    f.put('hd.html','changed\r\n');
    assert.notEqual(workingBlobSha(f.root,'hd.html',join(f.root,'hd.html')),expected);
  } finally {f.cleanup();}
});
