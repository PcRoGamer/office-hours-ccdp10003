#!/usr/bin/env python3
"""Execute the real Playwright audit against its honest offline test fixture."""
import json
import subprocess
import sys
from pathlib import Path
from tempfile import TemporaryDirectory

ROOT=Path(__file__).resolve().parents[1]
SCRIPT=ROOT/'qa/v3-a11y-audit.py'
FIXTURE=ROOT/'previews/v3-a11y-fixture.html'

def run(*extra):
    with TemporaryDirectory() as tmp:
        args=[sys.executable,str(SCRIPT),'--url','fixture://test', '--html-file', str(FIXTURE), '--fixture', '--out',tmp, *extra]
        p=subprocess.run(args,capture_output=True,text=True,timeout=180)
        results=json.loads((Path(tmp)/'results.json').read_text())
        assert len(results['cases'])==4,results
        assert all((Path(tmp)/(c['tag']+'-title.png')).exists() for c in results['cases'])
        return p,results

p,r=run()
assert p.returncode==0,(p.stdout,p.stderr)
assert r['counts']['FAIL']==r['counts']['UNAVAILABLE']==0,r['counts']
for c in r['cases']:
    for test in ['fullscreen','keyboard-focus','start','pause-clock','mute','pointer-cancel','primary-pointer','reduced-motion','touch-action']:
        matching=[x for x in c['checks'] if x['name']==test]
        assert len(matching)==1 and matching[0]['status']=='PASS',(c['tag'],test,matching)
p2,r2=run('--strict')
assert p2.returncode==1 and r2['counts']['REVIEW']>0,'Strict mode incorrectly claims optional/manual checks passed'
with TemporaryDirectory() as tmp:
    negative=subprocess.run([sys.executable,str(SCRIPT),'--url','http://127.0.0.1:1/not-a-real-game.html','--out',tmp],capture_output=True,text=True,timeout=100)
    bad=json.loads((Path(tmp)/'results.json').read_text())
    assert negative.returncode==1 and bad['counts']['UNAVAILABLE']==4,(negative.stdout,bad['counts'])
print('V3_A11Y_SELFTEST_PASS: 4 real Chromium viewport probes, 9 asserted checks/case; strict and absent-route cases reject false success')
