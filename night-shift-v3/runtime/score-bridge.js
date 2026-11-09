/**
 * LEAD: strict scene -> SYSTEMS event bridge.
 * A scored target must be supported by an actual authored scene event, a state
 * transition, or a completed manual outcome. Missing provenance fails closed.
 *
 * This adapter NEVER awards a card, licence, worker or boss packet simply
 * because it appeared in a predetermined deck. Every record is constructed
 * from a real scene's committed evidence or actual manual callback.
 */
import {recordQuotaPacketFromScene,identifyPrAction} from '../finalization/bridge/provenance-guards.js';
const required={I1:5,I2:2,I3:3,I4:3,S1:3,S2:2,S3:1,S4:1,
  P1:2,P2:2,P3:1,P4:1,T1:2,T2:1,T3:1,T4:2};
const must=(c,msg)=>{if(!c)throw Error('SCENE_EVIDENCE: '+msg)};
const nonneg=(n)=>Number.isInteger(n)&&n>=0;
export function createSceneScoreBridge(run){
 must(run?.recordAction&&run?.completeCard&&run?.recordBossAction,'real SYSTEMS run required');
 let current='',captured=0,lastAttempt='';
 function reset(id){
  const active=run.attemptId;
  if(id!==current||active!==lastAttempt){current=id;captured=0;lastAttempt=active;}
 }
 function action(objectId,outcome='correct'){
  must(typeof objectId==='string'&&objectId.length>0,'action has no real identifier');
  if(run.recordAction({objectId,outcome,gesture:'physical'})&&outcome==='correct')captured++;
 }
 function observe(e,id){
  if(!e||!id)return;
  reset(id);
  if(e.synthetic===true)return;
  if(id[0]==='P'&&e.type==='card-action'){
   must(typeof e.correct==='boolean','PR action missing correctness');
   action(identifyPrAction(e,id),e.correct?'correct':'wrong');
  }
  if(id==='printer'&&e.type==='printer-bolt-removed'){
   must(e.manual===true&&Number.isInteger(e.boltIndex),'printer bolt lacks manual hit');
   must(run.stage.type==='boss'&&run.stage.id==='printer','printer SYSTEMS order diverged');
   must(e.boltIndex+1===run.phase,'wrong printer bolt order');
   run.recordBossAction('manual-bolt-'+run.phase,{kind:'counter'});
   run.resolveBossCounter();
  }
  if(id==='quota'&&e.type==='quota-bonus-resolved')recordQuotaPacketFromScene(run,e);
  if(id==='quota'&&e.type==='boss-phase-complete'){
   must(e.outcome==='counter'&&e.synthetic===false&&e.objectId==='quota:bolt:'+run.phase,'quota bolt not player-countered');
   must(run.stage.type==='boss'&&run.stage.id==='quota','quota SYSTEMS boss missing');
   run.recordBossAction('manual-bolt-'+run.phase,{kind:'counter'});
   run.resolveBossCounter();
  }
 }
 function commit(id,evidence,outcome){
  must(run.stage.type==='card'&&run.stage.id===id,'card SYSTEMS order diverged on '+id);
  must(evidence&&typeof evidence==='object','missing authored evidence '+id);
  reset(id);
  const need=required[id];must(Number.isInteger(need),'unknown card '+id);
  const actual=(name)=>Array.isArray(evidence.actions)?
   evidence.actions.filter(a=>a.name===name&&typeof a.objectId==='string'):[];
  if(id==='I1'||id==='I2'||id==='I3'||id==='I4'){
   const names={I1:['approved-manual'],I2:['shredded-spam'],
      I3:['closed-scam'],I4:['stamp-start','route-node']};
   const observed=(evidence.actions||[]).filter(a=>names[id].includes(a.name)
      &&typeof a.objectId==='string');
   must(observed.length>=need,'missing observed Intake actions '+id+' '+observed.length+'/'+need);
   for(const a of observed.slice(0,need))action(id+':'+a.name+':'+a.objectId);
   if(id==='I1'){
    must(evidence.progress===5&&evidence.notice?.real&&evidence.notice?.fake,
      'first five forms or real/fake notice not observed');
    const real=evidence.notice.real,fake=evidence.notice.fake;
    run.recordNotice('I1:real-mira',{genuine:true,safelyHandled:real==='opened'});
    run.recordNotice('I1:fake-ad',{genuine:false,safelyHandled:fake==='closed'});
   }
   if(id==='I3'){
    must(evidence.progress===3,'three scam windows not dismissed');
    if(evidence.notice?.real)
      run.recordNotice('I3:real-mira',{genuine:true,
        safelyHandled:evidence.notice.real==='opened'});
   }
  }else if(id==='S1'){
   must(Array.isArray(evidence.filed)&&evidence.filed.length===3&&
     new Set(evidence.filed).size===3,'three unique physical files not delivered');
   for(const f of evidence.filed)action('S1:file:'+f);
  }else if(id==='S2'){
   must(nonneg(evidence.caught)&&evidence.caught>=2&&evidence.caught<=3,
     'real mugs not caught');
   for(let i=0;i<evidence.caught;i++)action('S2:real-caught-mug:'+i);
   must(['functional','disrupted'].includes(evidence.miraWorkstation),
     'Mira workstation outcome missing');
   run.recordWorker('mira-workstation',evidence.miraWorkstation==='functional');
  }else if(id==='S3'){
   must(evidence.safePull===true&&typeof evidence.method==='string',
     'no physical printer feeder pull');
   action('S3:real-safe-page-pull');
  }else if(id==='S4'){
   must(typeof evidence.method==='string'&&evidence.method.startsWith('socket-hold-trace'),
     'no verified cable trace');
   action('S4:manual-hold-trace');
  }else if(id[0]==='P'){
   must(captured>=need,'missing PR actual action events '+id+' '+captured+'/'+need);
   if(id==='P4'){
    const frame=evidence.framing;
    must(['headline','context'].includes(frame),'missing actual framing choice');
    run.recordFrame(frame);
   }
  }else if(id==='T1'){
   const observed=evidence.workerIdsRescued;
   must(evidence.workersSeen===3&&Array.isArray(observed)&&observed.length>=2,
     'three workers not observed and two not rescued');
   const mapping=['mira','jules','ray'];
   must(observed.every(x=>mapping.includes(x))&&new Set(observed).size===observed.length,
     'rescued worker identity invalid');
   for(const w of observed)action('T1:physically-escaped:'+w);
   mapping.forEach((w,i)=>run.recordWorker('worker-'+(i+1),observed.includes(w)));
  }else if(id==='T2'){
   must(evidence.boxesCleared===3&&evidence.workerCrossedExit===true&&
     evidence.manualInteractions===true,'staff boxes or crossing not proven');
   action('T2:physical-cleared-lane');
  }else if(id==='T3'){
   must(evidence.clockedOut===true&&evidence.timedWindowUsed===true&&
     evidence.manualInteractions===true,'clock-out manual action not proven');
   action('T3:real-clock-window');
  }else if(id==='T4'){
   const choices=evidence.choices;
   must(Array.isArray(choices)&&choices.length===2&&
     evidence.totalBudget===80&&evidence.unallocatedDollars===0,
     'two actual $40 licence allocations missing');
   const seen=new Set();
   for(const item of choices){
    const worker=String(item.worker||'').toLowerCase();
    must(['mira','jules'].includes(worker)&&!seen.has(worker)&&item.amount===40&&item.manual===true,
      'licence not manually allocated to a real coworker');
    const dest=String(item.destination||'').toLowerCase();
    must(['give','save'].includes(dest),'licence disposition unverified');
    seen.add(worker);
    action('T4:physical:'+item.id);
    run.allocateLicence(worker,dest);
   }
  }
  must(captured>=need,'missing actual resolved actions '+id+' '+captured+'/'+need);
  run.completeCard();
  reset('');
 }
 function bossComplete(id,e){
  must(run.stage.type!=='boss'||run.stage.id!==id,
    'boss completion missing physical counter evidence '+id);
  if(id==='quota'){
   must(run.status==='victory','quota finished without committed SYSTEMS victory');
   must(e?.boltsRemoved===3&&e?.synthetic===false,'quota victory not physically confirmed');
  }
 }
 return Object.freeze({observe,commit,bossComplete,get count(){return captured}});
}
