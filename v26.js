/* v26 — frequency immediately after each quality bar and consistent expert Excel styling support */
(()=>{
  const criteria=()=>window.ASSESSMENT_CRITERIA||[];

  renderQualityChart=function(){
    const counts=Array(10).fill(0);
    criteria().forEach(main=>{
      const weight=Math.max(0,Number(state.weights?.[main.id])||0);
      if(weight<=0)return;
      main.subgroups.forEach(sub=>sub.items.forEach(item=>{
        const n=Number(state.scores?.[itemKey(main,sub,item)]);
        if(Number.isInteger(n)&&n>=1&&n<=10)counts[n-1]++;
      }));
    });

    const host=document.querySelector('#qualityChart');
    if(!host)return;
    const max=Math.max(0,...counts);
    if(max<=0){
      host.innerHTML=`<p class="qualityEmpty" dir="${locale==='fa'?'rtl':'ltr'}">${locale==='fa'?'با ثبت امتیاز، فراوانی درجه‌های کیفی در این بخش نمایش داده می‌شود.':'The quality-grade frequency will appear after scores are recorded.'}</p>`;
      return;
    }

    host.innerHTML=counts.map((count,i)=>{
      const width=max?count/max*100:0;
      const level=SCORE_LEVELS.find(x=>x.n===i+1);
      const label=locale==='fa'?level.fa:level.en;
      return `<div class="qualityBar" dir="ltr">
        <span class="qualityLabel" dir="${locale==='fa'?'rtl':'ltr'}">${esc(label)}</span>
        <div class="qualityVisual">
          <div class="qualityTrack" aria-label="${esc(label)}: ${localNumber(count)}">
            <i style="--quality-width:${width}%;--quality-color:${scoreColor(i+1)}"></i>
            <b class="qualityFrequency" style="--quality-count-position:${width}%">${localNumber(count)}</b>
          </div>
        </div>
      </div>`;
    }).join('');
  };

  /* Keep the latest quality renderer active after every manager refresh. */
  const previousManagerRefresh=window.managerRefresh||managerRefresh;
  managerRefresh=function(...args){
    const out=previousManagerRefresh(...args);
    renderQualityChart();
    return out;
  };
  window.managerRefresh=managerRefresh;

  if(typeof update==='function')update();
})();
