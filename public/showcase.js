import {cases,partners} from './content.js';
import {eventImages} from './media.js';
const $=id=>document.getElementById(id);
const safe=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let iconize=()=>{},railItems=[],railIndex=0;
let activeCase='case-01',caseCategory='all';
const curatedIds=['case-01','case-02','case-08','case-16','case-18','case-23'];
const preferredNames=['РАМАКС','Бындюсофт','ДИДЖИТАЛ ДИЗАЙН','ТЭСОНЭРО','СОЛВО','КОРУС','ВЕЙВАКСЕСС','LAND PRO'];
export function initShowcases(callbacks={}){
 iconize=callbacks.iconize||iconize;
 $('circle-prev').onclick=()=>{if(railItems.length){railIndex=(railIndex-1+railItems.length)%railItems.length;drawRail();}};
 $('circle-next').onclick=()=>{if(railItems.length){railIndex=(railIndex+1)%railItems.length;drawRail();}};
 const categories=['all',...new Set(cases.map(c=>c.category))];
 $('practice-tabs').innerHTML=categories.map(c=>`<button data-practice-category="${safe(c)}" aria-pressed="${c==='all'}">${c==='all'?'Все проекты':safe(c)}</button>`).join('');
 $('practice-tabs').addEventListener('click',event=>{const button=event.target.closest('[data-practice-category]');if(!button)return;caseCategory=button.dataset.practiceCategory;const list=previewCases();activeCase=list[0]?.id;renderAccordion();for(const item of $('practice-tabs').querySelectorAll('button'))item.setAttribute('aria-pressed',String(item===button));});
 $('practice-accordion').addEventListener('click',event=>{const button=event.target.closest('[data-expand-case]');if(!button)return;activeCase=button.dataset.expandCase;updateAccordion();});
 $('practice-accordion').addEventListener('keydown',event=>{const button=event.target.closest('[data-expand-case]');if(!button||!['ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;const buttons=[...$('practice-accordion').querySelectorAll('[data-expand-case]')];let next=buttons.indexOf(button);if(event.key==='ArrowRight')next=(next+1)%buttons.length;if(event.key==='ArrowLeft')next=(next-1+buttons.length)%buttons.length;if(event.key==='Home')next=0;if(event.key==='End')next=buttons.length-1;event.preventDefault();activeCase=buttons[next].dataset.expandCase;updateAccordion();buttons[next].focus();});
 renderAccordion();
 const featuredPartners=preferredNames.map(name=>partners.find(p=>p.name.includes(name))).filter(Boolean);
 $('partner-strip').innerHTML=featuredPartners.map((p,index)=>`<a class="partner-profile profile-${index%4}" href="#partner/${p.id}" aria-label="Компетенции: ${safe(p.name)}"><h3>${safe(p.name)}</h3><div class="profile-avatar" aria-hidden="true"><span>${safe(p.initials.replace(/[“«"']/g,''))}</span><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" stroke-width=".7"/><ellipse cx="60" cy="60" rx="30" ry="52" fill="none" stroke="currentColor" stroke-width=".7" transform="rotate(30 60 60)"/></svg></div><p>${safe(p.role)}</p><div class="profile-footer"><span>${p.accreditation==='Аккредитован'?'Аккредитован':'Компетенции'}</span><b>↗</b></div></a>`).join('');
 const track=$('partner-strip');
 function updateTrack(){const max=track.scrollWidth-track.clientWidth;$('partner-strip-prev').disabled=track.scrollLeft<=2;$('partner-strip-next').disabled=track.scrollLeft>=max-2;}
 for(const [id,direction] of [['partner-strip-prev',-1],['partner-strip-next',1]])$(id).onclick=()=>{const width=track.firstElementChild?.getBoundingClientRect().width||240;track.scrollBy({left:direction*(width+16),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});};
 track.addEventListener('scroll',updateTrack,{passive:true});new ResizeObserver(updateTrack).observe(track);updateTrack();
 iconize($('partner-strip'));
}
function previewCases(){if(caseCategory==='all')return curatedIds.map(id=>cases.find(c=>c.id===id)).filter(Boolean);return cases.filter(c=>c.category===caseCategory).slice(0,6);}
function renderAccordion(){
 const list=previewCases();if(!list.some(c=>c.id===activeCase))activeCase=list[0]?.id;
 $('practice-accordion').innerHTML=list.map((c,index)=>`<article class="accordion-item accordion-tone-${index%6} ${c.id===activeCase?'is-expanded':''}" data-case-panel="${c.id}"><button class="accordion-trigger" id="case-trigger-${c.id}" data-expand-case="${c.id}" aria-expanded="${c.id===activeCase}" aria-controls="practice-body-${c.id}"><span>${safe(c.client)}</span><b>${String(index+1).padStart(2,'0')}</b></button><div class="accordion-body" id="practice-body-${c.id}" aria-labelledby="case-trigger-${c.id}" ${c.id===activeCase?'':'hidden'}><svg class="accordion-scribble" viewBox="0 0 400 300" fill="none" aria-hidden="true"><path d="M300-10C20-40 350 300 140 260S500 120 230 80 80 400 410 220" stroke="currentColor" stroke-width="8"/></svg><img class="accordion-image" src="${eventImages[c.category==='Финансы'?'royal':'aij']}" alt="" aria-hidden="true" width="1536" height="1024" loading="lazy"><div class="accordion-copy"><span>${safe(c.category)}</span><h3>${safe(c.title)}</h3><p>${safe(c.description)}</p><div class="accordion-metric"><small>${safe(c.metricKind)}</small><strong>${safe(c.metricValue)}</strong><span>${safe(c.metricDescription)}</span></div><a href="#case/${c.id}">Разобрать кейс <span>↗</span></a></div></div></article>`).join('');
 const total=caseCategory==='all'?cases.length:cases.filter(c=>c.category===caseCategory).length;$('practice-count').textContent=`${list.length} из ${total} проектов · полная подборка в кейсбуке`;
 iconize($('practice-accordion'));
}
function updateAccordion(){
 for(const card of $('practice-accordion').querySelectorAll('[data-case-panel]')){const expanded=card.dataset.casePanel===activeCase;card.classList.toggle('is-expanded',expanded);card.querySelector('button').setAttribute('aria-expanded',String(expanded));card.querySelector('.accordion-body').hidden=!expanded;}
}
export function renderEventRail(items){railItems=items;if(railIndex>=items.length)railIndex=0;drawRail();}
function drawRail(){
 const length=railItems.length;
 $('circle-stage').innerHTML=railItems.map((e,i)=>{let slot=(i-railIndex+length)%length;if(slot>length/2)slot-=length;const distance=Math.abs(slot);return `<button class="circle-cover ${i===railIndex?'is-current':''}" style="--slot:${slot};--cover-scale:${1/(1+distance*.25)};--cover-layer:${10-distance}" data-open="${e.id}" aria-label="${safe(e.title)}, ${safe(e.date)}"><img src="${eventImages[e.id]}" alt="Иллюстрация: ${safe(e.city||e.title)}" width="1536" height="1024" loading="lazy"></button>`;}).join('');
 $('circle-position').textContent=length?`${railIndex+1} / ${length}`:'0 / 0';$('circle-prev').disabled=length<2;$('circle-next').disabled=length<2;
 const current=railItems[railIndex];$('circle-caption').innerHTML=current?`<span>${safe(current.date)}</span><strong>${safe(current.title)}</strong>`:'Попробуйте другой формат или сбросьте фильтры.';
}
