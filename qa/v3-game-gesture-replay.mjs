#!/usr/bin/env node
/**
 * Scene-pointer API replay against actual specialist modules in a separate
 * worktree. Not a browser visual or human input test. No secret score setters.
 * Usage: node qa/v3-game-gesture-replay.mjs --root /path/to/branch --suite intake
 */
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
const args=process.argv.slice(2),opt=(key,def)=>{const i=args.indexOf(key);return i<0?def:args[i+1]};
const root=resolve(opt('--root','.')),suite=opt('--suite','all');
const paths={intake:'night-shift-v3/scenes/intake/index.js',pr:'night-shift-v3/scenes/pr/index.js',printer:'night-shift-v3/bosses/printer/index.js'};
if(suite!=='all'&&!Object.hasOwn(paths,suite))throw Error('Unknown suite '+suite);
const suites=suite==='all'?Object.keys(paths):[suite];let passed=0,blocked=0,failed=0;
const gesture=(x,y,id=1)=>({x,y,id,kind:'mouse'});
const completed=ev=>ev.filter(e=>e.type==='card-complete');
const advance=(s,seconds)=>{for(let i=0;i<Math.ceil(seconds/.05);i++)s.update(.05)};
for(const name of suites){
 const filename=join(root,paths[name]);
 if(!existsSync(filename)){console.error('BLOCKED_'+name.toUpperCase()+': missing actual module '+filename);blocked++;continue}
 try{
  const mod=await import(pathToFileURL(filename).href);
  if(name==='intake'){
   const make=(id,perks=[])=>{let ev=[];const scene=mod.createIntakeCard(id,{run:{attemptId:'qa-'+id,perks},rng:{next:()=>.42},events:{emit:e=>ev.push(e)},audio:{play:()=>{}}});return {s:scene,ev}};
   {
    const {s,ev}=make('I1');
    for(let i=0;i<9&&!s.ended;i++){advance(s,1.16);let f=s.forms.find(f=>f.kind==='approved'&&!f.hit&&f.x>0);if(f)s.pointerDown(gesture(f.x+70,f.y+48))}
    assert.equal(completed(ev).length,1);assert.equal(completed(ev)[0].outcome.manualApproved,5);passed++;
   }
   {
    const {s,ev}=make('I2');
    for(let id of ['junk-a','junk-b']){let e=s.envelopes.find(e=>e.id===id);s.pointerDown(gesture(e.x+66,e.y+40));s.pointerMove(gesture(637,454));s.pointerUp(gesture(637,454))}
    assert.equal(completed(ev).length,1);assert.equal(completed(ev)[0].outcome.paySlipSaved,true);passed++;
   }
   {
    const {s,ev}=make('I3');const real=s.windows.find(w=>w.real);s.pointerDown(gesture(real.x+90,real.y+100));
    for(const w of s.windows.filter(w=>!w.real))s.pointerDown(gesture(w.x+w.w-24,w.y+24));
    assert.equal(completed(ev).length,1);assert.equal(completed(ev)[0].outcome.genuineHelp,'opened');passed++;
   }
   {
    const {s,ev}=make('I4'),p=s.waypoints;s.pointerDown(gesture(p[0].x,p[0].y));
    for(let i=1;i<p.length;i++)for(let f=1;f<=12;f++){const a=p[i-1],b=p[i];s.pointerMove(gesture(a.x+(b.x-a.x)*f/12,a.y+(b.y-a.y)*f/12))}
    s.pointerUp(gesture(p[3].x,p[3].y));assert.equal(completed(ev).length,1);assert.equal(completed(ev)[0].outcome.linkedForms,3);passed++;
   }
  }else if(name==='pr'){
   const vp={worldWidth:1200,worldHeight:760};
   const make=id=>{const ev=[],s=mod.definitions.find(x=>x.id===id).create({events:{emit:e=>ev.push(e)},run:{}});s.enter();return {s,ev}};
   {
    const {s,ev}=make('P1');s.pointerDown(gesture(400,520),vp);s.pointerMove(gesture(400,710),vp);s.pointerUp(gesture(400,710),vp);
    s.pointerDown(gesture(600,630),vp);assert.equal(completed(ev).length,1);assert.deepEqual(completed(ev)[0].evidence.values,[1240,1280]);passed++;
   }
   {
    const {s,ev}=make('P2');for(const [a,b] of [[[300,280],[30,80]],[[750,450],[1080,600]]]){s.pointerDown(gesture(...a),vp);s.pointerMove(gesture(...b),vp);s.pointerUp(gesture(...b),vp)}
    s.pointerDown(gesture(550,360),vp);s.pointerUp(gesture(550,360),vp);assert.equal(completed(ev).length,1);assert.equal(completed(ev)[0].evidence.genuineHelpOpened,true);passed++;
   }
   {
    const {s,ev}=make('P3');s.pointerDown(gesture(600,528),vp);
    for(let i=0;i<400&&!completed(ev).length;i++){let state=s.snapshot();let t=Math.sin(state.time*(state.locked===2?2.5:1.5)+state.locked*.8)*.67;s.pointerMove(gesture(600+t*190,528),vp);s.update(.04)}
    assert.equal(completed(ev).length,1);assert.equal(s.snapshot().locked,3);passed++;
   }
   for(const route of ['headline','context']){
    const {s,ev}=make('P4');s.pointerDown(gesture(600,402),vp);const p=route==='headline'?gesture(385,565):gesture(805,565);
    s.pointerMove(p,vp);s.pointerUp(p,vp);assert.equal(completed(ev).length,1);assert.equal(completed(ev)[0].evidence.framing,route);passed++;
   }
  }else if(name==='printer'){
    const tick=(b,seconds)=>{for(let i=0;i<Math.round(seconds*40);i++)b.update(.025)};
    const ptr=(b,type,x,y)=>b[type](gesture(x,y));
    const drag=(b,[x1,y1],[x2,y2])=>{ptr(b,'pointerDown',x1,y1);for(let i=1;i<=10;i++)ptr(b,'pointerMove',x1+(x2-x1)*i/10,y1+(y2-y1)*i/10);ptr(b,'pointerUp',x2,y2)};
    for(const directive of mod.PRINTER_DIRECTIVES){
      const events=[],b=mod.createPrinterMutiny({options:{directive},events:{emit:x=>events.push(x)}});
      for(let phase=0;phase<3;phase++){
        tick(b,3.25);tick(b,.55);drag(b,[-104,105],[-104,239]);
        let snap=b.snapshot();assert.equal(snap.phase,'counter','jam opened only with safe manual page pull');
        if(directive==='DOUBLE_ENTRY')ptr(b,'pointerDown',snap.feederX,-28);
        if(directive==='SPONSORED_WORKFLOW')drag(b,[45,65],[228,65]);
        if(directive==='MANDATORY_COLLABORATION')ptr(b,'pointerDown',260,153);
        snap=b.snapshot();drag(b,[snap.packet.x,snap.packet.y],[snap.feederX,50]);tick(b,1.45);
      }
      const final=b.snapshot();
      assert.equal(final.phase,'victory');assert.equal(final.removed,3);assert.equal(final.manualHits,3);
      assert.equal(events.filter(x=>x.type==='boss-complete').length,1);b.dispose();passed++;
    }
  }
  console.log('SCENE_POINTER_SUITE_PASS',name);
 }catch(e){failed++;console.error('SCENE_POINTER_SUITE_FAIL',name,e.stack||e)}
}
console.log('SCENE_POINTER_REPLAY_RESULT',JSON.stringify({passed,failed,blocked,scope:'specialist public pointer APIs, NOT browser gameplay'}));
if(failed)process.exitCode=1;else if(blocked)process.exitCode=2;
