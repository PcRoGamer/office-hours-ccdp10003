"""Fast real-Chromium regression: scoring evidence, false-chart reversion, fullscreen.
Run from the repository root: python qa/v3-pr.regression-browser.py
Uses real native browser ES modules with data: import URLs, not a flattened script.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import os, json, base64
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'qa'/'v3-pr-screenshots'
OUT.mkdir(exist_ok=True)
html=(ROOT/'previews'/'v3-pr.html').read_text()
def uri(source):return 'data:text/javascript;base64,'+base64.b64encode(source.encode('utf-8')).decode('ascii')
drawing=(ROOT/'night-shift-v3/scenes/pr/drawing.js').read_text()
scenes=(ROOT/'night-shift-v3/scenes/pr/index.js').read_text()
scenes=scenes.replace("from './drawing.js'", "from '"+uri(drawing)+"'")
html=html.replace("from '../night-shift-v3/scenes/pr/index.js'", "from '"+uri(scenes)+"'")
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
        # Directive routes swap on a visible rail; real mouse input must hit the moved CONTEXT target.
        page.evaluate("window.__pr.context.run.directive='moving-goalposts';window.__pr.switchTo('P4')")
        page.wait_for_timeout(2500)
        assert snap()['routeShift']==1,snap()
        page.screenshot(path=str(OUT/f'P4-goalposts-{width}x{height}.jpg'),type='jpeg',quality=70,timeout=10000)
        drag((c,402),(c-210,565))
        assert done()[0]['evidence']['framing']=='context',done()
        assert not errs,errs
        # First-run sponsored P1: open genuine aid, physically discard a fake ad,
        # then manually correct the chart. Neither overlay auto-completes the task.
        page.evaluate("window.__pr.context.run.directive='sponsored-workflow';window.__pr.switchTo('P1')")
        tipx=930 if width>1000 else 465
        page.mouse.click(*at(tipx,300))
        assert snap()['tipOpened'] and snap()['baseline']==1200
        drag((tipx,415),(tipx+(170 if width>1000 else 140),250))
        assert snap()['fakeDismissed']
        page.screenshot(path=str(OUT/f'P1-sponsored-{width}x{height}.jpg'),type='jpeg',quality=70,timeout=10000)
        drag((c-180,520),(c-180,705))
        page.mouse.click(*at(c,630))
        assert done()[0]['evidence']['authoredReferenceMs']==14000
        assert not errs,errs
        # P2 authentic projectile beam-crossing earns precisely one displayed 0.8s shutter extension.
        page.evaluate("window.__pr.switchTo('P2')")
        start=(c-375,230) if width>1000 else (60,230)
        end=(c+150,245) if width>1000 else (380,245)
        drag(start,end)
        cover=snap()
        assert cover['coverBeats']==1 and cover['graceSeconds']==.8,cover
        assert len(page.evaluate('window.__pr.events.filter(e=>e.type==="popup-cover")'))==1
        page.screenshot(path=str(OUT/f'P2-cover-{width}x{height}.jpg'),type='jpeg',quality=70,timeout=10000)
        assert not errs,errs
        results.append({'viewport':f'{width}x{height}','browser':'Chromium','axisReversion':'passed','scoreEvidence':'passed','movingGoalposts':'context caught in moved hitbox','sponsoredWorkflow':'signed help and ad flick verified','popupCover':'real 0.8s bonus','runtimeErrors':errs})
        page.close()
    browser.close()
(OUT/'regression-audit.json').write_text(json.dumps(results,indent=2))
print(json.dumps(results,indent=2))
