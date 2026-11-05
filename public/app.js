import {events, filterEvents, calendarText} from './data.js';
import {initCatalog,openCatalogRoute} from './catalog.js';
import './motion.js?v=mosaic-20261105';
const $ = id => document.getElementById(id);
let saved=[];
try { const value=JSON.parse(localStorage.getItem('dtaas-favorites')||'[]'); if(Array.isArray(value)) saved=value.filter(id=>events.some(e=>e.id===id)); } catch {}
const state={category:'all',query:'',region:'all',month:'all',savedOnly:false,saved};
let layout='grid', calendarMonth=11, currentEvent=null, toastTimer;
const labels={events:['АФИША СЕВЕРО-ЗАПАДА','Ближайшие события','Цифровые дни, большие идеи и новые знакомства.'],cases:['ОТ ИДЕИ К РЕАЛЬНОМУ РЕЗУЛЬТАТУ','Кейсбук решений','Практики цифровой трансформации Северо-Запада.'],partners:['СИЛЬНЕЕ ВМЕСТЕ','Партнёры платформы','Новые связи для развития бизнеса и технологий.']};
function graphic(e){
 const id=e.id;
 const colors={city:['#ffbb97','#cc714d'],north:['#f1f8ff','#7e9fca'],region:['#b8d99d','#68865c'],accelerator:['#ffddc2','#df744a'],ai:['#e4ceff','#a58ad4']}[e.art];
 const defs=`<defs><linearGradient id="g-${id}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${colors[0]}"/><stop offset="1" stop-color="${colors[1]}"/></linearGradient><pattern id="p-${id}" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" fill="none" stroke="currentColor" opacity=".08"/></pattern></defs>`;
 let art='';
 if(e.art==='city') art=`<circle cx="295" cy="80" r="106" fill="#b195d1" opacity=".12"/><g fill="url(#g-${id})"><path d="M155 245v-80h20v-30l12-16 12 16v30h19v80zm67 0V132h24v-13h16v13h23v113zm66 0V94h18V58l8-26 8 26v36h18v151z"/><path d="m135 199 29-20 28 20v45h-57zm54 7 32-22 32 22v38h-64z"/><path d="M340 245V148h17v-14h20v14h14v97z"/></g><g stroke="#955a46" stroke-width="3" opacity=".55"><path d="M236 150v70m12-70v70m-62-58v56m122-99v110m14-110v110"/></g><path d="M0 243q100-26 200 0t200 0" stroke="#abc592" opacity=".4" fill="none"/>`;
 if(e.art==='north') art=`<path d="M130 8q120 55 250-20L355 84Q233 12 160 85Z" fill="#a9cdb5" opacity=".55"/><path d="M185 10q50 80 200 60" fill="none" stroke="#f5ffff" stroke-width="12" opacity=".45"/><g fill="url(#g-${id})"><path d="m96 240 89-99 54 58 36-54 123 98z"/><path d="m204 244 79-143 119 143z"/></g><path d="m264 133 19-32 39 47-28-10-11 10-8-18z" fill="#eff8fc"/><path d="m155 176 30-35 29 32-18-6-9 9-12-7z" fill="#f3faff"/><path d="M229 247V192h18v-11h35v66zm64 0v-63h15v-16h22v79zm42 0v-49h20v49z" fill="#517589" opacity=".8"/><path d="M0 246q110-20 210-3t190-10v48H0" fill="#98b7c7" opacity=".5"/>`;
 if(e.art==='region') art=`<circle cx="316" cy="65" r="58" fill="#f7f3c8"/><path d="M0 219q118-100 226-22t174-18v101H0" fill="#b2c398"/><path d="M130 240q110-80 270-26v66H130" fill="#849f70"/><g fill="#587c59"><path d="m271 210 19-96 19 96zm32 10 26-143 27 143zm-61 1 14-69 14 69zm110 9 19-102 21 102z"/></g><path d="M195 254v-66h16v-20h8v20h16v66zm-12 0v-41h61v41" fill="#e0d6af"/><path d="m204 167 11-24 11 24z" fill="#667455"/><path d="M291 280q-35-48 17-70" fill="none" stroke="#c1d2b5" stroke-width="14"/>`;
 if(e.art==='accelerator') art=`<g transform="translate(284 144) rotate(-22)"><path d="m0-88 83 45v91L0 94l-83-46v-91z" fill="none" stroke="#ac6c4e" stroke-width="2"/><path d="m0-65 62 33v66L0 68l-62-34v-66z" fill="none" stroke="#e18a60" stroke-width="12"/><path d="m0-42 40 21v43L0 44l-40-22v-43z" fill="none" stroke="#704636" stroke-width="3"/><path d="M0-88V94M-83-43 83 48M83-43-83 48" stroke="#ac6c4e" opacity=".3"/></g><circle cx="284" cy="145" r="115" stroke="#cb714e" fill="none" opacity=".1"/>`;
 if(e.art==='ai') art=`<g transform="translate(285 125) rotate(-30)" fill="none">${[0,1,2,3,4,5,6,7].map((n)=>`<ellipse rx="${40+n*7}" ry="${93-n*5}" transform="rotate(${n*23})" stroke="${n%2?'#c2a4ff':'#8d68da'}" stroke-width="2" opacity=".8"/>`).join('')}</g><circle cx="287" cy="125" r="22" fill="url(#g-${id})"/><path d="M0 260 400 195M40 280 400 215" stroke="#9c78db" opacity=".18"/>`;
 return `<svg class="poster-graphic" viewBox="0 0 400 280" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${defs}<rect width="400" height="280" fill="url(#p-${id})"/>${art}</svg>`;
}
function poster(e,dialog=false){return `<div class="${dialog?'dialog-poster':'event-poster'}" style="--poster-bg:${e.background};--poster-text:${e.color}" ${dialog?'':`data-open="${e.id}"`} >${graphic(e)}<div class="poster-heading"><small>DTaaS / ${e.date.toUpperCase()}</small>${e.posterTitle}</div><span class="poster-city">${e.city||'Технологии. Идеи. Будущее.'}</span><span class="poster-badge">${e.type.toUpperCase()}</span>${dialog?'':`<button class="favorite ${saved.includes(e.id)?'is-saved':''}" data-save="${e.id}" aria-label="${saved.includes(e.id)?'Убрать из избранного':'Добавить в избранное'}: ${e.title}" aria-pressed="${saved.includes(e.id)}">${saved.includes(e.id)?'♥':'♡'}</button>`}</div>`;}
function card(e,i){return `<article class="event-card" style="animation-delay:${i*45}ms">${poster(e)}<div class="event-info"><div class="event-meta"><span class="date">${e.date}</span><span class="meta-dot"></span><span>${e.city||'Место уточняется'}</span></div><h3 class="event-title"><button data-open="${e.id}">${e.title}</button></h3><p class="event-summary">${e.summary}</p><div class="event-bottom"><span>${e.type}</span><button data-open="${e.id}">Подробнее <span>↗</span></button></div></div></article>`;}
function iconize(root=document.body){
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())if(walker.currentNode.textContent.includes('↗'))nodes.push(walker.currentNode);
 for(const node of nodes){const fragment=document.createDocumentFragment();const parts=node.textContent.split('↗');parts.forEach((part,i)=>{fragment.append(document.createTextNode(part));if(i<parts.length-1){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('class','arrow-icon');svg.setAttribute('aria-hidden','true');const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d','M5 19 19 5M5 5h14v14');path.setAttribute('fill','none');path.setAttribute('stroke','currentColor');path.setAttribute('stroke-width','1.6');svg.append(path);fragment.append(svg);}});node.replaceWith(fragment);}
}
function render(){
 const list=filterEvents(events,state);
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
initCatalog({notify,iconize});render();route();
