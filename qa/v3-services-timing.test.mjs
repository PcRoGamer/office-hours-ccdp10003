/** Night Shift SERVICES real scene FSM regression tests. Run: node --test qa/v3-services-timing.test.mjs */
import test from 'node:test';
import assert from 'node:assert/strict';
import {definitions} from '../night-shift-v3/scenes/services/index.js';

const D=475;
function make(id,directive=''){
  const events=[];
  const game=definitions.find(x=>x.id===id).create({
    viewport:{worldWidth:1200},options:{directive,attemptId:'qa-'+id},
    events:{emit:e=>events.push(e)},audio:{play(){}}
  });
  return {game,events};
}
function advance(game,secs){for(let i=0;i<Math.round(secs/.05);i++)game.update(.05)}
function completed(events){return events.filter(e=>e.type==='card-complete')}

test('S3 latches green safe window at grab, not red release',()=>{
  const {game,events}=make('S3');game.update(.01);
  assert.equal(game.snapshot().safe,true);
  game.pointerDown({x:600,y:477});advance(game,1.6);
  assert.equal(game.snapshot().safe,false);assert.equal(game.snapshot().grabSafe,true);
  game.pointerMove({x:600+D*.67,y:571});game.pointerUp({x:600+D*.67,y:571});
  assert.equal(completed(events).length,1);assert.equal(game.snapshot().errors,0);
});
test('S3 unsafe initial grab cannot be laundered by waiting for green',()=>{
  const {game,events}=make('S3');advance(game,1.6);
  assert.equal(game.snapshot().safe,false);game.pointerDown({x:600,y:477});
  advance(game,1.6);assert.equal(game.snapshot().safe,true);
  game.pointerMove({x:600+D*.67,y:571});game.pointerUp({x:600+D*.67,y:571});
  assert.equal(completed(events).length,0);assert.equal(game.snapshot().errors,1);
  assert.ok(game.snapshot().resetTime>0);
});
test('S3 cancelling the pointer resets the safe latch',()=>{
  const {game}=make('S3');game.update(.01);game.pointerDown({x:600,y:477});
  assert.equal(game.snapshot().grabSafe,true);game.cancelPointer();
  assert.equal(game.snapshot().grabSafe,false);assert.equal(game.snapshot().grab,false);
});
test('S4 socket hold must be continuous, not repeated short clicks',()=>{
  const {game}=make('S4');
  for(let i=0;i<3;i++){
    game.pointerDown({x:600-D*.59,y:518});advance(game,.4);
    game.pointerUp({x:600-D*.59,y:518});
    assert.equal(game.snapshot().held,0);assert.equal(game.snapshot().mode,'hold');
  }
  game.pointerDown({x:600-D*.59,y:518});advance(game,1);
  game.pointerUp({x:600-D*.59,y:518});assert.equal(game.snapshot().mode,'trace');
});
test('S4 cancelled hold discards stored progress',()=>{
  const {game}=make('S4');game.pointerDown({x:600-D*.59,y:518});
  advance(game,.4);game.cancelPointer();
  assert.equal(game.snapshot().held,0);assert.equal(game.snapshot().mode,'hold');
});
test('S4 moving-goalposts relocates during play and can still be solved',()=>{
  const {game,events}=make('S4','moving-goalposts');
  game.pointerDown({x:600-D*.59,y:518});advance(game,1);
  game.pointerUp({x:600-D*.59,y:518});
  assert.equal(game.snapshot().mode,'trace');assert.equal(game.snapshot().goalShift,0);
  advance(game,.7);assert.ok(game.snapshot().goalShift>.05);
  game.pointerDown({x:600-D*.59,y:518});
  game.pointerMove({x:600+D*.76,y:470});
  game.pointerUp({x:600+D*.76,y:470});
  assert.equal(completed(events).length,1);
});
test('S2 cannot be interacted with after terminal result',()=>{
  const {game}=make('S2');advance(game,25);
  assert.equal(game.snapshot().emitted,true);const old=game.snapshot().trayX;
  game.pointerDown({x:350,y:534});game.pointerMove({x:860,y:534});game.pointerUp({x:860,y:534});
  assert.equal(game.snapshot().trayX,old);
});
test('Double-entry S3 and S4 require physical second confirmation',()=>{
  for(const id of ['S3','S4']){
    const {game,events}=make(id,'double-entry');
    if(id==='S3'){
      game.update(.01);game.pointerDown({x:600,y:477});
      game.pointerMove({x:600+D*.67,y:571});game.pointerUp({x:600+D*.67,y:571});
      assert.equal(game.snapshot().confirm,true);assert.equal(completed(events).length,0);
      game.pointerDown({x:600+D*.67,y:571});
    }else{
      game.pointerDown({x:600-D*.59,y:518});advance(game,1);game.pointerUp({x:600-D*.59,y:518});
      game.pointerDown({x:600-D*.59,y:518});game.pointerMove({x:600+D*.65,y:470});
      game.pointerUp({x:600+D*.65,y:470});
      assert.equal(game.snapshot().mode,'verify');assert.equal(completed(events).length,0);
      game.pointerDown({x:600-D*.59,y:518});
    }
    assert.equal(completed(events).length,1);
  }
});
test('S1 files three distinct manually handled objects once',()=>{
  const {game,events}=make('S1');
  for(let i=0;i<3;i++){
    const f=game.snapshot().files[i];
    game.pointerDown({x:f.x,y:f.y});game.pointerMove({x:600+D*.68,y:390});
    game.pointerUp({x:600+D*.68,y:390});
  }
  assert.equal(game.snapshot().filed,3);assert.equal(completed(events).length,1);
  assert.deepEqual(completed(events)[0].evidence.filed,[0,1,2]);
  assert.equal(completed(events)[0].evidence.manual,true);
});
