/* v47 — dedicated Management multi-vehicle comparison workspace */
(()=>{
  const MULTI_KEY='bamco-multi-vehicle-comparisons';
  const COUNT_KEY='bamco-comparison-vehicle-count';
  const LEGACY_SECOND_KEY='bamco-second-vehicle-comparison';
  const MAX_COMPARE=5;
  let comparisonMode=false;
  let compareCount=0;
  let comparisonCases=[];

  const safeParse=value=>{try{return JSON.parse(value)}catch(_){return null}};
  try{
    const stored=safeParse(sessionStorage.getItem(MULTI_KEY)||'[]');
    if(Array.isArray(stored))comparisonCases=stored.slice(0,MAX_COMPARE);
    compareCount=Math.max(0,Math.min(MAX_COMPARE,Number(sessionStorage.getItem(COUNT_KEY)||0)||0));
    if(!comparisonCases.length){
      const legacy=safeParse(sessionStorage.getItem(LEGACY_SECOND_KEY)||'null');
      if(legacy?.state?.scores){comparisonCases=[legacy];compareCount=Math.max(compareCount,1)}
    }
    if(compareCount&&comparisonCases.length<compareCount)comparisonCases=[...comparisonCases,...Array(compareCount-comparisonCases.length).fill(null)];
    if(!compareCount&&comparisonCases.some(Boolean))compareCount=Math.min(MAX_COMPARE,comparisonCases.length);
  }catch(_){}

  function persistComparison(){
    comparisonCases=comparisonCases.slice(0,compareCount||MAX_COMPARE);
    try{sessionStorage.setItem(MULTI_KEY,JSON.stringify(comparisonCases));sessionStorage.setItem(COUNT_KEY,String(compareCount||0))}catch(_){}
    const first=comparisonCases.find(Boolean);try{first?sessionStorage.setItem(LEGACY_SECOND_KEY,JSON.stringify(first)):sessionStorage.removeItem(LEGACY_SECOND_KEY)}catch(_){}
  }

  function normalizedWeights(){
    const criteria=window.ASSESSMENT_CRITERIA||[];if(!criteria.length)return [];
    const raw=criteria.map(main=>{const w=Number(state.weights?.[main.id]??(1/criteria.length));return Number.isFinite(w)&&w>=0?w:0});
    const total=raw.reduce((a,b)=>a+b,0);return total>0?raw.map(w=>w/total):criteria.map(()=>1/criteria.length);
  }
  function valuesForScores(main,scores){return main.subgroups.flatMap(sub=>sub.items.map(item=>Number(scores?.[itemKey(main,sub,item)])).filter(n=>Number.isFinite(n)&&n>0))}
  function caseMetrics(caseState){
    const criteria=window.ASSESSMENT_CRITERIA||[],weights=normalizedWeights(),maxWeight=Math.max(0,...weights);let answered=0,totalItems=0;
    const rows=criteria.map((main,index)=>{const vals=valuesForScores(main,caseState?.scores||{}),total=main.subgroups.reduce((sum,sub)=>sum+sub.items.length,0);answered+=vals.length;totalItems+=total;const avg=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:NaN,avg100=Number.isFinite(avg)?avg*10:NaN,weight=weights[index]||0,contribution=Number.isFinite(avg100)?avg100*weight:NaN,weightedVisual=Number.isFinite(avg100)?(weight<=0?0:(maxWeight>0?Math.max(0,Math.min(100,avg100*(weight/maxWeight))):NaN)):NaN;return {main,avg,avg100,weight,contribution,weightedVisual,answered:vals.length,total}});
    const rated=rows.filter(r=>Number.isFinite(r.contribution)&&Number.isFinite(r.weight)),ratedWeight=rated.reduce((sum,r)=>sum+r.weight,0),final100=ratedWeight>0?rated.reduce((sum,r)=>sum+r.contribution,0)/ratedWeight:NaN;
    return {rows,final100,completion:totalItems?Math.round(answered/totalItems*100):0,answered,total:totalItems};
  }
  function vehicleLabel(caseState,fallback){const meta=caseState?.metadata||{};return [meta.brand,meta.model].filter(Boolean).join(' ').trim()||fallback}
  function signed(value,digits=2){if(!Number.isFinite(value))return '—';const n=Number(value.toFixed(digits));return localNumber(`${n>0?'+':''}${n.toFixed(digits)}`)}
  function criterionLabel(main){return title(main.titleFa,'main',main.id)}

  function setComparisonMode(active){
    comparisonMode=Boolean(active)&&currentRole==='manager';document.documentElement.classList.toggle('managerComparisonMode',comparisonMode);
    const card=document.querySelector('#managerComparisonCard'),entry=document.querySelector('#managerComparisonEntry');if(card)card.hidden=!comparisonMode||currentRole!=='manager';if(entry)entry.hidden=comparisonMode||currentRole!=='manager';
    if(comparisonMode){window.scrollTo({top:0,behavior:'smooth'});requestAnimationFrame(renderComparison)}
  }

  function ensureComparisonSection(){
    let card=document.querySelector('#managerComparisonCard');if(card)return card;const weightPanel=document.querySelector('#managerWeightPanel');if(!weightPanel)return null;
    const entry=document.createElement('section');entry.className='card managerOnly managerComparisonEntry';entry.id='managerComparisonEntry';entry.hidden=currentRole!=='manager';entry.innerHTML=`<div class="comparisonEntryCopy"><div><h2 id="comparisonEntryTitle"></h2><p id="comparisonEntryHint"></p></div><button id="openComparisonMode" type="button"></button></div>`;weightPanel.insertAdjacentElement('afterend',entry);
    card=document.createElement('section');card.className='card managerOnly managerComparisonCard managerComparisonWorkspace';card.id='managerComparisonCard';card.hidden=true;card.innerHTML=`
      <div class="comparisonWorkspaceHeader"><button class="comparisonBackButton" id="closeComparisonMode" type="button"></button><div class="comparisonWorkspaceTitle"><h2 id="comparisonTitle"></h2><p id="comparisonHint"></p></div><span class="comparisonStatus" id="comparisonStatus"></span></div>
      <div id="comparisonConfigArea"></div><div class="vehicleComparisonBody" id="vehicleComparisonBody"></div>`;entry.insertAdjacentElement('afterend',card);
    entry.querySelector('#openComparisonMode').addEventListener('click',()=>setComparisonMode(true));card.querySelector('#closeComparisonMode').addEventListener('click',()=>setComparisonMode(false));
    return card;
  }

  function setComparisonCount(next){
    const n=Math.max(1,Math.min(MAX_COMPARE,Number(next)||1));
    if(n<compareCount&&comparisonCases.slice(n).some(Boolean)){
      const ok=confirm(locale==='fa'?'با کاهش تعداد، خودروهای بارگذاری‌شده خارج از محدوده جدید حذف می‌شوند. ادامه می‌دهید؟':'Reducing the count will remove loaded vehicles outside the new range. Continue?');if(!ok)return false;
    }
    compareCount=n;comparisonCases=comparisonCases.slice(0,n);while(comparisonCases.length<n)comparisonCases.push(null);persistComparison();renderComparison();return true;
  }

  function parseAssessmentFile(file,index){
    const reader=new FileReader();reader.onload=()=>{try{const parsed=JSON.parse(String(reader.result||'')),loaded=parsed?.state||parsed?.payload?.state||parsed?.payload||parsed;if(!loaded||typeof loaded!=='object'||!loaded.scores||typeof loaded.scores!=='object')throw new Error('invalid');comparisonCases[index]={fileName:file.name,savedAt:parsed?.savedAt||parsed?.createdAt||null,state:{metadata:{...(loaded.metadata||{})},scores:{...(loaded.scores||{})}}};persistComparison();renderComparison()}catch(_){alert(locale==='fa'?'فایل JSON ارزیابی قابل خواندن نیست.':'The assessment JSON file could not be read.')}};reader.onerror=()=>alert(locale==='fa'?'خواندن فایل ناموفق بود.':'The file could not be read.');reader.readAsText(file);
  }

  function singleRadar(rows,name){
    const colors=['#2463a5','#b54d66','#128778','#d58a24','#7454b8','#d9673a','#3e8c47','#ad5f99','#2c7d9a','#96733c','#5475b5','#b85c48','#4b9a91','#8f5c6b','#527e50'],data=rows||[],hasAny=data.some(r=>Number.isFinite(r.avg100));
    if(!hasAny)return `<article class="comparisonRadarPane"><strong>${esc(name)}</strong><div class="comparisonManagerRadar radarChart"><p class="chartEmpty" dir="${locale==='fa'?'rtl':'ltr'}">${locale==='fa'?'پس از ثبت امتیازها، نمودار عنکبوتی نمایش داده می‌شود.':'The radar chart will appear after scores are recorded.'}</p></div></article>`;
    const n=data.length,cx=380,cy=300,R=190,angle=i=>-Math.PI/2+i*2*Math.PI/n,point=(i,radius)=>{const a=angle(i);return[cx+Math.cos(a)*radius,cy+Math.sin(a)*radius]},pts=radius=>data.map((_,i)=>point(i,radius).join(',')).join(' '),impactValue=r=>Number.isFinite(r.weightedVisual)?r.weightedVisual:0,dataPoints=data.map((r,i)=>point(i,impactValue(r)/100*R));
    const wedges=data.map((r,i)=>{const p1=point(i,R),p2=point((i+1)%n,R);return `<polygon points="${cx},${cy} ${p1.join(',')} ${p2.join(',')}" fill="${colors[i%colors.length]}" opacity=".075"/>`}).join('');
    const axes=data.map((r,i)=>{const a=angle(i),ux=Math.cos(a),uy=Math.sin(a),[x,y]=point(i,R),[lx,ly]=point(i,R+72),[vx,vy]=dataPoints[i],label=title(r.main.titleFa,'main',r.main.id),words=label.split(/\s+/),cut=Math.ceil(words.length/2),lines=words.length>3?[words.slice(0,cut).join(' '),words.slice(cut).join(' ')]:[label],impact=impactValue(r),value=Number.isFinite(r.avg100)?fmt(impact):'—',valueRadius=Math.max(30,impact/100*R+18),[scoreX,scoreY]=point(i,valueRadius),anchor=ux>.28?'start':ux<-.28?'end':'middle',baseline=uy>.55?'hanging':uy<-.55?'auto':'middle',circle=Number.isFinite(r.avg100)||r.weight<=0?`<circle cx="${vx}" cy="${vy}" r="${impact<=0?3.8:5.5}" fill="${colors[i%colors.length]}" stroke="#fff" stroke-width="2"/>`:'',valueText=impact>0?`<text x="${scoreX}" y="${scoreY}" text-anchor="${anchor}" dominant-baseline="${baseline}" class="radarValue" fill="${colors[i%colors.length]}">${value}</text>`:'';return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" style="stroke:${colors[i%colors.length]}88"/>${circle}${valueText}<text x="${lx}" y="${ly}" fill="${colors[i%colors.length]}">${lines.map((line,j)=>`<tspan x="${lx}" dy="${j?15:0}">${esc(line)}</tspan>`).join('')}</text>`}).join('');
    return `<article class="comparisonRadarPane"><strong>${esc(name)}</strong><div class="comparisonManagerRadar radarChart"><svg viewBox="0 0 760 600" role="img" aria-label="${locale==='fa'?'نمودار عنکبوتی وزن‌دار شاخص‌ها از ۱۰۰':'Weighted criteria radar chart out of 100'}">${wedges}${[.2,.4,.6,.8,1].map(x=>`<polygon points="${pts(R*x)}" class="radarGrid"/>`).join('')}${axes}<polygon points="${dataPoints.map(p=>p.join(',')).join(' ')}" class="radarData"/></svg></div></article>`;
  }

  function renderConfig(card){
    const root=card.querySelector('#comparisonConfigArea'),fa=locale==='fa';if(!root)return;
    if(!compareCount){root.innerHTML=`<section class="comparisonCountPrompt"><div><h3>${fa?'چند خودرو با خودروی فعلی مقایسه شود؟':'How many vehicles should be compared with the current vehicle?'}</h3><p>${fa?'تعداد خودروهای مقایسه‌ای را مشخص کنید؛ سپس برای هر خودرو یک فایل JSON بارگذاری می‌شود.':'Choose the number of comparison vehicles, then load one JSON assessment for each vehicle.'}</p></div><label><span>${fa?'تعداد خودروهای مقایسه‌ای':'Comparison vehicles'}</span><select id="comparisonVehicleCount">${Array.from({length:MAX_COMPARE},(_,i)=>`<option value="${i+1}">${localNumber(i+1)}</option>`).join('')}</select></label><button id="applyComparisonCount" type="button">${fa?'ادامه و بارگذاری فایل‌ها':'Continue to File Uploads'}</button></section>`;root.querySelector('#applyComparisonCount').onclick=()=>setComparisonCount(root.querySelector('#comparisonVehicleCount').value);return}
    const loaded=comparisonCases.filter(Boolean).length;
    root.innerHTML=`<div class="comparisonCountToolbar"><div><strong>${fa?'تعداد خودروهای مقایسه‌ای':'Comparison vehicles'}: ${localNumber(compareCount)}</strong><span>${fa?`${localNumber(loaded)} فایل بارگذاری شده`:`${loaded} file${loaded===1?'':'s'} loaded`}</span></div><label><span>${fa?'تغییر تعداد':'Change count'}</span><select id="comparisonVehicleCount">${Array.from({length:MAX_COMPARE},(_,i)=>`<option value="${i+1}" ${i+1===compareCount?'selected':''}>${localNumber(i+1)}</option>`).join('')}</select></label><button id="applyComparisonCount" type="button">${fa?'اعمال':'Apply'}</button></div><div class="multiComparisonUploadGrid">${Array.from({length:compareCount},(_,index)=>{const item=comparisonCases[index],name=item?vehicleLabel(item.state,fa?`خودروی مقایسه‌ای ${localNumber(index+1)}`:`Comparison Vehicle ${index+1}`):'';return `<article class="comparisonUploadSlot ${item?'loaded':''}"><div><small>${fa?'خودروی مقایسه‌ای':'Comparison Vehicle'} ${localNumber(index+1)}</small><strong>${item?esc(name):(fa?'فایلی بارگذاری نشده':'No file loaded')}</strong>${item?`<span dir="ltr">${esc(item.fileName||'')}</span>`:''}</div><div class="comparisonSlotActions"><label class="comparisonUploadButton">${item?(fa?'تعویض فایل':'Replace File'):(fa?'بارگذاری JSON':'Load JSON')}<input data-comparison-file="${index}" type="file" accept="application/json,.json" hidden></label><button class="comparisonRemoveButton" data-remove-comparison="${index}" type="button" ${item?'':'disabled'}>${fa?'حذف':'Remove'}</button></div></article>`}).join('')}</div>`;
    root.querySelector('#applyComparisonCount').onclick=()=>setComparisonCount(root.querySelector('#comparisonVehicleCount').value);
    root.querySelectorAll('[data-comparison-file]').forEach(input=>input.addEventListener('change',e=>{const file=e.target.files?.[0];if(file)parseAssessmentFile(file,Number(e.target.dataset.comparisonFile));e.target.value=''}));
    root.querySelectorAll('[data-remove-comparison]').forEach(btn=>btn.addEventListener('click',()=>{const index=Number(btn.dataset.removeComparison);comparisonCases[index]=null;persistComparison();renderComparison()}));
  }

  function renderComparison(){
    const card=ensureComparisonSection(),entry=document.querySelector('#managerComparisonEntry');if(!card||!entry)return;const fa=locale==='fa',set=(root,sel,text)=>{const el=root.querySelector(sel);if(el)el.textContent=text};
    set(entry,'#comparisonEntryTitle',fa?'مقایسه خودروها':'Vehicle Comparison');set(entry,'#comparisonEntryHint',fa?'ارزیابی خودروی فعلی را هم‌زمان با یک یا چند خودروی دیگر مقایسه کنید.':'Compare the current assessment with one or more other vehicles.');set(entry,'#openComparisonMode',fa?'ورود به بخش مقایسه':'Open Comparison');
    card.hidden=!comparisonMode||currentRole!=='manager';entry.hidden=comparisonMode||currentRole!=='manager';set(card,'#closeComparisonMode',fa?'بازگشت به داشبورد مدیریت':'Back to Management Dashboard');set(card,'#comparisonTitle',fa?'مقایسه چندخودرویی ارزیابی‌ها':'Multi-Vehicle Assessment Comparison');set(card,'#comparisonHint',fa?'ابتدا تعداد خودروهای مقایسه‌ای را مشخص کنید، سپس فایل JSON هر خودرو را جداگانه بارگذاری کنید.':'Choose how many vehicles to compare, then load each vehicle assessment JSON separately.');
    renderConfig(card);
    const status=card.querySelector('#comparisonStatus'),body=card.querySelector('#vehicleComparisonBody'),loadedItems=comparisonCases.map((item,index)=>item?{item,index}:null).filter(Boolean);if(status)status.textContent=!compareCount?(fa?'انتخاب تعداد':'Choose count'):(fa?`${localNumber(loadedItems.length)} از ${localNumber(compareCount)} بارگذاری شده`:`${loadedItems.length} of ${compareCount} loaded`);
    if(!compareCount){if(body)body.innerHTML='';return}
    if(!loadedItems.length){if(body)body.innerHTML=`<div class="comparisonEmpty comparisonModeEmpty"><strong>${fa?'هنوز هیچ خودروی مقایسه‌ای بارگذاری نشده است.':'No comparison vehicle has been loaded yet.'}</strong><span>${fa?'از بالا فایل JSON هر خودرو را بارگذاری کنید.':'Load each vehicle JSON from the slots above.'}</span></div>`;return}
    const current={metadata:state.metadata||{},scores:state.scores||{}},allCases=[{state:current,index:-1},...loadedItems.map(x=>({state:x.item.state,index:x.index}))],metrics=allCases.map(x=>caseMetrics(x.state)),names=allCases.map((x,i)=>vehicleLabel(x.state,i===0?(fa?'خودروی فعلی':'Current Vehicle'):(fa?`خودروی ${localNumber(i+1)}`:`Vehicle ${i+1}`)));
    const scoreCards=metrics.map((m,i)=>`<article><small>${i===0?(fa?'خودروی فعلی':'Current Vehicle'):(fa?'خودروی مقایسه‌ای':'Comparison Vehicle')}</small><strong>${esc(names[i])}</strong><b>${Number.isFinite(m.final100)?fmt(m.final100):'—'} <em>/ ${localNumber(100)}</em></b><span>${fa?'تکمیل':'Completion'}: ${localNumber(m.completion)}٪</span>${i?`<span class="comparisonCardDiff ${Number.isFinite(m.final100)&&Number.isFinite(metrics[0].final100)?(m.final100-metrics[0].final100>0?'positive':m.final100-metrics[0].final100<0?'negative':'equal'):''}" dir="ltr">Δ ${signed(Number.isFinite(m.final100)&&Number.isFinite(metrics[0].final100)?m.final100-metrics[0].final100:NaN)}</span>`:''}</article>`).join('');
    const radars=`<div class="comparisonChartCard comparisonRadarPairCard"><div class="comparisonChartHeader"><div><h3>${fa?'نمودارهای عنکبوتی مقایسه‌ای':'Comparative Radar Charts'}</h3><p>${fa?'هر خودرو با منطق و رنگ‌بندی نمودار مدیریت نمایش داده می‌شود.':'Each vehicle uses the management radar logic and criterion color scheme.'}</p></div></div><div class="comparisonRadarPair multiRadarGrid">${metrics.map((m,i)=>singleRadar(m.rows,names[i])).join('')}</div></div>`;
    const accent=['#2463a5','#b54d66','#128778','#d58a24','#7454b8','#d9673a','#3e8c47','#ad5f99','#2c7d9a','#96733c','#5475b5','#b85c48','#4b9a91','#8f5c6b','#527e50'];
    const grid=`58px 72px minmax(250px,1.55fr) repeat(${metrics.length},minmax(145px,.78fr))`,minWidth=500+metrics.length*155;
    const head=`<div class="comparisonHead managementStyleComparisonHead multiVehicleComparisonHead" style="grid-template-columns:${grid}!important;min-width:${minWidth}px!important"><span>${fa?'ردیف':'No.'}</span><span>${fa?'آیکون':'Icon'}</span><strong>${fa?'شاخص':'Criterion'}</strong>${names.map(n=>`<span>${esc(n)}</span>`).join('')}</div>`;
    const tableRows=metrics[0].rows.map((r,rowIndex)=>`<article class="comparisonRow managementStyleComparisonRow multiVehicleComparisonRow" style="--row-accent:${accent[rowIndex%accent.length]};grid-template-columns:${grid}!important;min-width:${minWidth}px!important"><span class="comparisonRowNumber">${localNumber(rowIndex+1)}</span><span class="comparisonRowIcon">${criterionIconForMain(r.main)}</span><strong class="comparisonCriterion">${criterionLabel(r.main)}</strong>${metrics.map((m,i)=>{const value=m.rows[rowIndex]?.avg,diff=i&&Number.isFinite(value)&&Number.isFinite(metrics[0].rows[rowIndex]?.avg)?value-metrics[0].rows[rowIndex].avg:NaN;return `<span class="comparisonVehicleScore multiVehicleScore"><b>${Number.isFinite(value)?fmt(value):'—'}</b>${i?`<small class="${Number.isFinite(diff)?(diff>0?'positive':diff<0?'negative':'equal'):''}" dir="ltr">${signed(diff)}</small>`:''}</span>`}).join('')}</article>`).join('');
    body.innerHTML=`<div class="comparisonScoreGrid multiComparisonScoreGrid">${scoreCards}</div><div class="comparisonChartsGrid comparisonRadarOnlyGrid">${radars}</div><div class="comparisonTable managementStyleComparisonTable multiVehicleComparisonTable">${head}${tableRows}</div>`;
  }

  const previousManagerRefresh=window.managerRefresh||managerRefresh;managerRefresh=function(...args){const result=previousManagerRefresh(...args);renderComparison();return result};window.managerRefresh=managerRefresh;
  const previousSetLocale=setLocale;setLocale=function(next){const result=previousSetLocale(next);renderComparison();return result};
  document.querySelector('#switchRoleButton')?.addEventListener('click',()=>requestAnimationFrame(()=>{if(currentRole!=='manager')setComparisonMode(false);renderComparison()}));
  ensureComparisonSection();renderComparison();
})();
