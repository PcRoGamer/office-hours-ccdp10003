'use strict';
// Real-browser, screenshot-pixel, responsive-HUD, and actual Chrome touch QA.
// node qa/office-attack-creative.browser.cjs
const {chromium}=(()=>{try{return require('playwright')}catch{return require('C:/Users/Admin/NightShiftV3-Lead-tools/node_modules/playwright-core')}})();
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.OFFICE_ATTACK_CREATIVE_OUT||path.join(__dirname,'office-attack-creative-evidence'));fs.mkdirSync(out,{recursive:true});
const defects=[],cases=[],pictures=[];
const report=(code,viewport,description,evidence={})=>defects.push({code,viewport,description,evidence});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://x').pathname));if(!p.startsWith(root+path.sep)){res.writeHead(403);return res.end()}fs.readFile(p,(err,b)=>{if(err){res.writeHead(404);return res.end('404')}res.writeHead(200,{'content-type':mime[path.extname(p)]||'application/octet-stream','cache-control':'no-store'});res.end(b)})});
const save=async(page,name)=>{const file=path.join(out,name+'.jpg');await page.screenshot({path:file,type:'jpeg',quality:75});pictures.push(name+'.jpg');return file};
function pixels(file){
 const script=[
 'import sys,json',
 'from PIL import Image',
 'im=Image.open(sys.argv[1]).convert("RGB")',
 'w,h=im.size',
 'def bgrow(y):',
 '  xs=[int(w*(.08+i*.84/20)) for i in range(21)]',
 '  return sum(all(abs(a-b)<19 for a,b in zip(im.getpixel((x,y)),(32,57,59))) for x in xs)>=16',
 'active=[not bgrow(y) for y in range(h)]',
 'runs=[]',
 'start=None',
 'for i,v in enumerate(active+[False]):',
 '  if v and start is None:start=i',
 '  if not v and start is not None:runs.append((start,i));start=None',
 'a,b=max(runs,key=lambda x:x[1]-x[0]) if runs else (0,0)',
 'top=a',
 'bottom=h-b',
 'colors=set(tuple(v//16 for v in im.getpixel((x,y))) for y in range(h//4,3*h//4,max(1,h//75)) for x in range(w//4,3*w//4,max(1,w//75)))',
 'print(json.dumps(dict(width=w,height=h,top=top,bottom=bottom,fraction=round((top+bottom)/h,4),centerBuckets=len(colors))))'
 ].join('\n');
 const r=spawnSync('py',['-c',script,file],{encoding:'utf8',timeout:15000});
 if(r.status!==0)throw Error('Pillow failed: '+r.stderr);return JSON.parse(r.stdout);
}
const inter=(a,b)=>Math.min(a.right,b.right)-Math.max(a.x,b.x)>3&&Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y)>3;
const mapping=box=>{const k=Math.min(box.width/960,box.height/540);return{x:x=>box.x+(box.width-960*k)/2+x*k,y:y=>box.y+(box.height-540*k)/2+y*k}};
const snap=page=>page.evaluate(()=>window.__officeAttackQA.snapshot());
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port+'/night-shift-office-attack.html';
 const browser=await chromium.launch({headless:true,...(process.platform==='win32'?{executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}:{})});
 try{
  const art=fs.readFileSync(path.join(root,'office-attack/art.js'),'utf8');
  if(art.includes('hd-cast-atlas.png'))report('REUSED_HD_ATLAS','all','The current visual adapter still draws from the original HD cast atlas, contrary to the locked new-art direction.');
  for(const [name,width,height,mobile] of [['desktop-16x9',1920,1080,false],['portrait',650,800,false],['mobile',390,844,true]]){
   const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:mobile,hasTouch:mobile});
   const page=await ctx.newPage(),errors=[],httpErrors=[];
   page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)httpErrors.push(r.status()+' '+r.url())});
   try{
    await page.goto(base+'?seed=1942',{waitUntil:'networkidle'});
    await page.waitForFunction(()=>window.__officeAttackQA?.snapshot?.().spriteReady,undefined,{timeout:10000});
    const titleFile=await save(page,name+'-title');
    await page.locator('#play').click();
    await page.waitForFunction(()=>window.__officeAttackQA?.snapshot?.().mode==='active',undefined,{timeout:2500});
    assert.equal((await snap(page)).id,'stamp');
    const screenshot=await save(page,name+'-stamp'),pixel=pixels(screenshot);
    if(pixel.fraction>.16)report('BLACK_BARS',name,'Saved screenshot contains large uniform dark bands around the playable 16:9 region',pixel);
    const geometry=await page.evaluate(()=>Object.fromEntries(['lives','round','mute','hud','stage'].map(id=>{const b=document.getElementById(id).getBoundingClientRect();return[id,{x:b.x,y:b.y,width:b.width,height:b.height,right:b.right,bottom:b.bottom}]})));
    if(inter(geometry.lives,geometry.round)||inter(geometry.round,geometry.mute)||inter(geometry.lives,geometry.mute))report('HUD_OVERLAP',name,'Visible HUD items collide',geometry);
    const centers=['lives','round','mute'].map(k=>geometry[k].y+geometry[k].height/2);
    if(Math.max(...centers)-Math.min(...centers)>Math.max(22,height*.035))report('HUD_VERTICAL',name,'Hearts, round and audio control are vertically misaligned',{centers});
    if(errors.length)report('PAGE_ERRORS',name,'Unhandled browser exceptions',{errors});
    if(httpErrors.length)report('MISSING_ASSETS',name,'4xx/5xx resources',{httpErrors});
    cases.push({name,width,height,pixel,geometry,errors,httpErrors,titleFile:path.basename(titleFile)});
    console.log('VIEWPORT',name,JSON.stringify({pixel,errors,httpErrors}));
   }catch(e){report('VIEWPORT_CRASH',name,String(e));await save(page,name+'-error').catch(()=>{})}finally{await ctx.close()}
  }
  // CDP produces genuine Chromium touchStart/move/end. No mocked PointerEvent or state mutation.
  const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,hasTouch:true,isMobile:true});
  const page=await ctx.newPage();let touch={};const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  try{
   let chosen=-1;
   for(let i=1;i<=40;i++){
    await page.goto(base+'?seed='+i,{waitUntil:'domcontentloaded'});
    await page.locator('#play').click();
    if((await snap(page)).queue[1]==='shred'){chosen=i;break}
   }
   assert.ok(chosen>0,'a seed with SHRED as second round should exist');
   const points=mapping(await page.locator('#stage').boundingBox());
   const before=await snap(page),form=before.forms.find(f=>f.ok);
   await page.touchscreen.tap(points.x(form.x),points.y(form.y));
   await page.waitForFunction(()=>{const s=window.__officeAttackQA.snapshot();return s.id==='shred'&&s.mode==='active'},undefined,{timeout:2700});
   const current=await snap(page),junk=current.docs.find(d=>!d.ok);
   await save(page,'mobile-touch-shred-before');
   const cdp=await ctx.newCDPSession(page);
   const start={x:points.x(junk.x),y:points.y(junk.y)},end={x:points.x(750),y:points.y(333)};
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[start]});
   for(let i=1;i<=12;i++){
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x+(end.x-start.x)*i/12,y:start.y+(end.y-start.y)*i/12}]});
    await new Promise(r=>setTimeout(r,25));
   }
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await page.waitForFunction(()=>window.__officeAttackQA.snapshot().history.some(h=>h.id==='shred'),undefined,{timeout:2100});
   const after=await snap(page);
   assert.equal(after.history.at(-1).success,true,'touch drag must shred the paper');
   touch={seed:chosen,success:true,score:after.score,lives:after.lives};
   await save(page,'mobile-touch-shred-after');
  }catch(e){touch={success:false,error:String(e)};report('TOUCH_DRAG','mobile','A real CDP touch drag did not complete SHRED',touch)}
  if(errors.length)report('TOUCH_PAGE_ERRORS','mobile','Browser errors after real touch gesture',{errors});
  await ctx.close();
  const final={time:new Date().toISOString(),source:'integration branch, no game modifications',cases,touch,defects,screenshots:pictures};
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(final,null,2));
  console.log('CREATIVE_QA',JSON.stringify({viewports:cases.length,touch,defects,screenshots:pictures}));
  if(defects.length)process.exitCode=1;
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error('FATAL',e.stack||e);server.close();process.exitCode=2});