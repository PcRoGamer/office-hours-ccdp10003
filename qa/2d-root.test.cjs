const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const root=process.env.TEST_BASE_URL||'http://127.0.0.1:4173/';
const browserPath=process.env.CHROME_PATH||(['/usr/bin/google-chrome','/usr/bin/chromium','C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(x=>fs.existsSync(x)));
(async()=>{
const browser=await chromium.launch({headless:true,...(browserPath?{executablePath:browserPath}:{}),args:['--no-sandbox','--disable-gpu-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:1200,height:760}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const response=await page.goto(root,{waitUntil:'domcontentloaded',timeout:45000});
 assert.equal(response.status(),200);
 await page.waitForURL(/\/arcade\.html$/,{timeout:45000});
 await page.waitForFunction(()=>Boolean(window.__officeArcade?.snapshot));
 const stamp=await page.evaluate(()=>window.__officeArcade.snapshot());
 assert.equal(stamp.screen,'title');
 assert.equal(stamp.art,'bean-toy-v3');
 const box=await page.locator('#wrap').boundingBox();
 assert.equal(box.width,1200);assert.equal(box.height,760);
 fs.mkdirSync('qa-artifacts',{recursive:true});
 await page.screenshot({path:'qa-artifacts/quota-v3-root-title.png',animations:'disabled'});
 const canvas=await page.locator('#game').boundingBox();
 await page.mouse.click(canvas.x+canvas.width*600/1200,canvas.y+canvas.height*594/760);
 assert.equal((await page.evaluate(()=>window.__officeArcade.snapshot())).screen,'play');
 assert.deepEqual(errors,[],'Current root raised JS exceptions: '+errors.join(' | '));
 const old=await browser.newPage();
 for(const file of ['arcade-v3.html','arcade-v2.html','arcade-classic.html','2d.html','legacy-3d.html']){
  const r=await old.goto(root+file,{waitUntil:'domcontentloaded',timeout:30000});
  assert.equal(r.status(),200,'Missing preserved edition: '+file);
 }
 await old.close();
 console.log('V3_CANONICAL_ROOT_AND_ALL_HISTORICAL_EDITIONS_PASS');
}finally{await browser.close()}
})().catch(e=>{console.error('V3_CANONICAL_ROOT_FAIL',e.stack||e);process.exitCode=1});
