const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('fs');
fs.mkdirSync('qa-artifacts',{recursive:true});
const url=process.env.TEST_BASE_URL||'http://127.0.0.1:4173/arcade-office-hd.html';
(async()=>{
 const browser=await chromium.launch({headless:true,...(fs.existsSync('/usr/bin/google-chrome')?{executablePath:'/usr/bin/google-chrome'}:{}),args:['--no-sandbox','--disable-gpu-sandbox']});
 try{
  for(const [w,h,dpr] of [[1440,900,2],[1920,1080,2],[650,800,1]]){
   const page=await browser.newPage({viewport:{width:w,height:h},deviceScaleFactor:dpr}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(15000);
   const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});assert.equal(response.status(),200);
   await page.waitForFunction(()=>window.__officeArcade?.snapshot()?.atlasReady,{timeout:30000});
   const snap=()=>page.evaluate(()=>window.__officeArcade.snapshot());let state=await snap();
   assert.equal(state.layout,'hidpi-aspect-correct');assert.equal(state.art,'nightshift-baked-spritesheet');
   const dims=await page.locator('#game').evaluate(el=>[el.width,el.height]);
   assert(dims[0]>=w&&dims[1]>=h,'High resolution backing canvas');
   assert.equal(state.viewport.mode,w===650?'contain':'cover');
   await page.screenshot({path:'qa-artifacts/title-'+w+'.png'});
   if(w!==1440){assert.deepEqual(errors,[]);await page.close();continue}
   const xy=(x,y,play=true)=>{const vp=state.viewport;return [x*vp.scale+vp.ox,(play?y*1.45-215:y)*vp.scale+vp.oy]};
   await page.mouse.click(...xy(220,605,false));assert.equal((await snap()).screen,'play');
   await page.screenshot({path:'qa-artifacts/fullscreen.png'});
   await page.mouse.click(...xy(1125,44,false));assert.equal((await snap()).screen,'pause');
   const t=(await snap()).clock;await page.waitForTimeout(210);assert.equal((await snap()).clock,t);
   await page.keyboard.press('Escape');
   await page.waitForFunction(()=>window.__officeArcade.snapshot().ads.length>0,{timeout:18000});
   state=await snap();assert.equal(state.ads[0].real,true);
   let a=state.ads[0];await page.mouse.click(...xy(a.x+a.w/2,a.y+129));assert.equal((await snap()).adUsed,1);
   let cleared=false;for(let n=0;n<560;n++){
    state=await snap();if(state.screen==='draft'){cleared=true;break}
    if(state.screen==='recover')throw Error('unexpected recovery');
    if(state.ads.length){a=state.ads[0];await page.mouse.click(...xy(a.real?a.x+a.w/2:a.x+a.w-22,a.real?a.y+129:a.y+18));continue}
    const e=state.entities.find(e=>e.kind==='paper'&&e.good&&e.x>95&&e.x<1010&&e.y>270&&e.y<590);
    if(e)await page.mouse.click(...xy(e.x+44,e.y+55));else await page.waitForTimeout(40);
   }
   assert(cleared,'Stamp Rush completes into email');
   await page.locator('#intermission.visible').waitFor();
   assert.equal(await page.locator('.im-mail').count(),1);
   assert.equal(await page.locator('.im-workbook').count(),1);
   assert.equal(await page.locator('.im-grid tbody tr').count(),5);
   assert.equal(await page.locator('button.im-cell.pick').count(),3);
   await page.screenshot({path:'qa-artifacts/email-excel.png'});
   const perk=await page.locator('button.im-cell.pick').first().getAttribute('data-perk');
   await page.locator('button.im-cell.pick').first().click();
   state=await snap();assert.equal(state.screen,'play');assert.equal(state.phase,1);
   assert(state.perks.includes(perk));assert.equal(state.draftHistory.length,1);
   assert.deepEqual(errors,[]);
   console.log('NIGHTSHIFT_HD_OFFICE_QA_PASS',{retina:true,sprites:true,officeIntermission:true,perks:true});
   await page.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});