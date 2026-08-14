/* v54 — mobile-safe file saving for Safari / installed PWA. */
(function(){
  'use strict';
  const isFa=()=>document.documentElement.lang==='fa'||document.documentElement.dir==='rtl';
  window.BAMCO_SAVE_BLOB=async function(blob,fileName){
    if(!(blob instanceof Blob)) throw new Error(isFa()?'فایل خروجی ساخته نشد.':'The output file could not be created.');
    const name=String(fileName||'bamco_output.xlsx');
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download=name;
    a.rel='noopener';
    a.style.position='fixed';
    a.style.left='-9999px';
    a.style.top='-9999px';
    a.setAttribute('aria-hidden','true');
    document.body.appendChild(a);
    try{
      a.click();
    }finally{
      window.setTimeout(()=>{
        try{a.remove();}catch(_){}
        try{URL.revokeObjectURL(url);}catch(_){}
      },60000);
    }
    return true;
  };
})();
