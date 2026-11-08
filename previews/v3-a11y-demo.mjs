import { createAssistiveControls, assistedHitPoint } from '../night-shift-v3/accessibility/controls.mjs';
const canvas=document.getElementById('stage'),g=canvas.getContext('2d');
const $=s=>document.querySelector(s);
const hud=$('#hud'), heartsUI=$('#hearts'), timeUI=$('#timer'), commandUI=$('#imperative'), feedbackUI=$('#feedback');
const WHEIGHT=760, TAU=Math.PI*2;
const vp={cssWidth:innerWidth,cssHeight:innerHeight,dpr:1,worldWidth:1351,worldHeight:760,safeRect:{left:40,top:115,right:1311,bottom:700},worldToScreen(x,y){return {x:x*this.cssHeight/WHEIGHT,y:y*this.cssHeight/WHEIGHT}},screenToWorld(x,y){return {x:x*WHEIGHT/this.cssHeight,y:y*WHEIGHT/this.cssHeight}}};
const state={status:'title',stage:0,hearts:3,remaining:18,feedback:'',feedbackT:0,transition:0,failed:0,completed:[],hold:0,grab:null,folder:null,practice:false,paused:false,manualPaused:false,accessibilityPaused:false,settings:{},pointer:null,pts:0};
const stageNames=['STAMP GOOD!','FILE THE EVIDENCE!','HOLD TO CLOCK OUT!'];
const cx=()=>vp.worldWidth/2;
const pos=()=>{const c=cx(),r=vp.worldWidth<750?125:235;return {good:{x:c+Math.min(124,r*.5),y:426},spam:{x:c-Math.min(144,r*.6),y:413},folder:{x:c-r,y:460},tray:{x:c+r,y:460},lever:{x:c,y:460}};};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function resize(){const rect=canvas.getBoundingClientRect();vp.cssWidth=rect.width;vp.cssHeight=rect.height;vp.dpr=devicePixelRatio||1;vp.worldWidth=WHEIGHT*rect.width/rect.height;vp.safeRect={left:Math.min(32,vp.worldWidth*.04),right:vp.worldWidth-Math.min(32,vp.worldWidth*.04),top:115,bottom:707};canvas.width=Math.round(rect.width*vp.dpr);canvas.height=Math.round(rect.height*vp.dpr);g.setTransform(canvas.width/vp.worldWidth,0,0,canvas.height/WHEIGHT,0,0);a11y?.refresh();}
function resetStage(){state.remaining=state.practice?30:18;state.transition=0;state.feedback='';state.hold=0;state.grab=null;state.folder={...pos().folder};updateHUD();a11y?.refresh();}
function begin(){state.status='play';state.stage=0;state.hearts=3;state.failed=0;state.completed=[];state.practice=!!state.settings.preferPractice;$('#launch').hidden=true;hud.classList.add('show');resetStage();}
function finish(){state.status='victory';state.feedback='CLOCKED OUT!';state.feedbackT=6;updateHUD();a11y?.refresh();}
function advance(){if(state.transition || state.status!=='play')return;state.completed.push(stageNames[state.stage]);state.feedback=['APPROVED!','EVIDENCE SAVED!','YOU MAY LEAVE!'][state.stage];state.feedbackT=1.2;state.transition=1.2;a11y?.refresh();}
function mistake(text){if(state.transition || state.status!=='play')return;state.failed++;state.hearts=Math.max(0,state.hearts-1);state.feedback=text;state.feedbackT=.9;if(!state.hearts){state.status='gameover';state.feedback='TRY A NEW SHIFT';state.feedbackT=999;$('#start').textContent='TRY AGAIN';$('#launch').hidden=false;hud.classList.remove('show');}else resetTimerWithoutReward();updateHUD();}
function resetTimerWithoutReward(){state.remaining=state.practice?30:18;state.grab=null;state.hold=0;state.folder={...pos().folder};}
function updateHUD(){heartsUI.textContent='♥ '.repeat(state.hearts).trim();timeUI.textContent=state.remaining.toFixed(1)+'s';commandUI.textContent=state.status==='victory'?'SHIFT COMPLETE':stageNames[state.stage];feedbackUI.textContent=state.feedback;}
function targets(){if(state.status!=='play'||state.transition)return[];const p=pos();if(state.stage===0)return[
 {id:'form-good',label:'SIGNED FORM',kind:'tap',x:p.good.x,y:p.good.y,radius:85},
 {id:'form-spam',label:'UNSIGNED SPAM',kind:'tap',x:p.spam.x,y:p.spam.y,radius:85}];
 if(state.stage===1)return[{id:'file',label:'EVIDENCE FOLDER',kind:'drag',x:state.folder.x,y:state.folder.y,radius:76}];
 return [{id:'lever',label:'CLOCK-OUT LEVER',kind:'hold',x:p.lever.x,y:p.lever.y,radius:90}];}
function down({x,y,id,kind}){if(state.status!=='play'||state.transition||state.paused)return;const p={x,y},q=pos();state.pointer=id;
 if(state.stage===0){if(distance(p,q.good)<86){state.pts++;advance();}else if(distance(p,q.spam)<85)mistake('SCAM APPROVED!');}
 else if(state.stage===1){if(distance(p,state.folder)<75){state.grab={id,dx:x-state.folder.x,dy:y-state.folder.y};}}
 else if(state.stage===2){if(distance(p,q.lever)<92){state.hold=0;state.grab={id,kind:'hold'};}}
}
function move({x,y,id}){if(state.paused||state.transition||!state.grab||state.grab.id!==id)return;if(state.stage===1){state.folder.x=Math.min(vp.safeRect.right,Math.max(vp.safeRect.left,x-state.grab.dx));state.folder.y=Math.min(670,Math.max(230,y-state.grab.dy));}}
function up({x,y,id}){if(state.pointer!==id||state.paused)return;if(state.stage===1&&state.grab?.id===id){move({x,y,id});if(distance(state.folder,pos().tray)<99){advance();}else{state.folder={...pos().folder};state.feedback='ALMOST. TRY THE IN TRAY.';state.feedbackT=.9;}}state.grab=null;state.pointer=null;}
function cancel(){state.grab=null;state.pointer=null;state.hold=0;if(state.stage===1)state.folder={...pos().folder};}
const scene={pointerDown:down,pointerMove:move,pointerUp:up,cancelPointer:cancel};
const a11y=createAssistiveControls({root:document.body,getViewport:()=>vp,getTargets:targets,
 dispatch:({phase,x,y,id,kind})=>scene[phase]?.({x,y,id,kind}),
 onPause:paused=>{state.accessibilityPaused=paused;state.paused=state.manualPaused||paused;},
 onSettingsChange:settings=>{state.settings=settings;$('#mode').textContent=settings.preferPractice?'PRACTICE SHIFT SELECTED FOR NEXT CLOCK-IN':'STANDARD SHIFT · PRACTICE AVAILABLE IN OPTIONS';},
});
$('#start').addEventListener('click',begin);
window.addEventListener('resize',resize);
window.addEventListener('blur',()=>cancel());
canvas.addEventListener('pointerdown',e=>{if(state.status!=='play')return;canvas.setPointerCapture(e.pointerId);const b=canvas.getBoundingClientRect();const p=vp.screenToWorld(e.clientX-b.left,e.clientY-b.top);const near=assistedHitPoint(p,targets(),{enabled:state.settings.largeTargets,radius:18});scene.pointerDown({...near,id:e.pointerId,kind:e.pointerType});});
canvas.addEventListener('pointermove',e=>{if(!state.grab)return;const b=canvas.getBoundingClientRect();scene.pointerMove({...vp.screenToWorld(e.clientX-b.left,e.clientY-b.top),id:e.pointerId,kind:e.pointerType});});
canvas.addEventListener('pointerup',e=>{const b=canvas.getBoundingClientRect();scene.pointerUp({...vp.screenToWorld(e.clientX-b.left,e.clientY-b.top),id:e.pointerId,kind:e.pointerType});});
canvas.addEventListener('pointercancel',cancel);
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.status==='play'&&!a11y.state.open){if(a11y.state.held)return;state.manualPaused=!state.manualPaused;state.paused=state.manualPaused||state.accessibilityPaused;state.feedback=state.paused?'PAUSED':'BACK TO WORK';state.feedbackT=.8;updateHUD();}});
window.__nightShiftA11yPreview={snapshot:()=>({...state,folder:state.folder&&{...state.folder},settings:{...state.settings},a11y:a11y.state,viewport:{...vp}}),assist:a11y,getScene:()=>scene};
function rect(x,y,w,h,fill,rad=0){g.fillStyle=fill;g.beginPath();g.roundRect(x,y,w,h,rad);g.fill();}
function line(x,y,xx,yy,color,width=2){g.strokeStyle=color;g.lineWidth=width;g.beginPath();g.moveTo(x,y);g.lineTo(xx,yy);g.stroke();}
function ellipse(x,y,rx,ry,c){g.fillStyle=c;g.beginPath();g.ellipse(x,y,rx,ry,0,0,TAU);g.fill();}
function text(s,x,y,size,color,align='center',font='Impact, Arial Narrow, Arial'){g.fillStyle=color;g.textAlign=align;g.font=`900 ${size}px ${font}`;g.fillText(s,x,y);}
function background(t){const w=vp.worldWidth,c=cx();const grad=g.createLinearGradient(0,0,0,760);grad.addColorStop(0,'#071d26');grad.addColorStop(.55,'#1f4550');grad.addColorStop(1,'#3c3a35');g.fillStyle=grad;g.fillRect(0,0,w,760);
 // Environment is extended, not letterboxed, on any aspect ratio.
 for(let i=-2;i<Math.ceil(w/170)+2;i++){let x=i*170+30;rect(x,0,117,365,i%2?'#1f4854':'#20434b',0);rect(x+9,0,99,300,'#1a333d',0);line(x+18,50,x+18,290,'#c4aa6955',3);line(x+96,50,x+96,290,'#c4aa6955',3);}
 rect(0,350,w,15,'#c08d54');rect(0,365,w,7,'#483531');
 for(let i=0;i<Math.ceil(w/140)+1;i++)line(i*140,375,i*140-70,760,'#725e4a44',3);
 const spot=g.createRadialGradient(c,280,20,c,330,570);spot.addColorStop(0,'#f1d39c3d');spot.addColorStop(1,'#f1d39c00');g.fillStyle=spot;g.fillRect(0,0,w,760);
 rect(c-520,563,1040,215,'#111e23',35);rect(c-550,552,1100,46,'#9f7047',12);rect(c-550,546,1100,13,'#edbe75',8);rect(c-510,602,1020,20,'#5a3c31',3);
 // Overhead lamp.
 line(c,0,c,86,'#141d24',6);ellipse(c,105,126,21,'#c8a564');ellipse(c,122,96,6,'#ffe9b6');
 for(let i=0;i<9;i++){let x=c-350+i*87;ellipse(x,550+(state.settings.reducedMotion?0:Math.sin(t+i)*3),8,3,'#f7d9a822');}
 // Backstage silhouettes.
 character(c-410,285,'#74d4b3',t,true);character(c+405,288,'#f7af75',t,false);
}
function character(x,y,color,t,isMira){const bounded=Math.max(68,Math.min(vp.worldWidth/2-90,390));x=cx()+(x<cx()?-bounded:bounded);g.save();g.translate(x,y);const bob=(state.settings.reducedMotion?0:Math.sin(t*1.2+(isMira?0:2))*4);g.translate(0,bob);ellipse(0,148,69,14,'#07151b85');rect(-51,43,103,119,isMira?'#26556a':'#724a3f',28);rect(-34,50,68,80,color,19);ellipse(0,0,60,69,isMira?'#d1ad89':'#c6ab8d');ellipse(-20,-7,8,10,'#132c33');ellipse(20,-7,8,10,'#132c33');ellipse(-20,-10,2,2,'white');ellipse(20,-10,2,2,'white');line(-18,29,18,29,isMira?'#38575a':'#6c3e3a',4);
 if(isMira){rect(-58,-60,114,25,'#183e54',14);rect(-41,-80,82,36,'#1e5871',9);if(vp.worldWidth>=800)text('MIRA',0,-93,16,'#ace8ce');}
 else{rect(-54,-59,108,19,'#2b3434',8);rect(-29,-76,61,30,'#333f41',8);if(vp.worldWidth>=800)text('FINCH',0,-93,16,'#ffd79a');}
 g.restore();}
function drawStamp(t){const p=pos(),c=cx();ellipse(c,506,330,65,'#080e12a8');
 for(const [obj,good] of [[p.spam,false],[p.good,true]]){g.save();g.translate(obj.x,obj.y);g.rotate((good?-.055:.08));rect(-95,-118,190,235,good?'#f5ecce':'#c3c6bb',9);rect(-79,-104,158,16,good?'#337a66':'#a84647');text(good?'APPROVED':'SPONSORED',0,-73,good?20:16,good?'#2f6151':'#9c3e3c');for(let j=0;j<4;j++)rect(-70,-30+j*26,140-(j%2)*26,6,'#23383b50',2);text(good?'✓':'×',0,69,90,good?'#247a60':'#c44d48');g.restore();}
 if(!state.settings.reducedMotion){const x=p.good.x,y=p.good.y-172+Math.sin(t*5)*8;ellipse(x,y,70,11,'#f5bc65a6');rect(x-14,y-110,28,94,'#874e32',10);rect(x-54,y-35,108,38,'#f4bb5a',10);}
 if(!state.feedback)text('ONE IS APPROVED. ONE IS A TRAP.',c,205,vp.worldWidth<800?18:26,'#ffdd9c');}
function drawFile(t){const p=pos(),c=cx(),f=state.folder;ellipse(c,509,440,70,'#080e12a8');
 rect(p.tray.x-132,404,264,140,'#c8904b',22);rect(p.tray.x-117,419,234,110,'#1a4850',14);rect(p.tray.x-90,431,180,12,'#fee4a5',4);text('IN',p.tray.x,501,54,'#ffe4a7');
 g.save();g.translate(f.x,f.y);g.rotate(state.settings.reducedMotion?0:state.grab?-.1:Math.sin(t)*.015);rect(-92,-94,184,190,'#e9bd69',13);rect(-92,-94,95,30,'#f8d68d',8);rect(-80,-56,160,133,'#f6eedc',5);text('MIRA',0,-15,26,'#28566a');text('EVIDENCE',0,23,23,'#28566a');rect(-53,46,106,7,'#71aa9d',3);g.restore();
 if(!state.feedback)text('MOVE THE FOLDER INTO THE TRAY',c,208,vp.worldWidth<800?18:27,'#ffdd9c');}
function drawHold(t){const p=pos(),c=cx();ellipse(c,526,260,45,'#0812199c');rect(c-200,354,400,218,'#9e6b4b',27);rect(c-166,386,332,165,'#f0c77a',18);ellipse(c,466,122,83,'#4f453d');ellipse(c,458,111,72,'#b94f43');ellipse(c,449,87,53,'#e2b86e');rect(c-70,426,140,54,'#173e47',11);text('OUT',c,462,38,'#fff2bf');
 const progress=state.grab?.kind==='hold'?Math.min(1,state.hold/.85):0;g.lineWidth=18;g.strokeStyle='#19414b';g.beginPath();g.arc(c,460,119,-Math.PI/2,1.5*Math.PI);g.stroke();g.strokeStyle='#8de1bc';g.beginPath();g.arc(c,460,119,-Math.PI/2,-Math.PI/2+progress*TAU);g.stroke();if(!state.feedback)text('HOLD UNTIL THE RING FILLS',c,208,vp.worldWidth<800?18:27,'#ffdd9c');}
function drawContrastTargets(){if(!state.settings.highContrast||state.status!=='play'||state.transition)return;const ts=targets();g.save();for(const t of ts){g.strokeStyle='#0a2028';g.lineWidth=8;g.setLineDash([]);g.beginPath();g.arc(t.x,t.y,Math.min(110,(t.radius||50)+8),0,TAU);g.stroke();g.strokeStyle='#fff9d3';g.lineWidth=4;g.setLineDash([12,9]);g.beginPath();g.arc(t.x,t.y,Math.min(110,(t.radius||50)+8),0,TAU);g.stroke();}g.restore();}
function drawResult(){const c=cx(),rw=Math.min(620,vp.worldWidth-26);ellipse(c,450,390,120,'#070e10a2');rect(c-rw/2,256,rw,345,'#f0e6d1',16);rect(c-rw/2,256,rw,70,'#246658',13);text('FINAL RECEIPT',c,307,42,'#fff4d5');text('3 MANUAL ACTIONS',c,399,33,'#254c50');text('0 AUTOMATIC WINS',c,449,29,'#29665c');text(`${state.failed} ERRORS · ${state.practice?'PRACTICE':'STANDARD'}`,c,506,25,'#a15a41');text('YOUR SHIFT IS COMPLETE',c,562,28,'#235e4d');}
let last=performance.now(),seconds=0;
function frame(now){let dt=Math.min(.04,(now-last)/1000||0);last=now;if(!state.paused&&!document.hidden){seconds+=dt;if(state.status==='play'){if(state.transition){state.transition=Math.max(0,state.transition-dt);if(!state.transition){if(state.stage===2)finish();else{state.stage++;resetStage();}}}else{state.remaining=Math.max(0,state.remaining-dt);if(state.grab?.kind==='hold'){state.hold+=dt;if(state.hold>=.85){state.grab=null;state.pointer=null;advance();}}if(state.remaining===0)mistake('OVERTIME DENIED!');}if(state.feedbackT>0){state.feedbackT=Math.max(0,state.feedbackT-dt);if(!state.feedbackT&&state.status==='play')state.feedback='';}updateHUD();}}g.setTransform(canvas.width/vp.worldWidth,0,0,canvas.height/WHEIGHT,0,0);background(seconds);if(state.status==='victory')drawResult();else if(state.stage===0||state.status==='title')drawStamp(seconds);else if(state.stage===1)drawFile(seconds);else drawHold(seconds);drawContrastTargets();requestAnimationFrame(frame);}
resize();requestAnimationFrame(frame);