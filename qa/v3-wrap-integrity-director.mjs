// Integration regression for real director code, not a simulated replacement.
// Run: node --experimental-default-type=module qa/v3-wrap-integrity-director.mjs
import assert from 'node:assert/strict';
import {createDirector} from '../night-shift-v3/runtime/director.js';

const ids=['I1','I2','I3','S1','S2','S3','P1','P2','P4','T1','T4','T3'];
const output=[];
const viewport={worldWidth:1351,worldHeight:760,cssWidth:1920,cssHeight:1080,
  screenToWorld(x,y){return {x,y}},worldToScreen(x,y){return {x,y}}};
function definition(id,boss=false){
  return {id,imperative:'DO '+id,authoredReferenceMs:18000,
    create({events}){
      let done=false;
      const success=()=>{if(done)return;done=true;
        const event={type:boss?'boss-complete':'card-complete',
          [boss?'bossId':'cardId']:id,outcome:'cleared',attemptId:'actual-'+id,
          evidence:{manualAction:true,licenseDebit:id==='S3'?40:0}};
        events.emit(event);events.emit(event);
      };
      return {enter(){},dispose(){},update(){},draw(){},pointerDown:success,
        pointerUp(){},cancelPointer(){},snapshot(){return {targets:[]}}};
    }};
}
const director=createDirector({viewport,audio:{play(){}},events:{emit(e){output.push(e)}}});
director.configureRun({cards:ids,definitions:ids.map(id=>definition(id)),
  bosses:[definition('printer',true),definition('quota',true)],
  draftProvider:({slot})=>({subject:'PROMOTION '+slot,directiveId:'directive-'+slot,
    offers:['carbon-copy','bank-shot','mira-backup'].map(id=>({id,title:id}))}),
  rng:()=>0.5});
director.start();
assert.equal(director.snapshot().fullCampaign,true);
assert.equal(director.snapshot().currentCardId,'I1');
// A pause must freeze the scene timer and reject player input.
director.togglePause(true);
const initial=director.snapshot().clock;
director.update(99);director.pointer('down',{x:4,y:4});
assert.equal(director.snapshot().clock,initial);
assert.equal(director.snapshot().evidence.length,0);
director.togglePause(false);
// Timeouts must not mint successes. A retry does not consume a second heart.
director.update(99);
assert.equal(director.mode,'recover');
assert.equal(director.hearts,2);
assert.equal(director.snapshot().evidence.length,0);
director.update(99);
assert.equal(director.hearts,2);
assert.equal(director.retry(),true);
assert.equal(director.snapshot().currentCardId,'I1');
// Malformed off-card completions cannot advance a campaign.
director.pointer('down',{x:4,y:4});
assert.equal(director.snapshot().evidence.length,1);
director.pointer('down',{x:4,y:4});
assert.equal(director.snapshot().evidence.length,1);
director.update(0.8);
let promotions=0,bosses=0,cardCompletions=1,steps=0;
while(director.mode!=='victory' && steps++<90){
  if(director.mode==='promotion'){
    assert.equal(director.snapshot().promotionSlot,promotions);
    assert.equal(director.pickPerk('not-an-offer'),false);
    assert.equal(director.pickPerk('carbon-copy'),true);
    promotions++;
    continue;
  }
  if(!['card','printer','quota'].includes(director.mode)){
    throw Error('Unexpected state '+director.mode);
  }
  if(director.mode==='printer' && bosses===0){
    // Recover from the first boss timeout without creating a phantom boss victory.
    const before=director.snapshot().evidence.length;
    director.update(200);
    assert.equal(director.mode,'recover');
    assert.equal(director.snapshot().evidence.length,before);
    assert.equal(director.retry(),true);
    assert.equal(director.mode,'printer');
  }
  const wasBoss=director.mode!=='card';
  director.pointer('down',{x:40,y:40});
  if(wasBoss)bosses++;else cardCompletions++;
  director.update(0.8);
}
assert.ok(steps<90,'finite complete run');
assert.equal(director.mode,'victory');
assert.equal(cardCompletions,12);
assert.equal(bosses,2);
assert.equal(promotions,5);
const evidence=director.snapshot().evidence;
assert.equal(evidence.length,14,'12 cards and 2 bosses exactly');
assert.equal(new Set(evidence.map(x=>x.id)).size,14,'no duplicated encounter credits');
assert.ok(evidence.every(x=>x.committed===true && x.synthetic===false));
assert.equal(output.filter(x=>x.type==='campaign-cleared').length,1);
// New shifts must not inherit committed evidence, perk levels or exhausted retries.
director.start();
const reset=director.snapshot();
assert.equal(reset.currentCardId,'I1');
assert.equal(reset.hearts,3);
assert.equal(reset.evidence.length,0);
assert.deepEqual(reset.perkLevels,{});
assert.equal(reset.continueUsed,false);
assert.equal(reset.promotionSlot,-1);
console.log(JSON.stringify({pass:true,cards:cardCompletions,bosses,promotions,
  committed:14,timeoutRetry:true,bossRetry:true,pausedInputRejected:true,
  duplicateCreditRejected:true,replayReset:true}));
