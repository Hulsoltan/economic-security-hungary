'use strict';
// Інтерактивний графік на основі перевірених статистичних рядів.
// Джерела й примітки до сумісності рядів: country.html та insights.html.
(() => {
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('main-nav');
  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      const opened = menuToggle.getAttribute('aria-expanded') !== 'true';
      menuToggle.setAttribute('aria-expanded', String(opened));
      menuToggle.textContent = opened ? '✕ Закрити' : '☰ Меню';
      nav.classList.toggle('is-open', opened);
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.textContent = '☰ Меню';
      nav.classList.remove('is-open');
    }));
  }

  const chartElement = document.getElementById('economic-chart');
  if (!chartElement) return;

  const years = [2020, 2021, 2022, 2023, 2024, 2025];
  const metrics = {
    gdp: {
      title: 'Зростання реального ВВП', subtitle: 'Річна зміна, %',
      values: [-4.3, 7.2, 4.3, -0.8, 0.5, 0.5], color: '#174e45',
      comment: 'Після спаду 2020 року економіка відновилася у 2021-му, але у 2023 році знову скоротилася. У 2024–2025 роках зростання було слабким — близько 0,5%.'
    },
    inflation: {
      title: 'Інфляція споживчих цін (CPI)', subtitle: 'Середня зміна цін за рік, %',
      values: [3.3, 5.1, 14.6, 17.1, 3.7, 4.4], color: '#c44d52',
      comment: 'Найвища інфляція протягом періоду спостерігалася у 2023 році — 17,1%. У 2024 році темп зростання цін різко знизився, а у 2025-му становив 4,4%.'
    },
    debt: {
      title: 'Державний борг', subtitle: 'Частка у ВВП, %',
      values: [78.7, 76.2, 74.1, 73.2, 73.5, 74.4], color: '#174e45', reference: 60,
      comment: 'Відносний борг знизився з 78,7% ВВП у 2020 році до 73,2% у 2023-му, однак у 2024–2025 роках знову зростав і залишився вище референтних 60% ЄС.'
    },
    deficit: {
      title: 'Сальдо державного бюджету', subtitle: 'Частка у ВВП, % (від’ємне — дефіцит)',
      values: [-7.5, -7.1, -6.2, -7.0, -5.1, -4.7], color: '#c44d52', reference: -3,
      comment: 'Дефіцит скоротився до 4,7% ВВП у 2025 році після 7,0% у 2023-му. Попри поліпшення, він залишився більшим за референтні 3% ВВП ЄС.'
    }
  };

  const pretty = n => (n < 0 ? '−' : '') + Math.abs(n).toLocaleString('uk-UA', {minimumFractionDigits: 1, maximumFractionDigits: 1});
  const svgNS = 'http://www.w3.org/2000/svg';
  const tag = (name, attrs = {}, content) => {
    const node = document.createElementNS(svgNS, name);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, String(value)));
    if (content !== undefined) node.textContent = content;
    return node;
  };

  function render(metricKey) {
    const metric = metrics[metricKey] || metrics.gdp;
    const W=970,H=385,L=67,R=40,T=28,B=55;
    const includeZero = metricKey !== 'debt';
    const minValue = Math.min(...metric.values, metric.reference ?? Infinity, ...(includeZero ? [0] : []));
    const maxValue = Math.max(...metric.values, metric.reference ?? -Infinity, ...(includeZero ? [0] : []));
    const span = maxValue - minValue || 1;
    const yMin = minValue - Math.max(1, span * .16);
    const yMax = maxValue + Math.max(1, span * .16);
    const x = i => L + i * (W - L - R) / (years.length - 1);
    const y = v => T + (yMax - v) * (H - T - B) / (yMax - yMin);
    const svg = tag('svg', {viewBox:`0 0 ${W} ${H}`,role:'img','aria-label':`${metric.title}, Угорщина, 2020–2025 роки`});
    svg.append(tag('title',{},`${metric.title}, Угорщина, 2020–2025 роки`));
    const defs = tag('defs');
    const grad = tag('linearGradient',{id:'lineShade',x1:'0%',y1:'0%',x2:'0%',y2:'100%'});
    grad.append(tag('stop',{offset:'0%','stop-color':metric.color,'stop-opacity':'.21'}),tag('stop',{offset:'100%','stop-color':metric.color,'stop-opacity':'0'}));
    defs.append(grad); svg.append(defs);
    for (let i=0;i<=4;i++) {
      const val = yMin + (yMax-yMin) * i/4;
      const yy = y(val);
      svg.append(tag('line',{x1:L,y1:yy,x2:W-R,y2:yy,stroke:'#e2e9e2','stroke-width':1}));
      svg.append(tag('text',{x:L-12,y:yy+5,'text-anchor':'end',fill:'#73867c','font-size':13,'font-family':'Manrope, sans-serif'},`${pretty(val)}%`));
    }
    if (typeof metric.reference === 'number') {
      const yy=y(metric.reference);
      svg.append(tag('line',{x1:L,y1:yy,x2:W-R,y2:yy,stroke:'#c44d52','stroke-width':2,'stroke-dasharray':'7 7','opacity':'.7'}));
      svg.append(tag('text',{x:W-R,y:yy-9,'text-anchor':'end',fill:'#c44d52','font-size':13,'font-weight':'700','font-family':'Manrope, sans-serif'},`Орієнтир ${pretty(metric.reference)}%`));
    }
    years.forEach((yr,i)=>{
      svg.append(tag('text',{x:x(i),y:H-17,'text-anchor':'middle',fill:'#586e63','font-size':15,'font-weight':'700','font-family':'Manrope, sans-serif'},String(yr)));
    });
    const path = metric.values.map((v,i)=>`${i===0?'M':'L'}${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(' ');
    const area = `${path} L${x(5)},${y(yMin)} L${x(0)},${y(yMin)} Z`;
    svg.append(tag('path',{d:area,fill:'url(#lineShade)'}));
    svg.append(tag('path',{d:path,fill:'none',stroke:metric.color,'stroke-width':4.2,'stroke-linecap':'round','stroke-linejoin':'round'}));
    metric.values.forEach((v,i)=>{
      const circle=tag('circle',{cx:x(i),cy:y(v),r:6.5,fill:'#fff',stroke:metric.color,'stroke-width':3.5});
      circle.append(tag('title',{},`${years[i]}: ${pretty(v)}%`));
      svg.append(circle);
      const above = i===0 || y(v) > T+50;
      const labelY = above ? y(v)-19 : y(v)+30;
      svg.append(tag('text',{x:x(i),y:labelY,'text-anchor':'middle',fill:'#18312d','font-size':17,'font-weight':'800','font-family':'Manrope, sans-serif'},`${pretty(v)}%`));
    });
    chartElement.replaceChildren(svg);
    chartElement.setAttribute('aria-label',`${metric.title}: ${years.map((yr,i)=>`${yr} рік — ${pretty(metric.values[i])}%`).join('; ')}`);
    const title=document.getElementById('chart-title'); if(title)title.textContent=metric.title;
    const subtitle=document.getElementById('chart-subtitle'); if(subtitle)subtitle.textContent=metric.subtitle;
    const comment=document.getElementById('chart-comment'); if(comment)comment.textContent=metric.comment;
    document.querySelectorAll('.chart-button').forEach(button=>{
      button.setAttribute('aria-pressed',String(button.dataset.metric===metricKey));
    });
  }
  document.querySelectorAll('.chart-button').forEach(button=>{
    button.addEventListener('click',()=>render(button.dataset.metric));
  });
  render('gdp');
})();
