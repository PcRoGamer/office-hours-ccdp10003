#!/usr/bin/env python3
"""Collect real PRINTER/QUOTA pointer-play E2E phase screenshots into QA_VISUAL.

Runs each boss team's EXISTING browser tests in isolated git clones (or --source)
and indexes PNGs by source SHA. Does not use generated/synthetic concept images.
Run:
  python qa/v3-visual-boss-phases.py --lane all
  python qa/v3-visual-boss-phases.py --lane printer --source printer=/safe/clone
Capture is not a claim that the complete v3 campaign has been integrated.
"""
from __future__ import annotations
import argparse,hashlib,json,os,shutil,struct,subprocess,tempfile,time,zlib
from pathlib import Path
REPO='https://github.com/PcRoGamer/office-hours-ccdp10003.git'
TASKS={
 'printer':dict(branch='agents/v3-printer-r8c2',scripts=['qa/v3-printer-browser.py'],dirs=['qa/v3-printer-evidence']),
 'quota':dict(branch='agents/v3-quota-q7n482',scripts=['qa/v3-quota.browser.py','qa/v3-quota.e2e.py'],dirs=['qa/v3-quota-evidence'])
}
def sha(src):
 p=subprocess.run(['git','rev-parse','HEAD'],cwd=src,capture_output=True,text=True)
 return p.stdout.strip() if p.returncode==0 else None
def png_size(data):
 # Verify CRC, chunk ordering, decompression and dimensions. Magic bytes
 # alone cannot prove that a browser produced an intact PNG screenshot.
 if not data.startswith(b'\x89PNG\r\n\x1a\n') or len(data)<57:
  raise ValueError('Invalid or truncated PNG')
 pos=8;width=height=0;seen_header=seen_end=False;idat=[]
 while pos+12<=len(data):
  size=struct.unpack('>I',data[pos:pos+4])[0]
  if size > 30_000_000 or pos+12+size>len(data):raise ValueError('Truncated or oversize PNG chunk')
  kind=data[pos+4:pos+8];payload=data[pos+8:pos+8+size]
  crc=struct.unpack('>I',data[pos+8+size:pos+12+size])[0]
  if zlib.crc32(kind+payload)&0xffffffff!=crc:raise ValueError('PNG CRC mismatch')
  if kind==b'IHDR':
   if seen_header or pos!=8 or size!=13:raise ValueError('Invalid PNG header order')
   width,height,depth,ctype,comp,flt,interlace=struct.unpack('>IIBBBBB',payload)
   if width<=0 or height<=0 or width>12000 or height>12000 or depth!=8 or ctype not in (2,6) or comp or flt or interlace:
    raise ValueError('Unsupported or invalid PNG dimensions/format')
   seen_header=True
  elif kind==b'IDAT':
   if not seen_header:raise ValueError('PNG pixel data before header')
   idat.append(payload)
  elif kind==b'IEND':
   if not idat or size!=0 or pos+12!=len(data):raise ValueError('Missing PNG data or trailing bytes')
   seen_end=True;break
  pos+=12+size
 if not (seen_header and seen_end):raise ValueError('PNG missing required chunks')
 expected=height*(1+width*(3 if ctype==2 else 4))
 if expected>600_000_000:raise ValueError('PNG decoded size too large')
 d=zlib.decompressobj()
 raw=d.decompress(b''.join(idat),expected+1)
 if len(raw)!=expected or not d.eof or d.unused_data:
  raise ValueError('PNG decompressed pixels incomplete or unexpected')
 return [width,height]

def capture(src,lane,out,source_sha=None):
 conf=TASKS[lane];root=Path(src);rows=[]
 source_sha=source_sha or sha(root)
 # Previously committed screenshot assets must not count as this invocation.
 began_ns=time.time_ns()
 for script in conf['scripts']:
  file=root/script
  if not file.is_file():
   rows.append({'lane':lane,'scene':script,'failures':['E2E test script absent']});continue
  env=os.environ.copy();runner=file;browser_portability='unmodified'
  # Change only a transient copy of the author test if its fixed browser path is absent.
  if not Path('/usr/bin/chromium').is_file() and "'/usr/bin/chromium'" in file.read_text():
   from playwright.sync_api import sync_playwright
   with sync_playwright() as p: executable=p.chromium.executable_path
   if not Path(executable).is_file():raise FileNotFoundError('No Chromium available from Playwright')
   runner=file.parent/('.visual-qabrowser-'+file.name)
   runner.write_text(file.read_text().replace("'/usr/bin/chromium'",repr(executable)))
   browser_portability='transient absolute Chromium path substitution in test harness copy'
  try:
   result=subprocess.run([os.environ.get('PYTHON','python'),str(runner)],cwd=root,env=env,capture_output=True,text=True,timeout=240)
  finally:
   if runner!=file:runner.unlink(missing_ok=True)
  log=out/(lane+'-'+file.stem.replace('.','-')+'.log')
  log.write_text('SOURCE_SHA='+str(source_sha)+'\nCOMMAND='+script+'\nEXIT='+str(result.returncode)
    +'\n\nSTDOUT:\n'+result.stdout+'\nSTDERR:\n'+result.stderr)
  rows.append({'lane':lane,'scene':'RUN '+file.name,'sourceBranch':conf['branch'],'sourceSha':source_sha,
   'testExitCode':result.returncode,'testLog':log.name,'browserPortability':browser_portability,
   'failures':[] if result.returncode==0 else ['Original authored browser E2E failed; inspect '+log.name]})
 for folder in conf['dirs']:
  directory=root/folder
  if not directory.is_dir():
   rows.append({'lane':lane,'scene':'SOURCE OUTPUT','failures':['Screenshot folder absent: '+folder]});continue
  for png in sorted(directory.rglob('*.png')):
   if png.stat().st_mtime_ns < began_ns:
    rows.append({'lane':lane,'scene':png.stem,'sourceBranch':conf['branch'],
      'sceneProvenance':'preexisting-pr-artifact','failures':[],
      'warnings':['Previously committed image skipped: not captured by this test invocation']})
    continue
   try:
    data=png.read_bytes()
    if len(data)>30_000_000:raise ValueError('PNG exceeds 30 MB limit')
    dimensions=png_size(data);dest=out/(lane+'-'+png.name);dest.write_bytes(data)
    rows.append({'lane':lane,'scene':png.stem,'sourceBranch':conf['branch'],'sourceSha':source_sha,
     'viewport':png.stem.split('-')[0],'imagePixels':dimensions,'size':dimensions,'dpr':'source-defined',
     'mode':'actual-authored-pointer-E2E','screenshot':dest.name,
     'sha256':hashlib.sha256(data).hexdigest(),'failures':[],'warnings':[]})
   except Exception as e:rows.append({'lane':lane,'scene':png.name,'failures':['Screenshot import failed: '+str(e)]})
 return rows
def main():
 ap=argparse.ArgumentParser(description=__doc__)
 ap.add_argument('--lane',default='all',choices=['all',*TASKS])
 ap.add_argument('--source',action='append',default=[],help='printer=/abs/path or quota=/abs/path')
 ap.add_argument('--out',type=Path,default=Path('qa-artifacts/v3-visual/branch-matrix'))
 ap.add_argument('--selftest',action='store_true',help='Fixture-only test of importer, NOT a real boss')
 args=ap.parse_args()
 # Never let synthetic importer tests replace real browser reports.
 if args.selftest and args.out == Path('qa-artifacts/v3-visual/branch-matrix'):
  args.out = Path('qa-artifacts/v3-visual/_boss-selftest')
 args.out.mkdir(parents=True,exist_ok=True);sources={}
 for item in args.source:
  key,sep,val=item.partition('=')
  if not sep or key not in TASKS:ap.error('Use --source printer=/path or quota=/path')
  sources[key]=Path(val).resolve()
 temp=Path(tempfile.mkdtemp(prefix='night-shift-boss-evidence-'));rows=[]
 if args.selftest:
  selected=temp/'input';(selected/'qa').mkdir(parents=True)
  source=selected/'qa/v3-printer-evidence';source.mkdir()
  def chunk(tag,data):return struct.pack('>I',len(data))+tag+data+struct.pack('>I',zlib.crc32(tag+data)&0xffffffff)
  ihdr=struct.pack('>IIBBBBB',8,8,8,2,0,0,0)
  pix=bytes([0]+[230,180,110]*8)*8
  png=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',ihdr)+chunk(b'IDAT',zlib.compress(pix))+chunk(b'IEND',b'')
  (source/'OLD-committed.png').write_bytes(png)
  (selected/'qa/v3-printer-browser.py').write_text('from pathlib import Path\n'
    'out=Path(__file__).resolve().parent/"v3-printer-evidence"\n'
    'f=out/"1080p-telegraph.png"\n'
    'f.write_bytes((out/"OLD-committed.png").read_bytes())\n'
    'print("FAKE FIXTURE TEST: import validation only")\n')
  TASKS['printer']['branch']='SELFTEST-FIXTURE-NOT-GAME';sources['printer']=selected
  args.lane='printer'
 try:
  lanes=list(TASKS) if args.lane=='all' else [args.lane]
  for lane in lanes:
   src=sources.get(lane)
   if not src:
    src=temp/lane
    result=subprocess.run(['git','clone','-q','--depth=1','--single-branch','--branch',
      TASKS[lane]['branch'],REPO,str(src)],capture_output=True,text=True,timeout=120)
    if result.returncode:
     rows.append({'lane':lane,'scene':'CHECKOUT','failures':['Git clone failed: '+result.stderr]});continue
   if src.is_dir() and src.is_relative_to(temp):
    working=src;source_sha=sha(src)
   else:
    # User-supplied --source is READ-ONLY: authored QA writes screenshots.
    working=temp/(lane+'-work');source_sha=sha(src)
    shutil.copytree(src,working,ignore=shutil.ignore_patterns('.git','node_modules','__pycache__'))
   try:rows.extend(capture(working,lane,args.out,source_sha))
   except subprocess.TimeoutExpired as e:rows.append({'lane':lane,'scene':'E2E TIMEOUT','failures':[str(e)]})
 finally:shutil.rmtree(temp,ignore_errors=True)
 reportpath=args.out/'report.json'
 if reportpath.is_file():
  report=json.loads(reportpath.read_text())
  captures=[r for r in report.get('captures',[]) if not
    (r.get('lane') in TASKS and r.get('mode')=='actual-authored-pointer-E2E')]
 else:
  report={'schema':1,'generatedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),
    'selftest':False,'provenance':'actual-authored-PR-scenes'}
  captures=[]
 report['captures']=captures+rows
 report['selftest']=args.selftest
 report['provenance']='FIXTURE-NOT-GAME' if args.selftest else 'actual-authored-PR-scenes'
 report['bossPhaseCollectedAt']=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())
 reportpath.write_text(json.dumps(report,indent=2)+'\n')
 failures=[r for r in rows if r.get('failures')]
 print(json.dumps({'executed':len([r for r in rows if 'testExitCode' in r]),
   'screenshots':len([r for r in rows if r.get('screenshot')]),
   'errors':len(failures),'report':str(reportpath)},indent=2))
 if failures or not any(r.get('screenshot') for r in rows):raise SystemExit(1)
 if args.selftest:
  assert sum('screenshot' in r for r in rows)==1,'Exactly one NEW screenshot in mock run'
  assert any(r.get('scene')=='OLD-committed' and r.get('sceneProvenance')=='preexisting-pr-artifact' for r in rows)
  assert rows[0]['testExitCode']==0
  print('BOSS_PHASE_IMPORTER_SELFTEST_PASS: fixture-only, fresh PNG, preexisting artifact excluded')
if __name__=='__main__':main()
