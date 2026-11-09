/**
 * Bridge-QA shadow fix: evaluates a minimal source-level repair WITHOUT editing
 * PACKAGE-owned night-shift-v3/runtime/score-bridge.js.
 * Produces a disposable patched module under OS temp dir and runs our same
 * independent adversarial tests against it.
 * Run: node qa/v3-wrap-bridge-patch-check.mjs
 *
 * PACKAGE can port the guarded, anchored edits below into the live bridge.
 */
import {execFileSync,spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdtempSync,rmSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const current=resolve(root,'night-shift-v3/runtime/score-bridge.js');
const branch=process.env.BRIDGE_REF||'origin/agents/v3-lead-systems-bridge-1109';
let source=existsSync(current)?readFileSync(current,'utf8'):execFileSync(
 'git',['show',branch+':night-shift-v3/runtime/score-bridge.js'],{cwd:root,encoding:'utf8'});
function once(oldCode,newCode,label){
 const hit=source.indexOf(oldCode);
 if(hit<0||source.indexOf(oldCode,hit+1)>=0)
  throw Error('Expected one exact '+label+' anchor: bridge has changed; inspect before patching');
 source=source.slice(0,hit)+newCode+source.slice(hit+oldCode.length);
}
once(
 "let current='',captured=0,sequence=0;\n function reset(id){if(id!==current){current=id;captured=0;sequence=0}}",
 "let current='',captured=0,sequence=0,attemptId='',seenActions=new Set();\n function reset(id){const next=run.attemptId;if(id!==current||next!==attemptId){current=id;attemptId=next;captured=0;sequence=0;seenActions=new Set()}}",
 'attempt-scoped reset');
once(
 "if(e.synthetic===true)return;",
 "if(e.synthetic!==false)return;",
 'explicit manual provenance');
once(
 "const obj=typeof e.objectId==='string'?e.objectId:(typeof e.kind==='string'?e.kind:'manual');\n   action(id+':'+obj+':'+(++sequence),e.correct?'correct':'wrong');",
 "const obj=(typeof e.objectId==='string'&&e.objectId.length>0)?e.objectId:e.kind;\n   must(typeof obj==='string'&&obj.length>0,'PR action has no authored identity');\n   const identity=obj+(Number.isInteger(e.mark)?':'+e.mark:'');\n   const signature=identity+'|'+e.correct;\n   if(seenActions.has(signature))return;\n   seenActions.add(signature);\n   action(id+':'+identity,e.correct?'correct':'wrong');",
 'stable PR identity');
once(
 "must(e.boltIndex+1===run.phase,'wrong printer bolt order');",
 "if(e.boltIndex+1<run.phase)return; // repeat after a valid previous counter on boss retry\n   must(e.boltIndex+1===run.phase,'wrong printer bolt order');",
 'printer replay');
once(
 "must(run.stage.type==='boss'&&run.stage.id==='quota','quota SYSTEMS order diverged');\n   must(run.resolveBonusPacket(e.objectId,e.outcome,{manual:true}),'quota packet already resolved');",
 "must(/^quota:p[1-3]:b[12]$/.test(e.objectId),'quota packet ID malformed');\n   const eventPhase=Number(e.objectId[7]);\n   if(eventPhase<run.phase)return; // replay of a committed old phase\n   must(run.stage.type==='boss'&&run.stage.id==='quota'&&eventPhase===run.phase,'quota SYSTEMS order diverged');\n   must(run.resolveBonusPacket(e.objectId,e.outcome,{manual:true}),'quota packet already resolved');",
 'quota packet replay');
once(
 "must(e.outcome==='counter'&&e.synthetic===false&&e.objectId==='quota:bolt:'+run.phase,'quota bolt not player-countered');",
 "const eventBolt=typeof e.objectId==='string'&&/^quota:bolt:[1-3]$/.test(e.objectId)?Number(e.objectId.at(-1)):NaN;\n   if(Number.isInteger(eventBolt)&&eventBolt<run.phase)return;\n   must(e.outcome==='counter'&&e.synthetic===false&&e.objectId==='quota:bolt:'+run.phase,'quota bolt not player-countered');",
 'quota bolt replay');
const temp=mkdtempSync(join(tmpdir(),'nightshift-bridge-qa-'));
try{
 const patched=join(temp,'patched-bridge.mjs');
 writeFileSync(patched,source,'utf8');
 const proc=spawnSync(process.execPath,['--test','qa/v3-wrap-bridge-provenance.test.mjs'],{
  cwd:root,encoding:'utf8',env:{...process.env,BRIDGE_FILE:patched},maxBuffer:1024*1024*5
 });
 process.stdout.write(proc.stdout||'');
 process.stderr.write(proc.stderr||'');
 if(proc.error)throw proc.error;
 process.exitCode=proc.status??1;
}finally{rmSync(temp,{recursive:true,force:true})}
