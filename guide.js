(function(){
  const entry=document.querySelector('#entryScreen');
  const loginPanel=document.querySelector('#entryLoginPanel');
  const guidePanel=document.querySelector('#entryGuidePanel');
  const buttons=[...document.querySelectorAll('[data-entry-tab]')];
  if(!entry||!loginPanel||!guidePanel||!buttons.length)return;

  function selectTab(name){
    const guide=name==='guide';
    loginPanel.hidden=guide;
    guidePanel.hidden=!guide;
    entry.classList.toggle('guideMode',guide);
    buttons.forEach(button=>{
      const active=button.dataset.entryTab===name;
      button.classList.toggle('active',active);
      button.setAttribute('aria-selected',String(active));
      button.tabIndex=active?0:-1;
    });
    if(guide)window.scrollTo({top:0,behavior:'instant'});
  }

  buttons.forEach(button=>button.addEventListener('click',()=>selectTab(button.dataset.entryTab)));
  document.querySelectorAll('[data-guide-login]').forEach(button=>button.addEventListener('click',()=>selectTab('login')));
  document.querySelectorAll('[data-guide-role]').forEach(button=>button.addEventListener('click',()=>{
    selectTab('login');
    document.querySelector(`.roleChoice[data-role="${button.dataset.guideRole}"]`)?.focus();
  }));
  document.querySelector('#switchRoleButton')?.addEventListener('click',()=>selectTab('login'));
  selectTab('login');
})();
