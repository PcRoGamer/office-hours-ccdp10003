/* THE QUOTA: three real counters, four immutable FILE/COOL decisions.
 * Native ESM. World coordinates are viewport.worldWidth x viewport.worldHeight.
 * Does not own HUD, global score, physics implementation or time source.
 */
export const BONUS_IDS=Object.freeze(['quota:p1:b1','quota:p2:b1','quota:p3:b1','quota:p3:b2']);
export const DIRECTIVES=Object.freeze(['DOUBLE ENTRY','MOVING GOALPOSTS','FAST OR SAFE','SPONSORED WORKFLOW','MANDATORY COLLABORATION']);
const CLAMP=(n,a,b)=>Math.max(a,Math.min(b,n));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const REACTIONS={file:'QUOTA LOVES THAT. +5',cool:'TURBINES DRINK THE PAPER.',expired:'MISSED OPPORTUNITY. +0'};
const PHASES=[{name:'APPROVED',task:'PULL THE JAM. HIT THE GEAR.',caption:'A stamp. A jam. An opening.'},{name:'OPTIMISED',task:'MOVE THE FAKE AD. THROW!',caption:'One message is genuine. One wants your desk.'},{name:'PROMOTED',task:'ROUTE, PULL, COUNTER!',caption:'Every promotion came with hardware.'}];
const normalizeDirective=x=>String(x||'').toUpperCase().replace(/[-_]/g,' ').replace(/\s+/g,' ').trim();
const perkLevel=(ctx,id)=>ctx?.run?.perkLevels?.[id]||ctx?.run?.perkLevels?.[`perk:${id}`]||0;

export function createQuotaBoss(context={}){
  const listeners=context.events;
  const bonus=Object.create(null), events=[];
  const phaseCounters=new Set();
  let phase=1, mode='intro', clock=0, timer=1.7, activeTime=0;
  let pressure=0, coolWindow=0, hearts=3, bolts=0, drag=null, packetFlights=[];
  let scanUsed=false, supportUsed=false, printed=false, slash=0, shake=0, beam=0;
  let msg='CONGRATULATIONS. YOUR PRODUCTIVITY HAS BECOME SELF-SUSTAINING.';
  let result='', introShown=false, counterReady=false, doubleVerified=false;
  let phase3Second=false, routeDone=false, latchDone=false, aidUsed={};
  let targetOffset=0, gateSeconds=0, openElapsed=0, adsRemaining=1, safetyUsed=false, timeBankSpent=0;
  const id=context.run?.runId||`quota-preview-${context.run?.seed??0}`;
  const directive=normalizeDirective(context.run?.currentDirective?.id||context.run?.currentDirective||context.options?.directive||'DOUBLE ENTRY');
  const prefs={motion:context.options?.reducedMotion||false};
  const emit=(type,evidence={})=>{const ev=Object.freeze({type,bossId:'B2',phase,attemptId:`${id}:quota:phase${phase}`,tActiveMs:Math.round(activeTime*1000),...evidence});events.push(ev);listeners?.emit?.(ev);};
  const W=()=>context.viewport?.worldWidth||1200;
  const H=()=>context.viewport?.worldHeight||760;
  const pt=(x,y)=>({x:W()*x,y:H()*y});
  const packetAt=()=>pt(.5,.792);
  const sheetAt=()=>pt(.21,.8);
  const gearAt=()=>pt(.5+targetOffset,.39);
  const stripAt=()=>pt(.25,.70);
  const stripTo=()=>pt(.25,.55);
  const popupAt=()=>pt(adsRemaining>1?.53:.66,adsRemaining>1?.51:.47);
  const popupTo=()=>pt(.84,.70);
  const documentAt=()=>pt(.17,.78);
  const safeAt=()=>pt(.46,.65);
  const latchAt=()=>pt(.74,.55);
  const latchTo=()=>pt(.74,.72);
  const near=(a,b,r=60)=>distance(a,b)<=r*(Math.min(W()/1200,1)*.45+.55)*(perkLevel(context,'magnet-grip')?1.20:1);
  function tell(t,seconds=1.5){msg=t;slash=seconds;}
  function currentBonus(){return BONUS_IDS.find((k,i)=>i===0&&phase===1&&!bonus[k]||i===1&&phase===2&&!bonus[k]||i===2&&phase===3&&!bonus[k]||i===3&&phase===3&&phase3Second&&!bonus[k]);}
  function nextMode(){
    drag=null;scanUsed=false;
    if(phase===1){mode='telegraph';timer=2.05;tell('STAMP ARM ARMED. WAIT FOR THE REBOUND.');}
    else if(phase===2){mode='ads';adsRemaining=directive==='SPONSORED WORKFLOW'?2:1;timer=0;tell('THE FAKE AD IS COVERING THE GEAR. MOVE IT.');}
    else if(!routeDone){mode='route';timer=0;tell('WATCH THE SWEEP. ROUTE THE DOCUMENT.');}
    else if(!latchDone){mode='latch';timer=0;tell('PULL THE LAST LATCH.');}
    else openCounter();
  }
  function offerBonus(){mode='bonus';timer=8.5;drag=null;const k=currentBonus();tell(`BONUS REPORT ${k?.split(':').slice(-2).join('/').toUpperCase()||''}: FILE +5 OR COOL?`,2);}
  function expireBonus(){const k=currentBonus();if(k)resolveBonus(k,'expired');}
  function resolveBonus(key,choice){
    if(!BONUS_IDS.includes(key)||bonus[key]||!['file','cool','expired'].includes(choice))return false;
    // Only the currently offered packet may be resolved. No hidden fifth packet.
    if(key!==currentBonus())return false;
    bonus[key]=choice;
    if(choice==='file')pressure=CLAMP(pressure+1,0,2);
    if(choice==='cool'){pressure=CLAMP(pressure-1,0,2);coolWindow+=.75;}
    emit('quota-bonus-resolved',{objectId:key,outcome:choice,delta:choice==='file'?5:0,synthetic:false});
    tell(REACTIONS[choice],2.1);shake=choice==='file'?.42:.12;
    if(phase===3&&key==='quota:p3:b1'&&routeDone&&!phase3Second)phase3Second=true;
    if(phase===3&&key==='quota:p3:b1'&&phase3Second&&!bonus['quota:p3:b2']) offerBonus();
    else if(phase===3&&key==='quota:p3:b1'&&!phase3Second)nextMode();
    else if(key==='quota:p3:b2')nextMode();
    else nextMode();
    return true;
  }
  function startPhase(n){phase=n;counterReady=false;doubleVerified=false;routeDone=false;latchDone=false;phase3Second=false;supportUsed=false;scanUsed=false;safetyUsed=false;targetOffset=0;adsRemaining=directive==='SPONSORED WORKFLOW'?2:1;
    if(n>3){mode='clockout';timer=0;tell('ONE LAST FORM. CLOCK OUT.',3);return;}
    mode='bonus';timer=8.5;tell(`PHASE ${['I','II','III'][n-1]}: ${PHASES[n-1].name}`,2.4);
  }
  function openCounter(){mode=directive==='DOUBLE ENTRY'&&!doubleVerified?'verify':'opening';
    if(mode==='verify'){timer=0;tell('DOUBLE ENTRY: SLAM THE VERIFICATION SEAL.');return;}
    const base=3.35-(pressure===2?.65:pressure===1?.25:0);
    gateSeconds=pressure===2?.80:0;openElapsed=0;
    const licence=phase===3&&context.run?.licences?.jules&&!aidUsed.jules?.75:0;
    if(licence)aidUsed.jules=true;
    timer=Math.max(1.85,base+coolWindow+licence+(context.run?.publicRelationsFrame==='context'?.6:0));
    coolWindow=0;counterReady=true;
    tell(phase===3?'THE LAST GEAR IS EXPOSED. FLING THE COUNTER!':'GEAR EXPOSED. THROW THE COUNTER PACKET!',2);
    if(directive==='MOVING GOALPOSTS'&&phase===2)targetOffset=.13;
  }
  function counterHit(){
    if(mode!=='opening'||timer<=0||phaseCounters.has(phase))return false;
    const p=phase;phaseCounters.add(p);bolts++;mode='counter-hit';timer=1.2;counterReady=false;shake=.7;
    emit('boss-phase-complete',{objectId:`quota:bolt:${p}`,outcome:'counter',boltsRemoved:bolts,synthetic:false});
    tell(`BOLT ${p} SHEARED OFF! ${3-bolts} TO GO.`,2.3);
    return true;
  }
  function counterMiss(){if(mode==='opening'){tell('BOUNCED! THE PACKET RETURNS. WATCH THE OPENING.');shake=.22;}}
  function restartWindow(){counterReady=false;drag=null;doubleVerified=false;
    if(phase===1){mode='telegraph';timer=1.8;}
    else if(phase===2){mode='ads';timer=0;}
    else if(phase===3){mode='latch';timer=0;}
    tell('MISSED THE GEAR. RE-OPEN THE FEEDER.',1.6);
  }
  function applyAid(kind){if(supportUsed)return false;
    if(kind==='mira'&&!(context.run?.licences?.mira||perkLevel(context,'mira-backup')))return false;
    if(kind==='jules'&&!(context.run?.licences?.jules||directive==='MANDATORY COLLABORATION'))return false;
    supportUsed=true;if(mode==='opening')timer+=kind==='jules'?.75:.45;
    if(kind==='mira'){if(mode==='ads'){mode='opening';openCounter();}else if(mode==='opening')timer+=.55;}
    tell(`${kind.toUpperCase()} ACTUALLY HELPED!`,1.8);
    emit('boss-assist',{objectId:`quota:${kind}:phase${phase}`,outcome:'activated',synthetic:false});return true;
  }
  function scan(){if(!perkLevel(context,'focus-lens')||scanUsed)return false;scanUsed=true;tell(`FOCUS LENS: ${mode==='ads'?'RIGHT-HAND NOTICE IS FAKE':'GEAR OPENS AFTER THE STRIPE'}`,2.3);return true;}
  function update(dt){
    if(!Number.isFinite(dt)||dt<=0||mode==='complete'||mode==='paused')return;
    dt=CLAMP(dt,0,.05);activeTime+=dt;clock+=dt;slash=Math.max(0,slash-dt);shake=Math.max(0,shake-dt);beam+=dt;
    if(mode==='intro'&& (timer-=dt)<=0){introShown=true;startPhase(1);}
    else if(mode==='bonus'&&(timer-=dt)<=0)expireBonus();
    else if(mode==='telegraph'&&(timer-=dt)<=0){mode='recovery';timer=2.65;tell('ARM REBOUNDING! PULL THE FEED STRIP.');}
    else if(mode==='recovery'&&(timer-=dt)<=0){mode='telegraph';timer=2.05;tell('TOO SLOW. HERE COMES THE STAMP AGAIN.');}
    else if(mode==='opening'){openElapsed+=dt;gateSeconds=Math.max(0,gateSeconds-dt);if((timer-=dt)<=0)restartWindow();}
    else if(mode==='counter-hit'&&(timer-=dt)<=0){if(phase===3){startPhase(4);}else startPhase(phase+1);}
    else if(mode==='route'&&phase===3){/* alternate telegraphed sweeps, never overlapping */}
    if(packetFlights.length){packetFlights=packetFlights.filter(p=>{p.life-=dt;return p.life>0;});}
  }
  function targets(){
    const obj={};
    if(mode==='bonus'){obj.bonus=packetAt();obj.file=pt(.18,.66);obj.cool=pt(.82,.66);obj.skip=pt(.5,.87);}
    if(mode==='recovery'){obj.strip=stripAt();obj.stripTo=stripTo();}
    if(mode==='ads'){obj.fake=popupAt();obj.trash=popupTo();obj.mira=pt(.19,.40);}
    if(mode==='route'){obj.doc=documentAt();obj.safe=safeAt();}
    if(mode==='latch'){obj.latch=latchAt();obj.latchTo=latchTo();}
    if(mode==='verify'){obj.seal=pt(.73,.48);}
    if(mode==='opening'){obj.counter=sheetAt();obj.gear=gearAt();}
    if(mode==='clockout'){obj.stamp=pt(.50,.80);obj.stampTo=pt(.50,.37);}
    return obj;
  }
  function pointerDown(p){if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))return false;
    const t=targets();const key=['bonus','strip','fake','doc','latch','counter','stamp'].find(k=>t[k]&&near(p,t[k],k==='bonus'?49:66));
    if(key){drag={key,start:{x:p.x,y:p.y},at:{x:p.x,y:p.y},id:p.id??0};return true;}
    if(mode==='bonus'&&near(p,t.skip,85)){expireBonus();return true;}
    if(mode==='verify'&&near(p,t.seal,84)){doubleVerified=true;openCounter();return true;}
    if(mode==='ads'&&near(p,t.mira,72))return applyAid('mira');
    if(near(p,pt(.08,.18),75))return scan();
    if(near(p,pt(.91,.18),65))return applyAid('jules');
    return false;
  }
  function pointerMove(p){if(drag&&drag.id===(p.id??0))drag.at={x:p.x,y:p.y};}
  function pointerUp(p){if(!drag||drag.id!==(p.id??0))return false;
    const key=drag.key;const t=targets();drag=null;
    if(key==='bonus'&&mode==='bonus'){
      const k=currentBonus();if(near(p,t.file,110))return resolveBonus(k,'file');if(near(p,t.cool,110))return resolveBonus(k,'cool');
      tell('DRAG REPORT TO FILE OR COOL.',1.4);return false;
    }
    if(key==='strip'&&mode==='recovery'&&near(p,t.stripTo,85)){openCounter();return true;}
    if(key==='fake'&&mode==='ads'&&near(p,t.trash,130)){adsRemaining--;if(adsRemaining>0){tell('ANOTHER SPONSORED POPUP. MOVE THE NEW ONE.',2);return true;}tell('FAKE DISMISSED. THE REAL GEARS REMAIN.');openCounter();return true;}
    if(key==='doc'&&mode==='route'&&near(p,t.safe,110)){
      // Safe route is readable by the moving alternating hazard stripe.
      const unsafe=(clock%4.1)<1.05;
      if(unsafe){tell('SWEEP! DOCUMENT SLIDES BACK TO THE TRAY.',1.3);shake=.2;return false;}
      routeDone=true;tell('DOCUMENT ROUTED. NEXT, UNLATCH THE MACHINE.',2);
      phase3Second=true;if(!bonus['quota:p3:b2'])offerBonus();else nextMode();return true;
    }
    if(key==='latch'&&mode==='latch'&&near(p,t.latchTo,90)){latchDone=true;openCounter();return true;}
    if(key==='counter'&&mode==='opening'){
      if(gateSeconds>0){if(perkLevel(context,'safety-net')&&!safetyUsed){safetyUsed=true;gateSeconds=0;tell('SAFETY NET DEPLOYED! RE-THROW YOUR PACKET.');}else tell('PRESSURE GATE! WAIT FOR THE BARRIER TO RETRACT.');return false;}
      const radius=directive==='FAST OR SAFE'?(openElapsed<1.15?42:100):Math.max(62,Math.min(W()*.08,100));
      const landing=near(p,t.gear,radius);
      if(landing){packetFlights.push({life:.7,x:t.counter.x,y:t.counter.y});return counterHit();}
      // Bank Shot gives an alternate right-bumper ricochet route with a physically indicated target.
      const bumper=pt(.82,.47);
      if(perkLevel(context,'bank-shot')&&near(p,bumper,80)){packetFlights.push({life:.7,x:bumper.x,y:bumper.y});return counterHit();}
      counterMiss();return false;
    }
    if(key==='stamp'&&mode==='clockout'&&near(p,t.stampTo,130)){
      mode='complete';timer=0;printed=true;shake=prefs.motion?0:1.6;
      emit('boss-complete',{objectId:'quota:clock-out',outcome:'victory',boltsRemoved:3,bonusOutcomes:{...bonus},pressure,synthetic:false});
      tell('CLOCKED OUT. INFINITE PROFIT HAS LEFT THE BUILDING.',4);return true;
    }
    tell('DROPPED. TRY THE MARKED TARGET.',1.2);return false;
  }
  function cancelPointer(){drag=null;}
  function snapshot(){return Object.freeze({bossId:'B2',runId:id,phase:Math.min(phase,3),mode,phaseName:PHASES[Math.min(phase,3)-1].name,pressure,bonusOutcomes:{...bonus},gateSeconds,openElapsed,adsRemaining,bonusFiled:Object.values(bonus).filter(x=>x==='file').length,bonusCorporatePoints:Object.values(bonus).filter(x=>x==='file').length*5,boltsRemoved:bolts,activeTimeMs:Math.round(activeTime*1000),clockSeconds:clock,timer:Math.max(0,timer),directive,routeDone,latchDone,doubleVerified,counterReady,printed,dragged:drag?.key||null,targets:targets(),events:events.slice()});}
  function draw(c,v=context.viewport){renderQuota(c,v,snapshot(),{drag,msg,slash,shake,beam,hearts,packetFlights,phase3Second,prefs,context});}
  return {enter(){},update,draw,pointerDown,pointerMove,pointerUp,cancelPointer,snapshot,dispose(){drag=null;packetFlights=[];},activateAssist:applyAid,scan,useTimeBank(seconds){if(mode!=='opening'||timeBankSpent>=3)return false;const take=Math.min(3-timeBankSpent,3,Math.max(0,Number(seconds)||0));if(!take)return false;timeBankSpent+=take;timer+=take;emit('time-bank-spent',{objectId:`quota:time-bank:${phase}`,delta:take,synthetic:false});tell('TIME BANK SPENT. OPENING HELD!',1);return true;}};
}
export const definitions=[{id:'B2',department:'boss',imperative:'BREAK THE QUOTA!',create:createQuotaBoss}];

// A single World-space Canvas2D performance. HUD remains owned by RENDER.
export function renderQuota(c,v,s,fx){
  const W=v?.worldWidth||1200,H=v?.worldHeight||760,unit=Math.min(W/1150,H/760),x=W/2;
  const C={ink:'#142326',bg:'#10252a',turq:'#8be2cf',gold:'#efbe65',cream:'#f6edda',red:'#e95f4f',paper:'#fff4da'};
  const t=fx.beam,phase=s.phase; c.save();
  if(fx.shake&&!fx.prefs.motion)c.translate(Math.sin(t*53)*fx.shake*10,Math.cos(t*62)*fx.shake*6);
  const bg=c.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#102832');bg.addColorStop(.53,'#204a4d');bg.addColorStop(1,'#102c34');c.fillStyle=bg;c.fillRect(0,0,W,H);
  // Tall office architraves and projector light, stretching with viewport, not a letterbox.
  c.strokeStyle='#6faea333';c.lineWidth=2;for(let i=0;i<11;i++){let px=i*W/10;c.beginPath();c.moveTo(px,0);c.lineTo(px+Math.sin(i*7)*18,H);c.stroke();}
  const glow=c.createRadialGradient(x,H*.29,10,x,H*.29,H*.7);glow.addColorStop(0,'#e1c58a38');glow.addColorStop(1,'#0e242600');c.fillStyle=glow;c.fillRect(0,0,W,H);
  // Stage windows and side office silhouettes.
  for(let side of [-1,1]){const ax=x+side*(W*.48); c.save();c.translate(ax,H*.43);c.scale(side,1);c.fillStyle='#102e36';c.fillRect(-W*.075,-H*.22,W*.12,H*.45);c.fillStyle='#50847d';for(let i=0;i<5;i++)c.fillRect(-W*.06,-H*.18+i*H*.073,W*.09,2);c.restore();}
  const deck=c.createLinearGradient(0,H*.75,0,H);deck.addColorStop(0,'#35515a');deck.addColorStop(.17,'#6b6558');deck.addColorStop(1,'#151f2b');c.fillStyle=deck;c.beginPath();c.moveTo(0,H*.75);c.lineTo(W,H*.75);c.lineTo(W,H);c.lineTo(0,H);c.fill();
  c.fillStyle='#f7c567';c.fillRect(0,H*.75,W,5);c.fillStyle='#131c29bb';for(let i=0;i<16;i++)c.fillRect(i*W/16,H*.78,2,H*.24);
  // Corporate machine assembled from five distinct modules, physically substantial.
  const bw=Math.min(W*.59,620),bh=Math.min(H*.53,395),by=H*.37;
  c.fillStyle='#10252a';c.beginPath();c.ellipse(x,by+bh*.66,bw*.64,H*.072,0,0,Math.PI*2);c.fill();
  for(let i=0;i<5;i++){const mx=x+(i-2)*bw*.22;c.save();c.translate(mx,by-bh*.52);c.rotate(Math.sin(t*.7+i*.6)*.025);round(c,-bw*.095,-bh*.11,bw*.19,bh*.16,10,i%2?'#d2ab64':'#8ac2ab','#102f35',4);c.fillStyle='#2d5654';c.fillRect(-bw*.06,-bh*.06,bw*.12,6);c.restore();}
  round(c,x-bw/2,by-bh*.40,bw,bh*.78,Math.max(18,bw*.07),'#315e62','#0b232a',10);
  round(c,x-bw*.41,by-bh*.26,bw*.82,bh*.53,Math.max(20,bw*.07),'#e5bd74','#132c32',7);
  round(c,x-bw*.29,by-bh*.23,bw*.58,bh*.27,Math.max(15,bw*.04),'#173a43','#0c2128',6);
  c.fillStyle='#dbf8d7';c.shadowColor='#95f5df';c.shadowBlur=16;
  for(const sign of [-1,1]){c.beginPath();const blink=Math.sin(t*1.08)>0.988?.15:1;c.ellipse(x+sign*bw*.14,by-bh*.11,bw*.074,bh*.063*blink,0,0,Math.PI*2);c.fill();}
  c.shadowBlur=0;
  // The robot smile physically degrades as bolts fall.
  c.beginPath();c.strokeStyle=phase===3?'#ed5e51':'#0e3b40';c.lineWidth=bw*.025;
  if(s.boltsRemoved===0)c.arc(x,by-bh*.10,bw*.20,.12,Math.PI-.13);
  else if(s.boltsRemoved===1){c.moveTo(x-bw*.21,by+bh*.04);c.quadraticCurveTo(x,by+bh*.15,x+bw*.19,by+bh*.04);}
  else {c.moveTo(x-bw*.20,by+bh*.075);c.lineTo(x+bw*.19,by+bh*.075);}c.stroke();
  // Pressure genuinely expands cheeks, pipes, warning lamps.
  c.strokeStyle=s.pressure>0?'#f1b455':'#74b9a8';c.lineWidth=12+s.pressure*3;
  for(const sign of [-1,1]){c.beginPath();c.moveTo(x+sign*bw*.32,by);c.bezierCurveTo(x+sign*bw*.58,by-bh*.32,x+sign*bw*.59,by+bh*.27,x+sign*bw*.33,by+bh*.27);c.stroke();}
  for(let j=0;j<3;j++){
    const bx=x+(j-1)*bw*.255,yy=by+bh*.25;const alive=j>=s.boltsRemoved;
    c.save();c.translate(bx,yy);c.rotate(alive?0:t*.8+j);c.fillStyle=alive?'#f5d999':'#555f60';c.strokeStyle='#19343b';c.lineWidth=4;c.beginPath();c.arc(0,0,bw*.06,0,Math.PI*2);c.fill();c.stroke();c.strokeStyle=alive?'#344b4c':'#a3604b';c.lineWidth=4;c.beginPath();c.moveTo(-bw*.03,0);c.lineTo(bw*.03,0);c.moveTo(0,-bw*.03);c.lineTo(0,bw*.03);c.stroke();c.restore();
  }
  // Counter gear itself is physically visible and not falsely damaged by tap spam.
  const g=s.targets.gear||{x:x+W*.0,y:H*.39};
  c.save();c.translate(g.x,g.y);if(s.mode==='opening')c.rotate(t*1.4);
  gear(c,Math.max(39,Math.min(W*.064,68)),s.mode==='opening'?'#a2f2bb':'#c98365');c.restore();
  // Three distinct theatrical phase hazards.
  if(phase===1){const stripeX=x+Math.sin(t*2)*W*.13; if(['telegraph','recovery'].includes(s.mode)){c.fillStyle=s.mode==='telegraph'?'#f8a82f30':'#e75f4b35';c.fillRect(stripeX-W*.10,H*.54,W*.20,H*.22);c.strokeStyle='#f4c666';c.lineWidth=5;c.strokeRect(stripeX-W*.10,H*.54,W*.20,H*.22); c.fillStyle='#e76d54';c.save();c.translate(stripeX,H*.37-(s.mode==='recovery'?H*.03:Math.max(0,Math.sin(t*2))*H*.055));c.rotate(-.05);round(c,-W*.11,-H*.05,W*.22,H*.10,14,'#f0c16a','#4b302b',7);label(c,'APPROVED',0,5,Math.min(W*.028,27),'#402d2d');c.restore();}
    if(s.mode==='recovery'){label(c,'PULL THE JAM STRIP ↓',W*.25,H*.60,Math.min(W*.023,21),C.gold);} }
  if(phase===2){if(s.mode==='ads'){const a=fx.drag?.key==='fake'?fx.drag.at:s.targets.fake;windowCard(c,a.x,a.y,Math.min(W*.42,320),H*.20,'SPONSORED ASSIST','FREE BONUS QUOTA!!!',false);const mx=W*.19;windowCard(c,mx,H*.36,Math.min(W*.31,225),H*.15,'MIRA • SIGNED','Move the fake. I have your back.',true);}c.strokeStyle='#e2c17155';c.lineWidth=4;c.beginPath();c.moveTo(x-W*.18,H*.47);c.lineTo(x+W*.18,H*.47);c.stroke();}
  if(phase===3){const sweep= (t%4.1)<1.05;if(['route','latch','opening','verify'].includes(s.mode)){c.save();c.globalAlpha=.8;c.strokeStyle=sweep?'#e86f59':'#83cfb3';c.lineWidth=8;c.setLineDash([22,12]);c.beginPath();c.moveTo(W*.30,H*.66);c.lineTo(W*.67,H*.66);c.stroke();c.setLineDash([]);c.restore();c.fillStyle=sweep?'#e65a4e':'#a4e4c5';c.fillRect(W*.62,H*.59,Math.max(6,W*.013),H*.15);}
    if(s.mode==='latch'){const p=s.targets.latch;label(c,'PULL ↓',p.x,p.y-40,Math.min(W*.04,36),C.gold);}}
  if(s.mode==='opening'&&s.gateSeconds>0){c.fillStyle='#fa6746bb';c.fillRect(W*.20,H*.545,W*.60,Math.max(13,H*.035));label(c,'PRESSURE GATE • WAIT',W*.50,H*.55,Math.min(23,W*.04),'#fff8d3');}
  if(s.mode==='opening'&&s.directive==='FAST OR SAFE'){label(c,s.openElapsed<1.15?'FAST • NARROW GEAR':'SAFE • WIDE GEAR',x,H*.60,Math.min(22,W*.034),'#b9efdc');}
  if(s.pressure===2&&['telegraph','route','ads','opening'].includes(s.mode)){c.fillStyle='#e8604a66';c.fillRect(W*.07,H*.53,Math.max(14,W*.03),H*.23);c.fillRect(W*.89,H*.53,Math.max(14,W*.03),H*.23);}
  // Mechanical affordances and paper trays.
  const point=s.targets;
  if(s.mode==='bonus'){
    pocket(c,point.file.x,point.file.y,Math.min(W*.28,260),H*.155,'FILE +5','PRESSURE +1','#e6ba70');
    pocket(c,point.cool.x,point.cool.y,Math.min(W*.28,260),H*.155,'COOL','GEAR OPENS LONGER','#82d6c0');
    paper(c,fx.drag?.key==='bonus'?fx.drag.at.x:point.bonus.x,fx.drag?.key==='bonus'?fx.drag.at.y:point.bonus.y,Math.min(W*.13,115),'BONUS','REPORT');
    label(c,'DRAG REPORT INTO A CHUTE',x,H*.918,Math.min(21,W*.030),C.cream);
    label(c,`SKIP +0  •  ${Math.ceil(s.timer)}s`,x,H*.872,Math.min(17,W*.024),'#bbd5d1');
  }
  if(['recovery','ads','route','latch','opening','verify'].includes(s.mode)){
    if(s.mode==='recovery')paper(c,fx.drag?.key==='strip'?fx.drag.at.x:point.strip.x,fx.drag?.key==='strip'?fx.drag.at.y:point.strip.y,Math.min(W*.13,96),'PULL','JAM');
    if(s.mode==='ads'){label(c,'DRAG THE FAKE AD →',x,H*.78,Math.min(23,W*.037),C.gold);}
    if(s.mode==='route'){paper(c,fx.drag?.key==='doc'?fx.drag.at.x:point.doc.x,fx.drag?.key==='doc'?fx.drag.at.y:point.doc.y,Math.min(W*.13,98),'ROUTE','ME');label(c,'SAFE LANE',point.safe.x,point.safe.y+38,Math.min(21,W*.028),'#a4f1c5');}
    if(s.mode==='latch'){const a=fx.drag?.key==='latch'?fx.drag.at:point.latch;round(c,a.x-24,a.y-39,48,78,12,'#f9c66c','#202b31',6);label(c,'L',a.x,a.y,30,C.ink);}
    if(s.mode==='opening'){paper(c,fx.drag?.key==='counter'?fx.drag.at.x:point.counter.x,fx.drag?.key==='counter'?fx.drag.at.y:point.counter.y,Math.min(W*.16,122),'COUNTER','PACKET');if(fx.context?.run?.perkLevels?.['perk:bank-shot']){c.strokeStyle='#f6e19f';c.lineWidth=5;c.setLineDash([8,10]);c.beginPath();c.moveTo(point.counter.x,point.counter.y);c.lineTo(W*.82,H*.47);c.lineTo(point.gear.x,point.gear.y);c.stroke();c.setLineDash([]);label(c,'BANK',W*.82,H*.44,18,C.gold);} }
    if(s.mode==='verify'){label(c,'STAMP THE VERIFICATION SEAL',x,H*.68,Math.min(25,W*.04),C.cream);round(c,point.seal.x-49,point.seal.y-48,98,96,19,'#f4b458','#5b302b',6);label(c,'2x',point.seal.x,point.seal.y+10,38,C.ink);}
  }
  if(s.mode==='clockout'||s.mode==='complete'){
    const a=fx.drag?.key==='stamp'?fx.drag.at:point.stamp||{x,y:H*.78};
    if(s.mode==='clockout'){round(c,a.x-W*.19,a.y-H*.065,W*.38,H*.13,Math.min(W*.045,35),'#ebbb66','#1b3033',8);label(c,'CLOCK OUT',a.x,a.y+Math.min(18,W*.022),Math.min(49,W*.069),C.ink);label(c,'DRAG ↑ TO BREAK THE SMILE',x,H*.92,Math.min(23,W*.033),C.gold);}
    else{label(c,'SHIFT TERMINATED.',x,H*.78,Math.min(58,W*.079),'#f5c47b');label(c,'THE MACHINE HAS FILED FOR EMOTIONAL DAMAGES',x,H*.87,Math.min(21,W*.027),C.cream);}
  }
  if(s.mode==='counter-hit'){
    const p=Math.min(60,fx.beam*40%80);c.strokeStyle='#f5cc6d';c.lineWidth=7;c.beginPath();c.arc(x,H*.39,65+p,0,Math.PI*2);c.stroke();
  }
  if(fx.context?.run?.licences?.jules||s.directive==='MANDATORY COLLABORATION'){round(c,W*.865,H*.15,W*.095,H*.09,10,'#1b5454','#a9d3a8',2);label(c,'JULES',W*.912,H*.187,Math.min(W*.018,16),'#e9f5d7');}
  // Boss body pressure meter with actual outcome, no global score mutation.
  round(c,x-Math.min(W*.37,390),H*.055,Math.min(W*.74,780),H*.077,17,'#112d38dd','#80c5b075',2);
  label(c,'THE QUOTA',x,H*.095,Math.min(W*.072,62),C.cream);
  label(c,`PHASE ${phase>3?'CLEARED':phase} / 3  •  ${PHASES[Math.min(phase,3)-1].name}`,x,H*.172,Math.min(24,W*.035),C.gold);
  if(s.pressure){for(let p=0;p<s.pressure;p++){c.fillStyle=C.red;c.beginPath();c.arc(x+(p-.5)*26,H*.218,8,0,7);c.fill();}}
  const instruction=fx.slash>0?fx.msg:(s.mode==='bonus'?'DRAG THE BONUS REPORT':s.mode==='opening'?'FLING PACKET INTO THE OPEN GEAR':PHASES[Math.min(phase,3)-1].task);
  if(s.mode!=='bonus')label(c,instruction,x,H*.92,Math.min(24,W*.034),C.paper,Math.max(260,W*.93));
  c.restore();
}
function round(c,x,y,w,h,r,fill,stroke,lw=1){c.beginPath();c.roundRect(x,y,w,h,Math.min(r,w/2,h/2));c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke();}}
function label(c,text,x,y,size,color,maxWidth){c.save();c.textAlign='center';c.textBaseline='middle';c.font=`900 ${Math.max(11,size)}px Impact, 'Arial Narrow', system-ui, sans-serif`;c.fillStyle=color;c.shadowColor='#081820aa';c.shadowBlur=4;c.fillText(text,x,y,maxWidth);c.restore();}
function gear(c,r,fill){c.beginPath();for(let i=0;i<32;i++){const a=i*Math.PI/16;const rad=i%4<2?r:r*.79;const p=[Math.cos(a)*rad,Math.sin(a)*rad];if(i)c.lineTo(...p);else c.moveTo(...p)}c.closePath();c.fillStyle=fill;c.fill();c.strokeStyle='#1b383f';c.lineWidth=6;c.stroke();c.beginPath();c.arc(0,0,r*.42,0,Math.PI*2);c.fillStyle='#18343a';c.fill();c.fillStyle='#f4ce91';c.beginPath();c.arc(0,0,r*.15,0,Math.PI*2);c.fill();}
function paper(c,x,y,w,top,bottom){c.save();c.translate(x,y);c.rotate(-.07);const h=w*.72;round(c,-w/2,-h/2,w,h,w*.075,'#f9e6b5','#8b6555',4);c.fillStyle='#dc8a62';c.fillRect(-w*.38,-h*.35,w*.10,h*.6);label(c,top,0,-h*.12,w*.19,'#2f484b');label(c,bottom,0,h*.18,w*.14,'#3d5757');c.restore();}
function pocket(c,x,y,w,h,heading,sub,color){round(c,x-w/2,y-h/2,w,h,15,'#142d39',color,4);label(c,heading,x,y-h*.14,Math.min(30,w*.13),color);label(c,sub,x,y+h*.20,Math.min(15,w*.067),'#fbefce',w*.93);}
function windowCard(c,x,y,w,h,head,body,real){round(c,x-w/2,y-h/2,w,h,12,'#f7eee1',real?'#82dac5':'#f77763',4);c.fillStyle=real?'#2c8776':'#c84f4a';c.fillRect(x-w/2+4,y-h/2+4,w-8,h*.29);label(c,head,x,y-h*.34,Math.min(17,w*.07),'#fff1d9',w*.93);label(c,body,x,y+h*.18,Math.min(18,w*.075),'#223b3f',w*.92);}
