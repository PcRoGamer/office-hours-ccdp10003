/** Independent BRIDGE_QA guards. Never fabricate actions or award score. */
export const QUOTA_PACKET_IDS=Object.freeze(['quota:p1:b1','quota:p2:b1','quota:p3:b1','quota:p3:b2']);
const requireEvidence=(ok,msg)=>{if(!ok)throw Error('SCENE_EVIDENCE: '+msg)};
const packets=run=>run.eventLedger.filter(e=>e.kind==='quota-packet');

/**
 * Timed expiry is a real zero-point outcome, not a forged manual gesture.
 * Preserve explicit FILE/COOL provenance and enforce packet order.
 */
export function recordQuotaPacketFromScene(run,e){
 requireEvidence(run?.stage?.type==='boss'&&run.stage.id==='quota','packet outside quota boss');
 requireEvidence(e?.type==='quota-bonus-resolved'&&e.synthetic===false,
   'packet lacks authored scene event');
 requireEvidence(QUOTA_PACKET_IDS.includes(e.objectId),'unknown packet');
 requireEvidence(['file','cool','expired'].includes(e.outcome),'invalid packet outcome');
 if(e.phase!==undefined)requireEvidence(e.phase===run.phase,'wrong packet phase');
 if(e.outcome==='expired')requireEvidence(e.manual!==true,'expiry impersonates a gesture');
 else requireEvidence(e.manual!==false,'manual choice marked automatic');
 const committed=new Set(packets(run).map(e=>e.objectId));
 const expected=run.phase===1?QUOTA_PACKET_IDS[0]:run.phase===2?QUOTA_PACKET_IDS[1]:
   !committed.has(QUOTA_PACKET_IDS[2])?QUOTA_PACKET_IDS[2]:QUOTA_PACKET_IDS[3];
 requireEvidence(e.objectId===expected,'duplicate or out-of-order packet');
 requireEvidence(run.resolveBonusPacket(e.objectId,e.outcome,{manual:e.outcome!=='expired'}),
   'packet already resolved');
 return e.outcome;
}

/**
 * Director should retain the live scene after a failed boss attempt. SYSTEMS
 * preserves committed counters/packets on failAttempt, so recreating the boss
 * would restart the physical scene at phase one and desynchronise the ledger.
 *
 * Integration: call after failAttempt, before restoring mode and attempt timer.
 * Do NOT call enterBoss() on this retry path.
 */
export function assertBossRetrySafe({run,scene,bossId}){
 requireEvidence(['printer','quota'].includes(bossId),'invalid boss retry');
 requireEvidence(run?.stage?.type==='boss'&&run.stage.id===bossId,
   'retry has no matching SYSTEMS boss');
 requireEvidence(typeof scene?.snapshot==='function','missing physical scene');
 const state=scene.snapshot();
 const committed=run.eventLedger.filter(e=>e.kind==='boss-counter'&&
   e.objectId?.startsWith(bossId+':bolt:')).length;
 const physical=bossId==='printer'?state.removed:state.boltsRemoved;
 requireEvidence(Number.isInteger(physical)&&physical===committed,
   'boss retry would lose '+bossId+' counters: scene='+physical+' ledger='+committed);
 if(bossId==='quota')for(const packet of packets(run)){
   requireEvidence(state.bonusOutcomes?.[packet.objectId]===packet.outcome,
     'boss retry would lose packet '+packet.objectId);
 }
 scene.cancelPointer?.();
 return scene;
}
