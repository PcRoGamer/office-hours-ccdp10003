// Shared illustrated assets: the original generated Night Shift HD cast atlas.
// All prominent characters and machines are sprites; vector primitives are interaction affordances only.
export const HD=new Image();
HD.decoding='async';
HD.src='./night-shift-v3/art/hd-cast-atlas.png';
export const ICONS=Object.fromEntries(['file-text','file','mail','phone-ringing','trash-can','computer','clock','tick','folder'].map(key=>{const im=new Image();im.decoding='async';im.src='./office-attack/icons/'+key+'.png';return[key,im]}));
export function drawIcon(c,key,x,y,w,h,alpha=1){const img=ICONS[key];if(!img?.complete||!img.naturalWidth)return false;c.save();c.globalAlpha*=alpha;c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(img,x-w/2,y-h/2,w,h);c.restore();return true;}
export function iconsReady(){return Object.values(ICONS).every(x=>x.complete&&x.naturalWidth)}
export const COLORS={ink:'#16373a',cream:'#fff6df',mint:'#5cf0b7',coral:'#ee6250',gold:'#ffd36a',sky:'#b8e5d7'};
export function sprite(c,row,col,x,y,w,h,alpha=1){
 if(!HD.complete||!HD.naturalWidth)return false;
 const sw=HD.naturalWidth/4,sh=HD.naturalHeight/4;
 c.save();c.globalAlpha*=alpha;c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
 c.drawImage(HD,col*sw,row*sh,sw,sh,x-w/2,y-h/2,w,h);c.restore();return true;
}
export function rr(c,x,y,w,h,r=12,fill='#fff7e8',stroke=null,line=2){
 c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.stroke()}
}
export function ink(c,s,x,y,size=30,color=COLORS.ink,align='center'){
 c.font='900 '+size+'px Impact, Arial Narrow, Arial, sans-serif';c.textAlign=align;c.textBaseline='middle';c.fillStyle=color;c.fillText(String(s),x,y);
}
export function paper(c,x,y,w,h,kind='good',rot=0,scale=1){
 c.save();c.translate(x,y);c.rotate(rot);c.scale(scale,scale);
 if(drawIcon(c,'file-text',0,0,w*1.22,h*1.25)){
   const ok=kind==='good';c.save();c.translate(w*.22,h*.10);
   if(ok)drawIcon(c,'tick',0,0,w*.32,h*.32);
   else{rr(c,-w*.19,-h*.17,w*.38,h*.34,8,'#c7463e');ink(c,'×',0,0,h*.28,'#fff4e0')}
   c.restore();c.restore();return;
 }
 c.shadowColor='#0b252d66';c.shadowBlur=20;c.shadowOffsetY=9;
 const gr=c.createLinearGradient(-w/2,-h/2,w/2,h/2);
 gr.addColorStop(0,'#ffffff');gr.addColorStop(.72,'#f5e9cf');gr.addColorStop(1,'#dfc9a8');
 rr(c,-w/2,-h/2,w,h,10,gr,'#b7a58b',2);c.shadowBlur=0;c.shadowOffsetY=0;
 rr(c,-w/2+13,-h/2+16,w-26,9,3,'#d8d0b8');
 for(let i=0;i<3;i++)rr(c,-w/2+20,-h/2+42+i*17,w*.52*(i===1?.72:1),5,2,'#b7b6a9');
 const ok=kind==='good';rr(c,w*.16,-h*.12,w*.26,h*.34,9,ok?'#d7f5df':'#ffded4',ok?'#228c62':'#ad493a',2);
 ink(c,ok?'✓':'×',w*.29,h*.04,Math.min(h*.34,57),ok?'#1a996d':'#c74c3e');
 ink(c,ok?'APPROVE':'SPAM',-w*.07,h*.31,Math.min(19,h*.14),ok?'#297f60':'#bd4a3b');
 c.restore();
}
export function capsule(c,x,y,w,h,color=COLORS.gold,stroke='#1b3539'){
 c.save();c.shadowColor='#0d242b5c';c.shadowBlur=16;c.shadowOffsetY=6;rr(c,x-w/2,y-h/2,w,h,h/2,color,stroke,3);c.restore();
}
export function confetti(c,x,y,r,color){
 c.fillStyle=color;c.beginPath();c.arc(x,y,Math.max(0.2,r),0,7);c.fill();
}
export function vignette(c){let g=c.createRadialGradient(480,265,200,480,265,690);g.addColorStop(0,'#0000');g.addColorStop(1,'#05292d3d');c.fillStyle=g;c.fillRect(0,0,960,540)}
