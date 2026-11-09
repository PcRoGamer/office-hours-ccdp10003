#!/usr/bin/env node
'use strict';
/* Real Edge/Playwright first-action browser smoke. NOT a human playtest or full v3 release QA.
Run: node qa/v3-course-first-action.browser.cjs --root=<Intake-branch-worktree>
Optional NODE_PATH points to installed playwright; QA_OUTPUT_DIR sets evidence output. */
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const arg=(key,def)=>{const x=process.argv.find(s=>s.startsWith('--'+key+'='));return x?x.slice(key.length+3):def};
const root=path.resolve(arg('root','.'));
const out=path.resolve(arg('out',process.env.QA_OUTPUT_DIR||'qa-artifacts/v3-course-first-action'));
const sizes=[[1440,900],[1920,1080],[3840,2160],[650,800]];
const serve=(req,res)=>{
 const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'');
 const full=path.resolve(root,rel);
 if(!full.startsWith(root+path.sep)){res.writeHead(403);return res.end('Forbidden');}
 try{const ext=path.extname(full);res.setHeader('Content-Type',ext==='.js'?'text/javascript':ext==='.html'?'text/html':ext==='.css'?'text/css':'application/octet-stream');res.end(fs.readFileSync(full));}
 catch{res.writeHead(404);res.end('Not found '+rel);}
};
async function run(){
 fs.mkdirSync(out,{recursive:true});
 let server,browser;const report={scope:'REAL INPUT SMOKE ONLY, no human playtime or integrated full v3 claim',time:new Date().toISOString(),root,views:[],status:'UNTESTED'};
 try{
 server=http.createServer(serve);
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
 const {chromium}=require('playwright'),options={headless:true,args:['--no-sandbox']};
 if(process.platform==='win32'){
   for(const f of ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe','C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe']){
     if(fs.existsSync(f)){options.executablePath=f;break;}
   }
 }else if(fs.existsSync('/usr/bin/google-chrome')) options.executablePath='/usr/bin/google-chrome';
 browser=await chromium.launch(options);
 for(const [w,h] of sizes){
  const v={viewport:w+'x'+h,checks:[],errors:[]};report.views.push(v);
  const check=(key,pass,detail)=>v.checks.push({key,status:pass?'PASS':'FAIL',detail});
  const context=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:1});
  const page=await context.newPage();
  page.on('pageerror',e=>v.errors.push(e.message));
  try{
    const response=await page.goto('http://127.0.0.1:'+server.address().port+'/previews/v3-intake.html',{waitUntil:'domcontentloaded',timeout:15000});
    check('HTTP_200',response?.status()===200,response?.status());
    const r=await page.locator('#world').boundingBox();
    check('EDGE_TO_EDGE',r && Math.abs(r.x)<=1 && Math.abs(r.y)<=1 && Math.abs(r.width-w)<=1 && Math.abs(r.height-h)<=1,r);
    const btn=page.locator('#play');
    check('CLOCK_IN_VISIBLE',await btn.isVisible(),null);
    const began=Date.now();
    await btn.click({timeout:4000});
    await page.waitForTimeout(260);
    const state=await page.evaluate(()=>window.__intakeDebug?.getState());
    check('CARD_I1',state?.id==='I1',state?.id);
    const f=state.scene.forms.find(x=>x.kind==='approved'&&!x.hit);
    if(!f)throw Error('No approved form in the first 260ms');
    // Current I1 snapshot exposes x but not y. Authoring uses alternating lanes.
    const lane=Number(f.id.split('-').at(-1))%2;
    const x=(f.x+65)*state.camera.scale+state.camera.camX;
    const y=(331+lane*115+50)*state.camera.scale+state.camera.camY;
    const within=Number.isFinite(x)&&Number.isFinite(y)&&x>=0&&x<=w&&y>=0&&y<=h;
    check('STAMP_TARGET_ONSCREEN',within,{x,y,form:f.id});
    if(!within)throw Error('Stamped object mapped outside physical viewport');
    await page.mouse.click(x,y);
    await page.waitForTimeout(100);
    const after=await page.evaluate(()=>window.__intakeDebug?.getState());
    check('REAL_MOUSE_STAMP',after?.scene?.progress>=1,{before:state.scene.progress,after:after?.scene?.progress});
    check('AUTOMATED_FIRST_ACTION_LT15S',Date.now()-began<15000,{elapsedMs:Date.now()-began});
    check('NO_PAGEERRORS',v.errors.length===0,v.errors);
    v.screenshot='first-stamp-'+w+'x'+h+'.png';
    await page.screenshot({path:path.join(out,v.screenshot)});
  }catch(e){v.error=String(e.stack||e).slice(0,950)}
  finally{await context.close().catch(()=>{})}
 }
 }catch(e){report.error=String(e.stack||e).slice(0,1300)}
 finally{if(browser)await browser.close().catch(()=>{});if(server)await new Promise(r=>server.close(r))}
 const failed=report.views.reduce((n,v)=>n+(v.error?1:0)+v.checks.filter(x=>x.status==='FAIL').length,0)+(report.error?1:0);
 report.status=failed===0&&report.views.length===sizes.length?'FIRST_ACTION_SMOKE_PASS_ONLY':'FAIL';
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({status:report.status,checks:report.views.map(v=>({viewport:v.viewport,passed:v.checks.filter(c=>c.status==='PASS').length,failed:v.checks.filter(c=>c.status==='FAIL'),error:v.error||null,shot:v.screenshot||null})),output:out,error:report.error||null},null,2));
 if(report.status!=='FIRST_ACTION_SMOKE_PASS_ONLY')process.exitCode=1;
}
run().catch(e=>{console.error(e);process.exitCode=1});
