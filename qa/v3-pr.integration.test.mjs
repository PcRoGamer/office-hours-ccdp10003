import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createPrRunEventAdapter} from '../night-shift-v3/scenes/pr/system-bridge.js';
import {definitions} from '../night-shift-v3/scenes/pr/index.js';
const v={worldWidth:1200,worldHeight:760},p=(x,y)=>({x,y,id:1,kind:'mouse'});
function createRun(id){
 const calls=[],actions=new Set(),notices=new Map();
 const run={currentCardId:id,calls,
  recordAction(a){assert(a.objectId&&a.synthetic===false);assert(['correct','wrong'].includes(a.outcome));
   if(a.outcome==='correct'){assert(!actions.has(a.objectId),'duplicate '+a.objectId);actions.add(a.objectId);}
   calls.push(['action',a]);return true;},
  recordNotice(id,n){if(!notices.has(id))notices.set(id,n);calls.push(['notice',id,n]);},
  recordFrame(name){assert.equal(id,'P4');calls.push(['frame',name]);},
  completeCard(){if(id==='P4')assert(calls.some(x=>x[0]==='frame'));
    assert(actions.size>=({P1:2,P2:2,P3:1,P4:1})[id]);calls.push(['commit']);run.currentCardId=null;},
  failAttempt({reason,damage}){calls.push(['retry',reason,damage]);return 'retry';}
 };return {run,actions,notices,calls};
}
const play=(id,f,opts={})=>{
 const r=createRun(id),effects=[];
 const bridge=createPrRunEventAdapter({run:r.run,onEffect:e=>effects.push(e)});
 const scene=definitions.find(d=>d.id===id).create({events:bridge.events,run:opts});scene.enter();
 f(scene);return {...r,bridge,scene,effects};
};
test('P1 commits exact manual objects and signed/fake notice truth to ledger adapter',()=>{
 const r=play('P1',s=>{
  s.pointerDown(p(930,300),v);s.pointerUp(p(930,300),v);
  s.pointerDown(p(930,415),v);s.pointerMove(p(1100,250),v);s.pointerUp(p(1100,250),v);
  s.pointerDown(p(400,520),v);s.pointerMove(p(400,710),v);s.pointerUp(p(400,710),v);
  s.pointerDown(p(600,630),v);
 },{directive:'sponsored-workflow'});
 assert.equal(r.bridge.finalized,true);assert.equal(r.bridge.resolution.status,'success');
 assert(r.actions.has('pr:p1:axis'));assert(r.actions.has('pr:p1:send'));
 assert.equal(r.notices.get('pr:p1:verified-scale-tip').safelyHandled,true);
 assert.equal(r.notices.get('pr:p1:fake-creative').safelyHandled,true);
});
test('P2 real adversarial inputs produce independent ledger objects',()=>{
 const r=play('P2',s=>{
  s.pointerDown(p(300,280),v);s.pointerMove(p(30,80),v);s.pointerUp(p(30,80),v);
  s.pointerDown(p(750,450),v);s.pointerMove(p(1080,600),v);s.pointerUp(p(1080,600),v);
  s.pointerDown(p(550,360),v);s.pointerUp(p(550,360),v);
 });
 assert.equal(r.bridge.resolution.status,'success');assert.equal(r.notices.size,3);
 assert([...r.notices.values()].every(n=>n.safelyHandled));
});
test('P3 focus needs three distinct real marks',()=>{
 const r=play('P3',s=>{s.pointerDown(p(600,528),v);
  for(let i=0;i<400;i++){const st=s.snapshot(),target=Math.sin(st.time*(st.locked===2?2.5:1.5)+st.locked*.8)*.67;
   s.pointerMove(p(600+target*190,528),v);s.update(.04);if(st.locked===3)break;}
 });
 assert.equal(r.bridge.resolution.status,'success');assert.equal(r.actions.size,3);
});
test('P4 commits framing before card and emits exactly one downstream effect',()=>{
 const r=play('P4',s=>{s.pointerDown(p(600,402),v);s.pointerMove(p(805,565),v);s.pointerUp(p(805,565),v);});
 assert.deepEqual(r.calls.slice(-2).map(a=>a[0]),['frame','commit']);
 assert.equal(r.effects.length,1);assert.equal(r.effects[0].type,'quota-warning-card');
});
test('failed P4 attempt is rolled back without effect or score commit',()=>{
 const r=play('P4',s=>{for(let i=0;i<355;i++)s.update(.1);});
 assert.equal(r.bridge.resolution.status,'failure');assert.equal(r.calls.at(-1)[0],'retry');
 assert(!r.calls.some(x=>x[0]==='commit'));assert.equal(r.effects.length,0);
});
test('invalid scene provenance or wrong-card events fail closed',()=>{
 const r=createRun('P1'),bridge=createPrRunEventAdapter({run:r.run});
 assert.throws(()=>bridge.events.emit({type:'card-complete',cardId:'P4',outcome:'success'}),/differs/);
 assert.throws(()=>bridge.events.emit({type:'card-action',cardId:'P1',outcome:'correct'}),/provenance/);
});
