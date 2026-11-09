import {rr,ink} from './art.js';
import {drawPrinter,drawManager,drawMemo,drawStampButton,drawPips,drawImpact,drawCue,palette} from './feedback.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const inside=(p,x,y,w,h)=>Math.abs(p.x-x)<=w/2&&Math.abs(p.y-y)<=h/2;
function pill(c,text,x,y,w=194){
  rr(c,x-w/2,y-16,w,32,16,'#245b5a');
  ink(c,text,x,y+1,19,'#fff9e9');
}
function burst(g,time=.28,label='BONK!'){
  g.bossImpact=time;g.bossFeedbackTime=time+.14;g.bossFeedback=label;
}
// This export remains a drop-in replacement for the original boss contract:
// enter/update/down/key/draw receive the same game state and settle/spark API.
function printerBoss(){
  return{
    id:'boss-printer',type:'boss',cmd:'PRINTER PANIC!',
    hint:'TAP WHEN THE FEEDER IS GREEN Â· 3 HITS',bg:'#f9d79a',
    enter(g){
      g.bossHits=0;g.bossNeed=3;g.bossPhase='timing';g.bossMistakes=0;
      g.bossNeedle=224;g.bossDirection=1;g.bossZone=98;g.bossSpeed=248;
      g.bossCooldown=.52;g.bossImpact=0;g.bossFeedbackTime=0;g.bossFeedback='';
    },
    update(g,dt){
      g.bossImpact=Math.max(0,g.bossImpact-dt);
      g.bossFeedbackTime=Math.max(0,g.bossFeedbackTime-dt);
      g.bossCooldown=Math.max(0,g.bossCooldown-dt);
      if(g.bossCooldown>0)return;
      // Reflect overshoot rather than pinning to an edge; makes timing invariant
      // even on a slow/hiccuping display and avoids invisible speed spikes.
      let next=g.bossNeedle+g.bossDirection*g.bossSpeed*dt;
      if(next>736){next=1472-next;g.bossDirection=-1}
      else if(next<224){next=448-next;g.bossDirection=1}
      g.bossNeedle=clamp(next,224,736);
    },
    down(g,p,a){
      // An impulsive opening press counts as a warned early feed, not a no-op.
      if(g.bossCooldown>0&&(g.bossHits>0||g.bossMistakes>0))return;
      if(Math.abs(g.bossNeedle-480)>g.bossZone){
        g.bossMistakes++;
        burst(g,.25,'SPLAT!');
        a.spark(g.bossNeedle,423,'#f46c6a');
        if(g.bossMistakes>=2){a.lose(g.bossNeedle,423);return}
        // One recoverable miss. The next correct feed still counts.
        g.bossCooldown=.26;
        return;
      }
      g.bossHits++;
      burst(g,.31,'CHUNK!');
      a.tap();a.spark(480,417,'#70e8b5');
      if(g.bossHits>=g.bossNeed){g.bossPhase='victory';a.win(480,315);return}
      g.bossCooldown=.4;
      g.bossNeedle=g.bossHits%2?736:224;
      g.bossDirection=g.bossNeedle===224?1:-1;
      g.bossSpeed=248+g.bossHits*29;
      // Slightly narrow the green gate after each hit without turning it
      // into an unfair frame-perfect reflex challenge.
      g.bossZone=98-g.bossHits*8;
    },
    key(g,key,a){
      if(key===' '||key==='Enter'){this.down(g,{x:480,y:423},a);return true}
      return false;
    },
    draw(g,c){
      // The art is entirely original filled-shape office animation, never the
      // legacy HD atlas; no gradients/line-diagram placeholders.
      c.save();c.translate(480,293);c.scale(.76,.76);
      drawPrinter(c,0,0,g.t,g.bossImpact,g.bossMistakes&&g.bossFeedbackTime>0?'hit':'grumpy');
      c.restore();
      drawPips(c,g.bossHits,3,792,277,61);
      drawCue(c,g.bossCooldown>0?'READY?':'TAP GREEN!',789,360,
        g.bossCooldown>0?'#9f5d38':'#235a50',23);
      // Large, forgiving target zone and moving feeder, always visible below
      // the boss art but above the global deadline strip.
      rr(c,210,406,540,49,23,'#2c5f5b');
      rr(c,218,412,524,37,18,'#579e8b');
      rr(c,480-g.bossZone,414,g.bossZone*2,32,15,'#6cf0ab');
      rr(c,480-g.bossZone+12,419,g.bossZone*2-24,11,5,'#cbffe0');
      c.save();c.translate(g.bossNeedle,425);
      c.rotate(Math.sin(g.t*8)*.05);
      rr(c,-24,-30,48,62,18,'#faad65');
      rr(c,-18,-26,36,50,15,'#ffe48c');
      rr(c,-11,-13,22,10,5,'#f5b467');
      c.restore();
      if(g.bossFeedbackTime>0){
        const alpha=Math.min(1,g.bossFeedbackTime/.15);
        c.save();c.globalAlpha=alpha;
        drawImpact(c,g.bossNeedle,348,Math.min(1.2,.66+g.bossImpact),g.t,
          g.bossFeedback==='SPLAT!');c.restore();
      }
      pill(c,g.bossHits+' / 3 FEEDS',480,473);
      if(g.bossMistakes===1&&g.bossFeedbackTime<=0)
        drawCue(c,'ONE MISS LEFT!',785,342,'#b54648',20);
    }
  }
}
function managerBoss(){
  return{
    id:'boss-manager',type:'boss',cmd:'CLOCK OUT!',
    hint:'CLOSE 3 RED MEMOS Â· THEN HIT THE GREEN BUTTON',bg:'#fac1b0',
    enter(g,a){
      g.bossHits=0;g.bossNeed=3;g.bossPhase='memos';
      g.bossCooldown=.58;g.bossImpact=0;g.bossFeedbackTime=0;
      g.bossFeedback='';g.bossPop=null;g.bossPopTime=0;
      this.spawn(g,a);
    },
    spawn(g,a){
      const positions=[348,515,678];
      const last=g.bossPop?.baseX;
      let index=Math.floor(a.rand()*positions.length);
      if(positions[index]===last)index=(index+1)%positions.length;
      g.bossPop={baseX:positions[index],x:positions[index],y:260,
        phase:a.rand()*Math.PI*2};
      g.bossPopTime=0;
    },
    update(g,dt,a){
      g.bossImpact=Math.max(0,g.bossImpact-dt);
      g.bossFeedbackTime=Math.max(0,g.bossFeedbackTime-dt);
      g.bossCooldown=Math.max(0,g.bossCooldown-dt);
      if(g.bossPhase!=='memos'||g.bossCooldown>0)return;
      g.bossPopTime+=dt;
      const p=g.bossPop;
      if(!p)return;
      p.y=260+Math.min(159,g.bossPopTime*(46+g.bossHits*5));
      p.x=p.baseX+Math.sin(g.t*2.8+p.phase)*18;
      // The whole red paper is hittable. A failed descending memo costs only
      // the ordinary boss-retry heart, not an additional hidden penalty.
      if(p.y>=419){burst(g,.35,'LATE!');a.lose(p.x,p.y)}
    },
    down(g,p,a){
      // An impulsive opening press counts as a warned early feed, not a no-op.
      if(g.bossCooldown>0&&(g.bossHits>0||g.bossMistakes>0))return;
      if(g.bossPhase==='stamp'){
        if(inside(p,480,353,374,136)){
          g.bossPhase='victory';burst(g,.78,'CLOCKED OUT!');
          a.tap();a.spark(480,354,'#70e8b5');a.win(480,350);
        }
        return;
      }
      if(g.bossPhase!=='memos')return;
      const m=g.bossPop;
      if(m&&inside(p,m.x,m.y,165,135)){
        g.bossHits++;burst(g,.3,'SPLAT!');
        a.tap();a.spark(m.x,m.y,'#ffefd6');
        if(g.bossHits>=g.bossNeed){
          g.bossPhase='stamp';g.bossPop=null;g.bossCooldown=.35;
        }else{
          this.spawn(g,a);g.bossCooldown=.48;
        }
      }
      // No random false-click damage: a missed touch is simply another chance
      // while the red memo descends. This is deliberately accessible on mobile.
    },
    key(g,key,a){
      if(key===' '||key==='Enter'){
        if(g.bossPhase==='stamp')this.down(g,{x:480,y:353},a);
        else if(g.bossPop)this.down(g,{x:g.bossPop.x,y:g.bossPop.y},a);
        return true;
      }
      return false;
    },
    draw(g,c){
      c.save();c.translate(160,301);c.scale(.77,.77);
      drawManager(c,0,0,g.t,
        g.bossPhase==='stamp'?'panic':g.bossFeedbackTime>0?'hit':'smug',g.bossImpact);
      c.restore();
      if(g.bossPhase==='memos'){
        const m=g.bossPop;
        if(m){
          drawMemo(c,m.x,m.y,g.t,m.phase);
        }
        drawCue(c,g.bossCooldown>0?'READY?':'TAP RED!',836,316,
          '#9c3f46',24);
      }else{
        drawStampButton(c,480,347,g.t,g.bossImpact);
        drawCue(c,g.bossCooldown>0?'FINAL APPROVAL!':'SLAM THE BUTTON!',540,218,
          '#247a65',27);
      }
      drawPips(c,g.bossHits,3,225,464,62);
      pill(c,g.bossPhase==='stamp'?'FINAL STAMP!':g.bossHits+' / 3 MEMOS',480,472,224);
      if(g.bossFeedbackTime>0&&g.bossPhase==='memos'){
        c.save();c.globalAlpha=Math.min(1,g.bossFeedbackTime/.18);
        drawImpact(c,775,326,.75,g.t,false);c.restore();
      }
    }
  }
}
export const BOSSES=[printerBoss(),managerBoss()];