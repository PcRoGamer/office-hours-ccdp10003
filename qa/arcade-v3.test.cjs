const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('fs');
fs.mkdirSync('qa-artifacts',{recursive:true});
const url=process.env.TEST_BASE_URL||'http://127.0.0.1:4173/arcade-v3.html';
const v=(x,y)=>[x*1.2,(y*1.45-215)*900/760];
(async()=>{
 const exe=fs.existsSync('/usr/bin/google-chrome')?'/usr/bin/google-chrome':fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined;
 const b=await chromium.launch({headless:true,...exe?{executablePath:exe}:{},args:['--no-sandbox','--disable-gpu-sandbox']});
 try{
  for(const [w,h] of [[1440,900],[1024,768],[650,800]]){
   const p=await b.newPage({viewport:{width:w,height:h}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
   p.setDefaultTimeout(15000);
   const res=await p.goto(url,{waitUntil:'domcontentloaded',timeout:45000});assert.equal(res.status(),200);
   await p.waitForFunction(()=>!!window.__officeArcade?.snapshot);await p.waitForTimeout(120);
   await p.screenshot({path:'qa-artifacts/title-'+w+'.png',animations:'disabled'});
   await p.mouse.click(w/2,h*600/760);
   const snap=()=>p.evaluate(()=>window.__officeArcade.snapshot());
   assert.equal((await snap()).screen,'play');
   if(w!==1440){assert.deepEqual(errors,[]);await p.close();continue}
   const click=(x,y)=>p.mouse.click(...v(x,y),{delay:10});
   const box=await p.locator('canvas').boundingBox();assert.equal(box.width,w);assert.equal(box.height,h);
   await p.screenshot({path:'qa-artifacts/fullbleed-play.png',animations:'disabled'});
   const source=await p.locator('script').last().textContent();
   const hud=source.slice(source.indexOf('function header(){'),source.indexOf('function playfield(){'));
   assert.equal((hud.match(/text\(/g)||[]).length,2,'Gameplay HUD must draw only hearts and time');
   assert.equal((hud.match(/panel\(/g)||[]).length,2,'Gameplay HUD must have only two compact panels');
   assert(!/state\.(score|combo|progress|phase|ward|perks|team|kpi)/.test(hud),'Run metrics must not appear in gameplay HUD');
   await p.mouse.click(1132*1.2,38*900/760);
   assert.equal((await snap()).screen,'pause','Clicking the clock should pause without adding a HUD button');
   await p.screenshot({path:'qa-artifacts/paused-with-run-stats.png',animations:'disabled'});
   const t=(await snap()).clock;await p.waitForTimeout(200);assert.equal((await snap()).clock,t);
   await p.keyboard.press('Escape');
   await p.waitForFunction(()=>window.__officeArcade.snapshot().ads.length>0,{timeout:18000});
   const first=(await snap()).ads[0];assert.equal(first.real,true);
   await p.screenshot({path:'qa-artifacts/helpful-popup.png',animations:'disabled'});
   await click(first.x+first.w/2,first.y+129);assert.equal((await snap()).adUsed,1);
   let clear=false;for(let i=0;i<850;i++){
    const s=await snap();if(s.screen==='draft'){clear=true;break}
    if(s.screen==='recover')throw Error('Round should be finishable using real clicks');
    if(s.ads.length){const a=s.ads[0];await click(a.real?a.x+a.w/2:a.x+a.w-22,a.real?a.y+129:a.y+18)}
    else{const e=s.entities.slice().reverse().find(e=>e.kind==='paper'&&e.good&&e.x>90&&e.x<1020&&e.y>270&&e.y<565);
     if(e)await click(e.x+47,e.y+53);else await p.waitForTimeout(45)}
   }
   assert(clear,'Stamp Rush did not reach upgrade draft');assert.equal((await snap()).offers.length,3);
   const summary=(await snap()).stats[0];
   assert(summary.points>0,'Round score should be retained for intermission');
   assert(summary.combo>0,'Peak combo should be retained for intermission');
   const draftCode=source.slice(source.indexOf('function draftScreen(){'),source.indexOf('function victoryScreen(){'));
   for(const token of ['round.points','round.combo','state.score.toLocaleString()','state.team.toFixed(1)','state.kpi.toFixed(1)','state.perks.length']){
     assert(draftCode.includes(token),'Intermission is missing '+token);
   }
   await p.screenshot({path:'qa-artifacts/draft.png',animations:'disabled'});
   await p.mouse.click(300,520);assert.equal((await snap()).phase,1);
   let dragged=false;for(let i=0;i<40;i++){
    const s=await snap(),f=s.entities.find(e=>e.kind==='file'&&e.x>350&&e.x<855&&e.y>270&&e.y<585);
    if(f){await p.mouse.move(...v(f.x+50,f.y+50));await p.mouse.down();
     await p.mouse.move(...v(f.teal?188:982,430),{steps:6});await p.mouse.up();
     if((await snap()).progress>0){dragged=true;break}
    }else await p.waitForTimeout(70);
   }
   assert(dragged,'Drag and drop does not align with fullscreen display');
   await p.screenshot({path:'qa-artifacts/file-frenzy.png',animations:'disabled'});
   assert.deepEqual(errors,[]);console.log('QUOTA_PANIC_V3_BROWSER_PASS',{fullbleed:true,viewportSizes:3,helpfulPopup:true,firstDraft:true,fileDrag:true,errors:0});
   await p.close();
  }
 }finally{await b.close()}
})().catch(e=>{console.error('V3_QA_FAIL',e.stack||e);process.exitCode=1});
