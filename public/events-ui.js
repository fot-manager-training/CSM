import {events,filterEvents,calendarText} from './data.js';
import {eventImages} from './media.js';
import {EventCarousel} from './carousel.js?v=pages-20261106';
const $=id=>document.getElementById(id);
let iconize=()=>{},notify=()=>{},carousel;
let saved=[];
try { const value=JSON.parse(localStorage.getItem('dtaas-favorites')||'[]'); if(Array.isArray(value)) saved=value.filter(id=>events.some(e=>e.id===id)); } catch {}
const state={category:'all',query:'',region:'all',month:'all',savedOnly:false,saved};
let layout='grid',calendarMonth=11,currentEvent=null;
function poster(e,dialog=false){return `<div class="${dialog?'dialog-poster':'event-poster'}" ${dialog?'':`data-open="${e.id}"`}><img class="event-cover" src="${eventImages[e.id]}" alt="Иллюстрация: ${e.title}" width="1536" height="1024" ${dialog?'':'loading="lazy"'}><span class="poster-badge">${e.type}</span>${dialog?'':`<button class="favorite ${saved.includes(e.id)?'is-saved':''}" data-save="${e.id}" aria-label="${saved.includes(e.id)?'Убрать из избранного':'Добавить в избранное'}: ${e.title}" aria-pressed="${saved.includes(e.id)}">${saved.includes(e.id)?'♥':'♡'}</button>`}</div>`;}
function card(e,i){return `<article class="event-card" style="animation-delay:${i*45}ms">${poster(e)}<div class="event-info"><div class="event-meta"><span class="date">${e.date}</span><span class="meta-dot"></span><span>${e.city||'Место уточняется'}</span></div><h3 class="event-title"><button data-open="${e.id}">${e.title}</button></h3><p class="event-summary">${e.summary}</p><div class="event-bottom"><span>${e.type}</span><button data-open="${e.id}">Подробнее <span>↗</span></button></div></div></article>`;}
function render(){
 const list=filterEvents(events,state).sort((a,b)=>a.start.localeCompare(b.start));
 carousel?.setItems(list);
 $('events-grid').innerHTML=list.map(card).join('');
 $('events-grid').dataset.count=list.length;
 $('events-grid').hidden=layout!=='grid'; $('calendar').hidden=layout!=='calendar';
 $('empty-events').hidden=list.length>0||layout==='calendar';
 const n=list.length; const noun=n===1?'событие':n>=2&&n<=4?'события':'событий';
 $('results-count').textContent=`${n} ${noun}${state.savedOnly?' в избранном':' для новых возможностей'}`;
 $('section-title').textContent=state.savedOnly?'Мои события':'Все мероприятия';document.querySelector('.section-count').textContent=`${n} ${noun}`;
 $('saved-count').textContent=saved.length;
 $('saved-button').classList.toggle('active',state.savedOnly);
 $('saved-button').setAttribute('aria-pressed',String(state.savedOnly));
 document.querySelectorAll('[data-category]').forEach(b=>{b.classList.toggle('active',b.dataset.category===state.category);b.setAttribute('aria-pressed',String(b.dataset.category===state.category));});
 if(layout==='calendar') renderCalendar(list);iconize();
}
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

export function initEvents(callbacks){
iconize=callbacks.iconize;notify=callbacks.notify;
carousel=new EventCarousel({stage:$('circle-stage'),caption:$('circle-caption'),counter:$('circle-position'),motion:$('circle-motion')});
function reset(){Object.assign(state,{category:'all',query:'',region:'all',month:'all',savedOnly:false});$('search').value='';$('region').value='all';$('month').value='all';render();}
document.addEventListener('click',e=>{const saveButton=e.target.closest('[data-save]');if(saveButton){save(saveButton.dataset.save);return;}const open=e.target.closest('[data-open]');if(open)openEvent(open.dataset.open);});
document.querySelectorAll('[data-category]').forEach(b=>b.onclick=()=>{state.category=b.dataset.category;render();});
$('search').oninput=e=>{state.query=e.target.value;render();};$('region').onchange=e=>{state.region=e.target.value;render();};$('month').onchange=e=>{state.month=e.target.value;if(state.month!=='all')calendarMonth=Number(state.month);render();};
$('reset').onclick=reset;$('empty-reset').onclick=reset;
$('saved-button').onclick=()=>{state.savedOnly=!state.savedOnly;$('content').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});render();};
function setLayout(value){layout=value;$('grid-view').classList.toggle('active',value==='grid');$('calendar-view').classList.toggle('active',value==='calendar');$('grid-view').setAttribute('aria-pressed',String(value==='grid'));$('calendar-view').setAttribute('aria-pressed',String(value==='calendar'));render();}
$('grid-view').onclick=()=>setLayout('grid');$('calendar-view').onclick=()=>setLayout('calendar');
function finishEventClose(){if($('event-dialog').open)return;const closed=currentEvent;currentEvent=null;if(closed&&location.hash===`#event/${closed}`)history.replaceState(null,'',location.pathname+location.search);}
function closeEvent(){ $('event-dialog').close();finishEventClose();}
$('event-dialog').addEventListener('cancel',event=>{event.preventDefault();closeEvent();});
$('dialog-close').onclick=closeEvent;$('event-dialog').addEventListener('click',e=>{if(e.target===$('event-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeEvent();}});
$('event-dialog').addEventListener('close',finishEventClose);

window.addEventListener('storage',event=>{if(event.key==='dtaas-favorites'){try{const value=JSON.parse(event.newValue||'[]');saved=Array.isArray(value)?value.filter(id=>events.some(x=>x.id===id)):[];state.saved=saved;render();updateDialogSave();}catch{}}});
if(new URLSearchParams(location.search).get('saved')==='1')state.savedOnly=true;
render();
}
export function routeEvent(){const id=location.hash.startsWith('#event/')?location.hash.slice(7):null;if(id)openEvent(id);else if($('event-dialog').open)$('event-dialog').close();}
