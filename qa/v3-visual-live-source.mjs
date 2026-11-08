#!/usr/bin/env node
/** QUOTA PANIC QA_VISUAL: direct *actual-source* module smoke tests.
 * No browser artwork claims. This executes native source in Node using a
 * no-op Canvas2D compatibility proxy. Pixel QA is handled by branch-matrix.py.
 *
 * node qa/v3-visual-live-source.mjs --lane all
 * node qa/v3-visual-live-source.mjs --lane intake --source intake=/repo/checkout
 * node qa/v3-visual-live-source.mjs --selftest (clearly isolated fixture)
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

const repo='https://github.com/PcRoGamer/office-hours-ccdp10003.git';
const specs={
 intake:{branch:'agents/v3-intake-81d47',file:'night-shift-v3/scenes/intake/index.js',ids:['I1','I2','I3','I4']},
 services:{branch:'agents/v3-services-n8-7c42',file:'night-shift-v3/scenes/services/index.js',ids:['S1','S2','S3','S4']},
 pr:{branch:'agents/v3-pr-g6-1108c',file:'night-shift-v3/scenes/pr/index.js',ids:['P1','P2','P3','P4']},
 printer:{branch:'agents/v3-printer-r8c2',file:'night-shift-v3/bosses/printer/index.js',ids:['B1']},
 quota:{branch:'agents/v3-quota-q7n482',file:'night-shift-v3/bosses/quota/quota.mjs',ids:['B2']}
};
const sizes=[['1080p',1920,1080],['portrait',650,800],['ultrawide',3440,1440],['4k',3840,2160]];
const directives=['fast-or-safe','moving-goalposts','sponsored-workflow','mandatory-collaboration','double-entry'];
const digest=s=>crypto.createHash('sha256').update(s).digest('hex');
const cmd=(program,args,opts={})=>execFileSync(program,args,{encoding:'utf8',timeout:120000,...opts}).trim();
function options(argv){
 let a={lane:'all',sources:{},selftest:false,out:null};
 for(let i=0;i<argv.length;i++){
  if(argv[i]==='--lane')a.lane=argv[++i];
  else if(argv[i]==='--out')a.out=path.resolve(argv[++i]);
  else if(argv[i]==='--source'){const spec=argv[++i]||'',i=spec.indexOf('=');
   if(i<=0)throw Error('Expected lane=/absolute/path');a.sources[spec.slice(0,i)]=path.resolve(spec.slice(i+1));}
  else if(argv[i]==='--selftest')a.selftest=true;
  else throw Error('Unknown option '+argv[i]);
 }
 if(a.selftest){a.lane='fixture';a.out??=path.resolve('qa-artifacts/v3-visual/_source-selftest');}
 else{if(a.lane!=='all'&&!specs[a.lane])throw Error('Unknown lane');a.out??=path.resolve('qa-artifacts/v3-visual/source-module-matrix');}
 return a;
}
function modules(root){
 root=path.resolve(root);const cache=new Map(),hashes={};
 function embed(name){
  name=path.resolve(name);
  if(!name.startsWith(root+path.sep))throw Error('Out-of-tree ESM import refused: '+name);
  if(cache.has(name))return cache.get(name);
  const src=fs.readFileSync(name,'utf8');
  hashes[path.relative(root,name).split(path.sep).join('/')]=digest(src);
  if(/\bimport\s*\(/.test(src))throw Error('Dynamic import requires real browser: '+name);
  const replaced=src.replace(/(\b(?:from|import)\s*)(['"])(\.[^'"]+)\2/g,(_m,p,q,spec)=>p+q+embed(path.resolve(path.dirname(name),spec))+q);
  const url='data:text/javascript;base64,'+Buffer.from(replaced).toString('base64');cache.set(name,url);return url;
 }
 return {embed,hashes};
}
function drawProxy(){
 const metrics={calls:0},grad={addColorStop(){}},noop=()=>{metrics.calls++};
 return {metrics,g:new Proxy({},{
  get(obj,k){if(k==='createLinearGradient'||k==='createRadialGradient')return ()=>{metrics.calls++;return grad;};
   if(k==='measureText')return text=>({width:String(text).length*12});
   if(k==='canvas')return {width:1920,height:1080};
   return obj[k]??noop;
  },set(obj,k,v){obj[k]=v;return true;}
 })};
}
function finite(value,loc='snapshot',depth=0){
 if(depth>25)throw Error('Snapshot excessively nested: '+loc);
 if(typeof value==='number'&&!Number.isFinite(value))throw Error('Nonfinite value at '+loc);
 if(value&&typeof value==='object')for(const [key,v] of Object.entries(value))finite(v,loc+'.'+key,depth+1);
}
const gitSha=dir=>{try{return cmd('git',['rev-parse','HEAD'],{cwd:dir});}catch{return null;}};
async function evaluate(lane,root,conf){
 const bundle=modules(root),mod=await import(bundle.embed(path.resolve(root,conf.file)));
 const actual=mod.definitions?.map(x=>x.id);
 if(JSON.stringify(actual)!==JSON.stringify(conf.ids))throw Error('Incomplete roster: '+JSON.stringify(actual));
 let passed=0,failed=[],drawCalls=0;
 for(const [label,w,h] of sizes)for(const directive of directives)for(const card of mod.definitions){
  const wh=lane==='intake'?[1280,720]:[760*w/h,760];
  const viewport={cssWidth:w,cssHeight:h,worldWidth:wh[0],worldHeight:wh[1],dpr:1,
   screenToWorld:(x,y)=>({x,y}),worldToScreen:(x,y)=>({x,y})};
  const events=[],runState={attemptId:'qa-'+card.id,perks:[],directive,currentDirective:directive,activeDirective:directive,
   completedCards:[],perkLevels:{},quotaBonusPacketOutcomes:{}};
  Object.freeze(runState.perks);Object.freeze(runState.completedCards);Object.freeze(runState.perkLevels);
  Object.freeze(runState.quotaBonusPacketOutcomes);Object.freeze(runState);
  const ctx={run:runState,options:{directive,attemptId:'qa-'+card.id},viewport,
   events:{emit:e=>events.push(e)},audio:{play(){}},rng:{next:()=>.42},canvas:{width:w,height:h}};
  try{
   const scene=card.create(ctx);
   for(const method of ['enter','update','draw','pointerDown','pointerMove','pointerUp','cancelPointer','snapshot','dispose'])
    if(typeof scene?.[method]!=='function')throw Error('Missing method '+method);
   scene.enter();
   for(let n=0;n<30;n++){
    scene.update([0,.016,.05,.1][n%4]);
    if(n===2)scene.pointerDown({x:-10000,y:-10000,id:1,kind:'mouse'});
    if(n===3)scene.pointerMove({x:10000,y:10000,id:1,kind:'mouse'});
    if(n===4)scene.pointerUp({x:10000,y:10000,id:1,kind:'mouse'});
    if(n===5)scene.cancelPointer();
    if(n%7===0){const {g,metrics}=drawProxy();scene.draw(g,viewport);drawCalls+=metrics.calls;
     if(!metrics.calls)throw Error('Scene rendered zero draw operations');}
    finite(scene.snapshot());
   }
   if(events.filter(e=>e.type==='card-complete'||e.type==='boss-complete').length>1)
    throw Error('Duplicate completion event');
   scene.dispose();passed++;
  }catch(e){failed.push({card:card.id,viewport:label,directive,error:e.stack||String(e)});}
 }
 return {lane,branch:conf.branch,sha:gitSha(root),sourceHashes:bundle.hashes,cards:actual,
  cases:passed+failed.length,passed,failed,drawCalls,
  evidenceType:'real-module-logic-with-mocked-canvas-NOT-actual-browser-art'};
}
async function main(){
 const a=options(process.argv.slice(2));fs.mkdirSync(a.out,{recursive:true});
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'nightshift-source-qa-'));const results=[];
 try{
  if(a.selftest){
   const root=path.join(tmp,'fixture');fs.mkdirSync(path.join(root,'demo'),{recursive:true});
   fs.writeFileSync(path.join(root,'demo','colors.js'),'export const paint="cream";');
   fs.writeFileSync(path.join(root,'demo','entry.js'),
    'import {paint} from "./colors.js"; export const definitions='+JSON.stringify(['I1','I2','I3','I4'])+
    '.map(id=>({id,create:()=>({enter(){},update(){},draw(g){g.fillRect(0,0,10,10);},pointerDown(){},pointerMove(){},pointerUp(){},cancelPointer(){},snapshot(){return {id,paint}},dispose(){}})}));');
   results.push(await evaluate('fixture',root,{branch:'SELFTEST-NOT-GAME',file:'demo/entry.js',ids:['I1','I2','I3','I4']}));
  }else for(const lane of a.lane==='all'?Object.keys(specs):[a.lane]){
   const spec=specs[lane],root=a.sources[lane]||path.join(tmp,lane);
   if(!a.sources[lane])try{cmd('git',['clone','-q','--depth=1','--single-branch','--branch',spec.branch,repo,root]);}
    catch(e){results.push({lane,failed:[{error:'Clone failed: '+String(e)}]});continue;}
   try{results.push(await evaluate(lane,root,spec));}
   catch(e){results.push({lane,failed:[{error:e.stack||String(e)}]});}
  }
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
 const report={generatedAt:new Date().toISOString(),fixture:a.selftest,
  note:'Source logic smoke tests with an instrumented mock 2D drawing context. Not visual acceptance.',
  viewports:sizes,directives,results};
 fs.writeFileSync(path.join(a.out,'report.json'),JSON.stringify(report,null,2));
 const failures=results.reduce((n,r)=>n+(r.failed?.length||0),0);
 console.log(JSON.stringify({fixture:a.selftest,lanes:results.map(r=>r.lane),passed:results.reduce((n,r)=>n+(r.passed||0),0),
  failures,report:path.join(a.out,'report.json')},null,2));
 if(failures||!results.length)process.exitCode=1;
 if(a.selftest&&(results[0].passed!==80||!results[0].sourceHashes['demo/colors.js']))throw Error('Fixture source-loader regression');
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1});
