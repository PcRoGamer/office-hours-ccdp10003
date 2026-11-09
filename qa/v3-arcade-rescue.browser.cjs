'use strict';
const {chromium}=(()=>{try{return require('playwright')}catch{return require('C:/Users/Admin/NightShiftV3-Lead-tools/node_modules/playwright-core')}})();
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(__dirname,'v3-arcade-rescue-evidence');fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.png':'image/png'};
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 fs.readFile(file,(err,body)=>{if(err){res.writeHead(404);return res.end('404')}res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(body);});
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,...(process.platform==='win32'?{executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}:{})});
 const results=[];
 try{
  for(const [name,width,height,dpr] of [['desktop',1920,1080,1],['laptop',1366,768,1],['portrait',650,800,1],['mobile',390,760,1],['hidpi',1920,1080,2]]){
   const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,reducedMotion:'reduce'});
   const page=await context.newPage(),errors=[],broken=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)broken.push(r.url()+':'+r.status())});
   try{
    await page.goto('http://127.0.0.1:'+server.address().port+'/night-shift-v3.html',{waitUntil:'networkidle',timeout:15000});
    await page.evaluate(async()=>{
     const {createStoryExperience}=await import('./night-shift-v3/story/presentation.js');
     document.getElementById('mail').style.display='none';document.getElementById('mail').id='mail-original';
     const host=document.createElement('div');host.id='mail';host.className='visible';document.body.append(host);
     const show=createStoryExperience({host,audio:{play(){}},reduceMotion:true});
     window.__upgradeHarness={};
     show.showPromotion({index:1,run:{perkLevels:{}},offers:['carbon-copy','bank-shot','mira-backup'],directive:'fast-or-safe',
      onPick:({perkId})=>window.__upgradeHarness.picked=perkId,onContinue:({perkId})=>window.__upgradeHarness.continued=perkId});
    });
    await page.waitForTimeout(350);
    const metrics=await page.evaluate(()=>{
     const el=document.querySelector('.ns-quick-promote'),host=document.getElementById('mail');
     const r=el?.getBoundingClientRect(),cards=[...document.querySelectorAll('.ns-quick-card')].map(n=>n.getBoundingClientRect());
     const img=new Image();img.src='./night-shift-v3/art/hd-cast-atlas.png';
     return {viewport:{w:innerWidth,h:innerHeight},panel:{top:r?.top,bottom:r?.bottom,left:r?.left,right:r?.right},
      count:cards.length,cardHeight:cards.map(x=>Math.round(x.height)),
      hostScroll:host.scrollHeight-host.clientHeight,hostOverflow:getComputedStyle(host).overflowY,panelScroll:el.scrollHeight-el.clientHeight,
      missingButtons:cards.some(c=>c.height<42||c.top<0||c.bottom>innerHeight),
      research:document.querySelectorAll('.ns-quick-source-panel a').length,
      artSrc:img.src};
    });
    console.log(name+' LAYOUT '+JSON.stringify(metrics));
    assert.equal(metrics.count,3,name+' must show three big upgrade choices');
    assert.ok(metrics.cardHeight.every(h=>h>=65),name+' choices too small');
    assert.ok(metrics.panel.top>=-2&&metrics.panel.bottom<=height+2,name+' promotion clipped');
    assert.ok((metrics.hostScroll<=2||metrics.hostOverflow==='hidden')&&metrics.panelScroll<=2,name+' must not require scrolling');
    assert.equal(metrics.missingButtons,false,name+' clipped buttons');
    assert.ok(metrics.research>=3,'three optional game-research links');
    assert.equal(errors.length,0,name+' javascript errors');
    assert.equal(broken.length,0,name+' broken assets: '+broken);
    await page.screenshot({path:path.join(out,name+'-promotion.png')});
    await page.locator('[data-pick="carbon-copy"]').click();
    await page.waitForTimeout(850);
    const actual=await page.evaluate(()=>window.__upgradeHarness);
    assert.equal(actual.picked,'carbon-copy');
    assert.equal(actual.continued,'carbon-copy');
    results.push({name,pass:true,metrics,errors,broken});
    console.log('PASS '+name+' no-scroll promotion, 3 illustrated cards, selected upgrade');
   } finally{await context.close()}
  }
  console.log(JSON.stringify({pass:true,results},null,2));
 }finally{await browser.close();server.close()}
})().catch(err=>{console.error(err.stack||err);server.close();process.exitCode=1});
