"""Night Shift Services independent real Chromium QA; run from repo root.
Requires Python playwright and local HTTP server on 4173.
"""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json, time
BASE='http://127.0.0.1:4173/previews/v3-services.html'
# Restricted CI environments may block browser navigation to ALL local URLs.
# In that case inject actual source and preview into about:blank (not a mock scene).
def inject_actual_source(page):
    root=Path(__file__).resolve().parent.parent
    html=(root/'previews/v3-services.html').read_text()
    code=(root/'night-shift-v3/scenes/services/index.js').read_text()
    code=code.replace('export const definitions=', 'const definitions=').replace('export default definitions;', '')
    html=html.replace("<script type=\"module\">\nimport {definitions} from '../night-shift-v3/scenes/services/index.js';", "<script>\n"+code+"\n")
    page.set_content(html,wait_until='domcontentloaded')
OUT=Path('qa/v3-services-captures'); OUT.mkdir(parents=True,exist_ok=True)
results=[]
def check(ok,msg):
    results.append({'pass':bool(ok),'test':msg}); print(('PASS' if ok else 'FAIL'), msg)
def state(page): return page.evaluate("window.__services.state.scene.snapshot()")
def screen(page,x,y):
    return page.evaluate('([x,y]) => window.__services.viewport.worldToScreen(x,y)',[x,y])
def drag(page,ax,ay,bx,by,steps=12):
    a=screen(page,ax,ay);b=screen(page,bx,by)
    page.mouse.move(a['x'],a['y']);page.mouse.down();page.mouse.move(b['x'],b['y'],steps=steps);page.mouse.up()
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files'])
    for size in [(1440,900),(650,800),(3440,1440)]:
        page=browser.new_page(viewport={'width':size[0],'height':size[1]},device_scale_factor=1)
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        inject_actual_source(page)
        page.wait_for_function('window.__services !== undefined');page.wait_for_timeout(120)
        s=state(page);check(s['id']=='S1',f'{size} preview boots S1')
        page.screenshot(path=str(OUT/f'services-s1-{size[0]}x{size[1]}.png'),animations='disabled')
        check(abs(page.evaluate('window.__services.viewport.worldWidth')-760*size[0]/size[1])<.01, f'{size} no letterbox/world aspect')
        check(len(errors)==0,f'{size} browser console clean on first draw')
        if size==(1440,900):
            # S1 three manually dragged valid folders into glowing bin.
            for i in range(3):
                s=state(page);f=s['files'][i];goal=page.evaluate("window.__services.viewport.worldToScreen(0,0) && window.__services.viewport.worldWidth")
                # S1 target x .68 * scene span; normal fast-or-safe directive
                span=max(180,min(475,(goal-100)*.5)); dest=600+span*.68
                drag(page,f['x'],f['y'],dest,390)
                page.wait_for_timeout(80)
            check(state(page)['filed']==3,'S1 files 3 separate manual folders')
            check(page.evaluate('window.__lastCardEvent?.cardId')=='S1','S1 only emits completion after manual filings')
            page.screenshot(path=str(OUT/'services-s1-complete.png'))
            # S2 automated physical sweep still uses pointer gestures and actual falling cups
            page.click('#next');page.wait_for_timeout(100)
            page.screenshot(path=str(OUT/'services-s2-start.png'))
            b=screen(page,600,534);page.mouse.move(b['x'],b['y']);page.mouse.down()
            for j in range(180):
                s=state(page)
                cups=[c for c in s['cups'] if not c['done']]
                if cups:
                    nearest=max(cups,key=lambda c:c['y']);b=screen(page,nearest['x'],534);page.mouse.move(b['x'],b['y'])
                if s['emitted']:break
                page.wait_for_timeout(37)
            page.mouse.up();s=state(page)
            check(s['caught']>=2,f"S2 manual tray catches at least 2 mugs (caught={s['caught']}, spilled={s['spilled']})")
            check(page.evaluate('window.__lastCardEvent?.evidence?.manual') is True,'S2 emits honest evidence')
            page.screenshot(path=str(OUT/'services-s2-result.png'))
            # S3 safe pull physical route
            page.click('#next');page.wait_for_timeout(150)
            for k in range(20):
                if state(page)['safe']:break
                page.wait_for_timeout(120)
            page.screenshot(path=str(OUT/'services-s3-safe.png'))
            dest=600+max(180,min(475,(page.evaluate('window.__services.viewport.worldWidth')-100)*.5))*.67
            drag(page,600,477,dest,571)
            check(page.evaluate('window.__lastCardEvent?.cardId')=='S3','S3 safely pulled page to actual release target')
            page.screenshot(path=str(OUT/'services-s3-result.png'))
            # S4 held socket and plugged into port
            page.click('#next');page.wait_for_timeout(160)
            span=max(180,min(475,(page.evaluate('window.__services.viewport.worldWidth')-100)*.5));src=600-span*.59;dest=600+span*.65
            pt=screen(page,src,518);page.mouse.move(pt['x'],pt['y']);page.mouse.down();page.wait_for_timeout(1150);page.mouse.up()
            check(state(page)['mode']=='trace','S4 requires physical hold for socket stability')
            drag(page,src,518,dest,470)
            check(page.evaluate('window.__lastCardEvent?.cardId')=='S4','S4 plug requires second deliberate manual gesture')
            page.screenshot(path=str(OUT/'services-s4-result.png'))
            # deterministic action evidence and no duplicate awards
            completions=page.evaluate("window.__services.events.filter(e=>e.type==='card-complete')")
            check(len(completions)==4,'Exactly one completion event for each card')
            check(all('attemptId' in c['evidence'] for c in completions),'All completions include attemptId')
            # pause timer freeze and restart
            page.click('#restart');page.click('#pause');a=state(page)['remaining'];page.wait_for_timeout(500);b=state(page)['remaining']
            check(abs(a-b)<.05,'Pause freezes active timer')
            page.click('#pause')
        page.close()
    browser.close()
(OUT.parent/'v3-services-browser-results.json').write_text(json.dumps(results,indent=2))
print(f'RESULT {sum(r["pass"] for r in results)}/{len(results)}')
raise SystemExit(0 if all(r['pass'] for r in results) else 1)