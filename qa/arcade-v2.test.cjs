const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const origin=process.env.TEST_BASE_URL||'http://127.0.0.1:4173/arcade-v2.html';
(async()=>{
  const exe=fs.existsSync('/usr/bin/google-chrome')?'/usr/bin/google-chrome':fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined;
  const browser=await chromium.launch({headless:true,...exe?{executablePath:exe}:{},args:['--no-sandbox','--disable-gpu-sandbox']});
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const r=await page.goto(origin,{waitUntil:'domcontentloaded',timeout:45000});assert.equal(r.status(),200);
  await page.waitForFunction(()=>!!window.__officeArcade?.snapshot);
  const s=()=>page.evaluate(()=>window.__officeArcade.snapshot());
  const click=(x,y)=>page.mouse.click(x*1.2,y*900/760);
  await page.screenshot({path:'qa-artifacts/arcade-v2-title.png'});
  const box=await page.locator('#wrap').boundingBox();assert.equal(box.width,1440);assert.equal(box.height,900);
  await click(600,606);assert.equal((await s()).screen,'play');
  await page.screenshot({path:'qa-artifacts/arcade-v2-fullscreen.png'});
  await page.waitForFunction(()=>window.__officeArcade.snapshot().ads.length>0,null,{timeout:15000});
  let a=(await s()).ads[0];assert.equal(a.real,true,'First notification must be genuine, not a spam-only tutorial');
  await page.screenshot({path:'qa-artifacts/arcade-v2-beneficial-popup.png'});
  await click(a.x+105,a.y+95);assert.equal((await s()).adUsed,1,'Useful popup must have a real acceptance path');
  let done=false;
  for(let i=0;i<220;i++){
    const st=await s();if(st.screen==='draft'){done=true;break}
    if(st.screen==='recover')throw Error('Unexpected recovery during the first mission');
    if(st.ads.length){a=st.ads[0];await click(a.real?a.x+100:a.x+a.w-22,a.real?a.y+100:a.y+18)}
    else {
      const good=st.entities.slice().reverse().find(e=>e.kind==='paper'&&e.good&&e.x>80&&e.x<1050&&e.y>225&&e.y<585);
      if(good)await click(good.x+47,good.y+54);
    }
    await page.waitForTimeout(65);
  }
  assert(done,'Real mouse clicks did not reach the upgrade draft');
  const draft=await s();assert.equal(draft.offers.length,3);assert(new Set(draft.offers).size===3);
  await page.screenshot({path:'qa-artifacts/arcade-v2-upgrade.png'});
  await click(251,420);const after=await s();assert.equal(after.phase,1);assert.equal(after.perks.length,1);
  assert.equal(errors.length,0,'Browser errors: '+errors.join(' | '));
  console.log('ARCADE_V2_CI_PASS',JSON.stringify({fullViewport:true,usefulPopup:true,oneOfThreeDraft:true,round2:true,errors:0}));
  await browser.close();
})().catch(e=>{console.error('ARCADE_V2_CI_FAIL',e.stack||e);process.exit(1)});
