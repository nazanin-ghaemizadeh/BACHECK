/* v54 — single-page mobile management, unified toolbar, clearer charts. */
(function(){
  'use strict';
  const fa=()=>document.documentElement.lang==='fa'||document.documentElement.dir==='rtl';

  function moveLanguageIntoToolbar(){
    const actionCard=document.querySelector('.topbar .actionCard');
    const lang=document.querySelector('#languageButton');
    if(actionCard&&lang&&lang.parentElement!==actionCard) actionCard.appendChild(lang);
  }

  function flattenManagerPage(){
    const page=document.querySelector('#mobileManagerPage');
    if(!page||page.dataset.v54Flattened==='1') return;
    page.dataset.v54Flattened='1';
    page.querySelector('#mobileManagerTabs')?.remove();
    const panelsWrap=page.querySelector('.mobileManagerPanels');
    if(!panelsWrap) return;
    const content=document.createElement('div');
    content.className='mobileManagerContent';
    ['overview','analytics','tools','records'].forEach(name=>{
      const panel=panelsWrap.querySelector(`[data-manager-panel="${name}"]`);
      if(!panel) return;
      panel.hidden=false;
      while(panel.firstChild) content.appendChild(panel.firstChild);
    });
    panelsWrap.replaceWith(content);
    const customHeader=page.querySelector('.mobileManagerHeader');
    if(customHeader) customHeader.hidden=true;
  }

  function installMobileWeightedChart(){
    if(window.__bamcoV54ChartInstalled) return;
    window.__bamcoV54ChartInstalled=true;
    const prior=window.renderChart;
    if(typeof prior!=='function') return;
    const colors=['#2463a5','#b54d66','#128778','#d58a24','#7454b8','#d9673a','#3e8c47','#ad5f99','#2c7d9a','#96733c','#5475b5','#b85c48','#4b9a91','#8f5c6b','#527e50'];
    const mobileRender=function(rows){
      if(window.innerWidth>900) return prior(rows);
      const host=document.querySelector('#scoreChart');
      if(!host) return;
      const list=(rows||[]).map(r=>({...r,weight:Math.max(0,Number(r.weight)||0)}));
      const maxWeight=Math.max(0,...list.map(r=>r.weight));
      const data=list.map(r=>{
        const raw=Number.isFinite(r.avg100)?r.avg100:(Number.isFinite(r.avg)?r.avg*10:NaN);
        const weighted=Number.isFinite(raw)&&maxWeight>0?raw*(r.weight/maxWeight):NaN;
        return {...r,raw100:raw,weightedVisual:Number.isFinite(weighted)?Math.max(0,Math.min(100,weighted)):NaN};
      }).filter(r=>Number.isFinite(r.weightedVisual)).sort((a,b)=>b.weightedVisual-a.weightedVisual);
      if(!data.length){
        host.innerHTML=`<p class="chartEmpty">${fa()?'پس از ثبت امتیازها، نمودار وزن‌دار در این بخش نمایش داده می‌شود.':'The weighted comparison chart will appear after scores are recorded.'}</p>`;
        return;
      }
      host.innerHTML=`<div class="mobileWeightedList">${data.map((r,i)=>{
        const label=typeof title==='function'?title(r.main.titleFa,'main',r.main.id):(r.main.titleFa||r.main.id);
        const value=typeof fmt==='function'?fmt(r.weightedVisual):r.weightedVisual.toFixed(1);
        return `<div class="mobileWeightedRow"><div class="mobileWeightedMeta"><span>${label}</span><b>${value}</b></div><div class="mobileWeightedTrack"><i style="width:${r.weightedVisual}%;--mobile-bar:${colors[i%colors.length]}"></i></div></div>`;
      }).join('')}</div>`;
    };
    window.renderChart=mobileRender;
    try{renderChart=mobileRender;}catch(_){}
  }

  function refreshVisibleCharts(){
    if(window.innerWidth>900) return;
    try{if(typeof update==='function') update();}catch(_){}
  }

  function sync(){
    moveLanguageIntoToolbar();
    flattenManagerPage();
    const page=document.querySelector('#mobileManagerPage');
    if(page) page.hidden=!(document.body.classList.contains('managerMode')&&!document.querySelector('#appShell')?.hidden);
  }

  window.addEventListener('DOMContentLoaded',()=>{
    moveLanguageIntoToolbar();
    installMobileWeightedChart();
    requestAnimationFrame(()=>{
      flattenManagerPage();
      sync();
      refreshVisibleCharts();
    });
    document.querySelectorAll('#entryRoleChoices [data-role],#switchRoleButton,#languageButton').forEach(btn=>btn.addEventListener('click',()=>requestAnimationFrame(()=>{sync();refreshVisibleCharts();})));
    window.addEventListener('bamco:case-restored',()=>requestAnimationFrame(refreshVisibleCharts));
    window.addEventListener('resize',()=>requestAnimationFrame(refreshVisibleCharts));
    new MutationObserver(()=>requestAnimationFrame(sync)).observe(document.body,{attributes:true,attributeFilter:['class']});
  });
})();
