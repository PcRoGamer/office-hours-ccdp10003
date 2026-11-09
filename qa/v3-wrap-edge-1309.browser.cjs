'use strict';
// Independent integrated candidate edge-case browser gate. Does not modify game code.
// node qa/v3-wrap-edge-1309.browser.cjs
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
function loadBrowser(){for(const id of [process.env.PLAYWRIGHT_PATH,'playwright','playwright-core','C:/Users/Admin/NightShiftV3-Lead-tools/node_modules/playwright-core']){if(!id)continue;try{return require(id).chromium}catch{}}throw Error('Playwright browser runtime not found')}const chromium=loadBrowser();
const root=path.resolve(__dirname,'..'),out=path.join(root,'qa','v3-wrap-edge-1309-evidence');
fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/json'};
const requests=[];
const server=http.createServer((req,res)=>{let pathname='';
 try{pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);const f=path.resolve(root,'.'+pathname);
 if(f!==root&&!f.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 fs.readFile(f,(e,b)=>{if(e){requests.push({path:pathname,status:404});res.writeHead(404);return res.end('missing');}
 res.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});res.end(b)});
 }catch(e){requests.push({path:pathname,error:String(e)});res.writeHead(400);res.end();}});
const results=[];
async function main(){
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--disable-extensions']});
 try{
 for(const [name,width,height,dpr,hasTouch] of [['tiny',320,568,1,true],['portrait-dpr2',650,800,2,true],['4k',3840,2160,1,false],['ultrawide',3440,1440,1,false]].filter(item=>!process.env.EDGE_CASE||item[0]===process.env.EDGE_CASE)){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,hasTouch,isMobile:hasTouch,reducedMotion:'reduce',serviceWorkers:'block'});
 const page=await context.newPage(),errors=[],bad=[];page.setDefaultTimeout(7500);
 page.on('pageerror',e=>errors.push(String(e)));page.on('console',e=>{if(e.type()==='error')errors.push(e.text())});
 page.on('response',r=>{if(r.status()>=400)bad.push(r.status()+' '+r.url())});
 try{
  await page.goto('http://127.0.0.1:'+server.address().port+'/night-shift-v3.html?seed=93&first=0',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__nightShiftV3?.snapshot().frames>4);
  const initial=await page.evaluate(()=>window.__nightShiftV3.snapshot());
  assert.equal(initial.mode,'title');assert.equal(initial.deck.length,12);
  assert.deepEqual(initial.viewport.backing,[width*dpr,height*dpr]);
  const overflow=await page.evaluate(()=>({x:document.documentElement.scrollWidth-innerWidth,y:document.documentElement.scrollHeight-innerHeight}));
  assert.ok(overflow.x<=1&&overflow.y<=1,'Unexpected page overflow '+JSON.stringify(overflow));
  await page.getByRole('button',{name:/CLOCK IN/i}).click();
  await page.waitForFunction(()=>window.__nightShiftV3.snapshot().mode==='card');
  const active=await page.evaluate(()=>window.__nightShiftV3.snapshot());
  assert.equal(active.currentCardId,'I1');
  const state=await page.evaluate(()=>{
    const c=document.querySelector('#world'),g=c.getContext('2d'),w=c.width,h=c.height;
    const a=g.getImageData(0,0,1,1).data,b=g.getImageData(Math.floor(w/2),Math.floor(h/2),1,1).data,
      d=g.getImageData(w-1,h-1,1,1).data;
    return {pixels:[Array.from(a),Array.from(b),Array.from(d)],focus:document.activeElement?.id};
  });
  assert.equal(state.focus,'world','Start does not focus gameplay canvas');
  assert.ok(new Set(state.pixels.map(x=>x.join(','))).size>1,'Rendered canvas appears flat at sampled points');
  await page.screenshot({path:path.join(out,name+'.png')});
  await page.keyboard.press('Escape');
  const frozenStart=await page.evaluate(()=>window.__nightShiftV3.snapshot());
  assert.equal(frozenStart.paused,true);
  await page.waitForTimeout(350);
  const frozenEnd=await page.evaluate(()=>window.__nightShiftV3.snapshot());
  assert.equal(frozenStart.elapsed,frozenEnd.elapsed);
  await page.getByRole('button',{name:'RESUME SHIFT'}).click();
  assert.equal((await page.evaluate(()=>window.__nightShiftV3.snapshot())).paused,false);
  await page.getByRole('button',{name:/SOUND/i}).click();
  await page.getByRole('button',{name:/SOUND/i}).click();
  const postSound=await page.evaluate(()=>window.__nightShiftV3.snapshot());
  assert.equal(postSound.mode,'card','Sound toggle changed game phase');
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'RESTART DEMO'}).click();
  const replay=await page.evaluate(()=>window.__nightShiftV3.snapshot());
  assert.equal(replay.evidence.length,0);assert.equal(replay.hearts,3);assert.equal(replay.currentCardId,'I1');
  assert.equal(errors.length,0,errors.join('; '));assert.equal(bad.length,0,bad.join('; '));
  results.push({name,pass:true,overflow,renderPixels:state.pixels,photo:name+'.png',audioToggleStable:true,pauseStable:true,replayClean:true});
  console.log('PASS',name);
 }catch(e){results.push({name,pass:false,error:String(e.stack||e)});console.error('FAIL',name,String(e))}
 finally{await context.close();}
 }
 }finally{await browser.close();await new Promise(r=>server.close(r))}
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({results,requests},null,2));
 if(results.some(r=>!r.pass)||requests.length)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1;server.close()});