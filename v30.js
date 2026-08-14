/* v30 — priority-only strengths (10/9/8) and weaknesses (1/2/3) */
(()=>{
  const criteria=()=>window.ASSESSMENT_CRITERIA||[];
  const activeNormalizedWeights=()=>{
    const list=criteria();
    const raw=list.map(main=>Math.max(0,Number(state.weights?.[main.id])||0));
    const total=raw.reduce((a,b)=>a+b,0);
    if(total>0)return raw.map(v=>v/total);
    return list.map(()=>list.length?1/list.length:0);
  };

  function renderPriorityStrengthWeakness(){
    const fa=locale==='fa';
    const weights=activeNormalizedWeights();
    const groups=criteria().map((main,index)=>{
      if((weights[index]||0)<=0)return null;
      const items=main.subgroups.flatMap(sub=>
        sub.items
          .map(item=>({sub,item,score:Number(state.scores?.[itemKey(main,sub,item)])}))
          .filter(row=>Number.isFinite(row.score))
      );
      return items.length?{main,items}:null;
    }).filter(Boolean);

    const pick=(items,levels)=>{
      const level=levels.find(n=>items.some(item=>item.score===n));
      return level===undefined?[]:items.filter(item=>item.score===level);
    };

    // Priority within each criterion: strongest available of 10→9→8, weakest available of 1→2→3.
    const strengths=groups
      .map(group=>({...group,items:pick(group.items,[10,9,8])}))
      .filter(group=>group.items.length);
    const weaknesses=groups
      .map(group=>({...group,items:pick(group.items,[1,2,3])}))
      .filter(group=>group.items.length);

    const render=(items,weak)=>items.length?items.map(group=>{
      const level=group.items[0].score;
      const scoreLevel=SCORE_LEVELS.find(x=>x.n===level);
      const levelTitle=fa?(scoreLevel?.fa||''):(scoreLevel?.en||'');
      const count=group.items.length;
      const countText=fa?`${localNumber(count)} مورد`:`${localNumber(count)} ${count===1?'item':'items'}`;
      return `<details class="performanceDetails"><summary><strong>${esc(title(group.main.titleFa,'main',group.main.id))}</strong><span>${countText} — ${levelTitle}</span></summary><div>${group.items.map(row=>`<article class="summaryPoint"><strong>${esc(fa?(row.item.titleFa||itemTitle(row.item)):itemTitleEn(row.item))}</strong><span>${localNumber(row.score)} ${fa?'از ۱۰':'out of 10'}</span><small>${esc(title(row.sub.titleFa,'sub',row.sub.id))}</small></article>`).join('')}</div></details>`;
    }).join(''):`<div class="auditEmpty">${fa?(weak?'موردی با امتیاز ۱، ۲ یا ۳ در شاخص‌های دارای وزن ثبت نشده است.':'موردی با امتیاز ۸، ۹ یا ۱۰ در شاخص‌های دارای وزن ثبت نشده است.'):(weak?'No item scored 1, 2, or 3 in a criterion with active weight.':'No item scored 8, 9, or 10 in a criterion with active weight.')}</div>`;

    const a=document.querySelector('#strengthList');
    const b=document.querySelector('#weaknessList');
    if(a)a.innerHTML=render(strengths,false);
    if(b)b.innerHTML=render(weaknesses,true);
  }

  const previousManagerRefresh=window.managerRefresh||managerRefresh;
  managerRefresh=function(...args){
    const out=previousManagerRefresh(...args);
    renderPriorityStrengthWeakness();
    return out;
  };
  window.managerRefresh=managerRefresh;

  renderPriorityStrengthWeakness();
})();
