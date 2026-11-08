from playwright.sync_api import sync_playwright
import json,os,time,re
ROOT='/mnt/data/quota-work'
html=open(ROOT+'/previews/v3-quota.html').read()
script=re.search(r'<script type="module">(.*?)</script>',html,re.S).group(1)
html=re.sub(r'<script type="module">.*?</script>','',html,flags=re.S)
module=open(ROOT+'/night-shift-v3/bosses/quota/quota.mjs').read().replace('export const','const').replace('export function','function')
script=module+'\n'+script.replace("import {createQuotaBoss} from '../night-shift-v3/bosses/quota/quota.mjs';",'')
OUT='/mnt/data/quota-work/qa/v3-quota-evidence'
os.makedirs(OUT,exist_ok=True)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files','--disable-web-security'])
    for (w,h,dpr,name) in [(1920,1080,1,'1080p'),(3440,1440,1,'ultrawide'),(650,800,1,'narrow'),(1920,1080,2,'dpr2')]:
        page=browser.new_page(viewport={'width':w,'height':h},device_scale_factor=dpr)
        errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content(html);page.add_script_tag(content=script);page.wait_for_timeout(2300)
        state=page.evaluate('window.__QUOTA_STATE')
        page.screenshot(path=f'{OUT}/quota-{name}-bonus.png',full_page=True)
        print(name,json.dumps({'mode':state['mode'],'phase':state['phase'],'canvas':page.locator('canvas').evaluate('(e)=>[e.width,e.height,e.getBoundingClientRect().width,e.getBoundingClientRect().height]'),'errors':errors}))
        page.close()
    browser.close()
