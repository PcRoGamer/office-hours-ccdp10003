"""Fast real-Chromium regression: scoring evidence, false-chart reversion, fullscreen.
Run from the repository root: python qa/v3-pr.regression-browser.py
Uses the exact local scene source in an inline browser document when policy blocks URLs.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re, os, json
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'qa'/'v3-pr-screenshots'
OUT.mkdir(exist_ok=True)
html=(ROOT/'previews'/'v3-pr.html').read_text()
drawing=(ROOT/'night-shift-v3/scenes/pr/drawing.js').read_text().replace('export const C','const C').replace('export function ','function ')
scenes=(ROOT/'night-shift-v3/scenes/pr/index.js').read_text()
scenes=re.sub(r'^import .*?;\n','',scenes,flags=re.M).replace('export const definitions','const definitions').replace('export default definitions;','')
html=re.sub(r"import \{definitions\} from '../night-shift-v3/scenes/pr/index.js';",'',html)
html=html.replace('<script type="module">','<script type="module">\n'+drawing+'\n'+scenes+'\n')
results=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path=os.getenv('CHROMIUM_BIN','/usr/bin/chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
    for width,height in [(1920,1080),(650,800)]:
        page=browser.new_page(viewport={'width':width,'height':height})
        errs=[]
        page.on('pageerror',lambda error:errs.append(str(error)))
        page.set_content(html,wait_until='domcontentloaded',timeout=10000)
        page.wait_for_function('!!window.__pr',timeout=10000)
        c=page.evaluate('window.__pr.viewport.worldWidth/2')
        assert page.locator('canvas').evaluate('(canvas)=>[canvas.width,canvas.height]')==[width,height]
        unit=height/760
        def at(x,y):return x*unit,y*unit
        def snap():return page.evaluate('window.__pr.scene.snapshot()')
        def done():return page.evaluate('window.__pr.events.filter(e=>e.type==="card-complete")')
        def drag(start,end):
            page.mouse.move(*at(*start))
            page.mouse.down()
            page.mouse.move(*at(*end),steps=6)
            page.mouse.up()
        drag((c-180,520),(c-180,705))
        assert snap()['baseline']==0,snap()
        drag((c-180,520),(c-180,465))
        assert snap()['baseline']>0 and not snap()['corrected'],snap()
        page.screenshot(path=str(OUT/f'P1-revert-{width}x{height}.jpg'),type='jpeg',quality=65,timeout=10000)
        page.locator('[data-card=P1]').click()
        drag((c-180,520),(c-180,705))
        page.mouse.click(*at(c,630))
        assert len(done())==1,(width,height,snap(),done())
        assert done()[0]['evidence']['authoredReferenceMs']==14000
        page.screenshot(path=str(OUT/f'P1-zero-{width}x{height}.jpg'),type='jpeg',quality=65,timeout=10000)
        for id in ('P2','P3','P4'):
            page.locator(f'[data-card={id}]').click()
            page.wait_for_timeout(30)
            assert not errs,(id,errs)
            assert page.evaluate('window.__pr.scene.snapshot().finished') is False
        results.append({'viewport':f'{width}x{height}','browser':'Chromium','axisReversion':'passed','scoreEvidence':'passed','runtimeErrors':errs})
        page.close()
    browser.close()
(OUT/'regression-audit.json').write_text(json.dumps(results,indent=2))
print(json.dumps(results,indent=2))
