import test from 'node:test';
import assert from 'node:assert/strict';
import {scenePerkLevels,withScenePerkAliases,withPerkCompatibleDefinitions} from '../night-shift-v3/finalization/perks/context-aliases.js';
import {definitions as staff} from '../night-shift-v3/scenes/staff/index.js';
import {definitions as printer} from '../night-shift-v3/bosses/printer/index.js';
import {definitions as quota} from '../night-shift-v3/bosses/quota/quota.mjs';
import {definitions as intake} from '../night-shift-v3/scenes/intake/index.js';

const viewport={worldWidth:1200,worldHeight:760,cssWidth:1200,cssHeight:760,
 worldToScreen(x,y){return {x,y}},screenToWorld(x,y){return {x,y}}};
const run=(levels={})=>({perks:levels,perkLevels:levels,activeDirective:'moving-goalposts',directive:'moving-goalposts',
 completedCards:['I1','I2','I3','S1','S2','S3']});
function sceneFrom(def,levels,enhanced=true,events=[]){
 const spec=enhanced?withPerkCompatibleDefinitions([def])[0]:def;
 const scene=spec.create({viewport,run:run(levels),events:{emit:e=>events.push(e)},audio:{play(){}},options:{}});
 scene.enter?.();
 return scene;
}
test('aliases canonical ids without inventing perks or modifying score/director state',()=>{
 const source=Object.freeze({'magnet-grip':1,'mira-backup':2,'bank-shot':1});
 const aliases=scenePerkLevels(source,source);
 assert.equal(aliases['perk:magnet-grip'],1);
 assert.equal(aliases['perk:teamwork'],2);
 assert.equal(aliases['perk:bank-shot'],1);
 assert.equal(aliases['carbon-copy'],undefined);
 assert.equal(aliases['perk:carbon-copy'],undefined);
 assert.deepEqual(source,{'magnet-grip':1,'mira-backup':2,'bank-shot':1});
 assert.equal(Object.isFrozen(aliases),true);
 assert.equal(scenePerkLevels({},{} )['perk:teamwork'],undefined);
});
test('late promotion is visible through live getters, not a frozen earlier draft',()=>{
 const owned={};const base={get perks(){return owned},get perkLevels(){return owned},get hearts(){return 2}};
 const view=withScenePerkAliases(base);
 assert.equal(view.hearts,2);
 assert.equal(view.perks['perk:magnet-grip'],undefined);
 owned['magnet-grip']=1;assert.equal(view.perks['perk:magnet-grip'],1);
 owned['mira-backup']=1;assert.equal(view.perkLevels['perk:teamwork'],1);
 assert.equal(Object.keys(owned).length,2);
});
test('authored T2 physical grab works with real MAGNET GRIP selection, not with inert bare key',()=>{
 const def=staff.find(x=>x.id==='T2');
 function grab(enhanced){
   const scene=sceneFrom(def,{'magnet-grip':1},enhanced);
   const original=scene.snapshot().boxes[0];
   const at={x:original.x+57,y:original.y,id:1};
   scene.pointerDown(at);scene.pointerMove({x:at.x+60,y:at.y,id:1});
   scene.pointerUp({x:at.x+60,y:at.y,id:1});
   const moved=scene.snapshot().boxes[0].x-original.x;
   scene.dispose();return moved;
 }
 assert.equal(grab(false),0,'baseline bug must be reproduced, not assumed');
 assert.ok(grab(true)>40,'MAGNET GRIP must widen the real crate hitbox');
 const without=sceneFrom(def,{},true);
 const original=without.snapshot().boxes[0];
 const at={x:original.x+57,y:original.y,id:1};
 without.pointerDown(at);without.pointerMove({x:at.x+60,y:at.y,id:1});
 assert.equal(without.snapshot().boxes[0].x,original.x,'no unearned assist');
 without.dispose();
});
test('authored Printer Mutiny recognizes earned MIRA BACKUP as physical support',()=>{
 const def=printer[0];
 const orig=sceneFrom(def,{'mira-backup':1},false);
 assert.equal(orig.snapshot().hasMira,false,'baseline bug must be observable');
 orig.dispose();
 const out=[];
 const fixed=sceneFrom(def,{'mira-backup':1},true,out);
 assert.equal(fixed.snapshot().hasMira,true,'Mira assistance now physically available');
 // Advance the actual three-phase boss FSM, not a fixture.
 for(let i=0;i<71;i++) fixed.update(.05);
 assert.equal(fixed.snapshot().phase,'jam');
 for(let i=0;i<12;i++) fixed.update(.05);
 assert.equal(fixed.snapshot().safePull,true);
 fixed.pointerDown({id:1,x:-104,y:104});
 fixed.pointerMove({id:1,x:-104,y:224});
 fixed.pointerUp({id:1,x:-104,y:224});
 assert.equal(fixed.snapshot().phase,'counter');
 fixed.pointerDown({id:2,x:260,y:153});
 assert.equal(out.filter(e=>e.type==='printer-mira-assist').length,1,'only real tap awards Mira assist');
 fixed.pointerDown({id:3,x:260,y:153});
 assert.equal(out.filter(e=>e.type==='printer-mira-assist').length,1,'support is single-use this cycle');
 fixed.dispose();
});
test('QUOTA and Intake retain their canonical bare keys; wrapped definitions do not mutate exports',()=>{
 const q=quota[0],i=intake[0];
 const wrapped=withPerkCompatibleDefinitions([q,i]);
 assert.equal(wrapped[0].id,q.id);assert.equal(wrapped[1].id,i.id);
 assert.equal(wrapped[0]===q,false);
 assert.equal(q.create,quota[0].create);
 const s=sceneFrom(i,{'time-bank':1,'focus-lens':1},true);
 assert.ok(s.timeLeft>20,'real Intake time bank still works with canonical bare key');
 s.dispose();
});
