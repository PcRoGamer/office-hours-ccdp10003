import {C, clamp, rr, tx, line, circle, layout, sceneBackdrop, theatrePanel, button, sticker, stars, pointIn,drawFinch} from './drawing.js';

// All interactions consume scene WORLD coordinates from the shared viewport.
// Game logic is deterministic, dt-driven and completely independent of the preview.
const cards=[
  {id:'P1', imperative:'RESET THE SCALE!',title:'THE TRUTH IS IN THE AXIS',seconds:30,referenceMs:14000},
  {id:'P2', imperative:'POP-UP PURGE!',title:'THE PROJECTOR IS SPONSORED',seconds:32,referenceMs:12000},
  {id:'P3', imperative:'HOLD THE SLIDE!',title:'FOCUS IS A TEAM SPORT',seconds:31,referenceMs:12000},
  {id:'P4', imperative:'HEADLINE OR CONTEXT?',title:'SAME FACTS. DIFFERENT STORY.',seconds:35,referenceMs:14000}
];
const noop=()=>{};
// Directives are injected by SYSTEMS/LEAD. Missing services retain a fair standalone route.
function directiveId(context){
  const d=context?.run?.activeDirective??context?.run?.directive??context?.effects?.activeDirective??context?.effects?.directive??context?.options?.directive;
  return typeof d==='string'?d:(d?.id??d?.type??null);
}
function base(context,meta){
  const state={time:0,finished:false,correct:0,wrong:0,actionSerial:0,gesture:null,flash:0,scene:meta.id};
  const emit=(event)=>context?.events?.emit?.({...event,cardId:meta.id});
  const complete=(outcome,evidence={})=>{
    if(state.finished)return false;
    state.finished=true;
    emit({type:'card-complete',outcome,evidence:{...evidence,manualCorrect:state.correct,manualWrong:state.wrong,activeElapsedMs:Math.round(state.time*1000),authoredReferenceMs:meta.referenceMs}});
    context?.audio?.play?.(outcome==='success'?'card-win':'card-fail');
    return true;
  };
  // SYSTEMS requires a stable unique objectId for each *real* resolved target.
  // Names describe a physical object, not the order the adapter happened to see it.
  // Wrong attempts are individually traceable rather than silently deduplicated.
  const targetIds=Object.freeze({
    'correct-chart-axis':'pr:p1:axis',
    'send-real-chart':'pr:p1:send',
    'open-signed-scale-tip':'pr:p1:verified-scale-tip',
    'open-signed-alert':'pr:p2:verified-alert',
    'slide-alignment-lock':null,
    'route-report':'pr:p4:report'
  });
  const act=(correct,kind,details={})=>{
    if(state.finished)return false;
    const serial=++state.actionSerial;
    const stable=targetIds[kind];
    const objectId=details.objectId || (kind==='slide-alignment-lock'
      ?`pr:p3:alignment-mark-${details.mark}`:(correct&&stable?stable:`pr:${meta.id}:${kind}:${serial}`));
    state[correct?'correct':'wrong']++;
    state.flash=correct?.35:.55;
    emit({type:'card-action',kind,correct,objectId,outcome:correct?'correct':'wrong',
      gesture:details.gesture||'pointer',synthetic:false,actionSerial:serial,...details});
    context?.audio?.play?.(correct?'hit':'miss');
    return true;
  };
  const update=(dt)=>{if(state.finished)return;const step=clamp(Number.isFinite(dt)?dt:0,0,.1);state.time+=step;state.flash=Math.max(0,state.flash-step);if(state.time>=meta.seconds+(state.graceSeconds||0))complete('failure',{cause:'shutter',progress:state.scene});};
  const snapshot=()=>JSON.parse(JSON.stringify(state));
  return {state,emit,complete,act,update,snapshot,meta};
}
const vw=(v)=>layout(v);
function timerRail(ctx,l,s,seconds){
  const frac=clamp(1-s.time/seconds,0,1),width=Math.min(350,l.width*.55),x=l.cx-width/2;
  rr(ctx,x,144,width,8,4,'#0e262b',null);rr(ctx,x,144,width*frac,8,4,frac<.22?C.red:C.mint,null);
}
function drawResult(ctx,l,s,msg){
  if(!s.finished)return;
  ctx.fillStyle='rgba(8,22,26,.7)';ctx.fillRect(0,165,l.W,l.H-165);
  theatrePanel(ctx,l.cx-Math.min(l.width*.45,420),l.H*.35,Math.min(l.width*.9,840),140,C.cream);
  tx(ctx,msg,l.cx,l.H*.35+72,l.portrait?22:34,C.ink);
}

function createP1(context,meta){
  const b=base(context,meta),s=b.state;
  Object.assign(s,{baseline:1200,dragging:false,sent:false,corrected:false,axisHint:true,sponsored:directiveId(context)==='sponsored-workflow',tipOpened:false,fakeDismissed:false,promoDrag:null,promoFlight:null,cosmeticPulse:0});
  const geo=v=>{const l=vw(v),x=l.cx-l.width*.44,w=l.width*.88;return {...l,x,w,chart:{x:x+25,y:207,w:w-50,h:326},handle:{x:x+25,y:510,w:w-50,h:60},send:{x:l.cx-84,y:l.H-159,w:168,h:66}}};
  const promoRect=(g,kind)=>{const w=g.portrait?130:208,h=g.portrait?61:76;return {x:g.x+g.w-w-24,y:g.chart.y+(kind==='tip'?54:155),w,h};};
  function enter(){};
  function draw(ctx,v){const g=geo(v),l=g;sceneBackdrop(ctx,v,s.time,meta.id,meta.imperative,'',context?.options);timerRail(ctx,l,s,meta.seconds);
    theatrePanel(ctx,g.x,170,g.w,l.H-292,C.paper);
    tx(ctx,'QUARTERLY CLICKS',g.x+g.w/2,194,l.portrait?22:31,C.ink);
    const p=g.chart;const barW=Math.min(115,p.w*.25),barGap=Math.min(185,p.w*.36),bx=p.x+Math.max(48,(p.w-barGap-barW)/2);
    const ground=p.y+p.h-33,top=p.y+37,available=ground-top,max=1280;
    // Always draw the exact same figures. Only the axis scale can change.
    for(let i=0;i<5;i++){const y=top+i*available/4;line(ctx,p.x+21,y,p.x+p.w-17,y,'#cad6c8',2);tx(ctx,Math.round(max-(max-s.baseline)*i/4).toLocaleString('en-US'),p.x+27,y-13,l.portrait?11:15,C.slate,'left',800)}
    const range=Math.max(80,max-s.baseline),h1=clamp((1240-s.baseline)/range,0,1)*available,h2=clamp((1280-s.baseline)/range,0,1)*available;
    rr(ctx,bx,ground-h1,barW,Math.max(2,h1),5,C.blue,C.ink,3);
    rr(ctx,bx+barGap,ground-h2,barW,Math.max(2,h2),5,C.red,C.ink,3);
    tx(ctx,'1,240',bx+barW/2,ground-h1-18,l.portrait?16:23,C.ink);tx(ctx,'1,280',bx+barGap+barW/2,ground-h2-18,l.portrait?16:23,C.ink);
    tx(ctx,'LAST',bx+barW/2,ground+22,15,C.ink);tx(ctx,'NOW',bx+barGap+barW/2,ground+22,15,C.ink);
    const handleY=clamp(p.y+p.h-9+((1200-s.baseline)/1200)*5,p.y,p.y+p.h);
    rr(ctx,p.x-4,handleY-12,p.w+8,27,9,C.red,C.ink,4);
    tx(ctx,`BASELINE ${Math.round(s.baseline).toLocaleString('en-US')}     ↓ DRAG`,p.x+p.w/2,handleY+1,l.portrait?13:18,C.ink);
    if(s.corrected&&s.baseline===0){rr(ctx,g.x+25,g.chart.y-7,g.w-50,37,9,C.mint,C.ink,3);tx(ctx,'+40 CLICKS   /   +3.2%   /   ZERO BASELINE',l.cx,g.chart.y+12,l.portrait?13:19,C.ink);}
    else sticker(ctx,'MISLEADING!',g.x+g.w-85,g.chart.y+5,{size:l.portrait?11:15});
    // Sponsored Workflow: genuine signed help and cosmetic ad coexist; no automatic axis change.
    if(s.sponsored){
      for(const kind of ['tip','fake']){
        if(kind==='fake'&&s.fakeDismissed)continue;
        const r=promoRect(g,kind),held=s.promoDrag?.kind===kind;
        ctx.save();ctx.translate(held?s.promoDrag.dx:0,held?s.promoDrag.dy:0);
        rr(ctx,r.x+5,r.y+6,r.w,r.h,10,C.shadow,null);
        rr(ctx,r.x,r.y,r.w,r.h,10,kind==='tip'?'#d7fff0':'#ffe4bd',C.ink,3);
        rr(ctx,r.x,r.y,r.w,Math.min(24,r.h*.38),8,kind==='tip'?C.mint:C.red,C.ink,2);
        tx(ctx,kind==='tip'?'ASTER IT / VERIFIED':'PAID PLACEMENT',r.x+r.w/2,r.y+13,l.portrait?9:13,C.ink);
        tx(ctx,kind==='tip'?(s.tipOpened?'ZERO IS DOWN ↓':'OPEN REAL TIP'):'ADD 40% MORE GLOW',r.x+r.w/2,r.y+r.h*.57,l.portrait?10:15,C.ink);
        tx(ctx,kind==='tip'?'TAP FOR A HINT':'FLICK TO DISMISS',r.x+r.w/2,r.y+r.h*.83,l.portrait?9:12,C.slate);
        ctx.restore();
      }
      if(s.tipOpened&&!s.corrected){
        ctx.save();ctx.setLineDash([9,7]);line(ctx,g.chart.x+17,510,g.chart.x+17,580,C.mint,5);ctx.restore();
        tx(ctx,'PULL DOWN TO 0',g.chart.x+122,577,l.portrait?12:18,C.slate);
      }
      if(s.promoFlight){const f=s.promoFlight;ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.angle);rr(ctx,-56,-22,112,44,7,C.red,C.ink,3);tx(ctx,'SPONSORED',0,0,12,C.ink);ctx.restore();}
    }
    button(ctx,s.corrected?'STAMP  SEND':'SHOW  ZERO',g.send.x,g.send.y,g.send.w,g.send.h,{disabled:!s.corrected,small:l.portrait});
    if(!l.portrait)tx(ctx,s.corrected?'CORRECT SCALE. ORIGINAL DATA.':'PULL THE RED BASELINE DOWN TO ZERO',l.cx,l.H-28,l.portrait?13:17,C.cream);
    if(s.flash>0)stars(ctx,l.cx+g.w*.31,195,s.time*6,15,context?.options?.reducedMotion);
    drawResult(ctx,l,s,s.sent?'SENT WITH THE REAL SCALE':'SHUTTER CLOSED');
  }
  function pointerDown(p,v){if(s.finished)return;const g=geo(v);
    if(s.sponsored){for(const kind of ['tip','fake']){
      if(kind==='fake'&&s.fakeDismissed)continue;
      if(pointIn(p,promoRect(g,kind))){s.promoDrag={id:p.id,kind,startX:p.x,startY:p.y,dx:0,dy:0};return;}
    }}
    if(pointIn(p,g.send)){if(s.corrected&&s.baseline===0){s.sent=true;b.act(true,'send-real-chart',{base:0,from:1240,to:1280});b.complete('success',{chartBaseline:0,values:[1240,1280],percentageIncrease:40/1240*100,reportedDifference:40});}else b.act(false,'premature-send');return;}
    if(pointIn(p,{...g.handle,y:g.handle.y-28,h:94})){s.dragging=true;s.gesture={id:p.id,startY:p.y,startBaseline:s.baseline};return;}
  }
  function pointerMove(p){
    if(s.promoDrag?.id===p.id){s.promoDrag.dx=p.x-s.promoDrag.startX;s.promoDrag.dy=p.y-s.promoDrag.startY;return;}
    if(!s.dragging||s.gesture?.id!==p.id||s.finished)return;const dy=p.y-s.gesture.startY;s.baseline=clamp(s.gesture.startBaseline-dy*8,0,1200);if(s.baseline<45)s.baseline=0;s.corrected=s.baseline===0;}
  function pointerUp(p){
    if(s.promoDrag?.id===p.id){const drag=s.promoDrag,dist=Math.hypot(p.x-drag.startX,p.y-drag.startY);
      s.promoDrag=null;
      if(drag.kind==='tip'){
        if(dist<=70&&!s.tipOpened){s.tipOpened=true;b.act(true,'open-signed-scale-tip',{source:'ASTER IT'});}
        else if(dist>70)b.act(false,'fling-genuine-scale-tip');
      }else if(dist>70){s.fakeDismissed=true;s.promoFlight={x:p.x,y:p.y,vx:(p.x-drag.startX)*2.5,vy:(p.y-drag.startY)*2.5,angle:0,ttl:.8};b.act(true,'flick-cosmetic-ad',{objectId:'fake-creative'});}
      else {s.cosmeticPulse=.8;b.act(false,'accept-cosmetic-ad',{objectId:'fake-creative'});}
      return;
    }
    if(s.dragging&&s.gesture?.id===p.id){s.dragging=false;s.gesture=null;s.corrected=s.baseline===0;if(s.corrected&&!s.axisScored){s.axisScored=true;b.act(true,'correct-chart-axis',{before:1200,after:0});}}}
  function update(dt){b.update(dt);const step=clamp(Number.isFinite(dt)?dt:0,0,.1);
    s.cosmeticPulse=Math.max(0,s.cosmeticPulse-step);
    const f=s.promoFlight;if(f){f.x+=f.vx*step;f.y+=f.vy*step;f.vy+=560*step;f.angle+=step*3;f.ttl-=step;if(f.ttl<=0)s.promoFlight=null;}
  }
  return {enter,update,draw,pointerDown,pointerMove,pointerUp,cancelPointer(){s.dragging=false;s.gesture=null;s.promoDrag=null},snapshot:b.snapshot,dispose:noop};
}

function createP2(context,meta){
  const b=base(context,meta),s=b.state;
  Object.assign(s,{coverBeats:0,coverShield:0,graceSeconds:0,flight:[],restoreHelp:0,overlays:[{id:'saleA',kind:'sale',x:-.26,y:-.08,removed:false,rotation:-.07},{id:'saleB',kind:'sale',x:.10,y:.22,removed:false,rotation:.08},{id:'real',kind:'help',x:-.09,y:.04,removed:false,opened:false,rotation:-.02}],dragging:null,opened:false});
  const geo=v=>{const l=vw(v),w=Math.min(l.width*.92,880),h=Math.min(410,l.H*.53),x=l.cx-w/2,y=186;return {...l,x,y,w,h};};
  const cardsGeo=v=>{const g=geo(v),cw=Math.min(g.w*.54,400),ch=Math.min(g.portrait?140:173,g.h*.41);return s.overlays.map((o,i)=>({o,rect:{x:g.cx+o.x*g.w-cw*.5,y:g.y+g.h*.30+o.y*g.h-ch*.5,w:cw,h:ch},cw,ch}));};
  function draw(ctx,v){const g=geo(v),l=g;sceneBackdrop(ctx,v,s.time,meta.id,meta.imperative,'',context?.options);timerRail(ctx,l,s,meta.seconds+s.graceSeconds);
    theatrePanel(ctx,g.x,g.y,g.w,g.h,'#e9f6e8');rr(ctx,g.x+18,g.y+32,g.w-36,g.h-50,10,'#c7e1d7',C.ink,4);
    for(let i=0;i<7;i++){line(ctx,g.x+45,g.y+60+i*41,g.x+g.w-45,g.y+60+i*41,'#95b5b0',2)}
    tx(ctx,'PROJECTOR LIVE  •  CLIENT MEETING',l.cx,g.y+18,l.portrait?12:17,C.ink);
    for(const {o,rect:r} of cardsGeo(v)){
      if(o.removed)continue;
      const hostile=o.kind==='sale',fill=hostile?C.red:C.mint;
      
      // Popup cards independently draggable; contain actual trust-signalling text.
      ctx.save();ctx.translate(r.x,r.y);ctx.rotate(o.rotation);
      rr(ctx,8,8,r.w,r.h,12,C.shadow,null);rr(ctx,0,0,r.w,r.h,12,hostile?C.cream:'#f3fff4',C.ink,5);
      rr(ctx,0,0,r.w,32,10,fill,C.ink,3);
      tx(ctx,hostile?'EXTERNAL / SPONSORED':'ASTER IT / SIGNED',r.w/2,17,l.portrait?12:16,C.ink);
      if(hostile){tx(ctx,o.id==='saleA'?'BUY THE PREMIUM BRIEF':'SUPERCHARGE YOUR KPI',r.w/2,r.h*.49,l.portrait?14:20,C.ink);tx(ctx,'IGNORE TO CONTINUE',r.w/2,r.h*.73,l.portrait?11:14,C.red);sticker(ctx,'ADVERTISEMENT',r.w*.74,r.h*.99,{col:C.gold,size:11,angle:.11});}
      else {tx(ctx,'REAL PROJECTOR ALERT',r.w/2,r.h*.46,l.portrait?14:20,C.ink);tx(ctx,o.opened?'OPENED  ✓':'TAP TO READ • SAFE',r.w/2,r.h*.73,l.portrait?12:16,C.slate);}
      ctx.restore();
    }
    for(const f of s.flight){
      ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.angle);rr(ctx,-f.w/2,-f.h/2,f.w,f.h,9,C.red,C.ink,5);tx(ctx,'SPONSORED',0,0,l.portrait?10:16,C.ink);ctx.restore();
    }
    // Earned impact toast stays legible OVER flying paper.
    if(s.coverShield>0){
      const w=Math.min(g.w-36,l.portrait?320:430);rr(ctx,l.cx-w/2,g.y+23,w,48,12,C.mint,C.ink,4);
      tx(ctx,'AD BLOCK!  +0.8s SHUTTER',l.cx,g.y+49,l.portrait?13:19,C.ink);
    }
    const n=s.overlays.filter(x=>x.kind==='sale'&&x.removed).length;
    rr(ctx,l.cx-Math.min(l.width*.4,320),l.H-153,Math.min(l.width*.8,640),70,14,C.ink,C.mint,3);
    tx(ctx,`${n} / 2 HOSTILE ADS FLICKED`,l.cx,l.H-126,l.portrait?17:22,C.cream);
    tx(ctx,s.opened?'GENUINE ALERT OPENED':'PRESERVE THE SIGNED ALERT',l.cx,l.H-99,l.portrait?12:14,s.opened?C.mint:C.gold);
    if(!l.portrait)tx(ctx,'FLICK AWAY SPONSORED WINDOWS • TAP SIGNED HELP',l.cx,l.H-28,l.portrait?11:16,C.cream);
    drawResult(ctx,l,s,n===2&&s.opened?'MEETING SAVED':'PROJECTOR OVERRUN');
  }
  function pointerDown(p,v){
    if(s.finished)return;
    for(const {o,rect:r} of cardsGeo(v).reverse()){
      if(o.removed||!pointIn(p,{...r,x:r.x-15,y:r.y-15,w:r.w+30,h:r.h+30}))continue;
      s.dragging={id:p.id,overlay:o,startX:p.x,startY:p.y,oldX:o.x,oldY:o.y,oldRotation:o.rotation,lastX:p.x,lastY:p.y};return;
    }
  }
  function pointerMove(p,v){
    const d=s.dragging;if(!d||d.id!==p.id)return;const g=geo(v);
    d.overlay.x=d.oldX+(p.x-d.startX)/g.w;
    d.overlay.y=d.oldY+(p.y-d.startY)/g.h;
    d.overlay.rotation=clamp(d.oldRotation+(p.x-d.startX)*.00055,-.25,.25);
    d.lastX=p.x;d.lastY=p.y;
  }
  function pointerUp(p,v){
    const d=s.dragging;if(!d||d.id!==p.id)return;
    const g=geo(v),o=d.overlay,dx=p.x-d.startX,dy=p.y-d.startY;
    const distance=Math.hypot(dx,dy),threshold=Math.min(115,g.w*.24);
    if(o.kind==='help'){
      if(distance>threshold){
        b.act(false,'dismiss-genuine-help',{objectId:'real'});
        o.removed=true;s.restoreHelp=.85; // never soft-lock the scene: the signed alert returns.
      }else if(!o.opened){o.opened=true;s.opened=true;b.act(true,'open-signed-alert',{source:'ASTER IT'});check();}
    }else if(distance>=threshold){
      o.removed=true;
      const r=cardsGeo(v).find(entry=>entry.o.id===o.id)?.rect;
      const flying={id:o.id,x:p.x,y:p.y,w:r?.w||220,h:r?.h||120,vx:dx*3,vy:dy*3,angle:o.rotation,spin:dx*.004,ttl:1.25,cover:false};
      s.flight.push(flying);
      // Detect cover swept across the projector DURING the drag, not only after release.
      if(((d.startX<g.cx&&p.x>=g.cx)||(d.startX>g.cx&&p.x<=g.cx))&&p.y>=g.y&&p.y<=g.y+g.h)creditCover(flying);
      b.act(true,'flick-hostile-overlay',{objectId:o.id,manualDistance:Math.round(distance)});check();
    }else b.act(false,'uncommitted-flick',{objectId:o.id});
    if(!o.removed){o.x=d.oldX;o.y=d.oldY;o.rotation=d.oldRotation;}
    s.dragging=null;
  }
  function creditCover(f){
    if(f.cover)return;
    f.cover=true;s.coverBeats++;
    s.graceSeconds=Math.min(1.6,s.graceSeconds+.8);
    s.coverShield=1.25;
    b.emit({type:'popup-cover',objectId:f.id,synthetic:false,bonusWindowSeconds:.8});
  }
  function update(dt){
    b.update(dt);if(s.finished)return;
    const step=clamp(Number.isFinite(dt)?dt:0,0,.1);
    s.coverShield=Math.max(0,s.coverShield-step);
    if(s.restoreHelp>0){s.restoreHelp-=step;if(s.restoreHelp<=0){s.overlays.find(o=>o.id==='real').removed=false;s.overlays.find(o=>o.id==='real').x=-.09;s.overlays.find(o=>o.id==='real').y=.04;}}
    const g=geo(context?.viewport||{worldWidth:1200,worldHeight:760});
    for(const f of s.flight){
      const prevX=f.x;f.x+=f.vx*step;f.y+=f.vy*step;f.vy+=620*step;f.angle+=f.spin*step;f.ttl-=step;
      if(!f.cover&&((prevX<g.cx&&f.x>=g.cx)||(prevX>g.cx&&f.x<=g.cx))&&f.y>g.y&&f.y<g.y+g.h){
        creditCover(f);
      }
      if(f.x<g.x||f.x>g.x+g.w){f.vx*=-.6;f.x=clamp(f.x,g.x,g.x+g.w);}
    }
    s.flight=s.flight.filter(f=>f.ttl>0);
  }
  function check(){if(!s.finished&&s.opened&&s.overlays.filter(x=>x.kind==='sale'&&x.removed).length===2)b.complete('success',{adsRemoved:2,genuineHelpPreserved:true,genuineHelpOpened:true});}
  return {enter:noop,update,draw,pointerDown,pointerMove,pointerUp,cancelPointer(){s.dragging=null},snapshot:b.snapshot,dispose:noop};
}

function createP3(context,meta){
  const b=base(context,meta),s=b.state;
  Object.assign(s,{dial:0,dragging:null,locked:0,charge:0,sideways:0});
  const geo=v=>{const l=vw(v),w=Math.min(l.width*.93,850),x=l.cx-w/2,max=Math.min(190,w*.33);return {...l,x,w,max,trackY:l.H-233,knobY:l.H-232,screenY:206,screenH:268};};
  const target=()=>Math.sin(s.time*(s.locked===2?2.5:1.5)+s.locked*.8)*.67;
  function draw(ctx,v){const g=geo(v),l=g;sceneBackdrop(ctx,v,s.time,meta.id,meta.imperative,'',context?.options);timerRail(ctx,l,s,meta.seconds);
    theatrePanel(ctx,g.x,g.screenY,g.w,g.screenH,'#f7edd6');rr(ctx,g.x+21,g.screenY+25,g.w-42,g.screenH-47,8,C.ink,C.ink,3);
    ctx.save();ctx.beginPath();ctx.rect(g.x+24,g.screenY+28,g.w-48,g.screenH-53);ctx.clip();
    // Misfocused projection physically tilts Finch's face until corrected.
    ctx.translate(l.cx,g.screenY+139);ctx.rotate(s.locked===3?0:(s.dial-target())*.36);ctx.scale(1+Math.abs(s.dial-target())*.13,1+Math.abs(s.dial-target())*.13);
    drawFinch(ctx,0,34,1.08,s.time,s.locked===3?1:2,context?.options?.reducedMotion);ctx.restore();
    tx(ctx,s.locked===3?'IMAGE CRYSTAL CLEAR':'DON’T LET MANAGEMENT GO SIDEWAYS',l.cx,g.screenY+31,l.portrait?12:18,C.gold);
    for(let i=0;i<3;i++){const x=l.cx+(i-1)*Math.min(113,g.w*.27);circle(ctx,x,g.screenY+g.screenH-19,19,i<s.locked?C.mint:C.paper,C.ink,4);tx(ctx,i<s.locked?'✓':i+1,x,g.screenY+g.screenH-18,19,C.ink);}
    rr(ctx,l.cx-g.max-30,g.trackY-15,g.max*2+60,33,14,'#21363b',C.mint,4);
    rr(ctx,l.cx+target()*g.max-28,g.trackY-26,56,52,14,'#88dccc',C.ink,4);
    rr(ctx,l.cx+s.dial*g.max-33,g.knobY-34,66,68,23,C.gold,C.ink,6);
    circle(ctx,l.cx+s.dial*g.max,g.knobY,12,C.cream,C.ink,3);
    const frac=clamp(s.charge/.76,0,1);
    rr(ctx,l.cx-g.max,g.trackY+49,g.max*2,17,8,'#0f3136',C.mint,2);rr(ctx,l.cx-g.max,g.trackY+49,g.max*2*frac,17,8,C.mint,null);
    tx(ctx,`ALIGNMENT ${s.locked}/3   ${Math.round(frac*100)}% HOLD`,l.cx,g.trackY+103,l.portrait?15:21,C.cream);
    if(!l.portrait)tx(ctx,'DRAG THE GOLD DIAL • HOLD INSIDE THE MINT MARKER',l.cx,l.H-28,l.portrait?11:15,C.cream);
    drawResult(ctx,l,s,s.locked===3?'PICTURE PERFECT':'FINCH PRESENTED SIDEWAYS');
  }
  function pointerDown(p,v){if(s.finished)return;const g=geo(v);if(Math.abs(p.y-g.knobY)<65&&Math.abs(p.x-(g.cx+s.dial*g.max))<65){s.dragging={id:p.id};s.dial=clamp((p.x-g.cx)/g.max,-1,1);}}
  function pointerMove(p,v){if(s.dragging?.id!==p.id)return;const g=geo(v);s.dial=clamp((p.x-g.cx)/g.max,-1,1);}
  function pointerUp(p){if(s.dragging?.id===p.id){s.dragging=null;s.charge=0;}}
  function update(dt){b.update(dt);if(s.finished||!s.dragging)return;
    const step=clamp(Number.isFinite(dt)?dt:0,0,.1);
    if(step===0)return;
    const diff=Math.abs(s.dial-target());
    if(diff<.33){s.charge+=step;if(s.charge>=.76){s.charge=0;s.locked++;b.act(true,'slide-alignment-lock',{mark:s.locked});if(s.locked===3)b.complete('success',{alignmentMarks:3,physicalFocus:true});}}
    else{s.sideways++;s.charge=Math.max(0,s.charge-step*.42);}
  }
  return {enter:noop,update,draw,pointerDown,pointerMove,pointerUp,cancelPointer(){s.dragging=null;s.charge=0},snapshot:b.snapshot,dispose:noop};
}

function createP4(context,meta){
  const b=base(context,meta),s=b.state;
  const events=Array.isArray(context?.run?.events)?context.run.events:[];
  const incident=context?.run?.miraIncident ?? events.find(e=>e?.type==='mira-spill' || e?.type==='mira-saved');
  Object.assign(s,{cardX:0,cardY:0,dragging:null,selected:null,incidentObserved:!!incident,goalposts:directiveId(context)==='moving-goalposts',routeShift:0,shiftAnnounced:false});
  const geo=v=>{const l=vw(v),width=l.width,routeW=Math.min(360,(width-50)/2),routeY=l.H-268;return {...l,cardW:Math.min(360,width*.62),cardH:132,restX:l.cx,restY:402,routeY,routeW,leftRoute:{x:l.cx-routeW-11,y:routeY,w:routeW,h:154},rightRoute:{x:l.cx+11,y:routeY,w:routeW,h:154}};};
  // A route changes physical position only between gestures; art and collision use the same geometry.
  const routes=v=>{const g=geo(v),travel=g.rightRoute.x-g.leftRoute.x,t=s.routeShift;
    return {headline:{...g.leftRoute,x:g.leftRoute.x+travel*t},context:{...g.rightRoute,x:g.rightRoute.x-travel*t}};
  };
  function draw(ctx,v){const g=geo(v),l=g;sceneBackdrop(ctx,v,s.time,meta.id,meta.imperative,'',context?.options);timerRail(ctx,l,s,meta.seconds);
    theatrePanel(ctx,l.cx-Math.min(l.width*.45,480),171,Math.min(l.width*.9,960),238,'#eed9ba');
    tx(ctx,'MONTHLY REPORT',l.cx,197,l.portrait?22:30,C.ink);
    tx(ctx,'1,240  →  1,280 CLICKS  /  +3.2%',l.cx,238,l.portrait?16:25,C.ink);
    tx(ctx,s.incidentObserved?'WORKSTATION INTERRUPTION RECORDED':'MIRA INCIDENT: NOT OBSERVED',l.cx,272,l.portrait?13:18,C.slate);
    tx(ctx,'THE FACTS DO NOT CHANGE. THE EMPHASIS DOES.',l.cx,307,l.portrait?11:16,C.slate);
    if(s.goalposts){
       const y=g.routeY+g.leftRoute.h+13;line(ctx,g.leftRoute.x+18,y,g.rightRoute.x+g.rightRoute.w-18,y,C.gold,4);
       tx(ctx,s.routeShift<1?'GOALPOSTS MOVING ON A RAIL':'TARGET POSITIONS SWAPPED!',l.cx,y+10,l.portrait?10:15,C.gold);
     }
     const mapped=routes(v);
     for(const [name,r,col,subtitle] of [['HEADLINE',mapped.headline,C.gold,'NEXT STAFF TASK: PRIORITY PASS'],['CONTEXT',mapped.context,C.mint,'QUOTA BOSS: +0.6s WARNING']]){
      rr(ctx,r.x+3,r.y+6,r.w,r.h,17,C.shadow,null);rr(ctx,r.x,r.y,r.w,r.h,17,col,C.ink,5);
      tx(ctx,name,r.x+r.w/2,r.y+40,l.portrait?23:30,C.ink);
      const words=subtitle.split(':');tx(ctx,words[0],r.x+r.w/2,r.y+79,l.portrait?11:13,C.ink);tx(ctx,words[1]||'',r.x+r.w/2,r.y+100,l.portrait?12:17,C.ink);
    }
    const x=(s.dragging?s.cardX:g.restX),y=(s.dragging?s.cardY:g.restY),w=g.cardW,h=g.cardH;
    ctx.save();ctx.translate(x,y);ctx.rotate(s.dragging?clamp((x-l.cx)/l.width*.23,-.22,.22):Math.sin(s.time*2)*.023);
    rr(ctx,-w/2+7,-h/2+9,w,h,13,'#0c1a1d',null);rr(ctx,-w/2,-h/2,w,h,13,C.cream,C.ink,5);
    rr(ctx,-w/2, -h/2,w,29,9,C.red,C.ink,3);tx(ctx,'APPROVED CONTENT',0,-h/2+15,l.portrait?12:16,C.ink);
    tx(ctx,'REPORT →',0,-12,l.portrait?22:31,C.ink);tx(ctx,'DRAG TO A ROUTE',0,34,l.portrait?12:15,C.slate);ctx.restore();
    if(!l.portrait)tx(ctx,'ONE PHYSICAL CHOICE, TWO HONEST BENEFITS',l.cx,l.H-28,l.portrait?12:16,C.cream);
    drawResult(ctx,l,s,s.selected?`${s.selected} SELECTED`:'DOCUMENT NOT SENT');
  }
  function pointerDown(p,v){if(s.finished)return;const g=geo(v);if(Math.abs(p.x-g.restX)<g.cardW/2+17&&Math.abs(p.y-g.restY)<g.cardH/2+22){s.dragging={id:p.id,downX:p.x,downY:p.y};s.cardX=p.x;s.cardY=p.y;}}
  function pointerMove(p){if(s.dragging?.id!==p.id)return;s.cardX=p.x;s.cardY=p.y;}
  function pointerUp(p,v){if(s.dragging?.id!==p.id)return;const g=routes(v),route=pointIn(p,g.headline)?'headline':pointIn(p,g.context)?'context':null;s.dragging=null;
    if(!route){b.act(false,'unrouted-report');s.cardX=0;s.cardY=0;return;}
    s.selected=route;b.act(true,'route-report',{route});const effect=route==='headline'?{type:'priority-pass',uses:1,target:'next-staff-card'}:{type:'quota-warning-card',leadSeconds:.6,uses:1,target:'the-quota'};
    b.complete('success',{facts:{before:1240,after:1280,percentageIncrease:40/1240*100,miraIncidentObserved:!!incident},framing:route,effect});
  }
  function update(dt){
     b.update(dt);
     const step=clamp(Number.isFinite(dt)?dt:0,0,.1);
     if(s.finished||!s.goalposts||s.dragging||s.time<1.6)return;
     if(!s.shiftAnnounced){s.shiftAnnounced=true;b.emit({type:'directive-shift',directive:'moving-goalposts',synthetic:true});}
     s.routeShift=clamp(s.routeShift+step/0.7,0,1);
   }
   return {enter:noop,update,draw,pointerDown,pointerMove,pointerUp,cancelPointer(){s.dragging=null},snapshot:b.snapshot,dispose:noop};
}

export const definitions=Object.freeze(cards.map((meta,i)=>Object.freeze({
  id:meta.id,department:'pr',imperative:meta.imperative,seconds:meta.seconds,authoredReferenceMs:meta.referenceMs,
  create(context){return [createP1,createP2,createP3,createP4][i](context,meta);}
})));
export default definitions;
