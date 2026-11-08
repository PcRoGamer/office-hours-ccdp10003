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
     await page.screenshot({path:path.join(out,name),fullPage:false});
     report.screens.push({id,viewport:[w,h],name,snapshotKeys:Object.keys(state.scene||{}).slice(0,15)});
    }catch(e){fail('Switch and render '+id+' '+w+'x'+h,{error:String(e.stack||e)})}
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
