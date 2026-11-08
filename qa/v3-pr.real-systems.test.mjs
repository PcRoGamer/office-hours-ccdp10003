/**
 * A real cross-lane contract gate, not a scoring mock.
 * The source-only PR lane works independently; the gate activates automatically
 * once SYSTEMS/engine.js is integrated into the same checkout by LEAD.
 * For an independent before-merge run, make an isolated git worktree and copy
 * ONLY the Systems lane's files into that temporary test worktree.
 */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {definitions} from '../night-shift-v3/scenes/pr/index.js';
import {createPrRunEventAdapter} from '../night-shift-v3/scenes/pr/system-bridge.js';

const systemsUrl=new URL('../night-shift-v3/systems/engine.js',import.meta.url);
const v={worldWidth:1200,worldHeight:760};
const p=(x,y)=>({x,y,id:1,kind:'mouse'});
const expectedActions={I1:5,I2:2,I3:3,I4:3,S1:3,S2:2,S3:1,S4:1};

function reachPR(run,seed){
 // Other-department inputs are ONLY explicit integration-test preconditions.
 // They are not claims of human interaction or complete audiovisual gameplay.
 for(let step=0;step<30&&run.currentCardId!=='P1';step++){
  const st=run.stage;
  if(st.type==='card'){
   for(let i=0;i<expectedActions[st.id];i++)
    run.recordAction({objectId:'fixture:'+st.id+':'+i,outcome:'correct',gesture:'test-precondition'});
   if(st.id==='I1'){
    run.recordNotice('fixture:signed',{genuine:true,safelyHandled:true});
    run.recordNotice('fixture:scam',{genuine:false,safelyHandled:true});
   }
   if(st.id==='S2')run.recordWorker('mira-workstation',seed%2===0);
   run.tickActive(500);
   run.completeCard();
  } else if(st.type==='promotion')run.choosePerk(run.availableDraft[0]);
  else if(st.type==='boss'&&st.id==='printer'){
   for(let i=0;i<3;i++){
    run.recordBossAction('fixture-counter-'+i,{kind:'counter'});
    run.resolveBossCounter();
   }
  } else throw Error('unexpected precondition stage '+JSON.stringify(st));
 }
 assert.equal(run.currentCardId,'P1');
}
function runPR(run,seen){
 const active=run.currentDirective;
 seen.directives.add(active);
 const selected=run.deck.filter(x=>x[0]==='P');
 const effects=[];
 function play(id,gestures){
  assert.equal(run.currentCardId,id);
  const adapter=createPrRunEventAdapter({run,onEffect:e=>effects.push(e)});
  const scene=definitions.find(d=>d.id===id).create({run,events:adapter.events});
  scene.enter();gestures(scene);
  assert.equal(adapter.resolution?.status,'success',id+'/'+active+'/'+JSON.stringify(adapter.resolution));
  seen.cards.add(id);
 }
 play('P1',scene=>{
  if(active==='mandatory-collaboration')scene.pointerDown(p(770,630),v);
  if(active==='moving-goalposts')for(let i=0;i<24;i++)scene.update(.1);
  if(active==='sponsored-workflow'){
   scene.pointerDown(p(930,300),v);scene.pointerUp(p(930,300),v);
   scene.pointerDown(p(930,415),v);scene.pointerMove(p(1100,250),v);scene.pointerUp(p(1100,250),v);
  }
  scene.pointerDown(p(400,520),v);scene.pointerMove(p(400,710),v);scene.pointerUp(p(400,710),v);
  scene.pointerDown(p(active==='moving-goalposts'?720:active==='fast-or-safe'?645:600,630),v);
  if(active==='double-entry')scene.pointerDown(p(405,630),v);
 });
 if(selected[1]==='P2')play('P2',scene=>{
  scene.pointerDown(p(300,280),v);scene.pointerMove(p(30,80),v);scene.pointerUp(p(30,80),v);
  scene.pointerDown(p(750,450),v);scene.pointerMove(p(1080,600),v);scene.pointerUp(p(1080,600),v);
  scene.pointerDown(p(550,360),v);scene.pointerUp(p(550,360),v);
 });else play('P3',scene=>{
  scene.pointerDown(p(600,528),v);
  for(let i=0;i<500;i++){
   const st=scene.snapshot();
   const target=Math.sin(st.time*(st.locked===2?2.5:1.5)+st.locked*.8)*.67;
   scene.pointerMove(p(600+target*190,528),v);
   scene.update(.04);
   if(st.locked===3)break;
  }
 });
 play('P4',scene=>{
  if(active==='moving-goalposts')for(let i=0;i<26;i++)scene.update(.1);
  scene.pointerDown(p(600,402),v);
  scene.pointerMove(p(active==='moving-goalposts'?390:805,565),v);
  scene.pointerUp(p(active==='moving-goalposts'?390:805,565),v);
  if(active==='double-entry'){
   scene.pointerDown(p(600,402),v);
   scene.pointerMove(p(805,565),v);scene.pointerUp(p(805,565),v);
  }
  if(active==='fast-or-safe')for(let i=0;i<8;i++)scene.update(.1);
 });
 const entries=run.eventLedger;
 const completed=entries.filter(e=>e.kind==='card-complete'&&e.encounterId[0]==='P');
 assert.equal(completed.length,3,'one committed PR result per selected card');
 assert.deepEqual(completed.map(e=>e.authoredReferenceMs),selected.map(id=>({P1:14000,P2:12000,P3:12000,P4:14000})[id]));
 assert.equal(entries.find(e=>e.kind==='frame')?.outcome,'context');
 assert.deepEqual(effects,[{type:'quota-warning-card',leadSeconds:.6,uses:1,target:'the-quota'}]);
 assert.equal(run.stage.type,'promotion');
 assert.equal(run.stage.slot,3);
}
test('150 real event-sourced SYSTEMS runs cover both PR roster variants and all five directives',
 {skip:!existsSync(systemsUrl) && 'Systems module not yet merged into this isolated PR branch'},
 async()=>{
  const {NightShiftRun}=await import('../night-shift-v3/systems/engine.js');
  const seen={directives:new Set(),cards:new Set()};
  for(let seed=1;seed<=150;seed++){
   const run=new NightShiftRun({seed,firstRun:false,mode:'practice'});
   reachPR(run,seed);runPR(run,seen);
  }
  assert.deepEqual([...seen.directives].sort(),
   ['double-entry','fast-or-safe','mandatory-collaboration','moving-goalposts','sponsored-workflow'].sort());
  assert.deepEqual([...seen.cards].sort(),['P1','P2','P3','P4']);
 });
