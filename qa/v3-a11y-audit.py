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
        for selector in ('[data-qa="clock-in"]','#clock-in','#clockIn','[data-testid="clock-in"]'):
            item=p.locator(selector)
            if item.count() and item.first.is_visible():item.first.focus();p.keyboard.press('Enter');started=True;break
        if not started and args.start_world:
            try:
                x,y=map(float,args.start_world.split(','));v=val(s,'viewport')
                p.mouse.click(x*v['scale']+v['ox'],y*v['scale']+v['oy']);started=True
            except Exception as e:report(checks,'start','REVIEW','Bad world transform: '+str(e))
        p.wait_for_timeout(80)
        s=snapshot(p);active=val(s,'screen','mode') in ('play','playing','action','game','card','boss') and val(s,'paused') is not True
        report(checks,'start','PASS' if started and active else 'REVIEW',f'control={started} state={val(s,"screen","mode")}')
        if active:
            # HD's first 80ms canvas frame precedes the moving forms; let the
            # action scene settle before capturing evidence. Gameplay clock keeps running.
            p.wait_for_timeout(1200)
            p.screenshot(path=str(out/f'{tag}-play.png'),animations='disabled')
            before=val(s,'muted','isMuted')
            sound=p.locator('#sound')
            label_before=sound.get_attribute('aria-label') if sound.count()==1 else None
            p.keyboard.press('m');p.wait_for_timeout(30)
            after=val(snapshot(p),'muted','isMuted')
            label_after=sound.get_attribute('aria-label') if sound.count()==1 else None
            state_changed=(isinstance(before,bool) and isinstance(after,bool) and before!=after)
            control_changed=(bool(label_before) and bool(label_after) and label_before!=label_after)
            report(checks,'mute','PASS' if state_changed or control_changed else 'REVIEW',
                   f'state={before}->{after}; accessible control={label_before}->{label_after}')
            report(checks,'audio-output','REVIEW',
                   'Audible mute and musical quality require listening; a button toggle is not audio proof')
            p.keyboard.press('Escape');p.wait_for_timeout(60);s=snapshot(p)
            t0=val(s,'clock','time');paused=val(s,'paused') is True or val(s,'screen') in ('pause','paused')
            p.wait_for_timeout(300);t1=val(snapshot(p),'clock','time')
            report(checks,'pause-clock','PASS' if paused and t0 is not None and t0==t1 else ('FAIL' if paused and t0 is not None else 'REVIEW'),f'{paused} {t0}->{t1}')
            if paused:p.screenshot(path=str(out/f'{tag}-pause.png'),animations='disabled')
            p.keyboard.press('Escape')
            # Use the browser's real touch pipeline, not synthetic DOM pointerdown.
            # Synthetic pointerdown has no active pointer and breaks setPointerCapture.
            try:
                before_cancel=snapshot(p)
                # Neutral corner: a centre press could accidentally resolve a paper.
                sx,sy=max(12,w*.045),h*.87
                p.evaluate('''() => {
                    window.__qaTouchLifecycle={down:0,cancel:0};
                    const canvas=document.querySelector('canvas');
                    canvas.addEventListener('pointerdown',()=>window.__qaTouchLifecycle.down++,{once:true});
                    canvas.addEventListener('pointercancel',()=>window.__qaTouchLifecycle.cancel++,{once:true});
                }''')
                cdp=ctx.new_cdp_session(p)
                cdp.send('Input.dispatchTouchEvent',{'type':'touchStart',
                    'touchPoints':[{'x':sx,'y':sy,'id':9}]})
                p.wait_for_timeout(30)
                cdp.send('Input.dispatchTouchEvent',{'type':'touchCancel','touchPoints':[]})
                p.wait_for_timeout(30)
                after_cancel=snapshot(p);lifecycle=p.evaluate('window.__qaTouchLifecycle')
                dragging=val(after_cancel,'dragging')
                unscored=(val(before_cancel,'hearts')==val(after_cancel,'hearts') and
                          val(before_cancel,'evidence','actions')==val(after_cancel,'evidence','actions'))
                report(checks,'touch-cancel-lifecycle',
                       'PASS' if lifecycle['down']==1 and lifecycle['cancel']==1 and unscored else 'FAIL',
                       f'events={lifecycle}; no heart/scoring change={unscored}')
                report(checks,'pointer-cancel','PASS' if dragging is False else 'REVIEW',
                       f'authenticated touch cancel; drag reset state={dragging}')
            except Exception as e:
                report(checks,'touch-cancel-lifecycle','REVIEW',
                       'Browser touch event probe unsupported: '+str(e).splitlines()[0])
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
            else:
                # The LEAD preview exposes authored semantic world targets (id/kind/x/y)
                # and the exact world-camera dimensions. Do not guess pixel hitboxes.
                st=snapshot(p);world=val(st,'targets');vp=val(st,'viewport')
                eligible=next((t for t in world if isinstance(t,dict) and
                               t.get('kind')=='good' and all(k in t for k in ('id','x','y'))),
                              None) if isinstance(world,list) else None
                # LEAD's current fallback snapshot uses worldToScreen before
                # exporting targets; these coordinates are ALREADY CSS pixels.
                # Applying the world transform again caused false misses at 1080p.
                coordinate=(eligible.get('coordinate') if eligible else None)
                if not coordinate and isinstance(st,dict) and st.get('hdAtlas')=='hd-original-2048' and st.get('deck')==['I1'] and not st.get('completeCampaign'):
                    coordinate='css'  # verified against the fallback scene source
                if eligible and isinstance(vp,dict) and coordinate in ('css','world'):
                    if coordinate=='css':
                        x,y=eligible['x'],eligible['y']
                    elif all(vp.get(k) for k in ('cssWidth','cssHeight','worldWidth','worldHeight')):
                        x=eligible['x']*vp['cssWidth']/vp['worldWidth']
                        y=eligible['y']*vp['cssHeight']/vp['worldHeight']
                    else:
                        raise ValueError('Missing dimensions for authored world-space target')
                    if 0 <= x <= w and 0 <= y <= h:
                        if w==650:p.touchscreen.tap(x,y)
                        else:p.mouse.click(x,y)
                        p.wait_for_timeout(80)
                        remaining=val(snapshot(p),'targets')
                        done=isinstance(remaining,list) and not any(
                            t.get('id')==eligible['id'] for t in remaining if isinstance(t,dict))
                        report(checks,'primary-pointer','PASS' if done else 'REVIEW',
                               f'authored target={eligible["id"]} removed={done}; css=({x:.1f},{y:.1f})')
                        p.screenshot(path=str(out/f'{tag}-interacted.png'),animations='disabled')
                    else:
                        report(checks,'primary-pointer','REVIEW','Authored target mapped outside viewport')
                else:
                    report(checks,'primary-pointer','REVIEW',
                           'No safe authored QA target; do not guess')

        else:
            for n in ('mute','audio-output','pause-clock','touch-cancel-lifecycle','pointer-cancel','primary-pointer'):report(checks,n,'REVIEW','No safe active-play entry')
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
