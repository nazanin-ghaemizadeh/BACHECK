/* v49 — evaluator lock notice + expert Excel read-only export availability */
(()=>{
  const user=()=>String(window.BAMCO_AUTH_USER||'').trim().toLowerCase();
  const authorization=()=>{
    try{
      const a=state?.workflow?.editAuthorization;
      return a&&a.status==='active'?a:null;
    }catch(_){return null}
  };
  const evaluatorExact=()=>{
    const a=authorization();
    return !!(state?.workflow?.locked&&a&&a.targetRole==='evaluator'&&currentRole==='evaluator'&&user()&&user()===String(a.targetUser||'').trim().toLowerCase());
  };

  function syncEvaluatorLockNotice(){
    const formTop=document.querySelector('.metadata');
    if(!formTop)return;
    let notice=document.querySelector('#evaluatorEditPermissionNotice');
    const evaluator=currentRole==='evaluator';
    const locked=!!state?.workflow?.locked;
    if(!evaluator||!locked){notice?.remove();return}
    if(!notice){
      notice=document.createElement('section');
      notice.id='evaluatorEditPermissionNotice';
      notice.className='evaluatorEditPermissionNotice evaluatorOnly';
      formTop.before(notice);
    }
    const fa=locale==='fa',a=authorization();
    if(evaluatorExact()){
      notice.className='evaluatorEditPermissionNotice evaluatorOnly active';
      notice.innerHTML=`<strong>${fa?'مجوز اصلاح ارزیاب فعال است':'Evaluator revision permission is active'}</strong><span>${fa?'این مجوز توسط':'Granted by'} <b dir="ltr">${esc(a?.grantedBy||'—')}</b>${fa?' صادر شده است. دلیل: ':' — Reason: '}${esc(a?.reason||'—')}</span><small>${fa?'پس از پایان اصلاحات، پرونده را دوباره تأیید و قفل کنید.':'After completing the revision, finalize and lock the case again.'}</small>`;
    }else if(a?.targetRole==='evaluator'){
      notice.className='evaluatorEditPermissionNotice evaluatorOnly waiting';
      notice.innerHTML=`<strong>${fa?'فرم ارزیابی قفل است':'The assessment form is locked'}</strong><span>${fa?'مجوز اصلاح برای کاربر':'Revision permission belongs to'} <b dir="ltr">${esc(a.targetUser||'—')}</b>${fa?' صادر شده است.':' .'}</span><small>${fa?'برای ویرایش باید با همان حساب وارد نقش ارزیاب شوید.':'Sign in with that account and enter the Evaluator role to edit.'}</small>`;
    }else{
      notice.className='evaluatorEditPermissionNotice evaluatorOnly locked';
      notice.innerHTML=`<strong>${fa?'فرم ارزیابی قفل است':'The assessment form is locked'}</strong><span>${fa?'فقط مدیریت می‌تواند برای یک کاربر مشخص در نقش ارزیاب مجوز اصلاح صادر کند.':'Only Management can grant revision permission to a specific user in the Evaluator role.'}</span>`;
    }
  }

  function syncExpertExcelAvailability(){
    const button=document.querySelector('#expertExcelButton');
    if(!button)return;
    let ready=false;
    try{ready=Math.abs(expertTotal()-1)<1e-9&&expertWeightsComplete()}catch(_){ready=false}
    button.disabled=!ready;
    button.setAttribute('aria-disabled',ready?'false':'true');
    button.title=ready?'':(locale==='fa'?'برای دریافت خروجی، وزن همه شاخص‌ها باید تکمیل و مجموع آن‌ها دقیقاً برابر ۱ باشد.':'To export, all criterion weights must be complete and their total must equal exactly 1.');
  }

  if(typeof window.renderExpertStatus==='function'){
    const prior=window.renderExpertStatus;
    window.renderExpertStatus=function(...args){const out=prior(...args);syncExpertExcelAvailability();return out};
    renderExpertStatus=window.renderExpertStatus;
  }
  if(typeof window.renderExpertPanel==='function'){
    const prior=window.renderExpertPanel;
    window.renderExpertPanel=function(...args){const out=prior(...args);syncExpertExcelAvailability();return out};
    renderExpertPanel=window.renderExpertPanel;
  }
  if(typeof renderWorkflow==='function'){
    const prior=renderWorkflow;
    renderWorkflow=function(...args){const out=prior.apply(this,args);syncEvaluatorLockNotice();syncExpertExcelAvailability();return out};
    window.renderWorkflow=renderWorkflow;
  }

  const priorPermissionRefresh=window.BAMCO_REFRESH_EDIT_PERMISSION_UI;
  window.BAMCO_REFRESH_EDIT_PERMISSION_UI=function(...args){
    const out=priorPermissionRefresh?priorPermissionRefresh(...args):undefined;
    syncEvaluatorLockNotice();
    syncExpertExcelAvailability();
    return out;
  };

  const priorLocale=setLocale;
  setLocale=function(next){const out=priorLocale(next);syncEvaluatorLockNotice();syncExpertExcelAvailability();return out};

  document.querySelectorAll('[data-role]').forEach(btn=>btn.addEventListener('click',()=>requestAnimationFrame(()=>{syncEvaluatorLockNotice();syncExpertExcelAvailability()})));
  document.querySelector('#switchRoleButton')?.addEventListener('click',()=>requestAnimationFrame(()=>{syncEvaluatorLockNotice();syncExpertExcelAvailability()}));
  window.addEventListener('bamco:case-restored',()=>requestAnimationFrame(()=>{syncEvaluatorLockNotice();syncExpertExcelAvailability()}));

  let queued=false;
  const observer=new MutationObserver(()=>{
    if(queued)return;queued=true;
    requestAnimationFrame(()=>{queued=false;syncEvaluatorLockNotice();syncExpertExcelAvailability()});
  });
  observer.observe(document.body,{subtree:true,childList:true});
  syncEvaluatorLockNotice();
  syncExpertExcelAvailability();
})();
