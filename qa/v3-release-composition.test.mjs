/* Night Shift v3 | ephemeral multi-agent integration contract.
 * Usage: execute from an isolated, temporary staging checkout after the
 * release workflow imports each contributor's OWNED module directory.
 * Never alters agents' branches or presents staging as the release game.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const root=path.resolve(process.env.SWARM_STAGED_ROOT||process.cwd());
const out=path.resolve(root,'qa-artifacts/v3-release-composition');
fs.mkdirSync(out,{recursive:true});
const report={type:'ephemeral-source-composition',root,startedAt:new Date().toISOString(),checks:[],failures:[],warnings:[],seen:[],source:{},ready:false};
const pass=(name,details={})=>{report.checks.push({name,...details});console.log('PASS '+name)};
const fail=(name,details={})=>{report.failures.push({name,...details});console.error('FAIL '+name,JSON.stringify(details))};
const warn=(name,details={})=>{report.warnings.push({name,...details});console.warn('WARN '+name,JSON.stringify(details))};
const check=(condition,name,details={})=>condition?pass(name,details):fail(name,details);
const mod=(name)=>import(pathToFileURL(path.resolve(root,name)).href);
const sources={
  intake:'night-shift-v3/scenes/intake/index.js',
  services:'night-shift-v3/scenes/services/index.js',
  pr:'night-shift-v3/scenes/pr/index.js',
  printer:'night-shift-v3/bosses/printer/index.js',
  quota:'night-shift-v3/bosses/quota/quota.mjs',
  systems:'night-shift-v3/systems/core.js',
  engine:'night-shift-v3/systems/engine.js'
};
function contextFor(id){
 const events=[];
 const rng=()=>.43;
 const ctx={cardId:id,viewport:{cssWidth:1920,cssHeight:1080,dpr:1,worldWidth:1351.111,worldHeight:760,safeRect:{x:0,y:0,w:1351,h:760}},
  options:{attemptId:'composition-'+id,mode:'standard',directive:'fast-or-safe',reducedMotion:false},
  run:{runId:'integration-rehearsal',seed:20261108,attemptId:'composition-'+id,completedCards:['S2','S4'],directive:'fast-or-safe',activeDirective:'FAST OR SAFE',currentDirective:'FAST OR SAFE',perks:{},perkLevels:{},licences:{mira:true,jules:true},publicRelationsFrame:'context',events:[],coffeePerfect:true},
  rng,clock:{now:()=>0},events:{emit:e=>events.push(structuredClone(e))},
  audio:{play:()=>{}},effects:{},ledger:{},story:{}
 };
 return {ctx,events};
}
async function main(){
 for(const [lane,file] of Object.entries(sources))check(fs.existsSync(path.join(root,file)),lane+' source present',{file});
 const modules={};
 for(const [name,file] of Object.entries(sources)){
  if(!fs.existsSync(path.join(root,file)))continue;
  try{modules[name]=await mod(file);pass('ES module import '+name)}
  catch(e){fail('ES module import '+name,{error:String(e.stack||e)})}
 }
 const expected={
  intake:['I1','I2','I3','I4'],
  services:['S1','S2','S3','S4'],
  pr:['P1','P2','P3','P4'],
  printer:['B1'],quota:['B2']
 };
 const roster=[];
 for(const [lane,ids] of Object.entries(expected)){
  const m=modules[lane];
  if(!m)continue;
  const defs=m.definitions;
  check(Array.isArray(defs),lane+' definitions exported');
  if(!Array.isArray(defs))continue;
  check(JSON.stringify(defs.map(d=>d.id))===JSON.stringify(ids),lane+' expected stable GDD IDs',{observed:defs.map(d=>d.id)});
  for(const def of defs){
   roster.push(def.id);
   check(typeof def.imperative==='string'&&def.imperative.length>3,def.id+' authored imperative');
   check(typeof def.create==='function',def.id+' context factory');
   if(typeof def.create!=='function')continue;
   const {ctx,events}=contextFor(def.id);
   let scene;
   try{scene=def.create(ctx);pass(def.id+' factory accepts shared mock context')}
   catch(e){fail(def.id+' factory accepts shared mock context',{error:String(e.stack||e)});continue}
   const required=['enter','update','draw','pointerDown','pointerMove','pointerUp','cancelPointer','snapshot','dispose'];
   for(const method of required)check(typeof scene?.[method]==='function',def.id+' '+method+'()');
   if(typeof scene?.snapshot==='function'){
    try{
     const state=scene.snapshot();
     check(state!==null&&typeof state==='object',def.id+' serializable snapshot');
     JSON.stringify(state);
     report.seen.push({id:def.id,source:lane,kind:'scene',snapshotKeys:Object.keys(state||{}).slice(0,22),events:events.length});
    }catch(e){fail(def.id+' initial snapshot',{error:String(e.stack||e)})}
   }
   try{
    scene.enter?.();
    scene.update?.(1/60);
    scene.cancelPointer?.();
    const state=scene.snapshot?.();
    check(state!==undefined,def.id+' ticking does not invalidate snapshot');
    check(!events.some(e=>e.type==='card-complete'),def.id+' does not award score without manual input',{events:events.map(e=>e.type)});
   }catch(e){fail(def.id+' enter/update/cancel lifecycle',{error:String(e.stack||e)})}
   try{scene.dispose?.();pass(def.id+' dispose safely')}
   catch(e){fail(def.id+' dispose safely',{error:String(e.stack||e)})}
  }
 }
 check(new Set(roster).size===roster.length,'No duplicate scene/boss IDs across independently authored branches',{roster});
 check(roster.length===14,'Exactly 12 independently authored Intake/Services/PR cards and two bosses currently available',{roster});
 if(modules.systems){
  const cards=modules.systems.CARDS||[];
  check(cards.length===16,'SYSTEMS retains all sixteen intended cards',{length:cards.length});
  const ids=cards.map(x=>typeof x==='string'?x:x.id);
  for(const id of roster.filter(x=>/^[ISP]\d/.test(x)))
   check(ids.includes(id),'SYSTEMS deck knows '+id);
  check(['T1','T2','T3','T4'].every(id=>ids.includes(id)),'STAFF remains in authoritative system deck, not silently deleted');
 }
 if(modules.engine){
  try{
   const r=modules.engine.newRun({seed:1,firstRun:true});
   const id=r.stage?.id;
   check(roster.includes(id)||id?.startsWith('T'),'SYSTEMS first stage resolves against scene roster',{id});
   pass('Run engine instantiated against assembled source');
  }catch(e){fail('Run engine instantiated against assembled source',{error:String(e.stack||e)})}
 }
 // STAFF still missing at this checkpoint; this is a transparent condition.
 const staffPresent=fs.existsSync(path.join(root,'night-shift-v3/scenes/staff/index.js'));
 if(!staffPresent)warn('STAFF production scenes absent. Full 16-card game cannot be certified.');
 const appPresent=fs.existsSync(path.join(root,'night-shift-v3.html'));
 if(!appPresent)warn('LEAD production entry absent. This composition is a test-only rehearsal.');
 for(const missing of ['night-shift-v3/art','night-shift-v3/audio','night-shift-v3/runtime/renderer.js'])
  if(!fs.existsSync(path.join(root,missing)))warn('Presentation dependency not integrated',{missing});
 report.ready=report.failures.length===0;
}
try{await main()}
catch(e){fail('Fatal integration contract error',{error:String(e.stack||e)})}
finally{
 report.finishedAt=new Date().toISOString();
 fs.writeFileSync(path.join(out,'contract.json'),JSON.stringify(report,null,2));
 console.log('INTEGRATION_CONTRACT',JSON.stringify({passes:report.checks.length,failures:report.failures.length,warnings:report.warnings.length,scenes:report.seen.length,ready:report.ready}));
 if(report.failures.length)process.exitCode=1;
}
