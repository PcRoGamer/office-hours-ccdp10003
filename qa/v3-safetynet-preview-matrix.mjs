#!/usr/bin/env node
/** Real Chromium/HTTP audit of specialist previews; not release approval. */
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, statSync, createReadStream} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,extname,sep} from 'node:path';
import {createHash} from 'node:crypto';
const args=process.argv.slice(2),val=(key,fallback)=>{const i=args.indexOf(key);return i<0?fallback:args[i+1]};
const root=resolve(val('--root',process.cwd())),out=resolve(val('--out',join(root,'qa/v3-safetynet-preview-evidence')));
const lanes=['intake','services','pr','printer','quota','systems','physics','story'];
const selected=val('--only','').split(',').filter(Boolean),chosen=selected.length?lanes.filter(x=>selected.includes(x)):lanes;
const chrome=process.env.CHROME_PATH||(process.platform==='win32'?
 ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']:
 ['/usr/bin/chromium','/usr/bin/google-chrome']).find(existsSync);
if(!chrome)throw Error('Chrome/Chromium not available; set CHROME_PATH');
mkdirSync(out,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.mp3':'audio/mpeg'};
const server=createServer((req,res)=>{
 let path;try{path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname))}catch{res.writeHead(400).end();return;}
 if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403).end();return;}
 let stat;try{stat=statSync(path)}catch{res.writeHead(404).end();return;}
 if(!stat.isFile()){res.writeHead(404).end();return;}
 res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type',types[extname(path)]||'application/octet-stream');createReadStream(path).pipe(res);
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
const profile=mkdtempSync(join(tmpdir(),'nightshift-v3-cdp-'));
const child=spawn(chrome,['--headless=new','--disable-extensions','--no-first-run','--remote-allow-origins=*','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
let socket,client;
async function makeClient(){
 const active=join(profile,'DevToolsActivePort');
 for(let i=0;i<100&&!existsSync(active);i++){if(child.exitCode!==null)throw Error('Chrome exited unexpectedly');await sleep(100)}
 if(!existsSync(active))throw Error('Chrome DevTools unavailable');
 const port=Number(readFileSync(active,'utf8').split(/\r?\n/)[0]);
 const tabs=await (await fetch('http://127.0.0.1:'+port+'/json')).json();
 const page=tabs.find(t=>t.type==='page');if(!page)throw Error('No Chromium page');
 socket=new WebSocket(page.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true})});
 let next=0;const waiting=new Map(),errors=[],missing=[];
 socket.addEventListener('message',event=>{const m=JSON.parse(event.data);
   if(m.id!==undefined){const callback=waiting.get(m.id);if(callback){waiting.delete(m.id);m.error?callback.reject(Error(JSON.stringify(m.error))):callback.resolve(m.result)}}
   if(m.method==='Runtime.exceptionThrown')errors.push(m.params?.exceptionDetails?.exception?.description||m.params?.exceptionDetails?.text||'exception');
   if(m.method==='Network.responseReceived'&&m.params?.response?.status>=400){const u=m.params.response.url;if(!/\/favicon\.ico(?:$|\?)/.test(u))missing.push({url:u,status:m.params.response.status})}
 });
 return {errors,missing,send:(method,params={})=>new Promise((resolve,reject)=>{const id=++next;waiting.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}))})};
}
const records=[];
try{
 client=await makeClient();
 await client.send('Page.enable');await client.send('Runtime.enable');await client.send('Network.enable');
 async function evaluate(expression){const r=await client.send('Runtime.evaluate',{expression,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value}
 for(const lane of chosen){
  const rel='previews/v3-'+lane+'.html';
  if(!existsSync(join(root,rel))){records.push({lane,status:'pending',reason:'Missing specialist preview'});continue}
  for(const [width,height] of [[1440,900],[650,800]]){
   client.errors.length=0;client.missing.length=0;
   await client.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
   await client.send('Page.navigate',{url:origin+'/'+rel});
   await sleep(1550);
   const before=await evaluate("({title:document.title,ready:document.readyState,overflow:document.documentElement.scrollWidth>innerWidth+4,canvases:[...document.querySelectorAll('canvas')].map(c=>{let r=c.getBoundingClientRect();return {width:r.width,height:r.height,x:r.x,y:r.y}}),buttons:[...document.querySelectorAll('button')].filter(b=>{let r=b.getBoundingClientRect();return r.width>10&&r.height>10}).map(b=>{let r=b.getBoundingClientRect();return {name:(b.innerText||b.ariaLabel||'').slice(0,60),x:r.x+r.width/2,y:r.y+r.height/2}}).slice(0,24)})");
   const match=before.buttons.find(b=>/clock in|start|open your/i.test(b.name))||before.buttons.find(b=>/next|^i[1-4]\b|^p[1-4]\b/i.test(b.name));
   const target=match||(before.canvases[0]?{name:'canvas',x:width/2,y:height/2}:null);
   if(target){await client.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:target.x,y:target.y});await client.send('Input.dispatchMouseEvent',{type:'mousePressed',x:target.x,y:target.y,button:'left',clickCount:1});await client.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:target.x,y:target.y,button:'left',clickCount:1})}
   await sleep(1000);
   const after=await evaluate("({ready:document.readyState,overflow:document.documentElement.scrollWidth>innerWidth+4,canvases:document.querySelectorAll('canvas').length,text:(document.body?.innerText||'').slice(0,200)})");
   const shot=await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});const buffer=Buffer.from(shot.data,'base64');
   const filename='v3-'+lane+'-'+width+'x'+height+'.png';writeFileSync(join(out,filename),buffer);
   const errors=client.errors.slice(),missingAssets=client.missing.slice();
   const status=(!before.canvases.length||before.overflow||after.overflow||errors.length||missingAssets.length)?'fail':'pass';
   records.push({lane,width,height,status,canvasBoxes:before.canvases,buttons:before.buttons.map(b=>b.name),clicked:target?.name||null,horizontalOverflow:before.overflow||after.overflow,errors,missingAssets,filename,sha256:createHash('sha256').update(buffer).digest('hex')});
   console.log(lane+' '+width+'x'+height+' '+status+': '+before.canvases.length+' canvas, '+errors.length+' JS errors, '+missingAssets.length+' missing assets');
  }
 }
}finally{try{socket?.close()}catch{};try{child.kill()}catch{};await new Promise(ok=>server.close(ok));await sleep(250);try{rmSync(profile,{recursive:true,force:true})}catch{}}
const counts={pass:records.filter(x=>x.status==='pass').length,fail:records.filter(x=>x.status==='fail').length,pending:records.filter(x=>x.status==='pending').length};
writeFileSync(join(out,'preview-matrix.json'),JSON.stringify({kind:'independent-preview-rehearsal',note:'Real Chromium previews; not integrated gameplay certification',date:new Date().toISOString(),counts,records},null,2)+'\n');
console.log('V3_PREVIEW_MATRIX '+JSON.stringify(counts));if(counts.fail)process.exitCode=1;
