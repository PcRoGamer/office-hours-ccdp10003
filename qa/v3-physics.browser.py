"""Real Chromium screenshots and interaction assertions for PHYSICS preview.
Run with: python qa/v3-physics.browser.py
Requires the MIT-licensed vendored Planck bundle and Python Playwright.
"""
import json
import subprocess
import socket
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'qa'/'v3-physics-evidence'
OUT.mkdir(exist_ok=True)

def deliver_form(page, snapshot, form_id):
    """Human-speed pointer route above the two physical bumpers, then into the chute."""
    form=next(body for body in snapshot['sim']['bodies'] if body['id']==form_id)
    scale=snapshot['viewport']['height']/760
    target_x=snapshot['worldWidth']-115
    page.mouse.move(form['x']*scale,form['y']*scale)
    page.mouse.down()
    grabbed=page.evaluate('window.__physicsPreview.snapshot().sim.activeDrag')
    assert grabbed==form_id, f'Pointer hit wrong prop: wanted {form_id}, got {grabbed}'
    # Lifting over machinery keeps the direct filing skill available without
    # suppressing real bumper collision mechanics or faking sensor events.
    for j in range(30):
        a=(j+1)/30
        page.mouse.move((form['x']*(1-a)+target_x*a)*scale,
                        (form['y']*(1-a)+240*a)*scale,steps=1)
        page.wait_for_timeout(25)
    for j in range(22):
        a=(j+1)/22
        page.mouse.move(target_x*scale,(240*(1-a)+635*a)*scale,steps=1)
        page.wait_for_timeout(25)
    # Allow the actual Planck mouse joint to complete a physical arrival.
    page.wait_for_timeout(300)
    page.mouse.up()
    page.wait_for_timeout(300)
with socket.socket() as bound:
    bound.bind(('127.0.0.1',0))
    port=bound.getsockname()[1]
web=subprocess.Popen([sys.executable,'-m','http.server',str(port),'--bind','127.0.0.1', '--directory',str(ROOT)],stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
try:
    time.sleep(1.3)
    all_results=[]
    with sync_playwright() as p:
        cases=[(1920,1080,1),(1920,1080,2),(2560,1440,1),(3840,2160,1),(3440,1440,1),(650,800,1)]
        if len(sys.argv)>1:
            case=sys.argv[1]
            cases=[v for v in cases if f'{v[0]}x{v[1]}@{v[2]}'==case]
            assert cases, f'Unknown viewport {case}'
        for width,height,dpr in cases:
            print('BEGIN CHROMIUM',width,height,dpr,flush=True)
            browser=p.chromium.launch(headless=True)
            page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=dpr)
            errs=[]
            page.on('pageerror',lambda err:errs.append(str(err)))
            page.goto(f'http://127.0.0.1:{port}/previews/v3-physics.html',wait_until='load')
            try:
                page.wait_for_function('window.__physicsPreview?.snapshot()?.sim?.tick >= 1',timeout=12000)
            except Exception:
                print('BROWSER DEBUG',width,height,'PAGE ERRORS',errs,'PLANCK',page.evaluate('typeof window.planck'),'STATE',page.evaluate('JSON.stringify(window.__physicsPreview?.snapshot())?.slice(0,500)'),flush=True)
                raise
            page.wait_for_timeout(250)
            shot=OUT/(f'desk-{width}x{height}' + ('.png' if dpr==1 else f'-dpr{dpr}.png'))
            page.screenshot(path=str(shot),full_page=True)
            s=page.evaluate('window.__physicsPreview.snapshot()')
            assert not errs,f'{width}x{height} errors: {errs}'
            assert s['viewport']['width']==width and s['viewport']['height']==height, s
            assert s['sim']['tick']>0
            assert abs(s['viewport']['dpr']-dpr)<.01, f'DPR mismatch: {s}'
            assert len(s['sim']['bodies'])>=6
            if (width,height,dpr)!=(1920,1080,1):
                all_results.append({'viewport':f'{width}x{height}','shot':shot.name,'errors':errs,'dpr':dpr,'drag_score':'not exercised'})
                print('PASS VISUAL',f'{width}x{height}',flush=True)
                page.close()
                browser.close()
                continue
            # Physical manual drag path into the chute. World coords use H=760.
            s=page.evaluate('window.__physicsPreview.snapshot()')
            deliver_form(page,s,'form-0')
            after=page.evaluate('window.__physicsPreview.snapshot()')
            assert after['score']>=1, f'pointer drag did not register: {width}x{height} {after}'
            # Resize after a real scored physical gesture. This used to erase the run.
            saved_score=after['score']
            saved_unscored={body['id'] for body in after['sim']['bodies'] if body['id'].startswith('form-')}
            page.set_viewport_size({'width':650,'height':800})
            page.wait_for_timeout(280)
            narrow=page.evaluate('window.__physicsPreview.snapshot()')
            assert narrow['score']==saved_score, f'RESIZE LOST SCORE: {narrow}'
            assert {body['id'] for body in narrow['sim']['bodies'] if body['id'].startswith('form-')}==saved_unscored, 'RESIZE LOST LIVE FORMS'
            form_xs=[body['x'] for body in narrow['sim']['bodies'] if body['id'] in saved_unscored]
            assert max(form_xs)-min(form_xs)>180, f'REFLOW PILED UP FOLDER LABELS: {form_xs}'
            assert narrow['viewport']['width']==650 and narrow['viewport']['height']==800
            chute=next(body for body in narrow['sim']['bodies'] if body['id']=='chute')
            assert abs(chute['x']-(narrow['worldWidth']-115))<.1, 'BIN NOT ANCHORED AFTER RESIZE'
            assert narrow['sim']['tick']>after['sim']['tick'], 'PHYSICS STOPPED ON RESIZE'
            page.screenshot(path=str(OUT/'desk-resized-live-650x800.png'))
            # Changing dimensions during pause must not unpause, step or wipe progress.
            page.keyboard.press('Space')
            frozen=page.evaluate('window.__physicsPreview.snapshot()')
            assert frozen['paused']
            page.set_viewport_size({'width':1920,'height':1080})
            page.wait_for_timeout(250)
            reflow=page.evaluate('window.__physicsPreview.snapshot()')
            assert reflow['score']==saved_score and reflow['paused']
            assert reflow['sim']['tick']==frozen['sim']['tick'], 'PHYSICS STEPPED WHILE PAUSED AND RESIZING'
            page.keyboard.press('Space')
            page.wait_for_timeout(100)
            resumed=page.evaluate('window.__physicsPreview.snapshot()')
            assert not resumed['paused'] and resumed['sim']['tick']>frozen['sim']['tick']
            # The remaining forms must remain physically interactable after reflow.
            form=next(body for body in resumed['sim']['bodies'] if body['id'] in saved_unscored)
            deliver_form(page,resumed,form['id'])
            after_reflow=page.evaluate('window.__physicsPreview.snapshot()')
            assert after_reflow['score']>=saved_score+1, f'REFLOWED DESK NOT PLAYABLE: {after_reflow}'
            page.screenshot(path=str(OUT/'desk-reflow-continued-1920x1080.png'))
            # Losing focus should release the active pointer and pause without score edits.
            page.evaluate("window.dispatchEvent(new Event('blur'))")
            blurred=page.evaluate('window.__physicsPreview.snapshot()')
            page.wait_for_timeout(170)
            assert blurred['paused'] and page.evaluate('window.__physicsPreview.snapshot().sim.tick')==blurred['sim']['tick']
            assert blurred['score']==after_reflow['score'], 'BLUR ALTERED SCORE'
            result={'viewport':f'{width}x{height}','shot':shot.name,'drag_score':after['score'],
                    'after_resize_score':narrow['score'],
                    'after_reflow_score':after_reflow['score'],
                    'resize_pause_tick':frozen['sim']['tick'],'errors':errs,'dpr':dpr}
            print('PASS',json.dumps(result));all_results.append(result)
            page.close()
            browser.close()
    result_file=OUT/'browser-results.json'
    if len(sys.argv)>1 and result_file.exists():
        try:
            old=json.loads(result_file.read_text(encoding='utf-8'))
            by_case={(row['viewport'],row.get('dpr',1)):row for row in old}
            for row in all_results: by_case[(row['viewport'],row.get('dpr',1))]=row
            all_saved=list(by_case.values())
        except (ValueError,KeyError,TypeError):
            all_saved=all_results
    else:
        all_saved=all_results
    result_file.write_text(json.dumps(all_saved,indent=2),encoding='utf-8')
    print('PASS REAL CHROMIUM',len(all_results),'viewports')
finally:
    web.terminate();web.wait(timeout=5)
