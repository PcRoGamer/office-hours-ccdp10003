#!/usr/bin/env python3
"""Actual browser rendering and interactive E2E via Chromium set_content. The restricted
container refuses network navigation, so browser-only test flattens the three local
native ES modules into one inline module. No gameplay logic is rewritten by the bundler.
Run: python qa/v3-systems.browser.py (requires Python Playwright and Chromium).
"""
import json,re,sys,threading
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]

def bundle():
    core=(root/'night-shift-v3/systems/core.js').read_text()
    engine=(root/'night-shift-v3/systems/engine.js').read_text()
    effects=(root/'night-shift-v3/systems/effects.js').read_text()
    html=(root/'previews/v3-systems.html').read_text()
    core=core.replace('export ','')
    engine=re.sub(r'^import .*?;\s*','',engine,flags=re.M).replace('export ','')
    effects=re.sub(r'^import .*?;\s*','',effects,flags=re.M).replace('export ','')
    html=re.sub(r'^import .*?;\s*','',html,flags=re.M)
    return html.replace('<script type="module">','<script type="module">'+core+'\n'+engine+'\n'+effects+'\n')

def state(page):
    return page.evaluate('() => { const w=window.__v3SystemsLab; return {stage:w.run.stage, phase:w.run.phase,score:w.run.endingSnapshot,buttons:w.buttons,viewport:w.viewport}}')

def press(page,index=0):
    st=state(page);
    if len(st['buttons'])<=index: raise AssertionError('NO BUTTONS at '+str(st['stage'])+' phase '+str(st['phase'])+' errors '+str(globals().get('ERRORS',[])))
    b=st['buttons'][index]
    page.mouse.click(b['x']+b['w']/2,b['y']+b['h']/2)
    page.wait_for_timeout(70)

def main():
    out=root/'qa';evidence={};errors=[];globals()['ERRORS']=errors;actions=[]
    server=None
    if sys.platform=='win32':
        class Silent(SimpleHTTPRequestHandler):
            def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(root),**kwargs)
            def log_message(self,*args):pass
        server=ThreadingHTTPServer(('127.0.0.1',0),Silent)
        threading.Thread(target=server.serve_forever,daemon=True).start()
    with sync_playwright() as p:
        browser=(p.chromium.launch(channel='msedge',headless=True) if sys.platform=='win32'
                 else p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox']))
        page=browser.new_page(viewport={'width':1920,'height':1080},device_scale_factor=1)
        page.on('pageerror',lambda error:errors.append(str(error)))
        page.on('console',lambda message:errors.append(message.text) if message.type=='error' else None)
        if server: page.goto(f'http://127.0.0.1:{server.server_port}/previews/v3-systems.html')
        else: page.set_content(bundle())
        page.wait_for_function('window.__v3SystemsLab && window.__v3SystemsLab.buttons.length>0')
        def capture(name):
            dest=out/('v3-systems-'+name+'.png');page.screenshot(path=str(dest));evidence[name]=str(dest)
        capture('first-card-1920x1080')
        page.set_viewport_size({'width':650,'height':800});page.wait_for_timeout(200)
        capture('first-card-650x800')
        page.set_viewport_size({'width':1920,'height':1080});page.wait_for_timeout(200)
        cards=0;promotions=0;bosses={'printer':0,'quota':0};packets=0
        page.keyboard.press('Space');t=page.evaluate('window.__v3SystemsLab.run.activeMs');page.wait_for_timeout(150);assert t==page.evaluate('window.__v3SystemsLab.run.activeMs');page.keyboard.press('Space')
        for step in range(110):
            st=state(page);stage=st['stage'];actions.append(f'{stage} phase {st["phase"]}')
            if stage['type']=='victory':break
            if stage['type']=='promotion':
                if promotions==0:capture('promotion-1920x1080')
                promotions+=1;press(page);continue
            if stage['type']=='boss':
                if stage['id']=='quota':
                    if st['phase']==2 and 'quota-1920x1080' not in evidence:capture('quota-1920x1080')
                    required=1 if st['phase']<3 else 2
                    for _ in range(required):press(page);packets+=1
                press(page);bosses[stage['id']]+=1;continue
            if stage['type']=='card':
                id=stage['id'];needs={'I1':5,'I2':2,'I3':3,'I4':3,'S1':3,'S2':3,'S3':1,'S4':1,'P1':2,'P2':2,'P3':1,'P4':1,'T1':3,'T2':1,'T3':1,'T4':2}[id]
                for _ in range(needs):press(page)
                if id=='I1':press(page);press(page)
                cards+=1;continue
            raise AssertionError('unknown stage '+str(stage))
        final=state(page)
        assert final['stage']['type']=='victory',(final['stage'],actions[-4:])
        assert cards==12 and promotions==5 and bosses=={'printer':3,'quota':3} and packets==4,(cards,promotions,bosses,packets)
        assert final['score']['completedCardIds'].__len__()==12 and final['score']['officialScore']>=80
        capture('receipt-1920x1080')
        page.set_viewport_size({'width':650,'height':800});page.wait_for_timeout(350)
        assert state(page)['viewport']['backing']==[650,800]
        capture('receipt-650x800')
        page.set_viewport_size({'width':3840,'height':2160});page.wait_for_timeout(600)
        assert state(page)['viewport']['backing']==[3840,2160]
        capture('receipt-3840x2160')
        assert not errors, errors
        result={'browser':('Microsoft Edge native ES modules via local HTTP' if server else 'Chromium actual Canvas2D preview, inline local module bundle for browser navigation restriction'), 'passed':True,'errors':errors,'screenshots':evidence,'cards':cards,'promotions':promotions,'bossBolts':bosses,'bonusPackets':packets,'scores':{'official':final['score']['officialScore'],'people':final['score']['peopleScore']},'4KBacking':state(page)['viewport']['backing']}
        (out/'v3-systems-browser-evidence.json').write_text(json.dumps(result,indent=2))
        print('BROWSER_SYSTEMS_PASS',json.dumps(result))
        browser.close()
    if server:server.shutdown()
if __name__=='__main__':main()