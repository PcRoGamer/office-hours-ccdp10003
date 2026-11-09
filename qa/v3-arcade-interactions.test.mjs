import assert from 'node:assert/strict';
import {definitions as pr} from '../night-shift-v3/scenes/pr/index.js';
import {definitions as quota} from '../night-shift-v3/bosses/quota/quota.mjs';

function controls(){
 const events=[],sounds=[];
 return {events,sounds,ctx:{viewport:{worldWidth:1280,worldHeight:720},
  events:{emit:(e)=>events.push(e)},audio:{play:(name)=>sounds.push(name)},
  run:{perkLevels:{},activeDirective:null,directive:null}}};
}
{
 const {ctx,events}=controls();
 const scene=pr.find(d=>d.id==='P1').create(ctx);
 scene.enter();
 assert.equal(scene.snapshot().baseline,1200);
 scene.pointerDown({x:640,y:528,id:1},ctx.viewport);
 assert.equal(scene.snapshot().baseline,0,'actual click on red baseline must correct chart');
 assert.equal(scene.snapshot().corrected,true);
 assert.equal(events.filter(e=>e.type==='card-action'&&e.kind==='correct-chart-axis').length,1);
 scene.pointerDown({x:640,y:602,id:2},ctx.viewport);
 assert.equal(events.filter(e=>e.type==='card-complete').length,1,'actual send click completes');
 assert.equal(events.find(e=>e.type==='card-complete').evidence.chartBaseline,0);
 console.log('PASS click RED BASELINE then SEND fixes P1 without a hidden swipe');
}
{
 const {ctx,events}=controls();
 ctx.run.quotaBoltsRemoved=3; // Rehydrate a fixture with all three previously committed physical counters.
 ctx.run.quotaBonusPacketOutcomes={};
 const boss=quota[0].create(ctx);
 boss.enter();
 for(let i=0;i<50;i++)boss.update(.05);
 let s=boss.snapshot();
 assert.equal(s.mode,'clockout','three committed counters must unlock final button');
 assert.ok(s.targets.stamp);
 boss.pointerDown({x:s.targets.stamp.x,y:s.targets.stamp.y,id:3});
 assert.equal(boss.snapshot().mode,'complete','single physical click must clock out');
 assert.equal(events.filter(e=>e.type==='boss-complete').length,1,'victory requires one physical action');
 assert.equal(events.find(e=>e.type==='boss-complete').boltsRemoved,3);
 boss.pointerDown({x:s.targets.stamp.x,y:s.targets.stamp.y,id:4});
 assert.equal(events.filter(e=>e.type==='boss-complete').length,1,'clock out cannot mint duplicate credit');
 console.log('PASS three committed counters + one giant CLOCK OUT click, no drag or duplicate');
}
