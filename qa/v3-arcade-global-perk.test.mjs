import assert from 'node:assert/strict';
import {createDirector} from '../night-shift-v3/runtime/director.js';
const ids=['I1','I2','I3','S1','S2','S3','P1','P2','P4','T1','T2','T4'];
let sceneCtx=null;
const definitions=ids.map(id=>({id,create(ctx){sceneCtx=ctx;return{
 enter(){},update(){},cancelPointer(){},dispose(){},snapshot(){return{id}},
 pointerDown(){ctx.events.emit({type:'card-failed',cardId:id,reason:'physical-miss'})}
}}}));
const bosses=['printer','quota'].map(id=>({id,create(ctx){sceneCtx=ctx;return{
 enter(){},update(){},dispose(){},cancelPointer(){},snapshot(){return{}},
 pointerDown(){ctx.events.emit({type:'boss-failed',bossId:id,reason:'physical-miss'})}
}}}));
const director=createDirector({viewport:{worldWidth:1200,worldHeight:760,screenToWorld:(x,y)=>({x,y})},
 canvas:{},ctx2d:{},events:{emit(){}},audio:{play(){}},scoreFactory:null});
director.configureRun({cards:ids,definitions,bosses,
 draftProvider:()=>({offers:[{id:'carbon-copy'},{id:'bank-shot'},{id:'mira-backup'}],directive:'fast-or-safe'}),
 rng:()=>.5});
director.start();
assert.equal(director.snapshot().globalGuardReady,false,'no free global perk before a promotion');
function succeed(){
 const id=director.snapshot().currentCardId;
 assert.ok(id);
 sceneCtx.events.emit({type:'card-complete',cardId:id,outcome:'success',evidence:{authoredFixture:true}});
 director.update(.39);
}
for(let n=0;n<3;n++)succeed();
assert.equal(director.mode,'promotion');
assert.equal(director.pickPerk('carbon-copy'),true);
assert.equal(director.snapshot().currentCardId,'S1');
assert.equal(director.snapshot().globalGuardReady,true);
director.pointer('down',{x:1,y:1,id:1});
assert.equal(director.mode,'recover');
assert.equal(director.hearts,3,'upgraded shield must prevent real heart loss');
assert.equal(director.snapshot().lastGlobalGuard,true);
assert.equal(director.snapshot().globalGuardReady,false);
director.retry();
assert.equal(director.snapshot().currentCardId,'S1');
assert.equal(director.snapshot().globalGuardReady,false,'retry cannot mint a fresh shield');
director.pointer('down',{x:1,y:1,id:2});
assert.equal(director.hearts,2,'second mistake should cost a heart');
assert.equal(director.snapshot().lastGlobalGuard,false);
director.retry();
succeed();
assert.equal(director.snapshot().currentCardId,'S2');
assert.equal(director.snapshot().globalGuardReady,true,'per-encounter safety applies globally across scenes');
assert.equal(director.hearts,2,'shield cannot fabricate restored hearts');
console.log('PASS one run-wide equipped power-up saves first real failure per encounter only, persisted between different scene types');
