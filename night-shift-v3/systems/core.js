/** Night Shift v3 data rules. Browser-native, deterministic, no global RNG. */
export const DEPARTMENTS = Object.freeze(['intake','services','pr','staff']);
export const CARDS = Object.freeze([
  ['I1','intake','STAMP GOOD!',18000],['I2','intake','SHRED THE SPAM!',12000],['I3','intake','CLOSE THE SCAMS!',12000],['I4','intake','COPY THAT!',13000],
  ['S1','services','FILE FRENZY!',14000],['S2','services','SAVE THE COFFEE!',14000],['S3','services','UNJAM IT!',12000],['S4','services','FIX THE CABLE!',13000],
  ['P1','pr','RESET THE SCALE!',14000],['P2','pr','POP-UP PURGE!',12000],['P3','pr','HOLD THE SLIDE!',12000],['P4','pr','HEADLINE OR CONTEXT?',14000],
  ['T1','staff','GET THEM OUT!',14000],['T2','staff','CLEAR THE EXIT!',12000],['T3','staff','CLOCK OUT!',12000],['T4','staff','PASS THE TOOLS!',14000]
].map(([id,department,imperative,authoredReferenceMs])=>Object.freeze({id,department,imperative,authoredReferenceMs})));
export const CARD_BY_ID = Object.freeze(Object.fromEntries(CARDS.map(c=>[c.id,c])));
export const FIRST_DECK = Object.freeze(['I1','I2','I3','S1','S2','S3','P1','P2','P4','T1','T4','T3']);
export const PERKS = Object.freeze(['carbon-copy','chain-stamp','bank-shot','magnet-grip','mira-backup','safety-net','time-bank','focus-lens']);
export const FIRST_DRAFT = Object.freeze(['carbon-copy','bank-shot','mira-backup']);
export const SYNERGIES = Object.freeze([
  ['carbon-copy','chain-stamp'],['carbon-copy','time-bank'],['bank-shot','magnet-grip'],['bank-shot','chain-stamp'],
  ['mira-backup','safety-net'],['mira-backup','time-bank'],['focus-lens','time-bank'],['focus-lens','safety-net']
].map(pair=>Object.freeze(pair)));
export const DIRECTIVES = Object.freeze(['fast-or-safe','moving-goalposts','sponsored-workflow','mandatory-collaboration','double-entry']);
export const BONUS_PACKETS = Object.freeze(['quota:p1:b1','quota:p2:b1','quota:p3:b1','quota:p3:b2']);
export const ADAPTERS = Object.freeze({
  'double-entry': Object.freeze({services:['S1','S3','S4'],pr:['P1','P4'],staff:['T1','T4'],printer:true,quota:true}),
  'moving-goalposts': Object.freeze({services:['S1','S2','S3','S4'],pr:['P1','P2','P4'],staff:['T1','T2','T4'],printer:true,quota:true}),
  'fast-or-safe': Object.freeze({services:['S1','S2','S3'],pr:['P1','P3','P4'],staff:['T1','T3','T4'],printer:true,quota:true}),
  'sponsored-workflow': Object.freeze({services:['S2','S3','S4'],pr:['P1','P2','P4'],staff:['T1','T3','T4'],printer:true,quota:true}),
  'mandatory-collaboration': Object.freeze({services:['S2','S3','S4'],pr:['P1','P3','P4'],staff:['T1','T2','T4'],printer:true,quota:true})
});
// Each tag corresponds to a real authored affordance, not speculative rarity.
export const ACTIVATION = Object.freeze({
  'carbon-copy':['I1','I4','S1','P2','P4','T2','T4','printer','quota'],
  'chain-stamp':['I1','I4','S1','P1','P3','T2','printer','quota'],
  'bank-shot':['I2','S1','P2','T2','T4','printer','quota'],
  'magnet-grip':['I2','I4','S1','S2','P1','P3','T1','T4','printer','quota'],
  'mira-backup':['S2','P2','P4','T1','T4','printer','quota'],
  'safety-net':['I1','I2','I3','I4','S1','S2','S3','S4','P1','P2','P3','P4','T1','T2','T3','T4','printer','quota'],
  'time-bank': CARDS.map(c=>c.id).concat(['printer','quota']),
  'focus-lens':['I1','I3','S3','S4','P1','P2','P4','T1','T3','printer','quota']
});
function uint32(n){return Number(n)>>>0;}
export function makeRng(seed){let state=uint32(seed);return()=>{state=(state+0x6d2b79f5)>>>0;let x=state;x=Math.imul(x^(x>>>15),x|1);x^=x+Math.imul(x^(x>>>7),x|61);return ((x^(x>>>14))>>>0)/4294967296;};}
export function shuffle(items,rng){const out=[...items];for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[j],out[i]]=[out[i],out[j]];}return out;}
export function createDeck(seed,{firstRun=false}={}){
  if(firstRun)return [...FIRST_DECK];
  const rng=makeRng(uint32(seed)^0x453e19ab);
  return ['I1',...shuffle(['I2','I3','I4'],rng).slice(0,2),...shuffle(['S1','S2'],rng),shuffle(['S3','S4'],rng)[0],
    'P1',shuffle(['P2','P3'],rng)[0],'P4','T1',...shuffle(['T2','T3'],rng).slice(0,1),'T4'];
}
export function validateDeck(deck){
  if(!Array.isArray(deck)||deck.length!==12||new Set(deck).size!==12||deck.some(id=>!CARD_BY_ID[id]))return false;
  if(deck[0]!=='I1'||!['S1','S2'].every(id=>deck.slice(3,5).includes(id))||!['S3','S4'].includes(deck[5]))return false;
  if(deck[6]!=='P1'||deck[8]!=='P4'||!['P2','P3'].includes(deck[7]))return false;
  if(deck[9]!=='T1'||!['T2','T3'].includes(deck[10])&&!['T2','T3'].includes(deck[11])||deck[11]!=='T4'&&deck[10]!=='T4')return false;
  return DEPARTMENTS.every((department,index)=>deck.slice(index*3,index*3+3).every(id=>CARD_BY_ID[id].department===department));
}
export function buildStages(deck){if(!validateDeck(deck))throw Error('invalid 12-card GDD topology');return [...deck.slice(0,3).map(id=>({type:'card',id})),{type:'promotion',slot:0},...deck.slice(3,6).map(id=>({type:'card',id})),{type:'promotion',slot:1},{type:'boss',id:'printer'},{type:'promotion',slot:2},...deck.slice(6,9).map(id=>({type:'card',id})),{type:'promotion',slot:3},...deck.slice(9,12).map(id=>({type:'card',id})),{type:'promotion',slot:4},{type:'boss',id:'quota'}];}
function compatible(directive,encounters,department){return encounters.filter(id=>ADAPTERS[directive][department].includes(id)).length>=2;}
export function validateSchedule(schedule,deck){
  if(!validateDeck(deck)||!Array.isArray(schedule)||schedule.length!==5||new Set(schedule).size!==5||schedule.some(d=>!DIRECTIVES.includes(d)))return false;
  return compatible(schedule[0],deck.slice(3,6),'services')&&ADAPTERS[schedule[1]].printer&&compatible(schedule[2],deck.slice(6,9),'pr')&&compatible(schedule[3],deck.slice(9,12),'staff')&&ADAPTERS[schedule[4]].quota;
}
export function assignDirectives(seed,deck,{firstRun=false}={}){
  if(!validateDeck(deck))throw Error('invalid deck');
  if(firstRun)return [...DIRECTIVES];
  const rng=makeRng(uint32(seed)^0xcafefade);
  // Shuffle valid distinct permutations without consuming nondeterministic wall clock.
  const options=shuffle(DIRECTIVES,rng);const used=new Set(),result=[];
  function backtrack(slot){if(slot===5)return true;
    for(const d of options){if(used.has(d))continue;
      if(slot===0&&!compatible(d,deck.slice(3,6),'services'))continue;
      if(slot===2&&!compatible(d,deck.slice(6,9),'pr'))continue;
      if(slot===3&&!compatible(d,deck.slice(9,12),'staff'))continue;
      used.add(d);result.push(d);if(backtrack(slot+1))return true;result.pop();used.delete(d);
    }return false;}
  if(!backtrack(0))throw Error('no valid directive schedule');return result;
}
function nextTwo(stages,slot){const i=stages.findIndex(s=>s.type==='promotion'&&s.slot===slot);return stages.slice(i+1).filter(s=>s.type==='card'||s.type==='boss').slice(0,2).map(s=>s.id);}
export function makeDraft(seed,slot,levels,deck,{firstRun=false}={}){
  if(!Number.isInteger(slot)||slot<0||slot>4)throw Error('invalid promotion slot');
  if(!validateDeck(deck))throw Error('invalid deck');
  const owned=PERKS.filter(p=>(levels[p]||0)>0);const lookahead=nextTwo(buildStages(deck),slot);
  const legal=PERKS.filter(p=>(levels[p]||0)<2&&ACTIVATION[p].some(tag=>lookahead.includes(tag)));
  if(legal.length<3)throw Error('insufficient legal opportunities');
  if(slot===0)return [...FIRST_DRAFT];
  const rng=makeRng((uint32(seed)+Math.imul(slot,0x9e3779b1))^0x9ab67321);
  const shuffled=shuffle(legal,rng);
  const synergy=shuffled.filter(p=>owned.some(o=>SYNERGIES.some(pair=>pair.includes(o)&&pair.includes(p)&&o!==p)));
  const outside=shuffled.filter(p=>!owned.some(o=>SYNERGIES.some(pair=>pair.includes(o)&&pair.includes(p)&&o!==p)));
  const selected=[];
  if(slot>=2&&synergy.length)selected.push(synergy[0]);
  if(slot>=2&&outside.length&&!selected.includes(outside[0]))selected.push(outside[0]);
  for(const p of shuffled)if(selected.length<3&&!selected.includes(p))selected.push(p);
  return selected;
}
export function synergyNames(levels){return SYNERGIES.filter(([a,b])=>(levels[a]||0)>0&&(levels[b]||0)>0).map(([a,b])=>`${a}+${b}`);}