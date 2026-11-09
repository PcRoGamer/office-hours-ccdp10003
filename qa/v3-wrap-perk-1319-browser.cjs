// Real Google Chrome pointer/Canvas QA for the additive scene perk compatibility adapter.
// Run: node qa/v3-wrap-perk-1319-browser.cjs
const {chromium}=require('C:/Users/Admin/NightShiftV3-Lead-tools/node_modules/playwright-core');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const out=path.resolve(root,'..','nightshift-wrap-perk-1319-evidence');
fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html;charset=utf-8','.js':'application/javascript;charset=utf-8','.mjs':'application/javascript;charset=utf-8','.css':'text/css;charset=utf-8'};
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(!(file===root||file.startsWith(root+path.sep))){res.writeHead(403);return res.end();}
 fs.readFile(file,(err,data)=>{
   if(err){res.writeHead(404);return res.end('not found');}
   res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(data);
 });
});
(async()=>{
 let browser;
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--disable-gpu-sandbox']});
  const ctx=await browser.newContext({viewport:{width:1200,height:760},deviceScaleFactor:1,reducedMotion:'reduce'});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto('http://127.0.0.1:'+server.address().port+'/qa/v3-wrap-perk-1319-harness.html');
  await page.waitForFunction(()=>window.readScene&&window.readScene().boxes?.length===3);
  const move=async(mode)=>{
    await page.evaluate(mode=>window.initMode(mode),mode);
    const initial=await page.evaluate(()=>window.readScene());
    const box=initial.boxes[0],x=box.x+57,y=box.y;
    await page.mouse.move(x,y);await page.mouse.down();
    await page.mouse.move(x+60,y,{steps:8});await page.mouse.up();
    await page.waitForTimeout(100);
    const after=await page.evaluate(()=>window.readScene());
    await page.screenshot({path:path.join(out,mode+'.png')});
    return {delta:Math.round(after.boxes[0].x-box.x),initialBoxX:box.x,finalBoxX:after.boxes[0].x,mode};
  };
  const baseline=await move('baseline'),patched=await move('compatibility');
  assert.equal(baseline.delta,0,'Known baseline bug should refuse near-edge grab');
  assert.ok(patched.delta>40,'Scene adapter must activate wider physical grab in Chrome');
  assert.deepEqual(errors,[]);
  const result={passed:true,viewport:'1200x760',baseline,patched,pageErrors:errors,
   evidenceDir:out,source:'real Google Chrome pointer events and actual Staff T2 scene'};
  console.log(JSON.stringify(result,null,2));
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
