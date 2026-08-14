/* BACHECK v58 — universal offline/install/export reliability layer. */
(function(){
  'use strict';
  const isFa=()=>document.documentElement.lang==='fa'||document.documentElement.dir==='rtl';
  const txt=(fa,en)=>isFa()?fa:en;
  const isStandalone=()=>window.matchMedia?.('(display-mode: standalone)').matches||navigator.standalone===true;
  const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const isDesktop=()=>!window.matchMedia?.('(pointer:coarse)').matches&&window.innerWidth>900;
  let installPrompt=null;
  let fileObjectUrl=null;
  let fileObject=null;

  function setBrand(){
    document.querySelectorAll('#entryScreen .entryBrand img,.topbar .brand img').forEach(img=>{
      img.src='bamco-header-logo-v58.png';
      img.alt=txt('لوگوی BAC خودروسازان بم','BAC BAMCO logo');
    });
  }

  async function registerOffline(){
    if(!('serviceWorker' in navigator)) return;
    if(!(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')) return;
    try{
      const reg=await navigator.serviceWorker.register('./service-worker.js',{scope:'./',updateViaCache:'none'});
      try{await reg.update()}catch(_){}
      const ready=await navigator.serviceWorker.ready;
      try{ready.active?.postMessage({type:'BACHECK_WARM_CACHE_V58'})}catch(_){}
    }catch(err){console.error('BACHECK service worker registration failed',err)}
  }

  function installPanel(){
    const panel=document.getElementById('mobileInstallPanel');
    if(!panel) return;
    const button=panel.querySelector('#mobileInstallButton');
    const title=panel.querySelector('#mobileInstallTitle');
    const hint=panel.querySelector('#mobileInstallHint');
    panel.hidden=isStandalone();
    if(title) title.textContent=txt('نصب BACHECK','Install BACHECK');
    if(hint) hint.textContent=txt('نصب روی Windows، Android و iOS؛ پس از آماده‌شدن آفلاین، بدون اینترنت اجرا می‌شود.','Install on Windows, Android and iOS; once offline-ready, it can run without internet.');
    if(button){
      button.textContent=(installPrompt||isDesktop())?txt('نصب BACHECK','Install BACHECK'):txt('راهنمای نصب','Installation guide');
      button.dataset.directInstall=installPrompt?'1':'0';
    }
    const modal=document.getElementById('mobileInstallModal');
    if(modal){
      const mt=modal.querySelector('#mobileInstallModalTitle'), tx=modal.querySelector('#mobileInstallModalText'), steps=modal.querySelector('#mobileInstallSteps');
      if(mt)mt.textContent=txt('نصب BACHECK','Install BACHECK');
      if(tx)tx.textContent=txt('روش نصب متناسب با دستگاه خود را دنبال کنید.','Follow the installation method for your device.');
      if(steps)steps.innerHTML=txt(
        '<section class="mobileInstallPlatform"><h3>Windows — Chrome / Edge</h3><ol><li>لینک BACHECK را در Chrome یا Edge باز کنید.</li><li>روی «نصب BACHECK» بزنید؛ اگر دکمه نصب مستقیم ظاهر نشد، از منوی مرورگر گزینه Install app را انتخاب کنید.</li><li>پس از نصب، BACHECK را یک‌بار با اینترنت باز نگه دارید تا فایل‌های آفلاین کامل ذخیره شوند.</li></ol></section><section class="mobileInstallPlatform"><h3>iPhone / iPad (iOS)</h3><ol><li>لینک را در Safari باز کنید.</li><li>Share را بزنید و Add to Home Screen را انتخاب کنید.</li><li>Add را بزنید و BACHECK را یک‌بار با اینترنت کامل باز کنید.</li></ol></section><section class="mobileInstallPlatform"><h3>Android</h3><ol><li>لینک را در Chrome باز کنید.</li><li>Install app یا Add to Home screen را انتخاب کنید.</li><li>پس از نصب، BACHECK را یک‌بار با اینترنت کامل باز کنید.</li></ol></section>',
        '<section class="mobileInstallPlatform"><h3>Windows — Chrome / Edge</h3><ol><li>Open BACHECK in Chrome or Edge.</li><li>Click “Install BACHECK”; if the direct install button is unavailable, choose Install app from the browser menu.</li><li>After installation, keep BACHECK open online once so all offline files are stored.</li></ol></section><section class="mobileInstallPlatform"><h3>iPhone / iPad (iOS)</h3><ol><li>Open the URL in Safari.</li><li>Tap Share and choose Add to Home Screen.</li><li>Tap Add, then open BACHECK online once to complete offline storage.</li></ol></section><section class="mobileInstallPlatform"><h3>Android</h3><ol><li>Open the URL in Chrome.</li><li>Choose Install app or Add to Home screen.</li><li>Open BACHECK online once after installation to complete offline storage.</li></ol></section>'
      );
    }
  }

  function patchInstallButton(){
    const button=document.getElementById('mobileInstallButton');
    if(!button||button.dataset.v58Bound) return;
    button.dataset.v58Bound='1';
    button.addEventListener('click',async event=>{
      if(!installPrompt) return; // legacy listener opens instructions when direct prompt is unavailable.
      event.preventDefault();event.stopImmediatePropagation();
      const prompt=installPrompt;installPrompt=null;installPanel();
      try{await prompt.prompt();await prompt.userChoice}catch(err){console.warn('Install prompt failed',err)}
    },true);
  }

  addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();installPrompt=event;installPanel();patchInstallButton();
  });
  addEventListener('appinstalled',()=>{installPrompt=null;installPanel()});

  function offlineStatus(){
    let badge=document.getElementById('bacheckOfflineReadyV58');
    if(!badge){
      badge=document.createElement('div');badge.id='bacheckOfflineReadyV58';badge.className='bacheckOfflineReadyV58';badge.hidden=true;document.body.appendChild(badge);
    }
    const render=()=>{
      if(!navigator.onLine){badge.textContent=txt('BACHECK — آفلاین','BACHECK — Offline');badge.dataset.kind='offline';badge.hidden=false;return;}
      badge.hidden=true;
    };
    render();addEventListener('online',render);addEventListener('offline',render);
    if('serviceWorker' in navigator){navigator.serviceWorker.addEventListener('message',event=>{if(event.data?.type==='BACHECK_OFFLINE_READY_V58'&&navigator.onLine){badge.textContent=txt('BACHECK برای اجرای آفلاین آماده است','BACHECK is ready for offline use');badge.dataset.kind='ready';badge.hidden=false;setTimeout(()=>{if(navigator.onLine)badge.hidden=true},3500)}})}
  }

  function ensureFileDialog(){
    let modal=document.getElementById('bacheckFileDialogV58');
    if(modal) return modal;
    modal=document.createElement('div');modal.id='bacheckFileDialogV58';modal.className='bacheckFileDialogV58';modal.hidden=true;
    modal.innerHTML=`<div class="bacheckFileDialogCard" role="dialog" aria-modal="true">
      <h2 id="bacheckFileTitleV58"></h2><p id="bacheckFileTextV58"></p><strong id="bacheckFileNameV58" dir="ltr"></strong>
      <div class="bacheckFileActionsV58"><button type="button" id="bacheckShareV58"></button><a id="bacheckDownloadV58" rel="noopener"></a><a id="bacheckOpenV58" target="_blank" rel="noopener"></a></div>
      <button type="button" id="bacheckCloseV58" class="bacheckCloseV58"></button>
    </div>`;
    document.body.appendChild(modal);
    modal.querySelector('#bacheckCloseV58').addEventListener('click',()=>modal.hidden=true);
    modal.addEventListener('click',e=>{if(e.target===modal)modal.hidden=true});
    modal.querySelector('#bacheckShareV58').addEventListener('click',async()=>{
      if(!fileObject||!navigator.share) return;
      try{
        if(!navigator.canShare||navigator.canShare({files:[fileObject]})) await navigator.share({files:[fileObject],title:fileObject.name});
      }catch(err){if(err?.name!=='AbortError') showFileError((err&&err.message)||txt('اشتراک‌گذاری فایل انجام نشد.','File sharing failed.'));}
    });
    return modal;
  }

  function localizeFileDialog(modal){
    modal.querySelector('#bacheckShareV58').textContent=txt('ذخیره / اشتراک‌گذاری','Save / Share');
    modal.querySelector('#bacheckDownloadV58').textContent=txt('دانلود فایل','Download file');
    modal.querySelector('#bacheckOpenV58').textContent=txt('باز کردن فایل','Open file');
    modal.querySelector('#bacheckCloseV58').textContent=txt('بستن','Close');
  }

  function preparing(label){
    const modal=ensureFileDialog();localizeFileDialog(modal);modal.hidden=false;modal.dataset.state='preparing';
    modal.querySelector('#bacheckFileTitleV58').textContent=txt('در حال ساخت فایل اکسل','Preparing Excel file');
    modal.querySelector('#bacheckFileTextV58').textContent=txt('چند لحظه صبر کنید. فایل داخل همین دستگاه ساخته می‌شود.','Please wait. The file is being created locally on this device.');
    modal.querySelector('#bacheckFileNameV58').textContent=label||'';
    modal.querySelector('.bacheckFileActionsV58').hidden=true;
  }
  function showFileError(message){
    const modal=ensureFileDialog();localizeFileDialog(modal);modal.hidden=false;modal.dataset.state='error';
    modal.querySelector('#bacheckFileTitleV58').textContent=txt('ساخت یا ذخیره فایل ناموفق بود','File creation or saving failed');
    modal.querySelector('#bacheckFileTextV58').textContent=String(message||txt('دوباره تلاش کنید.','Please try again.'));
    modal.querySelector('#bacheckFileNameV58').textContent='';modal.querySelector('.bacheckFileActionsV58').hidden=true;
  }

  window.BAMCO_SHOW_EXCEL_PREPARING=preparing;
  window.BAMCO_SHOW_FILE_ERROR=showFileError;
  window.BAMCO_FILE_SAVE_IS_PREPARING=()=>ensureFileDialog().dataset.state==='preparing';

  window.BAMCO_SAVE_BLOB=async function(blob,fileName){
    if(!(blob instanceof Blob)||blob.size===0) throw new Error(txt('فایل خروجی ساخته نشد.','The output file was not created.'));
    const name=String(fileName||'bacheck_output');
    if(fileObjectUrl){try{URL.revokeObjectURL(fileObjectUrl)}catch(_){};fileObjectUrl=null}
    fileObjectUrl=URL.createObjectURL(blob);
    try{fileObject=new File([blob],name,{type:blob.type||'application/octet-stream',lastModified:Date.now()})}catch(_){fileObject=null}

    const modal=ensureFileDialog();localizeFileDialog(modal);modal.hidden=false;modal.dataset.state='ready';
    modal.querySelector('#bacheckFileTitleV58').textContent=/\.xlsx$/i.test(name)?txt('فایل اکسل آماده است','Excel file is ready'):txt('فایل آماده است','File is ready');
    modal.querySelector('#bacheckFileTextV58').textContent=isIOS()?txt('برای iPhone/iPad روی «ذخیره / اشتراک‌گذاری» بزنید و Save to Files را انتخاب کنید.','On iPhone/iPad, tap “Save / Share” and choose Save to Files.'):txt('فایل آماده ذخیره روی دستگاه است.','The file is ready to save on this device.');
    modal.querySelector('#bacheckFileNameV58').textContent=name;
    const share=modal.querySelector('#bacheckShareV58');
    share.hidden=!(fileObject&&navigator.share&&(!navigator.canShare||navigator.canShare({files:[fileObject]})));
    const download=modal.querySelector('#bacheckDownloadV58');download.href=fileObjectUrl;download.download=name;download.type=blob.type||'application/octet-stream';
    const open=modal.querySelector('#bacheckOpenV58');open.href=fileObjectUrl;open.hidden=!isIOS();
    modal.querySelector('.bacheckFileActionsV58').hidden=false;

    // Windows/desktop Chrome gets an immediate download and still keeps the manual link as fallback.
    if(isDesktop()){
      const a=document.createElement('a');a.href=fileObjectUrl;a.download=name;a.rel='noopener';a.style.position='fixed';a.style.left='-9999px';document.body.appendChild(a);
      try{a.click()}catch(_){}setTimeout(()=>a.remove(),1000);
    }
    // Keep the blob URL alive for manual save/share. It is revoked only when another export replaces it.
    return true;
  };

  async function ensureExcelJS(){
    if(window.ExcelJS?.Workbook) return window.ExcelJS;
    return await new Promise((resolve,reject)=>{
      const old=document.querySelector('script[data-bacheck-excel-fallback]');if(old)old.remove();
      const s=document.createElement('script');s.dataset.bacheckExcelFallback='1';s.src='./vendor/exceljs.min.js?v=58';s.onload=()=>window.ExcelJS?.Workbook?resolve(window.ExcelJS):reject(new Error(txt('ماژول ExcelJS پس از بارگذاری در دسترس نیست.','ExcelJS is unavailable after loading.')));s.onerror=()=>reject(new Error(txt('فایل محلی ExcelJS بارگذاری نشد.','The local ExcelJS file could not be loaded.')));document.head.appendChild(s);
    });
  }

  const exportJobs={
    excelButton:()=>({fn:window.exportExcel,label:txt('خروجی اکسل ارزیاب','Evaluator Excel')}),
    expertExcelButton:()=>({fn:window.exportExpertExcel,label:txt('خروجی اکسل خبره','Expert Excel')}),
    managerExcelButton:()=>({fn:window.exportManagerDashboard,label:txt('خروجی اکسل مدیریت','Management Excel')})
  };

  document.addEventListener('click',async event=>{
    const button=event.target.closest?.('#excelButton,#expertExcelButton,#managerExcelButton');
    if(!button||button.disabled||button.hidden) return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    const job=exportJobs[button.id]?.();preparing(job?.label||'Excel');
    try{
      await ensureExcelJS();
      const refreshed=exportJobs[button.id]?.();
      if(typeof refreshed?.fn!=='function') throw new Error(txt('تابع خروجی اکسل در دسترس نیست.','The Excel export function is unavailable.'));
      await refreshed.fn();
      if(window.BAMCO_FILE_SAVE_IS_PREPARING()) throw new Error(txt('ساخت فایل بدون ایجاد خروجی پایان یافت.','The export finished without creating a file.'));
    }catch(err){console.error('BACHECK Excel export failed',err);showFileError((err&&err.message)||txt('خطای ناشناخته در خروجی اکسل.','Unknown Excel export error.'));}
  },true);

  function sync(){setBrand();installPanel();patchInstallButton()}
  addEventListener('DOMContentLoaded',()=>{
    sync();offlineStatus();registerOffline();
    requestAnimationFrame(sync);setTimeout(sync,300);
    new MutationObserver(()=>requestAnimationFrame(sync)).observe(document.body,{childList:true,subtree:true});
  });
  addEventListener('load',registerOffline);
})();
