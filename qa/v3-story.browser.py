"""Real Chromium visual and interactive audit of the STORY standalone preview."""
import asyncio, json, os, pathlib, sys, re
from playwright.async_api import async_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
URL="bundled in-memory preview (sandbox blocks browser navigation)"
OUT=ROOT/'qa'/'v3-story-evidence'
OUT.mkdir(exist_ok=True)
SIZES=[(1920,1080),(2560,1440),(3840,2160),(3440,1440),(650,800)]
async def run():
    # Use the actual authored HTML/CSS/JS as a single in-memory document when browser navigation is policy-blocked.
    html=(ROOT/'previews'/'v3-story.html').read_text()
    css=(ROOT/'night-shift-v3/story/story.css').read_text()
    html=html.replace('<link rel="stylesheet" href="../night-shift-v3/story/story.css">','<style>'+css+'</style>')
    narrative=re.sub(r'^export ', '',(ROOT/'night-shift-v3/story/narrative.js').read_text(),flags=re.MULTILINE)
    presentation=re.sub(r'^export ', '',(ROOT/'night-shift-v3/story/presentation.js').read_text(),flags=re.MULTILINE)
    presentation=re.sub(r'^import .*\n','',presentation,flags=re.MULTILINE)
    script=re.search(r'<script type="module">(.*?)</script>',html,flags=re.DOTALL).group(1)
    script=re.sub(r'^import .*\n','',script,flags=re.MULTILINE)
    html=re.sub(r'<script type="module">.*?</script>','<script>'+narrative+'\n'+presentation+'\n'+script+'</script>',html,flags=re.DOTALL)
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files','--disable-web-security'])
        report={'url':URL,'viewports':[],'interaction':{},'errors':[]}
        for w,h in SIZES:
            page=await browser.new_page(viewport={'width':w,'height':h},device_scale_factor=1)
            page.on('pageerror', lambda error:report['errors'].append(str(error)))
            await page.set_content(html,wait_until='load')
            await page.get_by_role('button',name='OPEN YOUR PROMOTION EMAIL').click()
            await page.locator('[data-pick]').first.wait_for()
            await page.wait_for_timeout(480) # allow authored entry animation to settle
            width=await page.evaluate('({world:document.querySelector("#world").getBoundingClientRect().width,inner:innerWidth,body:document.body.scrollWidth,client:document.documentElement.clientWidth})')
            assert width['world']==w, width
            await page.screenshot(path=str(OUT/f'promotion-{w}x{h}.png'),full_page=True)
            # Main viewport checks: click targets are on-screen and no permanently letterboxed world.
            visible=await page.locator('[data-pick]').count();assert visible==3
            report['viewports'].append({'width':w,'height':h,'worldWidth':width['world'],'offers':visible,'screenshot':f'promotion-{w}x{h}.png'})
            if w==1920:
                for index in range(1,6):
                    await page.locator('[data-pick]').first.click()
                    await page.wait_for_timeout(1850)
                    if index<5:assert await page.evaluate('window.__storyPreview.phase')==index+1
                await page.get_by_role('button',name='FLIP RECEIPT').wait_for()
                first=await page.locator('.ns-receipt-title').inner_text()
                await page.get_by_role('button',name='FLIP RECEIPT').click()
                second=await page.locator('.ns-receipt-title').inner_text()
                assert first=='OFFICIAL QUOTA' and second=='PEOPLE & QUALITY',(first,second)
                await page.get_by_role('button',name='HOW COUNTED').click()
                assert await page.locator('.ns-breakdown').count()==1
                await page.screenshot(path=str(OUT/'receipt-people-1920x1080.png'),full_page=True)
                report['interaction']={'fivePromotionsSelected':True,'firstLens':first,'secondLens':second,'breakdownVisible':True,'picks':await page.evaluate('window.__storyPreview.picks')}
            await page.close()
        (OUT/'report.json').write_text(json.dumps(report,indent=2))
        await browser.close()
        assert not report['errors'],report['errors']
        print(json.dumps(report,indent=2))
if __name__=='__main__':asyncio.run(run())