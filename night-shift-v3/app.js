// LEAD: additive HD-first bootstrap. Runtime viewport/input/HUD are deliberately
// internal compatibility adapters until RENDER provides the shared implementations.
// Do not market this independently verified shell preview as the full v3 campaign.
import {createDirector} from './runtime/director.js';
import {drawPoster,drawOffice,drawRecover,drawPreviewEnd,drawCampaignVictory,drawCampaignGameOver} from './runtime/transitions.js';
import {definitions as intake} from './scenes/intake/index.js';
import {definitions as services} from './scenes/services/index.js';
import {definitions as publicRelations} from './scenes/pr/index.js';
import {definitions as staff} from './scenes/staff/index.js';
import {definitions as printer} from './bosses/printer/index.js';
import {definitions as quota} from './bosses/quota/quota.mjs';
import {CARDS,PERKS,createDeck,validateDeck,assignDirectives,makeDraft,makeRng} from './systems/core.js';
import {createAudioEngine,AUDIO_CUES} from './audio/engine.js';
import {createStoryExperience} from './story/presentation.js';
import {newRun as newSystemsRun} from './systems/engine.js';
import {presentVerifiedClockout} from './finalization/scoring/receipt.js';
import {withPerkCompatibleDefinitions} from './finalization/perks/context-aliases.js';

const canvas=document.getElementById('world'),g=canvas.getContext('2d',{alpha:false});
const ui={start:document.getElementById('clock-in'),hud:document.getElementById('hud'),
  hearts:document.getElementById('hearts'),timer:document.getElementById('timer'),
  imperative:document.getElementById('imperative'),hint:document.getElementById('hint'),
  mail:document.getElementById('mail'),receipt:document.getElementById('score-receipt'),pause:document.getElementById('pause-sheet'),
  sound:document.getElementById('sound'),sr:document.getElementById('screen-reader')};
const reducedMotion=matchMedia('(prefers-reduced-motion:reduce)').matches;
const viewport={cssWidth:innerWidth,cssHeight:innerHeight,dpr:devicePixelRatio||1,
  worldHeight:760,worldWidth:760*innerWidth/innerHeight,safeRect:null,
  worldToScreen(x,y){const s=this.cssHeight/this.worldHeight;return {x:x*s,y:y*s}},
  screenToWorld(x,y){const s=this.worldHeight/this.cssHeight;return {x:x*s,y:y*s}}};
function resize(){
 const ww=Math.max(1,canvas.getBoundingClientRect().width),hh=Math.max(1,canvas.getBoundingClientRect().height);
 const dpr=Math.max(1,devicePixelRatio||1);
 viewport.cssWidth=ww;viewport.cssHeight=hh;viewport.dpr=dpr;
 viewport.worldWidth=760*ww/hh;viewport.worldHeight=760;
 viewport.safeRect={x:Math.max(20,(viewport.worldWidth-1110)/2),
   y:170,w:Math.min(viewport.worldWidth-40,1110),h:540};
 const pw=Math.round(ww*dpr),ph=Math.round(hh*dpr);
 if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph;}
}
resize();addEventListener('resize',resize,{passive:true});
visualViewport?.addEventListener('resize',resize,{passive:true});
let art=null,atlasStatus='loading';
async function loadHdAtlas(){
 try {
   // The canonical, working HD build is the only art source here. Do not fork an atlas.
   const res=await fetch('./arcade-office-hd.html',{cache:'force-cache'});
   if(!res.ok)throw Error('HD source fetch '+res.status);
   const source=await res.text();
   const match=source.match(/spriteAtlas\.src='(data:image\/png;base64,[^']+)'/);
   if(!match)throw Error('HD sprite atlas not found');
   const image=new Image();
   image.decoding='async';
   image.src=match[1];
   await image.decode();
   if(image.naturalWidth!==2048 || image.naturalHeight!==2048)throw Error('HD atlas dimensions changed');
   art=image;atlasStatus='hd-original-2048';
 }catch(e){atlasStatus='hd-unavailable';console.warn('Night Shift HD image unavailable, procedural fallback active:',e)}
}
loadHdAtlas();

function createScoredAudio(){
 // AUDIO lane's four-section original score replaces LEAD's temporary beeps.
 // One active context; all scene cues go through this original foley library.
 const engine=createAudioEngine();
 const known=new Set(AUDIO_CUES);
 let started=false,muted=false,lastMode='work',paused=false;
 const aliases={
  'start':'click','card-intro':'click','card-complete':'streak',
  'wrong':'fail','promotion':'promotion','hit':'stamp','card-win':'streak',
  'card-fail':'fail','desk-tap':'click','paper-flick':'release',
  'staff-complete':'streak','staff-failed':'fail','staff-go':'help',
  'printer-bolt-removed':'bolt','printer-telegraph':'telegraph',
  'printer-jam-cleared':'jam','quota-bonus-resolved':'file',
  'boss-complete':'victory','card-action':'stamp',
  'coffee':'catch','mira':'help'
 };
 function unlock(){
   if(started)return engine.unlock().catch(()=>false);
   started=true;
   return engine.start('work').catch(error=>{console.warn('Audio context unavailable:',error);return false});
 }
 function play(name,options={}){
   if(!started||muted)return false;
   const normalized=String(name||'').toLowerCase();
   const cue=known.has(normalized)?normalized:(aliases[normalized]||'click');
   try {return engine.cue(cue,options)}catch{return false}
 }
 function update(){
   if(!started)return;
   const mode=director?.mode;
   const want=mode==='promotion'?'promotion':['printer','quota'].includes(mode)?'boss':
     ['victory','gameover','preview-end'].includes(mode)?'victory':'work';
   if(want!==lastMode){engine.setMode(want);lastMode=want;}
   const freeze=Boolean(director?.paused||document.hidden);
   if(freeze!==paused){paused=freeze;if(freeze)engine.pause();else engine.resume().catch(()=>{});}
 }
 function toggle(){
   muted=!muted;engine.setMuted(muted);
   ui.sound.textContent=muted?'SOUND OFF':'SOUND ON';
   ui.sound.setAttribute('aria-label',muted?'Unmute':'Mute game');
   if(!muted)unlock();
 }
 return {unlock,play,update,toggle,get muted(){return muted},
   snapshot:()=>engine.getSnapshot()};
}
const audio=createScoredAudio();
const events={emit(event){
 if(event.type==='damage')ui.sr.textContent='Wrong form. '+event.hearts+' hearts remain.';
 if(event.type==='encounter-cleared')ui.sr.textContent='Approved! Promotion incoming.';
 if(event.type==='promotion')ui.sr.textContent='Promotion offer. Choose one real perk.';
}};
const ALL_DEFINITIONS=withPerkCompatibleDefinitions([...intake,...services,...publicRelations,...staff]);
const ALL_BOSSES=withPerkCompatibleDefinitions([{...printer[0],id:'printer'},{...quota[0],id:'quota'}]);
if(ALL_DEFINITIONS.length!==16||new Set(ALL_DEFINITIONS.map(x=>x.id)).size!==16)
  throw Error('Expected exactly sixteen authored v3 cards');
const PERK_NAMES={
 'carbon-copy':['CARBON COPY','COPY','Repeat one valid stamp on another real object'],
 'chain-stamp':['CHAIN STAMP','CHAIN','A correct impact triggers a linked reachable target'],
 'bank-shot':['BANK SHOT','BANK','Ricochet thrown objects along a marked bumper'],
 'magnet-grip':['MAGNET GRIP','GRIP','Wider grab and visible target guidance'],
 'mira-backup':['MIRA BACKUP','MIRA','A visible coworker can rescue a recoverable mistake'],
 'safety-net':['SAFETY NET','NET','Deploy one visible hazard cushion'],
 'time-bank':['TIME BANK','TIME','Save unused clean time for a later close call'],
 'focus-lens':['FOCUS LENS','LENS','Reveal a fraud or hazard before acting']
};
let director=null,runSeed=1,firstRun=true,runNumber=0,deck=[],schedule=[];
let receiptHandle=null,receiptAttempted=false;
const options=new URLSearchParams(location.search);
function readSeed(){
 const specified=Number(options.get('seed'));
 if(options.has('seed')&&Number.isSafeInteger(specified))return specified+runNumber;
 return (0x4d89a42c + (runNumber*0x9e3779b1))>>>0;
}
function bootDirector(){
 runSeed=readSeed();
 firstRun=options.get('first')==='1'||(options.get('first')!=='0'&&runNumber===0);
 deck=createDeck(runSeed,{firstRun});
 if(!validateDeck(deck))throw Error('Invalid SYSTEMS roster');
 schedule=assignDirectives(runSeed,deck,{firstRun});
 const rng=makeRng(runSeed^0x5eeda11);
 const newDirector=createDirector({viewport,canvas,ctx2d:g,events,audio,options:{reducedMotion},
    scoreFactory:({mode})=>newSystemsRun({seed:runSeed,firstRun,mode})});
 newDirector.configureRun({
   cards:deck,definitions:ALL_DEFINITIONS,bosses:ALL_BOSSES,rng,
   draftProvider:({slot})=>{
     const ids=makeDraft(runSeed,slot,newDirector.snapshot().perkLevels,deck,{firstRun});
     return {offers:ids.map(id=>{
       const [title,symbol,description]=PERK_NAMES[id]||[id,id,'Equipment upgrade'];
       return {id,title,symbol,description,detail:'ACTIVATES IN UPCOMING ENCOUNTERS'};
     }),subject:['Congratulations. The target moved.',
       'Printer is now your manager.','Your reward has an attachment.',
       'Employee wellness has been optimised.','Welcome to the final audit.'][slot],
       directive:schedule[slot].toUpperCase().replaceAll('-',' '),directiveId:schedule[slot]};
   }
 });
 return newDirector;
}
director=bootDirector();
function runStart(){
 receiptHandle?.dispose?.();receiptHandle=null;receiptAttempted=false;
 if(ui.receipt)ui.receipt.hidden=true;
 audio.unlock();
 if(runNumber>0||director.mode!=='title')director=bootDirector();
 runNumber++;
 const preference=(()=>{try{return JSON.parse(localStorage.getItem('quota-panic-nightshift-v3:a11y:v1')||'{}').preferPractice===true}catch{return false}})();
 director.setPractice(preference);
 director.start();syncUi();canvas.focus({preventScroll:true});
}
ui.start.addEventListener('click',runStart);
ui.sound.addEventListener('click',()=>{audio.unlock();audio.toggle()});
document.getElementById('pause').addEventListener('click',()=>{director.togglePause();syncUi()});
document.getElementById('resume').addEventListener('click',()=>{director.togglePause(false);syncUi()});
document.getElementById('restart').addEventListener('click',runStart);
// The INTAKE and SERVICES authors use complete 1280/1200-unit stage geometry.
// Their world must reframe in portrait, not clip the hit targets outside the canvas.
// This affine camera is applied identically to drawing and input, over a full-screen
// scene backdrop. PR/STAFF/QUOTA use their own responsive world coordinates.
function authoredSceneCamera(){
 const id=director.snapshot().currentCardId;
 const width=id?.startsWith('I')?1280:id?.startsWith('S')?1200:0;
 if(!width || viewport.worldWidth>=950)return null;
 const scale=Math.min(1,(viewport.worldWidth-12)/width);
 return {scale,tx:(viewport.worldWidth-width*scale)/2,
   ty:(viewport.worldHeight-720*scale)*.49};
}
function pointer(event,action){
 if(action==='down' && director.mode==='recover'){event.preventDefault();director.retry();syncUi();return;}
 if(action==='down' && (director.mode==='preview-end'||director.mode==='victory'||director.mode==='gameover')){event.preventDefault();runStart();return;}
 if(action==='down'){event.preventDefault();canvas.setPointerCapture?.(event.pointerId);audio.unlock();}
 const b=canvas.getBoundingClientRect(),p=viewport.screenToWorld(event.clientX-b.left,event.clientY-b.top);
 const cam=authoredSceneCamera();
 const transformed=cam?{x:(p.x-cam.tx)/cam.scale,y:(p.y-cam.ty)/cam.scale}:p;
 director.pointer(action,{...transformed,id:event.pointerId,kind:event.pointerType});
}
canvas.addEventListener('pointerdown',e=>pointer(e,'down'));
canvas.addEventListener('pointermove',e=>pointer(e,'move'));
canvas.addEventListener('pointerup',e=>{pointer(e,'up');if(canvas.hasPointerCapture?.(e.pointerId))canvas.releasePointerCapture(e.pointerId)});
canvas.addEventListener('pointercancel',e=>pointer(e,'cancel'));
addEventListener('blur',()=>{if(director.mode==='card'&&!director.paused)director.togglePause(true)});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&director.mode==='card'&&!director.paused)director.togglePause(true)});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&!e.defaultPrevented){director.togglePause();syncUi();}
 if(e.key.toLowerCase()==='m'){audio.unlock();audio.toggle();}
 if(e.key==='Enter' && ['title','preview-end','victory','gameover'].includes(director.mode))runStart();
 if(e.key==='Enter' && director.mode==='recover')director.retry();
});

const storyExperience=createStoryExperience({host:ui.mail,audio,reduceMotion:reducedMotion});
let mailKey='',pendingStoryPerk=null;
function observedPromotionRun(snapshot){
 const committed=snapshot.evidence.filter(e=>e?.committed===true);
 const ids=committed.filter(e=>/^[ISPT][1-4]$/.test(e.id)).map(e=>e.id);
 // Derive only facts the player actually earned; no guesswork from unplayed cards.
 const run={completedCardIds:ids,perkLevels:snapshot.perkLevels,
  mode:snapshot.practice?'practice':'standard',continueUsed:snapshot.continueUsed};
 const coffee=committed.find(e=>e.id==='S2');
 if(coffee?.outcome?.miraWorkstation==='functional')run.workstationIntact=true;
 else if(coffee?.outcome?.miraWorkstation==='disrupted')run.workstationIntact=false;
 return run;
}
function presentPromotion(){
 const data=director.promotion,now=director.snapshot(),slot=now.promotionSlot;
 if(!data||slot<0)return;
 pendingStoryPerk=null;
 storyExperience.showPromotion({
   index:slot+1,run:observedPromotionRun(now),offers:data.offers,
   directive:data.directiveId,
   onPick:({perkId})=>{pendingStoryPerk=perkId;},
   onContinue:({perkId})=>{
     if(director.mode!=='promotion')return;
     const chosen=pendingStoryPerk||perkId;
     if(director.pickPerk(chosen)){
       mailKey='';pendingStoryPerk=null;syncUi();canvas.focus({preventScroll:true});
     }
   }
 });
 ui.mail.querySelector('[data-pick]')?.focus({preventScroll:true});
}
function syncUi(){
 const m=director.mode,playing=['card','printer','quota'].includes(m),hud=playing||m==='recover';
 if(m==='victory'&&!receiptAttempted){
   receiptAttempted=true;
   const runSnapshot=director.getSystemsSnapshot();
   if(director.snapshot().verifiedScoreReady&&runSnapshot){
     try {
       receiptHandle=presentVerifiedClockout({host:ui.receipt,runSnapshot,audio,
         onReplay:runStart,reduceMotion:reducedMotion});
     }catch(error){
       console.error('Final score blocked by invalid player evidence:',error);
       ui.sr.textContent='The machine was defeated, but its scoring evidence was incomplete.';
     }
   }else{
     console.warn('Final score unavailable: real encounter events are insufficient:',director.snapshot().scoreIssue);
     ui.sr.textContent='CLOCK OUT achieved. The final report is unavailable until the run ledger is verified.';
   }
 }
 ui.start.hidden=m!=='title';
 ui.hud.classList.toggle('visible',hud);
 ui.pause.classList.toggle('visible',director.paused);
 ui.mail.classList.toggle('visible',m==='promotion');
 if(m==='promotion'){
   const key=director.snapshot().promotionSlot+':'+director.promotion?.subject;
   if(key!==mailKey){mailKey=key;presentPromotion();}
 }else if(mailKey){mailKey='';pendingStoryPerk=null;storyExperience.hide();}
 ui.hearts.textContent='♥'.repeat(Math.max(0,director.hearts))+'♡'.repeat(Math.max(0,3-director.hearts))+(director.snapshot().globalGuardReady?' ✦':'');
 ui.timer.textContent=Math.ceil(director.snapshot().clock)+'s';
 const label=playing?(director.snapshot().imperative||'STAMP GOOD!'):m==='recover'?'RETRY SHIFT':'';
 ui.imperative.innerHTML='<span>'+label+'</span><small>'+(playing?(m==='card'&&director.snapshot().deck.length===1?'APPROVE THE REAL FORMS':'MOVE THE WORK · BEAT THE CLOCK'):'CLICK THE GREEN PAPER')+'</small>';
 ui.hint.textContent=playing&&director.snapshot().deck.length===1?'GREEN CHECK = VERIFIED    /    RED X = SPONSORED':m==='recover'?'PRESS ENTER TO RETRY':'';
 if(m==='recover')ui.hint.textContent=director.snapshot().lastGlobalGuard?'POWER-UP SAVED A HEART · ENTER TO RETRY':'PRESS ENTER TO RETRY';
 if(['preview-end','victory','gameover'].includes(m))ui.hint.textContent='PRESS ENTER OR CLICK TO REPLAY';
 if(m==='title')ui.hint.textContent='';
}
let last=performance.now(),frames=0;
function animate(now){
 const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;
 director.update(dt);
 audio.update(['card','printer','quota'].includes(director.mode)&&!director.paused);
 syncUi();
 const scale=viewport.cssHeight/760;
 g.setTransform(1,0,0,1,0,0);
 g.fillStyle='#17292b';g.fillRect(0,0,canvas.width,canvas.height);
 g.setTransform(viewport.dpr*scale,0,0,viewport.dpr*scale,0,0);
 if(director.mode==='title')drawPoster(g,viewport,art,now/1000);
 else if(['card','printer','quota'].includes(director.mode)){
   const printer=director.mode==='printer',cam=printer?null:authoredSceneCamera();
   if(printer||cam)g.save();
   if(printer)g.translate(viewport.worldWidth/2,viewport.worldHeight/2);
   if(cam){g.translate(cam.tx,cam.ty);g.scale(cam.scale,cam.scale);}
   director.scene?.draw?.(g,viewport,art);
   if(printer||cam)g.restore();
 }
 else if(director.mode==='recover')drawRecover(g,viewport,art,now/1000);
 else if(director.mode==='victory')drawCampaignVictory(g,viewport,art,now/1000,director.snapshot());
 else if(director.mode==='gameover')drawCampaignGameOver(g,viewport,art,now/1000);
 else if(director.mode==='preview-end')drawPreviewEnd(g,viewport,art,now/1000,director.snapshot().selectedPerk||'SHIFT FINISHED');
 else drawOffice(g,viewport,art,now/1000);
 frames++;
 requestAnimationFrame(animate);
}
syncUi();requestAnimationFrame(animate);
Object.defineProperty(window,'__nightShiftV3',{value:Object.freeze({
 snapshot:()=>Object.freeze({...director.snapshot(),viewport:{cssWidth:viewport.cssWidth,cssHeight:viewport.cssHeight,
    worldWidth:viewport.worldWidth,worldHeight:viewport.worldHeight,dpr:viewport.dpr,
    backing:[canvas.width,canvas.height]},hdAtlas:atlasStatus,frames,audio:audio.snapshot()}),
 version:'2026-11-08.lead-recovery-integrated-candidate'
})});