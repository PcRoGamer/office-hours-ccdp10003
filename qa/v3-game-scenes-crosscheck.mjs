#!/usr/bin/env node
/**
 * Public scene-interface and timing QA, independently runnable against each
 * agent's separate checkout. Does NOT call graphics in a fake Canvas context.
 * For full release use --all and point --root at an integrated checkout.
 */
import {readFileSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
const args=process.argv.slice(2);
const opt=(n,f)=>{let i=args.indexOf(n);return i<0?f:args[i+1]};
const target=opt('--department','all');
const root=resolve(opt('--root','.'));
const contract=JSON.parse(readFileSync(new URL('../design/v3/contract.json',import.meta.url),'utf8'));
const departments={intake:'night-shift-v3/scenes/intake/index.js',
  services:'night-shift-v3/scenes/services/index.js',
  pr:'night-shift-v3/scenes/pr/index.js',
  staff:'night-shift-v3/scenes/staff/index.js',
  printer:'night-shift-v3/bosses/printer/index.js',
  quota:'night-shift-v3/bosses/quota/index.js'};
const expected={intake:['I1','I2','I3','I4'],services:['S1','S2','S3','S4'],
  pr:['P1','P2','P3','P4'],staff:['T1','T2','T3','T4'],printer:['B1'],quota:['B2']};
if(target!=='all'&&!departments[target]){console.error('Unknown department '+target);process.exit(2)}
const results=[];let failures=0,blocked=0;const names=target==='all'?Object.keys(departments):[target];
for(const name of names){
 const file=join(root,departments[name]);
 if(!existsSync(file)){blocked++;results.push({name,status:'BLOCKED_NOT_PRESENT',file});continue}
 try{
  const mod=await import(pathToFileURL(file).href),defs=mod.definitions;
  if(!Array.isArray(defs)){failures++;results.push({name,status:'FAIL',reason:'Missing definitions array'});continue}
  const ids=defs.map(x=>x.id),want=expected[name];
  const faults=[];
  if(ids.length!==want.length||ids.some(id=>!want.includes(id))||new Set(ids).size!==ids.length)faults.push('Wrong authored IDs: '+ids.join(','));
  for(const def of defs){
    const canonical=contract.card_pool.find(x=>x.id===def.id);
    if(canonical&&def.imperative!==canonical.imperative)faults.push(def.id+' imperative diverges from GDD');
    if(canonical&&def.authoredReferenceMs!==undefined&&def.authoredReferenceMs!==canonical.authoredReferenceMs)
      faults.push(def.id+' authoredReferenceMs '+def.authoredReferenceMs+' versus GDD '+canonical.authoredReferenceMs);
    if(typeof def.create!=='function'){faults.push(def.id+' missing create(context)');continue}
    let events=[];
    try{
      const context={rng:()=>.32,clock:{},run:{},options:{},events:{emit:e=>events.push(e)},
        audio:{play:()=>{}},viewport:{cssWidth:1280,cssHeight:760,worldWidth:1280,worldHeight:760,
        safeRect:{x:20,y:20,w:1240,h:720},screenToWorld:(x,y)=>({x,y}),worldToScreen:(x,y)=>({x,y})}};
      const instance=def.create(context);
      for(const method of ['enter','update','draw','pointerDown','pointerMove','pointerUp','cancelPointer','snapshot','dispose'])
        if(typeof instance?.[method]!=='function')faults.push(def.id+' missing '+method+'()');
      if(instance?.enter)instance.enter();
      if(instance?.update)instance.update(.016);
      if(instance?.snapshot){
        const state=instance.snapshot();
        if(!state||typeof state!=='object')faults.push(def.id+' snapshot not an object');
        JSON.stringify(state);
      }
      if(instance?.cancelPointer)instance.cancelPointer();
      if(instance?.dispose)instance.dispose();
    }catch(e){faults.push(def.id+' cannot instantiate/update/cancel: '+e.message)}
  }
  if(faults.length)failures++;
  results.push({name,status:faults.length?'FAIL':'PASS',ids,faults});
 }catch(e){failures++;results.push({name,status:'FAIL_IMPORT',error:String(e)})}
}
console.log('V3_SCENE_CONTRACT_AUDIT',JSON.stringify({root,departments:results,failures,blocked},null,2));
if(failures)process.exitCode=1;
else if(blocked)process.exitCode=2;
