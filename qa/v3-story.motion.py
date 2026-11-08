"""Capture real Chromium rendered motion, not generated concept art."""
import asyncio,importlib.util,pathlib,io
from PIL import Image
from playwright.async_api import async_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('story_quality',str(ROOT/'qa/v3-story.quality.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
OUT=ROOT/'qa/v3-story-evidence/story-promotion-motion.gif'
async def main():
    frames=[]
    async with async_playwright() as p:
        b=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
        page=await b.new_page(viewport={'width':1440,'height':900},device_scale_factor=1,reduced_motion='no-preference')
        await page.set_content(m.bundle(),wait_until='load')
        await page.get_by_role('button',name='OPEN YOUR PROMOTION EMAIL').click()
        for _ in range(8):
            await page.wait_for_timeout(180)
            frames.append(Image.open(io.BytesIO(await page.screenshot())).convert('RGB').resize((960,600)))
        await page.locator('[data-pick]').first.click()
        for _ in range(10):
            await page.wait_for_timeout(120)
            frames.append(Image.open(io.BytesIO(await page.screenshot())).convert('RGB').resize((960,600)))
        await b.close()
    frames[0].save(OUT,save_all=True,append_images=frames[1:],duration=[180]*8+[120]*10,loop=0,optimize=True)
    print('Captured',len(frames),'genuine production-browser animation frames to',OUT)
if __name__=='__main__':asyncio.run(main())
