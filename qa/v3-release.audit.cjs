/* Night Shift v3 | release-lane regression. Node 22, Playwright 1.58.x.
 * No invented gameplay coverage: this is viewport/asset/crash smoke + release interlock.
 * Actual campaign testing and artistic sign-off are independent mandatory gates.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const { spawnSync }=require('node:child_process');
const ROOT=path.resolve(__dirname,'..');
const DIR=path.join(ROOT,'qa-artifacts','v3-release');
const BASE=process.env.TEST_BASE_URL || 'http://127.0.0.1:4173/';
const log={mode:process.argv[2] || '--source',source:process.env.GITHUB_SHA || 'local',time:new Date().toISOString(),checks:[],failures:[],warnings:[]};
fs.mkdirSync(DIR,{recursive:true});
const inside=p=>path.resolve(ROOT,p);
const record=(kind,message,details={})=>{log[kind].push({message,...details});console.log(kind.toUpperCase()+': '+message)};
const test=(condition,message,details={})=>{if(condition)record('checks',message,details);else record('failures',message,details)};
const exists=p=>fs.existsSync(inside(p));
function save(){
 fs.writeFileSync(path.join(DIR,log.mode.replace(/[^a-z-]/g,'')+'.json'),JSON.stringify(log,null,2));
 console.log('AUDIT_COUNTS',JSON.stringify({checks:log.checks.length,failures:log.failures.length,warnings:log.warnings.length}));
 if(log.failures.length)process.exitCode=1;
}
function filesBelow(base){
 if(!exists(base))return [];
 const out=[];function visit(n){for(const ent of fs.readdirSync(inside(n),{withFileTypes:true})){const p=path.posix.join(n,ent.name);if(ent.isDirectory())visit(p);else if(ent.isFile())out.push(p)}}visit(base);return out;
}
function source(){
 // Pinned main-release Git blob IDs, verified on 2026-11-08.
 // Presence alone does not prevent an HD regression; these hashes do.
 const protectedBlobs={
  'index.html':'bfe0406441c07663471461af80e9792b35424684',
  'arcade-office-hd.html':'3533177e4843b7f6d0676300d315b97d44a2cb58',
  'arcade-v3.html':'4d723fffede945d948fb0967b3d01ca0b482b12e',
  'arcade-office-genai.html':'96bfd5b400aae100abd87dcca41a253123f8efdd',
  'arcade-nightshift.html':'a8bd24dc75278c4cd1bc2d623480deb1ec67fa3c'
 };
 for(const [p,expected] of Object.entries(protectedBlobs)){
  test(exists(p),'Protected incumbent present: '+p);
  if(!exists(p))continue;
  const git=spawnSync('git',['hash-object',p],{cwd:ROOT,encoding:'utf8'});
  test(git.status===0&&git.stdout.trim()===expected,
    'Pinned HD/legacy release unchanged: '+p,{expected,actual:git.stdout?.trim()});
 }
 const present=exists('night-shift-v3.html');
 if(!present){record('warnings','v3 route not present: smoke-only candidate is NOT publishable');return}
 const html=fs.readFileSync(inside('night-shift-v3.html'),'utf8');
 test(/<canvas\b/i.test(html)||/<script\b/i.test(html),'V3 entry contains canvas or game module');
 const files=['night-shift-v3.html',...filesBelow('night-shift-v3'),...filesBelow('assets/night-shift-v3')];
 test(files.length>=2,'V3 contains a non-empty modular implementation',{count:files.length});
 for(const f of files.filter(f=>/\.(html|js|mjs|css)$/.test(f))){
  const s=fs.readFileSync(inside(f),'utf8');
  // Only references loaded by our module; legacy files remain untouched.
  for(const [pattern,label] of [
   [/(?:src|href)\s*=\s*['"]\/(?!\/)/g,'root-relative HTML URL'],
   [/\b(?:from|import)\s*['"]\/(?!\/)/g,'root-relative module URL'],
   [/\b(?:fetch|new\s+Worker)\s*\(\s*['"]\/(?!\/)/g,'root-relative runtime URL'],
   [/url\(\s*['"]?\/(?!\/)/g,'root-relative CSS URL']
  ]){test(!pattern.test(s),'No '+label+' in '+f)}
 }
 const s=html.match(/(?:src|href)\s*=\s*['"]([^'"#?]+)['"]/g)||[];
 for(const item of s){
  const url=item.slice(item.indexOf('=')+1).trim().replace(/^['"]|['"]$/g,'');
  if(/^(?:https?:|data:|blob:|\/\/|#|mailto:)/i.test(url))continue;
  const resolved=path.resolve(ROOT,url);
  test(resolved.startsWith(ROOT+path.sep)&&fs.existsSync(resolved),'Entry local URL resolves: '+url);
 }
}
async function browser(candidate){
 const {chromium}=require('playwright');
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const route=candidate?'night-shift-v3.html':'arcade-office-hd.html';
  if(candidate){test(exists(route),'Candidate route exists before browser launch');if(!exists(route))return}
  const sizes=candidate
   ? [[1920,1080,1],[2560,1440,1],[3840,2160,1],[3440,1440,1],[650,800,1],[1920,1080,2]]
   : [[1440,900,1],[1920,1080,1],[650,800,1]];
  for(const [w,h,dpr] of sizes){
   const context=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:dpr});
   const page=await context.newPage(),errs=[],broken=[],remote=[];
   page.on('pageerror',e=>errs.push(e.message));
   page.on('response',r=>{if(r.status()<400)return;
    const u=new URL(r.url()),b=new URL(BASE);
    (u.origin===b.origin?broken:remote).push({status:r.status(),url:r.url()})});
   page.on('requestfailed',r=>{const u=new URL(r.url()),b=new URL(BASE);
    (u.origin===b.origin?broken:remote).push({status:'network',url:r.url(),failure:r.failure()?.errorText})});
   let response;
   try{response=await page.goto(new URL(route,BASE).toString(),{waitUntil:'domcontentloaded',timeout:45000})}
   catch(err){record('failures','Navigation error '+route+' '+w+'x'+h,{message:String(err)});await context.close();continue}
   test(response&&response.status()===200,'HTTP 200 '+route+' '+w+'x'+h);
   await page.waitForTimeout(candidate?1250:900);
   const state=await page.evaluate(()=>{
    const w=innerWidth,h=innerHeight;
    const canvases=[...document.querySelectorAll('canvas')].map(c=>{
     const r=c.getBoundingClientRect(),cs=getComputedStyle(c);
     return {x:r.x,y:r.y,width:r.width,height:r.height,backingWidth:c.width,backingHeight:c.height,visible:cs.visibility!=='hidden'&&cs.display!=='none'&&+cs.opacity!==0};
    });
    return {w,h,dpr:devicePixelRatio,title:document.title,
     bodyScrollWidth:document.body.scrollWidth,bodyScrollHeight:document.body.scrollHeight,
     canvases,htmlBackground:getComputedStyle(document.documentElement).backgroundColor,
     bodyBackground:getComputedStyle(document.body).backgroundColor};
   });
   if(candidate){
    const covers=state.canvases.some(c=>c.visible&&c.x<=1&&c.y<=1&&c.width>=state.w-2&&c.height>=state.h-2);
    test(covers,'FULL BLEED: rendered world canvas covers viewport '+w+'x'+h,{canvases:state.canvases});
    test(state.bodyScrollWidth<=state.w+2,'No horizontal page overflow '+w+'x'+h,{scrollWidth:state.bodyScrollWidth});
    test(state.bodyScrollHeight<=state.h+2,'No vertical page overflow '+w+'x'+h,{scrollHeight:state.bodyScrollHeight});
    const highDpi=state.canvases.some(c=>c.visible&&c.width>=state.w-2&&c.backingWidth>=state.w*dpr*.9&&c.backingHeight>=state.h*dpr*.9);
    test(highDpi,'Backing pixels match CSS viewport * DPR '+w+'x'+h+' @'+dpr,{canvases:state.canvases});
   }
   test(!errs.length,'No uncaught script errors '+w+'x'+h,{errors:errs});
   test(!broken.length,'No broken same-origin assets '+w+'x'+h,{broken});
   if(remote.length)record('warnings','Third-party requests failed '+w+'x'+h,{remote});
   const label=(candidate?'candidate-':'incumbent-')+w+'x'+h+'@'+dpr;
   await page.screenshot({path:path.join(DIR,label+'.png'),fullPage:false});
   fs.writeFileSync(path.join(DIR,label+'.json'),JSON.stringify({route,...state,errors:errs,broken,remote},null,2));
   // The fallback is a real game, not only a polished still: exercise CLOCK IN
   // at one desktop size and preserve a screenshot of the live first card.
   if(!candidate&&w===1440&&h===900){
    try{
     await page.waitForFunction(()=>window.__officeArcade?.snapshot()?.atlasReady,{timeout:15000});
     const first=await page.evaluate(()=>window.__officeArcade.snapshot());
     const vp=first.viewport;
     const point={x:220*vp.scale+vp.ox,y:605*vp.scale+vp.oy};
     await page.mouse.click(point.x,point.y);
     await page.waitForTimeout(300);
     const after=await page.evaluate(()=>window.__officeArcade.snapshot());
     test(after.screen==='play','HD CLOCK IN reaches live playable card',{screen:after.screen});
     await page.screenshot({path:path.join(DIR,'incumbent-first-card-1440x900.png'),fullPage:false});
     fs.writeFileSync(path.join(DIR,'incumbent-first-card-1440x900.json'),JSON.stringify({before:first.screen,after:after.screen,phase:after.phase,card:after.card,errors:errs},null,2));
    }catch(error){record('failures','HD first-card smoke failed: '+String(error))}
   }
   await context.close();
  }
 }finally{if(browser)await browser.close()}
}
function releaseSignoff(){
 source();
 test(exists('night-shift-v3.html'),'Publication requires integrated V3 entry');
 const p='coordination/reports/release-acceptance.json';
 if(!exists(p)){record('failures','No verified acceptance manifest: manual publication remains locked');return}
 let obj;try{obj=JSON.parse(fs.readFileSync(inside(p),'utf8'))}
 catch(e){record('failures','Malformed acceptance manifest: '+String(e));return}
 const required=['full16Cards','normalRun12','fivePromotions','fiveDirectives','eightPerks','twoCompleteBosses','audioChecked','viewportMatrixReviewed','humanPlaythrough','freshBrowserPreviewProof','hdNotRegressed'];
 for(const k of required)test(obj[k]===true,'Signed off after genuine evidence: '+k);
 test(typeof obj.evidenceUrl==='string'&&/^https:\/\/github\.com\/PcRoGamer\/office-hours-ccdp10003\/(actions|pull)\//.test(obj.evidenceUrl),'Evidence URL supplied');
 test(typeof obj.acceptedBy==='string'&&obj.acceptedBy.trim().length>2,'Human reviewer identified');
 // The manifest itself changes the commit SHA: require the last commit to be
 // ONLY that manifest, with sourceSha equal to the immediately preceding tree.
 const parent=spawnSync('git',['rev-parse','HEAD^'],{cwd:ROOT,encoding:'utf8'});
 const expected=parent.status===0?parent.stdout.trim():'';
 test(!!expected&&obj.sourceSha===expected,'Acceptance records exact code parent commit',{expected,recorded:obj.sourceSha});
 const diff=spawnSync('git',['diff','--name-only','HEAD^','HEAD'],{cwd:ROOT,encoding:'utf8'});
 const changed=diff.status===0?diff.stdout.trim().split(/\r?\n/).filter(Boolean):[];
 test(changed.length===1&&changed[0]===p,'Final commit contains only release acceptance manifest',{changed});
 const branch=process.env.GITHUB_REF_NAME;
 test(!branch||branch==='rebuild/night-shift-v3-hd','Only integration branch may deploy',{branch});
}
(async()=>{
 try{
  const mode=log.mode;
  if(mode==='--source')source();
  else if(mode==='--incumbent')await browser(false);
  else if(mode==='--candidate')await browser(true);
  else if(mode==='--release')releaseSignoff();
  else throw Error('Unknown mode '+mode);
 }catch(e){record('failures','Fatal audit exception: '+(e.stack||String(e)))}
 finally{save()}
})();
