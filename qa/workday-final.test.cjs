const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-gpu-sandbox']});
  try{
    const page=await browser.newPage({viewport:{width:1366,height:768}});
    page.setDefaultTimeout(16000);
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    const response=await page.goto(process.env.TEST_BASE_URL||'http://127.0.0.1:4173/workday-final.html',{waitUntil:'domcontentloaded',timeout:45000});
    assert.equal(response.status(),200);
    const game=page.frameLocator('#game');
    await game.getByTestId('flat-clock-in').click();
    await game.locator('.ow-toast').waitFor();
    assert.match(await game.locator('.ow-toast').innerText(),/WHY NOW\?/);
    assert.equal(await game.locator('.ow-toast-premise a').count(),2,'The opening must expose both source perspectives');
    assert.equal(await game.locator('canvas').count(),0);
    assert.equal(await game.getByTestId('window-mail').count(),0,'No legacy mail client');
    fs.mkdirSync('qa-final-artifacts',{recursive:true});
    await page.screenshot({path:'qa-final-artifacts/opening.png',animations:'disabled'});
    await game.locator('.ow-toast [data-ow="open"]').click();
    await game.getByTestId('excel-sheet').waitFor();
    for(let i=0;i<3;i++){const c=game.getByTestId('total-'+i);await c.fill('=B'+(i+2)+'*C'+(i+2));await c.press('Enter');}
    assert.match(await game.getByTestId('verified-count').innerText(),/3\/3 VERIFIED/);
    await game.getByRole('button',{name:/FILE COMPLETED REPORT/}).click();
    await game.getByTestId('research-beat-1').waitFor();
    await game.getByRole('button',{name:/NEXT ASSIGNMENT/}).click();
    await game.locator('.ow-toast [data-ow="open"]').click();
    await game.locator('.ow-window[data-ow-app="word"]').waitFor();
    for(const [field,value] of [['wellbeing','truth'],['delay','truth']]){
      await game.locator('[data-ow="choose"][data-field="'+field+'"][data-value="'+value+'"]').click();
    }
    assert.match(await game.locator('.ow-impact-bar').innerText(),/RECORD INTEGRITY/);
    await game.locator('.ow-window [data-ow="submit"]').click();
    await game.getByTestId('research-beat-2').waitFor();
    await game.getByRole('button',{name:/NEXT ASSIGNMENT/}).click();
    await game.locator('.ow-toast [data-ow="open"]').click();
    await game.locator('.ow-window[data-ow-app="people"]').waitFor();
    await game.locator('.ow-window [data-ow="candidate"][data-id="B"]').click();
    await game.locator('.ow-window [data-ow="choose"][data-field="privacy"][data-value="secure"]').click();
    await page.screenshot({path:'qa-final-artifacts/candidate.png',animations:'disabled'});
    await game.locator('.ow-window [data-ow="submit"]').click();
    await game.getByTestId('research-beat-3').waitFor();
    assert.deepEqual(errors,[],errors.join('\n'));
    console.log('SUBMISSION_CANDIDATE_PLAYABLE_PASS: research, 2D, Sheets, Writer, Applicants, save transitions, 0 errors');
  }finally{await browser.close()}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});