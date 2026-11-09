import assert from 'node:assert/strict';
import {createDirector} from '../night-shift-v3/runtime/director.js';
const IDs=['I1','I2','I3','S1','S2','S3','P1','P2','P4','T1','T4','T3'];
const log=[];
const viewport={worldWidth:1351,worldHeight:760,cssWidth:1920,cssHeight:1080,
  worldToScreen(x,y){return {x:x*1080/760,y:y*1080/760}},
  screenToWorld(x,y){return {x:x*760/1080,y:y*760/1080}}};
const make=(id,boss=false)=>({id,imperative:boss?'DEFEAT '+id:'HANDLE '+id,authoredReferenceMs:18000,
  create(ctx){let called=false;return {enter(){},update(){
    if(called)return;called=true;const event={type:boss?'boss-complete':'card-complete',
      [boss?'bossId':'cardId']:id,attemptId:'mock-'+id,outcome:'cleared',evidence:{manual:true}};
    ctx.events.emit(event);ctx.events.emit(event); // deliberately duplicate; director must suppress double credit
  },draw(){},pointerDown(){},dispose(){},snapshot(){return {}}}}});
const all=IDs.map(x=>make(x)),bosses=[make('printer',true),make('quota',true)];
const d=createDirector({viewport,audio:{play(){}},events:{emit(e){log.push(e)}}});
assert.throws(()=>d.configureRun({cards:IDs,definitions:all}),/Missing authored boss/);
d.registerBosses(bosses);
d.configureRun({cards:IDs,draftProvider:({slot})=>({subject:'Promotion '+slot,directive:'DIRECTIVE '+slot,
  offers:[{id:'carbon-copy',title:'Carbon Copy'},{id:'bank-shot',title:'Bank Shot'},{id:'mira-backup',title:'Mira Backup'}]}),
 rng:()=>.3});
d.start();assert.equal(d.snapshot().currentCardId,'I1');
d.togglePause(true);const before=d.snapshot().clock;d.update(2);assert.equal(d.snapshot().clock,before);
d.togglePause(false);
let slots=[],steps=0;
while(d.mode!=='victory'&&steps++<100){
 if(d.mode==='promotion'){
   slots.push(d.snapshot().promotionSlot);
   assert.equal(d.snapshot().pendingPromotion.offers.length,3);
   assert.equal(d.pickPerk('carbon-copy'),true);
 }else if(['card','printer','quota'].includes(d.mode)){
   d.update(.1);d.update(.81);
 }else throw Error('Unexpected mode '+d.mode);
}
assert.equal(d.mode,'victory','full skeleton should reach victory after 12 cards + two bosses');
assert.deepEqual(slots,[0,1,2,3,4],'promotions must match canonical five slots');
assert.equal(d.snapshot().evidence.length,14,'exactly one committed event per encounter');
assert.equal(new Set(d.snapshot().evidence.map(x=>x.id)).size,14,'no duplicate event credit');
assert.equal(d.snapshot().completeCampaign,true);
assert.equal(log.filter(e=>e.type==='campaign-cleared').length,1);
console.log(JSON.stringify({pass:true,sceneCount:12,bossCount:2,promotionSlots:slots,
  committedEvents:d.snapshot().evidence.length,duplicateEventsRejected:true,pauseFrozen:true},null,2));