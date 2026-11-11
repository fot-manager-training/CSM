const interactions=new WeakMap();
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
export function animateCheckup(view,stage){
 if(reduced())return;
 view.animate([{opacity:.35},{opacity:1}],{duration:220,easing:'ease-out'});
 if(stage==='question')view.querySelectorAll('.question-option').forEach((option,i)=>option.animate([{opacity:0,transform:'translateX(5px)'},{opacity:1,transform:'translateX(0)'}],{duration:220,delay:i*35,fill:'both',easing:'ease-out'}));
 if(stage==='result')view.querySelectorAll('.competency-radar').forEach(svg=>{
  const polygon=svg.querySelector('.radar-value'),points=polygon.getAttribute('points'),center=svg.classList.contains('radar-compact')?'200,205':'440,315';
  const animation=document.createElementNS('http://www.w3.org/2000/svg','animate');
  for(const [name,value] of Object.entries({attributeName:'points',from:Array(8).fill(center).join(' '),to:points,dur:'0.65s',fill:'freeze','data-checkup-motion':'true'}))animation.setAttribute(name,value);
  polygon.append(animation);animation.beginElement();
 });
}
export function initResultInteractions(view,result){
 interactions.get(view)?.abort();const controller=new AbortController();interactions.set(view,controller);
 const select=point=>{
  const competency=result.competencies.find(c=>c.id===point.dataset.competency);if(!competency)return;
  for(const node of view.querySelectorAll('.radar-point')){const active=node.dataset.competency===competency.id;node.classList.toggle('is-active',active);node.setAttribute('aria-pressed',String(active));}
  for(const row of view.querySelectorAll('[data-competency-row]'))row.classList.toggle('is-active',row.dataset.competencyRow===competency.id);
  const insight=view.querySelector('.radar-insight');insight.style.setProperty('--competency',competency.color);insight.textContent=`${competency.title}: ${competency.score} из ${competency.max} · ${competency.percent}%. ${competency.description}`;
 };
 for(const type of ['pointerover','focusin','click'])view.addEventListener(type,event=>{const point=event.target.closest('.radar-point');if(point)select(point);},{signal:controller.signal});
 view.addEventListener('keydown',event=>{const point=event.target.closest('.radar-point');if(point&&['Enter',' '].includes(event.key)){event.preventDefault();select(point);}},{signal:controller.signal});
}
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',event=>{if(event.matches)document.querySelectorAll('[data-checkup-motion]').forEach(node=>node.remove());});
