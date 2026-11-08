/**
 * Night Shift v3: INTAKE I1-I4. Standalone Canvas2D scenes with an injected
 * world transform, clock, RNG, audio and event sink. No global game state.
 * Scene geometry uses 1280x720 logical coordinates in the demo; the integration
 * renderer can apply its own world transform to these authored coordinates.
 */
const W = 1280, H = 720;
const C = { ink:'#11282c', dark:'#0d2429', teal:'#205257', mint:'#48d7ad',
  cream:'#f4eaca', paper:'#fff8e5', gold:'#f2be55', coral:'#f37358',
  red:'#bc4d43', slate:'#52706a', gray:'#b1b8a7' };
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const inBox=(p,b,pad=0)=>p.x>=b.x-pad&&p.y>=b.y-pad&&p.x<=b.x+b.w+pad&&p.y<=b.y+b.h+pad;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const segmentDistance=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y, t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(p.x-(a.x+dx*t),p.y-(a.y+dy*t));};
const ease=(v)=>1-Math.pow(1-clamp(v,0,1),3);
function rr(g,x,y,w,h,r=12){g.beginPath();g.roundRect(x,y,w,h,r);}
function fill(g,color,x,y,w,h,r=0){g.fillStyle=color;r?rr(g,x,y,w,h,r):g.beginPath();if(!r)g.rect(x,y,w,h);g.fill();}
function stroke(g,color,x,y,w,h,r=0,width=2){g.strokeStyle=color;g.lineWidth=width;rr(g,x,y,w,h,r);g.stroke();}
function txt(g,t,x,y,size=22,color=C.ink,align='left',font='Impact, "Arial Narrow", sans-serif'){
  g.fillStyle=color;g.textAlign=align;g.textBaseline='middle';g.font=`900 ${size}px ${font}`;g.fillText(t,x,y);g.textAlign='left';
}
function line(g,a,b,color,width=6){g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.strokeStyle=color;g.lineWidth=width;g.lineCap='round';g.stroke();}
function burst(g,p,t,color){g.save();g.globalAlpha=clamp(1-t/0.7,0,1);for(let i=0;i<7;i++){const a=(i/7)*Math.PI*2;line(g,{x:p.x+Math.cos(a)*(12+t*42),y:p.y+Math.sin(a)*(12+t*42)},{x:p.x+Math.cos(a)*(24+t*74),y:p.y+Math.sin(a)*(24+t*74)},color,4)}g.restore();}
function shadow(g,blur=22,color='#040e11a0',dy=12){g.shadowColor=color;g.shadowBlur=blur;g.shadowOffsetY=dy;}
function roundedPath(g,points){g.beginPath();g.moveTo(points[0].x,points[0].y);for(let i=1;i<points.length;i++)g.lineTo(points[i].x,points[i].y);}

/** A lived-in widescreen paper-theatre office, with no blank/letterboxed pixels. */
function stage(g,time,kind='conveyor'){
  const grad=g.createLinearGradient(0,0,0,720);grad.addColorStop(0,'#0c333b');grad.addColorStop(.54,'#2c5c60');grad.addColorStop(1,'#112a30');fill(g,grad,-1200,-300,W+2400,H+600);
  // Wall, panel seams, inked city rain, safety stripes and cheap corporate light.
  g.save();g.globalAlpha=.22;for(let i=0;i<16;i++){const x=i*99+23;fill(g,'#d0e6c9',x,35,2,380);}
  g.restore();fill(g,'#153c43',70,115,345,260,18);stroke(g,'#81a18d',70,115,345,260,15,7);
  for(let i=0;i<18;i++){const x=80+i*19;const h=(i*53%90)+42;fill(g,i%3?'#74a0a3':'#c9b87d',x,359-h,10,h);}
  for(let i=0;i<25;i++){const x=85+(i*71%315),y=132+(i*47%205);line(g,{x,y:y+8*Math.sin(time*1.8+i)},{x:x-6,y:y+24},'#add0c255',1.5)}
  fill(g,'#0c2c31',900,85,280,300,12);stroke(g,'#719186',900,85,280,300,13,5);
  for(let i=0;i<5;i++){fill(g,'#294e4f',923,105+i*51,232,40,5);fill(g,'#e9dca9',943,118+i*51,29,8,2);}
  // Fluorescent light and pool reflection.
  g.save();g.globalAlpha=.16;g.fillStyle='#f4ebbb';g.beginPath();g.ellipse(630,120,460,150,0,0,Math.PI*2);g.fill();g.restore();
  fill(g,'#293f40',430,9,437,24,8);fill(g,'#fff2c4',467,22,361,13,5);
  g.save();g.shadowColor='#eae9af';g.shadowBlur=27;fill(g,'#f4d893',482,22,330,7,3);g.restore();
  // Tall/narrow cameras reveal the rest of the same office, not empty bars.
  fill(g,'#0b2b32',-1200,-460,W+2400,350);for(let i=0;i<16;i++){
    const xx=-240+i*120;fill(g,'#254c50',xx,-370,80,270,7);fill(g,'#385e5d',xx+12,-343,54,54,4);
  }
  fill(g,'#b49252',-1200,-143,W+2400,14);fill(g,'#0b252b',-1200,-127,W+2400,18);
  txt(g,'ACME QUOTA DIVISION / NIGHT OPERATIONS',640,-198,47,'#e1c68c','center');
  fill(g,'#173d44',-1200,720,W+2400,490);
  for(let i=0;i<12;i++){
    const xx=-120+i*135;fill(g,'#63493f',xx,791+(i%2)*13,103,135,9);
    fill(g,'#e8cd8f',xx+12,803+(i%2)*13,78,18,3);
    txt(g,i%3===0?'URGENT':'FILE',xx+51,847+(i%2)*13,15,'#3e4742','center');
  }
  fill(g,'#b89150',-1200,945,W+2400,18);
  // Office floor and looming desk surface.
  fill(g,'#102c32',-1200,474,W+2400,546);fill(g,'#071e24',-1200,510,W+2400,520);
  g.save();g.fillStyle='#c29358';g.beginPath();g.moveTo(-130,518);g.lineTo(1410,518);g.lineTo(1280,708);g.lineTo(0,708);g.closePath();g.fill();g.restore();
  fill(g,'#f2d392',-1200,516,W+2400,16);fill(g,'#523b37',-1200,693,W+2400,27);
  // Thin wood grain and paper scratches.
  g.save();g.globalAlpha=.16;for(let i=0;i<31;i++)line(g,{x:((i*193)%1400)-90,y:558+i%9*13},{x:((i*193)%1400)+280,y:556+i%9*13},'#5c2e26',1.5);g.restore();
  // Personal desk props, stamps, pencil mug, taped sticky notes.
  g.save();g.translate(99,457);g.rotate(-.13);fill(g,'#f9d77d',-29,-20,116,85,3);txt(g,'WORK',-20,3,20,'#5e4730');txt(g,'HARDER',-20,27,22,'#5e4730');g.restore();
  fill(g,'#67473f',1125,508,98,12,5);fill(g,'#344e4f',1144,460,55,60,5);
  for(let i=0;i<6;i++)line(g,{x:1153+i*7,y:466},{x:1139+i*10,y:420+(i%3)*11},i%2?'#e2b75b':'#a8c7bd',3);
  if(kind==='conveyor'){
    fill(g,'#263d3f',95,462,1090,165,28);fill(g,'#586c66',106,480,1068,119,20);
    for(let i=0;i<17;i++){const x=114+i*67;fill(g,'#2b4548',x,490,34,97,10);}
    fill(g,'#edc765',98,455,1080,13,6);fill(g,'#0e2c33',102,613,1063,18,7);
  }
  // Fullscreen atmosphere vignette only, no camera frame.
  const vg=g.createRadialGradient(640,380,200,640,370,900);vg.addColorStop(0,'#04191e00');vg.addColorStop(1,'#06151e77');fill(g,vg,-1200,-500,W+2400,H+1000);
  // Tall view: a real lower office set instead of a blank strip beneath the action.
  fill(g,'#72523f',-900,782,W+1800,260);
  fill(g,'#c2a16d',-900,772,W+1800,24);
  for(let i=0;i<12;i++){
   const xx=-110+i*132;fill(g,'#2a4745',xx,820,116,138,9);stroke(g,'#597b70',xx+7,830,102,115,6,3);
   fill(g,'#d1b174',xx+23,843,69,13,3);txt(g,i%3?'FILES':'URGENT',xx+57,901,17,'#c6d0af','center');
  }
  fill(g,'#243f43',-900,975,W+1800,140);
  txt(g,'PAPERWORK IS FOREVER',640,1062,29,'#ebca8b','center');
}
function paper(g,x,y,w,h,rotation=0,type='approved',pressed=0){
  g.save();g.translate(x+w/2,y+h/2);g.rotate(rotation);g.translate(-w/2,-h/2);
  shadow(g,20);fill(g,C.paper,0,0,w,h,8);g.shadowColor='transparent';g.shadowBlur=0;g.shadowOffsetY=0;
  fill(g,type==='spam'?'#b74948':'#185e55',0,0,w,28,7);txt(g,type==='spam'?'VOID / SPAM':'APPROVED',13,15,14,'#fff6df');
  for(let i=0;i<3;i++)fill(g,'#b6a98a',17,43+i*14,w-34-(i%2)*22,3,2);
  if(type==='spam'){
    line(g,{x:13,y:18},{x:w-13,y:h-14},'#bd4d47',9);line(g,{x:w-14,y:16},{x:17,y:h-13},'#bd4d47',9);
  }else {stroke(g,'#7faba1',w-58,h-42,44,30,2,2);txt(g,'OK',w-36,h-26,18,'#166458','center');}
  if(pressed>0){g.globalAlpha=pressed;txt(g,'STAMPED!',w/2,h/2,24,'#b04a3c','center');}
  g.restore();
}
function shredder(g,x,y,time){
  g.save();g.translate(x,y);shadow(g,24);fill(g,'#253b3d',-85,-56,170,181,16);g.shadowColor='transparent';g.shadowBlur=0;g.shadowOffsetY=0;
  fill(g,'#93aba0',-90,-60,180,55,13);fill(g,'#09272b',-70,-47,140,23,5);txt(g,'FEED ME',0,44,21,'#e6e1c5','center');
  for(let i=0;i<4;i++){const off=Math.sin(time*10+i)*3;fill(g,'#5f7c74',-61+i*37,-36+off,19,6,2);}
  fill(g,'#c8a35d',-64,83,128,12,3);txt(g,'CORP-O-MATIC',0,108,13,'#cee2d4','center');g.restore();
}
function notice(g,x,y,w,h,kind,time){
  const real=kind==='real';g.save();g.translate(x,y);shadow(g,18);fill(g,real?'#ecf8e8':'#ffe9d8',0,0,w,h,12);g.shadowColor='transparent';g.shadowBlur=0;g.shadowOffsetY=0;stroke(g,real?'#3bb696':'#ba534b',0,0,w,h,12,4);
  fill(g,real?'#2c8c74':'#b44948',0,0,w,40,9);
  txt(g,real?'MIRA / VERIFIED':'CORP-O-PROMOS / AD',15,22,16,'white');
  if(real){fill(g,'#368a76',17,53,62,62,13);txt(g,'M',48,82,34,'white','center');txt(g,'✓',w-38,80,43,'#239a73','center');txt(g,'REAL HELP',93,67,17,C.ink);txt(g,'Hold to see safe targets',93,94,13,C.slate);}
  else{txt(g,'YOU WON A FREE BONUS!',18,64,18,C.red);txt(g,'Sign now. 900% productivity.',18,93,13,C.slate);txt(g,'✕',w-25,22,26,'white','center');}
  g.restore();
}
function painter(g,x,y,face,t,scale=1){
  // Scene-local paper puppet Finch fallback; ART may replace via context.art.
  g.save();g.translate(x,y+Math.sin(t*1.5)*3);g.scale(scale,scale);
  fill(g,'#173d42',-62,30,125,120,28);fill(g,'#f1c3a0',-55,-85,110,126,38);
  g.fillStyle='#443c35';g.beginPath();g.moveTo(-55,-50);g.quadraticCurveTo(-63,-116,7,-113);g.quadraticCurveTo(74,-112,57,-33);g.lineTo(45,-77);g.lineTo(-32,-86);g.closePath();g.fill();
  for(const sx of [-1,1]){fill(g,'#fff2d6',sx*24-16,-42,30,27,11);fill(g,'#24363a',sx*24-4,-32,9,13,6);}
  if(face==='stunned'){txt(g,'O',0,13,26,'#743b32','center');}else if(face==='smug'){line(g,{x:-15,y:12},{x:17,y:5},'#743b32',5);}else{line(g,{x:-16,y:13},{x:15,y:16},'#743b32',4);}
  fill(g,'#f3c859',-21,48,42,57,3);txt(g,'CEO',0,88,19,'#34423a','center');
  g.restore();
}
function timerBand(g,remaining,total){fill(g,'#12373b',380,105,520,13,6);fill(g,remaining/total>.25?C.gold:C.coral,381,106,518*clamp(remaining/total,0,1),11,5);}
function effect(g,e){if(!e)return;g.save();const t=e.t;burst(g,{x:e.x,y:e.y},t,e.color||C.gold);g.globalAlpha=clamp(1-t/0.9,0,1);txt(g,e.label,e.x,e.y-60-t*80,clamp(34+t*8,34,44),e.color||C.paper,'center');g.restore();}

class IntakeScene{
 constructor(context,id){
  this.id=id;this.context=context;this.time=0;this.total=16;this.timeLeft=this.total;
  this.ended=false;this.sparks=[];this.pointer=null;this.errorCount=0;
  this.actions=[];this.noticeState={real:'pending',fake:'pending'};
  this.seed=context?.rng?.next?.()??0.4;
  this.setup();
 }
 setup(){
  if(this.id==='I1'){
   this.total=20;this.forms=[];this.spawned=0;this.good=0;this.noticeShown=false;this.streak=0;
  }else if(this.id==='I2'){
   this.total=20;this.envelopes=[{id:'junk-a',x:380,y:378,kind:'junk',angle:-.15},{id:'pay-slip',x:634,y:400,kind:'real',angle:.09},{id:'junk-b',x:872,y:376,kind:'junk',angle:.2}].map(o=>({...o,w:132,h:88,done:false,held:false,vx:0,vy:0}));this.shredded=0;
  }else if(this.id==='I3'){
   this.total=18;this.closed=0;this.windows=[{id:'scam-1',x:217,y:235,w:286,h:174,real:false,done:false,angle:-.03},{id:'scam-2',x:564,y:178,w:287,h:182,real:false,done:false,angle:.04},{id:'scam-3',x:450,y:398,w:306,h:162,real:false,done:false,angle:-.05},{id:'mira-notice',x:886,y:267,w:295,h:180,real:true,done:false,angle:.015}];
  }else{
   this.total=18;this.waypoints=[{x:329,y:490},{x:577,y:490},{x:577,y:294},{x:854,y:294}];this.progress=0;this.trail=[];this.tracing=false;this.completedForms=0;
  }
  this.timeLeft=this.total+(this.hasPerk('time-bank')?2:0);
  this.total=this.timeLeft;
 }
 hasPerk(id){const p=this.context?.run?.perks;return Array.isArray(p)?p.some(x=>typeof x==='string'?x===id:x.id===id):Boolean(p?.[id]);}
 directive(){return this.context?.run?.directive??null;}
 emit(e){this.context?.events?.emit?.({...e,attemptId:this.context?.run?.attemptId??'intake-preview',synthetic:false});}
 sound(name){this.context?.audio?.play?.(name,{cardId:this.id});}
 addEvent(name,objectId,extra={}){this.actions.push({name,objectId,at:+this.time.toFixed(3),...extra});}
 pop(x,y,label,color=C.gold){this.sparks.push({x,y,label,color,t:0});}
 enter(){this.sound('card-intro');}
 fail(reason,objectId){if(this.ended)return;this.ended=true;this.errorCount++;this.sound('fail');this.pop(640,310,reason,C.coral);this.addEvent('failure',objectId??null,{reason});this.emit({type:'card-failed',cardId:this.id,reason,objectId,evidence:this.snapshot()});}
 clear(outcome={}){if(this.ended)return;this.ended=true;this.sound('card-complete');this.pop(640,280,'QUOTA MET!',C.mint);this.emit({type:'card-complete',cardId:this.id,outcome:{cleared:true,...outcome},evidence:this.snapshot()});}
 update(dt){dt=clamp(Number(dt)||0,0,.06);this.time+=dt;if(!this.ended){this.timeLeft=Math.max(0,this.timeLeft-dt);if(this.timeLeft<=0)this.fail('OUT OF TIME','timer');}
  for(const e of this.sparks)e.t+=dt;this.sparks=this.sparks.filter(e=>e.t<.85);
  if(this.id==='I1'&&!this.ended){
   if(this.spawned<9 && this.time>=this.spawned*1.16){const i=this.spawned++;this.forms.push({id:`form-${i}`,kind:[3,6,8].includes(i)?'spam':'approved',x:i===0?930:1360,y:331+(i%2)*115,w:152,h:111,hit:false,hitTime:0,angle:((i%3)-1)*.035});}
   const speed=165+this.good*19;for(const f of this.forms){if(!f.hit)f.x-=speed*dt;else f.hitTime+=dt;
    if(!f.hit&&f.kind==='approved'&&f.x<-170){this.fail('MISSED FORM',f.id);break;}}
  }
  if(this.id==='I2')for(const e of this.envelopes){if(e.done)continue;if(!e.held){e.x+=e.vx*dt;e.y+=e.vy*dt;e.vx*=Math.exp(-8*dt);e.vy*=Math.exp(-8*dt);}e.x=clamp(e.x,130,1055);e.y=clamp(e.y,210,520);}
 }
 pointerDown(p){if(this.ended)return;this.pointer={...p,start:{x:p.x,y:p.y},prev:{x:p.x,y:p.y}};
  if(this.id==='I1')this.pressForm(p);
  else if(this.id==='I2'){const e=[...this.envelopes].reverse().find(e=>!e.done&&inBox(p,e,15));if(e){this.pointer.object=e.id;this.pointer.offset={x:p.x-e.x,y:p.y-e.y};e.held=true;this.sound('grab');}}
  else if(this.id==='I3')this.pressWindow(p);
  else this.startTrace(p);
 }
 pointerMove(p){if(this.ended||!this.pointer)return;
  if(this.id==='I2'){
   const e=this.envelopes.find(e=>e.id===this.pointer.object);if(e&&!e.done){const x=p.x-this.pointer.offset.x,y=p.y-this.pointer.offset.y;e.vx=(x-e.x)*14;e.vy=(y-e.y)*14;e.x=lerp(e.x,x,.47);e.y=lerp(e.y,y,.47);}
  }else if(this.id==='I4')this.extendTrace(p);
  this.pointer.prev={x:p.x,y:p.y};
 }
 pointerUp(p){if(this.ended)return;
  if(this.id==='I2'&&this.pointer?.object){const e=this.envelopes.find(e=>e.id===this.pointer.object);if(e&&!e.done){e.held=false;
    const throat={x:637,y:450};const eligible=dist({x:e.x+e.w/2,y:e.y+e.h/2},throat)<155||dist(p,throat)<102;
    if(eligible){e.done=true;this.sound('shred');if(e.kind==='real'){this.addEvent('shredded-real-pay-slip',e.id);this.fail('PAY SLIP!',e.id);}else{this.shredded++;this.addEvent('shredded-spam',e.id);this.pop(637,375,'SHREDDED!',C.gold);if(this.shredded===2)this.clear({junkShredded:2,paySlipSaved:true});}}
    else {this.sound('paper-flick');this.addEvent('moved-envelope',e.id);}
   }}else if(this.id==='I4'&&this.tracing){this.extendTrace(p);this.tracing=false;if(this.progress===4){this.addEvent('completed-carbon-route','route-a',{formsStamped:3});this.clear({linkedForms:3,traceCorners:2});}else this.traceFailure('BROKEN COPY LINE');}
  this.pointer=null;
 }
 cancelPointer(){if(this.id==='I2')this.envelopes.forEach(e=>e.held=false);if(this.id==='I4'&&this.tracing){this.tracing=false;this.trail=[];this.progress=0;}this.pointer=null;}
 pressForm(p){
  if(this.noticeShown){
   const real={x:280,y:555,w:300,h:129},fake={x:675,y:548,w:294,h:125};
   if(this.noticeState.real==='pending'&&inBox(p,real)){
    this.noticeState.real='opened';this.addEvent('opened-genuine-help','mira-verified');this.sound('mira');this.pop(445,562,'MIRA HELPS!',C.mint);
    this.emit({type:'notice-handled',cardId:this.id,objectId:'mira-verified',kind:'genuine',action:'opened'});return;
   }
   if(this.noticeState.fake==='pending'&&inBox(p,fake)){
    if(inBox(p,{x:fake.x+fake.w-51,y:fake.y,w:51,h:50})){
     this.noticeState.fake='closed';this.addEvent('closed-scam','fake-coupon');this.sound('shred');this.pop(790,548,'BLOCKED!',C.gold);
     this.emit({type:'notice-handled',cardId:this.id,objectId:'fake-coupon',kind:'fake',action:'closed'});
    }else{this.addEvent('accepted-scam','fake-coupon');this.fail('FAKE PROMOTION!','fake-coupon');}return;
   }
  }
  const f=[...this.forms].reverse().find(f=>!f.hit&&inBox(p,{x:f.x,y:f.y,w:f.w,h:f.h},11));if(!f){this.sound('desk-tap');return;}
  f.hit=true;f.hitTime=0;if(f.kind==='spam'){this.sound('scam');this.addEvent('accepted-spam',f.id);this.fail('SUBSCRIBED!',f.id);return;}
  this.good++;this.streak++;this.sound('stamp');this.addEvent('approved-manual',f.id);this.pop(f.x+f.w/2,f.y+f.h/2,`${this.good}/5`,C.mint);
  if(this.good===2&&!this.noticeShown){this.noticeShown=true;this.emit({type:'notice-pair-shown',cardId:this.id,objects:['mira-verified','fake-coupon']});}
  if(this.good===5)this.clear({manualApproved:5,spamAccepted:0,noticePairSeen:this.noticeShown});
 }
 pressWindow(p){const w=[...this.windows].reverse().find(w=>!w.done&&inBox(p,w,4));if(!w)return;
  if(w.real){this.addEvent('opened-genuine-help',w.id);w.done=true;this.noticeState.real='opened';this.sound('mira');this.pop(w.x+w.w/2,w.y,'MIRA ONLINE',C.mint);this.emit({type:'notice-handled',cardId:this.id,objectId:w.id,kind:'genuine',action:'opened'});return;}
  // Close button is generous, anchored on the upper-right window corner.
  const close={x:w.x+w.w-61,y:w.y+0,w:64,h:66};if(!inBox(p,close,3)){this.sound('paper-flick');return;}
  w.done=true;this.closed++;this.sound('shred');this.pop(w.x+w.w/2,w.y,'DECLINED!',C.gold);this.addEvent('closed-scam',w.id);this.emit({type:'notice-handled',cardId:this.id,objectId:w.id,kind:'fake',action:'closed'});
  if(this.closed===3)this.clear({scamsClosed:3,genuineHelp:this.noticeState.real==='opened'?'opened':'preserved'});
 }
 startTrace(p){const a=this.waypoints[0];if(dist(p,a)<84){this.tracing=true;this.trail=[{...a}];this.progress=1;this.sound('stamp');this.addEvent('stamp-start','carbon-1');this.pop(a.x,a.y,'1',C.mint);}else this.sound('desk-tap');}
 extendTrace(p){if(!this.tracing||!this.pointer)return;const prev=this.trail.at(-1)??this.waypoints[0];if(dist(prev,p)<2)return;const next=this.waypoints[this.progress];if(!next)return;
  // Whole pointer segment must remain inside generous illuminated route corridor.
  const from=this.waypoints[this.progress-1];if(segmentDistance(p,from,next)>78&&dist(p,next)>60){this.traceFailure('OFF THE ROUTE');return;}
  this.trail.push({x:p.x,y:p.y});if(this.trail.length>120)this.trail.shift();
  if(segmentDistance(next,prev,p)<58){this.progress++;this.sound('stamp');this.pop(next.x,next.y,`${this.progress===2?'2':this.progress===4?'3':'TURN'}`,C.mint);this.addEvent('route-node',`node-${this.progress}`);
    if(this.progress===4)this.completedForms=3;
  }
 }
 traceFailure(reason){this.sound('fail');this.addEvent('copy-error','route-a',{reason});this.pop(660,360,'PAPER AVALANCHE',C.coral);this.tracing=false;this.progress=0;this.trail=[];this.fail(reason,'route-a');}
 snapshot(){return {cardId:this.id,time:+this.time.toFixed(3),remaining:+this.timeLeft.toFixed(3),ended:this.ended,failures:this.errorCount,
  progress:this.id==='I1'?this.good:this.id==='I2'?this.shredded:this.id==='I3'?this.closed:this.completedForms,
  forms:this.id==='I1'?this.forms.map(f=>({id:f.id,kind:f.kind,hit:f.hit,x:+f.x.toFixed(2)})):undefined,
  envelopes:this.id==='I2'?this.envelopes.map(e=>({id:e.id,kind:e.kind,done:e.done,x:+e.x.toFixed(1),y:+e.y.toFixed(1)})):undefined,
  windows:this.id==='I3'?this.windows.map(w=>({id:w.id,done:w.done})):undefined,
  notice:{...this.noticeState},routeProgress:this.id==='I4'?this.progress:undefined,actions:this.actions.map(a=>({...a}))};}
 draw(g){
  stage(g,this.time,this.id==='I1'?'conveyor':'desk');
  // Large in-world stage title: not HUD; actual HUD remains LEAD/RENDER-owned.
  txt(g,'DEPT. 01 / INTAKE',96,88,25,C.gold);
  txt(g,({I1:'STAMP GOOD!',I2:'SHRED THE SPAM!',I3:'CLOSE THE SCAMS!',I4:'COPY THAT!'})[this.id],96,146,59,C.cream);
  txt(g,({I1:'STAMP 5 GOOD FORMS. IGNORE THE SPAM.',I2:'FEED 2 JUNK ENVELOPES. SAVE THE PAY SLIP.',I3:'CLOSE 3 FAKE POP-UPS. MIRA IS REAL.',I4:'TRACE THE GLOWING ROUTE IN ONE GESTURE.'})[this.id],99,199,20,'#cbddd2');
  timerBand(g,this.timeLeft,this.total);
  if(this.id==='I1')this.drawStamp(g);else if(this.id==='I2')this.drawShred(g);else if(this.id==='I3')this.drawScam(g);else this.drawCopy(g);
  for(const e of this.sparks)effect(g,e);
  if(this.ended) {g.save();g.globalAlpha=.65;fill(g,'#0d292f',0,0,W,H);g.restore();txt(g,this.actions.at(-1)?.name==='failure'?'TRY AGAIN':'QUOTA MET!',640,310,83,C.paper,'center');txt(g,this.actions.at(-1)?.name==='failure'?'ONE MISTAKE. ZERO MERCY.':'MANAGEMENT IS DELIGHTED. ALARMINGLY.',640,390,26,C.gold,'center');}
 }
 drawStamp(g){
  txt(g,`APPROVED: ${this.good} / 5`,940,91,28,C.mint);
  painter(g,1082,302,this.good>=4?'stunned':'smug',this.time,.7);
  for(const f of this.forms)if((!f.hit||f.hitTime<.37)&&f.x>-200&&f.x<1410)paper(g,f.x,f.y+(f.hit?12*Math.sin(Math.PI*f.hitTime/.37):0),f.w,f.h,f.angle,f.kind,f.hit?.95*(1-f.hitTime/.37):0);
  if(this.noticeShown){if(this.noticeState.real==='pending')notice(g,280,555,300,129,'real',this.time);if(this.noticeState.fake==='pending')notice(g,675,548,294,125,'fake',this.time);}
  fill(g,'#d99d47',117,634,110,42,8);txt(g,'STAMP!',172,656,21,C.ink,'center');
  if(this.good===0){txt(g,'TAP THE WHITE / GREEN FORM',660,695,18,C.cream,'center');}
 }
 drawShred(g){
  shredder(g,625,472,this.time);
  for(const e of this.envelopes){if(e.done)continue;
   g.save();g.translate(e.x+e.w/2,e.y+e.h/2);g.rotate(e.angle);g.translate(-e.w/2,-e.h/2);shadow(g,14);
   fill(g,e.kind==='junk'?'#efc670':'#d7f3e3',0,0,e.w,e.h,7);g.shadowColor='transparent';g.shadowBlur=0;g.shadowOffsetY=0;
   g.fillStyle='#aa7e4a';g.beginPath();g.moveTo(2,4);g.lineTo(e.w/2,48);g.lineTo(e.w-2,4);g.strokeStyle='#bc9162';g.lineWidth=4;g.stroke();
   txt(g,e.kind==='junk'?'SPAM / BIN':'MIRA / PAY',e.w/2,62,e.kind==='junk'?22:19,e.kind==='junk'?'#914539':'#155d56','center');if(e.kind==='real'){txt(g,'✓',e.w-17,18,27,'#2ba077','center');}
   g.restore();}
  txt(g,`JUNK SHREDDED ${this.shredded}/2`,895,280,26,C.gold);
  txt(g,'DRAG THE ENVELOPES INTO THE SLOT',640,679,20,C.paper,'center');
 }
 drawScam(g){
  painter(g,105,385,'stunned',this.time,.65);
  txt(g,`SCAMS CLOSED ${this.closed}/3`,905,90,27,C.gold);
  for(const w of this.windows){if(w.done)continue;
   g.save();g.translate(w.x,w.y);g.rotate(w.angle+Math.sin(this.time*2+w.x)*.008);shadow(g,22);
   fill(g,w.real?'#e6f5e9':'#fff0d5',0,0,w.w,w.h,13);g.shadowColor='transparent';g.shadowBlur=0;g.shadowOffsetY=0;stroke(g,w.real?'#37997c':'#9c4a45',0,0,w.w,w.h,12,5);
   fill(g,w.real?'#1d806c':'#a13a36',0,0,w.w,51,10);txt(g,w.real?'✓ MIRA / VERIFIED':'! BONUS OFFER',17,27,w.real?19:21,C.paper);
   if(!w.real){fill(g,'#e8aa60',w.w-57,7,48,42,8);txt(g,'×',w.w-33,29,39,'#712d24','center');txt(g,'+ 700% EFFICIENCY',20,91,23,C.red);txt(g,'Definitely not a scam.',19,131,16,C.slate);}
   else{fill(g,'#448d79',14,64,61,62,10);txt(g,'M',45,98,36,C.paper,'center');txt(g,'REAL HELP / OPEN',92,83,21,C.ink);txt(g,'Signed + sealed by Mira',92,113,15,C.slate);}
   g.restore();}
  txt(g,'TAP × ON THE FAKES. KEEP THE GREEN NOTICE.',650,690,20,C.paper,'center');
 }
 drawCopy(g){
  const pts=this.waypoints;
  g.save();g.shadowColor=C.gold;g.shadowBlur=25;roundedPath(g,pts);g.lineWidth=37;g.lineJoin='round';g.lineCap='round';g.strokeStyle='#f3bc53aa';g.stroke();g.shadowBlur=0;roundedPath(g,pts);g.lineWidth=9;g.setLineDash([17,12]);g.strokeStyle=C.paper;g.stroke();g.setLineDash([]);g.restore();
  for(let i=0;i<pts.length;i++){const p=pts[i],highlight=i===this.progress;
   if(i===2){g.save();g.shadowColor=C.gold;g.shadowBlur=12;fill(g,i<this.progress?C.mint:C.gold,p.x-28,p.y-28,56,56,28);g.restore();txt(g,'↳',p.x,p.y,38,C.ink,'center');continue;}
   g.save();shadow(g,10);fill(g,highlight?'#f9d47a':'#f8f1d8',p.x-72,p.y-58,144,116,10);g.shadowColor='transparent';g.shadowBlur=0;g.shadowOffsetY=0;
   stroke(g,i<this.progress?C.mint:C.slate,p.x-72,p.y-58,144,116,10,i<this.progress?7:3);
   txt(g,`FORM ${i===3?'3':i+1}`,p.x,p.y-16,20,C.ink,'center');txt(g,i<this.progress?'✓':i===3?'3':i+1,p.x,p.y+25,32,i<this.progress?'#159c7a':'#b27c3b','center');g.restore();}
  if(this.trail.length>1){g.beginPath();g.moveTo(this.trail[0].x,this.trail[0].y);for(const p of this.trail.slice(1))g.lineTo(p.x,p.y);g.strokeStyle=C.mint;g.lineWidth=19;g.lineJoin='round';g.lineCap='round';g.stroke();}
  txt(g,'ONE UNBROKEN GESTURE. START ON FORM 1.',640,662,22,C.paper,'center');
 }
 dispose(){this.cancelPointer();this.sparks.length=0;}
}

export const definitions=[
 {id:'I1',department:'intake',imperative:'STAMP GOOD!',create:(context)=>new IntakeScene(context,'I1')},
 {id:'I2',department:'intake',imperative:'SHRED THE SPAM!',create:(context)=>new IntakeScene(context,'I2')},
 {id:'I3',department:'intake',imperative:'CLOSE THE SCAMS!',create:(context)=>new IntakeScene(context,'I3')},
 {id:'I4',department:'intake',imperative:'COPY THAT!',create:(context)=>new IntakeScene(context,'I4')}
];
export function createIntakeCard(id,context){const def=definitions.find(x=>x.id===id);if(!def)throw new RangeError(`Unknown Intake card: ${id}`);return def.create(context);}
export const intakeWorld={width:W,height:H};