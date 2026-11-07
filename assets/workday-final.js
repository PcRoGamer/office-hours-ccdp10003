/* OFFICE HOURS / WORKDAY 2D EXPANSION
   A companion interaction layer for the original 2D release. Office tasks are
   genuine player choices. The original deterministic reducer still handles
   rewards, research beats, combat, shop, policies and saves.
   No new library dependencies. */
(function(){
'use strict';
const SAVE='office-hours-workday-v1', GAME='office-hours-game-state-v3';
const tasks=[
 {kind:'sheets',app:'Sheets',title:'Expense reimbursements',dept:'ACCOUNTING',sender:'MIRA / ACCOUNTING',blurb:'Welcome to a workplace that scores everything. Start with three easy claims. What happens when the score becomes the job?',tag:'REIMBURSEMENTS'},
 {kind:'word',app:'Writer',title:'Rewrite the staff notice',dept:'PEOPLE OPERATIONS',sender:'PEOPLE OPERATIONS',blurb:'Your supervisor wants a cheerful memo. Two claims are misleading. Decide what the official record says.',tag:'STAFF NOTICE'},
 {kind:'people',app:'Applicants',title:'Review applications',dept:'HUMAN RESOURCES',sender:'RECRUITMENT DESK',blurb:'Three candidates, one records-coordinator position. Evaluate evidence, not prestige.',tag:'HIRING ROUND'},
 {kind:'word',app:'Writer',title:'Licence allocation memo',dept:'INFORMATION SYSTEMS',sender:'IT HELPDESK',blurb:'Accurate totals do not tell the board who loses access. Write the recommendation.',tag:'LICENCE POLICY'},
 {kind:'slides',app:'Slides',title:'Build the engagement deck',dept:'MARKETING',sender:'CAMPAIGN TEAM',blurb:'What gets shown changes what gets rewarded. Present evidence, not just applause.',tag:'BOARD PRESENTATION'},
 {kind:'archive',app:'Case Files',title:'Assemble the executive dossier',dept:'EXECUTIVE OFFICE',sender:'MIRA / PERSONNEL',blurb:'Bring only three records to final review. Four legitimate perspectives are available; one must be left out.',tag:'FINAL BOARD PACK'}
];
const documents={
 1:{title:'Night Shift Participation',by:'People Operations / internal notice',prompts:[
  {key:'wellbeing',label:'Participation policy',question:'The original claims wellness software must run after-hours.',choices:[{id:'truth',title:'Volunteer during paid time',detail:'Participation is optional and scheduled as paid work.',text:'Wellness sessions are optional and take place during paid hours.'},{id:'spin',title:'Call overtime a benefit',detail:'Treat unpaid hours as an opportunity for higher scores.',text:'High-performing employees voluntarily remain online after hours to improve their wellness score.'}]},
  {key:'delay',label:'Late departures',question:'The draft blames employees for routinely leaving late.',choices:[{id:'truth',title:'Report a staffing issue',detail:'Record that workload and staffing affect clock-out times.',text:'Repeated late clock-outs should trigger a workload and staffing review.'},{id:'spin',title:'Blame individual focus',detail:'Describe delayed departures as a personal shortcoming.',text:'Late departures indicate employees should improve their focus habits.'}]}
 ],intro:'Aster aims to make work feel rewarding. Rewards do not replace an accurate statement of work expectations.',outro:'Please acknowledge the policies using the correct payroll and scheduling procedure.'},
 3:{title:'Software Access Decision',by:'IT Service Desk / management memorandum',prompts:[
  {key:'licences',label:'Seat allocation',question:'Only one recommendation can go to the board.',choices:[{id:'protect',title:'Maintain staff access',detail:'Higher cost, fewer disruptions to essential work.',text:'Renew the necessary staff seats even though the quarter misses its savings target.'},{id:'cut',title:'Meet the licence target',detail:'Fewer seats, immediate savings, added constraints.',text:'Reduce licensed seats to meet this quarter’s savings target.'}]},
  {key:'risk',label:'Describe the impact',question:'The business case needs a statement about the consequences.',choices:[{id:'truth',title:'Disclose the service risk',detail:'Document queues, access gaps, and shared-machine time.',text:'The reduced-seat scenario may slow support work and increase sharing of essential tools.'},{id:'spin',title:'Omit employee friction',detail:'Emphasise the favourable quarterly expense line.',text:'The budget improvement requires no operational caveat.'}]}
 ],intro:'Three essential products are up for renewal. The current budget target cannot be met without a service trade-off.',outro:'The board receives this memo before the licence allocation is filed.'}
};
const candidates=[
 {id:'A',name:'Applicant A',subtitle:'Portfolio-heavy résumé',years:'3 years',skills:'Presentation design, vendor demos, polished dashboards',proof:'Excellent slides; cannot show a reconciled ledger or source corrections.',risk:'Limited evidence of confidential records handling.',score:1},
 {id:'B',name:'Applicant B',subtitle:'Community administration',years:'2 years',skills:'Payroll audit, spreadsheet formulas, record corrections',proof:'Supplied an anonymised correction log and reconciliation example.',risk:'Fewer prestige credentials, but meets every essential criterion.',score:3},
 {id:'C',name:'Applicant C',subtitle:'Executive office internship',years:'1 year',skills:'Scheduling, automated reporting, KPI dashboards',proof:'Strong with templated reports; reference notes avoid describing errors.',risk:'No documented experience challenging questionable totals.',score:2}
];
const slideChoices=[
 {id:'claim',title:'Slide 1 · The claim',question:'What should the opening say?',options:[{id:'truth',label:'Engagement rose, but what did it cost?',detail:'Opens the important question rather than claiming causation.'},{id:'spin',label:'Record engagement this quarter',detail:'Uses the largest number, but does not say how much value it created.'}]},
 {id:'proof',title:'Slide 2 · The evidence',question:'What belongs in the centre?',options:[{id:'truth',label:'Show refunds beside gross clicks',detail:'Presents outcomes and costs together without disguising the scale.'},{id:'spin',label:'Lead with growth in total clicks',detail:'Supports a growth target, but excludes refunds and outcomes.'}]},
 {id:'conclusion',title:'Slide 3 · The decision',question:'What should the board do next?',options:[{id:'truth',label:'Audit incentives before scaling',detail:'The next step follows from the evidence.'},{id:'spin',label:'Expand the winning campaign',detail:'The short-term score rises; interruptions and complaints may also rise.'}]}
];
const assets=[
 {id:'finance',name:'Finance reconciliation',detail:'Verified reimbursement and supplier totals.',type:'VERIFIED'},
 {id:'staff',name:'Workforce & access record',detail:'Headcount and the licensing trade-off.',type:'VERIFIED'},
 {id:'campaign',name:'Campaign evidence',detail:'Engagement claims and what they omit.',type:'VERIFIED'},
 {id:'testimony',name:'Worker testimony',detail:'Fourteen anonymous accounts, dated and corroborated. A voluntary sample cannot represent everyone.',type:'ATTESTED'}
];
const sources={
 0:['Game rewards and motivation','https://doi.org/10.1108/JWL-09-2024-0193'],
 1:['Economies and incentives · CCDP lecture','https://canvas.lms.unimelb.edu.au/courses/239834/modules'],
 2:['Game rules as arguments · Bogost','https://mitpress.mit.edu/9780262026147/persuasive-games/'],
 3:['MDA: Mechanics create consequences','https://aaai.org/papers/ws04-04-001-mda-a-formal-approach-to-game-design-and-game-research/'],
 4:['The cost of interrupted work','https://doi.org/10.1145/1357054.1357072'],
 5:['Game economies · CCDP course','https://canvas.lms.unimelb.edu.au/courses/239834/modules']
};

// The argument is carried in actions and sources, not in a mandatory essay.
const openingResearch=[
 ['Workplace gamification: evidence and limits','https://doi.org/10.1108/JWL-09-2024-0193'],
 ['Interruption research: speed versus stress','https://doi.org/10.1145/1357054.1357072']
];
function sourceBadge(q){
 const e=sources[Math.max(0,Math.min(5,q))];
 return `<div class="ow-source-strip"><span>WHY THESE RULES?</span><a href="${safeLink(e[1])}" target="_blank" rel="noopener noreferrer">${escapeHTML(e[0])} ↗</a></div>`;
}
function auditConsequences(){
 const a=save.decisions||{},w=a[1]||{},h=a[2]||{},it=a[3]||{},sl=a[4]||{},pack=a[5]||{};
 let integrity=0,heat=0,checks=0;
 function assess(v,truth){if(v===undefined||v===null)return;checks++; if(truth){integrity++;}else{heat++;}}
 assess(w.wellbeing,w.wellbeing==='truth');assess(w.delay,w.delay==='truth');
 assess(h.applicant,h.applicant==='B');assess(h.privacy,h.privacy==='secure');
 assess(it.licences,it.licences==='protect');assess(it.risk,it.risk==='truth');
 for(const k of ['claim','proof','conclusion'])assess(sl[k],sl[k]==='truth');
 assess(sl.policy,sl.policy==='disclose');
 if(selectedEvidence(pack).length===3)assess(selectedEvidence(pack).join(','),true);
 return {integrity,heat,checks};
}
function consequenceRibbon(){const x=auditConsequences();
 if(!x.checks)return '';
 return `<div class="ow-impact-bar" aria-label="Consequences of your decisions"><span>RECORD INTEGRITY <b>${x.integrity}</b></span><span>MANAGEMENT HEAT <b>${x.heat}</b></span><small>Every filed choice changes the record.</small></div>`;
}
function archiveRecord(a){
 const h=save.decisions?.[2]||{},sl=save.decisions?.[4]||{};
 if(a.id==='staff'&&(h.applicant!=='B'||h.privacy!=='secure'))return {type:'REVIEW',detail:'Recruitment and data handling leave this staff record partly contested.'};
 if(a.id==='campaign'&&(!['claim','proof','conclusion'].every(k=>sl[k]==='truth')))return {type:'CONTESTED',detail:'Some campaign context was omitted from the board deck.'};
 return a;
}
function slideGraph(k,selected,audited=false){
 // Numbers are fictional Aster Corp game data. Bars illustrate how visual baselines persuade.
 if(k!==1)return `<div class="ow-slide-aside">${k===0?'A reward loop makes an attractive headline. What does it leave out?':'Your recommendation will shape the next shift, not only this presentation.'}</div>`;
 if(!selected)return `<div class="ow-slide-aside">Choose a claim to reveal its supporting chart. The same numerical evidence can tell two different stories.</div>`;
 const truthful=selected==='truth';
 // The selective board deck exaggerates 1240 -> 1280; a zero baseline reveals 3.2% growth.
 const bars=truthful?[['Clicks',100,'1,280'],['Qualified',8.75,'112'],['Refunds',2.97,'38']]:
    audited?[['Previous',96.875,'1,240'],['Current',100,'1,280']]:[['Previous',67,'1,240'],['Current',98,'1,280']];
 const note=truthful?'All three figures count events on a zero-based scale. A click is not a qualified outcome, and neither proves value.':
    audited?'Zero-based comparison: 1,240 to 1,280 is 40 more clicks, or about 3.2% growth. Refunds and outcomes are still missing.':
    'The board chart truncates its visual baseline. It exaggerates a 3.2% difference and omits refunds and useful outcomes.';
 return `<div class="ow-chart" aria-label="${truthful?'Contextual campaign figures':audited?'Zero-baseline engagement comparison':'Truncated-baseline engagement comparison'}"><div class="ow-chart-title">ASTER INTERNAL SAMPLE · FICTIONAL DATA · ${truthful||audited?'ZERO BASELINE':'TRUNCATED SCALE'}</div>${bars.map(([name,w,val])=>`<div class="ow-chart-row"><label>${name}</label><div class="ow-chart-track"><i style="width:${w}%"></i></div><b>${val}</b></div>`).join('')}<small>${note}</small></div>`;
}
const escapeHTML=(s)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeLink=(url)=>/^https:\/\//.test(url)?url:'#';
const defaultSave=()=>({version:1,seen:[],complete:{},decisions:{},lastQuest:null,reports:[],notices:[],revision:0});
let save;
try{save=JSON.parse(localStorage.getItem(SAVE)||'null')||defaultSave();if(save.version!==1)save=defaultSave()}catch(e){save=defaultSave()}
function persist(){try{localStorage.setItem(SAVE,JSON.stringify(save))}catch(e){}}
function game(){try{return JSON.parse(localStorage.getItem(GAME)||'{}')||{}}catch(e){return{}}}
let root=null,mode=null,toast=null,quest=-1,busy=false,lastNotice='',lastGameStamp='',domReady=false;
function currentTask(){return tasks[Math.max(0,Math.min(5,quest))]}
function isBlocked(){return !!document.querySelector('.reward-backdrop,.battle-panel,.final-report,.final-mask,.dc-modal,.dc-track,.dc-incoming,.dc-eval-grade,.dc-signature,.start-popup,.login-screen,.oh-flat-title')}
function desktop(){return document.querySelector('.desktop-os')}
function mount(){const d=desktop();if(!d)return false;if(!root||root.parentNode!==d){root=document.createElement('div');root.className='ow-root';root.setAttribute('aria-label','Aster workplace applications and notifications');d.appendChild(root);root.addEventListener('click',click);root.addEventListener('change',change);root.addEventListener('keydown',keyboard)}return true}
function notice(title,text,opts={}){toast={title,text,action:opts.action||'OPEN WORK',kind:opts.kind||'task'};render()}
function getState(q){if(!save.decisions[q])save.decisions[q]={};return save.decisions[q]}
function openingLabel(){const q=currentTask();return q?.app||'Work' }
function hasLogged(){return save.complete[String(quest)]}
function appFor(q){if(q===0)return'sheets';if(q===1||q===3)return'word';if(q===2)return'people';if(q===4)return'slides';return'archive'}
function open(app){if(isBlocked())return;toast=null;if(app==='sheets'){mode=null;render();const btn=document.querySelector('[data-testid="launcher-sheets"]');btn?.click();return}if(app==='archive'&&quest!==5)app='work';if(!['word','slides','people','archive','work'].includes(app))app='work';if(app!=='work'&&app!==appFor(quest))app='work';mode=app;render()}
function close(){mode=null;render()}
function notifyQuest(q){const t=tasks[q];if(!t)return;const label=`SHIFT ${String(q+1).padStart(2,'0')} / 06 · ${t.dept}`;notice(label,t.title+'  ·  '+t.blurb,{action:'OPEN '+t.app.toUpperCase()});save.seen.push(q);save.notices.unshift({title:label,text:t.title,when:'10:'+String(47+q*2).padStart(2,'0')});save.notices=save.notices.slice(0,9);persist()}
function detectQuest(){const g=game();const n=Number(g.quest);if(!Number.isFinite(n)||n<0||n>6)return;if(quest===n)return;
 const before=quest;quest=n;mode=null;toast=null;busy=false;
 if(before>=0&&n===0&&before>0){save=defaultSave();persist()}
 if(n<6&&!save.seen.includes(n))notifyQuest(n);else render();
}
function isStageVisible(){const g=game();if(g.combat||g.won||g.gameOver)return false;return !!desktop()&&!isBlocked()}
function header(app,label){return `<header class="ow-titlebar"><span class="ow-app-icon">${escapeHTML(app[0]||'▣')}</span><strong>${escapeHTML(app)} · ${escapeHTML(label)}</strong><small>ASTER OFFICE SUITE 2004</small><button type="button" data-ow="close" aria-label="Close workplace application">×</button></header>`}
function toolbar(label,detail){return `<div class="ow-toolbar"><strong>${escapeHTML(label)}</strong><span>·</span><span>${escapeHTML(detail)}</span><span class="ow-spacer"></span><span class="ow-pill">SHIFT ${quest+1} / 6</span></div>`}
function frame(app,label,toolbarText,body,footer){return `<section class="ow-window" role="dialog" aria-label="${escapeHTML(label)}" data-ow-app="${escapeHTML(mode)}">${header(app,label)}${toolbar(app,toolbarText)}${consequenceRibbon()}<div class="ow-body">${body}</div>${footer}</section>`}
function side(kicker,title,body,steps=[],tip=''){return `<aside class="ow-aside"><p class="ow-overline">${escapeHTML(kicker)}</p><h2>${escapeHTML(title)}</h2><p>${body}</p><div class="ow-steps">${steps.map((x,i)=>`<div class="ow-step ${x.done?'done':''}"><b>${x.done?'✓':i+1}</b>${escapeHTML(x.text)}</div>`).join('')}</div>${tip?`<div class="ow-note">${tip}</div>`:''}</aside>`}
function footer(label,disabled,status,extra=''){return `<footer class="ow-footer"><span>${escapeHTML(status)}</span><div style="display:flex;gap:8px">${extra}<button type="button" class="ow-action" data-ow="submit" ${disabled?'disabled':''}>${escapeHTML(label)} →</button></div></footer>`}
function viewWord(){const s=getState(quest), doc=documents[quest];if(!doc)return viewWork();const filled=doc.prompts.filter(p=>s[p.key]).length;
 const focus=Math.max(0,Math.min(1,Number(s.activeClause||0))),p=doc.prompts[focus];
 const prior=save.decisions?.[1]||{};const continuity=quest===3?(prior.wellbeing==='spin'||prior.delay==='spin'?'The earlier staff notice downplayed worker concerns; the new memo may reinforce that pattern.':prior.wellbeing==='truth'?'The earlier staff notice disclosed workload risks. Staff now expect the software decision to be equally candid.':'The board will remember what you put in writing.'):'';const body=side('DOCUMENT CONTROL',doc.title,quest===1?'The original contains misleading claims. Edit the notice by reviewing one passage at a time.':'There is no risk-free answer. Acknowledge the consequences. '+continuity,[
 {text:'Review the first highlighted claim',done:!!s[doc.prompts[0].key]},
 {text:'Review the second highlighted claim',done:!!s[doc.prompts[1].key]},
 {text:'File a defensible memo',done:false}
 ],'Watch the document change as you edit. Both honest and corporate-spin paths remain playable.');
 const txt=doc.prompts.map(p=>{const opt=p.choices.find(o=>o.id===s[p.key]);return `<p>${opt?escapeHTML(opt.text):`<em>[${escapeHTML(p.label)} · REQUIRES REVISION]</em>`}</p>`}).join('');
 const choices=`<div class="ow-clause-tabs" role="tablist" aria-label="Document clauses">${doc.prompts.map((v,i)=>`<button role="tab" aria-selected="${focus===i}" class="${focus===i?'selected':''}" data-ow="clause" data-index="${i}">CLAUSE ${i+1} ${s[v.key]?'✓':'•'}</button>`).join('')}</div><p class="ow-overline" style="margin-top:15px">${escapeHTML(p.label.toUpperCase())}</p><div class="ow-redline"><b>${escapeHTML(p.question)}</b></div><div class="ow-choice-grid">${p.choices.map(o=>`<button class="ow-option ${s[p.key]===o.id?'selected':''}" data-ow="choose" data-field="${p.key}" data-value="${o.id}" aria-pressed="${s[p.key]===o.id?'true':'false'}"><b>${escapeHTML(o.title)}</b><small>${escapeHTML(o.detail)}</small></button>`).join('')}</div><div class="ow-review ${s[p.key]?'good':''}">${s[p.key]?'✓ Changes applied to the live document.':'Select how this paragraph should appear in the official record.'}</div>`;
 const main=`<main class="ow-main"><div class="ow-app-grid" style="grid-template-columns:1fr 1fr;gap:13px"><div><div class="ow-paper"><div class="ow-paperhead"><span>ASTER CORPORATION</span><span>INTERNAL · REV ${filled}</span></div><h3>${escapeHTML(doc.title)}</h3><p>${escapeHTML(doc.intro)}</p>${txt}<p>${escapeHTML(doc.outro)}</p><div class="ow-paperhead" style="margin-top:15px;padding-top:7px;border-top:1px solid #ddd;border-bottom:0"><span>REVIEWED BY EMPLOYEE 001</span><span>${filled}/2 CLAUSES</span></div></div></div><div><p class="ow-overline">TRACK CHANGES</p>${choices}</div></div>${sourceBadge(quest)}</main>`;
 return frame('Writer',doc.title,`${filled}/2 paragraphs reviewed`,body+main,footer(quest===1?'FILE STAFF NOTICE':'FILE LICENCE MEMO',filled!==2,filled===2?'Ready for filing · the choices become part of the record.':'Two highlighted paragraphs require a decision.'))}
function viewPeople(){const s=getState(2),selected=candidates.find(c=>c.id===s.applicant),chosen=!!s.applicant;
 const body=side('PEOPLE OPERATIONS','Hiring without the hype','A candidate must handle corrections, audit trails and confidential files. The CEO has requested the applicant with the flashiest résumé.',[
 {text:'Review the role criteria',done:true},{text:'Select a candidate',done:chosen},{text:'Set the privacy policy',done:!!s.privacy}
 ],'Skills, evidence and privacy matter more than titles. Names are masked until the application is filed.');
 const cvs=`<main class="ow-main"><p class="ow-overline">POSITION: RECORDS COORDINATOR · THREE APPLICATIONS</p><div class="ow-app-grid">${candidates.map(c=>`<button type="button" data-ow="candidate" data-id="${c.id}" class="ow-cv ${selected?.id===c.id?'selected':''}" aria-pressed="${selected?.id===c.id}"><span class="ow-cv-tag">CV ${c.id} / ${escapeHTML(c.years)} EXPERIENCE</span><b>${escapeHTML(c.name)}</b><p>${escapeHTML(c.subtitle)}</p><p>${escapeHTML(c.skills)}</p></button>`).join('')}<div class="ow-cv" style="background:#e6efe7"><span class="ow-cv-tag">ROLE REQUIREMENTS</span><b>Source-based decisions</b><p>Accurate records. Formula familiarity. Ability to explain corrections. Responsible handling of private data.</p></div></div>${selected?`<div class="ow-review ${selected.score===3?'good':''}"><b>${escapeHTML(selected.name)} · EVIDENCE REVIEW</b><div>${escapeHTML(selected.proof)}</div><small>${escapeHTML(selected.risk)}</small></div>`:''}<p class="ow-overline" style="margin-top:14px">APPLICATION PRIVACY</p><div class="ow-choice-grid"><button class="ow-option ${s.privacy==='secure'?'selected':''}" data-ow="choose" data-field="privacy" data-value="secure"><b>Mask personal information</b><small>Keep decisions focused on job-related evidence.</small></button><button class="ow-option ${s.privacy==='open'?'selected':''}" data-ow="choose" data-field="privacy" data-value="open"><b>Share the full résumé bundle</b><small>Faster internal review, unnecessary personal exposure.</small></button></div>${sourceBadge(2)}</main>`;
 return frame('Applicants','Candidate selection',`${chosen?'1':'0'}/1 candidate selected`,body+cvs,footer('FILE HIRING DECISION',!s.applicant||!s.privacy,chosen?`${selected.name} selected · ${s.privacy?'privacy instruction recorded':'choose a privacy rule'}`:'Select a candidate based on the evidence.'))}
function viewSlides(){const s=getState(4),k=Math.max(0,Math.min(2,Number(s.activeSlide)||0)),slide=slideChoices[k],selected=s[slide.id],complete=slideChoices.filter(v=>s[v.id]).length;
 const body=side('ASTER PRESENTATIONS','A story changes the score','Marketing wants a deck that proves engagement is soaring. An honest presentation must distinguish gross clicks from valuable outcomes.',[
 {text:'Compose the three slides',done:complete===3},{text:'Choose how to report the results',done:!!s.policy},{text:'Present to the board',done:false}
 ],'What you leave out of a chart can become the company’s next target.');
 const main=`<main class="ow-main"><div class="ow-slide-shell"><div><div class="ow-slide" aria-label="Slide preview ${k+1}"><span class="ow-overline" style="color:#c0d1d5">ASTER QUARTERLY UPDATE</span><h3>${escapeHTML(selected?slide.options.find(o=>o.id===selected).label:'[CHOOSE THE HEADLINE]')}</h3><p>${escapeHTML(selected?slide.options.find(o=>o.id===selected).detail:'Use this slide to express one specific finding. What belongs on the page, and what must not be disguised?')}</p>${slideGraph(k,selected,!!s.chartAudit)}<div class="ow-slide-number">${k+1} / 03</div></div><p class="ow-overline" style="margin-top:12px">${escapeHTML(slide.question)}</p><div class="ow-deck-choices">${slide.options.map(o=>`<button data-ow="slide-answer" data-field="${slide.id}" data-value="${o.id}" class="${selected===o.id?'selected':''}" aria-pressed="${selected===o.id}">${escapeHTML(o.label)}</button>`).join('')}</div></div><nav class="ow-slide-nav" aria-label="Slides">${slideChoices.map((v,i)=>`<button class="${k===i?'selected':''}" data-ow="slide" data-index="${i}" aria-current="${k===i?'true':'false'}"><b>0${i+1} · ${escapeHTML(v.title.split(' · ')[1])}</b><small>${s[v.id]?'✓ Prepared':'○ Needs content'}</small></button>`).join('')}${k===1&&selected?`<div class="ow-chart-audit-row"><button type="button" data-ow="chart-audit" aria-pressed="${!!s.chartAudit}">${s.chartAudit?'SHOW BOARD DECK SCALE':'AUDIT THE CHART SCALE'}</button><small>The numbers do not change when the baseline does.</small></div>`:''}</nav></div><p class="ow-overline" style="margin-top:12px">BOARD RECOMMENDATION</p><div class="ow-choice-grid" style="margin-top:7px"><button class="ow-option ${s.policy==='disclose'?'selected':''}" data-ow="choose" data-field="policy" data-value="disclose"><b>Flag manipulative engagement</b><small>Lower headline score; stronger employee trust.</small></button><button class="ow-option ${s.policy==='ship'?'selected':''}" data-ow="choose" data-field="policy" data-value="ship"><b>Count all engagement</b><small>Higher corporate bonuses; stronger pressure loop.</small></button></div>${sourceBadge(4)}</main>`;
 return frame('Slides','Quarterly engagement deck',`${complete}/3 slides prepared`,body+main,footer('PRESENT TO BOARD',complete!==3||!s.policy,`${complete}/3 slides · ${s.policy?'recommendation selected':'recommendation required'}`))}
// Scarcity is the mechanic: all four sources are useful, none explains the entire shift.
const evidenceBlindspots=Object.freeze({
 finance:'Spending and refunds cannot be independently reconciled. Saving money is now easier to claim than to prove.',
 staff:'Staffing and access gaps disappear from the formal record. Financial savings may look cost-free.',
 campaign:'Engagement figures lack an outcomes comparison. More clicks may be mistaken for more value.',
 testimony:'No first-hand perspective reaches the board. Accurate numbers cannot show how the policy felt to employees.'
});
function selectedEvidence(record){
 const options=Array.isArray(record&&record.evidence)?record.evidence:[];
 return [...new Set(options.filter(id=>assets.some(a=>a.id===id)))].slice(0,3);
}
function missingEvidence(record){
 const chosen=selectedEvidence(record);
 return chosen.length===3?assets.find(a=>!chosen.includes(a.id)):null;
}
function evidenceFeedback(record){
 const chosen=selectedEvidence(record),missing=missingEvidence(record);
 const unsettled=chosen.filter(id=>{const a=assets.find(x=>x.id===id);return a&&['REVIEW','CONTESTED'].includes(archiveRecord(a).type)}).length;
 const note=missing?
  'Left out: '+missing.name+'. '+evidenceBlindspots[missing.id]+(unsettled?' Some included evidence is contested; its limits remain visible.':' All included sources also have limits.') :
  'Choose three of four useful records. Every packet leaves a perspective out. You can deselect a record to change your mind.';
 return '<div class="ow-review '+(missing?'good':'')+'"><b>BOARD PACK · '+chosen.length+'/3 RECORDS'+(missing?' · ONE VOICE OMITTED':'')+'</b><div>'+escapeHTML(note)+'</div></div>';
}
function viewArchive(){const s=getState(5),selected=selectedEvidence(s),missing=missingEvidence(s);
 if(JSON.stringify(s.evidence||[])!==JSON.stringify(selected)){s.evidence=selected;persist()}
 const body=side('EXECUTIVE RECORDS','What goes on the record?','The director has room for three attachments, but four defensible sources exist. Whose perspective can the board afford to exclude?',[
 {text:'Select three credible sources',done:selected.length===3},{text:'Inspect the missing perspective',done:!!missing},{text:'Prepare the incomplete board pack',done:false}
 ],'Evidence has limits. An interview sample cannot represent everyone; a financial ledger cannot speak for workers. No packet is complete.');
 const packet=`<main class="ow-main"><p class="ow-overline">CONFIDENTIAL / ATTACHMENT SELECTION</p><div class="ow-package">${assets.map(a=>{const record=archiveRecord(a);return `<button type="button" class="${selected.includes(a.id)?'selected':''}" data-ow="attachment" data-id="${a.id}" aria-pressed="${selected.includes(a.id)}"><span class="ow-overline" style="font-size:9px">${record.type}</span><b>${escapeHTML(a.name)}</b><small>${escapeHTML(record.detail)}</small></button>`}).join('')}</div>${evidenceFeedback(s)}<div class="ow-minimessage"><span><b>MIRA:</b> “If the system can decide what to reward, then you can decide what deserves a record.”</span></div><p class="ow-overline" style="margin-top:15px">REFERENCES INSIDE THE GAME</p><p>There are reasons why rewards motivate, and reasons why incentives mislead. The final boss will judge the organisation you have helped shape.</p>${sourceBadge(5)}</main>`;
 return frame('Case Files','Executive board pack',`${selected.length}/3 attachments`,body+packet,footer('SEAL THE DOSSIER',selected.length!==3,`Selection saved · ${selected.length}/3 · one source left out`))}
function viewWork(){const t=currentTask(),s=getState(quest),g=game();const body=side('WORK ORDERS',`Shift ${quest+1} of 6`,'Aster no longer runs its night shift through a mailbox. Assignments arrive as desktop alerts. The work happens in the application best suited to each job.',tasks.map((a,i)=>({text:`${i+1}. ${a.title}`,done:i<quest||!!save.complete[i]})),'Marketing metrics are not the same as meaningful work. Neither are report counts.');
 const main=`<main class="ow-main"><p class="ow-overline">CURRENT ASSIGNMENT / ${escapeHTML(t.dept)}</p><h2>${escapeHTML(t.title)}</h2><p style="font-size:13px;max-width:480px">${escapeHTML(t.blurb)}</p><div class="ow-minimessage"><span><b>${escapeHTML(t.sender)}:</b> Complete the work here. The corporation will record your decision and issue the usual reward.</span></div><p class="ow-overline" style="margin-top:15px">NOTIFICATION FEED</p><ul class="ow-history-list">${save.notices.slice(0,6).map(n=>`<li><strong>${escapeHTML(n.title)}</strong>${escapeHTML(n.text)}</li>`).join('')}</ul>${quest===0?`<section class="ow-premise"><b>WHY THIS GAME? WHY NOW?</b><p>Game-style rewards can make ordinary work engaging. But the rules decide what counts, and constant interruptions carry a cost. Tonight you are the employee and the person writing the record. Do the rewards help the work, or hide what it costs?</p><div>${openingResearch.map(([label,url])=>`<a href="${url}" target="_blank" rel="noopener noreferrer">${escapeHTML(label)} ↗</a>`).join('')}</div></section>`:''}${sourceBadge(quest)}</main>`;
 return frame('Work Queue','Shift tasks',`${g.quest||0}/6 completed`,body+main,footer('OPEN '+t.app.toUpperCase(),false,'Tasks are delivered through system notifications.'))}
function render(){if(!root)return;const active=desktop()&&!isBlocked();root.style.display=active?'block':'none';if(!active)return;
 if(busy){root.innerHTML='<div class="ow-filing" role="status"><div class="ow-filing-card"><div class="ow-filing-logo">▤</div><p>ASTER OFFICE SUITE · RECORDS DEPARTMENT</p><h2>Filing your work…</h2><span>Validating the document and recording its consequences.</span><div class="ow-filing-progress"><i></i></div></div></div>';return;}
 let app='';if(mode==='word'&&(quest===1||quest===3))app=viewWord();else if(mode==='people'&&quest===2)app=viewPeople();else if(mode==='slides'&&quest===4)app=viewSlides();else if(mode==='archive'&&quest===5)app=viewArchive();else if(mode)app=viewWork();
 const to=toast?`<div class="ow-notifier" role="status" aria-live="polite"><div class="ow-toast"><div class="ow-toast-top"><span>◈ ASTER · DESKTOP NOTIFICATION</span><button type="button" data-ow="dismiss" aria-label="Dismiss notification">×</button></div><div class="ow-toast-main"><strong>${escapeHTML(toast.title)}</strong><p>${escapeHTML(toast.text)}</p>${quest===0?`<div class="ow-toast-premise"><b>WHY NOW?</b> Game-style incentives can help work feel rewarding. But who decides what counts? <a href="${openingResearch[0][1]}" target="_blank" rel="noopener noreferrer">Rewards ↗</a> · <a href="${openingResearch[1][1]}" target="_blank" rel="noopener noreferrer">Interruptions ↗</a></div>`:''}<div class="ow-toast-actions"><button type="button" data-ow="dismiss">LATER</button><button type="button" class="primary" data-ow="open" data-app="${appFor(quest)}">${escapeHTML(toast.action)}</button></div></div></div></div>`:'';
 const dock=[['work','Tasks','☷'],['word','Writer','W'],['people','Applicants','◈'],['slides','Slides','S'],['archive','Files','▤']].map(([id,name,ic])=>`<button type="button" class="ow-launch ${mode===id?'active':''}" data-ow="open" data-app="${id}"><span class="ow-launch-icon">${ic}</span><span>${name}</span></button>`).join('');
 root.innerHTML=`<nav class="ow-dock" aria-label="Work applications">${dock}</nav>${to}${app}<button class="ow-notification-button" data-ow="open" data-app="work" aria-label="Open work queue">▣ ${quest+1}/6 · WORK QUEUE ${toast?'●':''}</button>`;
}
function click(ev){const e=ev.target.closest('[data-ow]');if(!e||!root.contains(e))return;const action=e.dataset.ow;
 if(action==='close'){close();return}if(action==='dismiss'){toast=null;render();return}if(action==='open'){const app=e.dataset.app||appFor(quest);if(mode==='work'&&e.classList.contains('ow-action'))open(appFor(quest));else open(app);return}
 if(action==='choose'){const st=getState(quest);st[e.dataset.field]=e.dataset.value;if(mode==='word'&&st.activeClause===undefined)st.activeClause=0;if(mode==='word'&&e.dataset.field===documents[quest]?.prompts[0]?.key)st.activeClause=1;persist();render();return}
 if(action==='clause'){getState(quest).activeClause=Number(e.dataset.index);persist();render();return}
 if(action==='candidate'){getState(2).applicant=e.dataset.id;persist();render();return}
 if(action==='slide'){getState(4).activeSlide=Number(e.dataset.index);persist();render();return}
 if(action==='chart-audit'){const s=getState(4);s.chartAudit=!s.chartAudit;persist();render();return}
 if(action==='slide-answer'){const s=getState(4);s[e.dataset.field]=e.dataset.value;if(Number(s.activeSlide||0)<2)s.activeSlide=Number(s.activeSlide||0)+1;else s.activeSlide=3;persist();render();return}
 if(action==='attachment'){const s=getState(5);s.evidence=selectedEvidence(s);const i=s.evidence.indexOf(e.dataset.id);if(i>=0)s.evidence.splice(i,1);else if(s.evidence.length<3)s.evidence.push(e.dataset.id);persist();render();return}
 if(action==='submit'){if(mode==='work'){open(appFor(quest));return}void submit();return}
}
function change(ev){}
function keyboard(ev){if(ev.key==='Escape'&&mode){ev.stopPropagation();close()}}
function waitFor(fn,timeout=3500){return new Promise((resolve,reject)=>{const start=performance.now();const work=()=>{let found;try{found=fn()}catch(e){}if(found){resolve(found);return}if(performance.now()-start>timeout){reject(Error('Workday bridge timed out'));return}setTimeout(work,55)};work()})}
function fillInput(node,value){const native=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;native.call(node,value);node.dispatchEvent(new Event('input',{bubbles:true}));node.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter',bubbles:true}))}
async function submit(){if(busy||quest<1||quest>5)return;const s=getState(quest),app=appFor(quest);let ok=false;
 if(app==='word')ok=documents[quest].prompts.every(p=>!!s[p.key]);
 if(app==='people')ok=!!s.applicant&&!!s.privacy;
 if(app==='slides')ok=slideChoices.every(p=>!!s[p.id])&&!!s.policy;
 if(app==='archive')ok=selectedEvidence(s).length===3;
 if(!ok){notice('COMPLETE THE WORK','The assignment still has an unanswered decision.');return}
 busy=true;mode=null;toast=null;render();
 const old=quest;
 try{
  const btn=document.querySelector('[data-testid="launcher-sheets"]');if(!btn)throw Error('Sheets launcher missing');btn.click();
  await waitFor(()=>document.querySelector('[data-testid="excel-sheet"]'));
  const op=(quest===2||quest===4)?'+':'*';
  for(let row=0;row<3;row++){
   const el=await waitFor(()=>document.querySelector(`[data-testid="total-${row}"]`));fillInput(el,`=B${row+2}${op}C${row+2}`);
   await waitFor(()=>document.querySelector('[data-testid="verified-count"]')?.textContent?.includes(`${row+1}/3`));
  }
  if(quest===3||quest===4){
   const choice=quest===3?s.licences:s.policy;const policyButton=await waitFor(()=>document.querySelector(`[data-testid="policy-choice-${choice}"]`));policyButton.click();
   await waitFor(()=>!document.querySelector('[data-testid="policy-decision"]'));
  }
  const file=await waitFor(()=>document.querySelector('button.sheet-submit'));file.click();
  await waitFor(()=>document.querySelector('.reward-backdrop')||game().quest===old+1,5500);
  save.complete[old]={app,when:Date.now(),decisions:JSON.parse(JSON.stringify(s))};save.reports.push({quest:old,title:tasks[old].title,app,decisions:JSON.parse(JSON.stringify(s))});persist();
  busy=false;mode=null;render();
 }catch(err){console.error('WORKDAY_FILING_ERROR',err);busy=false;mode=app;notice('DOCUMENT NOT FILED','The office filing system did not accept the task. Your choices are saved; select FILE again.');render()}
}
function impactSummary(){
 const a=save.decisions||{}, w=a[1]||{}, h=a[2]||{}, it=a[3]||{}, sl=a[4]||{}, pack=a[5]||{};
 const good=[];const cost=[];
 if(w.wellbeing==='truth'&&w.delay==='truth')good.push('the staff notice disclosed scheduling obligations');
 else if(w.wellbeing||w.delay)cost.push('the staff notice downplayed at least one workplace risk');
 if(h.applicant==='B')good.push('recruitment prioritised documented audit skills');
 else if(h.applicant)cost.push('recruitment prioritised a less substantiated portfolio');
 if(h.privacy==='secure')good.push('applicant information remained limited to job evidence');
 else if(h.privacy)cost.push('applicant personal information was shared beyond the necessary review');
 if(it.risk==='truth')good.push('the licence memo disclosed operational impacts');
 else if(it.risk)cost.push('the licence memo omitted a service risk');
 if(sl.claim==='truth'&&sl.proof==='truth'&&sl.conclusion==='truth')good.push('the board deck displayed costs alongside engagement');
 else if(sl.claim||sl.proof||sl.conclusion)cost.push('the board deck selectively presented engagement metrics');
 if(selectedEvidence(pack).length===3)good.push('the board received three documented sources under an explicit capacity limit');
 return {good,cost};
}
function annotateConsequences(){
 // Surface the new workday terminology in the legacy campaign without changing its reducer.
 const end=document.querySelector('.dc-eval-grade,.final-report');
 if(end){
  const walker=document.createTreeWalker(end,NodeFilter.SHOW_TEXT);let n;
  while((n=walker.nextNode())){
   if(n.nodeValue&&n.nodeValue.includes('Six reports filed'))n.nodeValue=n.nodeValue.replace('Six reports filed','Six assignments filed');
   if(n.nodeValue&&n.nodeValue.trim()==='REPORTS')n.nodeValue='TASKS';
  }
 }

 if(end&&save.reports.length>=3&&!end.querySelector('.ow-portfolio-line')){
  const x=impactSummary();const line=document.createElement('div');line.className='ow-portfolio-line';
  line.style.cssText='margin:12px 0;padding:11px 13px;border-left:3px solid #319777;background:#e6f1e6;color:#294f50;font:600 12px/1.5 Outfit,Arial,sans-serif;text-align:left';
  const assessment=auditConsequences();const label=document.createElement('strong');label.textContent=`SHIFT FILE · ${save.reports.length} WORK ASSIGNMENTS · ${assessment.integrity} EVIDENCE / ${assessment.heat} PRESSURE`;label.style.cssText='display:block;margin-bottom:5px';line.appendChild(label);
  const outcome=document.createElement('span');const absent=missingEvidence(save.decisions?.[5]);outcome.textContent=`Your shift: ${x.good.length} documented safeguards; ${x.cost.length} target-first choices. ${[...x.good,...x.cost].slice(0,2).join('; ')}. ${absent?'Board blind spot: '+absent.name+' was omitted. '+evidenceBlindspots[absent.id]:''}`;line.appendChild(outcome);const restart=[...end.querySelectorAll('button')].find(b=>/START ANOTHER SHIFT/i.test(b.textContent||''));if(restart&&restart.parentNode)restart.parentNode.insertBefore(line,restart);else end.appendChild(line)
 }
 const reward=document.querySelector('.reward-backdrop');
 if(reward&&!reward.querySelector('.ow-receipt')&&save.reports.length){
  const entry=save.reports[save.reports.length-1],s=entry.decisions||{};
  const outcome=entry.quest===1?(s.wellbeing==='truth'&&s.delay==='truth'?'The staff notice now records paid time and workload accurately.':'The notice is filed, but at least one misleading claim remains.'):
   entry.quest===2?(s.applicant==='B'?'Your chosen applicant has demonstrated audit evidence.':'Your chosen applicant has weaker documented reconciliation evidence.'):
   entry.quest===3?(s.risk==='truth'?'The licence memo records the operational cost of the budget decision.':'The budget number is filed without a full statement of operational cost.'):
   entry.quest===4?(s.claim==='truth'&&s.proof==='truth'&&s.conclusion==='truth'?'The board deck includes limitations and a recommendation to examine incentives.':'The presentation amplifies the performance score while leaving out context.'):
   entry.quest===5?(missingEvidence(s)?'The board pack is incomplete by design. Excluded: '+missingEvidence(s).name+'. '+evidenceBlindspots[missingEvidence(s).id]:'The board pack is awaiting three selected records.'):'The report has been filed.';
  const receipt=document.createElement('div');receipt.className='ow-receipt';receipt.style.cssText='background:#e3f2e9;border-left:3px solid #2a9075;padding:9px 12px;margin:10px auto;color:#2b574b;font:600 11px/1.45 Outfit,Arial,sans-serif;max-width:570px';receipt.textContent='WORKDAY RECORD · '+outcome;
  const target=reward.querySelector('div');if(target)target.appendChild(receipt)
 }
}
function reconcile(){if(!mount())return;const d=desktop();if(!d)return;
 // All previous mail windows are legacy UI. Close them rather than just covering them.
 const legacy=d.querySelector('[data-testid="window-mail"]');if(legacy){const x=legacy.querySelector('button[aria-label="Close mail"]');if(x){x.click()}}
 detectQuest();annotateConsequences();if(!isStageVisible()){root.style.display='none';return}
 if(!toast&&!mode&&quest<6&&save.seen.indexOf(quest)<0)notifyQuest(quest);
 if(root.style.display==='none')render();

}
function startup(){if(domReady)return;domReady=true;setInterval(reconcile,500);reconcile()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startup);else startup();
})();
