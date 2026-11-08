"""Run real Chromium Canvas2D game QA even when browser URL navigation is blocked.

Executes the exact project preview and scene JavaScript in a single in-memory
classic script. Removes only ES module loader syntax, so the existing scene
and preview behavior are exercised unchanged by actual Chromium. Can also
load the normal HTTP page where browser policy permits it.

Run from repo root: python qa/v3-intake-browser.py
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, os, re, sys, traceback

ROOT = Path(__file__).resolve().parent.parent
PREVIEW = ROOT/'previews/v3-intake.html'
MODULE = ROOT/'night-shift-v3/scenes/intake/index.js'
EVIDENCE = ROOT/'qa/v3-intake-browser-evidence'
VIEWPORTS = [(1920,1080,'1080p'), (2560,1440,'1440p'), (3840,2160,'4k'),
             (3440,1440,'ultrawide'), (650,800,'portrait')]
EVIDENCE.mkdir(parents=True, exist_ok=True)


def load_in_memory(page):
    """Navigate nowhere: browser is born on about:blank. Use original HTML/CSS/JS.

    A locked browser can refuse data:, file: and localhost URLs. This loader
    removes only module import/export syntax, not authored game statements.
    Unlike a canvas approximation, page screenshots are actual Chromium output.
    """
    html = PREVIEW.read_text(encoding='utf-8')
    code = MODULE.read_text(encoding='utf-8')
    start = re.search(r'<script\s+type="module">(.*?)</script>', html, flags=re.S)
    assert start, 'missing expected preview module script'
    body = start.group(1)
    assert body.count("from '../night-shift-v3/scenes/intake/index.js'")==1
    body = re.sub(r"^import\s+\{.*?\}\s+from\s+['\"]\.\./night-shift-v3/scenes/intake/index\.js['\"];\s*",'',body,count=1,flags=re.M|re.S)
    code = re.sub(r'\bexport\s+(?=(?:const|function|class)\b)','',code)
    html = html[:start.start()] + html[start.end():]
    page.set_content(html, wait_until='load')
    page.evaluate(code+'\n'+body+'\n//# sourceURL=night-shift-v3/intake-inline-playwright.js')
    page.wait_for_function('window.__intakeDebug !== undefined', timeout=8000)


def launch_browser(p):
    for exe in [None,'/usr/bin/chromium']:
        try:
            opts={'headless':True,'args':['--no-sandbox','--disable-dev-shm-usage']}
            if exe:opts['executable_path']=exe
            return p.chromium.launch(**opts)
        except Exception as exc:
            print(f'Browser unavailable at {exe or "Playwright"}: {str(exc)[:180]}')
    raise RuntimeError('No executable Chromium browser found')


def load(page):
    url = os.environ.get('V3_INTAKE_URL')
    if url:
        try:
            page.goto(url,wait_until='load',timeout=4500)
            page.wait_for_function('window.__intakeDebug !== undefined', timeout=4500)
            return 'served'
        except Exception as exc:
            print('HTTP navigation unavailable, switching to in-memory module loader:',str(exc).splitlines()[0])
    load_in_memory(page)
    return 'in-memory-real-Chromium'


def pointer_action(page, start, end=None, steps=12):
    def toscreen(p):
        state=page.evaluate('window.__intakeDebug.getState()')
        c=state['camera']
        return (p[0]*c['scale']+c['camX'],p[1]*c['scale']+c['camY'])
    sx,sy=toscreen(start)
    page.mouse.move(sx,sy)
    page.mouse.down()
    if end:
        ex,ey=toscreen(end)
        page.mouse.move(ex,ey,steps=steps)
    page.mouse.up()


def assert_page(page, errors, label):
    state = page.evaluate('window.__intakeDebug.getState()')
    assert not errors, (label,errors)
    assert state['canvas']['width']>0 and state['canvas']['height']>0
    return state


def main():
    results={'runtime':'real Chromium Canvas2D','capture_mode':None,'viewports':[],'cards':{},'failures':[]}
    with sync_playwright() as p:
        browser=launch_browser(p)
        for w,h,label in VIEWPORTS:
            context=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1)
            page=context.new_page(); errors=[]
            page.on('pageerror',lambda e: errors.append(str(e)))
            mode=load(page);results['capture_mode']=mode
            page.get_by_role('button',name='CLOCK IN').click()
            page.evaluate("window.__intakeDebug.startCard('I2')")
            page.wait_for_timeout(220)
            state=assert_page(page,errors,label)
            assert state['canvas']=={'width':w,'height':h},state['canvas']
            assert page.locator('canvas').bounding_box()['width']==w
            assert page.locator('canvas').bounding_box()['height']==h
            page.screenshot(path=str(EVIDENCE/f'intake-{label}.png'))
            results['viewports'].append({'label':label,'width':w,'height':h,'canvas':state['canvas'],'mode':mode,'pageerrors':len(errors)})
            context.close()
        # Windows 200% scaling: CSS 1920x1080 must back at physical 3840x2160 exactly once.
        dpi_page=browser.new_page(viewport={'width':1920,'height':1080},device_scale_factor=2)
        dpi_errors=[];dpi_page.on('pageerror',lambda e:dpi_errors.append(str(e)))
        load(dpi_page)
        dpi_page.get_by_role('button',name='CLOCK IN').click()
        dpi_page.evaluate("window.__intakeDebug.startCard('I2')")
        dpi_page.wait_for_timeout(170)
        dpi_state=assert_page(dpi_page,dpi_errors,'4k-DPR2')
        assert dpi_state['canvas']=={'width':3840,'height':2160},dpi_state['canvas']
        dpi_page.screenshot(path=str(EVIDENCE/'intake-4k-dpr2.png'))
        results['viewports'].append({'label':'4k-DPR2','width':1920,'height':1080,'dpr':2,
                                     'canvas':dpi_state['canvas'],'mode':'in-memory-real-Chromium',
                                     'pageerrors':len(dpi_errors)})
        dpi_page.close()
        page=browser.new_page(viewport={'width':1280,'height':720},device_scale_factor=1)
        errors=[];page.on('pageerror',lambda e:errors.append(str(e)));load(page)
        page.get_by_role('button',name='CLOCK IN').click()
        for id in ['I1','I2','I3','I4']:
            page.evaluate('(id) => window.__intakeDebug.startCard(id)',id)
            page.wait_for_timeout(90)
            state=assert_page(page,errors,id)
            page.screenshot(path=str(EVIDENCE/f'intake-{id}-initial.png'))
            results['cards'][id]={'screenshot':f'intake-{id}-initial.png','state':state['scene']}
        # I1: five real browser taps on approved documents, rejecting spam.
        page.evaluate("window.__intakeDebug.startCard('I1')")
        for iteration in range(12):
            state=page.evaluate('window.__intakeDebug.getState()')
            for form in state['scene'].get('forms',[]):
                if form['kind']=='approved' and not form['hit'] and 15<form['x']<1080:
                    idx=int(form['id'].split('-')[-1])
                    pointer_action(page,(form['x']+75,331+(idx%2)*115+50))
            if any(e['type']=='card-complete' for e in page.evaluate('window.__intakeDebug.getState().events')):
                break
            page.evaluate('() => {for(let i=0;i<23;i++)window.__intakeDebug.step(.05)}')
        state=page.evaluate('window.__intakeDebug.getState()')
        results['cards']['I1']['pointer_events']=state['events']
        assert any(e['type']=='card-complete' for e in state['events']),state
        page.screenshot(path=str(EVIDENCE/'intake-I1-cleared.png'))
        # I2: prove a real mouse drag, not just a synthetic scene call.
        page.evaluate("window.__intakeDebug.startCard('I2')")
        state=page.evaluate('window.__intakeDebug.getState()')
        for env in [e for e in state['scene'].get('envelopes',[]) if e['id'].startswith('junk')]:
            pointer_action(page,(env['x']+66,env['y']+40),(637,454),steps=22)
        state=page.evaluate('window.__intakeDebug.getState()')
        results['cards']['I2']['pointer_events']=state['events']
        assert any(e['type']=='card-complete' for e in state['events']),state
        page.screenshot(path=str(EVIDENCE/'intake-I2-cleared.png'))
        # Additional check: I3 real pointer close controls, and I4 continuous path.
        page.evaluate("window.__intakeDebug.startCard('I3')")
        state=page.evaluate('window.__intakeDebug.getState()')
        for x,y in [(217+286-24,235+24),(564+287-24,178+24),(450+306-24,398+24)]:
            pointer_action(page,(x,y))
        state=page.evaluate('window.__intakeDebug.getState()')
        results['cards']['I3']['pointer_events']=state['events']
        assert any(e['type']=='card-complete' for e in state['events']),state
        page.evaluate("window.__intakeDebug.startCard('I4')")
        state=page.evaluate('window.__intakeDebug.getState()')
        points=[(329,490),(577,490),(577,294),(854,294)]
        if points:
            sx,sy=points[0]
            c=state['camera'];page.mouse.move(sx*c['scale']+c['camX'],sy*c['scale']+c['camY']);page.mouse.down()
            for pnt in points[1:]:
                page.mouse.move(pnt[0]*c['scale']+c['camX'],pnt[1]*c['scale']+c['camY'],steps=20)
            page.mouse.up()
            state=page.evaluate('window.__intakeDebug.getState()')
            results['cards']['I4']['pointer_events']=state['events']
            assert any(e['type']=='card-complete' for e in state['events']),state
        assert_page(page,errors,'final')
        browser.close()
    (EVIDENCE/'results.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
    print('BROWSER PASS:', len(results['viewports']), 'actual Chromium viewport captures including 4K DPR2; I1-I4 real mouse completions')
    print('Evidence:',EVIDENCE)
    print(json.dumps({k:v for k,v in results.items() if k!='cards'},indent=2))

if __name__=='__main__':
    main()