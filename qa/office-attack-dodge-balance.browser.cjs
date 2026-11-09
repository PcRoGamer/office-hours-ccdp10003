'use strict';
const {chromium}=(()=>{try{return require('playwright')}catch{return require('C:/Users/Admin/NightShiftV3-Lead-tools/node_modules/playwright-core')}})();
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const mime={'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png'};
const server=http.createServer((req,res)=>{
 const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(!p.startsWith(root+path.sep)){res.writeHead(403);return res.end()}
 fs.readFile(p,(e,b)=>{res.writeHead(e?404:200,{'content-type':mime[path.extname(p)]||'application/octet-stream'});res.end(e?'404':b)})
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,...(process.platform==='win32'?{executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}:{})});
 try{
  const page=await browser.newPage();
  await page.goto('http://127.0.0.1:'+server.address().port+'/night-shift-office-attack.html',{waitUntil:'domcontentloaded'});
  const results=await page.evaluate(async()=>{
   const {GAMES}=await import('./office-attack/games.js');
   const dodge=GAMES.find(x=>x.id==='dodge');
   const trials={};
   const randSeed=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
   for(let lv=1;lv<=3;lv++){
    trials[lv]={};
    for(const driver of ['idle','reactive']){
     let won=0,failed=0;
     for(let seed=1;seed<=256;seed++){
      const g={level:lv,t:0},r=randSeed(seed),a={rand:r,win:()=>won++,lose:()=>failed++};
      dodge.enter(g,a);
      let target=480,decision=0,done=false;
      for(let k=0;k<400;k++){
       const dt=1/60;g.t+=dt;
       if(driver==='reactive'){
        decision-=dt;
        if(decision<=0){
         decision=.27;
         const danger=[...g.warnings,...g.hazards.filter(h=>h.y<500&&h.y>150)];
         if(danger.length){
          const imminent=danger.some(h=>Math.abs(h.x-g.playerX)<122);
          if(imminent){
           const lanes=[115,255,405,555,705,845];
           const clear=lanes.filter(x=>danger.every(h=>Math.abs(h.x-x)>=121));
           if(clear.length){clear.sort((a,b)=>Math.abs(a-g.playerX)-Math.abs(b-g.playerX));target=clear[0]}
           else{lanes.sort((a,b)=>Math.min(...danger.map(h=>Math.abs(b-h.x)))-Math.min(...danger.map(h=>Math.abs(a-h.x))));target=lanes[0]}
          }
         }
        }
        g.playerX+=Math.max(-15,Math.min(15,target-g.playerX));
       }
       const beforeWon=won,beforeFailed=failed;
       dodge.update(g,dt,a);
       if(won>beforeWon||failed>beforeFailed){done=true;break}
      }
      if(!done)throw Error('Unresolved simulation seed '+seed+' level '+lv);
     }
     trials[lv][driver]={won,failed,passRate:+(won/256).toFixed(3)};
    }
   }
   return trials;
  });
  console.log(JSON.stringify(results,null,2));
  for(const [lv,v] of Object.entries(results)){
   assert.ok(v.reactive.passRate>.8,'DODGE lv '+lv+' not fair even with reacted pointer');
   assert.ok(v.idle.passRate<.5,'DODGE lv '+lv+' auto-wins too frequently without moving');
  }
  console.log('PASS: 768 deterministic idle and 768 reactive DODGE simulations');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e.stack||e);server.close();process.exitCode=1});
