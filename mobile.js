/* v51 mobile/PWA runtime. No remote services; all app data remains local to the installed app/browser. */
(function(){
  'use strict';
  const isStandalone=()=>window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true;
  if(isStandalone()) document.body.classList.add('pwaStandalone');

  if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){
    window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));
  }

  let deferredPrompt=null;
  const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const fa=()=>document.documentElement.lang==='fa' || document.documentElement.dir==='rtl';
  const txt=(a,b)=>fa()?a:b;

  function buildInstallUI(){
    const login=document.querySelector('#entryLoginPanel');
    if(!login||document.querySelector('#mobileInstallPanel')) return;
    const panel=document.createElement('div');
    panel.className='mobileInstallPanel'; panel.id='mobileInstallPanel';
    panel.innerHTML='<div class="mobileInstallCopy"><strong id="mobileInstallTitle"></strong><span id="mobileInstallHint"></span></div><button class="mobileInstallButton" id="mobileInstallButton" type="button"></button>';
    login.appendChild(panel);

    const modal=document.createElement('div'); modal.className='mobileInstallModal'; modal.id='mobileInstallModal'; modal.hidden=true;
    modal.innerHTML='<div class="mobileInstallDialog" role="dialog" aria-modal="true" aria-labelledby="mobileInstallModalTitle"><h2 id="mobileInstallModalTitle"></h2><p id="mobileInstallModalText"></p><ol id="mobileInstallSteps"></ol><button class="mobileInstallClose" type="button" id="mobileInstallClose"></button></div>';
    document.body.appendChild(modal);

    const render=()=>{
      panel.querySelector('#mobileInstallTitle').textContent=txt('نصب سامانه روی گوشی','Install on this phone');
      panel.querySelector('#mobileInstallHint').textContent=txt('پس از نصب، سامانه بدون اینترنت اجرا می‌شود و داده‌ها روی همین دستگاه می‌مانند.','After installation, the system works offline and keeps data on this device.');
      panel.querySelector('#mobileInstallButton').textContent=txt('نصب اپ','Install app');
      modal.querySelector('#mobileInstallClose').textContent=txt('متوجه شدم','Done');
      modal.querySelector('#mobileInstallModalTitle').textContent=txt('نصب سامانه روی صفحه اصلی','Install the app');
      if(isIOS()){
        modal.querySelector('#mobileInstallModalText').textContent=txt('در iPhone و iPad نصب از منوی Share مرورگر Safari انجام می‌شود.','On iPhone and iPad, install from Safari’s Share menu.');
        modal.querySelector('#mobileInstallSteps').innerHTML=txt('<li>این صفحه را در Safari باز کنید.</li><li>دکمه Share را بزنید.</li><li>Add to Home Screen را انتخاب کنید و سپس Add را بزنید.</li>','<li>Open this page in Safari.</li><li>Tap Share.</li><li>Choose Add to Home Screen, then tap Add.</li>');
      }else{
        modal.querySelector('#mobileInstallModalText').textContent=txt('اگر پنجره نصب خودکار نمایش داده نشد، از منوی مرورگر گزینه Install app یا Add to Home screen را انتخاب کنید.','If the install prompt is not available, use your browser menu and choose Install app or Add to Home screen.');
        modal.querySelector('#mobileInstallSteps').innerHTML=txt('<li>منوی مرورگر را باز کنید.</li><li>Install app یا Add to Home screen را بزنید.</li><li>پس از نصب، آیکون BAMCO روی صفحه اصلی قرار می‌گیرد.</li>','<li>Open the browser menu.</li><li>Choose Install app or Add to Home screen.</li><li>The BAMCO icon will appear on your Home screen.</li>');
      }
      panel.hidden=isStandalone();
    };
    render();
    const observer=new MutationObserver(render); observer.observe(document.documentElement,{attributes:true,attributeFilter:['lang','dir']});
    panel.querySelector('#mobileInstallButton').addEventListener('click',async()=>{
      if(deferredPrompt){
        deferredPrompt.prompt();
        try{await deferredPrompt.userChoice;}catch(_){ }
        deferredPrompt=null; render(); return;
      }
      modal.hidden=false;
    });
    modal.querySelector('#mobileInstallClose').addEventListener('click',()=>modal.hidden=true);
    modal.addEventListener('click',e=>{if(e.target===modal) modal.hidden=true});
  }

  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;buildInstallUI();});
  window.addEventListener('appinstalled',()=>{deferredPrompt=null;document.body.classList.add('pwaStandalone');const p=document.querySelector('#mobileInstallPanel');if(p)p.hidden=true;});
  window.addEventListener('DOMContentLoaded',buildInstallUI);

  function buildOfflineBadge(){
    if(document.querySelector('#mobileOfflineBadge')) return;
    const badge=document.createElement('div'); badge.id='mobileOfflineBadge'; badge.className='mobileOfflineBadge'; document.body.appendChild(badge);
    const update=()=>{badge.hidden=navigator.onLine;badge.textContent=txt('حالت آفلاین','Offline mode')};
    update(); window.addEventListener('online',update);window.addEventListener('offline',update);
    new MutationObserver(update).observe(document.documentElement,{attributes:true,attributeFilter:['lang','dir']});
  }
  window.addEventListener('DOMContentLoaded',buildOfflineBadge);


  function buildManagerMobilePage(){
    if(document.querySelector('#mobileManagerPage')) return;
    const appShell=document.querySelector('#appShell');
    const main=appShell?.querySelector(':scope > main');
    if(!appShell||!main) return;

    const page=document.createElement('section');
    page.id='mobileManagerPage';
    page.className='mobileManagerPage';
    page.hidden=true;
    page.innerHTML=`
      <header class="mobileManagerHeader">
        <div class="mobileManagerHeaderTop">
          <button class="mobileManagerBack" id="mobileManagerBack" type="button"></button>
          <div class="mobileManagerTitleWrap"><strong id="mobileManagerTitle"></strong><span id="mobileManagerSubtitle"></span></div>
          <button class="mobileManagerLanguage" id="mobileManagerLanguage" type="button"></button>
        </div>
        <div class="mobileManagerActions" id="mobileManagerActions">
          <button data-manager-proxy="backupButton" type="button"></button>
          <button data-manager-proxy="loadInput" type="button"></button>
          <button data-manager-proxy="managerExcelButton" type="button"></button>
          <button data-manager-proxy="excelButton" type="button"></button>
          <button class="mobileManagerAuthorize" data-manager-proxy="unlockAssessmentButton" type="button"></button>
        </div>
      </header>
      <nav class="mobileManagerTabs" id="mobileManagerTabs" aria-label="Management sections">
        <button class="active" data-manager-tab="overview" type="button"></button>
        <button data-manager-tab="analytics" type="button"></button>
        <button data-manager-tab="tools" type="button"></button>
        <button data-manager-tab="records" type="button"></button>
      </nav>
      <div class="mobileManagerPanels">
        <section class="mobileManagerPanel" data-manager-panel="overview"></section>
        <section class="mobileManagerPanel" data-manager-panel="analytics" hidden></section>
        <section class="mobileManagerPanel" data-manager-panel="tools" hidden></section>
        <section class="mobileManagerPanel" data-manager-panel="records" hidden></section>
      </div>`;
    main.prepend(page);

    const panel=name=>page.querySelector(`[data-manager-panel="${name}"]`);
    const move=(selector,target)=>{const el=document.querySelector(selector);if(el)panel(target)?.appendChild(el)};

    move('.managerHero','overview');
    move('#managerVehiclePhotos','overview');
    move('.dashboard.managerOnly','overview');
    move('.summary.managerOnly','overview');
    move('.classificationCard.managerOnly','overview');

    move('.analyticsGrid.managerOnly','analytics');
    move('#strengthWeaknessCard','analytics');

    move('#managerWeightPanel','tools');
    move('#managerComparisonEntry','tools');
    move('#managerComparisonCard','tools');

    move('#managerReviewComments','records');
    move('.managerFinalCommentCard','records');
    move('#revisionHistoryCard','records');

    const setTab=name=>{
      page.querySelectorAll('[data-manager-tab]').forEach(btn=>{
        const active=btn.dataset.managerTab===name;
        btn.classList.toggle('active',active);
        btn.setAttribute('aria-selected',String(active));
      });
      page.querySelectorAll('[data-manager-panel]').forEach(p=>p.hidden=p.dataset.managerPanel!==name);
      page.dataset.activeTab=name;
      window.scrollTo({top:0,behavior:'instant'});
    };
    page.querySelectorAll('[data-manager-tab]').forEach(btn=>btn.addEventListener('click',()=>setTab(btn.dataset.managerTab)));

    page.querySelector('#mobileManagerBack')?.addEventListener('click',()=>document.querySelector('#switchRoleButton')?.click());
    page.querySelector('#mobileManagerLanguage')?.addEventListener('click',()=>document.querySelector('#languageButton')?.click());
    page.querySelectorAll('[data-manager-proxy]').forEach(btn=>btn.addEventListener('click',()=>{
      const target=document.getElementById(btn.dataset.managerProxy);
      if(!target||target.disabled||target.hidden) return;
      target.click();
    }));

    const renderCopy=()=>{
      const isFa=fa();
      page.querySelector('#mobileManagerBack').textContent=isFa?'بازگشت':'Back';
      page.querySelector('#mobileManagerTitle').textContent=isFa?'داشبورد مدیریت':'Management Dashboard';
      page.querySelector('#mobileManagerSubtitle').textContent=isFa?'تحلیل، وزن‌دهی، مقایسه و سوابق پرونده':'Analysis, weights, comparison and case records';
      page.querySelector('#mobileManagerLanguage').textContent=isFa?'EN':'FA';
      const actionLabels=isFa?{
        backupButton:'پشتیبان پرونده',loadInput:'باز کردن پرونده',managerExcelButton:'اکسل مدیریت',excelButton:'اکسل ارزیابی',unlockAssessmentButton:'صدور مجوز اصلاح'
      }:{
        backupButton:'Case backup',loadInput:'Open case',managerExcelButton:'Management Excel',excelButton:'Assessment Excel',unlockAssessmentButton:'Authorize revision'
      };
      page.querySelectorAll('[data-manager-proxy]').forEach(btn=>btn.textContent=actionLabels[btn.dataset.managerProxy]||'');
      const tabLabels=isFa?{overview:'خلاصه',analytics:'نمودارها',tools:'وزن و مقایسه',records:'نظرات و سوابق'}:{overview:'Overview',analytics:'Charts',tools:'Weights & Compare',records:'Reviews & History'};
      page.querySelectorAll('[data-manager-tab]').forEach(btn=>btn.textContent=tabLabels[btn.dataset.managerTab]||'');
    };

    const sync=()=>{
      const manager=document.body.classList.contains('managerMode')&&!appShell.hidden;
      page.hidden=!manager;
      document.body.classList.toggle('mobileManagerActive',manager);
      if(manager&&!page.dataset.hasEntered){
        page.dataset.hasEntered='1';
        setTab('overview');
      }
      if(!manager) delete page.dataset.hasEntered;
      const source=document.querySelector('#unlockAssessmentButton');
      const auth=page.querySelector('[data-manager-proxy="unlockAssessmentButton"]');
      if(auth){
        const shouldHide=!source||source.hidden||source.disabled;
        auth.hidden=shouldHide;
        auth.disabled=shouldHide;
      }
      renderCopy();
    };

    new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});
    const unlock=document.querySelector('#unlockAssessmentButton');
    if(unlock)new MutationObserver(sync).observe(unlock,{attributes:true,attributeFilter:['hidden','disabled']});
    new MutationObserver(renderCopy).observe(document.documentElement,{attributes:true,attributeFilter:['lang','dir']});
    document.querySelectorAll('#entryRoleChoices [data-role], #switchRoleButton').forEach(el=>el.addEventListener('click',()=>requestAnimationFrame(sync)));
    sync();
  }

  window.addEventListener('DOMContentLoaded',buildManagerMobilePage);
})();
