import assert from 'node:assert/strict';
import {PERK_STORY,DIRECTIVE_STORY,promotionNarrative,receiptNarrative,validateOffers,STORY_SOURCES} from '../night-shift-v3/story/narrative.js';
let count=0;function test(label,fn){fn();console.log('PASS '+label);count++}
const base={completedCardIds:['I1','S2','P4','T4'],workstationIntact:false,notificationsEncountered:3,safeNotificationsHandled:2,publicRelationsFrame:'context',licenceTokensGiven:1,quotaBonusPacketOutcomes:{'quota:p1:b1':'file','quota:p2:b1':'cool'},mode:'standard'};
const copy=()=>JSON.parse(JSON.stringify(base));
test('canonical five directives, eight upgrades',()=>{assert.equal(Object.keys(PERK_STORY).length,8);assert.equal(Object.keys(DIRECTIVE_STORY).length,5)});
test('five distinct promotion subjects, two mandatory sentences or fewer',()=>{const a=[1,2,3,4,5].map(index=>promotionNarrative({index,run:base,directive:Object.keys(DIRECTIVE_STORY)[index-1]}));assert.equal(new Set(a.map(x=>x.subject)).size,5);a.forEach(x=>assert.ok((x.body.match(/[.!?](?:\s|$)/g)||[]).length<=3))});
test('no unobserved workstation incident',()=>{const r=copy();r.completedCardIds=['I1'];const m=promotionNarrative({index:2,run:r,directive:'moving-goalposts'});assert.equal(m.changes.length,0)});
test('observed workstation damage is admitted, never invented',()=>{const r=copy();assert.match(promotionNarrative({index:2,run:r}).changes[0],/repairs/);r.workstationIntact=true;assert.match(promotionNarrative({index:2,run:r}).changes[0],/stayed dry/)});
test('P4 cannot claim framing unless card completed',()=>{const r=copy();r.completedCardIds=['I1'];assert.equal(promotionNarrative({index:4,run:r}).changes.length,0);r.completedCardIds.push('P4');assert.match(promotionNarrative({index:4,run:r}).changes[0],/Context/)});
test('T4 access is conditional on actual commit',()=>{const r=copy();r.completedCardIds=['I1'];assert.equal(promotionNarrative({index:5,run:r}).changes.length,0);r.completedCardIds.push('T4');assert.match(promotionNarrative({index:5,run:r}).changes[0],/1 of 2/)});
test('exactly three valid unique perk offers',()=>{assert.deepEqual(validateOffers(['perk:carbon-copy','perk:bank-shot','perk:mira-backup']),['perk:carbon-copy','perk:bank-shot','perk:mira-backup']);assert.throws(()=>validateOffers(['perk:carbon-copy','perk:carbon-copy','perk:bank-shot']));assert.throws(()=>validateOffers(['perk:carbon-copy']));assert.throws(()=>validateOffers(['perk:fake','perk:bank-shot','perk:mira-backup']))});
test('score frozen and unmodified across two lenses',()=>{const r=copy(),snapshot=Object.freeze({officialQuota:78,peopleQuality:86,components:Object.freeze({official:{completed:40},people:{access:15}})});const original=JSON.stringify({r,snapshot});const m=receiptNarrative({run:r,snapshot});assert.equal(m.official,78);assert.equal(m.people,86);assert.equal(m.title,'EMPLOYEE OF THE WEEK CANDIDATE');assert.match(m.line,/Everybody made it home/);assert.equal(JSON.stringify({r,snapshot}),original)});
test('four possible score bands and exact title thresholds',()=>{for(const [q,p,frag] of [[90,90,'rest of us'],[90,20,'missing-chairs'],[25,90,'target is under review'],[25,20,'hazard pay']]){const m=receiptNarrative({run:{},snapshot:{officialQuota:q,peopleQuality:p}});assert.match(m.line,new RegExp(frag))}assert.equal(receiptNarrative({snapshot:{officialQuota:85,peopleQuality:80}}).title,'EMPLOYEE OF THE DAY')});
test('only observed packet outcomes and licence facts are reported',()=>{const r=copy(),m=receiptNarrative({run:r,snapshot:{officialQuota:67,peopleQuality:65}});assert.match(m.facts.join('|'),/1 FILED · 1 COOLED/);assert.match(m.facts.join('|'),/1 OF 2/);const z=receiptNarrative({run:{},snapshot:{officialQuota:67,peopleQuality:65}});assert.equal(z.facts.length,0)});
test('strict frozen score boundaries',()=>{assert.throws(()=>receiptNarrative({snapshot:{officialQuota:Infinity,peopleQuality:80}}));assert.throws(()=>receiptNarrative({snapshot:{officialQuota:101,peopleQuality:80}}));assert.throws(()=>receiptNarrative({snapshot:{officialQuota:80}}));assert.throws(()=>promotionNarrative({index:6}))});
test('optional sources are source-bearing, not false accuracy claims',()=>{for(const x of Object.values(STORY_SOURCES)){assert.ok(x.url.startsWith('https://'));assert.ok(x.why.length>15)}assert.match(STORY_SOURCES.attention.why,/not uniformly worse/)});
// Cross-lane integration: SYSTEMS uses short perk IDs and a different frozen scoring shape.
test('SYSTEMS first draft short perk IDs stay unchanged in purchase callbacks',()=>{
 const draft=['carbon-copy','bank-shot','mira-backup'];
 assert.deepEqual(validateOffers(draft),draft);
 assert.deepEqual(validateOffers([{id:'carbon-copy'},{id:'bank-shot'},{id:'mira-backup'}]),draft);
 assert.throws(()=>validateOffers(['carbon-copy','perk:carbon-copy','bank-shot']));
});
test('SYSTEMS readScores frozen report works without transforming scores',()=>{
 const f=Object.freeze({officialScore:78,peopleScore:86,official:Object.freeze({completedWork:40,pace:13}),people:Object.freeze({toolAccess:30}),completedCardIds:['T4','P4','S2'],licenceTokensGiven:2,frame:'context',workstationIntact:false,bonusPacketOutcomes:{'quota:p1:b1':'file','quota:p2:b1':'cool'},mode:'standard',continued:false});
 const m=receiptNarrative({run:{},snapshot:f});
 assert.equal(m.official,78);assert.equal(m.people,86);
 assert.equal(m.components.official.completedWork,40);
 assert.match(m.facts.join(' | '),/2 OF 2 SOFTWARE/);
 assert.match(m.facts.join(' | '),/1 FILED · 1 COOLED/);
 assert.match(m.facts.join(' | '),/PRESS FRAME: CONTEXT/);
 assert.match(m.facts.join(' | '),/WORKSTATION WAS INTERRUPTED/);
});
test('SYSTEMS run.snapshot.endingSnapshot accepted without score reinterpretation',()=>{
 const m=receiptNarrative({snapshot:{endingSnapshot:{officialScore:85,peopleScore:70,official:{pace:15},people:{attentionToHelp:12}}}});
 assert.equal(m.title,'EMPLOYEE OF THE DAY');assert.equal(m.official,85);assert.equal(m.people,70);
});
test('SYSTEMS committed event ledger fills observed narrative facts without invention',()=>{
 const events=[
  {kind:'worker',objectId:'mira-workstation',outcome:'helped',committed:true},
  {kind:'notice',objectId:'n1',outcome:'safe',committed:true},
  {kind:'notice',objectId:'n2',outcome:'unsafe',committed:true},
  {kind:'notice',objectId:'fake',outcome:'safe',committed:false},
  {kind:'frame',objectId:'p4',outcome:'context',committed:true},
  {kind:'licence',objectId:'mira',outcome:'give',committed:true},
  {kind:'licence',objectId:'jules',outcome:'save',committed:true}];
 const run={eventLedger:events,completedCardIds:['S2','P4','T4']};
 assert.match(promotionNarrative({index:2,run}).changes[0],/stayed dry/);
 assert.match(promotionNarrative({index:3,run}).changes[0],/1 of 2/);
 assert.match(promotionNarrative({index:4,run}).changes[0],/Context/);
 assert.match(promotionNarrative({index:5,run}).changes[0],/1 of 2/);
 assert.equal(promotionNarrative({index:5,run:{eventLedger:events,completedCardIds:['S2']}}).changes.length,0);
});
console.log(`\n${count}/${count} narrative and integrity checks passed`);
