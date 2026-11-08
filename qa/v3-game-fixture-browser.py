#!/usr/bin/env python3
"""Real Chromium input/viewport QA for the isolated fixture ONLY. Not a full game test."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import os

root = Path(__file__).resolve().parent.parent
html = (root / 'previews' / 'v3-gameqa.html').read_text(encoding='utf8')
artifacts = root / 'qa-artifacts' / 'v3-game'
artifacts.mkdir(parents=True, exist_ok=True)
chromium_path = os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium')
with sync_playwright() as p:
    kw = dict(args=['--no-sandbox'])
    if Path(chromium_path).exists(): kw['executable_path'] = chromium_path
    browser = p.chromium.launch(**kw)
    for w, h in [(1920, 1080), (2560, 1440), (3840, 2160), (3440, 1440), (650, 800)]:
        page = browser.new_page(viewport={'width': w, 'height': h}, device_scale_factor=1)
        errors = []
        page.on('pageerror', lambda err: errors.append(str(err)))
        # set_content works on environments that disallow localhost/file URL navigation.
        page.set_content(html, wait_until='domcontentloaded')
        page.wait_for_function('!!window.__v3GameQaFixture')
        snapshot = lambda: page.evaluate('window.__v3GameQaFixture.snapshot()')
        s = snapshot()
        assert (s['width'], s['height']) == (w, h)
        box = page.locator('#world').bounding_box()
        assert (round(box['width']), round(box['height'])) == (w, h)
        page.mouse.move(s['paper']['x'], s['paper']['y'])
        page.mouse.down()
        page.mouse.move(s['target']['x'], s['target']['y'], steps=20)
        page.mouse.up()
        assert snapshot()['hits'] == 1, 'Real pointer drag missed drop target'
        page.locator('#pause').click()
        t = snapshot()['clockMs']
        page.wait_for_timeout(220)
        assert snapshot()['clockMs'] == t, 'Gameplay fixture clock advanced while paused'
        page.locator('#pause').click()
        page.locator('#reset').click()
        assert snapshot()['hits'] == 0, 'Reset retained prior hit'
        page.screenshot(path=str(artifacts / f'fixture-{w}x{h}.png'), animations='disabled')
        assert not errors, errors
        print(f'BROWSER_FIXTURE_PASS {w}x{h}: real_drag=1 pause=frozen reset=0 errors=0')
        page.close()
    browser.close()
