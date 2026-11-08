#!/usr/bin/env python3
"""Night Shift: real PNG-vs-PNG composition audit, never generated mock game art.

python -m pip install Pillow numpy
python qa/v3-visual-composition.py --hd /path/to/hd.png --candidate /path/to/v3.png --output qa-artifacts/v3-visual/scene
When comparing historical First Shift, explicitly set --candidate-label "FIRST SHIFT (NOT V3)".
Exact source pixels are preserved in the side-by-side PNG; metrics diagnose
composition and cannot declare a visual pass without actual human inspection.
"""
from __future__ import annotations
import argparse,json,math
from datetime import datetime,timezone
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageFilter
import numpy as np

def load_png(file):
 with Image.open(file) as img:
  if img.format!='PNG':raise ValueError('Unchanged original PNG screenshot required: '+str(file))
  img.verify()
 with Image.open(file) as img:return img.convert('RGB')

def features(image):
 thumb=image.resize((min(image.width,512),min(image.height,512)),Image.Resampling.BILINEAR)
 rgb=np.asarray(thumb,dtype=np.float64)
 red,green,blue=[rgb[:,:,n] for n in range(3)]
 rg=red-green;yb=(red+green)/2-blue
 colorfulness=math.sqrt(float(rg.var()+yb.var()))+.3*math.sqrt(float(rg.mean()**2+yb.mean()**2))
 luma=.2126*red+.7152*green+.0722*blue
 edge=np.asarray(thumb.filter(ImageFilter.FIND_EDGES).convert('L'),dtype=np.uint8)
 narrow=image.resize((min(image.width,192),image.height),Image.Resampling.BILINEAR)
 lines=np.asarray(narrow,dtype=np.float64)
 flat=(lines.max(axis=1)-lines.min(axis=1)).max(axis=1)<=3
 spatial=np.sqrt(np.mean(np.var(lines,axis=1),axis=1))
 def long_edge(which):
  value=flat if which=='top' else flat[::-1]
  start=0
  for enabled in value:
   if not enabled:break
   start+=1
  runs=[];begin=None
  for i,active in enumerate([*flat,False]):
   if active and begin is None:begin=i
   if not active and begin is not None:runs.append((begin,i));begin=None
  h=len(flat)
  candidate=[b-a for a,b in runs if (a<=12 if which=='top' else h-b<=12)]
  return max([start,*candidate]or[0])
 top,bottom=long_edge('top'),long_edge('bottom')
 bands=[]
 for i in range(8):
  y0=i*image.height//8;y1=(i+1)*image.height//8
  bands.append({'band':i+1,'spatialStdDev':round(float(spatial[y0:y1].mean()),2),
                'lowDetailFraction':round(float((spatial[y0:y1]<9).mean()),3)})
 return {'size':[image.width,image.height],'colorfulness':round(colorfulness,2),
  'luminanceP95minusP5':round(float(np.percentile(luma,95)-np.percentile(luma,5)),2),
  'edgeDensity':round(float((edge>55).mean()),4),
  'uniformTopPixels':top,'uniformBottomPixels':bottom,
  'uniformOuterFraction':round((top+bottom)/image.height,4),
  'lower38PercentLowDetailFraction':round(float((spatial[int(image.height*.62):]<9).mean()),4),
  'verticalBandProfile':bands}

def contact_sheet(hd,candidate,label,output):
 w,h=hd.size;space=24;head=70;foot=68
 out=Image.new('RGB',(w*2+3*space,h+head+foot),(16,30,35))
 out.paste(hd,(space,head));out.paste(candidate,(w+2*space,head))
 d=ImageDraw.Draw(out);font=ImageFont.load_default()
 d.text((space,20),'NIGHT SHIFT HD / ORIGINAL REAL BROWSER FRAME',font=font,fill=(242,226,192))
 d.text((w+2*space,20),label.upper()+' / ORIGINAL REAL BROWSER FRAME',font=font,fill=(244,194,112))
 d.text((space,head+h+17),'SOURCE PIXELS UNCHANGED. ARTISTIC REVIEW REQUIRED.',font=font,fill=(176,213,206))
 out.save(output)

def main():
 ap=argparse.ArgumentParser(description=__doc__)
 ap.add_argument('--hd',type=Path,required=True)
 ap.add_argument('--candidate',type=Path,required=True)
 ap.add_argument('--candidate-label',default='NIGHT SHIFT V3 CANDIDATE')
 ap.add_argument('--output',type=Path,default=Path('qa-artifacts/v3-visual/composition'))
 args=ap.parse_args();args.output.parent.mkdir(parents=True,exist_ok=True)
 a=load_png(args.hd);b=load_png(args.candidate)
 if a.size!=b.size:raise ValueError(f'Actual matching viewport required: HD {a.size}, candidate {b.size}')
 if args.hd.resolve()==args.candidate.resolve():raise ValueError('Cannot compare screenshot against itself')
 hd,other=features(a),features(b)
 notes=[]
 for name,m in [('HD',hd),('candidate',other)]:
  if m['uniformOuterFraction']>=.18:notes.append(name+': possible letterboxing, >18% uniform top/bottom scanlines')
  if m['lower38PercentLowDetailFraction']>=.85:notes.append(name+': possible unused lower stage, >85% low-detail rows')
 result={'schema':1,'generatedAt':datetime.now(timezone.utc).isoformat(),
  'sourceKind':'unchanged-original-rendered-PNGs','releaseVerdict':'HUMAN_VISUAL_AND_AUDIO_REVIEW_REQUIRED',
  'candidateLabel':args.candidate_label,'matchedViewport':True,
  'images':{'hd':str(args.hd),'candidate':str(args.candidate)},
  'diagnostics':{'hd':hd,'candidate':other},'warnings':notes,
  'caution':'Higher pixel contrast/colorfulness/density is not automatically better visual art.'}
 contact_sheet(a,b,args.candidate_label,args.output.with_suffix('.png'))
 args.output.with_suffix('.json').write_text(json.dumps(result,indent=2)+'\n')
 print(json.dumps({'output':str(args.output),'matched':True,'hdOuterFraction':hd['uniformOuterFraction'],
   'candidateOuterFraction':other['uniformOuterFraction'],'warnings':notes,'verdict':result['releaseVerdict']},indent=2))
if __name__=='__main__':main()
