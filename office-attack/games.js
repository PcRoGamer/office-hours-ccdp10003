import {sprite,paper,rr,ink,capsule,confetti,drawIcon,COLORS as K} from './art.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const range=(a,b,v)=>v>=a&&v<=b;
const hit=(p,x,y,w,h)=>range(x-w/2,x+w/2,p.x)&&range(y-h/2,y+h/2,p.y);
const level=g=>g.level;
const label=(c,s,x,y,size=19,color=K.ink)=>ink(c,s,x,y,size,color);
const counter=(c,n)=>{rr(c,365,446,230,48,24,'#193e43');label(c,n,480,470,22,'#fff7d4')};
function stamp(){
 return {
  id:'stamp',cmd:'STAMP!',hint:'CLICK APPROVED · AVOID SPAM',bg:'#e8ca84',
  enter(g,a){
   const xs=g.level===1?[245,480,715]:g.level===2?[198,385,572,759]:[160,320,480,640,800];
   const picks=xs.map((_,i)=>i);
   for(let i=picks.length-1;i>0;i--){const k=Math.floor(a.rand()*(i+1));[picks[i],picks[k]]=[picks[k],picks[i]]}
   g.required=g.level===1?1:2;g.stamped=0;
   const approved=new Set(picks.slice(0,g.required));
   g.forms=xs.map((x,i)=>({id:i,ok:approved.has(i),stamped:false,homeX:x,x,y:322,phase:a.rand()*6.28}));
  },
  update(g,dt){
   for(const f of g.forms){
    f.x=f.homeX+Math.sin(g.t*(1+g.level*.24)+f.phase)*(12+g.level*5);
    f.y=324+Math.cos(g.t*1.6+f.phase)*13;
   }
  },
  down(g,p,a){
   const w=g.level===1?164:g.level===2?145:126;
   const f=g.forms.find(f=>!f.stamped&&hit(p,f.x,f.y,w,159));
   if(!f)return;
   if(!f.ok){a.lose(f.x,f.y);return}
   f.stamped=true;g.stamped++;a.tap();a.spark(f.x,f.y,'#66f2a3');
   if(g.stamped>=g.required)a.win(f.x,f.y);
  },
  draw(g,c){
   const w=g.level===1?164:g.level===2?145:126;
   for(const f of g.forms){
    paper(c,f.x,f.y,w,164,f.ok?'good':'bad',Math.sin(g.t*1.5+f.phase)*.047);
    if(f.stamped)drawIcon(c,'tick',f.x,f.y,96,96);
   }
   label(c,g.stamped+' / '+g.required+' APPROVED STAMPS',480,474,20,'#4b5549');
  }
 }
}
function catchWorker(){
 return {
  id:'catch',cmd:'CATCH!',hint:'MOVE MOUSE  ·  SAVE THE WORKER',bg:'#b5d7c4',
  enter(g,a){g.workerX=400+a.rand()*160;g.workerY=165;g.v=145+g.level*47;g.trayX=g.workerX<480?755:205;g.shift=(a.rand()<.5?-1:1)*42;},
  update(g,dt,a){
   g.workerY+=g.v*dt;
   g.workerX+=Math.sin(g.t*2.9)*g.shift*dt;
   if(g.workerY>=421){if(Math.abs(g.trayX-g.workerX)<(112-g.level*15))a.win(g.workerX,420);else a.lose(g.workerX,420)}
  },
  move(g,p){g.trayX=clamp(p.x,145,815)},
  draw(g,c){
   c.save();c.globalAlpha=.13;c.fillStyle='#133f3d';c.beginPath();c.ellipse(g.workerX,454,90,24,0,0,7);c.fill();c.restore();
   sprite(c,0,Math.floor(g.t*7)%4,g.workerX,g.workerY,180,178);
   drawIcon(c,'folder',g.trayX,452,232-g.level*30,143);
   label(c,'SAFE',g.trayX,490,22,'#204840');
  }
 }
}
function shred(){
 return {
  id:'shred',cmd:'SHRED!',hint:'DRAG ALL SPAM · SAVE APPROVED PAPER',bg:'#e6c1ac',
  enter(g,a){
   const n=g.level===1?1:2;
   g.required=n;g.shredded=0;
   const ids=[...Array(n)].map((_,i)=>i===0?'junk':'junk2').concat('real');
   for(let i=ids.length-1;i>0;i--){const k=Math.floor(a.rand()*(i+1));[ids[i],ids[k]]=[ids[k],ids[i]]}
   const xs=ids.length===2?[225,439]:[160,337,515];
   g.docs=ids.map((id,i)=>({id,ok:id==='real',x:xs[i],y:319,home:xs[i],shredded:false}));
   g.drag=null;g.dx=0;g.dy=0;g.feedPulse=0;
  },
  update(g,dt){g.feedPulse=Math.max(0,g.feedPulse-dt)},
  down(g,p,a){
   const d=g.docs.findLast(d=>!d.shredded&&hit(p,d.x,d.y,151,180));
   if(!d)return;
   g.drag=d.id;g.dx=p.x-d.x;g.dy=p.y-d.y;a.tap();
  },
  move(g,p){
   if(!g.drag)return;const d=g.docs.find(d=>d.id===g.drag);
   d.x=clamp(p.x-g.dx,110,850);d.y=clamp(p.y-g.dy,215,482);
  },
  up(g,p,a){
   if(!g.drag)return;const d=g.docs.find(d=>d.id===g.drag);g.drag=null;
   if(hit({x:d.x,y:d.y},750,333,200,213)){
    if(d.ok){a.lose(750,333);return}
    d.shredded=true;g.shredded++;g.feedPulse=.3;a.tap();a.spark(750,350,'#ffc85a');
    if(g.shredded===g.required)a.win(750,333);
   }else{d.x=d.home;d.y=319;}
  },
  cancel(g){if(!g.drag)return;const d=g.docs.find(d=>d.id===g.drag);d.x=d.home;d.y=319;g.drag=null},
  draw(g,c){
   drawIcon(c,'trash-can',755,333,235,270);
   label(c,'SHREDDER',755,471,22,'#643d32');
   for(const d of g.docs){if(!d.shredded)paper(c,d.x,d.y,150,170,d.ok?'good':'bad',d.id===g.drag?-.06:0)}
   if(g.feedPulse>0)for(let i=0;i<13;i++)confetti(c,718+i*5,415+i*7,3+i%3,'#f1bf62');
   label(c,g.shredded+' / '+g.required+' SHREDDED',355,482,22,'#584339');
  }
 }
}
function patch(){
 return{
  id:'patch',cmd:'FIX!',hint:'CLICK EVERY GLOWING ERROR',bg:'#d9cedd',
  enter(g,a){
   g.leaks=[];
   const cells=[[-130,-55],[125,60],[-15,67],[120,-68],[-127,67]];
   const total=g.level+2;
   for(let i=0;i<total;i++)g.leaks.push({id:i,x:480+cells[i][0],y:323+cells[i][1],done:false,beat:a.rand()*7});
  },
  down(g,p,a){const l=g.leaks.find(l=>!l.done&&Math.hypot(l.x-p.x,l.y-p.y)<(37-g.level*4));if(!l)return;l.done=true;a.tap();a.spark(l.x,l.y,'#39d39a');if(g.leaks.every(x=>x.done))a.win(l.x,l.y)},
  draw(g,c){
   drawIcon(c,'computer',480,325,430,350);
   for(const l of g.leaks){
    if(l.done){ink(c,'✓',l.x,l.y,45,'#61f1ac');continue;}
    const z=1+Math.sin(g.t*9+l.beat)*.15;
    c.save();c.shadowColor='#fff19c';c.shadowBlur=32;c.fillStyle='#ffe274';c.beginPath();c.arc(l.x,l.y,(27-g.level*3)*z,0,7);c.fill();
    ink(c,'!',l.x,l.y+2,33,'#9a3c36');c.restore();
   }
   label(c,g.leaks.filter(l=>l.done).length+'/'+g.leaks.length+' PATCHED',480,480,22,'#483e56');
  }
 }
}
function timing(){
 return{
  id:'timing',cmd:'FEED!',hint:'CLICK WHEN THE PAPER HITS GREEN',bg:'#d2dde4',
  enter(g,a){g.needle=170;g.direction=a.rand()<.5?1:-1;g.x0=g.direction===1?170:790;g.zone=105-g.level*17;g.speed=255+g.level*60},
  update(g,dt){g.needle+=g.direction*g.speed*dt;if(g.needle>=796){g.needle=796;g.direction=-1}if(g.needle<=163){g.needle=163;g.direction=1}},
  down(g,p,a){if(Math.abs(g.needle-480)<=g.zone)a.win(g.needle,435);else a.lose(g.needle,435)},
  key(g,key,a){if(key===' '||key==='Enter'){this.down(g,{x:480,y:350},a);return true}return false},
  draw(g,c){
   sprite(c,2,Math.floor(g.t*3)%4,480,320,350,295);
   rr(c,143,432,674,30,14,'#123d40');rr(c,480-g.zone,433,g.zone*2,28,8,'#4eef9b');
   c.save();c.shadowColor='#ffe5a0';c.shadowBlur=17;
   rr(c,g.needle-12,414,24,65,9,'#ffc35d','#734725',3);c.restore();
   label(c,'NOW!',480,483,24,'#204e49');
  }
 }
}
function dodge(){
 return {
  id:'dodge',cmd:'DODGE!',hint:'MOVE AWAY FROM THE RED WARNING',bg:'#bbd2df',
  enter(g,a){
   g.playerX=480;g.hazards=[];g.warnings=[];
   g.spawnAt=.35;g.safeT=g.level===1?2.75:g.level===2?2.95:3.16;g.n=0;
  },
  update(g,dt,a){
   g.spawnAt-=dt;g.safeT-=dt;
   for(const w of g.warnings){
    w.delay-=dt;
    if(w.delay<=0){
     g.hazards.push({id:w.id,x:w.x,y:166,v:205+g.level*27});
     w.done=true;
    }
   }
   g.warnings=g.warnings.filter(w=>!w.done);
   for(const h of g.hazards){
    h.y+=h.v*dt;
    // On-screen sprites are much bigger than their deliberately forgiving
    // collision core. Players can escape with a short mouse movement.
    if(Math.abs(h.y-412)<36&&Math.abs(h.x-g.playerX)<35){a.lose(h.x,h.y);return}
   }
   g.hazards=g.hazards.filter(h=>h.y<555);
   if(g.safeT<=0){a.win(g.playerX,410);return}
   if(g.spawnAt<=0&&g.n<(g.level===3?2:1)&&g.warnings.length===0&&g.hazards.filter(h=>h.y<500).length<2){
    const sign=a.rand()<.5?-1:1;
    const offset=10+a.rand()*43;
    const x=clamp(g.playerX+sign*offset,118,842);
    g.warnings.push({id:g.n++,x,delay:g.level===1?.68:g.level===2?.64:.60,done:false});
    g.spawnAt=g.level===1?1.22:g.level===2?1.06:.95;
   }
  },
  move(g,p){g.playerX=clamp(p.x,90,870)},
  draw(g,c){
   rr(c,95,462,770,16,8,'#447d82');
   sprite(c,0,Math.floor(g.t*5)%4,g.playerX,400,171,187);
   for(const w of g.warnings){
    c.save();c.globalAlpha=.58+.35*Math.sin(g.t*24);
    rr(c,w.x-73,163,146,74,22,'#f16b61');
    ink(c,'!',w.x,202,61,'#fff7eb');
    c.restore();
    label(c,'MOVE!',w.x,270,20,'#ae3931');
   }
   for(const h of g.hazards){
    drawIcon(c,'mail',h.x,h.y,124,115);
    rr(c,h.x+19,h.y+12,53,43,16,'#e85049');
    ink(c,'X',h.x+46,h.y+35,30,'#fff9e6');
   }
   label(c,Math.max(0,g.safeT).toFixed(1)+'s',480,490,22,'#24525d');
  }
 }
}
export const GAMES=[stamp(),catchWorker(),shred(),patch(),timing(),dodge()];
export const ALL_IDS=GAMES.map(g=>g.id);
