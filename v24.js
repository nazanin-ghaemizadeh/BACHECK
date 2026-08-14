/* v24 — unboxed chart values, external quality frequencies, and weight-aware radar */
(()=>{
  const criteria=()=>window.ASSESSMENT_CRITERIA||[];
  const colors=['#2463a5','#b54d66','#128778','#d58a24','#7454b8','#d9673a','#3e8c47','#ad5f99','#2c7d9a','#96733c','#5475b5','#b85c48','#4b9a91','#8f5c6b','#527e50'];

  const weightedImpactRows=rows=>{
    const list=(rows||[]).map(r=>({...r,weight:Math.max(0,Number(r.weight)||0)}));
    const maxWeight=Math.max(0,...list.map(r=>r.weight));
    return list.map(r=>{
      const raw=Number.isFinite(r.avg100)?r.avg100:(Number.isFinite(r.avg)?r.avg*10:NaN);
      const impact=Number.isFinite(raw)&&maxWeight>0?raw*(r.weight/maxWeight):(r.weight===0?0:NaN);
      return {...r,raw100:raw,weightedVisual:Number.isFinite(impact)?Math.max(0,Math.min(100,impact)):NaN};
    });
  };

  /* Actual score frequency remains visible, but never sits on top of a colored bar. */
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
      return `<div class="qualityBar" dir="ltr"><span class="qualityLabel">${esc(label)}</span><div class="qualityTrack" aria-label="${esc(label)}: ${localNumber(count)}"><i style="--quality-width:${width}%;--quality-color:${scoreColor(i+1)}"></i></div><b class="qualityFrequency">${localNumber(count)}</b></div>`;
    }).join('');
  };

  /* Radar uses the exact same relative weighted impact as the weighted column chart.
     A criterion with zero active weight is therefore plotted at the center (0). */
  renderRadar=function(rows){
    const host=document.querySelector('#radarChart');
    if(!host)return;
    const data=weightedImpactRows(rows);
    const hasAnyScore=data.some(r=>Number.isFinite(r.raw100));
    if(!hasAnyScore){
      host.innerHTML=`<p class="chartEmpty" dir="${locale==='fa'?'rtl':'ltr'}">${locale==='fa'?'پس از ثبت امتیازها، نمودار عنکبوتی نمایش داده می‌شود.':'The radar chart will appear after scores are recorded.'}</p>`;
      return;
    }
    const n=data.length,cx=380,cy=300,R=190;
    const angle=i=>-Math.PI/2+i*2*Math.PI/n;
    const point=(i,radius)=>{const a=angle(i);return[cx+Math.cos(a)*radius,cy+Math.sin(a)*radius]};
    const pts=radius=>data.map((_,i)=>point(i,radius).join(',')).join(' ');
    const impactValue=r=>Number.isFinite(r.weightedVisual)?r.weightedVisual:0;
    const dataPoints=data.map((r,i)=>point(i,impactValue(r)/100*R));
    const wedges=data.map((r,i)=>{const p1=point(i,R),p2=point((i+1)%n,R);return `<polygon points="${cx},${cy} ${p1.join(',')} ${p2.join(',')}" fill="${colors[i%colors.length]}" opacity=".075"/>`}).join('');
    const axes=data.map((r,i)=>{
      const a=angle(i),ux=Math.cos(a),uy=Math.sin(a),[x,y]=point(i,R),[lx,ly]=point(i,R+72),[vx,vy]=dataPoints[i];
      const name=title(r.main.titleFa,'main',r.main.id),words=name.split(/\s+/),cut=Math.ceil(words.length/2),lines=words.length>3?[words.slice(0,cut).join(' '),words.slice(cut).join(' ')]:[name];
      const impact=impactValue(r),value=(Number.isFinite(r.raw100)?fmt(impact):'—');
      const valueRadius=Math.max(30,impact/100*R+18),[scoreX,scoreY]=point(i,valueRadius);
      const anchor=ux>.28?'start':ux<-.28?'end':'middle',baseline=uy>.55?'hanging':uy<-.55?'auto':'middle';
      const circle=Number.isFinite(r.raw100)||r.weight<=0?`<circle cx="${vx}" cy="${vy}" r="${impact<=0?3.8:5.5}" fill="${colors[i%colors.length]}" stroke="#fff" stroke-width="2"/>`:'';
      const valueText=impact>0?`<text x="${scoreX}" y="${scoreY}" text-anchor="${anchor}" dominant-baseline="${baseline}" class="radarValue" fill="${colors[i%colors.length]}">${value}</text>`:'';
      return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" style="stroke:${colors[i%colors.length]}88"/>${circle}${valueText}<text x="${lx}" y="${ly}" fill="${colors[i%colors.length]}">${lines.map((line,j)=>`<tspan x="${lx}" dy="${j?15:0}">${esc(line)}</tspan>`).join('')}</text>`;
    }).join('');
    host.innerHTML=`<svg viewBox="0 0 760 600" role="img" aria-label="${locale==='fa'?'نمودار عنکبوتی وزن‌دار شاخص‌ها از ۱۰۰':'Weighted criteria radar chart out of 100'}">${wedges}${[.2,.4,.6,.8,1].map(x=>`<polygon points="${pts(R*x)}" class="radarGrid"/>`).join('')}${axes}<polygon points="${dataPoints.map(p=>p.join(',')).join(' ')}" class="radarData"/></svg>`;
  };

  /* Ensure the v24 renderers remain the final renderers after every manager refresh. */
  const previousManagerRefresh=window.managerRefresh||managerRefresh;
  managerRefresh=function(...args){
    const out=previousManagerRefresh(...args);
    const rows=args[0]||[];
    renderRadar(rows);
    renderQualityChart();
    return out;
  };
  window.managerRefresh=managerRefresh;

  if(typeof update==='function')update();
})();
