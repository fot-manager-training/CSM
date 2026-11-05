import {events, filterEvents, calendarText} from './data.js?v=cat3d-20261105';
import {initCatalog,openCatalogRoute} from './catalog.js?v=cat3d-20261105';
import './motion.js?v=cat3d-20261105';
import {eventImages} from './media.js?v=cat3d-20261105';
import {initShowcases,renderEventRail} from './showcase.js?v=cat3d-20261105';
const $ = id => document.getElementById(id);
let saved=[];
try { const value=JSON.parse(localStorage.getItem('dtaas-favorites')||'[]'); if(Array.isArray(value)) saved=value.filter(id=>events.some(e=>e.id===id)); } catch {}
const state={category:'all',query:'',region:'all',month:'all',savedOnly:false,saved};
let layout='grid', calendarMonth=11, currentEvent=null, toastTimer;
const labels={events:['АФИША СЕВЕРО-ЗАПАДА','Ближайшие события','Цифровые дни, большие идеи и новые знакомства.'],cases:['ОТ ИДЕИ К РЕАЛЬНОМУ РЕЗУЛЬТАТУ','Кейсбук решений','Практики цифровой трансформации Северо-Запада.'],partners:['СИЛЬНЕЕ ВМЕСТЕ','Партнёры платформы','Новые связи для развития бизнеса и технологий.']};
function poster(e,dialog=false){return `<div class="${dialog?'dialog-poster':'event-poster'}" ${dialog?'':`data-open="${e.id}"`}><img class="event-cover" src="${eventImages[e.id]}" alt="Иллюстрация: ${e.title}" width="1536" height="1024" ${dialog?'':'loading="lazy"'}><span class="poster-badge">${e.type}</span>${dialog?'':`<button class="favorite ${saved.includes(e.id)?'is-saved':''}" data-save="${e.id}" aria-label="${saved.includes(e.id)?'Убрать из избранного':'Добавить в избранное'}: ${e.title}" aria-pressed="${saved.includes(e.id)}">${saved.includes(e.id)?'♥':'♡'}</button>`}</div>`;}
function card(e,i){return `<article class="event-card" style="animation-delay:${i*45}ms">${poster(e)}<div class="event-info"><div class="event-meta"><span class="date">${e.date}</span><span class="meta-dot"></span><span>${e.city||'Место уточняется'}</span></div><h3 class="event-title"><button data-open="${e.id}">${e.title}</button></h3><p class="event-summary">${e.summary}</p><div class="event-bottom"><span>${e.type}</span><button data-open="${e.id}">Подробнее <span>↗</span></button></div></div></article>`;}
function iconize(root=document.body){
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())if(walker.currentNode.textContent.includes('↗'))nodes.push(walker.currentNode);
 for(const node of nodes){const fragment=document.createDocumentFragment();const parts=node.textContent.split('↗');parts.forEach((part,i)=>{fragment.append(document.createTextNode(part));if(i<parts.length-1){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('class','arrow-icon');svg.setAttribute('aria-hidden','true');const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d','M5 19 19 5M5 5h14v14');path.setAttribute('fill','none');path.setAttribute('stroke','currentColor');path.setAttribute('stroke-width','1.6');svg.append(path);fragment.append(svg);}});node.replaceWith(fragment);}
}
function render(){
 const list=filterEvents(events,state);
 renderEventRail(list);
 $('events-grid').innerHTML=list.map(card).join('');
 $('events-grid').dataset.count=list.length;
 $('events-grid').hidden=layout!=='grid'; $('calendar').hidden=layout!=='calendar';
 $('empty-events').hidden=list.length>0||layout==='calendar';
 const n=list.length; const noun=n===1?'событие':n>=2&&n<=4?'события':'событий';
 $('results-count').textContent=`${n} ${noun}${state.savedOnly?' в избранном':' для новых возможностей'}`;
 $('saved-count').textContent=saved.length;
 $('saved-button').classList.toggle('active',state.savedOnly);
 $('saved-button').setAttribute('aria-pressed',String(state.savedOnly));
 document.querySelectorAll('[data-category]').forEach(b=>{b.classList.toggle('active',b.dataset.category===state.category);b.setAttribute('aria-pressed',String(b.dataset.category===state.category));});
 if(layout==='calendar') renderCalendar(list);iconize();
}
function notify(text){$('toast').textContent=text;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3200);}
function save(id){
 const removing=saved.includes(id);saved=removing?saved.filter(x=>x!==id):[...saved,id];state.saved=saved;
 try{localStorage.setItem('dtaas-favorites',JSON.stringify(saved));}catch{notify('Избранное сохранено только на время этого сеанса');render();return;}
 render();notify(removing?'Событие убрано из избранного':'Событие добавлено в избранное');
 if(currentEvent===id&&$('event-dialog').open) updateDialogSave();
}
function updateDialogSave(){const b=$('dialog-save');if(b){b.textContent=saved.includes(currentEvent)?'♥ В избранном':'♡ Сохранить';b.setAttribute('aria-pressed',String(saved.includes(currentEvent)));}}
function openEvent(id){const e=events.find(x=>x.id===id);if(!e)return;currentEvent=id;
 $('dialog-body').innerHTML=`${poster(e,true)}<div class="dialog-content"><div class="eyebrow">${e.type.toUpperCase()} · СЕЗОН 2026</div><h2 id="dialog-title">${e.title}</h2><p class="dialog-description">${e.description}</p><dl class="detail-list"><div><dt>ДАТА</dt><dd>${e.date} 2026</dd></div><div><dt>РЕГИОН</dt><dd>${e.city||'Уточняется'}</dd></div><div><dt>ВРЕМЯ</dt><dd>Уточняется</dd></div><div><dt>ПЛОЩАДКА</dt><dd>Будет объявлена</dd></div></dl><p class="dialog-notice">Программа и ссылка на регистрацию пока не предоставлены. Сохраните событие в избранное или добавьте дату в свой календарь.</p><div class="dialog-actions"><button class="primary-button" id="download-calendar">▦ Добавить в календарь</button><button class="outline-button" id="dialog-save"></button><button class="outline-button" id="share-event">Поделиться ↗</button></div><p class="ics-note">Файл .ics добавит событие на весь день. Точное время не указано. Даты отнесены к сезону 2026.</p></div>`;
 updateDialogSave(); iconize($('dialog-body')); if(!$('event-dialog').open)$('event-dialog').showModal();
 $('dialog-save').onclick=()=>save(id);
 $('download-calendar').onclick=()=>{const blob=new Blob([calendarText(e)],{type:'text/calendar;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`dtaas-${e.id}-2026.ics`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Файл календаря подготовлен');};
 $('share-event').onclick=async()=>{const url=new URL(location.href);url.hash=`event/${id}`;try{await navigator.clipboard.writeText(url.href);notify('Ссылка на событие скопирована');}catch{const shareInput=document.createElement('input');shareInput.value=url.href;shareInput.readOnly=true;shareInput.setAttribute('aria-label','Ссылка на событие');shareInput.style.cssText='width:100%;margin-top:16px;padding:10px;border:1px solid #cbd8c0;border-radius:5px';$('dialog-body').querySelector('.dialog-content').append(shareInput);shareInput.select();notify('Скопируйте ссылку из поля');}};
}
function renderCalendar(list){
 const first=new Date(2026,calendarMonth-1,1);const offset=(first.getDay()+6)%7;const days=new Date(2026,calendarMonth,0).getDate();
 const name=new Intl.DateTimeFormat('ru',{month:'long'}).format(first);const now=new Date();
 const cells=Array.from({length:Math.ceil((offset+days)/7)*7},(_,i)=>{const day=i-offset+1;if(day<1||day>days)return '<div class="calendar-day is-blank"></div>';const date=`2026-${String(calendarMonth).padStart(2,'0')}-${String(day).padStart(2,'0')}`;const today=now.getFullYear()===2026&&now.getMonth()===calendarMonth-1&&now.getDate()===day;return `<div class="calendar-day ${today?'today':''}"><span>${day}</span>${list.filter(e=>date>=e.start&&date<=e.end).map(e=>`<button class="calendar-event" data-open="${e.id}">${e.title}</button>`).join('')}</div>`;}).join('');
 $('calendar').innerHTML=`<div class="calendar-heading"><button id="prev-month" aria-label="Предыдущий месяц" ${calendarMonth===11?'disabled':''}>←</button><h3>${name[0].toUpperCase()+name.slice(1)} 2026</h3><button id="next-month" aria-label="Следующий месяц" ${calendarMonth===12?'disabled':''}>→</button></div><div class="calendar-week">${['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'].map(x=>`<span>${x}</span>`).join('')}</div><div class="calendar-days">${cells}</div>`;
 $('prev-month').onclick=()=>{calendarMonth=11;render();};$('next-month').onclick=()=>{calendarMonth=12;render();};
}
function route(){
 const hash=location.hash.slice(1);const eventId=hash.startsWith('event/')?hash.slice(6):null;const page=hash.startsWith('case/')?'cases':hash.startsWith('partner/')?'partners':labels[hash]?hash:'events';
 document.body.dataset.page=page;
 $('connection-title').textContent=page==='cases'?'Найдите команду для вашей задачи.':'Найдите решение для своего бизнеса.';
 $('connection-text').textContent=page==='cases'?'68 вендоров и интеграторов с технологической экспертизой.':'20 проектов — от ИИ-агентов до автоматизации производства.';
 $('connection-link').href=page==='cases'?'#partners':'#cases';
 $('connection-link').innerHTML=(page==='cases'?'Подобрать партнёра':'Смотреть кейсы')+' <span>↗</span>';
 iconize($('connection-link'));
 ['events','cases','partners'].forEach(x=>$(x+'-view').hidden=x!==page);
 document.querySelectorAll('[data-page]').forEach(x=>{x.classList.toggle('active',x.dataset.page===page);if(x.dataset.page===page)x.setAttribute('aria-current','page');else x.removeAttribute('aria-current');});
 const [eyebrow,title,description]=labels[page];$('section-eyebrow').textContent=eyebrow;$('section-title').innerHTML=`${title}<span class="title-dot">.</span>`;$('section-description').textContent=description;$('year-label').hidden=page!=='events';
 if(eventId)openEvent(eventId);else if($('event-dialog').open)$('event-dialog').close();
 openCatalogRoute(hash);
 if(hash&& !eventId&&!hash.startsWith('case/')&&!hash.startsWith('partner/'))requestAnimationFrame(()=>$('content').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}));
}
function reset(){Object.assign(state,{category:'all',query:'',region:'all',month:'all',savedOnly:false});$('search').value='';$('region').value='all';$('month').value='all';render();}
document.addEventListener('click',e=>{const saveButton=e.target.closest('[data-save]');if(saveButton){save(saveButton.dataset.save);return;}const open=e.target.closest('[data-open]');if(open)openEvent(open.dataset.open);});
document.querySelectorAll('[data-category]').forEach(b=>b.onclick=()=>{state.category=b.dataset.category;render();});
$('search').oninput=e=>{state.query=e.target.value;render();};$('region').onchange=e=>{state.region=e.target.value;render();};$('month').onchange=e=>{state.month=e.target.value;if(state.month!=='all')calendarMonth=Number(state.month);render();};
$('reset').onclick=reset;$('empty-reset').onclick=reset;
$('saved-button').onclick=()=>{state.savedOnly=!state.savedOnly;if(location.hash!=='#events')location.hash='events';else $('content').scrollIntoView({behavior:'smooth'});render();};
function setLayout(value){layout=value;$('grid-view').classList.toggle('active',value==='grid');$('calendar-view').classList.toggle('active',value==='calendar');$('grid-view').setAttribute('aria-pressed',String(value==='grid'));$('calendar-view').setAttribute('aria-pressed',String(value==='calendar'));render();}
$('grid-view').onclick=()=>setLayout('grid');$('calendar-view').onclick=()=>setLayout('calendar');
$('dialog-close').onclick=()=>$('event-dialog').close();$('event-dialog').addEventListener('click',e=>{if(e.target===$('event-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
$('event-dialog').addEventListener('close',()=>{currentEvent=null;if(location.hash.startsWith('#event/'))history.replaceState(null,'','#events');});
window.addEventListener('hashchange',route);window.addEventListener('storage',e=>{if(e.key==='dtaas-favorites'){try{const value=JSON.parse(e.newValue||'[]');saved=Array.isArray(value)?value.filter(id=>events.some(x=>x.id===id)):[];state.saved=saved;render();updateDialogSave();}catch{}}});
initCatalog({notify,iconize});initShowcases({iconize});render();route();

// Build the local 3D mascot after the catalogs have become interactive.
const loadMascot=()=>import('./cybercat.js?v=cat3d-20261105').then(({initCybercat})=>initCybercat()).catch(()=>{});
if('requestIdleCallback' in window)requestIdleCallback(loadMascot,{timeout:1200});else setTimeout(loadMascot,0);
