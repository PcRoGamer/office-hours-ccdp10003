/* Smoke-test the actual portable double-click HTML, with no HTTP server,
 * network, build tool, or fake canvas. Run from staging working directory.
 */
'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=process.cwd();
const file=path.resolve(root,'qa-artifacts/v3-release-composition/playable/index.html');
const report={file,failures:[],passes:[]};
const test=(ok,name,details={})=>{(ok?report.passes:report.failures).push({name,...details});console.log((ok?'PASS ':'FAIL ')+name)};
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--allow-file-access-from-files']});
 try{
  for(const [w,h] of [[1920,1080],[650,800]]){
   const page=await browser.newPage({viewport:{width:w,height:h}});
   const errors=[];const externalRequests=[];
   page.on('pageerror',e=>errors.push(String(e.stack||e)));
   page.on('request',r=>{if(/^https?:/i.test(r.url()))externalRequests.push(r.url())});
   const response=await page.goto(pathToFileURL(file).href,{waitUntil:'domcontentloaded',timeout:20000});
   await page.waitForFunction(()=>window.__swarmComposition?.importedIds?.length===14,{timeout:13000});
   await page.waitForTimeout(300);
   test((await page.evaluate('window.__swarmComposition.importedIds.length'))===14,'All 14 authored scenes load offline at '+w+'x'+h);
   await page.locator('button[data-card="B2"]').click();
   test((await page.evaluate('window.__swarmComposition.id'))==='B2','Offline boss changes on actual click '+w+'x'+h);
   const state=await page.evaluate(()=>{
    const a=window.__swarmComposition,box=document.querySelector('canvas').getBoundingClientRect();
    return{errors:a.errors,mode:a.scene.snapshot().mode,
      canvas:{x:box.x,y:box.y,w:box.width,h:box.height},vw:innerWidth,vh:innerHeight};
   });
   test(!errors.length&&!state.errors.length,'Offline JS and rendered scene error-free '+w+'x'+h,{errors:[...errors,...state.errors]});
   test(!externalRequests.length,'Fully offline (no HTTP requests) '+w+'x'+h,{externalRequests});
   test(state.canvas.x<=1&&state.canvas.y<=1&&state.canvas.w>=w-2&&state.canvas.h>=h-2,'Offline canvas fills viewport '+w+'x'+h);
   await page.screenshot({path:path.join(root,'qa-artifacts/v3-release-composition','offline-'+w+'x'+h+'.png')});
   await page.close();
  }
 }finally{await browser.close()}
})().catch(e=>test(false,'Portable bundle smoke fatal',{error:String(e.stack||e)})).finally(()=>{
 fs.writeFileSync(path.join(root,'qa-artifacts/v3-release-composition','offline-test.json'),JSON.stringify(report,null,2));
 console.log('OFFLINE_BUNDLE_TEST',{passed:report.passes.length,failed:report.failures.length});
 if(report.failures.length)process.exitCode=1;
});
