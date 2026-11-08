#!/usr/bin/env node
// Real HD title + first-action browser capture. Uses Chrome DevTools Protocol,
// actual mouse input and the unmodified arcade-office-hd.html. No model APIs.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=join(root,'qa','v3-safetynet-hd-evidence');
mkdirSync(out,{recursive:true});
const choices=process.platform==='win32'
  ? ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
  : ['/usr/bin/chromium','/usr/bin/google-chrome'];
const browser=process.env.CHROME_PATH||choices.find(existsSync);
if(!browser)throw Error('Chrome/Chromium not found. Set CHROME_PATH');
const profile=mkdtempSync(join(tmpdir(),'v3-safetynet-cdp-'));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let child,ws;
async function readyPort(){
  const file=join(profile,'DevToolsActivePort');
  for(let i=0;i<100;i++){
    if(existsSync(file)){
      const port=Number(readFileSync(file,'utf8').split(/\r?\n/)[0]);
      if(port>0)return port;
    }
    if(child.exitCode!==null)throw Error('Chrome exited unexpectedly: '+child.exitCode);
    await sleep(100);
  }
  throw Error('Chrome CDP port did not appear');
}
async function makeClient(port){
  const tabs=await (await fetch('http://127.0.0.1:'+port+'/json')).json();
  const page=tabs.find(t=>t.type==='page');
  if(!page)throw Error('No CDP page target');
  ws=new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((ok,fail)=>{ws.addEventListener('open',ok,{once:true});ws.addEventListener('error',fail,{once:true})});
  let serial=0;const pending=new Map();const exceptions=[];
  ws.addEventListener('message',e=>{
    const message=JSON.parse(e.data);
    if(message.method==='Runtime.exceptionThrown')exceptions.push(message.params?.exceptionDetails?.text||'uncaught exception');
    const slot=pending.get(message.id);
    if(slot){pending.delete(message.id);message.error?slot.fail(Error(JSON.stringify(message.error))):slot.ok(message.result);}
  });
  const send=(method,params={})=>new Promise((ok,fail)=>{
    const id=++serial;pending.set(id,{ok,fail});ws.send(JSON.stringify({id,method,params}));
  });
  return {send,exceptions};
}
async function main(){
  child=spawn(browser,['--headless=new','--no-first-run','--no-default-browser-check',
    '--disable-extensions','--remote-allow-origins=*','--remote-debugging-port=0',
    '--user-data-dir='+profile,'--window-size=1440,900','about:blank'],
    {stdio:'ignore',windowsHide:true});
  const c=await makeClient(await readyPort());
  await c.send('Page.enable');await c.send('Runtime.enable');
  const evaluate=async expression=>{
    const response=await c.send('Runtime.evaluate',{expression,returnByValue:true});
    if(response.exceptionDetails)throw Error(response.exceptionDetails.text);
    return response.result.value;
  };
  const capture=async name=>{
    const frame=await c.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
    writeFileSync(join(out,name),Buffer.from(frame.data,'base64'));
  };
  const records=[];
  for(const [width,height] of [[1440,900],[650,800]]){
    await c.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await c.send('Page.navigate',{url:pathToFileURL(join(root,'arcade-office-hd.html')).href});
    await sleep(850);
    const before=await evaluate("({width:innerWidth,height:innerHeight,canvasWidth:document.querySelector('#game')?.getBoundingClientRect().width,canvasHeight:document.querySelector('#game')?.getBoundingClientRect().height,announcement:document.querySelector('#sr')?.textContent})");
    assert.equal(before.canvasWidth,width);
    assert.equal(before.canvasHeight,height);
    await capture('hd-title-'+width+'x'+height+'.png');
    // Convert true native title button coordinates into CSS viewport pixels.
    const ratio=width/height;
    const scale=ratio>=1.48&&ratio<=2.08?Math.max(width/1200,height/760):Math.min(width/1200,height/760);
    const x=(width-1200*scale)/2+250*scale;
    const y=(height-760*scale)/2+610*scale;
    await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y});
    await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1});
    await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1});
    await sleep(1750);
    const after=await evaluate("({announcement:document.querySelector('#sr')?.textContent,canvasWidth:document.querySelector('#game')?.getBoundingClientRect().width,canvasHeight:document.querySelector('#game')?.getBoundingClientRect().height})");
    await capture('hd-action-'+width+'x'+height+'.png');
    const started=Boolean(after.announcement && after.announcement!==before.announcement);
    assert(started,'Unmodified HD game did not respond to title button at '+width+'x'+height);
    records.push({width,height,before,after,started});
  }
  const report={source:'arcade-office-hd.html',capture:'actual Chrome headless and real CDP mouse events',timestamp:new Date().toISOString(),records,uncaughtExceptions:c.exceptions};
  writeFileSync(join(out,'hd-browser-results.json'),JSON.stringify(report,null,2)+'\n');
  assert.deepEqual(c.exceptions,[]);
  console.log('HD_CDP_BROWSER_PASS 1440x900 and 650x800: title->action, fullscreen canvas, zero JS errors');
}
try{await main()}
finally{try{ws?.close()}catch{};try{child?.kill()}catch{};await sleep(350);try{rmSync(profile,{recursive:true,force:true})}catch{}}
