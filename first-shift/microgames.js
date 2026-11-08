/* First Shift's eight self-contained pointer scenes. The campaign owns time and state. */
(function (global) {
'use strict';
const W=1200,H=760, ink='#193846', cream='#fff8e8', red='#dc5b48', teal='#3e8b80', gold='#f3bd5a';
const titles={I1:['INTAKE','STAMP GOOD!','Stamp five APPROVED forms. Leave the spam alone.'],I3:['INTAKE','CLOSE THE SCAMS!','Close three fakes. Mira signs her real help.'],S1:['SERVICES','FILE FRENZY!','Drag the three folders into the moving chute.'],S2:['SERVICES','SAVE THE COFFEE!','Move the tray under at least two cups.'],P1:['PUBLIC RELATIONS','RESET THE SCALE!','Drag the baseline down to zero, then send.'],P4:['PUBLIC RELATIONS','HEADLINE OR CONTEXT?','Drag the verified report to either route.'],T1:['STAFF SUPPORT','GET THEM OUT!','Drag at least two coworkers to the exit.'],T4:['STAFF SUPPORT','PASS THE TOOLS!','Drag both $40 licences to Mira, Jules or SAVE.']};
function box(c,x,y,w,h,fill,stroke=ink,r=12){c.fillStyle=fill;c.strokeStyle=stroke;c.lineWidth=3;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();if(stroke)c.stroke();}
function text(c,s,x,y,size=22,color=ink,align='left',weight=800){c.font=`${weight} ${size}px Trebuchet MS, Arial, sans-serif`;c.fillStyle=color;c.textAlign=align;c.textBaseline='middle';c.fillText(String(s),x,y);}
function inside(x,y,r){return x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h}
function person(c,x,y,name,color,t=0){
 c.save();c.translate(x,y+Math.sin(t*2+x/90)*2);
 // Distinct silhouettes: Mira's bun, Jules' square fringe and Sam's curls.
 c.fillStyle='#254652';c.strokeStyle=ink;c.lineWidth=3;
 if(name==='MIRA'){c.beginPath();c.arc(20,-9,15,0,7);c.fill();c.beginPath();c.arc(0,18,37,0,7);c.fill()}
 else if(name==='JULES'){box(c,-38,-14,76,55,'#273e4a',ink,12)}
 else{for(let i=0;i<5;i++){c.beginPath();c.arc(-28+i*14,-4+(i%2)*-4,13,0,7);c.fill()}}
 // Feet and swinging arms give the office figures a paper-puppet silhouette.
 c.strokeStyle=ink;c.lineWidth=13;c.lineCap='round';c.beginPath();c.moveTo(-20,142);c.lineTo(-25,155);c.moveTo(20,142);c.lineTo(25,155);c.stroke();
 c.strokeStyle=color;c.lineWidth=17;c.beginPath();c.moveTo(-37,72);c.lineTo(-53,105+Math.sin(t*3)*3);c.moveTo(37,72);c.lineTo(53,105-Math.sin(t*3)*3);c.stroke();
 box(c,-40,55,80,90,color,ink,18);c.fillStyle='#fff7df';c.fillRect(-5,61,10,76);
 c.fillStyle='#e8b98e';c.beginPath();c.arc(0,23,33,0,Math.PI*2);c.fill();c.strokeStyle=ink;c.lineWidth=3;c.stroke();
 c.fillStyle=ink;c.beginPath();c.arc(-11,19,3,0,7);c.arc(11,19,3,0,7);c.fill();
 c.beginPath();c.arc(0,28,10,.12,Math.PI-.12);c.stroke();
 if(name==='MIRA'){c.strokeStyle='#254652';c.lineWidth=2;c.strokeRect(-20,11,15,13);c.strokeRect(5,11,15,13);c.beginPath();c.moveTo(-5,17);c.lineTo(5,17);c.stroke()}
 if(name==='JULES'){c.fillStyle='#273e4a';c.beginPath();c.moveTo(-31,4);c.quadraticCurveTo(0,-19,32,3);c.lineTo(26,10);c.quadraticCurveTo(0,-3,-28,11);c.fill()}
 text(c,name,0,173,16,ink,'center');c.restore();
}
function finch(c,t){
 c.save();c.translate(815,74);c.rotate(Math.sin(t*1.7)*.025);
 c.fillStyle='#254652';c.beginPath();c.arc(0,-12,30,Math.PI,0);c.lineTo(30,6);c.lineTo(-30,6);c.closePath();c.fill();
 c.fillStyle='#f0bb8b';c.beginPath();c.arc(0,-5,24,0,7);c.fill();c.strokeStyle=ink;c.lineWidth=2.5;c.stroke();
 c.fillStyle=ink;c.beginPath();c.arc(-8,-8,2.5,0,7);c.arc(8,-8,2.5,0,7);c.fill();c.beginPath();c.arc(0,-1,9,.1,Math.PI-.1);c.stroke();
 c.fillStyle='#e57855';c.beginPath();c.moveTo(-35,49);c.quadraticCurveTo(-32,20,-15,19);c.lineTo(15,19);c.quadraticCurveTo(32,20,35,49);c.closePath();c.fill();c.stroke();
 c.fillStyle='#fff3d8';c.beginPath();c.moveTo(-9,20);c.lineTo(0,38);c.lineTo(9,20);c.fill();text(c,'FINCH',0,60,11,ink,'center');c.restore();
}
function paperShadow(c,x,y,rx,ry){c.fillStyle='rgba(25,56,70,.14)';c.beginPath();c.ellipse(x+5,y+10,rx,ry,0,0,Math.PI*2);c.fill()}

function FSCreateMicrogame({id,canvas,ctx:c,ledger={},perks=[],directive='',onComplete,onSound=()=>{}}){
 if(!titles[id])throw new Error('Unknown First Shift card: '+id);
 const has=(name)=>Array.isArray(perks)?perks.some(p=>(typeof p==='string'?p:p.id)===name):!!perks[name];
 let bursts=[],burstAt=-10,ghostMade=false,rescueUsed=false,elapsed=0,done=false,correct=0,wrong=0,streak=0,longest=0,drag=null,endedAt=0,message='',queue=[],notice=null,noticeSeen=0,noticeHandled=0, noticeIndex=0, nextNotice=directive==='SPONSORED WORKFLOW'?.7:1.5;
 let filed=0,scamsDismissed=0,copyResolved=false,assistActive=false,helpActive=false,fastMode=false,actions=[], notices=[], outcome={}, items=[], world=null, tray=null, target=null, spawned=0,caught=0,manualCaught=0,passed=0, axis=420, chartReady=false, allocations={mira:0,jules:0,save:0}, reportChoice=null, rescued=0;
 const times={I1:40,I3:35,S1:50,S2:24,P1:45,P4:40,T1:45,T4:60};
 const updateStreak=(ok)=>{actions.push(ok?'correct':'wrong');onSound(ok?'good':'bad');if(ok){correct++;streak++;longest=Math.max(longest,streak)}else{wrong++;streak=0}};
 const complete=(success=true)=>{if(done)return;done=true;endedAt=elapsed;outcome={id,success,correct,wrong,longestStreak:longest,actions:[...actions],scamsDismissed,copyResolved,notices:notices.map(n=>({...n})),elapsed,noticesEncountered:noticeSeen,noticesHandled:noticeHandled,...outcome};onComplete(outcome)};
 function makeWorld(g=0, handler=()=>{}) {world=new FSPhysics.World({gravityY:g,onContact:(a,b)=>handler(a,b)});}
 function showNotice(){if(notice||noticeIndex>=4)return;const real=noticeIndex%2===0;notice={x:860,y:155,w:245,h:88,real,until:elapsed+4};noticeIndex++;if(real){noticeSeen++;notice.noticeId=id+'-notice-'+noticeSeen;notices.push({id:notice.noticeId,handled:false})}nextNotice=elapsed+(directive==='SPONSORED WORKFLOW'?5:7);}
 if(id==='I1'){
   makeWorld(0,(a,b)=>{let paper=a.kind==='paper'?a:b.kind==='paper'?b:null,stamp=a.kind==='stamp'?a:b.kind==='stamp'?b:null;if(paper&&stamp&&!paper.hit){paper.hit=true;onSound('stamp');burstAt=elapsed;const impact=world.position(paper);bursts.push({x:impact.x,y:impact.y,time:elapsed});queue.push(()=>{if(paper.good){updateStreak(true);message='APPROVED!';if(correct>=5)complete(true)}else{updateStreak(false);message='That was spam!'};world.remove(paper);world.remove(stamp)})}});
   world.box({id:'desk-floor',x:600,y:690,w:1100,h:20,friction:.8});world.box({id:'desk-left',x:50,y:430,w:20,h:510});world.box({id:'desk-right',x:1150,y:430,w:20,h:510});
   for(let i=0;i<6;i++){let x=230+(i%3)*350,y=310+Math.floor(i/3)*190;items.push(world.box({id:'paper'+i,kind:'paper',good:i!==5,x,y,w:145,h:118,dynamic:true,density:1,friction:.7,damping:4,angularDamping:5}));}
 } else if(id==='I3') {items=[{x:115,y:220,w:260,h:155,real:false},{x:450,y:275,w:260,h:155,real:false},{x:785,y:210,w:260,h:155,real:false},{x:760,y:465,w:300,h:112,real:true}];noticeSeen=1;notices.push({id:'I3-mira',handled:false});
 } else if(id==='S1'){
   makeWorld(0,(a,b)=>{
     const folder=['folder','ghost'].includes(a.kind)?a:['folder','ghost'].includes(b.kind)?b:null;
     const chute=a.kind==='chute'?a:b.kind==='chute'?b:null;
     const bumper=a.kind==='bumper'?a:b.kind==='bumper'?b:null;
     if(folder&&bumper&&has('bank-shot'))queue.push(()=>{if(world.bodies.includes(folder)){world.velocity(folder,420,-80);message='BANK SHOT!'}});
     if(folder&&chute&&!folder.scored){folder.scored=true;queue.push(()=>{
       world.remove(folder);onSound('file');
       if(folder.kind==='ghost'){
         const next=world.bodies.find(i=>i.kind==='folder'&&!i.scored);
         if(next){next.scored=true;world.remove(next);filed++;message='COPY FILED A DIFFERENT FOLDER!'}
       } else {
         filed++;if(folder.manual)updateStreak(true);message=folder.manual?'FILED!':'KNOCKED INTO CHUTE!';
         if(folder.manual&&has('carbon-copy')&&!ghostMade&&filed<3){ghostMade=true;const pos=world.position(target);const ghost=world.box({id:'ghost',kind:'ghost',x:830,y:pos.y,w:85,h:60,dynamic:true,restitution:.2,bullet:true,damping:.1});world.velocity(ghost,has('chain-stamp')?380:250,0);message=has('chain-stamp')?'CHAIN COPY!':'CARBON COPY!'}
       }
       if(filed>=3)complete(true);
     })}
   });
   world.box({id:'top',x:600,y:180,w:1150,h:20});world.box({id:'bottom',x:600,y:690,w:1150,h:20});world.box({id:'left',x:40,y:430,w:20,h:500});world.box({id:'right',x:1160,y:430,w:20,h:500});
   target=world.box({id:'chute',kind:'chute',x:1000,y:400,w:150,h:220,kinematic:true,sensor:true});
   world.circle({id:'bumper',kind:'bumper',x:740,y:395,r:36,restitution:.9});
   for(let i=0;i<3;i++)items.push(world.box({id:'folder'+i,kind:'folder',x:230+i*165,y:420,w:120,h:90,dynamic:true,restitution:.45,bullet:true,damping:.6}));
 } else if(id==='S2'){
   makeWorld(650,(a,b)=>{const cup=a.kind==='cup'?a:b.kind==='cup'?b:null, surface=a.kind==='tray'?a:b.kind==='tray'?b:null;if(cup&&surface&&!cup.scored){cup.scored=true;queue.push(()=>{world.remove(cup);onSound('catch');caught++;passed++;if(cup.intervened){manualCaught++;updateStreak(true)}message=cup.intervened?'SAVED!':'CAUGHT BY POSITION';if(passed>=3)finishCoffee()})}});
   tray=world.box({id:'tray',kind:'tray',x:600,y:610,w:has('magnet-grip')?330:250,h:26,kinematic:true,friction:.8,restitution:.15});
 } else if(id==='P4'){
   makeWorld(0,(a,b)=>{
     const sheet=['report','reportGhost'].includes(a.kind)?a:['report','reportGhost'].includes(b.kind)?b:null;
     const bin=a.kind==='reportBin'?a:b.kind==='reportBin'?b:null;
     if(!sheet||!bin||sheet.resolved)return;
     if(sheet.kind==='reportGhost'&&bin.route===reportChoice)return;
     sheet.resolved=true;queue.push(()=>{
       world.remove(sheet);
       if(sheet.kind==='reportGhost'){copyResolved=true;message='LINKED COPY FILED!';complete(true);return}
       reportChoice=bin.route;outcome.reportChoice=reportChoice;onSound('choice');if(sheet.manual)updateStreak(true);
       if(has('carbon-copy')&&has('chain-stamp')){
         const ghost=world.box({id:'linked-copy',kind:'reportGhost',x:600,y:415,w:110,h:140,dynamic:true,bullet:true,damping:0});
         world.velocity(ghost,reportChoice==='headline'?480:-480,0);message='CHAIN COPY: OPPOSITE TRAY!';
       } else complete(true);
     });
   });
   world.box({id:'headline-bin',kind:'reportBin',route:'headline',x:215,y:415,w:270,h:230,sensor:true});
   world.box({id:'context-bin',kind:'reportBin',route:'context',x:985,y:415,w:270,h:230,sensor:true});
   items.push(world.box({id:'verified-report',kind:'report',x:590,y:435,w:180,h:210,dynamic:true,bullet:true,damping:1.5,angularDamping:4}));
 }
 else if(id==='T1'){items=[{x:300,y:380,w:90,h:150,name:'MIRA',color:'#e8a76b'},{x:520,y:380,w:90,h:150,name:'JULES',color:'#7cb5a6'},{x:740,y:380,w:90,h:150,name:'SAM',color:'#e8c66e'}]}
 else if(id==='T4'){items=[{x:430,y:420,w:110,h:75},{x:650,y:420,w:110,h:75}]}
 function moveTray(x){const next=Math.max(180,Math.min(1020,x)),old=world.position(tray),half=tray.w/2;if(Math.abs(next-old.x)>8){for(const cup of world.bodies){if(cup.kind!=='cup'||cup.scored)continue;const p=world.position(cup);if(p.y<old.y&&Math.abs(p.x-next)<=half+28&&Math.abs(p.x-next)<Math.abs(p.x-old.x))cup.intervened=true;}}world.setPosition(tray,next,fastMode?490:610)}
 function finishCoffee(){outcome.miraHelped=manualCaught>=2;complete(caught>=2)}
 function update(dt){if(done)return;dt=Math.min(.05,Math.max(0,dt));elapsed+=dt;
   if((id==='I1'||id==='S1'||id==='P1'||id==='P4')&&elapsed>nextNotice)showNotice(); if(notice&&elapsed>notice.until)notice=null;
   if(id==='S1'&&target){world.setPosition(target,fastMode?850:1000,400+Math.sin(elapsed*(fastMode?2.3:1.3))*70)}
   if(id==='S2'&&spawned<3&&elapsed>1+spawned*2.8){const xs=[390,760,570];world.box({id:'cup'+spawned,kind:'cup',x:xs[spawned],y:190,w:56,h:72,dynamic:true,density:1,restitution:.18,bullet:true});spawned++;}
   if(world){world.step(dt);for(const fn of queue.splice(0))fn();if(id==='S2'){for(const it of [...world.bodies])if(it.kind==='cup'&&!it.scored&&world.position(it).y>710){it.scored=true;world.remove(it);if(!rescueUsed&&(has('mira-backup')||has('safety-net'))){rescueUsed=true;let pp=world.position(tray);const returned=world.box({id:'returned-cup',kind:'cup',x:pp.x,y:450,w:56,h:72,dynamic:true,restitution:.1,bullet:true});message=has('mira-backup')?'MIRA RETURNS A CUP!':'SAFETY NET RETURNS A CUP!'}else{passed++;if(it.intervened)updateStreak(false);message='SPILLED!';if(passed>=3)finishCoffee()}}}}
   if(elapsed>=times[id]){if(id==='S2')finishCoffee();else if(id==='T4'){for(const it of items)if(!it.used){allocations.save++;it.used=true}outcome.licenceAssignments=allocations;outcome.savedDollars=allocations.save*40;complete(false)}else {if(id==='T1')outcome.workersHelped=rescued;complete(false)}}
 }
 function background(){c.fillStyle='#d8e6dd';c.fillRect(0,0,W,H);c.fillStyle='#b6d4c9';c.fillRect(0,0,W,150);for(let x=0;x<1200;x+=80){c.fillStyle='rgba(255,255,255,.08)';c.fillRect(x,0,35,150)}box(c,51,154,1110,560,'#ad896e','#856c57',20);box(c,45,145,1110,560,'#f6e8ce','#a98360',20);c.fillStyle='rgba(255,255,255,.23)';c.fillRect(65,164,1068,38);c.strokeStyle='#ddc9a9';c.lineWidth=2;for(let y=215;y<700;y+=60){c.beginPath();c.moveTo(65,y);c.lineTo(1135,y);c.stroke()}
   /* Desk clutter stays behind all interactive objects. */
   c.save();c.globalAlpha=.36;box(c,70,565,105,100,'#fffdf1','#b99e7d',4);box(c,81,555,105,100,'#fffdf1','#b99e7d',4);for(let i=0;i<4;i++){c.strokeStyle='#92a7a0';c.beginPath();c.moveTo(96,577+i*14);c.lineTo(158,577+i*14);c.stroke()}box(c,1040,585,75,40,'#dd785b','#906d5a',8);c.fillStyle='#a25243';c.fillRect(1050,598,54,8);c.restore();
   c.save();c.globalAlpha=.45;box(c,72,222,82,70,'#ffe59b','#ba9d69',3);text(c,'TARGETS',113,243,11,'#846b48','center');text(c,'↑  ALWAYS',113,263,11,'#846b48','center');c.strokeStyle='#ad9273';c.lineWidth=4;c.beginPath();c.arc(1060,635,38,0,Math.PI*2);c.stroke();c.beginPath();c.arc(1060,635,31,0,Math.PI*2);c.stroke();c.translate(335,608);c.rotate(-.18);box(c,0,0,150,11,'#e7a568','#ac785e',4);c.fillStyle=ink;c.beginPath();c.moveTo(150,0);c.lineTo(167,5);c.lineTo(150,11);c.fill();c.restore();
   finch(c,window.FSOptions?.reducedMotion?0:elapsed);text(c,titles[id][0],55,33,16,'#4c716e');text(c,titles[id][1],55,75,35,ink);text(c,titles[id][2],55,115,19,'#3d5f61');
   box(c,925,28,115,46,'#fff4d9',ink,8);text(c,Math.max(0,Math.ceil(times[id]-elapsed))+' SEC',982,51,19,ink,'center');
   if(directive)text(c,String(directive).replace(/-/g,' ').toUpperCase(),55,686,15,'#8e684a');
   if(message)text(c,message,600,665,24,red,'center');
 }
 function drawPaper(it){let p=world.position(it);paperShadow(c,p.x,p.y,72,40);c.save();c.translate(p.x,p.y);c.rotate(p.angle);box(c,-72,-59,144,118,it.good?'#fffdf1':'#f6c8a8',ink,5);box(c,-64,-50,35,25,it.good?'#c8e9d4':'#f9e1c5',it.good?teal:red,4);text(c,it.good?'✓':'!',-47,-38,18,it.good?teal:red,'center');text(c,it.good?'APPROVED':'SPAM',13,-26,16,it.good?teal:red,'center');c.strokeStyle='#b7b9a8';for(let y=-4;y<40;y+=13){c.beginPath();c.moveTo(-49,y);c.lineTo(43,y);c.stroke()}c.restore()}
 function draw(){background();
   if(id==='I1'){for(const it of world.bodies)if(it.kind==='paper'&&!it.hit)drawPaper(it);for(const it of world.bodies)if(it.kind==='stamp'){let p=world.position(it);paperShadow(c,p.x,p.y,48,20);box(c,p.x-45,p.y-17,90,36,red);box(c,p.x-16,p.y-43,32,30,'#df9f67');box(c,p.x-25,p.y-53,50,18,ink);text(c,'STAMP',p.x,p.y+1,14,'white','center')} text(c,correct+' / 5 APPROVED',600,185,23,teal,'center');for(const b of bursts){let age=elapsed-b.time;if(age<.6){c.save();c.globalAlpha=1-age/.6;for(let j=0;j<8;j++){let a=j*Math.PI/4,r=50+age*70;c.fillStyle=j%2?gold:red;c.beginPath();c.arc(b.x+Math.cos(a)*r,b.y+Math.sin(a)*r,5,0,7);c.fill()}text(c,'APPROVED!',b.x,b.y-50-age*25,22,red,'center');c.restore()}}text(c,'Job Simulator asks: can the tool itself be fun? Feel the stamp land.',600,630,16,ink,'center');}
   if(id==='I3'){text(c,'Dumb Ways to Die: quick surprises. Here, help and choices carry forward.',600,652,15,ink,'center');for(const it of items.filter(i=>!i.closed)){box(c,it.x,it.y,it.w,it.h,it.real?'#d2efe1':'#ffd6b6');box(c,it.x,it.y,it.w,34,it.real?teal:red,ink,8);text(c,it.real?'MIRA • VERIFIED':'URGENT BUSINESS',it.x+12,it.y+17,15,cream);if(!it.real){text(c,'×',it.x+it.w-21,it.y+17,25,cream,'center');text(c,'YOU WON A MEETING!',it.x+it.w/2,it.y+77,17,ink,'center');text(c,'Close the fake ×',it.x+it.w/2,it.y+113,15,ink,'center')}else{text(c,'Real help: keep this open.',it.x+it.w/2,it.y+65,17,ink,'center')}}text(c,correct+' / 3 CLOSED',600,610,22,teal,'center')}
   if(id==='S1'){let p=world.position(target),tw=fastMode?90:150,th=fastMode?105:220;paperShadow(c,p.x,p.y+th/2-30,tw/2,25);box(c,p.x-tw/2,p.y-th/2,tw,th,'#75b8a2');box(c,p.x-tw/2+10,p.y-th/2+15,tw-20,35,'#244e53',ink,5);text(c,'FILE',p.x,p.y-th/2+33,14,cream,'center');text(c,fastMode?'FAST':'SAFE',p.x,p.y+th/2-22,14,ink,'center');let b=world.bodies.find(i=>i.kind==='bumper');if(b){let q=world.position(b);c.fillStyle=red;c.beginPath();c.arc(q.x,q.y,36,0,7);c.fill();c.strokeStyle=ink;c.lineWidth=3;c.stroke();text(c,'↗',q.x,q.y,30,cream,'center')}for(const it of world.bodies.filter(i=>i.kind==='folder'||i.kind==='ghost')){let q=world.position(it);paperShadow(c,q.x,q.y,65,35);c.save();c.translate(q.x,q.y);c.rotate(q.angle);box(c,-60,-45,120,90,it.kind==='ghost'?'#c0e7dc':'#edbf68');box(c,-60,-55,56,20,it.kind==='ghost'?'#c0e7dc':'#edbf68');c.fillStyle='rgba(255,255,255,.35)';c.fillRect(-46,-25,90,8);c.fillRect(-46,-9,64,6);text(c,it.kind==='ghost'?'COPY':'FILE',0,22,16,ink,'center');c.restore()}text(c,filed+' / 3 FILED',600,185,23,teal,'center');text(c,'Choose the close narrow chute or the farther wide chute.',600,630,16,ink,'center')}
   if(id==='S2'){for(const it of world.bodies.filter(i=>i.kind==='cup')){let p=world.position(it);paperShadow(c,p.x,p.y,32,15);c.save();c.translate(p.x,p.y);c.rotate(p.angle);box(c,-28,-36,56,72,'#fffdf1');c.strokeStyle=ink;c.lineWidth=5;c.beginPath();c.arc(29,-4,15,-1.3,1.3);c.stroke();c.fillStyle='#6e493b';c.beginPath();c.ellipse(0,-21,19,7,0,0,7);c.fill();c.strokeStyle='#b5cfc0';c.lineWidth=2;c.beginPath();c.moveTo(-12,3);c.lineTo(12,3);c.moveTo(-8,12);c.lineTo(8,12);c.stroke();c.restore()}let p=world.position(tray);let tw=fastMode?140:(has('magnet-grip')?330:250);paperShadow(c,p.x,p.y,tw/2+3,18);box(c,p.x-tw/2,p.y-13,tw,26,'#6ea997');c.fillStyle='#b7dfc9';c.fillRect(p.x-tw/2+20,p.y-7,tw-40,5);text(c,caught+' / 3 CAUGHT',600,190,23,teal,'center');text(c,'Move the tray with your pointer',600,650,18,ink,'center')}
   if(id==='P1'){box(c,220,205,760,380,'#fffdf1');text(c,'QUARTERLY DELIGHT',600,222,18,ink,'center');c.strokeStyle=ink;c.lineWidth=5;c.beginPath();c.moveTo(350,280);c.lineTo(350,axis);c.lineTo(840,axis);c.stroke();let progress=(axis-420)/115, h1=80+progress*170, h2=160+progress*98;c.fillStyle=teal;c.fillRect(450,axis-h1,100,h1);c.fillStyle=gold;c.fillRect(630,axis-h2,100,h2);text(c,'1240',500,axis-h1-20,20,ink,'center');text(c,'1280',680,axis-h2-20,20,ink,'center');box(c,302,axis-20,95,40,red);text(c,chartReady?'0':'DRAG ↓',350,axis,15,cream,'center');text(c,chartReady?'+40 = 3.2% growth':'Axis starts at 1200: an impressive-looking crop!',600,570,18,ink,'center');if(chartReady){box(c,850,600,160,55,gold);text(c,'SEND →',930,628,20,ink,'center')}}
   if(id==='P4'){box(c,80,300,270,230,'#f1c46a');text(c,'HEADLINE',215,385,26,ink,'center');text(c,'Staff priority pass',215,425,17,ink,'center');box(c,850,300,270,230,'#9fd0bd');text(c,'CONTEXT',985,385,26,ink,'center');text(c,'Longer boss warning',985,425,17,ink,'center');for(const it of world.bodies.filter(it=>it.kind==='report'||it.kind==='reportGhost')){const p=world.position(it),small=it.kind==='reportGhost',w=small?110:180,h=small?140:210;paperShadow(c,p.x,p.y,w/2,h/3);c.save();c.translate(p.x,p.y);c.rotate(p.angle);box(c,-w/2,-h/2,w,h,small?'#c7ebdf':'#fffdf1');text(c,small?'COPY':'VERIFIED',0,-h/2+35,small?15:18,teal,'center');text(c,'1240 → 1280',0,0,small?13:20,ink,'center');text(c,'+3.2%',0,40,small?18:24,red,'center');c.restore()}}
   if(id==='T1'){box(c,60,270,160,300,'#93c5a9');text(c,'EXIT',140,420,28,ink,'center');for(const it of items.filter(i=>!i.used))person(c,it.x+45,it.y,it.name,it.color,window.FSOptions?.reducedMotion?0:elapsed);text(c,rescued+' / 3 RESCUED',700,200,23,teal,'center');text(c,'Hold and guide each coworker through the green door.',650,635,17,ink,'center');if(rescued>=2){box(c,875,600,200,50,gold);text(c,'CONTINUE →',975,625,18,ink,'center')}}
   if(id==='T4'){person(c,250,300,'MIRA','#e8a76b',window.FSOptions?.reducedMotion?0:elapsed);person(c,600,300,'JULES','#7cb5a6',window.FSOptions?.reducedMotion?0:elapsed);box(c,865,340,200,190,'#f0cf83');text(c,'SAVE',965,420,26,ink,'center');text(c,'$40',965,455,20,ink,'center');for(const it of items.filter(i=>!i.used)){box(c,it.x,it.y,it.w,it.h,'#fffdf1');text(c,'$40',it.x+55,it.y+37,24,teal,'center')}text(c,`MIRA ${allocations.mira}   •   JULES ${allocations.jules}   •   SAVED $${allocations.save*40}`,600,625,19,ink,'center')}
   if(directive==='MANDATORY COLLABORATION'&&(id==='T1'||id==='T4')){box(c,885,550,200,45,assistActive?'#b2dfc8':'#f7dca1');text(c,assistActive?'TEAM ASSIST ON':'ASK TEAM FOR HELP',985,573,14,ink,'center');}
   if(id==='S1'&&directive==='FAST OR SAFE'){box(c,75,205,225,48,fastMode?'#f7dca1':'#b2dfc8');text(c,fastMode?'FAST • CLOSE / NARROW':'SAFE • FAR / WIDE',187,229,14,ink,'center')}
   if(id==='S2'&&directive==='FAST OR SAFE'){box(c,900,205,195,48,fastMode?'#f7dca1':'#b2dfc8');text(c,fastMode?'FAST • HIGH / NARROW':'SAFE • LOW / WIDE',997,229,14,ink,'center')}
   if(notice){box(c,notice.x,notice.y,notice.w,notice.h,notice.real?'#dbf5e4':'#ffd3bd',notice.real?teal:red);text(c,notice.real?'✓ MIRA • REAL HELP':'AD • FAKE BONUS       ×',notice.x+12,notice.y+24,15,notice.real?teal:red);text(c,notice.real?'Click for a steady hand':'Close with the ×',notice.x+12,notice.y+58,14,ink)}
 }
 function pointerDown(x,y){if(done)return;if(id==='S1'&&directive==='FAST OR SAFE'&&x>=75&&x<=300&&y>=205&&y<=253){fastMode=!fastMode;const old=world.position(target);world.remove(target);target=world.box({id:'chute',kind:'chute',x:fastMode?850:1000,y:old.y,w:fastMode?90:150,h:fastMode?105:220,kinematic:true,sensor:true});message=fastMode?'FAST ROUTE':'SAFE ROUTE';return}if(directive==='MANDATORY COLLABORATION'&&(id==='T1'||id==='T4')&&x>=885&&x<=1085&&y>=550&&y<=595){assistActive=true;message=id==='T1'?'TEAM WIDENS EXIT':'TEAM WIDENS DROP ZONES';return}if(id==='S2'&&directive==='FAST OR SAFE'&&x>=900&&x<=1095&&y>=205&&y<=253){fastMode=!fastMode;const old=world.position(tray);world.remove(tray);tray=world.box({id:'tray',kind:'tray',x:old.x,y:fastMode?490:610,w:fastMode?140:(has('magnet-grip')?330:250),h:26,kinematic:true,friction:.8,restitution:.15});message=fastMode?'FAST ROUTE':'SAFE ROUTE';return}if(notice&&inside(x,y,notice)){if(notice.real){noticeHandled++;helpActive=true;if(id==='P4'){for(const bin of [...world.bodies])if(bin.kind==='reportBin')world.remove(bin);world.box({id:'headline-bin',kind:'reportBin',route:'headline',x:215,y:415,w:470,h:230,sensor:true});world.box({id:'context-bin',kind:'reportBin',route:'context',x:985,y:415,w:470,h:230,sensor:true})}const n=notices.find(n=>n.id===notice.noticeId);if(n)n.handled=true;message=id==='P1'?'MIRA: Wider snap zone!':id==='P4'?'MIRA: Wider routing zones!':'MIRA: You have this!'}else if(x>notice.x+notice.w-55){scamsDismissed++;message='SCAM CLOSED!'}else{updateStreak(false);message='That was a counterfeit offer!'}notice=null;return}
   if(id==='I1'){for(const it of world.bodies.filter(i=>i.kind==='paper'&&!i.hit)){let p=world.position(it);if(Math.abs(x-p.x)<73&&Math.abs(y-p.y)<60){const stamp=world.box({id:'stamp'+elapsed,kind:'stamp',x:p.x+140,y:p.y-120,w:70,h:40,dynamic:true,density:3,bullet:true,restitution:.35});world.velocity(stamp,-250,350);return}}}
   else if(id==='I3'){for(const it of items.filter(i=>!i.closed)){if(inside(x,y,it)){if(it.real){it.closed=true;updateStreak(false);noticeHandled=0;message='Mira’s help was genuine!'}else if(x>it.x+it.w-55&&y<it.y+45){it.closed=true;scamsDismissed++;updateStreak(true);if(correct===3){noticeHandled=items.some(i=>i.real&&!i.closed)?1:0;notices[0].handled=!!noticeHandled;complete(true)}}else{updateStreak(false);message='Try the ×, not the offer!'}return}}}
   else if(id==='S1'){drag=world.grab(x,y,it=>it.kind==='folder');if(drag)drag.manual=true;}
   else if(id==='S2'){moveTray(x)}
   else if(id==='P4'){drag=world.grab(x,y,it=>it.kind==='report');if(drag)drag.manual=true;}
   else if(id==='P1'){if(chartReady&&x>850&&y>600){updateStreak(true);complete(true)}else if(Math.abs(y-axis)<40&&x>290&&x<420)drag={kind:'axis'}}
   else if(id==='T1'&&rescued>=2&&x>875&&y>600){outcome.workersHelped=rescued;complete(true)}
   else if(id==='T1'||id==='T4'){for(let i=items.length-1;i>=0;i--){const it=items[i];if(!it.used&&inside(x,y,it)){drag={item:it,dx:x-it.x,dy:y-it.y};return}}}
 }
 function pointerMove(x,y){if(done)return;if((id==='S1'||id==='P4')&&drag)world.move(x,y);else if(id==='S2')moveTray(x);else if(id==='P1'&&drag){axis=Math.max(420,Math.min(535,y));if(axis>=(helpActive?480:has('chain-stamp')?500:525)){chartReady=true;axis=535;drag=null;message='The scale tells a different story.'}}else if(drag&&drag.item){drag.item.x=x-drag.dx;drag.item.y=y-drag.dy}}
 function pointerUp(x,y){if(done)return;if((id==='S1'||id==='P4')&&drag){world.release();drag=null;return}if(id==='P1'){drag=null;return}if(!drag||!drag.item)return;const it=drag.item;drag=null;

   if(id==='T1'){if(x<(assistActive?300:225)){it.used=true;rescued++;updateStreak(true);message='SAFE!';if(rescued===3){outcome.workersHelped=rescued;complete(true)}}else {it.x=Math.max(260,Math.min(1000,it.x));it.y=380;message='Guide them to the door.'}}
   if(id==='T4'){let who=x<400?'mira':x<800?'jules':'save';if(y>(assistActive?235:270)&&y<(assistActive?610:570)){it.used=true;allocations[who]++;updateStreak(true);message=who==='save'?'$40 SAVED':who.toUpperCase()+' HAS ACCESS';if(items.every(i=>i.used)){outcome.licenceAssignments=allocations;outcome.savedDollars=allocations.save*40;complete(true)}}else{it.x=it===items[0]?430:650;it.y=420}}
 }
 return {update,draw,pointerDown,pointerMove,pointerUp,cancelPointer(){if(world)world.release();drag=null},destroy(){if(world)world.destroy()},snapshot(){return {id,elapsed,correct,wrong,filed,scamsDismissed,copyResolved,assistActive,helpActive,fastMode,done,caught,rescued,allocations:{...allocations},reportChoice,noticeSeen,noticeHandled,items:world?world.bodies.map(i=>({id:i.id,kind:i.kind,w:i.w,h:i.h,...world.position(i)})):items.map(i=>({...i}))}}};
}
global.FSCreateMicrogame=FSCreateMicrogame;
})(window);
