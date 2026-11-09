import {GAMES,ALL_IDS} from './games.js';
import {rr,ink,confetti,vignette,HD,iconsReady} from './art.js';
const cvs=document.getElementById('stage'),c=cvs.getContext('2d',{alpha:false});
const hud={lives:document.getElementById('lives'),round:document.getElementById('round'),mute:document.getElementById('mute')};
const ui={title:document.getElementById('splash'),pause:document.getElementById('pause'),ending:document.getElementById('ending'),sr:document.getElementById('sr'),
 play:document.getElementById('play'),again:document.getElementById('again'),resume:document.getElementById('resume'),endTitle:document.getElementById('end-title'),endScore:document.getElementById('end-score')};
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
 if(name==='speed'){tone(570,.07,.1,'square');tone(850,.09,.1,'square',.11);tone(1180,.11,.1,'square',.22)}
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
let state={mode:'title',queue:[],index:0,rounds:18,lives:3,score:0,combo:0,
 current:null,id:'',level:1,remaining:0,duration:0,t:0,period:0,feedback:'',done:false,
 flash:0,shake:0,particles:[],cursor:{x:480,y:380},resultTimer:0,correct:0,wrong:0,history:[],best:0};
function shuffle(arr){for(let i=arr.length-1;i>0;i--){const k=Math.floor(rand()*(i+1));[arr[i],arr[k]]=[arr[k],arr[i]]}return arr}
function buildQueue(){
 const q=[];for(let cycle=0;cycle<3;cycle++){
  const seq=shuffle([...ALL_IDS]);
  if(cycle===0){const i=seq.indexOf('stamp');[seq[0],seq[i]]=[seq[i],seq[0]]}
  if(cycle>0&&seq[0]===q[q.length-1]){[seq[0],seq[1]]=[seq[1],seq[0]]}
  q.push(...seq);
 }
 return q;
}
function api(){
 return {rand,win:(x,y)=>settle(true,x,y),lose:(x,y)=>settle(false,x,y),tap:()=>sfx('tap'),spark:(x,y,color)=>burst(x,y,color)};
}
function beginGame(){
 initAudio();
 state={...state,mode:'active',queue:buildQueue(),index:0,lives:3,score:0,combo:0,
  history:[],correct:0,wrong:0,particles:[],flash:0,shake:0,period:0,cursor:{x:480,y:380},done:false};
 for(const v of [ui.title,ui.ending,ui.pause])v.classList.add('hidden');
 startRound();
 cvs.focus({preventScroll:true});
}
function startRound(){
 if(state.index>=state.queue.length){finish();return}
 state.level=1+Math.floor(state.index/6);
 state.id=state.queue[state.index];
 state.current=GAMES.find(g=>g.id===state.id);
 state.t=0;state.period=0;state.feedback='';state.mode='active';state.done=false;state.particles=[];
 state.duration=state.level===1?4.8:state.level===2?4.05:3.35;
 state.remaining=state.duration;
 state.current.enter(state,api());
 hud.lives.textContent='♥'.repeat(state.lives)+'♡'.repeat(3-state.lives);
 hud.lives.setAttribute('aria-label',state.lives+' hearts remaining');
 hud.round.textContent=String(state.index+1).padStart(2,'0')+' / '+state.rounds;
 ui.sr.textContent=state.current.cmd+' '+state.current.hint;
 if(state.index===6||state.index===12)sfx('speed');
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
 state.history.push({id:state.id,level:state.level,success:good,elapsed:+state.t.toFixed(2),remaining:+left.toFixed(2)});
 state.feedback=good?'NICE!':'NOPE!';
 state.flash=good?.5:.55;state.shake=good?5:14;
 state.mode='result';state.resultTimer=good?.43:.49;
 if(good){state.score++;state.combo++;burst(x,y,'#6ce7ae');sfx('win')}
 else{state.lives--;state.combo=0;sfx('lose');burst(x,y,'#fb6751')}
}
function finish(){
 state.mode='end';state.best=Math.max(state.best,state.score);
 ui.endTitle.textContent=state.lives>0?'SURVIVED!':'FIRED!';
 ui.endScore.textContent=state.score+' / '+state.queue.length+' JOBS CLEARED · '+state.lives+' HEARTS LEFT';
 ui.ending.classList.remove('hidden');hud.round.textContent=state.score+' CLEARED';
 ui.sr.textContent='Game over. '+ui.endScore.textContent;
}
function pauseToggle(force){
 if(state.mode==='title'||state.mode==='end')return;
 if(force==='pause'&&state.mode==='pause'||force==='resume'&&state.mode!=='pause')return;
 if(state.mode==='pause'){state.mode=state.wasMode||'active';ui.pause.classList.add('hidden');cvs.focus({preventScroll:true});if(ac?.state==='suspended'&&soundOn)ac.resume()}
 else {state.wasMode=state.mode;state.mode='pause';ui.pause.classList.remove('hidden')}
}
ui.play.addEventListener('click',beginGame);ui.again.addEventListener('click',beginGame);
ui.resume.addEventListener('click',()=>pauseToggle('resume'));
hud.mute.addEventListener('click',()=>{soundOn=!soundOn;hud.mute.textContent=soundOn?'♫':'♪̸';if(soundOn)initAudio();else ac?.suspend()});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'){if(state.mode==='pause'||['active','result'].includes(state.mode))pauseToggle();return}
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
  const beat=.46/(1+.12*(state.level-1));
  state.period+=dt;
  if(state.period>=beat){state.period-=beat;sfx('beat')}
  // Not every microgame has per-frame state. A static click task is valid.
  state.current.update?.(state,dt,api());
  if(state.mode==='active'&&state.remaining<=0)settle(false,480,380);
 }else if(state.mode==='result'){
  state.resultTimer-=dt;if(state.resultTimer<=0){
   if(state.lives<=0)finish();else{state.index++;startRound()}
  }
 }
 state.flash=Math.max(0,state.flash-dt*1.8);
 state.shake=Math.max(0,state.shake-dt*35);
 for(const p of state.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=250*dt;p.life-=dt}
 state.particles=state.particles.filter(p=>p.life>0);
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
  const pct=state.mode==='result'?0:Math.max(0,state.remaining/state.duration);
  rr(c,95,513,770,11,5,'#244448');rr(c,95,513,770*pct,11,5,pct<.25?'#ee5849':'#fff2d0');
  if(state.mode==='result'){
   c.fillStyle=state.feedback==='NICE!'?'#4ee9a54d':'#f55c5966';c.fillRect(0,0,WW,HH);
   c.save();c.shadowColor='#11272b88';c.shadowOffsetY=8;c.shadowBlur=0;
   ink(c,state.feedback,480,265,144,state.feedback==='NICE!'?'#fff6d7':'#ffefde');c.restore();
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
 score:state.score,remaining:state.remaining,level:state.level,feedback:state.feedback,
 correct:state.correct,wrong:state.wrong,history:state.history,
 cursor:state.cursor,forms:state.forms,workerX:state.workerX,workerY:state.workerY,
 trayX:state.trayX,docs:state.docs,drag:state.drag,leaks:state.leaks,
 needle:state.needle,zone:state.zone,playerX:state.playerX,hazards:state.hazards,safeT:state.safeT,
 spriteReady:HD.complete&&!!HD.naturalWidth&&iconsReady(),soundEvents,seed,resultTimer:state.resultTimer,frameCount,visibility:document.visibilityState,focus:document.hasFocus()
 }))}),configurable:false});
