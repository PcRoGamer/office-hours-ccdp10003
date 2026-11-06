/* OFFICE HOURS / WORKDAY 2D EXPANSION
   A companion interaction layer for the original 2D release. Office tasks are
   genuine player choices. The original deterministic reducer still handles
   rewards, research beats, combat, shop, policies and saves.
   No new library dependencies. */
(function(){
'use strict';
const SAVE='office-hours-workday-v1', GAME='office-hours-game-state-v3';
const tasks=[
 {kind:'sheets',app:'Sheets',title:'Expense reimbursements',dept:'ACCOUNTING',sender:'MIRA / ACCOUNTING',blurb:'Three claims. Balance the ledger, then file it. The first victory should feel easy.',tag:'REIMBURSEMENTS'},
 {kind:'word',app:'Writer',title:'Rewrite the staff notice',dept:'PEOPLE OPERATIONS',sender:'PEOPLE OPERATIONS',blurb:'Your supervisor wants a cheerful memo. Two claims are misleading. Decide what the official record says.',tag:'STAFF NOTICE'},
 {kind:'people',app:'Applicants',title:'Review applications',dept:'HUMAN RESOURCES',sender:'RECRUITMENT DESK',blurb:'Three candidates, one records-coordinator position. Evaluate evidence, not prestige.',tag:'HIRING ROUND'},
 {kind:'word',app:'Writer',title:'Licence allocation memo',dept:'INFORMATION SYSTEMS',sender:'IT HELPDESK',blurb:'Accurate totals do not tell the board who loses access. Write the recommendation.',tag:'LICENCE POLICY'},
 {kind:'slides',app:'Slides',title:'Build the engagement deck',dept:'MARKETING',sender:'CAMPAIGN TEAM',blurb:'What gets shown changes what gets rewarded. Present evidence, not just applause.',tag:'BOARD PRESENTATION'},
 {kind:'archive',app:'Case Files',title:'Assemble the executive dossier',dept:'EXECUTIVE OFFICE',sender:'MIRA / PERSONNEL',blurb:'Bring three records to the final review. There is room for evidence, or a flattering leaderboard.',tag:'FINAL BOARD PACK'}
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
 {id:'claim',title:'Slide 1 · The claim',question:'What should the opening say?',options:[{id:'truth',label:'Engagement rose, but what did it cost?',detail:'Opens the important question rather than claiming causation.'},{id:'spin',label:'One million percent engagement!',detail:'Visually impressive, but unsupported and without context.'}]},
 {id:'proof',title:'Slide 2 · The evidence',question:'What belongs in the centre?',options:[{id:'truth',label:'Show refunds beside gross clicks',detail:'Presents the result and the cost on the same scale.'},{id:'spin',label:'Show clicks only, cropped axis',detail:'Produces a stronger headline, concealing the cost.'}]},
 {id:'conclusion',title:'Slide 3 · The decision',question:'What should the board do next?',options:[{id:'truth',label:'Audit incentives before scaling',detail:'The next step follows from the evidence.'},{id:'spin',label:'Turn on urgent ads for everyone',detail:'Optimises the dashboard and increases interruptions.'}]}
];
const assets=[
 {id:'finance',name:'Finance reconciliation',detail:'Verified reimbursement and supplier totals.',type:'VERIFIED'},
 {id:'staff',name:'Workforce & access record',detail:'Headcount and the licensing trade-off.',type:'VERIFIED'},
 {id:'campaign',name:'Campaign evidence',detail:'Engagement claims and what they omit.',type:'VERIFIED'},
 {id:'leaderboard',name:'Executive leaderboard',detail:'A perfect score with no documented methodology.',type:'UNVERIFIED'}
];
const sources={
 0:['Game rewards and motivation','https://doi.org/10.1108/JWL-09-2024-0193'],
 1:['Economies and incentives · CCDP lecture','https://canvas.lms.unimelb.edu.au/courses/239834/modules'],
 2:['Game rules as arguments · Bogost','https://mitpress.mit.edu/9780262026147/persuasive-games/'],
 3:['MDA: Mechanics create consequences','https://aaai.org/papers/ws04-04-001-mda-a-formal-approach-to-game-design-and-game-research/'],
 4:['The cost of interrupted work','https://doi.org/10.1145/1357054.1357072'],
 5:['Game economies · CCDP course','https://canvas.lms.unimelb.edu.au/courses/239834/modules']
};
const escapeHTML=(s)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeLink=(url)=>/^https:\/\//.test(url)?url:'#';
const defaultSave=()=>({version:1,seen:[],complete:{},decisions:{},lastQuest:null,reports:[],notices:[],revision:0});
let save;
try{save=JSON.parse(localStorage.getItem(SAVE)||'null')||defaultSave();if(save.version!==1)save=defaultSave()}catch(e){save=defaultSave()}
function persist(){try{localStorage.setItem(SAVE,JSON.stringify(save))}catch(e){}}
function game(){try{return JSON.parse(localStorage.getItem(GAME)||'{}')||{}}catch(e){return{}}}
let root=null,mode=null,toast=null,quest=-1,busy=false,lastNotice='',lastGameStamp='',domReady=false,audio=null;
function ping(kind='tap'){
 try{
  const mute=document.querySelector('.oh-flat-sound-toggle');if(mute&&/OFF|MUTE/.test(mute.textContent||''))return;
  audio=audio||new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume().catch(()=>{});
  const now=audio.currentTime,osc=audio.createOscillator(),gain=audio.createGain();
  osc.type='sine';osc.frequency.setValueAtTime(kind==='file'?620:kind==='alert'?510:390,now);
  osc.frequency.exponentialRampToValueAtTime(kind==='file'?900:kind==='alert'?470:520,now+.12);
  gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.022,now+.012);
  gain.gain.exponentialRampToValueAtTime(.0001,now+.15);osc.connect(gain);gain.connect(audio.destination);
  osc.start(now);osc.stop(now+.16)
 }catch(e){}
}
function currentTask(){return tasks[Math.max(0,Math.min(5,quest))]}
function isBlocked(){return !!document.querySelector('.reward-backdrop,.battle-panel,.final-report,.final-mask,.dc-modal,.dc-track,.dc-incoming,.dc-eval-grade,.dc-signature,.start-popup,.login-screen,.oh-flat-title')}
function desktop(){return document.querySelector('.desktop-os')}
function mount(){const d=desktop();if(!d)return false;if(!root||root.parentNode!==d){root=document.createElement('div');root.className='ow-root';root.setAttribute('aria-label','Aster workplace applications and notifications');d.appendChild(root);root.addEventListener('click',click);root.addEventListener('change',change);root.addEventListener('keydown',keyboard)}return true}
function notice(title,text,opts={}){if(root&&quest>=0)ping('alert');toast={title,text,action:opts.action||'OPEN WORK',kind:opts.kind||'task'};render()}
function getState(q){if(!save.decisions[q])save.decisions[q]={};return save.decisions[q]}
function openingLabel(){const q=currentTask();return q?.app||'Work' }
function hasLogged(){return save.complete[String(quest)]}
function appFor(q){if(q===0)return'sheets';if(q===1||q===3)return'word';if(q===2)return'people';if(q===4)return'slides';return'archive'}
function open(app){if(isBlocked())return;ping('tap');toast=null;if(app==='sheets'){mode=null;render();const btn=document.querySelector('[data-testid="launcher-sheets"]');btn?.click();return}if(app==='archive'&&quest!==5)app='work';if(!['word','slides','people','archive','work'].includes(app))app='work';if(app!=='work'&&app!==appFor(quest))app='work';mode=app;render()}
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
function frame(app,label,toolbarText,body,footer){return `<section class="ow-window" role="dialog" aria-label="${escapeHTML(label)}" data-ow-app="${escapeHTML(mode)}">${header(app,label)}${toolbar(app,toolbarText)}<div class="ow-body">${body}</div>${footer}</section>`}
function side(kicker,title,body,steps=[],tip=''){return `<aside class="ow-aside"><p class="ow-overline">${escapeHTML(kicker)}</p><h2>${escapeHTML(title)}</h2><p>${body}</p><div class="ow-steps">${steps.map((x,i)=>`<div class="ow-step ${x.done?'done':''}"><b>${x.done?'✓':i+1}</b>${escapeHTML(x.text)}</div>`).join('')}</div>${tip?`<div class="ow-note">${tip}</div>`:''}</aside>`}
function footer(label,disabled,status,extra=''){return `<footer class="ow-footer"><span>${escapeHTML(status)}</span><div style="display:flex;gap:8px">${extra}<button type="button" class="ow-action" data-ow="submit" ${disabled?'disabled':''}>${escapeHTML(label)} →</button></div></footer>`}
function viewWord(){const s=getState(quest), doc=documents[quest];if(!doc)return viewWork();const filled=doc.prompts.filter(p=>s[p.key]).length;
 const focus=Math.max(0,Math.min(1,Number(s.activeClause||0))),p=doc.prompts[focus];
 const body=side('DOCUMENT CONTROL',doc.title,quest===1?'The original contains misleading claims. Edit the notice by reviewing one passage at a time.':'There is no risk-free answer. Acknowledge the consequences.',[
 {text:'Review the first highlighted claim',done:!!s[doc.prompts[0].key]},
 {text:'Review the second highlighted claim',done:!!s[doc.prompts[1].key]},
 {text:'File a defensible memo',done:false}
 ],'Watch the document change as you edit. Both honest and corporate-spin paths remain playable.');
 const txt=doc.prompts.map(p=>{const opt=p.choices.find(o=>o.id===s[p.key]);return `<p>${opt?escapeHTML(opt.text):`<em>[${escapeHTML(p.label)} · REQUIRES REVISION]</em>`}</p>`}).join('');
 const choices=`<div class="ow-clause-tabs" role="tablist" aria-label="Document clauses">${doc.prompts.map((v,i)=>`<button role="tab" aria-selected="${focus===i}" class="${focus===i?'selected':''}" data-ow="clause" data-index="${i}">CLAUSE ${i+1} ${s[v.key]?'✓':'•'}</button>`).join('')}</div><p class="ow-overline" style="margin-top:15px">${escapeHTML(p.label.toUpperCase())}</p><div class="ow-redline"><b>${escapeHTML(p.question)}</b></div><div class="ow-choice-grid">${p.choices.map(o=>`<button class="ow-option ${s[p.key]===o.id?'selected':''}" data-ow="choose" data-field="${p.key}" data-value="${o.id}" aria-pressed="${s[p.key]===o.id?'true':'false'}"><b>${escapeHTML(o.title)}</b><small>${escapeHTML(o.detail)}</small></button>`).join('')}</div><div class="ow-review ${s[p.key]?'good':''}">${s[p.key]?'✓ Changes applied to the live document.':'Select how this paragraph should appear in the official record.'}</div>`;
 const main=`<main class="ow-main"><div class="ow-app-grid" style="grid-template-columns:1fr 1fr;gap:13px"><div><div class="ow-paper"><div class="ow-paperhead"><span>ASTER CORPORATION</span><span>INTERNAL · REV ${filled}</span></div><h3>${escapeHTML(doc.title)}</h3><p>${escapeHTML(doc.intro)}</p>${txt}<p>${escapeHTML(doc.outro)}</p><div class="ow-paperhead" style="margin-top:15px;padding-top:7px;border-top:1px solid #ddd;border-bottom:0"><span>REVIEWED BY EMPLOYEE 001</span><span>${filled}/2 CLAUSES</span></div></div></div><div><p class="ow-overline">TRACK CHANGES</p>${choices}</div></div></main>`;
 return frame('Writer',doc.title,`${filled}/2 paragraphs reviewed`,body+main,footer(quest===1?'FILE STAFF NOTICE':'FILE LICENCE MEMO',filled!==2,filled===2?'Ready for filing · the choices become part of the record.':'Two highlighted paragraphs require a decision.'))}
function viewPeople(){const s=getState(2),selected=candidates.find(c=>c.id===s.applicant),chosen=!!s.applicant;
 const body=side('PEOPLE OPERATIONS','Hiring without the hype','A candidate must handle corrections, audit trails and confidential files. The CEO has requested the applicant with the flashiest résumé.',[
 {text:'Review the role criteria',done:true},{text:'Select a candidate',done:chosen},{text:'Check work evidence and privacy',done:!!s.privacy&&!!s.reference}
 ],'Skills, evidence and privacy matter more than titles. Names are masked until the application is filed.');
 const cvs=`<main class="ow-main"><p class="ow-overline">POSITION: RECORDS COORDINATOR · THREE APPLICATIONS</p><div class="ow-app-grid">${candidates.map(c=>`<button type="button" data-ow="candidate" data-id="${c.id}" class="ow-cv ${selected?.id===c.id?'selected':''}" aria-pressed="${selected?.id===c.id}"><span class="ow-cv-tag">CV ${c.id} / ${escapeHTML(c.years)} EXPERIENCE</span><b>${escapeHTML(c.name)}</b><p>${escapeHTML(c.subtitle)}</p><p>${escapeHTML(c.skills)}</p></button>`).join('')}<div class="ow-cv" style="background:#e6efe7"><span class="ow-cv-tag">ROLE REQUIREMENTS</span><b>Source-based decisions</b><p>Accurate records. Formula familiarity. Ability to explain corrections. Responsible handling of private data.</p></div></div>${selected?`<div class="ow-review ${selected.score===3?'good':''}"><b>${escapeHTML(selected.name)} · EVIDENCE REVIEW</b><div>${escapeHTML(selected.proof)}</div><small>${escapeHTML(selected.risk)}</small></div>`:''}<p class="ow-overline" style="margin-top:12px">EVIDENCE CHECK</p><div class="ow-choice-grid"><button class="ow-option ${s.reference==='verify'?'selected':''}" data-ow="choose" data-field="reference" data-value="verify"><b>Verify the work sample</b><small>Check the source correction before approving a CV.</small></button><button class="ow-option ${s.reference==='skip'?'selected':''}" data-ow="choose" data-field="reference" data-value="skip"><b>Trust the résumé summary</b><small>Faster approval, but evidence remains unverified.</small></button></div><p class="ow-overline" style="margin-top:9px">APPLICATION PRIVACY</p><div class="ow-choice-grid"><button class="ow-option ${s.privacy==='secure'?'selected':''}" data-ow="choose" data-field="privacy" data-value="secure"><b>Mask personal information</b><small>Keep decisions focused on job-related evidence.</small></button><button class="ow-option ${s.privacy==='open'?'selected':''}" data-ow="choose" data-field="privacy" data-value="open"><b>Share the full résumé bundle</b><small>Faster internal review, unnecessary personal exposure.</small></button></div></main>`;
 return frame('Applicants','Candidate selection',`${chosen?'1':'0'}/1 candidate selected`,body+cvs,footer('FILE HIRING DECISION',!s.applicant||!s.privacy||!s.reference,chosen?`${selected.name} selected · ${s.privacy?'privacy instruction recorded':'choose a privacy rule'}`:'Select a candidate based on the evidence.'))}
function viewSlides(){const s=getState(4),k=Number(s.activeSlide)||0,complete=slideChoices.filter(v=>s[v.id]).length;
 if(k===3){
  const order=Array.isArray(s.order)?s.order:[2,0,1];s.order=order;
  const goodOrder=order.join(',')==='0,1,2';
  const body=side('ASTER PRESENTATIONS','Make the recommendation','Three slides establish the argument. The final decision determines what becomes a corporate success metric.',[
   {text:'Assemble the evidence deck',done:complete===3},{text:'Choose the recommendation',done:!!s.policy},{text:'Present the finished argument',done:false}
  ],'The corporation values good news. The board may need a different kind of truth.');
  const main=`<main class="ow-main"><p class="ow-overline">BOARD PRESENTATION / FINAL SLIDE</p><h2 style="margin-bottom:12px">What should the company reward?</h2><div class="ow-sorter" aria-label="Reorder presentation slides">${order.map((id,pos)=>`<div class="ow-sort-row"><b>${pos+1}. ${escapeHTML(slideChoices[id].title.split(' · ')[1])}</b><span>${pos===0?'OPENING':pos===1?'MIDDLE':'ENDING'}</span><button aria-label="Move ${escapeHTML(slideChoices[id].title)} up" data-ow="move-slide" data-pos="${pos}" data-dir="-1" ${pos===0?'disabled':''}>↑</button><button aria-label="Move ${escapeHTML(slideChoices[id].title)} down" data-ow="move-slide" data-pos="${pos}" data-dir="1" ${pos===2?'disabled':''}>↓</button><button data-ow="slide" data-index="${id}" aria-label="Edit ${escapeHTML(slideChoices[id].title)}">EDIT</button></div>`).join('')}</div><p class="ow-review ${goodOrder?'good':''}" style="margin:7px 0 4px">${goodOrder?'The argument develops from claim to evidence to recommendation.':'Your presentation reaches its recommendation before establishing the evidence. Reorder the slides if you want an argument the board can examine.'}</p><div class="ow-choice-grid" style="margin-top:13px"><button class="ow-option ${s.policy==='disclose'?'selected':''}" data-ow="choose" data-field="policy" data-value="disclose"><b>Flag manipulative engagement</b><small>Expose what the dashboard leaves out. Smaller bonus, stronger staff trust.</small></button><button class="ow-option ${s.policy==='ship'?'selected':''}" data-ow="choose" data-field="policy" data-value="ship"><b>Count every click</b><small>Higher performance scores now. The system learns to demand more interruptions.</small></button></div></main>`;
  return frame('Slides','Quarterly engagement deck',`3/3 slides · final decision`,body+main,footer('PRESENT TO BOARD',complete!==3||!s.policy,s.policy?'Recommendation recorded · ready for board review.':'Choose one board recommendation to file the deck.'));
 }
 const slide=slideChoices[k],selected=s[slide.id];
 const body=side('ASTER PRESENTATIONS','A story changes the score','Marketing wants a deck that proves engagement is soaring. An honest presentation must distinguish gross clicks from valuable outcomes.',[
 {text:'Compose the three slides',done:complete===3},{text:'Choose how to report the results',done:!!s.policy},{text:'Present to the board',done:false}
 ],'What you leave out of a chart can become the company’s next target.');
 const main=`<main class="ow-main"><div class="ow-slide-shell"><div><div class="ow-slide" aria-label="Slide preview ${k+1}"><span class="ow-overline" style="color:#c0d1d5">ASTER QUARTERLY UPDATE</span><h3>${escapeHTML(selected?slide.options.find(o=>o.id===selected).label:'[CHOOSE THE HEADLINE]')}</h3><p>${escapeHTML(selected?slide.options.find(o=>o.id===selected).detail:'Use this slide to express one specific finding. What belongs on the page, and what must not be disguised?')}</p><div class="ow-slide-number">${k+1} / 03</div></div><p class="ow-overline" style="margin-top:12px">${escapeHTML(slide.question)}</p><div class="ow-deck-choices">${slide.options.map(o=>`<button data-ow="slide-answer" data-field="${slide.id}" data-value="${o.id}" class="${selected===o.id?'selected':''}" aria-pressed="${selected===o.id}">${escapeHTML(o.label)}</button>`).join('')}</div></div><nav class="ow-slide-nav" aria-label="Slides">${slideChoices.map((v,i)=>`<button class="${k===i?'selected':''}" data-ow="slide" data-index="${i}" aria-current="${k===i?'true':'false'}"><b>0${i+1} · ${escapeHTML(v.title.split(' · ')[1])}</b><small>${s[v.id]?'✓ Prepared':'○ Needs content'}</small></button>`).join('')}</nav></div><div class="ow-minimessage" style="margin-top:14px"><span><b>PREVIEW:</b> Build the three slides. The board recommendation follows once the evidence is on-screen.</span></div></main>`;
 return frame('Slides','Quarterly engagement deck',`${complete}/3 slides prepared`,body+main,footer('PRESENT TO BOARD',complete!==3||!s.policy,`${complete}/3 slides · ${s.policy?'recommendation selected':'recommendation required'}`))}
function viewArchive(){const s=getState(5),selected=s.evidence||[],good=['finance','staff','campaign'].filter(x=>selected.includes(x)).length;
 const body=side('EXECUTIVE RECORDS','What goes on the record?','The director has room for only three attachments. Decide whether the board sees the reconciled evidence or a perfect-looking performance chart.',[
 {text:'Select three attachments',done:selected.length===3},{text:'Confirm the evidence trail',done:good===3},{text:'Prepare the final board pack',done:false}
 ],'A file can be accurate while its presentation is misleading. The missing evidence is a decision too.');
 const packet=`<main class="ow-main"><p class="ow-overline">CONFIDENTIAL / ATTACHMENT SELECTION</p><div class="ow-package">${assets.map(a=>`<button type="button" class="${selected.includes(a.id)?'selected':''}" data-ow="attachment" data-id="${a.id}" aria-pressed="${selected.includes(a.id)}"><span class="ow-overline" style="font-size:9px">${a.type}</span><b>${escapeHTML(a.name)}</b><small>${escapeHTML(a.detail)}</small></button>`).join('')}</div><div class="ow-review ${selected.length===3&&good===3?'good':''}"><b>DOCUMENT PACK · ${selected.length}/3 ATTACHMENTS</b><div>${selected.length===3?(good===3?'All three attachments are source-based. The board can challenge the conclusions.':'The scorecard is compelling, but an evidence record has been omitted.'): 'Select three attachments. A fourth must stay behind.'}</div></div><div class="ow-minimessage"><span><b>MIRA:</b> “If the system can decide what to reward, then you can decide what deserves a record.”</span></div><p class="ow-overline" style="margin-top:15px">REFERENCES INSIDE THE GAME</p><p>There are reasons why rewards motivate, and reasons why incentives mislead. The final boss will judge the organisation you have helped shape.</p></main>`;
 return frame('Case Files','Executive board pack',`${selected.length}/3 attachments`,body+packet,footer('SEAL THE DOSSIER',selected.length!==3,`Selection saved · ${selected.length}/3 documents`))}
function viewWork(){const t=currentTask(),s=getState(quest),g=game();const body=side('WORK ORDERS',`Shift ${quest+1} of 6`,'Aster no longer runs its night shift through a mailbox. Assignments arrive as desktop alerts. The work happens in the application best suited to each job.',tasks.map((a,i)=>({text:`${i+1}. ${a.title}`,done:i<quest||!!save.complete[i]})),'Marketing metrics are not the same as meaningful work. Neither are report counts.');
 const main=`<main class="ow-main"><p class="ow-overline">CURRENT ASSIGNMENT / ${escapeHTML(t.dept)}</p><h2>${escapeHTML(t.title)}</h2><p style="font-size:13px;max-width:480px">${escapeHTML(t.blurb)}</p><div class="ow-minimessage"><span><b>${escapeHTML(t.sender)}:</b> Complete the work here. The corporation will record your decision and issue the usual reward.</span></div><p class="ow-overline" style="margin-top:15px">NOTIFICATION FEED</p><ul class="ow-history-list">${save.notices.slice(0,6).map(n=>`<li><strong>${escapeHTML(n.title)}</strong>${escapeHTML(n.text)}</li>`).join('')}</ul><p><a href="${safeLink(sources[quest][1])}" target="_blank" rel="noopener noreferrer" style="color:#21715c">${escapeHTML(sources[quest][0])} ↗</a></p></main>`;
 return frame('Work Queue','Shift tasks',`${g.quest||0}/6 completed`,body+main,footer('OPEN '+t.app.toUpperCase(),false,'Tasks are delivered through system notifications.'))}
function render(){if(!root)return;const active=desktop()&&!isBlocked();root.style.display=active?'block':'none';if(!active)return;
 let app='';if(mode==='word'&&(quest===1||quest===3))app=viewWord();else if(mode==='people'&&quest===2)app=viewPeople();else if(mode==='slides'&&quest===4)app=viewSlides();else if(mode==='archive'&&quest===5)app=viewArchive();else if(mode)app=viewWork();
 const to=toast?`<div class="ow-notifier" role="status" aria-live="polite"><div class="ow-toast"><div class="ow-toast-top"><span>◈ ASTER · DESKTOP NOTIFICATION</span><button type="button" data-ow="dismiss" aria-label="Dismiss notification">×</button></div><div class="ow-toast-main"><strong>${escapeHTML(toast.title)}</strong><p>${escapeHTML(toast.text)}</p>${quest===0?`<a href="${safeLink(sources[0][1])}" target="_blank" rel="noopener noreferrer" style="display:block;font:700 10px Outfit,sans-serif;margin:0 0 10px;color:#2b7c66">WHY THIS SHIFT? Rewards can motivate. Who sets the score? · Source ↗</a>`:''}<div class="ow-toast-actions"><button type="button" data-ow="dismiss">LATER</button><button type="button" class="primary" data-ow="open" data-app="${appFor(quest)}">${escapeHTML(toast.action)}</button></div></div></div></div>`:'';
 const dock=[['work','Tasks','☷'],['word','Writer','W'],['people','Applicants','◈'],['slides','Slides','S'],['archive','Files','▤']].map(([id,name,ic])=>`<button type="button" class="ow-launch ${mode===id?'active':''}" data-ow="open" data-app="${id}"><span class="ow-launch-icon">${ic}</span><span>${name}</span></button>`).join('');
 root.innerHTML=`<nav class="ow-dock" aria-label="Work applications">${dock}</nav>${to}${app}<button class="ow-notification-button" data-ow="open" data-app="work" aria-label="Open work queue">▣ ${quest+1}/6 · WORK QUEUE ${toast?'●':''}</button>`;
}
function click(ev){const e=ev.target.closest('[data-ow]');if(!e||!root.contains(e))return;const action=e.dataset.ow;if(!['open','dismiss'].includes(action))ping('tap');
 if(action==='close'){close();return}if(action==='dismiss'){toast=null;render();return}if(action==='open'){const app=e.dataset.app||appFor(quest);if(mode==='work'&&e.classList.contains('ow-action'))open(appFor(quest));else open(app);return}
 if(action==='choose'){const st=getState(quest);st[e.dataset.field]=e.dataset.value;if(mode==='word'&&st.activeClause===undefined)st.activeClause=0;if(mode==='word'&&e.dataset.field===documents[quest]?.prompts[0]?.key)st.activeClause=1;persist();render();return}
 if(action==='clause'){getState(quest).activeClause=Number(e.dataset.index);persist();render();return}
 if(action==='candidate'){getState(2).applicant=e.dataset.id;persist();render();return}
 if(action==='slide'){getState(4).activeSlide=Number(e.dataset.index);persist();render();return}
 if(action==='move-slide'){const st=getState(4),order=st.order||[2,0,1];const pos=Number(e.dataset.pos),to=pos+Number(e.dataset.dir);if(to>=0&&to<order.length){[order[pos],order[to]]=[order[to],order[pos]];st.order=order;persist();render()}return}
 if(action==='slide-answer'){const s=getState(4);s[e.dataset.field]=e.dataset.value;if(Number(s.activeSlide||0)<2)s.activeSlide=Number(s.activeSlide||0)+1;else s.activeSlide=3;persist();render();return}
 if(action==='attachment'){const s=getState(5);s.evidence=s.evidence||[];const i=s.evidence.indexOf(e.dataset.id);if(i>=0)s.evidence.splice(i,1);else if(s.evidence.length<3)s.evidence.push(e.dataset.id);persist();render();return}
 if(action==='submit'){if(mode==='work'){open(appFor(quest));return}void submit();return}
}
function change(ev){}
function keyboard(ev){if(ev.key==='Escape'&&mode){ev.stopPropagation();close()}}
function waitFor(fn,timeout=3500){return new Promise((resolve,reject)=>{const start=performance.now();const work=()=>{let found;try{found=fn()}catch(e){}if(found){resolve(found);return}if(performance.now()-start>timeout){reject(Error('Workday bridge timed out'));return}setTimeout(work,55)};work()})}
function fillInput(node,value){const native=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;native.call(node,value);node.dispatchEvent(new Event('input',{bubbles:true}));node.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter',bubbles:true}))}
async function submit(){if(busy||quest<1||quest>5)return;const s=getState(quest),app=appFor(quest);let ok=false;
 if(app==='word')ok=documents[quest].prompts.every(p=>!!s[p.key]);
 if(app==='people')ok=!!s.applicant&&!!s.privacy&&!!s.reference;
 if(app==='slides')ok=slideChoices.every(p=>!!s[p.id])&&!!s.policy;
 if(app==='archive')ok=(s.evidence||[]).length===3;
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
  ping('file');save.complete[old]={app,when:Date.now(),decisions:JSON.parse(JSON.stringify(s))};save.reports.push({quest:old,title:tasks[old].title,app,decisions:JSON.parse(JSON.stringify(s))});persist();
  busy=false;mode=null;render();
 }catch(err){console.error('WORKDAY_FILING_ERROR',err);busy=false;mode=app;notice('DOCUMENT NOT FILED','The office filing system did not accept the task. Your choices are saved; select FILE again.');render()}
}
function reconcile(){if(!mount())return;const d=desktop();if(!d)return;
 // All previous mail windows are legacy UI. Close them rather than just covering them.
 const legacy=d.querySelector('[data-testid="window-mail"]');if(legacy){const x=legacy.querySelector('button[aria-label="Close mail"]');if(x){x.click()}}
 detectQuest();if(!isStageVisible()){root.style.display='none';return}
 if(!toast&&!mode&&quest<6&&save.seen.indexOf(quest)<0)notifyQuest(quest);
 if(root.style.display==='none')render();
 // Bring the edited work from prior acts back into the finale, without editing course citations.
 const end=document.querySelector('.dc-eval-grade,.final-report');if(end&&save.reports.length>=3&&!document.querySelector('.ow-portfolio-line')){
  const line=document.createElement('div');line.className='ow-portfolio-line';line.style.cssText='margin:9px 0 0;padding:7px 10px;border-left:3px solid #319777;background:#dff1e4;color:#2f5953;font:700 11px Outfit,sans-serif';line.textContent=`SHIFT FILES INCLUDED · ${save.reports.length} non-spreadsheet assignments · Word, applications, slides and records`;end.appendChild(line)
 }
}
function startup(){if(domReady)return;domReady=true;setInterval(reconcile,500);reconcile()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startup);else startup();
})();
