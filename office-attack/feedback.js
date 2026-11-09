// Original boss illustrations and effects. All primitives are filled, soft and
// self-contained; no legacy sprite atlas, icon PNG, fonts or network requests.
import {rr,ink} from './art.js';

const PI=Math.PI, TAU=PI*2;
const palette={ink:'#244a4c',cream:'#fff8ec',mint:'#70e8b5',coral:'#f46c6a',
  lemon:'#ffe27c',pink:'#ffb9b3',plum:'#674860',paper:'#fff8ea'};
const blob=(c,x,y,rx,ry,color)=>{
  c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fillStyle=color;c.fill();
};
function mouth(c,x,y,mood=0,scale=1){
  c.save();c.translate(x,y);c.scale(scale,scale);
  if(mood===1){blob(c,0,0,18,24,palette.ink);blob(c,0,11,11,7,'#f58f99')}
  else if(mood===2){blob(c,0,1,27,12,palette.ink);rr(c,-18,1,36,8,4,'#fff8ed')}
  else if(mood===3){blob(c,0,0,11,20,palette.ink)}
  else{blob(c,0,2,17,8,palette.ink);blob(c,0,-3,15,5,'#ffd4bf')}
  c.restore();
}
function eye(c,x,y,r=9,closed=false){
  if(closed)rr(c,x-r,y-3,r*2,6,3,palette.ink);
  else {blob(c,x,y,r,r*1.28,palette.ink);blob(c,x-2,y-3,Math.max(2,r*.27),Math.max(2,r*.38),'#fff')}
}
function shadow(c,x,y,w,h){blob(c,x,y,w,h,'#35525725')}
function sprinkle(c,x,y,phase,color=palette.lemon){
  const t=phase||0;
  for(let i=0;i<6;i++){
    const a=i*TAU/6+t*.9,d=45+((i*19)%25);
    c.save();c.translate(x+Math.cos(a)*d,y+Math.sin(a)*d);
    c.rotate(a);rr(c,-7,-5,22,10,5,i%2?color:palette.cream);c.restore();
  }
}
export function drawImpact(c,x,y,size=1,time=0,bad=false){
  c.save();c.translate(x,y);c.scale(size,size);
  const colors=bad?['#f36b69','#ffd9a2','#fff8e9']:['#6de9b0','#fff5b1','#ffffff'];
  for(let k=0;k<9;k++){
    const a=k*TAU/9+time*1.5,d=39+(k%3)*7;
    c.save();c.translate(Math.cos(a)*d,Math.sin(a)*d);c.rotate(a);
    blob(c,0,0,15,10,colors[k%3]);c.restore();
  }
  blob(c,0,0,39,34,colors[0]);blob(c,-7,-10,18,10,'#ffffff9c');
  ink(c,bad?'OUCH!':'BONK!',0,4,25,palette.ink);
  c.restore();
}
export function drawPips(c,count,total,x,y,gap=76){
  for(let i=0;i<total;i++){
    const px=x+(i-(total-1)/2)*gap;
    blob(c,px,y,24,23,i<count?palette.mint:'#fff4e4');
    blob(c,px,y+3,18,17,i<count?'#37a77d':'#eac2a1');
    ink(c,i<count?'✓':String(i+1),px,y+4,22,'#fff9e9');
  }
}
// A single bean-shaped boss, not a circle-and-stick character.
export function drawManager(c,x,y,t,expression='smug',impact=0){
  const wobble=Math.sin(t*3)*.025+(impact?Math.sin(t*47)*impact*.2:0);
  c.save();shadow(c,x+12,y+123,122,21);
  c.translate(x,y);c.rotate(wobble);c.scale(1+impact*.07,1-impact*.04);
  // Flappy shoes and tiny arms are part of the bean silhouette.
  blob(c,-57,111,27,16,'#304e60');blob(c,51,111,27,16,'#304e60');
  c.save();c.translate(-91,-11);c.rotate(-.15-Math.sin(t*7)*.15);
  blob(c,0,0,17,49,'#e08c73');blob(c,0,43,18,16,'#e08c73');c.restore();
  c.save();c.translate(89,-10);c.rotate(.22+Math.sin(t*5)*.14);
  blob(c,0,0,17,48,'#e08c73');blob(c,0,45,18,16,'#e08c73');c.restore();
  // Uneven pear/bean body in filled Bezier silhouette.
  c.beginPath();c.moveTo(-70,-93);
  c.bezierCurveTo(-124,-82,-127,23,-96,75);
  c.bezierCurveTo(-63,132,68,138,101,69);
  c.bezierCurveTo(136,-17,90,-118,20,-116);
  c.bezierCurveTo(-7,-112,-36,-104,-70,-93);
  c.fillStyle='#f0a28c';c.fill();
  blob(c,-52,-27,28,59,'#ffc1aa55');
  // Massive tie, miniature collar, floppy hair tuft.
  c.beginPath();c.moveTo(-24,45);c.lineTo(0,35);c.lineTo(26,45);c.lineTo(0,74);c.closePath();
  c.fillStyle='#fff3db';c.fill();
  c.beginPath();c.moveTo(-1,52);c.lineTo(-20,86);c.lineTo(2,105);c.lineTo(22,85);c.closePath();
  c.fillStyle='#e35e68';c.fill();
  c.beginPath();c.moveTo(-72,-89);c.bezierCurveTo(-65,-150,15,-155,52,-126);
  c.bezierCurveTo(91,-137,103,-96,95,-71);
  c.bezierCurveTo(46,-92,5,-95,-26,-70);
  c.bezierCurveTo(-45,-63,-65,-68,-72,-89);
  c.fillStyle='#384a5e';c.fill();
  const shock=expression==='panic'||expression==='hit';
  eye(c,-35,-17,shock?12:9,expression==='hit');
  eye(c,35,-18,shock?12:9,expression==='hit');
  blob(c,-76,14,16,9,'#fa786b80');blob(c,72,13,17,10,'#fa786b80');
  mouth(c,0,30,expression==='panic'?1:expression==='hit'?2:expression==='victory'?3:0,1);
  rr(c,53,59,55,27,13,'#ffe88c');
  ink(c,'BOSS',80,73,13,'#76515b');
  c.restore();
}
export function drawPrinter(c,x,y,t,impact=0,expression='grumpy'){
  const wiggle=impact?Math.sin(t*57)*impact*11:Math.sin(t*5)*2;
  c.save();c.translate(x+wiggle,y);
  shadow(c,0,116,173,26);
  // Paper emerging from a plump printer head, with toothy character mouth.
  c.save();c.translate(3,-116+Math.sin(t*4)*3);
  rr(c,-51,-49,106,114,18,'#fff7e7');
  rr(c,-32,-28,70,10,5,'#a9ded0');
  rr(c,-32,-7,59,9,4,'#a9ded0');
  rr(c,-32,13,69,9,4,'#a9ded0');
  blob(c,-7,45,14,9,'#f8aea8');c.restore();
  // Short bent handles with oversized cartoon mitts.
  blob(c,-151,11,48,16,'#7aaea8');blob(c,148,5,46,16,'#7aaea8');
  blob(c,-177,14,27,25,'#ee9d8b');blob(c,178,7,29,25,'#ee9d8b');
  rr(c,-153,-79,310,182,55,'#377f81');
  rr(c,-141,-80,283,144,44,'#73d0bd');
  rr(c,-124,-67,249,49,22,'#b7e9db');
  blob(c,-94,-48,15,9,'#fff9e9');
  // Paper intake and face.
  rr(c,-87,-1,178,25,12,'#29575d');
  rr(c,-80,32,166,46,21,'#fff2d7');
  eye(c,-53,38,expression==='hit'?8:10,expression==='hit');
  eye(c,53,38,expression==='hit'?8:10,expression==='hit');
  mouth(c,0,62,expression==='panic'?1:expression==='hit'?2:3,.9);
  blob(c,95,-43,16,16,expression==='hit'?'#ff927e':'#ffcf66');
  rr(c,-135,85,270,18,9,'#2d6668');
  c.restore();
}
export function drawMemo(c,x,y,t,phase=0){
  c.save();c.translate(x,y);c.rotate(Math.sin(t*6+phase)*.07);
  shadow(c,8,66,74,13);
  rr(c,-82,-68,164,135,27,'#d95662');
  rr(c,-73,-69,148,124,23,'#ff9489');
  rr(c,-60,-49,118,31,14,'#ffead1');
  ink(c,'URGENT',0,-33,19,'#9f424f');
  eye(c,-27,6,8);eye(c,27,6,8);mouth(c,0,35,3,.75);
  c.restore();
}
export function drawStampButton(c,x,y,t,impact=0){
  c.save();c.translate(x,y);
  c.scale(1+Math.sin(t*11)*.035,1+Math.sin(t*11)*.035);
  shadow(c,7,66,190,24);
  rr(c,-187,-62,374,130,54,'#267c72');
  rr(c,-178,-72+impact*13,356,115,46,'#78e6ad');
  rr(c,-155,-59+impact*13,310,81,37,'#9ff3bc');
  ink(c,'CLOCK OUT!',0,-18+impact*13,55,'#24665e');
  c.restore();
}
export function drawCue(c,text,x,y,color=palette.ink,size=26){
  c.save();c.shadowColor='#ffffffa9';c.shadowBlur=9;
  ink(c,text,x,y,size,color);c.restore();
}
export {palette};
