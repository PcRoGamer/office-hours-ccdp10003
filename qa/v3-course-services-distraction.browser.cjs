#!/usr/bin/env node
'use strict';
/*
 COURSE: verify an actual pointer-interrupting corporate ad exists in another
 department, beyond Intake. Real Edge/Playwright pointer drag against Services S3.
 This is a component demo check only, not proof of integrated cross-scene carryover.

 Run: node qa/v3-course-services-distraction.browser.cjs --root=<services-worktree>
 NODE_PATH should point at installed playwright. QA_OUTPUT_DIR stores screenshots.
*/
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const arg=(key,fallback)=>{const x=process.argv.find(s=>s.startsWith('--'+key+'='));return x?x.slice(key.length+3):fallback};
const root=path.resolve(arg('root','.')),out=path.resolve(arg('out',process.env.QA_OUTPUT_DIR||'qa-artifacts/v3-course-services-distraction'));
const serve=(req,res)=>{
 const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'');
 const full=path.resolve(root,rel);
 if(!full.startsWith(root+path.sep)){res.writeHead(403);return res.end('Forbidden');}
 try{let ext=path.extname(full);res.setHeader('Content-Type',ext==='.js'?'text/javascript':ext==='.html'?'text/html':ext==='.css'?'text/css':'application/octet-stream');res.end(fs.readFileSync(full));}
 catch{res.writeHead(404);res.end('Not found '+rel);}
};
async function run(){
 fs.mkdirSync(out,{recursive:true});let server,browser;
 const report={scope:'REAL POINTER ADS IN SERVICES S3, NOT FULL GAMEPLAY OR HUMAN PLAYTEST',views:[],status:'NOT_RUN',checkedAt:new Date().toISOString()};
 try{
 server=http.createServer(serve);await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
 const {chromium}=require('playwright'),opt={headless:true,args:['--no-sandbox']};
 if(process.platform==='win32')for(const f of ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe','C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe']){
   if(fs.existsSync(f)){opt.executablePath=f;break;}
 }else if(fs.existsSync('/usr/bin/google-chrome'))opt.executablePath='/usr/bin/google-chrome';
 browser=await chromium.launch(opt);
 for(const [width,height] of [[1440,900],[650,800]]){
  const result={viewport:width+'x'+height,checks:[],errors:[]};report.views.push(result);
  const check=(name,ok,detail)=>result.checks.push({name,status:ok?'PASS':'FAIL',detail});
  const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:1});
  const page=await ctx.newPage();page.on('pageerror',e=>result.errors.push(e.message));
  try{
   const nav=await page.goto('http://127.0.0.1:'+server.address().port+'/previews/v3-services.html',{waitUntil:'domcontentloaded',timeout:16000});
   check('HTTP_200',nav.status()===200,nav.status());
   await page.selectOption('#directive','sponsored-workflow');
   await page.evaluate(()=>window.__services.load(2));  // index 2 = S3, safe printer page pull
   await page.waitForTimeout(200);
   const initial=await page.evaluate(()=>({
     id:window.__services.definitions[window.__services.state.idx].id,
     state:window.__services.state.scene.snapshot(),
     start:window.__services.viewport.worldToScreen(600,477),
     end:window.__services.viewport.worldToScreen(850,560),
     box:document.querySelector('#scene').getBoundingClientRect().toJSON(),
     size:{w:innerWidth,h:innerHeight}
   }));
   check('S3_SELECTED',initial.id==='S3',initial.id);
   check('WORLD_EDGE_TO_EDGE',initial.box.x===0&&initial.box.y===0&&
       Math.abs(initial.box.width-width)<=1&&Math.abs(initial.box.height-height)<=1,initial.box);
   check('SPONSORED_AD_PRESENT',initial.state.adVisible===true,{snapshot:initial.state});
   const a=initial.start,b=initial.end;
   check('DRAG_POINTS_ONSCREEN',a.x>0&&a.x<width&&a.y>0&&a.y<height&&b.x>0&&b.x<width&&b.y>0&&b.y<height,{start:a,end:b});
   const before='services-s3-sponsored-before-'+width+'x'+height+'.png';
   await page.screenshot({path:path.join(out,before)});result.before=before;
   if(a.x>0&&a.x<width&&a.y>0&&a.y<height&&b.x>0&&b.x<width&&b.y>0&&b.y<height){
     await page.mouse.move(a.x,a.y);
     await page.mouse.down();
     await page.mouse.move(b.x,b.y,{steps:6});
     await page.mouse.up();
     await page.waitForTimeout(150);
   }
   const next=await page.evaluate(()=>window.__services.state.scene.snapshot());
   check('REAL_MOUSE_DISMISSES_SPONSORED_AD',next.adVisible===false,{before:initial.state.adVisible,after:next.adVisible});
   check('NO_PAGE_EXCEPTIONS',result.errors.length===0,result.errors);
   result.after='services-s3-sponsored-after-'+width+'x'+height+'.png';
   await page.screenshot({path:path.join(out,result.after)});
   // Secondary fairness probe: if the same large ad is rendered under a
   // NON-sponsored corporate directive, it must remain meaningfully dismissible.
   // Otherwise the player sees a fake interactive object with a dead hitbox.
   await page.selectOption('#directive','fast-or-safe');
   await page.evaluate(()=>window.__services.load(2));
   await page.waitForTimeout(100);
   const normal=await page.evaluate(()=>({
     adVisible:window.__services.state.scene.snapshot().adVisible,
     start:window.__services.viewport.worldToScreen(600,477),
     end:window.__services.viewport.worldToScreen(850,560)
   }));
   result.defaultBefore='services-s3-default-before-'+width+'x'+height+'.png';
   await page.screenshot({path:path.join(out,result.defaultBefore)});
   if(normal.adVisible){
     await page.mouse.move(normal.start.x,normal.start.y);
     await page.mouse.down();
     await page.mouse.move(normal.end.x,normal.end.y,{steps:6});
     await page.mouse.up();
     await page.waitForTimeout(110);
   }
   const normalAfter=await page.evaluate(()=>window.__services.state.scene.snapshot());
   check('DEFAULT_AD_NOT_A_DEAD_CONTROL',
     normal.adVisible===false || normalAfter.adVisible===false,
     {adRenderedWithFastOrSafe:normal.adVisible,
      afterActualPointerDrag:normalAfter.adVisible,
      expected:'No obstructive unresponsive sponsored ad under a different directive'});
   result.defaultAfter='services-s3-default-after-'+width+'x'+height+'.png';
   await page.screenshot({path:path.join(out,result.defaultAfter)});
  }catch(e){result.error=String(e.stack||e).slice(0,1100)}
  finally{await ctx.close().catch(()=>{})}
 }
 }catch(e){report.error=String(e.stack||e).slice(0,1400)}
 finally{if(browser)await browser.close().catch(()=>{});if(server)await new Promise(r=>server.close(r))}
 const fail=report.views.reduce((n,v)=>n+v.checks.filter(c=>c.status==='FAIL').length+(v.error?1:0),0)+(report.error?1:0);
 report.status=fail===0&&report.views.length===2?'SERVICES_S3_SPONSORED_POINTER_SMOKE_PASS':'FAIL';
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({status:report.status,views:report.views.map(v=>({
  viewport:v.viewport,passed:v.checks.filter(c=>c.status==='PASS').length,failed:v.checks.filter(c=>c.status==='FAIL'),
  error:v.error||null,before:v.before,after:v.after})),error:report.error||null,output:out},null,2));
 if(report.status==='FAIL')process.exitCode=1;
}
run().catch(e=>{console.error(e);process.exitCode=1});
