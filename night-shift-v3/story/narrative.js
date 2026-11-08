/** Pure narrative selectors. Never writes to the run, grants perks or computes scores. */
export const STORY_SOURCES = Object.freeze({
  rewards: Object.freeze({label:'Deterding et al. (2011) · gameful design',url:'https://doi.org/10.1145/2181037.2181040',why:'Why changing a task with gameful rewards matters.'}),
  attention: Object.freeze({label:'Mark, Gudith & Klocke (2008) · interruptions',url:'https://doi.org/10.1145/1357054.1357072',why:'Interruptions changed work pace and reported stress; accuracy was not uniformly worse.'}),
  expression: Object.freeze({label:'Bogost (2007) · Persuasive Games',url:'https://mitpress.mit.edu/9780262026147/persuasive-games/',why:'Rules can make an argument without a lecture.'}),
  microgames: Object.freeze({label:'Gingold (2005) · WarioWare',url:'https://www.gamestudies.org/0501/gingold/',why:'Rapidly changing microgame gestures and the pleasure of discovery.'})
});

export const PERK_STORY = Object.freeze({
  'perk:carbon-copy':{name:'CARBON COPY',object:'Duplicator',effect:'Produce a visible spare legitimate paper after a clean action.',before:'ONE PAPER',after:'GHOST COPY'},
  'perk:chain-stamp':{name:'CHAIN STAMP',object:'Stamp assembly',effect:'Link nearby valid targets after clean hits.',before:'SINGLE HIT',after:'INK CHAIN'},
  'perk:bank-shot':{name:'BANK SHOT',object:'Desk bumper',effect:'Ricochet a fling into a target around an obstacle.',before:'BLOCKED ROUTE',after:'BANK ROUTE'},
  'perk:magnet-grip':{name:'MAGNET GRIP',object:'Magnetic glove',effect:'Catch wider and visibly correct a near-miss release.',before:'MISS',after:'SNAP TO TARGET'},
  'perk:mira-backup':{name:'MIRA BACKUP',object:'Walkie-talkie',effect:'Mira visibly rescues an item or shields a mistake.',before:'DROPPED',after:'MIRA CATCH'},
  'perk:safety-net':{name:'SAFETY NET',object:'Desk umbrella',effect:'Deploy a real cushion to catch a hazard.',before:'IMPACT',after:'BOUNCE SAFE'},
  'perk:time-bank':{name:'TIME BANK',object:'Overtime clock',effect:'Store unused card seconds; tap the clock to spend them.',before:'TIME LOST',after:'RESERVE TIME'},
  'perk:focus-lens':{name:'FOCUS LENS',object:'Inspector loupe',effect:'Scan a hazard or scam to reveal its real behaviour.',before:'UNKNOWN',after:'TARGET REVEALED'}
});

export const DIRECTIVE_STORY = Object.freeze({
  'fast-or-safe': {label:'FAST OR SAFE',headline:'WE OFFER FLEXIBILITY!',hint:'A quick narrow route and a roomy safer route now coexist.',symbol:'↔'},
  'moving-goalposts': {label:'MOVING GOALPOSTS',headline:'OUR TARGETS HAVE EVOLVED!',hint:'Watch the target change rails before your next move.',symbol:'⇆'},
  'sponsored-workflow': {label:'SPONSORED WORKFLOW',headline:'HELP IS NOW AD-SUPPORTED!',hint:'Real help and counterfeit ads appear together. Check the sender.',symbol:'✳'},
  'mandatory-collaboration': {label:'MANDATORY COLLABORATION',headline:'TEAMWORK IS A PERFORMANCE METRIC!',hint:'Staff assistance opens a different route; solo play still works.',symbol:'◎'},
  'double-entry': {label:'DOUBLE ENTRY',headline:'ONE FORM. TWO FORMS. PRODUCTIVITY!',hint:'A linked confirmation must visibly follow an eligible document.',symbol:'▣'}
});

const MAIL = [
  {from:'FINCH · DIRECTOR OF PRODUCTIVITY',address:'finch@aster.internal',subject:'Congratulations. Your quota has been promoted.',body:'You did the work. We did the celebrating. Attached is one genuinely useful piece of equipment.'},
  {from:'FINCH · INCIDENT APPRECIATION',address:'finch@aster.internal',subject:'Printer safety is now an optional feature.',body:'Your excellent work has achieved critical mechanical instability. Please accept this upgrade before the printer accepts you.'},
  {from:'MIRA · OPERATIONS',address:'mira@aster.internal',subject:'Please read the sender, not just the button.',body:'The office survived its first machine incident. The next department makes pictures out of numbers. Keep your eyes open.'},
  {from:'FINCH · PUBLIC RELATIONS',address:'finch@aster.internal',subject:'The graph is beautiful. The axis is flexible.',body:'Nobody changed a number. That does not mean everybody saw the whole picture. One more upgrade is attached.'},
  {from:'MIRA · BEFORE YOU CLOCK OUT',address:'mira@aster.internal',subject:'That machine has all our promotions inside it.',body:'You helped build it. I can hold a door if you make the opening. Grab one last tool and finish this.'}
];

function seen(run,id){return Array.isArray(run?.completedCardIds)&&run.completedCardIds.includes(id)}
export function promotionNarrative({index,run={},directive}={}){
  if(!Number.isInteger(index)||index<1||index>5)throw new RangeError('Promotion index must be 1–5');
  const m=MAIL[index-1],changes=[];
  if(index===2&&seen(run,'S2'))changes.push(run.workstationIntact===true?'Mira’s workstation stayed dry. She has the good stapler.':run.workstationIntact===false?'Mira’s workstation needs repairs after the spill.':'Mira’s workstation outcome is still being checked.');
  if(index===3&&Number(run.notificationsEncountered)>0)changes.push(`Notifications handled: ${Number(run.safeNotificationsHandled)||0} of ${run.notificationsEncountered}.`);
  if(index===4&&seen(run,'P4')&&['headline','context'].includes(run.publicRelationsFrame))changes.push(run.publicRelationsFrame==='headline'?'The headline went out first. The next staff task gets your priority pass.':'Context accompanied the headline. You have a final-machine warning card.');
  if(index===5&&seen(run,'T4')&&Number.isInteger(run.licenceTokensGiven))changes.push(`${run.licenceTokensGiven} of 2 software licences delivered to staff.`);
  const rule=DIRECTIVE_STORY[directive]??null;
  return Object.freeze({...m,index,changes:Object.freeze(changes),directive:rule,source:index===1?STORY_SOURCES.rewards:index===3?STORY_SOURCES.attention:null});
}

function finiteScore(n,label){if(!Number.isFinite(n)||n<0||n>100)throw new RangeError(`Frozen ${label} score required (0–100)`);return n;}
function scoreOf(snapshot,names){for(const name of names){if(Object.hasOwn(snapshot,name)&&typeof snapshot[name]==='number')return snapshot[name];}return undefined;}
export function receiptNarrative({run={},snapshot}={}){
  if(!snapshot||typeof snapshot!=='object')throw new TypeError('Immutable endingSnapshot is required');
  const official=finiteScore(scoreOf(snapshot,['officialQuota','corporate','quota','official']),'Official QUOTA');
  const people=finiteScore(scoreOf(snapshot,['peopleQuality','people','quality']),'People & Quality');
  const highOfficial=official>=80, highPeople=people>=80;
  const line=highOfficial?(highPeople?'Employee of the Day. Please stop making the rest of us look functional.':'Record productivity! Your colleagues have filed a missing-chairs report.'):(highPeople?'You missed the target. Everybody made it home. The target is under review.':'A catastrophic shift. The printer is requesting hazard pay.');
  const title=official>=85?'EMPLOYEE OF THE DAY':official>=70?'EMPLOYEE OF THE WEEK CANDIDATE':'PROVISIONAL EMPLOYEE';
  const packets=run.quotaBonusPacketOutcomes&&typeof run.quotaBonusPacketOutcomes==='object'?Object.values(run.quotaBonusPacketOutcomes):[];
  const filing=packets.filter(v=>v==='file').length,cooling=packets.filter(v=>v==='cool').length;
  const facts=[];
  if(packets.length)facts.push(`${filing} FILED · ${cooling} COOLED${packets.filter(v=>v==='expired').length?` · ${packets.filter(v=>v==='expired').length} EXPIRED`:''}`);
  if(seen(run,'T4')&&Number.isInteger(run.licenceTokensGiven))facts.push(`${run.licenceTokensGiven} OF 2 SOFTWARE LICENCES DELIVERED`);
  if(seen(run,'S2')&&run.workstationIntact===false)facts.push('MIRA’S WORKSTATION WAS INTERRUPTED');
  if(seen(run,'P4')&&['headline','context'].includes(run.publicRelationsFrame))facts.push(`PRESS FRAME: ${run.publicRelationsFrame.toUpperCase()}`);
  if(Number.isInteger(run.overtimeTicks)&&run.overtimeTicks>0)facts.push(`${run.overtimeTicks} OVERTIME TICKS`);
  if(run.continueUsed===true)facts.push('UNION BREAK CONTINUE USED');
  if(run.mode==='practice')facts.push('PRACTICE SHIFT');
  const components=snapshot.components??snapshot.breakdown??{};
  return Object.freeze({official,people,title,line,facts:Object.freeze(facts),components,source:STORY_SOURCES.expression});
}

export function validateOffers(offers){
  if(!Array.isArray(offers)||offers.length!==3)throw new TypeError('SYSTEMS must supply exactly three offers');
  const ids=offers.map(x=>typeof x==='string'?x:x?.id);
  if(ids.some(id=>!PERK_STORY[id])||new Set(ids).size!==3)throw new TypeError('Offers must be three distinct canonical perk IDs');
  return ids;
}