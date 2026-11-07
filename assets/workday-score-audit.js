/* Office Hours: scoring policies as playable arguments.
   Optional reflective layer. No timers, tracking, network calls, or changes to campaign scores.
   Mount is invoked by the existing Workday end-state reconciliation. */
(function(){
  'use strict';
  const clamp=n=>Math.max(0,Math.min(100,Math.round(Number.isFinite(n)?n:0)));
  const yes=v=>v===true;
  const chosen=(obj,key,id)=>obj && obj[key]===id;
  const MODELS={
    output:{
      label:'QUARTERLY OUTPUT',name:'Management / the dashboard',
      values:'Delivered tasks and immediate targets',
      blindspot:'It rewards throughput, but cannot see unpaid time, privacy costs or whether a high click count helped anyone.',
      formula:'38 + 6 × tasks + 4 × pressure − 1.5 × record integrity',
      source:'https://doi.org/10.1016/j.compcom.2013.12.003'
    },
    people:{
      label:'PEOPLE & CONDITIONS',name:'Workers / the lived shift',
      values:'Honest records, privacy, protected access and attention',
      blindspot:'This model protects people, but does not establish how to fund every benefit or resolve a scarce budget.',
      formula:'42 + 5 × tasks + 3 × integrity − 3 × pressure + 2 × ads ignored',
      source:'https://doi.org/10.1145/1357054.1357072'
    },
    evidence:{
      label:'AUDITABLE EVIDENCE',name:'Auditor / the paper trail',
      values:'Claims that can be verified, qualified and challenged',
      blindspot:'Well-documented decisions can still cause harm. A paper trail does not prove that an incentive improved work.',
      formula:'42 + 4 × tasks + 5 × verified choices − 4 × unverified choices',
      source:'https://doi.org/10.1016/j.compcom.2013.12.003'
    }
  };
  function evaluate(save,game,tally){
    const decisions=save && typeof save.decisions==='object' && save.decisions || {};
    const w=decisions[1]||{},h=decisions[2]||{},it=decisions[3]||{},sl=decisions[4]||{},pack=decisions[5]||{};
    const checks=[
      chosen(w,'wellbeing','truth')&&chosen(w,'delay','truth'),
      chosen(h,'applicant','B'),chosen(h,'privacy','secure'),
      chosen(it,'risk','truth'),chosen(sl,'proof','truth'),
      chosen(sl,'policy','disclose'),
      Array.isArray(pack.evidence)&&pack.evidence.length===3&&!pack.evidence.includes('leaderboard')
    ];
    const verified=checks.filter(yes).length;
    const completed=Math.max(0,Math.min(6,Number(game&&game.quest)||0));
    const integrity=Math.max(0,Math.min(11,Number(tally&&tally.integrity)||0));
    const pressure=Math.max(0,Math.min(11,Number(tally&&tally.heat)||0));
    const focus=Math.max(0,Math.min(6,Number(game&&game.adsDismissed)||0));
    return {
      counts:{completed,integrity,pressure,verified,unverified:7-verified,focus},
      scores:{
        output:clamp(38+6*completed+4*pressure-1.5*integrity),
        people:clamp(42+5*completed+3*integrity-3*pressure+2*focus),
        evidence:clamp(42+4*completed+5*verified-4*(7-verified))
      }
    };
  }
  let active=null;
  function show(save,game,tally,opener){
    if(active){active.remove();active=null}
    const data=evaluate(save,game,tally);
    const shade=document.createElement('div');
    shade.className='ow-audit-shade';
    shade.innerHTML=[
      '<section class="ow-audit-dialog" role="dialog" aria-modal="true" aria-labelledby="ow-audit-title">',
      '<header class="ow-audit-head"><div><small>ASTER / PERSONNEL EVALUATION MODEL</small>',
      '<h2 id="ow-audit-title">Who gets to set the score?</h2>',
      '<p>The shift is over. Nothing you did has changed. Only the rules of evaluation will.</p></div>',
      '<button class="ow-audit-close" type="button" aria-label="Close scoring audit">×</button></header>',
      '<div class="ow-audit-tabs" role="tablist" aria-label="Choose an evaluation policy"></div>',
      '<div class="ow-audit-workspace"><div class="ow-audit-grading">',
      '<span class="ow-audit-overline">RESULT UNDER THIS POLICY</span>',
      '<div class="ow-audit-score" aria-live="polite" data-score></div>',
      '<div class="ow-audit-track" aria-hidden="true"><i data-bar></i></div>',
      '<p class="ow-audit-model-name" data-model></p>',
      '</div><div class="ow-audit-interpretation">',
      '<div class="ow-audit-caption">WHAT COUNTS</div><p data-values></p>',
      '<div class="ow-audit-caption">WHAT THIS MODEL MISSES</div><p data-blindspot></p>',
      '</div></div>',
      '<div class="ow-audit-record"><b>YOUR UNCHANGED SHIFT</b><span data-record></span></div>',
      '<details class="ow-audit-method"><summary>Inspect the fictional scoring formula</summary>',
      '<p data-formula></p><p>These numbers model different employer priorities. They are illustrative game rules, NOT validated workplace outcomes, scientific measurements or your university grade.</p></details>',
      '<footer class="ow-audit-footer"><span>Rules persuade by deciding what matters. Try every lens.</span>',
      '<a href="https://doi.org/10.1016/j.compcom.2013.12.003" rel="noopener noreferrer" target="_blank">Procedural rhetoric ↗</a>',
      '<a href="https://doi.org/10.1145/1357054.1357072" rel="noopener noreferrer" target="_blank">Interruptions ↗</a></footer>',
      '</section>'
    ].join('');
    const card=shade.querySelector('.ow-audit-dialog');
    const group=shade.querySelector('.ow-audit-tabs');
    const buttons={};
    function select(id){
      const spec=MODELS[id];
      if(!spec)return;
      for(const [key,btn] of Object.entries(buttons)){
        const selected=key===id;
        btn.setAttribute('aria-selected',String(selected));
        btn.tabIndex=selected?0:-1;
      }
      shade.querySelector('[data-score]').textContent=data.scores[id]+' / 100';
      shade.querySelector('[data-bar]').style.width=data.scores[id]+'%';
      shade.querySelector('[data-model]').textContent=spec.name;
      shade.querySelector('[data-values]').textContent=spec.values;
      shade.querySelector('[data-blindspot]').textContent=spec.blindspot;
      shade.querySelector('[data-formula]').textContent=spec.formula;
      shade.querySelector('[data-record]').textContent=
        data.counts.completed+'/6 tasks · '+data.counts.integrity+
        ' integrity choices · '+data.counts.pressure+' management-pressure choices · '+
        data.counts.verified+'/7 verifiable decisions';
    }
    for(const [id,spec] of Object.entries(MODELS)){
      const b=document.createElement('button');
      b.type='button';b.role='tab';b.dataset.auditLens=id;b.textContent=spec.label;
      b.addEventListener('click',()=>select(id));
      b.addEventListener('keydown',e=>{
        if(!['ArrowLeft','ArrowRight'].includes(e.key))return;
        e.preventDefault();
        const names=Object.keys(MODELS),delta=e.key==='ArrowRight'?1:-1;
        const next=names[(names.indexOf(id)+delta+names.length)%names.length];
        select(next);buttons[next].focus();
      });
      buttons[id]=b;group.appendChild(b);
    }
    function close(){
      document.removeEventListener('keydown',onKey);
      shade.remove();active=null;
      if(opener&&opener.isConnected)opener.focus();
    }
    function onKey(e){
      if(e.key==='Escape'){e.stopPropagation();close()}
      if(e.key==='Tab'){
        const focusable=Array.from(card.querySelectorAll('button,a,summary')).filter(el=>el.getClientRects().length);
        const first=focusable[0],last=focusable[focusable.length-1];
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
      }
    }
    shade.querySelector('.ow-audit-close').addEventListener('click',close);
    shade.addEventListener('click',e=>{if(e.target===shade)close()});
    document.body.appendChild(shade);
    active=shade;
    document.addEventListener('keydown',onKey);
    select('output');
    shade.querySelector('.ow-audit-close').focus();
  }
  function mount(end,save,game,tally){
    if(!end)return;
    const note=end.querySelector('.ow-portfolio-line');
    if(!note||note.querySelector('[data-workday-audit]'))return;
    const button=document.createElement('button');
    button.type='button';
    button.className='ow-audit-launch';
    button.dataset.workdayAudit='open';
    button.textContent='CHALLENGE THE SCORE ↗';
    button.setAttribute('aria-label','Compare how different scoring rules judge this same shift');
    button.addEventListener('click',()=>show(save,game,tally,button));
    note.appendChild(button);
  }
  window.WorkdayScoreAudit=Object.freeze({evaluate,mount});
})();