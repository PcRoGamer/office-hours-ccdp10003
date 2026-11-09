import {GAMES,ALL_IDS} from './games.js';
import {BOSSES} from './bosses.js';
import {rr,ink,confetti,vignette,HD,iconsReady,drawIcon} from './art.js';
const cvs=document.getElementById('stage'),c=cvs.getContext('2d',{alpha:false});
const hud={lives:document.getElementById('lives'),round:document.getElementById('round'),mute:document.getElementById('mute')};
const ui={
 title:document.getElementById('splash'),pause:document.getElementById('pause'),
 ending:document.getElementById('ending'),inter:document.getElementById('intermission'),
 sr:document.getElementById('sr'),
 play:document.getElementById('play'),again:document.getElementById('again'),
 resume:document.getElementById('resume'),
 interTitle:document.getElementById('inter-title'),interTag:document.getElementById('inter-tagline'),
 interScore:document.getElementById('inter-score'),interLives:document.getElementById('inter-lives'),
 interSpeed:document.getElementById('inter-speed'),interFill:document.getElementById('inter-fill'),
 endTitle:document.getElementById('end-title'),endScore:document.getElementById('end-score'),
 endGrade:document.getElementById('end-grade'),endBosses:document.getElementById('end-bosses'),
 endDetail:document.getElementById('end-detail'),endKicker:document.getElementById('end-kicker'),
 interContinue:document.getElementById('inter-continue'),interRestNote:document.getElementById('inter-rest-note'),
 marathonTitle:document.getElementById('marathon-title'),interMarathon:document.getElementById('inter-marathon'),
 interResearchOpen:document.getElementById('inter-research-open'),interResearch:document.getElementById('inter-research'),
 researchClose:document.getElementById('research-close'),researchBack:document.getElementById('research-back')
};
const WW=960,HH=540,clamp=(v,a,b)=>Math.max(a,Math.min(v,b));
const query=new URLSearchParams(location.search);
const givenSeed=Number(query.get('seed'));const seed=Number.isInteger(givenSeed)&&givenSeed>=0&&query.has('seed')?givenSeed:(Date.now()>>>0);
let randomState=seed||0x9172b,rand=()=>{
 randomState+=0x6D2B79F5;
 let t=randomState;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);
 return((t^(t>>>14))>>>0)/4294967296;
};
let soundOn=true,ac=null,soundEvents=0;
function initAudio(){
 if(!soundOn)return;
 try{ac??=new(window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume()}catch(e){ac=null}
}
function tone(f=480,d=.08,vol=.22,type='triangle',delay=0,sweep=0){
 if(!soundOn||!ac)return;
 const t=ac.currentTime+delay;
 const osc=ac.createOscillator(),gain=ac.createGain();
 osc.type=type;osc.frequency.setValueAtTime(f,t);if(sweep)osc.frequency.exponentialRampToValueAtTime(Math.max(32,f+sweep),t+d*.85);
 gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(vol,t+.008);gain.gain.exponentialRampToValueAtTime(.0001,t+d);
 osc.connect(gain).connect(ac.destination);osc.start(t);osc.stop(t+d+.02);soundEvents++;
}
let beatStep=0;
function sfx(name){
 if(name==='beat'){
  // Original four-bar office-arcade riff, tempo accelerates with the player.
  const riff=[392,440,349,523,440,392,330,494,392,330,440,523,587,494,440,349];
  const i=(beatStep++)%riff.length;
  tone(104+(i%4===0?0:20),.055,.045,'triangle');
  tone(riff[i],.105,.043,'square',.01);
  if(i%4===2)tone(850,.023,.027,'triangle',.02);
 }
 if(name==='tap'){tone(380,.05,.075,'triangle',0,120)}
 if(name==='win'){tone(460,.13,.16,'triangle',0,240);tone(730,.15,.19,'square',.067,220);tone(1020,.22,.13,'triangle',.13,230)}
 if(name==='lose'){tone(330,.13,.12,'sawtooth',0,-100);tone(205,.2,.15,'sawtooth',.1,-90)}
 if(name==='speed'){tone(570,.10,.13,'square');tone(850,.13,.1,'triangle',.11);tone(1180,.20,.12,'square',.23);tone(1440,.18,.1,'triangle',.37)}
 if(name==='boss'){tone(190,.20,.15,'sawtooth',0,90);tone(290,.22,.13,'square',.25,210)}
 if(name==='bosswin'){tone(610,.12,.13,'triangle');tone(780,.15,.16,'square',.12);tone(1040,.20,.18,'triangle',.25)}
 if(name==='danger'){tone(700,.09,.12,'square');tone(700,.09,.12,'square',.15)}
}
let measure={width:1,height:1,scale:1,offsetX:0,offsetY:0,dpr:1};
function resize(){
 const r=cvs.getBoundingClientRect(),dpr=Math.min(2.5,window.devicePixelRatio||1);
 cvs.width=Math.max(1,Math.round(r.width*dpr));cvs.height=Math.max(1,Math.round(r.height*dpr));
 const s=Math.min(r.width/WW,r.height/HH);
 measure={width:r.width,height:r.height,dpr,scale:s,offsetX:(r.width-WW*s)/2,offsetY:(r.height-HH*s)/2};
}
window.addEventListener('resize',resize,{passive:true});resize();
function pointer(e){
 const r=cvs.getBoundingClientRect();
 return {x:(e.clientX-r.left-measure.offsetX)/measure.scale,
 y:(e.clientY-r.top-measure.offsetY)/measure.scale,id:e.pointerId};
}
let marathonMode=false;
let state={mode:'title',queue:[],index:0,rounds:18,lives:3,score:0,combo:0,
 current:null,id:'',level:1,remaining:0,duration:0,t:0,period:0,feedback:'',done:false,
 flash:0,shake:0,particles:[],cursor:{x:480,y:380},resultTimer:0,correct:0,wrong:0,history:[],best:0};
function shuffle(arr){for(let i=arr.length-1;i>0;i--){const k=Math.floor(rand()*(i+1));[arr[i],arr[k]]=[arr[k],arr[i]]}return arr}
function buildQueue(){
 const q=[];
 for(let cycle=0;cycle<3;cycle++){
  const seq=shuffle([...ALL_IDS]);
  if(cycle===0){const i=seq.indexOf('stamp');[seq[0],seq[i]]=[seq[i],seq[0]]}
  if(cycle>0&&seq[0]===q[q.length-1]){[seq[0],seq[1]]=[seq[1],seq[0]]}
  q.push(...seq);
  if(cycle===0)q.push('boss-printer');
 }
 q.push('boss-manager');
 return q;
}
const isBoss=id=>id?.startsWith('boss-');
function completedMinis(){
 return state.queue.slice(0,state.index).filter(id=>!isBoss(id)).length;
}
function api(){
 return {rand,win:(x,y)=>settle(true,x,y),lose:(x,y)=>settle(false,x,y),tap:()=>sfx('tap'),spark:(x,y,color)=>burst(x,y,color)};
}
function beginGame(){
 initAudio();
 state={...state,mode:'active',queue:buildQueue(),index:0,lives:3,score:0,combo:0,bossWins:0,interTime:0,
  history:[],correct:0,wrong:0,particles:[],flash:0,shake:0,period:0,cursor:{x:480,y:380},done:false};
 for(const v of [ui.title,ui.ending,ui.pause,ui.inter])v.classList.add('hidden');
 beatStep=0;
 syncMarathonUI();
 startRound();
 cvs.focus({preventScroll:true});
}
function startRound(){
 if(state.index>=state.queue.length){finish();return}
 const priorMinis=completedMinis();
 state.level=Math.min(3,1+Math.floor(priorMinis/6));
 state.id=state.queue[state.index];
 state.current=GAMES.find(g=>g.id===state.id)||BOSSES.find(g=>g.id===state.id);
 if(!state.current)throw Error('No authored microgame for '+state.id);
 state.t=0;state.period=0;state.feedback='';state.mode='active';
 state.done=false;state.particles=[];state.panicNotified=false;
 state.duration=state.id==='boss-printer'?12.8:state.id==='boss-manager'?13.5:
   state.level===1?4.8:state.level===2?4.05:3.65;
 state.remaining=state.duration;
 state.current.enter(state,api());
 hud.lives.textContent='♥'.repeat(state.lives)+'♡'.repeat(3-state.lives);
 hud.lives.setAttribute('aria-label',state.lives+' hearts remaining');
 hud.round.textContent=isBoss(state.id)?
  (state.id==='boss-printer'?'BOSS 1 / 2':'FINAL BOSS'):
  String(state.index+1).padStart(2,'0')+' / '+state.rounds;
 ui.sr.textContent=state.current.cmd+' '+state.current.hint;
 if(isBoss(state.id))sfx('boss');
}
function startIntermission(){
 state.mode='intermission';
 state.interDuration=state.index===7?3.95:3.55;
 state.interTime=state.interDuration;
 state.interAutoRemaining=.84;
 state.interReadMore=false;
 syncMarathonUI();
 ui.interContinue.disabled=true;
 ui.interContinue.textContent='CELEBRATING...';
 ui.interRestNote.textContent=marathonMode?'MARATHON ON: next game begins after the celebration. Open research to hold.':'RELAXED BREAK: press Continue when ready. Reading is optional.';
 ui.interResearch.classList.add('hidden');
 ui.inter.classList.remove('hidden');
 ui.interTitle.textContent=state.index===7?'BOSS DOWN!':'SPEED UP!';
 ui.interTag.textContent=state.index===7?'PRINTER: DEFEATED. YOU: STILL EMPLOYED.':'YOU SURVIVED THE SECOND BATCH!';
 ui.interScore.textContent=String(state.score).padStart(2,'0')+' POINTS';
 ui.interLives.textContent='♥'.repeat(state.lives)+'♡'.repeat(3-state.lives);
 ui.interSpeed.textContent=state.index===7?'NEXT: FASTER!':'FINAL BATCH: MAX PANIC!';
 ui.interFill.style.transform='scaleX(1)';
 ui.sr.textContent=ui.interTitle.textContent+'. '+ui.interScore.textContent+'. '+state.lives+' lives.';
 sfx('speed');
}
function burst(x,y,color='#fff5d7'){
 for(let i=0;i<25;i++){
  const a=rand()*Math.PI*2,v=85+rand()*290;
  state.particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-75,
   life:.32+rand()*.4,r:2+rand()*5,color:i%3===0?'#ffca55':i%3===1?color:'#fff9ee'});
 }
}
function settle(good,x=480,y=340){
 if(state.mode!=='active'||state.done)return;
 state.done=true;state.correct+=Number(good);state.wrong+=Number(!good);
 const left=Math.max(0,state.duration-state.t);
 state.history.push({id:state.id,level:state.level,boss:isBoss(state.id),
  success:good,elapsed:+state.t.toFixed(2),remaining:+left.toFixed(2)});
 state.feedback=good?(isBoss(state.id)?'BOSS BEATEN!':'NICE!'):'NOPE!';
 state.flash=good?.5:.55;state.shake=good?7:14;
 state.mode='result';state.resultTimer=good?(isBoss(state.id)?1.1:.43):.54;
 if(good){
  state.score++;state.combo++;
  if(isBoss(state.id))state.bossWins++;
  burst(x,y,'#6ce7ae');sfx('win');
  if(isBoss(state.id))sfx('bosswin');
 }else{
  state.lives--;state.combo=0;sfx('lose');burst(x,y,'#fb6751');
 }
}
function finish(){
 state.mode='end';state.best=Math.max(state.best,state.score);
 const victorious=state.lives>0&&state.index>=state.queue.length;
 const ratio=state.score/state.queue.length;
 const grade=victorious?(ratio>=.93&&state.lives===3?'S':ratio>=.85&&state.lives>=2?'A':ratio>=.61?'B':'C'):'F';
 ui.endKicker.textContent=victorious?'END OF SHIFT · YOU DID IT':'GAME OVER · NO MORE LIVES';
 ui.endTitle.textContent=victorious?'SHIFT CONQUERED!':'FIRED!';
 ui.endGrade.textContent=grade;
 ui.endScore.textContent=state.score+' / '+state.queue.length+' JOBS CLEARED';
 ui.endBosses.textContent=state.bossWins+' / 2 BOSSES DEFEATED';
 ui.endDetail.textContent=state.lives+' HEARTS LEFT · BEST '+state.best+' · '+state.correct+' SUCCESSFUL';
 ui.ending.classList.remove('hidden');
 hud.round.textContent=state.score+' CLEARED';
 ui.sr.textContent='Game over. '+ui.endScore.textContent+'. Grade '+grade+'.';
 if(victorious){burst(420,270,'#ffe48b');burst(580,260,'#6eeea9');sfx('speed')}
}
function pauseToggle(force){
 if(state.mode==='title'||state.mode==='end')return;
 if(force==='pause'&&state.mode==='pause'||force==='resume'&&state.mode!=='pause')return;
 if(state.mode==='pause'){state.mode=state.wasMode||'active';ui.pause.classList.add('hidden');cvs.focus({preventScroll:true});if(ac?.state==='suspended'&&soundOn)ac.resume()}
 else {state.wasMode=state.mode;state.mode='pause';ui.pause.classList.remove('hidden')}
}
// The rhythm stops at each break. Research never starts a round or consumes time.
// Relaxed mode is the default. Marathon only automates chapter transitions,
 // never player inputs or victory. Viewing research suspends automation for that break.
function syncMarathonUI(){
 for(const button of [ui.marathonTitle,ui.interMarathon]){
  button.setAttribute('aria-pressed',String(marathonMode));
  button.textContent=marathonMode?'MARATHON: ON':'MARATHON: OFF';
  button.title=marathonMode?'Turn off automatic chapter transitions':'Auto-continue after chapter celebrations; you still play every microgame';
 }
}
function setMarathon(value){
 marathonMode=!!value;
 syncMarathonUI();
 if(state.mode==='intermission'){
  ui.interRestNote.textContent=state.interReadMore?
    'Research opened: break held. Choose Continue when ready.':
    marathonMode?'MARATHON ON: next chapter continues automatically.':
    'RELAXED BREAK: press Continue when ready.';
 }
}
function continueAfterBreak(){
 if(state.mode!=='intermission'||state.interTime>0||!ui.interResearch.classList.contains('hidden'))return;
 ui.inter.classList.add('hidden');
 startRound();
 cvs.focus({preventScroll:true});
}
function setResearchPage(topic){
 const allowed=new Set(['origins','portable','attention']);
 if(!allowed.has(topic))return;
 for(const b of ui.interResearch.querySelectorAll('[data-research-tab]')){
  b.setAttribute('aria-selected',String(b.dataset.researchTab===topic));
 }
 for(const panel of ui.interResearch.querySelectorAll('[data-research-page]')){
  panel.hidden=panel.dataset.researchPage!==topic;
 }
}
function openResearch(){
 if(state.mode!=='intermission')return;
 state.interReadMore=true;
 setResearchPage('origins');
 ui.interResearch.classList.remove('hidden');
 ui.sr.textContent='Research about microgames. Use the three topic tabs, or choose Back to Break.';
 ui.researchClose.focus();
}
function closeResearch(){
 ui.interResearch.classList.add('hidden');
 ui.interRestNote.textContent='Research break held. Press Continue when ready.';
 ui.interResearchOpen.focus();
}
ui.marathonTitle.addEventListener('click',()=>setMarathon(!marathonMode));
ui.interMarathon.addEventListener('click',()=>setMarathon(!marathonMode));
syncMarathonUI();
ui.interContinue.addEventListener('click',continueAfterBreak);
ui.interResearchOpen.addEventListener('click',openResearch);
ui.researchClose.addEventListener('click',closeResearch);
ui.researchBack.addEventListener('click',closeResearch);
for(const b of ui.interResearch.querySelectorAll('[data-research-tab]')){
 b.addEventListener('click',()=>setResearchPage(b.dataset.researchTab));
}
ui.play.addEventListener('click',beginGame);ui.again.addEventListener('click',beginGame);
ui.resume.addEventListener('click',()=>pauseToggle('resume'));
hud.mute.addEventListener('click',()=>{soundOn=!soundOn;hud.mute.textContent=soundOn?'♫':'♪̸';if(soundOn)initAudio();else ac?.suspend()});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'){
  if(state.mode==='intermission'&&!ui.interResearch.classList.contains('hidden')){
   e.preventDefault();closeResearch();return;
  }
  if(state.mode==='pause'||['active','result','intermission'].includes(state.mode))pauseToggle();
  return;
 }
 if(e.key==='Tab'&&state.mode==='intermission'&&!ui.interResearch.classList.contains('hidden')){
  const all=[...ui.interResearch.querySelectorAll('button:not(:disabled),a[href]')].filter(n=>!n.closest('[hidden]'));
  if(all.length){
   const first=all[0],last=all.at(-1);
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  }
 }
 if(e.key.toLowerCase()==='m'){hud.mute.click();return}
 if(e.key==='Enter'&&state.mode==='title'){ui.play.click();return}
 if(e.key==='Enter'&&state.mode==='end'){ui.again.click();return}
 if(e.key===' '||e.key==='Enter'){
  if(state.mode==='active'){e.preventDefault();state.current.key?.(state,e.key,api())}
 }
});
cvs.addEventListener('pointerdown',e=>{
 if(state.mode!=='active')return;
 e.preventDefault();initAudio();cvs.setPointerCapture(e.pointerId);
 const p=pointer(e);state.cursor=p;state.current.down?.(state,p,api());
});
cvs.addEventListener('pointermove',e=>{
 const p=pointer(e);state.cursor=p;if(state.mode==='active')state.current.move?.(state,p,api());
});
cvs.addEventListener('pointerup',e=>{
 if(state.mode!=='active')return;const p=pointer(e);state.current.up?.(state,p,api());
});
cvs.addEventListener('pointercancel',()=>{if(state.mode==='active')state.current.cancel?.(state)});
window.addEventListener('blur',()=>{if(['active','result'].includes(state.mode))pauseToggle('pause')});
function update(dt){
 if(state.mode==='active'){
  state.t+=dt;state.remaining=Math.max(0,state.duration-state.t);
  const beat=isBoss(state.id)?.34:.46/(1+.12*(state.level-1));
  state.period+=dt;
  if(state.period>=beat){state.period-=beat;sfx('beat')}
  if(!state.panicNotified&&state.remaining/state.duration<=.24){
   state.panicNotified=true;sfx('danger');
  }
  state.current.update?.(state,dt,api());
  if(state.mode==='active'&&state.remaining<=0)settle(false,480,380);
 }else if(state.mode==='result'){
  state.resultTimer-=dt;
  if(state.resultTimer<=0){
   if(state.lives<=0){finish();}
   else if(!state.history.at(-1)?.success&&isBoss(state.id)){
    // Failed bosses cost a heart, but cannot be skipped.
    startRound();
   }else{
    state.index++;
    if(state.index===7||state.index===13)startIntermission();
    else startRound();
   }
  }
 }else if(state.mode==='intermission'){
  // Reading means time is genuinely paused: no automation, no hidden timer.
  if(ui.interResearch.classList.contains('hidden')){
   state.interTime=Math.max(0,state.interTime-dt);
   ui.interFill.style.transform='scaleX('+(state.interTime/state.interDuration)+')';
   if(state.interTime<=0&&ui.interContinue.disabled){
    ui.interContinue.disabled=false;
    ui.interContinue.textContent='CONTINUE ►';
    ui.interRestNote.textContent=state.interReadMore?
     'Research opened: break held. Choose Continue when ready.':
     marathonMode?'MARATHON ON: new chapter starting shortly.':
     'No countdown. Read the research or continue whenever you want.';
    ui.sr.textContent=marathonMode&&!state.interReadMore?
     'Marathon continues soon.':'Rest break ready. Choose Continue when ready.';
   }
   if(state.interTime<=0&&marathonMode&&!state.interReadMore){
    state.interAutoRemaining=Math.max(0,state.interAutoRemaining-dt);
    if(state.interAutoRemaining<=0)continueAfterBreak();
   }
  }
 }
 state.flash=Math.max(0,state.flash-dt*1.8);
 state.shake=Math.max(0,state.shake-dt*35);
 for(const p of state.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=250*dt;p.life-=dt}
 state.particles=state.particles.filter(p=>p.life>0);
}
function drawDeadline(g,c){
 const ratio=g.mode==='result'?0:Math.max(0,g.remaining/g.duration);
 const danger=ratio<.25;
 const barX=134,barY=506,barW=674;
 rr(c,103,491,753,44,19,'#193d41');
 const fill=c.createLinearGradient(140,0,790,0);
 fill.addColorStop(0,'#ffeea2');fill.addColorStop(.65,'#f7c85a');fill.addColorStop(1,'#65e6ac');
 if(ratio>.003)rr(c,barX,barY,barW*ratio,14,6,danger?'#f75a4f':fill);
 c.save();c.translate(111,513);c.rotate(Math.sin(g.t*4)*.075);
 drawIcon(c,'clock',0,0,61,61);c.restore();
 if(danger){c.save();c.globalAlpha=.5+Math.sin(g.t*22)*.42;c.fillStyle='#ff57514d';c.fillRect(104,492,742,40);c.restore()}
 ink(c,'DEADLINE',224,480,17,danger?'#a5352e':'#315355');
 ink(c,Math.max(0,g.remaining).toFixed(1)+'s',824,484,25,danger?'#e24c42':'#204b4b','right');
}
function draw(){
 const {width,height,dpr,scale,offsetX,offsetY}=measure;
 c.setTransform(dpr,0,0,dpr,0,0);
 c.fillStyle='#20393b';c.fillRect(0,0,width,height);
 c.save();c.translate(offsetX,offsetY);c.scale(scale,scale);
 if(state.shake>0)c.translate((Math.random()-.5)*state.shake,(Math.random()-.5)*state.shake);
 const active=state.current;
 c.fillStyle=active?.bg||'#315250';c.fillRect(0,0,WW,HH);
 if(active&&state.mode!=='title'){
  active.draw(state,c);
  c.save();
  c.shadowColor='#15303766';c.shadowBlur=3;
  ink(c,active.cmd,480,104,84,'#fff9e9');
  c.restore();
  ink(c,active.hint,480,157,20,'#214243');
  drawDeadline(state,c);
  if(state.mode==='result'){
   c.fillStyle=state.history.at(-1)?.success?'#4ee9a54d':'#f55c5966';c.fillRect(0,0,WW,HH);
   c.save();c.shadowColor='#11272b88';c.shadowOffsetY=8;c.shadowBlur=0;
   ink(c,state.feedback,480,265,144,state.history.at(-1)?.success?'#fff6d7':'#ffefde');c.restore();
  }
 }else{
  ink(c,'OFFICE ATTACK',480,273,72,'#c9e7d4');
 }
 for(const p of state.particles)confetti(c,p.x,p.y,p.r,p.color);
 if(state.flash>0){c.fillStyle=state.feedback==='NICE!'?'#ffffff15':'#e9413829';c.fillRect(0,0,WW,HH)}
 vignette(c);c.restore();
}
let frameCount=0;let last=performance.now();
function frame(now){
 frameCount++;
 const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;
 if(state.mode!=='pause'&&state.mode!=='title'&&state.mode!=='end')update(dt);
 draw();requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
Object.defineProperty(window,'__officeAttackQA',{value:Object.freeze({
 snapshot:()=>JSON.parse(JSON.stringify({
 mode:state.mode,id:state.id,index:state.index,rounds:state.rounds,lives:state.lives,
 queue:state.queue,bossWins:state.bossWins,interTime:state.interTime,interDuration:state.interDuration,
 interReady:!ui.interContinue.disabled,researchOpen:!ui.interResearch.classList.contains('hidden'),
 marathonMode,
 interAutoRemaining:state.interAutoRemaining,interReadMore:state.interReadMore,
 researchTopic:ui.interResearch.querySelector('[data-research-tab][aria-selected="true"]')?.dataset.researchTab,
 bossHits:state.bossHits,bossNeed:state.bossNeed,bossPhase:state.bossPhase,bossCooldown:state.bossCooldown,bossMistakes:state.bossMistakes,
 bossNeedle:state.bossNeedle,bossZone:state.bossZone,bossPop:state.bossPop,
 score:state.score,remaining:state.remaining,level:state.level,feedback:state.feedback,
 correct:state.correct,wrong:state.wrong,history:state.history,
 cursor:state.cursor,forms:state.forms,workerX:state.workerX,workerY:state.workerY,
 trayX:state.trayX,docs:state.docs,drag:state.drag,leaks:state.leaks,
 needle:state.needle,zone:state.zone,playerX:state.playerX,hazards:state.hazards,warnings:state.warnings,safeT:state.safeT,
 shredded:state.shredded,required:state.required,stamped:state.stamped,grade:ui.endGrade.textContent,
 spriteReady:HD.complete&&!!HD.naturalWidth&&iconsReady(),soundEvents,seed,resultTimer:state.resultTimer,frameCount,visibility:document.visibilityState,focus:document.hasFocus()
 }))}),configurable:false});
