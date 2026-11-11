import {assessmentLevels} from './learning-data.js?v=radar-20261111';
const safe=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function radarGeometry(scores,compact=false){
 if(scores.length!==8||scores.some(c=>!Number.isFinite(c.percent)||c.percent<0||c.percent>100))throw new RangeError('Нужны восемь компетенций с оценкой от 0 до 100');
 const cx=compact?200:440,cy=compact?205:315,radius=compact?100:214;
 const point=(i,fraction)=>{const angle=i*Math.PI/4-Math.PI/2;return {x:Number((cx+radius*fraction*Math.cos(angle)).toFixed(2)),y:Number((cy+radius*fraction*Math.sin(angle)).toFixed(2))};};
 const points=scores.map((c,i)=>({...point(i,c.percent/100),id:c.id}));
 const serialize=items=>items.map(p=>`${p.x},${p.y}`).join(' ');
 return {cx,cy,axes:scores.map((_,i)=>point(i,1)),rings:[.2,.4,.6,.8,1].map(f=>serialize(scores.map((_,i)=>point(i,f)))),points,polygon:serialize(points)};
}
function radar(scores,compact){
 const g=radarGeometry(scores,compact);
 const labels=compact?[
  {x:200,y:65,anchor:'middle'}, {x:280,y:125,anchor:'start'}, {x:315,y:209,anchor:'start'}, {x:280,y:289,anchor:'start'},
  {x:200,y:335,anchor:'middle'}, {x:120,y:293,anchor:'end'}, {x:85,y:209,anchor:'end'}, {x:120,y:116,anchor:'end',lines:['Эффект','от ИИ']}
 ]:[
  {x:440,y:65,anchor:'middle'}, {x:610,y:143,anchor:'start'}, {x:675,y:320,anchor:'start'}, {x:610,y:487,anchor:'start'},
  {x:440,y:561,anchor:'middle'}, {x:270,y:493,anchor:'end'}, {x:205,y:320,anchor:'end'}, {x:270,y:132,anchor:'end'}
 ];
 return `<svg class="competency-radar ${compact?'radar-compact':'radar-wide'}" viewBox="${compact?'0 0 400 400':'0 0 880 620'}" role="img" aria-label="Профиль знаний: ${safe(scores.map(c=>c.title+' — '+c.percent+'%').join('; '))}"><g class="radar-grid">${g.rings.map(points=>`<polygon points="${points}"/>`).join('')}${g.axes.map(p=>`<line x1="${g.cx}" y1="${g.cy}" x2="${p.x}" y2="${p.y}"/>`).join('')}</g><polygon class="radar-value" points="${g.polygon}"/>${scores.map((c,i)=>`<circle class="radar-point" data-competency="${c.id}" cx="${g.points[i].x}" cy="${g.points[i].y}" r="3" tabindex="0" role="img" aria-label="${safe(c.title)}: ${c.score} из ${c.max} ответов, ${c.percent}%"><title>${safe(c.title)}: ${c.score} из ${c.max} · ${c.percent}%</title></circle>`).join('')}<g class="radar-labels">${scores.map((c,i)=>{const label=labels[i];return `<text x="${label.x}" y="${label.y}" text-anchor="${label.anchor}">${(label.lines||c.label).map((line,j)=>`<tspan x="${label.x}" dy="${j?compact?14:19:0}">${safe(line)}</tspan>`).join('')}</text>`;}).join('')}</g></svg>`;
}
export function renderAssessmentResult(result){
 return `<div class="checkup-result"><h2 id="checkup-title" class="visually-hidden">Ваш уровень: ${safe(result.level)}</h2><div class="result-banner"><p>${safe(result.message)}</p></div><ol class="level-scale" aria-label="Уровень знаний: ${safe(result.level)}">${assessmentLevels.map((level,i)=>`<li class="level-step ${i===result.levelIndex?'is-current':''}" style="--level-color:${level.color}" ${i===result.levelIndex?'aria-current="step"':''}><span>${safe(level.title)}</span><svg viewBox="0 0 20 14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m4 4 6 6 6-6"/></svg><b></b></li>`).join('')}</ol><div class="result-total"><span class="result-total-score">${result.total}</span> из 100 баллов<span> · ${result.correct} из ${result.questionCount} ответов верно</span></div><figure class="radar-figure">${radar(result.competencies,false)}${radar(result.competencies,true)}<figcaption class="visually-hidden">Расстояние от центра показывает долю верных ответов в компетенции. Внешний контур — 100%.</figcaption></figure><details class="result-breakdown"><summary>Баллы по компетенциям</summary><dl>${result.competencies.map(c=>`<div><dt>${safe(c.title)}</dt><dd><strong>${c.score} / ${c.max}</strong><span>${c.percent}%</span><p>${safe(c.description)}</p></dd></div>`).join('')}</dl></details><div class="result-controls"><p>Результат и рекомендации сохранены в этом браузере.</p><button class="outline-button" data-checkup="restart">Пройти заново</button></div></div>`;
}
