"""Real HD-vs-PR capture audit, preserving provenance and state non-equivalence.

Baseline: CI run 42363190010, artifact 13570517378,
filename fullscreen.png (1440x900 CSS at DPR2).
Set HD_CAPTURE to the extracted real PNG; never use generated concept art.
Use: HD_CAPTURE=/path/to/fullscreen.png python qa/v3-pr.hd-compare.py
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image,ImageDraw
import os,base64,json
ROOT=Path(__file__).resolve().parents[1]
HD=Path(os.environ.get('HD_CAPTURE','/mnt/data/hd-ref/fullscreen.png'))
assert HD.exists(), 'Real HD screenshot required; download CI artifact 13570517378'

def uri(source):return 'data:text/javascript;base64,'+base64.b64encode(source.encode()).decode()
h=(ROOT/'previews/v3-pr.html').read_text()
d=(ROOT/'night-shift-v3/scenes/pr/drawing.js').read_text()
i=(ROOT/'night-shift-v3/scenes/pr/index.js').read_text().replace("from './drawing.js'","from '"+uri(d)+"'")
h=h.replace("from '../night-shift-v3/scenes/pr/index.js'","from '"+uri(i)+"'")
out=ROOT/'qa/v3-pr-hd-comparison';out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path=os.getenv('CHROMIUM_BIN','/usr/bin/chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
  page=browser.new_page(viewport={'width':1440,'height':900},device_scale_factor=2)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(h);page.wait_for_function('!!window.__pr')
  page.locator('[data-card=P1]').click();page.wait_for_timeout(120)
  dest=out/'pr-P1-1440x900-dpr2.png'
  page.screenshot(path=str(dest))
  assert page.locator('canvas').evaluate('(canvas)=>[canvas.width,canvas.height]')==[2880,1800]
  assert not errors,errors
  browser.close()
a=Image.open(HD).convert('RGB');b=Image.open(dest).convert('RGB')
assert a.size==b.size==(2880,1800)
canvas=Image.new('RGB',(1440,520),'#121f21')
for source,index,title in [(a,0,'HD BASELINE | action capture'),(b,1,'PR PREVIEW | P1 initial')]:
  canvas.paste(source.resize((720,450),Image.Resampling.LANCZOS),(720*index,56))
  ImageDraw.Draw(canvas).text((14+720*index,15),title,fill='#f2e9d4')
canvas.save(out/'HD-vs-PR-1440x900-evidence.jpg',quality=89)
metadata={'HD':{'workflow_run':42363190010,'artifact_id':13570517378,'filename':'fullscreen.png'},
 'PR':{'source':'native ES module, real Chromium canvas P1'},
 'cssViewport':[1440,900],'dpr':2,'backing':[2880,1800],
 'visualClaim':'Reference and candidate are different scenes. This comparison measures art direction and layout, NOT same-state visual superiority.',
 'pageErrors':errors}
(out/'comparison.json').write_text(json.dumps(metadata,indent=2))
print(json.dumps(metadata,indent=2))
