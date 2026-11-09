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
 const [vw,vh]=(process.env.OFFICE_ATTACK_VIEWPORT||'1440x810').split('x').map(Number);
 const page=await browser.newPage({viewport:{width:vw,height:vh}});
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)bad.push(r.url()+':'+r.status())});
 const url=process.env.OFFICE_ATTACK_LIVE_URL||('http://127.0.0.1:'+server.address().port+'/night-shift-office-attack.html?seed=1942');
 let handled=0;
 const bossRetries=process.env.OFFICE_ATTACK_BOSS_RETRY==='1';
 const autoBreak=process.env.OFFICE_ATTACK_AUTO_INTERMISSION==='1';
 const autoResearch=process.env.OFFICE_ATTACK_AUTO_RESEARCH==='1';
 try{
  await page.goto(url,{waitUntil:'networkidle'});
  if(autoBreak){
   await page.locator('#marathon-title').click();
   assert.equal(await page.locator('#marathon-title').getAttribute('aria-pressed'),'true');
   assert.equal((await page.evaluate(()=>window.__officeAttackQA.snapshot())).marathonMode,true);
   console.log('PASS Marathon mode explicitly enabled before CLOCK IN');
  }else{
   assert.equal(await page.locator('#marathon-title').getAttribute('aria-pressed'),'false','autoplay must be opt-in');
  }
  await page.locator('#play').click();
  const box=await page.locator('#stage').boundingBox(),scale=Math.min(box.width/960,box.height/540);
  const ox=box.x+(box.width-960*scale)/2,oy=box.y+(box.height-540*scale)/2;
  const mouse=async(x,y)=>page.mouse.move(ox+x*scale,oy+y*scale);
  const click=async(x,y)=>{await mouse(x,y);await page.mouse.down();await page.mouse.up()};
  const snap=()=>page.evaluate(()=>window.__officeAttackQA.snapshot());
  async function active(i){
    await page.bringToFront();
    try{await page.waitForFunction(i=>{const s=window.__officeAttackQA.snapshot();return s.mode==='active'&&s.index===i},i,{timeout:10500,polling:100});}catch(e){console.error('ACTIVE_TIMEOUT',i,await snap(),{errors,bad});await page.waitForTimeout(450);console.error('AFTER_WAIT',await snap(),{errors,bad});throw e;}
    return await snap()
  }
  for(let round=0;round<26;round++){
   const s=await active(round);
   if(bossRetries&&round===8){
     await click(480,428); // deliberately early: the bar has not reached green
     await page.waitForFunction(()=>window.__officeAttackQA.snapshot().bossMistakes===1,{timeout:1100});
     assert.equal((await snap()).lives,3,'first timing mistake should warn without taking a heart');
     await page.waitForFunction(()=>window.__officeAttackQA.snapshot().bossCooldown<=0,{timeout:1200});
     await click(480,428); // second miss must lose exactly one heart
     await page.waitForFunction(()=>{const x=window.__officeAttackQA.snapshot();return x.mode==='result'&&!x.history.at(-1)?.success&&x.id==='boss-printer'},{timeout:1800});
     const bad=await snap();assert.equal(bad.lives,2);assert.equal(bad.index,6);assert.equal(bad.score,6);
     await active(6);assert.equal((await snap()).bossHits,0,'boss retry must clear previous partial counter');
     console.log('PASS genuine failed printer timing costs one heart, same boss retries');
   }
   if(bossRetries&&round===25){
     // Do nothing and let the incoming red memo hit the worker.
     await page.waitForFunction(()=>{const x=window.__officeAttackQA.snapshot();return x.mode==='result'&&!x.history.at(-1)?.success&&x.id==='boss-manager'},{timeout:7000});
     const bad=await snap();assert.equal(bad.lives,1);assert.equal(bad.index,19);assert.equal(bad.bossWins,1);
     await active(19);assert.equal((await snap()).bossHits,0);
     console.log('PASS real manager attack expiration costs heart and forces same boss retry');
   }
   if(round<30)await page.screenshot({path:path.join(out,'micro-'+s.id+'-level1.png')});
   console.log('ROUND',round+1,s.id,'level',s.level,'timer',s.remaining.toFixed(2));
   if(s.id==='stamp'){
     for(const f of s.forms.filter(x=>x.ok)){await click(f.x,f.y);await sleep(45)}
   }else if(s.id==='shred'){
     for(let n=0;n<s.required;n++){
       const stage=await snap();const d=stage.docs.find(x=>!x.ok&&!x.shredded);
       assert.ok(d,'shredder must have a real remaining junk document');
       await mouse(d.x,d.y);await page.mouse.down();
       await mouse(560,340);await mouse(750,333);await page.mouse.up();
       await page.waitForFunction(n=>window.__officeAttackQA.snapshot().shredded>n,n,{timeout:1800});
     }
   }else if(s.id==='fix'){
     for(const l of s.leaks){await click(l.x,l.y);await sleep(36)}
   }else if(s.id==='catch'){
     for(let t=0;t<25;t++){
       const x=await snap();if(x.mode!=='active'||x.index!==round)break;
       await mouse(x.workerX,462);await sleep(40)
     }
   }else if(s.id==='timing'){
     await page.waitForFunction(()=>{const s=window.__officeAttackQA.snapshot();return s.mode==='active'&&Math.abs(s.needle-480)<s.zone*.55},{timeout:2900});
     await click(480,450);
   }else if(s.id==='plug'){
     const port=s.plugPorts[s.plugTarget];
     await mouse(s.plugX,s.plugY);await page.mouse.down();
     await mouse(480,348);await mouse(port.x,port.y);await page.mouse.up();
   }else if(s.id==='clean'){
     await mouse(344,320);await page.mouse.down();
     await mouse(425,330);await mouse(520,315);await mouse(620,333);
     await page.mouse.up();
   }else if(s.id==='sort'){
     for(const kind of ['paper','peel']){
       const b=await snap();const item=b.sortItems.find(x=>x.kind===kind);
       const bin=b.sortBins.find(x=>x.kind===kind);
       await mouse(item.x,item.y);await page.mouse.down();
       await mouse((item.x+bin.x)/2,(item.y+bin.y)/2);
       await mouse(bin.x,bin.y);await page.mouse.up();
       await sleep(50);
     }
   }else if(s.id==='shut'){
     for(let hit=0;hit<s.shutTotal;hit++){
       const b=await snap();await click(b.popup.x+94,b.popup.y-55);
       await sleep(50);
     }
   }else if(s.id==='boss-printer'){
     await page.screenshot({path:path.join(out,'boss-printer.png')});
     for(let hit=0;hit<3;hit++){
       await page.waitForFunction(n=>{const b=window.__officeAttackQA.snapshot();return b.mode==='active'&&b.id==='boss-printer'&&b.bossHits===n&&b.bossCooldown<=0&&Math.abs(b.bossNeedle-480)<b.bossZone*.25},hit,{timeout:5200,polling:30});
       await click(480,428);
       try{await page.waitForFunction(n=>window.__officeAttackQA.snapshot().bossHits>=n+1,hit,{timeout:1300});}
       catch(e){console.error('BOSS_PRINTER_MISS',hit,JSON.stringify(await snap()));throw e}
     }
   }else if(s.id==='boss-manager'){
     await page.screenshot({path:path.join(out,'boss-manager.png')});
     for(let hit=0;hit<3;hit++){
       await page.waitForFunction(n=>{const b=window.__officeAttackQA.snapshot();return b.id==='boss-manager'&&b.mode==='active'&&b.bossHits===n&&b.bossPhase==='memos'&&b.bossCooldown<=0},hit,{timeout:3000});
       const b=await snap();await click(b.bossPop.x,b.bossPop.y);
       await page.waitForFunction(n=>window.__officeAttackQA.snapshot().bossHits>=n+1,hit,{timeout:1400});
     }
     await page.waitForFunction(()=>{const b=window.__officeAttackQA.snapshot();return b.mode==='active'&&b.bossPhase==='stamp'&&b.bossCooldown<=0},{timeout:2400});
     await click(480,365);
   }else if(s.id==='dodge'){
     for(let t=0;t<90;t++){
       const x=await snap();if(x.mode!=='active'||x.index!==round)break;
       const danger=[...x.hazards.filter(h=>h.y>160&&h.y<480),...x.warnings];
       const threatened=danger.some(h=>Math.abs(h.x-x.playerX)<165);
       if(threatened){
         const choices=[115,255,405,555,705,845];
         const clear=choices.filter(lane=>danger.every(h=>Math.abs(h.x-lane)>=120));
         let safest;
         if(clear.length){clear.sort((a,b)=>Math.abs(a-x.playerX)-Math.abs(b-x.playerX));safest=clear[0]}
         else {choices.sort((a,b)=>Math.min(...danger.map(h=>Math.abs(b-h.x)))-Math.min(...danger.map(h=>Math.abs(a-h.x))));safest=choices[0]}
         await mouse(safest,410);
       }
       await sleep(30)
     }
   }
   try{await page.waitForFunction(n=>{const s=window.__officeAttackQA.snapshot();return s.history.filter(h=>h.success).length>n},round,{timeout:5500});}
   catch(e){console.error('ROUND_FAILURE',round,s.id,JSON.stringify(await snap()),'ERRORS',errors);await page.screenshot({path:path.join(out,'FAIL-'+round+'-'+s.id+'.png')});throw e}
   const after=await snap();
   if(!after.history.at(-1).success){console.error('FAIL_CONTEXT',JSON.stringify({round,id:s.id,after,previous:s}));await page.screenshot({path:path.join(out,'FAIL-'+round+'-'+s.id+'.png')});}
   assert.equal(after.history.at(-1).success,true,'round '+(round+1)+' '+s.id+' should be won with real pointer');
   handled++;
   if(round===7||round===16){
     await page.waitForFunction(()=>window.__officeAttackQA.snapshot().mode==='intermission',{timeout:2900});
     const stage=await snap();
     assert.ok(stage.interDuration>=3&&stage.interDuration<=5,'intermission must last 3-5 seconds');
     assert.match(await page.locator('#inter-score').innerText(),/POINTS/);
     assert.match(await page.locator('#inter-lives').innerText(),/♥/);
     if(!(autoBreak&&autoResearch&&round===7))await page.screenshot({path:path.join(out,'intermission-'+(round===7?1:2)+'.png')});
     if(autoBreak&&autoResearch&&round===7){
       const before=await snap();
       assert.ok(before.interTime>0,'must open research during celebration');
       await page.locator('#inter-research-open').click();
       assert.equal((await snap()).researchOpen,true);
       const frozen=(await snap()).interTime;
       await page.waitForTimeout(5200);
       const waiting=await snap();
       assert.equal(waiting.mode,'intermission','Marathon must never advance while someone is reading');
       assert.ok(Math.abs(waiting.interTime-frozen)<.08,'research freezes the timer');
       assert.equal(waiting.index,round+1);
       await page.locator('[data-research-tab="attention"]').click();
       assert.equal((await snap()).researchTopic,'attention');
       assert.equal(await page.locator('.research-topic:not([hidden]) a[href*="IfgSsgpjAnQ"]').count(),1);
       await page.locator('#research-back').click();
       await page.waitForFunction(()=>window.__officeAttackQA.snapshot().interReady,{timeout:5500});
       await page.waitForTimeout(1400);
       assert.equal((await snap()).mode,'intermission','research holds the remainder of this break');
       assert.equal((await snap()).marathonMode,true,'marathon stays selected for later breaks');
       await page.locator('#inter-continue').click();
       await page.waitForFunction(i=>{const x=window.__officeAttackQA.snapshot();return x.mode==='active'&&x.index===i},round+1,{timeout:1400});
       console.log('PASS researching during Marathon blocks auto-advance until Continue');
     }else if(autoBreak){
       const started=Date.now();
       try{await page.waitForFunction(i=>{const x=window.__officeAttackQA.snapshot();return x.mode==='active'&&x.index===i},round+1,{timeout:6500});}
       catch(e){console.error('AUTO_BREAK_TIMEOUT',JSON.stringify(await snap()),'UI',await page.evaluate(()=>({hidden:document.getElementById('inter-research').classList.contains('hidden'),ready:document.getElementById('inter-continue').disabled,interDisplay:getComputedStyle(document.getElementById('intermission')).display})));throw e}
       const elapsed=(Date.now()-started)/1000;
       assert.ok(elapsed>0&&elapsed<5.6,'unopened break should automatically continue promptly; screenshot may have used part of the intermission, observed '+elapsed);
       console.log('PASS automatically advances short intermission after',elapsed.toFixed(2),'seconds');
     }else{
     await page.waitForFunction(()=>window.__officeAttackQA.snapshot().interReady,{timeout:5100});
     assert.equal(await page.locator('#inter-marathon').getAttribute('aria-pressed'),'false');
     await page.locator('#inter-marathon').click();
     assert.equal(await page.locator('#inter-marathon').getAttribute('aria-pressed'),'true','can enable Marathon during a break');
     await page.locator('#inter-marathon').click();
     assert.equal(await page.locator('#inter-marathon').getAttribute('aria-pressed'),'false','can return to relaxed break');
     await page.locator('#inter-research-open').click();
     await page.waitForFunction(()=>window.__officeAttackQA.snapshot().researchOpen,{timeout:1300});
     await page.waitForTimeout(620);
     const held=await snap();
     assert.equal(held.mode,'intermission','opening optional research must hold the break');
     assert.equal(held.index,round+1,'reading/rest must not consume a round');
     assert.equal(held.interTime,0);
     assert.ok(!await page.locator('#inter-continue').isDisabled());
     assert.equal(await page.locator('.research-topic:not([hidden])').count(),1);
     assert.match(await page.locator('.research-topic:not([hidden]) h4').innerText(),/ONE COMMAND/);
     await page.locator('[data-research-tab="portable"]').click();
     assert.equal((await snap()).researchTopic,'portable');
     assert.match(await page.locator('.research-topic:not([hidden])').innerText(),/Keogh/);
     await page.locator('[data-research-tab="attention"]').click();
     assert.equal((await snap()).researchTopic,'attention');
     assert.match(await page.locator('.research-topic:not([hidden])').innerText(),/does.*not.*establish causation/i);
     assert.ok((await page.locator('.research-topic:not([hidden]) a[href^="https://"]').count())>=2);
     const layout=await page.evaluate(()=>{
       const shell=document.querySelector('.research-shell'),body=document.querySelector('.research-body');
       const r=shell.getBoundingClientRect(),br=body.getBoundingClientRect();
       const article=body.querySelector('.research-topic:not([hidden])');
       const source=article.querySelector('.research-sources').getBoundingClientRect();
       const eyebrow=article.querySelector('.research-eyebrow').getBoundingClientRect();
       return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,
         shellOverflow:shell.scrollHeight-shell.clientHeight,bodyOverflow:body.scrollHeight-body.clientHeight,
         researchTextClipped:source.bottom>br.bottom+2||eyebrow.top<br.top-2,
         width:innerWidth,height:innerHeight};
     });
     assert.ok(layout.left>=0&&layout.right<=layout.width+1&&layout.top>=0&&layout.bottom<=layout.height+1,'research panel must fit viewport');
     assert.ok(layout.bodyOverflow<=2,'research panel must not require mandatory scrolling');
     assert.equal(layout.researchTextClipped,false,'visible research/citations must fit inside the page');
     await page.screenshot({path:path.join(out,'research-'+(round===7?1:2)+'.png')});
     if(round===7){
       await page.keyboard.press('Escape');
       assert.equal((await snap()).researchOpen,false);
       assert.equal((await snap()).mode,'intermission');
       await page.locator('#inter-research-open').click();
       await page.locator('#research-back').click();
     }else{
       await page.locator('#research-back').click();
     }
     assert.equal((await snap()).mode,'intermission');
     if(bossRetries&&round===7){
       await page.keyboard.press('Escape');
       await page.waitForFunction(()=>window.__officeAttackQA.snapshot().mode==='pause',{timeout:1100});
       const frozen=(await snap()).interTime;await sleep(650);
       assert.ok(Math.abs((await snap()).interTime-frozen)<.035,'paused intermission countdown must freeze');
       await page.locator('#resume').click();
       await page.waitForFunction(()=>window.__officeAttackQA.snapshot().mode==='intermission',{timeout:1100});
       console.log('PASS intermission pauses and resumes without skipping celebration');
     }
     await page.locator('#inter-continue').click();
     await page.waitForFunction(i=>{const s=window.__officeAttackQA.snapshot();return s.mode==='active'&&s.index===i},round+1,{timeout:1200});
     }
   }

  }
  await page.waitForFunction(()=>window.__officeAttackQA.snapshot().mode==='end',{timeout:4000});
  const final=await snap();
  assert.equal(final.score,26);assert.equal(final.lives,bossRetries?1:3);assert.equal(final.bossWins,2);
  assert.equal(final.history.length,bossRetries?28:26);
  assert.equal(final.history.filter(x=>!x.success).length,bossRetries?2:0);
  assert.deepEqual(new Set(final.history.map(x=>x.id)),new Set(['stamp','catch','shred','fix','timing','dodge','plug','clean','sort','shut','boss-printer','boss-manager']));
  assert.equal(final.grade,bossRetries?'B':'S');
  assert.equal(await page.locator('#end-title').innerText(),'SHIFT CONQUERED!');
  await page.waitForTimeout(900); // inspect settled slam animation, not an intended overshoot frame
  const bounds=await page.evaluate(()=>{
    const title=document.getElementById('end-title').getBoundingClientRect();
    const card=document.querySelector('.ending .end-scorecard').getBoundingClientRect();
    const button=document.getElementById('again').getBoundingClientRect();
    return {title:{left:title.left,right:title.right,top:title.top,bottom:title.bottom},
      card:{top:card.top,bottom:card.bottom},button:{top:button.top,bottom:button.bottom},
      height:innerHeight,width:innerWidth};
  });
  console.log('END_LAYOUT',JSON.stringify(bounds));
  await page.screenshot({path:path.join(out,'end-layout-check.png')});
  assert.ok(bounds.title.top>=-2&&bounds.title.bottom<bounds.card.top+5,'end headline and scorecard must not overlap');
  assert.ok(bounds.button.bottom<=bounds.height+2,'end replay button must fit viewport');
  assert.ok(bounds.title.left>=-2&&bounds.title.right<=bounds.width+2,'end headline must fit viewport');
  console.log('END_LAYOUT',JSON.stringify(bounds));
  assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);
  await page.screenshot({path:path.join(out,'micro-final.png')});
  console.log('PASS',JSON.stringify({score:final.score,lives:final.lives,rounds:handled,history:final.history,errors,bad}));
  await page.locator('#again').click();
  await page.waitForFunction(()=>{const x=window.__officeAttackQA.snapshot();return x.mode==='active'&&x.index===0},{timeout:2000});
  const replay=await snap();
  assert.equal(replay.score,0);assert.equal(replay.lives,3);assert.equal(replay.bossWins,0);assert.equal(replay.history.length,0);
  assert.equal(await page.locator('#intermission').evaluate(n=>getComputedStyle(n).display),'none');
  console.log('PASS full victory replay resets two bosses, score, lives and intermission');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error('FAIL',e.stack||e);server.close();process.exitCode=1});
