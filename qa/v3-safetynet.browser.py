#!/usr/bin/env python3
"""Browser-test only the SAFETYNET report UI, never claim gameplay validation."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / 'previews/v3-safetynet.html').read_text(encoding='utf-8')
OUT = ROOT / 'qa'
DATA = {
    'mode': 'release', 'ready': False,
    'counts': {'pass': 1, 'fail': 1, 'pending': 1},
    'checks': [
        {'status': 'pass', 'category': 'legacy', 'id': 'arcade-office-hd.html', 'detail': 'Preserved'},
        {'status': 'fail', 'category': 'assets', 'id': '/missing.png', 'detail': 'Missing'},
        {'status': 'pending', 'category': 'runtime-evidence', 'id': 'actual-gameplay', 'detail': 'Not verified'},
    ],
}
with sync_playwright() as p:
    chrome = os.getenv('CHROMIUM_PATH')
    browser = p.chromium.launch(headless=True, executable_path=chrome or None, args=['--no-sandbox'])
    desktop = browser.new_page(viewport={'width': 1440, 'height': 900})
    errors = []
    desktop.on('pageerror', lambda err: errors.append(str(err)))
    desktop.set_content(HTML)
    desktop.locator('#file').set_input_files({
        'name': 'safetynet-test.json', 'mimeType': 'application/json',
        'buffer': json.dumps(DATA).encode('utf-8'),
    })
    assert [desktop.locator('#' + k).inner_text() for k in ('pass', 'fail', 'pending')] == ['1', '1', '1']
    assert 'Loaded release report' in desktop.locator('#notice').inner_text()
    desktop.locator('[data-filter="fail"]').click()
    assert desktop.locator('tbody tr').count() == 1
    desktop.locator('[data-filter="all"]').click()
    desktop.screenshot(path=str(OUT / 'v3-safetynet-browser-1440x900.png'), full_page=True)
    mobile = browser.new_page(viewport={'width': 390, 'height': 844})
    mobile.set_content(HTML)
    mobile.locator('#demo').click()
    assert mobile.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    assert mobile.locator('tbody tr td:nth-child(3)').first.get_attribute('data-label') == 'CHECK'
    assert mobile.locator('tbody tr td:nth-child(4)').first.get_attribute('data-label') == 'FINDING'
    mobile.screenshot(path=str(OUT / 'v3-safetynet-browser-390x844.png'), full_page=True)
    assert not errors, errors
    print('BROWSER_PASS report upload, counters, filters, 1440x900 + 390x844, zero page errors')
    browser.close()
