/** QUOTA PANIC: NIGHT SHIFT v3 / Services microgames.
 * Native Canvas2D ES module.  No global state, no DOM dependency and no score mutation.
 * Scene coordinates: centered 1200 x 760 stage, WORLD (not screen) pixels.
 * Caller supplies viewport.screenToWorld and invokes draw in world coordinates.
 */
const P={ink:'#102831',dark:'#071a25',cream:'#f5ebcf',paper:'#fff3dc',teal:'#35bda7',gold:'#fac55c',red:'#ed6657',blue:'#5da7bd',light:'#aee5d7'};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const ease=(x)=>{x=clamp(x,0,1);return x*x*(3-2*x)};
const hypot=(a,b)=>Math.hypot(a,b);
const between=(x,a,b)=>x>=a&&x<=b;
const hit=(p,x,y,w,h)=>Math.abs(p.x-x)<=w/2&&Math.abs(p.y-y)<=h/2;
function rnd(ctx){return typeof ctx.rng==='function'?ctx.rng():0.43}
function viewportWidth(ctx){return ctx.viewport?.worldWidth||1200}
function span(ctx){return clamp((viewportWidth(ctx)-100)*0.5,180,475)}
function xAt(ctx,t){return 600+span(ctx)*t}
function feedback(ctx,id){ctx.audio?.play?.(id);ctx.events?.emit?.({type:'scene-sfx',cardId:ctx.cardId,kind:id})}
function rectangle(c,x,y,w,h,fill,r=8,stroke=null,lw=3){c.beginPath();c.roundRect(x-w/2,y-h/2,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.lineWidth=lw;c.strokeStyle=stroke;c.stroke()}}
function circle(c,x,y,r,fill,stroke=null,lw=3){c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke()}}
function line(c,x1,y1,x2,y2,color,w=5){c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=w;c.lineCap='round';c.stroke()}
function label(c,s,x,y,px=20,color=P.cream,align='center'){c.font=`900 ${px}px Impact,'Arial Narrow',sans-serif`;c.fillStyle=color;c.textAlign=align;c.textBaseline='middle';c.fillText(s,x,y)}
function tag(c,s,x,y,w=P.cream.length*20,fill=P.ink,fg=P.cream){rectangle(c,x,y,w,34,fill,8);label(c,s,x,y+1,17,fg)}
function strokeText(c,s,x,y,size=44,color=P.cream){c.font=`900 ${size}px Impact,'Arial Narrow',sans-serif`;c.textAlign='center';c.textBaseline='middle';c.lineWidth=9;c.strokeStyle=P.ink;c.strokeText(s,x,y);c.fillStyle=color;c.fillText(s,x,y)}
function shadow(c,x,y,w=100){c.save();c.scale(1,.28);c.beginPath();c.ellipse(x,y*3.55,w,34,0,0,Math.PI*2);c.fillStyle='#06212c55';c.fill();c.restore()}
function sparkle(c,x,y,t,n=4){for(let i=0;i<n;i++){const a=t*2+i*Math.PI*2/n,r=15+10*Math.sin(t*5+i);line(c,x+Math.cos(a)*(r-5),y+Math.sin(a)*(r-5),x+Math.cos(a)*(r+5),y+Math.sin(a)*(r+5),i%2?P.gold:P.light,3)}}
function speech(c,text,x,y,w=220){rectangle(c,x,y,w,56,P.paper,13,P.ink,4);label(c,text,x,y+2,17,P.ink);c.fillStyle=P.paper;c.beginPath();c.moveTo(x-18,y+29);c.lineTo(x-7,y+45);c.lineTo(x+7,y+29);c.fill()}
function sceneBackdrop(c,ctx,t,variant){const width=viewportWidth(ctx),left=600-width/2;
 const grd=c.createLinearGradient(0,0,0,760);grd.addColorStop(0,variant==='coffee'?'#1d4652':variant==='cable'?'#283851':'#1d3944');grd.addColorStop(1,P.dark);c.fillStyle=grd;c.fillRect(left,0,width,760);
 for(let x=left-100;x<left+width+200;x+=210){let k=(Math.round(x/210)%4+4)%4;rectangle(c,x,214,140,305,k===0?'#274a52':'#20444c',5,'#385861',2);rectangle(c,x,212,110,267,'#1b3741',3);line(c,x-45,115,x+45,115,'#456873',3)}
 for(let x=left-50;x<left+width+200;x+=86){line(c,x,0,x-95,440,'#ffffff08',2)}
 rectangle(c,600,675,width+100,170,'#315962',0,P.ink,10);rectangle(c,600,612,width+100,35,'#bb8469',0,P.ink,8);
 for(let x=left-120;x<left+width+120;x+=165){line(c,x,640,x+45,760,'#122d3560',3)}
 // overhead fluorescent spill and paper theatre proscenium
 const glow=c.createRadialGradient(600,170,40,600,170,620);glow.addColorStop(0,'#c3e4c01a');glow.addColorStop(1,'#c3e4c000');c.fillStyle=glow;c.fillRect(left,0,width,760);
 line(c,left,75,left+width,75,P.ink,14);for(let i=0;i<5;i++){const x=left+width*(i+.5)/5;line(c,x,0,x,73,P.ink,7);rectangle(c,x,74,105,20,P.cream,5,P.ink,3)}
}
function finch(c,x,y,t,face='nervous',scale=1){c.save();c.translate(x,y+Math.sin(t*3)*3);c.scale(scale,scale);
 shadow(c,0,132,65);line(c,-42,48,-52,128,P.ink,13);line(c,41,49,48,128,P.ink,13);
 rectangle(c,0,51,118,138,P.gold,26,P.ink,8);rectangle(c,0,90,77,36,'#d49d3a',8);line(c,-50,14,-85,55,P.ink,12);line(c,53,14,84,54,P.ink,12);circle(c,-87,58,10,P.paper,P.ink,4);circle(c,83,58,10,P.paper,P.ink,4);
 circle(c,0,-73,80,P.paper,P.ink,8);c.fillStyle='#1b4e53';c.beginPath();c.moveTo(-67,-96);c.quadraticCurveTo(-42,-156,15,-152);c.quadraticCurveTo(75,-152,68,-103);c.quadraticCurveTo(18,-120,-35,-99);c.closePath();c.fill();
 let e=face==='shocked'?13:9;circle(c,-25,-70,e,P.ink);circle(c,28,-70,e,P.ink);
 if(face==='shocked'){circle(c,1,-30,15,P.ink);circle(c,3,-34,5,P.red)}else if(face==='happy'){c.beginPath();c.arc(0,-36,27,.12,Math.PI-.12);c.strokeStyle=P.ink;c.lineWidth=6;c.stroke()}else{line(c,-5,-36,21,-33,P.ink,5)}
 c.restore()}
function mira(c,x,y,t,face='focus',scale=1){c.save();c.translate(x,y+Math.sin(t*2.7)*2);c.scale(scale,scale);
 shadow(c,0,116,61);line(c,-32,50,-40,118,P.ink,12);line(c,29,50,36,119,P.ink,12);rectangle(c,0,47,115,140,P.teal,29,P.ink,8);rectangle(c,0,77,73,35,'#1b8d83',10);line(c,-53,5,-76,65,P.ink,12);line(c,52,5,72,65,P.ink,12);
 circle(c,0,-79,75,P.paper,P.ink,8);c.fillStyle='#4f3134';c.beginPath();c.moveTo(-69,-91);c.bezierCurveTo(-85,-169,70,-178,70,-94);c.lineTo(62,-132);c.quadraticCurveTo(8,-105,-62,-109);c.fill();
 circle(c,-23,-70,face==='panic'?11:8,P.ink);circle(c,26,-70,face==='panic'?11:8,P.ink);
 if(face==='panic'){circle(c,2,-26,16,P.ink);line(c,-45,-107,-20,-117,P.ink,5);line(c,20,-117,44,-107,P.ink,5)}else if(face==='smile'){c.beginPath();c.arc(0,-35,22,.1,Math.PI-.1);c.strokeStyle=P.ink;c.lineWidth=6;c.stroke()}else{line(c,-9,-34,13,-32,P.ink,4)}
 rectangle(c,-24,-64,44,33,'#c2e9e633',9,P.ink,2);rectangle(c,26,-64,44,33,'#c2e9e633',9,P.ink,2);line(c,-1,-65,5,-65,P.ink,3);
 c.restore()}
function particles(c,list,dt=0){for(const p of list){c.globalAlpha=clamp(p.life/.7,0,1);circle(c,p.x,p.y,p.r,p.color);c.globalAlpha=1}}
function burst(list,x,y,color=P.gold){for(let k=0;k<11;k++){const a=k*2.399+1.3;list.push({x,y,vx:Math.cos(a)*(80+13*k),vy:Math.sin(a)*(60+11*k)-60,r:3+k%3,life:.7,color})}}
function stepFX(list,dt){for(const p of list){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=350*dt}for(let i=list.length-1;i>=0;i--)if(list[i].life<=0)list.splice(i,1)}
function memo(c,txt,kind='good',maxW=800){const w=Math.min(maxW-42,Math.max(220,txt.length*13));const font=Math.min(23,w/(Math.max(1,txt.length)*.62));rectangle(c,600,327,w,49,kind==='bad'?P.red:P.gold,9,P.ink,4);label(c,txt,600,327,font,P.ink)}
function makeCommon(id,ctx,limit){let state={id,t:0,remaining:limit,done:false,emitted:false,fx:[],note:'',noteUntil:0,attemptId:ctx.options?.attemptId||`${id}-preview`};
 function emit(outcome,evidence){if(state.emitted)return;state.emitted=true;state.done=outcome!=='failed';ctx.events?.emit?.({type:outcome==='failed'?'card-failed':'card-complete',cardId:id,outcome,evidence:{attemptId:state.attemptId,manual:true,...evidence}});feedback(ctx,outcome==='failed'?'fail':'complete')}
 function update(dt){dt=clamp(dt,0,.05);if(state.emitted)return;state.t+=dt;state.remaining=Math.max(0,state.remaining-dt);stepFX(state.fx,dt);if(state.remaining===0)emit('failed',{reason:'timer-expired'})}
 function note(msg,bad=false){state.note=msg;state.noteUntil=state.t+1.6;feedback(ctx,bad?'error':'progress')}
 return {state,emit,update,note,ctx,id,layout:()=>span(ctx),fx:(x,y,col)=>burst(state.fx,x,y,col),paintFX:c=>particles(c,state.fx),base:(c,variant)=>sceneBackdrop(c,ctx,state.t,variant),snapshot:()=>({id,t:+state.t.toFixed(3),remaining:+state.remaining.toFixed(3),done:state.done,emitted:state.emitted})};
}
function drawFrame(c,b,card,prompt,subtitle){b.base(c,card==='S2'?'coffee':card==='S4'?'cable':'default');
 tag(c,`DEPT 02 // SERVICES`,600,156,288,P.ink,P.light);
 strokeText(c,prompt,600,214,46,P.gold);label(c,subtitle,600,261,18,P.cream);
 if(b.state.noteUntil>b.state.t)memo(c,b.state.note,/NO|OOPS|MISSED|TOO EARLY|SHORT|WRONG|SPILL|SNEEZE/.test(b.state.note)?'bad':'good',viewportWidth(b.ctx))
}
function makeS1(ctx){const b=makeCommon('S1',ctx,26);let files=[],active=null,last={x:0,y:0},direction=ctx.run?.directive||ctx.options?.directive||'';let next=0,confirmed=0,secondary=false,moveStage=0;
 const bin=()=>({x:xAt(ctx,direction==='moving-goalposts'?(.65+Math.sin(moveStage*1.7)*.12):.68),y:390});
 function reset(){files=[0,1,2].map(i=>({id:i,x:xAt(ctx,-.69)+(i%2)*17,y:407+i*75,angle:i*.09,held:false,done:false,vx:0,vy:0}));next=0;confirmed=0;secondary=false;active=null}reset();
 function target(){const p=bin();return secondary?{x:p.x,y:p.y+125}:p}
 function release(f,p){if(f!==active&&!(!active&&hypot(f.vx,f.vy)>20))return;f.held=false;active=null;let goal=target();if(hypot(f.x-goal.x,f.y-goal.y)<99){f.vx=f.vy=0;if(direction==='double-entry'&&!secondary){secondary=true;b.note('CARBON COPY REQUIRED');f.x=xAt(ctx,-.52);f.y=480;return}
 f.done=true;confirmed++;secondary=false;next++;b.fx(goal.x,goal.y);feedback(ctx,'stamp');b.note(`${confirmed}/3 // FILED AND FORGOTTEN`);if(confirmed===3)b.emit('success',{filed:[0,1,2],cleanFiles:3,bankShotUsed:!!files.some(x=>x.banked),directive:direction});else moveStage+=1;
 }else{f.vx=clamp((p.x-last.x)*16,-850,850);f.vy=clamp((p.y-last.y)*16,-850,850);b.note('AIM FOR THE GLOWING INBOX',true)}}
 const api={enter(){},update(dt){b.update(dt);if(b.state.emitted)return;for(const f of files){if(f.held||f.done)continue; if(hypot(f.vx,f.vy)<20)continue;f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=Math.exp(-2*dt);f.vy*=Math.exp(-2*dt);let bx=600,by=527;if(hypot(f.x-bx,f.y-by)<65&&f.vx>0){f.vx=Math.abs(f.vx)*.82+155;f.vy=-Math.abs(f.vy)-130;f.banked=true;b.fx(bx,by,P.blue);feedback(ctx,'bank')};const goal=target();if(hypot(f.x-goal.x,f.y-goal.y)<90){release(f,{x:f.x,y:f.y});break}if(f.x<600-viewportWidth(ctx)/2||f.x>600+viewportWidth(ctx)/2||f.y>680||f.y<300){f.x=xAt(ctx,-.66);f.y=405+f.id*70;f.vx=f.vy=0}}},
 draw(c){drawFrame(c,b,'S1','FILE FRENZY!','DRAG 3 FOLDERS INTO THE LIT INBOX');
 const p=bin();line(c,p.x-150,412,p.x+150,412,P.ink,14);rectangle(c,p.x,390,180,140,P.ink,20,P.gold,8);rectangle(c,p.x,400,149,91,'#225e64',13);label(c,'INBOX',p.x,351,26,P.gold);
 if(secondary){rectangle(c,p.x,p.y+125,165,70,P.gold,12,P.ink,5);label(c,'DUPLICATE',p.x,p.y+125,19,P.ink)}else{circle(c,p.x,400,70+Math.sin(b.state.t*5)*5,'#f6c65c12',P.gold,2)}
 // oversized elastic desk bumper
 shadow(c,600,565,82);circle(c,600,528,66,'#1c8390',P.ink,9);circle(c,600,526,44,P.blue,'#90decc',4);label(c,'↗',600,527,45,P.ink);tag(c,'BONUS BANK SHOT',600,599,175,P.ink,P.cream);
 for(const f of files){if(f.done)continue;c.save();c.translate(f.x,f.y);c.rotate(f.angle+(f.held?Math.sin(b.state.t*8)*.04:0));rectangle(c,0,0,128,91,f.id===1?'#e4a45b':'#e8d4a6',12,P.ink,6);rectangle(c,-22,-34,72,22,P.cream,5,P.ink,3);line(c,-42,-10,35,-10,'#8f795a',4);line(c,-42,11,23,11,'#8f795a',4);label(c,`#0${f.id+1}`,0,22,23,P.ink);c.restore()}
 finch(c,xAt(ctx,-.9),490,b.state.t,confirmed===3?'happy':'nervous',.63);b.paintFX(c);
 },pointerDown(p){if(b.state.emitted)return;for(const f of [...files].reverse())if(!f.done&&hit(p,f.x,f.y,142,100)){active=f;last={...p};f.held=true;f.vx=f.vy=0;feedback(ctx,'grab');break}},pointerMove(p){if(active){last={x:active.x,y:active.y};active.x=clamp(p.x,xAt(ctx,-1),xAt(ctx,1));active.y=clamp(p.y,300,670)}},pointerUp(p){if(active){active.x=p.x;active.y=p.y;release(active,p)}},cancelPointer(){if(active){active.held=false;active.x=xAt(ctx,-.66);active.y=405+active.id*70;active=null}},snapshot(){return {...b.snapshot(),filed:confirmed,secondary,files:files.map(f=>({id:f.id,x:+f.x.toFixed(1),y:+f.y.toFixed(1),done:f.done}))}},dispose(){active=null}};return api}
function makeS2(ctx){const b=makeCommon('S2',ctx,22);let cups=[],tray={x:600,y:534,w:180},caught=0,spilled=0,dragging=false,spawn=0,order=0,bonus=false,route='safe',desiredX=600,coupon={x:600,y:521,held:false,visible:true},helpUsed=false;const dir=ctx.run?.directive||ctx.options?.directive||'';
 function setup(){cups=[];caught=spilled=0;spawn=0;order=0;bonus=false;tray.x=desiredX=600;route='safe';coupon={x:600,y:521,held:false,visible:true};helpUsed=false;tray.w=dir==='fast-or-safe'?230:200;cupSpawn()}setup();
 function cupSpawn(){const i=order++;cups.push({id:i,x:xAt(ctx,[-.64,.14,.66][i]),y:286,vx:[55,-36,-66][i],vy:[76,89,79][i],phase:i*2.4,done:false,rot:i===1?.12:-.13})}
 function conclude(){if(caught+spilled<3)return;if(caught>=2)b.emit('success',{caught,spilled,allThreeCaught:caught===3,miraWorkstation:caught===3?'functional':'disrupted',manual:true,directive:dir});else if(dir==='mandatory-collaboration'&&!helpUsed){b.note('TAP MIRA TO RETURN A MUG');return}else b.emit('failed',{caught,spilled,reason:'too-many-spills'})}
 const api={enter(){},update(dt){b.update(dt);if(b.state.emitted)return;if(dir==='fast-or-safe'&&dragging){const speed=route==='safe'?830:2300;tray.x+=clamp(desiredX-tray.x,-speed*dt,speed*dt)}spawn+=dt;if(order<3&&spawn> (order===0?.15:1.8)){cupSpawn();spawn=0}
 for(const cup of cups){if(cup.done)continue;cup.y+=cup.vy*dt;cup.vy+=165*dt;cup.x+=Math.sin(b.state.t*3+cup.phase)*12*dt+cup.vx*dt;cup.rot+=dt*.45;if(cup.y>=tray.y-23&&cup.y<tray.y+22&&Math.abs(cup.x-tray.x)<tray.w/2+20){cup.done=true;caught++;b.fx(cup.x,tray.y,P.gold);feedback(ctx,'catch');b.note(caught===3?'MIRA OWES YOU A COFFEE':`${caught} COFFEE SAVED`);conclude()}else if(cup.y>625){cup.done=true;spilled++;b.fx(cup.x,613,P.red);feedback(ctx,'spill');b.note('SPILL // WORKSTATION DISRUPTED',true);conclude()}}
 },draw(c){drawFrame(c,b,'S2','SAVE THE COFFEE!','SWEEP THE TRAY UNDER THE FALLING MUGS');
 // Mira and her endangered terminal
 rectangle(c,xAt(ctx,.64),518,246,175,'#285a61',18,P.ink,9);rectangle(c,xAt(ctx,.64),500,198,120,'#082a34',11,P.blue,7);label(c,'MIRA.EXE',xAt(ctx,.64),474,20,P.light);line(c,xAt(ctx,.64)-70,535,xAt(ctx,.64)+60,535,'#36626a',4);mira(c,xAt(ctx,.94),397,b.state.t,spilled?'panic':caught===3?'smile':'focus',.51);
 // interactive tray with depth and motion streak
 shadow(c,tray.x,576,tray.w/2+20);rectangle(c,tray.x,542,tray.w,38,P.teal,12,P.ink,7);rectangle(c,tray.x,517,tray.w+30,20,P.gold,8,P.ink,5);line(c,tray.x-30,564,tray.x-16,593,P.ink,6);line(c,tray.x+28,564,tray.x+17,593,P.ink,6);tag(c,`${caught}/3 CAUGHT`,tray.x,590,132,P.ink,P.gold);
 if(dir==='fast-or-safe'){for(const opt of [{name:'FAST • NARROW',key:'fast',x:xAt(ctx,-.36)},{name:'SAFE • WIDE',key:'safe',x:xAt(ctx,.36)}]){rectangle(c,opt.x,366,178,42,route===opt.key?P.gold:P.ink,9,route===opt.key?P.paper:P.blue,4);label(c,opt.name,opt.x,366,15,route===opt.key?P.ink:P.cream)}}
 for(const cup of cups){if(cup.done)continue;c.save();c.translate(cup.x,cup.y);c.rotate(cup.rot);rectangle(c,0,0,70,72,cup.id===1?'#f6d0c2':P.cream,12,P.ink,6);circle(c,38,-3,17,'#0000',P.ink,7);rectangle(c,0,-30,67,13,P.gold,4,P.ink,3);label(c,`#${cup.id+1}`,0,2,23,P.ink);c.restore()}
 if(dir==='sponsored-workflow'){if(coupon.visible){rectangle(c,coupon.x,coupon.y,190,95,P.red,11,P.ink,6);label(c,'FREE COFFEE?!',coupon.x,coupon.y-17,19,P.paper);label(c,'SPONSORED • DRAG',coupon.x,coupon.y+21,13,P.ink)}if(b.state.noteUntil<=b.state.t)speech(c,'MIRA • MOVE THAT AD!',xAt(ctx,.45),313,267)}
 if(dir==='mandatory-collaboration'&&b.state.noteUntil<=b.state.t)speech(c,helpUsed?'BACK TO WORK!':'TAP ME TO RETURN A MUG!',xAt(ctx,.64),313,320);
 b.paintFX(c)},pointerDown(p){if(dir==='sponsored-workflow'&&coupon.visible&&hit(p,coupon.x,coupon.y,200,104)){coupon.held=true;feedback(ctx,'ad-grab');return}if(dir==='mandatory-collaboration'&&!helpUsed&&spilled>0&&hit(p,xAt(ctx,.94),397,130,155)){const cup=cups.find(c=>c.done&&c.y>620);if(cup){cup.done=false;cup.x=xAt(ctx,.70);cup.y=286;cup.vy=75;cup.vx=-40;spilled--;helpUsed=true;b.note('MIRA RETURNS THE MUG!');feedback(ctx,'mira-return');return}}if(dir==='fast-or-safe'&&Math.abs(p.y-366)<32){if(Math.abs(p.x-xAt(ctx,-.36))<94){route='fast';tray.w=125;feedback(ctx,'choice');return}if(Math.abs(p.x-xAt(ctx,.36))<94){route='safe';tray.w=230;feedback(ctx,'choice');return}}dragging=true;desiredX=clamp(p.x,xAt(ctx,-.87),xAt(ctx,.86));if(dir!=='fast-or-safe')tray.x=desiredX;feedback(ctx,'tray')},pointerMove(p){if(coupon.held){coupon.x=clamp(p.x,xAt(ctx,-.94),xAt(ctx,.94));coupon.y=clamp(p.y,305,660);return}if(dragging){desiredX=clamp(p.x,xAt(ctx,-.87),xAt(ctx,.86));if(dir!=='fast-or-safe')tray.x=desiredX}},pointerUp(){if(coupon.held){coupon.held=false;if(hypot(coupon.x-600,coupon.y-521)>112){coupon.visible=false;b.note('SPONSORED DISTRACTION REMOVED')}}dragging=false},cancelPointer(){coupon.held=false;dragging=false},snapshot(){return {...b.snapshot(),route,trayWidth:tray.w,couponVisible:coupon.visible,helpUsed,caught,spilled,spawned:order,cups:cups.map(x=>({id:x.id,x:+x.x.toFixed(1),y:+x.y.toFixed(1),done:x.done})),trayX:+tray.x.toFixed(1)}},dispose(){dragging=false}};return api}
function printerArt(c,x,y,t,face='jam'){c.save();c.translate(x,y+Math.sin(t*4)*3);shadow(c,0,166,180);rectangle(c,0,30,360,285,'#d9d9b5',23,P.ink,11);rectangle(c,0,-91,290,127,'#3d6471',21,P.ink,9);rectangle(c,0,-112,245,68,'#f7ebd2',9,P.ink,4);for(let i=0;i<5;i++)line(c,-90,-122+i*13,65,-122+i*13,'#78909a',3);rectangle(c,0,56,230,62,P.ink,14);rectangle(c,0,63,183,33,P.red,7);circle(c,-83,-15,12,P.ink);circle(c,85,-15,12,P.ink);circle(c,-83,-18,5,P.gold);circle(c,85,-18,5,P.gold);if(face==='cough'){line(c,-15,23,18,21,P.ink,7)}else{circle(c,0,22,17,P.ink);circle(c,0,24,9,P.red)}rectangle(c,0,150,390,35,'#304b5a',11,P.ink,5);c.restore()}
function makeS3(ctx){const b=makeCommon('S3',ctx,23);const dir=ctx.run?.directive||ctx.options?.directive||'';let sheet={x:600,y:500},grab=false,safe=false,opening=0,resetTime=0,cough=0,pulled=false,confirm=false,goalShift=0,ad={x:600,y:477,held:false,visible:true};
 const origin=()=>({x:600,y:477});const goal=()=>({x:xAt(ctx,.67+goalShift),y:571});
 function release(p){grab=false;if(!safe){cough=1.1;resetTime=.85;sheet=origin();b.note('TOO EARLY! TONER ATTACK!',true);feedback(ctx,'cough');return}const shortcut=dir==='fast-or-safe'&&hypot(p.x-xAt(ctx,.30),p.y-545)<46;const safeRoute=hypot(p.x-goal().x,p.y-goal().y)<100;if(shortcut||safeRoute){if(dir==='double-entry'&&!confirm){confirm=true;pulled=true;sheet=goal();b.note('TAP THE CARBON SEAL');return}pulled=true;b.fx(p.x,p.y);b.note('FEEDER OPEN • PRINTER MUTINY TRAINING');b.emit('success',{safePull:true,priorCoughs:errors,method:'page-pull',route:shortcut?'fast':'safe',directive:dir})}else{sheet=origin();b.note('PULL TO THE GOLD RELEASE RING',true)}}let errors=0;
 const api={enter(){},update(dt){b.update(dt);if(b.state.emitted)return;opening+=dt;const wasSafe=safe;safe=(Math.sin(opening*2.1)>-.02);if(dir==='moving-goalposts'&&safe&&!wasSafe&&!grab){goalShift=goalShift<=0?.11:-.11;feedback(ctx,'goal-shift')}if(resetTime>0){resetTime-=dt;if(resetTime<=0){sheet=origin();cough=0}}cough=Math.max(0,cough-dt)},draw(c){drawFrame(c,b,'S3','UNJAM IT!','WAIT FOR GREEN • DRAG THE PAGE TO RELEASE');
 const x=600;printerArt(c,x,466,b.state.t,cough>0?'cough':safe?'open':'jam');
 let a=goal();circle(c,a.x,a.y,71+Math.sin(b.state.t*4)*5,'#0000',P.gold,6);label(c,'PULL',a.x,a.y-13,21,P.gold);label(c,'HERE',a.x,a.y+12,20,P.cream);if(dir==='fast-or-safe'){circle(c,xAt(ctx,.30),545,43+Math.sin(b.state.t*6)*2,'#0000',P.teal,5);label(c,'FAST',xAt(ctx,.30),545,16,P.teal);label(c,'SAFE',a.x,a.y+45,15,P.gold)}if(dir==='moving-goalposts'){line(c,xAt(ctx,.55),a.y+81,xAt(ctx,.80),a.y+81,P.blue,8);label(c,'SHIFTING RAIL',a.x,a.y+108,15,P.blue)}
 rectangle(c,600,365,220,40,safe?P.teal:P.red,10,P.ink,4);label(c,safe?'SAFE TO PULL':'DANGER // WAIT',600,365,23,P.ink);
 if(!pulled){line(c,600,515,sheet.x,sheet.y+25,P.cream,4);rectangle(c,sheet.x,sheet.y,132,80,P.paper,8,P.ink,5);line(c,sheet.x-44,sheet.y-14,sheet.x+35,sheet.y-14,'#88a6a4',4);label(c,'PULL ME',sheet.x,sheet.y+17,20,P.ink)}
 if(cough){for(let i=0;i<8;i++)circle(c,600+Math.sin(i*2.4+b.state.t*2)*125,355-i*14,cough*(15+i*3),'#dadbd5a9')}
 finch(c,xAt(ctx,-.78),485,b.state.t,cough?'shocked':'nervous',.60);if(dir==='sponsored-workflow'){if(b.state.noteUntil<=b.state.t)speech(c,'MIRA • GREEN LIGHT IS REAL',xAt(ctx,.58),309,285);if(ad.visible){rectangle(c,ad.x,ad.y,198,105,P.red,11,P.ink,6);label(c,'TONER PREMIUM+',ad.x,ad.y-19,20,P.paper);label(c,'SPONSORED • DRAG',ad.x,ad.y+23,14,P.ink)}}b.paintFX(c)},pointerDown(p){if(b.state.emitted||resetTime>0)return;if(dir==='sponsored-workflow'&&ad.visible&&hit(p,ad.x,ad.y,209,114)){ad.held=true;feedback(ctx,'ad-grab');return}if(confirm){if(hit(p,goal().x,goal().y,160,170)){b.fx(p.x,p.y);b.emit('success',{safePull:true,method:'page-pull+carbon-confirm',priorCoughs:errors,directive:dir})}return}if(hit(p,sheet.x,sheet.y,155,100)){grab=true;feedback(ctx,'paper-grab');if(!safe)errors++}},pointerMove(p){if(ad.held){ad.x=clamp(p.x,xAt(ctx,-.9),xAt(ctx,.9));ad.y=clamp(p.y,300,620);return}if(grab){sheet.x=clamp(p.x,xAt(ctx,-.93),xAt(ctx,.93));sheet.y=clamp(p.y,365,650)}},pointerUp(p){if(ad.held){ad.held=false;if(hypot(ad.x-600,ad.y-477)>110){ad.visible=false;b.note('FAKE TONER AD DISMISSED')}return}if(grab){sheet.x=p.x;sheet.y=p.y;release(p)}},cancelPointer(){ad.held=false;grab=false;sheet=origin()},snapshot(){return {...b.snapshot(),safe,grab,adVisible:ad.visible,goalShift,errors,confirm,pulled,sheet:{...sheet},resetTime:+resetTime.toFixed(2)}},dispose(){grab=false}};return api}
function makeS4(ctx){const b=makeCommon('S4',ctx,23);const dir=ctx.run?.directive||ctx.options?.directive||'';let mode='hold',holding=false,held=0,plug={x:xAt(ctx,-.59),y:518},drag=false,errors=0,pulse=0,complete=false,verify=false,goalShift=0,helper=false;
 const socket=()=>({x:xAt(ctx,-.59),y:518});const port=()=>({x:xAt(ctx,.65+goalShift),y:470});
 const api={enter(){},update(dt){b.update(dt);if(b.state.emitted)return;pulse+=dt;if(holding){held+=dt;if(held>=(helper?.52:.85)&&mode==='hold'){mode='trace';b.fx(socket().x,socket().y,P.teal);b.note('STEADY! CONNECT THE GLOWING CABLE')}}if(mode==='trace'&&pulse>7.9){pulse=0;mode='hold';holding=false;held=0;plug=socket();errors++;if(dir==='moving-goalposts')goalShift=goalShift<=0?.11:-.11;b.note('RESTART PULSE // TRY AGAIN',true);feedback(ctx,'pulse')}},draw(c){drawFrame(c,b,'S4','FIX THE CABLE!','HOLD THE SOCKET, THEN DRAG THE PLUG INTO THE PORT');
 // sparking cabinet and curvy cable
 const left=socket(),right=port();rectangle(c,600,482,span(ctx)*1.85+130,255,'#243c4b',22,P.ink,9);rectangle(c,600,390,span(ctx)*1.75+90,43,'#426471',11,P.ink,5);label(c,'INTERNAL NETWORK • DO NOT KICK',600,391,22,P.cream);
 line(c,left.x,left.y,plug.x,plug.y,P.ink,21);line(c,left.x,left.y,plug.x,plug.y,P.gold,10);line(c,plug.x,plug.y,right.x,right.y,'#9bd7c277',5);
 circle(c,left.x,left.y,62,'#1e6974',P.ink,9);circle(c,left.x,left.y,39,P.ink);circle(c,left.x,left.y,20,mode==='hold'?P.red:P.teal);if(mode==='hold')circle(c,left.x,left.y,47,'#0000',P.gold,5);
 circle(c,right.x,right.y,56,'#2a4650',P.ink,8);circle(c,right.x,right.y,27,mode==='trace'?P.teal:P.red,P.cream,5);
 rectangle(c,plug.x,plug.y,78,49,P.cream,12,P.ink,6);line(c,plug.x+30,plug.y-13,plug.x+52,plug.y-13,P.gold,8);line(c,plug.x+30,plug.y+12,plug.x+52,plug.y+12,P.gold,8);
 tag(c,mode==='hold'?`STABILIZE ${Math.floor(clamp(held/.85,0,1)*100)}%`:'TRACE TO PORT',left.x,614,200,P.ink,P.gold);
 if(mode==='trace')sparkle(c,right.x,right.y,b.state.t,6);if(mode==='hold')sparkle(c,left.x,left.y,b.state.t,3);
 if(dir==='moving-goalposts')label(c,'PORT RELOCATES AFTER PULSE',right.x,355,15,P.gold);
 if(dir==='mandatory-collaboration'){if(b.state.noteUntil<=b.state.t)speech(c,helper?'JULES HAS THE SOCKET!':'TAP JULES FOR HELP!',xAt(ctx,.65),320,263);circle(c,xAt(ctx,.65),337,13,helper?P.teal:P.gold)}
 if(complete){rectangle(c,600,503,270,98,P.teal,18,P.ink,5);label(c,'RECONNECTED!',600,500,34,P.ink)}
 b.paintFX(c)},pointerDown(p){if(b.state.emitted)return;if(dir==='mandatory-collaboration'&&!helper&&hit(p,xAt(ctx,.65),320,260,90)){helper=true;b.fx(xAt(ctx,.65),320,P.teal);b.note('JULES BRACES THE SOCKET');feedback(ctx,'helper');return}const sock=socket();if(mode==='hold'&&hypot(p.x-sock.x,p.y-sock.y)<74){holding=true;feedback(ctx,'socket')}else if(mode==='trace'&&hit(p,plug.x,plug.y,120,100)){drag=true;feedback(ctx,'plug-grab')}else if(mode==='verify'&&hit(p,sock.x,sock.y,150,150)){b.emit('success',{method:'socket-hold-trace+verification',errors,directive:dir})}},pointerMove(p){if(drag){plug.x=clamp(p.x,xAt(ctx,-.85),xAt(ctx,.85));plug.y=clamp(p.y,390,618)}},pointerUp(p){if(holding){holding=false;if(mode==='hold')held=Math.max(0,held-.2)}if(drag){drag=false;let p2=port();if(hypot(plug.x-p2.x,plug.y-p2.y)<72){complete=true;b.fx(p2.x,p2.y,P.teal);feedback(ctx,'reboot');if(dir==='double-entry'){mode='verify';b.note('VERIFY BY TAPPING SOCKET')}else b.emit('success',{method:'socket-hold-trace',errors,directive:dir})}else{errors++;plug=socket();b.note('WRONG PORT // ELECTRICAL SNEEZE!',true);feedback(ctx,'sneeze')}}},cancelPointer(){holding=drag=false;if(mode==='trace')plug=socket()},snapshot(){return {...b.snapshot(),mode,held:+held.toFixed(2),errors,helper,goalShift,plug:{...plug},holding,drag,complete}},dispose(){holding=drag=false}};return api}
export const definitions=[
 {id:'S1',department:'services',imperative:'FILE FRENZY!',create:makeS1},
 {id:'S2',department:'services',imperative:'SAVE THE COFFEE!',create:makeS2},
 {id:'S3',department:'services',imperative:'UNJAM IT!',create:makeS3},
 {id:'S4',department:'services',imperative:'FIX THE CABLE!',create:makeS4}
];
export default definitions;