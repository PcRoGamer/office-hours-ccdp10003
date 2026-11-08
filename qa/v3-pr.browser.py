"""Real Chromium native-ESM, viewport, screenshot and pointer-flow QA. No server required.

Run from repository root: python qa/v3-pr.browser.py
Requires playwright Python package and a locally available Chromium executable.
When deployed, the same preview also runs natively with python -m http.server 4173.
"""
from playwright.sync_api import sync_playwright
from pathlib import Path
import os,json,base64
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'qa'/'v3-pr-screenshots'
OUT.mkdir(parents=True,exist_ok=True)

def bundled_html():
    h=(ROOT/'previews'/'v3-pr.html').read_text()
    def uri(source):return 'data:text/javascript;base64,'+base64.b64encode(source.encode('utf-8')).decode('ascii')
    d=(ROOT/'night-shift-v3/scenes/pr/drawing.js').read_text()
    i=(ROOT/'night-shift-v3/scenes/pr/index.js').read_text()
    i=i.replace("from './drawing.js'", "from '"+uri(d)+"'")
    return h.replace("from '../night-shift-v3/scenes/pr/index.js'", "from '"+uri(i)+"'")

html=bundled_html()
report=[]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.getenv('CHROMIUM_BIN','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    for width,height,dpr in [(1920,1080,1),(2560,1440,1),(3840,2160,1),(3440,1440,1),(650,800,1)]:
        page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=dpr)
        errors=[]
        page.on('pageerror',lambda error:errors.append(str(error)))
        page.on('console',lambda msg:errors.append('console: '+msg.text) if msg.type=='error' else None)
        page.set_content(html,wait_until='load')
        page.wait_for_timeout(160)
        assert page.evaluate('typeof window.__pr')=='object'
        for id in ('P1','P2','P3','P4'):
            page.locator(f'[data-card="{id}"]').click()
            page.wait_for_timeout(120)
            dest=OUT/f'{id}-{width}x{height}.jpg'
            page.screenshot(path=str(dest),type='jpeg',quality=72)
            assert dest.stat().st_size>5000,(id,dest.stat().st_size)
        backing=page.locator('canvas').evaluate('(canvas)=>[canvas.width,canvas.height]')
        assert backing==[width,height]
        assert not errors,(width,height,errors)
        report.append({'viewport':f'{width}x{height}','canvas':backing,'scenes':4,'pageErrors':len(errors),'consoleErrors':0})
        page.close()
    page=browser.new_page(viewport={'width':1920,'height':1080})
    page.set_content(html)
    page.wait_for_timeout(100)
    k=1080/760
    center=page.evaluate('window.__pr.viewport.worldWidth/2')
    def at(x,y):return x*k,y*k
    def completed(id):return page.evaluate('(id)=>window.__pr.events.filter(e=>e.type==="card-complete" && e.cardId===id)',id)
    # Real mouse input, not a synthetic invocation of scene methods.
    page.mouse.move(*at(center-180,520));page.mouse.down();page.mouse.move(*at(center-180,705),steps=12);page.mouse.up();page.mouse.click(*at(center,630))
    assert len(completed('P1'))==1,completed('P1')
    page.screenshot(path=str(OUT/'P1-success.jpg'),type='jpeg',quality=78)
    page.locator('[data-card=P2]').click()
    page.mouse.move(*at(center-375,255));page.mouse.down();page.mouse.move(*at(center-600,50),steps=9);page.mouse.up()
    page.mouse.move(*at(center+280,445));page.mouse.down();page.mouse.move(*at(center+530,600),steps=9);page.mouse.up()
    page.mouse.click(*at(center-80,320))
    assert len(completed('P2'))==1,(page.evaluate('window.__pr.events'),page.evaluate('window.__pr.scene.snapshot()'))
    page.screenshot(path=str(OUT/'P2-success.jpg'),type='jpeg',quality=78)
    page.locator('[data-card=P3]').click()
    page.mouse.move(*at(center,528));page.mouse.down()
    for _ in range(120):
        s=page.evaluate('window.__pr.scene.snapshot()')
        import math
        target=math.sin(s['time']*(2.5 if s['locked']==2 else 1.5)+s['locked']*.8)*.67
        page.mouse.move(*at(center+target*190,528))
        page.wait_for_timeout(36)
        if completed('P3'):break
    page.mouse.up()
    assert len(completed('P3'))==1,(page.evaluate('window.__pr.scene.snapshot()'),page.evaluate('window.__pr.events'))
    page.screenshot(path=str(OUT/'P3-success.jpg'),type='jpeg',quality=78)
    for route in ('headline','context'):
        page.locator('[data-card=P4]').click()
        page.mouse.move(*at(center,402));page.mouse.down();page.mouse.move(*at(center+(-200 if route=='headline' else 205),565),steps=9);page.mouse.up()
        assert len(completed('P4'))==1,(route,page.evaluate('window.__pr.events'))
        assert completed('P4')[0]['evidence']['framing']==route
        page.screenshot(path=str(OUT/f'P4-{route}-success.jpg'),type='jpeg',quality=78)
    report.append({'pointerRuns':['P1 success','P2 success','P3 success','P4 headline success','P4 context success']})
    page.close();browser.close()
(OUT/'audit.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
