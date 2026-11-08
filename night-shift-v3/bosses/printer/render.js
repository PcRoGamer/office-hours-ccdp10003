/** Original Canvas2D paper-theatre machine art for Printer Mutiny. Draw WORLD only. */
const C={night:'#111d24',dark:'#10252b',green:'#1d6b61',mint:'#50d7b4',paper:'#fff2d6',cream:'#eee3c5',gold:'#ffd06e',red:'#ec6856',rust:'#9b4d43',steel:'#8baaa2',line:'#263940'};
const TAU=Math.PI*2;
function rr(c,x,y,w,h,r=12){c.beginPath();c.roundRect(x,y,w,h,Math.min(r,w/2,h/2));}
function text(c,s,x,y,size=22,color=C.paper,align='center',weight=900){c.fillStyle=color;c.font=`${weight} ${size}px "Arial Narrow", Impact, Arial, sans-serif`;c.textAlign=align;c.textBaseline='middle';c.fillText(s,x,y);}
function blob(c,x,y,r,color){c.beginPath();c.arc(x,y,r,0,TAU);c.fillStyle=color;c.fill();}
function stroke(c,color,width=3){c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function line(c,x,y,x2,y2,color,width=3){c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);stroke(c,color,width);}
function grad(c,x,y,x2,y2,stops){const g=c.createLinearGradient(x,y,x2,y2);for(const [a,b] of stops)g.addColorStop(a,b);return g;}
function label(c,s,x,y,w=180,h=42,bg='#193e44',fg=C.paper,angle=0){c.save();c.translate(x,y);c.rotate(angle);rr(c,-w/2,-h/2,w,h,8);c.fillStyle=bg;c.fill();c.strokeStyle='#f7e1a066';c.lineWidth=2;c.stroke();text(c,s,0,0,Math.min(19,w/Math.max(5,s.length)*1.15),fg);c.restore();}
function paper(c,x,y,w,h,rotation=0,mark='FORM',accent=C.gold){c.save();c.translate(x,y);c.rotate(rotation);c.shadowColor='#0008';c.shadowBlur=14;c.shadowOffsetY=9;rr(c,-w/2,-h/2,w,h,7);c.fillStyle=C.paper;c.fill();c.shadowBlur=0;c.shadowOffsetY=0;rr(c,-w/2+6,-h/2+6,w-12,h-12,2);c.strokeStyle='#6f877d88';c.lineWidth=1;c.stroke();line(c,-w*.34,-h*.12,w*.32,-h*.12,'#8ca296',3);line(c,-w*.34,h*.05,w*.22,h*.05,'#8ca296',2);rr(c,-w*.35,h*.21,w*.7,h*.2,2);c.fillStyle=accent;c.fill();text(c,mark,0,h*.31,Math.min(17,w*.12),C.dark);c.restore();}
function bolt(c,x,y,live=true,spin=0){c.save();c.translate(x,y);c.rotate(spin);c.shadowColor='#000a';c.shadowBlur=7;c.shadowOffsetY=4;blob(c,0,0,27,live?'#19373a':'#24383e');c.shadowBlur=0;blob(c,0,0,23,live?'#e5c377':'#5d716f');blob(c,-5,-6,13,live?'#ffecb4':'#68817e');line(c,-10,-9,10,9,live?'#80542e':'#415657',5);line(c,-10,9,10,-9,live?'#80542e':'#415657',5);if(!live){c.strokeStyle='#ffb46c77';c.lineWidth=2;c.beginPath();c.arc(0,0,33,0,TAU);c.stroke();}c.restore();}
function monitor(c,x,y,w,h){c.save();c.translate(x,y);rr(c,-w/2,-h/2,w,h,8);c.fillStyle='#0b222b';c.fill();rr(c,-w/2+7,-h/2+7,w-14,h-14,4);c.fillStyle='#2b625f';c.fill();for(let i=0;i<6;i++)line(c,-w*.37,-h*.25+i*7,w*.37,-h*.25+i*7,i%2?'#79b49a77':'#daecbc44',1);c.restore();}
function worldBackground(c,w,t,compact){
  c.fillStyle=grad(c,0,-380,0,380,[[0,'#0b2228'],[.48,'#1c3b3d'],[.77,'#325453'],[1,'#17292c']]);c.fillRect(-w/2,-380,w,760);
  // Floor and wall theatre; no letterbox: wallpaper extends to both viewport edges.
  c.fillStyle='#17373a';c.fillRect(-w/2,-380,w,390);
  for(let x=Math.floor(-w/2/105)*105;x<w/2;x+=105){line(c,x,-375,x,4,'#e7ce9155',2);}
  for(let y=-340;y<12;y+=68)line(c,-w/2,y,w/2,y,'#b7a98020',1);
  c.fillStyle='#0c252a';c.fillRect(-w/2,-11,w,20);line(c,-w/2,10,w/2,10,'#cfaa72',5);
  // Lit ceiling bar hanging on two cables, and signage.
  line(c,-275,-380,-275,-326,'#99aea0',4);line(c,275,-380,275,-326,'#99aea0',4);
  if(!compact){rr(c,-312,-316,624,34,9);c.fillStyle='#09232a';c.fill();rr(c,-302,-308,604,17,5);c.fillStyle='#d7a64a';c.fill();}
  c.save();c.globalAlpha=.14;c.fillStyle='#ffe9a8';c.beginPath();c.moveTo(-290,-292);c.lineTo(290,-292);c.lineTo(465,340);c.lineTo(-465,340);c.fill();c.restore();
  if(!compact)label(c,'DEPT. OF MACHINE WELLNESS',0,-267,Math.min(540,w*.84),37,'#104743','#f2e5c4');
  // Layered stage sides: supplies, wires, office ephemera.
  const sides=[-1,1];for(let sign of sides){
    const x=sign*(w/2-85);c.save();c.translate(x,-65);c.rotate(sign*.055);
    rr(c,-57,-120,114,294,13);c.fillStyle='#132e33';c.fill();c.strokeStyle='#608d7d';c.lineWidth=5;c.stroke();
    for(let i=0;i<3;i++){rr(c,-44,-105+i*91,88,75,4);c.fillStyle=i===1?'#3d6961':'#25464a';c.fill();for(let q=0;q<3;q++)line(c,-29,-86+i*91+q*15,25,-86+i*91+q*15,'#abc0a278',4);}
    c.restore();
  }
  // Stacked glossy foreground desk as action stage.
  c.fillStyle=grad(c,0,190,0,390,[[0,'#ad6d4c'],[.1,'#704c3c'],[.22,'#443b37'],[1,'#16292b']]);c.fillRect(-w/2,228,w,180);
  rr(c,-w/2,216,w,27,4);c.fillStyle='#d29363';c.fill();line(c,-w/2,244,w/2,244,'#402d2c',6);
  for(let x=Math.floor(-w/2/95)*95;x<w/2;x+=95){line(c,x,260,x+64,340,'#f5aa6d0a',2);}
  const radius=compact?245:320;c.save();c.globalAlpha=.18;const glow=c.createRadialGradient(0,40,10,0,40,radius+220);glow.addColorStop(0,'#ffd883');glow.addColorStop(1,'#ffd88300');c.fillStyle=glow;c.fillRect(-radius-220,-280,2*(radius+220),570);c.restore();
}
function machine(c,s,w,t){
  const mw=Math.min(685,w*.94),left=-mw/2,top=-196;
  // Animated breathing/strain, shape of main machine is more important than chrome.
  const pulse=s.state==='telegraph'?Math.sin(t*13)*4:s.state==='jam'?Math.sin(t*17)*2:s.state==='impact'?Math.sin(t*32)*12:Math.sin(t*2)*1.5;
  c.save();c.translate(0,pulse);c.shadowBlur=27;c.shadowColor='#000b';c.shadowOffsetY=26;
  rr(c,left,-205,mw,407,31);c.fillStyle='#112f35';c.fill();c.shadowBlur=0;c.shadowOffsetY=0;
  rr(c,left+12,-196,mw-24,380,25);c.fillStyle=grad(c,left,-200,left+mw,180,[[0,'#7aa49a'],[.23,'#d1c8a9'],[.51,'#9aa69b'],[.82,'#6c837f'],[1,'#456566']]);c.fill();
  rr(c,left+28,-177,mw-56,346,22);c.strokeStyle='#193e43';c.lineWidth=8;c.stroke();
  // Massive overhead platen, with vents, brand plate and pneumatic cylinders.
  rr(c,left+34,-166,mw-68,86,17);c.fillStyle='#1e4850';c.fill();
  for(let i=0;i<13;i++){let x=left+60+i*(mw-120)/12;line(c,x,-151,x+8,-105,'#68a59b',5);}
  label(c,'F I N C H  •  P R I N T E R  9 0 0 0',0,-117,Math.min(480,mw-110),33,'#173b40','#fbe0a4');
  // Dramatic eyes and eyebrows (face visibly reacts).
  const ey=-37,blink=(Math.sin(t*1.3+s.cycle*2)>0.994?0.18:1);
  for(let sign of [-1,1]){
    const ex=sign*107;
    c.save();c.translate(ex,ey);
    c.rotate(sign*(s.emotion==='alarmed'?.19:s.emotion==='stunned'?.47:-.06));
    rr(c,-59,-44,118,82,20);c.fillStyle='#102d36';c.fill();
    rr(c,-48,-31,96,58*blink+4,18);c.fillStyle=s.emotion==='surrender'?'#b3d4ae':s.emotion==='alarmed'?'#fff0b9':'#e4f2cf';c.fill();
    const irisX=sign*(s.emotion==='alarmed'?3:-9),irisY=s.emotion==='stunned'?14:1;
    blob(c,irisX,irisY,16*blink,'#152d32');blob(c,irisX-5,irisY-6,5,C.paper);
    line(c,-55,-58,55,-58, s.emotion==='alarmed'?C.red:C.dark,10);
    c.restore();
  }
  // Paper mouth/feeder: functional visual marker, collision geometry from controller.
  rr(c,-mw*.42,18,mw*.84,133,17);c.fillStyle='#203d40';c.fill();
  rr(c,-mw*.38,26,mw*.76,112,15);c.fillStyle='#15272d';c.fill();
  // Feeder rail visibly explains shifting target.
  rr(c,-205,56,410,20,10);c.fillStyle='#6b8379';c.fill();
  for(let i=-4;i<=4;i++){line(c,i*42,56,i*42,74,'#d3bd8b',2);}
  const fx=s.feederX,fh=92,fw=s.feederWidth;
  c.save();c.translate(fx,48);
  rr(c,-fw/2-9,-fh/2-6,fw+18,fh+12,12);c.fillStyle='#081e27';c.fill();
  rr(c,-fw/2,-fh/2,fw,fh,9);c.fillStyle=s.state==='counter'&&!s.shutter&&s.adMoved?'#75eabf':'#c8745b';c.fill();
  rr(c,-fw/2+12,-fh/2+10,fw-24,fh-20,6);c.fillStyle='#11282b';c.fill();
  if(s.state==='counter'&&s.open){c.save();c.globalAlpha=.3+.1*Math.sin(t*8);rr(c,-fw/2+19,-fh/2+14,fw-38,fh-28,6);c.fillStyle='#8fffd0';c.fill();c.restore();}
  for(let i=-1;i<=1;i++)line(c,-fw*.24,-22+i*13,fw*.24,-22+i*13,'#e5ecce55',3);
  text(c,s.state==='counter'?'F E E D':'LOCKED',0,15,17,C.paper);
  c.restore();
  if(s.shutter&&s.state==='counter'){
    label(c,'TAP SEAL ✓',fx,-27,168,58,'#f2bd5b',C.dark,Math.sin(t*3)*.02);
  }
  // Actual protruding jam page, rubber strain and safe pull marks.
  if(s.state==='jam'){
    const pull=s.pagePull*135;
    c.save();c.translate(-106,102+pull);c.rotate(-.13+s.pagePull*.19);
    paper(c,0,0,99,114,0,'JAM!','#e46f58');c.restore();
    c.strokeStyle=s.canPull?'#76ffbe':'#ed8d65';c.lineWidth=4;c.setLineDash([11,11]);c.beginPath();c.moveTo(-105,156);c.lineTo(-105,235);c.stroke();c.setLineDash([]);
    label(c,s.canPull?'PULL ↓':'WAIT ⏱',-102,203,126,36,s.canPull?'#2b8069':'#a45043',C.paper);
  }
  if(s.state==='jam'&&s.knowsCable){
    line(c,205,87,240,150,'#efb260',11);blob(c,206,87,15,s.canPull?'#7df3ba':'#d96f55');
  }
  // Distinct physical attachment bolts. They do not act as hit points.
  const boltPos=[[-mw*.36,-180],[0,174],[mw*.36,-180]];
  for(let i=0;i<3;i++){
    const [bx,by]=boltPos[i];bolt(c,bx,by,s.bolts[i],t*(s.bolts[i]?0:3));
    if(!s.bolts[i])text(c,'✦',bx,by+44,23,C.gold);
  }
  // Printer limbs: accordion arms and overconfident feeder tray.
  for(let sign of [-1,1]){
    const x=sign*(mw*.5-6);line(c,x,-90,x+sign*60,-33,C.line,30);line(c,x,-90,x+sign*60,-33,'#d9a859',17);
    blob(c,x+sign*65,-20,25,C.dark);blob(c,x+sign*65,-20,14,C.gold);
  }
  c.restore();
  // Large narrative marker outside the mechanical silhouette.
  if(s.state==='victory')label(c,'WARRANTY VOID. MANAGEMENT NOTIFIED.',0,-240,565,52,'#f7c36b',C.night);
}
function action(c,s,w,t,opts){
  const compact=w<830;
  // Tossable packet, warm paper object with physical drop shadow.
  if(s.packet){
    c.save();c.globalAlpha=.25;rr(c,s.packet.x-67,s.packet.y+32,135,19,9);c.fillStyle='#040f13';c.fill();c.restore();
    paper(c,s.packet.x,s.packet.y,s.packet.w,s.packet.h,(s.packet.held?Math.sin(t*6)*.07:-.08),'COUNTER',C.gold);
    if(s.state==='counter'&&!s.packet.held){
      label(c,'DRAG / FLICK ↗',s.packet.x+8,s.packet.y-70,183,37,'#175c58','#fff3d5');
      c.save();c.strokeStyle='#ffdf8199';c.lineWidth=3;c.setLineDash([7,11]);c.beginPath();c.moveTo(s.packet.x+55,s.packet.y-31);c.quadraticCurveTo(-20,60,s.feederX,42);c.stroke();c.setLineDash([]);c.restore();
    }
  }
  if(s.projectile){const p=s.projectile;paper(c,p.x,p.y,113,64,Math.atan2(p.vy,p.vx)*.17,'COUNTER',C.gold);}
  if(s.state==='telegraph'){
    for(const p of s.waves){if(p.hit)continue;paper(c,p.x,p.y,92,58,p.angle,'URGENT',C.red);}
    label(c,'STAMP A SHEET · WIDER FEEDER',0,175,compact?365:425,49,'#a9453c','#fff4db');
    if(s.cycleParries>0)label(c,`PARRIED ${s.cycleParries} ✓`,0,227,180,35,'#1c7965',C.paper);
  }
  if(s.state==='counter'&&!s.adMoved){
    c.save();c.translate(s.adX,65);c.rotate(Math.sin(t*4)*.045);rr(c,-108,-76,216,152,11);c.fillStyle='#f7e9c5';c.fill();c.lineWidth=8;c.strokeStyle='#ac6545';c.stroke();
    text(c,'SPONSORED',0,-49,17,C.rust);text(c,'TONER NFT',0,-12,30,C.dark);text(c,'DRAG ME ASIDE  →',0,37,15,'#32685c');c.restore();
  }
  if(opts.hasMira&&s.state==='counter'&&!s.miraUsed){
    const x=Math.min(260,w*.35);blob(c,x,157,49,'#153b3a');blob(c,x,151,38,C.gold);blob(c,x-13,142,5,C.night);blob(c,x+13,142,5,C.night);
    c.beginPath();c.arc(x,155,19,.1,Math.PI-.1);stroke(c,C.night,4);
    label(c,'MIRA: HOLD?',x,220,171,38,'#2b806c',C.paper);
  }
  for(const p of s.particles){c.save();c.globalAlpha=Math.max(0,p.life);blob(c,p.x,p.y,p.r,C.gold);c.restore();}
  // Smoke comes from current printer state, not decoration at random positions.
  if(s.state==='jam'||s.state==='impact'){
    for(let i=0;i<7;i++){const y=-194-(t*31+i*28)%170;const x=130+Math.sin(t*1.4+i)*32;
      c.save();c.globalAlpha=Math.max(0,.15+(y+400)/350*.2);blob(c,x,y,15+(t*7+i*5)%20,'#f6eee0');c.restore();}
  }
  // One-line actionable instruction embedded in world, no opaque UI card.
  const boxW=Math.min(690,w*.92);label(c,s.hint,0,322,boxW,45,s.warning>0?'#924c43':'#123c40',C.paper);
  // State-specific contextual safety badge.
  if(s.state==='jam')label(c,opts.canPull?'SAFE WINDOW':'UNSAFE TO TUG',Math.min(w*.35,330),213,compact?128:190,35,opts.canPull?'#1e7e62':'#a45043',C.paper);
  if(s.state==='counter'&&opts.directive==='FAST_OR_SAFE')label(c,s.time<1.7?'FAST = NARROW':'SAFE = WIDE',Math.min(w*.35,320),-224,compact?130:192,37,'#9d513f',C.paper);
}
export function drawPrinterBoss(ctx,viewport,s,opts){
  const w=Number(viewport?.worldWidth)||1350,t=s.totalTime||0,compact=w<830;
  ctx.save();if(s.shake>0&&!viewport?.reducedMotion)ctx.translate(Math.sin(t*73)*s.shake*16,Math.cos(t*88)*s.shake*9);
  // Live title preview: actual animated boss isolated against the HD-family
  // coral paper panel, without leaking unstarted gameplay HUD/affordances.
  if(viewport?.posterPreview){
    ctx.fillStyle='#c14c3c';ctx.fillRect(-w/2,-380,w,760);
    machine(ctx,s,w,t);ctx.restore();return;
  }
  worldBackground(ctx,w,t,compact);
  machine(ctx,{...s,knowsCable:opts.knowsCable,canPull:opts.canPull},w,t);
  action(ctx,s,w,t,opts);
  if(s.flash>0){ctx.save();ctx.globalAlpha=s.flash*.85;ctx.fillStyle=C.gold;ctx.fillRect(-w/2,-380,w,760);ctx.restore();}
  ctx.restore();
}
