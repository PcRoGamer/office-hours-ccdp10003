/**
 * QUOTA PANIC: NIGHT SHIFT v3 optional assistive control layer.
 * No ledger mutation and no synthetic wins: every keyboard operation delegates
 * to the active scene's existing pointerDown/Move/Up or cancelPointer path.
 * This module owns no global HUD layout, physics or scene rules.
 *
 * Integration:
 * const assist = createAssistiveControls({
 *   root: document.body, getTargets: () => scene.assistiveTargets?.() ?? [],
 *   getViewport: () => context.viewport,
 *   dispatch: ({phase, x, y, id, kind}) => scene[phase]?.({x,y,id,kind}),
 *   onPause: (paused) => director.setAccessibilityPause(paused),
 *   onSettingsChange: (settings) => director.setAccessibilityPreferences(settings),
 * });
 * assist.refresh(); // after scene/viewport changes; dispose() on teardown.
 *
 * getTargets returns [{id,label,x,y,kind:'tap'|'drag'|'hold', disabled}]
 * World coordinates are used directly, not inferred from a fixed 1200x760 box.
 */
export const PREF_KEY = 'quota-panic-nightshift-v3:a11y:v1';
export const DEFAULT_PREFS = Object.freeze({
  reducedMotion: false,
  highContrast: false,
  largeTargets: false,
  keyboardControls: false,
  switchStep: false,
  preferPractice: false,
});
const VALID_KINDS = new Set(['tap','drag','hold']);
const CSS = `
.qp-a11y-portal{position:fixed;inset:0;z-index:45;pointer-events:none;font-family:Arial,'Segoe UI',sans-serif;color:#eafff4}
.qp-a11y-portal *{box-sizing:border-box}
.qp-a11y-launch{position:absolute;bottom:max(12px,env(safe-area-inset-bottom));right:max(12px,env(safe-area-inset-right));pointer-events:auto;border:2px solid #dfc383;background:#123d42eF;color:#fff5d9;font-size:13px;font-weight:900;letter-spacing:.045em;border-radius:999px;padding:12px 18px;min-height:48px;min-width:48px;box-shadow:0 8px 24px #0009;cursor:pointer}
.qp-a11y-portal button:focus-visible,.qp-a11y-portal input:focus-visible{outline:3px solid #ffdc7c;outline-offset:3px}
.qp-a11y-panel{position:absolute;right:max(12px,env(safe-area-inset-right));bottom:max(75px,calc(66px + env(safe-area-inset-bottom)));width:min(370px,calc(100vw - 24px));max-height:min(82dvh,670px);overflow:auto;pointer-events:auto;background:#11353c;border:2px solid #8ad2bb;box-shadow:0 18px 60px #000b;border-radius:17px;padding:18px;color:#f5f2e8}
.qp-a11y-panel[hidden],.qp-a11y-dock[hidden],.qp-a11y-focus[hidden]{display:none!important}
.qp-a11y-head{font-size:22px;letter-spacing:-.04em;font-weight:1000;margin:0 0 7px}
.qp-a11y-intro{font-size:13px;line-height:1.4;color:#c3d8cf;margin:0 0 13px}
.qp-a11y-toggle{display:flex;align-items:center;gap:11px;min-height:45px;cursor:pointer;border-top:1px solid #ffffff2c;padding:7px 0;font-size:14px;font-weight:700}
.qp-a11y-toggle input{accent-color:#ffc665;width:20px;height:20px;flex:none}
.qp-a11y-hint{border-top:1px solid #ffffff33;margin-top:9px;padding-top:12px;font-size:12px;color:#d2d9d0;line-height:1.55}
.qp-a11y-close{border:0;border-radius:9px;background:#e5b65b;color:#18393a;font-weight:900;padding:12px 16px;cursor:pointer;min-height:44px;width:100%;margin-top:14px}
.qp-a11y-dock{position:absolute;left:max(12px,env(safe-area-inset-left));bottom:max(12px,env(safe-area-inset-bottom));display:flex;align-items:center;gap:5px;max-width:min(74vw,900px);overflow-x:auto;pointer-events:auto;scrollbar-width:thin;background:#132f34ed;padding:7px;border:1px solid #7bb7a5;border-radius:11px}
.qp-a11y-dock button{background:#274e52;color:#f8e5ba;border:1px solid #618b81;padding:9px 11px;min-height:44px;min-width:48px;border-radius:8px;white-space:nowrap;cursor:pointer;font-size:13px;font-weight:800}
.qp-a11y-dock button[aria-current=true]{background:#e5b65b;color:#153336;border-color:white}
.qp-a11y-dock .qp-a11y-switch{background:#4b3560;color:#fff}
.qp-a11y-focus{position:absolute;width:58px;height:58px;border:4px dashed #f9d36a;border-radius:50%;transform:translate(-50%,-50%);box-shadow:0 0 0 3px #173e47,0 0 0 7px #fff7;pointer-events:none;animation:qp-a11y-pulse 1.4s ease-in-out infinite}
.qp-a11y-focus:after{content:'';position:absolute;inset:11px;border:2px solid #f9d36a;border-radius:50%}
.qp-a11y-alert{position:absolute;left:50%;bottom:90px;transform:translateX(-50%);max-width:min(90vw,500px);text-align:center;font-weight:900;background:#183b43;padding:8px 14px;border-radius:7px;pointer-events:none;opacity:0;transition:opacity .15s}
.qp-a11y-alert[data-visible=true]{opacity:1}
.qp-a11y-portal.qp-contrast .qp-a11y-focus{border-color:#fff;background:repeating-linear-gradient(45deg,transparent,transparent 6px,#0008 6px,#0008 12px);box-shadow:0 0 0 5px #000,0 0 0 9px #fff;animation:none}
.qp-a11y-portal.qp-reduced *{animation:none!important;transition:none!important} @media(prefers-reduced-motion:reduce){.qp-a11y-portal *{animation:none!important;transition:none!important}}
@keyframes qp-a11y-pulse{50%{box-shadow:0 0 0 3px #173e47,0 0 0 13px #ffdd7640}}
@media(max-width:700px){.qp-a11y-dock{left:10px;bottom:69px;max-width:calc(100vw - 20px);padding:5px}.qp-a11y-launch{font-size:11px;padding:10px 13px}.qp-a11y-panel{bottom:69px;max-height:70dvh}}
`;

export function normalizePreferences(candidate = {}) {
  const v = candidate && typeof candidate === 'object' ? candidate : {};
  return Object.fromEntries(Object.keys(DEFAULT_PREFS).map(k => [k, v[k] === true]));
}

/** Prefer the host's hit test; expand only when explicitly opted in, without
 * guessing which of two equally near targets a player intended. */
export function assistedHitPoint(point, targets, {enabled = false, radius = 16} = {}) {
  if (!enabled || !point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return point;
  const matches = (targets || []).filter(t => !t.disabled && Number.isFinite(t.x) && Number.isFinite(t.y))
    .map(t => ({t,dist:Math.hypot(t.x-point.x,t.y-point.y)}))
    .filter(({t,dist}) => dist <= Math.max(0,Math.min(80,radius)) + Math.max(0,Math.min(160,t.radius || 0)))
    .sort((a,b) => a.dist-b.dist);
  if (!matches.length || (matches.length > 1 && Math.abs(matches[1].dist - matches[0].dist) < 12)) return point;
  return {x:matches[0].t.x, y:matches[0].t.y};
}

export function createAssistiveControls({
  root = document.body,
  getTargets = () => [],
  getViewport,
  dispatch,
  onPause = () => {},
  onSettingsChange = () => {},
  storage = null,
  keyTarget = window,
} = {}) {
  if (!root || typeof getViewport !== 'function' || typeof dispatch !== 'function') {
    throw new TypeError('assistive controls require root, getViewport and dispatch');
  }
  if (!storage) { try { storage = window.localStorage; } catch { storage = null; } }
  let settings = {...DEFAULT_PREFS};
  try { settings = normalizePreferences(JSON.parse(storage?.getItem(PREF_KEY) || '{}')); } catch { /* blocked storage */ }
  let open = false, selectedId = null, held = null, gone = false, announcement = '';
  const pointerId = -7021;
  const style = document.createElement('style');
  style.setAttribute('data-qp-a11y-style', '');
  style.textContent = CSS.replace('.qp-a11y-portal.qp-reduced *{animation:none!important;transition:none!important} @media(prefers-reduced-motion:reduce){.qp-a11y-portal *{animation:none!important;transition:none!important}}', '.qp-a11y-portal.qp-reduced *{animation:none!important;transition:none!important} @media (prefers-reduced-motion:reduce){.qp-a11y-portal *{animation:none!important;transition:none!important}}');
  root.appendChild(style);
  const portal = document.createElement('div');
  portal.className = 'qp-a11y-portal';
  portal.innerHTML = `<button class="qp-a11y-launch" aria-haspopup="dialog" aria-expanded="false" aria-controls="qp-a11y-dialog">⚙ OPTIONS</button>
    <section class="qp-a11y-panel" id="qp-a11y-dialog" role="dialog" aria-modal="false" aria-label="Accessibility options" hidden>
      <h2 class="qp-a11y-head">MAKE SPACE TO PLAY</h2><p class="qp-a11y-intro">Optional accessibility tools. Standard Shift scores and win conditions stay unchanged.</p>
      <div class="qp-a11y-checks"></div>
      <p class="qp-a11y-hint">F6 cycles reachable objects; Enter taps, grabs or releases. During a grab, arrow keys move the object. When switch-step is enabled, Space cycles choices and Enter acts. Dragging and holding still require deliberate player inputs. Escape cancels.</p>
      <button class="qp-a11y-close">RETURN TO THE SHIFT</button>
    </section>
    <div class="qp-a11y-dock" role="toolbar" aria-label="Keyboard-target controls" hidden></div>
    <div class="qp-a11y-focus" aria-hidden="true" hidden></div>
    <div class="qp-a11y-alert" role="status" aria-live="polite"></div>`;
  root.appendChild(portal);
  const launch = portal.querySelector('.qp-a11y-launch');
  const panel = portal.querySelector('.qp-a11y-panel');
  const dock = portal.querySelector('.qp-a11y-dock');
  const focus = portal.querySelector('.qp-a11y-focus');
  const alert = portal.querySelector('.qp-a11y-alert');
  const labels = [
    ['keyboardControls','Keyboard controls'],['switchStep','Switch-step choices (Space / Enter)'],
    ['largeTargets','Extra-large pointer target option'],['highContrast','High-contrast outlines'],
    ['reducedMotion','Reduced decorative motion'],['preferPractice','Prefer Practice Shift on next clock-in'],
  ];
  const checks = portal.querySelector('.qp-a11y-checks');
  for (const [key,label] of labels) {
    const el = document.createElement('label'); el.className = 'qp-a11y-toggle';
    const input = document.createElement('input'); input.type = 'checkbox'; input.name = key; input.checked = settings[key];
    const copy = document.createElement('span'); copy.textContent = label;
    el.append(input, copy); checks.append(el);
    input.addEventListener('change', () => setPreferences({[key]:input.checked}));
  }
  const usable = () => {
    let provided = [];
    try { provided = getTargets() || []; } catch { /* inactive scene */ }
    const ids = new Set();
    return provided.filter(t => t && typeof t.id === 'string' && !ids.has(t.id) && VALID_KINDS.has(t.kind)
      && Number.isFinite(t.x) && Number.isFinite(t.y) && !t.disabled && ids.add(t.id));
  };
  const announce = (message) => {
    announcement = String(message);
    alert.textContent = announcement;
    alert.dataset.visible = announcement ? 'true' : 'false';
  };
  const emit = (phase, point) => dispatch({phase,x:point.x,y:point.y,id:pointerId,kind:'assistive-keyboard'});
  const setPreferences = (partial) => {
    settings = normalizePreferences({...settings,...partial});
    for (const input of checks.querySelectorAll('input')) input.checked = settings[input.name];
    try { storage?.setItem(PREF_KEY, JSON.stringify(settings)); } catch { /* blocked storage */ }
    portal.classList.toggle('qp-contrast',settings.highContrast);
    portal.classList.toggle('qp-reduced',settings.reducedMotion);
    if (!settings.keyboardControls && held) cancelHeld();
    refresh();
    onSettingsChange({...settings});
    return {...settings};
  };
  const cancelHeld = () => {
    if (!held) return;
    dispatch({phase:'cancelPointer',id:pointerId,kind:'assistive-keyboard'});
    held = null;
    announce('Movement cancelled');
  };
  const setOpen = (next) => {
    if (gone || open === !!next) return;
    open = !!next;
    if (open && held) cancelHeld();
    panel.hidden = !open;
    launch.setAttribute('aria-expanded',String(open));
    onPause(open);
    if (open) panel.querySelector('input')?.focus(); else launch.focus();
    refresh();
  };
  const choose = (step = 1) => {
    const targets = usable();
    if (!targets.length) { announce('No reachable object yet'); return; }
    const current = targets.findIndex(t => t.id === selectedId);
    selectedId = targets[(current + step + targets.length) % targets.length].id;
    announce(targets.find(t => t.id === selectedId).label || selectedId);
    if (document.activeElement instanceof HTMLElement && document.activeElement.matches('button, input, a')) document.activeElement.blur();
    refresh();
  };
  const activate = () => {
    const targets = usable();
    const target = targets.find(t => t.id === selectedId) || targets[0];
    if (!target) { announce('No active target'); return; }
    selectedId = target.id;
    if (held) {
      if (held.id === target.id || held.kind === 'drag' || held.kind === 'hold') {
        emit('pointerUp',held.point); held = null; announce('Released'); refresh(); return;
      }
    }
    const point={x:target.x,y:target.y};
    emit('pointerDown',point);
    if (target.kind === 'tap') { emit('pointerUp',point); announce('Tapped '+(target.label || target.id)); }
    else { held={id:target.id,kind:target.kind,point}; announce(target.kind === 'drag' ? 'Grabbed: use arrow keys, then Enter to release' : 'Holding: Enter to release'); }
    refresh();
  };
  const move = (dx,dy) => {
    if (!held || held.kind !== 'drag') return;
    const vp=getViewport();
    // World step represents a readable movement independent of CSS/DPR scale.
    const sx=24 * (vp.worldWidth || vp.cssWidth || 1200) / Math.max(1,vp.cssWidth || 1200);
    const sy=24 * (vp.worldHeight || vp.cssHeight || 760) / Math.max(1,vp.cssHeight || 760);
    const p={x:held.point.x+dx*sx,y:held.point.y+dy*sy};
    if (vp.safeRect) {
      p.x=Math.max(vp.safeRect.left,Math.min(vp.safeRect.right,p.x));
      p.y=Math.max(vp.safeRect.top,Math.min(vp.safeRect.bottom,p.y));
    }
    held.point=p;
    emit('pointerMove',p);
    refresh();
  };
  const refresh = () => {
    if (gone) return;
    const enabled=settings.keyboardControls && !open;
    dock.hidden=!enabled;
    const targets=usable();
    if (!targets.some(t=>t.id===selectedId)) selectedId=targets[0]?.id ?? null;
    dock.replaceChildren();
    if (enabled) {
      for (const t of targets) {
        const b=document.createElement('button');b.type='button';b.textContent=t.label || t.id;
        b.dataset.targetId=t.id;b.setAttribute('aria-current',String(t.id===selectedId));
        b.setAttribute('aria-label',`${t.label||t.id}; ${t.kind}`);
        b.addEventListener('click',()=>{selectedId=t.id;activate();});
        dock.append(b);
      }
      if (held?.kind==='drag') for(const [name,dx,dy] of [['←',-1,0],['→',1,0],['↑',0,-1],['↓',0,1]]){
        const b=document.createElement('button'); b.textContent=name;b.className='qp-a11y-switch';
        b.setAttribute('aria-label','Move '+({ '←':'left', '→':'right', '↑':'up', '↓':'down'})[name]);
        b.addEventListener('click',()=>move(dx,dy));dock.append(b);
      }
      if (held) { const b=document.createElement('button');b.className='qp-a11y-switch';b.textContent='RELEASE';b.addEventListener('click',activate);dock.append(b); }
    }
    const focused=targets.find(t=>t.id===selectedId);
    const p=held?.point||focused;
    const projected=p && getViewport()?.worldToScreen?.(p.x,p.y);
    focus.hidden=!enabled || !projected || !Number.isFinite(projected.x) || !Number.isFinite(projected.y);
    if (!focus.hidden) { focus.style.left=`${projected.x}px`;focus.style.top=`${projected.y}px`; }
  };
  const onKey=(e)=>{
    if (gone) return;
    if (open && e.key === 'Escape') { e.preventDefault(); setOpen(false); return; }
    if(open || e.altKey || e.ctrlKey || e.metaKey || !settings.keyboardControls) return;
    if(e.target instanceof HTMLElement && e.target.closest('button, a, input, textarea, select, [role=button]') && e.key !== 'F6' && e.key !== ' ') return;
    const k=e.key;
    if(k==='F6' || (settings.switchStep && (k===' ' || k==='Spacebar') && !held)){
      e.preventDefault();choose(e.shiftKey?-1:1);return;
    }
    if(k==='Enter' && !e.repeat){e.preventDefault();activate();return;}
    if(k==='Escape' && held){e.preventDefault();cancelHeld();refresh();return;}
    if(held?.kind==='drag' && /^Arrow(Left|Right|Up|Down)$/.test(k)){
      e.preventDefault();move(k==='ArrowLeft'?-1:k==='ArrowRight'?1:0,k==='ArrowUp'?-1:k==='ArrowDown'?1:0);
    }
  };
  launch.addEventListener('click',()=>setOpen(!open));
  portal.querySelector('.qp-a11y-close').addEventListener('click',()=>setOpen(false));
  keyTarget.addEventListener('keydown',onKey);
  portal.classList.toggle('qp-contrast',settings.highContrast);
  portal.classList.toggle('qp-reduced',settings.reducedMotion);
  // Settings are a preference only: host must offer the choice of Practice Shift
  // before start, and label the final report accurately. Never alter ledger here.
  onSettingsChange({...settings});
  refresh();
  return {
    get settings(){return {...settings}},
    get state(){return {open,selectedId,held:held && {...held,point:{...held.point}},announcement}},
    setPreferences,refresh,choose,activate,move,cancelHeld,setOpen,
    dispose(){if(gone)return;cancelHeld();gone=true;keyTarget.removeEventListener('keydown',onKey);if(open)onPause(false);portal.remove();style.remove();},
  };
}