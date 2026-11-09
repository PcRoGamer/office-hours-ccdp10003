/**
 * QUOTA PANIC v3: isolated, browser-native Planck 1.5.1 adapter.
 * All coordinates are world DESIGN PIXELS, not physical screen pixels.
 * An injected Planck instance keeps Node/preview tests deterministic.
 * The PHYSICS lane never resolves game scores: it only emits physical facts.
 */
export const PIXELS_PER_METRE = 60;
export const FIXED_STEP = 1 / 60;
const isNum = Number.isFinite;
const finite = (v, fallback = 0) => isNum(v) ? v : fallback;
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

export function createPhysics({planck = globalThis.planck, gravity = {x: 0, y: 900},
  onEvent = () => {}, fixedStep = FIXED_STEP, maxSubsteps = 6} = {}) {
  if (!planck?.World || !planck?.Vec2 || !planck?.MouseJoint) {
    throw new Error('Night Shift physics requires vendored Planck.js 1.5.1. Load it before this module.');
  }
  const P = planck, S = PIXELS_PER_METRE;
  const vec = (x, y) => P.Vec2(finite(x)/S, finite(y)/S);
  const world = new P.World(vec(gravity.x, gravity.y));
  const anchor = world.createBody();
  const objects = new Map();
  const contacts = new Set();
  const eventQueue = [];
  let sequence = 0, accumulator = 0, ticks = 0, pointer = null, disposed = false;
  const identity = b => b?.getUserData?.()?.id;
  const key = (a,b) => [a,b].sort().join('\u0000');
  const publish = (type, a, b, contact) => {
    if (!a || !b) return;
    const pa = a.body.getLinearVelocity(), pb = b.body.getLinearVelocity();
    const speed = Math.hypot((pa.x-pb.x)*S, (pa.y-pb.y)*S);
    eventQueue.push({type, a:a.id, b:b.id, speed:Math.round(speed), tick:ticks,
      sensor:!!(contact.getFixtureA().isSensor() || contact.getFixtureB().isSensor())});
  };
  world.on('begin-contact', c => {
    const a = c.getFixtureA().getBody().getUserData(), b = c.getFixtureB().getBody().getUserData();
    if (!a || !b) return;
    const k = key(a.id,b.id);
    if (!contacts.has(k)) {contacts.add(k);publish('contact-begin',a,b,c);}
  });
  world.on('end-contact', c => {
    const a = c.getFixtureA().getBody().getUserData(), b = c.getFixtureB().getBody().getUserData();
    if (!a || !b) return;
    const k = key(a.id,b.id);
    if (contacts.delete(k)) publish('contact-end',a,b,c);
  });
  function ensure() {if (disposed) throw new Error('Disposed physics world');}
  function create(o) {
    ensure();
    // Require canonical string IDs: numeric 7 and string '7' must not collide silently.
    if (typeof o?.id !== 'string' || !o.id.trim() || objects.has(o.id))
      throw new Error(`Unique nonempty string body id required: ${o?.id}`);
    if (!['box','circle'].includes(o.shape || 'box')) throw new Error('Shape must be box or circle');
    const type = o.type || (o.dynamic ? 'dynamic' : 'static');
    if (!['dynamic','static','kinematic'].includes(type)) throw new Error('Unknown Planck body type');
    const body = world.createBody({type, position:vec(o.x,o.y), angle:finite(o.angle),
      linearDamping:finite(o.linearDamping,0.28), angularDamping:finite(o.angularDamping,0.6),
      bullet:!!o.bullet, fixedRotation:!!o.fixedRotation, allowSleep:o.allowSleep !== false});
    const shape = o.shape==='circle' ? P.Circle(Math.max(1,finite(o.radius,16))/S)
      : P.Box(Math.max(1,finite(o.width,40))/2/S,Math.max(1,finite(o.height,40))/2/S);
    body.createFixture(shape,{density:clamp(finite(o.density,1),0.01,100),
      friction:clamp(finite(o.friction,0.55),0,2), restitution:clamp(finite(o.restitution,0.25),0,1.5),
      isSensor:!!o.sensor});
    const item = {id:String(o.id),shape:o.shape||'box',width:o.width||0,height:o.height||0,
      radius:o.radius||0,kind:o.kind||'prop',data:o.data||null,body,dynamic:type==='dynamic',sensor:!!o.sensor};
    body.setUserData(item);
    objects.set(item.id,item);
    return item;
  }
  function state(item) {
    if (typeof item === 'string') item=objects.get(item);
    if (!item) return null;
    const p=item.body.getPosition(),v=item.body.getLinearVelocity();
    return {id:item.id,kind:item.kind,x:p.x*S,y:p.y*S,vx:v.x*S,vy:v.y*S,
      angle:item.body.getAngle(),spin:item.body.getAngularVelocity(),awake:item.body.isAwake()};
  }
  // Reposition a live prop or fixture without reconstructing the whole world.
  // Intended for camera reflow and staged layout changes, outside world.step().
  function setTransform(item,x,y,angle) {
    ensure();
    if(typeof item==='string')item=objects.get(item);
    if(!item || objects.get(item.id)!==item)return false;
    if(!isNum(x)||!isNum(y)||(angle!==undefined&&!isNum(angle)))return false;
    item.body.setTransform(vec(x,y),angle===undefined?item.body.getAngle():angle);
    item.body.setAwake(true);
    return true;
  }
  function setVelocity(item,vx,vy,spin) {
    if(typeof item==='string')item=objects.get(item);
    if(!item)return false;
    item.body.setLinearVelocity(vec(vx,vy));
    if (isNum(spin)) item.body.setAngularVelocity(spin);
    item.body.setAwake(true);return true;
  }
  function impulse(item,ix,iy) {
    if(typeof item==='string')item=objects.get(item);
    if(!item?.dynamic)return false;
    item.body.applyLinearImpulse(vec(ix,iy),item.body.getWorldCenter(),true);return true;
  }
  function at(x,y,filter=()=>true) {
    const p=vec(x,y);
    for(const it of Array.from(objects.values()).reverse()){
      if(!it.dynamic||!filter(it))continue;
      for(let f=it.body.getFixtureList();f;f=f.getNext())if(!f.isSensor()&&f.testPoint(p))return it;
    }
    return null;
  }
  function grab(x,y,{id=null,filter=()=>true,force=2600}={}) {
    ensure(); release();
    const it=id?objects.get(id):at(x,y,filter);
    if (!it?.dynamic||!filter(it)) return null;
    const p=vec(x,y);
    const joint=world.createJoint(P.MouseJoint({maxForce:Math.max(500,force*it.body.getMass()),
      frequencyHz:12,dampingRatio:0.92},anchor,it.body,p));
    it.body.setAwake(true);
    pointer={id:it.id,joint,samples:[{x,y,t:0}],time:0};
    return it;
  }
  function move(x,y,dt=FIXED_STEP) {
    if (!pointer)return;
    x=finite(x);y=finite(y);dt=clamp(finite(dt,FIXED_STEP),0.001,0.15);
    pointer.time+=dt;
    pointer.joint.setTarget(vec(x,y));
    pointer.samples.push({x,y,t:pointer.time});
    if(pointer.samples.length>8)pointer.samples.shift();
  }
  function release({flick=true, multiplier=1}={}) {
    if (!pointer)return null;
    const grabbed=objects.get(pointer.id),samples=pointer.samples;
    world.destroyJoint(pointer.joint);pointer=null;
    // Flick is intentional velocity on release, not a fake motion tween.
    if (flick&&grabbed&&samples.length>1) {
      const last=samples[samples.length-1];let first=samples[0];
      for(let i=samples.length-2;i>=0;i--){first=samples[i];if(last.t-first.t>=0.055)break;}
      const dt=Math.max(0.015,last.t-first.t), m=clamp(finite(multiplier,1),0,2.5);
      const vx=clamp((last.x-first.x)/dt*m,-1650,1650);
      const vy=clamp((last.y-first.y)/dt*m,-1650,1650);
      const old=grabbed.body.getLinearVelocity();
      grabbed.body.setLinearVelocity(vec(old.x*S*0.15+vx*0.85,old.y*S*0.15+vy*0.85));
      grabbed.body.setAwake(true);
    }
    return grabbed;
  }
  function remove(item) {
    if(typeof item==='string')item=objects.get(item);
    if(!item)return false;
    if(pointer?.id===item.id)release({flick:false});
    objects.delete(item.id);
    for(const k of contacts)if(k.split('\u0000').includes(item.id))contacts.delete(k);
    world.destroyBody(item.body);
    return true;
  }
  function step(dt,{paused=false}={}) {
    ensure();if (paused)return 0;
    accumulator=Math.min(accumulator+clamp(finite(dt),0,0.10),fixedStep*maxSubsteps);
    let count=0;
    while(accumulator>=fixedStep-1e-10&&count<maxSubsteps){
      world.step(fixedStep,8,3);accumulator-=fixedStep;ticks++;count++;
    }
    // The consumer may remove a fixture while processing an earlier callback.
    // Never publish stale collisions against an already-destroyed body.
    while(eventQueue.length){
      const evt=eventQueue.shift();
      if(objects.has(evt.a)&&objects.has(evt.b))onEvent(evt);
    }
    return count;
  }
  function snapshot(){return {tick:ticks,activeDrag:pointer?.id||null,
    bodies:Array.from(objects.values()).map(state),pendingContacts:contacts.size};}
  function dispose(){if(disposed)return;release({flick:false});
    for(const it of Array.from(objects.values()))remove(it);
    objects.clear();contacts.clear();eventQueue.length=0;disposed=true;}
  return {world,create,box:o=>create({...o,shape:'box'}),circle:o=>create({...o,shape:'circle'}),
    objects,at,state,setTransform,setVelocity,impulse,grab,move,release,remove,step,snapshot,dispose,
    get dragging(){return pointer?.id||null;},get tick(){return ticks;}};
}

/** Optional SceneContext bridge, intentionally feature-detecting other lanes. */
export function create(context={}) {
  const events=context.events;
  return createPhysics({planck:context.planck || globalThis.planck,
    gravity:context.gravity||{x:0,y:900},
    onEvent:e=>events?.emit?.({type:'physics',...e})});
}