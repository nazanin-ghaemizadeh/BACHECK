/* v48 — evaluator locked view remains navigable but cannot mutate case data */
(()=>{
  function evaluatorAuthorized(){
    try{return currentRole==='evaluator' && !!window.BAMCO_CAN_EDIT_CASE?.()}catch(_){return false}
  }

  function setDisabled(el,disabled){
    if(!el)return;
    el.disabled=!!disabled;
    el.setAttribute('aria-disabled',disabled?'true':'false');
  }

  function enforceEvaluatorReadOnly(){
    if(typeof state==='undefined')return;
    const evaluator=currentRole==='evaluator';
    const locked=evaluator && !!state?.workflow?.locked && !evaluatorAuthorized();

    /* Navigation is deliberately left enabled in a locked case. */
    document.querySelectorAll('.criterionTab, #evaluatorVehiclePhotos .vehicleGalleryThumb').forEach(el=>{
      if(evaluator)setDisabled(el,false);
    });

    if(!evaluator)return;

    document.querySelectorAll('.metadata input, .metadata select, .metadata textarea').forEach(el=>{
      setDisabled(el,locked);
    });
    document.querySelectorAll('.assessmentLayout [data-score], .assessmentLayout [data-note], .assessmentLayout [data-attachment-input], .assessmentLayout [data-remove-attachment]').forEach(el=>{
      setDisabled(el,locked);
    });
    document.querySelectorAll('#evaluatorVehiclePhotos [data-vehicle-photo], #evaluatorVehiclePhotos [data-remove-vehicle-photo]').forEach(el=>{
      setDisabled(el,locked);
    });
    document.querySelectorAll('[data-final-comment="evaluator"]').forEach(el=>setDisabled(el,locked));

    const reset=document.querySelector('#resetButton');
    if(reset)setDisabled(reset,locked);

    /* Date remains readonly by design even when editing is authorized. */
    const date=document.querySelector('.metadata [data-meta="date"]');
    if(date)date.readOnly=true;
  }

  if(typeof renderTabs==='function'){
    const previousRenderTabs=renderTabs;
    renderTabs=function(...args){const out=previousRenderTabs.apply(this,args);enforceEvaluatorReadOnly();return out};
    window.renderTabs=renderTabs;
  }
  if(typeof renderCriteria==='function'){
    const previousRenderCriteria=renderCriteria;
    renderCriteria=function(...args){const out=previousRenderCriteria.apply(this,args);enforceEvaluatorReadOnly();return out};
    window.renderCriteria=renderCriteria;
  }
  if(typeof renderMetadata==='function'){
    const previousRenderMetadata=renderMetadata;
    renderMetadata=function(...args){const out=previousRenderMetadata.apply(this,args);enforceEvaluatorReadOnly();return out};
    window.renderMetadata=renderMetadata;
  }
  if(typeof renderVehiclePhotos==='function'){
    const previousRenderVehiclePhotos=renderVehiclePhotos;
    renderVehiclePhotos=function(...args){const out=previousRenderVehiclePhotos.apply(this,args);enforceEvaluatorReadOnly();return out};
    window.renderVehiclePhotos=renderVehiclePhotos;
  }

  const priorRefresh=window.BAMCO_REFRESH_EDIT_PERMISSION_UI;
  window.BAMCO_REFRESH_EDIT_PERMISSION_UI=function(...args){
    const out=priorRefresh?priorRefresh(...args):undefined;
    enforceEvaluatorReadOnly();
    return out;
  };

  const priorLocale=setLocale;
  setLocale=function(next){
    const out=priorLocale(next);
    enforceEvaluatorReadOnly();
    return out;
  };

  document.querySelectorAll('[data-role]').forEach(btn=>btn.addEventListener('click',()=>requestAnimationFrame(enforceEvaluatorReadOnly)));
  document.querySelector('#switchRoleButton')?.addEventListener('click',()=>requestAnimationFrame(enforceEvaluatorReadOnly));
  window.addEventListener('bamco:case-restored',()=>requestAnimationFrame(enforceEvaluatorReadOnly));

  /* Dynamic rerenders (criteria, comments, photos) should never reopen mutation controls. */
  let queued=false;
  const observer=new MutationObserver(()=>{
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;enforceEvaluatorReadOnly()});
  });
  observer.observe(document.body,{subtree:true,childList:true});
  enforceEvaluatorReadOnly();
})();
