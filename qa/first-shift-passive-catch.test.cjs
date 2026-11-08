'use strict';
// A catch cannot be counted as a correct manual action when the pointer never moves.
const {chromium}=require('playwright');
const path=require('node:path');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
  try{
    const page=await browser.newPage({viewport:{width:1200,height:760}});
    await page.setContent('<canvas id="game" width="1200" height="760"></canvas>');
    for(const file of ['assets/first-shift/planck-1.5.1.min.js','first-shift/physics.js','first-shift/microgames.js'])await page.addScriptTag({path:path.resolve(file)});
    const results=await page.evaluate(()=>{
      return [[],['magnet-grip']].map(perks=>{
      let outcome=null; const canvas=document.querySelector('canvas');
      const game=FSCreateMicrogame({id:'S2',canvas,ctx:canvas.getContext('2d'),perks,directive:'FAST OR SAFE',onComplete:o=>{outcome=o}});
      for(let i=0;i<1500&&!outcome;i++)game.update(1/60);
      const result={perks,outcome,state:game.snapshot()};game.destroy();return result;
      });
    });
    for(const result of results){
      assert(result.outcome,'Coffee encounter completes');
      assert(!result.outcome.actions.includes('correct'),`Passive catch was credited as manual input: ${JSON.stringify(result.outcome)}`);
      assert(!result.outcome.miraHelped,`Passive catches were credited as protecting Mira: ${JSON.stringify(result)}`);
    }
    console.log('PASSIVE_CATCH_NOT_CREDITED_PASS');
  }finally{await browser.close()}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
