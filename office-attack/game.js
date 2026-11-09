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
const deadline={shell:document.getElementById('deadline-ui'),fill:document.getElementById('deadline-fill'),
seconds:document.getElementById('deadline-seconds'),track:document.querySelector('.deadline-track')};
const BATCH_SIZE=Math.min(8,ALL_IDS.length);
const FIRST_BREAK=BATCH_SIZE,SECOND_BREAK=BATCH_SIZE*2+1;
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
let state={mode:'title',queue:[],index:0,rounds:BATCH_SIZE*3,lives:3,score:0,combo:0,
 current:null,id:'',level:1,remaining:0,duration:0,t:0,period:0,feedback:'',done:false,
 flash:0,shake:0,particles:[],cursor:{x:480,y:380},resultTimer:0,correct:0,wrong:0,history:[],best:0};
function shuffle(arr){for(let i=arr.length-1;i>0;i--){const k=Math.floor(rand()*(i+1));[arr[i],arr[k]]=[arr[k],arr[i]]}return arr}
function buildQueue(){
 const q=[];
 for(let cycle=0;cycle<3;cycle++){
  const pool=shuffle([...ALL_IDS]);
  if(cycle===0){const i=pool.indexOf('stamp');if(i>=0){pool.splice(i,1);pool.unshift('stamp')}}
  const seq=pool.slice(0,BATCH_SIZE);
  if(cycle>0&&seq.length>1&&seq[0]===q[q.length-1]){[seq[0],seq[1]]=[seq[1],seq[0]]}
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
 state={...state,mode:'active',queue:buildQueue(),index:0,rounds:BATCH_SIZE*3,lives:3,score:0,combo:0,bossWins:0,interTime:0,
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
 state.level=Math.min(3,1+Math.floor(priorMinis/BATCH_SIZE));
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
  String(completedMinis()+1).padStart(2,'0')+' / '+state.rounds;
 ui.sr.textContent=state.current.cmd+' '+state.current.hint;
 if(isBoss(state.id))sfx('boss');
}
function showerPaperConfetti(){
 const sheet=document.getElementById('inter-confetti');
 sheet.replaceChildren();
 for(let i=0;i<36;i++){
  const bit=document.createElement('i');
  bit.style.setProperty('--x',((i*47)%100)+'%');
  bit.style.setProperty('--delay',((i*7)%21)*.03+'s');
  bit.style.setProperty('--fall',(2.1+(i%5)*.19)+'s');
  bit.style.setProperty('--tilt',((i*83)%220-110)+'deg');
  bit.style.background=['#fff8db','#f27769','#8bd8bb','#f8cf68'][i%4];
  sheet.append(bit);
 }
}
function startIntermission(){
 state.mode='intermission';
 state.interDuration=state.index===FIRST_BREAK?3.25:3.05;
 state.interTime=state.interDuration;
 state.interAutoRemaining=.84;
 state.interReadMore=false;
 syncMarathonUI();
 ui.interContinue.disabled=true;
 ui.interContinue.textContent='CELEBRATING...';
 ui.interRestNote.textContent=marathonMode?'MARATHON ON: next game begins after the celebration. Open research to hold.':'RELAXED BREAK: press Continue when ready. Reading is optional.';
 ui.interResearch.classList.add('hidden');
 ui.inter.classList.remove('hidden');
 showerPaperConfetti();
 ui.interTitle.textContent=state.index===FIRST_BREAK?'LEVEL CLEAR!':'KEEP GOING!';
 ui.interTag.textContent=state.index===FIRST_BREAK?BATCH_SIZE+' DISASTERS SURVIVED. HR IS WATCHING.':(BATCH_SIZE*2)+' JOBS DONE. PAPER HERO!';
 ui.interScore.textContent=String(state.score).padStart(2,'0')+' POINTS';
 ui.interLives.textContent='♥'.repeat(state.lives)+'♡'.repeat(3-state.lives);
 ui.interSpeed.textContent=state.index===FIRST_BREAK?'NEXT: PRINTER PANIC!':'FINAL BATCH: MAX PANIC!';
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
    if(state.index===FIRST_BREAK||state.index===SECOND_BREAK)startIntermission();
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
function updateDeadlineHud(){
 const playing=['active','result','pause'].includes(state.mode)&&!!state.current;
 deadline.shell.hidden=!playing;
 if(!playing)return;
 const ratio=Math.max(0,Math.min(1,state.remaining/Math.max(.001,state.duration)));
 const won=state.mode==='result'&&state.history.at(-1)?.success;
 const lost=state.mode==='result'&&!won;
 deadline.shell.classList.toggle('panic',state.mode==='active'&&ratio<=.25);
 deadline.shell.classList.toggle('critical',state.mode==='active'&&ratio<=.1);
 deadline.shell.classList.toggle('win',state.mode==='result'&&won);
 deadline.shell.classList.toggle('fail',state.mode==='result'&&lost);
 deadline.fill.style.transform='scaleX('+(won?1:ratio)+')';
 deadline.seconds.textContent=won?'NICE!':lost?'LATE!':Math.max(0,state.remaining).toFixed(1)+'s';
 deadline.track.setAttribute('aria-valuenow',String(Math.round(ratio*100)));
}
function portraitStaging(g,c,m){
 const {width,height,scale,offsetY}=m;
 if(height<=width*1.22||offsetY<52||!g.current||g.mode==='title')return;
 const top=offsetY;
 const lowerTop=offsetY+HH*scale;
 c.save();
 // The full-height portrait composition restores a large, legible imperative
 // while the original microgame hit coordinates stay perfectly unchanged.
 c.textAlign='center';c.textBaseline='middle';
 c.font='900 '+Math.round(Math.min(60,width*.145))+'px Impact,Arial,sans-serif';
 c.fillStyle='#235052';
 c.fillText(g.current.cmd,width/2,Math.max(47,top*.38));
 const hint=g.current.hint||'';
 c.font='800 '+Math.round(Math.min(16,Math.max(11,(width-18)/Math.max(1,hint.length*.58))))+'px Arial,sans-serif';
 c.fillStyle='#466563';
 c.fillText(hint,width/2,Math.max(74,top*.65),width-20);
 if(lowerTop<height-70){
  const x=width*.5,y=lowerTop+(height-lowerTop)*.49;
  const wobble=Math.sin(g.t*8)*.065;
  c.translate(x,y);c.rotate(wobble);
  // A chunky, expressive worker. No legacy image atlas or fine black outlines.
  c.strokeStyle='#efad79';c.lineWidth=13;c.lineCap='round';
  c.beginPath();c.moveTo(-39,-8);c.lineTo(-59,12+Math.sin(g.t*8)*7);c.moveTo(39,-8);c.lineTo(59,8-Math.sin(g.t*8)*7);c.stroke();
  c.fillStyle='#f6b57e';c.beginPath();c.ellipse(0,0,45,57,0,0,Math.PI*2);c.fill();
  c.fillStyle='#e89a66';c.beginPath();c.ellipse(0,40,35,14,0,0,Math.PI*2);c.fill();
  c.fillStyle='#2d4d4a';
  for(const ex of [-16,16]){c.beginPath();c.ellipse(ex,-13,4.5,7.3,0,0,Math.PI*2);c.fill()}
  c.fillStyle='#8c4b4a';c.beginPath();c.ellipse(1,18,8,8+Math.sin(g.t*9)*3,0,0,Math.PI*2);c.fill();
  c.fillStyle='#d85d5a';c.beginPath();c.moveTo(-4,34);c.lineTo(5,34);c.lineTo(11,54);c.lineTo(-10,54);c.fill();
  c.restore();
 }
}
function draw(){
 const {width,height,dpr,scale,offsetX,offsetY}=measure;
 c.setTransform(dpr,0,0,dpr,0,0);
 c.fillStyle=state.current?.bg||'#b9dfd2';c.fillRect(0,0,width,height);
 c.save();c.translate(offsetX,offsetY);c.scale(scale,scale);
 if(state.shake>0)c.translate((Math.random()-.5)*state.shake,(Math.random()-.5)*state.shake);
 const active=state.current;
 c.fillStyle=active?.bg||'#315250';c.fillRect(0,0,WW,HH);
 if(active&&state.mode!=='title'){
  active.draw(state,c);
  if(!(height>width*1.22&&offsetY>52)){
  c.save();
  c.shadowColor='#15303766';c.shadowBlur=3;
  ink(c,active.cmd,480,104,84,'#fff9e9');
  c.restore();
  ink(c,active.hint,480,157,20,'#214243');
  }
  // Dedicated timer dock lives outside the stage: never cover gameplay.
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
 portraitStaging(state,c,measure);
}
let frameCount=0;let last=performance.now();
function frame(now){
 frameCount++;
 const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;
 if(state.mode!=='pause'&&state.mode!=='title'&&state.mode!=='end')update(dt);
 updateDeadlineHud();draw();requestAnimationFrame(frame);
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
 shredded:state.shredded,required:state.required,stamped:state.stamped,
 plugX:state.plugX,plugY:state.plugY,plugTarget:state.plugTarget,plugPorts:state.plugPorts,plugDrag:state.plugDrag,
 cleanProgress:state.cleanProgress,cleanNeed:state.cleanNeed,cleanDrag:state.cleanDrag,
 sortItems:state.sortItems,sortBins:state.sortBins,sorted:state.sorted,sortDrag:state.sortDrag,
 popup:state.popup,shutTotal:state.shutTotal,shutClosed:state.shutClosed,
 grade:ui.endGrade.textContent,
 spriteReady:HD.complete&&!!HD.naturalWidth&&iconsReady(),soundEvents,seed,resultTimer:state.resultTimer,frameCount,visibility:document.visibilityState,focus:document.hasFocus()
 }))}),configurable:false});
