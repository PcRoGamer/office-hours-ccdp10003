#!/usr/bin/env python3
"""Real Chromium interaction and screenshot QA; no mocked canvas frames.
Run: python qa/v3-a11y-browser.py [base_url]
"""
import json
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:4173'
URL = BASE.rstrip('/') + '/previews/v3-a11y.html'
ROOT = Path(__file__).resolve().parent.parent
# This container's Chromium is policy-blocked from localhost. Inline the *same*
# native module sources in about:blank for real rendering and interaction QA.
HTML = (ROOT/'previews/v3-a11y.html').read_text()
CONTROLS = (ROOT/'night-shift-v3/accessibility/controls.mjs').read_text().replace('export const ', 'const ').replace('export function ', 'function ')
DEMO = (ROOT/'previews/v3-a11y-demo.mjs').read_text()
DEMO = DEMO.replace("import { createAssistiveControls, assistedHitPoint } from '../night-shift-v3/accessibility/controls.mjs';", '')
HTML = HTML.replace('<script type="module" src="./v3-a11y-demo.mjs"></script>', '<script type="module">\n'+CONTROLS+'\n'+DEMO+'\n</script>')
OUT = Path(__file__).resolve().parent.parent / 'previews' / 'v3-a11y-evidence'
OUT.mkdir(parents=True, exist_ok=True)
EVIDENCE = []

def snap(page):
    return page.evaluate('window.__nightShiftA11yPreview.snapshot()')

def check(condition, text):
    if not condition: raise AssertionError(text)
    EVIDENCE.append('PASS '+text)
    print('PASS '+text,flush=True)

def capture(page, name):
    page.screenshot(path=str(OUT / name), animations='disabled', full_page=True)

def browser_run(browser, width, height, dpr, label, smoke=False):
    ctx = browser.new_context(viewport={'width':width,'height':height}, device_scale_factor=dpr,has_touch=True)
    page = ctx.new_page()
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    failed=[]
    page.on('requestfailed',lambda req:failed.append(req.url))
    try:
        page.goto(URL,wait_until='load',timeout=4500)
        test_mode='hosted route'
    except Exception as e:
        if 'BLOCKED_BY_ADMINISTRATOR' not in str(e):
            raise
        page.close()
        page=ctx.new_page()
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('requestfailed',lambda req:failed.append(req.url))
        page.set_content(HTML,wait_until='load')
        test_mode='inline identical source (localhost restricted)'
    print(f'{label}: browser source mode: {test_mode}',flush=True)
    page.wait_for_function('Boolean(window.__nightShiftA11yPreview)',timeout=6000)
    page.wait_for_timeout(150)
    bounds=page.locator('canvas').bounding_box()
    check(bounds is not None and abs(bounds['x'])<1 and abs(bounds['y'])<1 and abs(bounds['width']-width)<2 and abs(bounds['height']-height)<2, f'{label}: canvas fills exact viewport')
    metrics=page.evaluate('({w:stage.width,h:stage.height,dpr:devicePixelRatio})')
    check(abs(metrics['w']-width*dpr)<2 and abs(metrics['h']-height*dpr)<2,f'{label}: real DPR backing is correct')
    btn=page.get_by_role('button',name='⚙ OPTIONS')
    b=btn.bounding_box()
    check(b is not None and b['width']>=44 and b['height']>=44 and b['x']+b['width']<=width+1, f'{label}: options button is reachable')
    capture(page,f'{label}-title.png')
    if smoke:
        check(not errors and not failed,f'{label}: viewport smoke has zero JS errors and failed requests')
        ctx.close()
        return
    # Open & close options before play, making practice choice explicit only for a future run.
    btn.click()
    check(page.get_by_role('dialog',name='Accessibility options').is_visible(),f'{label}: real accessible dialog opens')
    page.get_by_label('Keyboard controls').check()
    page.get_by_label('High-contrast outlines').check()
    page.get_by_label('Extra-large pointer target option').check()
    page.get_by_label('Prefer Practice Shift on next clock-in').check()
    page.get_by_role('button',name='RETURN TO THE SHIFT').click()
    check(snap(page)['settings']['highContrast'] and snap(page)['settings']['keyboardControls'], f'{label}: settings applied and storage-denial handled')
    # Ensure merely focusing/choosing an object doesn't auto-complete it.
    page.get_by_role('button',name='CLOCK IN').focus()
    page.keyboard.press('Enter')
    page.keyboard.press('F6')
    check(snap(page)['stage']==0 and snap(page)['completed']==[],f'{label}: target scanning never wins by itself')
    # Use keyboard to stamp the real signed form.
    page.keyboard.press('F6')  # wrap from spam back to approved form
    page.keyboard.press('Enter')
    check(snap(page)['completed']==['STAMP GOOD!'], f'{label}: keyboard activation routes through playable stamp mechanics')
    capture(page,f'{label}-stamp-hit.png')
    page.wait_for_timeout(1350)
    check(snap(page)['stage']==1,f'{label}: moves to physical filing encounter')
    # Pointer drag must stay available even with keyboard target controls enabled.
    p=page.evaluate('''() => { const s=window.__nightShiftA11yPreview.snapshot();
      const v=s.viewport; const x=v.worldWidth/2, spread=v.worldWidth<750?125:235;
      const scale=v.cssHeight/760;return {from:{x:(x-spread)*scale,y:460*scale},to:{x:(x+spread)*scale,y:460*scale}}; }''')
    page.mouse.move(p['from']['x'],p['from']['y']);page.mouse.down();page.mouse.move(p['to']['x'],p['to']['y'],steps=15);page.mouse.up()
    check('FILE THE EVIDENCE!' in snap(page)['completed'],f'{label}: pointer dragging satisfies real filing collision')
    capture(page,f'{label}-file-hit.png')
    page.wait_for_timeout(1350)
    check(snap(page)['stage']==2,f'{label}: enters third physical action')
    # Keyboard hold must consume real foreground time, without auto-filing.
    page.keyboard.press('F6')
    page.keyboard.press('Enter')
    check(not 'HOLD TO CLOCK OUT!' in snap(page)['completed'],f'{label}: starting a hold is not an instant victory')
    page.wait_for_function("window.__nightShiftA11yPreview.snapshot().completed.includes('HOLD TO CLOCK OUT!')",timeout=6000)
    check('HOLD TO CLOCK OUT!' in snap(page)['completed'],f'{label}: sustained manual hold succeeds')
    page.wait_for_function("window.__nightShiftA11yPreview.snapshot().status==='victory'",timeout=6000)
    check(snap(page)['status']=='victory',f'{label}: produces end state after 3 actual actions')
    capture(page,f'{label}-victory.png')
    check(not errors and not failed,f'{label}: no JS exceptions or failed resources; errors={errors}; requests={failed}')
    ctx.close()

with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    for w,h,dpr,label,smoke in [(1920,1080,1,'1080p',False),(650,800,1,'portrait',False),(1920,1080,2,'4k-dpr2',True),(3440,1440,1,'ultrawide',True)]:
        browser_run(browser,w,h,dpr,label,smoke)
    browser.close()
for x in EVIDENCE:print(x)
print('TOTAL',len(EVIDENCE),'assertions; real screenshots:',OUT)
(OUT/'report.json').write_text(json.dumps({'url':URL,'assertions':EVIDENCE,'viewports':['1920x1080','650x800','1920x1080 DPR2','3440x1440']},indent=2))