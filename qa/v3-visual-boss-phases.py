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
import argparse,hashlib,json,os,shutil,struct,subprocess,tempfile,time
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
 if not data.startswith(b'\x89PNG\r\n\x1a\n') or len(data)<24:raise ValueError('Invalid PNG signature/header')
 return list(struct.unpack('>II',data[16:24]))
def capture(src,lane,out):
 conf=TASKS[lane];root=Path(src);rows=[];source_sha=sha(root)
 for script in conf['scripts']:
  file=root/script
  if not file.is_file():
   rows.append({'lane':lane,'scene':script,'failures':['E2E test script absent']});continue
  env=os.environ.copy()
  # The boss authors' own scripts already inline their actual scene code
  # when Chromium's network/file URL navigation is blocked.
  result=subprocess.run([os.environ.get('PYTHON','python'),str(file)],cwd=root,env=env,capture_output=True,text=True,timeout=240)
  log=out/(lane+'-'+file.stem.replace('.','-')+'.log')
  log.write_text('SOURCE_SHA='+str(source_sha)+'\nCOMMAND='+script+'\nEXIT='+str(result.returncode)
    +'\n\nSTDOUT:\n'+result.stdout+'\nSTDERR:\n'+result.stderr)
  rows.append({'lane':lane,'scene':'RUN '+file.name,'sourceBranch':conf['branch'],'sourceSha':source_sha,
   'testExitCode':result.returncode,'testLog':log.name,
   'failures':[] if result.returncode==0 else ['Original authored browser E2E failed; inspect '+log.name]})
 for folder in conf['dirs']:
  directory=root/folder
  if not directory.is_dir():
   rows.append({'lane':lane,'scene':'SOURCE OUTPUT','failures':['Screenshot folder absent: '+folder]});continue
  for png in sorted(directory.rglob('*.png')):
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
 args=ap.parse_args();args.out.mkdir(parents=True,exist_ok=True);sources={}
 for item in args.source:
  key,sep,val=item.partition('=')
  if not sep or key not in TASKS:ap.error('Use --source printer=/path or quota=/path')
  sources[key]=Path(val).resolve()
 temp=Path(tempfile.mkdtemp(prefix='night-shift-boss-evidence-'));rows=[]
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
   try:rows.extend(capture(src,lane,args.out))
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
 report['bossPhaseCollectedAt']=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())
 reportpath.write_text(json.dumps(report,indent=2)+'\n')
 failures=[r for r in rows if r.get('failures')]
 print(json.dumps({'executed':len([r for r in rows if 'testExitCode' in r]),
   'screenshots':len([r for r in rows if r.get('screenshot')]),
   'errors':len(failures),'report':str(reportpath)},indent=2))
 if failures or not any(r.get('screenshot') for r in rows):raise SystemExit(1)
if __name__=='__main__':main()
