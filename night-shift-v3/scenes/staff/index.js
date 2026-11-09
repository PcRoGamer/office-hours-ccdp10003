/**
 * QUOTA PANIC: NIGHT SHIFT v3 · Staff Support (T1–T4)
 * Canonical GDD: staff rescue, physical exit clearing, clock timing,
 * and exactly two independently allocated $40 tool licences.
 *
 * Native browser ES module. All coordinates are WORLD coordinates; LEAD/RENDER
 * supply a viewport with worldWidth/worldHeight and transformed pointer events.
 * Scenes render WORLD ONLY; HUD/time/hearts belong to the renderer.
 * No DOM, interval clocks, mutable global state or external dependencies.
 */
import {PALETTE as P, backdrop, character, crate, clamp, round, type, effect, impactText, shadow, starburst} from './art.js';

const EPS=1e-5;
const CONFIG={
 T1:{id:'T1',department:'staff',imperative:'GET THEM OUT!',seconds:21,tags:['worker','rescue','sweep','mira','hazard']},
 T2:{id:'T2',department:'staff',imperative:'CLEAR THE EXIT!',seconds:18,tags:['physics','flick','chain','worker','bumper']},
 T3:{id:'T3',department:'staff',imperative:'CLOCK OUT!',seconds:15,tags:['timing','hazard','clock']},
 T4:{id:'T4',department:'staff',imperative:'PASS THE TOOLS!',seconds:23,tags:['licence','worker','choice','consequence','drag']}
};
export const STAFF_CARD_IDS=Object.freeze(['T1','T2','T3','T4']);
export function readStaffSceneLayout(viewport={}){
 const h=Number.isFinite(viewport.worldHeight)?viewport.worldHeight:760;
 const w=Number.isFinite(viewport.worldWidth)?viewport.worldWidth:1200;
 const left=Math.max(28,w/2-Math.min(505,w*.5-28));
 const right=w-left;
 const aw=right-left, portrait=w/h<.94;
 return {w,h,left,right,aw,center:w*.5,portrait,
  exitX:right-Math.min(83,aw*.16),
  laneYs:portrait?[354,455,554]:[346,452,557],
  blockX:left+aw*.49,
  safeRect:viewport.safeRect??{x:left,y:235,w:aw,h:440}};
}
function inside(p,x,y,r){return Math.hypot(p.x-x,p.y-y)<=r;}
function inRect(p,x,y,w,h){return p.x>=x&&p.x<=x+w&&p.y>=y&&p.y<=y+h;}
function emit(context,event){context.events?.emit?.(event);}
function sfx(context,key,x,y){
 const e={type:'audio-cue',cue:key,department:'staff',x,y};
 emit(context,e);
 if(typeof context.audio?.trigger==='function')context.audio.trigger(key);
 else if(typeof context.audio?.play==='function')context.audio.play(key);
}
function perkLevel(context,id){
 const p=context.effects?.perks??context.run?.perks??{};
 if(Array.isArray(p))return p.filter(x=>x===id||x?.id===id).length;
 return Number(p[id]??0)||0;
}
function directive(context){return context.effects?.directive?.id??context.run?.directive?.id??context.effects?.directive??context.run?.directive??null;}
function makeEffects(){
 return {particles:[],message:'',msgLife:0,flash:0};
}
function spawn(parts,x,y,color=P.gold,n=18){
 for(let i=0;i<n;i++){
  const angle=i*(Math.PI*2/n),v=100+(i*13%110);
  parts.push({x,y,vx:Math.cos(angle)*v,vy:Math.sin(angle)*v-50,sz:4+i%5,r:i*.8,vr:i%2?5:-5,life:.52+i%4*.07,max:.75,color});
 }
}
function updateFX(fx,dt){
 fx.msgLife=Math.max(0,fx.msgLife-dt);fx.flash=Math.max(0,fx.flash-dt);
 for(let i=fx.particles.length-1;i>=0;i--){
  const p=fx.particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=315*dt;
  p.vx*=Math.exp(-1.3*dt);p.r+=p.vr*dt;p.life-=dt;
  if(p.life<=0)fx.particles.splice(i,1);
 }
}
function announce(fx,message,duration=1.05){fx.message=message;fx.msgLife=duration;fx.flash=.08;}
function ribbon(c,layout,title,sub=''){
 const {left,right,w,portrait}=layout;
 const rw=Math.min(right-left,725),x=w*.5-rw*.5;
 round(c,x,224,rw,55,11,'#fbedd0',P.ink,5);
 type(c,title,w*.5,249,portrait?25:31,P.ink,'center');
 if(sub)type(c,sub,w*.5,290,portrait?12:15,'#e5e2c9','center');
}
function foam(c,layout,t,y=632){
 const {w,left,right}=layout;
 // physical stage lip and office prop silhouettes
 round(c,left-16,y,right-left+32,21,9,'#0f353d','#92a39a',4);
 for(let x=left;x<right;x+=32){
  c.fillStyle=x%64?'#ffd06f':'#7fd2a3';c.fillRect(x,y+8,19,4);
 }
 for(let i=0;i<5;i++){
  const x=left+25+i*(right-left-50)/4;
  c.fillStyle='#ebd0a633';c.beginPath();
  c.arc(x,y+40+Math.sin(t+i)*3,3,0,Math.PI*2);c.fill();
 }
}
function badge(c,message,x,y,color=P.gold){
 round(c,x-64,y-18,128,36,7,color,P.ink,3);
 type(c,message,x,y,15,P.deep,'center');
}
function safeCall(fn){try{fn?.();}catch{/* Optional sound/visual integrations cannot break rules. */}}
function newScene(id,context={}){
 const cfg=CONFIG[id];
 if(!cfg)throw new Error('Unknown Staff card '+id);
 const fx=makeEffects(),state={
  id,elapsed:0,complete:false,failed:false,disposed:false,
  pointer:null,successAt:null,attemptId:context.run?.attemptId??id+'-attempt',
  workers:[{id:'mira',name:'MIRA'},{id:'jules',name:'JULES'},{id:'ray',name:'RAY'}],
  boxPosterDown:false,overtimeTicks:0,tokenChoices:[],
 };
 let started=false;
 const layout=()=>readStaffSceneLayout(context.viewport);
 function init(){
  started=true;state.elapsed=0;state.complete=false;state.failed=false;
  const l=layout();state.pointer=null;state.evidence=null;state.successAt=null;
  if(id==='T1'){
   state.workers=state.workers.map((v,i)=>({...v,x:l.left+70,y:l.laneYs[i],
    blocked:true,dispatched:false,escaped:false,animation:0,goalX:l.exitX+12}));
   state.bonusUntil=null;state.miraAssist=false;
  }
  if(id==='T2'){
   const bx=l.center;
   state.boxes=[
    {id:'crate-a',x:bx-68,y:384,r:0,vx:0,vy:0,size:83},
    {id:'crate-b',x:bx+25,y:461,r:.07,vx:0,vy:0,size:87},
    {id:'crate-c',x:bx-35,y:540,r:-.04,vx:0,vy:0,size:86},
   ];
   state.workerX=l.left+63;state.workerY=455;state.workerRunning=false;state.boxPosterDown=false;
  }
  if(id==='T3')state.overtimeTicks=0;
  if(id==='T4'){
   state.tokens=[
    {id:'licence-mira',owner:'MIRA',x:l.left+l.aw*.36,y:578,choice:null,settle:0},
    {id:'licence-jules',owner:'JULES',x:l.left+l.aw*.64,y:578,choice:null,settle:0}
   ];state.readyToFinish=null;state.tokenChoices=[];state.stationShift=0;
  }
 }
 function flash(message,x=layout().center,y=410,c=P.gold){
  announce(fx,message);spawn(fx.particles,x,y,c);
 }
 function complete(evidence){
  if(state.complete||state.failed||state.disposed)return;
  state.complete=true;state.evidence=structuredClone(evidence);
  const outcome={status:'success',...structuredClone(evidence)};
  emit(context,{type:'card-complete',cardId:id,outcome,
    evidence:structuredClone(evidence),
    attemptId:state.attemptId,synthetic:false});
  sfx(context,'staff-complete',layout().center,340);
 }
 function fail(reason='time-expired'){
  if(state.complete||state.failed||state.disposed)return;
  state.failed=true;
  emit(context,{type:'card-failed',cardId:id,reason,
    attemptId:state.attemptId,synthetic:false});
  sfx(context,'staff-failed',layout().center,430);
 }
 function timeWindow(){
  // 45%-of-cycle green band, independent of rendering cadence.
  const phase=(state.elapsed*.47+.18)%1;
  return {phase,open:phase>.21&&phase<.66};
 }
 function boxesInPath(l){
  const xlo=l.center-112,xhi=l.center+112;
  return state.boxes.filter(b=>b.x+b.size*.44>xlo&&b.x-b.size*.44<xhi&&b.y+b.size*.44>350&&b.y-b.size*.44<561);
 }
 function stations(l){
  const r=Math.min(93,l.aw*.17);
  const shift=state.stationShift||0;
  return {
   MIRA:{x:l.left+l.aw*.18+shift,y:368,r},
   JULES:{x:l.center,y:368,r},
   SAVE:{x:l.right-l.aw*.18-shift,y:368,r}
  };
 }
 function update(dt){
  if(!started)init();
  if(state.complete||state.failed||state.disposed)return;
  const d=clamp(Number(dt)||0,0,.05);
  state.elapsed+=d;updateFX(fx,d);
  const l=layout();
  if(id==='T1'){
    for(const w of state.workers){
      if(!w.dispatched||w.escaped)continue;
      w.animation+=d;
      w.x+=Math.min(460*d,w.goalX-w.x);
      if(w.x>=w.goalX-EPS){
       w.escaped=true;
       flash(w.name+' IS OUT!',w.x,w.y,P.mint);
       sfx(context,'staff-rescue',w.x,w.y);
      }
    }
    const n=state.workers.filter(w=>w.escaped).length;
    if(n>=2&&state.bonusUntil===null)state.bonusUntil=state.elapsed+3;
    if(n===3||(n>=2&&state.elapsed>=state.bonusUntil&&state.workers.every(w=>!w.dispatched||w.escaped)))
      complete({workersRescued:n,workersSeen:3,
        workerIdsRescued:state.workers.filter(w=>w.escaped).map(w=>w.id),
        staffAccessUnchanged:true,manualInteractions:true});
  }
  if(id==='T2'){
    // Authored kinematic fallbacks until PHYSICS imports Planck bodies;
    // resolved by ACTUAL position, not a click counter or an invisible score.
    for(const b of state.boxes){
      if(state.pointer?.type==='box'&&state.pointer.id===b.id)continue;
      b.x+=b.vx*d;b.y+=b.vy*d;
      b.vx*=Math.exp(-3*d);b.vy*=Math.exp(-3*d);
      if(b.x<l.left+40||b.x>l.right-40){b.x=clamp(b.x,l.left+40,l.right-40);b.vx*=-.45;}
      if(b.y<294||b.y>600){b.y=clamp(b.y,294,600);b.vy*=-.44;}
      b.r+=b.vx*d*.0012;
    }
    for(let i=0;i<state.boxes.length;i++)for(let j=i+1;j<state.boxes.length;j++){
      const a=state.boxes[i],b=state.boxes[j],dx=b.x-a.x,dy=b.y-a.y;
      const dist=Math.hypot(dx,dy)||1,minDist=(a.size+b.size)*.46;
      if(dist<minDist){
       const nx=dx/dist,ny=dy/dist,pen=minDist-dist;
       a.x-=nx*pen*.5;a.y-=ny*pen*.5;b.x+=nx*pen*.5;b.y+=ny*pen*.5;
       const va=a.vx*nx+a.vy*ny,vb=b.vx*nx+b.vy*ny;
       if(va>vb){
        const impulse=(va-vb)*.72;
        a.vx-=impulse*nx;a.vy-=impulse*ny;
        b.vx+=impulse*nx;b.vy+=impulse*ny;
        if(impulse>26){spawn(fx.particles,(a.x+b.x)/2,(a.y+b.y)/2,P.gold,6);sfx(context,'staff-crate',b.x,b.y);}
       }
      }
    }
    if(!state.workerRunning&&boxesInPath(l).length===0){
      state.workerRunning=true;flash('LANE OPEN!',l.center,400,P.mint);sfx(context,'staff-cleared',l.center,400);
    }
    if(state.workerRunning){
      state.workerX+=Math.min(285*d,l.exitX+14-state.workerX);
      if(state.workerX>=l.exitX+14-EPS){
       complete({boxesCleared:3,workerCrossedExit:true,
        posterDown:state.boxPosterDown,manualInteractions:true});
      }
    }
  }
  if(id==='T4'){
    for(const t of state.tokens){
      if(t.choice)t.settle+=d;
      else if(state.pointer?.id!==t.id){
       const bx=l.left+l.aw*(t.owner==='MIRA'?.36:.64);
       t.x=bx+Math.sin(state.elapsed*1.6+(t.owner==='MIRA'?0:2))*21;
       t.y=578+Math.sin(state.elapsed*1.2+(t.owner==='MIRA'?1:3))*3;
      }
    }
    if(state.readyToFinish!==null&&state.elapsed>=state.readyToFinish)
      complete(licenseEvidence());
  }
  // A scene's authored time is a failure checkpoint, not an implicit award.
  if(state.elapsed>=cfg.seconds)fail('time-expired');
 }
 function licenseEvidence(){
  const choices=state.tokens.map(t=>({id:t.id,worker:t.owner,
    destination:t.choice,amount:40,manual:true}));
  const licensesGiven=choices.filter(c=>c.destination==='GIVE').length;
  const savingsDollars=choices.filter(c=>c.destination==='SAVE').length*40;
  return {tokensAllocated:choices.length,licensesGiven,savingsDollars,
    totalBudget:80,unallocatedDollars:80-licensesGiven*40-savingsDollars,
    staffAccess:{mira:state.tokens[0].choice==='GIVE',jules:state.tokens[1].choice==='GIVE'},
    choices,manualInteractions:true};
 }
 function pointerDown(p){
  if(!started)init();
  if(state.complete||state.failed||state.disposed||state.pointer)return;
  const l=layout(),radius=perkLevel(context,'perk:magnet-grip')?13:0;
  if(id==='T1'){
    for(let i=0;i<state.workers.length;i++){
      const w=state.workers[i];
      if(w.escaped||w.dispatched)continue;
      if(w.blocked&&inRect(p,l.blockX-45,w.y-36,90,72)){
        state.pointer={type:'sweep',id:w.id,x0:p.x,y0:p.y,px:p.x};return;
      }
      if(!w.blocked&&inside(p,w.x,w.y-62,49+radius)){
        w.dispatched=true;sfx(context,'staff-go',w.x,w.y);
        flash('GO, '+w.name+'!',w.x+75,w.y-110,P.mint);return;
      }
    }
    // Collaborating with Mira is an optional real worker intervention, never a ghost rescue.
    if(directive(context)==='mandatory-collaboration'&&!state.miraAssist
       &&inside(p,l.left+48,290,40+radius)){
      const w=state.workers.find(w=>w.blocked&&!w.dispatched);
      if(w){w.blocked=false;state.miraAssist=true;flash('MIRA SWEPT A LANE!',l.blockX,w.y,P.mint);
        sfx(context,'staff-help',l.blockX,w.y);}
    }
  }
  if(id==='T2'){
    for(const b of [...state.boxes].reverse()){
      if(inside(p,b.x,b.y,b.size*.62+radius)){
       state.pointer={type:'box',id:b.id,x0:p.x,y0:p.y,
        ox:b.x,oy:b.y,lastX:p.x,lastY:p.y};sfx(context,'staff-grab',b.x,b.y);return;
      }
    }
  }
  if(id==='T3'){
    const r=Math.min(173,l.aw*.28);
    if(inside(p,l.center,445,r+radius)){
      if(timeWindow().open){
        flash('SHIFT RELEASED!',l.center,392,P.mint);
        sfx(context,'staff-clock-good',l.center,445);
        complete({clockedOut:true,overtimeTicks:state.overtimeTicks,
          timedWindowUsed:true,manualInteractions:true});
      }else{
        state.overtimeTicks++;flash('OVERTIME!',l.center,400,P.coral);
        sfx(context,'staff-overtime',l.center,445);
        if(state.overtimeTicks>=4)fail('overtime-overload');
      }
    }
  }
  if(id==='T4'){
    for(const t of [...state.tokens].reverse()){
      if(!t.choice&&inside(p,t.x,t.y,46+radius)){
        state.pointer={type:'token',id:t.id,ox:t.x,oy:t.y};
        sfx(context,'staff-token-grab',t.x,t.y);return;
      }
    }
  }
 }
 function pointerMove(p){
  if(!state.pointer||state.complete||state.failed||state.disposed)return;
  const it=state.pointer,l=layout();
  if(it.type==='sweep'){
   const w=state.workers.find(w=>w.id===it.id);
   if(w?.blocked&&Math.abs(p.x-it.x0)>42&&Math.abs(p.y-w.y)<65){
     w.blocked=false;state.pointer=null;
     flash('PATH CLEAR!',l.blockX,w.y,P.mint);
     sfx(context,'staff-sweep',l.blockX,w.y);
   }
  }
  if(it.type==='box'){
    const b=state.boxes.find(b=>b.id===it.id);
    if(b){b.x=clamp(it.ox+p.x-it.x0,l.left+40,l.right-40);
      b.y=clamp(it.oy+p.y-it.y0,286,608);
      it.lastX=p.x;it.lastY=p.y;}
  }
  if(it.type==='token'){
    const t=state.tokens.find(t=>t.id===it.id);
    if(t){t.x=clamp(p.x,l.left,l.right);t.y=clamp(p.y,279,608);}
  }
 }
 function pointerUp(p){
  if(!state.pointer||state.complete||state.failed||state.disposed)return;
  const it=state.pointer,l=layout();state.pointer=null;
  if(it.type==='box'){
    const b=state.boxes.find(b=>b.id===it.id);
    if(!b)return;
    const dx=p.x-it.x0,dy=p.y-it.y0;
    b.vx=clamp(dx*2.7,-710,710);b.vy=clamp(dy*2.7,-650,650);
    if(Math.abs(dx)+Math.abs(dy)>25){
      sfx(context,'staff-flick',b.x,b.y);spawn(fx.particles,b.x,b.y,P.gold,12);
      if(b.x<l.left+125&&b.y<365){state.boxPosterDown=true;announce(fx,'SAFETY POSTER DOWN!');}
    }
  }
  if(it.type==='token'){
    const t=state.tokens.find(t=>t.id===it.id);
    if(!t||t.choice)return;
    const targets=stations(l);
    let hit=null;
    for(const [name,pt] of Object.entries(targets)){
      if(inside(p,pt.x,pt.y,pt.r+16))hit=name;
    }
    if(hit==='SAVE'||hit===t.owner){
      t.choice=hit==='SAVE'?'SAVE':'GIVE';
      t.x=targets[hit].x;t.y=targets[hit].y+35;
      state.tokenChoices.push({id:t.id,destination:t.choice});
      sfx(context,t.choice==='GIVE'?'staff-licence-given':'staff-budget-saved',t.x,t.y);
      flash(t.choice==='GIVE'?'ACCESS GRANTED!':'$40 SAVED!',t.x,t.y,P.mint);
      if(state.tokens.every(token=>token.choice)){
        state.readyToFinish=state.elapsed+.85; // show both visible consequences
      }else if(directive(context)==='moving-goalposts'){
        state.stationShift=Math.min(15,l.aw*.035);
      }
    }else{
      // Off-target release does not allocate money or staff access.
      t.x=l.left+l.aw*(t.owner==='MIRA'?.36:.64);t.y=578;
      flash('WRONG DESK! TRY AGAIN',t.x,t.y,P.coral);sfx(context,'staff-reject',t.x,t.y);
    }
  }
 }
 function cancelPointer(){
  if(!state.pointer)return;
  const it=state.pointer;state.pointer=null;
  if(it.type==='token'){
    const t=state.tokens.find(t=>t.id===it.id);
    if(t&&!t.choice){const l=layout();t.x=l.left+l.aw*(t.owner==='MIRA'?.36:.64);t.y=578;}
  }
 }
 function draw(c,viewport=context.viewport){
  if(!started)init();
  const l=readStaffSceneLayout(viewport),t=state.elapsed;
  c.save();
  backdrop(c,l,id,t);foam(c,l,t);
  if(id==='T1')drawRescue(c,l,t);
  if(id==='T2')drawBoxes(c,l,t);
  if(id==='T3')drawClock(c,l,t);
  if(id==='T4')drawLicences(c,l,t);
  effect(c,fx.particles);
  impactText(c,fx.message,l.center,315,fx.msgLife);
  if(fx.flash>0){c.fillStyle='rgba(255,220,125,'+(fx.flash*.18)+')';c.fillRect(0,0,l.w,l.h);}
  c.restore();
 }
 function drawRescue(c,l,t){
  ribbon(c,l,'CLEAR THE PATH · SAVE THE TEAM','SWEEP THE YELLOW TAPE. TAP THE WORKERS TO RUN.');
  const x0=l.left+8,x1=l.exitX+54;
  round(c,x0,309,x1-x0,310,21,'#315c58','#b0d0ac',6);
  for(let i=0;i<3;i++){
    const y=l.laneYs[i];
    c.fillStyle=i%2?'#c3d3b01d':'#e8ce9022';c.fillRect(x0+7,y-51,x1-x0-14,91);
    c.setLineDash([17,16]);c.strokeStyle='#d4d5b288';c.lineWidth=3;
    c.beginPath();c.moveTo(x0+12,y+42);c.lineTo(x1-12,y+42);c.stroke();c.setLineDash([]);
  }
  // EXIT is a monumental doorway, not a tiny matching bin.
  round(c,l.exitX-36,284,118,340,14,'#112f2d','#f8d06e',7);
  round(c,l.exitX-19,302,86,300,9,'#64ce9c','#102d33',4);
  type(c,'EXIT',l.exitX+24,323,24,'#113638','center');
  c.fillStyle='#9eecc5';c.beginPath();c.moveTo(l.exitX+8,485);c.lineTo(l.exitX+40,485);
  c.lineTo(l.exitX+40,470);c.lineTo(l.exitX+60,494);c.lineTo(l.exitX+40,519);
  c.lineTo(l.exitX+40,503);c.lineTo(l.exitX+8,503);c.closePath();c.fill();
  for(let i=0;i<state.workers.length;i++){
    const w=state.workers[i],y=w.y;
    if(w.blocked){
      c.save();c.translate(l.blockX,y);
      round(c,-31,-51,62,106,8,'#f2b658',P.ink,5);
      c.beginPath();c.rect(-31,-44,62,95);c.clip();
      c.strokeStyle='#222a32';c.lineWidth=13;
      for(let v=-90;v<95;v+=28){c.beginPath();c.moveTo(-42,v);c.lineTo(52,v-65);c.stroke();}
      c.restore();
      type(c,'SWIPE →',l.blockX,y+73,16,P.paper,'center');
    }else if(!w.dispatched){
      badge(c,'SAFE TO RUN',l.blockX,y-35,P.mint);
    }
    if(w.escaped){starburst(c,l.exitX+23,y-72,Math.sin(t*3)*.18,P.mint);continue;}
    character(c,w.x,w.y+32,.49,w.name,w.dispatched?'yay':w.blocked?'worry':'idle',t);
    if(!w.blocked&&!w.dispatched){
     c.strokeStyle=P.mint;c.lineWidth=5;c.beginPath();
     c.arc(w.x,w.y-43,51,0,2*Math.PI);c.stroke();
    }
  }
  if(directive(context)==='mandatory-collaboration'&&!state.miraAssist){
    round(c,l.left+3,272,95,43,10,P.mint,P.ink,4);
    type(c,'MIRA HELP',l.left+50,293,15,P.ink,'center');
  }
  const n=state.workers.filter(w=>w.escaped).length;
  type(c,'TEAM SAFE  '+n+'/3',l.left+17,671,l.portrait?21:26,P.paper);
  type(c,'2 REQUIRED · THIRD OPTIONAL',l.right-4,671,l.portrait?11:15,P.gold,'right');
 }
 function drawBoxes(c,l,t){
  ribbon(c,l,'MAKE WAY FOR THE TEAM','GRAB & FLICK THE BOXES OUT OF THE EXIT LANE.');
  const laneW=Math.min(l.aw*.67,490);
  round(c,l.center-laneW*.5,323,laneW,271,18,'#416058','#e2c17a',5);
  c.fillStyle='#fff2be22';c.fillRect(l.center-111,338,222,244);
  c.setLineDash([13,13]);c.strokeStyle='#f8d968';c.lineWidth=4;
  c.strokeRect(l.center-111,342,222,238);c.setLineDash([]);
  round(c,l.left+8,404,134,129,10,'#dfcea1',P.ink,4);
  type(c,state.boxPosterDown?'NO SAFETY':'SAFETY',l.left+75,435,17,P.ink,'center');
  type(c,'POSTER',l.left+75,465,17,P.ink,'center');
  type(c,'100% SAFE*',l.left+75,490,13,P.coral,'center');
  round(c,l.exitX-32,355,100,195,13,'#3e866d',P.gold,5);
  type(c,'EXIT',l.exitX+16,379,22,P.paper,'center');
  character(c,state.workerX,state.workerY+100,.64,'RAY',state.workerRunning?'yay':'worry',t);
  for(const b of state.boxes)crate(c,b.x,b.y,b.size,b.r,false);
  for(let j=0;j<8;j++){
   const yy=338+j*27;c.fillStyle='#ffd16f80';c.fillRect(l.center-112,yy,6,13);
  }
  type(c,'BLOCKERS REMAIN  '+boxesInPath(l).length,l.center,670,l.portrait?17:25,P.paper,'center');
 }
 function drawClock(c,l,t){
  ribbon(c,l,'CLOCK OUT!',"HIT THE GREEN BEAT. DON'T DONATE OVERTIME.");
  const cx=l.center,cy=445,r=Math.min(173,l.aw*.28),tw=timeWindow();
  shadow(c,cx,cy+r+56,r*1.5);
  c.save();c.translate(cx,cy);
  c.fillStyle='#122c35';c.beginPath();c.arc(0,0,r+22,0,2*Math.PI);c.fill();
  c.strokeStyle=P.gold;c.lineWidth=10;c.beginPath();c.arc(0,0,r+19,0,2*Math.PI);c.stroke();
  c.fillStyle='#f0e4cd';c.beginPath();c.arc(0,0,r,0,2*Math.PI);c.fill();
  for(let i=0;i<12;i++){
   const a=i*2*Math.PI/12-Math.PI*.5;
   c.strokeStyle=i%3===0?P.ink:'#688f88';c.lineWidth=i%3===0?7:4;
   c.beginPath();c.moveTo(Math.cos(a)*(r-23),Math.sin(a)*(r-23));
   c.lineTo(Math.cos(a)*(r-10),Math.sin(a)*(r-10));c.stroke();
  }
  // Physical luminous green release arc and danger clock hand.
  c.strokeStyle='#4bbc91';c.lineWidth=21;c.lineCap='round';
  c.beginPath();c.arc(0,0,r-30,.21*Math.PI*2-Math.PI/2,.66*Math.PI*2-Math.PI/2);c.stroke();
  const hand=tw.phase*Math.PI*2-Math.PI/2;
  c.save();c.rotate(hand);round(c,-11,-r+38,22,r+62,9,'#e65d50',P.ink,3);c.restore();
  c.beginPath();c.arc(0,0,28,0,2*Math.PI);c.fillStyle=tw.open?'#58e4a8':'#ef785c';c.fill();
  c.strokeStyle=P.ink;c.lineWidth=5;c.stroke();
  type(c,tw.open?'NOW!':'HOLD',0,3,tw.open?23:20,P.deep,'center');
  c.restore();
  type(c,tw.open?'GREEN WINDOW OPEN':'WAIT FOR GREEN',cx,668,25,tw.open?P.mint:P.paper,'center');
  if(state.overtimeTicks){
   c.save();c.translate(cx+r*.72,cy-r*.65);c.rotate(-.2);
   round(c,-82,-25,164,50,6,P.coral,P.ink,4);
   type(c,'OVERTIME ×'+state.overtimeTicks,0,0,19,P.deep,'center');c.restore();
  }
 }
 function drawLicences(c,l,t){
  ribbon(c,l,'PASS THE TOOLS!',"2 LICENCES × $40. ACCESS OR SAVINGS. YOUR CALL.");
  const targets=stations(l);
  const stationWidth=Math.min(158,l.aw*.30);
  for(const name of ['MIRA','JULES','SAVE']){
    const pt=targets[name],cash=name==='SAVE';
    const chosen=state.tokens.find(token=>token.owner===name)?.choice;
    const granted=chosen==='GIVE',saved=state.tokens.some(token=>token.owner===name&&token.choice==='SAVE');
    round(c,pt.x-stationWidth*.5,305,stationWidth,205,18,
      granted?'#418b76':saved?'#614c4d':cash?'#4e5e4f':'#41646b',
      granted?P.mint:P.gold,5);
    if(cash){
      round(c,pt.x-47,373,94,63,11,'#f6c465',P.ink,4);
      type(c,'$40',pt.x,406,28,P.ink,'center');
      type(c,'SAVE',pt.x,330,l.portrait?15:20,P.paper,'center');
      type(c,'CASH',pt.x,465,17,P.paper,'center');
    }else{
      character(c,pt.x,473,l.portrait?.48:.57,name,granted?'yay':saved?'worry':'idle',t,{tool:granted});
      type(c,granted?'ACCESS ✓':saved?'LOCKED':'ACCESS?',pt.x,320,l.portrait?13:16,granted?P.mint:P.paper,'center');
    }
  }
  round(c,l.left+16,541,l.aw-32,97,14,'#173d46',P.gold,5);
  for(let x=l.left+25;x<l.right-25;x+=46){
    c.fillStyle='#b6c9ae43';c.fillRect(x,564,26,7);
  }
  for(const tok of state.tokens){
    if(tok.choice)continue;
    shadow(c,tok.x,tok.y+35,42);
    c.save();c.translate(tok.x,tok.y);c.rotate(.11*Math.sin(t*2));
    c.beginPath();c.arc(0,0,41,0,Math.PI*2);c.fillStyle='#ffdf80';c.fill();
    c.strokeStyle=P.ink;c.lineWidth=5;c.stroke();
    c.beginPath();c.arc(0,0,31,0,Math.PI*2);c.strokeStyle='#bd873c';c.lineWidth=2;c.stroke();
    type(c,'$40',0,-10,22,P.deep,'center');
    type(c,tok.owner,0,14,11,P.deep,'center');
    c.restore();
  }
  const n=state.tokens.filter(t=>!!t.choice).length;
  type(c,'DECISIONS  '+n+'/2',l.left+12,677,l.portrait?17:24,P.paper);
  const savings=state.tokens.filter(tok=>tok.choice==='SAVE').length*40;
  const given=state.tokens.filter(tok=>tok.choice==='GIVE').length;
  type(c,'ACCESS '+given+'  ·  SAVED $'+savings,l.right-10,677,l.portrait?13:18,P.gold,'right');
 }
 function snapshot(){
  const l=layout();
  return JSON.parse(JSON.stringify({
   id,elapsed:state.elapsed,seconds:cfg.seconds,complete:state.complete,failed:state.failed,
   attemptId:state.attemptId,imperative:cfg.imperative,directive:directive(context),
   workers:id==='T1'?state.workers.map(w=>({id:w.id,x:w.x,y:w.y,blocked:w.blocked,
     dispatched:w.dispatched,escaped:w.escaped})):undefined,
   rescued:id==='T1'?state.workers.filter(w=>w.escaped).length:undefined,
   boxes:id==='T2'?state.boxes.map(b=>({id:b.id,x:b.x,y:b.y,vx:b.vx,vy:b.vy})):undefined,
   boxesInPath:id==='T2'?boxesInPath(l).length:undefined,
   workerCrossing:id==='T2'?state.workerRunning:undefined,
   clockWindow:id==='T3'?timeWindow():undefined,
   overtimeTicks:id==='T3'?state.overtimeTicks:undefined,
   tokens:id==='T4'?state.tokens.map(t=>({id:t.id,owner:t.owner,x:t.x,y:t.y,choice:t.choice})):undefined,
   pending:id==='T4'?state.tokens.filter(t=>!t.choice).length:undefined,
   evidence:state.evidence??null
  }));
 }
 return {enter:init,update,draw,pointerDown,pointerMove,pointerUp,cancelPointer,snapshot,
  dispose(){state.disposed=true;state.pointer=null;fx.particles.length=0;}};
}
export const definitions=Object.values(CONFIG).map(c=>Object.freeze({
 id:c.id,department:c.department,imperative:c.imperative,seconds:c.seconds,
 tags:Object.freeze([...c.tags]),create(context){return newScene(c.id,context);}
}));
export const createStaffScene=(id,context)=>newScene(id,context);