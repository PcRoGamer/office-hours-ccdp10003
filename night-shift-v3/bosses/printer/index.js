/** PRINTER MUTINY, Night Shift v3. World-space boss FSM, not a health bar.
 * Zero-perk deterministic solution; authored tactile bolts and packet counter.
 * World coordinates are centred on origin, world height 760.
 */
import { drawPrinterBoss } from './render.js';

export const PRINTER_DIRECTIVES = Object.freeze([
  'MOVING_GOALPOSTS','DOUBLE_ENTRY','FAST_OR_SAFE',
  'SPONSORED_WORKFLOW','MANDATORY_COLLABORATION'
]);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const isIn=(p,box)=>p.x>=box.x-box.w/2&&p.x<=box.x+box.w/2&&p.y>=box.y-box.h/2&&p.y<=box.y+box.h/2;
const point=(x,y)=>({x,y});
const PHASES=['telegraph','jam','counter','impact','victory'];
const WIN_IMPERATIVES={telegraph:'DUCK THE PAPER!',jam:'PULL WHEN GREEN!',counter:'FLICK INTO FEEDER!',impact:'BOLT REMOVED!',victory:'PRINTER DEFEATED!'};

/** A single entry in definitions; id is not a health-bar based card. */
export const definitions=[{
  id:'B1', department:'boss', name:'PRINTER MUTINY', imperative:'PULL. FLICK. REPEAT.',
  create(context={}) {return createPrinterMutiny(context);}
}];

export function createPrinterMutiny(context={}){
  const directive=normalizeDirective(context.run?.activeDirective??context.options?.directive??'MOVING_GOALPOSTS');
  const completed=context.run?.completedCards??[];
  const knowsCable=Array.isArray(completed)?completed.includes('S4'):Boolean(completed.S4);
  const perks=context.run?.perks??{};
  const hasMira=Boolean(context.run?.miraAssist||context.run?.coffeePerfect||perks['perk:teamwork']);
  const initial=()=>({
    state:'telegraph',time:0,cycle:0,bolts:[true,true,true],removed:0,
    attempts:0,manualHits:0,failedCounters:0,completed:false,
    feederX:0,feederWidth:142,open:false,shutter:false,
    sheetHits:0,adX:105,adMoved:false,miraUsed:false,
    pointer:null,pagePull:0,packet:packetSpawn(),projectile:null,
    particles:[],waves:[],shake:0,flash:0,emotion:'defiant',
    hint:'THREE BOLTS. NO HEALTH BAR.',lastEvent:'',totalTime:0,
    relief:0,warning:0
  });
  let s=initial();
  let disposed=false;
  const emit=(type,data={})=>{
    const evt={type,bossId:'printer-mutiny',cycle:s.cycle+1,at:s.totalTime,...data};
    context.events?.emit?.(evt);
    context.audio?.play?.(type,evt);
  };
  const frame=()=>({phase:s.state,cycle:s.cycle+1,boltsRemaining:3-s.removed,removed:s.removed,attempts:s.attempts,failedCounters:s.failedCounters,directive,feederX:s.feederX,feederWidth:s.feederWidth,open:s.open,packet:s.packet&&{...s.packet},projectile:s.projectile&&{...s.projectile},manualHits:s.manualHits,completed:s.completed,knowsCable,hasMira,adMoved:s.adMoved,hint:s.hint,elapsed:s.totalTime,jamTime:s.state==='jam'?s.time:null,safePull:canPull(),shutter:s.shutter});
  function packetSpawn(){return {x:-235,y:265,w:124,h:72,held:false};}
  function worldWidth(){return context.viewport?.worldWidth||1350;}
  function respawn(){s.packet=packetSpawn(); if(worldWidth()<780) s.packet.x=-Math.min(190,worldWidth()*.24);}
  function areaForFeeder(){return {x:s.feederX,y:50,w:s.feederWidth,h:94};}
  function pageArea(){return {x:-104,y:104,w:96,h:100};}
  function cableArea(){return {x:205,y:80,w:60,h:115};}
  function canPull(){return s.state==='jam'&&s.time>=.4&&((s.time-.4)%4)<3.35;}
  function moveTo(state){s.state=state;s.time=0;s.pointer=null;s.projectile=null;if(s.packet)s.packet.held=false;s.flash=0;s.warning=0;}
  function beginCycle(){
    s.feederX=s.cycle===0?0:(s.cycle===1?100:-105);
    if(directive==='MOVING_GOALPOSTS')s.feederX+=s.cycle===0?70:s.cycle===1?-160:155;
    s.feederX=clamp(s.feederX,-135,135);
    s.feederWidth=s.cycle===0?172:136;
    s.shutter=directive==='DOUBLE_ENTRY';s.adMoved=directive!=='SPONSORED_WORKFLOW';
    s.miraUsed=false;s.adX=45;s.relief=0;s.open=false;s.emotion='smug';s.pagePull=0;
    s.hint=['THE FEEDER LOOKS HUNGRY.','IT LEARNED TO USE RAILS.','YOUR INBOX IS NOW A WEAPON.'][s.cycle];
    s.waves=Array.from({length:4+s.cycle},(_,i)=>({x:(i*170)-390,y:-130+(i%3)*50,vx:150+i*30,angle:i*.7,hit:false}));
    respawn();moveTo('telegraph');emit('printer-telegraph',{directive,boltsRemaining:3-s.removed});
  }
  function jam(){moveTo('jam');s.emotion='jammed';s.hint=knowsCable?'WAIT FOR GREEN. PULL PAGE OR CABLE.':'WAIT FOR GREEN. DRAG THE PROTRUDING PAGE DOWN.';emit('printer-jam');}
  function opening(){
    moveTo('counter');s.open=true;s.emotion='alarmed';s.hint=directive==='DOUBLE_ENTRY'?'STAMP THE VERIFICATION SEAL FIRST.':'DRAG OR FLICK YOUR PACKET INTO THE LIT FEEDER.';
    respawn();emit('printer-feeder-open',{feederX:s.feederX});
  }
  function collision(x,y){
    if(s.state!=='counter'||!s.open||s.shutter||!s.adMoved)return false;
    const half=s.feederWidth/2+14;
    if(Math.abs(x-s.feederX)<half&&Math.abs(y-50)<65){
      s.manualHits++;s.bolts[s.cycle]=false;s.removed++;
      s.projectile=null;s.packet=null;s.emotion='stunned';s.shake=.5;s.flash=.24;
      for(let i=0;i<22;i++){const ang=i*Math.PI*2/22;s.particles.push({x:s.feederX,y:40,vx:Math.cos(ang)*(150+(i%3)*80),vy:Math.sin(ang)*(130+i%5*25)-60,life:.8,r:i%4+2});}
      moveTo('impact');emit('printer-bolt-removed',{boltIndex:s.cycle,boltsRemaining:3-s.removed,manual:true});
      s.hint=['ONE DOWN.','THAT FELT EXPENSIVE.','ALL THREE BOLTS OUT.'][s.cycle];
      return true;
    }
    return false;
  }
  function miss(reason){
    if(s.state!=='counter')return;
    s.failedCounters++;s.attempts++;s.projectile=null;
    respawn();s.packet.held=false;s.hint=reason||'MISSED! TRY THE OPEN FEEDER AGAIN.';s.warning=.45;
    emit('printer-counter-miss',{reason});
  }
  function update(dt){
    if(disposed||s.completed||!Number.isFinite(dt)||dt<=0)return;
    dt=clamp(dt,0,.05);s.time+=dt;s.totalTime+=dt;s.shake=Math.max(0,s.shake-dt);s.flash=Math.max(0,s.flash-dt);
    s.warning=Math.max(0,s.warning-dt);s.relief=Math.max(0,s.relief-dt);
    s.particles=s.particles.filter(p=>p.life>0);for(const p of s.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=230*dt;p.life-=dt;}
    if(s.state==='telegraph'){
      for(const p of s.waves){if(!p.hit){p.x+=p.vx*dt;p.angle+=dt*2.8;}}
      if(s.time>=3.2)jam();
    }else if(s.state==='counter'){
      if(directive==='FAST_OR_SAFE')s.feederWidth=s.time<1.7?90:192;
      if(directive==='MANDATORY_COLLABORATION'&&!s.miraUsed&&s.time>4.5) s.hint='MIRA CAN STABILISE THE FEEDER. OR GO SOLO!';
      if(s.projectile){
        const p=s.projectile;p.prevX=p.x;p.prevY=p.y;
        p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=180*dt;
        // Segment sweep: rapid flicks cannot tunnel through the mouth.
        const q=areaForFeeder();for(let t=0;t<=1;t+=.125){const x=p.prevX+(p.x-p.prevX)*t,y=p.prevY+(p.y-p.prevY)*t;if(isIn({x,y},q)&&collision(x,y))break;}
        if(s.projectile&&(p.y>375||Math.abs(p.x)>worldWidth()*.65||s.time>12))miss('THE PACKET MISSED THE FEEDER.');
      }
      // Opportunity does not end on a miss; timed recovery offers a new counter.
      if(s.time>18){s.time=5;miss('FEEDER COUGHED! ANOTHER PACKET IS READY.');}
    }else if(s.state==='impact'&&s.time>1.4){
      s.cycle++;
      if(s.cycle>=3){s.completed=true;s.state='victory';s.emotion='surrender';s.hint='UNION NEGOTIATIONS SUCCESSFUL.';emit('boss-complete',{outcome:'win',evidence:{manualCounters:s.manualHits,threeBolts:true,misses:s.failedCounters,directive}});}
      else beginCycle();
    }
  }
  function pointerDown(e){
    if(disposed||s.completed||!Number.isFinite(e.x)||!Number.isFinite(e.y))return;
    const p=point(e.x,e.y),id=e.id??0;
    if(s.pointer) return;
    if(s.state==='telegraph'){
      const wave=s.waves.find(w=>!w.hit&&distance(p,w)<66);
      if(wave){wave.hit=true;s.sheetHits++;emit('printer-page-parry',{manual:true});s.particles.push({x:wave.x,y:wave.y,vx:0,vy:-110,life:.55,r:9});}
    }else if(s.state==='jam'){
      const page=isIn(p,pageArea())?'page':knowsCable&&isIn(p,cableArea())?'cable':null;
      if(page){s.pointer={id,type:page,start:p,last:p,origin:p,safeAtGrab:canPull()};emit('printer-grab',{object:page});}
    }else if(s.state==='counter'){
      if(s.shutter&&isIn(p,{x:s.feederX,y:-28,w:185,h:65})){
        s.shutter=false;s.hint='SEAL VERIFIED. NOW FLICK A PACKET!';emit('printer-confirm-stamp',{manual:true});return;
      }
      if(!s.adMoved&&isIn(p,{x:s.adX,y:65,w:200,h:135})){
        s.pointer={id,type:'ad',start:p,last:p,origin:{x:s.adX,y:65}};return;
      }
      if(hasMira&&!s.miraUsed&&isIn(p,{x:Math.min(260,worldWidth()*.35),y:153,w:105,h:110})){
        s.miraUsed=true;s.feederWidth+=78;s.relief=1.2;emit('printer-mira-assist',{manual:true});s.hint='MIRA HELD THE FEEDER. NICE SHOT!';return;
      }
      if(s.packet&&isIn(p,{x:s.packet.x,y:s.packet.y,w:s.packet.w+35,h:s.packet.h+35})){
        s.pointer={id,type:'packet',start:p,last:p,history:[{...p,t:s.totalTime}],origin:{x:s.packet.x,y:s.packet.y}};
        s.packet.held=true;emit('printer-packet-grab');
      }
    }
  }
  function pointerMove(e){
    if(!s.pointer||(e.id??0)!==s.pointer.id)return;
    const p=point(e.x,e.y),drag=s.pointer;s.pointer.last=p;
    if(drag.type==='page'||drag.type==='cable'){
      s.pagePull=clamp((p.y-drag.start.y)/145,0,1);
    }else if(drag.type==='packet'&&s.packet){
      s.packet.x=clamp(drag.origin.x+p.x-drag.start.x,-worldWidth()*.46,worldWidth()*.46);
      s.packet.y=clamp(drag.origin.y+p.y-drag.start.y,-270,335);
      drag.history.push({...p,t:s.totalTime});if(drag.history.length>12)drag.history.shift();
    }else if(drag.type==='ad')s.adX=clamp(drag.origin.x+p.x-drag.start.x,-worldWidth()*.42,worldWidth()*.4);
  }
  function pointerUp(e){
    if(!s.pointer||(e.id??0)!==s.pointer.id)return;
    pointerMove(e);const drag=s.pointer,p=point(e.x,e.y);s.pointer=null;
    if(drag.type==='page'||drag.type==='cable'){
      if(p.y-drag.start.y>82){if(drag.safeAtGrab){opening();emit('printer-jam-cleared',{manual:true,route:drag.type});}else{s.hint='EARLY TUG! WAIT FOR THE GREEN LIGHT.';s.emotion='cough';s.warning=.7;emit('printer-early-tug',{manual:true});}}
      else {s.hint='PULL THE PAGE DOWN TO THE MARK.';}
      s.pagePull=0;
    }else if(drag.type==='ad'){
      if(Math.abs(s.adX)>145){s.adMoved=true;s.hint='AD DISMISSED. THROW THE PACKET!';emit('printer-ad-dismiss',{manual:true});}
      else s.adX=45;
    }else if(drag.type==='packet'&&s.packet){
      s.packet.held=false;
      if(!s.adMoved){miss('MOVE THE FAKE SPONSORED CARD FIRST.');return;}
      if(s.shutter){miss('STAMP THE CONFIRMATION SEAL FIRST.');return;}
      // Direct drag into mouth counts as a physical manual placement.
      if(collision(s.packet.x,s.packet.y))return;
      const h=drag.history,t0=h[0],t1=h[h.length-1],duration=Math.max(.07,t1.t-t0.t);
      let vx=clamp((t1.x-t0.x)/duration,-1300,1300),vy=clamp((t1.y-t0.y)/duration,-1400,1400);
      // Slow drag release still gives a tactile forward toss toward target.
      if(Math.hypot(vx,vy)<130){vx=(s.feederX-s.packet.x)*1.35;vy=(50-s.packet.y)*1.6;}
      s.projectile={x:s.packet.x,y:s.packet.y,vx,vy,prevX:s.packet.x,prevY:s.packet.y};
      s.packet=null;emit('printer-packet-flick',{manual:true});
    }
  }
  function cancelPointer(){if(s.pointer?.type==='packet'&&s.packet){s.packet.held=false;respawn();}s.pointer=null;s.pagePull=0;}
  function draw(ctx,viewport){drawPrinterBoss(ctx,viewport,s,{directive,hasMira,knowsCable,canPull:canPull(),imperative:WIN_IMPERATIVES[s.state]});}
  function snapshot(){return JSON.parse(JSON.stringify(frame()));}
  function enter(){if(disposed)return; s=initial();beginCycle();}
  function dispose(){cancelPointer();disposed=true;}
  enter();
  return {enter,update,draw,pointerDown,pointerMove,pointerUp,cancelPointer,snapshot,dispose};
}
function normalizeDirective(value){const str=String(value||'MOVING_GOALPOSTS').replace(/^directive:/,'').replace(/[\s-]+/g,'_').toUpperCase();return PRINTER_DIRECTIVES.includes(str)?str:'MOVING_GOALPOSTS';}
