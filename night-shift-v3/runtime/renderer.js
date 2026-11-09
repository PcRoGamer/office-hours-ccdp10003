/**
 * Edge-to-edge Canvas2D renderer. Compatible with scene.draw(ctx2d, viewport).
 * The office backdrop is an independent HD-inspired option, never required
 * by a scene with its own authored backgrounds.
 */
export const HD_PALETTE=Object.freeze({
 ink:'#182a2d',night:'#172d31',wall:'#234348',paper:'#f2e9d7',
 cream:'#fff4e2',coral:'#c9543f',mint:'#91ddbd',gold:'#efbd69',
 teal:'#396b69',shadow:'#0d2429'
});
const P=HD_PALETTE;
function rect(ctx,x,y,w,h,fill){ctx.fillStyle=fill;ctx.fillRect(x,y,w,h);}
function round(ctx,x,y,w,h,r,fill,stroke,width=2){
 ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}
}
function line(ctx,x1,y1,x2,y2,color,w=1){ctx.strokeStyle=color;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
function type(ctx,text,x,y,size,color,align='left',font='Impact, Arial Narrow, sans-serif'){
 ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='middle';ctx.font='900 '+size+'px '+font;ctx.fillText(text,x,y);
}
export function drawOfficeBackdrop(ctx,vp,{accent=P.coral,department='intake'}={}){
 const b=vp.worldBounds(),L=b.left,R=b.right,W=b.width,H=b.height;
 // Every field reaches the viewport edges for arbitrary aspect ratios.
 const wall=ctx.createLinearGradient(L,0,R,H);
 wall.addColorStop(0,'#29484b');wall.addColorStop(.48,'#1b343a');wall.addColorStop(1,'#11262e');
 rect(ctx,L,0,W,H,wall);
 rect(ctx,L,0,W,94,'#11252c');rect(ctx,L,94,W,8,'#e5aa5660');
 // Silkscreen rays, visually dimensional with no central letterbox.
 ctx.fillStyle='#f0d19c09';ctx.beginPath();ctx.moveTo(430,99);ctx.lineTo(780,99);ctx.lineTo(1050,590);ctx.lineTo(45,590);ctx.closePath();ctx.fill();
 // Stage number is environmental, not another full-screen HUD layer.
 ctx.save();ctx.globalAlpha=.065;type(ctx,'NIGHT SHIFT',center(vp),258,170,'#e9efcd','center');ctx.restore();
 for(let x=Math.floor(L/115)*115;x<R;x+=115)line(ctx,x,100,x,H,'#cbdcd70c',1);
 for(let x=Math.floor(L/21)*21;x<R+H;x+=21)line(ctx,x,130,x-175,580,'#d7c3a008',1);
 // Paper cutout windows with parallax silhouettes.
 for(let k=-2;k<=2;k++){
  const x=600+k*260;
  round(ctx,x-111,151,222,244,11,'#102c33','#507777',5);
  rect(ctx,x-101,162,202,224,'#204c58');
  const sky=ctx.createLinearGradient(x,162,x,385);
  sky.addColorStop(0,'#3f656e');sky.addColorStop(1,'#122b38');
  rect(ctx,x-99,165,198,216,sky);
  for(let j=0;j<5;j++){const wx=x-99+j*42;rect(ctx,wx,296+(j%3)*13,34,85,'#132c34');for(let f=0;f<4;f++)rect(ctx,wx+5+(f%2)*11,306+f*16,5,7,'#d2b76f55');}
  line(ctx,x,163,x,386,'#092c31',8);line(ctx,x-99,285,x+99,285,'#092c31',7);
 }
 // Oversized wall graphics borrow HD's printmaking grammar.
 round(ctx,184,160,177,195,3,'#dfb563','#1a3337',5);
 rect(ctx,197,173,151,11,accent);
 type(ctx,'QUOTA',271,237,43,P.ink,'center');
 type(ctx,'IS',271,279,32,P.ink,'center');
 type(ctx,'FINE.',271,321,39,P.ink,'center');
 ctx.save();ctx.translate(1007,216);ctx.rotate(.083);
 round(ctx,-88,-74,176,147,3,'#eddfbf','#152a2f',6);
 type(ctx,'POLICY',0,-33,35,accent,'center');
 type(ctx,'# 404',0,14,32,P.ink,'center');
 type(ctx,'NOT FOUND',0,51,17,P.ink,'center');
 ctx.restore();
 // Distinct upper architectural cornice and suspended fixtures.
 for(const x of [330,865]){line(ctx,x,100,x,140,'#14282a',5);round(ctx,x-58,137,116,18,6,'#d7bd7b','#132d2f',4);
  const glow=ctx.createRadialGradient(x,146,8,x,146,170);glow.addColorStop(0,'#f8e6a51f');glow.addColorStop(1,'#f8e6a500');ctx.fillStyle=glow;ctx.fillRect(x-170,143,340,280);}
 // Deep desk and directional woodgrain. Foreground is not framed.
 rect(ctx,L,567,W,H-567,'#11252a');
 rect(ctx,L,552,W,20,'#be7547');
 const desk=ctx.createLinearGradient(0,570,0,760);
 desk.addColorStop(0,'#a76243');desk.addColorStop(.32,'#754636');desk.addColorStop(1,'#3a3030');
 rect(ctx,L,572,W,188,desk);
 for(let y=594;y<760;y+=28)line(ctx,L,y,R,y,'#f6cf9d17',2);
 rect(ctx,L,583,W,5,'#e7b37429');
 // Mechanical desk fittings, safely ambient, not fake controls.
 for(let x=Math.floor(L/365)*365+5;x<R;x+=365){
  round(ctx,x+6,676,105,11,4,'#263637','#cb9b6d',2);
  round(ctx,x+38,682,37,16,4,'#3b4a47','#1a2a2d',2);
 }
 // Stage-type accent is environmental and can change per department.
 rect(ctx,L,550,W,3,accent);
}
function center(vp){return vp.centerX??600;}
export function createRenderer({canvas,viewport,background=drawOfficeBackdrop}={}){
 if(!canvas||!viewport)throw new TypeError('renderer requires canvas + viewport');
 const ctx=canvas.getContext('2d',{alpha:false});
 if(!ctx)throw new Error('Canvas2D unavailable');
 const cached=document.createElement('canvas');
 const backCtx=cached.getContext('2d',{alpha:false});let cacheKey='';
 function invalidate(){cacheKey='';}
 function frame({drawWorld=null,time=0,stage='intake',accent=P.coral,drawBackground=true}={}){
  const key=[viewport.backingWidth,viewport.backingHeight,viewport.originX.toFixed(3),stage,accent].join('|');
  if(drawBackground && background && key!==cacheKey){
   cached.width=viewport.backingWidth;cached.height=viewport.backingHeight;
   backCtx.setTransform(1,0,0,1,0,0);backCtx.fillStyle=P.night;backCtx.fillRect(0,0,cached.width,cached.height);
   viewport.applyWorldTransform(backCtx);
   background(backCtx,viewport,{department:stage,accent});
   cacheKey=key;
  }
  ctx.setTransform(1,0,0,1,0,0);
  if(drawBackground && background)ctx.drawImage(cached,0,0);
  else {ctx.fillStyle=P.night;ctx.fillRect(0,0,canvas.width,canvas.height);}
  viewport.applyWorldTransform(ctx);
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  if(drawWorld)drawWorld(ctx,viewport,time);
  return ctx;
 }
 return {ctx2d:ctx,viewport,frame,drawFrame:frame,invalidate,
   drawWorld(fn){viewport.applyWorldTransform(ctx);fn(ctx,viewport);},
   destroy(){cached.width=0;cached.height=0;}};
}