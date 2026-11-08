import {createPhysics} from '../night-shift-v3/physics/desk-world.js';
// Physically played preview. All content is original Canvas2D vector art, no DOM gameplay panels.
const canvas=document.querySelector('#world'), g=canvas.getContext('2d',{alpha:false});
const status=document.querySelector('#status'),pauseButton=document.querySelector('#pause');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const TWO=Math.PI*2;
let dpr=1,cssW=1,cssH=1,S=1,W=1300,H=760,sim,files=[],time=0,score=0,
  feedback='',feedbackAge=0,paused=false,last=0,fx=[],pointerId=null,previousPointerAt=0,
  curtains=0,won=false;
const r=(x,a,b)=>Math.max(a,Math.min(b,x));
const cx=()=>W/2;
function resize(){
  const oldW=W,box=canvas.getBoundingClientRect();
  cssW=box.width;cssH=box.height;
  dpr=Math.max(1,Math.min(devicePixelRatio||1,2));
  canvas.width=Math.round(cssW*dpr);canvas.height=Math.round(cssH*dpr);
  S=cssH/H;W=cssW/S;
  if(!sim){reset();return;}
  if(Math.abs(W-oldW)<.25)return; // DPR or height-only change: no physics disturbance.
  // Reflow the static stage, never reset scored props, time, perks or attempt state.
  sim.release({flick:false});
  const active=pointerId;pointerId=null;
  if(active!==null&&canvas.hasPointerCapture(active))canvas.releasePointerCapture(active);
  for(const f of files){
    if(!sim.objects.has(f.id))continue;
    const pos=sim.state(f),left=f.width/2+14,right=Math.max(left,W-195);
    const nextX=r(pos.x/Math.max(1,oldW-200)*(W-200),left,right);
    sim.setTransform(f,nextX,pos.y,pos.angle);
  }
  rebuildFurniture();
}
function shadeRect(x,y,w,h,c,b=12){g.fillStyle=c;g.beginPath();g.roundRect(x,y,w,h,b);g.fill();}
function line(x1,y1,x2,y2,color='#234044',wide=3){g.strokeStyle=color;g.lineWidth=wide;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke();}
function txt(s,x,y,size=24,col='#1f3a3a',align='center',weight=900){g.textAlign=align;g.textBaseline='middle';g.fillStyle=col;g.font=`${weight} ${size}px Impact,'Arial Narrow',Arial,sans-serif`;g.fillText(s,x,y);}
function pathRect(x,y,w,h,fill,outline='#173c40',rad=8,lw=4){shadeRect(x,y,w,h,fill,rad);
  if(outline){g.lineWidth=lw;g.strokeStyle=outline;g.beginPath();g.roundRect(x,y,w,h,rad);g.stroke();}}
function burst(x,y,col){if(reduced)return;for(let i=0;i<13;i++){let a=i*TWO/13;
  fx.push({x,y,vx:Math.cos(a)*(100+i*11),vy:Math.sin(a)*(100+i*9)-90,life:0.6,col});}}
function say(s){feedback=s;feedbackAge=1.3;status.textContent=s;}
function contact(e){if(e.type!=='contact-begin')return;
  if((e.a==='chute'||e.b==='chute')){
    const id=e.a==='chute'?e.b:e.a,body=sim.objects.get(id);
    if(body?.kind==='form'&&!body.data?.scored){body.data.scored=true;score++;const p=sim.state(body);
      burst(p.x,p.y,'#eaca74');say(score>=5?'PAPERWORK IS BEAUTIFUL!':`${score} / 5  APPROVED!`);
      if(score>=5)won=true; /* delayed removal: never destroy bodies inside a Planck callback */
    }
  }
  if(e.speed>140&&!e.sensor){const id=sim.objects.get(e.a)?.kind==='form'?e.a:e.b,p=sim.state(id);
    if(p&&fx.length<90)burst(p.x,p.y,'#f5af66');}
}
function rebuildFurniture(){
  for(const id of ['floor','right-wall','chute-base','chute','bumper','bumper-small'])sim.remove(id);
  sim.box({id:'floor',x:cx(),y:735,width:Math.max(250,W+100),height:90,restitution:0.15,friction:0.85});
  sim.box({id:'right-wall',x:W,y:370,width:18,height:800});
  sim.box({id:'chute-base',x:W-115,y:684,width:170,height:16,friction:0.8});
  sim.box({id:'chute',kind:'chute',x:W-115,y:648,width:146,height:73,sensor:true});
  sim.circle({id:'bumper',kind:'bumper',x:W*.59,y:487,radius:r(W*.032,24,40),restitution:1.17,friction:0.2});
  if(W>720)sim.circle({id:'bumper-small',kind:'bumper',x:W*.7,y:547,radius:24,restitution:1.1});
}
function reset(){if(sim)sim.dispose();files=[];score=0;time=0;won=false;paused=false;fx=[];pointerId=null;
  feedback='';feedbackAge=0;pauseButton.textContent='PAUSE [SPACE]';
  sim=createPhysics({planck:window.planck,gravity:{x:0,y:930},onEvent:contact});
  sim.box({id:'left-wall',x:0,y:370,width:18,height:800});
  rebuildFurniture();
  for(let i=0;i<5;i++){
    let x=r(W*.17+i*Math.min(W*.09,72),78,W-225),y=165+(i%3)*71;
    files.push(sim.box({id:`form-${i}`,kind:'form',data:{label:['INVOICE','OVERTIME','PAY SLIP','EXPENSES','APPROVAL'][i],order:i},
      x,y,width:r(W*.105,70,114),height:69,type:'dynamic',density:0.48,friction:.5,
      restitution:.42,angularDamping:1.8,linearDamping:.13,bullet:true}));
  }
  // Invisible static pads keep papers visible near the top of the desk.
  say('DRAG. FLICK. BANK-SHOT. APPROVE.');
}
function scene(){
  let t=reduced?0:time,sky=g.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#12353c');sky.addColorStop(.62,'#1a4547');sky.addColorStop(1,'#153438');
  g.fillStyle=sky;g.fillRect(0,0,W,H);
  // Windows and long night-office shadows extend to the entire viewport.
  for(let i=0;i<Math.ceil(W/290)+1;i++){const x=i*290-40;
    shadeRect(x+22,100,238,400,'#1a4148',9);shadeRect(x+33,111,216,378,'#102d3b',4);
    g.save();g.beginPath();g.rect(x+33,111,216,378);g.clip();
    for(let j=0;j<9;j++){
      const bh=85+(j*37+i*43)%185;g.fillStyle=['#1c464c','#173c42','#204b50'][j%3];
      g.fillRect(x+30+j*34,480-bh,32,bh);
      for(let k=0;k<5;k++){g.fillStyle=(j+k+i)%3?'#cf9b55':'#79b3aa';g.globalAlpha=.4;
        g.fillRect(x+34+j*34,492-bh+k*34,5,10);g.globalAlpha=1;}
    }g.restore();pathRect(x+29,301,226,12,'#214950',null,0);
    pathRect(x+135,111,12,378,'#214950',null,0);
  }
  // Atmospheric fluorescent glow, ceiling graph paper and warm paper desk.
  let glow=g.createRadialGradient(W*.25,150,0,W*.25,150,W*.82);
  glow.addColorStop(0,'#f3c27225');glow.addColorStop(1,'#ffffff00');g.fillStyle=glow;g.fillRect(0,0,W,H);
  shadeRect(0,540,W,220,'#b09b78',0);shadeRect(0,554,W,210,'#d3bb94',0);
  for(let i=0;i<Math.ceil(W/24);i++){line(i*24,560,i*24-55,760,'#c5a983',1.3);}
  shadeRect(0,708,W,52,'#937650',0);line(0,709,W,709,'#f4d8a9',8);
  // Centre-right oversized machine: relief, depth, leaking forms.
  const mX=r(W*.76,Math.min(390,W*.55),W-135),mY=335+Math.sin(t*1.7)*3;
  g.save();g.translate(mX,mY);
  pathRect(-103,24,205,171,'#2a6262','#142e36',18,7);
  pathRect(-89,38,178,56,'#dae7d9','#142e36',9,4);
  pathRect(-78,51,156,28,'#1e474a',null,3);txt('A.S.T.E.R. • MK IV',0,66,17,'#f2c671');
  pathRect(-86,105,174,76,'#3c7871','#153940',8,4);
  pathRect(-65,115,128,38,'#173d43','#102e36',4);
  for(let i=0;i<5;i++)shadeRect(-52+i*24,126+(i%2)*2,14,11,i===4?'#e2ae59':'#79bfb0',3);
  g.fillStyle='#16373b';g.beginPath();g.arc(-55,174,14,0,TWO);g.arc(52,174,14,0,TWO);g.fill();
  if(!reduced){g.strokeStyle='#f3b968';g.lineWidth=4;g.beginPath();g.moveTo(70,118);g.lineTo(84+Math.cos(t*4)*9,110);g.stroke();}
  g.restore();
  // Bin drawn from behind the interactive chute. Glow follows proximity.
  const bx=W-115,by=660;
  g.save();g.shadowColor='#a9e9b8';g.shadowBlur=25;
  pathRect(bx-88,by-48,176,114,'#275d54','#102f34',17,6);g.restore();
  pathRect(bx-75,by-40,150,74,'#b7d8b8','#1d5550',7,5);
  pathRect(bx-65,by-29,130,29,'#203d40',null,3);
  txt('APPROVED',bx,by-15,19,'#f6c36e');txt('✓',bx,by+29,32,'#1b765a');
  // Planck bumper appears as a weighted, bolted desk toy.
  for(const id of ['bumper','bumper-small']){const obj=sim.objects.get(id);if(!obj)continue;
    const {x,y}=sim.state(obj),rr=obj.radius;g.save();g.shadowBlur=14;g.shadowColor='#f1af61';
    g.fillStyle='#e1a64f';g.beginPath();g.arc(x,y,rr+8,0,TWO);g.fill();g.shadowBlur=0;
    g.fillStyle='#af583c';g.beginPath();g.arc(x,y,rr-3,0,TWO);g.fill();
    g.strokeStyle='#f9dc8d';g.lineWidth=5;g.beginPath();g.arc(x-5,y-5,rr-10,Math.PI*1.05,Math.PI*1.8);g.stroke();
    txt('↗',x,y,rr*.9,'#fff2ca');g.restore();}
  // Stamped playfield stickers add personality without introducing giant interface panels.
  g.save();g.translate(55,515);g.rotate(-.12);txt('CORPORATE PROPERTY',0,0,18,'#704e48','left');txt('HANDLE WITHOUT CARE',0,22,13,'#704e48','left');g.restore();
}
function drawFile(file){const s=sim.state(file);if(!s)return;const w=file.width,h=file.height;
  g.save();g.translate(s.x,s.y);g.rotate(s.angle);
  g.shadowColor='#162e3280';g.shadowBlur=10;g.shadowOffsetY=8;
  pathRect(-w/2,-h/2,w,h,'#efe9cf','#193e43',9,3.5);
  g.shadowBlur=0;g.shadowOffsetY=0;
  shadeRect(-w/2+9,-h/2+8,w-18,14,'#d3e6cd',3);
  txt('ASTER',-w/2+15,-h/2+15,9,'#1e6259','left');
  line(-w/2+12,-h/2+30,w/2-12,-h/2+30,'#8ba998',2);
  txt(file.data.label,0,4,r(w/8,9,15),'#24484a');
  line(-w/2+14,h/2-12,w/2-21,h/2-12,'#baa98e',2);
  g.fillStyle='#d66650';g.beginPath();g.arc(w/2-11,h/2-12,5,0,TWO);g.fill();
  g.restore();}
function decorations(){for(const p of fx){g.globalAlpha=r(p.life/0.6,0,1);
    g.fillStyle=p.col;g.save();g.translate(p.x,p.y);g.rotate(p.life*9);
    g.fillRect(-3,-3,6,6);g.restore();}g.globalAlpha=1;}
function hud(){
  // HUD uses CSS viewport coordinates, deliberately decoupled from physics/camera.
  g.setTransform(dpr,0,0,dpr,0,0);
  g.fillStyle='#132c32db';g.fillRect(0,0,cssW,Math.min(102,cssH*.17));
  const tiny=cssW<600,h=r(cssH*.13,58,95);
  txt('QUOTA PANIC',tiny?15:30,27,tiny?18:26,'#f2c16f','left');
  txt('NIGHT SHIFT  /  PHYSICS DESK',tiny?15:30,52,tiny?10:14,'#b9d8c9','left');
  txt(`FORMS ${score} / 5`,cssW-18,28,tiny?18:26,'#f7e4b7','right');
  txt('PLANCK LAB',cssW-18,54,tiny?11:14,'#77b9a3','right');
  txt(won?'ALL FORMS APPROVED':tiny?'DRAG → BIN':'DRAG & FLICK INTO APPROVED',cssW/2,Math.min(cssH-98,cssH*.16+16),tiny?17:30,'#f6cb7e');
  if(feedbackAge>0){g.globalAlpha=r(feedbackAge*2,0,1);
    txt(feedback,cssW/2,Math.min(cssH-142,cssH*.16+53),tiny?13:19,'#ffffff');g.globalAlpha=1;}
  if(paused){g.fillStyle='#112c31ba';g.fillRect(0,0,cssW,cssH);
    txt('UNION BREAK',cssW/2,cssH*.42,tiny?37:75,'#f3c274');
    txt('SPACE TO RETURN',cssW/2,cssH*.5,tiny?15:25,'#e0ede4');}
}
function draw(){g.setTransform(dpr*S,0,0,dpr*S,0,0);scene();
  for(const obj of files)if(sim.objects.has(obj.id)&&!obj.data.scored)drawFile(obj);
  decorations();hud();}
function frame(now){const dt=Math.min(.06,Math.max(0,(now-last)/1000));last=now;
  if(!paused){time+=dt;feedbackAge=Math.max(0,feedbackAge-dt);sim.step(dt);
    for(const f of files){if(f.data.scored)sim.remove(f);}
    for(const p of fx){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=320*dt;p.life-=dt;}
    fx=fx.filter(x=>x.life>0);
  }
  draw();requestAnimationFrame(frame);}
function worldPoint(e){return {x:e.clientX/S,y:e.clientY/S};}
canvas.addEventListener('pointerdown',e=>{if(paused)return;const p=worldPoint(e);
  const item=sim.grab(p.x,p.y,{filter:o=>o.kind==='form'&&!o.data.scored});
  if(item){pointerId=e.pointerId;previousPointerAt=e.timeStamp;canvas.setPointerCapture(e.pointerId);say(`GRABBED: ${item.data.label}`);}
});
canvas.addEventListener('pointermove',e=>{if(e.pointerId!==pointerId||paused)return;
  const p=worldPoint(e),dt=r((e.timeStamp-previousPointerAt)/1000,.001,.1);
  previousPointerAt=e.timeStamp;sim.move(p.x,p.y,dt);});
function end(e, cancelled=false){if(e.pointerId!==pointerId)return;
  sim.release({flick:!cancelled});pointerId=null;
  if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);}
canvas.addEventListener('pointerup',e=>end(e));canvas.addEventListener('pointercancel',e=>end(e,true));
function autoPause(){
  if(paused)return;
  paused=true;sim?.release({flick:false});pointerId=null;
  pauseButton.textContent='RESUME [SPACE]';
}
window.addEventListener('blur',autoPause);
document.addEventListener('visibilitychange',()=>{if(document.hidden)autoPause();});
function togglePause(){paused=!paused;sim?.release({flick:false});pointerId=null;
  pauseButton.textContent=paused?'RESUME [SPACE]':'PAUSE [SPACE]';}
pauseButton.addEventListener('click',togglePause);
document.querySelector('#reset').addEventListener('click',reset);
window.addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();togglePause();}if(e.key.toLowerCase()==='r')reset();});
window.addEventListener('resize',resize);
resize();requestAnimationFrame(frame);
window.__physicsPreview={snapshot:()=>({score,paused,worldWidth:W,viewport:{width:cssW,height:cssH,dpr},sim:sim.snapshot()}),
  reset,pause:togglePause};
