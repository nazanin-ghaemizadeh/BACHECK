/* BACHECK v57 — cross-platform file delivery for Windows Chrome, iOS/Safari/PWA and Android. */
(function(){
  'use strict';
  const XLSX='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  const fa=()=>document.documentElement.lang==='fa'||document.documentElement.dir==='rtl';
  const mobileLike=()=>window.matchMedia?.('(pointer:coarse)').matches||window.matchMedia?.('(max-width:900px)').matches||navigator.standalone===true||window.matchMedia?.('(display-mode: standalone)').matches;
  let activeUrl=null,activeFile=null;

  function ensureModal(){
    let modal=document.querySelector('#bamcoFileSaveModal');
    if(modal)return modal;
    modal=document.createElement('div');modal.id='bamcoFileSaveModal';modal.className='bamcoFileSaveModal';modal.hidden=true;
    modal.innerHTML=`<div class="bamcoFileSaveDialog" role="dialog" aria-modal="true" aria-labelledby="bamcoFileSaveTitle">
      <div class="bamcoFileSaveSpinner" aria-hidden="true"></div><h2 id="bamcoFileSaveTitle"></h2><p id="bamcoFileSaveText"></p>
      <strong class="bamcoFileSaveName" id="bamcoFileSaveName" dir="ltr"></strong><div class="bamcoFileSaveActions">
      <button type="button" id="bamcoShareFile"></button><a id="bamcoDownloadFile" rel="noopener"></a></div>
      <button type="button" class="bamcoFileSaveClose" id="bamcoFileSaveClose"></button></div>`;
    document.body.appendChild(modal);
    modal.querySelector('#bamcoFileSaveClose').addEventListener('click',()=>modal.hidden=true);
    modal.addEventListener('click',e=>{if(e.target===modal)modal.hidden=true});
    modal.querySelector('#bamcoShareFile').addEventListener('click',async()=>{
      if(!activeFile)return;
      try{
        if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[activeFile]}))){await navigator.share({files:[activeFile],title:activeFile.name});return;}
        modal.querySelector('#bamcoDownloadFile')?.click();
      }catch(err){if(err?.name==='AbortError')return;const t=modal.querySelector('#bamcoFileSaveText');if(t)t.textContent=fa()?'اشتراک‌گذاری مستقیم در دسترس نبود؛ «دانلود فایل» را بزنید.':'Direct sharing was unavailable. Use “Download file” instead.';}
    });
    return modal;
  }
  function localize(modal){modal.querySelector('#bamcoFileSaveClose').textContent=fa()?'بستن':'Close';modal.querySelector('#bamcoShareFile').textContent=fa()?'ذخیره / اشتراک‌گذاری':'Save / Share';modal.querySelector('#bamcoDownloadFile').textContent=fa()?'دانلود فایل':'Download file';}
  function labelFor(name){return /\.xlsx$/i.test(name)?(fa()?'فایل اکسل آماده است':'Excel file is ready'):/\.json$/i.test(name)?(fa()?'فایل JSON آماده است':'JSON file is ready'):(fa()?'فایل آماده است':'File is ready');}

  window.BAMCO_SHOW_EXCEL_PREPARING=function(label){const modal=ensureModal();localize(modal);modal.dataset.state='preparing';modal.hidden=false;modal.querySelector('.bamcoFileSaveSpinner').hidden=false;modal.querySelector('#bamcoFileSaveTitle').textContent=fa()?'در حال ساخت فایل اکسل':'Preparing Excel file';modal.querySelector('#bamcoFileSaveText').textContent=fa()?'چند لحظه صبر کنید؛ پس از آماده‌شدن فایل، گزینه ذخیره نمایش داده می‌شود.':'Please wait. Save options will appear when the file is ready.';modal.querySelector('#bamcoFileSaveName').textContent=label||'';modal.querySelector('.bamcoFileSaveActions').hidden=true;};
  window.BAMCO_FILE_SAVE_IS_PREPARING=()=>ensureModal().dataset.state==='preparing';
  window.BAMCO_SHOW_FILE_ERROR=function(message){const modal=ensureModal();localize(modal);modal.hidden=false;modal.dataset.state='error';modal.querySelector('.bamcoFileSaveSpinner').hidden=true;modal.querySelector('#bamcoFileSaveTitle').textContent=fa()?'ساخت فایل ناموفق بود':'File creation failed';modal.querySelector('#bamcoFileSaveText').textContent=message||(fa()?'فایل ساخته نشد. دوباره تلاش کنید.':'The file could not be created. Please try again.');modal.querySelector('#bamcoFileSaveName').textContent='';modal.querySelector('.bamcoFileSaveActions').hidden=true;};

  window.BAMCO_SAVE_BLOB=async function(blob,fileName){
    if(!(blob instanceof Blob))throw new Error(fa()?'فایل خروجی ساخته نشد.':'The output file could not be created.');
    const name=String(fileName||'bacheck_output');const type=blob.type||(/\.xlsx$/i.test(name)?XLSX:'application/octet-stream');
    if(activeUrl){try{URL.revokeObjectURL(activeUrl)}catch(_){}activeUrl=null;}activeUrl=URL.createObjectURL(blob);
    try{activeFile=new File([blob],name,{type,lastModified:Date.now()});}catch(_){activeFile=null;}
    if(mobileLike()){
      const modal=ensureModal();localize(modal);modal.hidden=false;modal.dataset.state='ready';modal.querySelector('.bamcoFileSaveSpinner').hidden=true;modal.querySelector('#bamcoFileSaveTitle').textContent=labelFor(name);
      modal.querySelector('#bamcoFileSaveText').textContent=fa()?'در iPhone/iPad گزینه «ذخیره / اشتراک‌گذاری» و سپس Save to Files را انتخاب کنید. در Android می‌توانید همین گزینه یا «دانلود فایل» را بزنید.':'On iPhone/iPad, use “Save / Share” then Save to Files. On Android, use the same option or “Download file”.';
      modal.querySelector('#bamcoFileSaveName').textContent=name;const share=modal.querySelector('#bamcoShareFile');share.hidden=!(activeFile&&navigator.share&&(!navigator.canShare||navigator.canShare({files:[activeFile]})));
      const link=modal.querySelector('#bamcoDownloadFile');link.href=activeUrl;link.download=name;link.type=type;link.removeAttribute('target');modal.querySelector('.bamcoFileSaveActions').hidden=false;return true;
    }
    const a=document.createElement('a');a.href=activeUrl;a.download=name;a.rel='noopener';a.style.position='fixed';a.style.left='-9999px';document.body.appendChild(a);a.click();
    setTimeout(()=>{try{a.remove()}catch(_){};try{URL.revokeObjectURL(activeUrl)}catch(_){};activeUrl=null;},60000);return true;
  };
})();
