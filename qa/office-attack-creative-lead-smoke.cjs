'use strict';
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/Admin/NightShiftV3-Lead-tools/node_modules/playwright-core');
const root=path.resolve(__dirname,'..'),out=path.join(__dirname,'office-attack-creative-lead-evidence');
fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'};
const server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(!p.startsWith(root+path.sep)){res.writeHead(403);return res.end();}fs.readFile(p,(e,b)=>{if(e){res.writeHead(404);return res.end('404')}res.writeHead(200,{'content-type':mime[path.extname(p)]||'application/octet-stream'});res.end(b)})});
(async()=>{await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{
for(const [w,h] of [[1440,810],[650,800],[390,760]]){
 const page=await browser.newPage({viewport:{width:w,height:h},deviceScaleFactor:1});
 const errors=[],bad=[];page.on('pageerror',x=>errors.push(x.message));page.on('response',r=>{if(r.status()>=400)bad.push(r.url())});
 await page.goto('http://127.0.0.1:'+server.address().port+'/night-shift-office-attack.html?seed=1942',{waitUntil:'networkidle'});
 await page.locator('#play').click();await page.waitForTimeout(250);
 const l=await page.evaluate(()=>{
 const r=x=>{const b=document.querySelector(x).getBoundingClientRect();return {top:b.top,bottom:b.bottom,left:b.left,right:b.right,width:b.width,height:b.height}};
 const c=document.querySelector('#stage'),ctx=c.getContext('2d'),px=ctx.getImageData(3,3,1,1).data;
 return {hud:r('#hud'),canvas:r('#stage'),timer:r('#deadline-ui'),timerVisible:getComputedStyle(document.querySelector('#deadline-ui')).display!=='none',timerRatio:document.querySelector('#deadline-fill').style.transform,edge:[...px],round:document.querySelector('#round').textContent,game:window.__officeAttackQA.snapshot().id};
 });
 assert.equal(l.timerVisible,true,'separate deadline dock must be visible');
 assert.ok(l.hud.bottom<=l.canvas.top+2,'HUD must not overlay gameplay');
 assert.ok(l.canvas.bottom<=l.timer.top+2,'timer must not overlay gameplay');
 assert.ok(l.edge.slice(0,3).every(x=>x>100),'no dark/black letterbox bars');
 assert.ok(l.timerRatio.includes('scaleX'),'deadline fill must update');
 assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);
 await page.screenshot({path:path.join(out,'stage-'+w+'x'+h+'.png')});
 console.log('PASS',w+'x'+h,JSON.stringify(l));
 await page.close();
}
}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e.stack);server.close();process.exitCode=1})