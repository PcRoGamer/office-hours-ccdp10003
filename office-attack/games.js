import {sprite,paper,rr,ink,capsule,confetti,drawIcon,COLORS as K} from './art.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const range=(a,b,v)=>v>=a&&v<=b;
const hit=(p,x,y,w,h)=>range(x-w/2,x+w/2,p.x)&&range(y-h/2,y+h/2,p.y);
const level=g=>g.level;
const label=(c,s,x,y,size=19,color=K.ink)=>ink(c,s,x,y,size,color);
const counter=(c,n)=>{rr(c,365,446,230,48,24,'#193e43');label(c,n,480,470,22,'#fff7d4')};
function stamp(){
 return {
  id:'stamp',cmd:'STAMP!',hint:'CLICK ✓  ·  AVOID ×',bg:'#e8ca84',
  enter(g,a){const yes=Math.floor(a.rand()*3);
   g.forms=[0,1,2].map((i)=>({id:i,ok:i===yes,x:245+i*235,y:327,phase:a.rand()*6.28}));},
  update(g,dt,a){g.forms.forEach(f=>{f.x=245+f.id*235+Math.sin(g.t*(.9+g.level*.34)+f.phase)*(12+g.level*25);f.y=330+Math.cos(g.t*1.4+f.phase)*12})},
  down(g,p,a){const f=g.forms.find(f=>hit(p,f.x,f.y,165-g.level*12,175-g.level*8));
   if(!f)return;if(f.ok)a.win(f.x,f.y);else a.lose(f.x,f.y)},
  draw(g,c){
   for(const f of g.forms){paper(c,f.x,f.y,166-g.level*10,170-g.level*6,f.ok?'good':'bad',Math.sin(g.t*1.5+f.phase)*.055,1)}
   label(c,'ONLY ONE FORM IS REAL',480,475,20,'#4b5549');
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
  id:'shred',cmd:'SHRED!',hint:'DRAG SPAM TO THE SHREDDER',bg:'#e6c1ac',
  enter(g,a){
   g.docs=[{id:'junk',ok:false,x:228,y:315,home:228},{id:'real',ok:true,x:425,y:315,home:425}];
   if(a.rand()<.5){g.docs[0].home=425;g.docs[1].home=228;g.docs[0].x=425;g.docs[1].x=228;}
   g.drag=null;g.dx=0;g.dy=0;g.feedPulse=0;
  },
  update(g,dt){g.feedPulse=Math.max(0,g.feedPulse-dt)},
  down(g,p,a){let d=g.docs.findLast(d=>hit(p,d.x,d.y,165,195));if(!d)return;g.drag=d.id;g.dx=p.x-d.x;g.dy=p.y-d.y;a.tap();},
  move(g,p){if(!g.drag)return;const d=g.docs.find(d=>d.id===g.drag);d.x=clamp(p.x-g.dx,110,850);d.y=clamp(p.y-g.dy,210,490)},
  up(g,p,a){if(!g.drag)return;const d=g.docs.find(d=>d.id===g.drag);g.drag=null;
   if(hit({x:d.x,y:d.y},750,333,172+g.level*10,205)){
    if(d.id==='junk'){g.feedPulse=.3;a.win(750,333)}else a.lose(750,333);
   }else{d.x=d.home;d.y=315;}
  },
  draw(g,c){
    drawIcon(c,'trash-can',755,332,244,280);
    label(c,'SHREDDER',755,473,22,'#643d32');
    for(const d of g.docs){paper(c,d.x,d.y,155,172,d.ok?'good':'bad',d.id===g.drag?-.07:0);}
    if(g.feedPulse>0){for(let i=0;i<12;i++)confetti(c,740+i*5,420+i*8,3+i%3,'#f1bf62')}
  }
 }
}
function patch(){
 return{
  id:'patch',cmd:'PATCH!',hint:'CLICK EVERY FLASHING LEAK',bg:'#d9cedd',
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
  enter(g,a){g.needle=170;g.direction=a.rand()<.5?1:-1;g.x0=g.direction===1?170:790;g.zone=80-g.level*17;g.speed=270+g.level*95},
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
  id:'dodge',cmd:'DODGE!',hint:'MOVE MOUSE  ·  AVOID RED MAIL',bg:'#bbd2df',
  enter(g,a){g.playerX=480;g.hazards=[];g.spawnAt=.5;g.lastX=480;g.safeT=3.6-g.level*.15;g.n=0},
  update(g,dt,a){
   g.spawnAt-=dt;g.safeT-=dt;
   if(g.spawnAt<=0){g.spawnAt=.52-g.level*.08;const x=clamp(g.playerX+(a.rand()-.5)*280,100,860);
     g.hazards.push({id:g.n++,x,y:145,v:260+g.level*85});}
   for(const h of g.hazards){h.y+=h.v*dt;if(Math.abs(h.y-410)<66&&Math.abs(h.x-g.playerX)<66){a.lose(h.x,h.y);return;}}
   g.hazards=g.hazards.filter(h=>h.y<590);
   if(g.safeT<=0)a.win(g.playerX,410);
  },
  move(g,p){g.playerX=clamp(p.x,85,875)},
  draw(g,c){
   rr(c,50,459,860,22,8,'#447d82');rr(c,g.playerX-75,448,150,15,8,'#66ddb1');
   sprite(c,0,Math.floor(g.t*5)%4,g.playerX,408,170,188);
   for(const h of g.hazards){drawIcon(c,'mail',h.x,h.y,112,112);rr(c,h.x+29,h.y+23,43,35,12,'#da4938');ink(c,'×',h.x+50,h.y+40,25,'#fff9e6');}
   label(c,Math.max(0,g.safeT).toFixed(1)+'s',480,496,22,'#24525d');
  }
 }
}
export const GAMES=[stamp(),catchWorker(),shred(),patch(),timing(),dodge()];
export const ALL_IDS=GAMES.map(g=>g.id);
