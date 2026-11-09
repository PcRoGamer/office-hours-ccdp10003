// Actual authored Services scene pointer outcomes. No fabricated ledger events.
import assert from 'node:assert/strict';
import {definitions} from '../night-shift-v3/scenes/services/index.js';
const scene=id=>definitions.find(d=>d.id===id);
const viewport={worldWidth:1280,worldHeight:760};
function setup(id,perks={},rule='FAST OR SAFE'){
 const events=[];
 const ctx={cardId:id,viewport,run:{perks,directive:rule},
   audio:{play(){}},events:{emit:e=>events.push(e)},rng:()=>.43};
 const instance=scene(id).create(ctx);instance.enter();
 return {instance,events};
}
function deliver(instance,id=0){
 const s=instance.snapshot(),f=s.files.find(f=>f.id===id);
 assert.ok(f&&!f.done,'a real unresolved physical folder must exist');
 instance.pointerDown({x:f.x,y:f.y});
 instance.pointerMove({x:923,y:390});
 instance.pointerUp({x:923,y:390});
}
const baseline=setup('S1');
deliver(baseline.instance);
assert.equal(baseline.instance.snapshot().filed,1);
assert.equal(baseline.instance.snapshot().files[1].copied,false);
const carbon=setup('S1',{'carbon-copy':1});
deliver(carbon.instance);
let cs=carbon.instance.snapshot();
assert.equal(cs.filed,1,'Carbon Copy cannot award a free completed folder');
assert.equal(cs.files[1].copied,true,'a genuine unlocked next-folder proxy must appear');
assert.ok(cs.files[1].x>baseline.instance.snapshot().files[1].x+250,
 'Carbon Copy must move the next physical paper substantially closer to the inbox');
deliver(carbon.instance,1);deliver(carbon.instance,2);
const cleared=carbon.events.filter(e=>e.type==='card-complete');
assert.equal(cleared.length,1);
assert.equal(cleared[0].evidence.filed.length,3,'exactly three physically filed originals, not synthetic duplication');
assert.deepEqual(cleared[0].evidence.filed,[0,1,2]);
console.log('PASS Carbon Copy shifts real unresolved folder, never manufactures filing credit');

function throwAtBumper(perks){
 const {instance}=setup('S1',perks,'MOVING GOALPOSTS');
 const f=instance.snapshot().files[0];
 instance.pointerDown({x:f.x,y:f.y});
 instance.pointerMove({x:570,y:527});
 instance.pointerUp({x:570,y:527});
 instance.update(.05);
 const mid=instance.snapshot();
 instance.update(.05);
 return {mid,after:instance.snapshot()};
}
const noBank=throwAtBumper({});
const yesBank=throwAtBumper({'bank-shot':1});
assert.equal(noBank.mid.bankBoosts,0);
assert.equal(yesBank.mid.bankBoosts,1,'earned Bank Shot must change the actual bumper interaction');
assert.ok(yesBank.after.files[0].x>noBank.after.files[0].x+3,
 'earned bank collision must drive a measurably stronger physical rebound');
console.log('PASS Bank Shot widens and accelerates physical folder bank, no phantom delivery');

const plain=setup('S2'),mira=setup('S2',{'mira-backup':1});
assert.equal(mira.instance.snapshot().trayWidth,plain.instance.snapshot().trayWidth+65,
 'Mira Backup must grant real extra catch surface while still requiring player steering');
const safeX=600+475*.36,fastX=600-475*.36;
plain.instance.pointerDown({x:fastX,y:366});mira.instance.pointerDown({x:fastX,y:366});
assert.equal(mira.instance.snapshot().trayWidth,plain.instance.snapshot().trayWidth+65);
plain.instance.pointerDown({x:safeX,y:366});mira.instance.pointerDown({x:safeX,y:366});
assert.equal(mira.instance.snapshot().trayWidth,plain.instance.snapshot().trayWidth+65);
assert.equal(mira.instance.snapshot().miraBackup,true);
console.log('PASS Mira Backup changes catch geometry on both fast and safe real routes');
console.log('PASS all three first-promotion choices now affect authored S1/S2 physics before the next promotion');
