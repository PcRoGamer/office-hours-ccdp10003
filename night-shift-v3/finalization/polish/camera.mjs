/**
 * Adaptive camera for v3 INTAKE/SERVICES, designed for the existing 760-unit
 * fullscreen canvas. Does not mutate stage geometry or scene state.
 *
 * LEAD wiring (replace authoredSceneCamera only):
 *   import {createStageCamera} from './finalization/polish/camera.mjs';
 *   const stageCamera=createStageCamera();
 *   function authoredSceneCamera(){
 *     const s=director.snapshot();
 *     return stageCamera.frame(s.currentCardId,viewport,s.sceneState,1/60);
 *   }
 * Existing draw() and pointer() transforms MUST use this same returned camera:
 *   g.translate(cam.tx,cam.ty);g.scale(cam.scale,cam.scale)
 *   point = {(worldX-cam.tx)/cam.scale,(worldY-cam.ty)/cam.scale}
 *
 * NOTE: call frame once per animation tick, use peek() for pointer actions.
 */
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const finite=n=>Number.isFinite(n);
export function targetCamera(id,viewport,state={}){
  const w=viewport?.worldWidth,h=viewport?.worldHeight??760;
  if(!finite(w)||w<=0||!finite(h)||h<=0)throw new RangeError('Viewport must have positive finite world dimensions');
  if(!/^[IS][1-4]$/.test(id??''))return null;
  if(id[0]==='S'){
    // SERVICES already computes its own stage width from viewport.worldWidth,
    // centered on logical x=600. Scaling it again is a double-fit bug.
    return {scale:1,tx:w/2-600,ty:(h-760)/2,kind:'service-native'};
  }
  if(w>=1280)return null;
  const narrow=w<550;
  const plan={
    I1:{scale:Math.min(.62,(w-16)/970),center:676},
    I2:{scale:Math.min(.92,(w-20)/760),center:660},
    I3:{scale:Math.min(.75,(w-20)/1040),center:700},
    I4:{scale:Math.min(.96,(w-20)/730),center:625}
  }[id];
  const scale=clamp(plan.scale,.22,1);
  let center=plan.center;
  // On a phone-size I1, follow the oldest live approved form so it stays
  // touchable after crossing the fixed widescreen center. Never chase spam.
  if(id==='I1'&&narrow){
    const live=(state?.forms??[]).filter(f=>f&&f.kind==='approved'&&!f.hit&&finite(f.x));
    if(live.length){const oldest=Math.min(...live.map(f=>f.x));center=clamp(oldest+220,300,1020);}
    else center=800;
  }
  return {scale,tx:w/2-center*scale,ty:(h-720*scale)*.49,kind:'intake-'+id};
}
export function createStageCamera(){
  let camera=null,identity=null;
  function frame(id,viewport,state,dt=1/60){
    const target=targetCamera(id,viewport,state);
    const token=id+'@'+viewport.worldWidth+'x'+viewport.worldHeight;
    if(!target){camera=null;identity=token;return null;}
    if(identity!==token||!camera){identity=token;camera={...target};return {...camera};}
    // Smooth ONLY the moving I1 target; all other scene cameras are static.
    const a=id==='I1'&&viewport.worldWidth<550?clamp(dt*5,0,1):1;
    camera.tx+=(target.tx-camera.tx)*a;
    camera.ty+=(target.ty-camera.ty)*a;
    camera.scale=target.scale;
    camera.kind=target.kind;
    return {...camera};
  }
  function peek(){return camera?{...camera}:null;}
  function unproject(p){if(!camera)return {...p};return {x:(p.x-camera.tx)/camera.scale,y:(p.y-camera.ty)/camera.scale};}
  function project(p){if(!camera)return {...p};return {x:p.x*camera.scale+camera.tx,y:p.y*camera.scale+camera.ty};}
  return Object.freeze({frame,peek,project,unproject});
}
