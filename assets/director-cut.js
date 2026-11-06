/* OFFICE HOURS: DIRECTOR'S CUT / Shift Ledger
   A small, additive story director that reads actual game state and exposes one
   consequential evidence-delivery encounter, then lets the player sign their
   own final performance record. Production release remains untouched. */
(()=>{
  'use strict';
  const K='office-hours-game-state-v3', D='office-hours-director-v1';
  const initial=()=>({version:1,shown:false,deferred:false,midDone:false,midChoice:null,intercepts:0,lastQuest:0,finalSeen:false,finalChoice:null});
  const read=(key)=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}};
  let state={...initial(),...(read(D)||{})},mode='idle',host=null,lastTick='',drag=null;
  const escapeHTML=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const persist=()=>{try{localStorage.setItem(D,JSON.stringify(state))}catch{}};
  const game=()=>read(K);
  const getHost=()=>{
    const anchor=document.fullscreenElement||document.querySelector('.office-game')||document.body;
    if(!host){host=document.createElement('div');host.id='oh-director-root';host.setAttribute('data-director-cut','1');}
    if(host.parentNode!==anchor)anchor.appendChild(host);
    return host;
  };
  const fadeRoot=()=>{if(host){host.innerHTML='';host.className='';host.style.pointerEvents='none';}};
  function notify(text){
    if(!host)return;
    const n=document.createElement('div');n.className='dc-toast';n.setAttribute('role','status');n.textContent=text;host.appendChild(n);
    setTimeout(()=>n.remove(),4800);
  }
  function activateOverlay(){getHost().className='dc-active';host.style.pointerEvents='auto'}
  function pauseOverlay(){mode='idle';fadeRoot();}
  const narrative=(g)=>{
    if((g?.kpiPressure??0)>=(g?.teamTrust??50))return 'The system rewarded speed. Someone else absorbed the cost.';
    return 'The numbers stayed the same. The people behind them did not.';
  };
  function midPrompt(){
    if(mode!=='idle')return;
    mode='prompt';getHost().className='dc-prompting';
    host.innerHTML=`<aside class="dc-incoming" role="region" aria-label="Incoming confidential message">
      <div class="dc-incoming-icon" aria-hidden="true">✉</div>
      <div class="dc-incoming-copy"><span class="dc-kicker">STAFF CHANNEL · MESSAGE RECOVERED</span>
      <strong>THE TOTALS ARE CORRECT. THE REPORT ISN'T.</strong><small>Mira / Accounting · encrypted attachment</small></div>
      <div class="dc-incoming-actions"><button data-dc="open">OPEN FILE</button><button data-dc="later" class="dc-muted">LATER</button></div>
    </aside>`;
    state.shown=true;persist();bind();
  }
  function promptLater(){state.deferred=true;persist();mode='idle';fadeRoot();}
  function seeFile(){mode='evidence';getHost();activateOverlay();renderEvidence(false)}
  const paperCard=(label,num,desc,theme)=>`<div class="dc-paper dc-paper-${theme}"><div class="dc-paper-top"><span>${label}</span><span>ASTER / NO. 09-B</span></div><strong>${num}</strong><p>${desc}</p></div>`;
  function renderEvidence(delivered){
    const g=game()||{},score=Number(g.score||0).toLocaleString(), quest=Math.min(6,Number(g.quest||0));
    host.innerHTML=`<div class="dc-veil"><section class="dc-panel" role="dialog" aria-modal="true" aria-label="Confidential office evidence">
      <header class="dc-header"><div class="dc-corp"><span class="dc-corp-mark">◆</span><div>ASTER CORPORATION<small>INTERNAL COMMUNICATIONS · 10:57 PM</small></div></div><button data-dc="close" class="dc-close" aria-label="Return to office">×</button></header>
      <div class="dc-headline"><div class="dc-overline">A MESSAGE FROM MIRA / ACCOUNTING <span>◉ STAFF SIGNAL DETECTED</span></div>
      <h1>THE NUMBERS<br><em>WERE RIGHT.</em></h1><p>“Management calls it a productivity gain. Ask the people who have to cover the night shift.”</p></div>
      <div class="dc-ledgers">
        ${paperCard('MANAGEMENT RECORD',`${quest}/6`,`${score} performance points. The target is on track. No personnel exceptions reported.`,'corp')}
        ${paperCard('FLOOR REPORT','1 SHIFT','New headcount is not new coverage. The rota still has gaps. The review omits what cannot be scored.','human')}
      </div>
      ${delivered?`<div class="dc-decision"><div class="dc-decision-kicker">THE EVIDENCE IS YOURS NOW</div><strong>WHO RECEIVES YOUR COPY?</strong><p>The report will be counted either way. The consequences will not.</p>
       <div class="dc-actions"><button data-dc="staff" class="dc-action-staff"><b>FORWARD TO STAFF</b><small>Team backing +12 · 15¢ documentation cost · KPI scrutiny +4</small></button>
       <button data-dc="board" class="dc-action-board"><b>FILE WITH MANAGEMENT</b><small>35¢ speed bonus · KPI pressure +12 · staff trust −8</small></button></div></div>`:
      `<div class="dc-delivery"><div class="dc-delivery-title"><b>ONE LAST TRANSFER</b><span>Move the evidence to Mira's secure tray. The bright shortcuts aren't secure.</span></div>
        <div class="dc-track" data-dc="track"><div class="dc-lane-label">OPEN CHANNEL / FOLLOW THE QUIET ROUTE</div>
          <button class="dc-packet" type="button" aria-label="Drag the staff evidence packet to Mira's tray" data-dc="packet"><span>▣</span><small>STAFF<br>FILE</small></button>
          <div class="dc-trap dc-trap-one" data-trap="1"><b>INSTANT BONUS!</b><span>UPLOAD HERE</span></div>
          <div class="dc-trap dc-trap-two" data-trap="2"><b>FAST REVIEW</b><span>CLICK TO SEND</span></div>
          <div class="dc-tray" data-dc="tray"><span>✓</span><b>MIRA'S SECURE TRAY</b></div>
        </div>
        <div class="dc-delivery-foot"><span data-dc="drag-status">${state.intercepts?'Corporate shortcuts intercepted your pointer. Take the quiet route.':'Precision matters. Move around the offers, not through them.'}</span><button data-dc="accessible" class="dc-secure">USE SECURE KEYBOARD ROUTE →</button></div>
      </div>`}
      <footer class="dc-footer"><span>RESEARCH TRACE / <a target="_blank" rel="noopener noreferrer" href="https://doi.org/10.1145/1357054.1357072">INTERRUPTIONS, 2008 ↗</a></span><span>THE INTERFACE IS PART OF THE ARGUMENT.</span></footer>
    </section></div>`;
    bind();if(!delivered)bindDrag();
  }
  function intercept(){
    if(!drag)return;
    drag=null;state.intercepts=(state.intercepts||0)+1;persist();
    const track=host.querySelector('.dc-track');track?.classList.remove('dc-is-dragging');track?.classList.add('dc-intercepted');
    const p=host.querySelector('.dc-packet');if(p){p.style.left='20px';p.style.top='50%';p.style.transform='translateY(-50%)';}
    const msg=host.querySelector('[data-dc="drag-status"]');if(msg)msg.textContent='That was the corporate quick-send channel. Your attention is the product. Try again.';
    setTimeout(()=>track?.classList.remove('dc-intercepted'),600);
  }
  function bindDrag(){
    const packet=host.querySelector('.dc-packet'),track=host.querySelector('.dc-track'),tray=host.querySelector('.dc-tray');
    if(!packet||!track||!tray)return;
    packet.addEventListener('pointerdown',e=>{
      e.preventDefault();const rect=track.getBoundingClientRect(),p=packet.getBoundingClientRect();
      drag={id:e.pointerId,dx:e.clientX-p.left,dy:e.clientY-p.top,rect,lastX:e.clientX,lastY:e.clientY};
      try{packet.setPointerCapture(e.pointerId)}catch{}
      track.classList.add('dc-is-dragging');
    });
    packet.addEventListener('pointermove',e=>{
      if(!drag||drag.id!==e.pointerId)return;
      const r=track.getBoundingClientRect(),w=packet.offsetWidth,h=packet.offsetHeight;
      let x=Math.min(r.width-w,Math.max(4,e.clientX-r.left-drag.dx));
      let y=Math.min(r.height-h,Math.max(6,e.clientY-r.top-drag.dy));
      packet.style.left=x+'px';packet.style.top=y+'px';packet.style.transform='none';
      const pr=packet.getBoundingClientRect(),tr=tray.getBoundingClientRect();
      const overlaps=(a,b,margin=0)=>a.left+margin<b.right&&a.right-margin>b.left&&a.top+margin<b.bottom&&a.bottom-margin>b.top;
      const traps=[...track.querySelectorAll('.dc-trap')];
      if(traps.some(t=>overlaps(pr,t.getBoundingClientRect(),10))){try{packet.releasePointerCapture(e.pointerId)}catch{};intercept();return;}
      if(overlaps(pr,tr,18)){
        try{packet.releasePointerCapture(e.pointerId)}catch{};
        drag=null;track.classList.remove('dc-is-dragging');mode='decision';renderEvidence(true);
      }
    });
    packet.addEventListener('pointerup',e=>{if(!drag||drag.id!==e.pointerId)return;drag=null;track.classList.remove('dc-is-dragging');});
    packet.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();mode='decision';renderEvidence(true)}});
  }
  function makeChoice(which){
    if(!['staff','board'].includes(which))return;
    state.midDone=true;state.midChoice=which;state.deferred=false;persist();
    if(typeof window.__officeDirectorDispatch==='function')window.__officeDirectorDispatch({type:'DIRECTOR_EVIDENCE',choice:which});
    pauseOverlay();getHost();notify(which==='staff'?'SECURE DELIVERY CONFIRMED · MIRA HAS THE FILE':'CORPORATE ARCHIVE UPDATED · BONUS RECORDED');
  }
  const stat=(label,value)=>`<div class="dc-stat"><strong>${escapeHTML(value)}</strong><span>${label}</span></div>`;
  const gradeFor=v=>v>=94?'A+':v>=85?'A':v>=75?'B':v>=62?'C':v>=48?'D':'REVIEW';
  function finalReview(signed=false){
    const g=game()||{},team=Math.max(0,Math.min(100,Number(g.teamTrust??50))),pressure=Math.max(0,Math.min(70,Number(g.kpiPressure??0)));
    const adsClicked=Number(g.adClicked||0),adsIgnored=Number(g.adsDismissed||0),ads=adsClicked+adsIgnored;
    const focus=ads?Math.round(100*adsIgnored/ads):null,output=Math.min(100,Math.round(100*(g.quest||0)/6));
    const countPeople=!!state.countPeople,countFocus=!!state.countFocus&&ads>0;
    const score=(!countPeople&&!countFocus?output:countPeople&&countFocus?output*.5+focus*.25+team*.25:(output*.65+(countPeople?team:focus)*.35));
    const grade=gradeFor(Math.round(score));
    const policy=g.directorEvidence||state.midChoice;
    const signedRules=state.finalChoice||'output';
    const words={
      'output':'ONLY THE OUTPUT',
      'output+people':'OUTPUT + PEOPLE',
      'output+focus':'OUTPUT + ATTENTION',
      'output+focus+people':'OUTPUT + ATTENTION + PEOPLE'
    };
    host.innerHTML=`<div class="dc-veil"><section class="dc-panel dc-end-panel dc-console" role="dialog" aria-modal="true" aria-label="The performance scoring engine">
      <header class="dc-header"><div class="dc-corp"><span class="dc-corp-mark">◆</span><div>ASTER CORPORATION<small>ALGORITHM CONTROL ROOM · SHIFT COMPLETE</small></div></div><button class="dc-close" data-dc="close" aria-label="Return to original ending">×</button></header>
      <div class="dc-review-top"><span class="dc-overline">FORM 09-B / THE PERFORMANCE ENGINE</span><h1>SAME SHIFT.<br><em>DIFFERENT GRADE.</em></h1>
      <p>The facts are fixed. Change what the company counts, and watch its verdict change.</p></div>
      <div class="dc-calibration"><div class="dc-algorithm-screen"><div class="dc-algorithm-label">ASTER / EMPLOYEE EVALUATION MODEL <span>LIVE</span></div>
        <div class="dc-model-face" aria-hidden="true"><span class="dc-face-eye"></span><span class="dc-face-eye"></span><span class="dc-face-mouth"></span></div>
        <span class="dc-eval-label">EMPLOYEE #001 · CURRENT VERDICT</span><strong class="dc-eval-grade" data-testid="director-grade">${grade}</strong><span class="dc-model-number" data-testid="director-index">MODEL INDEX ${Math.round(score)} / 100</span>
        <div class="dc-model-stamp">${signed?'POLICY CERTIFIED':grade==='A+'?'EXCEEDING TARGET':'UNDER REVIEW'}</div>
        <p class="dc-result-narrative">${signed?'The scoring rule has been recorded. Your decisions still happened.':(!countPeople&&!countFocus?'The system currently counts finished reports. Nothing else.':'The same shift is being evaluated under a different rule.')}</p>
      </div><div class="dc-rules"><div class="dc-rule-head"><strong>WHAT SHOULD COUNT?</strong><small>RECALIBRATE THE MACHINE</small></div>
        <div class="dc-rule dc-rule-locked"><div class="dc-rule-symbol">▣</div><div class="dc-rule-text"><strong>OUTPUT</strong><small>${Math.min(6,g.quest||0)} of 6 reports filed</small></div><span class="dc-switch dc-switch-on" aria-label="Output is counted">LOCKED IN</span></div>
        <button data-dc="toggle-focus" class="dc-rule dc-rule-button ${countFocus?'dc-is-on':''}" ${ads===0?'disabled aria-disabled="true"':''} aria-pressed="${countFocus}"><div class="dc-rule-symbol">◎</div><div class="dc-rule-text"><strong>ATTENTION</strong><small>${ads===0?'No interruptions observed':`${adsIgnored} resisted · ${adsClicked} opened`}</small></div><span class="dc-switch ${countFocus?'dc-switch-on':''}">${countFocus?'COUNTED':'IGNORED'}</span></button>
        <button data-dc="toggle-people" class="dc-rule dc-rule-button ${countPeople?'dc-is-on':''}" aria-pressed="${countPeople}"><div class="dc-rule-symbol">♧</div><div class="dc-rule-text"><strong>PEOPLE</strong><small>Team backing ${Math.round(team)} · KPI pressure ${Math.round(pressure)}</small></div><span class="dc-switch ${countPeople?'dc-switch-on':''}">${countPeople?'COUNTED':'IGNORED'}</span></button>
        <div class="dc-rule-hint">${policy==='staff'?'Mira kept the employee copy. The official score never included it.':policy==='board'?'Management received the evidence first. The score still left out the employees.':'Staff testimony was not submitted during this shift.'}</div>
      </div></div>
      ${signed?`<div class="dc-signature dc-calibration-signature"><strong>✦ ${escapeHTML(words[signedRules]||'CUSTOM POLICY')} · CERTIFIED</strong><p>Your shift did not change. The rules for judging it did.</p><button data-dc="close">RETURN TO YOUR SHIFT REPORT →</button></div>`:
      `<div class="dc-calibration-footer"><span><b>ONE SHIFT. MULTIPLE GRADES.</b> The verdict comes from the rule, not just the worker.</span><button class="dc-seal" data-dc="seal">✶ SEAL THIS SCORING POLICY →</button></div>`}
      <footer class="dc-footer"><span>THE MECHANICS MAKE THE ARGUMENT / <a target="_blank" rel="noopener noreferrer" href="https://mitpress.mit.edu/9780262026147/persuasive-games/">BOGOST, PERSUASIVE GAMES ↗</a></span><span>YOUR FINAL ACTION IS TO CHANGE A RULE.</span></footer>
    </section></div>`;
    bind();
  }
  function launchFinal(){mode='final';activateOverlay();finalReview(!!state.finalChoice)}
  function chooseFinal(){state.finalChoice='output'+(state.countFocus?'+focus':'')+(state.countPeople?'+people':'');state.finalSeen=true;persist();finalReview(true)}
  function bind(){
    if(!host)return;
    host.querySelectorAll('[data-dc]').forEach(el=>el.addEventListener('click',e=>{
      const key=el.getAttribute('data-dc');
      if(key==='open'){seeFile();return}
      if(key==='later'){promptLater();return}
      if(key==='close'){if(mode==='final'&&!state.finalSeen){state.finalSeen=true;persist()}pauseOverlay();return}
      if(key==='accessible'){mode='decision';renderEvidence(true);return}
      if(key==='staff'||key==='board'){makeChoice(key);return}
      if(key==='toggle-focus'){state.countFocus=!state.countFocus;persist();finalReview(false);return}
      if(key==='toggle-people'){state.countPeople=!state.countPeople;persist();finalReview(false);return}
      if(key==='seal'){chooseFinal();return}
      if(key==='reopen'){seeFile();return}
      if(key==='viewfinal'){launchFinal();return}
    }));
  }
  function tick(){
    const g=game();if(!g||typeof g.quest!=='number')return;
    getHost();
    // A newly reset shift is a new record, not an old decision accidentally replayed.
    if(g.quest===0&&g.score===0&&(state.lastQuest||0)>0&&!g.directorEvidence&&!g.won){state=initial();mode='idle';fadeRoot();persist()}
    state.lastQuest=g.quest;
    if(g.won&&!state.finalSeen&&mode!=='final'&&mode!=='evidence'&&mode!=='decision'){
      launchFinal();return;
    }
    if(!g.won&&mode==='final'){pauseOverlay();return}
    if(mode==='idle'&&!g.combat&&!g.gameOver&&!g.won&&g.quest>=3&&g.quest<6&&!g.directorEvidence&&!state.midDone&&!state.shown&&document.querySelector('.office-game.os-immersive')&&!document.querySelector('.reward-backdrop,.battle-panel,.final-mask')){
      midPrompt();return;
    }
    if(mode==='idle'&&state.deferred&&!state.midDone&&g.quest>=3&&!g.won&&document.querySelector('.office-game.os-immersive')){
      const icon=document.createElement('button');icon.className='dc-recurring';icon.setAttribute('data-dc','reopen');icon.textContent='✉ STAFF FILE';
      if(!host.querySelector('.dc-recurring')){host.className='dc-prompting';host.appendChild(icon);icon.addEventListener('click',seeFile)}
    }
    if(state.finalSeen&&g.won&&mode==='idle'&&!host.querySelector('.dc-review-again')){
      const icon=document.createElement('button');icon.className='dc-review-again';icon.textContent='▣ VIEW SIGNED REVIEW';host.className='dc-prompting';host.appendChild(icon);icon.addEventListener('click',launchFinal);
    }
    const stamp=`${g.quest}|${g.won}|${g.directorEvidence||''}|${state.midDone}|${state.finalSeen}`;
    if(stamp!==lastTick){lastTick=stamp;persist()}
  }
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&['evidence','decision','final','prompt'].includes(mode)){if(mode==='prompt')promptLater();else {if(mode==='final'&&!state.finalSeen){state.finalSeen=true;persist()}pauseOverlay()}}});
  document.addEventListener('fullscreenchange',()=>{if(host)getHost()});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{setInterval(tick,600);tick()});
  else {setInterval(tick,600);tick()}
})();