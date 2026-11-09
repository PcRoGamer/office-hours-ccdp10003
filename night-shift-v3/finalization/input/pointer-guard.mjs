// Optional integration adapter for the assembled v3 renderer.
// Does not own the scene, HUD, director or scoring. Caller supplies camera mapping.
export function bindCampaignPointer({canvas, director, getViewport, getCamera = () => null, onPause = () => {}}) {
  if (!canvas || !director || !getViewport) throw new TypeError('Missing input dependency');
  let active = null;
  let disposed = false;
  const playing = () => ['card', 'printer', 'quota'].includes(director.mode);
  function worldPoint(e) {
    const box = canvas.getBoundingClientRect();
    const vp = getViewport();
    const p = vp.screenToWorld(e.clientX - box.left, e.clientY - box.top);
    const camera = getCamera();
    if (camera) {
      if (!(camera.scale > 0)) throw new RangeError('Invalid scene camera');
      return {x: (p.x - camera.tx) / camera.scale, y: (p.y - camera.ty) / camera.scale, id: e.pointerId, kind: e.pointerType};
    }
    return {x:p.x,y:p.y,id:e.pointerId,kind:e.pointerType};
  }
  function releaseCapture(id) {
    try { if (canvas.hasPointerCapture?.(id)) canvas.releasePointerCapture(id); } catch { /* capture may already be lost */ }
  }
  function cancelActive() {
    if (active === null) return;
    const id = active; active = null;
    if (playing()) director.pointer('cancel', {id});
    releaseCapture(id);
  }
  function down(e) {
    if (disposed || !playing() || director.paused || active !== null) return;
    e.preventDefault?.();
    active = e.pointerId;
    try { canvas.setPointerCapture?.(active); director.pointer('down',worldPoint(e)); }
    catch (error) { cancelActive(); throw error; }
  }
  function move(e) {
    if (disposed || active !== e.pointerId) return;
    if (!playing() || director.paused) { cancelActive(); return; }
    director.pointer('move',worldPoint(e));
  }
  function up(e) {
    if (disposed || active !== e.pointerId) return;
    const id = active;
    try { if (playing() && !director.paused) director.pointer('up',worldPoint(e)); }
    finally { active = null; releaseCapture(id); }
  }
  function cancel(e) {
    if (active === e.pointerId) cancelActive();
  }
  function focusLost() {
    if (disposed) return;
    cancelActive();
    if (playing() && !director.paused) { director.togglePause(true); onPause(); }
  }
  function visibilityLost() { if (typeof document !== 'undefined' && document.hidden) focusLost(); }
  const handlers = [['pointerdown',down],['pointermove',move],['pointerup',up],['pointercancel',cancel],['lostpointercapture',cancel]];
  for (const [event,handler] of handlers) canvas.addEventListener(event,handler);
  const win = typeof window === 'undefined' ? null : window;
  const doc = typeof document === 'undefined' ? null : document;
  win?.addEventListener('blur',focusLost);
  doc?.addEventListener('visibilitychange',visibilityLost);
  return Object.freeze({
    cancel:cancelActive,
    get activePointerId() {return active;},
    dispose() {
      if (disposed) return;
      cancelActive(); disposed = true;
      for (const [event,handler] of handlers) canvas.removeEventListener(event,handler);
      win?.removeEventListener('blur',focusLost);
      doc?.removeEventListener('visibilitychange',visibilityLost);
    }
  });
}
