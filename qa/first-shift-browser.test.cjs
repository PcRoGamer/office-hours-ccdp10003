const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const url=process.env.TEST_BASE_URL||'http://127.0.0.1:4173/first-shift.html';
fs.mkdirSync('qa-artifacts/first-shift',{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try {
  {
   const narrow=await browser.newPage({viewport:{width:650,height:800},deviceScaleFactor:1});
   const errors=[];narrow.on('pageerror',e=>errors.push(e.message));
   await narrow.goto(url,{waitUntil:'load'});await narrow.waitForFunction(()=>window.__firstShift?.snapshot);
   await narrow.screenshot({path:'qa-artifacts/first-shift/title-650.png'});
   await narrow.locator('#research').click();assert.equal(await narrow.locator('#sources a').count(),4);await narrow.locator('#close-sources').click();
   await narrow.locator('#mobileinfo button').click();await narrow.waitForFunction(()=>window.__firstShift.snapshot().card==='I1');
   await narrow.screenshot({path:'qa-artifacts/first-shift/I1-650.png'});
   await narrow.keyboard.press('Escape');const paused=await narrow.evaluate(()=>window.__firstShift.snapshot());assert.equal(paused.screen,'pause');await narrow.waitForTimeout(350);assert.equal((await narrow.evaluate(()=>window.__firstShift.snapshot())).clock,paused.clock);await narrow.keyboard.press('Escape');assert.equal((await narrow.evaluate(()=>window.__firstShift.snapshot())).screen,'play');assert.deepEqual(errors,[]);
   const ns=await narrow.evaluate(()=>window.__firstShift.snapshot()),nr=await narrow.locator('canvas').boundingBox();for(const item of ns.scene.items.filter(i=>i.kind==='paper'&&i.id!=='paper5'))await narrow.mouse.click(nr.x+ns.viewport.ox+item.x*ns.viewport.scale,nr.y+ns.viewport.oy+item.y*ns.viewport.scale);await narrow.waitForFunction(()=>window.__firstShift.snapshot().card==='I3',null,{timeout:5000});
   console.log('FIRST_SHIFT_NARROW_PAUSE_POINTER_PASS');await narrow.close();
  }
  for(const [w,h] of [[1366,768],[1024,600]]){
   const p=await browser.newPage({viewport:{width:w,height:h}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(url);await p.waitForFunction(()=>window.__firstShift?.snapshot);await p.screenshot({path:`qa-artifacts/first-shift/title-${w}.png`});
   let s=await p.evaluate(()=>window.__firstShift.snapshot()),r=await p.locator('canvas').boundingBox();await p.mouse.click(r.x+s.viewport.ox+240*s.viewport.scale,r.y+s.viewport.oy+600*s.viewport.scale);await p.waitForFunction(()=>window.__firstShift.snapshot().card==='I1');s=await p.evaluate(()=>window.__firstShift.snapshot());r=await p.locator('canvas').boundingBox();await p.screenshot({path:`qa-artifacts/first-shift/I1-${w}.png`});
   for(const item of s.scene.items.filter(i=>i.kind==='paper'&&i.id!=='paper5'))await p.mouse.click(r.x+s.viewport.ox+item.x*s.viewport.scale,r.y+s.viewport.oy+item.y*s.viewport.scale);await p.waitForFunction(()=>window.__firstShift.snapshot().card==='I3',null,{timeout:5000});assert.deepEqual(errors,[]);await p.close();
  }
  console.log('FIRST_SHIFT_DESKTOP_VIEWPORT_POINTER_PASS');
  if(process.env.FIRST_SHIFT_FAILURE==='1'){
   const p=await browser.newPage({viewport:{width:1440,height:900}});await p.goto(url);await p.waitForFunction(()=>window.__firstShift?.snapshot);await p.keyboard.press('Enter');
   await p.waitForFunction(()=>window.__firstShift.snapshot().screen==='retry',null,{timeout:55000});let s=await p.evaluate(()=>window.__firstShift.snapshot());assert.equal(Object.keys(s.ledger.cards).length,0,'failed card must not commit');await p.screenshot({path:'qa-artifacts/first-shift/retry.png'});
   const b=await p.locator('canvas').boundingBox();await p.mouse.click(b.x+s.viewport.ox+600*s.viewport.scale,b.y+s.viewport.oy+450*s.viewport.scale);s=await p.evaluate(()=>window.__firstShift.snapshot());assert.equal(s.card,'I1');assert.equal(s.screen,'play');assert.equal(Object.keys(s.ledger.cards).length,0);console.log('FIRST_SHIFT_FAILURE_RETRY_PASS');await p.close();return;
  }
  if(process.env.FIRST_SHIFT_QUICK==='1')return;
  const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:2,recordVideo:{dir:'qa-artifacts/first-shift'}});
  const page=await context.newPage();
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto(url,{waitUntil:'load'}); assert.equal(response.status(),200);
  await page.waitForFunction(()=>window.__firstShift?.snapshot);
  const snap=()=>page.evaluate(()=>window.__firstShift.snapshot());
  const point=async(x,y)=>{const s=await snap(),r=await page.locator('canvas').boundingBox();return [r.x+s.viewport.ox+x*s.viewport.scale,r.y+s.viewport.oy+y*s.viewport.scale]};
  const click=async(x,y)=>page.mouse.click(...await point(x,y));
  const drag=async(x1,y1,x2,y2)=>{await page.mouse.move(...await point(x1,y1));await page.mouse.down();for(let i=1;i<=20;i++){await page.mouse.move(...await point(x1+(x2-x1)*i/20,y1+(y2-y1)*i/20));await page.waitForTimeout(25)}await page.mouse.up();await page.waitForTimeout(250)};
  const expectCard=async(id)=>{await page.waitForFunction(id=>window.__firstShift.snapshot().card===id&&window.__firstShift.snapshot().screen==='play',id,{timeout:5000});await page.screenshot({path:`qa-artifacts/first-shift/${id}.png`})};
  const choose=async()=>{await page.waitForFunction(()=>window.__firstShift.snapshot().screen==='draft',{timeout:5000});await page.screenshot({path:`qa-artifacts/first-shift/draft-${(await snap()).promotion}.png`});await click(240,520)};
  await page.screenshot({path:'qa-artifacts/first-shift/title.png'});
  const started=Date.now();await click(240,600); assert.equal((await snap()).card,'I1');
  await page.waitForTimeout(700);
  await page.screenshot({path:'qa-artifacts/first-shift/i1.png'});
  const before=await snap();
  for(const p of before.scene.items.filter(i=>i.kind==='paper'&&i.id!=='paper5')) await click(p.x,p.y);
  await page.waitForTimeout(2000);
  const after=await snap();
  await page.screenshot({path:'qa-artifacts/first-shift/i1-after-input.png'});
  console.log('I1 pointer result:',JSON.stringify({before:before.scene,after:after.scene}));
  assert(after.screen!=='play'||after.card!=='I1'||after.scene.correct>0,'Clicking approved papers should stamp at least one');
  await expectCard('I3');
  for(const [x,y] of [[354,237],[689,292],[1024,227]])await click(x,y);
  await choose();
  await expectCard('S1');
  for(let n=0;n<3;n++){
   const s=await snap();if(s.card!=='S1')break;const f=s.scene.items.find(i=>i.kind==='folder');const chute=s.scene.items.find(i=>i.kind==='chute');
   assert(f&&chute,'folder and chute visible in snapshot: '+JSON.stringify(s));await drag(f.x,f.y,chute.x,chute.y);
  }
  await expectCard('S2');
  const start=Date.now();while((await snap()).card==='S2'&&Date.now()-start<20000){let s=await snap();let cups=s.scene.items.filter(i=>i.kind==='cup');if(cups.length)await page.mouse.move(...await point(cups[0].x,610));await page.waitForTimeout(80)}
  await choose();
  await expectCard('P1');await drag(350,420,350,535);await click(930,628);
  await expectCard('P4');await drag(590,430,985,420);await choose();
  await expectCard('T1');for(const x of [345,565,785])await drag(x,430,140,420);
  await expectCard('T4');await drag(485,455,250,430);await drag(705,455,600,430);await choose();
  await page.waitForFunction(()=>window.__firstShift.snapshot().screen==='boss',{timeout:5000});await page.screenshot({path:'qa-artifacts/first-shift/boss.png'});
  console.log('FIRST_SHIFT_EIGHT_CARDS_POINTER_PASS',JSON.stringify((await snap()).ledger));
  for(let phase=0;phase<3;phase++){
   let s=await snap();assert.equal(s.scene.phase,phase);await page.screenshot({path:`qa-artifacts/first-shift/boss-phase-${phase+1}.png`});
   for(let n=0;n<(phase===2?2:1);n++)await click(760,600);
   if(phase===2)await click(600,585);
   if(phase===0){s=await snap();await page.mouse.move(...await point(s.scene.shot.x,s.scene.shot.y));await page.mouse.down();await page.mouse.move(...await point(s.scene.bolt.x,s.scene.bolt.y),{steps:30});await page.waitForTimeout(800);assert.equal((await snap()).scene.phase,0,'holding a shot on the bolt must not score');await page.mouse.move(...await point(340,590),{steps:30});await page.waitForTimeout(600);await page.mouse.up()}
   for(let tries=0;tries<12;tries++){s=await snap();if(s.screen==='ending'||s.scene.phase!==phase)break;let p=s.scene.shot,b=s.scene.bolt,dx=b.x-p.x,dy=b.y-p.y;
    await page.mouse.move(...await point(p.x,p.y));await page.mouse.down();
    if(Math.hypot(dx,dy)<95){await page.mouse.move(...await point(340,590),{steps:25});await page.waitForTimeout(700)}
    else if(phase===1&&!s.scene.gearTouched){await page.mouse.move(...await point(p.x+(630-p.x)*.32,p.y+(410-p.y)*.32),{steps:15})}
    else if(phase>0&&p.x<500&&p.y>450){await page.mouse.move(...await point(740,370),{steps:25});await page.waitForTimeout(800)}
    else await page.mouse.move(...await point(p.x+dx*.34,p.y+dy*.34),{steps:15});
    await page.mouse.up();await page.waitForTimeout(1100);
   }
   s=await snap();assert(s.screen==='ending'||s.scene.phase!==phase,`boss phase ${phase+1} cannot be cleared with pointer: ${JSON.stringify(s.scene)}`);
  }
  await page.screenshot({path:'qa-artifacts/first-shift/ending.png'});
  let final=await snap();assert.equal(final.screen,'ending');assert.equal(Object.keys(final.ledger.cards).length,8);assert.equal(Object.keys(final.ledger.packets).length,4);assert.equal(final.ledger.bolts.length,3);
  await click(850,605);assert.equal((await snap()).card,'I1');
  assert.deepEqual(errors,[]);
  console.log('FIRST_SHIFT_FULL_POINTER_PASS',JSON.stringify({wallMs:Date.now()-started,scores:final.scores,ledger:final.ledger}));
  await context.close();
 } finally {await browser.close()}
})().catch(e=>{console.error('FIRST_SHIFT_OPENING_FAIL',e.stack||e);process.exitCode=1});
