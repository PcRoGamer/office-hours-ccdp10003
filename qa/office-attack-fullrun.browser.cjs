'use strict';
const {chromium}=(()=>{try{return require('playwright')}catch{return require('C:/Users/Admin/NightShiftV3-Lead-tools/node_modules/playwright-core')}})();
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(process.env.OFFICE_ATTACK_SITE_ROOT||path.join(__dirname,'..')),out=path.join(__dirname,'office-attack-evidence');
fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.avif':'image/avif'};
const server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://x').pathname));
 if(!p.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 fs.readFile(p,(e,b)=>{if(e){res.writeHead(404);return res.end('404')}res.writeHead(200,{'content-type':mime[path.extname(p)]||'application/octet-stream'});res.end(b)})});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,...(process.platform==='win32'?{executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}:{})});
 const errors=[],bad=[];
 const page=await browser.newPage({viewport:{width:1440,height:810}});
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)bad.push(r.url()+':'+r.status())});
 const url='http://127.0.0.1:'+server.address().port+'/night-shift-office-attack.html?seed=1942';
 let handled=0;
 try{
  await page.goto(url,{waitUntil:'networkidle'});
  await page.locator('#play').click();
  const box=await page.locator('#stage').boundingBox(),scale=Math.min(box.width/960,box.height/540);
  const ox=box.x+(box.width-960*scale)/2,oy=box.y+(box.height-540*scale)/2;
  const mouse=async(x,y)=>page.mouse.move(ox+x*scale,oy+y*scale);
  const click=async(x,y)=>{await mouse(x,y);await page.mouse.down();await page.mouse.up()};
  const snap=()=>page.evaluate(()=>window.__officeAttackQA.snapshot());
  async function active(i){
    await page.bringToFront();
    try{await page.waitForFunction(i=>{const s=window.__officeAttackQA.snapshot();return s.mode==='active'&&s.index===i},i,{timeout:6000,polling:100});}catch(e){console.error('ACTIVE_TIMEOUT',i,await snap(),{errors,bad});await page.waitForTimeout(450);console.error('AFTER_WAIT',await snap(),{errors,bad});throw e;}
    return await snap()
  }
  for(let round=0;round<18;round++){
   const s=await active(round);
   if(round<6)await page.screenshot({path:path.join(out,'micro-'+s.id+'-level1.png')});
   console.log('ROUND',round+1,s.id,'level',s.level,'timer',s.remaining.toFixed(2));
   if(s.id==='stamp'){
     const f=s.forms.find(x=>x.ok);await click(f.x,f.y);
   }else if(s.id==='shred'){
     const d=s.docs.find(x=>x.id==='junk');await mouse(d.x,d.y);await page.mouse.down();
     await mouse(560,340);await mouse(750,333);await page.mouse.up();
   }else if(s.id==='patch'){
     for(const l of s.leaks){await click(l.x,l.y);await sleep(36)}
   }else if(s.id==='catch'){
     for(let t=0;t<25;t++){
       const x=await snap();if(x.mode!=='active'||x.index!==round)break;
       await mouse(x.workerX,462);await sleep(40)
     }
   }else if(s.id==='timing'){
     await page.waitForFunction(()=>{const s=window.__officeAttackQA.snapshot();return s.mode==='active'&&Math.abs(s.needle-480)<s.zone*.55},{timeout:2900});
     await click(480,450);
   }else if(s.id==='dodge'){
     for(let t=0;t<90;t++){
       const x=await snap();if(x.mode!=='active'||x.index!==round)break;
       const danger=x.hazards.filter(h=>h.y>205&&h.y<475);
       const threatened=danger.some(h=>Math.abs(h.x-x.playerX)<122&&h.y>230);
       if(threatened){
         const choices=[90,225,735,870];
         const safest=choices.sort((a,b)=>Math.min(...danger.map(h=>Math.abs(b-h.x)))-Math.min(...danger.map(h=>Math.abs(a-h.x))))[0];
         await mouse(safest,410);
       }
       await sleep(30)
     }
   }
   await page.waitForFunction(n=>{const s=window.__officeAttackQA.snapshot();return s.history.length>n},round,{timeout:5500});
   const after=await snap();
   if(!after.history[round].success){console.error('FAIL_CONTEXT',JSON.stringify({round,id:s.id,after,previous:s}));await page.screenshot({path:path.join(out,'FAIL-'+round+'-'+s.id+'.png')});}
   assert.equal(after.history[round].success,true,'round '+(round+1)+' '+s.id+' should be won with real pointer');
   handled++;

  }
  await page.waitForFunction(()=>window.__officeAttackQA.snapshot().mode==='end',{timeout:4000});
  const final=await snap();
  assert.equal(final.score,18);assert.equal(final.lives,3);
  assert.equal(final.history.length,18);assert.deepEqual(new Set(final.history.map(x=>x.id)),new Set(['stamp','catch','shred','patch','timing','dodge']));
  assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);
  await page.screenshot({path:path.join(out,'micro-final.png')});
  console.log('PASS',JSON.stringify({score:final.score,lives:final.lives,rounds:handled,history:final.history,errors,bad}));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error('FAIL',e.stack||e);server.close();process.exitCode=1});
