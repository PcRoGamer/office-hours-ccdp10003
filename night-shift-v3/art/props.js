/** Corporate Paper Theatre props: no physics, input or scoring side effects. */
import {palette as C} from './cast.js';
const I=C.outline;
function rr(g,x,y,w,h,r,fill,edge=I,lw=4){
 g.beginPath();if(g.roundRect)g.roundRect(x,y,w,h,r);else g.rect(x,y,w,h);
 g.fillStyle=fill;g.fill();if(edge&&lw){g.strokeStyle=edge;g.lineWidth=lw;g.stroke();}
}
function path(g,pts,color=I,lw=5){g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.strokeStyle=color;g.lineWidth=lw;g.lineCap='round';g.lineJoin='round';g.stroke();}
function polygon(g,pts,fill,edge=I,lw=5){g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=fill;g.fill();if(edge&&lw){g.strokeStyle=edge;g.lineWidth=lw;g.stroke();}}
function dot(g,x,y,r,fill=I){g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fillStyle=fill;g.fill();}
export function drawPaper(g,{x=0,y=0,width=150,height=190,kind='approved',rotation=0,time=0,face=true}={}){
 g.save();g.translate(x,y);g.rotate(rotation);const w=width,h=height;
 g.shadowColor='rgba(20,30,29,.23)';g.shadowBlur=12;g.shadowOffsetY=8;
 polygon(g,[[-w*.5,-h*.5],[w*.34,-h*.5],[w*.5,-h*.35],[w*.5,h*.5],[-w*.5,h*.5]],C.paper);
 g.shadowBlur=0;g.shadowOffsetY=0;
 polygon(g,[[w*.34,-h*.5],[w*.34,-h*.35],[w*.5,-h*.35]],'#c7cab6',I,3);
 const good=kind==='approved',spam=kind==='spam',scam=kind==='scam';
 rr(g,-w*.36,-h*.32,w*.72,h*.15,4,good?C.mint:spam?C.coral:C.amber,null,0);
 g.textAlign='center';g.textBaseline='middle';g.font='900 '+Math.max(12,w*.105)+'px Impact,Arial,sans-serif';
 g.fillStyle=I;g.fillText(good?'APPROVED':spam?'SPAM':scam?'URGENT':'REVIEW',0,-h*.24,w*.7);
 for(let i=0;i<3;i++)rr(g,-w*.32,-h*.025+i*h*.09,w*(i===2?.36:.58),h*.018,2,C.smoke,null,0);
 if(face){dot(g,-w*.14,h*.18,w*.035);dot(g,w*.14,h*.18,w*.035);path(g,[[-w*.11,h*.28],[0,h*.32+Math.sin(time*5)*h*.009],[w*.11,h*.28]],I,Math.max(2,w*.02));}
 if(spam){path(g,[[-w*.35,-h*.34],[w*.35,h*.38]],C.coral,Math.max(8,w*.067));path(g,[[w*.35,-h*.35],[-w*.35,h*.35]],C.coral,Math.max(8,w*.067));}
 if(scam){rr(g,-w*.28,h*.38,w*.56,h*.1,3,C.coral);g.fillStyle=C.paper;g.font='900 '+Math.max(11,w*.09)+'px Arial';g.fillText('!',0,h*.43);}
 g.restore();
}
export function drawStamp(g,{x=0,y=0,scale=1,down=0,rotation=-.12}={}){
 g.save();g.translate(x,y);g.rotate(rotation);g.scale(scale,scale);const squash=Math.max(0,Math.min(1,down));
 rr(g,-52,-9+squash*9,104,27-squash*7,7,C.coral,I,6);
 rr(g,-38,-19+squash*6,76,14,4,C.amber,I,4);
 rr(g,-19,-93+squash*17,38,77-squash*14,10,C.ink,I,6);
 rr(g,-30,-99+squash*17,60,26,12,C.cream,I,6);
 rr(g,-50,17+squash*7,100,13,3,'#b65a48',I,4);g.restore();
}
export function drawMug(g,{x=0,y=0,size=100,tilt=0,time=0,spill=false}={}){
 g.save();g.translate(x,y);g.rotate(tilt);g.scale(size/120,size/120);
 g.beginPath();g.ellipse(0,5,56,9,0,0,Math.PI*2);g.fillStyle='rgba(15,32,35,.15)';g.fill();
 rr(g,-47,-110,87,111,14,C.paper,I,7);
 g.beginPath();g.ellipse(0,-110,43,12,0,0,Math.PI*2);g.fillStyle='#9b634b';g.fill();g.strokeStyle=I;g.lineWidth=5;g.stroke();
 g.beginPath();g.arc(45,-58,32,-1.35,1.35);g.strokeStyle=I;g.lineWidth=13;g.stroke();g.strokeStyle=C.cream;g.lineWidth=6;g.stroke();
 rr(g,-29,-76,57,43,6,C.mint,null,0);dot(g,-11,-52,6);dot(g,12,-52,6);path(g,[[-12,-42],[0,-36],[13,-42]],I,4);
 for(let i=0;i<2;i++)path(g,[[-22+i*32,-128-Math.sin(time*3+i)*5],[-28+i*33,-149-Math.sin(time*3+i)*7]],'#dcc5a3',3);
 if(spill)for(let i=0;i<3;i++)dot(g,-48+i*40,8+Math.sin(i+time)*5,8,C.coral);g.restore();
}
export function drawFolder(g,{x=0,y=0,width=180,height=112,rotation=0,color=C.amber,label='STAFF'}={}){
 g.save();g.translate(x,y);g.rotate(rotation);
 rr(g,-width*.5,-height*.43,width*.54,height*.24,7,'#e6c385',I,4);
 rr(g,-width*.5,-height*.31,width,height*.82,8,color,I,6);
 rr(g,-width*.37,-height*.12,width*.73,height*.31,5,C.paper,null,0);
 g.font='900 '+Math.max(12,width*.105)+'px Impact,Arial,sans-serif';
 g.fillStyle=I;g.textAlign='center';g.textBaseline='middle';g.fillText(label,0,-height*.12+height*.155,width*.65);g.restore();
}
export function drawLicence(g,{x=0,y=0,size=140,target='MIRA',active=true,rotation=0}={}){
 g.save();g.translate(x,y);g.rotate(rotation);g.scale(size/150,size/150);
 rr(g,-75,-64,150,127,16,active?C.mint:'#acaaa4',I,7);rr(g,-63,-53,126,30,8,I,null,0);
 g.fillStyle=C.paper;g.font='bold 14px Arial';g.textAlign='center';g.textBaseline='middle';g.fillText('SOFTWARE ACCESS',0,-38);
 rr(g,-55,-11,110,49,8,C.paper,I,3);g.fillStyle=C.ink;g.font='900 40px Impact,Arial';g.fillText('$40',0,14);
 g.font='bold 16px Arial';g.fillText(target,0,53);g.restore();
}
export function drawMachinePart(g,{x=0,y=0,scale=1,phase=0,time=0}={}){
 g.save();g.translate(x,y);g.scale(scale,scale);rr(g,-81,-74,162,148,16,C.ink,I,6);rr(g,-67,-62,134,116,10,phase?C.coral:C.blue,I,5);
 for(let a=0;a<Math.PI*2;a+=Math.PI/4){const x=Math.cos(a+time*.2)*30,y=Math.sin(a+time*.2)*30;rr(g,x-9,y-9,18,18,4,C.amber,I,3);}
 g.beginPath();g.arc(0,0,25,0,Math.PI*2);g.fillStyle=C.paper;g.fill();g.lineWidth=7;g.strokeStyle=I;g.stroke();
 path(g,[[-18,0],[18,0]],I,5);rr(g,-54,60,109,23,6,C.amber,I,3);g.restore();
}
export function drawBurst(g,{x=0,y=0,size=90,progress=0,color=C.amber,particles=12}={}){
 const p=Math.max(0,Math.min(1,progress));if(p>=1)return;
 g.save();g.translate(x,y);g.globalAlpha*=1-p;
 for(let i=0;i<particles;i++){const a=i/particles*Math.PI*2,r=(.15+p*.9)*size;
  g.save();g.translate(Math.cos(a)*r,Math.sin(a)*r);g.rotate(a+p*3);
  polygon(g,[[-5,-9],[5,-7],[5,9],[-5,7]],i%3?color:C.mint,null,0);g.restore();}
 g.restore();
}
/** World-filling office set. For independent art preview; the RENDER lane owns main camera. */
export function drawOfficeBackdrop(g,w,h,{department='intake',time=0,theme='cream'}={}){
 g.save();g.fillStyle=theme==='rust'?C.coral:C.cream;g.fillRect(0,0,w,h);
 const floor=h*.9;g.fillStyle=theme==='rust'?'#aa4437':'#d7d5bf';
 polygon(g,[[0,floor],[w,floor-h*.07],[w,h],[0,h]],g.fillStyle,null,0);
 for(let x=-160;x<w+160;x+=140)path(g,[[x,floor],[x-95,h]],'rgba(23,54,58,.12)',2);
 for(let x=54;x<w+150;x+=230){
  path(g,[[x,0],[x,h*.09]],I,3);
  polygon(g,[[x-35,h*.09],[x+35,h*.09],[x+57,h*.15],[x-57,h*.15]],C.amber,I,4);
  polygon(g,[[x-57,h*.15],[x+57,h*.15],[x+140,h*.35],[x-140,h*.35]],'rgba(247,210,121,.09)',null,0);
 }
 if(department==='services'||department==='boss'){rr(g,w*.14,h*.37,w*.72,h*.055,7,C.ink,I,3);rr(g,w*.14,h*.37+10,w*.72,10,2,C.amber,null,0);}
 g.restore();
}