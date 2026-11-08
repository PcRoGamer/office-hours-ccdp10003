"""Fast real-browser regression for viewport, truth-preserving axis reversion and score evidence.

    python qa/v3-pr.regression-browser.py

Uses real native browser ES modules with data: import URLs, not a flattened script,
so it works even when local HTTP navigation is administratively restricted.
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
        v=page.evaluate('window.__pr.viewport') if False else page.evaluate('({W:window.__pr.viewport.worldWidth,H:window.__pr.viewport.worldHeight})')
        assert page.locator('canvas').evaluate('(canvas)=>[canvas.width,canvas.height]')==[width,height]
        unit=height/760
        c=v['W']/2
        def at(x,y):return x*unit,y*unit
        def snap():return page.evaluate('window.__pr.scene.snapshot()')
        def done():return page.evaluate('window.__pr.events.filter(e=>e.type==="card-complete")')
        def mouse_drag(start,end):
            page.mouse.move(*at(*start));page.mouse.down();page.mouse.move(*at(*end),steps=6);page.mouse.up()
        # In P1, after reaching zero, dragging the handle upward must undo correction.
        mouse_drag((c-180,520),(c-180,705))
        assert snap()['baseline']==0,snap()
        mouse_drag((c-180,520),(c-180,465))
        assert snap()['baseline']>0 and not snap()['corrected'],snap()
        page.screenshot(path=str(OUT/f'P1-revert-{width}x{height}.jpg'),type='jpeg',quality=65,timeout=10000)
        # Start a new correct run; evidence must carry canonical reference.
        page.locator('[data-card=P1]').click()
        mouse_drag((c-180,520),(c-180,705))
        page.mouse.click(*at(c,630)) if height>900 else page.mouse.click(*at(c,630))
        assert len(done())==1,(width,height,snap(),done())
        assert done()[0]['evidence']['authoredReferenceMs']==14000
        page.screenshot(path=str(OUT/f'P1-zero-{width}x{height}.jpg'),type='jpeg',quality=65,timeout=10000)
        # Make sure stage remains real full bleed and all cards render at both sizes.
        for id in ('P2','P3','P4'):
            page.locator(f'[data-card={id}]').click()
            page.wait_for_timeout(30)
            assert not errs,(id,errs)
            assert page.evaluate('window.__pr.scene.snapshot().finished')==False
        # GDD v3 Moving Goalposts: the report is dropped into CONTEXT after the rail
        # swaps, proving the visible target and the hitbox move as one object.
        page.evaluate("window.__pr.context.run.directive='moving-goalposts';window.__pr.switchTo('P4')")
        page.wait_for_timeout(2500)
        assert snap()['routeShift']==1, snap()
        page.screenshot(path=str(OUT/f'P4-goalposts-{width}x{height}.jpg'),type='jpeg',quality=70,timeout=10000)
        mouse_drag((c,402),(c-210,565))
        assert done()[0]['evidence']['framing']=='context',done()
        assert not errs,errs
        # Sponsored first-run P1: distinguish verified help from a paid advert,
        # discard the advert, and still manually set the zero baseline and stamp.
        page.evaluate("window.__pr.context.run.directive='sponsored-workflow';window.__pr.switchTo('P1')")
        tipx=930 if width>1000 else 465
        page.mouse.click(*at(tipx,300))
        assert snap()['tipOpened'] and snap()['baseline']==1200
        mouse_drag((tipx,415),(tipx+(170 if width>1000 else 140),250))
        assert snap()['fakeDismissed']
        page.screenshot(path=str(OUT/f'P1-sponsored-{width}x{height}.jpg'),type='jpeg',quality=70,timeout=10000)
        mouse_drag((c-180,520),(c-180,705))
        page.mouse.click(*at(c,630))
        assert done()[0]['evidence']['authoredReferenceMs']==14000
        assert not errs,errs
        # P2's projectile sweeps the beam during the drag and earns exactly one
        # physically shown +0.8s shutter (not fabricated pace improvement).
        page.evaluate("window.__pr.switchTo('P2')")
        start=(c-375,230) if width>1000 else (60,230)
        end=(c+150,245) if width>1000 else (380,245)
        mouse_drag(start,end)
        cover=snap()
        assert cover['coverBeats']==1 and cover['graceSeconds']==.8,cover
        assert len(page.evaluate('window.__pr.events.filter(e=>e.type==="popup-cover")'))==1
        page.screenshot(path=str(OUT/f'P2-cover-{width}x{height}.jpg'),type='jpeg',quality=70,timeout=10000)
        assert not errs,errs
        # A second guaranteed PR card must visibly change for Moving Goalposts.
        page.evaluate("window.__pr.context.run.directive='moving-goalposts';window.__pr.switchTo('P1')")
        page.wait_for_timeout(2500)
        assert snap()['sendShift']==1,snap()
        page.screenshot(path=str(OUT/f'P1-goalposts-{width}x{height}.jpg'),type='jpeg',quality=70,timeout=10000)
        mouse_drag((c-180,520),(c-180,705))
        page.mouse.click(*at(c,630))
        assert len(done())==0,'old SEND hitbox still live after moved chute'
        offset=min(125,v['W']*.17)
        page.mouse.click(*at(c+offset,630))
        assert done()[0]['outcome']=='success',done()
        # P4 must report only actual logged colleague outcomes.
        page.evaluate("window.__pr.context.run.directive=null;window.__pr.context.run.miraIncident=null;window.__pr.context.run.eventLedger=[{kind:'worker',objectId:'mira-workstation',outcome:'not-helped',committed:true}];window.__pr.switchTo('P4')")
        assert snap()['miraOutcome']=='interrupted',snap()
        page.screenshot(path=str(OUT/f'P4-evidence-{width}x{height}.jpg'),type='jpeg',quality=70,timeout=10000)
        assert not errs,errs
        # Double Entry is a two-object physical mechanic in BOTH guaranteed PR cards.
        page.evaluate("window.__pr.context.run.directive='double-entry';window.__pr.switchTo('P1')")
        mouse_drag((c-180,520),(c-180,705))
        page.mouse.click(*at(c,630))
        assert snap()['awaitCopy'] and not done()
        page.screenshot(path=str(OUT/f'P1-double-entry-{width}x{height}.jpg'),type='jpeg',quality=70,timeout=10000)
        copy_x=c-min(205,v['W']*.29)
        page.mouse.click(*at(copy_x,630))
        assert done()[0]['evidence']['linkedCopy'] is True,done()
        page.evaluate("window.__pr.switchTo('P4')")
        mouse_drag((c,402),(c-210,565))
        assert snap()['pendingCopy']=='headline' and not done()
        page.screenshot(path=str(OUT/f'P4-double-entry-{width}x{height}.jpg'),type='jpeg',quality=70,timeout=10000)
        mouse_drag((c,402),(c+205,565))
        assert not done(),'wrong linked destination should not commit'
        mouse_drag((c,402),(c-210,565))
        assert done()[0]['evidence']['linkedCopy'] is True,done()
        assert not errs,errs
        # FAST OR SAFE: narrow one-tap finish and broad slower human hold.
        page.evaluate("window.__pr.context.run.directive='fast-or-safe';window.__pr.switchTo('P1')")
        page.screenshot(path=str(OUT/f'P1-fast-safe-{width}x{height}.jpg'),type='jpeg',quality=70,timeout=10000)
        mouse_drag((c-180,520),(c-180,705))
        page.mouse.click(*at(c+46,630))
        assert done()[0]['evidence']['route']=='fast',done()
        page.evaluate("window.__pr.switchTo('P1')")
        mouse_drag((c-180,520),(c-180,705))
        safex=c-min(205,min(1060,max(320,v['W']-26))*.29)
        page.mouse.move(*at(safex,630));page.mouse.down()
        page.wait_for_timeout(740)
        page.mouse.up()
        assert done()[0]['evidence']['route']=='safe',done()
        page.evaluate("window.__pr.switchTo('P4')")
        page.screenshot(path=str(OUT/f'P4-fast-safe-{width}x{height}.jpg'),type='jpeg',quality=70,timeout=10000)
        routeW=min(360,(min(1060,max(320,v['W']-26))-50)/2)
        mouse_drag((c,402),(c+routeW/2+11,565))
        assert snap()['safeWait']>0 and not done()
        page.wait_for_timeout(760)
        assert done()[0]['evidence']['framing']=='context',done()
        assert not errs,errs
        # MANDATORY COLLABORATION offers real optional route improvement; never autoplay.
        page.evaluate("window.__pr.context.run.directive='mandatory-collaboration';window.__pr.switchTo('P1')")
        page.mouse.click(*at(c+172,630))
        assert snap()['miraHelped'] and snap()['baseline']==750 and not done()
        page.screenshot(path=str(OUT/f'P1-collaboration-{width}x{height}.jpg'),type='jpeg',quality=70,timeout=10000)
        mouse_drag((c-180,520),(c-180,705));page.mouse.click(*at(c,630))
        assert done()[0]['outcome']=='success'
        page.evaluate("window.__pr.switchTo('P4')")
        cardW=min(360,min(1060,max(320,v['W']-26))*.62)
        helperW=94 if v['W']<820 else 138
        page.mouse.click(*at(c+cardW/2+12+helperW/2,376))
        assert snap()['miraHelped'] and not done()
        page.screenshot(path=str(OUT/f'P4-collaboration-{width}x{height}.jpg'),type='jpeg',quality=70,timeout=10000)
        mouse_drag((c,402),(c+routeW/2+11,660))
        assert done()[0]['evidence']['framing']=='context',done()
        assert not errs,errs
        # Sponsored Workflow physically obscures genuine help in P2 until an ad moves.
        page.evaluate("window.__pr.context.run.directive='sponsored-workflow';window.__pr.switchTo('P2')")
        page.mouse.click(*at(c-80,320))
        assert not snap()['opened'] and not snap()['sponsorUnlocked'],snap()
        page.screenshot(path=str(OUT/f'P2-sponsored-masked-{width}x{height}.jpg'),type='jpeg',quality=70,timeout=10000)
        first=(c-375,255) if width>1000 else (60,230)
        end=(c-600,50) if width>1000 else (30,80)
        mouse_drag(first,end)
        assert snap()['sponsorUnlocked'],snap()
        page.mouse.click(*at(c-80,320))
        assert snap()['opened'],snap()
        page.screenshot(path=str(OUT/f'P2-sponsored-revealed-{width}x{height}.jpg'),type='jpeg',quality=70,timeout=10000)
        assert not errs,errs
        results.append({'viewport':f'{width}x{height}','browser':'Chromium','axisReversion':'passed','scoreEvidence':'passed','movingGoalposts':'context caught in moved hitbox','sponsoredWorkflow':'signed help and ad flick verified','popupCover':'real 0.8s bonus','P1Goalpost':'moved send hitbox confirmed','P4Evidence':'committed worker incident loaded','doubleEntry':'two physical linked-object routes','fastOrSafe':'real narrow/hold/delayed routes','collaboration':'optional physical assist never auto-completes','P2Sponsored':'signed help physically revealed by fake ad removal','runtimeErrors':errs})
        page.close()
    browser.close()
(OUT/'regression-audit.json').write_text(json.dumps(results,indent=2))
print(json.dumps(results,indent=2))
