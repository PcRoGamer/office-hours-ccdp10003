"""Chromium story quality gate, including real screenshot inspection targets and HTTP asset checks."""
import asyncio,functools,http.server,json,pathlib,re,threading,urllib.request
from playwright.async_api import async_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'qa'/'v3-story-evidence';OUT.mkdir(exist_ok=True)
SIZES=[(1440,900),(1920,1080),(2560,1440),(3840,2160),(3440,1440),(650,800),(390,844)]
def served_assets():
    handler=functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(ROOT))
    server=http.server.ThreadingHTTPServer(('127.0.0.1',0),handler)
    thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
    try:
        result={}
        for path in ['previews/v3-story.html','night-shift-v3/story/presentation.js','night-shift-v3/story/narrative.js','night-shift-v3/story/actors.js','night-shift-v3/story/clockout.js','night-shift-v3/story/story.css']:
            with urllib.request.urlopen(f'http://127.0.0.1:{server.server_port}/{path}',timeout=3) as response:
                body=response.read()
                assert response.status==200 and body==(ROOT/path).read_bytes(),path
                result[path]=len(body)
        return result
    finally:server.shutdown();server.server_close()
def bundle():
    html=(ROOT/'previews/v3-story.html').read_text()
    css=(ROOT/'night-shift-v3/story/story.css').read_text()
    html=html.replace('<link rel="stylesheet" href="../night-shift-v3/story/story.css">','<style>'+css+'</style>')
    chunks=[]
    for p in ['narrative.js','actors.js','clockout.js','presentation.js']:
        s=(ROOT/'night-shift-v3/story'/p).read_text()
        s=re.sub(r'^import .*\n','',s,flags=re.MULTILINE)
        s=re.sub(r'^export ','',s,flags=re.MULTILINE)
        chunks.append(s)
    match=re.search(r'<script type="module">(.*?)</script>',html,flags=re.S)
    assert match
    script=re.sub(r'^import .*\n','',match.group(1),flags=re.M)
    return html[:match.start()]+'<script>'+'\n'.join(chunks)+'\n'+script+'</script>'+html[match.end():]
async def main():
    report={'source':'Exact production STORY source rendered as executable HTML because Chromium local navigation is policy-blocked','httpAssets':served_assets(),'viewports':[],'interactions':{},'errors':[]}
    html=bundle()
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
        for w,h in SIZES:
            page=await browser.new_page(viewport={'width':w,'height':h})
            page.on('pageerror',lambda e:report['errors'].append(str(e)))
            await page.set_content(html,wait_until='load')
            await page.get_by_role('button',name='OPEN YOUR PROMOTION EMAIL').click()
            await page.locator('[data-pick]').first.wait_for()
            await page.wait_for_timeout(320)
            layout=await page.evaluate("""() => {
                const b=e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height}};
                return {panel:b(document.querySelector('.ns-promote')),world:b(document.querySelector('#world')),
                   mail:b(document.querySelector('.ns-mail')),book:b(document.querySelector('.ns-book')),
                   cast:document.querySelector('.ns-cast').getBoundingClientRect().height,
                   upgradeBoxes:[...document.querySelectorAll('[data-pick]')].map(b),
                   previews:[...document.querySelectorAll('[data-demo]')].map(b),
                   scrollWidth:document.documentElement.scrollWidth,dialogScrollHeight:document.querySelector('.ns-panel').scrollHeight,dialogClientHeight:document.querySelector('.ns-panel').clientHeight,viewport:innerWidth};}""")
            assert layout['world']['width']==w,('world',w,layout)
            assert layout['scrollWidth']<=w,('horizontal overflow',w,layout)
            assert len(layout['upgradeBoxes'])==3
            for i,box in enumerate(layout['upgradeBoxes']):
                assert box['width']>=100 and box['height']>=100,(w,'small upgrade',i,box)
                assert box['left']>=-1 and box['right']<=w+1,(w,'offscreen upgrade',i,box)
            if w==1440:
                assert layout['dialogScrollHeight']<=layout['dialogClientHeight']+1,('clipped laptop intermission',layout)
            if w==1920:
                assert layout['panel']['width']/w>.80,('desktop insufficient coverage',layout)
                assert min(x['width'] for x in layout['previews'])>=220,('tiny previews',layout)
                assert layout['cast']>=160,('animated theatre missing',layout)
            if w==3440: assert layout['panel']['width']>=2000,('ultrawide window postage stamp',layout)
            if w==650:
                assert layout['book']['top']-layout['mail']['bottom']<=5,('dead vertical gap',layout)
                assert max(x['bottom'] for x in layout['upgradeBoxes'])<=h-50,('offers not visible',layout)
                assert layout['panel']['bottom']<=h,('dialog clipped',layout)
            await page.screenshot(path=str(OUT/f'promotion-{w}x{h}.png'),full_page=True)
            report['viewports'].append({'size':f'{w}x{h}','layout':layout,'pass':True})
            if w==1920:
                await page.locator('[data-pick]').first.click()
                assert await page.locator('.ns-machine-install').count()==1
                await page.wait_for_timeout(390)
                await page.screenshot(path=str(OUT/'machine-install-1920x1080.png'))
                await page.wait_for_timeout(1350)
                for index in range(2,6):
                    await page.locator('[data-pick]').first.click()
                    await page.wait_for_timeout(1780)
                assert await page.locator('.ns-receipt-title').inner_text()=='OFFICIAL QUOTA'
                official=await page.locator('.ns-receipt-score').inner_text()
                await page.locator('.ns-receipt').click()
                assert await page.locator('.ns-receipt-title').inner_text()=='PEOPLE & QUALITY'
                await page.locator('.ns-receipt').focus();await page.keyboard.press('Enter')
                assert await page.evaluate("document.activeElement.classList.contains('ns-receipt')"), 'receipt focus lost on flip'
                assert await page.locator('.ns-receipt-title').inner_text()=='OFFICIAL QUOTA'
                await page.locator('[data-flip]').click()
                assert await page.locator('.ns-receipt-title').inner_text()=='PEOPLE & QUALITY'
                assert await page.evaluate("document.activeElement.hasAttribute('data-flip')"), 'button focus lost'
                assert await page.locator('[data-clockout-cast]').count()==1
                await page.locator('[data-details]').click()
                assert await page.locator('.ns-breakdown').count()==1
                assert await page.evaluate("document.activeElement.hasAttribute('data-details')"), 'detail control focus lost'
                await page.wait_for_timeout(550) # capture settled paper after print animation
                await page.screenshot(path=str(OUT/'receipt-people-1920x1080.png'))
                report['interactions']={'fiveSelections':True,'visibleMachineInstall':True,'clickReceipt':True,'keyboardReceipt':True,'scoreUnmodified':official,'breakdown':True}
            if w==650:
                await page.locator('[data-pick]').last.click()
                assert await page.locator('.ns-machine-install').count()==1
                report['interactions']['narrowThirdChoice']=True
            await page.close()
        page=await browser.new_page(viewport={'width':1280,'height':720},reduced_motion='reduce')
        await page.set_content(html,wait_until='load')
        await page.get_by_role('button',name='OPEN YOUR PROMOTION EMAIL').click()
        result=await page.evaluate("getComputedStyle(document.querySelector('.ns-upgrade')).transitionDuration")
        assert result in ['0s','1e-06s'],('reduced motion still transitions',result)
        report['interactions']['reducedMotion']=True
        await page.locator('[data-pick]').first.click()
        await page.wait_for_function('window.__storyPreview.phase===2',timeout=900)
        report['interactions']['reducedMotionQuickTransition']=True
        await page.close()
        # Narrow receipt: actual visible controls and usable scroll, never a hidden replay button.
        for w,h in [(390,844),(650,800)]:
            page=await browser.new_page(viewport={'width':w,'height':h})
            page.on('pageerror',lambda e:report['errors'].append(str(e)))
            await page.set_content(html,wait_until='load')
            await page.get_by_role('button',name='OPEN YOUR PROMOTION EMAIL').click()
            for i in range(5):
                await page.locator('[data-pick]').first.click()
                await page.locator('.ns-announcement').click()
            assert await page.locator('.ns-receipt-title').inner_text()=='OFFICIAL QUOTA'
            await page.locator('.ns-receipt').click()
            await page.locator('[data-details]').click()
            await page.wait_for_timeout(480)
            g=await page.evaluate("""() => {
             const a=document.querySelector('.ns-end-actions').getBoundingClientRect(),
             c=document.querySelector('.ns-end-center'),p=document.querySelector('.ns-end').getBoundingClientRect();
             return {controlsBottom:a.bottom,controlsTop:a.top,centerClient:c.clientHeight,centerScroll:c.scrollHeight,panelBottom:p.bottom};}""")
            assert g['controlsBottom']<=h+1,('receipt controls inaccessible',w,g)
            assert g['controlsTop']>0,('receipt buttons offscreen',w,g)
            assert g['panelBottom']<=h+1,('receipt exceeds viewport',w,g)
            await page.screenshot(path=str(OUT/f'receipt-narrow-{w}x{h}.png'))
            report['interactions'][f'receiptVisibleControls{w}']=True
            await page.locator('[data-replay]').click()
            assert await page.locator('[data-pick]').count()==3
            report['interactions'][f'narrowReplay{w}']=True
            await page.close()
        # Regression: delayed continuation from an abandoned promotion cannot wipe a newer receipt.
        page=await browser.new_page(viewport={'width':1280,'height':800})
        page.on('pageerror',lambda e:report['errors'].append(str(e)))
        await page.set_content(html,wait_until='load')
        await page.get_by_role('button',name='OPEN YOUR PROMOTION EMAIL').click()
        await page.locator('[data-pick]').first.click()
        await page.evaluate('story.showReceipt({run:sample,snapshot:scores})')
        await page.wait_for_timeout(1750)
        assert await page.locator('.ns-receipt-title').count()==1, 'stale timer removed receipt'
        assert await page.evaluate('window.__storyPreview.phase')==1,'stale promotion continuation ran'
        report['interactions']['cancelledPromotionTimerSafe']=True
        await page.close()
        # Directly exercise the real SYSTEMS draft and readScores report schemas.
        page=await browser.new_page(viewport={'width':1440,'height':900})
        page.on('pageerror',lambda e:report['errors'].append(str(e)))
        await page.set_content(html,wait_until='load')
        await page.evaluate("""() => {
            window.__systemsPicked=null;
            story.showPromotion({index:1,run:{perkLevels:{'carbon-copy':1}},offers:['carbon-copy','bank-shot','mira-backup'],directive:'fast-or-safe',onPick:({perkId})=>window.__systemsPicked=perkId});
        }""")
        assert await page.get_by_role('button',name='Choose CARBON COPY level 2').count()==1
        assert 'two ghost papers' in await page.locator('[data-pick="carbon-copy"] .ns-upgrade-effect').inner_text()
        assert await page.locator('[data-pick="carbon-copy"] canvas').get_attribute('data-demo-level')=='2'
        await page.wait_for_timeout(80)
        actualDemo=await page.evaluate("""() => {
           const canvas=document.querySelector('[data-demo="carbon-copy"]');
           const before=canvas.toDataURL();drawDemo(canvas,'unknown-perk',0,2);
           return before!==canvas.toDataURL();}""")
        assert actualDemo,'SYSTEMS short ID produced a blank animated before/after'
        await page.get_by_role('button',name='Choose CARBON COPY level 2').click()
        assert await page.evaluate('window.__systemsPicked')=='carbon-copy', 'purchase ID not compatible with SYSTEMS'
        report['interactions']['systemsShortPerkId']=True
        report['interactions']['levelTwoPreviewActuallyDrawn']=True
        await page.evaluate("""() => story.showReceipt({run:{},snapshot:{officialScore:78,peopleScore:86,official:{completedWork:40},people:{toolAccess:30},completedCardIds:['S2','T4'],licenceTokensGiven:2,workstationIntact:false,bonusPacketOutcomes:{'quota:p1:b1':'file'}}})""")
        assert await page.locator('.ns-receipt-score').inner_text()=='78/ 100'
        await page.locator('.ns-receipt').click()
        assert await page.locator('.ns-receipt-score').inner_text()=='86/ 100'
        await page.locator('[data-details]').click()
        assert await page.locator('.ns-breakdown').count()==1
        report['interactions']['systemsFrozenScoreFields']=True
        await page.close();await browser.close()
    (OUT/'quality-report.json').write_text(json.dumps(report,indent=2))
    assert not report['errors'],report['errors']
    print('QUALITY GATE PASS:',len(report['viewports']),'viewports,',len(report['httpAssets']),'HTTP assets,',len(report['interactions']),'interactions')
if __name__=='__main__':asyncio.run(main())
