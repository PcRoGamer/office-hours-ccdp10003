// Live five-stamp acceptance: verify all physical I1 hits survive into SYSTEMS.
'use strict';
const {chromium}=require('C:/Users/Admin/NightShiftV3-Lead-tools/node_modules/playwright-core');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),mime={'.html':'text/html','.js':'application/javascript','.mjs':'application/javascript','.css':'text/css'};
const serve=http.createServer((req,res)=>{const url=new URL(req.url,'http://127.0.0.1');const target=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(!target.startsWith(root+path.sep)){res.writeHead(403);return res.end()}fs.readFile(target,(err,content)=>{res.writeHead(err?404:200,{'content-type':mime[path.extname(target)]||'application/octet-stream'});res.end(err?'404':content)})});
async function run(){
 await new Promise(r=>serve.listen(0,'127.0.0.1',r));
 let browser;
 try{
 browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',timeout:14000});
 const page=await browser.newPage({viewport:{width:1920,height:1080},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error')errors.push(e.text())});
 await page.goto('http://127.0.0.1:'+serve.address().port+'/night-shift-v3.html',{waitUntil:'domcontentloaded',timeout:12000});
 await page.getByRole('button',{name:/CLOCK IN/}).click();
 let clicks=0,started=Date.now(),prev='';
 while(Date.now()-started<24000){
  const s=await page.evaluate(()=>window.__nightShiftV3.snapshot());
  if(s.currentCardId==='I2'||s.mode==='promotion'){console.log('ADVANCED',JSON.stringify({clicks,seconds:(Date.now()-started)/1000,evidence:s.evidence,issue:s.scoreIssue}));assert.equal(s.scoreIssue,null);break}
  if(s.mode!=='card'||s.currentCardId!=='I1'){throw Error('I1 failed unexpectedly '+JSON.stringify({mode:s.mode,issue:s.scoreIssue,elapsed:s.elapsed,evidence:s.evidence,clicks,scene:s.sceneState}))}
  const f=s.sceneState?.forms?.find(f=>f.kind==='approved'&&!f.hit&&f.x>260&&f.x<965);
  if(f){
   const y=331+(Number(f.id.slice(5))%2)*115+55;
   const scale=s.viewport.cssHeight/s.viewport.worldHeight;
   const before=s.sceneState.progress;
   await page.mouse.click((f.x+60)*scale,y*scale,{delay:4});
   const now=await page.evaluate(()=>window.__nightShiftV3.snapshot());
   if(now.sceneState?.progress>before){clicks++;prev=f.id;console.log('STAMP',clicks,f.id)}
  } else await page.waitForTimeout(60);
 }
 const fin=await page.evaluate(()=>window.__nightShiftV3.snapshot());
 assert.equal(fin.currentCardId,'I2','five real approved forms must move into I2');
 assert.equal(fin.evidence.length,1);
 assert.equal(fin.scoreIssue,null,'strict SYSTEMS must verify actual I1 evidence');
 assert.ok(clicks>=5);
 assert.deepEqual(errors,[],'no browser errors');
 console.log('RESULT',JSON.stringify({pass:true,clicks,scoreIssue:fin.scoreIssue,mode:fin.mode,credited:fin.evidence.map(e=>e.id),errors}));
 }finally{if(browser)await browser.close();await new Promise(r=>serve.close(r))}
}
run().catch(e=>{console.error(e);process.exitCode=1;serve.close()});
