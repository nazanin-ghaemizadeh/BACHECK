/* v56 — explicit mobile Excel runner with visible progress/error handling. */
(function(){
  'use strict';
  const mobile=()=>window.matchMedia?.('(pointer:coarse)').matches||window.matchMedia?.('(max-width:900px)').matches||navigator.standalone===true||window.matchMedia?.('(display-mode: standalone)').matches;
  const isFa=()=>document.documentElement.lang==='fa'||document.documentElement.dir==='rtl';
  const jobs={
    excelButton:()=>({fn:window.exportExcel,label:isFa()?'خروجی اکسل ارزیاب':'Evaluator Excel export'}),
    expertExcelButton:()=>({fn:window.exportExpertExcel,label:isFa()?'خروجی اکسل خبره':'Expert Excel export'}),
    managerExcelButton:()=>({fn:window.exportManagerDashboard,label:isFa()?'خروجی اکسل مدیریت':'Management Excel export'})
  };
  document.addEventListener('click',async event=>{
    if(!mobile())return;
    const button=event.target.closest?.('#excelButton,#expertExcelButton,#managerExcelButton');
    if(!button||button.disabled||button.hidden)return;
    const job=jobs[button.id]?.();
    if(!job||typeof job.fn!=='function')return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    window.BAMCO_SHOW_EXCEL_PREPARING?.(job.label);
    try{
      await job.fn();
      if(window.BAMCO_FILE_SAVE_IS_PREPARING?.()){
        window.BAMCO_SHOW_FILE_ERROR?.(isFa()?'فرایند ساخت فایل بدون ایجاد خروجی پایان یافت. دوباره تلاش کنید.':'The export finished without producing a file. Please try again.');
      }
    }catch(err){
      console.error('BAMCO Excel export failed',err);
      window.BAMCO_SHOW_FILE_ERROR?.((err&&err.message)|| (isFa()?'خطای ناشناخته هنگام ساخت فایل اکسل.':'Unknown error while creating the Excel file.'));
    }
  },true);
})();
