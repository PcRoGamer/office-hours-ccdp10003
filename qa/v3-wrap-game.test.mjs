// Night Shift v3 finalization GAME_QA: deterministic system coverage and adversarial director regression.
// Run from the repository root: node qa/v3-wrap-game.test.mjs
import assert from 'node:assert/strict';
import {CARDS,FIRST_DECK,DIRECTIVES,PERKS,ACTIVATION,createDeck,validateDeck,assignDirectives,
  validateSchedule,makeDraft,makeRng,buildStages} from '../night-shift-v3/systems/core.js';
import {createDirector} from '../night-shift-v3/runtime/director.js';
import {definitions as intake} from '../night-shift-v3/scenes/intake/index.js';
import {definitions as services} from '../night-shift-v3/scenes/services/index.js';
import {definitions as pr} from '../night-shift-v3/scenes/pr/index.js';
import {definitions as staff} from '../night-shift-v3/scenes/staff/index.js';
import {definitions as printer} from '../night-shift-v3/bosses/printer/index.js';
import {definitions as quota} from '../night-shift-v3/bosses/quota/quota.mjs';

let count=0;
function check(name,fn){fn();count++;console.log('PASS '+name);}
const originals=[...intake,...services,...pr,...staff];
check('All sixteen actual authored scene exports implement create()',()=>{
 assert.equal(originals.length,16);
 assert.deepEqual(new Set(originals.map(s=>s.id)),new Set(CARDS.map(c=>c.id)));
 for(const d of originals)assert.equal(typeof d.create,'function','Missing implementation '+d.id);
 assert.equal(typeof printer[0].create,'function');
 assert.equal(typeof quota[0].create,'function');
});
check('First shift is exactly twelve diverse authored cards',()=>{
 assert.equal(validateDeck(FIRST_DECK),true);
 assert.equal(new Set(FIRST_DECK).size,12);
 assert.equal(FIRST_DECK.length,12);
 assert.deepEqual(buildStages(FIRST_DECK).filter(s=>s.type==='promotion').map(s=>s.slot),[0,1,2,3,4]);
 assert.deepEqual(buildStages(FIRST_DECK).filter(s=>s.type==='boss').map(s=>s.id),['printer','quota']);
});
const seen=new Set(),schedules=new Set(),decks=new Set();const seedSamples=[];
check('4096 replay seeds: all 16 cards reachable, legal schedules, reproducibility',()=>{
 for(let seed=0;seed<4096;seed++){
   const deck=createDeck(seed);
   assert.equal(validateDeck(deck),true,'Invalid deck seed '+seed);
   assert.deepEqual(deck,createDeck(seed),'Nondeterministic seed '+seed);
   const schedule=assignDirectives(seed,deck);
   assert.equal(validateSchedule(schedule,deck),true,'Invalid directive schedule '+seed);
   assert.deepEqual(schedule,assignDirectives(seed,deck),'Nondeterministic directive '+seed);
   assert.equal(new Set(schedule).size,5,'Directive repeat seed '+seed);
   for(const id of deck)seen.add(id);
   decks.add(deck.join(','));
   schedules.add(schedule.join(','));
   if(seedSamples.length<8 && [...seen].length===16)seedSamples.push(seed);
 }
 assert.deepEqual(seen,new Set(CARDS.map(c=>c.id)),'Some authored cards unreachable');
 assert.ok(decks.size>=10,'Insufficient roster variability '+decks.size);
 assert.ok(schedules.size>=5,'Insufficient directive variability '+schedules.size);
});
check('Five perks offered at each promotion have legal upcoming physical activation',()=>{
 for(const seed of [0,1,4,17,42,1234,98765]){
   const deck=createDeck(seed),levels={};
   const stages=buildStages(deck);
   for(let slot=0;slot<5;slot++){
     const offers=makeDraft(seed,slot,levels,deck);
     assert.equal(offers.length,3);
     assert.equal(new Set(offers).size,3);
     const position=stages.findIndex(s=>s.type==='promotion'&&s.slot===slot);
     const next=stages.slice(position+1).filter(s=>s.type==='card'||s.type==='boss').slice(0,2).map(s=>s.id);
     for(const perk of offers){
       assert.ok(PERKS.includes(perk));
       assert.ok((levels[perk]||0)<2);
       assert.ok(ACTIVATION[perk].some(id=>next.includes(id)),'Invisible perk '+perk+' slot '+slot);
     }
     levels[offers[0]]=(levels[offers[0]]||0)+1;
   }
 }
});
check('Rejected malformed rosters and duplicate/extraneous cards',()=>{
 for(const bad of [FIRST_DECK.slice(1),[...FIRST_DECK.slice(0,11),'I1'],
   [...FIRST_DECK.slice(0,11),'X9'], [...FIRST_DECK].reverse(),[]])
   assert.equal(validateDeck(bad),false);
});
const viewport={worldWidth:1351,worldHeight:760,cssWidth:1920,cssHeight:1080,
  worldToScreen(x,y){return {x:x*1080/760,y:y*1080/760}},
  screenToWorld(x,y){return {x:x*760/1080,y:y*760/1080}}};
function fixture({auto=true}={}){
 const output=[],defs=CARDS.map(c=>({id:c.id,imperative:c.imperative,authoredReferenceMs:c.authoredReferenceMs,
   create(ctx){let sent=false;return {enter(){},update(){
     if(!auto||sent)return;sent=true;
     const e={type:'card-complete',cardId:c.id,attemptId:'actual-fixture-attempt',outcome:'cleared',evidence:{source:'QA fixture'}};
     ctx.events.emit(e);ctx.events.emit(e);
   },draw(){},dispose(){},cancelPointer(){},snapshot(){return {}}};}}));
 const bosses=['printer','quota'].map(id=>({id,create(ctx){let sent=false;return {enter(){},update(){
    if(!auto||sent)return;sent=true;
    const e={type:'boss-complete',bossId:id,outcome:'cleared',evidence:{source:'QA fixture'}};
    ctx.events.emit(e);ctx.events.emit(e);
 },draw(){},dispose(){},cancelPointer(){},snapshot(){return {}}};}}));
 const d=createDirector({viewport,events:{emit:e=>output.push(e)},audio:{play(){}}});
 const deck=createDeck(73);
 d.configureRun({cards:deck,definitions:defs,bosses,draftProvider:({slot})=>({
    offers:makeDraft(73,slot,d.snapshot().perkLevels,deck).map(id=>({id,title:id})),
    directive:DIRECTIVES[slot],directiveId:DIRECTIVES[slot]}),rng:makeRng(73)});
 return {d,output,deck};
}
check('Director pauses gameplay, then completes all 12 cards + 2 bosses without duplicate credit',()=>{
 const {d,output,deck}=fixture();
 d.start();assert.equal(d.snapshot().mode,'card');
 d.togglePause(true);const before=d.snapshot().elapsed;d.update(7);
 assert.equal(d.snapshot().elapsed,before);
 d.togglePause(false);
 let steps=0,promotions=0;
 while(d.mode!=='victory'&&steps++<70){
   if(d.mode==='promotion'){assert.equal(d.snapshot().pendingPromotion.offers.length,3);
     assert.equal(d.pickPerk(d.snapshot().pendingPromotion.offers[0]),true);promotions++;
   }else if(['card','printer','quota'].includes(d.mode)){d.update(.1);d.update(.81);}
   else assert.fail('Unexpected state '+d.mode);
 }
 assert.equal(d.mode,'victory');
 assert.equal(promotions,5);
 assert.deepEqual(d.snapshot().evidence.map(e=>e.id),[...deck.slice(0,6),'printer',...deck.slice(6),'quota']);
 assert.equal(d.snapshot().evidence.length,14);
 assert.equal(output.filter(e=>e.type==='campaign-cleared').length,1);
 assert.equal(d.snapshot().completeCampaign,true);
});
check('Director loss/retry damage is one heart per failed attempt; pause holds countdown',()=>{
 const {d}=fixture({auto:false});
 d.start();
 d.togglePause(true);d.update(100);assert.equal(d.snapshot().mode,'card');
 d.togglePause(false);
 for(let attempt=0;attempt<3;attempt++){
   d.update(120);
   assert.equal(d.mode,'recover');
   assert.equal(d.hearts,2-attempt);
   assert.equal(d.snapshot().evidence.length,0,'Failed attempt must not score');
   assert.equal(d.retry(),true,'Retry/union-break should be available');
   assert.equal(d.mode,'card');
 }
 assert.equal(d.hearts,3,'One union break should replenish exactly three hearts');
 assert.equal(d.snapshot().continueUsed,true);
 for(let attempt=0;attempt<3;attempt++){
   d.update(120);assert.equal(d.mode,'recover');
   const resumed=d.retry();if(attempt===2){assert.equal(resumed,false);assert.equal(d.mode,'gameover');}
   else assert.equal(resumed,true);
 }
 assert.equal(d.snapshot().evidence.length,0,'No phantom scoring on failure');
});
check('Director rejects a second completion credit in same active encounter',()=>{
 const {d}=fixture({auto:true});d.start();d.update(.1);
 assert.equal(d.snapshot().evidence.length,1);
 d.update(.1);assert.equal(d.snapshot().evidence.length,1);
});
console.log(JSON.stringify({pass:true,assertionGroups:count,reachableAuthored:[...seen].sort(),
  uniqueDecks:decks.size,uniqueDirectiveSchedules:schedules.size,fixtureCaveat:'Director stress tests use synthetic test scenes; actual card interactions require browser QA'},null,2));
