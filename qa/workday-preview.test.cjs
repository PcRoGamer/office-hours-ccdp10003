const {chromium}=require('playwright'),assert=require('node:assert/strict');
const url=process.env.TEST_BASE_URL||'http://127.0.0.1:4173/workday.html';
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-gpu-sandbox']});
try{const page=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
const r=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});assert.equal(r.status(),200);
await page.getByTestId('flat-clock-in').click();await page.locator('.ow-toast').waitFor();assert.equal(await page.getByTestId('window-mail').count(),0);
assert.equal(await page.locator('canvas').count(),0);
await page.locator('.ow-toast [data-ow="open"]').click();await page.getByTestId('excel-sheet').waitFor();
for(let i=0;i<3;i++){const c=page.getByTestId('total-'+i);await c.fill('=B'+(i+2)+'*C'+(i+2));await c.press('Enter')}
assert.match(await page.getByTestId('verified-count').innerText(),/3\/3 VERIFIED/);
await page.getByRole('button',{name:/FILE COMPLETED REPORT/}).click();await page.getByTestId('research-beat-1').waitFor();
await page.getByRole('button',{name:/NEXT ASSIGNMENT/}).click();await page.locator('.ow-toast').waitFor();await page.locator('.ow-toast [data-ow="open"]').click();
await page.locator('.ow-window[data-ow-app="word"]').waitFor();for(const [field,value] of [['wellbeing','truth'],['delay','truth']])await page.locator('[data-ow="choose"][data-field="'+field+'"][data-value="'+value+'"]').click();
await page.locator('.ow-window [data-ow="submit"]').click();await page.getByTestId('research-beat-2').waitFor();
assert.equal(errors.length,0,errors.join('\n'));console.log('WORKDAY_PREVIEW_SMOKE_PASS');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});