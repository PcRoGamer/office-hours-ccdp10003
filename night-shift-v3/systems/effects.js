/** Bounded perk/directive mechanics. Commands are rendered and physically executed by scenes. */
import {PERKS,ADAPTERS,synergyNames} from './core.js';
const has=(levels,id)=>(levels[id]||0)>0;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export function makeEffectController(levels,{
  department='intake',encounterId='I1',phase=1,timeBankMs=0
}={}){
  const set=new Set(PERKS);for(const k of Object.keys(levels))if(!set.has(k))throw Error('unknown perk '+k);
  const counts={correctHits:0,copies:0,chains:0,scan:0,safety:0,mira:0,comeback:0};
  const synergies=synergyNames(levels);
  const synergy=(a,b)=>has(levels,a)&&has(levels,b);
  let reserve=clamp(timeBankMs,0,has(levels,'time-bank')&&levels['time-bank']===2?10000:6000);
  const emit=(type,data={})=>({type,source:'perk-system',encounterId,...data});
  return {
    get snapshot(){return {counts:{...counts},reserve,synergies}},
    get activeSynergies(){return [...synergies]},
    applyDirective(directive){
      if(!ADAPTERS[directive])throw Error('unknown directive');
      const eligible=['printer','quota'].includes(encounterId)?ADAPTERS[directive][encounterId]:ADAPTERS[directive][department]?.includes(encounterId);
      if(!eligible)throw Error(`no mechanical adapter for ${directive} in ${encounterId}`);
      return {directive,encounterId,requiredVisual:true,commands:({
        'double-entry':[emit('linked-confirmation',{requiresOriginal:true,createsLegalObject:false,mandatory:true})],
        'moving-goalposts':[emit('rail-translation',{onlyBetweenManipulations:true,announceBeforeMove:true})],
        'fast-or-safe':[emit('alternate-route',{fast:'narrow',safe:'broad',noScoreFudge:true})],
        'sponsored-workflow':[emit('real-and-counterfeit-notice',{clearIdentityTells:true,physicalCover:true})],
        'mandatory-collaboration':[emit('optional-coworker-route',{soloRouteAlwaysValid:true,visibleIntervention:true})]
      })[directive]};
    },
    resolvePrimary({objectId,correct=true,clean=true,eligibleGhostTargetId=null,nearbyTargetId=null,fling=false,bounce=false,hazard=false,needsAid=false,synthetic=false}={}){
      if(synthetic)return {commands:[],allowedSecondary:0,synthetic:true};
      if(!objectId)throw Error('primary needs objectId');
      const commands=[];
      if(correct&&clean){counts.correctHits++;
        const maxCopies=has(levels,'carbon-copy')?levels['carbon-copy']:0;
        const trigger=maxCopies===2?[1,3]:[1];
        if(eligibleGhostTargetId&&counts.copies<maxCopies&&trigger.includes(counts.correctHits)){
          // Ghost can resolve a different valid authored target, but NEVER clone money/score packet.
          const restricted=encounterId==='T4'||encounterId==='quota';
          commands.push(emit(restricted?'ghost-cover':'spawn-ghost',{
            generatedObjectId:`ghost:${encounterId}:${objectId}:${counts.copies+1}`,
            validTargetId:restricted?null:eligibleGhostTargetId,synthetic:true,
            canSpawnCopy:false,canEarnTime:false,canDuplicateLicence:false,canFileBonus:false
          }));counts.copies++;
        }
        const level=levels['chain-stamp']||0;
        const threshold=level===2?1:2, max=level===2?2:1;
        if(level&&counts.correctHits>=threshold&&nearbyTargetId&&counts.chains<max){
          commands.push(emit('ink-chain',{targetId:nearbyTargetId,synthetic:true,canRecurse:false}));counts.chains++;
        }
      }
      if(fling&&has(levels,'bank-shot'))commands.push(emit('bounce-trajectory',{maxControlledBounces:levels['bank-shot'],showArc:true}));
      if(has(levels,'magnet-grip'))commands.push(emit('grip-assist',{radiusMultiplier:levels['magnet-grip']===2?1.35:1.2,releaseCorrectionMs:200,visible:true}));
      if(hazard&&has(levels,'safety-net')&&counts.safety<(levels['safety-net']===2?2:1)){
        commands.push(emit('deploy-cushion',{absorbsOneVisibleHazard:true}));counts.safety++;
        if(synergy('mira-backup','safety-net')&&counts.comeback<1){
          commands.push(emit('mira-return-item',{visible:true,safeCounterPacket:true}));counts.comeback++;
        }
      }else if(needsAid&&has(levels,'mira-backup')&&counts.mira<(levels['mira-backup']===2?2:1)){
        commands.push(emit('mira-intervention',{visible:true,requiresCharacterArrival:true,notAnAutomaticRescue:true}));counts.mira++;
        if(synergy('mira-backup','time-bank'))reserve=Math.min(levels['time-bank']===2?10000:6000,reserve+1000);
      }
      if(synergy('bank-shot','magnet-grip')&&fling&&bounce)commands.push(emit('bank-grip-guidance',{alternatePhysicalRoute:true}));
      if(synergy('bank-shot','chain-stamp')&&bounce&&counts.chains>0)commands.push(emit('bank-chain-route',{oneSecondaryOnly:true}));
      return {commands,allowedSecondary:1,synthetic:false};
    },
    scan(){if(!has(levels,'focus-lens')||counts.scan>=levels['focus-lens'])return null;counts.scan++;
      return emit('focus-scan',{showsAuthenticity:true,revealsNextHazard:true,freezesRevealedObjectMs:levels['focus-lens']===2?1500:1000});
    },
    useClock({remainingMs=Infinity}={}){if(!has(levels,'time-bank')||remainingMs>=3000||reserve<=0)return 0;
      const amount=Math.min(reserve,levels['time-bank']===2?3000:2000);reserve-=amount;return amount;},
    bankUnused({referenceMs,activeMs,synthetic=false}={}){if(synthetic||!has(levels,'time-bank'))return reserve;
      if(!Number.isFinite(referenceMs)||!Number.isFinite(activeMs))throw Error('invalid actual elapsed');
      reserve=Math.min(levels['time-bank']===2?10000:6000,reserve+Math.min(2000,Math.max(0,referenceMs-activeMs)));return reserve;},
    previewBuild(){return synergy('bank-shot','magnet-grip')?'precision':synergy('carbon-copy','chain-stamp')?'throughput':synergy('mira-backup','safety-net')?'care-control':synergy('focus-lens','time-bank')?'information':'hybrid';}
  };
}