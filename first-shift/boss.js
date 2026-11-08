/* Three-phase Planck countershot. All coordinates are in the 1200 × 760 game space. */
(function(g){'use strict';
 g.FSCreateBoss=function({ctx:c,perks=[],story={},licences={},onPacket,onBolt,onComplete,onSound=()=>{}}){
  let phase=0,packet=0,chosen=0,pressure=0,opening=0,t=0,drag=false,last=null,start=null,launched=false,hit=false,finished=false,flash=0,confirmed=false,collision=false,recovery=0,aidUsed=false,scamUsed=false,chainUsed=false,gearTouched=false,bankPending=false,lastAttack=-1;
  const level=id=>perks.filter(p=>p===id).length,has=id=>level(id)>0, access=who=>(licences.targets||[]).includes(who);
  const names=['APPROVED','SPONSORED','OPTIMISE'], need=[1,1,2];
  let world,shot,bolt,bumper,hazard,obstacles=[];
  const vec=(x,y)=>({x,y});
  function create(){
   world?.destroy(); hit=false; chosen=0; t=0; drag=false; launched=false; confirmed=phase!==2; collision=false; recovery=0; opening=story.reportChoice==='context'?.5:0;aidUsed=false;scamUsed=false;chainUsed=false;gearTouched=false;bankPending=false;lastAttack=-1;
   world=new FSPhysics.World({gravityX:0,gravityY:0,onContact:(a,b)=>{
    if(((a.id==='shot'&&b.id==='gear')||(b.id==='shot'&&a.id==='gear'))&&launched&&!drag){gearTouched=true;bankPending=true}
    if(((a.id==='shot'&&b.id==='bolt')||(b.id==='shot'&&a.id==='bolt'))&&launched&&!drag&&windowOpen()&&(phase!==1||gearTouched)){hit=true;flash=1}
    if((a.id==='shot'&&b.id==='hazard')||(b.id==='shot'&&a.id==='hazard'))collision=true;
   }});
   // Boundaries are rigid and retain the countershot on the desk.
   world.box({id:'wallL',x:92,y:435,w:20,h:570});world.box({id:'wallR',x:1110,y:435,w:20,h:570});
   world.box({id:'wallT',x:600,y:157,w:1030,h:20});world.box({id:'wallB',x:600,y:702,w:1030,h:20});
   shot=world.circle({id:'shot',x:340,y:590,r:30,dynamic:true,density:1.6,friction:.25,restitution:.75+.12*level('carbon-copy'),bullet:true,damping:.18});
   bolt=world.circle({id:'bolt',x:840,y:280,r:46,sensor:true});
   hazard=phase===0?world.box({id:'hazard',x:500,y:-200,w:144,h:94,kinematic:true,restitution:.8}):world.circle({id:'hazard',x:500,y:-200,r:38,kinematic:true,restitution:.8});
   if(phase>=1) bumper=world.circle({id:'gear',x:640,y:405,r:52,restitution:1.05+.18*level('bank-shot')+(has('bank-shot')&&has('magnet-grip')?.12:0),kinematic:true});
   if(phase===2){obstacles=[world.box({id:'lane',x:630,y:290,w:24,h:165,kinematic:true,restitution:.9})]} else obstacles=[];
  }
  create();
  function text(s,x,y,size,color='#173c3c',align='left',weight=900){c.font=`${weight} ${size}px Trebuchet MS,Arial`;c.fillStyle=color;c.textAlign=align;c.textBaseline='middle';c.fillText(s,x,y)}
  function panel(x,y,w,h,col,stroke='#173c3c',r=12){c.fillStyle=col;c.strokeStyle=stroke;c.lineWidth=3;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();c.stroke()}
  function windowOpen(){return ((t % (5.8-pressure*.65)) < 2.3+opening+(story.workersHelped===3?.3:0))}
  function draw(){
   c.fillStyle='#17373a';c.fillRect(0,0,1200,760);c.fillStyle='#294f4e';for(let x=0;x<1200;x+=80)c.fillRect(x,0,2,760);
   panel(32,90,1136,635,'#e9ddbd');panel(65,130,1070,582,'#b4c9b2');
   c.save();c.globalAlpha=.22;c.strokeStyle='#477765';c.lineWidth=2;for(let y=185;y<700;y+=65){c.beginPath();c.moveTo(85,y);c.lineTo(1115,y);c.stroke()}c.restore();
   // A visible warning precedes each physical attack, with CONTEXT extending it.
   if(chosen>=need[phase]&&confirmed){let cycle=(t*(1+pressure*.12))%4.8,telegraph=1.1+(story.reportChoice==='context'?.5:0);if(cycle<telegraph){let hx=phase===0?450:phase===1?580+Math.sin(t)*120:400+cycle*115;c.save();c.strokeStyle='#c65342';c.fillStyle='rgba(225,97,68,.13)';c.setLineDash([10,8]);c.lineWidth=4;c.fillRect(hx-48,177,96,470);c.strokeRect(hx-48,177,96,470);c.setLineDash([]);text('INCOMING',hx,245,13,'#a43e31','center');c.restore()}}
   // The promotion modules visibly form the machine.
   c.fillStyle='rgba(20,50,49,.2)';c.beginPath();c.ellipse(867,448,145,22,0,0,7);c.fill();
   if(g.FSArt?.machine)g.FSArt.machine(c,867,443,1.25,4,hit?'hit':phase===2?'telegraph':'idle',g.FSOptions?.reducedMotion?0:t);
   else {panel(780,230,175,205,'#d59a69');text('THE QUOTA',867,360,20,'#173c3c','center')}
   text('THE QUOTA',867,195,19,'#173c3c','center');
   for(let i=0;i<4;i++)panel(754+i*59,449,50,25,i<packet?'#ed7957':'#e5d7b7');
   const bp=world.position(bolt);c.beginPath();c.arc(bp.x,bp.y,45,0,Math.PI*2);c.fillStyle=hit?'#fff5cc':windowOpen()?'#e75440':'#7b7770';c.fill();c.lineWidth=6;c.strokeStyle='#173c3c';c.stroke();text(windowOpen()?'✦':'×',bp.x,bp.y,42,'#fff3ce','center');
   if(chosen>=need[phase]&&confirmed){const hp=world.position(hazard);if(phase===0){panel(hp.x-72,hp.y-47,144,94,'#c95240');panel(hp.x-46,hp.y-62,92,23,'#edbe73');text('APPROVED',hp.x,hp.y,17,'#fff1d4','center')}else{c.beginPath();c.arc(hp.x,hp.y,38,0,7);c.fillStyle='#c95240';c.fill();c.strokeStyle='#173c3c';c.lineWidth=4;c.stroke();text(phase===1?'AD!':'KPI',hp.x,hp.y,13,'#fff1d4','center')}}
   if(bumper){const p=world.position(bumper);c.save();c.translate(p.x,p.y);c.rotate(t*1.4);c.fillStyle='#d78c50';c.strokeStyle='#173c3c';c.lineWidth=5;c.beginPath();for(let i=0;i<16;i++){let a=i*Math.PI/8,r=i%2?46:58;c.lineTo(Math.cos(a)*r,Math.sin(a)*r)}c.closePath();c.fill();c.stroke();c.restore();text('AD',p.x,p.y,18,'#173c3c','center')}
   if(phase===1&&chosen>=need[phase]&&confirmed){if(!aidUsed){panel(110,200,200,66,'#a5d4b9');text('✓ MIRA / HELP',210,232,16,'#173c3c','center')}if(!scamUsed){panel(110,280,200,66,'#ef9d79');text('AD / FREE HELP!',210,312,16,'#173c3c','center')}}
   for(const ob of obstacles){let p=world.position(ob);panel(p.x-12,p.y-82,24,164,'#e97955')}
   const p=world.position(shot);c.save();c.translate(p.x,p.y);c.rotate(p.angle);c.fillStyle='#f3bf55';c.strokeStyle='#173c3c';c.lineWidth=5;c.beginPath();c.arc(0,0,30,0,7);c.fill();c.stroke();text('✚',0,0,32,'#173c3c','center');c.restore();
   text('THE QUOTA / '+names[phase],55,42,28,'#f8edd4');text('PHASE '+(phase+1)+' / 3',1020,43,17,'#f3bf55','right');
   text('DRAG THE GOLD COUNTERSHOT, THEN FLING IT INTO THE RED BOLT',600,112,17,'#173c3c','center');
   if(chosen<need[phase]){panel(260,475,680,180,'#fff4d8');text('PACKET '+(packet+1)+' / 4',600,510,22,'#173c3c','center');text('FILE feeds the machine. COOL buys a longer opening.',600,542,17,'#39605b','center');panel(312,570,250,60,'#ed7955');text('FILE  +5 QUOTA',437,600,19,'#173c3c','center');panel(638,570,250,60,'#8dcdb5');text('COOL  + SAFE TIME',763,600,19,'#173c3c','center')}
   else if(!confirmed){panel(355,505,490,130,'#fff4d8');text('DOUBLE ENTRY: OPEN THE FEEDER',600,536,18,'#173c3c','center');panel(465,560,270,52,'#8dcdb5');text('CONFIRM ENTRY',600,586,18,'#173c3c','center')}
   else {text('BOLT '+(phase+1)+' / 3  •  '+(phase===0?'DODGE THE STAMP':phase===1?(gearTouched?'GEAR CONTACT! AIM FOR RED':'BOUNCE OFF THE AD GEAR FIRST'):'DOUBLE ENTRY / SHIFTING LANE'),600,678,16,'#173c3c','center');text(windowOpen()?'FEEDER OPEN — AIM FOR RED':'FEEDER CLOSED — WAIT FOR RED',600,158,15,'#477866','center');if(recovery>0)text((story.miraHelped||access('mira')||has('mira-backup')||has('safety-net')?'MIRA / SAFETY NET: QUICK RETURN!':'COUNTERSHOT RETURNING...'),600,200,16,'#a43f2e','center')}
   if(flash>0&&!g.FSOptions?.reducedMotion){c.fillStyle=`rgba(255,255,220,${Math.min(.4,flash*.4)})`;c.fillRect(0,0,1200,760)}
  }
  function update(dt){if(chosen<need[phase]||!confirmed)return;t+=dt;flash=Math.max(0,flash-dt*2);recovery=Math.max(0,recovery-dt);if(bumper)world.setPosition(bumper,630+Math.sin(t*(access('jules')?.8:1.4))*95,410);if(obstacles[0])world.setPosition(obstacles[0],610,330+Math.sin(t*1.1)*100);
   // Each phase sends an actual rigid attack along a different predictable lane.
   const attackTime=t*(1+pressure*.12),cycle=attackTime%4.8,attackIndex=Math.floor(attackTime/4.8);let hx=phase===0?450:phase===1?580+Math.sin(t)*120:400+cycle*115;let telegraph=1.1+(story.reportChoice==='context'?.5:0);let hy=cycle<telegraph?-150:170+(cycle-telegraph)*155;if(cycle>=telegraph&&attackIndex!==lastAttack){lastAttack=attackIndex;onSound('attack')}if(story.reportChoice==='headline'&&t<2)hy=-150;world.setPosition(hazard,hx,hy);
   world.step(dt);if(bankPending){bankPending=false;const p=world.position(shot),b=world.position(bolt),dx=b.x-p.x,dy=b.y-p.y,d=Math.max(1,Math.hypot(dx,dy)),speed=470+level('bank-shot')*70;world.velocity(shot,dx/d*speed,dy/d*speed);onSound('file')}
   if(collision){collision=false;launched=false;gearTouched=false;onSound('attack');world.setPosition(shot,340,590);world.velocity(shot,0,0);recovery=Math.max(.2,1.4-.25*(level('mira-backup')+level('safety-net'))-(story.miraHelped?.3:0)-(access('mira')?.3:0))}
   // If a real sensor contact begins while the feeder is closed, it becomes
   // valid when the feeder opens; merely dragging a shot onto it never does.
   if(launched&&!drag&&windowOpen()&&(phase!==1||gearTouched)){for(let edge=shot.body.getContactList();edge;edge=edge.next){if(edge.other===bolt.body&&edge.contact.isTouching()){hit=true;flash=1;break}}}
   const p=world.position(shot);if(p.x<110||p.x>1090||p.y<170||p.y>690){launched=false;gearTouched=false;world.setPosition(shot,340,590)}if(hit){hit=false;onSound('hit');onBolt(phase+1);if(phase===2){if(!finished){finished=true;onSound('defeat');onComplete()}}else{phase++;create()}}}
  function down(x,y){if(chosen<need[phase]){let choice=(y>=570&&y<=630&&x>=312&&x<=562)?'file':(y>=570&&y<=630&&x>=638&&x<=888)?'cool':null;if(choice){packet++;chosen++;if(choice==='file')pressure=Math.min(2,pressure+1);else opening+=.75;onSound('choice');onPacket(packet,choice); }return}if(!confirmed){if(x>=465&&x<=735&&y>=560&&y<=612){confirmed=true;onSound('choice')}return}if(phase===1&&x>=110&&x<=310){if(y>=200&&y<=266&&!aidUsed){aidUsed=true;opening+=.5;onSound('choice');return}if(y>=280&&y<=346&&!scamUsed){scamUsed=true;pressure=Math.min(2,pressure+1);onSound('attack');return}}if(recovery>0)return;let selected=world.grab(x,y,it=>it.id==='shot');if(selected){drag=true;last=vec(x,y);start=vec(x,y)}}
  function move(x,y){if(drag){world.move(x,y);last=vec(x,y)}}
  function up(x,y){if(!drag)return;world.release();drag=false;let dx=x-start.x,dy=y-start.y;let p=world.position(shot),b=world.position(bolt);if(Math.hypot(p.x-b.x,p.y-b.y)<100){world.setPosition(shot,340,590);world.velocity(shot,0,0);launched=false;return}let scale=3+.4*level('magnet-grip');launched=Math.hypot(dx,dy)>25;if(launched&&has('chain-stamp')&&!chainUsed){opening+=.4*level('chain-stamp')+(has('carbon-copy')?.35:0);chainUsed=true}world.velocity(shot,Math.max(-1100,Math.min(1100,dx*scale)),Math.max(-1100,Math.min(1100,dy*scale)));last=null}
  function cancel(){world.release();drag=false;launched=false}
  return {draw,update,pointerDown:down,pointerMove:move,pointerUp:up,cancelPointer:cancel,destroy:()=>world.destroy(),snapshot:()=>({phase,packet,chosen,pressure,opening,gearTouched,feederOpen:windowOpen(),shot:world.position(shot),bolt:world.position(bolt),gear:bumper?world.position(bumper):null})};
 }
})(window);
