/**
 * PR-owned event adapter for SYSTEMS NightShiftRun.
 * Scene actions never mutate scores; NightShiftRun validates every committed
 * action, card and framing choice. Director owns tickActive and transitions.
 */
export function createPrRunEventAdapter({run,onEffect=()=>{},onEvent=()=>{}}={}){
  if(!run||typeof run.recordAction!=='function'||typeof run.completeCard!=='function'||
     typeof run.failAttempt!=='function'||typeof run.recordFrame!=='function')
    throw Error('PR integration requires the event-sourced NightShiftRun interface');
  if(!/^P[1-4]$/.test(run.currentCardId??''))throw Error('PR adapter created outside a P1-P4 card');
  const cardId=run.currentCardId;
  let finalized=false,resolution=null;
  const notices=Object.freeze({
    'open-signed-scale-tip':['pr:p1:verified-scale-tip',true,true],
    'fling-genuine-scale-tip':['pr:p1:verified-scale-tip',true,false],
    'flick-cosmetic-ad':['pr:p1:fake-creative',false,true],
    'accept-cosmetic-ad':['pr:p1:fake-creative',false,false],
    'open-signed-alert':['pr:p2:verified-alert',true,true],
    'dismiss-genuine-help':['pr:p2:verified-alert',true,false]
  });
  function emit(event){
    if(!event||typeof event.type!=='string')throw Error('malformed scene event');
    if(event.cardId!==cardId)throw Error('scene card ID differs from active run card');
    if(finalized)return false;
    if(run.currentCardId!==cardId)throw Error('PR scene event arrived after run changed stage');
    if(event.type==='card-action'){
      if(typeof event.objectId!=='string'||event.objectId.length===0||event.synthetic!==false||
         !['correct','wrong'].includes(event.outcome))
        throw Error('PR scene action missing unique manual object provenance');
      const accepted=run.recordAction({objectId:event.objectId,outcome:event.outcome,
        synthetic:false,gesture:event.gesture||'pointer'});
      if(typeof run.recordNotice==='function'){
        const note=event.kind==='flick-hostile-overlay'
          ?['pr:p2:'+event.objectId,false,true]:notices[event.kind];
        if(note)run.recordNotice(note[0],{genuine:note[1],safelyHandled:note[2]});
      }
      onEvent(event);return accepted;
    }
    if(event.type==='card-complete'){
      if(!['success','failure'].includes(event.outcome))throw Error('unknown PR result');
      if(event.outcome==='success'){
        const evidence=event.evidence||{};
        if(cardId==='P4'){
          if(!['headline','context'].includes(evidence.framing))throw Error('P4 missing real framing');
          run.recordFrame(evidence.framing);
        }
        run.completeCard();
        resolution={status:'success',cardId,evidence};finalized=true;
        if(cardId==='P4'&&evidence.effect)onEffect(evidence.effect);
      }else{
        const reason=event.evidence?.cause||'failure';
        const next=run.failAttempt({reason,damage:true});
        resolution={status:'failure',cardId,reason,next};finalized=true;
      }
      onEvent(event);return true;
    }
    onEvent(event);return false;
  }
  return Object.freeze({events:Object.freeze({emit}),get finalized(){return finalized},
    get resolution(){return resolution?structuredClone(resolution):null}});
}
