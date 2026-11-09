// Independent browser capture and startup/gesture audit for the LEAD route.
// Requires playwright-core installed externally: set PLAYWRIGHT_CORE or use the documented Windows tools path.
// Does not claim human playtest or complete 16-card coverage.
const { chromium } = require(process.env.PLAYWRIGHT_CORE ||
  'C:/Users/Admin/NightShiftV3-Lead-tools/node_modules/playwright-core');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'qa', 'v3-lead-evidence');
fs.mkdirSync(out, { recursive: true });
const types = {'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8','.css':'text/css','.png':'image/png','.json':'application/json'};
const server = http.createServer((req,res)=>{
 const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const target = path.resolve(root,'.'+pathname);
 if(!(target===root || target.startsWith(root+path.sep))) {res.writeHead(403);res.end();return;}
 fs.readFile(target,(e,b)=>{if(e){res.writeHead(404);res.end(String(e));return;}
   res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'});res.end(b);});
});
(async()=>{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const port=server.address().port, browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--disable-gpu-sandbox']});
 const results=[];
 try {
   const cases=[
    {name:'hd-1080',route:'arcade-office-hd.html',width:1920,height:1080,dpr:1,interact:true},
    {name:'v3-1080',route:'night-shift-v3.html',width:1920,height:1080,dpr:1,interact:true},
    {name:'v3-1440',route:'night-shift-v3.html',width:2560,height:1440,dpr:1,interact:false},
    {name:'v3-4k',route:'night-shift-v3.html',width:1920,height:1080,dpr:2,interact:false},
    {name:'v3-ultrawide',route:'night-shift-v3.html',width:3440,height:1440,dpr:1,interact:false},
    {name:'v3-portrait',route:'night-shift-v3.html',width:650,height:800,dpr:1,interact:true}
   ];
   for(const config of cases) {
     if(!fs.existsSync(path.join(root,config.route))){continue;}
     const context=await browser.newContext({viewport:{width:config.width,height:config.height},deviceScaleFactor:config.dpr, reducedMotion:'reduce'});
     const page=await context.newPage(), errors=[], bad=[];
     page.on('pageerror',e=>errors.push(String(e)));
     page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
     page.on('response',r=>{if(r.status()>=400)bad.push(r.status()+':'+r.url())});
     const url='http://127.0.0.1:'+port+'/'+config.route;
     await page.goto(url,{waitUntil:'load'});await page.waitForTimeout(950);
     await page.screenshot({path:path.join(out,config.name+'-title.png'),fullPage:true});
     const metric=await page.evaluate(()=>({viewport:[innerWidth,innerHeight],canvas:(()=>{const c=document.querySelector('canvas');const r=c.getBoundingClientRect();return {rect:[r.x,r.y,r.width,r.height],backing:[c.width,c.height]}})(),v3:window.__nightShiftV3?.snapshot?.(), hd:window.__officeArcade?.snapshot?.()}));
     if(config.interact){
       const started=await page.getByRole('button',{name:/CLOCK IN/i}).count();
       if(started){await page.getByRole('button',{name:/CLOCK IN/i}).click();}
       else await page.mouse.click(config.width*.19,config.height*.85);
       await page.waitForTimeout(250);
       await page.screenshot({path:path.join(out,config.name+'-card.png')});
       if(started){
         // Pause freezes the single active timer.
         await page.keyboard.press('Escape');
         const beforePause=await page.evaluate(()=>window.__nightShiftV3.snapshot().clock);
         await page.waitForTimeout(300);
         const afterPause=await page.evaluate(()=>window.__nightShiftV3.snapshot().clock);
         if(Math.abs(beforePause-afterPause)>.02)throw Error('Timer advanced on pause');
         await page.keyboard.press('Escape');
         for(let wave=0;wave<2;wave++){
           const points=await page.evaluate(()=>window.__nightShiftV3.snapshot().targets);
           if(points.filter(p=>p.kind==='good').length!==2)throw Error('Expected 2 live green targets wave '+wave);
           for(const pt of points.filter(p=>p.kind==='good')){
             await page.mouse.click(pt.x,pt.y);await page.waitForTimeout(115);
           }
           await page.waitForTimeout(115);
         }
         await page.waitForTimeout(980);
         const promo=await page.evaluate(()=>window.__nightShiftV3.snapshot());
         if(promo.mode!=='promotion'||promo.evidence.filter(e=>e.outcome==='cleared').length!==1){
           throw Error('First card did not transition to a single verified promotion: '+JSON.stringify(promo));
         }
         await page.screenshot({path:path.join(out,config.name+'-promotion.png')});
         const count=await page.locator('button.offer').count();
         if(count!==3)throw Error('Expected three selectable real perk offers, found '+count);
         await page.getByRole('button',{name:/Choose CARBON COPY/i}).click();
         const ending=await page.evaluate(()=>window.__nightShiftV3.snapshot());
         if(ending.mode!=='preview-end'||ending.selectedPerk!=='carbon-copy')throw Error('Promotion selection failed');
         await page.screenshot({path:path.join(out,config.name+'-after-input.png')});
         if(config.name==='v3-1080'){
           await page.keyboard.press('Enter');await page.waitForTimeout(80);
           for(let i=0;i<3;i++){
             const bad=await page.evaluate(()=>window.__nightShiftV3.snapshot().targets.find(p=>p.kind==='spam'));
             if(!bad)throw Error('Missing scam decoy for negative input test');
             await page.mouse.click(bad.x,bad.y);await page.waitForTimeout(720);
           }
           if((await page.evaluate(()=>window.__nightShiftV3.snapshot().mode))!=='recover')throw Error('Wrong clicks did not reach recovery state');
           await page.screenshot({path:path.join(out,config.name+'-recover.png')});
           await page.mouse.click(config.width/2,config.height/2);await page.waitForTimeout(90);
           if((await page.evaluate(()=>window.__nightShiftV3.snapshot().mode))!=='card')throw Error('Touch/mouse retry failed');
           await page.keyboard.press('m');
           if((await page.locator('#sound').textContent())!=='SOUND OFF')throw Error('Mute keyboard toggle failed');
           await page.keyboard.press('m');
           if((await page.locator('#sound').textContent())!=='SOUND ON')throw Error('Unmute keyboard toggle failed');
         }
       }
     }
     if(config.route==='night-shift-v3.html'&&errors.length)throw Error(config.name+' browser exceptions: '+errors.join('; '));
     results.push({name:config.name,url,errors,bad,metric,after:await page.evaluate(()=>window.__nightShiftV3?.snapshot?.())});
     await context.close();
   }
 } finally {await browser.close(); await new Promise(ok=>server.close(ok))}
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));
 console.log(JSON.stringify(results,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});