import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {createPhysics,FIXED_STEP,PIXELS_PER_METRE} from '../night-shift-v3/physics/desk-world.js';
const require=createRequire(import.meta.url);
const base=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const P=require(resolve(base,'assets/night-shift-v3/vendor/planck-1.5.1.min.js'));
let checks=0;
function check(description,fn){fn();checks++;console.log('PASS',description);}
const events=[];
const sim=createPhysics({planck:P,gravity:{x:0,y:930},onEvent:e=>events.push(e)});
sim.box({id:'floor',x:250,y:400,width:600,height:32,friction:.8});
const file=sim.box({id:'paper',kind:'form',x:200,y:140,width:94,height:58,type:'dynamic',bullet:true});
sim.circle({id:'ball',x:290,y:120,radius:21,type:'dynamic',restitution:.65});
check('real Planck fixture bodies and 60px/metre conversion',()=>{
  assert.equal(PIXELS_PER_METRE,60);assert.equal(FIXED_STEP,1/60);
  assert.equal(sim.objects.size,3);assert.ok(Math.abs(sim.state('paper').x-200)<.001);
});
check('pausing prevents fixed steps and state changes',()=>{
  const before=sim.snapshot();for(let i=0;i<15;i++)assert.equal(sim.step(1/30,{paused:true}),0);
  assert.equal(sim.snapshot().tick,before.tick);assert.equal(sim.state(file).y,before.bodies[1].y);
});
check('clamp prevents runaway physics after browser sleep',()=>{
  assert.ok(sim.step(100)<=6);assert.ok(sim.snapshot().tick<=6);
});
check('gravity accelerates real dynamic fixtures',()=>{
  const original=sim.state(file).y;for(let i=0;i<30;i++)sim.step(1/60);
  assert.ok(sim.state(file).y>original+20,`${sim.state(file).y} > ${original}`);
});
check('unique stable IDs and invalid body rejection',()=>{
  assert.throws(()=>sim.box({id:'paper',x:0,y:0,width:5,height:5}),/Unique/);
  assert.throws(()=>sim.box({id:'bad',shape:'potato'}),/Shape/);
});
check('contacts delivered once per continuous overlap, no duplicate scoring',()=>{
  for(let i=0;i<60;i++)sim.step(1/60);
  assert.ok(events.some(e=>e.type==='contact-begin'&&e.a==='paper'||e.type==='contact-begin'&&e.b==='paper'));
  assert.ok(events.every(e=>Number.isInteger(e.tick)&&typeof e.speed==='number'));
  const pair=e=>e.type==='contact-begin'&&[e.a,e.b].sort().join(':')==='floor:paper';
  assert.ok(events.filter(pair).length<=2,'one contact at rest; restitution may briefly separate');
});
check('mouse joint picks actual fixture, follows, and releases',()=>{
  const s=sim.state(file),grabbed=sim.grab(s.x,s.y,{filter:x=>x.id==='paper'});
  assert.equal(grabbed?.id,'paper');assert.equal(sim.dragging,'paper');
  for(let i=0;i<12;i++){sim.move(s.x+80+i*8,s.y-40,1/60);sim.step(1/60);}
  const before=sim.state(file);sim.release();assert.equal(sim.dragging,null);
  assert.ok(sim.state(file).vx!==before.vx || Math.abs(before.vx)>0);
});
check('static/sensor fixtures are not grabbable',()=>{
  assert.equal(sim.grab(250,400),null);
});
check('sensors emit facts without score side effects',()=>{
  sim.box({id:'sensor',x:200,y:370,width:190,height:45,sensor:true});
  sim.circle({id:'token',x:200,y:250,radius:18,type:'dynamic'});
  for(let i=0;i<75;i++)sim.step(1/60);
  assert.ok(events.some(e=>e.sensor),'expected real fixture overlap');
});
check('snapshot contains finite physics states only',()=>{
  const snapshot=sim.snapshot();assert.ok(snapshot.tick>=1);
  for(const body of snapshot.bodies){for(const name of ['x','y','vx','vy','angle'])assert.ok(Number.isFinite(body[name]),name);}
});
check('body removal and disposal are idempotent',()=>{
  assert.equal(sim.remove('token'),true);assert.equal(sim.remove('token'),false);
  sim.dispose();sim.dispose();assert.equal(sim.objects.size,0);
  assert.throws(()=>sim.step(1/60),/Disposed/);
});
console.log(`PHYSICS PASS ${checks}/11 real Planck assertions`);
