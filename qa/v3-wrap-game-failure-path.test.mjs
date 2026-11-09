// Release-critical regression: failure emitted during scene.update must not award victory/advance.
// This is a deterministic harness over production director, not a physical browser test.
import assert from 'node:assert/strict';
import {createDirector} from '../night-shift-v3/runtime/director.js';
import {FIRST_DECK} from '../night-shift-v3/systems/core.js';
const events=[],viewport={worldWidth:1351,worldHeight:760,cssWidth:1920,cssHeight:1080};
const defs=FIRST_DECK.map(id=>({id,create(ctx){let sent=false;return {enter(){},
 update(){if(id==='I1'&&!sent){sent=true;ctx.events.emit({type:'card-failed',cardId:'I1',reason:'MISSED FORM',attemptId:'qa-real-failure'});}},
 snapshot(){return {id,sent}},dispose(){},cancelPointer(){}};}}));
const bosses=['printer','quota'].map(id=>({id,create(){return {enter(){},update(){},dispose(){}}}}));
const d=createDirector({viewport,events:{emit:e=>events.push(e)},audio:{play(){}}});
d.configureRun({cards:FIRST_DECK,definitions:defs,bosses,
 draftProvider:()=>({offers:[{id:'a'},{id:'b'},{id:'c'}]}),rng:()=>0.5});
d.start();
assert.equal(d.mode,'card');
d.update(0.05);
const s=d.snapshot();
assert.equal(s.hearts,2,'one failure removes exactly one heart');
assert.equal(s.evidence.length,0,'failed encounter must never receive completion credit');
assert.equal(s.mode,'recover','FAILED I1 MUST OFFER RETRY, not silently skip to I2: '+JSON.stringify({mode:s.mode,card:s.currentCardId,hearts:s.hearts,evidence:s.evidence}));
assert.equal(d.retry(),true);
assert.equal(d.snapshot().currentCardId,'I1','retry must replay exact failed card');
console.log('PASS director failure during scene.update preserves retry and original card');