// Render-only verification of the LEAD fallback ending states.
// This does NOT certify real gameplay or score provenance; it catches renderer crashes
// and misrouting of the retired first-card preview, across useful screen sizes.
const {chromium}=require('C:/Users/Admin/NightShiftV3-Lead-tools/node_modules/playwright-core');
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),dir=path.join(__dirname,'v3-lead-finale-evidence');
fs.mkdirSync(dir,{recursive:true});
const mime={'.html':'text/html;charset=utf-8','.js':'application/javascript;charset=utf-8','.mjs':'application/javascript;charset=utf-8','.css':'text/css;charset=utf-8'};
const server=http.createServer((request,response)=>{
  const u=new URL(request.url,'http://localhost'),p=path.resolve(root,'.'+decodeURIComponent(u.pathname));
  if(!p.startsWith(root+path.sep)){response.writeHead(403);return response.end();}
  fs.readFile(p,(err,body)=>{if(err){response.writeHead(404);return response.end('Not found');}
   response.writeHead(200,{'Content-Type':mime[path.extname(p)]||'application/octet-stream'});response.end(body)});
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const outputs=[];
 try{
  for(const [name,width,height,dpr] of [['landscape',1920,1080,1],['portrait',650,800,1],['high-dpi',1920,1080,2]]){
   const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,reducedMotion:'reduce'});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text())});
   await page.goto('http://127.0.0.1:'+server.address().port+'/night-shift-v3.html',{waitUntil:'domcontentloaded'});
   const stats=await page.evaluate(async({width,height,dpr})=>{
    const {drawCampaignVictory,drawCampaignGameOver}=await import('./night-shift-v3/runtime/transitions.js');
    const canvas=document.createElement('canvas');const size={worldWidth:760*width/height,worldHeight:760};
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    Object.assign(canvas.style,{position:'fixed',inset:'0',width:'100vw',height:'100vh',zIndex:'99999'});
    document.body.append(canvas);const g=canvas.getContext('2d',{willReadFrequently:true});
    const scale=dpr*height/760,colors={};
    const evidence='I1,I2,I3,S1,S2,S3,P1,P2,P4,T1,T4,T3,printer,quota'.split(',').map(id=>({id,committed:true}));
    g.setTransform(scale,0,0,scale,0,0);drawCampaignVictory(g,size,null,2.4,{evidence});
    const samples=[];for(let j=1;j<7;j++)for(let i=1;i<9;i++){const x=Math.floor(canvas.width*i/9),y=Math.floor(canvas.height*j/7);const data=[...g.getImageData(x,y,1,1).data].slice(0,3).join(',');colors[data]=true;samples.push(data)}
    const victoryColors=Object.keys(colors).length;
    g.setTransform(scale,0,0,scale,0,0);drawCampaignGameOver(g,size,null,2.4);
    return {victoryColors,gameOverReady:true,rect:[canvas.width,canvas.height],worldWidth:size.worldWidth};
   },{width,height,dpr});
   await page.locator('canvas').last().screenshot({path:path.join(dir,name+'-victory-fixture.png')});
   assert.ok(stats.victoryColors>=6,'victory frame has actual scene variation');
   assert.equal(stats.rect[0],width*dpr);assert.equal(stats.rect[1],height*dpr);
   assert.deepEqual(errors,[],'no browser errors');
   outputs.push({name,...stats,errors});
   await context.close();
  }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
 console.log(JSON.stringify({pass:true,note:'render fixtures only, not actual scored victory',results:outputs},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
