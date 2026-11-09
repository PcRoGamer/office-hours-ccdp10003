/** HUD anchored to viewport edges, independent of zoom and world camera. */
export function createHud({root=document.body,onPause=()=>{},onMute=()=>{}}={}) {
 const host=document.createElement('div');host.className='ns-hud';host.dataset.nsHud='';
 host.innerHTML=[
  '<div class="ns-hud__health" aria-label="Focus"><div class="ns-hud__hearts"></div><span class="ns-hud__sub">FOCUS</span></div>',
  '<div class="ns-hud__mission"><span class="ns-hud__chapter">01 / INTAKE</span><strong class="ns-hud__imperative">STAMP GOOD!</strong></div>',
  '<div class="ns-hud__timer" role="timer"><span class="ns-hud__count">00:34</span><span class="ns-hud__sub">TO DEADLINE</span></div>',
  '<div class="ns-hud__directive"><span>DIRECTIVE / 01</span><strong>NO OVERTIME PAY</strong></div>',
  '<div class="ns-hud__controls"><button type="button" class="ns-hud__control ns-hud__mute" aria-label="Mute sound">♫</button>',
  '<button type="button" class="ns-hud__control ns-hud__pause" aria-label="Pause game">Ⅱ</button></div>'
 ].join('');root.appendChild(host);
 const q=s=>host.querySelector(s), hearts=q('.ns-hud__hearts'),imp=q('.ns-hud__imperative'),chapter=q('.ns-hud__chapter'),clock=q('.ns-hud__count'),directive=q('.ns-hud__directive strong'),mute=q('.ns-hud__mute'),pause=q('.ns-hud__pause');
 const pauseCb=()=>onPause(),muteCb=()=>onMute();pause.addEventListener('click',pauseCb);mute.addEventListener('click',muteCb);
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 function update({hearts:hp=4,maxHearts=4,timeLeft=34,imperative='STAMP GOOD!',directive:rule='NO OVERTIME PAY',chapter:chapterText='01 / INTAKE',paused=false,muted=false}={}) {
  const max=clamp(Math.round(maxHearts||0),0,10),filled=clamp(Math.round(hp||0),0,max);
  hearts.replaceChildren();
  for(let i=0;i<max;i++){const el=document.createElement('span');el.className='ns-hud__heart'+(i<filled?'':' is-empty');el.textContent='♥';el.setAttribute('aria-hidden','true');hearts.appendChild(el);}
  q('.ns-hud__health').setAttribute('aria-label','Focus '+filled+' of '+max);
  const secs=Math.max(0,Math.ceil(Number(timeLeft)||0));clock.textContent=String(Math.floor(secs/60)).padStart(2,'0')+':'+String(secs%60).padStart(2,'0');
  host.classList.toggle('is-urgent',secs<=9);imp.textContent=String(imperative).slice(0,55);chapter.textContent=String(chapterText).slice(0,55);directive.textContent=String(rule).slice(0,80);
  mute.textContent=muted?'♪̸':'♫';mute.setAttribute('aria-label',muted?'Unmute sound':'Mute sound');mute.setAttribute('aria-pressed',String(!!muted));
  pause.textContent=paused?'▶':'Ⅱ';pause.setAttribute('aria-label',paused?'Resume game':'Pause game');pause.setAttribute('aria-pressed',String(!!paused));
 }
 update();
 return{element:host,update,getSafeInsets(){return{left:24,right:24,top:window.innerWidth<780?143:112,bottom:window.innerWidth<780?94:77};},destroy(){pause.removeEventListener('click',pauseCb);mute.removeEventListener('click',muteCb);host.remove();}};
}