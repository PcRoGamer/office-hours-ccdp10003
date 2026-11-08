#!/usr/bin/env node
'use strict';
/*
 * CCDP10003 Project 2 independent evidence gate.
 * Inspects actual repo/game files and, optionally, the live game DOM via Playwright.
 * NEVER reports a source-code string as proof that a player experienced a mechanic.
 *
 * node qa/v3-course-evidence.cjs [repo-root] [--require-game] [--url=http://127.0.0.1:4173/night-shift-v3.html]
 * node qa/v3-course-evidence.cjs --self-test
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const EXPECTED = {
  ids: ['I1','I2','I3','I4','S1','S2','S3','S4','P1','P2','P3','P4','T1','T2','T3','T4'],
  research: [
    {name:'Dumb Ways to Die', role:'microgames', re:/dumb ways to die/i},
    {name:'Brotato', role:'roguelite', re:/brotato/i},
    {name:'Job Simulator', role:'tactile office play', re:/job simulator/i}
  ],
  scoreHeadings: ['class topics','critical','inventive','clarity']
};
const read = (root, rel) => fs.readFileSync(path.join(root,rel), 'utf8');
const exists = (root, rel) => fs.existsSync(path.join(root,rel));
const status = (id, state, evidence, next) => ({id,state,evidence,next});
function buildAudit(root, requireGame=false) {
  const results=[];
  const contract=JSON.parse(read(root,'design/v3/contract.json'));
  const gdd=read(root,'design/NIGHT_SHIFT_GDD_V3.md');
  const course=read(root,'design/CCDP_COURSE_ALIGNMENT.md');
  const research=read(root,'design/CCDP_PROJECT2_GAME_RESEARCH.md');
  const found=contract.card_pool.map(x=>x.id);
  results.push(status('FULL_V3_CONTENT_CONTRACT',
    found.length===16 && new Set(found).size===16 && EXPECTED.ids.every(id=>found.includes(id)) &&
      contract.scenesPerRun===12 && contract.perkIds.length===8 &&
      contract.promotionPicks===5 && contract.directives.length===5 &&
      ['printer','quota'].every(id=>contract.bosses[id]?.requiredCounters===3) ? 'PASS':'FAIL',
    'Machine-readable 16-card, 12-per-run, eight-perk, five-promotion/five-directive, two-boss model',
    'This tests design configuration, not actual browser gameplay.'));
  const all=research+' \n'+gdd;
  results.push(status('THREE_DISTINCT_GAMEPLAY_STUDIES',
    EXPECTED.research.every(x=>x.re.test(all)) && /papers,\s*please/i.test(all) &&
      /narrative|philosoph/i.test(all) ? 'PASS':'FAIL',
    'Named gameplay studies: Dumb Ways to Die/microgames, Brotato/roguelite, Job Simulator/tactile office; Papers, Please narrative only',
    'Test actual research comparison and accessible primary links inside gameplay, not merely these documents.'));
  results.push(status('COURSE_RUBRIC_FOUR_CRITERIA',
    /25\)/.test(course) && /critical engagement/i.test(course) &&
      /inventive communication/i.test(course) && /clarity/i.test(course) ? 'PASS':'FAIL',
    'Course preflight specifies four equally weighted dimensions',
    'Independently map observed title, tutorial, upgrades, distractors, worker choices, boss and ending to each criterion.'));
  results.push(status('MOUSE_PRECISION_RECURRING_INTERRUPTS',
    /mouse-movement precision/i.test(course) && /at least two different departments/i.test(course)
      ? 'PASS':'FAIL',
    'Original proposal and instructor feedback demand physical precision under interruptions in ≥2 different departments',
    'Later inspect scripted and manual pointer traces for I/Services/PR/Staff interruptions during meaningful aiming/dragging.'));
  results.push(status('INTEGRATION_SOURCE_HIERARCHY',
    /design\/FIRST_SHIFT_VERTICAL_SLICE_GDD\.md/.test(course) &&
    /for \*\*CCDP gameplay content/.test(course) ? 'FAIL':'PASS',
    'Inherited source-and-production hierarchy still declares eight-card First Shift GDD binding even though top notice supersedes it',
    'LEAD should correct that hierarchy in design/CCDP_COURSE_ALIGNMENT.md, preserving actual course requirements.'));
  const rel='night-shift-v3.html';
  const htmlExists=exists(root,rel);
  const scriptsDir=path.join(root,'night-shift-v3');
  const sourceFiles=[];
  if(htmlExists)sourceFiles.push(rel);
  function walk(folder, depth=0) {
    if(depth>8 || !fs.existsSync(folder)) return;
    for(const d of fs.readdirSync(folder,{withFileTypes:true})) {
      const full=path.join(folder,d.name);
      if(d.isDirectory()) walk(full, depth+1);
      else if(/\.(?:m?js|html|css)$/i.test(d.name)) sourceFiles.push(path.relative(root,full));
    }
  }
  walk(scriptsDir);
  const production=sourceFiles.map(x=>read(root,x)).join('\n');
  results.push(status('ACTUAL_PLAYABLE_ENTRY',
    htmlExists?'PENDING':'PENDING',
    htmlExists?'Candidate game HTML exists in checked-out repository':'No new night-shift-v3.html was found in this checkout',
    htmlExists?'Requires real browser navigation, non-trivial gameplay and public URL confirmation':'LEAD must build and integrate the new route; preserve old HD URL.'));
  results.push(status('GAMEPLAY_SOURCE_LINKS',
    htmlExists && EXPECTED.research.every(x=>x.re.test(production)) &&
      /https?:\/\//.test(production) ? 'PENDING':'PENDING',
    htmlExists?'Static playable source has '+sourceFiles.length+' script/markup/CSS files; source strings cannot prove clickable in-game research':'No playable entry yet: cannot verify source links',
    'At first promotion, real DOM controls/sources should expose usable labeled direct citations and critical comparison.'));
  results.push(status('WHY_GAME_WHY_NOW_IN_TUTORIAL','PENDING',
    htmlExists?'Tutorial integration needs runtime observation':'GDD proposes why-game and why-now lines but no integrated playable evidence yet',
    'Verify as naturally encountered within playable first action/promotion, not postgame reference drawer only.'));
  results.push(status('VISUAL_AUDIO_INVENTIVENESS','PENDING',
    'Design specifies custom cast/audio and physics; no automated source-count check proves actual expressive execution',
    'Capture actual sound-enabled gameplay clips and compare title, actions, intermission, boss, ending to Night Shift HD.'));
  results.push(status('CLEAR_GAMEPLAY_AND_RELEASE','PENDING',
    'First physical action ≤15 seconds, correct hitboxes, score truth, full win and playable public URL require measured browser execution',
    'Check real first-time tester/timing, two-score visible consequences, published URL, fresh browser with no console errors.'));
  const fail=results.filter(x=>x.state==='FAIL');
  const pending=results.filter(x=>x.state==='PENDING');
  return {title:'NIGHT SHIFT V3 COURSE EVIDENCE AUDIT',root,scope:'SPEC AND SOURCE GATE; NOT A PLAYTEST OR GRADE',
    generatedAt:new Date().toISOString(),results,summary:{pass:results.filter(x=>x.state==='PASS').length,
    fail:fail.length,pending:pending.length},exitCode:fail.length || (requireGame && (!htmlExists||pending.length))?1:0};
}
async function browserCheck(report,url) {
  let playwright;
  try {playwright=require('playwright');}catch(e){
    report.browser={status:'BLOCKED',detail:'Playwright unavailable: '+e.message};
    return;
  }
  let browser;
  try {
    const options={headless:true,args:['--no-sandbox']};
    if (process.platform==='win32') {
      for (const candidate of [
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
      ]) {
        if (fs.existsSync(candidate)) {options.executablePath=candidate;break;}
      }
    }
    browser=await playwright.chromium.launch(options);
    const page=await browser.newPage({viewport:{width:1440,height:900}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    const resp=await page.goto(url,{waitUntil:'domcontentloaded',timeout:20000});
    await page.waitForTimeout(600);
    const data=await page.evaluate(()=>({
      title:document.title,canvasVisible:Array.from(document.querySelectorAll('canvas')).some(c=>{
        const r=c.getBoundingClientRect();return r.width>32&&r.height>32;
      }),links:Array.from(document.querySelectorAll('a[href]')).map(a=>({
        text:(a.textContent||a.getAttribute('aria-label')||'').trim().slice(0,120),href:a.href
      })).filter(x=>/^https?:\/\//i.test(x.href)).slice(0,80)
    }));
    // Inspect optional research drawer when a clear in-page trigger exists.
    // This does not prove the player sees the research at first promotion.
    const researchTrigger=page.locator('a, button').filter({hasText:/THE REAL RESEARCH/i}).first();
    if(await researchTrigger.count()){
      try {
        await researchTrigger.click({timeout:2500});
        await page.waitForTimeout(250);
        data.researchDrawer=await page.evaluate(()=>({
          visibleText:(document.body?.innerText||'').slice(-1400),
          externalLinks:Array.from(document.querySelectorAll('a[href]')).filter(a=>{
            const r=a.getBoundingClientRect(),s=getComputedStyle(a);
            return r.width>0 && r.height>0 && s.visibility!=='hidden' &&
              /^https?:\/\//i.test(a.href) && new URL(a.href).host!==location.host;
          }).map(a=>({text:(a.textContent||'').trim().slice(0,90),href:a.href})).slice(0,25)
        }));
      } catch(e) {data.researchDrawer={status:'UNINSPECTED',reason:String(e.message||e).slice(0,180)};}
    }
    report.browser={status:resp.status()===200 && data.canvasVisible && errors.length===0?'SMOKE_ONLY':'BLOCKED',
      http:resp.status(),errors,...data,url,
      limitations:'Only startup DOM/visible canvas and currently exposed source anchors; does NOT establish first-promotion visibility, 15-second comprehension, actual full campaign or enjoyment'};
    await page.close();
  }catch(e){report.browser={status:'BLOCKED',detail:String(e.stack||e).slice(0,1000),url};}
  finally {if(browser)await browser.close().catch(()=>{});}
}
function selfTest(){
  assert.equal(EXPECTED.ids.length,16);
  assert.equal(new Set(EXPECTED.ids).size,16);
  assert.equal(EXPECTED.research.length,3);
  assert.equal(EXPECTED.research[0].re.test('Dumb Ways to Die'),true);
  assert.equal(EXPECTED.research[1].re.test('Brotato'),true);
  assert.equal(EXPECTED.research[2].re.test('Job Simulator'),true);
  console.log('V3_COURSE_GATE_SELF_TEST_PASS 16 authored cards, three gameplay references, independent source-vs-runtime distinction');
}
async function main(){
  const args=process.argv.slice(2);
  if(args.includes('--self-test')){selfTest();return;}
  const root=path.resolve(args.find(x=>!x.startsWith('--'))||'.');
  const requireGame=args.includes('--require-game');
  const live=args.find(x=>x.startsWith('--url='));
  const report=buildAudit(root,requireGame);
  if(live)await browserCheck(report,live.slice('--url='.length));
  const md=['# '+report.title,'',
    '**Scope:** '+report.scope,'',
    '| Gate | Status | Evidence | Next verification |',
    '| --- | --- | --- | --- |',
    ...report.results.map(x=>'| '+x.id+' | **'+x.state+'** | '+x.evidence.replace(/\|/g,'/')+
      ' | '+x.next.replace(/\|/g,'/')+' |'),'',
    '**Summary:** '+JSON.stringify(report.summary),'',
    'Do not infer a university grade or full-game compliance from this design/static gate.'].join('\n');
  const out=path.join(root,'qa-artifacts','v3-course');
  fs.mkdirSync(out,{recursive:true});
  fs.writeFileSync(path.join(out,'audit.json'),JSON.stringify(report,null,2)+'\n');
  fs.writeFileSync(path.join(out,'audit.md'),md+'\n');
  console.log(JSON.stringify({summary:report.summary,browser:report.browser?.status||'NOT_RUN',
    artifacts:[path.join(out,'audit.json'),path.join(out,'audit.md')]},null,2));
  process.exitCode=report.exitCode || (live&&report.browser?.status==='BLOCKED'?1:0);
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={buildAudit,EXPECTED};
