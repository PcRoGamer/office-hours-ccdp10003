#!/usr/bin/env python3
"""Browser input/accessibility audit. REVIEW is not a pass; UNAVAILABLE is fatal.
Usage: python qa/v3-a11y-audit.py --url http://localhost:4173/night-shift-v3.html
Offline fixture only: --fixture --html-file previews/v3-a11y-fixture.html
Install: pip install playwright; python -m playwright install chromium
"""
import argparse,json,re,shutil,sys
from datetime import datetime,timezone
from pathlib import Path
from playwright.sync_api import sync_playwright
VIEWPORTS=[(1440,900,1),(1920,1080,1),(650,800,1),(1920,1080,2)]

def snapshot(p):
    return p.evaluate("""() => {for(const a of [window.__nightShiftV3,window.__officeArcade])
      if(typeof a?.snapshot==='function')try{return a.snapshot()}catch(e){return {error:String(e)}}return null;}""")
def val(s,*names):
    for n in names:
        if isinstance(s,dict) and n in s:return s[n]
        if isinstance(s,dict) and isinstance(s.get('options'),dict) and n in s['options']:return s['options'][n]
    return None
def report(checks,name,status,detail=''):
    checks.append(dict(name=name,status=status,detail=str(detail)[:300]))
def probe(browser,url,label,w,h,dpr,args,out):
    checks=[];tag=f'{label}-{w}x{h}-dpr{dpr}';errors=[]
    ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=dpr,
                            reduced_motion='reduce',has_touch=w==650)
    p=ctx.new_page();p.on('pageerror',lambda e:errors.append(str(e)))
    try:
        try:
            if args.html_file:
                p.set_content(Path(args.html_file).read_text(encoding='utf8'))
                report(checks,'document','PASS','offline injected fixture, NOT HTTP evidence')
            else:
                res=p.goto(url,wait_until='domcontentloaded',timeout=12000)
                if not res or res.status>=400:raise RuntimeError('HTTP '+str(res.status if res else None))
                report(checks,'document','PASS','HTTP '+str(res.status))
        except Exception as e:
            report(checks,'document','UNAVAILABLE',str(e).splitlines()[0]);return dict(tag=tag,checks=checks)
        p.wait_for_timeout(250)
        g=p.evaluate("""() => {const c=document.querySelector('canvas');if(!c)return null;
          const r=c.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,
          pw:c.width,ph:c.height,label:c.getAttribute('aria-label'),touch:getComputedStyle(c).touchAction}}""")
        if g is None:report(checks,'canvas','FAIL','Canvas missing');return dict(tag=tag,checks=checks)
        report(checks,'fullscreen','PASS' if abs(g['x'])<1 and abs(g['y'])<1 and g['w']>=w-1 and g['h']>=h-1 else 'FAIL',g)
        report(checks,'backing','PASS' if g['pw']>=w and g['ph']>=h else 'FAIL',f"{g['pw']}x{g['ph']}")
        report(checks,'accessible-name','PASS' if g['label'] else 'REVIEW',g['label'])
        report(checks,'touch-action','PASS' if g['touch']=='none' else 'REVIEW',g['touch'])
        p.screenshot(path=str(out/f'{tag}-title.png'),animations='disabled')
        s=snapshot(p);focus=[]
        for _ in range(10):
            p.keyboard.press('Tab')
            f=p.evaluate("""() => {const e=document.activeElement;
              return e&&e!==document.body&&e.getClientRects().length?e.getAttribute('aria-label')||e.textContent?.trim().slice(0,40)||e.tagName:null}""")
            if f and f not in focus:focus.append(f)
        report(checks,'keyboard-focus','PASS' if focus else 'FAIL',focus)
        # Start via accessible control, or explicit author-provided logical coordinates. Never guess hitboxes.
        started=False
        for selector in ('[data-qa="clock-in"]','#clockIn','[data-testid="clock-in"]'):
            item=p.locator(selector)
            if item.count() and item.first.is_visible():item.first.focus();p.keyboard.press('Enter');started=True;break
        if not started and args.start_world:
            try:
                x,y=map(float,args.start_world.split(','));v=val(s,'viewport')
                p.mouse.click(x*v['scale']+v['ox'],y*v['scale']+v['oy']);started=True
            except Exception as e:report(checks,'start','REVIEW','Bad world transform: '+str(e))
        p.wait_for_timeout(80)
        s=snapshot(p);active=val(s,'screen') in ('play','playing','action','game')
        report(checks,'start','PASS' if started and active else 'REVIEW',f'control={started} state={val(s,"screen")}')
        if active:
            # HD's first 80ms canvas frame precedes the moving forms; let the
            # action scene settle before capturing evidence. Gameplay clock keeps running.
            p.wait_for_timeout(1200)
            p.screenshot(path=str(out/f'{tag}-play.png'),animations='disabled')
            before=val(s,'muted','isMuted');p.keyboard.press('m');p.wait_for_timeout(30)
            after=val(snapshot(p),'muted','isMuted')
            report(checks,'mute','PASS' if isinstance(before,bool) and isinstance(after,bool) and before!=after else 'REVIEW',f'{before}->{after}; audio output unverified')
            p.keyboard.press('Escape');p.wait_for_timeout(60);s=snapshot(p)
            t0=val(s,'clock','time');paused=val(s,'screen') in ('pause','paused')
            p.wait_for_timeout(300);t1=val(snapshot(p),'clock','time')
            report(checks,'pause-clock','PASS' if paused and t0 is not None and t0==t1 else ('FAIL' if paused and t0 is not None else 'REVIEW'),f'{paused} {t0}->{t1}')
            if paused:p.screenshot(path=str(out/f'{tag}-pause.png'),animations='disabled')
            p.keyboard.press('Escape')
            # Use the browser's real touch pipeline, not synthetic DOM pointerdown.
            # Synthetic pointerdown has no active pointer and breaks setPointerCapture.
            try:
                cdp=ctx.new_cdp_session(p)
                cdp.send('Input.dispatchTouchEvent',{'type':'touchStart',
                    'touchPoints':[{'x':w/2,'y':h/2,'id':9}]})
                p.wait_for_timeout(30)
                cdp.send('Input.dispatchTouchEvent',{'type':'touchCancel','touchPoints':[]})
                p.wait_for_timeout(30)
                dragging=val(snapshot(p),'dragging')
                report(checks,'pointer-cancel','PASS' if dragging is False else 'REVIEW',
                       f'authentic touchStart/touchCancel; dragging={dragging}')
            except Exception as e:
                report(checks,'pointer-cancel','REVIEW',
                       'Browser touch cancellation probe unsupported: '+str(e).splitlines()[0])
            target=val(snapshot(p),'qaTargets');old=val(snapshot(p),'actions')
            if isinstance(target,list) and target and target[0].get('coordinate')=='css':
                x,y=target[0]['x'],target[0]['y']
                if w==650:p.touchscreen.tap(x,y)
                else:p.mouse.click(x,y)
                p.wait_for_timeout(30);new=val(snapshot(p),'actions')
                report(checks,'primary-pointer','PASS' if isinstance(old,(int,float)) and isinstance(new,(int,float)) and new>old else 'REVIEW',f'{old}->{new}')
                p.screenshot(path=str(out/f'{tag}-interacted.png'),animations='disabled')
            else:report(checks,'primary-pointer','REVIEW','No safe authored QA target; do not guess')
        else:
            for n in ('mute','pause-clock','pointer-cancel','primary-pointer'):report(checks,n,'REVIEW','No safe active-play entry')
        motion=p.evaluate("matchMedia('(prefers-reduced-motion: reduce)').matches")
        report(checks,'reduced-motion','PASS' if motion and val(snapshot(p),'reducedMotion') is True else 'REVIEW','Visual shake suppression still needs manual comparison')
        report(checks,'high-contrast','REVIEW','Must inspect shape/icon patterns; never infer from browser emulation')
        report(checks,'page-errors','FAIL' if errors else 'PASS',errors)
    except Exception as e:report(checks,'probe-exception','FAIL',str(e))
    finally:ctx.close()
    return dict(tag=tag,checks=checks)

def main():
    a=argparse.ArgumentParser(description=__doc__);a.add_argument('--url',default='http://127.0.0.1:4173/night-shift-v3.html')
    a.add_argument('--baseline');a.add_argument('--start-world',help='Only for documented canvas start point, e.g. 220,605')
    a.add_argument('--out',default='qa-artifacts/v3-a11y');a.add_argument('--fixture',action='store_true')
    a.add_argument('--html-file');a.add_argument('--strict',action='store_true');args=a.parse_args()
    if args.html_file and (not args.fixture or args.baseline):a.error('--html-file is a single offline fixture ONLY, never deployed/HD baseline evidence')
    out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
    data=dict(created=datetime.now(timezone.utc).isoformat(),provenance='OFFLINE MOCK FIXTURE ONLY' if args.fixture else 'LIVE URL BROWSER',cases=[])
    with sync_playwright() as pw:
        executable=shutil.which('chromium') or shutil.which('google-chrome')
        browser=pw.chromium.launch(headless=True,args=['--no-sandbox'],**({'executable_path':executable} if executable else {}))
        try:
            for label,url in [('target',args.url)]+([('hd',args.baseline)] if args.baseline else []):
                for w,h,dpr in VIEWPORTS:data['cases'].append(probe(browser,url,label,w,h,dpr,args,out))
        finally:browser.close()
    data['counts']={n:sum(c['status']==n for case in data['cases'] for c in case['checks']) for n in ('PASS','FAIL','REVIEW','UNAVAILABLE')}
    (out/'results.json').write_text(json.dumps(data,indent=2)+'\n',encoding='utf-8')
    lines=[f'# Night Shift v3 input/accessibility evidence',f'Provenance: **{data["provenance"]}**','',
           '| Case | Check | Status | Evidence |','|---|---|---|---|']
    for case in data['cases']:
        for c in case['checks']:lines.append(f'| {case["tag"]} | {c["name"]} | {c["status"]} | {c["detail"].replace(chr(124),"/")} |')
    lines+=['',f'Counts: {data["counts"]}','REVIEW is never a pass. Screenshots are actual Chromium captures, but mock fixtures do not certify Night Shift HD or v3.']
    (out/'report.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
    print(json.dumps({'counts':data['counts'],'provenance':data['provenance'],'artifacts':str(out)}))
    return int(bool(data['counts']['FAIL'] or data['counts']['UNAVAILABLE'] or (args.strict and data['counts']['REVIEW'])))
if __name__=='__main__':sys.exit(main())
