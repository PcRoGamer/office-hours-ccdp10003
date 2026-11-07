const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('fs');
const path=require('path');
const BASE=process.env.TEST_BASE_URL || 'file:///'+path.resolve('arcade.html').replace(/\\/g,'/');
const CHROME=process.env.CHROME_PATH || ['/usr/bin/google-chrome','/usr/bin/chromium','C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(x=>fs.existsSync(x));
const art='qa-artifacts/sprite-comparison';
fs.mkdirSync(art,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,...(fs.existsSync(CHROME)?{executablePath:CHROME}:{}),args:['--no-sandbox','--disable-gpu-sandbox']});
 const errors=[];
 try{
  for(const [w,h] of [[1200,760],[1024,600],[1440,810]]){
   const page=await browser.newPage({viewport:{width:w,height:h}});
   page.on('pageerror',e=>errors.push(e.message));
   page.on('console',m=>{if(m.type()==='error')errors.push('console:'+m.text())});
   const url=BASE;
   const response=await page.goto(url,{waitUntil:'load',timeout:35000});
   if(response&&response.status)assert.equal(response.status(),200);
   await page.waitForFunction(()=>window.__officeArcade?.snapshot()?.characterAtlasReady===true,null,{timeout:12000});
   const game=page.locator('#game');
   const snapshot=await page.evaluate(()=>window.__officeArcade.snapshot());
   assert.equal(snapshot.art,'bean-toy-v3','Public saved-game art contract preserved');
   assert.equal(snapshot.characterAtlasReady,true);
   await page.screenshot({path:path.join(art,'sprite-title-'+w+'.png'),animations:'disabled'});
   const bounds=await game.boundingBox();
   assert.ok(bounds?.width>500&&bounds?.height>350,'Canvas missing');
   await page.mouse.click(bounds.x+bounds.width*.5,bounds.y+bounds.height*(594/760));
   await page.waitForFunction(()=>window.__officeArcade.snapshot().screen==='play',{timeout:6500});
   await page.screenshot({path:path.join(art,'sprite-game-'+w+'.png'),animations:'disabled'});
   assert.deepEqual(errors,[],errors.join('\n'));
   await page.close();
   console.log('GENAI_SPRITE_TITLE_AND_GAME_PASS',JSON.stringify({size:[w,h],atlas:snapshot.characterAtlasReady,errors:errors.length}));
  }
 }finally{await browser.close()}
})().catch(e=>{console.error('GENAI_SPRITE_VISUAL_FAIL',e.stack||e);process.exitCode=1});