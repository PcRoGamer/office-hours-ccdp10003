/**
 * OFFICE ATTACK · original illustrated cartoon art renderer.
 * 100% drawn in Canvas 2D, no image atlas, no mismatched 3D icons.
 * Silhouettes use warm filled curves, inner shading and reaction poses.
 */
export const HD=Object.freeze({complete:true,naturalWidth:4});
export const COLORS=Object.freeze({
 ink:'#264d4b',cream:'#fff8e9',mint:'#a4e7c5',coral:'#f36e63',
 gold:'#ffd272',sky:'#a9dce3',paper:'#fffaea',shadow:'#966f6250'
});
const P=COLORS;
const TAU=Math.PI*2;
const fade=(c,x,y,w,h,a,b)=>{
 const g=c.createLinearGradient(x,y,x+w*.16,y+h);
 g.addColorStop(0,a);g.addColorStop(1,b);return g;
};
function smooth(c,x,y,w,h,r,fill,shadow=false){
 c.save();
 if(shadow){c.shadowColor='#6d625438';c.shadowBlur=15;c.shadowOffsetY=8;}
 c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();c.restore();
}
function egg(c,x,y,rx,ry,color,rot=0){
 c.save();c.translate(x,y);c.rotate(rot);c.fillStyle=color;
 c.beginPath();c.ellipse(0,0,rx,ry,0,0,TAU);c.fill();c.restore();
}
function arm(c,x1,y1,x2,y2,width,color){
 c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.beginPath();
 c.moveTo(x1,y1);c.quadraticCurveTo((x1+x2)*.58,(y1+y2)*.55-3,x2,y2);c.stroke();
}
function bodyPath(c,w,h){
 c.beginPath();c.moveTo(-.39*w,-.32*h);
 c.bezierCurveTo(-.5*w,-.62*h,.32*w,-.59*h,.39*w,-.31*h);
 c.bezierCurveTo(.58*w,-.09*h,.52*w,.39*h,.26*w,.46*h);
 c.bezierCurveTo(-.05*w,.57*h,-.42*w,.47*h,-.46*w,.19*h);
 c.bezierCurveTo(-.53*w,-.02*h,-.43*w,-.22*h,-.39*w,-.32*h);
 c.closePath();
}
function drop(c,scale=1){
 c.save();c.scale(scale,scale);c.fillStyle='#25545822';
 c.beginPath();c.ellipse(0,0,70,13,0,0,TAU);c.fill();c.restore();
}
function worker(c,frame=0,kind='worker'){
 const f=frame%4,manager=kind==='manager';
 const pink=manager?'#f1a58b':'#f7b97c';
 const shade=manager?'#df8f79':'#e99d68';
 const left=f===1?-8:f===3?7:-2;
 const bounce=(f===0?-2:f===2?3:0);
 c.save();c.translate(0,bounce);c.rotate((f===1?-.06:f===3?.065:0));
 // Little legs, shoes, and wildly gesticulating mitten hands.
 arm(c,-27,52,-25+(f===1?7:-6),72,13,shade);
 arm(c,27,52,25+(f===3?-7:6),72,13,shade);
 egg(c,-29,73,16,7,manager?'#4c6662':'#db7f5d',-.07);
 egg(c,30,73,16,7,manager?'#4c6662':'#db7f5d',.07);
 arm(c,-42,-2,-66,-16+left,19,pink);
 arm(c,42,1,65,manager?-12+left:12+left,19,pink);
 egg(c,-68,-18+left,13,12,pink);
 egg(c,67,12+left,13,12,pink);
 c.save();c.shadowColor='#754e412b';c.shadowBlur=15;c.shadowOffsetY=8;
 bodyPath(c,110,148);
 c.fillStyle=fade(c,0,-75,70,155,pink,shade);c.fill();
 c.restore();
 // Left inner rim / little light source, no hard outline.
 c.save();c.globalAlpha=.15;c.fillStyle='#fff9df';c.beginPath();
 c.ellipse(-25,-36,20,42,-.38,0,TAU);c.fill();c.restore();
 // Belly badge and office tie.
 egg(c,-20,30,16,9,manager?'#ffe0a6':'#fff1d0');
 c.fillStyle=manager?'#438f8d':'#e26c5f';
 c.beginPath();c.moveTo(9,29);c.lineTo(22,29);c.lineTo(19,42);c.lineTo(16,59);c.lineTo(5,41);c.closePath();c.fill();
 smooth(c,-32,25,22,13,5,'#f0dfac');
 // Facial eyes adapt to the frame for WarioWare-ish blink/squash.
 const eyeY=-13;
 const eyes=[-19,21];
 for(const i of eyes){
  egg(c,i,eyeY,5.7,f===2?2.2:9.5,'#2b514c');
  if(f!==2)egg(c,i-1.7,eyeY-2.7,2.1,3.1,'#fffaf0');
 }
 // Cheek patches
 egg(c,-37,5,11,6,'#e89179');egg(c,39,5,10,6,'#e89179');
 if(manager){
  // The manager has an aggressive blue-black combover and slanted brows.
  c.fillStyle='#3b6360';c.beginPath();
  c.moveTo(-45,-40);c.quadraticCurveTo(-43,-75,2,-71);
  c.quadraticCurveTo(34,-67,39,-45);c.quadraticCurveTo(4,-56,-10,-47);
  c.quadraticCurveTo(-28,-40,-45,-40);c.fill();
  arm(c,-28,-30,-11,-32,5,'#42625e');
  arm(c,11,-31,32,-37,5,'#42625e');
 }
 if(f===3) {
  // Alarmed round-mouth reaction.
  egg(c,3,19,9,13,'#914f51');egg(c,3,27,5,3,'#f9c4b4');
 }else{
  c.strokeStyle='#91514f';c.lineWidth=5;c.lineCap='round';
  c.beginPath();c.moveTo(-5,18);c.quadraticCurveTo(7,29,19,17);c.stroke();
 }
 if(!manager){
  // Crooked office paper hat, distinctively friendly from the front.
  c.save();c.translate(-7,-68);c.rotate(-.12);
  c.fillStyle='#faf1d1';c.beginPath();
  c.moveTo(-30,0);c.lineTo(-17,-33);c.lineTo(12,-26);c.lineTo(30,2);c.closePath();c.fill();
  smooth(c,-26,-3,56,8,4,'#e8d5b5');c.restore();
 }else{
  // An ever-present corporate ID badge.
  smooth(c,18,31,31,19,5,'#e4f3e8');
  smooth(c,23,36,10,9,4,'#6c9a97');
 }
 c.restore();
}
function printer(c,frame=0){
 const j=Math.sin(frame*2)*3;
 c.save();c.translate(0,j);drop(c,1.12);
 // White paper is visibly moving OUT of the machine.
 c.save();c.translate(0,-98+(frame%4)*4);c.rotate(Math.sin(frame*1.1)*.035);
 smooth(c,-73,-55,146,106,14,'#fff9e9',true);
 for(let z=0;z<3;z++)smooth(c,-53,-28+z*22,106-(z%2)*30,7,4,'#c8ddd3');
 smooth(c,19,-7,38,25,9,'#f69c7c');c.restore();
 // Little caster legs.
 smooth(c,-122,90,53,38,17,'#599b9c');
 smooth(c,69,90,53,38,17,'#599b9c');
 // Lower printer paper tray.
 smooth(c,-171,-53,342,165,41,fade(c,0,-53,210,165,'#94cbb9','#5ca69f'),true);
 smooth(c,-152,-41,304,34,16,'#376b6b');
 smooth(c,-110,-24,220,37,13,'#fff5da');
 smooth(c,-136,45,272,55,19,'#c1dfd2');
 // Printer's front display FACE: simple, expressive, chunky.
 smooth(c,-90,17,180,63,19,'#355d66');
 egg(c,-38,45,9,12,'#e7f1d9');egg(c,37,45,9,12,'#e7f1d9');
 if(frame===3)egg(c,0,62,13,9,'#ffcd6c');
 else smooth(c,-19,65,39,8,4,'#ffcd6c');
 // Shoulder light.
 egg(c,137,-23,13,13,frame%2?'#fa7c6d':'#ffd269');
 c.save();c.globalAlpha=.24;egg(c,-96,-12,36,22,'#ffffff');c.restore();
 c.restore();
}
function file(c,w,h,kind='good',lines=true){
 const good=kind==='good';
 const accent=good?'#5dd28d':'#ff657b';
 const rim=good?'#3fb573':'#dc405a';
 // High-contrast approved / rejected document: the decision still reads at card scale.
 c.save();c.shadowColor='#6e62513b';c.shadowBlur=18;c.shadowOffsetY=10;
 smooth(c,-w*.48,-h*.48,w*.96,h*.96,Math.min(21,w*.13),fade(c,0,-h*.5,0,h,'#fffef3','#f2e3ca'));
 c.restore();
 c.fillStyle=good?'#e7eaf7':'#f5d3da';c.beginPath();
 c.moveTo(w*.18,-h*.47);c.lineTo(w*.48,-h*.15);c.lineTo(w*.48,-h*.47);c.closePath();c.fill();
 smooth(c,-w*.36,-h*.31,w*.43,h*.08,h*.025,good?'#7899f4':'#ff995a');
 if(lines){
  for(let i=0;i<3;i++)smooth(c,-w*.33,-h*.14+i*h*.13,w*(i===1?.48:.61),h*.04,3,good?'#cdd8ef':'#f1c7d0');
 }
 // One dominant verification badge makes the valid/fake distinction unmissable.
 egg(c,w*.20,h*.29,w*.17,h*.17,rim);egg(c,w*.20,h*.25,w*.17,h*.17,accent);
 c.save();c.strokeStyle='#fffdf4';c.lineWidth=Math.max(3,w*.052);
 c.lineCap='round';c.lineJoin='round';c.beginPath();
 if(good){c.moveTo(w*.08,h*.25);c.lineTo(w*.16,h*.34);c.lineTo(w*.32,h*.15);}
 else{c.moveTo(w*.10,h*.15);c.lineTo(w*.30,h*.35);c.moveTo(w*.30,h*.15);c.lineTo(w*.10,h*.35);}
 c.stroke();c.restore();
}
function envelope(c,w,h){
 c.save();
 smooth(c,-w*.47,-h*.36,w*.94,h*.72,h*.17,'#fff7de',true);
 c.fillStyle='#e8bc9b';c.beginPath();
 c.moveTo(-w*.45,-h*.23);c.lineTo(0,h*.13);c.lineTo(w*.45,-h*.23);
 c.lineTo(w*.45,h*.29);c.lineTo(-w*.45,h*.29);c.closePath();c.fill();
 c.fillStyle='#fbe8cf';c.beginPath();
 c.moveTo(-w*.45,-h*.23);c.lineTo(0,h*.075);c.lineTo(w*.45,-h*.23);c.closePath();c.fill();
 smooth(c,-w*.1,h*.01,w*.2,h*.17,h*.055,'#ef8f78');
 c.restore();
}
function computer(c,w,h){
 c.save();
 // Monitor arms and rounded base.
 smooth(c,-w*.06,h*.20,w*.12,h*.18,10,'#5c99a1');
 smooth(c,-w*.27,h*.34,w*.54,h*.075,20,'#417c7f',true);
 smooth(c,-w*.47,-h*.41,w*.94,h*.64,Math.min(36,w*.09),fade(c,0,-h*.4,0,h*.65,'#75c5b7','#438f91'),true);
 smooth(c,-w*.40,-h*.35,w*.8,h*.50,Math.min(21,w*.07),'#d4ece0');
 // expressive monitor face
 egg(c,-w*.16,-h*.10,w*.027,h*.05,'#357a79');
 egg(c,w*.16,-h*.10,w*.027,h*.05,'#357a79');
 c.strokeStyle='#3c7c7a';c.lineWidth=w*.018;c.lineCap='round';c.beginPath();
 c.arc(0,-h*.035,w*.095,.15,Math.PI-.15);c.stroke();
 c.save();c.globalAlpha=.42;smooth(c,-w*.32,-h*.27,w*.3,h*.07,9,'#fff8dd');c.restore();
 egg(c,w*.36,h*.12,w*.015,h*.017,'#f0db9d');
 c.restore();
}
function shredder(c,w,h){
 c.save();drop(c,.85);
 // toothy shredder with one oversized angry mouth opening
 smooth(c,-w*.38,-h*.39,w*.76,h*.78,h*.15,fade(c,0,-h*.4,0,h,'#94c3c2','#5ba39e'),true);
 smooth(c,-w*.46,-h*.36,w*.92,h*.17,h*.06,'#316b71');
 smooth(c,-w*.27,-h*.28,w*.54,h*.055,6,'#1e5059');
 // cartoon face, not a stock trash glyph
 egg(c,-w*.15,-h*.02,w*.035,h*.043,'#234e53');
 egg(c,w*.15,-h*.02,w*.035,h*.043,'#234e53');
 smooth(c,-w*.23,h*.09,w*.46,h*.19,h*.05,'#3b6e72');
 for(let i=0;i<6;i++){
  c.fillStyle='#fff5d9';c.beginPath();
  c.moveTo(-w*.19+i*w*.073,h*.09);
  c.lineTo(-w*.15+i*w*.073,h*.16);
  c.lineTo(-w*.115+i*w*.073,h*.09);c.fill();
 }
 egg(c,w*.28,-h*.26,w*.035,h*.035,'#ffa87c');
 c.restore();
}
function folder(c,w,h){
 c.save();drop(c,.7);
 smooth(c,-w*.47,-h*.29,w*.4,h*.19,13,'#e9ad62');
 smooth(c,-w*.48,-h*.21,w*.96,h*.54,h*.1,fade(c,0,-h*.25,0,h*.6,'#ffd879','#eeaa68'),true);
 // Open top rim makes it obviously a catcher.
 smooth(c,-w*.47,-h*.25,w*.94,h*.085,14,'#fff1ab');
 smooth(c,-w*.23,-h*.04,w*.46,h*.08,10,'#f5bb73');
 c.restore();
}
function watch(c,w,h){
 c.save();egg(c,0,0,w*.45,h*.45,'#f9ce75');
 egg(c,0,0,w*.34,h*.34,'#fff3d8');
 arm(c,0,0,0,-h*.21,w*.075,'#3c7975');arm(c,0,0,w*.15,h*.05,w*.075,'#3c7975');
 egg(c,0,0,w*.06,h*.06,'#3c7975');c.restore();
}
function check(c,w,h){
 c.save();egg(c,0,0,w*.45,h*.45,'#91dcb1');
 c.strokeStyle='#fffbea';c.lineWidth=w*.15;c.lineCap='round';c.lineJoin='round';
 c.beginPath();c.moveTo(-w*.22,0);c.lineTo(-w*.04,h*.16);c.lineTo(w*.24,-h*.19);c.stroke();c.restore();
}
function phone(c,w,h){
 c.save();c.rotate(-.24);smooth(c,-w*.31,-h*.40,w*.62,h*.8,h*.19,'#7ac1bd',true);
 smooth(c,-w*.22,-h*.27,w*.44,h*.44,12,'#eaf4d9');
 smooth(c,-w*.13,h*.25,w*.26,h*.06,8,'#e8f1d7');
 c.restore();
}
export function rr(c,x,y,w,h,r=12,fill=P.cream,stroke=null,line=2){
 c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}
 if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.stroke();}
}
export function ink(c,text,x,y,size=30,color=P.ink,align='center'){
 c.save();c.textAlign=align;c.textBaseline='middle';
 c.font='900 '+size+'px Impact,Arial Narrow,Arial,sans-serif';
 c.fillStyle=(size===84&&color==='#fff9e9')?'#265555':color;c.fillText(String(text),x,y);c.restore();
}
export function drawIcon(c,key,x,y,w,h,alpha=1){
 c.save();c.globalAlpha*=alpha;c.translate(x,y);
 const tw=w,th=h;
 switch(key){
 case 'file-text':case 'file':file(c,tw*.84,th*.95,key==='file'?'plain':'good',key==='file-text');break;
 case 'mail':envelope(c,tw,th);break;
 case 'computer':computer(c,tw,th);break;
 case 'trash-can':shredder(c,tw,th);break;
 case 'folder':folder(c,tw,th);break;
 case 'clock':watch(c,tw,th);break;
 case 'tick':check(c,tw,th);break;
 case 'phone-ringing':phone(c,tw,th);break;
 default:c.restore();return false;
 }
 c.restore();return true;
}
export function iconsReady(){return true;}
export function sprite(c,row,col,x,y,w,h,alpha=1){
 c.save();c.globalAlpha*=alpha;c.translate(x,y);
 const s=Math.min(w/185,h/202);
 c.scale(s,s);
 if(row===2){c.scale(w/455/s,h/360/s);printer(c,col);}
 else if(row===1){c.scale(1.08,1.08);worker(c,col,'manager');}
 else worker(c,col,'worker');
 c.restore();return true;
}
export function paper(c,x,y,w,h,kind='good',rot=0,scale=1){
 c.save();c.translate(x,y);c.rotate(rot);c.scale(scale,scale);
 file(c,w,h,kind);
 c.restore();
}
export function capsule(c,x,y,w,h,color=P.gold,stroke=null){
 c.save();c.shadowColor='#224e4b35';c.shadowBlur=14;c.shadowOffsetY=6;
 rr(c,x-w/2,y-h/2,w,h,h/2,color,stroke?stroke:null,stroke?2:0);
 c.restore();
}
export function confetti(c,x,y,r,color){
 c.fillStyle=color;c.beginPath();c.arc(x,y,Math.max(.2,r),0,TAU);c.fill();
}
export function vignette(c){
 const g=c.createRadialGradient(480,250,220,480,250,770);
 g.addColorStop(0,'#fff6da00');g.addColorStop(1,'#947b3927');
 c.fillStyle=g;c.fillRect(0,0,960,540);
}