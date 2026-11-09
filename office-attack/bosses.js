import {sprite,drawIcon,rr,ink,confetti} from './art.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const inside=(p,x,y,w,h)=>Math.abs(p.x-x)<=w/2&&Math.abs(p.y-y)<=h/2;
const badge=(c,text,x,y,w=140)=>{rr(c,x-w/2,y-27,w,52,22,'#194a4b');ink(c,text,x,y,25,'#fff5de')};

function printerBoss(){
 return {
  id:'boss-printer',type:'boss',cmd:'PRINTER PANIC!',hint:'CLICK WHEN THE PAPER IS GREEN · 3 HITS',bg:'#f5c77f',
  enter(g,a){
   g.bossHits=0;g.bossNeed=3;g.bossPhase='timing';
   g.bossNeedle=228;g.bossDirection=1;g.bossZone=90;
   g.bossSpeed=260;g.bossCooldown=0;g.bossImpact=0;g.bossMistakes=0;
  },
  update(g,dt,a){
   g.bossImpact=Math.max(0,g.bossImpact-dt);
   if(g.bossCooldown>0){g.bossCooldown-=dt;return}
   g.bossNeedle+=g.bossDirection*g.bossSpeed*dt;
   if(g.bossNeedle>=737){g.bossNeedle=737;g.bossDirection=-1}
   if(g.bossNeedle<=223){g.bossNeedle=223;g.bossDirection=1}
  },
  down(g,p,a){
   if(g.bossCooldown>0)return;
   // The whole bottom timing rail is clickable. Fail only on an intentional
   // early/late click, never because the user's cursor is two pixels off a tiny button.
   if(Math.abs(g.bossNeedle-480)>g.bossZone){
    g.bossMistakes++;g.bossImpact=.18;a.spark(g.bossNeedle,429,'#f05e57');
    if(g.bossMistakes>=2)a.lose(g.bossNeedle,429);
    else g.bossCooldown=.2;
    return;
   }
   g.bossHits++;g.bossImpact=.28;a.tap();a.spark(480,385,'#70f1ac');
   if(g.bossHits>=3){a.win(480,365);return}
   g.bossCooldown=.36;g.bossNeedle=g.bossHits%2===0?228:732;
   g.bossDirection=g.bossNeedle<480?1:-1;
   g.bossSpeed+=42;
  },
  key(g,key,a){if(key===' '||key==='Enter'){this.down(g,{x:480,y:427},a);return true}return false},
  draw(g,c){
   const pulse=1+g.bossImpact*.27;
   c.save();c.translate(480,332);c.scale(pulse,pulse);
   sprite(c,2,Math.floor(g.t*6)%4,0,0,455,360);
   c.restore();
   rr(c,216,410,528,48,20,'#154e4e');
   rr(c,480-g.bossZone,418,g.bossZone*2,32,13,'#56ed9b');
   c.save();c.shadowColor='#ffeb98';c.shadowBlur=13;
   rr(c,g.bossNeedle-18,397,36,74,12,'#ffca58');c.restore();
   badge(c,g.bossHits+' / 3 FEEDS',480,485,205);
   for(let i=0;i<3;i++)drawIcon(c,g.bossHits>i?'tick':'file',385+i*95,204,55,55);
   if(g.bossImpact>0&&g.bossMistakes>0)ink(c,'ONE MORE MISS = HEART LOST!',480,264,25,'#ab3b36');
   else if(g.bossImpact>0)ink(c,'CHUNK!',480,264,50,'#fff9d9');
  }
 }
}
function managerBoss(){
 return{
  id:'boss-manager',type:'boss',cmd:'CLOCK OUT!',hint:'CLOSE 3 RED MEMOS · THEN HIT THE BIG BUTTON',bg:'#f5b2a1',
  enter(g,a){
   g.bossHits=0;g.bossNeed=3;g.bossPhase='memos';g.bossCooldown=0;
   g.bossPop=null;g.bossPopTime=0;g.bossImpact=0;
   this.spawn(g,a);g.bossCooldown=.62;
  },
  spawn(g,a){
   const positions=[340,500,655];
   let pick=Math.floor(a.rand()*positions.length);
   if(positions[pick]===g.bossPop?.x)pick=(pick+1)%positions.length;
   g.bossPop={x:positions[pick],y:265,baseX:positions[pick],phase:a.rand()*Math.PI*2};
   g.bossPopTime=0;
  },
  update(g,dt,a){
   g.bossImpact=Math.max(0,g.bossImpact-dt);
   g.bossCooldown=Math.max(0,g.bossCooldown-dt);
   if(g.bossPhase!=='memos'||g.bossCooldown>0)return;
   g.bossPopTime+=dt;
   g.bossPop.y=261+Math.min(133,g.bossPopTime*44);
   g.bossPop.x=g.bossPop.baseX+Math.sin(g.t*2.7+g.bossPop.phase)*27;
   if(g.bossPop.y>=394)a.lose(g.bossPop.x,g.bossPop.y);
  },
  down(g,p,a){
   if(g.bossCooldown>0)return;
   if(g.bossPhase==='stamp'){
    if(inside(p,480,366,360,132)){g.bossImpact=.8;a.win(480,365)}
    return;
   }
   const pop=g.bossPop;
   // The red memo is the hit target; no tiny X hitbox.
   if(pop&&inside(p,pop.x,pop.y,148,140)){
    g.bossHits++;g.bossImpact=.33;a.tap();a.spark(pop.x,pop.y,'#e8655b');
    if(g.bossHits===3){g.bossPhase='stamp';g.bossPop=null;g.bossCooldown=.65}
    else{g.bossCooldown=.84;this.spawn(g,a)}
   }
  },
  draw(g,c){
   c.save();c.translate(480,325);
   c.rotate(Math.sin(g.t*2.4)*.028);
   sprite(c,1,Math.floor(g.t*4)%4,0,0,270,275,.94);
   c.restore();
   if(g.bossPhase==='memos'){
    const p=g.bossPop;
    if(p){
     c.save();c.translate(p.x,p.y);c.rotate(Math.sin(g.t*5+p.phase)*.09);
     drawIcon(c,'mail',0,0,195,174);
     rr(c,31,-52,84,66,19,'#e95149');
     ink(c,'X',72,-19,42,'#fff7e7');
     c.restore();
    }
    ink(c,g.bossCooldown>0?'GET READY!':'CLOSE THE RED MAIL!',480,195,30,'#9f3035');
   }else{
    c.save();c.translate(480,355);
    const pulse=1+Math.sin(g.t*11)*.06;
    c.scale(pulse,pulse);
    rr(c,-180,-70,360,140,38,'#56e5a2');
    ink(c,'CLOCK OUT!',0,2,69,'#114a42');
    c.restore();
    ink(c,'ONE LAST CLICK!',480,222,28,'#af3a35');
   }
   for(let i=0;i<3;i++)drawIcon(c,g.bossHits>i?'tick':'mail',380+i*100,461,63,56);
   badge(c,g.bossHits+' / 3 MEMOS',480,501,210);
  }
 }
}
export const BOSSES=[printerBoss(),managerBoss()];
