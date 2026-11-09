'use strict';
// Independent browser smoke for randomized first cards; never assumes I1 or test-order-specific seed.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/Admin/NightShiftV3-Lead-tools/node_modules/playwright-core');
const root=path.resolve(__dirname,'..');
const viewports=[['desktop',1920,1080,1],['laptop',1366,768,1],['portrait',650,800,1],['retina',1920,1080,2]];
const failures=[],screens=[];
const server=http.createServer((req,res)=>{
  const request=new URL(req.url,'http://127.0.0.1').pathname;
  const file=path.resolve(root,'.'+decodeURIComponent(request));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(err,bytes)=>{
    if(err){res.writeHead(404).end();return}
    const ext=path.extname(file),mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'};
    res.writeHead(200,{'content-type':mime[ext]||'application/octet-stream'}).end(bytes);
  });
});
(async()=>{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--disable-extensions']});
 const output=path.join(root,'qa','v3-wrap-regression-evidence');fs.mkdirSync(output,{recursive:true});
 try{
 for(const [name,w,h,dpr] of viewports){
  const ctx=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:dpr,reducedMotion:'reduce'});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
  try{
   await page.goto('http://127.0.0.1:'+server.address().port+'/night-shift-v3.html',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.__nightShiftV3?.snapshot?.().frames>5);
   const initial=await page.evaluate(()=>window.__nightShiftV3.snapshot());
   assert.equal(initial.mode,'title');assert.equal(initial.deck.length,12);assert.equal(new Set(initial.deck).size,12);
   await page.getByRole('button',{name:/CLOCK IN/}).click();
   await page.waitForFunction(()=>window.__nightShiftV3.snapshot().mode==='card');
   const first=await page.evaluate(()=>window.__nightShiftV3.snapshot());
   assert.ok(first.currentCardId,'Missing first card');assert.ok(first.sceneState,'Card scene not instantiated');
   await page.screenshot({path:path.join(output,name+'-first.png')});
   const canvas=await page.evaluate(()=>document.querySelector('#world').toDataURL('image/png').split(',')[1]);
   fs.writeFileSync(path.join(output,name+'-canvas-first.png'),Buffer.from(canvas,'base64'));
   await page.keyboard.press('Escape');
   const paused=await page.evaluate(()=>window.__nightShiftV3.snapshot());assert.equal(paused.paused,true);
   await page.waitForTimeout(350);
   const frozen=await page.evaluate(()=>window.__nightShiftV3.snapshot());
   assert.equal(frozen.elapsed,paused.elapsed,'Paused gameplay clock advanced');
   await page.getByRole('button',{name:'RESUME SHIFT'}).click();
   assert.equal((await page.evaluate(()=>window.__nightShiftV3.snapshot())).paused,false);
   await page.keyboard.press('Escape');
   await page.getByRole('button',{name:'RESTART DEMO'}).click();
   const replay=await page.evaluate(()=>window.__nightShiftV3.snapshot());
   assert.equal(replay.mode,'card');assert.equal(replay.hearts,3);assert.equal(replay.evidence.length,0);
   assert.ok(replay.currentCardId,'Missing replay card');assert.equal(replay.deck.length,12);
   assert.deepEqual(errors,[],'Browser errors or missing assets');
   const row={name,firstCard:first.currentCardId,replayCard:replay.currentCardId,paused:true,errors:0};
   screens.push(row);console.log('PASS '+JSON.stringify(row));
  }catch(e){failures.push({name,error:String(e.stack||e)});console.error('FAIL '+name,e)}
  finally{await ctx.close()}
 }
 }finally{await browser.close();await new Promise(ok=>server.close(ok))}
 fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({screens,failures},null,2));
 if(failures.length)process.exitCode=1;
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
