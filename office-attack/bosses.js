import {paper, rr, ink, confetti} from './art.js';

// World coordinates are 960 × 540. Keep every touch target comfortably clear
// of the shared 0–170 instruction area and the 491–535 deadline strip.
const TAU=Math.PI*2;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const hit=(p,x,y,w,h)=>Math.abs(p.x-x)<=w/2&&Math.abs(p.y-y)<=h/2;
const ease=t=>1-(1-clamp(t,0,1))**3;
const colors={navy:'#184b50',ink:'#214b48',white:'#fff9e9',gold:'#ffd66d',coral:'#fa7467',mint:'#6aebb0'};
function bar(c,x,y,w,h,fill,outline=null){rr(c,x,y,w,h,Math.min(h/2,20),fill,outline,outline?3:0)}
function shadow(c,x,y,rx,ry){c.save();c.globalAlpha=.17;c.fillStyle='#294a48';c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill();c.restore()}
function star(c,x,y,r,color){
 c.save();c.translate(x,y);c.fillStyle=color;c.beginPath();
 for(let i=0;i<8;i++){const a=-Math.PI/2+i*Math.PI/4,k=i%2?0.4:1;
  if(i===0)c.moveTo(Math.cos(a)*r*k,Math.sin(a)*r*k);
  else c.lineTo(Math.cos(a)*r*k,Math.sin(a)*r*k)}
 c.closePath();c.fill();c.restore();
}
function effects(c,g){
 const list=g.bossBits||[];
 for(const b of list){
  c.save();c.globalAlpha=clamp(b.life/b.max,0,1);
  if(b.shape==='star')star(c,b.x,b.y,b.size,b.color);
  else if(b.shape==='paper'){
   c.translate(b.x,b.y);c.rotate(b.angle||0);
   rr(c,-b.size*.5,-b.size*.7,b.size,b.size*1.35,3,b.color);
   rr(c,-b.size*.25,-b.size*.31,b.size*.5,3,2,'#cf9e89');
  }else confetti(c,b.x,b.y,b.size,b.color);
  c.restore();
 }
}
function emit(g,a,x,y,kind='good',n=12){
 // Deterministic through the owning game's RNG, not Math.random().
 const palette=kind==='good'?[colors.mint,colors.gold,'#fffdf1']:
  kind==='paper'?['#f9f1d8','#ffcfaf','#d6ece2']:[colors.coral,'#ffcd7c','#fff8df'];
 g.bossBits??=[];
 for(let i=0;i<n;i++){
  const angle=a.rand()*TAU,force=75+a.rand()*165;
  const life=.33+a.rand()*.43;
  g.bossBits.push({x,y,vx:Math.cos(angle)*force,vy:Math.sin(angle)*force-80,
   life,max:life,size:3+a.rand()*8,shape:i%5===0?'star':i%3===0?'paper':'dot',
   angle:a.rand()*TAU,spin:(a.rand()-.5)*9,color:palette[i%palette.length]});
 }
}
function moveEffects(g,dt){
 for(const b of g.bossBits||[]){b.x+=b.vx*dt;b.y+=b.vy*dt;b.vy+=280*dt;
  b.angle+=b.spin*dt;b.life-=dt}
 g.bossBits=(g.bossBits||[]).filter(b=>b.life>0);
 g.bossImpact=Math.max(0,(g.bossImpact||0)-dt);
 g.bossFlinch=Math.max(0,(g.bossFlinch||0)-dt);
 g.bossWarning=Math.max(0,(g.bossWarning||0)-dt);
}
function eyes(c,x,y,scale=1,mood='panic',blink=false){
 c.save();c.translate(x,y);c.scale(scale,scale);
 const hh=blink?3:mood==='squint'?12:23;
 rr(c,-57,-hh/2,38,hh,Math.min(13,hh/2),'#253e43');
 rr(c,19,-hh/2,38,hh,Math.min(13,hh/2),'#253e43');
 if(hh>=20){rr(c,-49,-8,11,9,4,'#fffdf0');rr(c,27,-8,11,9,4,'#fffdf0')}
 if(mood==='panic'){rr(c,-27,29,54,26,13,'#8e4251');rr(c,-19,33,38,8,4,'#fff2e8')}
 if(mood==='angry'){rr(c,-12,34,24,7,4,'#8e4251')}
 if(mood==='happy'){c.beginPath();c.arc(0,15,22,.16,Math.PI-.16);c.lineWidth=7;c.strokeStyle='#8e4251';c.stroke()}
 c.restore();
}
function printerBody(c,g){
 // A bespoke printer-creature, built from filled, softly chamfered volumes.
 // No HD atlas: the slot, paper mouth and limbs form one readable silhouette.
 rr(c,-203,-72,50,95,24,'#7fc4cc');
 rr(c,153,-72,50,95,24,'#7fc4cc');
 rr(c,-157,103,62,36,18,'#507b8a');
 rr(c,95,103,62,36,18,'#507b8a');
 rr(c,-186,-120,372,252,78,'#79c7d1');
 rr(c,-159,-132,318,68,32,'#a4e2df');
 rr(c,-92,-122,184,46,16,'#f4fbdf');
 rr(c,-74,-112,148,8,4,'#b4d9b9');
 rr(c,-74,-98,112,7,4,'#c4e2bf');
 rr(c,-130,43,260,78,28,'#3c8285');
 rr(c,-104,49,208,35,16,'#b0e8c9');
 rr(c,-163,91,30,20,10,'#f4a99c');
 rr(c,133,91,30,20,10,'#f4a99c');
 eyes(c,0,-37,.86,g.bossMood,Math.sin(g.t*3.3)>.997);
}
function managerBody(c,g){
 // A worried bean-shaped office manager with tiny arms, feet and a soft tie.
 rr(c,-140,-18,47,90,23,'#aa92d1');
 rr(c,93,-18,47,90,23,'#aa92d1');
 rr(c,-87,95,66,30,15,'#746696');
 rr(c,21,95,66,30,15,'#746696');
 rr(c,-120,-124,240,248,114,'#b6a1dc');
 rr(c,-93,68,186,45,23,'#d2bee6');
 rr(c,-39,56,78,25,12,'#fff2dc');
 c.fillStyle='#fa796e';c.beginPath();c.moveTo(0,71);c.lineTo(-13,96);c.lineTo(0,115);c.lineTo(13,96);c.closePath();c.fill();
 rr(c,-97,9,29,15,8,'#ef9d9d');rr(c,68,9,29,15,8,'#ef9d9d');
 eyes(c,0,-32,.61,g.bossMood,Math.sin(g.t*2.2)>.999);
}
function bubble(c,text,x,y,color=colors.navy,w=200){
 c.save();c.globalAlpha=.95;
 rr(c,x-w/2,y-24,w,48,22,color);
 ink(c,text,x,y+2,21,colors.white);
 c.restore();
}
function pips(c,hits,total,y=450){
 for(let i=0;i<total;i++){
  const x=480+(i-(total-1)/2)*66;
  bar(c,x-26,y-11,52,23,i<hits?colors.mint:'#ffefc7');
  if(i<hits)star(c,x,y,10,'#23645a');
 }
}
function printerBoss(){
 return {
  id:'boss-printer',type:'boss',cmd:'PRINTER PANIC!',
  hint:'TAP WHEN THE FEEDER HITS GREEN · 3 PERFECT FEEDS',bg:'#f9d8a7',
  enter(g){
   g.bossHits=0;g.bossNeed=3;g.bossPhase='feed';g.bossNeedle=228;
   g.bossDirection=1;g.bossZone=104;g.bossSpeed=250;
   g.bossCooldown=0;g.bossImpact=0;g.bossFlinch=0;g.bossWarning=0;
   g.bossMistakes=0;g.bossBits=[];g.bossMood='panic';g.bossBanner='';
  },
  update(g,dt){
   moveEffects(g,dt);
   g.bossCooldown=Math.max(0,g.bossCooldown-dt);
   if(g.bossCooldown>0)return;
   g.bossNeedle+=g.bossDirection*g.bossSpeed*dt;
   if(g.bossNeedle>=736){g.bossNeedle=736;g.bossDirection=-1}
   if(g.bossNeedle<=224){g.bossNeedle=224;g.bossDirection=1}
   g.bossPhase=['feed','double-feed','meltdown'][g.bossHits];
   g.bossMood=g.bossHits===2?'angry':'panic';
  },
  down(g,p,a){
   if(g.bossCooldown>0)return;
   // The entire game canvas accepts the timing tap, matching mouse, keyboard
   // and touchscreen input. Only the timing position matters, not cursor aim.
   if(Math.abs(g.bossNeedle-480)>g.bossZone){
    g.bossMistakes++;g.bossWarning=.75;g.bossFlinch=.26;
    g.bossBanner=g.bossMistakes===1?'TOO EARLY!':'PRINTER JAM!';
    emit(g,a,g.bossNeedle,418,'bad',10);
    a.spark(g.bossNeedle,418,colors.coral);
    if(g.bossMistakes>=2){a.lose(g.bossNeedle,419);return}
    g.bossCooldown=.2;
    return;
   }
   g.bossHits++;g.bossImpact=.48;g.bossFlinch=.42;
   g.bossBanner=['CHUNK!','KA-CHUNK!','FINAL FEED!'][g.bossHits-1];
   emit(g,a,480,337,'paper',20);
   a.tap();a.spark(480,332,colors.mint);
   if(g.bossHits===3){g.bossMood='happy';a.win(480,336);return}
   g.bossZone=g.bossHits===1?88:78;
   g.bossSpeed=g.bossHits===1?315:355;
   g.bossNeedle=g.bossHits%2?734:226;
   g.bossDirection=g.bossNeedle<480?1:-1;
   g.bossPhase=g.bossHits===1?'double-feed':'meltdown';
   g.bossCooldown=.33;
  },
  key(g,key,a){if(key===' '||key==='Enter'){this.down(g,{x:480,y:424},a);return true}return false},
  draw(g,c){
   const bounced=Math.sin(Math.PI*clamp(g.bossImpact/.48,0,1));
   const jiggle=g.bossFlinch>0?Math.sin(g.t*54)*g.bossFlinch*23:0;
   shadow(c,480,445,190,22);
   c.save();c.translate(480+jiggle,313+bounced*12);
   c.rotate(g.bossFlinch>0?Math.sin(g.t*42)*.035:Math.sin(g.t*2)*.008);
   const sx=1+bounced*.075,sy=1-bounced*.12;
   c.scale(sx,sy);
   printerBody(c,g);
   c.restore();
   bar(c,207,398,546,66,'#255a5b');
   bar(c,223,409,514,44,'#427774');
   const safeX=480-g.bossZone;
   bar(c,safeX,412,g.bossZone*2,38,'#73e9a6');
   bar(c,g.bossNeedle-17,393,34,76,colors.gold);
   star(c,g.bossNeedle,406,8,'#fffbea');
   for(let i=0;i<3;i++){
    const x=371+i*109;
    c.save();c.globalAlpha=i<g.bossHits?1:.62;
    paper(c,x,199,58,66,i<g.bossHits?'good':'bad',Math.sin(g.t*3+i)*.07);
    c.restore();
   }
   pips(c,g.bossHits,3,472);
   if(g.bossImpact>0)bubble(c,g.bossBanner,758,250,'#297b66',213);
   else if(g.bossWarning>0)bubble(c,g.bossBanner,758,250,'#bd5650',213);
   else if(g.bossHits===2)bubble(c,'ONE MORE!',758,250,'#b85549',186);
   if(g.bossMistakes>0&&g.bossWarning<=0)
    ink(c,'⚠  NEXT MISS COSTS A HEART',480,379,20,'#a7443c');
   effects(c,g);
  }
 }
}
function managerBoss(){
 return {
  id:'boss-manager',type:'boss',cmd:'CLOCK OUT!',
  hint:'CLOSE 3 RED MEMOS · THEN SLAM THE BIG BUTTON',bg:'#f6c3bc',
  enter(g,a){
   g.bossHits=0;g.bossNeed=3;g.bossPhase='memos';g.bossCooldown=.6;
   g.bossImpact=0;g.bossFlinch=0;g.bossWarning=0;
   g.bossPop=null;g.bossPopTime=0;g.bossBits=[];
   g.bossBanner='';g.bossMood='angry';this.spawn(g,a);
  },
  spawn(g,a){
   const xs=[304,480,656];let i=Math.floor(a.rand()*3);
   if(xs[i]===g.bossPop?.baseX)i=(i+1)%3;
   g.bossPop={x:xs[i],y:262,baseX:xs[i],phase:a.rand()*TAU};
   g.bossPopTime=0;
  },
  update(g,dt,a){
   moveEffects(g,dt);
   g.bossCooldown=Math.max(0,g.bossCooldown-dt);
   if(g.bossPhase==='stamp')return;
   if(g.bossCooldown>0)return;
   g.bossPopTime+=dt;
   const p=g.bossPop;
   const speed=[36,48,60][g.bossHits];
   p.y=262+Math.min(159,g.bossPopTime*speed);
   p.x=p.baseX+Math.sin(g.t*2.9+p.phase)*(12+g.bossHits*5);
   if(p.y>=421)a.lose(p.x,p.y);
  },
  down(g,p,a){
   if(g.bossCooldown>0)return;
   if(g.bossPhase==='stamp'){
    if(!hit(p,480,350,408,160))return;
    g.bossImpact=.9;g.bossMood='panic';g.bossBanner='CLOCKED OUT!';
    emit(g,a,480,350,'good',26);
    a.tap();a.spark(480,350,colors.mint);a.win(480,350);return;
   }
   const pop=g.bossPop;
   if(pop&&!hit(p,pop.x,pop.y,184,158))return;
   if(!pop)return;
   g.bossHits++;g.bossImpact=.4;g.bossFlinch=.5;
   g.bossBanner=['BONK!','SPLAT!','NOT ANOTHER!'][g.bossHits-1];
   emit(g,a,pop.x,pop.y,'bad',19);
   a.tap();a.spark(pop.x,pop.y,colors.coral);
   if(g.bossHits>=3){g.bossPhase='stamp';g.bossPop=null;g.bossCooldown=.43;g.bossMood='panic'}
   else {this.spawn(g,a);g.bossCooldown=.53}
  },
  draw(g,c){
   shadow(c,480,448,155,23);
   const flinch=g.bossFlinch>0?Math.sin(g.t*37)*g.bossFlinch*20:0;
   c.save();c.translate(480+flinch,320);
   const squash=Math.sin(Math.PI*clamp(g.bossImpact/.4,0,1));
   c.scale(1+squash*.12,1-squash*.14);
   c.rotate(Math.sin(g.t*3.5)*.027);
   managerBody(c,g);
   c.restore();
   if(g.bossPhase==='memos'&&g.bossPop){
    const p=g.bossPop;
    c.save();c.translate(p.x,p.y);c.rotate(Math.sin(g.t*5.5+p.phase)*.075);
    c.shadowColor='#7b4e5477';c.shadowBlur=13;c.shadowOffsetY=7;
    rr(c,-84,-69,168,138,24,'#f26561');
    c.shadowBlur=0;c.shadowOffsetY=0;
    rr(c,-64,-52,128,18,9,'#ffb49e');
    bar(c,-49,-23,98,11,'#fcb9a7');
    bar(c,-49,-1,66,10,'#ffb49e');
    c.save();c.translate(51,33);c.rotate(-.16);
    rr(c,-29,-27,58,54,18,'#fff1d2');
    ink(c,'×',0,0,53,'#b94943');c.restore();
    c.restore();
    const urgency=ease(p.y/420);
    c.save();c.globalAlpha=.35+.36*urgency;
    star(c,p.x,p.y-86,8+Math.sin(g.t*10)*3,'#f45a53');c.restore();
   }else if(g.bossPhase==='stamp'){
    const pulse=1+Math.sin(g.t*12)*.037;
    c.save();c.translate(480,351);c.scale(pulse,pulse);
    c.shadowColor='#3d685d66';c.shadowBlur=20;c.shadowOffsetY=10;
    rr(c,-204,-77,408,154,42,'#64e9a3');
    c.shadowBlur=0;c.shadowOffsetY=0;
    rr(c,-182,-57,364,112,32,'#bcffce');
    ink(c,'CLOCK OUT!',0,3,58,'#24534b');c.restore();
    ink(c,'ONE LAST SLAM!',480,231,22,'#ad403f');
   }
   for(let i=0;i<3;i++){
    const x=404+(i-1)*78;
    bar(c,x-25,462,50,24,i<g.bossHits?'#6ce4aa':'#ffe6d7');
    if(i<g.bossHits)star(c,x,474,10,'#236b56');
   }
   if(g.bossImpact>0)bubble(c,g.bossBanner,480,202,'#b45150',255);
   else if(g.bossPhase==='memos')bubble(c,'CLOSE RED MAIL!',480,205,'#b45150',236);
   effects(c,g);
  }
 }
}
export const BOSSES=[printerBoss(),managerBoss()];
