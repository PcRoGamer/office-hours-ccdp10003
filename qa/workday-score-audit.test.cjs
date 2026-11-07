const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:4173/workday-final.html';
const binary=fs.existsSync('/usr/bin/google-chrome')?'/usr/bin/google-chrome':null;
const good={
 version:1,seen:[0,1,2,3,4,5],complete:{1:true,2:true,3:true,4:true,5:true},
 decisions:{
   1:{wellbeing:'truth',delay:'truth'},
   2:{applicant:'B',privacy:'secure'},
   3:{licences:'protect',risk:'truth'},
   4:{claim:'truth',proof:'truth',conclusion:'truth',policy:'disclose'},
   5:{evidence:['finance','staff','campaign']}
 },
 reports:[1,2,3,4,5].map(quest=>({quest,title:'Workday task '+quest,decisions:{}})),
 notices:[],revision:0
};
async function inspect(width,height){
 const browser=await chromium.launch({headless:true,...(binary?{executablePath:binary}:{}),args:['--no-sandbox','--disable-gpu-sandbox']});
 try{
   const page=await browser.newPage({viewport:{width,height}});
   const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.setDefaultTimeout(20000);
   await page.addInitScript((save)=>{
     if(localStorage.getItem('audit-lab-setup'))return;
     localStorage.setItem('audit-lab-setup','1');
     localStorage.setItem('office-hours-started-v3','yes');
     localStorage.setItem('office-hours-workday-v1',JSON.stringify(save));
     localStorage.setItem('office-hours-game-state-v3',JSON.stringify({
       quest:6,won:true,score:1860,hp:100,maxHp:100,adsDismissed:1,adClicked:0,
       precisionFills:1,spamDisposed:[],inbox:[],combo:1,
       upgrades:{firewall:0,keyboard:0,focus:0,bonus:0,macro:1},xp:637,coins:700
     }));
   },good);
   const response=await page.goto(base,{waitUntil:'domcontentloaded',timeout:45000});
   assert.equal(response.status(),200);
   const game=page.frameLocator('#game');
   const resume=game.getByRole('button',{name:/RESUME SHIFT/});
   if(await resume.count())await resume.click();
   else if(await game.getByRole('button',{name:/CLOCK IN/}).count())
      await game.getByRole('button',{name:/CLOCK IN/}).click();
   await game.locator('.final-report').waitFor({timeout:30000});
   const launcher=game.locator('[data-workday-audit="open"]');
   await launcher.waitFor({timeout:25000});
   const before=await game.locator('body').evaluate(()=>localStorage.getItem('office-hours-game-state-v3')+'|'+localStorage.getItem('office-hours-workday-v1'));
   await launcher.click();
   const dialog=game.getByRole('dialog',{name:/Who gets to set the score/});
   await dialog.waitFor();
   const tabs=dialog.getByRole('tab');
   assert.equal(await tabs.count(),3);
   const results=[];
   for(const name of ['QUARTERLY OUTPUT','PEOPLE & CONDITIONS','AUDITABLE EVIDENCE']){
     const btn=dialog.getByRole('tab',{name});
     await btn.click();
     const score=await dialog.locator('[data-score]').innerText();
     const desc=await dialog.locator('[data-blindspot]').innerText();
     assert.match(score,/^\d+ \/ 100$/);
     assert.ok(desc.length>70,'No meaningful counterargument');
     results.push([name,score]);
   }
   assert.notEqual(results[0][1],results[1][1],'Different rules produced the same score unexpectedly');
   await dialog.getByText(/Inspect the fictional scoring formula/).click();
   assert.match(await dialog.locator('[data-formula]').innerText(),/verified choices/);
   assert.match(await dialog.innerText(),/NOT validated workplace outcomes/);
   const endBefore=await game.locator('.final-report').innerText();
   assert.match(endBefore,/SHIFT SURVIVED/);
   assert.ok(await game.locator('.ow-audit-close').isVisible());
   fs.mkdirSync('qa-score-audit-artifacts',{recursive:true});
   await page.screenshot({path:'qa-score-audit-artifacts/audit-'+width+'.png',animations:'disabled'});
   await game.locator('.ow-audit-close').click();
   await dialog.waitFor({state:'detached'});
   const after=await game.locator('body').evaluate(()=>localStorage.getItem('office-hours-game-state-v3')+'|'+localStorage.getItem('office-hours-workday-v1'));
   assert.equal(after,before,'Opening the audit changed saved gameplay');
   assert.equal(await game.locator('.final-report').count(),1);
   assert.equal(errors.length,0,'JavaScript errors: '+errors.join(' | '));
   console.log('SCORE_AUDIT_UI_PASS',JSON.stringify({width,height,scores:results,errors:0}));
 }finally{await browser.close()}
}
(async()=>{await inspect(1366,768);await inspect(1024,600)})().catch(e=>{console.error('SCORE_AUDIT_UI_FAIL',e.stack||e);process.exitCode=1});