const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
fs.mkdirSync('qa-artifacts',{recursive:true});
const url=process.env.TEST_BASE_URL||'http://127.0.0.1:4173/arcade-nightshift.html';
const toView=(x,y)=>[x*1.2,(y*1.45-215)*900/760];
(async()=>{
const browser=await chromium.launch({headless:true,...(fs.existsSync('/usr/bin/google-chrome')?{executablePath:'/usr/bin/google-chrome'}:{}),args:['--no-sandbox','--disable-gpu-sandbox']});
try {
const page=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
assert.equal(response.status(),200);
await page.waitForFunction(()=>window.__officeArcade?.snapshot);
await page.waitForTimeout(180);
assert.equal((await page.locator('canvas').boundingBox()).width,1440);
await page.screenshot({path:'qa-artifacts/nightshift-title.png',animations:'disabled'});
const source=await page.locator('script').last().textContent();
const hud=source.slice(source.indexOf('function header(){'),source.indexOf('function playfield(){'));
assert.equal((hud.match(/text\(/g)||[]).length,2,'Only hearts and time may appear on gameplay HUD');
assert(!/state\.(score|combo|team|kpi|progress)/.test(hud));
await page.mouse.click(320,710);
const snap=()=>page.evaluate(()=>window.__officeArcade.snapshot());
assert.equal((await snap()).screen,'play');
await page.screenshot({path:'qa-artifacts/nightshift-action.png',animations:'disabled'});
await page.mouse.click(1125*1.2,39*900/760);
assert.equal((await snap()).screen,'pause');
const t=(await snap()).clock;await page.waitForTimeout(220);assert.equal((await snap()).clock,t);
await page.keyboard.press('Escape');
assert.equal((await snap()).screen,'play');
await page.waitForFunction(()=>window.__officeArcade.snapshot().ads.length>0,{timeout:18000});
const ad=(await snap()).ads[0];assert.equal(ad.real,true);
await page.screenshot({path:'qa-artifacts/nightshift-notification.png',animations:'disabled'});
await page.mouse.click(...toView(ad.x+ad.w/2,ad.y+129));
assert.equal((await snap()).adUsed,1,'Official help must have an actual effect');
let clear=false;for(let i=0;i<650;i++){
 const state=await snap();if(state.screen==='draft'){clear=true;break}
 if(state.screen==='recover')throw Error('Unexpected recovery in opening tutorial');
 if(state.ads.length){const a=state.ads[0];await page.mouse.click(...toView(a.real?a.x+a.w/2:a.x+a.w-22,a.real?a.y+129:a.y+18));continue}
 const paper=state.entities.slice().reverse().find(e=>e.kind==='paper'&&e.good&&e.x>90&&e.x<1020&&e.y>260&&e.y<590);
 if(paper)await page.mouse.click(...toView(paper.x+45,paper.y+54));else await page.waitForTimeout(45);
}
assert(clear,'Real pointer play must complete Stamp Rush');
const summary=await snap();assert.equal(summary.offers.length,3);
assert(summary.stats[0].points>0);
await page.screenshot({path:'qa-artifacts/nightshift-upgrade.png',animations:'disabled'});
assert.deepEqual(errors,[]);
console.log('NIGHT_SHIFT_BROWSER_PASS',{fullscreenCanvas:true,heartsTimeHUD:true,clockPause:true,helpfulNotification:true,openingCleared:true,errors:0});
await page.close();
}finally{await browser.close()}
})().catch(e=>{console.error('NIGHT_SHIFT_BROWSER_FAIL',e.stack||e);process.exitCode=1});
