// Night Shift v3 / Public Relations / original Canvas2D theatre art.
// World-space drawing only: no canvas sizing, DOM, audio unlock or HUD ownership.
export const C = Object.freeze({ink:'#162e33',shadow:'#091c22',cream:'#fff4d9',paper:'#f5e7c8',mint:'#71e3c4',gold:'#ffbc50',red:'#f16d66',blue:'#74c1da',slate:'#46666a',white:'#ffffff',plum:'#735f92'});
const TAU=Math.PI*2;
export function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
export function rr(ctx,x,y,w,h,r=16,fill=C.cream,stroke=C.ink,line=5){
  ctx.beginPath();ctx.roundRect(x,y,w,h,Math.max(0,Math.min(r,Math.abs(w)/2,Math.abs(h)/2)));ctx.fillStyle=fill;ctx.fill();
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=line;ctx.stroke();}
}
export function tx(ctx,str,x,y,size=20,col=C.ink,align='center',weight=900){
  ctx.fillStyle=col;ctx.font=`${weight} ${size}px 'Arial Narrow','Liberation Sans Narrow',Impact,system-ui,sans-serif`;
  ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(String(str),x,y);
}
export function line(ctx,x,y,X,Y,col=C.ink,width=4){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(X,Y);ctx.strokeStyle=col;ctx.lineWidth=width;ctx.stroke();}
export function circle(ctx,x,y,r,fill=C.paper,stroke=C.ink,width=4){ctx.beginPath();ctx.arc(x,y,Math.max(0,r),0,TAU);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}}
export function layout(v){
  const W=v?.worldWidth||1200,H=v?.worldHeight||760;
  const width=Math.min(1060,Math.max(320,W-26)),left=(W-width)/2;
  const portrait=W<820,scale=clamp(width/940,.63,1);
  return {W,H,width,left,cx:W/2,portrait,scale,boardY:portrait?160:146,usableH:H-160};
}
export function sceneBackdrop(ctx,v,clock,id,title,subtitle,{reduced=false}={}){
  const l=layout(v),{W,H,cx,portrait}=l;
  const gr=ctx.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#264951');gr.addColorStop(.55,'#18383f');gr.addColorStop(1,'#0b242c');ctx.fillStyle=gr;ctx.fillRect(0,0,W,H);
  // Theatre ribs with intentionally continuous off-camera architecture for ultrawide.
  for(let x=-80;x<W+100;x+=150){ctx.fillStyle='rgba(6,24,29,.23)';ctx.fillRect(x+85,0,26,H);line(ctx,x+80,0,x+80,H,'rgba(255,244,217,.07)',2);}
  const beam=ctx.createRadialGradient(cx,140,55,cx,300,Math.max(W*.65,H*.8));beam.addColorStop(0,'rgba(253,212,128,.2)');beam.addColorStop(1,'rgba(253,212,128,0)');ctx.fillStyle=beam;ctx.fillRect(0,0,W,H);
  // Curtains in corners, no rectangle or letterbox around the world.
  for(const side of [-1,1]){ctx.save();ctx.translate(side<0?0:W,0);ctx.scale(side<0?1:-1,1);ctx.fillStyle='#102b33';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.min(115,W*.16),0);ctx.bezierCurveTo(165,165,50,280,0,343);ctx.closePath();ctx.fill();ctx.strokeStyle='#0a1a20';ctx.lineWidth=8;ctx.stroke();for(let i=0;i<3;i++){line(ctx,18+i*24,0,8+i*10,245,'#365963',3)}ctx.restore();}
  // Ceiling light housing / projector beam.
  const lampX=portrait?cx:Math.max(68,cx-l.width*.38);
  if(!portrait){
    line(ctx,lampX,-30,lampX,99,'#091b20',9);circle(ctx,lampX,99,28,C.gold,C.ink,6);
    ctx.fillStyle='rgba(255,207,109,.065)';ctx.beginPath();ctx.moveTo(lampX-28,112);ctx.lineTo(lampX-260,H);ctx.lineTo(lampX+260,H);ctx.lineTo(lampX+28,112);ctx.fill();
    const sway=reduced?0:Math.sin(clock*2.1)*1.7;
    rr(ctx,lampX-39+sway,104,78,17,8,C.ink,C.gold,3);
  }
  const fs=portrait?25:37;tx(ctx,'PUBLIC RELATIONS',cx,57,fs,C.cream);tx(ctx,'ASTER CORPORATION  //  REPUTATION MAINTENANCE',cx,87,portrait?10:13,C.mint);
  tx(ctx,`${id}  /  ${title}`,cx,125,portrait?17:22,C.gold);
  // Desk silhouette gives continuous tangible environment, not a UI sheet.
  ctx.fillStyle=C.shadow;ctx.fillRect(0,H-64,W,64);ctx.fillStyle='#6b5151';ctx.fillRect(0,H-77,W,16);
  ctx.fillStyle='#cc9a68';ctx.fillRect(0,H-81,W,9);ctx.fillStyle='rgba(255,255,255,.17)';ctx.fillRect(0,H-81,W,3);
  if(!portrait){drawFinch(ctx,Math.min(W-100,cx+l.width*.49),H-146,.79,clock,0,reduced);}
  return l;
}
export function drawFinch(ctx,x,y,s,t,expression=0,reduced=false){
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.rotate(reduced?0:Math.sin(t*2)*.025);
  // Body with dark blazer and flapping pink tie.
  rr(ctx,-39,-5,78,108,24,C.plum,C.ink,6);ctx.fillStyle=C.cream;ctx.beginPath();ctx.moveTo(-10,5);ctx.lineTo(0,53);ctx.lineTo(14,5);ctx.fill();
  ctx.fillStyle=C.red;ctx.beginPath();ctx.moveTo(0,11);ctx.lineTo(-9,42);ctx.lineTo(4,51);ctx.lineTo(13,41);ctx.closePath();ctx.fill();
  // Finch is a boss-like bird manager, not a static emoji.
  ctx.save();ctx.translate(0,-45);ctx.rotate(expression===2?-.12:0);
  ctx.fillStyle='#ebf2e0';ctx.beginPath();ctx.ellipse(0,-20,60,57,0,0,TAU);ctx.fill();ctx.strokeStyle=C.ink;ctx.lineWidth=6;ctx.stroke();
  ctx.fillStyle=C.ink;ctx.beginPath();ctx.moveTo(-25,-73);ctx.lineTo(-12,-91);ctx.lineTo(-1,-70);ctx.lineTo(11,-94);ctx.lineTo(24,-72);ctx.fill();
  const eyeY=expression===2?-22:-30;circle(ctx,-20,eyeY,10,C.cream,C.ink,3);circle(ctx,20,eyeY,10,C.cream,C.ink,3);
  const look=expression===1?3:expression===2?-1:0;circle(ctx,-20+look,eyeY+3,4,C.ink,null);circle(ctx,20+look,eyeY+3,4,C.ink,null);
  ctx.fillStyle=C.gold;ctx.beginPath();ctx.moveTo(-8,-5);ctx.lineTo(23,2);ctx.lineTo(-7,15);ctx.closePath();ctx.fill();ctx.stroke();
  if(expression===2)tx(ctx,'!!',0,-115,25,C.red);ctx.restore();ctx.restore();
}
export function theatrePanel(ctx,x,y,w,h,fill=C.paper){
  rr(ctx,x+7,y+9,w,h,18,'#091a1f',null,0);rr(ctx,x,y,w,h,18,fill,C.ink,6);
  ctx.fillStyle='rgba(255,255,255,.38)';ctx.fillRect(x+17,y+9,Math.max(0,w-34),3);
  for(const i of [0,1]){circle(ctx,x+24+i*(w-48),y+23,4,C.gold,C.ink,2);}
}
export function button(ctx,label,x,y,w,h,{disabled=false,fill=C.gold,small=false}={}){
  rr(ctx,x+2,y+5,w,h,14,'#203238',null);rr(ctx,x,y,w,h,14,disabled?'#a7a395':fill,C.ink,4);tx(ctx,label,x+w/2,y+h/2,small?15:21,C.ink);
}
export function sticker(ctx,str,x,y,{col=C.red,angle=-.12,size=15}={}){ctx.save();ctx.translate(x,y);ctx.rotate(angle);rr(ctx,-67,-19,134,38,7,col,C.ink,3);tx(ctx,str,0,0,size,C.ink);ctx.restore();}
export function stars(ctx,x,y,phase,size=15,reduced=false){if(reduced)return;ctx.save();ctx.translate(x,y);ctx.rotate(phase);for(let a=0;a<4;a++){ctx.rotate(Math.PI/2);line(ctx,-size,0,size,0,C.gold,3);}ctx.restore();}
export function pointIn(p,r){return p&&p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h;}