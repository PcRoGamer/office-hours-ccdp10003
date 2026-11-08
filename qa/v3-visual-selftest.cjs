#!/usr/bin/env node
/* Test the tooling with synthetic fixtures. These screenshots ARE NOT game evidence. */
'use strict';
const {chromium}=require('playwright'),{spawn}=require('node:child_process');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'qa-artifacts/v3-visual');
(async()=>{
 const chrome=process.env.CHROME_BIN||'/usr/bin/chromium',env={...process.env,VISUAL_OUT:out,CHROME_BIN:chrome};
 const code=await new Promise((resolve,reject)=>{
  const p=spawn(process.execPath,[path.join(__dirname,'v3-visual-audit.cjs'),'--fixture-test'],{env,stdio:'inherit'});
  p.on('error',reject);p.on('exit',resolve);
 });
 assert.equal(code,0,'Fixture audit must complete successfully');
 const report=JSON.parse(fs.readFileSync(path.join(out,'report.json')));
 assert.equal(report.fixture,true);assert.equal(report.runs.length,2);
 assert.equal(report.runs[0].loaded,8);assert.equal(report.runs[1].loaded,8);
 assert.equal(report.runs.reduce((n,r)=>n+r.captures.length,0),18);
 assert(report.runs.every(r=>r.errors.length===0),'No fixture browser exceptions');
 assert(report.runs.every(r=>r.captures.every(c=>c.failures.length===0)),'No full-bleed geometry errors');
 // For self-test only, embed the fixture screenshots as data URLs to stay entirely offline.
 for(const run of report.runs){
  run.captures=run.captures.filter(c=>c.scene==='title'&&c.viewport==='1080p');
  for(const capture of run.captures)capture.image='data:image/png;base64,'+fs.readFileSync(path.join(out,capture.image)).toString('base64');
 }
 const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  let html=fs.readFileSync(path.join(root,'previews/v3-visual-review.html'),'utf8');
  html=html.replace('</head>','<base href="http://fixture.test/previews/"></head>')
   .replace("await fetch(reportPath,{cache:'no-store'})",'await Promise.resolve({ok:true,json:async()=>('+JSON.stringify(report)+')})');
  await page.setContent(html,{waitUntil:'load'});
  await page.waitForFunction(()=>document.getElementById('provenance').textContent.includes('FIXTURE'),{timeout:12000});
  assert.equal(await page.locator('#viewport option').count(),8);
  await page.locator('#compare').click();
  await page.locator('#reveal').fill('73');
  assert.equal(await page.locator('#revealValue').textContent(),'73%');
  await page.screenshot({path:path.join(out,'viewer-selftest.png')});
  assert.deepEqual(errors,[]);
 }finally{await browser.close()}
 console.log('V3_VISUAL_TOOLING_SELFTEST_PASS: 16 synthetic viewports, 18 fixture screenshots, reviewer overlay 73%, zero browser exceptions. NOT real-game evidence.');
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});