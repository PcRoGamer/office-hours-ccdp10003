'use strict';
const {chromium}=(()=>{try{return require('playwright')}catch{return require('C:/Users/Admin/NightShiftV3-Lead-tools/node_modules/playwright-core')}})();
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(process.env.OFFICE_ATTACK_SITE_ROOT||path.join(__dirname,'..')),mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'};
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 fs.readFile(file,(error,data)=>{res.writeHead(error?404:200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(error?'404':data)})
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,...(process.platform==='win32'?{executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}:{})});
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 const errors=[],bad=[];page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)bad.push(r.url())});
 const snap=()=>page.evaluate(()=>window.__officeAttackQA.snapshot());
 try{
  await page.goto('http://127.0.0.1:'+server.address().port+'/night-shift-office-attack.html?seed=555',{waitUntil:'networkidle'});
  await page.locator('#play').click();
  await page.waitForFunction(()=>window.__officeAttackQA?.snapshot().mode==='active',{timeout:4000});
  const first=await snap();assert.equal(first.id,'stamp');
  const badForm=first.forms.find(f=>!f.ok);
  const canvas=await page.locator('#stage').boundingBox(),scale=Math.min(canvas.width/960,canvas.height/540);
  const ox=canvas.x+(canvas.width-960*scale)/2,oy=canvas.y+(canvas.height-540*scale)/2;
  await page.mouse.click(ox+badForm.x*scale,oy+badForm.y*scale);
  await page.waitForFunction(()=>window.__officeAttackQA.snapshot().mode==='result',{timeout:1500});
  let state=await snap();
  assert.equal(state.score,0);assert.equal(state.lives,2);assert.equal(state.history.length,1);
  assert.equal(state.history[0].success,false);
  console.log('PASS wrong click loses exactly one heart; no free points');
  await page.waitForFunction(()=>{const s=window.__officeAttackQA.snapshot();return s.mode==='active'&&s.index===1},{timeout:4000});
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>window.__officeAttackQA.snapshot().mode==='pause',{timeout:1000});
  const frozen=await snap();await page.waitForTimeout(720);const still=await snap();
  assert.ok(Math.abs(still.remaining-frozen.remaining)<.02,'pause must freeze countdown');
  await page.locator('#resume').click();
  await page.waitForFunction(()=>window.__officeAttackQA.snapshot().mode==='active',{timeout:900});
  await page.waitForTimeout(450);
  assert.ok((await snap()).remaining<frozen.remaining-.24,'resume must restart countdown');
  console.log('PASS Escape pauses physics and timer; resume restarts');
  await page.waitForFunction(()=>{const s=window.__officeAttackQA.snapshot();return s.mode==='active'&&s.index===2},{timeout:9000});
  state=await snap();assert.equal(state.lives,1);assert.equal(state.history[1].success,false);
  await page.waitForFunction(()=>window.__officeAttackQA.snapshot().mode==='end',{timeout:10000});
  state=await snap();assert.equal(state.lives,0);assert.equal(state.score,0);assert.equal(state.history.length,3);
  assert.equal(await page.locator('#end-title').innerText(),'FIRED!');
  console.log('PASS expiration and third loss terminate cleanly; no synthetic victories');
  await page.locator('#again').click();
  await page.waitForFunction(()=>{const s=window.__officeAttackQA.snapshot();return s.mode==='active'&&s.index===0},{timeout:1500});
  state=await snap();assert.equal(state.lives,3);assert.equal(state.score,0);assert.equal(state.history.length,0);
  assert.equal(await page.locator('.ns-upgrade').count(),0);
  assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);
  console.log('PASS replay resets all progress; no upgrades, errors or missing assets');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e.stack||e);server.close();process.exitCode=1});
