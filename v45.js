/* v45 — locked evaluator experience hardening */
(()=>{
  function evaluatorEditAuthorized(){
    try{return currentRole==='evaluator' && !!window.BAMCO_CAN_EDIT_CASE?.()}catch(_){return false}
  }

  function enforceEvaluatorExperienceLock(){
    const select=document.querySelector('[data-experience-select="evaluator"]');
    const other=document.querySelector('[data-experience-other="evaluator"]');
    if(!select&&!other)return;
    const locked=!!state?.workflow?.locked;
    const canEdit=!locked || evaluatorEditAuthorized();
    if(select){
      select.disabled=!canEdit;
      select.setAttribute('aria-disabled',canEdit?'false':'true');
    }
    if(other){
      other.disabled=!canEdit;
      other.setAttribute('aria-disabled',canEdit?'false':'true');
    }
  }

  /* Re-apply after every metadata render, language switch, role change and permission refresh. */
  if(typeof renderMetadata==='function'){
    const previousRenderMetadata=renderMetadata;
    renderMetadata=function(...args){
      const out=previousRenderMetadata(...args);
      enforceEvaluatorExperienceLock();
      return out;
    };
  }

  const previousSetLocale=setLocale;
  setLocale=function(next){
    const out=previousSetLocale(next);
    enforceEvaluatorExperienceLock();
    return out;
  };

  document.querySelector('#switchRoleButton')?.addEventListener('click',()=>requestAnimationFrame(enforceEvaluatorExperienceLock));
  document.querySelectorAll('[data-role]').forEach(btn=>btn.addEventListener('click',()=>requestAnimationFrame(enforceEvaluatorExperienceLock)));

  /* Capture-phase guard: even scripted or keyboard changes cannot mutate this field while locked. */
  document.addEventListener('change',event=>{
    if(!event.target?.matches?.('[data-experience-select="evaluator"]'))return;
    if(!state?.workflow?.locked || evaluatorEditAuthorized())return;
    event.preventDefault();
    event.stopImmediatePropagation();
    renderMetadata();
  },true);
  document.addEventListener('input',event=>{
    if(!event.target?.matches?.('[data-experience-other="evaluator"]'))return;
    if(!state?.workflow?.locked || evaluatorEditAuthorized())return;
    event.preventDefault();
    event.stopImmediatePropagation();
    renderMetadata();
  },true);

  const observer=new MutationObserver(()=>enforceEvaluatorExperienceLock());
  observer.observe(document.body,{subtree:true,childList:true});
  enforceEvaluatorExperienceLock();
})();
