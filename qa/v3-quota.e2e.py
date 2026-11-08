from playwright.sync_api import sync_playwright
from pathlib import Path
import re,json,time
root=Path(__file__).resolve().parents[1]
html=(root/'previews/v3-quota.html').read_text()
script=re.search(r'<script type="module">(.*?)</script>',html,re.S).group(1)
html=re.sub(r'<script type="module">.*?</script>','',html,flags=re.S)
module=(root/'night-shift-v3/bosses/quota/quota.mjs').read_text().replace('export const','const').replace('export function','function')
script=module+'\n'+script.replace("import {createQuotaBoss} from '../night-shift-v3/bosses/quota/quota.mjs';",'')
evidence=root/'qa/v3-quota-evidence'
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 page=b.new_page(viewport={'width':1920,'height':1080},device_scale_factor=1)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(html);page.add_script_tag(content=script)
 def state():return page.evaluate('window.__QUOTA_STATE')
 def await_mode(m,timeout=8000):
  page.wait_for_function('(m)=>window.__QUOTA_STATE?.mode===m',arg=m,timeout=timeout)
 def drag(a,b):
  s=state();wp=s['targets'];R=page.locator('canvas').bounding_box();W=760*R['width']/R['height']
  src=wp[a] if isinstance(a,str) else a;dst=wp[b] if isinstance(b,str) else b
  cv=lambda q:(R['x']+q['x']/W*R['width'],R['y']+q['y']/760*R['height'])
  ax,ay=cv(src);bx,by=cv(dst)
  page.mouse.move(ax,ay);page.mouse.down();page.mouse.move(bx,by,steps=6);page.mouse.up();page.wait_for_timeout(110)
 def click(a):
  s=state();R=page.locator('canvas').bounding_box();q=s['targets'][a];W=760*R['width']/R['height']
  page.mouse.click(R['x']+q['x']/W*R['width'],R['y']+q['y']/760*R['height'])
 def shot(name):page.screenshot(path=str(evidence/('quota-e2e-'+name+'.png')),full_page=True)
 await_mode('bonus',5000);shot('bonus-first')
 drag('bonus','file');await_mode('telegraph');await_mode('recovery');shot('recovery')
 drag('strip','stripTo');await_mode('verify');click('seal');await_mode('opening');shot('gear-first');drag('counter','gear');await_mode('counter-hit');await_mode('bonus');assert state()['phase']==2
 drag('bonus','cool');await_mode('ads');shot('ads');drag('fake','trash');await_mode('verify');click('seal');await_mode('opening');drag('counter','gear');await_mode('counter-hit');await_mode('bonus');assert state()['phase']==3
 drag('bonus','file');await_mode('route');shot('route');
 while state()['clockSeconds']%4.1<1.15:page.wait_for_timeout(150)
 drag('doc','safe');await_mode('bonus');shot('bonus-fourth');drag('bonus','cool');await_mode('latch');drag('latch','latchTo');await_mode('verify');click('seal');await_mode('opening');shot('gear-last');drag('counter','gear');await_mode('counter-hit');await_mode('clockout');shot('clockout');drag('stamp','stampTo');await_mode('complete');shot('complete');s=state();print('BROWSER WIN:',json.dumps({key:s[key] for key in ['phase','mode','boltsRemoved','bonusOutcomes','bonusCorporatePoints','pressure','activeTimeMs']}));print('EVENTS:',json.dumps(page.evaluate('window.__QUOTA_EVENTS().map(x=>({type:x.type,id:x.objectId,outcome:x.outcome,delta:x.delta}))')));print('ERRORS',errors);assert not errors
 b.close()
