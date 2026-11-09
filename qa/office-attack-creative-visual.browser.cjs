'use strict';
// OFFICE ATTACK / independent creative QA. Never alters game state or production files.
// Run: node qa/office-attack-creative-visual.browser.cjs
//      OFFICE_ATTACK_CREATIVE_FULLRUN=1 node qa/office-attack-creative-visual.browser.cjs
// Uses the same real Chromium binary as the release suites. Screenshots land in
// qa/office-attack-creative-evidence/ (intentionally untracked).
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const cp=require('node:child_process');
const assert=require('node:assert/strict');
const {chromium}=(()=>{try{return require('playwright')}catch{return require('C:/Users/Admin/NightShiftV3-Lead-tools/node_modules/playwright-core')}})();
const root=path.resolve(process.env.OFFICE_ATTACK_SITE_ROOT||path.join(__dirname,'..'));
const evidence=path.resolve(process.env.OFFICE_ATTACK_CREATIVE_EVIDENCE||path.join(__dirname,'office-attack-creative-evidence'));
const shapes=[
 {tag:'desktop-16x9',width:1440,height:810,touch:false},
 {tag:'portrait-650',width:650,height:800,touch:true},
 {tag:'mobile-390',width:390,height:760,touch:true}
];
const failures=[],results=[];
const ck=(condition,description,details='')=>{
 if(!condition)failures.push(description+(details?' | '+JSON.stringify(details):''));
 return !!condition;
};
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.avif':'image/avif','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 const p=path.resolve(root,'.'+decodeURIComponent(url.pathname));
 if(p!==root&&!p.startsWith(root+path.sep)){res.writeHead(403);return res.end('Forbidden')}
 fs.readFile(p,(err,data)=>{
  if(err){res.writeHead(404);return res.end('Missing '+url.pathname)}
  res.writeHead(200,{'content-type':mime[path.extname(p)]||'application/octet-stream'});res.end(data);
 });
});
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const start=()=>new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const snap=page=>page.evaluate(()=>window.__officeAttackQA.snapshot());
async function waitFor(page,condition,ms=5000){
 return page.waitForFunction(condition,null,{timeout:ms,polling:60});
}
async function diagnostics(page){
 return page.evaluate(()=>{
  const rect=id=>{const e=document.querySelector(id);if(!e)return null;const b=e.getBoundingClientRect();return{x:b.x,y:b.y,right:b.right,bottom:b.bottom,w:b.width,h:b.height,visible:!e.classList.contains('hidden')}}
  const c=document.querySelector('#stage'),ctx=c.getContext('2d'),w=c.width,h=c.height;
  const pixels=[];
  for(let yi=0;yi<17;yi++){
   const row=[];
   for(let xi=0;xi<9;xi++){
    const pixel=ctx.getImageData(Math.floor(w*(xi+.5)/9),Math.floor(h*(yi+.5)/17),1,1).data;
    row.push([pixel[0],pixel[1],pixel[2]]);
   }
   pixels.push(row);
  }
  const match=(a,b)=>a.every((v,i)=>Math.abs(v-b[i])<4);
  const flatRows=pixels.map(row=>row.every(p=>match(p,row[0])));
  const sideRows=pixels.map(row=>match(row[0],row[4])&&match(row[8],row[4]));
  const hud=rect('#hud'),lives=rect('#lives'),round=rect('#round'),mute=rect('#mute');
  return{
   viewport:{w:innerWidth,h:innerHeight,dpr:devicePixelRatio},stage:rect('#stage'),hud,lives,round,mute,
   timer:rect('#deadline'),button:rect('#play'),
   flatRows,sideRows,pixelTop:pixels[0][4],pixelMid:pixels[8][4],pixelBottom:pixels[16][4],
   edgeFlatTop:flatRows.slice(0,4).filter(Boolean).length,
   edgeFlatBottom:flatRows.slice(-4).filter(Boolean).length,
   overscroll:{x:document.documentElement.scrollWidth-innerWidth,y:document.documentElement.scrollHeight-innerHeight}
  };
 });
}
function screenshotPixelAudit(file){
 const py=[
  'from PIL import Image',
  'import json,sys',
  'im=Image.open(sys.argv[1]).convert("RGB")',
  'w,h=im.size',
  'xs=[int(w*f) for f in (.08,.18,.28,.38,.5,.62,.72,.82,.92)]',
  'ys=list(range(0,h,max(1,h//120)))',
  'dark=[sum(max(im.getpixel((x,y)))<115 for x in xs)>=7 for y in ys]',
  'top=next((i for i,yes in enumerate(dark) if not yes),len(dark))',
  'bottom=next((i for i,yes in enumerate(reversed(dark)) if not yes),len(dark))',
  'print(json.dumps(dict(topDarkPct=round(top/len(ys)*100,1),bottomDarkPct=round(bottom/len(ys)*100,1),totalDarkPct=round((top+bottom)/len(ys)*100,1),topCenter=im.getpixel((w//2,0)),middleCenter=im.getpixel((w//2,h//2)),bottomCenter=im.getpixel((w//2,h-1)))))'
 ].join('\n');
 const run=cp.spawnSync('python',['-c',py,file],{encoding:'utf-8',timeout:8000});
 if(run.status!==0)throw Error('Pillow screenshot-pixel audit failed: '+run.stderr);
 return JSON.parse(run.stdout);
}
async function dragTouch(page,from,to){
 const {box}=await page.evaluate(()=>{
  const r=document.getElementById('stage').getBoundingClientRect();
  return{box:{x:r.left,y:r.top,w:r.width,h:r.height}};
 });
 const s=Math.min(box.w/960,box.h/540),ox=box.x+(box.w-960*s)/2,oy=box.y+(box.h-540*s)/2;
 const pt=(x,y)=>({x:ox+x*s,y:oy+y*s,id:1});
 const cdp=await page.context().newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[pt(from.x,from.y)]});
 for(let i=1;i<=12;i++){
  const f=i/12;await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[pt(from.x+(to.x-from.x)*f,from.y+(to.y-from.y)*f)]});await delay(17);
 }
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
}
async function touchShred(browser,url){
 const context=await browser.newContext({viewport:{width:390,height:760},hasTouch:true,isMobile:true,deviceScaleFactor:2});
 const page=await context.newPage();
 try{
  let seed=1,chosen=null;
  for(;seed<=34;seed++){
   await page.goto(url+'?seed='+seed,{waitUntil:'domcontentloaded'});
   await waitFor(page,()=>!!window.__officeAttackQA,2500);
   await page.locator('#play').click();
   const s=await snap(page);
   if(s.queue[1]==='shred'){chosen=s;break}
  }
  ck(!!chosen,'Touch drag: cannot find a seed with SHRED as second round');
  if(!chosen)return;
  const world=async(x,y)=>{
   const box=await page.locator('#stage').boundingBox(),s=Math.min(box.width/960,box.height/540);
   return{x:box.x+(box.width-960*s)/2+x*s,y:box.y+(box.height-540*s)/2+y*s};
  };
  const f=chosen.forms.find(x=>x.ok);
  const t=await world(f.x,f.y);await page.touchscreen.tap(t.x,t.y);
  await page.waitForFunction(()=>{const s=window.__officeAttackQA.snapshot();return s.index===1&&s.id==='shred'&&s.mode==='active'},null,{timeout:5000});
  const before=await snap(page),doc=before.docs.find(d=>!d.ok&&!d.shredded);
  assert.ok(doc,'SHRED should expose at least one spam document');
  await dragTouch(page,{x:doc.x,y:doc.y},{x:750,y:333});
  await page.waitForFunction(()=>window.__officeAttackQA.snapshot().shredded>0,null,{timeout:1800});
  const after=await snap(page);
  ck(after.shredded===1,'Touch drag must physically shred a spam form',{before:before.shredded,after:after.shredded,seed});
  await page.screenshot({path:path.join(evidence,'touch-shred-mobile.png')});
  results.push({tag:'touch-shred-mobile',seed,shredded:after.shredded,mode:after.mode});
 }catch(e){failures.push('Touch drag exception: '+e.message);await page.screenshot({path:path.join(evidence,'touch-shred-failure.png')}).catch(()=>{});}
 finally{await context.close()}
}
async function main(){
 fs.mkdirSync(evidence,{recursive:true});
 await start();
 const url='http://127.0.0.1:'+server.address().port+'/night-shift-office-attack.html';
 const browser=await chromium.launch({headless:true,executablePath:process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined,args:['--disable-background-timer-throttling']});
 try{
  for(const cfg of shapes){
   const context=await browser.newContext({viewport:{width:cfg.width,height:cfg.height},deviceScaleFactor:cfg.touch?2:1,hasTouch:cfg.touch,isMobile:cfg.tag==='mobile-390'});
   const page=await context.newPage();const errors=[],missing=[],loaded=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('response',r=>{if(r.status()>=400)missing.push(r.url()+' '+r.status())});
   page.on('request',r=>loaded.push(r.url()));
   try{
    await page.goto(url+'?seed=1942',{waitUntil:'networkidle'});
    await waitFor(page,()=>!!window.__officeAttackQA);
    await page.screenshot({path:path.join(evidence,cfg.tag+'-title.png')});
    ck(await page.locator('#marathon-title').getAttribute('aria-pressed')==='false',cfg.tag+' Marathon must be opt-in');
    await page.locator('#play').click();
    await waitFor(page,()=>window.__officeAttackQA.snapshot().mode==='active');
    await delay(190);
    const s=await snap(page),d=await diagnostics(page);
    const gameShot=path.join(evidence,cfg.tag+'-game.png');
    await page.screenshot({path:gameShot});
    const px=screenshotPixelAudit(gameShot);
    ck(s.id==='stamp',cfg.tag+' first game must be immediately actionable',{id:s.id});
    ck(!errors.length&&!missing.length,cfg.tag+' browser errors/assets',{errors,missing});
    ck(d.overscroll.x<=2&&d.overscroll.y<=2,cfg.tag+' unexpected page scrolling',d.overscroll);
    // The creative lead deliberately reserves separate HUD and deadline strips.
    // The canvas is allowed to be inset, provided it stays large and readable.
    ck(d.stage.x>=-2&&d.stage.y>=-2&&d.stage.right<=cfg.width+2&&d.stage.bottom<=cfg.height+2&&d.stage.h>cfg.height*.42,cfg.tag+' playable canvas is clipped or too small',d.stage);
    ck(d.lives.right+3<=d.round.x&&d.round.right+3<=d.mute.x,cfg.tag+' hearts/round/mute must form a non-overlapping horizontal HUD',{lives:d.lives,round:d.round,mute:d.mute});
    // Judge ACTUAL screenshot pixels, not the theoretical 960x540 aspect: a
    // deliberate pastel HUD and footer are fine; giant dark bars are not.
    ck(px.topDarkPct<=9&&px.bottomDarkPct<=9,cfg.tag+' visible dark letterbox bands in screenshot pixels',px);
    // HUD must not render over the game word command, and timer is a separate footer.
    const scale=Math.min(d.stage.w/960,d.stage.h/540),offY=d.stage.y+(d.stage.h-540*scale)/2;
    const cmdTop=offY+60*scale,cmdBottom=offY+156*scale;
    ck(d.hud.bottom<=cmdTop+5,cfg.tag+' HUD obscures microgame instruction',{hudBottom:d.hud.bottom,commandStart:cmdTop,commandBottom:cmdBottom});
    const artUrls=loaded.filter(x=>/hd-cast-atlas|office-attack\/icons\/.*\.png/i.test(x));
    ck(!artUrls.length,cfg.tag+' still requests the old HD atlas / mixed office PNG icons',{artUrls:artUrls.slice(0,12)});
    results.push({tag:cfg.tag,viewport:[cfg.width,cfg.height],screenshotPixelAudit:px,canvas:{y:d.stage.y,height:d.stage.h},legacyArtRequests:artUrls.length,hud:{left:d.lives.right,middle:[d.round.x,d.round.right],right:d.mute.x},errors:errors.length,missing:missing.length});
   }catch(e){failures.push(cfg.tag+' test exception: '+e.message);await page.screenshot({path:path.join(evidence,cfg.tag+'-error.png')}).catch(()=>{})}
   finally{await context.close()}
  }
  await touchShred(browser,url);
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
 if(process.env.OFFICE_ATTACK_CREATIVE_FULLRUN==='1'){
  const target=path.join(__dirname,'office-attack-creative-campaign.browser.cjs');
  for(const cfg of shapes){
   const run=cp.spawnSync(process.execPath,[target],{cwd:root,env:{...process.env,OFFICE_ATTACK_SITE_ROOT:root,OFFICE_ATTACK_VIEWPORT:cfg.width+'x'+cfg.height,OFFICE_ATTACK_CREATIVE_CAMPAIGN_EVIDENCE:path.join(evidence,cfg.tag+'-campaign')},encoding:'utf-8',timeout:180000,maxBuffer:6*1024*1024});
   const log=(run.stdout||'')+'\n'+(run.stderr||'');
   fs.writeFileSync(path.join(evidence,cfg.tag+'-campaign.log'),log);
   ck(run.status===0,cfg.tag+' 20-encounter full game / breaks / research / 2 bosses / ending',{exit:run.status,tail:log.slice(-1800)});
   results.push({tag:cfg.tag+'-campaign',status:run.status,rounds:(log.match(/^ROUND/gm)||[]).length,passed:run.status===0});
   const source=path.join(evidence,cfg.tag+'-campaign');
   for(const name of ['intermission-1.png','intermission-2.png','boss-printer.png','boss-manager.png','ending.png','research-1.png']){
    const p=path.join(source,name);if(fs.existsSync(p))fs.copyFileSync(p,path.join(evidence,cfg.tag+'-'+name));
   }
  }
 }
 const report={date:new Date().toISOString(),root,evidence,results,failures};
 fs.writeFileSync(path.join(evidence,'creative-qa-results.json'),JSON.stringify(report,null,2));
 console.log('CREATIVE_QA_RESULTS\n'+JSON.stringify(report,null,2));
 if(failures.length){console.error('CREATIVE_QA: '+failures.length+' DEFECTS (test exit 1, expected on unfixed builds)');process.exitCode=1}
 else console.log('CREATIVE_QA: PASS ALL');
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=2;server.close()});
