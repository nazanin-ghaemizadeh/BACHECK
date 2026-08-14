/* v32 — evidence removal fix, lock hardening, reopen translation/header layout, management revision history */
(()=>{
  const isLocked=()=>!!state?.workflow?.locked&&!(window.BAMCO_CAN_EDIT_CASE&&window.BAMCO_CAN_EDIT_CASE());

  function syncLockedMediaControls(){
    const locked=isLocked();
    document.querySelectorAll('[data-attachment-input],[data-vehicle-photo],[data-remove-attachment],[data-remove-vehicle-photo]').forEach(control=>{
      if('disabled' in control)control.disabled=locked;
      control.setAttribute('aria-disabled',locked?'true':'false');
    });
    document.querySelectorAll('.uploadButton,.vehiclePhotoButton,.vehiclePhotoRemove,.attachment button').forEach(control=>{
      control.setAttribute('aria-disabled',locked?'true':'false');
    });
  }

  function syncReopenUi(){
    const unlock=document.querySelector('#unlockAssessmentButton');
    if(unlock){
      const hasActive=state?.workflow?.editAuthorization?.status==='active';unlock.textContent=hasActive?(locale==='fa'?'تغییر مجوز ویرایش':'Change Edit Permission'):(locale==='fa'?'صدور مجوز ویرایش':'Grant Edit Permission');
      unlock.setAttribute('aria-label',unlock.textContent);
      document.body.classList.toggle('reopenVisible',!unlock.hidden);
    }else{
      document.body.classList.remove('reopenVisible');
    }
  }

  function revisionEntries(){
    return (Array.isArray(state?.auditTrail)?state.auditTrail:[])
      .filter(entry=>entry&&entry.type==='edit'&&entry.at)
      .slice()
      .reverse();
  }

  function renderRevisionHistory(){
    const card=document.querySelector('#revisionHistoryCard');
    const host=document.querySelector('#revisionHistoryList');
    if(!card||!host)return;
    const entries=revisionEntries();
    const show=currentRole==='manager'&&entries.length>0;
    card.hidden=!show;
    if(!show){host.innerHTML='';return;}

    const fa=locale==='fa';
    const title=document.querySelector('#revisionHistoryTitle');
    const hint=document.querySelector('#revisionHistoryHint');
    if(title)title.textContent=fa?'سوابق اصلاحات پرونده':'Case Revision History';
    if(hint)hint.textContent=fa
      ?'نام، دلیل اصلاح، تاریخ و زمان مجوز ویرایش و تغییرات همان جلسه'
      :'Name, revision reason, date, and time of the editing authorization and its session changes.';

    host.innerHTML=entries.map(entry=>{
      const d=new Date(entry.at);
      const date=Number.isNaN(d.getTime())?'—':d.toLocaleDateString(fa?'fa-IR':'en-GB',{year:'numeric',month:'2-digit',day:'2-digit'});
      const time=Number.isNaN(d.getTime())?'—':d.toLocaleTimeString(fa?'fa-IR':'en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
      const matchingAuthorization=(Array.isArray(state?.auditTrail)?state.auditTrail:[]).find(auth=>auth&&auth.type==='edit_authorization'&&(auth.at===entry.sessionOpenedAt||auth.at===entry.at)&&(!entry.actor||!auth.targetUser||String(auth.targetUser).toLowerCase()===String(entry.actor).toLowerCase()));
      const role=entry.targetRole||matchingAuthorization?.targetRole||'';
      const roleText=role==='expert'?(fa?'خبره':'Expert'):role==='evaluator'?(fa?'ارزیاب':'Evaluator'):'—';
      return `<article class="revisionEntry">
        <div class="revisionField"><span>${fa?'نام ویرایش‌کننده':'Editor'}</span><strong>${esc(entry.actor||'—')}</strong></div>
        <div class="revisionField revisionRole"><span>${fa?'نقش اصلاح‌کننده':'Revision role'}</span><strong>${roleText}</strong></div>
        <div class="revisionField revisionReason"><span>${fa?'دلیل اصلاح':'Revision reason'}</span><strong>${esc(entry.reason||'—')}</strong></div>
        <div class="revisionField"><span>${fa?(entry.pending?'تاریخ مجوز ویرایش':'تاریخ ویرایش'):(entry.pending?'Authorization date':'Revision date')}</span><strong>${date}</strong></div>
        <div class="revisionField"><span>${fa?(entry.pending?'زمان مجوز ویرایش':'زمان ویرایش'):(entry.pending?'Authorization time':'Revision time')}</span><strong>${time}</strong></div>
      </article>`;
    }).join('');
  }

  /* Capture remove clicks so newly-added evidence is removable immediately.
     This also prevents the older per-button listener from firing a second time. */
  document.addEventListener('click',event=>{
    const remove=event.target.closest?.('[data-remove-attachment]');
    if(remove){
      event.preventDefault();
      event.stopImmediatePropagation();
      if(isLocked())return;
      const raw=remove.dataset.removeAttachment||'';
      const cut=raw.lastIndexOf('|');
      if(cut<1)return;
      const key=raw.slice(0,cut),index=Number(raw.slice(cut+1));
      if(!Number.isInteger(index))return;
      removeAttachment(key,index);
      return;
    }

    if(isLocked()&&event.target.closest?.('.uploadButton,.vehiclePhotoButton,.vehiclePhotoRemove')){
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  },true);

  /* Block file-input mutation events while locked, even if triggered outside normal pointer flow. */
  document.addEventListener('change',event=>{
    if(!isLocked())return;
    if(event.target.matches?.('[data-attachment-input],[data-vehicle-photo]')){
      event.preventDefault();
      event.stopImmediatePropagation();
      event.target.value='';
    }
  },true);

  const previousManagerRefresh=window.managerRefresh||managerRefresh;
  managerRefresh=function(...args){
    const out=previousManagerRefresh(...args);
    syncReopenUi();
    syncLockedMediaControls();
    renderRevisionHistory();
    return out;
  };
  window.managerRefresh=managerRefresh;

  const previousSetLocale=setLocale;
  setLocale=function(next){
    const out=previousSetLocale(next);
    syncReopenUi();
    syncLockedMediaControls();
    renderRevisionHistory();
    return out;
  };

  /* Keep role switches and any direct workflow redraws synchronized. */
  document.querySelector('#switchRoleButton')?.addEventListener('click',()=>requestAnimationFrame(()=>{
    syncReopenUi();
    syncLockedMediaControls();
    renderRevisionHistory();
  }));

  syncReopenUi();
  syncLockedMediaControls();
  renderRevisionHistory();
  if(typeof update==='function')update();
})();
