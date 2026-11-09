/** Independent Night Shift v3 black-box QA. Reports failures, never repairs game state. */
export const EXPECTED = Object.freeze({
  cards: ['I1','I2','I3','I4','S1','S2','S3','S4','P1','P2','P3','P4','T1','T2','T3','T4'],
  guaranteed: {intake:['I1'],services:['S1','S2'],pr:['P1','P4'],staff:['T1','T4']},
  departments: ['intake','services','pr','staff'],
  bosses: {printer:3,quota:3},
  packets: ['quota:p1:b1','quota:p2:b1','quota:p3:b1','quota:p3:b2']
});
const unique = a => new Set(a).size === a.length;
const almost = (a,b) => Math.abs(a-b)<1e-7;
const clamp = x=>Math.max(0,Math.min(1,x));
const finite = v=>Number.isFinite(v)&&v>=0;

/** Audits a complete deck (or one seed's pending deck) against fixed GDD constraints. */
export function auditDeck(deck, contract) {
  const errors=[];
  const fail=(code,message)=>errors.push({code,message});
  if (!Array.isArray(deck)) return [{code:'deck-missing',message:'Deck is not an array'}];
  if(deck.length!==12)fail('deck-size',`Expected 12 cards; got ${deck.length}`);
  if(!unique(deck))fail('deck-duplicates','Duplicate card IDs in deck');
  const pool=new Map(contract.card_pool.map(x=>[x.id,x.department]));
  for(const id of deck)if(!pool.has(id))fail('unknown-card',`Unknown card ${id}`);
  for(const d of EXPECTED.departments){
    const selected=deck.filter(x=>pool.get(x)===d);
    if(selected.length!==3)fail('department-count',`${d}: expected 3, got ${selected.length}`);
    for(const id of contract.guaranteed[d]||[])if(!selected.includes(id))fail('missing-guarantee',`${d} missing ${id}`);
  }
  if(deck[0]!=='I1')fail('first-card','I1 must be first');
  if(!['S1','S2'].every(id=>deck.slice(3,5).includes(id)))fail('services-order','S1 and S2 must occupy the first two Services slots (either order)');
  if(!deck.slice(3,6).some(x=>x==='S3'||x==='S4'))fail('printer-prep','A Services jam/cable tutorial is mandatory');
  if(deck.indexOf('P1')<0||deck.indexOf('P1')>deck.indexOf('P4'))fail('pr-order','P1 must precede P4');
  if(deck.indexOf('T1')<0||deck.indexOf('T1')>deck.indexOf('T4'))fail('staff-order','T1 must precede T4');
  if(deck.some((id,i)=>pool.has(id)&&Math.floor(i/3)!==EXPECTED.departments.indexOf(pool.get(id))))fail('department-order','Encounter department blocks are out of order');
  return errors;
}

/** Pure score recomputation; no score or ledger field is mutated. */
export function calculateScores(run, contract) {
  const completed = new Set(run.completedCardIds||[]);
  const elapsed=run.committedActiveMs||{};
  const references=Object.fromEntries(contract.card_pool.map(c=>[c.id,c.authoredReferenceMs]));
  const speeds=[...completed].filter(x=>references[x]>0&&finite(elapsed[x])).map(x=>clamp(1-elapsed[x]/references[x]));
  const fileCount=Object.values(run.quotaBonusPacketOutcomes||{}).filter(x=>x==='file').length;
  const div=(a,b)=>b>0?clamp(a/b):0;
  const corporate={
    completedWork:40*clamp(completed.size/12),
    pace:15*(speeds.length? speeds.reduce((a,b)=>a+b,0)/speeds.length:0),
    cleanStreak:15*clamp((run.cleanStreakMax||0)/8),
    budgetSavings:10*clamp((run.savedLicenceDollars||0)/80),
    bossFileBonus:5*fileCount
  };
  const people={
    coworkerSupport:35*div(run.workersHelped||0,run.workersEncountered||0),
    toolAccess:30*div(run.licenceTokensGiven||0,2),
    carefulActions:20*div(run.correctResolvedActions||0,(run.correctResolvedActions||0)+(run.wrongResolvedActions||0)),
    attentionToHelp:15*div(run.safeNotificationsHandled||0,run.notificationsEncountered||0)
  };
  return {corporate:Math.round(Object.values(corporate).reduce((a,b)=>a+b,0)),
    people:Math.round(Object.values(people).reduce((a,b)=>a+b,0)),components:{corporate,people}};
}

/** Audit score/lifecycle invariants from a read-only production snapshot. */
export function auditRun(run, contract) {
  const errors=[];
  const fail=(code,message)=>errors.push({code,message});
  if(!run||typeof run!=='object')return [{code:'missing-run',message:'No run snapshot'}];
  if(run.schemaVersion!==3)fail('schema','Expected schemaVersion 3');
  if(!finite(run.seed))fail('seed','Seed must be a nonnegative finite number');
  if(!Array.isArray(run.cardDeck))fail('deck-missing','No deck on run');
  else errors.push(...auditDeck(run.cardDeck,contract));
  if(Array.isArray(run.completedCardIds)){
    if(!unique(run.completedCardIds))fail('duplicate-completion','Card completion awarded twice');
    for(const id of run.completedCardIds)if(!run.cardDeck?.includes(id))fail('completion-out-of-deck',id);
    if(run.status==='victory'&&run.completedCardIds.length!==12)fail('premature-victory','Victory missing 12 completed cards');
  }else fail('no-completions','Missing completedCardIds');
  if(!Array.isArray(run.directiveSchedule)||run.directiveSchedule.length!==5||!unique(run.directiveSchedule)||run.directiveSchedule.some(x=>!contract.directives.includes(x)))fail('directives','Expected 5 distinct legal directives');
  if(!Array.isArray(run.draftHistory)||run.draftHistory.length>5)fail('draft-count','No more than five upgrade drafts');
  else for(const [i,d] of run.draftHistory.entries())if(!Array.isArray(d)||d.length!==3||!unique(d)||d.some(x=>!contract.perkIds.includes(x)))fail('draft-offers',`Draft ${i+1} invalid`);
  if((run.draftHistory||[]).length>0&&JSON.stringify(run.draftHistory[0])!==JSON.stringify(contract.firstPerkOffer))fail('first-draft','First draft must have exact curated offers');
  if(!Array.isArray(run.pickedPerks)||run.pickedPerks.length>5)fail('perk-picks','No more than five picks');
  for(const [id,level] of Object.entries(run.perkLevels||{}))if(!contract.perkIds.includes(id)||!Number.isInteger(level)||level<0||level>2)fail('perk-level',`${id} level ${level} invalid`);
  const picks=Object.values(run.perkLevels||{}).reduce((a,b)=>a+b,0);
  if(Array.isArray(run.pickedPerks)&&picks!==run.pickedPerks.length)fail('perk-accounting','Perk levels must equal committed picks');
  if(!Number.isInteger(run.printerBoltsRemoved)||run.printerBoltsRemoved<0||run.printerBoltsRemoved>3)fail('printer-bolts','Printer has three actual bolt transitions');
  if(!Number.isInteger(run.quotaBoltsRemoved)||run.quotaBoltsRemoved<0||run.quotaBoltsRemoved>3)fail('quota-bolts','Quota has three actual bolt transitions');
  if(run.status==='victory'&&(run.printerBoltsRemoved!==3||run.quotaBoltsRemoved!==3))fail('boss-bypass','Victory without both bosses fully countered');
  const packets=run.quotaBonusPacketOutcomes||{};
  for(const [id,outcome] of Object.entries(packets))if(!EXPECTED.packets.includes(id)||!['file','cool','expired'].includes(outcome))fail('packet-invalid',`${id} ${outcome}`);
  if(!Number.isInteger(run.quotaPressure)||run.quotaPressure<0||run.quotaPressure>2)fail('pressure','Quota pressure must remain 0..2');
  const given=run.licenceTokensGiven,saved=run.savedLicenceDollars;
  if(![0,1,2].includes(given)||![0,40,80].includes(saved))fail('licence-values','Invalid token or cash amount');
  if(run.completedCardIds?.includes('T4')&&40*given+saved!==80)fail('licence-conservation','2 x $40 not conserved after T4 completion');
  for(const key of ['workersEncountered','workersHelped','correctResolvedActions','wrongResolvedActions','notificationsEncountered','safeNotificationsHandled'])if(!finite(run[key]))fail('count-invalid',key);
  if(run.workersHelped>run.workersEncountered)fail('workers-invented','Saved workers exceed workers actually encountered');
  if(run.safeNotificationsHandled>run.notificationsEncountered)fail('notices-invented','Safely handled notices exceed those encountered');
  if(run.completedCardIds?.includes('P1')&&run.chartFacts&&(run.chartFacts.before!==1240||run.chartFacts.after!==1280))fail('falsified-chart','Chart must retain 1240 → 1280');
  const committed=(run.eventLedger||[]).filter(e=>e.committed);
  if(!unique(committed.map(e=>e.id)))fail('ledger-id','Duplicate committed event IDs');
  if(committed.some(e=>e.synthetic&&(e.kind==='manual-action'||e.kind==='clean-streak'||e.kind==='time-bank')))fail('synthetic-credit','Synthetic perk action credited as manual work');
  const resolutionKeys=committed.filter(e=>e.kind==='card-complete').map(e=>e.encounterId);
  if(!unique(resolutionKeys))fail('ledger-completion','A card resolved more than once in committed ledger');
  const packetKeys=committed.filter(e=>e.kind==='quota-bonus').map(e=>e.objectId);
  if(!unique(packetKeys))fail('ledger-packet','Bonus packet resolved more than once in committed ledger');
  if(run.endingSnapshot){const score=calculateScores(run,contract);
    if(!almost(run.endingSnapshot.corporate,score.corporate)||!almost(run.endingSnapshot.people,score.people))fail('score-mismatch',`Computed ${score.corporate}/${score.people}; displayed ${run.endingSnapshot.corporate}/${run.endingSnapshot.people}`);
  }
  return errors;
}

/** Runs a true supplied deck generator, if supplied, rather than claiming mock seeds tested production. */
export function auditSeedGenerator(makeDeck,contract,count=1000) {
  const failures=[];const coverage=new Set();let reproducible=true;
  for(let seed=0;seed<count;seed++){
    const a=makeDeck(seed),b=makeDeck(seed);
    if(JSON.stringify(a)!==JSON.stringify(b))reproducible=false;
    const issues=auditDeck(a,contract);
    if(issues.length)failures.push({seed,issues});
    if(Array.isArray(a))for(const id of a)coverage.add(id);
  }
  return {seedCount:count,pass:failures.length===0&&reproducible&&EXPECTED.cards.every(x=>coverage.has(x)),reproducible,coverage:[...coverage].sort(),failures:failures.slice(0,20),totalFailedSeeds:failures.length};
}