/** Single world-space pointer pipeline. Hit tests and draw use the same camera. */
export function createInput({canvas,viewport,onPointerDown=()=>{},onPointerMove=()=>{},onPointerUp=()=>{},onPointerCancel=()=>{}}={}) {
 if(!canvas||!viewport)throw new TypeError('canvas and viewport required');
 const active=new Map();let dead=false;
 const normalize=e=>{const b=canvas.getBoundingClientRect(),sx=e.clientX-b.left,sy=e.clientY-b.top,p=viewport.screenToWorld(sx,sy);
  return{x:p.x,y:p.y,screenX:sx,screenY:sy,id:e.pointerId,kind:e.pointerType||'mouse',buttons:e.buttons,pressure:e.pressure,isPrimary:e.isPrimary,originalEvent:e};};
 function down(e){if(dead||active.has(e.pointerId))return;e.preventDefault();const p=normalize(e);active.set(e.pointerId,p);try{canvas.setPointerCapture(e.pointerId);}catch{}onPointerDown(p);}
 function move(e){if(dead)return;const p=normalize(e);if(active.has(e.pointerId)){e.preventDefault();active.set(e.pointerId,p);}onPointerMove(p);}
 function up(e){if(dead||!active.has(e.pointerId))return;e.preventDefault();const p=normalize(e);active.delete(e.pointerId);onPointerUp(p);
  try{if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);}catch{}}
 function cancelId(id,reason='cancel',originalEvent=null){const p=active.get(id);if(!p)return;active.delete(id);onPointerCancel({...p,reason,originalEvent});}
 const cancel=e=>cancelId(e.pointerId,e.type,e),lost=e=>cancelId(e.pointerId,'lostcapture',e);
 const cancelAll=(reason='blur')=>{for(const id of [...active.keys()])cancelId(id,reason);};
 const visibility=()=>{if(document.hidden)cancelAll('hidden');};
 const handlers=[['pointerdown',down],['pointermove',move],['pointerup',up],['pointercancel',cancel],['lostpointercapture',lost]];
 for(const [type,fn] of handlers)canvas.addEventListener(type,fn);
 window.addEventListener('blur',cancelAll);document.addEventListener('visibilitychange',visibility);
 return{active,eventToWorld:normalize,cancelAll,destroy(){if(dead)return;cancelAll('destroy');dead=true;for(const [type,fn] of handlers)canvas.removeEventListener(type,fn);
  window.removeEventListener('blur',cancelAll);document.removeEventListener('visibilitychange',visibility);}};
}