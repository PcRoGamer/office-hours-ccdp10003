import {sprite,paper,rr,ink,capsule,confetti,drawIcon,COLORS as K} from './art.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const range=(a,b,v)=>v>=a&&v<=b;
const hit=(p,x,y,w,h)=>range(x-w/2,x+w/2,p.x)&&range(y-h/2,y+h/2,p.y);
const level=g=>g.level;
const label=(c,s,x,y,size=19,color=K.ink)=>ink(c,s,x,y,size,color);
const counter=(c,n)=>{rr(c,365,446,230,48,24,'#193e43');label(c,n,480,470,22,'#fff7d4')};
function banana(c,x,y,rot=-.08){
 c.save();c.translate(x,y);c.rotate(rot);
 c.save();c.shadowColor='#7c604044';c.shadowBlur=12;c.shadowOffsetY=7;
 c.fillStyle='#e6ad35';c.beginPath();c.moveTo(-54,-46);
 c.bezierCurveTo(-68,20,-13,67,67,33);c.bezierCurveTo(76,22,74,12,65,8);
 c.bezierCurveTo(8,20,-14,-11,-7,-46);c.closePath();c.fill();c.restore();
 c.fillStyle='#ffd24d';c.beginPath();c.moveTo(-52,-51);
 c.bezierCurveTo(-61,15,-10,56,61,28);c.bezierCurveTo(68,20,67,13,60,10);
 c.bezierCurveTo(6,20,-17,-14,-9,-51);c.closePath();c.fill();
 rr(c,-49,-66,29,24,7,'#8a5a3b');egg(c,62,19,7,7,'#8a5a3b');
 c.strokeStyle='#fff2a6';c.lineWidth=7;c.lineCap='round';c.beginPath();
 c.moveTo(-35,-30);c.bezierCurveTo(-36,10,-8,37,31,35);c.stroke();
 c.strokeStyle='#eab43d';c.lineWidth=4;c.beginPath();c.moveTo(-11,-42);c.bezierCurveTo(-9,0,18,22,47,23);c.stroke();
 c.restore();
}
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
function fix(){
 return{
  id:'fix',cmd:'FIX!',hint:'CLICK EVERY GLOWING ERROR',bg:'#d9cedd',
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
   label(c,g.leaks.filter(l=>l.done).length+'/'+g.leaks.length+' FIXED',480,480,22,'#483e56');
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

/* Four original WarioWare-like FIX-family mechanics, sharing the same soft office canvas. */
function plug(){
 return {
  id:'plug',cmd:'PLUG!',hint:'DRAG THE PLUG INTO THE MATCHING SOCKET',bg:'#bedfd3',
  enter(g,a){
   const c=a.rand()<.5?'#f3b75d':'#ef796a';
   const other=c==='#f3b75d'?'#ef796a':'#f3b75d';
   g.plugColor=c;g.plugOther=other;g.plugTarget=a.rand()<.5?0:1;
   g.plugPorts=[{x:718,y:278},{x:718,y:396}];
   g.plugX=250;g.plugY=340;g.plugDrag=false;g.plugPulse=0;
  },
  down(g,p,a){
   if(!hit(p,g.plugX,g.plugY,154,138))return;
   g.plugDrag=true;g.plugDX=p.x-g.plugX;g.plugDY=p.y-g.plugY;a.tap();
  },
  move(g,p){
   if(!g.plugDrag)return;
   g.plugX=clamp(p.x-g.plugDX,125,831);
   g.plugY=clamp(p.y-g.plugDY,207,453);
  },
  up(g,p,a){
   if(!g.plugDrag)return;g.plugDrag=false;
   const target=g.plugPorts.findIndex(v=>hit({x:g.plugX,y:g.plugY},v.x,v.y,124,103));
   if(target===-1){g.plugX=250;g.plugY=340;return}
   if(target!==g.plugTarget){a.lose(g.plugX,g.plugY);return}
   g.plugPulse=1;a.spark(g.plugX,g.plugY,'#93f4b5');a.win(g.plugX,g.plugY);
  },
  cancel(g){g.plugDrag=false;g.plugX=250;g.plugY=340;},
  draw(g,c){
   // Single chunky cable sweeps from the wall to the player's hand.
   c.save();c.strokeStyle='#335b60';c.lineWidth=28;c.lineCap='round';
   c.beginPath();c.moveTo(78,414);c.bezierCurveTo(156,465,225,454,g.plugX-42,g.plugY+12);c.stroke();
   c.strokeStyle=g.plugColor;c.lineWidth=20;c.stroke();c.restore();
   rr(c,86,337,133,106,29,'#80afa6');
   rr(c,102,356,93,66,20,'#f6e7bd');
   for(let i=0;i<2;i++){
    const port=g.plugPorts[i],color=i===g.plugTarget?g.plugColor:g.plugOther;
    c.save();c.translate(port.x,port.y);
    rr(c,-76,-49,151,98,32,'#608d8b');
    rr(c,-66,-41,130,80,28,'#fcf4d9');
    rr(c,-50,-24,100,48,20,color);
    rr(c,-27,-15,17,33,8,'#3e6b6c');rr(c,10,-15,17,33,8,'#3e6b6c');
    c.restore();
   }
   // Big rounded plug with two thick contact pins, all fills, no thin strokes.
   c.save();c.translate(g.plugX,g.plugY);
   c.rotate(g.plugDrag?-.12:Math.sin(g.t*3)*.028);
   rr(c,-58,-43,105,88,31,g.plugColor);
   rr(c,22,-20,36,39,16,'#f7e3b2');
   rr(c,39,-17,44,13,6,'#f6f1d5');
   rr(c,39,5,44,13,6,'#f6f1d5');
   rr(c,-43,-31,53,12,6,'#fff0c8a0');
   rr(c,-10,-9,8,18,4,'#4d6460');rr(c,17,-9,8,18,4,'#4d6460');
   c.restore();
   label(c,'MATCH THE COLOURS!',480,472,22,'#346965');
  }
 }
}
function clean(){
 return {
  id:'clean',cmd:'CLEAN!',hint:'HOLD AND SWIPE THE COFFEE SPILL',bg:'#ebd5b4',
  enter(g){g.cleanProgress=0;g.cleanNeed=145+g.level*12;g.cleanDrag=false;g.cleanX=480;g.cleanY=321;g.cleanTrail=[];g.cleanSpark=0;},
  down(g,p,a){
   if(Math.hypot(p.x-480,p.y-326)>190)return;
   g.cleanDrag=true;g.cleanLast={x:p.x,y:p.y};a.tap();
  },
  move(g,p,a){
   if(!g.cleanDrag)return;
   const dx=p.x-g.cleanLast.x,dy=p.y-g.cleanLast.y;
   if(Math.hypot(p.x-480,p.y-326)>190){g.cleanLast={x:p.x,y:p.y};return;}
   g.cleanProgress+=Math.min(80,Math.hypot(dx,dy));
   g.cleanLast={x:p.x,y:p.y};
   g.cleanTrail.push({x:p.x,y:p.y,r:24+Math.min(25,g.cleanProgress*.15)});
   if(g.cleanTrail.length>24)g.cleanTrail.shift();
   if(g.cleanProgress>=g.cleanNeed){g.cleanDrag=false;a.spark(480,325,'#ffeeac');a.win(480,325);}
  },
  up(g){g.cleanDrag=false;},
  cancel(g){g.cleanDrag=false;},
  draw(g,c){
   // A large coffee spill with four soft puddle lobes, plate and wipe gesture.
   rr(c,224,225,512,216,33,'#fff4d9');
   c.save();c.fillStyle='#9e654d';
   c.beginPath();c.ellipse(480,330,157,74,.1,0,7);c.fill();
   for(let i=0;i<6;i++){
    const theta=i*1.047+1.1;
    c.beginPath();c.ellipse(480+130*Math.cos(theta),325+59*Math.sin(theta),36,26,theta/3,0,7);c.fill();
   }
   c.fillStyle='#c88e64';c.beginPath();c.ellipse(465,310,115,37,-.1,0,7);c.fill();c.restore();
   // Wiping leaves bright cream circular paths, so the result visibly changes.
   c.save();
   for(const t of g.cleanTrail){
    c.globalAlpha=.85;c.fillStyle='#fff4d9';c.beginPath();c.arc(t.x,t.y,t.r,0,7);c.fill();
    c.globalAlpha=.7;c.fillStyle='#fffdf0';c.beginPath();c.arc(t.x,t.y,8,0,7);c.fill();
   }
   c.restore();
   // Sponge sits near the hand and squashes on contact.
   const hand=g.cleanDrag?g.cleanLast:{x:330+Math.sin(g.t*3)*7,y:246};
   c.save();c.translate(hand.x,hand.y);
   rr(c,-44,-22,88,45,20,'#f7d777');
   rr(c,-35,-15,70,11,6,'#fff7c2');
   c.restore();
   const ratio=Math.min(1,g.cleanProgress/g.cleanNeed);
   rr(c,326,462,308,18,9,'#caa782');
   if(ratio>.001)rr(c,330,465,300*ratio,12,6,'#74cfa9');
   label(c,'WIPE!',480,493,22,'#835d4b');
  }
 }
}
function sort(){
 return {
  id:'sort',cmd:'SORT!',hint:'PAPER IN TRAY · BANANA IN BIN',bg:'#bedbe3',
  enter(g,a){
   const flip=a.rand()<.5;
   g.sortBins=[{kind:'paper',x:flip?700:260,y:422},{kind:'banana',x:flip?260:700,y:422}];
   g.sortItems=[
    {kind:'paper',x:390,y:274,homeX:390,homeY:274,done:false},
    {kind:'banana',x:570,y:274,homeX:570,homeY:274,done:false}
   ];
   g.sortDrag=null;g.sortDX=0;g.sortDY=0;g.sorted=0;
  },
  down(g,p,a){
   const item=g.sortItems.findLast(o=>!o.done&&hit(p,o.x,o.y,132,110));if(!item)return;
   g.sortDrag=item.kind;g.sortDX=p.x-item.x;g.sortDY=p.y-item.y;a.tap();
  },
  move(g,p){
   const item=g.sortItems.find(o=>o.kind===g.sortDrag);if(!item)return;
   item.x=clamp(p.x-g.sortDX,100,860);item.y=clamp(p.y-g.sortDY,216,471);
  },
  up(g,p,a){
   const item=g.sortItems.find(o=>o.kind===g.sortDrag);g.sortDrag=null;if(!item)return;
   const bin=g.sortBins.find(b=>hit({x:item.x,y:item.y},b.x,b.y,165,112));
   if(!bin){item.x=item.homeX;item.y=item.homeY;return}
   if(bin.kind!==item.kind){a.lose(item.x,item.y);return}
   item.done=true;g.sorted++;a.tap();a.spark(bin.x,bin.y,'#6ce6b7');
   if(g.sorted===2)a.win(bin.x,bin.y);
  },
  cancel(g){
   const item=g.sortItems.find(o=>o.kind===g.sortDrag);
   if(item){item.x=item.homeX;item.y=item.homeY;}g.sortDrag=null;
  },
  draw(g,c){
   // Separate flat desk area and two oversized, color-coded open bins.
   rr(c,163,237,633,158,36,'#edf6e9');
   for(const b of g.sortBins){
    c.save();c.translate(b.x,b.y);
    const paperBin=b.kind==='paper',color=paperBin?'#6aaeb2':'#efba62';
    rr(c,-95,-34,190,96,29,color);
    rr(c,-85,-43,170,30,15,paperBin?'#366f79':'#b77f40');
    rr(c,-70,-52,140,22,10,'#e9f6e8');
    label(c,paperBin?'PAPER':'BANANA',0,24,24,'#294f50');
    c.restore();
   }
   for(const o of g.sortItems){
    if(o.done)continue;
    if(o.kind==='paper')paper(c,o.x,o.y,108,107,'good',o.kind===g.sortDrag?-.09:0);
    else banana(c,o.x,o.y,o.kind===g.sortDrag?.16:-.07);
   }
   label(c,g.sorted+' / 2 SORTED',480,498,22,'#2c5960');
  }
 }
}
function shut(){
 return {
  id:'shut',cmd:'SHUT!',hint:'CLOSE THE POPUPS BEFORE THEY LAND',bg:'#dfcce4',
  enter(g,a){
   g.shutTotal=g.level===1?2:3;g.shutClosed=0;g.shutPhase=a.rand()*6;
   g.popup={x:290+a.rand()*380,y:293,phase:g.shutPhase};
  },
  update(g,dt,a){
   const p=g.popup;
   if(!p)return;
   p.y+=(48+g.level*16)*dt;
   p.x+=Math.sin(g.t*3+p.phase)*dt*24;
   if(p.y>440)a.lose(p.x,p.y);
  },
  down(g,p,a){
   const box=g.popup;if(!box)return;
   // Large obvious close target; accidental taps on the body never cost hearts.
   if(!hit(p,box.x+94,box.y-55,90,86))return;
   g.shutClosed++;a.tap();a.spark(box.x+90,box.y-50,'#fff5c3');
   if(g.shutClosed>=g.shutTotal){g.popup=null;a.win(box.x,box.y);return;}
   g.popup={x:255+a.rand()*440,y:293,phase:a.rand()*6};
  },
  draw(g,c){
   // Bean employee at risk below: cute but expressive, not a 3D atlas sprite.
   sprite(c,0,Math.floor(g.t*8)%4,480,421,147,160);
   rr(c,168,466,626,17,9,'#b49aab');
   if(g.popup){
    const p=g.popup;
    c.save();c.translate(p.x,p.y);c.rotate(Math.sin(g.t*5+p.phase)*.06);
    rr(c,-151,-95,303,188,31,'#fff8e7');
    rr(c,-151,-95,303,55,24,'#7899f4');
    rr(c,64,-89,85,75,26,'#b83e51');
    label(c,'×',107,-51,69,'#fff5d8');
    // A bold warning card: clearer than a generic ad face at microgame speed.
    rr(c,-151,-58,303,18,0,'#7899f4');
    c.fillStyle='#ffd24d';c.beginPath();c.moveTo(0,-21);c.lineTo(57,58);c.lineTo(-57,58);c.closePath();c.fill();
    label(c,'!',0,27,54,'#4b4056');
    rr(c,-78,68,156,10,5,'#d9dff0');
    c.restore();
   }
   label(c,g.shutClosed+' / '+g.shutTotal+' CLOSED',480,489,22,'#674c69');
  }
 }
}

export const GAMES=[stamp(),catchWorker(),shred(),fix(),timing(),dodge(),plug(),clean(),sort(),shut()];
export const ALL_IDS=GAMES.map(g=>g.id);