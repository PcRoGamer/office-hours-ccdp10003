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
            # FAST OR SAFE is a tactile choice, not an invisible numerical modifier.
            page.click('#restart');page.wait_for_timeout(70)
            sp=max(180,min(475,(page.evaluate('window.__services.viewport.worldWidth')-100)*.5))
            fp=screen(page,600-sp*.36,366);page.mouse.click(fp['x'],fp['y'])
            check(state(page)['route']=='fast' and state(page)['trayWidth']==125,'S2 fast route physically selects narrow high-speed tray')
            ap=screen(page,600+sp*.36,366);page.mouse.click(ap['x'],ap['y'])
            check(state(page)['route']=='safe' and state(page)['trayWidth']==230,'S2 safe route physically selects wide slow tray')
            page.screenshot(path=str(OUT/'services-s2-route-choice.png'))
            # S3 safe pull physical route
            page.click('#next');page.wait_for_timeout(150)
            for k in range(20):
                if state(page)['safe']:break
                page.wait_for_timeout(120)
            page.screenshot(path=str(OUT/'services-s3-safe.png'))
            # Fast route = closer, smaller target; safe route = wider but farther.
            dest=600+max(180,min(475,(page.evaluate('window.__services.viewport.worldWidth')-100)*.5))*.30
            drag(page,600,477,dest,545)
            check(page.evaluate('window.__lastCardEvent?.cardId')=='S3','S3 safely pulled page to actual release target')
            check(page.evaluate('window.__lastCardEvent?.evidence?.route')=='fast','S3 fast route is a smaller nearer physical target')
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
            # Double Entry changes S1 from one drop per file to a second linked physical chute.
            page.select_option('#directive','double-entry');page.evaluate('window.__services.load(0)')
            w=page.evaluate('window.__services.viewport.worldWidth')
            sp=max(180,min(475,(w-100)*.5));folder=state(page)['files'][0]
            drag(page,folder['x'],folder['y'],600+sp*.68,390)
            ss=state(page);check(ss['secondary'] and ss['filed']==0,'S1 double entry requires a linked carbon chute before filing credit')
            drag(page,600-sp*.52,480,600+sp*.68,515)
            check(state(page)['filed']==1 and not state(page)['secondary'],'S1 linked second destination resolves exactly one original folder')
            # Double Entry S4 requires an explicit human verification gesture.
            page.evaluate('window.__services.load(3)')
            sx=600-sp*.59;px=600+sp*.65;pp=screen(page,sx,518)
            page.mouse.move(pp['x'],pp['y']);page.mouse.down();page.wait_for_timeout(1100);page.mouse.up()
            drag(page,sx,518,px,470)
            check(state(page)['mode']=='verify' and not state(page)['emitted'],'S4 linked verification cannot be bypassed by plugging the cable')
            pp=screen(page,sx,518);page.mouse.click(pp['x'],pp['y'])
            check(state(page)['emitted'] and page.evaluate('window.__lastCardEvent?.evidence?.method')=='socket-hold-trace+verification','S4 double-entry verification is a separate physical gesture')
            # A failed restart pulse in moving-goalposts repositions the actual cable port.
            page.select_option('#directive','moving-goalposts');page.evaluate('window.__services.load(3)')
            pp=screen(page,sx,518);page.mouse.move(pp['x'],pp['y']);page.mouse.down();page.wait_for_timeout(1100);page.mouse.up()
            check(state(page)['mode']=='trace','S4 moving-goalposts holds before restart test')
            page.evaluate('''() => {for(let i=0;i<165;i++)window.__services.state.scene.update(.05)}''')
            check(abs(state(page)['goalShift'])>.01 and state(page)['mode']=='hold','S4 timed restart visibly moves target port for next physical try')
            # Sponsored-workflow popups are physical movable obstructions, never free progression.
            page.select_option('#directive','sponsored-workflow')
            page.evaluate('window.__services.load(1)')
            s=state(page);check(s['couponVisible'] and not s['emitted'],'S2 sponsored fake coupon begins covering the mug catch zone')
            drag(page,600,521,390,405)
            s=state(page);check(not s['couponVisible'] and not s['emitted'],'S2 sponsor coupon moved away by player, no automatic score')
            page.screenshot(path=str(OUT/'services-s2-sponsored-dismissed.png'))
            page.evaluate('window.__services.load(2)');page.wait_for_timeout(80)
            s=state(page);check(s['adVisible'] and not s['emitted'],'S3 sponsored interruption begins physically in front of release paper')
            drag(page,600,477,390,403)
            s=state(page);check(not s['adVisible'] and not s['emitted'],'S3 fake toner advertisement physically dismissed, task remains')
            page.screenshot(path=str(OUT/'services-s3-sponsored-dismissed.png'))
            # Double Entry requires a second human action, without new reward objects.
            page.select_option('#directive','double-entry');page.evaluate('window.__services.load(2)')
            page.wait_for_function('window.__services.state.scene.snapshot().safe')
            goal=600+max(180,min(475,(page.evaluate('window.__services.viewport.worldWidth')-100)*.5))*.67
            drag(page,600,477,goal,571)
            s=state(page);check(s['confirm'] and not s['emitted'],'S3 double-entry second confirmation cannot auto-complete')
            pseal=screen(page,goal,571);page.mouse.click(pseal['x'],pseal['y'])
            check(state(page)['emitted'] and page.evaluate('window.__lastCardEvent?.evidence?.method')=='page-pull+carbon-confirm','S3 double-entry requires real human seal tap')
            # Moving goalposts shifts a real target only when a safe window begins.
            page.select_option('#directive','moving-goalposts');page.evaluate('window.__services.load(2)')
            page.wait_for_function('window.__services.state.scene.snapshot().safe')
            check(abs(state(page)['goalShift'])>.001,'S3 moving-goalposts shifts release target after safe telegraph')
            # Mandatory collaboration offers optional helper but does not complete work.
            page.select_option('#directive','mandatory-collaboration');page.evaluate('window.__services.load(3)')
            span=max(180,min(475,(page.evaluate('window.__services.viewport.worldWidth')-100)*.5))
            helper=screen(page,600+span*.65,320);page.mouse.click(helper['x'],helper['y'])
            s=state(page);check(s['helper'] and not s['emitted'],'S4 Jules helper lowers hold threshold but cannot complete cable')
            source=600-span*.59;port=600+span*.65
            held=screen(page,source,518);page.mouse.move(held['x'],held['y']);page.mouse.down();page.wait_for_timeout(690);page.mouse.up()
            check(state(page)['mode']=='trace','S4 assistance materially shortens real hold time')
            drag(page,source,518,port,470)
            check(state(page)['emitted'],'S4 assisted job still requires separate player plug action')
            # Mandatory-collaboration coffee return must be a visible recovered object.
            page.evaluate('window.__services.load(1)')
            for k in range(235):
                if state(page)['spilled']>=1:break
                page.wait_for_timeout(50)
            prior=state(page)
            mira=screen(page,600+span*.94,397);page.mouse.click(mira['x'],mira['y'])
            after=state(page)
            check(prior['spilled']>=1 and after['helpUsed'] and after['spilled']==prior['spilled']-1,'S2 Mira returns one real spilled mug with new physical trajectory')
            check(not after['emitted'],'S2 Mira help never auto-clears the encounter')
            page.screenshot(path=str(OUT/'services-s2-mira-return.png'))
        page.close()
    browser.close()
(OUT.parent/'v3-services-browser-results.json').write_text(json.dumps(results,indent=2))
print(f'RESULT {sum(r["pass"] for r in results)}/{len(results)}')
raise SystemExit(0 if all(r['pass'] for r in results) else 1)