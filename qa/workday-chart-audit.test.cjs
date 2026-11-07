const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const binary=fs.existsSync('/usr/bin/google-chrome')?'/usr/bin/google-chrome':null;
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:4173/workday-final.html';
async function audit(width,height){
 const browser=await chromium.launch({headless:true,...(binary?{executablePath:binary}:{}),args:['--no-sandbox','--disable-gpu-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width,height}});page.setDefaultTimeout(12000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   if(localStorage.getItem('workday-chart-qa-seeded'))return;
   localStorage.setItem('workday-chart-qa-seeded','1');
   localStorage.setItem('office-hours-started-v3','yes');
   localStorage.setItem('office-hours-director-v1',JSON.stringify({version:1,shown:true,deferred:true,midDone:true,midChoice:'staff',intercepts:0,lastQuest:4,finalSeen:false,finalChoice:null}));
   localStorage.setItem('office-hours-workday-v1',JSON.stringify({
     version:1,seen:[0,1,2,3,4],complete:{1:true,2:true,3:true},decisions:{
       1:{wellbeing:'truth',delay:'truth'},2:{applicant:'B',privacy:'secure'},3:{licences:'protect',risk:'truth'},4:{activeSlide:1}
     },reports:[],notices:[],revision:0
   }));
   localStorage.setItem('office-hours-game-state-v3',JSON.stringify({
     quest:4,won:false,score:1460,hp:100,maxHp:100,coins:480,xp:540,
     adsDismissed:1,adClicked:0,spamDisposed:[],inbox:[],combo:1,
     upgrades:{firewall:0,keyboard:0,focus:0,bonus:0,macro:1}
   }));
  });
  const response=await page.goto(base,{waitUntil:'domcontentloaded',timeout:45000});assert.equal(response.status(),200);
  const game=page.frameLocator('#game');
  await game.getByTestId('flat-clock-in').click();
  const ads=game.getByRole('button',{name:'Close advertisement'});
  for(let i=0;i<4&&await ads.count();i++)await ads.first().click();
  await game.locator('.ow-dock [data-app="slides"][data-ow="open"]').click();
  await game.locator('.ow-window[data-ow-app="slides"]').waitFor();
  await game.locator('[data-ow="slide"][data-index="1"]').click();
  assert.match(await game.locator('.ow-slide').innerText(),/Choose a claim/);
  await game.locator('[data-ow="slide-answer"][data-field="proof"][data-value="spin"]').click();
  await game.locator('[data-ow="slide"][data-index="1"]').click();
  const chart=game.locator('.ow-chart');
  await chart.waitFor();
  const initial=await chart.locator('.ow-chart-track i').evaluateAll(els=>els.map(e=>e.style.width));
  assert.deepEqual(initial,['67%','98%']);
  assert.match(await chart.innerText(),/TRUNCATED SCALE/);
  assert.match(await chart.innerText(),/3\.2%/);
  const btn=game.locator('[data-ow="chart-audit"]');
  const buttonBounds=await btn.boundingBox(),bodyBounds=await game.locator('.ow-body').boundingBox();
  assert.ok(buttonBounds&&bodyBounds,'Audit button or slide content missing');
  assert.ok(buttonBounds.y>=bodyBounds.y&&buttonBounds.y+buttonBounds.height<=bodyBounds.y+bodyBounds.height-3,'Audit control must be fully visible without scrolling');
  assert.equal(await btn.getAttribute('aria-pressed'),'false');
  const before=await game.locator('body').evaluate(()=>JSON.parse(localStorage.getItem('office-hours-workday-v1')).decisions[4]);
  await btn.click();
  assert.equal(await game.locator('[data-ow="chart-audit"]').getAttribute('aria-pressed'),'true');
  const audited=await chart.locator('.ow-chart-track i').evaluateAll(els=>els.map(e=>e.style.width));
  assert.deepEqual(audited,['96.875%','100%']);
  const note=await chart.innerText();assert.match(note,/40 more clicks/);assert.match(note,/about 3\.2%/);
  assert.match(note,/ZERO BASELINE/);
  const after=await game.locator('body').evaluate(()=>JSON.parse(localStorage.getItem('office-hours-workday-v1')).decisions[4]);
  assert.equal(before.proof,after.proof,'Inspection must not alter selected evidence');
  assert.equal(after.chartAudit,true);
  fs.mkdirSync('qa-chart-artifacts',{recursive:true});
  await page.screenshot({path:'qa-chart-artifacts/zero-baseline-'+width+'.png',animations:'disabled'});
  await game.locator('[data-ow="chart-audit"]').click();
  const restored=await chart.locator('.ow-chart-track i').evaluateAll(els=>els.map(e=>e.style.width));
  assert.deepEqual(restored,initial,'Audit must be reversible');
  await game.locator('[data-ow="slide-answer"][data-field="proof"][data-value="truth"]').click();
  await game.locator('[data-ow="slide"][data-index="1"]').click();
  const honest=await chart.locator('.ow-chart-track i').evaluateAll(els=>els.map(e=>e.style.width));
  assert.deepEqual(honest,['100%','8.75%','2.97%']);
  assert.match(await chart.innerText(),/click is not a qualified outcome/);
  assert.equal(errors.length,0,'Browser exceptions: '+errors.join(' | '));
  console.log('CHART_BASELINE_AUDIT_PASS',JSON.stringify({width,height,initial,audited,restored,honest,javascriptErrors:errors.length}));
 }finally{await browser.close()}
}
(async()=>{await audit(1366,768);await audit(1024,600)})().catch(e=>{console.error('CHART_BASELINE_AUDIT_FAIL',e.stack||e);process.exitCode=1});