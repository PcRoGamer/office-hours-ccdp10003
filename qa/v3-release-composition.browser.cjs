/* Full-bleed actual browser rendering from a temporary composed source tree.
 * All 14 available authored scenes share ONE canvas and input transform here.
 * The harness is a QA fixture, NOT the public route or a complete 16-card run.
 */
'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(process.cwd());
const out=path.join(root,'qa-artifacts/v3-release-composition/screenshots');
fs.mkdirSync(out,{recursive:true});
const report={checkedAt:new Date().toISOString(),screens:[],failures:[],passes:[],route:'previews/v3-release-composition.html'};
const pass=(msg,extra)=>{report.passes.push({msg,...extra});console.log('PASS '+msg)};
const fail=(msg,extra)=>{report.failures.push({msg,...extra});console.error('FAIL '+msg,JSON.stringify(extra))};
async function main(){
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  const states=[[1920,1080,['I1','I2','I3','I4','S1','S2','S3','S4','P1','P2','P3','P4','B1','B2']],
               [650,800,['I1','S2','P1','B1','B2']]];
  for(const [w,h,ids] of states){
   const page=await browser.newPage({viewport:{width:w,height:h},deviceScaleFactor:1,hasTouch:false});
   const errors=[],broken=[];
   page.on('pageerror',e=>errors.push(String(e.stack||e)));
   page.on('response',r=>{if(r.status()>=400&&new URL(r.url()).origin==='http://127.0.0.1:4173')broken.push(r.url()+': '+r.status())});
   const url='http://127.0.0.1:4173/previews/v3-release-composition.html';
   let response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:40000});
   if(response.status()!==200)fail('HTTP page status '+w+'x'+h,{status:response.status()});
   else pass('HTTP 200 '+w+'x'+h);
   try{await page.waitForFunction(()=>window.__swarmComposition?.importedIds?.length===14,{timeout:15000})}
   catch(e){fail('Modules import and start '+w+'x'+h,{err:String(e),errors});await page.close();continue}
   const sz=await page.evaluate(()=>{
    const e=document.querySelector('#world'),r=e.getBoundingClientRect();
    return{canvasX:r.x,canvasY:r.y,canvasW:r.width,canvasH:r.height,backingW:e.width,backingH:e.height,scrollW:document.documentElement.scrollWidth,scrollH:document.documentElement.scrollHeight};
   });
   if(sz.canvasX<=1&&sz.canvasY<=1&&sz.canvasW>=w-1&&sz.canvasH>=h-1&&sz.backingW>=w&&sz.backingH>=h&&sz.scrollW<=w+1&&sz.scrollH<=h+1)pass('True full bleed + backing pixels '+w+'x'+h);
   else fail('True full bleed + backing pixels '+w+'x'+h,{sz});
   for(const id of ids){
    try{
     await page.locator('button[data-card="'+id+'"]').click({timeout:10000});
     await page.waitForFunction(id=>window.__swarmComposition?.id===id,id,{timeout:10000});
     await page.waitForTimeout(420);
     const state=await page.evaluate(()=>({
      id:window.__swarmComposition.id,
      scene:window.__swarmComposition.scene?.snapshot?.(),
      errors:window.__swarmComposition.errors,
      events:window.__swarmComposition.events,
      viewport:window.__swarmComposition.viewport
     }));
     const err=[...errors,...state.errors];
     if(err.length)fail('Canvas draw/scene runtime '+id+' '+w+'x'+h,{errors:err.slice(0,5)});
     else pass('Real combined canvas draw '+id+' '+w+'x'+h);
     if(!state.scene||typeof state.scene!=='object')fail('Missing actual scene state '+id);
     else pass('Inspectable real scene snapshot '+id+' '+w+'x'+h);
     const name=id+'-'+w+'x'+h+'.png';
     // Capture actual scene pixels without the QA selector/HUD hiding the set.
     await page.evaluate(()=>document.body.classList.add('capture'));
     await page.screenshot({path:path.join(out,name),fullPage:false});
     await page.evaluate(()=>document.body.classList.remove('capture'));
     report.screens.push({id,viewport:[w,h],name,snapshotKeys:Object.keys(state.scene||{}).slice(0,15)});
    }catch(e){fail('Switch and render '+id+' '+w+'x'+h,{error:String(e.stack||e)})}
   }
   // Real physical input through the shared canvas transform. No synthetic
   // direct scene method calls: screen pointer -> viewport -> authored stamp.
   try{
    await page.evaluate(()=>window.__swarmComposition.choose('I1'));
    await page.waitForTimeout(1650);
    const item=await page.evaluate(()=>{
     const app=window.__swarmComposition,form=app.scene?.forms?.find(f=>f.kind==='approved'&&!f.hit&&f.x>0&&f.x<1200);
     if(!form)return null;
     return{point:app.viewport.worldToScreen(form.x+form.w/2,form.y+form.h/2),before:app.scene.snapshot().progress};
    });
    if(!item)fail('Stamped form is visible to the player '+w+'x'+h);
    else{
     await page.mouse.click(item.point.x,item.point.y);
     const after=await page.evaluate(()=>window.__swarmComposition.scene.snapshot().progress);
     if(after===item.before+1)pass('Real screen pointer resolves one and only one authorized I1 stamp '+w+'x'+h);
     else fail('Real screen pointer stamp mismapped or duplicated '+w+'x'+h,{before:item.before,after,point:item.point});
     await page.evaluate(()=>document.body.classList.add('capture'));
     await page.screenshot({path:path.join(out,'I1-physical-stamp-'+w+'x'+h+'.png')});
     await page.evaluate(()=>document.body.classList.remove('capture'));
    }
   }catch(e){fail('Cross-module physical input regression '+w+'x'+h,{error:String(e.stack||e)})}
   // Drive one genuine Printer Mutiny counter using ONLY browser pointer input.
   // The ~3.8-second windup is genuine game time, not an invented QA shortcut.
   try{
    await page.evaluate(()=>window.__swarmComposition.choose('B1'));
    await page.waitForFunction(()=>{const a=window.__swarmComposition.scene?.snapshot?.();return a?.phase==='jam'&&a?.safePull===true},{timeout:12000});
    const point=async(x,y)=>page.evaluate(([x,y])=>window.__swarmComposition.viewport.worldToScreen(x,y),[x,y]);
    const pullStart=await point(-104,105),pullEnd=await point(-104,239);
    await page.mouse.move(pullStart.x,pullStart.y);await page.mouse.down();
    await page.mouse.move(pullEnd.x,pullEnd.y,{steps:12});await page.mouse.up();
    let b=await page.evaluate(()=>window.__swarmComposition.scene.snapshot());
    if(b.phase==='counter')pass('Physical printer jam pulled into actual feeder-opening phase '+w+'x'+h);
    else fail('Printer page pull did not advance boss '+w+'x'+h,{phase:b.phase});
    if(b.phase==='counter'&&b.packet){
     const from=await point(b.packet.x,b.packet.y),to=await point(b.feederX,50);
     await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:16});await page.mouse.up();
     b=await page.evaluate(()=>window.__swarmComposition.scene.snapshot());
     if(b.phase==='impact'&&b.manualHits===1)pass('Physical printer packet removes first bolt exactly once '+w+'x'+h);
     else fail('Printer counter did not register exactly one manual hit '+w+'x'+h,{phase:b.phase,hits:b.manualHits,removed:b.removed});
     await page.evaluate(()=>document.body.classList.add('capture'));
     await page.screenshot({path:path.join(out,'B1-physical-counter-'+w+'x'+h+'.png')});
     await page.evaluate(()=>document.body.classList.remove('capture'));
    }
   }catch(e){fail('End-to-end shared-canvas printer counter '+w+'x'+h,{error:String(e.stack||e)})}
   if(w===1920){
    try{
     const before=await page.evaluate(()=>window.__swarmComposition.viewport.cssWidth);
     await page.setViewportSize({width:650,height:800});
     await page.waitForTimeout(140);
     const after=await page.evaluate(()=>window.__swarmComposition.viewport.cssWidth);
     if(before===1920&&after===650)pass('Live scene viewport object updates across desktop→portrait resize');
     else fail('Stale viewport on live resize',{before,after});
     await page.setViewportSize({width:1920,height:1080});
    }catch(e){fail('Live resize regression',{error:String(e)})}
   }
   if(broken.length)fail('Network missing assets '+w+'x'+h,{broken});
   else pass('No missing same-origin assets '+w+'x'+h);
   await page.close();
  }
 }finally{await browser.close()}
}
(async()=>{try{await main()}catch(e){fail('Fatal browser test',{error:String(e.stack||e)})}finally{
 const file=path.join(root,'qa-artifacts/v3-release-composition/browser-report.json');
 fs.writeFileSync(file,JSON.stringify(report,null,2));
 console.log('REHEARSAL_BROWSER',{screens:report.screens.length,checks:report.passes.length,failures:report.failures.length});
 if(report.failures.length)process.exitCode=1;
}})();
