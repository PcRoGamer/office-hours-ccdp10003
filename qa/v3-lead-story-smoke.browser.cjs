'use strict';
const {chromium}=require('C:/Users/Admin/NightShiftV3-Lead-tools/node_modules/playwright-core');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..'),out=path.join(__dirname,'v3-lead-story-smoke-evidence');
fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{
 const name=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(!name.startsWith(root+path.sep)){res.writeHead(403);return res.end()}
 fs.readFile(name,(err,data)=>{if(err){res.writeHead(404);return res.end('404')}
 res.writeHead(200,{'Content-Type':{'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css'}[path.extname(name)]||'application/octet-stream'});res.end(data)})
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',timeout:12000});
 try{
  for(const [name,width,height] of [['desktop',1920,1080],['portrait',650,800]]){
   const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
   try{
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    await page.goto('http://127.0.0.1:'+server.address().port+'/night-shift-v3.html',{waitUntil:'domcontentloaded',timeout:10000});
    await page.evaluate(async()=>{
     const {createStoryExperience}=await import('./night-shift-v3/story/presentation.js');
     const host=document.createElement('div');host.id='story-test';host.className='ns-story visible';
     document.body.append(host);
     const story=createStoryExperience({host,reduceMotion:true,audio:{play(){}}});
     window.__storyResult={};
     story.showPromotion({index:1,run:{completedCardIds:['I1','I2','I3']},
      offers:['carbon-copy','bank-shot','mira-backup'],directive:'fast-or-safe',
      onPick:({perkId})=>window.__storyResult.picked=perkId,
      onContinue:({perkId})=>window.__storyResult.continued=perkId});
    });
    assert.equal(await page.locator('#story-test .ns-upgrade').count(),3);
    assert.equal(await page.locator('#story-test .ns-source a').count(),1);
    assert.equal(await page.locator('#story-test [data-demo]').count(),3);
    await page.locator('#story-test').screenshot({path:path.join(out,name+'-promotion.png')});
    await page.locator('#story-test [data-pick]').first().click({timeout:7000});
    await page.waitForFunction(()=>window.__storyResult.continued==='carbon-copy',{timeout:7000});
    assert.deepEqual(await page.evaluate(()=>window.__storyResult),{picked:'carbon-copy',continued:'carbon-copy'});
    assert.deepEqual(errors,[]);
    console.log('PASS '+name+' '+JSON.stringify({offers:3,researchLinks:1,realSelection:true,errors}));
   }finally{await context.close()}
  }
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exit(1)});
setTimeout(()=>{console.error('STORY test watchdog');process.exit(124)},45000).unref();
