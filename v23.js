/* v23 — raw score-frequency distribution, Persian heh cleanup, and expert Excel gating */
(()=>{
  /* Avoid the combining ezafe mark after Persian heh in Management-facing text. */
  try{
    T.fa.managerRoleDesc='مشاهده داشبورد، نتایج و گزارش مدیریتی';
    T.fa.qualityDistribution='توزیع درجه کیفی';
    T.fa.qualityDistributionHint='فراوانی امتیازهای ۱ تا ۱۰ در شاخص‌های دارای وزن فعال';
    T.en.qualityDistribution='Quality Grade Distribution';
    T.en.qualityDistributionHint='Frequency of scores from 1 to 10 among criteria with active weight';
  }catch(_){ }

  const criteria=()=>window.ASSESSMENT_CRITERIA||[];
  const hasActiveWeight=main=>Math.max(0,Number(state.weights?.[main.id])||0)>0;

  /* Frequency means the actual number of recorded occurrences of each score.
     Zero-weight criteria are excluded so disabling a criterion still updates the chart. */
  renderQualityChart=function(){
    const counts=Array(10).fill(0);
    criteria().forEach(main=>{
      if(!hasActiveWeight(main))return;
      main.subgroups.forEach(sub=>sub.items.forEach(item=>{
        const n=Number(state.scores?.[itemKey(main,sub,item)]);
        if(Number.isInteger(n)&&n>=1&&n<=10)counts[n-1]++;
      }));
    });
    const host=document.querySelector('#qualityChart');
    if(!host)return;
    const max=Math.max(0,...counts);
    if(max<=0){
      host.innerHTML=`<p class="qualityEmpty">${locale==='fa'?'با ثبت امتیاز، فراوانی درجه‌های کیفی در این بخش نمایش داده می‌شود.':'The quality-grade frequency will appear after scores are recorded.'}</p>`;
      return;
    }
    host.innerHTML=counts.map((count,i)=>{
      const width=max?count/max*100:0;
      const level=SCORE_LEVELS.find(x=>x.n===i+1);
      const label=locale==='fa'?level.fa:level.en;
      return `<div class="qualityBar" dir="ltr"><span class="qualityLabel">${label}</span><div class="qualityTrack"><i style="--quality-width:${width}%;--quality-color:${scoreColor(i+1)}"></i><b class="qualityCount" style="--quality-count-position:${width}%">${localNumber(count)}</b></div></div>`;
    }).join('');
  };

  /* Expert Excel is deliberately unavailable until the current weights have been finally confirmed. */
  const baseExpertStatus=renderExpertStatus;
  renderExpertStatus=function(...args){
    const out=baseExpertStatus(...args);
    const excel=document.querySelector('#expertExcelButton');
    if(excel){
      const totalOk=Math.abs(expertTotal()-1)<1e-9;
      const weightsOk=expertWeightsComplete();
      excel.disabled=!(expertState.confirmed&&totalOk&&weightsOk);
      excel.setAttribute('aria-disabled',excel.disabled?'true':'false');
      excel.title=excel.disabled
        ? (locale==='fa'?'پس از تأیید نهایی وزن‌ها فعال می‌شود.':'Available after final confirmation of the weights.')
        : '';
    }
    return out;
  };

  function refreshV23Text(){
    const role=document.querySelector('.managerRole [data-i18n="managerRoleDesc"]');
    if(role&&locale==='fa')role.textContent='مشاهده داشبورد، نتایج و گزارش مدیریتی';
    const qTitle=document.querySelector('#qualityChartTitle');
    const qHint=document.querySelector('#qualityChartHint');
    if(qTitle)qTitle.textContent=locale==='fa'?'توزیع درجه کیفی':'Quality Grade Distribution';
    if(qHint)qHint.textContent=locale==='fa'?'فراوانی امتیازهای ۱ تا ۱۰ در شاخص‌های دارای وزن فعال':'Frequency of scores from 1 to 10 among criteria with active weight';
  }

  const baseSetLocale=setLocale;
  setLocale=function(next){
    const out=baseSetLocale(next);
    refreshV23Text();
    renderExpertStatus();
    if(typeof update==='function')update();
    return out;
  };

  const priorManagerRefresh=window.managerRefresh||managerRefresh;
  managerRefresh=function(...args){
    const out=priorManagerRefresh(...args);
    refreshV23Text();
    renderQualityChart();
    return out;
  };
  window.managerRefresh=managerRefresh;

  refreshV23Text();
  renderExpertStatus();
  if(typeof update==='function')update();
})();
