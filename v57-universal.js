/* BACHECK v57 — universal runtime layer for Windows Chrome, iOS and Android. */
(function(){
  'use strict';
  const isFa=()=>document.documentElement.lang==='fa'||document.documentElement.dir==='rtl';
  const txt=(fa,en)=>isFa()?fa:en;

  function unifyBrandArtwork(){
    document.querySelectorAll('#entryScreen .entryBrand img,.topbar .brand img').forEach(img=>{
      img.src='bamco-logo-mobile.png';
      img.alt=txt('لوگوی خودروسازان بم','BAMCO logo');
    });
  }

  function installUniversalStatus(){
    let el=document.getElementById('bacheckRuntimeStatus');
    if(!el){
      el=document.createElement('div');
      el.id='bacheckRuntimeStatus';
      el.className='bacheckRuntimeStatus';
      el.hidden=true;
      document.body.appendChild(el);
    }
    const render=()=>{
      el.textContent=navigator.onLine?txt('BACHECK آماده استفاده است','BACHECK is ready'):txt('BACHECK — حالت آفلاین','BACHECK — Offline');
      el.classList.toggle('offline',!navigator.onLine);
      el.hidden=navigator.onLine;
    };
    render();
    addEventListener('online',render);addEventListener('offline',render);
    new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:['lang','dir']});
  }

  function notifySW(){
    if(!('serviceWorker' in navigator))return;
    navigator.serviceWorker.ready.then(reg=>{
      try{reg.active?.postMessage({type:'BACHECK_WARM_CACHE'});}catch(_){}
    }).catch(()=>{});
  }

  function fixInstallCopy(){
    const panel=document.getElementById('mobileInstallPanel');
    if(!panel)return;
    const title=panel.querySelector('#mobileInstallTitle');
    const hint=panel.querySelector('#mobileInstallHint');
    if(title) title.textContent=txt('نصب BACHECK','Install BACHECK');
    if(hint) hint.textContent=txt('قابل نصب روی Windows، Android و iOS؛ پس از اولین بارگذاری کامل، بدون اینترنت اجرا می‌شود.','Installable on Windows, Android and iOS; after the first complete load, it runs offline.');
  }

  function upgradeInstallDialog(){
    const modal=document.getElementById('mobileInstallModal');
    if(!modal)return;
    const title=modal.querySelector('#mobileInstallModalTitle');
    const text=modal.querySelector('#mobileInstallModalText');
    const steps=modal.querySelector('#mobileInstallSteps');
    if(title) title.textContent=txt('نصب BACHECK','Install BACHECK');
    if(text) text.textContent=txt('روش مناسب دستگاه خود را انتخاب کنید.','Choose the instructions for your device.');
    if(steps) steps.innerHTML=txt(
      '<section class="mobileInstallPlatform"><h3>Windows — Chrome</h3><ol><li>لینک BACHECK را در Chrome باز کنید.</li><li>از نوار آدرس روی آیکون Install کلیک کنید یا منوی Chrome را باز کنید.</li><li>Install BACHECK را تأیید کنید.</li><li>پس از اولین بارگذاری کامل، اپ در حالت آفلاین نیز باز می‌شود.</li></ol></section><section class="mobileInstallPlatform"><h3>iPhone / iPad (iOS)</h3><ol><li>لینک را در Safari باز کنید.</li><li>Share را بزنید.</li><li>Add to Home Screen را انتخاب کنید.</li><li>Add را بزنید و یک‌بار اپ را با اینترنت کامل باز کنید.</li></ol></section><section class="mobileInstallPlatform"><h3>Android</h3><ol><li>لینک را در Chrome باز کنید.</li><li>منوی Chrome را باز کنید.</li><li>Install app یا Add to Home screen را انتخاب کنید.</li><li>پس از اولین بارگذاری کامل، BACHECK بدون اینترنت هم اجرا می‌شود.</li></ol></section>',
      '<section class="mobileInstallPlatform"><h3>Windows — Chrome</h3><ol><li>Open the BACHECK URL in Chrome.</li><li>Use the Install icon in the address bar or open the Chrome menu.</li><li>Confirm Install BACHECK.</li><li>After one complete online load, the app can open offline.</li></ol></section><section class="mobileInstallPlatform"><h3>iPhone / iPad (iOS)</h3><ol><li>Open the URL in Safari.</li><li>Tap Share.</li><li>Choose Add to Home Screen.</li><li>Tap Add, then open the app once while online.</li></ol></section><section class="mobileInstallPlatform"><h3>Android</h3><ol><li>Open the URL in Chrome.</li><li>Open the Chrome menu.</li><li>Choose Install app or Add to Home screen.</li><li>After one complete online load, BACHECK can run offline.</li></ol></section>'
    );
  }

  function universalizeDownloadLinks(){
    // Keep JSON and Excel delivery reliable across desktop and mobile.
    document.addEventListener('click',event=>{
      const a=event.target.closest?.('a[download]');
      if(!a)return;
      a.rel='noopener';
    },true);
  }

  function sync(){
    unifyBrandArtwork();
    fixInstallCopy();
    upgradeInstallDialog();
  }

  addEventListener('DOMContentLoaded',()=>{
    sync();installUniversalStatus();universalizeDownloadLinks();
    requestAnimationFrame(sync);setTimeout(sync,250);notifySW();
    new MutationObserver(()=>requestAnimationFrame(sync)).observe(document.body,{subtree:true,childList:true});
  });
  addEventListener('load',notifySW);
})();
