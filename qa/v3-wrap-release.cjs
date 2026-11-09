'use strict';
/**
 * Night Shift v3 delivery gate. Real Chromium + real HTTP assets, never fixture victories.
 * Run: node qa/v3-wrap-release.cjs
 * Fast local diagnosis: RELEASE_FAST=1 node qa/v3-wrap-release.cjs
 * Hosted check: RELEASE_PUBLIC_URL=https://.../night-shift-v3.html node qa/v3-wrap-release.cjs
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const crypto=require('node:crypto');
const root=path.resolve(process.env.RELEASE_SITE_ROOT||path.resolve(__dirname,'..'));
const evidenceRoot=path.resolve(process.env.RELEASE_ARTIFACT_DIR||path.join(root,'qa-artifacts','v3-wrap-release'));
const runFast=process.env.RELEASE_FAST==='1';
const hosted=process.env.RELEASE_PUBLIC_URL||'';
const allLayouts=[
  ['1920x1080',1920,1080,1],
  ['1366x768',1366,768,1],
  ['650x800',650,800,1],
  ['1920x1080-dpr2',1920,1080,2]
];
const layouts=process.env.RELEASE_LAYOUTS
  ?allLayouts.filter(layout=>process.env.RELEASE_LAYOUTS.split(',').includes(layout[0]))
  :runFast?[allLayouts[0]]:allLayouts;
assert(layouts.length>0,'RELEASE_LAYOUTS must name at least one supported viewport');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
 '.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.json':'application/json',
 '.woff':'font/woff','.woff2':'font/woff2','.svg':'image/svg+xml'};
function chromiumProvider(){
  for(const name of ['playwright','playwright-core','C:/Users/Admin/NightShiftV3-Lead-tools/node_modules/playwright-core']){
    try{return require(name).chromium}catch{}
  }
  throw Error('Playwright not found. Install playwright@1.58.2; then npx playwright install chromium.');
}
function localServer(){
 return http.createServer((req,res)=>{
   try{
     const u=new URL(req.url,'http://localhost');
     const file=path.resolve(root,'.'+decodeURIComponent(u.pathname));
     if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end('Forbidden');return}
     fs.readFile(file,(error,bytes)=>{
       if(error){res.writeHead(404);res.end('Not found: '+u.pathname);return}
       res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream',
        'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
       res.end(req.method==='HEAD'?undefined:bytes);
     });
   }catch(error){res.writeHead(400);res.end(String(error))}
 });
}
const record={source:hosted?'public-url':'local-candidate',timestamp:new Date().toISOString(),
 layouts:[],problems:[],fallback:null,entry:null,pass:false};
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
async function main(){
 fs.mkdirSync(evidenceRoot,{recursive:true});
 let server=null,browser=null;
 const deadline=setTimeout(()=>{console.error('Release gate watchdog: browser exceeded 155 seconds');process.exit(124)},155000);
 try{
   if(!hosted){
     assert(fs.existsSync(path.join(root,'night-shift-v3.html')),
       'Candidate absent: mirror/package must be integrated before this gate can pass');
     server=localServer();
     await new Promise((resolve,reject)=>server.once('error',reject).listen(0,'127.0.0.1',resolve));
   }
   const gameUrl=hosted||('http://127.0.0.1:'+server.address().port+'/night-shift-v3.html');
   const hdUrl=new URL('arcade-office-hd.html',gameUrl).href;
   const [entryResponse,hdResponse]=await Promise.all([fetch(gameUrl),fetch(hdUrl)]);
   assert.equal(entryResponse.status,200,'Candidate URL is not publicly/locally available: '+gameUrl);
   assert.equal(hdResponse.status,200,'HD fallback route is missing: '+hdUrl);
   const [entryText,hdBytes]=await Promise.all([entryResponse.text(),hdResponse.arrayBuffer()]);
   assert.match(entryText,/night-shift-v3\/app\.js/,'Candidate missing live ES module entry');
   assert(hdBytes.byteLength>10000,'HD fallback appears truncated');
   record.entry={url:gameUrl,sha256:hash(Buffer.from(entryText)),bytes:Buffer.byteLength(entryText)};
   record.fallback={url:hdUrl,sha256:hash(Buffer.from(hdBytes)),bytes:hdBytes.byteLength};
   const browserType=chromiumProvider();
   let executablePath=process.env.CHROME_PATH||'';
   if(!executablePath&&process.platform==='win32'){
      const installed='C:/Program Files/Google/Chrome/Application/chrome.exe';
      if(fs.existsSync(installed))executablePath=installed;
   }
   browser=await browserType.launch({headless:true,...(executablePath?{executablePath}:{}),
     args:['--disable-gpu-sandbox','--no-sandbox','--disable-extensions']});
   for(const [name,width,height,dpr] of layouts){
     const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,
       reducedMotion:'reduce',serviceWorkers:'block'});
     const page=await context.newPage();
     page.setDefaultTimeout(12000);
     const observed={name,width,height,dpr,errors:[],badResponses:[]};
     page.on('pageerror',e=>observed.errors.push(String(e)));
     page.on('console',m=>{if(m.type()==='error')observed.errors.push(m.text())});
     page.on('response',r=>{if(r.status()>=400)observed.badResponses.push(r.status()+' '+r.url())});
     try{
       await page.goto(gameUrl,{waitUntil:'domcontentloaded',timeout:16000});
       await page.waitForFunction(()=>!!window.__nightShiftV3?.snapshot,{timeout:14000});
       const initial=await page.evaluate(()=>window.__nightShiftV3.snapshot());
       observed.initialMode=initial.mode;
       assert.equal(initial.mode,'title','Expected actual title, not synthetic game test');
       const bounds=await page.locator('#clock-in').boundingBox();
       assert(bounds&&bounds.width>150&&bounds.height>35,'CLOCK IN button missing or too small');
       assert(bounds.x>=-1&&bounds.y>=-1&&bounds.x+bounds.width<=width+2
         &&bounds.y+bounds.height<=height+2,'CLOCK IN off-screen at '+name);
       await page.screenshot({path:path.join(evidenceRoot,name+'-title.png'),timeout:10000});
       await page.getByRole('button',{name:/CLOCK IN/i}).click({timeout:8000});
       await page.waitForFunction(()=>window.__nightShiftV3?.snapshot?.().mode==='card',{timeout:12000});
       const live=await page.evaluate(()=>{
          const s=window.__nightShiftV3.snapshot(),canvas=document.querySelector('#world');
          return {mode:s.mode,card:s.currentCardId,fullCampaign:s.fullCampaign,
            deck:s.deck,hearts:s.hearts,backing:[canvas.width,canvas.height],
            rect:[canvas.getBoundingClientRect().width,canvas.getBoundingClientRect().height],
            scrollWidth:document.documentElement.scrollWidth};
       });
       observed.live=live;
       assert.equal(live.fullCampaign,true,'Loaded a short fallback instead of full v3');
       assert.equal(live.card,'I1','First authored card missing');
       assert.equal(live.deck.length,12,'First run is not exactly 12 cards');
       assert.equal(new Set(live.deck).size,12,'Deck contains duplicate cards');
       assert(live.backing[0]>=width&&live.backing[1]>=height,'Canvas backing under resolution');
       assert(live.rect[0]>=width-1&&live.rect[1]>=height-1,'Canvas does not fill viewport');
       assert(live.scrollWidth<=width+2,'Horizontal overflow '+name);
       await page.screenshot({path:path.join(evidenceRoot,name+'-first-action.png'),timeout:10000});
       await page.locator('#pause').click({timeout:7000});
       const pausing=await page.evaluate(()=>window.__nightShiftV3.snapshot());
       assert.equal(pausing.paused,true,'Pause button did not pause actual game');
       await page.waitForTimeout(230);
       const paused=await page.evaluate(()=>window.__nightShiftV3.snapshot());
       assert(Math.abs(pausing.elapsed-paused.elapsed)<0.035,'Timer continues during pause');
       await page.locator('#resume').click({timeout:7000});
       const resumed=await page.evaluate(()=>window.__nightShiftV3.snapshot());
       assert.equal(resumed.paused,false,'Resume button did not restart game');
       observed.pauseFrozen=true;
       assert.equal(observed.errors.length,0,'JavaScript error: '+observed.errors.join(' | '));
       assert.equal(observed.badResponses.length,0,'Failed asset: '+observed.badResponses.join(' | '));
       observed.pass=true;
     }catch(e){observed.pass=false;observed.failure=String(e.stack||e);
       record.problems.push(name+': '+e.message);
       try{await page.screenshot({path:path.join(evidenceRoot,name+'-failure.png'),timeout:4000})}catch{}
     }
     record.layouts.push(observed);
     await context.close();
   }
   record.pass=record.problems.length===0;
 }catch(e){record.problems.push('fatal: '+String(e.stack||e))}
 finally{
   if(browser)await browser.close().catch(()=>{});
   if(server)await new Promise(resolve=>server.close(resolve));
   clearTimeout(deadline);
   fs.writeFileSync(path.join(evidenceRoot,'results.json'),JSON.stringify(record,null,2));
   console.log(JSON.stringify({pass:record.pass,entry:record.entry,fallback:record.fallback,
    layouts:record.layouts.map(v=>({name:v.name,pass:v.pass,mode:v.live?.mode,
      card:v.live?.card,deck:v.live?.deck?.length,pauseFrozen:v.pauseFrozen,
      errors:v.errors,badResponses:v.badResponses,failure:v.failure?.slice(0,500)})),
    problems:record.problems},null,2));
   if(!record.pass)process.exitCode=1;
 }
}
main().catch(e=>{console.error(e);process.exitCode=1});
