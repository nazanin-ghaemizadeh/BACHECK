/* v42 — authenticated entry, complete restore refresh, comparison presentation refinements */
(()=>{
  const AUTH_KEY='bamco-authenticated-user';
  const USER_ROLES={
    'ghaemizadeh@bamco.ir':['evaluator','expert','manager'],
    'a.zare@bamco.ir':['evaluator','expert','manager'],
    'tanhayian@bamco.ir':['evaluator','expert','manager'],
    'hosseinzadeh@bamco.ir':['manager']
  };
  const USERS=new Set(Object.keys(USER_ROLES));
  const PASSWORD='123456';
  window.BAMCO_USER_ROLES=USER_ROLES;
  window.BAMCO_AUTH_USERS=Object.keys(USER_ROLES);

  const authForm=document.querySelector('#entryAuthForm');
  const usernameInput=document.querySelector('#authUsername');
  const passwordInput=document.querySelector('#authPassword');
  const authMessage=document.querySelector('#entryAuthMessage');
  const roleChoices=document.querySelector('#entryRoleChoices');
  const authenticatedBar=document.querySelector('#entryAuthenticatedBar');
  const authenticatedUser=document.querySelector('#entryAuthenticatedUser');
  const signOutButton=document.querySelector('#entrySignOutButton');

  function readUser(){
    try{
      const value=sessionStorage.getItem(AUTH_KEY)||'';
      return USERS.has(value)?value:'';
    }catch(_){return ''}
  }

  function setAuthUser(value){
    const user=String(value||'').trim().toLowerCase();
    window.BAMCO_AUTH_USER=USERS.has(user)?user:null;
    try{
      if(window.BAMCO_AUTH_USER)sessionStorage.setItem(AUTH_KEY,window.BAMCO_AUTH_USER);
      else sessionStorage.removeItem(AUTH_KEY);
    }catch(_){}
    renderAuthState();
  }

  function authCopy(){
    const fa=locale==='fa';
    const prompt=document.querySelector('#entryAuthPrompt');
    const userLabel=document.querySelector('#authUsernameLabel');
    const passwordLabel=document.querySelector('#authPasswordLabel');
    const loginButton=document.querySelector('#authLoginButton');
    const allowedRoles=USER_ROLES[window.BAMCO_AUTH_USER]||[];
    if(prompt)prompt.textContent=window.BAMCO_AUTH_USER
      ? (allowedRoles.length===1
          ? (fa?'پنل مجاز حساب خود را برای ادامه انتخاب کنید.':'Choose the panel available to this account.')
          : (fa?'یکی از پنل‌های مجاز را برای ادامه انتخاب کنید.':'Choose one of your available panels to continue.'))
      : (fa?'برای ورود، نام کاربری و رمز عبور را وارد کنید.':'Enter your username and password to sign in.');
    if(userLabel)userLabel.textContent=fa?'نام کاربری':'Username';
    if(passwordLabel)passwordLabel.textContent=fa?'رمز عبور':'Password';
    if(loginButton)loginButton.textContent=fa?'ورود':'Sign in';
    if(signOutButton)signOutButton.textContent=fa?'خروج از حساب':'Sign out';
    if(authenticatedUser&&window.BAMCO_AUTH_USER){
      authenticatedUser.innerHTML=fa
        ? `<span class="authSignedLabel" dir="rtl">کاربر واردشده:</span> <bdi class="authSignedEmail" dir="ltr">${window.BAMCO_AUTH_USER}</bdi>`
        : `<span class="authSignedLabel" dir="ltr">Signed in as:</span> <bdi class="authSignedEmail" dir="ltr">${window.BAMCO_AUTH_USER}</bdi>`;
    }
    if(usernameInput)usernameInput.placeholder='name@bamco.ir';
  }

  function renderRoleAccess(){
    const roles=USER_ROLES[window.BAMCO_AUTH_USER]||[];
    document.querySelectorAll('#entryRoleChoices [data-role]').forEach(button=>{
      const allowed=roles.includes(button.dataset.role);
      button.hidden=!allowed;
      button.disabled=!allowed;
      button.setAttribute('aria-hidden',allowed?'false':'true');
    });
  }

  function renderAuthState(){
    const loggedIn=!!window.BAMCO_AUTH_USER;
    if(authForm)authForm.hidden=loggedIn;
    if(roleChoices)roleChoices.hidden=!loggedIn;
    if(authenticatedBar)authenticatedBar.hidden=!loggedIn;
    if(authMessage&&!loggedIn)authMessage.textContent='';
    renderRoleAccess();
    authCopy();
    if(window.BAMCO_REFRESH_EDIT_PERMISSION_UI)window.BAMCO_REFRESH_EDIT_PERMISSION_UI();
  }

  window.BAMCO_AUTH_USER=readUser()||null;
  renderAuthState();

  authForm?.addEventListener('submit',event=>{
    event.preventDefault();
    const username=String(usernameInput?.value||'').trim().toLowerCase();
    const password=String(passwordInput?.value||'');
    if(USERS.has(username)&&password===PASSWORD){
      if(authMessage){authMessage.className='entryAuthMessage success';authMessage.textContent=locale==='fa'?'ورود موفق بود. پنل موردنظر را انتخاب کنید.':'Signed in. Choose a panel.';}
      if(passwordInput)passwordInput.value='';
      setAuthUser(username);
      roleChoices?.querySelector('button:not([hidden]):not([disabled])')?.focus();
      return;
    }
    if(authMessage){authMessage.className='entryAuthMessage error';authMessage.textContent=locale==='fa'?'نام کاربری یا رمز عبور نادرست است.':'Incorrect username or password.';}
    passwordInput?.focus();
    if(passwordInput)passwordInput.select();
  });

  signOutButton?.addEventListener('click',()=>{
    setAuthUser('');
    if(usernameInput)usernameInput.value='';
    if(passwordInput)passwordInput.value='';
    usernameInput?.focus();
  });

  /* Defense in depth: a role cannot be entered before a valid local sign-in. */
  document.querySelectorAll('[data-role]').forEach(button=>{
    button.addEventListener('click',event=>{
      const user=window.BAMCO_AUTH_USER;
      const allowed=user&&(USER_ROLES[user]||[]).includes(button.dataset.role);
      if(allowed)return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if(authMessage){
        authMessage.className='entryAuthMessage error';
        authMessage.textContent=!user
          ?(locale==='fa'?'ابتدا وارد حساب کاربری شوید.':'Sign in first.')
          :(locale==='fa'?'این حساب به این پنل دسترسی ندارد.':'This account does not have access to this panel.');
      }
      if(!user)usernameInput?.focus();
    },true);
  });

  const previousSetLocale=setLocale;
  setLocale=function(next){
    const result=previousSetLocale(next);
    authCopy();
    return result;
  };

  /* A full-case restore must visibly restore final comments and revision history, not only state. */
  window.addEventListener('bamco:case-restored',()=>{
    document.querySelectorAll('[data-final-comment]').forEach(input=>{
      const role=input.dataset.finalComment;
      input.value=state.finalComments?.[role]||'';
    });
    try{setLocale(locale)}catch(_){
      if(typeof update==='function')update();
    }
  });

  /* Exact legacy artifact requested to be absent from the comparison workspace. */
  function scrubLegacyComparisonArtifact(){
    const root=document.querySelector('#managerComparisonCard');
    if(!root)return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(node=>{
      if(node.nodeValue?.includes('465360.262'))node.nodeValue=node.nodeValue.replace(/465360\.262/g,'');
    });
  }
  const comparisonRoot=document.querySelector('#managerComparisonCard');
  if(comparisonRoot){
    scrubLegacyComparisonArtifact();
    new MutationObserver(scrubLegacyComparisonArtifact).observe(comparisonRoot,{subtree:true,childList:true,characterData:true});
  }
})();
