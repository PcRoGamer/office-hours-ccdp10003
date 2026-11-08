/* v3 release-lane prototype smoke for independently owned branches.
 * Does not modify, combine or pretend to integrate another agent's work.
 * node ../release-harness/qa/v3-release-previews.cjs (from candidate repo root).
 * Requires PREVIEW_LANE and PREVIEW_PATH.
 */
'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const lane=process.env.PREVIEW_LANE||'unknown';
const preview=process.env.PREVIEW_PATH;
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:4173/';
assert(/^[a-z]+$/.test(lane),'Unsafe lane name');
assert(/^previews\/v3-[a-z-]+\.html$/.test(preview||''),'Preview path missing');
assert(fs.existsSync(preview),'Actual candidate preview file is missing');
const evidence=path.resolve(process.env.PREVIEW_OUT||'qa-artifacts/v3-release-previews');
fs.mkdirSync(evidence,{recursive:true});
const report={lane,preview,source:process.env.GITHUB_SHA||'branch HEAD',time:new Date().toISOString(),sizes:[],errors:[],checks:[],failures:[]};
const check=(value,description,extra={})=>{(value?report.checks:report.failures).push({description,...extra});console.log((value?'PASS ':'FAIL ')+lane+' '+description)};
async function test(){
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const [w,h,dpr] of [[1920,1080,1],[650,800,1]]){
   const context=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:dpr});
   const page=await context.newPage(),errors=[],broken=[];
   page.on('pageerror',e=>errors.push(String(e)));
   page.on('response',r=>{if(r.status()>=400&&new URL(r.url()).origin===new URL(base).origin)broken.push({url:r.url(),status:r.status()})});
   page.on('requestfailed',r=>{if(new URL(r.url()).origin===new URL(base).origin)broken.push({url:r.url(),error:r.failure()?.errorText})});
   let response;
   try{response=await page.goto(new URL(preview,base).toString(),{waitUntil:'domcontentloaded',timeout:45000})}
   catch(e){check(false,'preview navigates '+w+'x'+h,{error:String(e)});await context.close();continue}
   check(response.status()===200,'HTTP 200 '+w+'x'+h);
   await page.waitForTimeout(750);
   const scene=await page.evaluate(()=>{
    const c=document.querySelector('canvas'),r=c?.getBoundingClientRect();
    const v={innerW:innerWidth,innerH:innerHeight,scrollW:document.documentElement.scrollWidth,scrollH:document.documentElement.scrollHeight,
      canvas:r?{x:r.x,y:r.y,w:r.width,h:r.height,pixelW:c.width,pixelH:c.height}:null};
    return v;
   });
   check(!!scene.canvas,'real canvas is visible '+w+'x'+h,{scene});
   if(scene.canvas){
    check(scene.canvas.x<=1&&scene.canvas.y<=1&&scene.canvas.w>=w-2&&scene.canvas.h>=h-2,
     'actual full-bleed world '+w+'x'+h,{scene});
    check(scene.canvas.pixelW>=w*.9&&scene.canvas.pixelH>=h*.9,
     'canvas backing pixels cover viewport '+w+'x'+h,{scene});
   }
   check(scene.scrollW<=w+2&&scene.scrollH<=h+2,'no browser letterbox scroll '+w+'x'+h,{scene});
   if(w===1920){
    try{
     if(lane==='intake'){
      await page.locator('#play').click();
      check(await page.evaluate('window.__intakeDebug?.getState()?.paused===false'),'CLOCK IN starts intake');
      await page.locator('[data-card="I3"]').click();
      check(await page.evaluate('window.__intakeDebug?.getState()?.id==="I3"'),'I3 scam/help demo selectable');
     }else if(lane==='services'){
      await page.locator('#next').click();
      check(await page.evaluate('window.__services?.state?.scene?.snapshot()?.id==="S2"'),'NEXT changes physical scene S1→S2');
     }else if(lane==='physics'){
      await page.locator('#pause').click();
      check((await page.locator('#pause').innerText()).toUpperCase().includes('RESUME'),'Planck pause control responds');
      await page.locator('#pause').click();
     }else if(lane==='systems'){
      const snap=await page.evaluate(()=>({b:window.__v3SystemsLab?.buttons?.length,stage:window.__v3SystemsLab?.snapshot?.stage}));
      check(snap.b>0,'systems preview has real interactive targets',{snap});
      await page.keyboard.press('Space');
      const paused=await page.evaluate('window.__v3SystemsLab?.run?._paused');
      check(paused===true,'systems engine pauses from keyboard');
      await page.keyboard.press('Space');
     }else if(lane==='story'){
      await page.locator('#launch').click();
      check(await page.locator('[data-pick]').count()===3,'promotion offers exactly 3 actionable perks');
      await page.locator('[data-pick]').first().click();
      check((await page.evaluate('window.__storyPreview?.picks?.length'))===1,'one real promotion selection registered');
     }else if(lane==='pr'){
      await page.locator('[data-card="P4"]').click();
      check((await page.evaluate('window.__pr?.card'))==='P4','PR selects mandatory P4 framing card');
      await page.locator('[data-card="P1"]').click();
      check((await page.evaluate('window.__pr?.card'))==='P1','PR can return to truthful graph challenge');
     }else if(lane==='printer'){
      await page.locator('#go').click();
      check(await page.evaluate('document.querySelector("#start")?.classList.contains("hidden")'),'Printer Mutiny enters real boss arena');
      check(!!(await page.evaluate('window.__printerQA?.()')),'Printer Mutiny exposes real boss snapshot');
     }else if(lane==='quota'){
      check(!!(await page.evaluate('window.__QUOTA_STATE')),'THE QUOTA has live state and counter phases');
      await page.locator('#pause').click();
      check((await page.locator('#pause').innerText())==='RESUME','THE QUOTA pauses on actual input');
      await page.locator('#pause').click();
     }else if(lane==='a11y'){
      await page.locator('#start').click();
      check((await page.evaluate('window.__nightShiftA11yPreview?.snapshot()?.status'))==='play','Accessible controls start real stage');
      check(await page.evaluate('document.querySelector("#hud")?.classList.contains("show")'),'Accessible hearts/time HUD becomes visible');
     }
    }catch(e){check(false,'real pointer/keyboard interaction: '+String(e))}
   }
   await page.waitForTimeout(260);
   check(!errors.length,'no uncaught JS exceptions '+w+'x'+h,{errors});
   check(!broken.length,'no missing same-origin assets '+w+'x'+h,{broken});
   const name=lane+'-'+w+'x'+h;
   await page.screenshot({path:path.join(evidence,name+'.png')});
   fs.writeFileSync(path.join(evidence,name+'.json'),JSON.stringify({lane,preview,scene,errors,broken},null,2));
   report.sizes.push({w,h,dpr});
   await context.close();
  }
 }finally{await browser.close()}
}
(async()=>{try{await test()}catch(e){check(false,'fatal '+String(e.stack||e))}finally{
  fs.writeFileSync(path.join(evidence,lane+'-report.json'),JSON.stringify(report,null,2));
  console.log('PREVIEW_QA',JSON.stringify({lane,passes:report.checks.length,failures:report.failures.length}));
  if(report.failures.length)process.exitCode=1;
}})();
