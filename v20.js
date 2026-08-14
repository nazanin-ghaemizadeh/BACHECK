/* v20 — experience dropdowns, typography harmonization hooks, and calculation safeguards */
(()=>{
  const EXPERIENCE_OPTIONS=[
    {code:"lt1",fa:"کمتر از ۱ سال",en:"Less than 1 year"},
    {code:"1to3",fa:"۱ تا ۳ سال",en:"1–3 years"},
    {code:"3to5",fa:"۳ تا ۵ سال",en:"3–5 years"},
    {code:"5to10",fa:"۵ تا ۱۰ سال",en:"5–10 years"},
    {code:"10to15",fa:"۱۰ تا ۱۵ سال",en:"10–15 years"},
    {code:"gt15",fa:"بیش از ۱۵ سال",en:"More than 15 years"},
    {code:"other",fa:"سایر",en:"Other"}
  ];
  const byCode=code=>EXPERIENCE_OPTIONS.find(x=>x.code===code);
  const optionLabel=(code,lang=locale)=>byCode(code)?.[lang]||"";
  const placeholder=lang=>lang==="fa"?"انتخاب کنید":"Select";
  const otherPlaceholder=lang=>lang==="fa"?"سابقه کاری را وارد کنید":"Enter work experience";
  const optionMarkup=(selected,lang=locale)=>`<option value="">${placeholder(lang)}</option>${EXPERIENCE_OPTIONS.map(x=>`<option value="${x.code}" ${x.code===selected?"selected":""}>${x[lang]}</option>`).join("")}`;

  function migrateExperience(holder,legacyKey="experience"){
    if(!holder)return;
    if(holder.experienceCode===undefined){
      const legacy=String(holder[legacyKey]??"").trim();
      const match=EXPERIENCE_OPTIONS.find(x=>legacy===x.fa||legacy===x.en||legacy===x.code);
      if(match){holder.experienceCode=match.code;holder.experienceOther=holder.experienceOther||""}
      else if(legacy){holder.experienceCode="other";holder.experienceOther=holder.experienceOther||legacy}
      else {holder.experienceCode="";holder.experienceOther=holder.experienceOther||""}
    }
  }

  function experienceDisplay(holder,lang=locale){
    migrateExperience(holder);
    const code=holder?.experienceCode||"";
    if(code==="other")return String(holder?.experienceOther||"").trim();
    return optionLabel(code,lang);
  }

  window.getEvaluatorExperienceDisplay=(lang=locale)=>{
    const holder={
      experienceCode:state.metadata.evaluatorExperienceCode,
      experienceOther:state.metadata.evaluatorExperienceOther,
      experience:state.metadata.evaluatorExperience
    };
    migrateExperience(holder);
    return experienceDisplay(holder,lang);
  };
  window.getExpertExperienceDisplay=(lang=locale)=>experienceDisplay(expertState?.info||{},lang);

  function ensureEvaluatorExperienceState(){
    const holder={
      experienceCode:state.metadata.evaluatorExperienceCode,
      experienceOther:state.metadata.evaluatorExperienceOther,
      experience:state.metadata.evaluatorExperience
    };
    migrateExperience(holder);
    state.metadata.evaluatorExperienceCode=holder.experienceCode;
    state.metadata.evaluatorExperienceOther=holder.experienceOther;
    /* Keep a language-neutral legacy value for backward compatibility. */
    state.metadata.evaluatorExperience=holder.experienceCode==="other"?holder.experienceOther:holder.experienceCode;
  }

  function renderEvaluatorExperience(){
    ensureEvaluatorExperienceState();
    const select=document.querySelector('[data-experience-select="evaluator"]');
    const other=document.querySelector('[data-experience-other="evaluator"]');
    if(!select||!other)return;
    select.innerHTML=optionMarkup(state.metadata.evaluatorExperienceCode||"");
    select.value=state.metadata.evaluatorExperienceCode||"";
    select.setAttribute("aria-label",locale==="fa"?"سابقه کاری ارزیاب":"Evaluator work experience");
    other.hidden=select.value!=="other";
    other.placeholder=otherPlaceholder(locale);
    if(document.activeElement!==other)other.value=state.metadata.evaluatorExperienceOther||"";
    if(!select.dataset.boundV20){
      select.dataset.boundV20="1";
      select.addEventListener("change",()=>{
        state.metadata.evaluatorExperienceCode=select.value;
        if(select.value!=="other")state.metadata.evaluatorExperience=select.value;
        else state.metadata.evaluatorExperience=state.metadata.evaluatorExperienceOther||"";
        other.hidden=select.value!=="other";
        if(!other.hidden){other.focus();}
        persist();
      });
    }
    if(!other.dataset.boundV20){
      other.dataset.boundV20="1";
      other.addEventListener("input",()=>{
        state.metadata.evaluatorExperienceOther=other.value;
        state.metadata.evaluatorExperience=other.value;
        persist();
      });
    }
  }

  /* Expert work-experience field uses the same controlled list. */
  expertText.fa.incomplete="اطلاعات ضروری خبره را تکمیل کنید و حداقل شماره تماس یا ایمیل را وارد کنید.";
  const baseExpertField=expertField;
  expertField=function(key,type="text"){
    if(key!=="experience")return baseExpertField(key,type);
    migrateExperience(expertState.info);
    const code=expertState.info.experienceCode||"";
    const other=String(expertState.info.experienceOther||"");
    return `<label class="expertExperienceField"><span>${et("experience")}</span><select class="expertExperienceSelect" data-expert-experience-select aria-label="${esc(et("experience"))}">${optionMarkup(code)}</select><input class="expertExperienceOther" data-expert-experience-other type="text" value="${esc(other)}" placeholder="${esc(otherPlaceholder(locale))}" ${code==="other"?"":"hidden"}></label>`;
  };

  function expertInfoComplete(){
    migrateExperience(expertState.info);
    const required=["name","specialty","position","organization","completionDate"];
    const base=required.every(k=>String(expertState.info?.[k]||"").trim());
    const exp=expertState.info.experienceCode==="other"?String(expertState.info.experienceOther||"").trim():String(expertState.info.experienceCode||"").trim();
    const contact=String(expertState.info.phone||"").trim()||String(expertState.info.email||"").trim();
    return !!(base&&exp&&contact);
  }
  window.expertInfoComplete=expertInfoComplete;

  renderExpertStatus=function(){
    const total=expertTotal(),validTotal=Math.abs(total-1)<1e-9,weightsComplete=expertWeightsComplete(),infoComplete=expertInfoComplete();
    const status=document.querySelector("#expertWeightStatus");if(!status)return;
    const kind=validTotal?(infoComplete?"valid":"low"):(total<1?"low":"high");
    const remaining=1-total;
    const totalValue=document.querySelector("#expertTotalValue"),remainingValue=document.querySelector("#expertRemainingValue");
    if(totalValue)totalValue.textContent=shownWeight(total.toFixed(3));
    if(remainingValue)remainingValue.textContent=shownWeight((Math.abs(remaining)<1e-9?0:remaining).toFixed(3));
    status.className=`expertWeightStatus ${kind}`;
    status.textContent=validTotal&&!infoComplete?et("incomplete"):et(validTotal?"valid":(total<1?"low":"high"));
    const confirmButton=document.querySelector("#expertConfirmButton"),excelButton=document.querySelector("#expertExcelButton");
    const ready=validTotal&&weightsComplete&&infoComplete;
    if(confirmButton)confirmButton.disabled=!ready;
    if(excelButton)excelButton.disabled=!(ready&&expertState.confirmed);
  };

  function bindExpertExperience(){
    migrateExperience(expertState.info);
    const select=document.querySelector("[data-expert-experience-select]");
    const other=document.querySelector("[data-expert-experience-other]");
    if(!select||!other)return;
    select.value=expertState.info.experienceCode||"";
    other.hidden=select.value!=="other";
    other.placeholder=otherPlaceholder(locale);
    if(!select.dataset.boundV20){
      select.dataset.boundV20="1";
      select.addEventListener("change",()=>{
        expertState.info.experienceCode=select.value;
        expertState.info.experience=select.value==="other"?(expertState.info.experienceOther||""):select.value;
        other.hidden=select.value!=="other";
        expertState.confirmed=false;persistExpert();renderExpertStatus();
        if(!other.hidden)other.focus();
      });
    }
    if(!other.dataset.boundV20){
      other.dataset.boundV20="1";
      other.addEventListener("input",()=>{
        expertState.info.experienceOther=other.value;
        expertState.info.experience=other.value;
        expertState.confirmed=false;persistExpert();renderExpertStatus();
      });
    }
    renderExpertStatus();
  }

  const previousExpertRender=window.renderExpertPanel;
  window.renderExpertPanel=function(...args){
    const out=previousExpertRender?.(...args);
    bindExpertExperience();
    return out;
  };
  try{renderExpertPanel=window.renderExpertPanel}catch(_){}

  /* Use the mathematically proportional item mass for the weighted quality chart.
     Each answered item receives criterionWeight / totalItemsInCriterion, so a
     partially completed criterion cannot temporarily carry its full criterion mass. */
  renderQualityChart=function(){
    const buckets=Array(10).fill(0);let answeredMass=0;
    const criteria=window.ASSESSMENT_CRITERIA||[];
    criteria.forEach(main=>{
      const weight=Math.max(0,Number(state.weights?.[main.id]??(1/(criteria.length||15)))||0);
      if(weight<=0)return;
      const allItems=main.subgroups.flatMap(sub=>sub.items.map(item=>({sub,item})));
      const unit=allItems.length?weight/allItems.length:0;
      allItems.forEach(({sub,item})=>{
        const n=Number(state.scores?.[itemKey(main,sub,item)]);
        if(n>=1&&n<=10){buckets[n-1]+=unit;answeredMass+=unit;}
      });
    });
    const shares=answeredMass>0?buckets.map(v=>v/answeredMass*100):buckets;
    const host=document.querySelector("#qualityChart"),max=Math.max(0,...shares);if(!host)return;
    if(max<=0){host.innerHTML=`<p class="qualityEmpty">${locale==="fa"?"با ثبت امتیاز، توزیع وزن‌دار کیفیت در این بخش نمایش داده می‌شود.":"The weighted quality distribution will appear after scores are recorded."}</p>`;return}
    host.innerHTML=shares.map((share,i)=>{const width=share/max*100,label=locale==="fa"?SCORE_LEVELS.find(x=>x.n===i+1).fa:SCORE_LEVELS.find(x=>x.n===i+1).en;return `<div class="qualityBar" dir="ltr"><span class="qualityLabel">${label}</span><div class="qualityTrack"><i style="--quality-width:${width}%;--quality-color:${scoreColor(i+1)}"></i><b class="qualityCount" style="--quality-count-position:${width}%">${localNumber(share.toFixed(1))}%</b></div></div>`}).join("");
  };

  /* Small internal calculation audit used during development and retained for diagnostics. */
  function calculationAudit(){
    const criteria=window.ASSESSMENT_CRITERIA||[];
    const defaultWeight=criteria.length?1/criteria.length:0;
    const defaultTotal=criteria.reduce(s=>s+defaultWeight,0);
    const active=criteria.map(main=>Math.max(0,Number(state.weights?.[main.id]??defaultWeight)||0));
    const activeTotal=active.reduce((a,b)=>a+b,0);
    const zeroWeights=active.filter(x=>x===0).length;
    return {
      criteriaCount:criteria.length,
      defaultWeightsSumToOne:Math.abs(defaultTotal-1)<1e-12,
      activeWeightTotal:Number(activeTotal.toFixed(12)),
      activeWeightsValid:Math.abs(activeTotal-1)<1e-9,
      zeroWeights,
      expertConfirmed:!!expertState?.confirmed,
      expertInfoComplete:expertInfoComplete(),
      managerSource:typeof managerWeightState!=="undefined"?managerWeightState.activeSource:"default"
    };
  }
  window.BAMCOCalculationAudit=calculationAudit;

  const previousSetLocale=setLocale;
  setLocale=function(next){
    previousSetLocale(next);
    renderEvaluatorExperience();
    if(currentRole==="expert")window.renderExpertPanel?.();
  };

  const previousRenderMetadata=renderMetadata;
  renderMetadata=function(...args){const out=previousRenderMetadata(...args);renderEvaluatorExperience();return out};

  ensureEvaluatorExperienceState();
  migrateExperience(expertState.info);
  if(expertState.confirmed&&!expertState.confirmedSnapshot){expertState.confirmedSnapshot={weights:{...expertState.weights},info:{...expertState.info},confirmedAt:null};}
  persistExpert();
  renderEvaluatorExperience();
})();
