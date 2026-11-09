'use strict';
const {chromium}=(()=>{try{return require('playwright')}catch{return require('C:/Users/Admin/NightShiftV3-Lead-tools/node_modules/playwright-core')}})();
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(process.env.OFFICE_ATTACK_SITE_ROOT||path.join(__dirname,'..')),out=path.join(__dirname,'office-attack-evidence');
fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
 const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname));
 if(!p.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 fs.readFile(p,(e,bytes)=>{if(e){res.writeHead(404);res.end('404');return}res.writeHead(200,{'content-type':mime[path.extname(p)]||'application/octet-stream'});res.end(bytes)})
});
function delay(t){return new Promise(r=>setTimeout(r,t))}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,...(process.platform==='win32'?{executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}:{})});
 try{
 for(const [name,width,height,dpr] of [['desktop',1920,1080,1],['laptop',1366,768,1],['portrait',650,800,1],['hidpi',1920,1080,2]]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr});
  const page=await context.newPage(),errors=[],bad=[];
  page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)bad.push(r.url()+' '+r.status())});
  try{
   await page.goto('http://127.0.0.1:'+server.address().port+'/night-shift-office-attack.html?seed=12',{waitUntil:'networkidle'});
   await page.waitForFunction(()=>window.__officeAttackQA?.snapshot?.().spriteReady,{timeout:10000});
   await page.screenshot({path:path.join(out,name+'-title.png')});
   await page.getByRole('button',{name:/CLOCK IN/}).click();
   await page.waitForFunction(()=>window.__officeAttackQA?.snapshot?.().id==='stamp'&&window.__officeAttackQA?.snapshot?.().mode==='active',{timeout:4000});
   const snap=await page.evaluate(()=>window.__officeAttackQA.snapshot());
   await page.screenshot({path:path.join(out,name+'-stamp.png')});
   assert.equal(snap.spriteReady,true);
   assert.equal(snap.id,'stamp');assert.equal(snap.level,1);
   assert.equal(await page.locator('#splash').evaluate(n=>getComputedStyle(n).display),'none');
   const box=await page.locator('#stage').boundingBox(),scale=Math.min(box.width/960,box.height/540);
   const ox=box.x+(box.width-960*scale)/2,oy=box.y+(box.height-540*scale)/2;
   const f=snap.forms.find(x=>x.ok);
   await page.mouse.click(ox+f.x*scale,oy+f.y*scale,{delay:40});
   await page.waitForFunction(()=>window.__officeAttackQA?.snapshot?.().score===1,{timeout:1000});
   assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);
   console.log('PASS '+name+' asset, entry, real approved stamp click, no broken assets/errors');
  }finally{await context.close()}
 }
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e.stack||e);server.close();process.exitCode=1});
