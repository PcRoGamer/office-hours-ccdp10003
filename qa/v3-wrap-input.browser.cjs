'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/Admin/NightShiftV3-Lead-tools/node_modules/playwright-core');
const root=path.resolve(__dirname,'..'),out=path.join(__dirname,'v3-wrap-input-evidence');
fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end('404')};res.writeHead(200,{'content-type':/\.m?js$/.test(file)?'text/javascript':/\.html$/.test(file)?'text/html':'application/octet-stream'});res.end(data)});
});
(async()=>{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox']});
 const results=[];
 try{
  for(const [name,width,height,dpr] of [['desktop',1920,1080,1],['laptop',1366,768,1],['portrait',650,800,1],['dpr2',1920,1080,2]]){
   const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,reducedMotion:'reduce'});
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
   const response=await page.goto('http://127.0.0.1:'+server.address().port+'/night-shift-v3.html',{waitUntil:'domcontentloaded'});
   assert.equal(response.status(),200);
   await page.waitForFunction(()=>Boolean(window.__nightShiftV3),{timeout:10000});
   await page.screenshot({path:path.join(out,name+'-title.png')});
   await page.getByRole('button',{name:/CLOCK IN/i}).click();
   await page.waitForTimeout(300);
   const state=await page.evaluate(()=>window.__nightShiftV3.snapshot());
   assert.equal(state.mode,'card');
   assert.equal(state.currentCardId,'I1');
   assert.equal(state.deck.length,12);
   assert.equal(state.viewport.backing[0],Math.round(width*dpr));
   assert.equal(state.viewport.backing[1],Math.round(height*dpr));
   await page.screenshot({path:path.join(out,name+'-first-card.png')});
   assert.deepEqual(errors,[]);
   results.push({name,viewport:[width,height],dpr,card:state.currentCardId,deck:state.deck.length,errors});
   console.log('PASS',name,JSON.stringify(results.at(-1)));
   await ctx.close();
  }
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
