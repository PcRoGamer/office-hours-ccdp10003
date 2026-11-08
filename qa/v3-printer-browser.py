"""Real Chromium pointer and screenshot audit. Run from repository root.
python qa/v3-printer-browser.py; outputs to qa/v3-printer-evidence.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, time, os

ROOT=Path(__file__).resolve().parents[1]
EVIDENCE=ROOT/'qa'/'v3-printer-evidence'
EVIDENCE.mkdir(parents=True,exist_ok=True)
# Browser sandbox forbids local URL navigation. Inlining exactly the same ES-module
# source into the preview HTML preserves the real scene and interaction code.
def preview_inline(directive):
    html=(ROOT/'previews/v3-printer.html').read_text()
    art=(ROOT/'night-shift-v3/bosses/printer/render.js').read_text()
    boss=(ROOT/'night-shift-v3/bosses/printer/index.js').read_text().replace("import { drawPrinterBoss } from './render.js';",'')
    html=html.replace("import {createPrinterMutiny,PRINTER_DIRECTIVES} from '../night-shift-v3/bosses/printer/index.js';",art+'\n'+boss)
    html=html.replace("params.get('directive')||'MOVING_GOALPOSTS'",repr(directive))
    html=html.replace("params.get('mira')==='1'",'true')
    return html
results=[]

def state(p):return p.evaluate('window.__printerQA()')
def advance(p,sec):p.evaluate('s=>{for(let i=0;i<Math.ceil(s/.035);i++)window.__printer.update(.035)}',sec)
def world(p,x,y):return p.evaluate('([x,y])=>window.__printerViewport.worldToScreen(x,y)',[x,y])
def drag(p,a,b):
  x=world(p,*a);y=world(p,*b)
  p.mouse.move(x['x'],x['y']);p.mouse.down();p.mouse.move(y['x'],y['y'],steps=15);p.mouse.up()
def click(p,a):
  x=world(p,*a);p.mouse.click(x['x'],x['y'])
def phase(p,name):
  for i in range(20):
    if state(p)['phase']==name:return
    p.wait_for_timeout(40)
  raise AssertionError(f'Expected {name}, got {state(p)["phase"]}')

def cycle(p,d):
  advance(p,3.35);phase(p,'jam');advance(p,.65);
  drag(p,(-104,105),(-104,239));phase(p,'counter')
  s=state(p)
  if d=='DOUBLE_ENTRY':click(p,(s['feederX'],-28))
  if d=='SPONSORED_WORKFLOW':drag(p,(45,65),(228,65))
  if d=='MANDATORY_COLLABORATION':click(p,(260,153))
  s=state(p);drag(p,(s['packet']['x'],s['packet']['y']),(s['feederX'],50));phase(p,'impact')
  advance(p,1.5)

with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--disable-dev-shm-usage','--no-sandbox'])
  for name,w,h,dpr,directive in [('1920x1080',1920,1080,1,'MOVING_GOALPOSTS'),('650x800',650,800,1,'MANDATORY_COLLABORATION'),('2560x1440',2560,1440,1,'DOUBLE_ENTRY'),('3440x1440',3440,1440,1,'SPONSORED_WORKFLOW'),('3840x2160',1920,1080,2,'FAST_OR_SAFE')]:
    if os.getenv('V3_PRINTER_FILTER') and name!=os.environ['V3_PRINTER_FILTER']:continue
    page=browser.new_page(viewport={'width':w,'height':h},device_scale_factor=dpr,reduced_motion='reduce')
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('console',lambda e:errors.append('console '+e.text) if e.type=='error' else None)
    page.set_content(preview_inline(directive),wait_until='load')
    page.wait_for_function('typeof window.__printerQA==="function"')
    if name in ('1920x1080','650x800'):page.screenshot(path=str(EVIDENCE/f'{name}-poster.png'))
    page.locator('#go').click()
    page.wait_for_timeout(120)
    if name in ('1920x1080','650x800'):page.screenshot(path=str(EVIDENCE/f'{name}-telegraph.png'))
    advance(page,3.35)
    if name in ('1920x1080','650x800','3840x2160'):page.screenshot(path=str(EVIDENCE/f'{name}-jam.png'))
    advance(page,.65)
    drag(page,(-104,105),(-104,239));phase(page,'counter')
    page.screenshot(path=str(EVIDENCE/f'{name}-counter.png'))
    s=state(page)
    if directive=='DOUBLE_ENTRY':click(page,(s['feederX'],-28))
    if directive=='SPONSORED_WORKFLOW':drag(page,(45,65),(228,65))
    if directive=='MANDATORY_COLLABORATION':click(page,(260,153))
    s=state(page)
    drag(page,(s['packet']['x'],s['packet']['y']),(s['feederX'],50));phase(page,'impact')
    if name in ('1920x1080','650x800'):page.screenshot(path=str(EVIDENCE/f'{name}-impact.png'))
    advance(page,1.5)
    if name in ('1920x1080','650x800','2560x1440'):
      for j in range(2):cycle(page,directive)
      assert state(page)['completed'],(name,state(page))
    page.wait_for_timeout(150)
    if state(page)['completed']:page.screenshot(path=str(EVIDENCE/f'{name}-victory.png'))
    r={'viewport':name,'css':[w,h],'dpr':dpr,'directive':directive,'screenshots':len(list(EVIDENCE.glob(f'{name}-*.png'))),'bolts':state(page)['removed'],'manualHits':state(page)['manualHits'],'pageErrors':errors,'backing':[page.locator('canvas').evaluate('e=>e.width'),page.locator('canvas').evaluate('e=>e.height')]}
    assert not errors,r
    results.append(r)
    print(json.dumps(r),flush=True)
    page.close()
  browser.close()

(EVIDENCE/'results.json').write_text(json.dumps(results,indent=2))
print('BROWSER QA PASSED',len(results),'viewports; complete 3-cycle wins where noted; real pointer gestures/screenshots')
