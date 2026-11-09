// Real Chrome smoke / pointer / responsive / replay acceptance for the assembled Night Shift v3.
// Run with NODE_PATH pointing to an installed playwright-core if not in normal node resolution.
// Example: node qa/v3-wrap-game.browser.cjs
'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
function playwright(){
 for(const p of [process.env.PLAYWRIGHT_PATH,'playwright','playwright-core',
   'C:/Users/Admin/NightShiftV3-Lead-tools/node_modules/playwright-core']){
   if(!p)continue;try{return require(p)}catch{}
 }
 throw Error('Playwright is not installed; set PLAYWRIGHT_PATH to an installed playwright-core');
}
const {chromium}=playwright();
const root=path.resolve(__dirname,'..'),output=path.join(root,'qa','v3-wrap-game-evidence');
fs.mkdirSync(output,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
  '.json':'application/json','.png':'image/png','.webp':'image/webp'};
const misses=[];
const server=http.createServer((req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  const file=path.resolve(root,'.'+pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  fs.readFile(file,(err,bytes)=>{
   if(err){misses.push(pathname);res.writeHead(404);res.end('NOT FOUND '+pathname);return;}
   res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});
   res.end(bytes);
  });
 }catch(e){res.writeHead(400);res.end(String(e))}
});
const trace=[];
const fail=(name,error)=>{trace.push({name,pass:false,error:String(error?.stack||error)});console.error('FAIL '+name+': '+String(error))};
const success=(name,data)=>{trace.push({name,pass:true,...data});console.log('PASS '+name+' '+JSON.stringify(data))};
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const port=server.address().port;
 const browser=await chromium.launch({
  headless:true,
  executablePath:process.env.CHROME_PATH||(process.platform==='win32'?
   'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),
  timeout:20000,args:['--no-sandbox','--disable-extensions','--disable-background-networking']
 });
 try {
  for(const [name,w,h,dpr] of [['desktop',1920,1080,1],['laptop',1366,768,1],
    ['portrait',650,800,1],['retina',1920,1080,2]]){
   const context=await browser.newContext({viewport:{width:w,height:h},
     deviceScaleFactor:dpr,reducedMotion:'reduce',serviceWorkers:'block'});
   const page=await context.newPage();const errors=[];const bad=[];
   page.setDefaultTimeout(10000);
   page.on('pageerror',e=>errors.push(String(e)));
   page.on('console',e=>{if(e.type()==='error')errors.push(e.text())});
   page.on('response',r=>{if(r.status()>=400)bad.push(r.status()+' '+r.url())});
   const url='http://127.0.0.1:'+port+'/night-shift-v3.html'+(name==='laptop'?'?seed=72&first=0':'');
   try {
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:15000});
    await page.waitForFunction(()=>window.__nightShiftV3?.snapshot?.().frames>5,null,{timeout:15000});
    const start=await page.evaluate(()=>window.__nightShiftV3.snapshot());
    assert.equal(start.mode,'title');
    assert.equal(start.fullCampaign,true);
    assert.equal(start.deck.length,12);
    assert.equal(new Set(start.deck).size,12);
    assert.equal(start.viewport.backing[0],w*dpr);
    assert.equal(start.viewport.backing[1],h*dpr);
    await page.screenshot({path:path.join(output,name+'-title.png')});
    // Preserve both the native full-page screenshot (including the DOM HUD)
    // and the raw Canvas2D pixel buffer (for independent render inspection).
    const titleCanvas=await page.evaluate(()=>document.querySelector('#world').toDataURL('image/png').split(',')[1]);
    fs.writeFileSync(path.join(output,name+'-canvas-title.png'),Buffer.from(titleCanvas,'base64'));
    await page.getByRole('button',{name:/CLOCK IN/i}).click();
    await page.waitForFunction(()=>window.__nightShiftV3.snapshot().mode==='card',{timeout:8000});
    const game=await page.evaluate(()=>window.__nightShiftV3.snapshot());
    assert.equal(game.currentCardId,'I1');
    assert.ok(game.sceneState,'I1 real scene must be instantiated');
    assert.equal(game.deck.length,12);
    await page.screenshot({path:path.join(output,name+'-I1.png')});
    const firstCanvas=await page.evaluate(()=>document.querySelector('#world').toDataURL('image/png').split(',')[1]);
    fs.writeFileSync(path.join(output,name+'-canvas-I1.png'),Buffer.from(firstCanvas,'base64'));
    // Pause must freeze elapsed (actual state, not only the visual countdown).
    await page.keyboard.press('Escape');
    const paused=await page.evaluate(()=>window.__nightShiftV3.snapshot());
    assert.equal(paused.paused,true);
    await page.waitForTimeout(400);
    const frozen=await page.evaluate(()=>window.__nightShiftV3.snapshot());
    assert.equal(frozen.elapsed,paused.elapsed,'Pause did not freeze real gameplay time');
    await page.getByRole('button',{name:'RESUME SHIFT'}).click();
    const resumed=await page.evaluate(()=>window.__nightShiftV3.snapshot());
    assert.equal(resumed.paused,false);
    if(name==='desktop'){
     // One genuine pointer gesture on an approved I1 form.
     // Screenshot, pause and resume may take seconds under a busy CI GPU.
     // Always aim using the CURRENT moving form position, never a stale frame.
     let hit=false,attempts=0,lastTarget=null;
     while(!hit&&attempts++<8){
       const live=await page.evaluate(()=>window.__nightShiftV3.snapshot());
       assert.equal(live.currentCardId,'I1','I1 changed before a real stamp landed');
       const obj=live.sceneState?.forms?.find(f=>f.kind==='approved'&&!f.hit&&f.x>140&&f.x<1030);
       if(!obj){await page.waitForTimeout(120);continue;}
       lastTarget=obj.id;
       const i=Number(obj.id.slice('form-'.length));
       const s=live.viewport.cssHeight/live.viewport.worldHeight;
       await page.mouse.click((obj.x+76)*s,(331+(i%2)*115+55)*s,{delay:15});
       const stamped=await page.evaluate(()=>window.__nightShiftV3.snapshot());
       hit=Boolean(stamped.sceneState?.forms?.some(f=>f.id===obj.id&&f.hit));
     }
     assert.ok(hit,'Real pointer stamp could not hit a live moving approved form; last target '+lastTarget);
     await page.screenshot({path:path.join(output,name+'-real-stamp.png')});
    }
    // The RESTART button must create a fresh run and a new seed/topology.
    await page.keyboard.press('Escape');
    await page.getByRole('button',{name:'RESTART DEMO'}).click();
    const restarted=await page.evaluate(()=>window.__nightShiftV3.snapshot());
    assert.equal(restarted.mode,'card');
    assert.equal(restarted.currentCardId,'I1');
    assert.equal(restarted.evidence.length,0,'Old scored events leaked into replay');
    assert.equal(restarted.hearts,3);
    if(name!=='laptop')assert.notDeepEqual(restarted.deck,start.deck,
       'New run silently repeats first-run 12-card roster');
    assert.equal(errors.length,0,'JavaScript errors: '+errors.join('; '));
    assert.equal(bad.length,0,'Bad HTTP responses: '+bad.join('; '));
    success(name,{viewport:[w,h,dpr],initialDeck:start.deck,replayDeck:restarted.deck,
      noErrors:true,pauseFrozen:true,screenshot:name+'-I1.png'});
   }catch(e){fail(name,e)}
   finally{await context.close().catch(()=>{})}
  }
 }finally{await browser.close().catch(()=>{});await new Promise(resolve=>server.close(resolve))}
 fs.writeFileSync(path.join(output,'result.json'),JSON.stringify({trace,misses},null,2));
 if(trace.some(r=>!r.pass)||misses.length)process.exitCode=1;
})().catch(e=>{console.error('BROWSER HARNESS ERROR',e);process.exitCode=1;server.close()});
