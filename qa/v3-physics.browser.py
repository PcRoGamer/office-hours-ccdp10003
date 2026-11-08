"""Real Chromium screenshots and interaction assertions for PHYSICS preview.
Run with: python qa/v3-physics.browser.py
Requires the MIT-licensed vendored Planck bundle and Python Playwright.
"""
import json
import subprocess
import socket
import socket
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'qa'/'v3-physics-evidence'
OUT.mkdir(exist_ok=True)
with socket.socket() as bound:
    bound.bind(('127.0.0.1',0))
    port=bound.getsockname()[1]
web=subprocess.Popen([sys.executable,'-m','http.server',str(port),'--bind','127.0.0.1', '--directory',str(ROOT)],stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
try:
    time.sleep(1.3)
    all_results=[]
    with sync_playwright() as p:
        for width,height,dpr in [(1920,1080,1),(2560,1440,1),(3840,2160,1),(3440,1440,1),(650,800,1)]:
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
            shot=OUT/f'desk-{width}x{height}.png'
            page.screenshot(path=str(shot),full_page=True)
            s=page.evaluate('window.__physicsPreview.snapshot()')
            assert not errs,f'{width}x{height} errors: {errs}'
            assert s['viewport']['width']==width and s['viewport']['height']==height, s
            assert s['sim']['tick']>0
            assert len(s['sim']['bodies'])>=6
            if (width,height)!=(1920,1080):
                all_results.append({'viewport':f'{width}x{height}','shot':shot.name,'errors':errs,'dpr':dpr,'drag_score':'not exercised'})
                print('PASS VISUAL',f'{width}x{height}',flush=True)
                page.close()
                browser.close()
                continue
            # Physical manual drag path into the chute. World coords use H=760.
            scale=height/760
            form=next(x for x in s['sim']['bodies'] if x['id']=='form-0')
            to_x=(s['worldWidth']-115)*scale
            to_y=648*scale
            page.mouse.move(form['x']*scale,form['y']*scale)
            page.mouse.down()
            for j in range(10):
                a=(j+1)/10
                page.mouse.move((form['x']*(1-a)+(s['worldWidth']-115)*a)*scale,
                                (form['y']*(1-a)+630*a)*scale,steps=1)
                page.wait_for_timeout(30)
            page.mouse.up()
            page.wait_for_timeout(350)
            after=page.evaluate('window.__physicsPreview.snapshot()')
            assert after['score']>=1, f'pointer drag did not register: {width}x{height} {after}'
            page.keyboard.press('Space')
            frozen=page.evaluate('window.__physicsPreview.snapshot()')
            page.wait_for_timeout(180)
            assert page.evaluate('window.__physicsPreview.snapshot().sim.tick')==frozen['sim']['tick']
            result={'viewport':f'{width}x{height}','shot':shot.name,'drag_score':after['score'],
                    'pause_tick':frozen['sim']['tick'],'errors':errs,'dpr':dpr}
            print('PASS',json.dumps(result));all_results.append(result)
            page.close()
            browser.close()
    (OUT/'browser-results.json').write_text(json.dumps(all_results,indent=2),encoding='utf-8')
    print('PASS REAL CHROMIUM',len(all_results),'viewports')
finally:
    web.terminate();web.wait(timeout=5)
