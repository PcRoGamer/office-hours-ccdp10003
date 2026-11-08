'use strict';
// Play real Planck shots through pointer input. Holding the shot on the bolt
// must not score: a released moving projectile is required.
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({headless:true, ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {}), args:['--no-sandbox']});
  try {
    const page = await browser.newPage({viewport:{width:1200,height:760}});
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.setContent('<style>*{margin:0}canvas{display:block}</style><canvas width="1200" height="760"></canvas>');
    for (const script of ['assets/first-shift/planck-1.5.1.min.js','first-shift/physics.js','first-shift/boss.js']) await page.addScriptTag({path:path.resolve(script)});
    await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      window.events = [];
      window.boss = FSCreateBoss({ctx:canvas.getContext('2d'),perks:[],onPacket:(n,c)=>events.push(['packet',n,c]),onBolt:n=>events.push(['bolt',n]),onComplete:()=>{events.push(['complete']);window.bossComplete=true}});
      canvas.onpointerdown=e=>boss.pointerDown(e.clientX,e.clientY);
      canvas.onpointermove=e=>boss.pointerMove(e.clientX,e.clientY);
      canvas.onpointerup=e=>boss.pointerUp(e.clientX,e.clientY);
      let last = 0;
      const frame = now => {if(last&&!window.bossComplete)boss.update(Math.min(.05,(now-last)/1000));last=now;boss.draw();requestAnimationFrame(frame)};
      requestAnimationFrame(frame);
    });
    for (let phase=0; phase<3; phase++) {
      for (let i=0;i<(phase===2?2:1);i++) await page.mouse.click(760,600);
      if (phase===2) await page.mouse.click(600,586);
      if (phase===0) {
        let state=await page.evaluate(()=>boss.snapshot());
        await page.mouse.move(state.shot.x,state.shot.y); await page.mouse.down();
        await page.mouse.move(state.bolt.x,state.bolt.y,{steps:30}); await page.waitForTimeout(800);
        assert.equal((await page.evaluate(()=>events)).filter(e=>e[0]==='bolt').length,0,'Holding a shot over a bolt must not resolve it');
        await page.mouse.move(340,590,{steps:30}); await page.waitForTimeout(600); await page.mouse.up();
        await page.waitForTimeout(200);
      }
      let succeeded = false;
      for (let tries=0;tries<12;tries++) {
        const state=await page.evaluate(()=>boss.snapshot());
        if(state.phase!==phase) {succeeded=true;break}
        await page.mouse.move(state.shot.x,state.shot.y);
        await page.mouse.down();
        const dx=state.bolt.x-state.shot.x, dy=state.bolt.y-state.shot.y;
        if (Math.hypot(dx,dy)<95) {
          await page.mouse.move(340,590,{steps:25});
          await page.waitForTimeout(700);
        } else if (phase>0 && state.shot.x<500 && state.shot.y>450) {
          await page.mouse.move(740,370,{steps:25});
          await page.waitForTimeout(800);
        } else {
          await page.mouse.move(state.shot.x+dx*.34,state.shot.y+dy*.34,{steps:15});
        }
        await page.mouse.up();
        await page.waitForTimeout(1100);
        const events=await page.evaluate(()=>window.events);
        if(events.some(x=>x[0]==='bolt'&&x[1]===phase+1)){succeeded=true;break}
      }
      await page.screenshot({path:`qa-artifacts/first-shift/boss-pointer-${phase+1}.png`});
      assert(succeeded,`Phase ${phase+1} could not be completed via released pointer shots; events=${JSON.stringify(await page.evaluate(()=>events))}`);
    }
    assert.deepEqual(await page.evaluate(()=>events.filter(e=>e[0]==='bolt').map(e=>e[1])),[1,2,3]);
    assert.equal((await page.evaluate(()=>events)).filter(e=>e[0]==='complete').length,1);
    assert.deepEqual(errors,[]);
    console.log('BOSS_RELEASED_POINTER_THREE_PHASE_PASS');
  } finally { await browser.close(); }
})().catch(e => { console.error(e.stack || e);process.exitCode=1; });
