#!/usr/bin/env python3
"""Import existing REAL GitHub Actions screenshots into the visual reviewer.

Unlike qa/v3-visual-audit.cjs, this reads archived images only: it does not
claim a current browser run. The historical First Shift comparison is an
explicit NEGATIVE CONTROL, never relabelled as Night Shift v3.

python qa/v3-visual-archive.py \
  --hd /path/to/nightshift-hd-email-excel-screens.zip \
  --donor /path/to/first-shift-browser-evidence.zip

Requires Pillow (python -m pip install Pillow). The source PNGs are not
regenerated. This only copies extracted browser PNGs and computes diagnostics.
"""
from __future__ import annotations
import argparse
from datetime import datetime, timezone
import io
import json
from pathlib import Path
import zipfile
from PIL import Image

HD = {
    'title-1440.png': ('title', '1440×900@2x', 1440, 900, 2),
    'title-1920.png': ('title', '1920×1080@2x', 1920, 1080, 2),
    'title-650.png': ('title', '650×800@1x', 650, 800, 1),
    'fullscreen.png': ('action', '1440×900@2x', 1440, 900, 2),
    'email-excel.png': ('draft', '1440×900@2x', 1440, 900, 2),
}
DONOR = {
    'title-1366.png': ('title', '1366×768@1x', 1366, 768, 1),
    'title-650.png': ('title', '650×800@1x', 650, 800, 1),
    'I1-1366.png': ('action', '1366×768@1x', 1366, 768, 1),
    'I1-650.png': ('action', '650×800@1x', 650, 800, 1),
    'draft-1.png': ('draft', '1366×768@1x', 1366, 768, 1),
    'boss-phase-1.png': ('donor-printer', '1366×768@1x', 1366, 768, 1),
    'ending.png': ('donor-ending', '1366×768@1x', 1366, 768, 1),
}
VIEWPORTS = [
    ['1440×900@2x', 1440, 900, 2],
    ['1920×1080@2x', 1920, 1080, 2],
    ['650×800@1x', 650, 800, 1],
    ['1366×768@1x', 1366, 768, 1],
]

def blank_border_metrics(img: Image.Image) -> dict:
    """Count nearly uniform top/bottom scanlines; these are suspects, not proof.

    Downsample x only, preserving y to measure full-height edge bands. Exact
    flatness of the whole row includes dark letterboxing and some real UI; a
    reviewer should look at the PNG before interpreting warnings.
    """
    rgb = img.convert('RGB')
    width, height = rgb.size
    narrow = rgb.resize((min(180, width), height), Image.Resampling.BILINEAR)
    data = narrow.load()
    almost_flat=[]
    low_detail=[]
    for y in range(height):
        channels=[[],[],[]]
        for x in range(narrow.width):
            px=data[x,y]
            for i in range(3):
                channels[i].append(px[i])
        ranges=[max(ch)-min(ch) for ch in channels]
        almost_flat.append(max(ranges) <= 3)
        # Spatial stddev avoids mistaking dark RGB channel differences for art.
        detail=sum((sum((value-(sum(ch)/len(ch)))**2 for value in ch)/len(ch))**0.5 for ch in channels)/3
        low_detail.append(detail < 9)
    # Prefer the longest nearly-uniform run touching the outer 12px. This
    # catches a legal footer link that interrupts otherwise empty bottom bars.
    runs=[]
    begin=None
    for y,flat in enumerate(almost_flat + [False]):
        if flat and begin is None: begin=y
        if not flat and begin is not None:
            runs.append((begin,y))
            begin=None
    top=max([end-start for start,end in runs if start<=12] or [0])
    bottom=max([end-start for start,end in runs if height-end<=12] or [0])
    fraction=round(min(height,top+bottom)/height,4)
    lower=low_detail[int(height*0.62):]
    return {'topFlatPixels':top,'bottomFlatPixels':bottom,'flatEdgeFraction':fraction,
            'lower38PercentLowDetailFraction':round(sum(lower)/len(lower),4)}

def extract_source(archive_path: Path, variant: str, mapping: dict, outdir: Path) -> dict:
    run={'variant':variant,'url':str(archive_path),'loaded':0,'captures':[],'errors':[],'blocked':[]}
    with zipfile.ZipFile(archive_path) as archive:
        if archive.testzip() is not None: raise ValueError(f'Corrupt ZIP member in {archive_path}')
        members={Path(m.filename).name:m for m in archive.infolist() if not m.is_dir()}
        for source,(scene,view,cw,ch,dpr) in mapping.items():
            item=members.get(source)
            if not item: run['blocked'].append(f'Missing archive screenshot: {source}');continue
            if item.file_size>35_000_000: raise ValueError(f'Oversize screenshot member: {source}')
            contents=archive.read(item)
            if not contents.startswith(b'\x89PNG\r\n\x1a\n'): raise ValueError(f'Expected PNG: {source}')
            with Image.open(io.BytesIO(contents)) as im:
                pw,ph=im.size
                expected=(cw*dpr,ch*dpr)
                if (pw,ph)!=expected:
                    run['blocked'].append(f'{source}: actual {pw}×{ph} differs from expected {expected}; keeping real dimensions')
                borders=blank_border_metrics(im)
            newname=f'{variant}-{scene}-{view.replace("×","x").replace("@","-")}.png'
            (outdir/newname).write_bytes(contents)
            warnings=[]
            if borders['flatEdgeFraction']>=0.18:
                warnings.append(f'Large uniform horizontal edge bands ({borders["flatEdgeFraction"]:.1%} of image); inspect letterboxing')
            if borders['lower38PercentLowDetailFraction']>=0.85:
                warnings.append(f'Lower 38% contains {borders["lower38PercentLowDetailFraction"]:.1%} low-detail scanlines; inspect unused space')
            metrics={'imagePixels':[pw,ph], 'borderBands':borders}
            run['captures'].append({'variant':variant,'viewport':view,'scene':scene,'width':cw,'height':ch,'dpr':dpr,'image':newname,'metrics':metrics,'failures':[],'warnings':warnings,'sourceMember':source})
            run['loaded']+=1
    return run

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--hd',required=True,type=Path,help='Real HD GitHub Actions artifact ZIP')
    p.add_argument('--donor',required=True,type=Path,help='Historical First Shift screenshot artifact ZIP')
    p.add_argument('--out',default=Path('qa-artifacts/v3-visual/real-archive'),type=Path)
    args=p.parse_args()
    for item in (args.hd,args.donor):
        if not item.is_file():p.error(f'Artifact ZIP not found: {item}')
    args.out.mkdir(parents=True,exist_ok=True)
    hd=extract_source(args.hd,'hd',HD,args.out)
    donor=extract_source(args.donor,'donor',DONOR,args.out)
    report={
        'schema':1, 'fixture':False, 'comparisonVariant':'donor',
        'comparisonLabel':'FIRST SHIFT · historic donor (NOT v3)',
        'sourceKind':'historical-real-browser-actions-artifacts',
        'generatedAt':datetime.now(timezone.utc).isoformat(),
        'sourceRuns':{
            'hd':'https://github.com/PcRoGamer/office-hours-ccdp10003/actions/runs/42363190010',
            'donor':'https://github.com/PcRoGamer/office-hours-ccdp10003/actions/runs/42460980521',
        },
        'viewports':VIEWPORTS, 'runs':[hd,donor]
    }
    (args.out/'report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    hdp=next(c for c in hd['captures'] if c['sourceMember']=='title-650.png')
    relative=hdp['metrics']['borderBands']
    markdown='''# Actual HD vs historical First Shift screenshot audit

**Source provenance:** existing, real Chromium screenshots recovered from GitHub Actions.

- Night Shift HD: https://github.com/PcRoGamer/office-hours-ccdp10003/actions/runs/42363190010
- Historical First Shift: https://github.com/PcRoGamer/office-hours-ccdp10003/actions/runs/42460980521

**Critical:** First Shift is a negative control, **NOT** Night Shift v3. These files do not prove the new v3 exists or passes a visual gate. All images retain original pixels; only provenance labels and metrics are added.

## Measurements

'''
    for run in (hd,donor):
        for c in run['captures']:
            b=c['metrics']['borderBands']
            markdown+=f'- **{run["variant"]} {c["scene"]} {c["viewport"]}:** {b["flatEdgeFraction"]:.1%} uniform outer scanlines, top ~{b["topFlatPixels"]}px, bottom ~{b["bottomFlatPixels"]}px, low-detail lower region {b["lower38PercentLowDetailFraction"]:.1%}, source PNG \x60{c["sourceMember"]}\x60.\n'
    markdown+='''
**Interpretation:** uniform edges indicate possible wasted space but can also be intentional backgrounds. Inspect the original images. Cross-build comparisons must match viewport, gameplay state and preferably identical input timing; these archives offer only partial matches. No pixel-difference ranking is asserted.

## Objective design defects visible in authentic archive

1. HD portrait 650×800 title uses a centered landscape composition surrounded by large unoccupied top/bottom bands. V3 must recompose rather than merely center a miniature version.
2. First Shift 650×800 I1 exposes a large inactive lower play area; forcing 12 cards into that rectangle would repeat the visual regression. V3 should use the physical screen for living scenery while keeping targets reachable.
3. HD title at wide viewport has a striking red/cream split, oversized type, chunky character silhouette and theatrical angled graphic. First Shift title reduces contrast and typography to a framed document and smaller cast: a poor presentation donor.
4. HD promotion Aster Mail + workbook is an integrated full-bleed cinematic pause; never replace it with generic abstract perk buttons.

## Next automatic gate

When LEAD's real \x60night-shift-v3.html\x60 lands, run \x60node qa/v3-visual-audit.cjs\x60 against the actual route. Only a **matched HD vs v3 screenshot**, not this donor comparison, can authorize an art fidelity review.
'''
    (args.out/'report.md').write_text(markdown,encoding='utf-8')
    print(json.dumps({'sourceKind':report['sourceKind'],'screenshots':sum(len(r['captures']) for r in report['runs']),'hdPortraitFlatFraction':relative['flatEdgeFraction'],'out':str(args.out)},indent=2))

if __name__=='__main__':main()
