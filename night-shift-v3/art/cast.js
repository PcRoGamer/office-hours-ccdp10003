/**
 * QUOTA PANIC: NIGHT SHIFT v3
 * Original Corporate Paper Theatre cast, native Canvas2D.
 * ART owns this file. All dimensions are WORLD units; x,y are ground anchors.
 */
export const palette=Object.freeze({
  ink:'#17363a',outline:'#10272c',paper:'#fff3d9',cream:'#f2e8d8',
  coral:'#c8503a',mint:'#49b69a',amber:'#ecc16c',blue:'#6dabc2',
  smoke:'#58716f',rose:'#e79b83',violet:'#8d80ad'
});
const C=palette;
export const states=Object.freeze({
  mira:['focused','delighted','alarmed','tired'],
  finch:['joy','aggressive-joy','panic-smile','forced-smile'],
  jules:['ready','worried','cheering','exhausted'],
  paperclip:['point','curl','straight','celebrate'],
  printer:['idle','jam','inhale','volley','surrender'],
  quota:['approved','optimised','celebrated','overheated','defeated']
});
const baseStates={mira:'focused',finch:'joy',jules:'ready',paperclip:'point',printer:'idle',quota:'approved'};
const rules={
 'coffee-caught':[['mira','delighted'],['paperclip','celebrate']],
 'coffee-spill':[['mira','alarmed'],['jules','worried']],
 'help-used':[['mira','delighted'],['paperclip','point']],
 'scam-picked':[['finch','aggressive-joy'],['mira','alarmed']],
 'staff-rescued':[['jules','cheering'],['mira','delighted']],
 'worker-tired':[['jules','exhausted']],
 'promotion':[['finch','aggressive-joy'],['mira','tired']],
 'printer-jam':[['printer','jam'],['mira','alarmed']],
 'printer-inhale':[['printer','inhale']],
 'printer-volley':[['printer','volley']],
 'printer-counter':[['printer','surrender'],['jules','cheering']],
 'quota-phase-2':[['quota','optimised'],['finch','panic-smile']],
 'quota-phase-3':[['quota','celebrated'],['finch','forced-smile']],
 'quota-hazard':[['quota','overheated'],['mira','alarmed']],
 'quota-defeated':[['quota','defeated'],['finch','panic-smile'],['jules','cheering']],
 'clock-out':[['finch','forced-smile'],['mira','delighted']]
};
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
function rect(g,x,y,w,h,r,fill,edge=C.outline,weight=5){
 g.beginPath();if(g.roundRect)g.roundRect(x,y,w,h,r);else g.rect(x,y,w,h);
 g.fillStyle=fill;g.fill();
 if(edge&&weight){g.strokeStyle=edge;g.lineWidth=weight;g.stroke();}
}
function poly(g,points,fill,edge=C.outline,weight=6){
 g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();
 g.fillStyle=fill;g.fill();if(edge&&weight){g.strokeStyle=edge;g.lineWidth=weight;g.lineJoin='round';g.stroke();}
}
function oval(g,x,y,rx,ry,fill,edge=C.outline,weight=5){
 g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=fill;g.fill();
 if(edge&&weight){g.lineWidth=weight;g.strokeStyle=edge;g.stroke();}
}
function line(g,points,color=C.outline,weight=7){
 g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));
 g.lineWidth=weight;g.strokeStyle=color;g.lineJoin='round';g.lineCap='round';g.stroke();
}
function star(g,x,y,s=1){
 g.save();g.translate(x,y);g.scale(s,s);
 poly(g,[[0,-16],[4,-5],[15,0],[4,5],[0,16],[-4,5],[-15,0],[-4,-5]],C.amber,null,0);
 g.restore();
}
function shadow(g,wide=84){oval(g,0,0,wide,13,'rgba(15,32,35,.21)',null,0);}
function eyes(g,state,t,kind='mira'){
 const yy=kind==='finch'?-193:-171, dx=kind==='finch'?23:24;
 const tense=/alarm|panic|worr|overheat/.test(state);
 const happy=/joy|delight|cheer|celebrat/.test(state);
 const tired=/tired|exhaust|forced/.test(state);
 const blink=(t%4.3)>4.17;
 for(const xx of [-dx,dx]){
  if(blink||tired)line(g,[[xx-9,yy],[xx+9,yy+2]],C.outline,5);
  else {
   oval(g,xx,yy,tense?10:8,tense?15:happy?9:12,'#fffdf4',C.outline,3);
   oval(g,xx+2,yy+2,4,5,C.outline,null,0);
   oval(g,xx+3,yy-3,2,2,'#ffffff',null,0);
  }
  if(tense)line(g,[[xx-10,yy-23],[xx+9,yy-27]],C.outline,4);
  else if(happy)line(g,[[xx-10,yy-22],[xx,yy-26],[xx+9,yy-20]],C.outline,4);
 }
}
function mouth(g,state,y=-142){
 g.beginPath();g.strokeStyle=C.outline;g.lineWidth=5;g.fillStyle=C.paper;
 if(/alarm|panic|worr|overheat|jam/.test(state)){g.ellipse(0,y+4,11,16,0,0,Math.PI*2);g.fill();g.stroke();}
 else if(/tired|exhaust|forced/.test(state)){g.moveTo(-16,y);g.quadraticCurveTo(0,y-5,16,y+2);g.stroke();}
 else if(/delight|joy|cheer|celebrat|surrender/.test(state)){
  g.moveTo(-21,y-6);g.quadraticCurveTo(0,y+25,21,y-6);g.quadraticCurveTo(0,y+30,-21,y-6);g.fill();g.stroke();
 }else{g.moveTo(-15,y);g.quadraticCurveTo(0,y+10,15,y);g.stroke();}
}
function mira(g,s,t,action,move){
 shadow(g);g.translate(0,move?Math.sin(t*3.2)*3:0);
 line(g,[[-32,-73],[-42,-8]],C.outline,17);line(g,[[31,-73],[41,-8]],C.outline,17);
 oval(g,-44,-7,24,9,C.ink);oval(g,43,-7,24,9,C.ink);
 poly(g,[[-61,-160],[37,-165],[68,-70],[-60,-70]],C.mint);
 poly(g,[[-53,-151],[-7,-144],[-14,-75],[-52,-74]],'#72d5b0',null,0);
 poly(g,[[-17,-154],[10,-154],[15,-79],[-15,-78]],C.paper,C.outline,2);
 line(g,[[-60,-140],[-87,-124],action==='catch'?[-111,-210]:[-93,-88]],C.ink,20);
 line(g,[[54,-141],[84,-114],action==='point'?[115,-188]:[97,-84]],C.ink,20);
 oval(g,action==='catch'?-111:-93,action==='catch'?-210:-88,14,13,C.paper);
 oval(g,action==='point'?115:97,action==='point'?-188:-84,14,13,C.paper);
 // Angular hair mass + soft face, with asymmetrical bob instead of stock avatar.
 poly(g,[[-66,-195],[-59,-245],[-19,-269],[36,-257],[66,-230],[59,-171],[43,-132],[-55,-133]],C.ink);
 oval(g,0,-189,55,62,C.paper,C.outline,7);
 poly(g,[[-58,-204],[-53,-244],[-23,-264],[37,-256],[52,-227],[14,-240],[-27,-215]],C.ink,null,0);
 poly(g,[[49,-195],[65,-173],[49,-144],[34,-163]],C.ink,null,0);
 eyes(g,s,t);oval(g,-38,-149,10,4,C.rose,null,0);oval(g,38,-149,10,4,C.rose,null,0);mouth(g,s);
 if(s==='delighted'){star(g,76,-218,.8);star(g,-85,-224,.65);}
 if(s==='alarmed'){line(g,[[-79,-265],[-69,-281]],C.coral,6);line(g,[[75,-262],[84,-281]],C.coral,6);}
 if(s==='tired')line(g,[[-25,-123],[6,-119]],C.smoke,4);
 if(action==='catch')rect(g,-142,-234,56,16,6,C.amber);
}
function finch(g,s,t,action,move){
 shadow(g,68);g.translate(0,move?Math.sin(t*3.5)*3:0);
 line(g,[[-24,-82],[-28,-7]],C.outline,16);line(g,[[27,-82],[32,-7]],C.outline,16);
 oval(g,-31,-6,20,8,C.ink);oval(g,34,-6,20,8,C.ink);
 poly(g,[[-54,-178],[-22,-194],[22,-194],[57,-165],[39,-79],[-39,-79]],C.coral);
 poly(g,[[-13,-187],[0,-121],[13,-187]],C.paper,C.outline,2);
 poly(g,[[0,-170],[13,-156],[4,-116],[-9,-156]],C.amber,C.outline,3);
 line(g,[[-55,-160],[-85,-132],action==='applaud'?[-32,-125]:[-81,-77]],C.outline,14);
 line(g,[[54,-159],[88,-139],action==='applaud'?[38,-127]:[106,-89]],C.outline,14);
 oval(g,action==='applaud'?-32:-81,action==='applaud'?-125:-77,12,11,C.paper);
 oval(g,action==='applaud'?38:106,action==='applaud'?-127:-89,12,11,C.paper);
 rect(g,-19,-221,40,42,8,C.paper);
 poly(g,[[-51,-263],[-39,-300],[24,-313],[55,-275],[44,-211],[-35,-210]],C.paper);
 poly(g,[[-53,-262],[-33,-302],[7,-327],[18,-307],[52,-289],[43,-269],[9,-284],[-28,-278]],C.ink);
 oval(g,38,-248,10,13,C.paper);
 // Nose / signature raised brows distinguish him from Mira even at half size.
 line(g,[[-39,-223],[-9,-232]],C.outline,6);
 line(g,[[10,-228],[37,-220]],C.outline,6);
 eyes(g,s,t,'finch');
 g.save();g.translate(0,-8);mouth(g,s,-151);g.restore();
 if(s==='panic-smile'){oval(g,59,-213,6,13,C.blue,null,0);line(g,[[59,-225],[68,-239]],C.blue,3);}
 if(s==='aggressive-joy'){star(g,78,-294,.75);}
 if(s==='forced-smile')line(g,[[-27,-132],[-9,-127]],C.ink,4);
}
function jules(g,s,t,action,move){
 shadow(g,86);g.translate(0,move?Math.sin(t*2.4)*3:0);
 line(g,[[-40,-75],[-41,-6]],C.outline,18);line(g,[[40,-75],[42,-6]],C.outline,18);
 oval(g,-45,-6,25,10,C.ink);oval(g,44,-6,25,10,C.ink);
 poly(g,[[-76,-160],[-43,-169],[45,-168],[79,-153],[62,-72],[-63,-72]],C.violet);
 rect(g,-53,-149,106,61,12,'#ad9ec9',null,0);
 line(g,[[-69,-144],[-97,-104],[-91,-78]],C.outline,20);
 line(g,[[67,-140],[92,-95],action==='cheer'?[94,-193]:[86,-72]],C.outline,20);
 oval(g,-91,-78,14,12,C.paper);
 oval(g,action==='cheer'?94:86,action==='cheer'?-193:-72,14,12,C.paper);
 oval(g,0,-197,60,60,C.paper,C.outline,7);
 poly(g,[[-64,-211],[-55,-248],[-21,-265],[28,-264],[58,-243],[63,-204],[35,-228],[0,-226],[-26,-227]],C.ink);
 rect(g,-57,-195,114,10,4,C.ink,null,0);
 eyes(g,s,t);mouth(g,s);
 if(s==='cheering'){star(g,-92,-238,.7);star(g,90,-260,.8);}
 if(s==='worried')line(g,[[-20,-195],[-7,-203]],C.outline,5);
 if(s==='exhausted')rect(g,51,-144,25,6,3,C.rose,null,0);
}
function paperclip(g,s,t,action,move){
 shadow(g,45);g.translate(0,move?Math.sin(t*5)*8:0);
 const curl=s==='curl'?1:s==='straight'?0.1:0.45;
 const pts=[[-15,-22],[-40,-53],[-36,-121],[-15,-181],[25,-207],[48,-178],[47,-65],[27,-43],[4,-55],[0,-82],[8,-145],[27,-160]];
 const v=pts.map(([x,y],i)=>[x*(1-curl*.18)+Math.sin(i*.7+t*2)*curl*8,y]);
 line(g,v,C.outline,24);line(g,v,'#c3e5db',14);
 oval(g,-8,-121,11,13,C.paper);oval(g,27,-121,11,13,C.paper);
 oval(g,-4,-118,4,6,C.ink,null,0);oval(g,30,-118,4,6,C.ink,null,0);
 line(g,[[2,-90],[15,-87],[25,-94]],C.outline,4);
 if(s==='point'||action==='point')line(g,[[36,-74],[74,-110],[105,-109]],C.ink,9);
 if(s==='celebrate'){star(g,-58,-165,.8);star(g,76,-211,.7);}
}
function bolt(g,x,y,off=false){
 oval(g,x,y,19,19,off?C.smoke:C.amber,C.outline,6);
 line(g,[[x-10,y],[x+10,y]],C.outline,5);line(g,[[x,y-10],[x,y+10]],C.outline,5);
}
function printer(g,s,t,action,move){
 shadow(g,128);g.translate(s==='volley'&&move?Math.sin(t*23)*10:0,0);
 line(g,[[-90,-60],[-93,-8]],C.outline,19);line(g,[[90,-60],[94,-8]],C.outline,19);
 oval(g,-96,-6,27,11,C.ink);oval(g,96,-6,27,11,C.ink);
 rect(g,-125,-221,250,164,22,C.ink,C.outline,8);
 rect(g,-114,-210,228,145,17,'#719899',C.outline,4);
 rect(g,-85,-253,170,72,9,C.paper,C.outline,7);
 rect(g,-67,-269,134,50,6,C.paper,C.outline,5);
 line(g,[[-44,-252],[42,-252]],C.smoke,3);
 rect(g,-88,-179,177,79,12,C.cream,C.outline,7);
 const gap=s==='inhale'?40:s==='jam'?9:s==='volley'?56:27;
 rect(g,-70,-140,140,gap,7,C.ink,C.outline,3);
 rect(g,-62,-137,124,Math.max(5,gap-9),4,'#2b5457',null,0);
 if(s==='jam'){poly(g,[[-7,-136],[23,-117],[17,-67],[-28,-88]],C.paper);line(g,[[-7,-100],[9,-88]],C.coral,5);}
 if(s==='volley')for(let i=0;i<3;i++)poly(g,[[15+i*27,-130-i*14],[60+i*30,-140-i*26],[67+i*29,-102-i*22]],C.paper,C.outline,3);
 if(s==='surrender'){rect(g,-83,-249,166,47,3,C.paper);line(g,[[-48,-226],[0,-213],[48,-226]],C.outline,5);}
 else {rect(g,-74,-189,148,30,8,C.paper,C.outline,5);for(let x of [-33,33])rect(g,x-13,-178,26,7,4,C.ink,null,0);}
 bolt(g,-99,-190);bolt(g,99,-190);
 rect(g,-126,-88,252,33,8,C.coral,C.outline,4);
 for(let x=-101;x<115;x+=42)line(g,[[x,-71],[x+21,-71]],C.paper,3);
 if(s==='jam')star(g,127,-252,.8);
}
function quota(g,s,t,action,move,extra={}){
 shadow(g,164);
 const hot=s==='overheated',dead=s==='defeated';
 g.translate(0,hot&&move?Math.sin(t*21)*4:move?Math.sin(t*2)*3:0);
 poly(g,[[-149,-240],[-127,-301],[-35,-270],[-18,-222]],C.blue);
 poly(g,[[26,-223],[68,-285],[157,-282],[155,-222]],C.coral);
 rect(g,-172,-243,344,182,20,C.ink,C.outline,8);
 rect(g,-160,-233,321,156,16,hot?'#d37763':dead?'#9baaa3':'#83b3a5',C.outline,5);
 rect(g,-138,-265,275,96,11,C.paper,C.outline,7);
 for(const x of [-68,67]){
  if(dead){line(g,[[x-17,-225],[x+17,-203]],C.outline,7);line(g,[[x+17,-225],[x-17,-203]],C.outline,7);}
  else if(s==='celebrated')line(g,[[x-17,-204],[x,-228],[x+17,-204]],C.outline,7);
  else rect(g,x-18,-225,36,13,4,C.ink,null,0);
 }
 g.beginPath();g.strokeStyle=C.outline;g.lineWidth=9;g.moveTo(-64,-186);
 g.quadraticCurveTo(0,dead?-218:-131,64,-186);g.stroke();
 rect(g,-113,-153,225,62,8,C.ink,null,0);
 rect(g,-95,-143,190,43,6,dead?C.smoke:hot?C.coral:C.amber,null,0);
 const bolts=clamp(Number.isFinite(extra.bolts)?extra.bolts:3,0,3);
 [-103,0,103].forEach((x,i)=>bolt(g,x,-83,i>=bolts));
 line(g,[[-125,-62],[-140,-5]],C.outline,24);line(g,[[124,-62],[139,-5]],C.outline,24);
 oval(g,-143,-4,34,12,C.ink);oval(g,141,-4,34,12,C.ink);
 g.save();g.translate(-144,-239);g.rotate(move?Math.sin(t*2)*.06:0);
 rect(g,-17,-103,34,97,7,C.amber,C.outline,6);
 rect(g,-61,-127,123,37,8,C.coral,C.outline,6);g.restore();
 for(let x=-145;x<150;x+=49)rect(g,x-11,-75,23,10,3,C.paper,null,0);
 if(hot){star(g,157,-313,.7);star(g,-172,-270,.65);}
 if(s==='celebrated'){star(g,-164,-344,.8);star(g,164,-351,.7);}
 if(dead){poly(g,[[23,-260],[52,-300],[67,-244]],C.paper);line(g,[[52,-299],[55,-266]],C.coral,5);}
}
const painters={mira,finch,jules,paperclip,printer,quota};
/** Height controls sprite scale. No stretching, no global transforms retained. */
export function drawCharacter(ctx,kind,{x=0,y=0,height=280,state=baseStates[kind],time=0,action='',flip=false,reducedMotion=false,bolts=3,opacity=1}={}){
 if(!ctx||!painters[kind])return false;
 const s=states[kind].includes(state)?state:baseStates[kind];
 const natural={mira:280,finch:330,jules:280,paperclip:220,printer:280,quota:360}[kind];
 const scale=clamp(height,1,2000)/natural;
 ctx.save();ctx.globalAlpha*=clamp(opacity,0,1);ctx.translate(x,y);ctx.scale(scale*(flip?-1:1),scale);
 ctx.lineJoin='round';ctx.lineCap='round';painters[kind](ctx,s,time,action,!reducedMotion,{bolts});ctx.restore();
 return true;
}
/** Deterministic animation state director. Caller supplies dt, never uses timers. */
export function createCastDirector({reducedMotion=false,reactionTime=1.65}={}){
 let clock=0;
 let actors=Object.fromEntries(Object.entries(baseStates).map(([name,base])=>[name,{base,state:base,action:'',remaining:0,bolts:3}]));
 const api={
  update(dt=0){const step=clamp(Number.isFinite(dt)?dt:0,0,.1);clock+=step;
    for(const a of Object.values(actors)){if(a.remaining>0){a.remaining=Math.max(0,a.remaining-step);if(a.remaining===0){a.state=a.base;a.action='';}}}},
  set(name,state,{duration=reactionTime,action='',persist=false}={}){
    const a=actors[name];if(!a||!states[name].includes(state))return false;
    a.state=state;a.action=action;a.remaining=persist?0:Math.max(.01,duration);
    if(persist)a.base=state;return true;
  },
  react(event,detail={}){
    const reacts=rules[event]||[];
    for(const [name,state] of reacts)api.set(name,state,{duration:detail.duration??reactionTime,
      action:name==='mira'&&event==='coffee-caught'?'catch':name==='finch'&&event==='promotion'?'applaud':''});
    if(event==='quota-bolt-removed'){
      actors.quota.bolts=clamp(actors.quota.bolts-1,0,3);
      api.set('quota',actors.quota.bolts?'optimised':'defeated',{duration:2});
    }
    if(event==='quota-reset')actors.quota.bolts=3;
    return reacts.length+(event==='quota-bolt-removed'?1:0);
  },
  draw(ctx,name,placement={}){const a=actors[name];return a?drawCharacter(ctx,name,{...placement,state:a.state,action:a.action,time:clock,reducedMotion,bolts:a.bolts}):false;},
  reset(){clock=0;actors=Object.fromEntries(Object.entries(baseStates).map(([name,base])=>[name,{base,state:base,action:'',remaining:0,bolts:3}]));},
  setReducedMotion(v){reducedMotion=!!v;},
  snapshot(){return {time:Number(clock.toFixed(3)),reducedMotion,actors:JSON.parse(JSON.stringify(actors))};},
  dispose(){api.reset();}
 };
 return api;
}