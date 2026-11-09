#!/usr/bin/env python3
"""Actual Chrome interaction QA of real SYSTEMS-ledger / STORY receipt composition.
Not a gameplay playthrough. Screenshot PNGs are measured browser output.
"""
import functools
import http.server
import json
import pathlib
import threading
from playwright.sync_api import sync_playwright

ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/"qa"/"v3-wrap-score-evidence"
OUT.mkdir(parents=True,exist_ok=True)
class Quiet(http.server.SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):
        super().__init__(*args,directory=str(ROOT),**kwargs)
    def log_message(self,*args): pass
server=http.server.ThreadingHTTPServer(("127.0.0.1",0),Quiet)
thread=threading.Thread(target=server.serve_forever,daemon=True)
thread.start()
base="http://127.0.0.1:"+str(server.server_port)+"/qa/v3-wrap-score-fixture.html?reduce=1"
results=[]
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe",headless=True,args=["--no-sandbox"])
  matrices=[(1920,1080,1),(1366,768,1),(650,800,1),(1920,1080,2)]
  if __import__('os').environ.get('NS_SCORE_PORTRAIT_ONLY')=='1': matrices=[(650,800,1)]
  for width,height,dpr in matrices:
   ctx=browser.new_context(viewport={"width":width,"height":height},device_scale_factor=dpr,reduced_motion="reduce")
   page=ctx.new_page();errors=[]
   page.on("pageerror",lambda e:errors.append(str(e)))
   response=page.goto(base,wait_until="load",timeout=30000)
   assert response.status==200,(width,response.status)
   page.wait_for_function("window.__scoreFixture?.ready === true",timeout=15000)
   page.wait_for_selector(".ns-receipt",state="visible",timeout=8000)
   slips=page.locator(".ns-receipt")
   assert slips.count()==1
   js=page.evaluate("window.__scoreFixture.slip")
   assert js["verified"] is True
   assert js["eventCount"]>30
   assert js["licence"]["savedDollars"]+js["licence"]["givenDollars"]==80
   assert len(js["cardIds"])==12 and len(js["bossCounters"])==6
   assert page.locator(".ns-receipt-score").evaluate("el=>el.firstChild.textContent.trim()")==str(js["officialScore"])
   area=page.locator(".ns-panel").bounding_box()
   full=page.evaluate("({sw:document.documentElement.scrollWidth,ww:innerWidth,sh:document.documentElement.scrollHeight,wh:innerHeight})")
   assert area is not None and area["width"]>250
   assert full["sw"]<=width+3,("horizontal overflow",width,full)
   page.screenshot(path=str(OUT/("receipt-%dx%d-dpr%d.png"%(width,height,dpr))),full_page=True)
   page.locator("[data-flip]").click()
   assert page.locator(".ns-receipt-score").evaluate("el=>el.firstChild.textContent.trim()")==str(js["peopleScore"])
   assert page.locator(".ns-receipt h2").inner_text()=="PEOPLE & QUALITY · NOT A COMPANY AWARD"
   assert "Software access: $40 of $80." in page.locator(".ns-receipt .ns-conclusion").inner_text()
   page.locator("[data-details]").click()
   assert page.locator(".ns-breakdown .ns-line").count()>=4
   assert "VERIFIED COMMITTED EVENTS" in page.locator(".ns-receipt-bottom").inner_text()
   page.screenshot(path=str(OUT/("flipped-%dx%d-dpr%d.png"%(width,height,dpr))),full_page=True)
   page.locator("[data-replay]").click()
   assert page.evaluate("window.__scoreFixture.replayed===true")
   assert not errors,("page errors",width,errors)
   results.append({"viewport":[width,height],"dpr":dpr,"official":js["officialScore"],
    "people":js["peopleScore"],"overflow":full["sw"]-width,
    "receipts":1,"flip":True,"details":True,"replay":True,"exceptions":len(errors)})
   ctx.close()
  browser.close()
finally:
 server.shutdown();server.server_close()
assert len(results)==(1 if __import__('os').environ.get('NS_SCORE_PORTRAIT_ONLY')=='1' else 4)
print(json.dumps({"status":"PASS","test":"REAL_CHROME_SYSTEMS_STORY_RECEIPT","results":results,
 "screenshots":str(OUT)},indent=2))