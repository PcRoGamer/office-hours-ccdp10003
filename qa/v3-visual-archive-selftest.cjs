#!/usr/bin/env node
'use strict';
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
(async()=>{
 const dataRoot=process.env.HD_ARCHIVE_REPORT?path.resolve(process.env.HD_ARCHIVE_REPORT):path.join(root,'qa-artifacts/v3-visual/real-archive/report.json');
 const report=JSON.parse(fs.readFileSync(dataRoot,'utf8'));
 assert.equal(report.sourceKind,'historical-real-browser-actions-artifacts');
 assert.deepEqual(report.runs.map(r=>r.variant),['hd','donor']);
 for(const run of report.runs){
  for(const cap of run.captures){const p=path.resolve(path.dirname(dataRoot),cap.image);cap.image='data:image/png;base64,'+fs.readFileSync(p).toString('base64')}
 }
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const html=fs.readFileSync(path.join(root,'previews/v3-visual-review.html'),'utf8')
    .replace('</head>','<base href="https://fixture.invalid/previews/"></head>')
    .replace("await fetch(reportPath,{cache:'no-store'})",'await Promise.resolve({ok:true,json:async()=>('+JSON.stringify(report)+')})');
  await page.setContent(html,{waitUntil:'load'});
  await page.waitForFunction(()=>document.getElementById('provenance').textContent.includes('ARCHIVED REAL GAME'),{timeout:10000});
  assert.match(await page.locator('#comparison-label').textContent(),/FIRST SHIFT/);
  assert.match(await page.locator('#comparison-gate-label').textContent(),/NOT V3/);
  assert.equal(await page.locator('#viewport').inputValue(),'650×800@1x');
  assert.equal(await page.locator('#compare').isDisabled(),false,'Same-viewport portrait title pair is comparable');
  assert.equal(await page.locator('.surface.missing').count(),0);
  await page.locator('#compare').click();await page.locator('#reveal').fill('73');
  assert.equal(await page.locator('#revealValue').textContent(),'73%');
  await page.screenshot({path:path.join(path.dirname(dataRoot),'real-browser-archive-viewer.png'),fullPage:true});
  await page.locator('#scene').selectOption('action');
  assert.equal(await page.locator('#compare').isDisabled(),true,'Unpaired donor action must not offer a misleading split');
  assert.equal(await page.locator('.surface.missing').count(),1,'HD action 650x800 is absent from archive');
  assert.deepEqual(errors,[]);
  console.log('REAL_BROWSER_ARCHIVE_VIEWER_PASS',report.runs.map(r=>r.captures.length));
 }finally{await browser.close()}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
