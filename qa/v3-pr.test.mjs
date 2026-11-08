import {test} from 'node:test';
import assert from 'node:assert/strict';
import {definitions} from '../night-shift-v3/scenes/pr/index.js';
const viewport={worldWidth:1200,worldHeight:760},p=(x,y,id=1)=>({x,y,id,kind:'mouse'});
function setup(id,run={}){const events=[];const scene=definitions.find(x=>x.id===id).create({events:{emit:e=>events.push(structuredClone(e))},run});scene.enter();return {events,scene,done:()=>events.filter(e=>e.type==='card-complete'),actions:()=>events.filter(e=>e.type==='card-action')};}
const assertWin=(x,id)=>{assert.equal(x.done().length,1);assert.equal(x.done()[0].cardId,id);assert.equal(x.done()[0].outcome,'success');};
test('four PR cards, unambiguous IDs, mandatory P1/P4 and correct interfaces',()=>{assert.deepEqual(definitions.map(d=>d.id),['P1','P2','P3','P4']);for(const d of definitions){assert.equal(d.department,'pr');assert.equal(typeof d.imperative,'string');assert.equal(typeof d.create,'function');const x=setup(d.id).scene;for(const method of ['enter','update','draw','pointerDown','pointerMove','pointerUp','cancelPointer','snapshot','dispose'])assert.equal(typeof x[method],'function');}});
test('P1 drag must correct axis to 0, preserving original 1,240 and 1,280',()=>{const x=setup('P1');x.scene.pointerDown(p(600,630),viewport);assert.equal(x.done().length,0);x.scene.pointerDown(p(400,520),viewport);x.scene.pointerMove(p(400,710),viewport);x.scene.pointerUp(p(400,710),viewport);assert.equal(x.scene.snapshot().baseline,0);x.scene.pointerDown(p(600,630),viewport);assertWin(x,'P1');const evidence=x.done()[0].evidence;assert.deepEqual(evidence.values,[1240,1280]);assert.equal(evidence.reportedDifference,40);assert.ok(Math.abs(evidence.percentageIncrease-3.22580645)<.0001);x.scene.pointerDown(p(600,630),viewport);assert.equal(x.done().length,1);});
test('P2 physical ad removal, no reward duplication and genuine signed alert',()=>{const x=setup('P2'); // Cards in z-order: real on top in center, sales at edges.
 const s=x.scene.snapshot();assert.equal(s.overlays.length,3);
 x.scene.pointerDown(p(300,280),viewport);x.scene.pointerMove(p(30,80),viewport);x.scene.pointerUp(p(30,80),viewport);
 x.scene.pointerDown(p(750,450),viewport);x.scene.pointerMove(p(1080,600),viewport);x.scene.pointerUp(p(1080,600),viewport);
 x.scene.pointerDown(p(550,360),viewport);x.scene.pointerUp(p(550,360),viewport);
 assertWin(x,'P2');assert.equal(x.done()[0].evidence.adsRemoved,2);assert.equal(x.done()[0].evidence.genuineHelpOpened,true);
 });
test('P3 requires genuine tracked moving focus hold and three locks',()=>{const x=setup('P3');x.scene.pointerDown(p(600,528),viewport);for(let i=0;i<400&&!x.done().length;i++){const s=x.scene.snapshot();const t=Math.sin(s.time*(s.locked===2?2.5:1.5)+s.locked*.8)*.67;x.scene.pointerMove(p(600+t*190,528),viewport);x.scene.update(.04);}assertWin(x,'P3');assert.equal(x.scene.snapshot().locked,3);assert.equal(x.actions().filter(e=>e.correct).length,3);});
for(const route of ['headline','context'])test(`P4 ${route} physically dispatches truthful report and real one-use effect`,()=>{const x=setup('P4',{events:[],miraIncident:null});x.scene.pointerDown(p(600,402),viewport);const dst=route==='headline'?p(385,565):p(805,565);x.scene.pointerMove(dst,viewport);x.scene.pointerUp(dst,viewport);assertWin(x,'P4');const e=x.done()[0].evidence;assert.equal(e.framing,route);assert.equal(e.facts.miraIncidentObserved,false);assert.equal(e.facts.before,1240);assert.equal(e.facts.after,1280);assert.equal(e.effect.type,route==='headline'?'priority-pass':'quota-warning-card');assert.equal(e.effect.uses,1);});
test('all four scenes timeout exactly once and do not progress while not updated',()=>{for(const d of definitions){const x=setup(d.id);x.scene.update(0);assert.equal(x.scene.snapshot().time,0);for(let i=0;i<1000&&!x.done().length;i++)x.scene.update(.1);assert.equal(x.done().length,1,`${d.id} times out`);assert.equal(x.done()[0].outcome,'failure');x.scene.update(.1);assert.equal(x.done().length,1);}});
test('snapshot is immutable to outsiders',()=>{const x=setup('P2');const snap=x.scene.snapshot();snap.overlays[0].removed=true;assert.equal(x.scene.snapshot().overlays[0].removed,false);});

 
// Regression from independent QA_GAME PR #12: scoring reference times must never
// silently inherit a longer introductory shutter allowance.
test('scoring references match authoritative v3 contract, independent of shutters',async()=>{
 const fs=await import('node:fs');
 const contract=JSON.parse(fs.readFileSync(new URL('../design/v3/contract.json',import.meta.url),'utf8'));
 for(const d of definitions){
  const canonical=contract.card_pool.find(c=>c.id===d.id);
  assert.ok(canonical,`missing canonical ${d.id}`);
  assert.equal(d.authoredReferenceMs,canonical.authoredReferenceMs,`${d.id} scoring reference`);
  assert.ok(d.seconds*1000>d.authoredReferenceMs,`${d.id} accessible play window`);
  const x=setup(d.id);for(let i=0;i<600&&!x.done().length;i++)x.scene.update(.1);
  assert.equal(x.done()[0].evidence.authoredReferenceMs,canonical.authoredReferenceMs);
 }
});
test('P1 cannot submit misleading chart after correcting then undoing zero baseline',()=>{
 const x=setup('P1');
 x.scene.pointerDown(p(400,520),viewport);x.scene.pointerMove(p(400,705),viewport);x.scene.pointerUp(p(400,705),viewport);
 assert.equal(x.scene.snapshot().corrected,true);
 x.scene.pointerDown(p(400,520),viewport);x.scene.pointerMove(p(400,465),viewport);x.scene.pointerUp(p(400,465),viewport);
 assert.ok(x.scene.snapshot().baseline>0);assert.equal(x.scene.snapshot().corrected,false);
 x.scene.pointerDown(p(600,630),viewport);assert.equal(x.done().length,0);assert.equal(x.actions().at(-1).correct,false);
 x.scene.pointerDown(p(400,520),viewport);x.scene.pointerMove(p(400,720),viewport);x.scene.pointerUp(p(400,720),viewport);
 x.scene.pointerDown(p(600,630),viewport);assertWin(x,'P1');
});
test('P2 genuine-help dismissal penalised, reversible and never awards success',()=>{
 const x=setup('P2');
 x.scene.pointerDown(p(550,360),viewport);x.scene.pointerMove(p(780,100),viewport);x.scene.pointerUp(p(780,100),viewport);
 assert.equal(x.done().length,0);assert.ok(x.actions().some(e=>e.kind==='dismiss-genuine-help'&&!e.correct));
 assert.ok(x.scene.snapshot().overlays.find(o=>o.id==='real').removed);
 for(let i=0;i<10;i++)x.scene.update(.1);
 assert.equal(x.scene.snapshot().overlays.find(o=>o.id==='real').removed,false);
});
test('invalid/negative time steps never advance or poison scene clock',()=>{
 for(const d of definitions){
  const x=setup(d.id);x.scene.update(NaN);x.scene.update(-500);x.scene.update(Infinity);
  assert.equal(x.scene.snapshot().time,0,`${d.id} invalid time`);
  x.scene.update(.06);assert.equal(x.scene.snapshot().time,.06);assert.ok(Number.isFinite(x.scene.snapshot().flash));
 }
});

test('P4 moving-goalposts directive physically swaps exits, visuals and hitboxes together',()=>{
 const x=setup('P4',{directive:'moving-goalposts',events:[]});
 for(let i=0;i<32;i++)x.scene.update(.1);
 const state=x.scene.snapshot();assert.equal(state.goalposts,true);assert.equal(state.routeShift,1);
 x.scene.pointerDown(p(600,402),viewport);x.scene.pointerMove(p(390,565),viewport);x.scene.pointerUp(p(390,565),viewport);
 assertWin(x,'P4');assert.equal(x.done()[0].evidence.framing,'context');
 assert.equal(x.done()[0].evidence.effect.type,'quota-warning-card');
 assert.equal(x.events.filter(e=>e.type==='directive-shift').length,1);
});
test('P4 moving-goalposts rail freezes while carrying a report',()=>{
 const x=setup('P4',{directive:'moving-goalposts'});x.scene.update(.1);
 x.scene.pointerDown(p(600,402),viewport);
 for(let i=0;i<35;i++)x.scene.update(.1);
 assert.equal(x.scene.snapshot().routeShift,0);
 x.scene.pointerUp(p(600,402),viewport);
 for(let i=0;i<15;i++)x.scene.update(.1);
 assert.equal(x.scene.snapshot().routeShift,1);
});

test('P1 Sponsored Workflow exposes signed help and dismissible fraudulent cosmetic ad without bypassing manual scale',()=>{
 const x=setup('P1',{directive:'sponsored-workflow'});
 assert.equal(x.scene.snapshot().sponsored,true);
 x.scene.pointerDown(p(930,300),viewport);x.scene.pointerUp(p(930,300),viewport);
 assert.equal(x.scene.snapshot().tipOpened,true);
 assert.equal(x.scene.snapshot().baseline,1200);assert.equal(x.done().length,0);
 x.scene.pointerDown(p(930,415),viewport);x.scene.pointerMove(p(1100,250),viewport);x.scene.pointerUp(p(1100,250),viewport);
 assert.equal(x.scene.snapshot().fakeDismissed,true);
 assert.equal(x.actions().filter(e=>e.correct).length,2);
 x.scene.pointerDown(p(400,520),viewport);x.scene.pointerMove(p(400,720),viewport);x.scene.pointerUp(p(400,720),viewport);
 x.scene.pointerDown(p(600,630),viewport);assertWin(x,'P1');
});

test('P2 thrown ad physically shields projector and extends only shutter, not scoring reference',()=>{
 const x=setup('P2');
 x.scene.pointerDown(p(220,230),viewport);x.scene.pointerMove(p(720,245),viewport);x.scene.pointerUp(p(720,245),viewport);
 const st=x.scene.snapshot();assert.equal(st.coverBeats,1);assert.equal(st.graceSeconds,.8);
 assert.equal(x.events.filter(e=>e.type==='popup-cover').length,1);
 assert.equal(x.events.filter(e=>e.type==='popup-cover')[0].bonusWindowSeconds,.8);
 assert.equal(x.done().length,0);
 for(let i=0;i<322;i++)x.scene.update(.1);
 assert.equal(x.done().length,0);
 for(let i=0;i<10;i++)x.scene.update(.1);
 assert.equal(x.done()[0].outcome,'failure');
 assert.equal(x.done()[0].evidence.authoredReferenceMs,12000);
});


test('every resolved PR action is compatible with SYSTEMS immutable manual-action contract',()=>{
  const paths=[];
  {
    const x=setup('P1',{directive:'sponsored-workflow'});
    x.scene.pointerDown(p(930,300),viewport);x.scene.pointerUp(p(930,300),viewport);
    x.scene.pointerDown(p(930,415),viewport);x.scene.pointerMove(p(1100,250),viewport);x.scene.pointerUp(p(1100,250),viewport);
    x.scene.pointerDown(p(400,520),viewport);x.scene.pointerMove(p(400,710),viewport);x.scene.pointerUp(p(400,710),viewport);
    x.scene.pointerDown(p(600,630),viewport);paths.push(x);
  }
  {
    const x=setup('P2');
    x.scene.pointerDown(p(300,280),viewport);x.scene.pointerMove(p(30,80),viewport);x.scene.pointerUp(p(30,80),viewport);
    x.scene.pointerDown(p(750,450),viewport);x.scene.pointerMove(p(1080,600),viewport);x.scene.pointerUp(p(1080,600),viewport);
    x.scene.pointerDown(p(550,360),viewport);x.scene.pointerUp(p(550,360),viewport);paths.push(x);
  }
  {
    const x=setup('P3');x.scene.pointerDown(p(600,528),viewport);
    for(let i=0;i<400&&!x.done().length;i++){const s=x.scene.snapshot(),t=Math.sin(s.time*(s.locked===2?2.5:1.5)+s.locked*.8)*.67;x.scene.pointerMove(p(600+t*190,528),viewport);x.scene.update(.04);}paths.push(x);
  }
  {
    const x=setup('P4',{directive:'moving-goalposts'});for(let i=0;i<26;i++)x.scene.update(.1);
    x.scene.pointerDown(p(600,402),viewport);x.scene.pointerMove(p(390,565),viewport);x.scene.pointerUp(p(390,565),viewport);paths.push(x);
  }
  const required={P1:2,P2:2,P3:1,P4:1};
  for(const x of paths){
    assert.equal(x.done().length,1);const id=x.done()[0].cardId;
    const resolved=new Set(),correct=x.actions().filter(a=>a.correct);
    assert.ok(correct.length>=required[id],id+' insufficient real actions');
    for(const action of x.actions()){
      assert.equal(action.cardId,id);assert.equal(action.synthetic,false);
      assert.equal(typeof action.objectId,'string');assert.ok(action.objectId.length>0);
      assert.equal(action.outcome,action.correct?'correct':'wrong');
      assert.equal(action.gesture,'pointer');assert.ok(Number.isSafeInteger(action.actionSerial));
      if(action.correct){assert.ok(!resolved.has(action.objectId),id+' duplicate reward');resolved.add(action.objectId);}
    }
  }
});
test('invalid timestep never poisons animations or game logic while P2/P3 are in motion',()=>{
  const x=setup('P2');
  x.scene.pointerDown(p(220,230),viewport);x.scene.pointerMove(p(720,245),viewport);x.scene.pointerUp(p(720,245),viewport);
  const before=x.scene.snapshot();
  for(const dt of [NaN,Infinity,-100,undefined])x.scene.update(dt);
  const after=x.scene.snapshot();
  assert.deepEqual(after.flight,before.flight);assert.equal(after.coverShield,before.coverShield);assert.equal(after.time,before.time);
  const y=setup('P3');y.scene.pointerDown(p(600,528),viewport);
  for(const dt of [NaN,Infinity,-100,undefined])y.scene.update(dt);
  assert.equal(y.scene.snapshot().charge,0);assert.equal(y.scene.snapshot().time,0);assert.equal(y.scene.snapshot().sideways,0);
});
test('scene cannot reward after completion even with stray pointer releases',()=>{
  const x=setup('P4');x.scene.pointerDown(p(600,402),viewport);
  x.scene.pointerMove(p(380,565),viewport);x.scene.pointerUp(p(380,565),viewport);
  const count=x.actions().length;x.scene.pointerDown(p(600,402),viewport);
  x.scene.pointerMove(p(805,565),viewport);x.scene.pointerUp(p(805,565),viewport);
  assert.equal(x.actions().length,count);assert.equal(x.done().length,1);
});
