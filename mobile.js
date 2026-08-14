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
    modal.innerHTML='<div class="mobileInstallDialog" role="dialog" aria-modal="true" aria-labelledby="mobileInstallModalTitle"><h2 id="mobileInstallModalTitle"></h2><p id="mobileInstallModalText"></p><div id="mobileInstallSteps" class="mobileInstallPlatformList"></div><button class="mobileInstallClose" type="button" id="mobileInstallClose"></button></div>';
    document.body.appendChild(modal);

    const render=()=>{
      panel.querySelector('#mobileInstallTitle').textContent=txt('نصب سامانه روی تلفن همراه','Install on a mobile device');
      panel.querySelector('#mobileInstallHint').textContent=txt('راهنمای نصب برای Android و iOS؛ پس از نصب، سامانه بدون اینترنت اجرا می‌شود.','Installation guide for Android and iOS; after installation, the system can run offline.');
      panel.querySelector('#mobileInstallButton').textContent=txt('راهنمای نصب','Installation guide');
      modal.querySelector('#mobileInstallClose').textContent=txt('متوجه شدم','Done');
      modal.querySelector('#mobileInstallModalTitle').textContent=txt('نصب سامانه روی تلفن همراه','Install on a mobile device');
      modal.querySelector('#mobileInstallModalText').textContent=txt('براساس سیستم‌عامل تلفن همراه خود، یکی از دو روش زیر را انجام دهید.','Follow the instructions below for your mobile operating system.');
      modal.querySelector('#mobileInstallSteps').innerHTML=txt(
        '<section class="mobileInstallPlatform"><h3>iPhone / iPad (iOS)</h3><ol><li>این صفحه را در مرورگر Safari باز کنید.</li><li>دکمه Share را بزنید.</li><li>گزینه Add to Home Screen را انتخاب کنید.</li><li>در پایان Add را بزنید. آیکون سامانه روی صفحه اصلی قرار می‌گیرد.</li></ol></section><section class="mobileInstallPlatform"><h3>Android</h3><ol><li>این صفحه را در Chrome باز کنید.</li><li>منوی مرورگر را باز کنید.</li><li>Install app یا Add to Home screen را انتخاب کنید.</li><li>نصب را تأیید کنید تا آیکون سامانه روی صفحه اصلی قرار گیرد.</li></ol></section>',
        '<section class="mobileInstallPlatform"><h3>iPhone / iPad (iOS)</h3><ol><li>Open this page in Safari.</li><li>Tap the Share button.</li><li>Choose Add to Home Screen.</li><li>Tap Add. The app icon will be placed on your Home Screen.</li></ol></section><section class="mobileInstallPlatform"><h3>Android</h3><ol><li>Open this page in Chrome.</li><li>Open the browser menu.</li><li>Choose Install app or Add to Home screen.</li><li>Confirm installation to place the app icon on your Home screen.</li></ol></section>'
      );
      panel.hidden=isStandalone();
    };
    render();
    const observer=new MutationObserver(render); observer.observe(document.documentElement,{attributes:true,attributeFilter:['lang','dir']});
    panel.querySelector('#mobileInstallButton').addEventListener('click',()=>{modal.hidden=false;});
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

  window.addEventListener('DOMContentLoaded',()=>{if(window.matchMedia?.('(max-width:900px)').matches) buildManagerMobilePage();});
})();
