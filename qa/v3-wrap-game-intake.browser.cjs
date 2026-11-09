'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=(()=>{
 for(const p of [process.env.PLAYWRIGHT_PATH,'playwright','playwright-core',
 'C:/Users/Admin/NightShiftV3-Lead-tools/node_modules/playwright-core']){
  if(!p)continue;try{return require(p)}catch{}
 }
 throw Error('Playwright unavailable: set PLAYWRIGHT_PATH to installed playwright-core');
})();
const root=path.resolve(__dirname,'..'),mime={'.html':'text/html','.js':'application/javascript','.mjs':'application/javascript','.css':'text/css'};
const server=http.createServer((req,res)=>{
 const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(!p.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 fs.readFile(p,(e,b)=>{if(e){res.writeHead(404);res.end('missing')}else{res.setHeader('Content-Type',mime[path.extname(p)]||'application/octet-stream');res.end(b)}});
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),headless:true,args:['--no-sandbox','--disable-background-networking']});
 const context=await browser.newContext({viewport:{width:1920,height:1080},reducedMotion:'reduce'});
 const page=await context.newPage(),errs=[];
 page.on('pageerror',e=>errs.push(String(e)));
 try{
  await page.goto('http://127.0.0.1:'+server.address().port+'/night-shift-v3.html',{waitUntil:'domcontentloaded',timeout:12000});
  await page.waitForFunction(()=>window.__nightShiftV3?.snapshot?.().frames>5,null,{timeout:10000});
  const box=await page.locator('#clock-in').boundingBox();await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
  const snap=()=>page.evaluate(()=>window.__nightShiftV3.snapshot());
  const deadline=Date.now()+25000;
  const successes=new Set();let clicks=0;
  while(Date.now()<deadline){
   const s=await snap();
   if(s.currentCardId==='I2'){
    const evidence=s.evidence.find(e=>e.id==='I1');
    assert.ok(evidence,'Moving to I2 without a committed I1 receipt');
    assert.equal(evidence.evidence.actions.filter(a=>a.name==='approved-manual').length,5,'Five genuine stamp actions required');
    assert.equal(evidence.evidence.progress,5);
    assert.equal(s.hearts,3);
    assert.equal(errs.length,0,'No browser exceptions allowed');
    console.log('PASS: I1->I2 REAL POINTER',JSON.stringify({clicks,approved:[...successes],progress:5,credits:1,errors:errs}));
    return;
   }
   if(s.mode!=='card'||s.currentCardId!=='I1')throw Error('I1 left gameplay unexpectedly: '+JSON.stringify({mode:s.mode,card:s.currentCardId,hearts:s.hearts,evidence:s.evidence}));
   const t=s.sceneState?.forms?.find(f=>f.kind==='approved'&&!f.hit&&f.x>=250&&f.x<=850);
   if(t){
     const n=Number(t.id.split('-').at(-1)),scale=s.viewport.cssHeight/s.viewport.worldHeight;
     await page.mouse.click((t.x+75)*scale,(331+(n%2)*115+56)*scale,{delay:18});clicks++;
     const again=await snap();if(again.sceneState?.forms?.find(f=>f.id===t.id)?.hit)successes.add(t.id);
   }else await page.waitForTimeout(30);
  }
  throw Error('I1 timed out: '+JSON.stringify(await snap()));
 }finally{console.log('BROWSER_ERRORS',JSON.stringify(errs));await context.close();await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});