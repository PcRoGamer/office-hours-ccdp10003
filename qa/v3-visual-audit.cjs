#!/usr/bin/env node
/* QUOTA PANIC v3 independent browser visual evidence.
 * npm install --no-save playwright@1.58.2
 * HD_URL=http://127.0.0.1:4173/arcade-office-hd.html V3_URL=http://127.0.0.1:4173/night-shift-v3.html node qa/v3-visual-audit.cjs
 * Optional: V3_VISUAL_DRIVER=./qa/scene-driver.cjs exports async ({page,scene,viewport})
 * Do not classify source-only builds or generated imagery as actual game screenshots.
 */
'use strict';
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path');
const OUT=path.resolve(process.env.VISUAL_OUT||'qa-artifacts/v3-visual');
const HD=process.env.HD_URL||'http://127.0.0.1:4173/arcade-office-hd.html';
const V3=process.env.V3_URL||'http://127.0.0.1:4173/night-shift-v3.html';
const baselineOnly=process.argv.includes('--baseline-only');
const fixture=process.argv.includes('--fixture-test');
const sizes=[['1080p',1920,1080,1],['1440p',2560,1440,1],['4k',3840,2160,1],['4k-dpr2',1920,1080,2],['ultrawide',3440,1440,1],['portrait',650,800,1],['laptop',1440,900,1],['small',1024,600,1]];
const driver=process.env.V3_VISUAL_DRIVER?require(path.resolve(process.env.V3_VISUAL_DRIVER)):null;
const error=e=>e?.stack||e?.message||String(e);
const fixtureHtml=variant=>'<html><head><title>'+variant+' FIXTURE NOT A GAME</title><style>*{box-sizing:border-box}body{margin:0}canvas{position:fixed;inset:0;width:100vw;height:100vh}button{position:fixed;z-index:2;top:60%;left:50%;padding:24px}</style></head><body><canvas id="game"></canvas>'+(variant==='v3'?'<button onclick="this.remove()">CLOCK IN</button>':'')+'<script>let c=document.querySelector("canvas"),x=c.getContext("2d");function draw(){c.width=innerWidth*devicePixelRatio;c.height=innerHeight*devicePixelRatio;x.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);let g=x.createLinearGradient(0,0,innerWidth,innerHeight);g.addColorStop(0,"#213b45");g.addColorStop(1,"#bb575b");x.fillStyle=g;x.fillRect(0,0,innerWidth,innerHeight);x.fillStyle="#ffe0a2";x.fillRect(innerWidth*.2,innerHeight*.35,innerWidth*.6,innerHeight*.3)}addEventListener("resize",draw);draw()</script></body></html>';
async function inspect(page){
 return page.evaluate(()=>{
  const W=innerWidth,H=innerHeight,c=[...document.querySelectorAll('canvas')].sort((a,b)=>b.clientWidth*b.clientHeight-a.clientWidth*a.clientHeight)[0],r=c?.getBoundingClientRect();
  const rect=r?[r.x,r.y,r.width,r.height].map(n=>Math.round(n*10)/10):null;
  let paint=null;
  if(c)try{
   const tmp=document.createElement('canvas');tmp.width=96;tmp.height=54;const t=tmp.getContext('2d',{willReadFrequently:true});t.drawImage(c,0,0,96,54);const d=t.getImageData(0,0,96,54).data;
   const band=(x0,y0,x1,y1)=>{let lo=255,hi=0,seen=new Set(),sum=0,n=0;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=(y*96+x)*4,R=d[i],G=d[i+1],B=d[i+2],L=Math.round(.2126*R+.7152*G+.0722*B);lo=Math.min(lo,L);hi=Math.max(hi,L);sum+=L;n++;seen.add((R>>5)+','+(G>>5)+','+(B>>5))}return{range:hi-lo,buckets:seen.size,mean:Math.round(sum/n)}};
   paint={left:band(0,0,5,54),right:band(91,0,96,54),top:band(0,0,96,3),bottom:band(0,51,96,54),center:band(24,13,72,41)};
  }catch(e){paint={error:String(e)}}
  const clipped=[...document.querySelectorAll('button,[role="button"],input:not([type="hidden"])')].filter(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.visibility!=='hidden'&&s.display!=='none'&&r.width>0&&r.height>0&&(r.left<-3||r.top<-3||r.right>W+3||r.bottom>H+3)}).map(e=>(e.getAttribute('aria-label')||e.textContent||e.tagName).trim().slice(0,40));
  return{viewport:[W,H],dpr:devicePixelRatio,canvas:c?{css:rect,backing:[c.width,c.height],pixelRatio:[c.width/r.width,c.height/r.height]}:null,paint,clipped,scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight]};
 });
}
function verdict(m,variant){
 const failures=[],warnings=[];
 if(!m.canvas)return{failures:['No canvas'],warnings};
 const [x,y,w,h]=m.canvas.css,[W,H]=m.viewport;
 if(Math.abs(x)>2||Math.abs(y)>2||Math.abs(w-W)>2||Math.abs(h-H)>2)failures.push('Canvas does not occupy full viewport: '+m.canvas.css.join(','));
 if(m.canvas.backing[0]<W*.75||m.canvas.backing[1]<H*.75)warnings.push('Potentially blurry: backing canvas under 75% of CSS size');
 if(m.clipped.length)warnings.push('Clipped controls: '+m.clipped.join(', '));
 for(const side of ['left','right','top','bottom']){const p=m.paint?.[side];if(p&&p.range<=5&&p.buckets<=2&&m.paint.center?.buckets>=12)warnings.push('Possible flat '+side+' letterbox: inspect image')}
 return{failures,warnings};
}
async function capture(page,entry,size,scene){
 const name=entry.variant+'-'+scene+'-'+size[0]+'.png',metrics=await inspect(page),status=verdict(metrics,entry.variant);
 await page.screenshot({path:path.join(OUT,name),animations:'disabled',timeout:45000});
 entry.captures.push({variant:entry.variant,viewport:size[0],scene,width:size[1],height:size[2],dpr:size[3],image:name,metrics,...status});
}
async function hdAction(page){
 const s=await page.evaluate(()=>window.__officeArcade?.snapshot?.()||null);
 if(!s?.viewport)return 'HD snapshot API missing';
 const {scale,ox,oy}=s.viewport;
 await page.mouse.click(220*scale+ox,605*scale+oy);
 await page.waitForTimeout(300);
 return (await page.evaluate(()=>window.__officeArcade?.snapshot?.().screen))==='play'?null:'HD did not enter action';
}
async function hdDraft(page){
 let s=await page.evaluate(()=>window.__officeArcade?.snapshot?.()||null);
 if(!s||s.screen!=='play')return 'HD action not active';
 const end=Date.now()+35000;
 while(Date.now()<end){
  s=await page.evaluate(()=>window.__officeArcade?.snapshot?.()||null);
  if(!s)return 'HD snapshot missing';if(s.screen==='draft')return null;if(s.screen==='recover')return 'HD recovery before draft';
  const {scale,ox,oy}=s.viewport;
  const click=async(x,y)=>page.mouse.click(x*scale+ox,(y*1.45-215)*scale+oy);
  const a=s.ads?.[0];
  if(a){await click(a.real?a.x+a.w/2:a.x+a.w-22,a.real?a.y+129:a.y+18);continue}
  const p=s.entities?.find(e=>e.kind==='paper'&&e.good&&e.x>95&&e.x<1010&&e.y>270&&e.y<590);
  if(p)await click(p.x+44,p.y+55);else await page.waitForTimeout(50);
 }
 return 'Timed out before HD upgrade draft';
}
async function v3Action(page,size){
 if(driver){await driver({page,scene:'action',viewport:size[0]});return null}
 const b=page.getByRole('button',{name:/CLOCK\s*IN|START|PLAY|BEGIN/i}).first();
 if(await b.count()){await b.click({timeout:4000});await page.waitForTimeout(500);return null}
 return 'No v3 start control; add V3_VISUAL_DRIVER when renderer is integrated';
}
async function run(browser,variant,url,report){
 const entry={variant,url,loaded:0,captures:[],errors:[],blocked:[]};report.runs.push(entry);
 for(const size of sizes){
  const ctx=await browser.newContext({viewport:{width:size[1],height:size[2]},deviceScaleFactor:size[3],reducedMotion:'reduce'}),page=await ctx.newPage();
  page.on('pageerror',e=>entry.errors.push(size[0]+' JS '+e.message));
  page.on('response',r=>{if(r.status()>=400)entry.errors.push(size[0]+' HTTP '+r.status()+' '+r.url())});
  try{
   if(fixture)await page.setContent(fixtureHtml(variant));
   else{const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:25000});if(!response?.ok())throw Error('HTTP '+response?.status())}
   await page.waitForTimeout(500);
   if(variant==='hd'&&!fixture)await page.waitForFunction(()=>window.__officeArcade?.snapshot?.().atlasReady,{timeout:16000}).catch(()=>entry.blocked.push(size[0]+' atlas readiness unverified'));
   entry.loaded++;await capture(page,entry,size,'title');
   if(size[0]==='1080p'||size[0]==='portrait'){
    let reason=variant==='hd'?await hdAction(page):await v3Action(page,size).catch(error);
    if(reason)entry.blocked.push(size[0]+' action: '+reason);
    else{
     await capture(page,entry,size,'action');
     if(size[0]==='1080p'){
      reason=variant==='hd'?await hdDraft(page):driver?await driver({page,scene:'draft',viewport:size[0]}).then(()=>null,error):'draft requires v3 scene driver';
      if(reason)entry.blocked.push('draft: '+reason);else await capture(page,entry,size,'draft');
      if(variant==='v3'&&driver)for(const scene of ['boss-printer','boss-quota','ending'])try{await driver({page,scene,viewport:size[0]});await capture(page,entry,size,scene)}catch(e){entry.blocked.push(scene+': '+error(e))}
     }
    }
   }
  }catch(e){entry.errors.push(size[0]+': '+error(e))}
  finally{await ctx.close()}
 }
}
function markdown(report){
 let out='# Night Shift v3 browser visual audit\n\n'+(report.fixture?'**FIXTURE SELF-TEST ONLY, NOT ACTUAL GAME EVIDENCE.**':'**Rendered game captures, pending human visual approval.**')+'\n\nCaptured: '+report.generatedAt+'\n\n';
 for(const r of report.runs){
  out+='## '+r.variant.toUpperCase()+'\n\nSource: '+r.url+'\n\nLoaded viewports '+r.loaded+'/'+sizes.length+'; '+r.captures.length+' screenshots; '+r.errors.length+' browser errors.\n\n';
  for(const c of r.captures)out+='- '+c.scene+' '+c.viewport+': '+c.image+'; '+c.failures.length+' geometry failures; '+c.warnings.join('; ')+'\n';
  if(r.blocked.length)out+='\n**Unverified states:**\n'+r.blocked.map(s=>'- '+s).join('\n')+'\n';
  if(r.errors.length)out+='\n**Errors:**\n'+r.errors.map(s=>'- '+s).join('\n')+'\n';out+='\n';
 }
 return out+'**Manual release gate still required:** title/card/draft/both bosses/ending, character acting, cinematic composition, tactile feedback, music, portrait, image legibility. This tool never certifies artistic superiority automatically.\n';
}
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 const report={schema:1,fixture,generatedAt:new Date().toISOString(),viewports:sizes,runs:[]};
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||undefined,args:['--no-sandbox','--disable-gpu-sandbox']});
 try{await run(browser,'hd',HD,report);if(!baselineOnly)await run(browser,'v3',V3,report)}finally{await browser.close()}
 fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
 fs.writeFileSync(path.join(OUT,'report.md'),markdown(report));
 console.log(JSON.stringify({report:path.join(OUT,'report.json'),fixture,captures:report.runs.reduce((n,r)=>n+r.captures.length,0),runs:report.runs.map(r=>({variant:r.variant,loaded:r.loaded,errors:r.errors,blocked:r.blocked}))},null,2));
 if(report.runs.some(r=>r.loaded===0||r.captures.some(c=>c.failures.length)))process.exitCode=1;
})().catch(e=>{console.error(error(e));process.exitCode=1});
