import test from 'node:test';
import assert from 'node:assert/strict';
import {bindCampaignPointer} from '../night-shift-v3/finalization/input/pointer-guard.mjs';
function fixture({mode='card',camera=null}={}) {
 const listeners=new Map(),calls=[],captured=new Set();
 const canvas={
  addEventListener(k,f){listeners.set(k,f)},removeEventListener(k){listeners.delete(k)},
  getBoundingClientRect(){return {left:10,top:20}},
  setPointerCapture(id){captured.add(id)},hasPointerCapture(id){return captured.has(id)},
  releasePointerCapture(id){captured.delete(id)}
 };
 const director={mode,paused:false,pointer:(...a)=>calls.push(a),togglePause(v){this.paused=v;calls.push(['pause',v])}};
 const guard=bindCampaignPointer({canvas,director,getViewport:()=>({screenToWorld:(x,y)=>({x:x*2,y:y*2})}),getCamera:()=>camera});
 const fire=(type,id=1,x=30,y=50)=>listeners.get(type)?.({pointerId:id,clientX:x,clientY:y,pointerType:'touch',preventDefault(){}});
 return {canvas,director,guard,fire,calls,captured,listeners};
}
test('screen, camera and pointer identity preserve authored coordinates',()=>{
 const f=fixture({camera:{scale:.5,tx:10,ty:20}});
 f.fire('pointerdown');f.fire('pointermove',2,999,999);f.fire('pointerup');
 assert.deepEqual(f.calls.map(c=>c[0]),['down','up']);
 assert.deepEqual({x:f.calls[0][1].x,y:f.calls[0][1].y},{x:60,y:80});
 assert.equal(f.captured.size,0); f.guard.dispose();
});
test('second finger never hijacks a drag or causes false completion',()=>{
 const f=fixture();f.fire('pointerdown',1);f.fire('pointerdown',2);f.fire('pointerup',2);f.fire('pointermove',1);f.fire('pointerup',1);
 assert.deepEqual(f.calls.map(c=>c[0]),['down','move','up']);f.guard.dispose();
});
test('pointer cancel cannot submit a release; next gesture can start',()=>{
 const f=fixture();f.fire('pointerdown');f.fire('pointercancel');f.fire('pointerup');f.fire('pointerdown',3);
 assert.deepEqual(f.calls.map(c=>c[0]),['down','cancel','down']);f.guard.dispose();
});
test('boss focus loss cancels input and pauses timer',()=>{
 const previous=globalThis.window;
 const windowEvents=new EventTarget();
 globalThis.window=windowEvents;
 try {
  const f=fixture({mode:'quota'});
  f.fire('pointerdown');
  windowEvents.dispatchEvent(new Event('blur'));
  assert.deepEqual(f.calls.map(c=>c[0]),['down','cancel','pause']);
  assert.equal(f.director.paused,true);
  assert.equal(f.captured.size,0);
  f.guard.dispose();
 } finally { if(previous===undefined)delete globalThis.window;else globalThis.window=previous; }
});
test('pause, missing scene and disposed adapter ignore further input',()=>{
 const f=fixture();f.director.paused=true;f.fire('pointerdown');assert.equal(f.calls.length,0);
 f.director.paused=false;f.director.mode='promotion';f.fire('pointerdown');assert.equal(f.calls.length,0);
 f.guard.dispose();f.director.mode='card';f.fire('pointerdown');assert.equal(f.calls.length,0);
 assert.equal(f.listeners.size,0);
});
