/* v29 — strength threshold cleanup and compact equal empty chart cards */
(()=>{
  function syncEmptyChartCards(){
    const ids=['scoreChart','qualityChart','radarChart'];
    ids.forEach(id=>{
      const host=document.getElementById(id);
      if(!host)return;
      const empty=!!host.querySelector('.chartEmpty,.qualityEmpty');
      const card=host.closest('.card');
      host.classList.toggle('chartEmptyHost',empty);
      if(card)card.classList.toggle('chartEmptyCard',empty);
    });
  }

  const previousManagerRefresh=window.managerRefresh||managerRefresh;
  managerRefresh=function(...args){
    const out=previousManagerRefresh(...args);
    syncEmptyChartCards();
    return out;
  };
  window.managerRefresh=managerRefresh;

  syncEmptyChartCards();
  requestAnimationFrame(syncEmptyChartCards);
})();
