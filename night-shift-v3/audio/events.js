/**
 * Optional lead/director event adapter. The game owns scoring and visual cues.
 * Audio is a PURE observer: the adapter never emits gameplay or score events.
 *
 * Preferred event bus: bus.on('event', callback) -> unsubscribe function.
 * Also supports bus.subscribe(callback) or DOM EventTarget ('audio:game').
 * Scenes may directly call context.audio.cue('stamp') on actual impact frame.
 */
export function attachAudioToEvents(bus, audio) {
  if (!bus || !audio) throw new TypeError('Event bus and audio engine required');
  const allowed = new Set(['stamp','file','collision','catch','fail','scam','help','promotion','bolt','victory','grab','release','miss','jam','telegraph','clock-out','click','printer','quota','heart','streak']);
  function observe(e) {
    const event=e?.detail ?? e;
    if (!event || !event.type) return;
    switch (event.type) {
      case 'audio-cue':
        if (allowed.has(event.cue)) audio.cue(event.cue,{strength:event.strength??1,pan:event.pan??0});
        break;
      case 'physical-contact':
        audio.cue('collision',{strength:Math.min(1.5,Math.max(.08,(event.impulse??1)/4)),pan:event.pan??0});
        break;
      case 'action-resolved':
        // One cue for a committed *manual* action; synthetic outcomes are silent.
        if (event.synthetic) break;
        if (event.success===false) audio.cue('fail');
        else if (allowed.has(event.action)) audio.cue(event.action);
        break;
      case 'promotion-open': audio.setMode('promotion');break;
      case 'promotion-selected': audio.cue('promotion'); audio.setStreak(0);break;
      case 'card-start':audio.setMode('work');break;
      case 'boss-start': audio.setMode('boss');audio.cue(event.boss==='printer'?'printer':'quota');break;
      case 'boss-telegraph': audio.cue('telegraph');break;
      case 'boss-bolt':audio.cue('bolt');break;
      case 'run-complete':audio.setMode('victory');audio.cue('victory');break;
      case 'run-failed':audio.cue('fail');break;
      case 'pressure-change':audio.setPressure(event.pressure??0);break;
      case 'streak-change':audio.setStreak(event.streak??0);break;
      case 'audio-settings':
        if (typeof event.muted==='boolean') audio.setMuted(event.muted);
        if (Number.isFinite(event.volume)) audio.setVolume(event.volume);
        break;
      case 'game-paused':audio.pause();break;
      case 'game-resumed':void audio.resume();break;
      default:break;
    }
  }
  if(typeof bus.subscribe==='function'){
    const unsub=bus.subscribe(observe);
    if(typeof unsub!=='function') throw new TypeError('bus.subscribe() must return unsubscribe');
    return unsub;
  }
  if(typeof bus.on==='function'){
    const unsub=bus.on('event',observe);
    if(typeof unsub==='function')return unsub;
    if(typeof bus.off==='function')return ()=>bus.off('event',observe);
    throw new TypeError('bus.on() must return unsubscribe or expose .off()');
  }
  if(typeof bus.addEventListener==='function'){
    bus.addEventListener('audio:game',observe);
    return ()=>bus.removeEventListener('audio:game',observe);
  }
  throw new TypeError('Unsupported event bus');
}