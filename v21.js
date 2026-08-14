/* v21 — weighted-count distribution, zero-weight filtering, compact chart labels, and scoring-guide layout */
(()=>{
  const criteria=()=>window.ASSESSMENT_CRITERIA||[];
  const activeNormalizedWeights=()=>{
    const list=criteria();
    const raw=list.map(main=>Math.max(0,Number(state.weights?.[main.id])||0));
    const total=raw.reduce((a,b)=>a+b,0);
    if(total>0)return raw.map(v=>v/total);
    return list.map(()=>list.length?1/list.length:0);
  };
  const shownWeightedCount=v=>{
    const rounded=Math.round(v);
    return localNumber(Math.abs(v-rounded)<0.05?String(rounded):v.toFixed(1));
  };

  /* Keep the distribution weight-sensitive, but display a numeric weighted frequency rather than percentages. */
  renderQualityChart=function(){
    const list=criteria(),weights=activeNormalizedWeights(),buckets=Array(10).fill(0);
    let answeredMass=0,answeredCount=0;
    list.forEach((main,index)=>{
      const weight=weights[index]||0;
      if(weight<=0)return;
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
      host.innerHTML=`<p class="qualityEmpty" dir="${locale==='fa'?'rtl':'ltr'}">${locale==='fa'?'با ثبت امتیاز، توزیع وزن‌دار کیفیت در این بخش نمایش داده می‌شود.':'The weighted quality distribution will appear after scores are recorded.'}</p>`;
      return;
    }
    host.innerHTML=counts.map((count,i)=>{
      const width=count/max*100;
      const level=SCORE_LEVELS.find(x=>x.n===i+1);
      const label=locale==='fa'?level.fa:level.en;
      return `<div class="qualityBar" dir="ltr"><span class="qualityLabel">${label}</span><div class="qualityTrack"><i style="--quality-width:${width}%;--quality-color:${scoreColor(i+1)}"></i><b class="qualityCount" style="--quality-count-position:${width}%">${shownWeightedCount(count)}</b></div></div>`;
    }).join('');
  };

  /* Same weighted bar logic as v19, without weight text in the column label or the explanatory note below the chart. */
  const weightedRows=rows=>{
    const list=(rows||[]).map(r=>({...r,weight:Math.max(0,Number(r.weight)||0)}));
    const maxWeight=Math.max(0,...list.map(r=>r.weight));
    return list.map(r=>{
      const raw=Number.isFinite(r.avg100)?r.avg100:(Number.isFinite(r.avg)?r.avg*10:NaN);
      const weighted=Number.isFinite(raw)&&maxWeight>0?raw*(r.weight/maxWeight):NaN;
      return {...r,raw100:raw,weightedVisual:Number.isFinite(weighted)?Math.max(0,Math.min(100,weighted)):NaN};
    });
  };
  renderChart=function(rows){
    const data=weightedRows(rows).filter(r=>Number.isFinite(r.weightedVisual)).sort((a,b)=>b.weightedVisual-a.weightedVisual);
    const host=document.querySelector('#scoreChart');if(!host)return;
    host.parentElement?.querySelector('.chartZoomNote')?.remove();
    if(!data.length){host.innerHTML=`<p class="chartEmpty" dir="${locale==='fa'?'rtl':'ltr'}">${locale==='fa'?'پس از ثبت امتیازها، نمودار وزن‌دار در این بخش نمایش داده می‌شود.':'The weighted comparison chart will appear after scores are recorded.'}</p>`;return;}
    const colors=['#2463a5','#b54d66','#128778','#d58a24','#7454b8','#d9673a','#3e8c47','#ad5f99','#2c7d9a','#96733c','#5475b5','#b85c48','#4b9a91','#8f5c6b','#527e50'];
    host.innerHTML=data.map((r,i)=>{
      const v=r.weightedVisual,h=v<=0?0:Math.max(3,v);
      return `<div class="barItem" title="${locale==='fa'?'امتیاز خام':'Raw score'}: ${fmt(r.raw100)}"><div class="barTrack"><b class="barEndValue" style="--bar-height:${h}%">${fmt(v)}</b><i style="height:${h}%;--bar:${colors[i%colors.length]}"></i></div><div class="barLabel"><span>${title(r.main.titleFa,'main',r.main.id)}</span></div></div>`;
    }).join('');
  };

  /* Exclude criteria with zero active weight from strengths and weaknesses. */
  function renderWeightedStrengthWeakness(){
    const fa=locale==='fa',weights=activeNormalizedWeights();
    const groups=criteria().map((main,index)=>{
      if((weights[index]||0)<=0)return null;
      const items=main.subgroups.flatMap(sub=>sub.items.map(item=>({sub,item,score:Number(state.scores?.[itemKey(main,sub,item)])})).filter(row=>Number.isFinite(row.score)));
      return items.length?{main,items}:null;
    }).filter(Boolean);
    const pick=(items,levels)=>{const level=levels.find(n=>items.some(item=>item.score===n));return level===undefined?[]:items.filter(item=>item.score===level)};
    const strengths=groups.map(group=>({...group,items:pick(group.items,[10,9,8,7,6])})).filter(group=>group.items.length);
    const weaknesses=groups.map(group=>({...group,items:pick(group.items,[1,2,3,4,5])})).filter(group=>group.items.length);
    const render=(items,weak)=>items.length?items.map(group=>{
      const level=group.items[0].score,scoreLevel=SCORE_LEVELS.find(x=>x.n===level),levelTitle=fa?(scoreLevel?.fa||''):(scoreLevel?.en||''),count=group.items.length,countText=fa?`${localNumber(count)} مورد`:`${localNumber(count)} ${count===1?'item':'items'}`;
      return `<details class="performanceDetails"><summary><strong>${esc(title(group.main.titleFa,'main',group.main.id))}</strong><span>${countText} — ${levelTitle}</span></summary><div>${group.items.map(row=>`<article class="summaryPoint"><strong>${esc(fa?(row.item.titleFa||itemTitle(row.item)):itemTitleEn(row.item))}</strong><span>${localNumber(row.score)} ${fa?'از ۱۰':'out of 10'}</span><small>${esc(title(row.sub.titleFa,'sub',row.sub.id))}</small></article>`).join('')}</div></details>`;
    }).join(''):`<div class="auditEmpty">${fa?(weak?'موردی با امتیاز ۵ یا پایین‌تر در شاخص‌های دارای وزن ثبت نشده است.':'موردی با امتیاز ۶ یا بالاتر در شاخص‌های دارای وزن ثبت نشده است.'):(weak?'No item scored 5 or below in a criterion with active weight.':'No item scored 6 or above in a criterion with active weight.')}</div>`;
    const a=document.querySelector('#strengthList'),b=document.querySelector('#weaknessList');
    if(a)a.innerHTML=render(strengths,false);
    if(b)b.innerHTML=render(weaknesses,true);
  }
  const previousManagerRefresh=window.managerRefresh||managerRefresh;
  managerRefresh=function(...args){const out=previousManagerRefresh(...args);renderWeightedStrengthWeakness();document.querySelector('.chartZoomNote')?.remove();return out};
  window.managerRefresh=managerRefresh;

  /* Two true columns: right 10→6, left 5→1. */
  renderScoreGuide=function(){
    const guide=document.querySelector('#scoreGuideGrid');if(!guide)return;
    const card=level=>`<article class="guideLevel score-${level.n}"><div><strong style="background:${scoreColor(level.n)}">${localNumber(level.n)}</strong><b>${locale==='fa'?level.fa:level.en}</b></div><p>${locale==='fa'?level.desc:SCORE_DESCRIPTIONS_EN[level.n-1]}</p></article>`;
    const right=[10,9,8,7,6].map(n=>SCORE_LEVELS.find(x=>x.n===n));
    const left=[5,4,3,2,1].map(n=>SCORE_LEVELS.find(x=>x.n===n));
    guide.innerHTML=`<div class="scoreGuideColumn scoreGuideHigh">${right.map(card).join('')}</div><div class="scoreGuideColumn scoreGuideLow">${left.map(card).join('')}</div>`;
  };

  try{
    T.fa.qualityDistributionHint='فراوانی وزن‌دار امتیازهای ۱ تا ۱۰ بر اساس وزن فعال شاخص‌ها';
    T.en.qualityDistributionHint='Weighted numeric frequency of scores from 1 to 10 based on the active criterion weights';
  }catch(_){}

  /* Remove the old v19 note if it already exists, then render the revised guide immediately. */
  document.querySelectorAll('.chartZoomNote').forEach(el=>el.remove());
  renderScoreGuide();
  if(typeof update==='function')update();
})();
