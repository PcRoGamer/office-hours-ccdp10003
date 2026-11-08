#!/usr/bin/env python3
"""QA_VISUAL: capture actual standalone Night Shift v3 agent previews.

Run: python qa/v3-visual-branch-matrix.py --lane all
Run isolated branch: python qa/v3-visual-branch-matrix.py --lane pr --source pr=/path/to/pr-worktree
Test the actual browser and source-bundler (clearly labeled fixture):
  python qa/v3-visual-branch-matrix.py --selftest

The source is cloned into private temporary directories, NEVER the user's
shared checkout. Restricted browser navigation falls back to the SAME authored
ES-module source with local relative imports rewritten to data module URLs.
No generated images are presented as real game. Screenshots and source SHA
are saved for reproducibility; automated geometry is NOT aesthetic approval.
"""
from __future__ import annotations
import argparse,base64,hashlib,http.server,json,os,re,shutil,subprocess,tempfile,threading,time
from pathlib import Path
from urllib.parse import urlparse,unquote
from playwright.sync_api import sync_playwright

REPO='https://github.com/PcRoGamer/office-hours-ccdp10003.git'
LANES={
 'intake':dict(branch='agents/v3-intake-81d47',page='previews/v3-intake.html',states=['I1','I2','I3','I4'],probe='window.__intakeDebug'),
 'services':dict(branch='agents/v3-services-n8-7c42',page='previews/v3-services.html',states=['S1','S2','S3','S4'],probe='window.__services'),
 'pr':dict(branch='agents/v3-pr-g6-1108c',page='previews/v3-pr.html',states=['P1','P2','P3','P4'],probe='window.__pr'),
 'printer':dict(branch='agents/v3-printer-r8c2',page='previews/v3-printer.html',states=['PRINTER'],probe='window.__printerQA'),
 'quota':dict(branch='agents/v3-quota-q7n482',page='previews/v3-quota.html',states=['QUOTA'],probe='window.__QUOTA_SCENE'),
 'story':dict(branch='agents/v3-story-k7m29',page='previews/v3-story.html',states=['PROMOTION','RECEIPT'],probe='window.__storyPreview')
}
SIZES=[('1080p',1920,1080,1),('1440p',2560,1440,1),('4k',3840,2160,1),('4k-dpr2',1920,1080,2),('ultrawide',3440,1440,1),('portrait',650,800,1),('laptop',1440,900,1),('small',1024,600,1)]
MIME={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2','.mp3':'audio/mpeg','.wav':'audio/wav'}
class Server:
 def __init__(self,root):self.root=Path(root).resolve();self.http=None
 def __enter__(self):
  root=self.root
  class Handler(http.server.BaseHTTPRequestHandler):
   def do_GET(self):
    dest=(root/unquote(urlparse(self.path).path).lstrip('/')).resolve()
    if not dest.is_relative_to(root) or not dest.is_file():self.send_error(404);return
    data=dest.read_bytes();self.send_response(200);self.send_header('Content-Type',MIME.get(dest.suffix,'application/octet-stream'));self.send_header('Content-Length',str(len(data)));self.end_headers();self.wfile.write(data)
   def log_message(self,*_):pass
  self.http=http.server.ThreadingHTTPServer(('127.0.0.1',0),Handler)
  threading.Thread(target=self.http.serve_forever,daemon=True).start()
  return f'http://127.0.0.1:{self.http.server_port}'
 def __exit__(self,*_):self.http.shutdown();self.http.server_close()
class Bundle:
 """Inline original browser code without replacing visuals, geometry or game logic."""
 def __init__(self,root):self.root=Path(root).resolve();self.hashes={};self.busy=set()
 def read(self,file):
  f=Path(file).resolve()
  if not f.is_relative_to(self.root) or not f.is_file():raise FileNotFoundError(f'Absent or out-of-tree asset: {f}')
  raw=f.read_bytes();self.hashes[str(f.relative_to(self.root))]=hashlib.sha256(raw).hexdigest()
  return raw.decode('utf-8')
 def module(self,file):
  f=Path(file).resolve()
  if f in self.busy:raise ValueError('Circular ESM import '+str(f))
  self.busy.add(f);src=self.read(f)
  def sub(m):
   before,quote,spec=m.groups()
   return before+quote+self.module((f.parent/spec).resolve())+quote
  src=re.sub(r"(\b(?:from|import)\s*)(['\"])(\.[^'\"]+)\2",sub,src)
  self.busy.remove(f)
  return 'data:text/javascript;base64,'+base64.b64encode(src.encode()).decode()
 def inline_module(self,src,file):
  def sub(m):
   before,quote,spec=m.groups()
   return before+quote+self.module((file.parent/spec).resolve())+quote
  return re.sub(r"(\b(?:from|import)\s*)(['\"])(\.[^'\"]+)\2",sub,src)
 def html(self,file):
  f=Path(file).resolve();src=self.read(f)
  def css(m):return '<style>'+self.read((f.parent/m.group(2)).resolve())+'</style>'
  src=re.sub(r'<link\b[^>]*\brel=["\']stylesheet["\'][^>]*\bhref=(["\'])([^"\']+)\1[^>]*>',css,src,flags=re.I)
  def external(m):
   before,_,rel,after=m.groups();target=(f.parent/rel).resolve();body=self.read(target)
   attributes=before+after
   if re.search(r'\btype=["\']module["\']',attributes,re.I):body=self.inline_module(body,target)
   return '<script'+re.sub(r'\s+src\s*=\s*(["\']).*?\1','',attributes)+'>'+body+'</script>'
  src=re.sub(r'<script\b([^>]*)\bsrc\s*=\s*(["\'])(.*?)\2([^>]*)>\s*</script>',external,src,flags=re.I|re.S)
  src=re.sub(r'(<script\b[^>]*type=["\']module["\'][^>]*>)(.*?)(</script>)',
    lambda m:m.group(1)+self.inline_module(m.group(2),f)+m.group(3),src,flags=re.I|re.S)
  return src

JS_DIAG=r'''() => {
 const W=innerWidth,H=innerHeight,dpr=devicePixelRatio;
 const candidates=[...document.querySelectorAll('canvas')].filter(el=>el.getBoundingClientRect().width>0);
 const can=candidates.sort((a,b)=>b.clientWidth*b.clientHeight-a.clientWidth*a.clientHeight)[0];
 if(!can)return {viewport:[W,H],dpr,missingCanvas:true};
 const r=can.getBoundingClientRect();let detail=null;
 try {const t=document.createElement('canvas');t.width=96;t.height=54;let x=t.getContext('2d',{willReadFrequently:true});x.drawImage(can,0,0,96,54);
 const data=x.getImageData(0,0,96,54).data;
 const zone=(xa,xb,ya,yb)=>{let mean=0,variation=0,n=0,min=256,max=-1;
 for(let y=ya;y<yb;y++)for(let xx=xa;xx<xb;xx++){let i=(y*96+xx)*4;let v=(data[i]*.21+data[i+1]*.72+data[i+2]*.07);min=Math.min(min,v);max=Math.max(max,v);mean+=v;variation+=v*v;n++}mean/=n;return {range:Math.round(max-min),variance:Math.round(variation/n-mean*mean),mean:Math.round(mean)}};
 detail={center:zone(23,73,13,41),bottom:zone(0,96,41,54),top:zone(0,96,0,13),left:zone(0,13,0,54),right:zone(83,96,0,54)};
 }catch(e){detail={error:String(e)}};
 return {viewport:[W,H],dpr,canvas:{css:[r.x,r.y,r.width,r.height],backing:[can.width,can.height]},scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],detail};
}'''
def violations(d):
 failures=[];warnings=[]
 if d.get('missingCanvas'):return ['No world canvas'],[]
 w,h=d['viewport'];x,y,cw,ch=d['canvas']['css']
 if max(abs(x),abs(y),abs(cw-w),abs(ch-h))>2:failures.append('Canvas does not fill CSS viewport')
 if d['canvas']['backing'][0]<w*.75 or d['canvas']['backing'][1]<h*.75:warnings.append('Low-resolution canvas backing')
 if d['scroll'][0]>w+5 or d['scroll'][1]>h+5:warnings.append('Unexpected page overflow')
 paint=d.get('detail') or {}
 if paint.get('bottom',{}).get('range',999)<6 and paint.get('center',{}).get('range',0)>50:warnings.append('Flat bottom band: inspect stage occupancy')
 if paint.get('top',{}).get('range',999)<6 and paint.get('center',{}).get('range',0)>50:warnings.append('Flat top band: inspect stage occupancy')
 return failures,warnings
def select(page,lane,state):
 if lane=='intake':page.evaluate('(id)=>window.__intakeDebug.startCard(id)',state)
 elif lane=='services':page.evaluate('(id)=>window.__services.load(Number(id.slice(1))-1)',state)
 elif lane=='pr':page.evaluate('(id)=>window.__pr.switchTo(id)',state)
 elif lane=='printer':page.locator('#go').click(timeout=4000)
 elif lane=='story':
  page.locator('#launch').click(timeout=4000)
  if state=='RECEIPT':
   for _ in range(5):
    buttons=page.locator('#story button:visible')
    if buttons.count()==0:raise RuntimeError('Receipt cannot be reached through visible upgrade buttons')
    buttons.first.click(timeout=4000);page.wait_for_timeout(200)
def capture_lane(browser,lane,root,out,quick=False):
 conf=LANES[lane];path=root/conf['page'];bundle=Bundle(root);rows=[]
 sha=subprocess.run(['git','rev-parse','HEAD'],cwd=root,capture_output=True,text=True).stdout.strip() or None
 with Server(root) as server:
  for name,w,h,dpr in (SIZES[:1]+SIZES[-3:-2] if quick else SIZES):
   ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=dpr,reduced_motion='reduce')
   page=ctx.new_page();errors=[];network=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.on('response',lambda r:network.append(f'{r.status} {r.url}') if r.status>=400 else None)
   mode='http'
   try:
    try:
     if lane=='fixture':raise RuntimeError('Deliberately exercise in-memory original-source fallback')
     response=page.goto(server+'/'+conf['page'],wait_until='domcontentloaded',timeout=11000)
     if not response or not response.ok:raise RuntimeError('HTTP response not OK')
    except Exception:
     mode='inline-original-esm';page.close();page=ctx.new_page()
     page.on('pageerror',lambda e:errors.append(str(e)))
     page.set_content(bundle.html(path),wait_until='load',timeout=15000)
    page.wait_for_function('()=>!!('+conf['probe']+')',timeout=12000)
    states=conf['states'] if name in ('1080p','portrait') else conf['states'][:1]
    for state in states:
     entry={'lane':lane,'sourceBranch':conf['branch'],'sourceSha':sha,'scene':state,'viewport':name,
       'size':[w,h],'dpr':dpr,'mode':mode,'sourceFilesSHA256':dict(bundle.hashes)}
     try:
      select(page,lane,state);page.wait_for_timeout(250)
      if lane=='quota':page.wait_for_function('()=>!!window.__QUOTA_STATE',timeout=7000)
      diag=page.evaluate(JS_DIAG);entry['diagnostics']=diag
      entry['failures'],entry['warnings']=violations(diag)
      outfile=out/f'{lane}-{state}-{name}.png';page.screenshot(path=str(outfile),animations='disabled',timeout=35000)
      entry['screenshot']=outfile.name
      if name=='1080p':
       a=page.evaluate("()=>document.querySelector('canvas')?.toDataURL('image/png')?.slice(-1200)")
       page.wait_for_timeout(430)
       b=page.evaluate("()=>document.querySelector('canvas')?.toDataURL('image/png')?.slice(-1200)")
       entry['motionProbeChanged']=a!=b
       if a==b:entry['warnings'].append('No canvas pixel change over 430ms, inspect paused/intro state')
     except Exception as e:entry['failures']=['Scene capture error: '+str(e)]
     entry['browserErrors']=errors[:];entry['networkErrors']=network[:]
     if errors:entry['failures'].append('JavaScript page exceptions')
     rows.append(entry)
   except Exception as e:rows.append({'lane':lane,'sourceBranch':conf['branch'],'viewport':name,
       'failures':['Load/boot failed: '+str(e)],'browserErrors':errors,'networkErrors':network})
   finally:ctx.close()
 return rows
def main():
 ap=argparse.ArgumentParser(description=__doc__)
 ap.add_argument('--lane',choices=['all',*LANES],default='all')
 ap.add_argument('--source',action='append',default=[],help='lane=/path/to/existing/checkout')
 ap.add_argument('--out',type=Path,default=Path('qa-artifacts/v3-visual/branch-matrix'))
 ap.add_argument('--selftest',action='store_true');ap.add_argument('--quick',action='store_true')
 args=ap.parse_args();args.out.mkdir(parents=True,exist_ok=True)
 selected=list(LANES) if args.lane=='all' else [args.lane];sources={}
 for item in args.source:
  lane,sep,src=item.partition('=')
  if not sep or lane not in LANES:ap.error('Use --source lane=/absolute/path')
  sources[lane]=Path(src).resolve()
 tmp=Path(tempfile.mkdtemp(prefix='night-shift-pr-review-'))
 browser_args={'headless':True,'args':['--no-sandbox','--disable-gpu-sandbox']}
 if os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE'):browser_args['executable_path']=os.environ['PLAYWRIGHT_CHROMIUM_EXECUTABLE']
 results=[]
 try:
  if args.selftest:
   d=tmp/'fixture';(d/'previews').mkdir(parents=True);(d/'night-shift-v3').mkdir()
   (d/'night-shift-v3'/'palette.js').write_text('export const colors={paper:"#fbe0ad",red:"#f25b4a"}')
   (d/'night-shift-v3'/'paint.js').write_text('import {colors} from "./palette.js";export function paint(c){let g=c.getContext("2d");g.fillStyle=colors.red;g.fillRect(0,0,c.width,c.height);g.fillStyle=colors.paper;g.fillRect(c.width*.3,c.height*.2,c.width*.4,c.height*.6)}')
   (d/'previews'/'demo.css').write_text('body{margin:0}canvas{position:fixed;inset:0;width:100vw;height:100vh}')
   (d/'previews'/'demo.html').write_text('<!doctype html><html><head><link rel="stylesheet" href="demo.css"></head><body><canvas id="game"></canvas><script type="module">import {paint} from "../night-shift-v3/paint.js";let c=document.querySelector("canvas");c.width=innerWidth;c.height=innerHeight;paint(c);window.__v3qa=true;</script></body></html>')
   LANES['fixture']=dict(branch='SELFTEST-NOT-GAME',page='previews/demo.html',states=['FIXTURE'],probe='window.__v3qa')
   selected=['fixture'];sources['fixture']=d
  with sync_playwright() as p:
   browser=p.chromium.launch(**browser_args)
   try:
    for lane in selected:
     src=sources.get(lane)
     if src is None:
      src=tmp/lane
      proc=subprocess.run(['git','clone','-q','--depth=1','--single-branch','--branch',
         LANES[lane]['branch'],REPO,str(src)],capture_output=True,text=True,timeout=120)
      if proc.returncode:results.append({'lane':lane,'failures':['Clone failed: '+proc.stderr.strip()]});continue
     if not (src/LANES[lane]['page']).is_file():
      results.append({'lane':lane,'failures':['Preview source absent: '+str(src/LANES[lane]['page'])]});continue
     results.extend(capture_lane(browser,lane,src,args.out,quick=args.quick or args.selftest))
   finally:browser.close()
 finally:shutil.rmtree(tmp,ignore_errors=True)
 report={'schema':1,'generatedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),
   'selftest':args.selftest,'provenance':'FIXTURE-NOT-GAME' if args.selftest else 'actual-authored-PR-scenes',
   'captures':results}
 (args.out/'report.json').write_text(json.dumps(report,indent=2))
 bad=[x for x in results if x.get('failures')]
 print(json.dumps({'selftest':args.selftest,'lanes':selected,'captures':len(results),'failures':len(bad),
   'report':str(args.out/'report.json'),'sampleFailures':bad[:3]},indent=2))
 if bad or not results:raise SystemExit(1)
 if args.selftest:
  assert all(r['mode']=='inline-original-esm' for r in results)
  assert all('night-shift-v3/palette.js' in r['sourceFilesSHA256'] for r in results)
  assert all('previews/demo.css' in r['sourceFilesSHA256'] for r in results)
  print('BROWSER_MATRIX_SELFTEST_PASS: nested authored ES modules, CSS, 1080p, portrait')
if __name__=='__main__':main()
