#!/usr/bin/env node
/** Cross-lane v3 scene/runtime contract probe. Runs actual production modules.
 * This is NOT a gameplay completion or visual-quality certificate.
 * node qa/v3-safetynet-contract-matrix.mjs --root <assembled-worktree> --out <report.json>
 */
import assert from 'node:assert/strict';
import {existsSync,readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
const args=process.argv.slice(2);
const arg=(key,fallback)=>{const i=args.indexOf(key);return i<0?fallback:args[i+1]};
const root=resolve(arg('--root',process.cwd()));
const release=args.includes('--release');
const out=resolve(arg('--out',join(root,'qa/v3-safetynet-contract-results.json')));
const groups=[
 {name:'intake',path:'night-shift-v3/scenes/intake/index.js',ids:['I1','I2','I3','I4']},
 {name:'services',path:'night-shift-v3/scenes/services/index.js',ids:['S1','S2','S3','S4']},
 {name:'pr',path:'night-shift-v3/scenes/pr/index.js',ids:['P1','P2','P3','P4']},
 {name:'staff',path:'night-shift-v3/scenes/staff/index.js',ids:['T1','T2','T3','T4']},
 {name:'printer',path:'night-shift-v3/bosses/printer/index.js',ids:['B1']},
 {name:'quota',path:'night-shift-v3/bosses/quota/quota.mjs',ids:['B2']}
];
const methods=['enter','update','draw','pointerDown','pointerMove','pointerUp','cancelPointer','snapshot','dispose'];
const results=[];
const add=(id,status,detail)=>{results.push({id,status,detail});console.log(status.toUpperCase()+' '+id+' '+detail)};
const contractFile=join(root,'design/v3/contract.json');
const contract=JSON.parse(readFileSync(contractFile,'utf8'));
assert.equal(contract.card_pool.length,16,'canonical complete source roster');
for(const group of groups){
 const src=join(root,group.path);
 if(!existsSync(src)){for(const id of group.ids)add(id,'pending',group.path+' not staged');continue}
 let defs;
 try{defs=(await import(pathToFileURL(src).href)).definitions}
 catch(error){for(const id of group.ids)add(id,'fail','Import exception: '+error.message);continue}
 if(!Array.isArray(defs)){for(const id of group.ids)add(id,'fail','Missing exported definitions array');continue}
 for(const id of group.ids){
  const matches=defs.filter(def=>def.id===id);
  if(matches.length!==1){add(id,'fail','Expected exactly one definition; found '+matches.length);continue}
  const def=matches[0];
  if(typeof def.imperative!=='string'||!def.imperative.trim()||typeof def.create!=='function'){
   add(id,'fail','Missing imperative or create factory');continue
  }
  const events=[];
  const context={
    cardId:id,
    canvas:null,
    viewport:{cssWidth:1200,cssHeight:760,dpr:1,worldWidth:1200,worldHeight:760,
      worldToScreen:(x,y)=>({x,y}),screenToWorld:(x,y)=>({x,y}),
      safeRect:{x:80,y:80,width:1040,height:600}},
    rng:()=>0.37,clock:{activeMs:0},
    run:{runId:'safetynet-probe',seed:71,hearts:3,perkLevels:{},completedCards:[],directive:'',currentDirective:null},
    options:{directive:''},
    audio:{play(){}},events:{emit(event){events.push(event)}}
  };
  try{
    const scene=def.create(context);
    const absent=methods.filter(m=>typeof scene?.[m]!=='function');
    if(absent.length){add(id,'fail','Missing methods: '+absent.join(', '));continue}
    scene.enter();scene.update(.016);
    const point={x:-999,y:-999,id:1,kind:'mouse'};
    scene.pointerDown(point);scene.pointerMove(point);scene.pointerUp(point);scene.cancelPointer();
    const snap=scene.snapshot();
    assert(snap&&typeof snap==='object','snapshot must be object');
    JSON.stringify(snap);
    scene.dispose();
    add(id,'pass','9 lifecycle/pointer methods; serialisable snapshot ('+Object.keys(snap).length+' keys); '+events.length+' emitted events');
  }catch(error){add(id,'fail','Lifecycle exception: '+error.message)}
 }
}
const corePath=join(root,'night-shift-v3/systems/core.js');
if(!existsSync(corePath))add('SYSTEMS','pending','Full deck core module not staged');
else try{
 const core=await import(pathToFileURL(corePath).href);
 const observed=new Set();
 for(let seed=0;seed<128;seed++){
   const deck=core.createDeck(seed);
   assert(core.validateDeck(deck),'invalid seeded topology '+seed);
   assert.equal(deck.length,12,'12 per normal run');
   for(const id of deck)observed.add(id);
   const stages=core.buildStages(deck);
   assert.equal(stages.filter(s=>s.type==='promotion').length,5,'five promotions');
   assert.deepEqual(stages.filter(s=>s.type==='boss').map(s=>s.id),['printer','quota'],'two boss ordering');
 }
 const expected=contract.card_pool.map(c=>c.id);
 assert(expected.every(id=>observed.has(id)),'seeded deck never includes '+expected.filter(id=>!observed.has(id)).join(','));
 add('SYSTEMS','pass','128 seeded 12-card decks, 5 promotion stages, both bosses, all 16 card IDs observed');
}catch(error){add('SYSTEMS','fail','Deck import/invariant exception: '+error.message)}
const counts={pass:results.filter(x=>x.status==='pass').length,fail:results.filter(x=>x.status==='fail').length,pending:results.filter(x=>x.status==='pending').length};
const report={schemaVersion:1,stage:release?'release':'rehearsal',source:'real staged production modules',note:'Lifecycle/seed invariants only, NOT gameplay/visual acceptance',counts,results};
mkdirSync(dirname(out),{recursive:true});writeFileSync(out,JSON.stringify(report,null,2)+'\n');
console.log('V3_CROSS_LANE_CONTRACT '+JSON.stringify(counts));
if(counts.fail||(release&&counts.pending))process.exitCode=1;
