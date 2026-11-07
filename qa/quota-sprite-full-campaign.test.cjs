const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
const url=process.env.TEST_BASE_URL||process.env.QUOTA_URL||('file:///'+path.resolve('arcade.html').replaceAll('\\','/'));
const chrome=process.env.CHROME_PATH||(['/usr/bin/google-chrome','/usr/bin/chromium','C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(x=>fs.existsSync(x)));
const browser=await chromium.launch({headless:true,...(chrome?{executablePath:chrome}:{}),args:['--disable-gpu-sandbox','--no-sandbox']});
const page=await browser.newPage({viewport:{width:1200,height:760},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push('console:'+m.text().slice(0,200))});
page.setDefaultTimeout(12000);
const start=Date.now(), maxMs=Number(process.env.QUOTA_MAX_MS||260000);
const policy=process.env.QUOTA_POLICY==='kpi'?'kpi':'crew';
const out=path.resolve('qa-artifacts','quota-v3-'+policy);
fs.mkdirSync(out,{recursive:true});
let phase=-1,attempts=0,recovers=0,decisions=[],snapshots=0,moves=0;
try{
const r=await page.goto(url,{waitUntil:'domcontentloaded',timeout:35000});
assert.equal(r.status(),200);
await page.waitForFunction(()=>Boolean(window.__officeArcade?.snapshot));
const state=()=>page.evaluate(()=>window.__officeArcade.snapshot());
const rect=await page.locator('#game').boundingBox();
assert.ok(rect,'Canvas missing');
const xcoord=x=>rect.x+x/1200*rect.width;
const ycoord=y=>rect.y+y/760*rect.height;
const move=(x,y)=>page.mouse.move(xcoord(x),ycoord(y));
const click=(x,y)=>page.mouse.click(xcoord(x),ycoord(y),{delay:25});
const screenshot=name=>page.screenshot({path:path.join(out,name+'.png'),animations:'disabled',timeout:5000});
await screenshot('00-title');
await click(600,606);
assert.equal((await state()).screen,'play');
await screenshot('01-stage-1');
let stagnant=0,lastKey='',lastProgress=0;
while(Date.now()-start<maxMs){
 const st=await state(),key=[st.phase,st.screen,st.progress,st.health].join('/');
 if(st.phase!==phase){
  phase=st.phase;
  console.log('STAGE',phase+1, 'HEALTH',st.health,'SCORE',st.score,'WALL_SECS',Math.round((Date.now()-start)/1000));
  await screenshot('stage-'+(phase+1)+'-entry');
 }
 if(st.screen==='victory'){
  await screenshot('99-victory-unselected');
  console.log('VICTORY_BEFORE_SELECT',JSON.stringify(st));
  await click(598,611);
  const human=await state();
  await screenshot('99-victory-people');
  await click(887,611);
  const kpi=await state();
  await screenshot('99-victory-kpi');
  assert.equal(human.finalChoice,'humans');assert.equal(kpi.finalChoice,'kpi');
  assert.equal(kpi.phase,5);
  assert.equal(kpi.stats.length,6);
  assert.equal(errors.length,0,errors.join(' | '));
  console.log('SPRITE_FULL_CAMPAIGN_PASS',JSON.stringify({wallSeconds:Math.round((Date.now()-start)/1000),stages:kpi.stats.length,recoveries:recovers,decisions,finalScore:kpi.score,adsUsed:kpi.adUsed,errors}));
  break;
 }
 if(st.screen==='draft'){
  await screenshot('draft-after-'+(st.phase+1));
  const defensive=['firewall','coffee','minutes','slow','helpdesk','precision','combo','profit'];
  const choose=st.phase===2||st.phase===4 ? (st.offers.includes(policy)?policy:st.offers[0]) : (policy==='kpi'?(defensive.find(id=>st.offers.includes(id))||st.offers[0]):st.offers[0]);
  const index=st.offers.indexOf(choose);
  decisions.push({after:st.phase+1,choose,offers:st.offers});
  await click(91+index*347+160,218+170);
  await page.waitForTimeout(100);
  continue;
 }
 if(st.screen==='recover'){
  recovers++;
  if(recovers>14)throw Error('Excessive recoveries: '+recovers);
  await screenshot('recover-'+recovers+'-stage-'+(st.phase+1));
  await click(595,495);
  await page.waitForTimeout(150);continue;
 }
 if(st.screen==='pause'){await click(602,388);continue}
 if(st.screen!=='play'){await page.waitForTimeout(70);continue}
 if(st.ads.length){
  const a=st.ads[0];
  // Handle popups as actual player interactions. Accept useful messages; dismiss spam.
  await click(a.real?a.x+a.w*.45:a.x+a.w-20,a.real?a.y+a.h*.65:a.y+20);
  await page.waitForTimeout(70);continue;
 }
 const entities=st.entities||[];
 if(st.phase===0){
  const e=entities.filter(e=>e.kind==='paper'&&e.good&&e.x>60&&e.x<1080&&e.y>215&&e.y<640).sort((a,b)=>a.x-b.x)[0];
  if(e)await click(e.x+e.w/2,e.y+e.h/2);
 }else if(st.phase===1){
  const e=entities.find(e=>e.kind==='file'&&e.x>340&&e.x<990&&e.y>230&&e.y<590);
  if(e){
   await move(e.x+e.w/2,e.y+e.h/2);await page.mouse.down();
   await page.mouse.move(xcoord(e.teal?200:1000),ycoord(415),{steps:6});
   await page.mouse.up();
  }
 }else if(st.phase===2||st.phase===5){
  const e=entities.find(e=>e.kind===(st.phase===2?'printer':'boss'));
  if(e)await click(e.x+e.w/2,e.y+e.h/2);
 }else if(st.phase===3){
  const e=entities.find(e=>e.kind==='chart'&&e.real);
  if(e){await move(e.x+e.w/2,e.y+e.h/2);await page.waitForTimeout(90);}
 }else if(st.phase===4){
  const e=entities.find(e=>e.kind==='worker'&&e.good);
  if(e){await move(e.x+e.w/2,e.y+e.h/2);await page.mouse.down();await page.waitForTimeout(100);await page.mouse.up();}
 }
 moves++;
 if(moves%40===0)console.log('PROGRESS',JSON.stringify({phase:st.phase+1,progress:st.progress,target:st.target,health:st.health,clock:st.clock,score:st.score,recoveries:recovers}));
 await page.waitForTimeout(65);
}
const atLimit=await state();if(atLimit.screen!=='victory'){console.error('CAMPAIGN_LIMIT_STATE',JSON.stringify(atLimit));await screenshot('campaign-limit');throw Error('Full campaign did not complete before max wallclock')}
}finally{await browser.close()}
})().catch(err=>{console.error('FULL_CAMPAIGN_FAIL',err.stack||err);process.exitCode=1});
