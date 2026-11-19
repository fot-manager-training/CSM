const safe=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function invitationText(event,pageUrl){
 const url=new URL('./events.html',pageUrl);url.hash='event/'+encodeURIComponent(event.id);
 const year=event.start?.slice(0,4),date=event.date+(year&&!event.date.includes(year)?' '+year:'');
 const place=[event.venue,event.address].filter(Boolean);
 if(event.city&&!place.some(part=>part.includes(event.city)))place.unshift(event.city);
 const location=[...new Set(place)].join(', ');
 return ['Здравствуйте!','',`Приглашаем вас на мероприятие «${event.title}».`,event.summary||'', '',`Дата: ${date}.`,
  ...(event.time?[`Время: ${event.time}.`]:[]),...(location?[`Место: ${location}.`]:[]),...(event.metro?[`Метро: «${event.metro}».`]:[]),
  ...(event.websiteUrl?[`${event.programOnWebsite?'Программа и регистрация':'Сайт мероприятия'}: ${event.websiteUrl}`]:[]),
  `Подробнее о мероприятии: ${url.href}`,'','Будем рады видеть вас!'].join('\n');
}
export function invitationButton(event,extraClass=''){
 return `<button type="button" class="event-invite-button ${safe(extraClass)}" data-copy-invitation="${safe(event.id)}" aria-label="Скопировать приглашение: ${safe(event.title)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3"/></svg><span data-invite-label>Скопировать приглашение</span></button>`;
}
export function initEventInvitations({events,notify}){
 let manual;
 function showManual(text){
  if(!manual){
   manual=document.createElement('dialog');manual.className='invitation-dialog';manual.setAttribute('aria-labelledby','invitation-title');
   manual.innerHTML='<button type="button" class="invitation-close" aria-label="Закрыть приглашение">×</button><h2 id="invitation-title">Приглашение для клиента</h2><p>Выделите текст и скопируйте его для отправки.</p><label class="visually-hidden" for="invitation-text">Текст приглашения</label><textarea id="invitation-text" readonly rows="14"></textarea>';
   document.body.append(manual);manual.querySelector('button').onclick=()=>manual.close();
   manual.addEventListener('click',event=>{if(event.target===manual){const r=manual.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)manual.close();}});
  }
  const field=manual.querySelector('textarea');field.value=text;if(!manual.open)manual.showModal();field.focus();field.select();
 }
 async function copy(text){
  try{await navigator.clipboard.writeText(text);return true;}catch{}
  const field=document.createElement('textarea'),active=document.activeElement;field.value=text;field.readOnly=true;field.style.cssText='position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0';
  (document.querySelector('dialog[open]')||document.body).append(field);field.focus();field.select();
  let copied=false;try{copied=document.execCommand('copy');}catch{}finally{field.remove();active?.focus({preventScroll:true});}
  return copied;
 }
 document.addEventListener('click',async event=>{
  const button=event.target.closest('[data-copy-invitation]');if(!button)return;
  event.preventDefault();event.stopImmediatePropagation();const item=events.find(item=>item.id===button.dataset.copyInvitation);if(!item)return;
  const text=invitationText(item,location.href);
  if(await copy(text)){notify('Приглашение скопировано');const label=button.querySelector('[data-invite-label]');if(label){label.textContent='Скопировано';setTimeout(()=>{if(label.isConnected)label.textContent='Скопировать приглашение';},1800);}}
  else showManual(text);
 },true);
}
