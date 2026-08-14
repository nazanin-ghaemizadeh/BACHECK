(function(){
  const entry=document.querySelector('#entryScreen');
  const panels={login:document.querySelector('#entryLoginPanel'),guide:document.querySelector('#entryGuidePanel'),install:document.querySelector('#entryInstallPanel')};
  const buttons=[...document.querySelectorAll('[data-entry-tab]')];
  if(!entry||!panels.login||!panels.guide||!panels.install||!buttons.length)return;
  function selectTab(name){
    if(!panels[name])name='login';
    Object.entries(panels).forEach(([key,panel])=>panel.hidden=key!==name);
    entry.classList.toggle('guideMode',name==='guide'||name==='install');
    entry.classList.toggle('installMode',name==='install');
    buttons.forEach(button=>{const active=button.dataset.entryTab===name;button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1});
    if(name!=='login')window.scrollTo({top:0,behavior:'instant'});
  }
  buttons.forEach(button=>button.addEventListener('click',()=>selectTab(button.dataset.entryTab)));
  document.querySelectorAll('[data-guide-login]').forEach(button=>button.addEventListener('click',()=>selectTab('login')));
  document.querySelectorAll('[data-guide-role]').forEach(button=>button.addEventListener('click',()=>{selectTab('login');document.querySelector(`.roleChoice[data-role="${button.dataset.guideRole}"]`)?.focus()}));
  document.querySelector('#switchRoleButton')?.addEventListener('click',()=>selectTab('login'));
  window.BACHECK_SELECT_ENTRY_TAB=selectTab;
  selectTab('login');
})();