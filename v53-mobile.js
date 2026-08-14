/* v53 mobile view-state guard. Keeps login/role selection and the application
   as mutually exclusive screens even when legacy responsive CSS is present. */
(function(){
  'use strict';
  const entry=()=>document.getElementById('entryScreen');
  const shell=()=>document.getElementById('appShell');

  function syncScreenState(){
    const e=entry(), s=shell();
    if(!e||!s) return;
    const appVisible=!s.hidden;
    document.body.classList.toggle('mobileAppActive',appVisible);
    if(appVisible && !e.hidden) e.hidden=true;
    if(!appVisible && e.hidden) e.hidden=false;
  }

  function syncRoleHeader(){
    const s=shell();
    if(!s||s.hidden) return;
    const brand=document.querySelector('.topbar .brand');
    if(!brand) return;
    let badge=brand.querySelector('.mobileRoleLabel');
    if(!badge){
      badge=document.createElement('span');
      badge.className='mobileRoleLabel';
      brand.querySelector('div')?.appendChild(badge);
    }
    const fa=document.documentElement.lang==='fa'||document.documentElement.dir==='rtl';
    const role=document.body.classList.contains('expertMode')?'expert':document.body.classList.contains('managerMode')?'manager':'evaluator';
    const labels=fa?{evaluator:'پنل ارزیاب',expert:'پنل خبره',manager:'پنل مدیریت'}:{evaluator:'Evaluator panel',expert:'Expert panel',manager:'Management panel'};
    badge.textContent=labels[role];
  }

  function sync(){syncScreenState();syncRoleHeader();}

  window.addEventListener('DOMContentLoaded',()=>{
    sync();
    const e=entry(), s=shell();
    if(e)new MutationObserver(sync).observe(e,{attributes:true,attributeFilter:['hidden']});
    if(s)new MutationObserver(sync).observe(s,{attributes:true,attributeFilter:['hidden']});
    new MutationObserver(syncRoleHeader).observe(document.body,{attributes:true,attributeFilter:['class']});
    new MutationObserver(syncRoleHeader).observe(document.documentElement,{attributes:true,attributeFilter:['lang','dir']});
    document.querySelectorAll('#entryRoleChoices [data-role],#switchRoleButton').forEach(btn=>btn.addEventListener('click',()=>requestAnimationFrame(sync)));
  });
})();
