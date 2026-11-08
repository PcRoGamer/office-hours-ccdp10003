import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePreferences, DEFAULT_PREFS, assistedHitPoint, PREF_KEY } from '../night-shift-v3/accessibility/controls.mjs';

test('a11y preferences accept only actual booleans and have isolated storage key', () => {
 const normalized=normalizePreferences({highContrast:true,reducedMotion:'true',keyboardControls:1,preferPractice:true});
 assert.equal(normalized.highContrast,true);
 assert.equal(normalized.reducedMotion,false);
 assert.equal(normalized.keyboardControls,false);
 assert.equal(normalized.preferPractice,true);
 assert.deepEqual(Object.keys(normalized).sort(),Object.keys(DEFAULT_PREFS).sort());
 assert.match(PREF_KEY,/nightshift-v3/);
});
test('disabled expanded hit testing never changes interaction points',()=>{
 const raw={x:9,y:9};
 assert.equal(assistedHitPoint(raw,[{x:10,y:10}],{enabled:false}),raw);
});
test('explicit large target option only snaps to a unique reachable target',()=>{
 const raw={x:50,y:49};
 assert.deepEqual(assistedHitPoint(raw,[{x:56,y:50,disabled:false}],{enabled:true,radius:8}),{x:56,y:50});
 assert.equal(assistedHitPoint(raw,[{x:56,y:50},{x:56,y:55}],{enabled:true,radius:12}),raw);
 assert.equal(assistedHitPoint(raw,[{x:56,y:50,disabled:true}],{enabled:true,radius:12}),raw);
});
test('offscreen and malformed hit targets never steal pointer actions',()=>{
 const raw={x:250,y:100};
 assert.equal(assistedHitPoint(raw,[{x:5000,y:5000},{x:NaN,y:100}],{enabled:true,radius:20}),raw);
 assert.equal(assistedHitPoint(raw,null,{enabled:true,radius:20}),raw);
});