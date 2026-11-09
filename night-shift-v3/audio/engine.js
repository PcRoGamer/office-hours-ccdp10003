/**
 * QUOTA PANIC v3 • fully original procedural soundtrack + tactile foley.
 *
 * Integration:
 *   const audio = createAudioEngine();
 *   await audio.start('work'); // call inside CLOCK IN gesture
 *   audio.cue('stamp'); audio.setPressure(.8); audio.setMode('boss');
 *   audio.pause(); await audio.resume(); audio.setMuted(true); audio.dispose();
 *
 * Does not read gameplay clock, advance a scene timer or mutate game rules.
 * Browser AudioContext begins ONLY after a user gesture; modes/cues are safe pre-unlock.
 */
import {SCORE, SCORE_MODES, midiHz, scoreStep, stepSeconds} from './composition.js';

const limit=(n,a=0,b=1)=>Math.min(b,Math.max(a,Number.isFinite(n)?n:a));
const TWO_PI=Math.PI*2;
const CUES=new Set(['stamp','file','collision','catch','fail','scam','help','promotion','bolt','victory','grab','release','miss','jam','telegraph','clock-out','click','printer','quota','heart','streak']);
export const AUDIO_CUES=Object.freeze([...CUES]);

export function createAudioEngine({
  audioContextFactory=()=>new (globalThis.AudioContext || globalThis.webkitAudioContext)(),
  scheduler=setInterval,
  cancelScheduler=clearInterval,
  logger=null
}={}) {
  let ctx=null, master=null, music=null, foley=null, comp=null, noise=null;
  let mode='work',pressure=.16,streak=0, volume=.78, muted=false, playing=false, paused=false, disposed=false;
  let nextTime=0, step=0, timer=null, voices=0, notesScheduled=0, cuesTriggered=0, transitions=0;
  let recentCues=[], recentNotes=[];
  const log=(kind,info)=>{ if (logger) logger({kind,...info}); };
  const ensure=()=>{
    if (disposed) throw new Error('Audio engine disposed');
    if (ctx) return ctx;
    ctx=audioContextFactory();
    master=ctx.createGain();music=ctx.createGain();foley=ctx.createGain();
    comp=ctx.createDynamicsCompressor();
    if (comp.threshold) comp.threshold.value=-18;
    if (comp.ratio) comp.ratio.value=4;
    if (comp.attack) comp.attack.value=.004;
    if (comp.release) comp.release.value=.18;
    music.gain.value=.66;foley.gain.value=.9;
    music.connect(master);foley.connect(master);master.connect(comp);comp.connect(ctx.destination);
    master.gain.value=muted?.00001:volume*volume*.85;
    const length=Math.max(512,Math.floor(ctx.sampleRate*.65));
    noise=ctx.createBuffer(1,length,ctx.sampleRate);
    const data=noise.getChannelData(0);let seed=9817235;
    for(let i=0;i<length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=(seed/2147483648-1)*.72;}
    return ctx;
  };
  const envelope=(node,t,attack,decay,peak,sustain=.0001)=>{
    const g=node.gain;
    g.setValueAtTime(.0001,t);
    g.linearRampToValueAtTime(Math.max(.00011,peak),t+Math.max(.001,attack));
    g.exponentialRampToValueAtTime(Math.max(.0001,sustain),t+Math.max(.008,decay));
  };
  function route(pan=0, output=music) {
    if (!ctx.createStereoPanner || Math.abs(pan)<.01) return output;
    const node=ctx.createStereoPanner();node.pan.setValueAtTime(limit(pan,-.9,.9),ctx.currentTime);node.connect(output);
    return node;
  }
  function osc(type,freq,t,dur,gain,output=music,{pan=0,to=null,attack=.006,release=null,filter=0}={}) {
    dur=Math.max(.02,dur);freq=Math.max(18,freq);
    const o=ctx.createOscillator(), g=ctx.createGain();
    o.type=type;o.frequency.setValueAtTime(freq,t);
    if(to && to>0)o.frequency.exponentialRampToValueAtTime(Math.max(18,to),t+Math.min(dur,.15));
    let dest=route(pan,output);
    if(filter && ctx.createBiquadFilter){const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(filter,t);g.connect(f);f.connect(dest);}
    else g.connect(dest);
    o.connect(g);
    envelope(g,t,attack,release??dur,Math.max(.00011,gain));
    o.start(t);o.stop(t+dur+.025);voices++;
    return o;
  }
  function hiss(t,dur,gain,filterType='highpass',freq=5000,output=music,pan=0){
    if (!noise) return;
    const src=ctx.createBufferSource();src.buffer=noise;
    const fil=ctx.createBiquadFilter(),g=ctx.createGain();
    fil.type=filterType;fil.frequency.setValueAtTime(freq,t);
    fil.Q.value=.65;
    src.connect(fil);fil.connect(g);g.connect(route(pan,output));
    envelope(g,t,.002,dur,Math.max(.00011,gain));
    src.start(t,0);src.stop(t+dur+.006);voices++;
  }
  function voice(event,t,stepDuration,output=music){
    const {voice:kind,midi,gain,len,pan}=event,sec=Math.max(.045,len*stepDuration*.85),hz=midiHz(midi);
    if(kind==='kick'){
      osc('sine',140,t,.21,.54*gain,output,{to:42,release:.20,attack:.002});
      osc('triangle',73,t,.075,.08*gain,output,{to:39,release:.07,attack:.001});
    }else if(kind==='snare'){
      hiss(t,.15,.24*gain,'highpass',1450,output,pan);
      osc('triangle',174,t,.11,.12*gain,output,{to:98,release:.10,attack:.001});
    }else if(kind==='hat'||kind==='shaker'||kind==='brush'){
      const f=kind==='hat'?7500:kind==='shaker'?4800:1700;
      hiss(t,kind==='hat'?.042:kind==='shaker'?.075:.19,(kind==='brush'?.26:.20)*gain,kind==='brush'?'bandpass':'highpass',f,output,pan);
    }else if(kind==='bass'){
      osc('triangle',hz,t,Math.min(.36,sec+.02),.22*gain,output,{to:hz*.994,release:Math.min(.35,sec),filter:780,pan});
      osc('sine',hz/2,t,Math.min(.32,sec),.10*gain,output,{release:Math.min(.31,sec),pan});
    }else if(kind==='keys'){
      osc('sine',hz,t,Math.min(.79,sec+.12),.34*gain,output,{attack:.008,release:Math.min(.72,sec+.08),pan});
      osc('triangle',hz*2.003,t,Math.min(.56,sec),.10*gain,output,{release:Math.min(.50,sec),pan});
    }else if(kind==='marimba'){
      osc('sine',hz,t,Math.min(.40,sec+.09),.42*gain,output,{release:Math.min(.37,sec+.07),attack:.002,pan});
      osc('sine',hz*3.01,t,Math.min(.20,sec),.1*gain,output,{release:Math.min(.18,sec),attack:.002,pan});
    }else if(kind==='bell'){
      osc('sine',hz,t,Math.min(1.2,sec+.27),.3*gain,output,{attack:.002,release:Math.min(1.13,sec+.25),pan});
      osc('sine',hz*2.41,t,Math.min(.55,sec+.10),.08*gain,output,{attack:.002,release:Math.min(.50,sec+.08),pan});
    }else if(kind==='pad'){
      osc('sine',hz,t,Math.min(2.3,sec+.24),.3*gain,output,{attack:.13,release:Math.min(2.22,sec+.22),pan});
      osc('triangle',hz*.998,t,Math.min(1.9,sec+.2),.12*gain,output,{attack:.14,release:Math.min(1.85,sec+.19),pan});
    }else if(kind==='brass'){
      osc('sawtooth',hz,t,Math.min(.42,sec+.10),.11*gain,output,{filter:1250,attack:.035,release:Math.min(.38,sec+.08),pan});
      osc('triangle',hz*.997,t,Math.min(.37,sec+.07),.14*gain,output,{attack:.025,release:Math.min(.35,sec+.06),pan});
    }else if(kind==='clave'){
      osc('sine',940,t,.048,.11*gain,output,{to:530,release:.046,attack:.001,pan});
    }else if(kind==='tom'){
      osc('sine',183,t,.31,.34*gain,output,{to:71,release:.29,attack:.002});
      hiss(t,.08,.05*gain,'lowpass',1700,output);
    }else if(kind==='swell'){
      osc('triangle',hz,t,.65,.14*gain,output,{to:hz*2,release:.62,attack:.20});
    }
    notesScheduled++;
  }
  function pump(){
    if(!playing||paused||muted||!ctx||ctx.state!=='running')return;
    const now=ctx.currentTime;
    if(nextTime<now-.3){nextTime=now+.025;step=Math.ceil(step/16)*16;log('resync',{step});}
    let loops=0;
    while(nextTime<now+.17 && loops++<20){
      const data=scoreStep({mode,step,pressure,streak});
      const dur=stepSeconds(mode);
      const swing=step%2===1?dur*SCORE[mode].swing:0;
      data.notes.forEach(n=>voice(n,nextTime+swing,dur));
      recentNotes.push({mode,step,bar:data.bar,n:data.notes.length});
      if(recentNotes.length>40)recentNotes.shift();
      log('step',{mode,step,at:nextTime,voices:data.notes.length});
      nextTime+=dur;step++;
    }
  }
  async function unlock(){
    ensure();
    if(ctx.state==='suspended') await ctx.resume();
    log('unlock',{state:ctx.state});
    return ctx.state==='running';
  }
  async function start(m='work'){
    if(!SCORE_MODES.includes(m))throw new RangeError('Unknown mode '+m);
    await unlock();
    if(playing&&!paused){setMode(m);return true;}
    mode=m;playing=true;paused=false;step=0;nextTime=ctx.currentTime+.04;
    music.gain.setTargetAtTime(.66,ctx.currentTime,.035);
    if(timer===null)timer=scheduler(pump,28);
    pump();log('start',{mode});
    return true;
  }
  function setMode(m){
    if(!SCORE_MODES.includes(m))throw new RangeError('Unknown mode '+m);
    if(mode===m)return false;
    mode=m;transitions++;
    if(ctx&&playing){const t=ctx.currentTime;music.gain.setTargetAtTime(.0001,t,.023);music.gain.setTargetAtTime(.66,t+.085,.045);nextTime=t+.13;step=0;log('mode',{mode});}
    return true;
  }
  function setPressure(p){pressure=limit(p);return pressure;}
  function setStreak(s){streak=Math.max(0,Math.floor(Number.isFinite(s)?s:0));return streak;}
  function setVolume(v){volume=limit(v);if(master)master.gain.setTargetAtTime(muted?.00001:volume*volume*.85,ctx.currentTime,.02);return volume;}
  function setMuted(m){muted=!!m;if(master)master.gain.setTargetAtTime(muted?.00001:volume*volume*.85,ctx.currentTime,.012);log('mute',{muted});return muted;}
  function cue(name,{strength=1,pan=0}={}){
    if(!CUES.has(name))throw new RangeError('Unknown cue: '+name);
    cuesTriggered++;recentCues.push({name,when:ctx?.currentTime??null});if(recentCues.length>32)recentCues.shift();
    log('cue',{name,muted});
    if(!ctx||ctx.state!=='running'||muted||paused||disposed)return false;
    const t=ctx.currentTime+.003,s=limit(strength,.04,1.5),p=limit(pan,-.8,.8);
    const note=(m,v=.2,d=.1,k='marimba',delay=0)=>voice({voice:k,midi:m,gain:v*s,len:1,pan:p},t+delay,d,foley);
    const tap=(f,d=.09,v=.15,down=.6)=>osc('triangle',f,t,d,v*s,foley,{to:f*down,release:d,attack:.002,pan:p});
    const paper=(d=.14,v=.2)=>hiss(t,d,v*s,'bandpass',1800,foley,p);
    switch(name){
      case 'stamp': tap(132,.24,.47,.37);hiss(t+.008,.105,.22*s,'lowpass',1120,foley,p);note(74,.21,.15,'marimba',.035);break;
      case 'file': paper(.23,.20);tap(520,.11,.11,.83);note(79,.09,.11,'keys',.04);break;
      case 'collision': tap(250,.16,.28,.31);paper(.085,.1);break;
      case 'catch': note(81,.27,.4,'bell');note(88,.18,.42,'bell',.07);break;
      case 'fail': tap(367,.22,.28,.38);note(55,.17,.3,'brass',.07);break;
      case 'scam': hiss(t,.30,.36*s,'bandpass',470,foley,p);tap(690,.21,.22,.24);break;
      case 'help': [69,73,76].forEach((m,i)=>note(m,.22,.38,'keys',i*.065));break;
      case 'promotion': [74,78,81,86].forEach((m,i)=>note(m,.31,.32,'bell',i*.096));break;
      case 'bolt': tap(970,.28,.30,.17);hiss(t,.14,.13*s,'highpass',3300,foley,p);note(78,.12,.24,'bell',.035);break;
      case 'victory': case 'clock-out': [62,66,69,74,81].forEach((m,i)=>note(m,.35,.45,'brass',i*.13));tap(91,.32,.50,.40);break;
      case 'grab': tap(290,.045,.12,.84);break;
      case 'release': case 'click': tap(460,.055,.12,.78);break;
      case 'miss': tap(187,.14,.1,.56);break;
      case 'jam': case 'printer': tap(74,.49,.42,.39);hiss(t,.35,.32*s,'lowpass',420,foley,p);tap(189,.25,.21,.41);break;
      case 'telegraph': note(77,.21,.23,'brass');note(78,.25,.28,'brass',.16);break;
      case 'quota': [50,51,52].forEach((m,i)=>note(m,.23,.20,'brass',i*.085));break;
      case 'heart': note(69,.22,.33,'bell');break;
      case 'streak': [79,83,86].forEach((m,i)=>note(m,.20,.20,'marimba',i*.065));break;
    }
    return true;
  }
  function pause(){
    if(!playing||paused)return false;
    paused=true;if(timer!==null){cancelScheduler(timer);timer=null;}
    if(ctx)ctx.suspend();log('pause',{});return true;
  }
  async function resume(){
    if(!playing)return start(mode);
    if(!paused)return true;
    paused=false;await unlock();nextTime=ctx.currentTime+.035;
    if(timer===null)timer=scheduler(pump,28);
    pump();log('resume',{});return true;
  }
  function stop(){
    if(!playing)return;
    playing=false;paused=false;
    if(timer!==null){cancelScheduler(timer);timer=null;}
    if(ctx)music.gain.setTargetAtTime(.0001,ctx.currentTime,.045);
    log('stop',{});
  }
  async function dispose(){
    if(disposed)return;
    stop();disposed=true;
    if(ctx){await ctx.close();ctx=null;}
    music=null;master=null;foley=null;comp=null;noise=null;
  }
  function snapshot(){return Object.freeze({mode,pressure,streak,volume,muted,playing,paused,disposed,contextState:ctx?.state??'locked',step,notesScheduled,cuesTriggered,transitions,voices,recentCues:[...recentCues],recentNotes:[...recentNotes]});}
  return Object.freeze({unlock,start,stop,pause,resume,dispose,cue,setMode,setPressure,setStreak,setVolume,setMuted,getSnapshot:snapshot,pumpForTest:pump});
}