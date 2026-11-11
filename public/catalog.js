import {caseImages,partnerImage} from './media.js?v=platform-update-20261111';
import {cases,partners,technologies,partnerRoles,caseIndustries,caseProcesses,caseResults,filterCases,filterPartners} from './catalog-data.js?v=platform-update-20261111';
const $=id=>document.getElementById(id);
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let notify=()=>{},iconize=()=>{},selected=null;
let favorites=[];try{const value=JSON.parse(localStorage.getItem('dtaas-case-favorites')||'[]');if(Array.isArray(value))favorites=value.filter(id=>cases.some(c=>c.id===id));}catch{}
const caseState={query:'',category:'all',industry:'all',process:'all',result:'all',status:'all',savedOnly:false,saved:favorites,limit:20};
const partnerState={query:'',role:'all',technology:'all',accreditation:'all',limit:36};
const searchIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>';
const options=(values,first)=>`<option value="all">${first}</option>`+values.map(v=>`<option>${escape(v)}</option>`).join('');
const tags=values=>`<div class="catalog-tags">${values.map(v=>`<span>${escape(v)}</span>`).join('')}</div>`;
export function initCatalog(callbacks={}){
 notify=callbacks.notify||notify;iconize=callbacks.iconize||iconize;
 if($('cases-view'))$('cases-view').innerHTML=`<div class="catalog-filters"><label class="search-field">${searchIcon}<input id="case-search" type="search" placeholder="Клиент, задача или технология" aria-label="Поиск бизнес-кейсов"></label><label class="select-field"><select id="case-industry" aria-label="Отрасль бизнес-кейса">${options(caseIndustries,'Все отрасли')}</select></label><label class="select-field"><select id="case-process" aria-label="Изменяемый процесс">${options(caseProcesses,'Все процессы')}</select></label><label class="select-field"><select id="case-result" aria-label="Результат или ожидаемый эффект">${options(caseResults,'Все результаты')}</select></label><button class="reset-button" id="case-reset">Сбросить ↺</button></div><div class="results-line"><span id="case-result-count" aria-live="polite"></span><span class="results-note">Целевые, заявленные и пилотные показатели указаны отдельно</span></div><div id="case-grid" class="case-grid"></div><div id="case-empty" class="empty-state" hidden><span>⌕</span><h3>Подходящих кейсов пока нет</h3><p>Измените запрос или сбросьте фильтры.</p><button class="primary-button" id="case-empty-reset">Все бизнес-кейсы ↗</button></div><button class="catalog-more" id="case-more">Показать ещё <span>↓</span></button>`;
 if($('partners-view'))$('partners-view').innerHTML=`<div class="catalog-filters partner-filters"><label class="search-field">${searchIcon}<input id="partner-search" type="search" placeholder="Компания, ИНН, отрасль или технология" aria-label="Поиск партнёров"></label><label class="select-field"><select id="partner-role" aria-label="Тип партнёра">${options(partnerRoles,'Все типы')}</select></label><label class="select-field"><select id="partner-technology" aria-label="Технология или продукт">${options(technologies,'Технологии и продукты')}</select></label><label class="select-field"><select id="partner-accreditation" aria-label="Аккредитация">${options(['Аккредитован','Не уточнено'],'Любая аккредитация')}</select></label><button class="reset-button" id="partner-reset">Сбросить ↺</button></div><div class="results-line"><span id="partner-result-count" aria-live="polite"></span><span class="results-note">Вендоры и интеграторы для цифровой трансформации</span></div><div id="partner-grid" class="partner-grid"></div><div id="partner-empty" class="empty-state" hidden><span>⌕</span><h3>Партнёры не найдены</h3><p>Попробуйте другую технологию или измените условия.</p><button class="primary-button" id="partner-empty-reset">Все партнёры ↗</button></div><button class="catalog-more" id="partner-more">Показать ещё <span>↓</span></button>`;
 const dialog=document.createElement('dialog');dialog.id='catalog-dialog';dialog.setAttribute('aria-labelledby','catalog-dialog-title');dialog.innerHTML='<button class="dialog-close" id="catalog-close" aria-label="Закрыть">×</button><div id="catalog-dialog-body"></div>';document.body.append(dialog);
 function finishClose(){if(dialog.open)return;const closed=selected;selected=null;if(closed&&location.hash.slice(1)===`${closed.kind}/${closed.id}`)history.replaceState(null,'',location.pathname+location.search);}
 function closeCatalog(){dialog.close();finishClose();}
 $('catalog-close').onclick=closeCatalog;dialog.addEventListener('cancel',event=>{event.preventDefault();closeCatalog();});dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeCatalog();}});
 dialog.addEventListener('close',finishClose);
 if($('cases-view')){
 $('case-search').oninput=e=>{caseState.query=e.target.value;caseState.limit=20;renderCases();};
 for(const [field,id] of [['industry','case-industry'],['process','case-process'],['result','case-result']])$(id).onchange=e=>{caseState[field]=e.target.value;caseState.limit=20;renderCases();};
 $('case-more').onclick=()=>{caseState.limit+=20;renderCases();};
 $('case-reset').onclick=resetCases;$('case-empty-reset').onclick=resetCases;
 }
 if($('partners-view')){
 $('partner-search').oninput=e=>{partnerState.query=e.target.value;partnerState.limit=36;renderPartners();};
 for(const [field,id] of [['role','partner-role'],['technology','partner-technology'],['accreditation','partner-accreditation']])$(id).onchange=e=>{partnerState[field]=e.target.value;partnerState.limit=36;renderPartners();};
 $('partner-more').onclick=()=>{partnerState.limit+=24;renderPartners();};$('partner-reset').onclick=resetPartners;$('partner-empty-reset').onclick=resetPartners;
 }
 document.addEventListener('click',e=>{const b=e.target.closest('[data-case-save]');if(b)toggleCase(b.dataset.caseSave);});
 window.addEventListener('storage',e=>{if(e.key==='dtaas-case-favorites'){try{const values=JSON.parse(e.newValue||'[]');favorites=Array.isArray(values)?values.filter(id=>cases.some(c=>c.id===id)):[];caseState.saved=favorites;renderCases();updateSaveButton();}catch{}}});
 renderCases();renderPartners();
}
function resetCases(){Object.assign(caseState,{query:'',category:'all',industry:'all',process:'all',result:'all',status:'all',savedOnly:false,limit:20});$('case-search').value='';$('case-process').value='all';$('case-industry').value='all';$('case-result').value='all';renderCases();}
function resetPartners(){Object.assign(partnerState,{query:'',role:'all',technology:'all',accreditation:'all',limit:36});$('partner-search').value='';for(const id of ['partner-role','partner-technology','partner-accreditation'])$(id).value='all';renderPartners();}
function caseCard(c,index){return `<article class="case-card" style="animation-delay:${index%9*35}ms"><a class="case-cover" href="#case/${c.id}" tabindex="-1" aria-hidden="true"><img src="${caseImages[c.id]}" alt="" width="1200" height="800" loading="lazy"></a><div class="case-card-top"><span class="case-category">${escape(c.category)}</span><button class="case-save ${favorites.includes(c.id)?'is-saved':''}" data-case-save="${c.id}" aria-pressed="${favorites.includes(c.id)}" aria-label="${favorites.includes(c.id)?'Убрать':'Сохранить'} кейс: ${escape(c.client)}">${favorites.includes(c.id)?'♥':'♡'}</button></div><span class="case-client">${escape(c.client)}</span><span class="case-industry">${escape(c.industry||'')}</span><h3><a href="#case/${c.id}" aria-haspopup="dialog">${escape(c.title)}</a></h3><div class="case-footer"><a href="#case/${c.id}" aria-haspopup="dialog" aria-label="Подробнее: ${escape(c.title)}">Подробнее ↗</a></div></article>`;}
function partnerCard(p,index){return `<article class="partner-card" style="animation-delay:${index%12*25}ms"><a class="partner-cover" href="#partner/${p.id}" tabindex="-1" aria-hidden="true"><img src="${partnerImage(p)}" alt="" width="1200" height="800" loading="lazy"></a><div class="partner-card-top"><span class="partner-avatar tone-${index%4}" aria-hidden="true">${escape(p.initials.replace(/[“«"']/g,''))||'◈'}</span><span class="partner-role">${escape(p.role)}</span><span class="partner-accreditation ${p.accreditation==='Аккредитован'?'is-accredited':''}" title="Аккредитация: ${escape(p.accreditation)}">${p.accreditation==='Аккредитован'?'✓':'—'}</span></div><h3><a href="#partner/${p.id}" aria-haspopup="dialog">${escape(p.name)}</a></h3><div class="partner-footer"><a href="#partner/${p.id}" aria-haspopup="dialog" aria-label="Подробнее: ${escape(p.name)}">Подробнее ↗</a></div></article>`;}
function renderCases(){if(!$('cases-view'))return;const list=filterCases(caseState);$('case-grid').innerHTML=list.slice(0,caseState.limit).map(caseCard).join('');$('case-empty').hidden=!!list.length;$('case-more').hidden=list.length<=caseState.limit;$('case-result-count').textContent=`Показано ${Math.min(caseState.limit,list.length)} из ${list.length} бизнес-кейсов`;iconize($('cases-view'));}
function renderPartners(){if(!$('partners-view'))return;const list=filterPartners(partnerState);$('partner-grid').innerHTML=list.slice(0,partnerState.limit).map(partnerCard).join('');$('partner-empty').hidden=!!list.length;$('partner-more').hidden=list.length<=partnerState.limit;$('partner-result-count').textContent=`Показано ${Math.min(partnerState.limit,list.length)} из ${list.length} партнёров`;iconize($('partners-view'));}
function toggleCase(id){favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];caseState.saved=favorites;try{localStorage.setItem('dtaas-case-favorites',JSON.stringify(favorites));notify(favorites.includes(id)?'Кейс сохранён в избранное':'Кейс убран из избранного');}catch{notify('Кейс сохранён только в этом сеансе');}renderCases();updateSaveButton();}
function updateSaveButton(){const b=$('catalog-dialog-save');if(b&&selected?.kind==='case'){b.textContent=favorites.includes(selected.id)?'♥ Кейс сохранён':'♡ Сохранить кейс';b.setAttribute('aria-pressed',String(favorites.includes(selected.id)));}}
function caseDetails(c){
 const description=(c.details||[c.description]).map(text=>`<p class="dialog-description">${escape(text)}</p>`).join('');
 const stage=c.stage?`<section class="case-project-stage"><h3>Этап проекта</h3><p>${escape(c.stage)}</p></section>`:'';
 const metrics=c.metrics?.length?`<h3 class="detail-subtitle">Показатели проекта</h3><dl class="case-results">${c.metrics.map(metric=>`<div><dt>${escape(metric.context)}</dt><dd><strong>${escape(metric.value)}</strong><span>${escape(metric.description)}</span></dd></div>`).join('')}</dl>`:`<div class="case-metric detail-metric"><span class="metric-context">${escape(c.metricKind)}</span><strong>${escape(c.metricValue)}</strong><span class="metric-description">${escape(c.metricDescription)}</span></div>`;
 return `${c.processes?.length?`<h3 class="detail-subtitle">Какие процессы меняет</h3>${tags(c.processes)}`:''}${c.results?.length?`<h3 class="detail-subtitle">Результат и ожидаемый эффект</h3>${tags(c.results)}`:''}${c.industry?`<p class="case-detail-industry">Отрасль: ${escape(c.industry)}</p>`:''}${description}${tags(c.tags)}${stage}${metrics}`;
}
function safeWebsite(value){
 try{const url=new URL(value);return ['https:','http:'].includes(url.protocol)?url.href:'';}catch{return '';}
}
function partnerDetails(p){
 const website=safeWebsite(p.website);
 const industries=p.industries?.length?`<h3 class="detail-subtitle">Отрасли</h3>${tags(p.industries)}`:'';
 const products=p.products?.length?`<h3 class="detail-subtitle">Продукты и платформы</h3>${tags(p.products)}`:'';
 const contacts=p.contacts?.length?`<h3 class="detail-subtitle">Контакты</h3><div class="partner-contacts">${p.contacts.map(contact=>{
  const email=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)?contact.email:'';
  const phone=contact.phone?.replace(/[^+0-9]/g,'')||'';
  return `<section class="partner-contact"><h4>${escape(contact.name||'Контактное лицо')}</h4>${email?`<a href="mailto:${escape(encodeURIComponent(email))}">${escape(contact.email)}</a>`:contact.email?`<span>${escape(contact.email)}</span>`:''}${phone?`<a href="tel:${escape(phone)}">${escape(contact.phone)}</a>`:''}</section>`;
 }).join('')}</div>`:'';
 return `<dl class="detail-list"><div><dt>ИНН</dt><dd>${escape(p.inn)}${p.innNeedsReview?'<small class="partner-field-note">Требует уточнения в реестре</small>':''}</dd></div><div><dt>АККРЕДИТАЦИЯ</dt><dd>${escape(p.accreditation)}</dd></div><div><dt>РЕГИОН ПО РЕЕСТРУ</dt><dd>${escape(p.region)}</dd></div><div><dt>GIGA COWORK</dt><dd>${escape(p.gigaCowork)}</dd></div></dl>${p.regionMeaning?`<p class="partner-region-note">${escape(p.regionMeaning)}</p>`:''}<h3 class="detail-subtitle">Направления работы</h3><p class="dialog-description">${escape(p.role)}</p><h3 class="detail-subtitle">Технологии и компетенции</h3><p class="dialog-description">${escape(p.expertise||p.description)}</p>${tags(p.tags)}${products}${industries}${contacts}${website?`<div class="dialog-actions"><a class="primary-button" href="${escape(website)}" target="_blank" rel="noopener noreferrer">Сайт партнёра ↗</a></div>`:''}`;
}
export function openCatalogRoute(hash){
 const kind=hash.startsWith('case/')?'case':hash.startsWith('partner/')?'partner':null;const dialog=$('catalog-dialog');if(!dialog)return;
 if(!kind){if(dialog.open)dialog.close();return;}
 const id=hash.slice(kind.length+1);const item=(kind==='case'?cases:partners).find(x=>x.id===id);if(!item)return;
 selected={kind,id};
 if(kind==='case'){
  const c=item;$('catalog-dialog-body').innerHTML=`<div class="catalog-dialog-banner has-art"><img src="${caseImages[c.id]}" alt="Иллюстрация к кейсу" width="1200" height="800"><span class="eyebrow">КЕЙСБУК / ${escape(c.category.toUpperCase())}</span><span class="catalog-dialog-number">${c.number}</span><span class="catalog-dialog-client">${escape(c.client)}</span></div><div class="dialog-content"><h2 id="catalog-dialog-title">${escape(c.title)}</h2>${caseDetails(c)}<div class="dialog-actions"><button class="primary-button" id="catalog-dialog-save" data-case-save="${c.id}"></button></div></div>`;updateSaveButton();
 }else{
  const p=item;$('catalog-dialog-body').innerHTML=`<div class="catalog-dialog-banner partner-banner has-art"><img src="${partnerImage(p)}" alt="Тематическая иллюстрация компетенций" width="1200" height="800"><span class="eyebrow">ПАРТНЁР / ${escape(p.role.toUpperCase())}</span><span class="catalog-dialog-client">${escape(p.name)}</span></div><div class="dialog-content"><h2 id="catalog-dialog-title">Компетенции партнёра</h2>${partnerDetails(p)}</div>`;
 }
 iconize($('catalog-dialog-body'));if(!dialog.open)dialog.showModal();
}
