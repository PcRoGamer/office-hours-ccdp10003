"""Standalone real-browser smoke test. Requires python playwright and Chromium.
Run from repo root with: python -m http.server 4173
Then: python qa/v3-intake-browser.py
URL block policies can prevent this test from running; never claim pass in that case.
"""
from playwright.sync_api import sync_playwright
from pathlib import Path
import os
root = Path('qa/v3-intake-browser-evidence')
root.mkdir(parents=True, exist_ok=True)
url=os.environ.get('V3_INTAKE_URL','http://127.0.0.1:4173/previews/v3-intake.html')
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    for w,h,label in [(1920,1080,'1080p'),(2560,1440,'1440p'),(3840,2160,'4k'),(3440,1440,'ultrawide'),(650,800,'portrait')]:
        page=browser.new_page(viewport={'width':w,'height':h},device_scale_factor=1)
        exceptions=[]
        page.on('pageerror',lambda error:exceptions.append(str(error)))
        page.goto(url)
        page.wait_for_function('window.__intakeDebug !== undefined')
        page.get_by_text('CLOCK IN').click()
        page.evaluate("window.__intakeDebug.startCard('I2')")
        page.wait_for_timeout(200)
        state=page.evaluate('window.__intakeDebug.getState()')
        assert state['id']=='I2'
        assert state['canvas']['width']==w and state['canvas']['height']==h
        assert not exceptions,exceptions
        page.screenshot(path=str(root/f'intake-{label}.png'))
        page.close()
    page=browser.new_page(viewport={'width':1280,'height':720})
    page.goto(url)
    page.get_by_text('CLOCK IN').click()
    page.evaluate("window.__intakeDebug.startCard('I2')")
    for x,y in [(446,418),(938,416)]:
        page.mouse.move(x,y)
        page.mouse.down()
        page.mouse.move(637,454,steps=20)
        page.mouse.up()
    assert any(e['type']=='card-complete' for e in page.evaluate('window.__intakeDebug.getState().events'))
    page.close()
    browser.close()
print('BROWSER PASS: 5 viewports and genuine pointer-based I2 completion.')
