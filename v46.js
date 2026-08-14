/* v46 — revision-role visibility + expert edit-permission status */
(()=>{
  function activeAuthorization(){
    const a=state?.workflow?.editAuthorization;
    return a&&a.status==='active'?a:null;
  }

  function signedInUser(){return String(window.BAMCO_AUTH_USER||'').trim().toLowerCase()}

  function expertPermissionState(){
    const locked=!!state?.workflow?.locked;
    const authorization=activeAuthorization();
    const exact=!!(locked&&authorization&&authorization.targetRole==='expert'&&signedInUser()&&signedInUser()===String(authorization.targetUser||'').trim().toLowerCase()&&currentRole==='expert');
    return {locked,authorization,exact};
  }

  function syncExpertEditPermissionUi(){
    const panel=document.querySelector('#expertPanel');
    if(!panel)return;
    let notice=panel.querySelector('#expertEditPermissionNotice');
    const {locked,authorization,exact}=expertPermissionState();

    if(!locked){
      notice?.remove();
    }else{
      if(!notice){
        notice=document.createElement('section');
        notice.id='expertEditPermissionNotice';
        notice.className='expertEditPermissionNotice';
        panel.prepend(notice);
      }
      const fa=locale==='fa';
      if(exact){
        notice.className='expertEditPermissionNotice active';
        notice.innerHTML=`<strong>${fa?'مجوز اصلاح خبره فعال است':'Expert revision permission is active'}</strong><span>${fa?'این مجوز توسط':'Granted by'} <b dir="ltr">${esc(authorization.grantedBy||'—')}</b>${fa?' صادر شده است. دلیل: ':' — Reason: '}${esc(authorization.reason||'—')}</span><small>${fa?'پس از پایان اصلاحات، «تأیید اصلاحات و پایان مجوز» را بزنید.':'After finishing the revision, use “Confirm revisions and close permission”.'}</small>`;
      }else if(authorization?.targetRole==='expert'){
        notice.className='expertEditPermissionNotice waiting';
        notice.innerHTML=`<strong>${fa?'مجوز اصلاح خبره صادر شده است':'Expert revision permission has been granted'}</strong><span>${fa?'این مجوز برای کاربر':'This permission belongs to'} <b dir="ltr">${esc(authorization.targetUser||'—')}</b>${fa?' صادر شده است.':' .'}</span><small>${fa?'برای اصلاح باید با همان حساب وارد نقش خبره شوید.':'Sign in with that account and enter the Expert role to edit.'}</small>`;
      }else{
        notice.className='expertEditPermissionNotice locked';
        notice.innerHTML=`<strong>${fa?'فرم خبره قفل است':'Expert form is locked'}</strong><span>${fa?'فقط مدیریت می‌تواند برای یک کاربر مشخص در نقش خبره مجوز اصلاح صادر کند.':'Only Management can grant revision permission to a specific user in the Expert role.'}</span>`;
      }
    }

    const canEdit=!locked||exact;
    panel.querySelectorAll('input,textarea,select').forEach(el=>{
      el.disabled=!canEdit;
      el.setAttribute('aria-disabled',canEdit?'false':'true');
    });

    const reset=document.querySelector('#expertResetButton');
    const confirm=document.querySelector('#expertConfirmButton');
    const excel=document.querySelector('#expertExcelButton');
    if(reset){reset.disabled=locked&&!exact;reset.setAttribute('aria-disabled',reset.disabled?'true':'false')}
    if(confirm){
      if(locked&&!exact)confirm.disabled=true;
      if(exact)confirm.textContent=locale==='fa'?'تأیید اصلاحات و پایان مجوز':'Confirm revisions and close permission';
      else if(!locked)confirm.textContent=locale==='fa'?'تأیید نهایی':'Final Confirmation';
    }
    /* Export remains available for read-only access when it is otherwise valid. */
    if(excel)excel.setAttribute('aria-disabled',excel.disabled?'true':'false');
  }

  if(typeof window.renderExpertPanel==='function'){
    const previousRenderExpertPanel=window.renderExpertPanel;
    window.renderExpertPanel=function(...args){const out=previousRenderExpertPanel(...args);syncExpertEditPermissionUi();return out};
    renderExpertPanel=window.renderExpertPanel;
  }
  if(typeof window.renderExpertStatus==='function'){
    const previousRenderExpertStatus=window.renderExpertStatus;
    window.renderExpertStatus=function(...args){const out=previousRenderExpertStatus(...args);syncExpertEditPermissionUi();return out};
    renderExpertStatus=window.renderExpertStatus;
  }

  const previousPermissionRefresh=window.BAMCO_REFRESH_EDIT_PERMISSION_UI;
  window.BAMCO_REFRESH_EDIT_PERMISSION_UI=function(...args){
    const out=previousPermissionRefresh?previousPermissionRefresh(...args):undefined;
    syncExpertEditPermissionUi();
    return out;
  };

  const previousSetLocale=setLocale;
  setLocale=function(next){const out=previousSetLocale(next);syncExpertEditPermissionUi();return out};

  document.querySelectorAll('[data-role]').forEach(btn=>btn.addEventListener('click',()=>requestAnimationFrame(syncExpertEditPermissionUi)));
  document.querySelector('#switchRoleButton')?.addEventListener('click',()=>requestAnimationFrame(syncExpertEditPermissionUi));
  window.addEventListener('bamco:case-restored',()=>requestAnimationFrame(syncExpertEditPermissionUi));
  syncExpertEditPermissionUi();
})();
