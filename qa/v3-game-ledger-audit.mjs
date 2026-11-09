/**
 * Independent production ledger audit. Works on the actual SYSTEMS run.snapshot
 * without requiring SYSTEMS to duplicate derived counts in mutable state.
 * Pure read-only module: no simulator shortcuts, mutators or score awards.
 */
import {auditDeck} from './v3-game-invariants.mjs';
const unique=items=>new Set(items).size===items.length;
const clamp=x=>Math.max(0,Math.min(1,x));
const safeRatio=(a,b)=>b>0?clamp(a/b):0;
const sum=a=>a.reduce((x,y)=>x+y,0);

/** Recalculate fictional game scores without importing the production scorer. */
export function deriveFromLedger(snapshot,contract){
  const run=snapshot?.run||snapshot;
  const ledger=(run?.eventLedger||[]).filter(e=>e.committed===true);
  const refs=new Map(contract.card_pool.map(c=>[c.id,c.authoredReferenceMs]));
  const cards=new Map(),workers=new Map(),licences=new Map(),notices=new Map(),packets=new Map();
  let correct=0,wrong=0,streak=0,longest=0;const counterIds=[],promotionEvents=[];
  for(const e of ledger){
    if(e.kind==='card-complete'&&!cards.has(e.encounterId))cards.set(e.encounterId,e);
    if(e.kind==='action'&&!e.synthetic){
      if(e.outcome==='correct'){correct++;longest=Math.max(longest,++streak)}
      else if(e.outcome==='wrong'){wrong++;streak=0}
    }
    if(e.kind==='worker'&&!workers.has(e.objectId))workers.set(e.objectId,e.outcome==='helped');
    if(e.kind==='licence'&&!licences.has(e.objectId))licences.set(e.objectId,e.outcome);
    if(e.kind==='notice'&&!notices.has(e.objectId))notices.set(e.objectId,e.outcome==='safe');
    if(e.kind==='quota-packet'&&!packets.has(e.objectId))packets.set(e.objectId,e.outcome);
    if(e.kind==='boss-counter')counterIds.push(e.objectId);
    if(e.kind==='promotion')promotionEvents.push(e);
  }
  const pace=cards.size?sum([...cards].map(([id,e])=>clamp(1-e.activeElapsedMs/(refs.get(id)||Infinity))))/cards.size:0;
  const saved=[...licences.values()].filter(x=>x==='save').length*40;
  const given=[...licences.values()].filter(x=>x==='give').length;
  const filed=[...packets.values()].filter(x=>x==='file').length;
  const official={
    completedWork:40*clamp(cards.size/12), pace:15*pace,cleanStreak:15*clamp(longest/8),
    budgetSavings:10*clamp(saved/80),bossFileBonus:5*filed
  };
  const people={
    coworkerSupport:35*safeRatio([...workers.values()].filter(Boolean).length,workers.size),
    toolAccess:30*safeRatio(given,2),carefulActions:20*safeRatio(correct,correct+wrong),
    attentionToHelp:15*safeRatio([...notices.values()].filter(Boolean).length,notices.size)
  };
  return {officialScore:Math.round(sum(Object.values(official))),peopleScore:Math.round(sum(Object.values(people))),
    official,people,cards,workers,licences,notices,packets,counterIds,promotionEvents,
    correct,wrong,longest,saved,given,filed};
}

/** Strict snapshot audit. Assesses factual and numerical GDD properties only, not physical fun. */
export function auditProductionSnapshot(input,contract,{requireVictory=false}={}){
  const s=input?.run||input, problems=[];
  const fault=(code,detail)=>problems.push({code,detail});
  if(!s||typeof s!=='object'){fault('missing-run','production snapshot absent');return {ok:false,problems}}
  if(s.fixture===true||input?.fixture===true){fault('fixture','test fixture cannot certify production');return {ok:false,problems}}
  if(s.schemaVersion!==3)fault('schema','expected schema 3');
  problems.push(...auditDeck(s.cardDeck,contract).map(e=>({code:e.code,detail:e.message})));
  if(!Array.isArray(s.eventLedger)){fault('missing-ledger','canonical event ledger absent');return {ok:false,problems}}
  const events=s.eventLedger.filter(e=>e.committed===true);
  if(!unique(events.map(e=>e.id)))fault('event-ids','duplicate committed event IDs');
  for(const e of events)if(!e.runId||!e.encounterId||!e.attemptId||!e.id)fault('event-provenance','missing event provenance');
  const scored=deriveFromLedger(s,contract), e=s.endingSnapshot;
  const {cards,workers,licences,notices,packets,counterIds,promotionEvents}=scored;
  if(!unique(events.filter(x=>x.kind==='card-complete').map(x=>x.encounterId)))fault('repeat-card','duplicate committed completion');
  if(!unique(events.filter(x=>x.kind==='quota-packet').map(x=>x.objectId)))fault('repeat-packet','duplicate packet award');
  if(!unique(counterIds))fault('repeat-bolt','boss bolt counted multiple times');
  for(const [id,v] of packets){
    if(!contract.bosses.quota.bonusPacketIds.includes(id)||!['file','cool','expired'].includes(v))fault('packet-invalid',id+' '+v);
  }
  if(s.quotaPressure<0||s.quotaPressure>2||!Number.isInteger(s.quotaPressure))fault('pressure','quota pressure must be integer 0..2');
  if(cards.has('T4')&&(scored.saved+40*scored.given!==80||licences.size!==2))fault('licence-conservation','committed 2 × $40 must balance to $80');
  if([...workers.keys()].some(x=>!['mira-workstation','worker-1','worker-2','worker-3'].includes(x)))fault('invented-worker','unknown worker event');
  if(scored.given>2||scored.saved>80)fault('licence-overflow','currency or tokens overproduced');
  if(!Array.isArray(s.directiveSchedule)||s.directiveSchedule.length!==5||
    !unique(s.directiveSchedule)||s.directiveSchedule.some(x=>!contract.directives.includes(x)))fault('directives','must use five distinct directives');
  if(!Array.isArray(s.pickedPerks)||s.pickedPerks.length>5)fault('perk-picks','invalid number of picks');
  if(!Array.isArray(s.draftHistory)||s.draftHistory.length>5)fault('drafts','invalid number of drafts');
  else {
    for(const [i,d] of s.draftHistory.entries())if(!Array.isArray(d)||d.length!==3||!unique(d)||d.some(x=>!contract.perkIds.includes(x)))fault('draft-offers','illegal draft at '+i);
    if(s.draftHistory.length&&JSON.stringify(s.draftHistory[0])!==JSON.stringify(contract.firstPerkOffer))fault('first-draft','fixed first offer not displayed');
  }
  const lvl=s.perkLevels||{},levelTotal=Object.values(lvl).reduce((a,b)=>a+b,0);
  if(Object.entries(lvl).some(([k,n])=>!contract.perkIds.includes(k)||!Number.isInteger(n)||n<0||n>2))fault('perk-level','illegal perk level');
  if(s.pickedPerks&&levelTotal!==s.pickedPerks.length)fault('perk-accounting','picked levels do not sum to picks');
  if(scored.officialScore>100||scored.peopleScore>100||scored.officialScore<0||scored.peopleScore<0)fault('score-range','metric outside 0..100');
  for(const [id,cardEvent] of cards){
    if(!s.cardDeck?.includes(id))fault('card-outside-deck',id);
    const reference=contract.card_pool.find(c=>c.id===id)?.authoredReferenceMs;
    if(!Number.isFinite(cardEvent.activeElapsedMs)||cardEvent.activeElapsedMs<0||!reference)fault('card-pace','invalid elapsed time for '+id);
  }
  if(s.completedCardIds&&!unique(s.completedCardIds))fault('snapshot-card-repeat','repeated ID in snapshot');
  if(s.completedCardIds&&(!unique([...cards.keys()])||[...cards.keys()].sort().join(',')!==[...s.completedCardIds].sort().join(',')))fault('snapshot-ledger-card-divergence','reported and committed card sets differ');
  if(e){
    if(e.officialScore!==scored.officialScore||e.peopleScore!==scored.peopleScore)fault('falsified-receipt',`expected ${scored.officialScore}/${scored.peopleScore}, saw ${e.officialScore}/${e.peopleScore}`);
    if(e.savedLicenceDollars!==scored.saved||e.licenceTokensGiven!==scored.given)fault('receipt-licences','printed token summary differs');
    if(e.packetsFiled!==scored.filed)fault('receipt-packets','printed FILE count differs');
  }
  if(requireVictory||s.status==='victory'){
    if(s.status!=='victory')fault('not-victory','need actual victory snapshot');
    if(cards.size!==12)fault('victory-card-count','victory must commit exactly 12 cards');
    if(scored.workers.size!==4)fault('worker-opportunities','4 visible staff opportunities required');
    if(scored.notices.size<2)fault('notice-opportunities','real and fake notice required');
    if(licences.size!==2)fault('licence-allocation','both $40 tokens must be resolved');
    if(packets.size!==4)fault('packet-opportunities','all 4 FILE/COOL/expired outcomes required');
    if(counterIds.filter(x=>x?.startsWith('printer:bolt:')).length!==3||
       counterIds.filter(x=>x?.startsWith('quota:bolt:')).length!==3)fault('boss-counter-count','both three-bolt bosses must be defeated');
    if(promotionEvents.length!==5||s.pickedPerks?.length!==5||s.draftHistory?.length!==5)fault('five-promotions','five real promotions & choices required');
    if(!e)fault('no-receipt','victory must freeze a scored receipt');
  }
  return {ok:problems.length===0,problems,summary:{status:s.status,completed:cards.size,officialScore:scored.officialScore,peopleScore:scored.peopleScore,packetsFiled:scored.filed,counters:counterIds.length,promotions:promotionEvents.length}};
}
