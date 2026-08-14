/* v22 — restore scoring guide, simplify experience lists, clean Persian chart titles, and bounded frequency labels */
(()=>{
  /* Remove the combining hamza-above form that rendered the final Persian heh poorly in Management. */
  try{
    T.fa.performanceChart="مقایسه عملکرد وزن‌دار شاخص‌ها";
    T.fa.qualityDistribution="توزیع وزن‌دار درجه کیفی";
  }catch(_){ }

  function refreshManagerChartTitles(){
    const performance=document.querySelector('#performanceChartTitle');
    const quality=document.querySelector('#qualityChartTitle');
    if(performance) performance.textContent=locale==='fa'?'مقایسه عملکرد وزن‌دار شاخص‌ها':T.en.performanceChart;
    if(quality) quality.textContent=locale==='fa'?'توزیع وزن‌دار درجه کیفی':T.en.qualityDistribution;
  }

  /* Restore the former compact two-column / five-row scoring guide. */
  renderScoreGuide=function(){
    const guide=document.querySelector('#scoreGuideGrid');
    if(!guide)return;
    guide.innerHTML=SCORE_LEVELS.map(level=>`<article class="guideLevel score-${level.n}"><div><strong style="background:${scoreColor(level.n)}">${localNumber(level.n)}</strong><b>${locale==='fa'?level.fa:level.en}</b></div><p>${locale==='fa'?level.desc:SCORE_DESCRIPTIONS_EN[level.n-1]}</p></article>`).join('');
  };

  /* Remove "Other" from both work-experience selectors and suppress the manual field. */
  function removeOtherExperienceOption(){
    const evaluator=document.querySelector('[data-experience-select="evaluator"]');
    const evaluatorOther=document.querySelector('[data-experience-other="evaluator"]');
    if(evaluator){
      evaluator.querySelector('option[value="other"]')?.remove();
      if(evaluator.value==='other'||state.metadata?.evaluatorExperienceCode==='other'){
        evaluator.value='';
        state.metadata.evaluatorExperienceCode='';
        state.metadata.evaluatorExperience='';
        state.metadata.evaluatorExperienceOther='';
        try{persist()}catch(_){ }
      }
    }
    if(evaluatorOther){evaluatorOther.hidden=true;evaluatorOther.value='';}

    const expert=document.querySelector('[data-expert-experience-select]');
    const expertOther=document.querySelector('[data-expert-experience-other]');
    if(expert){
      expert.querySelector('option[value="other"]')?.remove();
      if(expert.value==='other'||expertState?.info?.experienceCode==='other'){
        expert.value='';
        expertState.info.experienceCode='';
        expertState.info.experience='';
        expertState.info.experienceOther='';
        expertState.confirmed=false;
        try{persistExpert()}catch(_){ }
      }
    }
    if(expertOther){expertOther.hidden=true;expertOther.value='';}
  }

  /* Return expert confirmation eligibility to the original weight-based rule.
     This removes the "required expert information" warning sentence from the UI. */
  renderExpertStatus=function(){
    const total=expertTotal(),validTotal=Math.abs(total-1)<1e-9,complete=expertWeightsComplete();
    const status=document.querySelector('#expertWeightStatus');if(!status)return;
    const kind=validTotal?'valid':total<1?'low':'high',remaining=1-total;
    const totalValue=document.querySelector('#expertTotalValue'),remainingValue=document.querySelector('#expertRemainingValue');
    if(totalValue)totalValue.textContent=shownWeight(total.toFixed(3));
    if(remainingValue)remainingValue.textContent=shownWeight((Math.abs(remaining)<1e-9?0:remaining).toFixed(3));
    status.className=`expertWeightStatus ${kind}`;
    status.textContent=et(kind);
    const confirmButton=document.querySelector('#expertConfirmButton'),excelButton=document.querySelector('#expertExcelButton');
    if(confirmButton)confirmButton.disabled=!(validTotal&&complete);
    if(excelButton)excelButton.disabled=!(validTotal&&complete&&expertState.confirmed);
  };

  /* Weighted numeric frequency. The value label says Frequency/Fراوانی and is kept inside the track. */
  const activeNormalizedWeights=()=>{
    const list=window.ASSESSMENT_CRITERIA||[];
    const raw=list.map(main=>Math.max(0,Number(state.weights?.[main.id])||0));
    const total=raw.reduce((a,b)=>a+b,0);
    return total>0?raw.map(v=>v/total):list.map(()=>list.length?1/list.length:0);
  };
  const shownFrequency=v=>{
    const rounded=Math.round(v);
    return localNumber(Math.abs(v-rounded)<0.05?String(rounded):v.toFixed(1));
  };
  renderQualityChart=function(){
    const list=window.ASSESSMENT_CRITERIA||[],weights=activeNormalizedWeights(),buckets=Array(10).fill(0);
    let answeredMass=0,answeredCount=0;
    list.forEach((main,index)=>{
      const weight=weights[index]||0;if(weight<=0)return;
      const allItems=main.subgroups.flatMap(sub=>sub.items.map(item=>({sub,item})));
      const unit=allItems.length?weight/allItems.length:0;
      allItems.forEach(({sub,item})=>{
        const n=Number(state.scores?.[itemKey(main,sub,item)]);
        if(n>=1&&n<=10){buckets[n-1]+=unit;answeredMass+=unit;answeredCount++;}
      });
    });
    const counts=answeredMass>0?buckets.map(v=>v/answeredMass*answeredCount):buckets;
    const host=document.querySelector('#qualityChart');if(!host)return;
    const max=Math.max(0,...counts);
    if(max<=0){
      host.innerHTML=`<p class="qualityEmpty">${locale==='fa'?'با ثبت امتیاز، توزیع وزن‌دار کیفیت در این بخش نمایش داده می‌شود.':'The weighted quality distribution will appear after scores are recorded.'}</p>`;
      return;
    }
    host.innerHTML=counts.map((count,i)=>{
      const width=count/max*100,level=SCORE_LEVELS.find(x=>x.n===i+1),label=locale==='fa'?level.fa:level.en;
      const frequency=locale==='fa'?`فراوانی: ${shownFrequency(count)}`:`Frequency: ${shownFrequency(count)}`;
      return `<div class="qualityBar" dir="ltr"><span class="qualityLabel">${label}</span><div class="qualityTrack"><i style="--quality-width:${width}%;--quality-color:${scoreColor(i+1)}"></i><b class="qualityCount" style="--quality-count-position:${width}%">${frequency}</b></div></div>`;
    }).join('');
  };

  /* Re-apply the small UI patches whenever locale/metadata/expert panel is rebuilt. */
  const baseSetLocale=setLocale;
  setLocale=function(next){
    const out=baseSetLocale(next);
    removeOtherExperienceOption();
    refreshManagerChartTitles();
    renderScoreGuide();
    return out;
  };
  const baseRenderMetadata=renderMetadata;
  renderMetadata=function(...args){const out=baseRenderMetadata(...args);removeOtherExperienceOption();return out;};

  const baseExpertRender=window.renderExpertPanel;
  window.renderExpertPanel=function(...args){const out=baseExpertRender?.(...args);removeOtherExperienceOption();renderExpertStatus();return out;};
  try{renderExpertPanel=window.renderExpertPanel}catch(_){ }

  removeOtherExperienceOption();
  refreshManagerChartTitles();
  renderScoreGuide();
  if(typeof update==='function')update();
})();
