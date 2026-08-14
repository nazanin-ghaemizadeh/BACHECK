/* BACHECK Universal: role-page routing, cross-platform output saving, PWA/offline registration. */
(()=>{
  'use strict';
  const APP_NAME='BACHECK';
  const ROLE_PAGES={evaluator:'evaluator.html',expert:'expert.html',manager:'manager.html'};
  const ROLE_KEY='bacheck-page-role';
  const LOCALE_KEY='bacheck-ui-locale';
  const MIME_XLSX='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  function currentLocale(){ try{return typeof locale!=='undefined'&&locale==='en'?'en':'fa'}catch(_){return 'fa'} }
  function copy(fa,en){return currentLocale()==='fa'?fa:en}
  function sanitizeFilename(name){
    return String(name||'download').replace(/[\\/:*?"<>|]+/g,'_').replace(/\s+/g,' ').trim()||'download';
  }
  function isIOS(){return /iPad|iPhone|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)}
  function extensionOf(name){const m=String(name).match(/(\.[A-Za-z0-9]+)$/);return m?m[1]:''}

  function closeExistingDialog(){document.querySelector('.bacheckFileOverlay')?.remove()}
  function triggerAnchor(url,filename,newTab=false){
    const a=document.createElement('a');a.href=url;a.rel='noopener';
    if(newTab)a.target='_blank'; else a.download=filename;
    a.style.position='fixed';a.style.left='-9999px';document.body.appendChild(a);a.click();setTimeout(()=>a.remove(),100);
  }

  window.BACHECK_SAVE_FILE=async function(blob,filename,mime){
    filename=sanitizeFilename(filename);mime=mime||blob?.type||'application/octet-stream';
    if(!(blob instanceof Blob)) blob=new Blob([blob],{type:mime});
    closeExistingDialog();
    const url=URL.createObjectURL(blob);
    const overlay=document.createElement('div');overlay.className='bacheckFileOverlay';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');
    const dialog=document.createElement('div');dialog.className='bacheckFileDialog';
    const title=document.createElement('h3');title.textContent=copy('فایل آماده است','File is ready');
    const info=document.createElement('p');info.textContent=filename;
    const actions=document.createElement('div');actions.className='bacheckFileActions';
    const err=document.createElement('div');err.className='bacheckFileError';
    const save=document.createElement('button');save.type='button';save.className='primary';save.textContent=copy('ذخیره فایل','Save file');
    const share=document.createElement('button');share.type='button';share.textContent=copy('اشتراک‌گذاری / ذخیره در Files','Share / Save to Files');
    const open=document.createElement('button');open.type='button';open.textContent=copy('باز کردن فایل','Open file');
    const close=document.createElement('button');close.type='button';close.className='danger';close.textContent=copy('بستن','Close');
    actions.append(save,share,open,close);dialog.append(title,info,actions,err);overlay.append(dialog);document.body.appendChild(overlay);

    const cleanup=()=>{overlay.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)};
    close.onclick=cleanup;
    overlay.addEventListener('click',e=>{if(e.target===overlay)cleanup()});

    save.onclick=async()=>{
      err.textContent='';
      try{
        if(typeof window.showSaveFilePicker==='function'&&!isIOS()){
          const ext=extensionOf(filename)||'.bin';
          const handle=await window.showSaveFilePicker({suggestedName:filename,types:[{description:APP_NAME+' file',accept:{[mime]:[ext]}}]});
          const writable=await handle.createWritable();await writable.write(blob);await writable.close();cleanup();return;
        }
        triggerAnchor(url,filename,false);
      }catch(e){if(e?.name!=='AbortError')err.textContent=copy('ذخیره مستقیم ناموفق بود. از «باز کردن فایل» یا «اشتراک‌گذاری» استفاده کنید.','Direct save failed. Use Open file or Share instead.')+'\n'+(e?.message||'')}
    };
    share.onclick=async()=>{
      err.textContent='';
      try{
        const file=new File([blob],filename,{type:mime,lastModified:Date.now()});
        if(navigator.share && (!navigator.canShare || navigator.canShare({files:[file]}))){await navigator.share({files:[file],title:filename});return}
        triggerAnchor(url,filename,true);
      }catch(e){if(e?.name!=='AbortError')err.textContent=copy('اشتراک‌گذاری در این مرورگر در دسترس نیست. از «باز کردن فایل» استفاده کنید.','Sharing is not available in this browser. Use Open file instead.')+'\n'+(e?.message||'')}
    };
    open.onclick=()=>{
      err.textContent='';
      try{const w=window.open(url,'_blank','noopener');if(!w)window.location.href=url}catch(e){err.textContent=e?.message||String(e)}
    };
    return true;
  };

  // Persist language only across BACHECK pages in the current tab/session.
  try{
    const priorSetLocale=setLocale;
    setLocale=function(next){const out=priorSetLocale(next);try{sessionStorage.setItem(LOCALE_KEY,next)}catch(_){}return out};
  }catch(_){}

  // Index page: role selection navigates to an actual separate HTML page.
  let originalEnter=null;
  try{originalEnter=enter}catch(_){}
  const declaredRole=document.body?.dataset?.bacheckRole||'';
  if(!declaredRole && originalEnter){
    try{
      enter=function(role){
        const file=ROLE_PAGES[role];if(!file)return originalEnter(role);
        try{sessionStorage.setItem(ROLE_KEY,role)}catch(_){}
        window.location.href=new URL(file,window.location.href).href;
      };
    }catch(_){}
  }

  // Role pages: never render beneath the sign-in page; enter the requested role immediately.
  if(declaredRole){
    const allowed=(window.BAMCO_USER_ROLES?.[window.BAMCO_AUTH_USER]||[]).includes(declaredRole);
    if(!window.BAMCO_AUTH_USER||!allowed){
      window.location.replace(new URL('index.html',window.location.href).href);
    }else if(originalEnter){
      document.querySelector('#bacheckRolePrehide')?.remove();
      originalEnter(declaredRole);
      try{sessionStorage.setItem(ROLE_KEY,declaredRole)}catch(_){}
      const wanted=(()=>{try{return sessionStorage.getItem(LOCALE_KEY)}catch(_){return null}})();
      if(wanted==='en'||wanted==='fa'){try{setLocale(wanted)}catch(_){}}
    }
  }else{
    const wanted=(()=>{try{return sessionStorage.getItem(LOCALE_KEY)}catch(_){return null}})();
    if(wanted==='en'||wanted==='fa'){try{setLocale(wanted)}catch(_){}}
  }

  // Switch Role always returns to the dedicated sign-in/role-selection page.
  const switchRole=document.querySelector('#switchRoleButton');
  if(switchRole){switchRole.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();window.location.href=new URL('index.html',window.location.href).href},true)}

  // Register the offline application shell from the repository/site root.
  if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){
    window.addEventListener('load',()=>{
      navigator.serviceWorker.register('./service-worker.js',{scope:'./'}).then(reg=>navigator.serviceWorker.ready).catch(err=>console.error('BACHECK service worker registration failed',err));
    },{once:true});
  }

  // Keep the installed application identity independent of the internal page headings.
  const appleTitle=document.querySelector('meta[name="apple-mobile-web-app-title"]');if(appleTitle)appleTitle.content=APP_NAME;
})();
