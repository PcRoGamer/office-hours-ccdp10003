const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const root=process.env.TEST_BASE_URL||'http://127.0.0.1:4173/';
async function main(){
 const browser=await chromium.launch({
  headless:true,
  ...(require('node:fs').existsSync('/usr/bin/google-chrome')?{executablePath:'/usr/bin/google-chrome'}:{}),
  args:['--no-sandbox','--disable-gpu-sandbox']
 });
 try{
  const page=await browser.newPage({viewport:{width:1366,height:768}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(root,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForURL(/\/workday-final\.html(?:\?.*)?$/,{timeout:45000});
  const game=page.frameLocator('#game');
  await game.getByTestId('flat-clock-in').waitFor({timeout:30000});
  await game.getByTestId('flat-clock-in').click();
  await game.locator('.ow-toast').waitFor();
  const intro=await game.locator('.ow-toast').innerText();
  assert.match(intro,/WHY NOW\?/);
  assert.equal(await game.locator('.ow-toast-premise a').count(),2);
  assert.equal(await game.locator('canvas').count(),0,'Current Workday should render without 3D canvas');
  assert.deepEqual(errors,[],'Root Workday JS exceptions: '+errors.join(' | '));
  // The earlier versions stay available at stable direct links, not as the default.
  const original=await browser.newPage();
  const old2D=await original.goto(root+'2d.html',{waitUntil:'domcontentloaded',timeout:30000});
  assert.equal(old2D.status(),200,'Original 2D edition must be preserved');
  await original.getByTestId('flat-clock-in').waitFor();
  const legacy=await original.goto(root+'legacy-3d.html',{waitUntil:'domcontentloaded',timeout:30000});
  assert.equal(legacy.status(),200,'Earlier 3D release must be preserved');
  await original.close();
  console.log('CANONICAL_WORKDAY_ENTRY_AND_LEGACY_FALLBACKS_PASS');
 }finally{await browser.close()}
}
main().catch(e=>{console.error('CANONICAL_WORKDAY_ENTRY_FAIL',e.stack||e);process.exitCode=1});