// LEAD-owned HD-derived poster, transitions, and temporary first-card boot scene.
// Original HD palette and baked animated characters are reused from arcade-office-hd.html,
// which remains intact as an independent, fallback playable game.
const INK='#17292b',PAPER='#f1ebdf',RED='#b94b36',MINT='#39c59f',GOLD='#f0bc55';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const rect=(g,x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(x,y,w,h)};
function label(g,s,x,y,size,color=INK,align='left',font='Impact,Arial Narrow,Arial,sans-serif'){
 g.fillStyle=color;g.textAlign=align;g.font='900 '+size+'px '+font;g.fillText(s,x,y);
}
function posterHeadline(g,s,x,y,size,color,stretch=1){g.save();g.translate(x,y);g.scale(stretch,1);g.fillStyle=color;g.textAlign='left';g.textBaseline='middle';g.font='900 '+size+'px Trebuchet MS,Arial,sans-serif';g.fillText(s,0,0);g.restore();}
function hatch(g,x,y,w,h,color='#20333419',space=24){
 g.save();g.beginPath();g.rect(x,y,w,h);g.clip();g.strokeStyle=color;g.lineWidth=1.3;
 for(let i=-h;i<w+h;i+=space){g.beginPath();g.moveTo(x+i,y);g.lineTo(x+i+h,y+h);g.stroke()}g.restore();
}
function blit(g,art,row,frame,x,y,w,h){
 if(!art?.complete||!art?.naturalWidth)return false;
 g.drawImage(art,(frame%4)*512,row*512,512,512,x,y,w,h);return true;
}
function panel(g,x,y,w,h,bg,border=INK){
 g.save();g.fillStyle='#06121344';g.fillRect(x+6,y+8,w,h);
 g.fillStyle=bg;g.fillRect(x,y,w,h);
 if(border){g.strokeStyle=border;g.lineWidth=3;g.strokeRect(x+1.5,y+1.5,w-3,h-3)}g.restore();
}
function jitter(g,t,amount=3){g.translate(Math.sin(t*9)*amount,Math.cos(t*7)*amount)}
function paper(g,x,y,w,h,color=PAPER){
 g.save();g.fillStyle='#020f153b';g.fillRect(x+8,y+12,w,h);
 g.fillStyle=color;g.fillRect(x,y,w,h);g.strokeStyle='#152a2a';g.lineWidth=3;g.strokeRect(x,y,w,h);
 rect(g,x+17,y+22,w*.54,9,'#2a48474d');
 rect(g,x+17,y+41,w*.70,5,'#2a484733');
 rect(g,x+17,y+54,w*.64,5,'#2a484733');g.restore();
}
export function drawPoster(g,v,art,t){
 const w=v.worldWidth,h=v.worldHeight,portrait=w<770,split=portrait?0:w*.58;
 rect(g,0,0,w,h,PAPER);
 if(!portrait){
   rect(g,split,0,w-split,h,RED);
   hatch(g,0,0,split,h,'#173c3911');hatch(g,split,0,w-split,h,'#10232332',20);
   rect(g,0,0,w,14,INK);
   const left=Math.max(38,Math.min(72,w*.04)),fz=Math.min(155,split*.213);
   label(g,'OFFICE HOURS / INTERACTIVE DAMAGE REPORT',left,80,17,'#426a62');
   posterHeadline(g,'QUOTA',left-8,270,fz,INK,clamp(split/783,1,1.4));
   posterHeadline(g,'PANIC',left-8,412,fz*1.08,RED,clamp(split/783,1,1.4));
   rect(g,left,429,split-left-42,4,'#28544b');
   label(g,'A BAD NIGHT FOR PRODUCTIVITY.',left,502,clamp(split*.040,20,30),INK);
   label(g,'TWELVE DISASTERS. FIVE PROMOTIONS. ONE MONSTER.',left,547,15,'#55746c');
   label(g,'CLICK  ·  DRAG  ·  DODGE  /  M MUTE  /  ESC PAUSE',left,714,16,'#55746c');
   if(!blit(g,art,2,Math.floor(t*5)%4,split+Math.max(16,(w-split-485)/2),80,475,480)){
     panel(g,split+70,160,370,360,'#30464a');
     label(g,'REJECTED',split+245,345,58,PAPER,'center');
   }
   g.save();g.translate(split+70,480);jitter(g,t,2);
   blit(g,art,0,Math.floor(t*6)%4,0,0,210,255);g.restore();
   g.save();g.translate(w-350,594);g.rotate(-.095);panel(g,0,0,320,72,INK,null);
   label(g,'YOUR METRICS ARE FINE.',160,46,26,PAPER,'center');g.restore();
 }else{
   rect(g,0,430,w,330,RED);hatch(g,0,0,w,430,'#17443f0f');hatch(g,0,430,w,330,'#17202025',22);
   rect(g,0,0,w,13,INK);
   label(g,'OFFICE HOURS / DAMAGE REPORT',30,50,16,'#426a62');
   const f=Math.min(111,w*.185);
   posterHeadline(g,'QUOTA',22,176,f,INK);
   posterHeadline(g,'PANIC',22,274,f*1.05,RED);
   rect(g,30,288,w-60,4,'#28544b');
   label(g,'A BAD NIGHT FOR PRODUCTIVITY.',30,399,22,INK);
   label(g,'12 DISASTERS  /  5 PROMOTIONS  /  2 BOSSES',30,420,12,'#55746c');
   blit(g,art,2,Math.floor(t*5)%4,w*.47,436,w*.53,305);
   blit(g,art,0,Math.floor(t*6)%4,w*.03,497,195,229);
   panel(g,0,725,w,35,INK,null);label(g,'CLICK  ·  DRAG  ·  DODGE',w/2,749,16,PAPER,'center');
 }
}
export function drawOffice(g,v,art,t){
 const w=v.worldWidth,h=v.worldHeight,center=w/2,portrait=w<770;
 rect(g,0,0,w,h,'#1c3335');
 // Physical theatrical set: architectural layers extend to every viewport edge.
 rect(g,0,0,w,127,'#0b1d20');hatch(g,0,0,w,h,'#b1d1ae0b',22);
 g.save();g.globalAlpha=.24;g.fillStyle='#d4a347';
 g.beginPath();g.moveTo(0,0);g.lineTo(w*.35,0);g.lineTo(w*.73,h);g.lineTo(w*.36,h);g.fill();g.restore();
 for(let i=0;i<9;i++){rect(g,(i*w/8)|0,155,3,h-155,'#91c6ba0d');}
 rect(g,0,664,w,96,'#ae957357');rect(g,0,665,w,13,'#d8ba7c58');
 for(let x=-20;x<w;x+=152){rect(g,x,721,94,8,'#0a242a69')}
 rect(g,0,130,w,5,'#9eac9a35');
 // Props remain at the edges; action is intentionally foreground and central.
 const left=portrait?-110:Math.max(-25,center-665);
 const right=portrait?w-140:Math.min(w-265,center+425);
 g.save();g.globalAlpha=portrait?.44:.67;
 blit(g,art,0,Math.floor(t*4)%4,left,310,240,310);
 blit(g,art,2,Math.floor(t*7)%4,right,280,265,330);g.restore();
 g.save();g.globalAlpha=.09;label(g,'01',w-24,h-11,205,PAPER,'right');g.restore();
 if(!portrait){label(g,'QUOTA PANIC / INTAKE',36,169,16,'#acc4b5');label(g,'YOUR PRODUCTIVITY IS BEING OBSERVED',w-36,169,16,'#acc4b5','right')}
}
function drawDocument(g,ob,t,portrait){
 const {x,y,w,h,good,hit,tilt}=ob;
 g.save();g.translate(x,y);g.rotate(tilt+Math.sin(t*1.9+ob.slot)*.021);
 const squash=hit?Math.max(.16,1-hit*.9):1;g.scale(1,squash);
 const xx=-w/2,yy=-h/2;
 g.fillStyle='#051e234e';g.fillRect(xx+9,yy+14,w,h);
 g.fillStyle=good?'#f7f1e5':'#f2ddc9';g.fillRect(xx,yy,w,h);
 g.lineWidth=4;g.strokeStyle='#203a3b';g.strokeRect(xx,yy,w,h);
 rect(g,xx,yy,w,13,good?'#3fa784':'#c44d3c');
 rect(g,xx+16,yy+25,w*.44,8,'#305753a1');
 rect(g,xx+16,yy+41,w*.69,5,'#30575352');
 label(g,good?'OFFICIAL':'SPONSORED',xx+17,yy+72,clamp(w*.095,12,19),good?'#2a755e':'#ab3b31');
 const iconY=yy+h*.62;
 if(good){
  g.strokeStyle='#178d6a';g.lineWidth=13;g.lineCap='round';g.beginPath();g.moveTo(-37,iconY);g.lineTo(-12,iconY+24);g.lineTo(40,iconY-42);g.stroke();
 }else{
  g.strokeStyle='#c84f40';g.lineWidth=11;g.lineCap='round';g.beginPath();g.moveTo(-35,iconY-35);g.lineTo(36,iconY+34);g.moveTo(35,iconY-35);g.lineTo(-36,iconY+34);g.stroke();
 }
 rect(g,xx+13,yy+h-48,w-26,2,good?'#478b757c':'#b76d5b66');
 label(g,good?'MIRA / VERIFIED':'FREE QUOTA BOOST',0,yy+h-22,clamp(w*.086,11,15),good?'#447c6b':'#b54d41','center');
 if(hit){
   g.save();g.globalAlpha=Math.min(1,hit*1.4);g.rotate(-.12);
   g.strokeStyle=good?'#2f9b77':'#c04c3c';g.lineWidth=8;g.strokeRect(xx+9,yy+h*.27,w-18,h*.32);
   label(g,good?'APPROVED!':'DENIED!',0,yy+h*.52,clamp(w*.145,18,33),good?'#17724c':'#b5312c','center');
   g.restore();
 }
 g.restore();
}
export function createFallbackStampScene(ctx){
 // Fallback is deliberately confined to LEAD and replaced by INTAKE's authored I1.
 const state={phase:0,confirmed:0,badHits:0,attemptId:'lead-i1-demo-1',clock:0,flash:0,text:'',textTime:0,objects:[],done:false};
 const v=ctx.viewport;const goodsPerWave=2;const required=4;
 function spawn(){
   const w=v.worldWidth,portrait=w<770;
   const xs=portrait?[w*.25,w*.75,w*.49]:[w/2-248,w/2,w/2+248];
   const ys=portrait?[319,329,540]:[417,395,417];
   const fw=portrait?Math.min(164,w*.265):209;
   const fh=portrait?188:263;
   state.objects=[0,1,2].map(i=>({id:state.phase+':'+i,slot:i,x:xs[i],y:ys[i],w:fw,h:fh,
     good:i!==((state.phase+1)%3),hit:0,tilt:[-.065,.03,.075][i]}));
 }
 function reset(){state.phase=0;state.confirmed=0;state.badHits=0;state.clock=0;state.done=false;spawn()}
 function onPoint(p){
   if(state.done)return;
   const match=[...state.objects].reverse().find(o=>!o.hit && Math.abs(p.x-o.x)<o.w*.52 && Math.abs(p.y-o.y)<o.h*.52);
   if(!match){ctx.audio?.play?.('miss');return;}
   match.hit=.9;state.flash=.19;
   if(match.good){
     state.confirmed++;state.text='APPROVED  +1';ctx.audio?.play?.('stamp');
     if(state.confirmed>=required){state.done=true;state.text='PERFECT PAPERWORK!';
       ctx.events.emit({type:'card-complete',cardId:'I1',attemptId:state.attemptId,outcome:'cleared',
         evidence:{approved:state.confirmed,scamsClicked:state.badHits,synthetic:false}});}
   }else {state.badHits++;state.text='THAT WAS AN AD!';ctx.onPenalty?.();}
   state.textTime=.8;
 }
 return {
   enter:reset,
   update(dt){
     state.clock+=dt;state.textTime=Math.max(0,state.textTime-dt);state.flash=Math.max(0,state.flash-dt);
     for(const o of state.objects)o.hit=Math.max(0,o.hit-dt*1.5);
     if(!state.done&&state.confirmed>=goodsPerWave*(state.phase+1)){
       state.phase++;if(state.phase<=1)spawn();
     }
   },
   draw(g,view,art){
     const w=view.worldWidth,portrait=w<770;
     drawOffice(g,view,art,state.clock);
     const x=w/2;
     // World-space action furniture; active papers form the stage rather than disappearing into empty space.
     panel(g,portrait?12:x-431,portrait?175:155,portrait?w-24:862,portrait?47:52,'#e4d9bd');
     label(g,'STAMP THE GREEN FORMS.  IGNORE THE SCAM.',x,portrait?206:191,portrait?17:24,INK,'center');
     for(const o of state.objects)drawDocument(g,o,state.clock,portrait);
     if(state.textTime>0){
       g.save();g.globalAlpha=clamp(state.textTime*2,0,1);
       label(g,state.text,x,portrait?669:625,portrait?27:47,state.text.startsWith('THAT')?'#f6ab8c':'#f8d982','center');g.restore();
     }
     const pct=state.confirmed/required;
     rect(g,Math.max(18,x-270),portrait?690:629,Math.min(w-36,540),13,'#102b2a');
     rect(g,Math.max(18,x-270),portrait?690:629,Math.min(w-36,540)*pct,13,MINT);
     if(state.flash>0){g.fillStyle='rgba(255,247,205,'+(state.flash*.45)+')';g.fillRect(0,0,w,760)}
   },
   pointerDown:onPoint,pointerMove(){},pointerUp(){},cancelPointer(){},dispose(){},
   snapshot(){return {targets:state.objects.filter(o=>!o.hit).map(o=>{const p=v.worldToScreen(o.x,o.y);return {id:o.id,kind:o.good?'good':'spam',x:p.x,y:p.y}}),approved:state.confirmed,badHits:state.badHits,phase:state.phase}}
 };
}
export function drawRecover(g,v,art,t){
 drawOffice(g,v,art,t);const w=v.worldWidth,c=w/2,box=Math.min(820,w-46);
 panel(g,c-box/2,160,box,430,PAPER);
 label(g,'MISFILED.',c,301,clamp(box*.12,49,90),INK,'center');
 label(g,'THE RECRUITER HAS REQUESTED A RETAKE.',c,354,clamp(box*.027,14,23),RED,'center');
 label(g,'RETRY THIS ROUND · PRESS ENTER OR CLICK',c,477,clamp(box*.027,16,23),INK,'center');
}
export function drawPreviewEnd(g,v,art,t,perk){
 drawOffice(g,v,art,t);const w=v.worldWidth,c=w/2,box=Math.min(900,w-42);
 panel(g,c-box/2,145,box,500,PAPER);
 label(g,'PROMOTED.',c,275,clamp(box*.13,56,110),INK,'center');
 label(g,'YOUR UPGRADE: '+String(perk||'UNASSIGNED').replaceAll('-',' ').toUpperCase(),c,336,clamp(box*.032,17,29),RED,'center');
 label(g,'HD SHELL PREVIEW COMPLETE',c,429,clamp(box*.042,24,35),INK,'center');
 label(g,'Full 12-card campaign + 2 bosses integrate from other lanes.',c,469,clamp(box*.026,13,19),'#4f736a','center','Arial,sans-serif');
 label(g,'PRESS ENTER TO REPLAY THIS VERIFIED FIRST-CARD ROUTE',c,572,clamp(box*.022,13,19),INK,'center');
}