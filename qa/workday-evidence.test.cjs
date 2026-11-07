const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const BASE=process.env.TEST_BASE_URL||'http://127.0.0.1:4173/workday-final.html';
const binary=fs.existsSync('/usr/bin/google-chrome')?'/usr/bin/google-chrome':null;
const all=['finance','staff','campaign','testimony'];
const names={finance:'Finance reconciliation',staff:'Workforce & access record',campaign:'Campaign evidence',testimony:'Worker testimony'};
function gameFixture(legacy=false){
 return {
  version:1,seen:[0,1,2,3,4,5],complete:{1:true,2:true,3:true,4:true},
  decisions:{
   1:{wellbeing:'truth',delay:'truth'},2:{applicant:'B',privacy:'secure'},
   3:{licences:'protect',risk:'truth'},4:{claim:'truth',proof:'truth',conclusion:'truth',policy:'disclose'},
   5:{evidence:legacy?['leaderboard','staff','campaign']:[]}
  },
  reports:[1,2,3,4].map(quest=>({quest,title:'Completed workday record '+quest,decisions:{}})),notices:[],revision:0
 };
}
async function one(browser,omitted){
 const width=omitted==='testimony'?1024:1366;
 const page=await browser.newPage({viewport:{width,height:width===1024?600:768}});
 page.setDefaultTimeout(12000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(save=>{
   if(localStorage.getItem('evidence-qa-seeded'))return;
   localStorage.setItem('evidence-qa-seeded','1');
   localStorage.setItem('office-hours-started-v3','yes');
   localStorage.setItem('office-hours-director-v1',JSON.stringify({
     version:1,shown:true,deferred:true,midDone:true,midChoice:'staff',
     intercepts:0,lastQuest:5,finalSeen:false,finalChoice:null
   }));
   localStorage.setItem('office-hours-workday-v1',JSON.stringify(save));
   localStorage.setItem('office-hours-game-state-v3',JSON.stringify({
     quest:5,won:false,score:1650,hp:100,maxHp:100,coins:480,xp:580,combo:1,
     adsDismissed:1,adClicked:0,spamDisposed:[],inbox:[],
     upgrades:{firewall:0,keyboard:0,focus:0,bonus:0,macro:1}
   }));
 },gameFixture(omitted==='legacy'));
 try{
   const response=await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:40000});
   assert.equal(response.status(),200);
   const frame=page.frameLocator('#game');
   await frame.getByTestId('flat-clock-in').click();
   const ads=frame.getByRole('button',{name:'Close advertisement'});
   for(let i=0;i<4&&await ads.count();i++)await ads.first().click();
   await frame.locator('.ow-dock [data-ow="open"][data-app="archive"]').click();
   await frame.locator('.ow-window[data-ow-app="archive"]').waitFor();
   if(omitted==='legacy'){
     const saved=await frame.locator('.ow-window').evaluate(()=>JSON.parse(localStorage.getItem('office-hours-workday-v1')).decisions[5].evidence);
     assert.deepEqual(saved,['staff','campaign'],'Phantom old leaderboard entry was not removed from save');
     assert.match(await frame.locator('.ow-review').innerText(),/2\/3/);
     console.log('ARCHIVE_LEGACY_SAVE_MIGRATION_PASS');
   }else{
     const chosen=all.filter(id=>id!==omitted);
     for(const id of chosen)await frame.locator('[data-ow="attachment"][data-id="'+id+'"]').click();
     const note=await frame.locator('.ow-review').innerText();
     assert.ok(note.includes('Left out: '+names[omitted]),note);
     assert.match(note,/ONE VOICE OMITTED/);
     assert.equal(await frame.locator('.ow-window [data-ow="submit"]').isEnabled(),true);
     const onFile=await frame.locator('.ow-window').evaluate(()=>JSON.parse(localStorage.getItem('office-hours-workday-v1')).decisions[5].evidence);
     assert.deepEqual(onFile,chosen,'Selected evidence did not persist');
     fs.mkdirSync('qa-evidence-artifacts',{recursive:true});
     await page.screenshot({path:path.join('qa-evidence-artifacts','omitted-'+omitted+'.png'),animations:'disabled'});
     if(omitted==='testimony'){
       const original=await frame.locator('.ow-review').innerText();
       await frame.locator('[data-ow="attachment"][data-id="testimony"]').click();
       assert.equal(await frame.locator('.ow-review').innerText(),original,'At three items a fourth should not silently replace another');
       await frame.locator('[data-ow="attachment"][data-id="finance"]').click();
       await frame.locator('[data-ow="attachment"][data-id="testimony"]').click();
       assert.match(await frame.locator('.ow-review').innerText(),/Left out: Finance reconciliation/);
       await frame.locator('[data-ow="attachment"][data-id="testimony"]').click();
       await frame.locator('[data-ow="attachment"][data-id="finance"]').click();
       assert.match(await frame.locator('.ow-review').innerText(),/Left out: Worker testimony/);
       console.log('EVIDENCE_SWAP_AND_REVERSIBILITY_PASS');
     }
     if(omitted==='finance'){
       await frame.locator('.ow-window [data-ow="submit"]').click();
       await frame.getByTestId('research-beat-6').waitFor();
       const receipt=await frame.locator('.ow-receipt').innerText();
       assert.match(receipt,/Finance reconciliation/);
       assert.match(receipt,/reconciled/);
       await frame.getByRole('button',{name:/FACE THE BOSS/}).click();
       await frame.locator('.battle-panel').waitFor();
       let turns=0;
       while(await frame.locator('.battle-panel').count()&&turns++<30){
         if(await frame.getByTestId('team-intervention').count())await frame.getByTestId('team-intervention').click();
         else await frame.getByRole('button',{name:/ATTACK/}).click();
       }
       assert.equal(await frame.locator('.battle-panel').count(),0,'Final boss stalled');
       await frame.locator('.final-report').waitFor();
       const end=await frame.locator('.ow-portfolio-line').innerText();
       assert.match(end,/Board blind spot: Finance reconciliation/);
       await page.screenshot({path:path.join('qa-evidence-artifacts','ending-finance-omitted.png'),animations:'disabled'});
       const complete=await frame.locator('body').evaluate(()=>JSON.parse(localStorage.getItem('office-hours-game-state-v3')));
       assert.equal(complete.won,true);
       console.log('EVIDENCE_COMPLETE_FINAL_CONSEQUENCE_PASS',turns);
     }
     console.log('EVIDENCE_OMISSION_PASS',omitted,note.slice(0,130));
   }
   assert.deepEqual(errors,[],'Browser exceptions: '+errors.join(' | '));
 }finally{await page.close()}
}
(async()=>{
 const b=await chromium.launch({headless:true,...(binary?{executablePath:binary}:{}),args:['--no-sandbox','--disable-gpu-sandbox']});
 try{for(const which of [...all,'legacy'])await one(b,which)}finally{await b.close()}
})().catch(e=>{console.error('EVIDENCE_REGRESSION_FAIL',e.stack||e);process.exitCode=1});