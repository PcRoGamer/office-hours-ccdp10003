#!/usr/bin/env node
'use strict';
/*
 * Independent CCDP10003 course rubric: truthful graph + framing agency.
 * Tests ACTUAL browser pointer interactions in PR component preview, not mocked
 * mouse events. The preview source comes from the separate PR lane branch.
 *
 * NODE_PATH=<playwright node_modules path> node qa/v3-course-pr-truth.browser.cjs \
 *   --root=<checkout of agents/v3-pr-g6-1108c>
 * Optional --out=<directory>. Does not alter source under --root.
 */
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const args=process.argv.slice(2);
const arg=(key,fallback)=>{
  const s=args.find(x=>x.startsWith('--'+key+'='));
  return s?s.slice(key.length+3):fallback;
};
const root=path.resolve(arg('root','.'));
const out=path.resolve(arg('out',process.env.QA_OUTPUT_DIR||'qa-artifacts/v3-course-pr-truth'));
const views=[[1440,900],[3840,2160],[650,800]];
const serve=(req,res)=>{
  let rel;
  try{rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/, '');}
  catch{res.writeHead(400);return res.end('Bad URL');}
  const full=path.resolve(root,rel);
  if(!full.startsWith(root+path.sep)){res.writeHead(403);return res.end('Forbidden');}
  try{
    const ext=path.extname(full);
    res.setHeader('Content-Type',ext==='.js'?'text/javascript':ext==='.html'?'text/html':
      ext==='.css'?'text/css':'.json'===ext?'application/json':'application/octet-stream');
    return res.end(fs.readFileSync(full));
  }catch{res.writeHead(404);return res.end('Missing '+rel);}
};
function closeTo(x,y,d=1e-4){return Number.isFinite(x)&&Math.abs(x-y)<d;}
async function run(){
  fs.mkdirSync(out,{recursive:true});
  let server,browser;
  const report={checkedAt:new Date().toISOString(),
    scope:'REAL BROWSER PR P1/P4 PHYSICAL RUBRIC EXAM; NOT AN INTEGRATED CAMPAIGN OR HUMAN PLAYTEST',
    worktree:root,views:[],status:'UNTESTED'};
  try{
    server=http.createServer(serve);
    await new Promise((resolve,reject)=>{
      server.once('error',reject);server.listen(0,'127.0.0.1',resolve);
    });
    const {chromium}=require('playwright'),options={headless:true,args:['--no-sandbox']};
    if(process.platform==='win32'){
      for(const p of [
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
      ]){if(fs.existsSync(p)){options.executablePath=p;break;}}
    }else if(fs.existsSync('/usr/bin/google-chrome'))options.executablePath='/usr/bin/google-chrome';
    browser=await chromium.launch(options);
    for(const [w,h] of views){
      const v={resolution:w+'x'+h,checks:[],errors:[],captures:[]};
      report.views.push(v);
      const check=(name,ok,detail)=>v.checks.push({
        name,state:ok?'PASS':'FAIL',detail
      });
      const context=await browser.newContext({
        viewport:{width:w,height:h},deviceScaleFactor:1
      });
      const page=await context.newPage();
      page.on('pageerror',e=>v.errors.push(e.message));
      try{
        const url='http://127.0.0.1:'+server.address().port+'/previews/v3-pr.html';
        const nav=await page.goto(url,{waitUntil:'domcontentloaded',timeout:20000});
        check('HTTP_200',nav?.status()===200,nav?.status());
        await page.waitForFunction(()=>window.__pr?.viewport && window.__pr?.scene?.snapshot, null, {timeout:10000});
        const bbox=await page.locator('canvas#world').boundingBox();
        check('WORLD_ZERO_MARGIN',bbox&&Math.abs(bbox.x)<1&&Math.abs(bbox.y)<1&&
          Math.abs(bbox.width-w)<1&&Math.abs(bbox.height-h)<1,bbox);
        // For each authored action use the same current world-to-screen
        // transformation the actual game uses for input handling.
        const screen=async(x,y)=>page.evaluate(([x,y])=>window.__pr.viewport.worldToScreen(x,y),[x,y]);
        const geo=await page.evaluate(()=>{
          const p=window.__pr.viewport,lw=Math.min(1060,Math.max(320,p.worldWidth-26));
          return {cx:p.worldWidth/2,worldWidth:p.worldWidth,worldHeight:p.worldHeight,width:lw};
        });
        check('WORLD_VIEWPORT_ADAPTED',
          geo.worldHeight===760&&Math.abs(geo.worldWidth-h&&geo.worldWidth-(w*760/h))<1,
          geo);
        const axisStart=await screen(geo.cx,525);
        const axisEnd=await screen(geo.cx,735);
        const send=await screen(geo.cx,630);
        check('P1_AXIS_AND_SEND_ONSCREEN',[
          axisStart,axisEnd,send
        ].every(p=>p.x>0&&p.x<w&&p.y>0&&p.y<h),{axisStart,axisEnd,send});
        const initial=await page.evaluate(()=>window.__pr.scene.snapshot());
        check('P1_INCORRECT_INITIAL_BASELINE',initial.baseline===1200,initial.baseline);
        await page.mouse.move(axisStart.x,axisStart.y);
        await page.mouse.down();
        await page.mouse.move(axisEnd.x,axisEnd.y,{steps:8});
        await page.mouse.up();
        await page.waitForTimeout(80);
        const corrected=await page.evaluate(()=>window.__pr.scene.snapshot());
        check('P1_MANUAL_DRAG_CORRECTS_TO_ZERO',corrected.baseline===0&&corrected.corrected,
          {baseline:corrected.baseline,corrected:corrected.corrected});
        const p1shot='p1-zero-baseline-'+w+'x'+h+'.png';
        await page.screenshot({path:path.join(out,p1shot)});
        v.captures.push(p1shot);
        await page.mouse.click(send.x,send.y);
        await page.waitForTimeout(50);
        const p1=await page.evaluate(()=>({state:window.__pr.scene.snapshot(),
          completions:window.__pr.events.filter(x=>x.type==='card-complete')}));
        const p1result=p1.completions.at(-1);
        check('P1_ACTUAL_PHYSICAL_WIN',
          p1.state.sent===true&&p1result?.outcome==='success'&&p1.completions.length===1,
          p1);
        check('P1_DID_NOT_FALSIFY_REAL_NUMBERS',
          JSON.stringify(p1result?.evidence?.values)==='[1240,1280]'&&
          p1result?.evidence?.chartBaseline===0&&
          p1result?.evidence?.reportedDifference===40&&
          closeTo(p1result?.evidence?.percentageIncrease,40/1240*100),
          p1result?.evidence);
        // P4 is a separate physical drag; two different routes must preserve the
        // exact same factual data, but grant distinct actual tactical effects.
        const outcomes={};
        for(const route of ['headline','context']){
          await page.evaluate(()=>window.__pr.switchTo('P4'));
          await page.waitForTimeout(50);
          const g=await page.evaluate(()=>{
            const v=window.__pr.viewport,W=v.worldWidth,cx=W/2,
              width=Math.min(1060,Math.max(320,W-26)),rw=Math.min(360,(width-50)/2);
            return {cx,routeW:rw};
          });
          const start=await screen(g.cx,402);
          const dst=await screen(route==='headline'?g.cx-g.routeW/2-11:
            g.cx+g.routeW/2+11,568);
          const on=[start,dst].every(p=>p.x>0&&p.x<w&&p.y>0&&p.y<h);
          check('P4_'+route.toUpperCase()+'_TARGET_ONSCREEN',on,{start,dst});
          if(on){
            await page.mouse.move(start.x,start.y);
            await page.mouse.down();
            await page.mouse.move(dst.x,dst.y,{steps:8});
            await page.mouse.up();
            await page.waitForTimeout(65);
          }
          const result=await page.evaluate(()=>({
            state:window.__pr.scene.snapshot(),
            completions:window.__pr.events.filter(e=>e.type==='card-complete')
          }));
          const evidence=result.completions.at(-1)?.evidence;
          outcomes[route]=evidence;
          check('P4_'+route.toUpperCase()+'_ACTUAL_PHYSICAL_WIN',
            result.completions.length===1 &&
            result.completions[0].outcome==='success' &&
            result.state.selected===route &&
            evidence?.framing===route,{state:result.state,completions:result.completions});
          check('P4_'+route.toUpperCase()+'_REAL_TACTICAL_REWARD',
            evidence?.effect?.uses===1 &&
            (route==='headline'?evidence.effect.type==='priority-pass':
              evidence.effect.type==='quota-warning-card') &&
            evidence.facts.before===1240 && evidence.facts.after===1280 &&
            closeTo(evidence.facts.percentageIncrease,40/1240*100) &&
            evidence.facts.miraIncidentObserved===true,
            evidence);
          const screenshot='p4-'+route+'-'+w+'x'+h+'.png';
          await page.screenshot({path:path.join(out,screenshot)});
          v.captures.push(screenshot);
        }
        check('P4_HONEST_FACTS_TWO_PRESENTATIONS',
          outcomes.headline?.facts &&
          JSON.stringify(outcomes.headline.facts)===JSON.stringify(outcomes.context?.facts) &&
          outcomes.headline?.effect?.type!==outcomes.context?.effect?.type,
          {headline:outcomes.headline,context:outcomes.context});
        check('NO_PAGE_ERRORS',v.errors.length===0,v.errors);
      }catch(e){v.error=String(e.stack||e).slice(0,1600);}
      finally{await context.close().catch(()=>{});}
    }
  }catch(e){report.error=String(e.stack||e).slice(0,1300);}
  finally{
    if(browser)await browser.close().catch(()=>{});
    if(server)await new Promise(resolve=>server.close(resolve));
  }
  const fails=report.views.reduce((n,v)=>
    n+(v.error?1:0)+v.checks.filter(x=>x.state==='FAIL').length,0)+(report.error?1:0);
  report.status=fails===0&&report.views.length===views.length?
    'PR_P1_P4_REAL_BROWSER_RUBRIC_PASS_ONLY':'PR_RUBRIC_FAIL';
  report.failures=fails;
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({status:report.status,failed:report.failures,
    views:report.views.map(v=>({viewport:v.resolution,
      passed:v.checks.filter(x=>x.state==='PASS').length,
      failed:v.checks.filter(x=>x.state==='FAIL'),
      captures:v.captures,error:v.error||null})),
    error:report.error||null,output:out},null,2));
  if(fails)process.exitCode=1;
}
run().catch(e=>{console.error(e);process.exitCode=1;});
