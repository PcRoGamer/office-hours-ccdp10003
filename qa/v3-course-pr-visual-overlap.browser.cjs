#!/usr/bin/env node
'use strict';
/*
 * Independent visual truthfulness QA for PR P1's ZERO BASELINE state.
 * Uses ACTUAL Canvas2D draw operations and browser pointer gestures.
 * Records the locations of the 1,240 / 1,280 labels and rendered
 * result banner, then checks visibility/overlap. No OCR or fake screenshots.
 *
 * NODE_PATH=<playwright node_modules> node qa/v3-course-pr-visual-overlap.browser.cjs \
 *  --root=<PR-lane-checkout>
 *
 * This is a visual gate; a mechanically correct card can still fail.
 */
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const args=process.argv.slice(2);
const arg=(key,def)=>{const x=args.find(a=>a.startsWith('--'+key+'='));return x?x.slice(key.length+3):def};
const root=path.resolve(arg('root','.'));
const out=path.resolve(arg('out',process.env.QA_OUTPUT_DIR||'qa-artifacts/v3-course-pr-visual-overlap'));
const targetViews=[[1440,900],[3840,2160],[650,800]];
const serve=(req,res)=>{
  const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/, '');
  const full=path.resolve(root,rel);
  if(!full.startsWith(root+path.sep)){res.writeHead(403);return res.end('Forbidden');}
  try{
    const ext=path.extname(full);
    res.setHeader('Content-Type',ext==='.js'?'text/javascript':ext==='.html'?'text/html':ext==='.css'?'text/css':'application/octet-stream');
    res.end(fs.readFileSync(full));
  }catch{res.writeHead(404);res.end('Not Found');}
};
const intersection=(a,b)=>{
  if(!a||!b)return null;
  const x=Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x));
  const y=Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
  return {x,y,area:x*y};
};
const observer=()=>{
  const p=CanvasRenderingContext2D.prototype;
  const oldFillText=p.fillText,oldRR=p.roundRect,oldFill=p.fill,oldBegin=p.beginPath;
  window.__courseViz={labels:{},banner:null,paintCalls:0};
  p.beginPath=function(){this.__courseRR=null;return oldBegin.apply(this,arguments);};
  p.roundRect=function(x,y,w,h,r){
    this.__courseRR={x,y,w,h};
    return oldRR.apply(this,arguments);
  };
  p.fill=function(){
    const r=this.__courseRR;
    if(r&&this.fillStyle==='#71e3c4'&&r.w>250&&r.h>25&&r.h<80&&r.y>160){
      window.__courseViz.banner={...r,fillStyle:this.fillStyle};
    }
    return oldFill.apply(this,arguments);
  };
  p.fillText=function(text,x,y,...rest){
    const str=String(text);
    if(['QUARTERLY CLICKS','1,240','1,280'].includes(str)){
      const measured=this.measureText(str).width;
      const fontSize=Number(this.font.match(/(\d+(?:\.\d+)?)px/)?.[1]||16);
      const left=this.textAlign==='center'?x-measured/2:this.textAlign==='right'?x-measured:x;
      const top=this.textBaseline==='middle'?y-fontSize/2:this.textBaseline==='top'?y:y-fontSize;
      window.__courseViz.labels[str]={x:left,y:top,w:measured,h:fontSize};
      window.__courseViz.paintCalls++;
    }
    return oldFillText.apply(this,[text,x,y,...rest]);
  };
};
async function main(){
  fs.mkdirSync(out,{recursive:true});
  let server,browser;
  const report={testedAt:new Date().toISOString(),
    scope:'ACTUAL BROWSER/CANVAS VISUAL OVERLAP GATE AFTER REAL P1 CORRECTION',
    views:[],status:'UNVERIFIED'};
  try{
    server=http.createServer(serve);
    await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
    const {chromium}=require('playwright'),options={headless:true,args:['--no-sandbox']};
    if(process.platform==='win32'){
      for(const p of ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe','C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe']){
        if(fs.existsSync(p)){options.executablePath=p;break;}
      }
    }else if(fs.existsSync('/usr/bin/google-chrome'))options.executablePath='/usr/bin/google-chrome';
    browser=await chromium.launch(options);
    for(const [w,h] of targetViews){
      const result={viewport:w+'x'+h,checks:[],errors:[]};
      report.views.push(result);
      const check=(key,ok,detail)=>result.checks.push({key,state:ok?'PASS':'FAIL',detail});
      const context=await browser.newContext({viewport:{width:w,height:h}});
      await context.addInitScript(observer);
      const page=await context.newPage();
      page.on('pageerror',e=>result.errors.push(e.message));
      try{
        const r=await page.goto('http://127.0.0.1:'+server.address().port+'/previews/v3-pr.html',{waitUntil:'domcontentloaded',timeout:18000});
        check('HTTP_200',r.status()===200,r.status());
        await page.waitForFunction(()=>window.__pr?.scene?.snapshot, null,{timeout:7000});
        const world=await page.evaluate(()=>window.__pr.viewport);
        const cx=world.worldWidth/2;
        const screen=async (x,y)=>page.evaluate(([x,y])=>window.__pr.viewport.worldToScreen(x,y),[x,y]);
        const start=await screen(cx,525),end=await screen(cx,735);
        await page.mouse.move(start.x,start.y);
        await page.mouse.down();
        await page.mouse.move(end.x,end.y,{steps:7});
        await page.mouse.up();
        await page.waitForTimeout(170);
        const state=await page.evaluate(()=>window.__pr.scene.snapshot());
        check('PHYSICAL_AXIS_CORRECTED',state.baseline===0&&state.corrected,
          {baseline:state.baseline,corrected:state.corrected});
        const drawn=await page.evaluate(()=>window.__courseViz);
        result.drawn=drawn;
        const labels=drawn.labels, banner=drawn.banner;
        check('ACTUAL_BANNER_CAPTURED',!!banner&&drawn.paintCalls>0,
          {banner,paintCalls:drawn.paintCalls});
        for(const text of ['QUARTERLY CLICKS','1,240','1,280']){
          const label=labels[text],overlap=intersection(label,banner);
          const safelyVisible=label && overlap && overlap.area<=0.5;
          check('TEXT_UNOBSCURED_'+text.replace(/[^a-z0-9]+/gi,'_').toUpperCase(),
            safelyVisible,{label,banner,overlap});
        }
        check('NO_PAGE_EXCEPTIONS',result.errors.length===0,result.errors);
        result.screenshot='p1-overlap-actual-'+w+'x'+h+'.png';
        await page.screenshot({path:path.join(out,result.screenshot)});
      }catch(e){result.error=String(e.stack||e).slice(0,1300);}
      finally{await context.close().catch(()=>{});}
    }
  }catch(e){report.error=String(e.stack||e).slice(0,1200);}
  finally{if(browser)await browser.close().catch(()=>{});if(server)await new Promise(resolve=>server.close(resolve));}
  const fails=report.views.reduce((n,v)=>n+(v.error?1:0)+v.checks.filter(c=>c.state==='FAIL').length,0)+(report.error?1:0);
  report.status=fails===0&&report.views.length===3?'P1_VISUAL_TRUTHFULNESS_PASS':'P1_VISUAL_TRUTHFULNESS_FAIL';
  report.failureCount=fails;
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({status:report.status,failed:fails,
    viewports:report.views.map(v=>({name:v.viewport,
      fails:v.checks.filter(x=>x.state==='FAIL'),
      passed:v.checks.filter(x=>x.state==='PASS').length,
      screenshot:v.screenshot,error:v.error||null})),
    error:report.error||null,out},null,2));
  if(fails)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
