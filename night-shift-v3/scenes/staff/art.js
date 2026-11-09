// NIGHT SHIFT v3 · Staff Support stagecraft. Original Canvas2D art, no external assets.
export const PALETTE = Object.freeze({
  ink:'#132b32', deep:'#10262a', teal:'#176b6c', mint:'#6bf0c0',
  paper:'#fff0d4', gold:'#f8be5d', coral:'#f17657', pale:'#c6e8d3',
  lavender:'#b9a6ea', shadow:'#092026'
});
const PI = Math.PI;
export function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
export function round(c,x,y,w,h,r=12,fill=null,stroke=null,line=3){
  c.beginPath();c.roundRect(x,y,w,h,clamp(r,0,Math.min(w,h)/2));
  if(fill){c.fillStyle=fill;c.fill();}
  if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.stroke();}
}
export function type(c,txt,x,y,size=20,color=PALETTE.ink,align='left',heavy=true){
  c.font=(heavy?'900 ':'700 ')+size+'px "Trebuchet MS","Arial Narrow",Arial,sans-serif';
  c.textBaseline='middle';c.textAlign=align;c.fillStyle=color;c.fillText(String(txt),x,y);
}
function squiggle(c,x,y,r,t,fill){
 c.save();c.translate(x,y);c.rotate(t);
 c.beginPath();c.moveTo(-r,0);c.bezierCurveTo(-r,-r,r,-r,r,0);
 c.bezierCurveTo(r,r,-r,r,-r,0);c.fillStyle=fill;c.fill();c.restore();
}
function spark(c,x,y,angle,r,color){
 c.save();c.translate(x,y);c.rotate(angle);c.strokeStyle=color;c.lineWidth=4;c.lineCap='round';
 c.beginPath();c.moveTo(0,-r);c.lineTo(0,r);c.moveTo(-r,0);c.lineTo(r,0);c.stroke();c.restore();
}
export function backdrop(c,{w,h,wide},id,t=0){
 // The paper-theatre backdrop fills the physical viewport. Never a letterboxed rectangle.
 const g=c.createLinearGradient(0,0,0,h);
 g.addColorStop(0,'#0b2a36');g.addColorStop(.58,'#1b5159');g.addColorStop(1,'#20333a');
 c.fillStyle=g;c.fillRect(0,0,w,h);
 const margin=Math.max(0,(w-1300)/2);
 // Outside the play area the world continues with architectural panels and glowing windows.
 for(let x=margin-180;x<w+250;x+=240){
  const y=95+19*Math.sin(x*.019);
  c.fillStyle='#0e3a42';c.fillRect(x+15,y,174,218);
  c.fillStyle='#447a7b';c.fillRect(x+29,y+14,146,187);
  const night=c.createLinearGradient(0,y,0,y+187);
  night.addColorStop(0,'#173954');night.addColorStop(1,'#477e78');
  c.fillStyle=night;c.fillRect(x+32,y+17,140,181);
  for(let b=0;b<9;b++){
    let bx=x+32+(b*31%141),bh=35+(b*37%89);
    c.fillStyle=b%2?'#143248':'#203e52';c.fillRect(bx,y+195-bh,29,bh);
    c.fillStyle='#ffd47a77';
    for(let k=0;k<3;k++)c.fillRect(bx+5+(k%2)*12,y+194-bh+9+k*17,5,6);
  }
  c.strokeStyle='#12313b';c.lineWidth=7;
  c.beginPath();c.moveTo(x+102,y+17);c.lineTo(x+102,y+199);c.stroke();
 }
 // Hanging office fluorescents and rails
 c.fillStyle='#0b242b';c.fillRect(0,52,w,17);
 for(let x=88;x<w+100;x+=340){
  c.strokeStyle='#607e77';c.lineWidth=5;c.beginPath();c.moveTo(x,0);c.lineTo(x,85);c.stroke();
  round(c,x-95,80,190,21,8,'#ffe5a7','#0b2b31',4);
  const lg=c.createRadialGradient(x,102,8,x,102,145);
  lg.addColorStop(0,'#f6d99630');lg.addColorStop(1,'#f6d99600');
  c.fillStyle=lg;c.fillRect(x-150,96,300,190);
 }
 // Cluttered office theatre wings and floor, with no black margins.
 c.fillStyle='#122f36';c.fillRect(0,h*.73,w,h*.27);
 c.fillStyle='#447d75';c.fillRect(0,h*.73,w,11);
 for(let x=0;x<w;x+=85){
  c.strokeStyle='#6fa59624';c.lineWidth=2;c.beginPath();
  c.moveTo(x,h*.74);c.lineTo(x-85,h);c.stroke();
 }
 for(let y=h*.79;y<h;y+=34){c.fillStyle='#7cb6a014';c.fillRect(0,y,w,2);}
 // Neon corporate pennants, coherent with HD's theatrical typography.
 for(let i=0;i<7;i++){
  let x=(i*229+48)%Math.max(1,w+100),y=139+((i*43)%70);
  c.save();c.translate(x,y);c.rotate(Math.sin(t*.5+i)*.018);
  c.fillStyle=['#f6d47c','#c0e4c6','#f2a082'][i%3];
  c.beginPath();c.moveTo(-12,-12);c.lineTo(12,-12);c.lineTo(0,13);c.fill();c.restore();
 }
 // Foreground stage spotlight and desk silhouette
 const spot=c.createRadialGradient(w/2,h*.52,30,w/2,h*.52,Math.max(400,w*.52));
 spot.addColorStop(0,'#a7e0b81b');spot.addColorStop(1,'#091e2300');
 c.fillStyle=spot;c.fillRect(0,0,w,h);
 c.fillStyle='#08232a';c.fillRect(0,h-30,w,30);
 for(let x=0;x<w;x+=32){c.fillStyle=x%64?'#395653':'#bd9560';c.fillRect(x,h-23,20,3);}
 // Cinematic office wings: ultrawide reveals more *world*, never blank letterbox.
 const wing=Math.max(0,(w-1010)/2);
 if(wing>138){
  for(const side of [-1,1]){
   const wx=w/2+side*(505+Math.min(155,wing*.50));
   c.save();c.translate(wx,0);c.rotate(side*.012);
   shadow(c,0,560,99,.35);
   round(c,-78,335,156,210,15,'#153a48','#6b9993',6);
   round(c,-65,347,131,27,5,'#eec986','#19353b',3);
   type(c,side<0?'PERSONNEL':'KPI MACHINE',0,361,15,PALETTE.ink,'center');
   round(c,-56,387,110,83,11,'#0b2934','#a3c7ae',4);
   round(c,-44,396,88,65,7,'#346c68');
   for(let k=0;k<4;k++){
    c.fillStyle=k%2?'#f2c16c':'#75e5b5';
    c.fillRect(-32+k*17,446-(k*9+16+Math.sin(t*2+k)*10),11,k*9+16+Math.sin(t*2+k)*10);
   }
   round(c,-56,481,112,23,5,'#e9d8ad','#142c33',3);
   c.fillStyle='#fff1d1';
   for(let k=0;k<3;k++)c.fillRect(-48+k*27,489,19,5);
   round(c,-65,516,130,22,6,'#1a2f37');
   c.fillStyle='#e9b85c';c.fillRect(-60,524,120,4);
   c.restore();
   for(let p=0;p<3;p++){
    const px=wx+side*(-70+p*23),py=565+p*8;
    round(c,px-26,py,65,18,3,p%2?'#f7dbab':'#d3e8ce','#12333b',2);
   }
  }
 }
 // Scene-specific diegetic company sign, never the game HUD.
 const s= id==='T1'?'SAFEWAY  ↗':id==='T2'?'SAFETY FIRST*':id==='T3'?'TIME IS MONEY':"EMPLOYEE ACCESS";
 round(c,w/2-168,170,336,43,9,'#ead9ab',PALETTE.ink,4);
 type(c,s,w/2,193,24,PALETTE.ink,'center');
 type(c,'* TERMS MAY CHANGE WITHOUT NOTICE',w/2,h-43,11,'#a6bdb2','center');
}
export function shadow(c,x,y,rx=60,alpha=.22){
 c.beginPath();c.ellipse(x,y,rx,13,0,0,PI*2);c.fillStyle='rgba(2,21,28,'+alpha+')';c.fill();
}
export function character(c,x,y,scale=1,name='MIRA',mood='idle',t=0,{tool=false,ghost=false}={}){
 // Distinct silhouette and emotion, articulated arms/head and eye shapes.
 c.save();c.translate(x,y);c.scale(scale,scale);
 if(ghost)c.globalAlpha=.32;
 const bob=Math.sin(t*4+(name==='JULES'?1:0))*2.2;
 shadow(c,0,4,58);
 c.translate(0,-bob);
 const mira=name==='MIRA',jules=name==='JULES',finch=name==='FINCH';
 const main=mira?'#48cba9':jules?'#ba9ce1':finch?'#dc7965':'#ffc167';
 const dark=mira?'#1b7773':jules?'#6857a0':finch?'#793f4a':'#8d663c';
 const hair=mira?'#1b333c':jules?'#213b49':finch?'#182f43':'#7d4d3b';
 // shoes and body
 round(c,-42,-19,34,22,9,'#19363d','#10242c',3);
 round(c,13,-19,34,22,9,'#19363d','#10242c',3);
 c.strokeStyle=dark;c.lineWidth=11;c.lineCap='round';
 c.beginPath();c.moveTo(-25,-62);c.lineTo(-25,-20);c.moveTo(25,-62);c.lineTo(26,-20);c.stroke();
 round(c,-49,-128,98,84,24,main,PALETTE.ink,5);
 round(c,-36,-120,71,40,15,'#ffffff27');
 if(mira){round(c,-34,-78,68,19,6,'#e8fff4');type(c,'IT',0,-68,15,PALETTE.deep,'center');}
 if(jules){c.fillStyle='#f5efbc';c.beginPath();c.moveTo(-10,-128);c.lineTo(17,-128);c.lineTo(6,-62);c.closePath();c.fill();}
 if(finch){c.fillStyle='#ffde74';c.beginPath();c.moveTo(-8,-128);c.lineTo(10,-128);c.lineTo(3,-71);c.closePath();c.fill();}
 // expressive arcing arms and glove
 const wave=Math.sin(t*5)*10;
 c.strokeStyle=main;c.lineWidth=21;
 c.beginPath();c.moveTo(-45,-109);c.quadraticCurveTo(-79,-92,-70,mood==='yay'?-165:-66+wave*.25);
 c.moveTo(45,-109);c.quadraticCurveTo(80,-81,67,mood==='panic'?-164:mood==='yay'?-160:-67-wave*.3);c.stroke();
 c.fillStyle=PALETTE.paper;
 for(const p of [[-70,mood==='yay'?-165:-66+wave*.25],[67,mood==='panic'?-164:mood==='yay'?-160:-67-wave*.3]]){
  c.beginPath();c.arc(p[0],p[1],12,0,2*PI);c.fill();
 }
 // big face and unique hair profile
 if(mira){c.fillStyle=hair;c.beginPath();c.arc(37,-201,24,0,PI*2);c.fill();}
 if(jules){c.fillStyle=hair;c.beginPath();c.ellipse(0,-210,57,41,0,PI,2*PI);c.fill();}
 if(finch){c.fillStyle=hair;c.beginPath();c.moveTo(-52,-210);c.lineTo(-33,-251);c.lineTo(9,-232);c.lineTo(42,-250);c.lineTo(57,-214);c.fill();}
 round(c,-52,-225,104,106,40,'#ffd2a2',PALETTE.ink,5);
 // brows, eyes, mouth respond to events and time
 c.strokeStyle=PALETTE.ink;c.lineWidth=5;c.lineCap='round';
 const panic=mood==='panic'||mood==='worry',yay=mood==='yay'||mood==='saved';
 for(let side of [-1,1]){
   const ex=side*22;
   c.beginPath();c.moveTo(ex-12,-193-(panic?8:2));c.lineTo(ex+10,-195+(yay?-3:panic?8:0));c.stroke();
   c.beginPath();c.ellipse(ex,-175,7,panic?11:yay?4:8,0,0,2*PI);c.fillStyle=PALETTE.ink;c.fill();
   if(mira){c.strokeStyle='#fffef0';c.lineWidth=3;c.beginPath();c.arc(ex,-176,16,0,PI*2);c.stroke();}
 }
 c.strokeStyle='#a9534c';c.lineWidth=5;c.beginPath();
 if(panic)c.ellipse(0,-144,10,14,0,0,2*PI);
 else if(yay)c.arc(0,-151,19,0,PI,false);
 else {c.moveTo(-10,-148);c.quadraticCurveTo(0,-143,10,-149);}
 c.stroke();
 if(mira){c.fillStyle=hair;c.beginPath();c.ellipse(-36,-232,18,21,.2,PI,2*PI);c.fill();}
 if(jules){round(c,-53,-237,108,24,11,'#314b65');round(c,-15,-254,30,30,8,'#f4c96c');}
 if(tool){
  round(c,55,-154,46,29,6,'#a8ffd5',PALETTE.ink,3);
  type(c,'✦',77,-139,21,'#218e77','center');
 }
 // name plate diegetic not sole means of character identity
 round(c,-48,-45,96,29,9,'#fff4d7',PALETTE.ink,3);
 type(c,name,-1,-30,15,PALETTE.ink,'center');
 c.restore();
}
export function crate(c,x,y,size=85,rot=0,open=false){
 c.save();c.translate(x,y);c.rotate(rot);
 shadow(c,3,size*.60,size*.55);
 round(c,-size/2,-size/2,size,size,8,open?'#e5d1a2':'#dba969',PALETTE.ink,5);
 c.strokeStyle='#a26d47';c.lineWidth=4;c.strokeRect(-size*.35,-size*.35,size*.7,size*.7);
 c.strokeStyle='#ffedc1';c.lineWidth=8;c.beginPath();
 c.moveTo(-size*.47,-size*.17);c.lineTo(size*.43,-size*.17);
 c.moveTo(0,-size*.47);c.lineTo(0,size*.45);c.stroke();
 round(c,-size*.31,-size*.03,size*.62,size*.27,3,'#fff3d6');
 type(c,open?'CLEARED':'FRAGILE',0,size*.11,Math.max(11,size*.15),PALETTE.ink,'center');
 c.restore();
}
export function effect(c,fx){
 c.save();
 for(const p of fx){
  const a=clamp(p.life/p.max,0,1);
  c.globalAlpha=a;c.fillStyle=p.color;
  c.save();c.translate(p.x,p.y);c.rotate(p.r);
  c.fillRect(-p.sz/2,-p.sz/2,p.sz,p.sz);c.restore();
 }
 c.restore();
}
export function impactText(c,message,x,y,t,color='#fff3d4'){
 if(t<=0)return;
 c.save();c.globalAlpha=clamp(t,0,1);
 round(c,x-174,y-27,348,54,10,'#112a33',PALETTE.gold,4);
 type(c,message,x,y,22,color,'center');c.restore();
}
export function starburst(c,x,y,t,color='#f9c265'){
 c.save();c.globalAlpha=clamp(1-t,0,1);
 for(let i=0;i<9;i++)spark(c,x+Math.cos(i*.7+t*2)*70,y+Math.sin(i*.7+t*2)*70,i*.7,5,color);
 c.restore();
}