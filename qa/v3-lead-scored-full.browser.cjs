const { chromium } = require('C:/Users/Admin/NightShiftV3-Lead-tools/node_modules/playwright-core');
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(__dirname,'v3-lead-scored-full-evidence');fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html;charset=utf-8','.js':'application/javascript;charset=utf-8','.mjs':'application/javascript;charset=utf-8','.css':'text/css;charset=utf-8'};
const server=http.createServer((req,res)=>{const target=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}fs.readFile(target,(err,buf)=>{if(err){res.writeHead(404);res.end('404');return;}res.writeHead(200,{'content-type':mime[path.extname(target)]||'application/octet-stream'});res.end(buf)})});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--disable-gpu-sandbox']});
 const context=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1,reducedMotion:'reduce'});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 const snap=()=>page.evaluate(()=>window.__nightShiftV3.snapshot());
 const clickWorld=async(x,y)=>{const s=await snap(),scale=s.viewport.cssHeight/s.viewport.worldHeight;await page.mouse.click(x*scale,y*scale,{delay:35})};
 const dragWorld=async(x,y,X,Y)=>{const s=await snap(),scale=s.viewport.cssHeight/s.viewport.worldHeight;await page.mouse.move(x*scale,y*scale);await page.mouse.down();await page.mouse.move(X*scale,Y*scale,{steps:12});await page.mouse.up()};
 const eventual=async(fn,timeout=25000)=>{const end=Date.now()+timeout;while(Date.now()<end){const s=await snap();if(await fn(s))return s;await page.waitForTimeout(90)}throw Error('timed out: '+JSON.stringify((await snap()).sceneState)?.slice(0,450))};
 let stamped=0,shredded=0,closed=0;
 try {
   await page.goto('http://127.0.0.1:'+server.address().port+'/night-shift-v3.html',{waitUntil:'domcontentloaded',timeout:15000});
   await page.getByRole('button',{name:/CLOCK IN/i}).click();
   assert.equal((await snap()).currentCardId,'I1');
   const first=await snap();assert.equal(first.fullCampaign,true);assert.equal(first.deck.length,12);
   // Live conveyor tracking: NEVER retire a form before a confirmed hit.
   const until=Date.now()+26000;
   while(Date.now()<until){
     const state=await snap();
     if(state.currentCardId==='I2')break;
     assert.equal(state.currentCardId,'I1','I1 failed or expired '+JSON.stringify({mode:state.mode,issue:state.scoreIssue,elapsed:state.elapsed,stamped}));
     const form=state.sceneState?.forms?.find(f=>f.kind==='approved'&&!f.hit&&f.x>270&&f.x<965);
     if(form){
       const before=state.sceneState.progress;
       const i=Number(form.id.slice('form-'.length));
       await clickWorld(form.x+65,331+(i%2)*115+55);
       const after=await snap();
       if(after.sceneState?.progress>before){
         stamped++;
         if(stamped===2)await page.screenshot({path:path.join(out,'1080p-real-I1-stamp.png')});
         console.log('LIVE_I1_STAMP',stamped,form.id);
       }
     }else await page.waitForTimeout(60);
   }
   assert.ok(stamped>=5,'five actual documents stamped');
   assert.equal((await snap()).currentCardId,'I2');
   // Physical move of two junk envelopes, never touch the real pay-slip.
   const junkIds=['junk-a','junk-b'];
   for(const id of junkIds){
     const s=await snap(),e=s.sceneState.envelopes.find(e=>e.id===id);
     assert.ok(e&&!e.done,'expected real junk object '+id);
     await dragWorld(e.x+65,e.y+44,637,450);
     shredded++;
     await page.waitForTimeout(180);
   }
   await eventual(s=>s.currentCardId==='I3',4500);
   assert.equal((await snap()).currentCardId,'I3');
   for(const [id,x,y] of [['scam-1',217,235],['scam-2',564,178],['scam-3',450,398]]){
     if((await snap()).currentCardId!=='I3')break;
     const width=id==='scam-3'?306:287;
     await clickWorld(x+width-28,y+25);closed++;
     await page.waitForTimeout(140);
   }
   await eventual(s=>s.mode==='promotion',4500);
   const promotion=await snap();
   assert.equal(promotion.evidence.filter(e=>e.id.startsWith('I')).length,3);
   assert.equal(promotion.pendingPromotion.offers.length,3);
   await page.screenshot({path:path.join(out,'1080p-real-first-promotion.png')});
   await page.locator('#mail [data-pick="carbon-copy"]').click();
   await eventual(s=>s.currentCardId==='S1',3000);
   await page.screenshot({path:path.join(out,'1080p-real-S1.png')});
   // SERVICES S1: three real folder drops, no mock event dispatch.
   for(let i=0;i<3;i++){
     const state=await snap(),f=state.sceneState.files.find(f=>f.id===i);
     assert.ok(f&&!f.done,'S1 folder '+i+' available');
     await dragWorld(f.x,f.y,923,390);
     await page.waitForTimeout(155);
   }
   await eventual(s=>s.currentCardId==='S2',3500);
   await page.screenshot({path:path.join(out,'1080p-real-S2.png')});
   // SERVICES S2: keep a physical pointer on the tray and steer under
   // falling mugs. Choices remain scene-driven and do not fake a catch.
   const S=1080/760;
   await page.mouse.move(600*S,534*S);
   await page.mouse.down();
   const end=Date.now()+15500;
   let coffee=null;
   while(Date.now()<end){
     const current=await snap();
     if(current.currentCardId!=='S2'){coffee=current;break;}
     const obj=current.sceneState;
     const waiting=obj.cups.filter(c=>!c.done && c.y>315);
     if(waiting.length){
       waiting.sort((a,b)=>b.y-a.y);
       const target=waiting[0];
       await page.mouse.move(Math.max(130,Math.min(1060,target.x))*S,534*S);
     }
     await page.waitForTimeout(48);
   }
   await page.mouse.up();
   coffee=coffee??await snap();
   assert.equal(coffee.currentCardId,'S3','S2 coffee challenge must advance from real catches');
   await page.screenshot({path:path.join(out,'1080p-real-S3.png')});
   const safe=await snap();
   if(!safe.sceneState.safe)await eventual(s=>s.sceneState?.safe===true,2800);
   await dragWorld(600,477,923,571);
   await eventual(s=>s.mode==='promotion',4500);
   await page.screenshot({path:path.join(out,'1080p-real-printer-promotion.png')});
   await page.locator('#mail [data-pick]').first().click();
   await eventual(s=>s.mode==='printer',2500);
   await page.screenshot({path:path.join(out,'1080p-real-printer-opening.png')});
   // Printer owner authored a centered (-w/2..w/2,-380..380) stage.
   // LEAD adapter's draw and input transforms must be inverse pairs.
   const centered=async(x,y)=>{
     const v=(await snap()).viewport,sc=v.cssHeight/v.worldHeight;
     return {x:(x+v.worldWidth/2)*sc,y:(y+v.worldHeight/2)*sc};
   };
   const dragCentered=async(x,y,X,Y)=>{
     const a=await centered(x,y),b=await centered(X,Y);
     await page.mouse.move(a.x,a.y);await page.mouse.down();
     await page.mouse.move(b.x,b.y,{steps:14});await page.mouse.up();
   };
   for(let cycle=0;cycle<3;cycle++){
     await eventual(s=>s.sceneState?.phase==='jam',6500);
     await eventual(s=>s.sceneState?.safePull===true,1900);
     await dragCentered(-104,105,-104,239);
     await eventual(s=>s.sceneState?.phase==='counter',2300);
     const stage=(await snap()).sceneState;
     assert.ok(stage.packet,'printer supplies real physical packet');
     await dragCentered(stage.packet.x,stage.packet.y,stage.feederX,50);
     await eventual(s=>s.sceneState?.phase==='impact',2600);
     assert.equal((await snap()).sceneState.removed,cycle+1,'one manual bolt counter per cycle');
     await page.screenshot({path:path.join(out,'1080p-real-printer-cycle-'+(cycle+1)+'.png')});
   }
   await eventual(s=>s.mode==='promotion'&&s.promotionSlot===2,5000);
   assert.equal((await snap()).evidence.filter(e=>e.id==='printer').length,1,'unique printer boss completion');
   await page.screenshot({path:path.join(out,'1080p-real-third-promotion.png')});
   await page.locator('#mail [data-pick]').first().click();
   await eventual(s=>s.currentCardId==='P1',2600);
   await page.screenshot({path:path.join(out,'1080p-real-P1.png')});
   // PR author tests provide known actual gesture paths; route through LEAD.
   const c=(await snap()).viewport.worldWidth/2;
   await dragWorld(c-180,520,c-180,705);
   await clickWorld(c,630);
   await eventual(s=>s.currentCardId==='P2',4200);
   await page.screenshot({path:path.join(out,'1080p-real-P2.png')});
   await dragWorld(c-375,255,c-600,50);
   await dragWorld(c+280,445,c+530,600);
   await clickWorld(c-80,320);
   await eventual(s=>s.currentCardId==='P4',4200);
   await page.screenshot({path:path.join(out,'1080p-real-P4.png')});
   await dragWorld(c,402,c+205,565);
   await eventual(s=>s.mode==='promotion'&&s.promotionSlot===3,4200);
   await page.screenshot({path:path.join(out,'1080p-real-fourth-promotion.png')});
   await page.locator('#mail [data-pick]').first().click();
   await eventual(s=>s.currentCardId==='T1',3500);
   await page.screenshot({path:path.join(out,'1080p-real-T1.png')});
   // STAFF: actual manual sweeps and taps, licences are two distinct $40 objects.
   const sw=(await snap()).viewport.worldWidth,l=sw/2-505;
   for(let i=0;i<2;i++){
     const w=(await snap()).sceneState.workers[i];
     await dragWorld(l+1010*.49,w.y,l+1010*.49+85,w.y);
     await clickWorld(w.x,w.y-62);
   }
   await eventual(s=>s.currentCardId==='T4',10500);
   await page.screenshot({path:path.join(out,'1080p-real-T4.png')});
   for(let i=0;i<2;i++){
     const token=(await snap()).sceneState.tokens[i];
     await dragWorld(token.x,token.y,l+1010*(i===0?.18:.82),368);
     await page.waitForTimeout(110);
   }
   await eventual(s=>s.currentCardId==='T3',4200);
   await page.screenshot({path:path.join(out,'1080p-real-T3.png')});
   const cx=sw/2;
   await clickWorld(cx,445);
   await eventual(s=>s.sceneState?.clockWindow?.open===true,5000);
   await clickWorld(cx,445);
   await eventual(s=>s.mode==='promotion'&&s.promotionSlot===4,4200);
   await page.screenshot({path:path.join(out,'1080p-real-fifth-promotion.png')});
   await page.locator('#mail [data-pick]').first().click();
   await eventual(s=>s.mode==='quota',2500);
   await page.screenshot({path:path.join(out,'1080p-real-quota-intro.png')});
   const qMode=m=>eventual(s=>s.sceneState?.mode===m,8000);
   const qDrag=async(a,b)=>{
     const t=(await snap()).sceneState.targets;
     assert.ok(t[a]&&t[b],'Quota real target pair '+a+' '+b);
     await dragWorld(t[a].x,t[a].y,t[b].x,t[b].y);
     await page.waitForTimeout(80);
   };
   const qClick=async(a)=>{const t=(await snap()).sceneState.targets;assert.ok(t[a],'Quota click target '+a);await clickWorld(t[a].x,t[a].y);};
   await qMode('bonus');await qDrag('bonus','file');
   await qMode('telegraph');await qMode('recovery');await qDrag('strip','stripTo');
   await qMode('verify');await qClick('seal');await qMode('opening');await qDrag('counter','gear');
   await qMode('counter-hit');await page.screenshot({path:path.join(out,'1080p-real-quota-bolt-1.png')});
   await qMode('bonus');assert.equal((await snap()).sceneState.phase,2);
   await qDrag('bonus','cool');await qMode('ads');await qDrag('fake','trash');
   await qMode('verify');await qClick('seal');await qMode('opening');await qDrag('counter','gear');
   await qMode('counter-hit');await page.screenshot({path:path.join(out,'1080p-real-quota-bolt-2.png')});
   await qMode('bonus');assert.equal((await snap()).sceneState.phase,3);
   await qDrag('bonus','file');await qMode('route');
   for(let i=0;i<20;i++){
     let q=(await snap()).sceneState.clockSeconds%4.1;
     if(q>1.35&&q<3.3){await qDrag('doc','safe');if((await snap()).sceneState.mode==='bonus')break;}
     await page.waitForTimeout(100);
   }
   await qMode('bonus');await page.screenshot({path:path.join(out,'1080p-real-quota-fourth-choice.png')});
   await qDrag('bonus','cool');await qMode('latch');await qDrag('latch','latchTo');
   await qMode('verify');await qClick('seal');await qMode('opening');await qDrag('counter','gear');
   await qMode('counter-hit');await page.screenshot({path:path.join(out,'1080p-real-quota-bolt-3.png')});
   await qMode('clockout');await qDrag('stamp','stampTo');
   await qMode('complete');
   await eventual(s=>s.mode==='victory',4500);
   const final=await snap();
   assert.equal(final.evidence.filter(e=>['printer','quota'].includes(e.id)).length,2);
   assert.equal(final.evidence.filter(e=>/^[ISPT][1-4]$/.test(e.id)).length,12);
   assert.equal(final.scoreIssue,null,'no authentic SYSTEMS ledger mismatch');
   assert.equal(final.verifiedScoreReady,true,'actual frozen score must be available');
   const paper=page.locator('#score-receipt .ns-receipt');
   await paper.waitFor({state:'visible',timeout:4000});
   assert.equal(await page.locator('#score-receipt [data-flip]').count(),1);
   console.log('VERIFIED_SCORE_VIEW',await page.locator('#score-receipt .ns-receipt-score').innerText());
   assert.equal(errors.length,0,'no browser errors through complete 12-card 2-boss campaign');
   await page.screenshot({path:path.join(out,'1080p-real-full-campaign-ending.png')});
   console.log('REAL FULL CAMPAIGN VERIFIED',JSON.stringify({cards:12,bosses:2,promotions:5,finalMode:final.mode,ledger:final.evidence.map(e=>e.id),bonus:final.sceneState?.bonusOutcomes,errors}));
   assert.equal(errors.length,0,'no browser exceptions');
   console.log(JSON.stringify({pass:true,seed:first.deck,stamped,shredded,closed,committedCards:promotion.evidence.map(e=>e.id),firstPerk:'carbon-copy',currentCard:(await snap()).currentCardId,errors},null,2));
 }finally{await context.close();await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});