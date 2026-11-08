import {strict as assert} from 'node:assert';
import {definitions,createIntakeCard} from '../night-shift-v3/scenes/intake/index.js';
const advance=(s,seconds)=>{for(let i=0;i<Math.ceil(seconds/.05);i++)s.update(.05)};
const run=(id,perks=[])=>{
 const seen=[],sounds=[],ctx={run:{attemptId:'test-'+id,perks},rng:{next:()=>.42},events:{emit:e=>seen.push(e)},audio:{play:id=>sounds.push(id)}};
 return {s:createIntakeCard(id,ctx),seen,sounds};
};
assert.deepEqual(definitions.map(d=>d.id),['I1','I2','I3','I4']);
for(const def of definitions){const {s,seen}=run(def.id);s.enter();assert.equal(typeof s.draw,'function');assert.equal(s.snapshot().cardId,def.id);s.update(0.05);assert.ok(s.snapshot().remaining<s.total);s.dispose()}
{
 const {s,seen}=run('I1');s.update(.02);let i=0;
 for(;i<9;i++){advance(s,1.16);const f=s.forms.find(f=>f.kind==='approved'&&!f.hit&&f.x>0);if(f){s.pointerDown({x:f.x+70,y:f.y+48});if(s.ended)break;}}
 assert.equal(seen.filter(e=>e.type==='card-complete').length,1,'I1 must clear exactly once');assert.equal(seen[0].cardId,'I1');assert.equal(seen.find(e=>e.type==='card-complete').outcome.manualApproved,5);assert.ok(seen.some(e=>e.type==='notice-pair-shown'));
 s.pointerDown({x:650,y:400});assert.equal(seen.filter(e=>e.type==='card-complete').length,1,'no duplicated complete');
}
{
 const {s,seen}=run('I1');advance(s,3.6);const spam=s.forms.find(f=>f.kind==='spam');assert.ok(spam);s.pointerDown({x:spam.x+70,y:spam.y+48});assert.equal(seen.at(-1).reason,'SUBSCRIBED!');assert.ok(s.snapshot().actions.some(a=>a.name==='accepted-spam'));
}
{
 const {s,seen}=run('I2');for(const id of ['junk-a','junk-b']){
  const e=s.envelopes.find(e=>e.id===id);s.pointerDown({x:e.x+66,y:e.y+40});s.pointerMove({x:637,y:454});s.pointerUp({x:637,y:454});
 }
 assert.equal(seen.filter(e=>e.type==='card-complete').length,1);assert.equal(seen.at(-1).outcome.paySlipSaved,true);
}
{
 const {s,seen}=run('I2');const e=s.envelopes.find(e=>e.id==='pay-slip');s.pointerDown({x:e.x+66,y:e.y+44});s.pointerMove({x:637,y:454});s.pointerUp({x:637,y:454});assert.equal(seen.at(-1).reason,'PAY SLIP!');
}
{
 const {s,seen}=run('I3');const real=s.windows.find(w=>w.real);s.pointerDown({x:real.x+90,y:real.y+100});
 for(const w of s.windows.filter(w=>!w.real))s.pointerDown({x:w.x+w.w-24,y:w.y+24});
 assert.equal(seen.filter(e=>e.type==='card-complete').length,1);assert.equal(seen.at(-1).outcome.genuineHelp,'opened');
}
{
 const {s,seen}=run('I4');const p=s.waypoints;
 s.pointerDown(p[0]);for(let i=1;i<p.length;i++){for(let f=1;f<=12;f++){let a=p[i-1],b=p[i];s.pointerMove({x:a.x+(b.x-a.x)*f/12,y:a.y+(b.y-a.y)*f/12});}}s.pointerUp(p[3]);
 assert.equal(seen.filter(e=>e.type==='card-complete').length,1);assert.equal(seen.at(-1).outcome.linkedForms,3);
}
{
 const {s,seen}=run('I4');s.pointerDown(s.waypoints[0]);s.pointerMove({x:777,y:200});assert.equal(seen.at(-1).reason,'OFF THE ROUTE');
}

{
 const {s,seen}=run('I1',['carbon-copy']);s.update(.05);const f=s.forms.find(f=>f.kind==='approved');s.pointerDown({x:f.x+55,y:f.y+45});
 assert.ok(seen.some(e=>e.type==='perk-effect'&&e.perk==='carbon-copy'),'carbon copy must be visible and traceable');
}
{
 const {s,seen}=run('I2',['mira-backup']);const e=s.envelopes.find(e=>e.id==='pay-slip');s.pointerDown({x:e.x+66,y:e.y+44});s.pointerMove({x:637,y:454});s.pointerUp({x:637,y:454});
 assert.ok(!s.ended,'Mira perk should rescue one error');assert.ok(seen.some(e=>e.type==='perk-effect'&&e.perk==='mira-backup'));
}
{
 const {s,seen}=run('I3',['mira-backup','focus-lens']);const w=s.windows.find(w=>w.real);const before=s.timeLeft;s.pointerDown({x:w.x+98,y:w.y+87});
 assert.equal(s.timeLeft,before+1.5,'real Mira help visibly grants perk time');
}
{
 const {s}=run('I4',['chain-stamp']);s.pointerDown(s.waypoints[0]);s.pointerMove({x:500,y:569});assert.ok(!s.ended,'chain stamp widens clearly visible corridor');
}
console.log('PASS: 4 definitions, lifecycle, time, I1 approvals/spam, I2 safe/unsafe shredding, I3 scam/real, I4 route/invalid gesture, idempotent clear.');