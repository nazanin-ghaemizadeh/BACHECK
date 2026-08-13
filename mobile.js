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
})();
