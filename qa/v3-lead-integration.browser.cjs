const {chromium}=require('C:/Users/Admin/NightShiftV3-Lead-tools/node_modules/playwright-core');
const fs=require('fs'),path=require('path'),http=require('http'),root=path.resolve(__dirname,'..');
const out=path.join(__dirname,'v3-lead-integration-evidence');fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html;charset=utf-8','.js':'application/javascript;charset=utf-8','.mjs':'application/javascript;charset=utf-8','.css':'text/css;charset=utf-8','.png':'image/png','.json':'application/json'};
const server=http.createServer((req,res)=>{
 const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const target=path.resolve(root,'.'+name);
 if(!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 fs.readFile(target,(e,b)=>{if(e){res.writeHead(404);res.end('404 '+name)}else{res.writeHead(200,{'content-type':mime[path.extname(target)]||'application/octet-stream','cache-control':'no-store'});res.end(b)}});
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--disable-gpu-sandbox']});
 const results=[];
 try{
   for(const [name,w,h,dpr] of [['1080p',1920,1080,1],['portrait',650,800,1],['4k-dpr2',1920,1080,2]]){
     const ctx=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:dpr,reducedMotion:'reduce'});
     const page=await ctx.newPage(),errors=[],bad=[];
     page.on('pageerror',e=>errors.push('page: '+String(e)));
     page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text())});
     page.on('response',r=>{if(r.status()>=400)bad.push(r.status()+' '+r.url())});
     await page.goto('http://127.0.0.1:'+server.address().port+'/night-shift-v3.html',{waitUntil:'load'});
     await page.waitForTimeout(1300);
     await page.screenshot({path:path.join(out,name+'-title.png')});
     const before=await page.evaluate(()=>({ready:!!window.__nightShiftV3,snapshot:window.__nightShiftV3?.snapshot?.(),dpr:devicePixelRatio,rect:[document.querySelector('canvas').getBoundingClientRect().width,document.querySelector('canvas').getBoundingClientRect().height]}));
     if(before.ready){
       await page.getByRole('button',{name:/CLOCK IN/i}).click();
       await page.waitForTimeout(400);
       await page.screenshot({path:path.join(out,name+'-I1.png')});
     }
     const after=await page.evaluate(()=>window.__nightShiftV3?.snapshot?.()??null);
     results.push({name,before,after,errors,bad});
     await ctx.close();
   }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));
 console.log(JSON.stringify(results.map(r=>({name:r.name,ready:r.before.ready,mode:r.after?.mode,card:r.after?.currentCardId,full:r.after?.fullCampaign,errors:r.errors,bad:r.bad,viewport:r.before.rect})),null,2));
 if(results.some(r=>r.errors.length||r.bad.length||!r.before.ready))process.exitCode=1;
})().catch(e=>{console.error(e);server.close();process.exitCode=1});