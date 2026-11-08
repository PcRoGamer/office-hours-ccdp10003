#!/usr/bin/env node
/** Real Playwright QA. Fixture mode tests the QA input rig; candidate mode fails closed. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
let chromium;try{({chromium}=require('playwright'))}catch(e){console.error('BLOCKED: install Playwright with npm i --no-save playwright; npx playwright install chromium');process.exit(2)}
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:4173';
const fixture=process.argv.includes('--fixture');
const url=process.env.V3_GAME_URL||base+(fixture?'/previews/v3-gameqa.html':'/night-shift-v3.html');
const dest=process.env.QA_ARTIFACT_DIR||'qa-artifacts/v3-game';fs.mkdirSync(dest,{recursive:true});
(async()=>{const browser=await chromium.launch({headless:true,...fs.existsSync('/usr/bin/chromium')?{executablePath:'/usr/bin/chromium'}:{},args:['--no-sandbox']});
 try{
  for(const [w,h,dpr] of [[1920,1080,1],[2560,1440,1],[3840,2160,1],[3440,1440,1],[650,800,1]]){
   const page=await browser.newPage({viewport:{width:w,height:h},deviceScaleFactor:dpr});const errors=[];page.on('pageerror',e=>errors.push(e.message));
   const resp=await page.goto(url,{waitUntil:'domcontentloaded',timeout:35000});assert.equal(resp?.status(),200,'route not served '+url);
   if(fixture){
    await page.waitForFunction(()=>!!window.__v3GameQaFixture);
    const snap=()=>page.evaluate(()=>window.__v3GameQaFixture.snapshot());let s=await snap();
    assert.equal(s.fixture,true);assert.equal(s.width,w);assert.equal(s.height,h);
    const box=await page.locator('#world').boundingBox();assert.equal(box.width,w);assert.equal(box.height,h);
    const src={x:s.paper.x,y:s.paper.y},dst={x:s.target.x,y:s.target.y};
    await page.mouse.move(src.x,src.y);await page.mouse.down();await page.mouse.move(dst.x,dst.y,{steps:18});await page.mouse.up();s=await snap();
    assert.equal(s.hits,1,'real browser drag should reach target');
    await page.locator('#pause').click();const before=(await snap()).clockMs;await page.waitForTimeout(230);assert.equal((await snap()).clockMs,before,'pause must freeze gameplay clock');
    await page.locator('#pause').click();await page.locator('#reset').click();assert.equal((await snap()).hits,0);
   }else{
    const hasGame=await page.evaluate(()=>!!window.__nightShiftV3?.snapshot);
    assert(hasGame,'BLOCKED: production game must expose read-only window.__nightShiftV3.snapshot() at '+url+'; fixture passing never certifies game');
    const state=await page.evaluate(()=>window.__nightShiftV3.snapshot());
    assert(state&&typeof state==='object','snapshot API must return state');
    assert(!state.fixture,'fixture must not masquerade as game');
    const canvas=page.locator('canvas').first();const box=await canvas.boundingBox();
    assert(box&&box.width>=w-1&&box.height>=h-1,'World must cover viewport, not letterboxed rectangle');
    assert.equal(page.url().includes('v3-gameqa'),false,'No test fixture can satisfy production checks');
   }
   await page.screenshot({path:path.join(dest,(fixture?'fixture':'game')+'-'+w+'x'+h+'.png'),animations:'disabled'});
   assert.deepEqual(errors,[],'No uncaught JS errors');console.log((fixture?'FIXTURE_ONLY':'PRODUCTION_SMOKE')+' '+w+'x'+h+': PASS');await page.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error('V3_GAME_QA_FAIL',e.stack||e);process.exitCode=1});
