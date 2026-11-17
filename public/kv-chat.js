import {kvApiBase} from './kv-chat-config.js?v=neutral-20261117';
import {readKvWorkbook} from './kv-workbook.js?v=neutral-20261117';
import {retrieve,publicRecord,tableAnswer,overviewAnswer,groupSources} from './kv-lookup.js?v=neutral-20261117';
import {loadSharedKnowledge} from './kv-shared.js?v=neutral-20261117';
import {neutralText,neutralProvider} from './neutral-content.js?v=neutral-20261117';
const make=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
export function initKvChat(){
 if(document.getElementById('kv-chat-launcher'))return;
 const launcher=make('button','kv-chat-launcher');launcher.id='kv-chat-launcher';launcher.type='button';launcher.setAttribute('aria-controls','kv-chat-panel');launcher.setAttribute('aria-expanded','false');
 launcher.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M20 11.5a8 8 0 0 1-8 8c-1.2 0-2.4-.3-3.4-.7L4 20l1.1-4.6A8 8 0 1 1 20 11.5Z"/><path d="M8 9h8M8 13h5"/></svg><span>Чат-бот</span>';
 const panel=make('section','kv-chat-panel');panel.id='kv-chat-panel';panel.hidden=true;panel.tabIndex=-1;panel.dataset.state='closed';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','false');panel.setAttribute('aria-labelledby','kv-chat-title');
 const nativePopover=typeof panel.showPopover==='function';if(nativePopover)panel.setAttribute('popover','manual');panel.dataset.layer=nativePopover?'popover':'fixed';
 panel.innerHTML=`<header class="kv-chat-header"><button type="button" class="kv-header-button" id="kv-chat-clear" title="Новый диалог" aria-label="Начать новый диалог"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 4H6a3 3 0 0 0-3 3v10l4-3h10a3 3 0 0 0 3-3v-1M17 1v6M14 4h6"/></svg></button><div class="kv-chat-brand"><h2 id="kv-chat-title">Чат-бот</h2><span>DTaaS</span><p id="kv-chat-status" role="status">Подключаем базу знаний…</p></div><button type="button" class="kv-header-button" id="kv-chat-close" aria-label="Закрыть чат">×</button></header><div class="kv-chat-log" id="kv-chat-log" role="log" aria-label="Переписка с чат-ботом" aria-live="polite" aria-relevant="additions"></div><form class="kv-chat-form" id="kv-chat-form"><button type="button" class="kv-chat-attach" id="kv-chat-attach" aria-label="Открыть свою таблицу КВ на устройстве" title="Открыть свою таблицу КВ на устройстве"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m8 13 7-7a3 3 0 0 1 4 4L9 20a5 5 0 0 1-7-7L13 2"/></svg></button><label class="visually-hidden" for="kv-chat-input">Ваш вопрос по КВ</label><textarea id="kv-chat-input" name="question" rows="2" maxlength="1200" placeholder="Спросите о КВ" required></textarea><button class="kv-chat-send" type="submit" id="kv-chat-send" aria-label="Отправить вопрос">↑</button></form><nav class="kv-chat-suggestions" id="kv-chat-suggestions" aria-label="Возможности чат-бота и разделы сайта"></nav>`;
 const scrim=make('button','kv-chat-scrim');scrim.type='button';scrim.hidden=true;scrim.tabIndex=-1;scrim.setAttribute('aria-label','Закрыть чат');document.body.append(scrim,launcher,panel);
 const $=id=>panel.querySelector('#'+id),log=$('kv-chat-log'),input=$('kv-chat-input'),send=$('kv-chat-send'),status=$('kv-chat-status');
 const connectionNotice=make('p','kv-chat-connection');connectionNotice.hidden=true;connectionNotice.setAttribute('role','status');panel.querySelector('.kv-chat-header').after(connectionNotice);
 const sourcePicker=make('div','kv-local-source'),fileLabel=make('label','kv-local-file','Выбрать КВ.xlsx'),fileInput=make('input','visually-hidden'),forgetFile=make('button','kv-local-forget','Удалить из чата');
 fileInput.id='kv-chat-file';fileInput.type='file';fileInput.accept='.xlsx';fileLabel.append(fileInput);forgetFile.type='button';forgetFile.hidden=true;
 sourcePicker.append(fileLabel,forgetFile,make('p','','Файл обрабатывается на вашем устройстве и не отправляется на сервер.'));sourcePicker.hidden=true;connectionNotice.after(sourcePicker);
 const base=new URL(kvApiBase||'./api/kv/',import.meta.url);if(!base.pathname.endsWith('/'))base.pathname+='/';
 let ready=false,checking=false,pending=null,generation=0,history=[],localKnowledge=null,dataOrigin='',importing=false;
 let expanded=false,compact=false,sectionsOpen=false,transition=null,transitionId=0;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),backgroundState=new Map();
 function resizeComposer(){input.style.height='auto';input.style.height=Math.min(104,input.scrollHeight)+'px';}
 function backgroundModal(active){
  panel.setAttribute('aria-modal',String(active));document.documentElement.classList.toggle('kv-chat-modal',active);scrim.hidden=!active||nativePopover;
  if(active){for(const node of document.body.children)if(node!==panel&&node!==launcher&&node!==scrim&&!backgroundState.has(node)){backgroundState.set(node,node.inert);node.inert=true;}}
  else{for(const [node,inert] of backgroundState)node.inert=inert;backgroundState.clear();}
 }
 function updateSections(){const toggle=$('kv-chat-sections-toggle'),links=$('kv-section-links');if(!toggle)return;toggle.hidden=!compact;toggle.setAttribute('aria-expanded',String(compact&&sectionsOpen));toggle.textContent=sectionsOpen?'Разделы ↓':'Разделы ↑';links.hidden=compact&&!sectionsOpen;links.inert=links.hidden;links.setAttribute('aria-hidden',String(links.hidden));}
 function syncViewport(){
  const view=window.visualViewport,width=view?.width||innerWidth,height=view?.height||innerHeight;
  compact=(view?.scale>1.01?width:innerWidth)<=900||height<700;
  const keyboard=compact&&document.activeElement===input&&innerHeight-height>120&&width>=innerWidth*.85;
  panel.dataset.compact=String(compact);panel.dataset.keyboard=String(keyboard);
  panel.style.setProperty('--kv-vp-height',height+'px');panel.style.setProperty('--kv-vp-width',width+'px');
  panel.style.setProperty('--kv-vp-bottom',Math.max(0,innerHeight-(view?.offsetTop||0)-height)+'px');panel.style.setProperty('--kv-vp-right',Math.max(0,innerWidth-(view?.offsetLeft||0)-width)+'px');
  if(!compact||keyboard)sectionsOpen=false;updateSections();if(!panel.hidden)backgroundModal(compact);resizeComposer();
 }
 function animatePanel(frames,duration,done){
  const token=++transitionId;transition?.cancel();transition=null;
  if(reduced.matches||typeof panel.animate!=='function'){done();return;}
  transition=panel.animate(frames,{duration,easing:'cubic-bezier(.2,.8,.2,1)',fill:'both'});
  transition.finished.then(()=>{if(token===transitionId){done();transition?.cancel();transition=null;}}).catch(()=>{});
 }
 const scroll=()=>{log.scrollTop=log.scrollHeight;};
 function bubble(role,text){log.querySelector('.kv-welcome')?.remove();const node=make('article','kv-message kv-message-'+role);const label=make('span','kv-message-role',role==='user'?'Вы':'Чат-бот');const content=make('p','kv-message-text',text);node.append(label,content);log.append(node);scroll();return node;}
 function welcome(){log.replaceChildren();history=[];const greeting=make('article','kv-welcome');greeting.append(make('h3','','Чем помочь сегодня?'),make('p','','Узнайте условия по КВ или выберите нужный раздел ниже.'));log.append(greeting);}
 function setPending(value){send.textContent=value?'■':'↑';send.setAttribute('aria-label',value?'Остановить ответ':'Отправить вопрос');input.readOnly=value;fileInput.disabled=value||importing;forgetFile.disabled=value||importing;$('kv-chat-attach').disabled=value||importing;panel.setAttribute('aria-busy',String(value));}
 function updateControls(){status.hidden=ready;if(ready)status.textContent='';send.disabled=!ready;input.disabled=!ready;sourcePicker.hidden=ready&&dataOrigin!=='local';forgetFile.hidden=dataOrigin!=='local';const helper=panel.querySelector('.kv-chip-primary');if(helper)helper.disabled=!ready;input.placeholder=ready?'Спросите о КВ':'База знаний загружается…';}
 function showLocalStatus(){ready=true;const shared=dataOrigin==='shared';status.textContent=shared?`Общая база КВ · ${localKnowledge.records.length} строк`:`${localKnowledge.records.length} строк · ${localKnowledge.filename} · на устройстве`;connectionNotice.textContent='Таблица открыта. Задайте вопрос ниже — поиск работает без сервера. Файл доступен до обновления этой страницы.';connectionNotice.hidden=shared;updateControls();}
 fileInput.onchange=async()=>{
  const file=fileInput.files?.[0];if(!file||pending||importing)return;
  importing=true;fileInput.disabled=true;send.disabled=true;input.disabled=true;forgetFile.disabled=true;$('kv-chat-attach').disabled=true;status.hidden=false;status.textContent='Читаю таблицу на устройстве…';
  try{const knowledge=await readKvWorkbook(file);generation++;localKnowledge=knowledge;dataOrigin='local';welcome();showLocalStatus();input.focus({preventScroll:true});}
  catch(error){connectionNotice.textContent=error.message||'Не удалось прочитать книгу. Выберите сохранённую копию .xlsx.';connectionNotice.hidden=false;if(localKnowledge){ready=true;status.textContent=`${localKnowledge.records.length} строк · предыдущий файл сохранён`;}else{ready=false;status.textContent='Выберите таблицу КВ';}updateControls();}
  finally{importing=false;fileInput.disabled=false;forgetFile.disabled=false;$('kv-chat-attach').disabled=false;fileInput.value='';}
 };
 forgetFile.onclick=()=>{if(pending||importing)return;generation++;localKnowledge=null;dataOrigin='';ready=false;welcome();input.value='';updateControls();checkStatus();};
 async function checkStatus(){
  if(localKnowledge){showLocalStatus();return;}
  if(checking)return;checking=true;status.hidden=false;send.disabled=true;input.disabled=true;connectionNotice.hidden=true;status.textContent='Подключаем базу знаний…';
  try{
   let server=null;
   if(kvApiBase||!location.hostname.endsWith('.github.io'))try{const response=await fetch(new URL('status',base),{credentials:'omit',signal:AbortSignal.timeout(10000)});if(response.ok)server=await response.json();}catch{}
   if(localKnowledge)return;
   if(server?.ready){ready=true;status.textContent=`${server.source.rows} строк · ${server.source.products} продуктов · КВ.xlsx`;return;}
   const shared=await loadSharedKnowledge();if(localKnowledge)return;localKnowledge=shared;dataOrigin='shared';showLocalStatus();
  }catch{if(localKnowledge)return;ready=false;status.textContent='База КВ временно недоступна';connectionNotice.textContent='Не удалось загрузить общую базу. Откройте чат ещё раз или нажмите «Выбрать КВ.xlsx», чтобы временно использовать файл на устройстве.';connectionNotice.hidden=false;}
  finally{checking=false;if(localKnowledge)showLocalStatus();else updateControls();}
 }
 function open(){
  expanded=true;sectionsOpen=false;panel.hidden=false;panel.inert=false;panel.removeAttribute('aria-hidden');launcher.hidden=true;launcher.setAttribute('aria-expanded','true');
  if(nativePopover&&!panel.matches(':popover-open'))panel.showPopover();syncViewport();panel.focus({preventScroll:true});panel.dataset.state='opening';
  animatePanel([{opacity:0,transform:'translateY(8px) scale(.98)'},{opacity:1,transform:'translateY(0) scale(1)'}],220,()=>{panel.dataset.state='open';});
  checkStatus().then(()=>{if(expanded&&!compact)(ready?input:fileInput).focus({preventScroll:true});});
 }
 function close(){
  if(!expanded)return;expanded=false;sectionsOpen=false;updateSections();input.blur();panel.inert=true;panel.setAttribute('aria-hidden','true');panel.dataset.state='closing';launcher.setAttribute('aria-expanded','false');
  animatePanel([{opacity:1,transform:'translateY(0) scale(1)'},{opacity:0,transform:'translateY(8px) scale(.98)'}],160,()=>{panel.hidden=true;if(nativePopover&&panel.matches(':popover-open'))panel.hidePopover();panel.dataset.state='closed';backgroundModal(false);launcher.hidden=false;launcher.focus({preventScroll:true});});
 }
 launcher.onclick=()=>expanded?close():open();$('kv-chat-close').onclick=close;scrim.onclick=close;
 panel.addEventListener('pointerdown',event=>{if(!compact||event.target!==panel)return;const r=panel.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom){event.preventDefault();event.stopPropagation();close();}});
 $('kv-chat-attach').onclick=()=>{if(!pending&&!importing)fileInput.click();};
 $('kv-chat-clear').onclick=()=>{generation++;pending?.abort();pending=null;setPending(false);welcome();input.value='';input.focus();};
 document.addEventListener('keydown',event=>{
  if(!expanded||document.querySelector('dialog[open]'))return;
  if(event.key==='Escape'){event.preventDefault();if(compact&&sectionsOpen){sectionsOpen=false;updateSections();$('kv-chat-sections-toggle').focus();}else close();}
  if(event.key==='Tab'&&compact){const nodes=[...panel.querySelectorAll('button:not(:disabled),a[href],textarea:not(:disabled),select:not(:disabled)')].filter(node=>node.getClientRects().length);const first=nodes[0],last=nodes.at(-1);if(event.shiftKey&&(document.activeElement===first||!nodes.includes(document.activeElement))){event.preventDefault();last?.focus();}else if(!event.shiftKey&&(document.activeElement===last||!nodes.includes(document.activeElement))){event.preventDefault();first?.focus();}}
 });
 const helper=make('button','kv-chat-suggestion kv-chip-primary');helper.type='button';helper.append(make('span','kv-chip-icon','₽'),make('span','','Помощник по КВ'));
 helper.onclick=()=>{
  if(pending||!ready)return;
  let menu=log.querySelector('.kv-helper-menu');
  if(!menu){menu=bubble('assistant','Помогу найти ПВ, MIN ПВ, НДС и ФинРез, сравнить условия и выбрать нужный вариант. Спросите о продукте или начните с примера:');menu.classList.add('kv-helper-menu');const examples=make('div','kv-helper-examples');for(const text of ['Условия ГигаЧат для бизнеса ПАК','Какое ПВ у Портал DA?','Максимальный ПВ']){const button=make('button','kv-example',text);button.type='button';button.onclick=()=>{if(pending||!ready)return;input.value=text;$('kv-chat-form').requestSubmit();};examples.append(button);}menu.append(examples);}
  log.append(menu);scroll();(compact?menu.querySelector('button'):input)?.focus({preventScroll:true});
 };
 $('kv-chat-suggestions').append(helper);
 const sectionsToggle=make('button','kv-chat-suggestion kv-chat-sections-toggle','Разделы ↑');sectionsToggle.id='kv-chat-sections-toggle';sectionsToggle.type='button';sectionsToggle.setAttribute('aria-controls','kv-section-links');sectionsToggle.setAttribute('aria-expanded','false');sectionsToggle.hidden=true;
 const sectionLinks=make('div','kv-section-links');sectionLinks.id='kv-section-links';$('kv-chat-suggestions').append(sectionsToggle,sectionLinks);
 for(const [title,href,icon] of [['Мероприятия','./events.html','▦'],['Обучение CSM','./learning.html','✦'],['Бизнес-кейсы','./cases.html','↗'],['Партнёры','./partners.html','◌']]){const link=make('a','kv-chat-suggestion');link.href=href;link.append(make('span','kv-chip-icon',icon),make('span','',title));sectionLinks.append(link);}
 sectionsToggle.onclick=()=>{sectionsOpen=!sectionsOpen;updateSections();};
 // Some browsers keep a manual popover's backdrop non-interactive.
 document.addEventListener('pointerdown',event=>{if(expanded&&compact&&!panel.contains(event.target)&&!launcher.contains(event.target)){event.preventDefault();event.stopPropagation();close();return;}if(sectionsOpen&&!sectionLinks.contains(event.target)&&!sectionsToggle.contains(event.target)){sectionsOpen=false;updateSections();}},true);
 window.addEventListener('resize',syncViewport);window.visualViewport?.addEventListener('resize',syncViewport);window.visualViewport?.addEventListener('scroll',syncViewport);
 reduced.addEventListener('change',()=>{if(reduced.matches)transition?.finish();});
 function fact(product){
  const details=make('details','kv-fact'),summary=make('summary','');
  summary.append(make('strong','',neutralText(product.product)),make('span','kv-fact-provider',neutralProvider(product.provider)));
  const {variants}=product;
  const rates=[...new Set(variants.map(row=>row.fields.find(f=>f.key==='pvRate')?.value||'—'))];
  summary.append(make('span','kv-fact-preview',variants.length>1?`${variants.length} варианта условий · ПВ ${rates.join(' / ')}`:`ПВ ${rates[0]} · MIN ПВ ${variants[0].fields.find(f=>f.key==='minPv')?.value||'—'} · НДС ${variants[0].fields.find(f=>f.key==='vatRate')?.value||'—'}`));details.append(summary);
  const panels=[];let selector;
  if(variants.length>1){
   const label=make('label','kv-variant-label','Вариант условий');selector=make('select','kv-variant-select');selector.setAttribute('aria-label',`Вариант условий: ${product.product}`);
   const prompt=make('option','','Выберите вариант');prompt.value='';selector.append(prompt);
   variants.forEach((row,index)=>{const pv=row.fields.find(f=>f.key==='pvRate')?.value,vat=row.fields.find(f=>f.key==='vatRate')?.value;const option=make('option','',`Условия ${index+1}: ПВ ${pv} · НДС ${vat}`);option.value=String(index);selector.append(option);});
   label.append(selector);details.append(label);
   selector.onchange=()=>{panels.forEach((panel,index)=>panel.hidden=selector.value!==String(index));};
  }
  for(const row of variants){
  const panel=make('div','kv-variant-panel');panel.hidden=variants.length>1;panels.push(panel);
  const dl=make('dl','kv-fact-fields');for(const field of row.fields){const div=make('div','');const dt=make('dt','',field.label),dd=make('dd','',field.value);dd.title=`${row.sheet}!${field.cell}`;div.append(dt,dd);dl.append(div);}
  panel.append(dl);
  details.append(panel);
  }return details;
 }
 async function submit(event){
  event.preventDefault();if(pending){pending.abort();return;}if(!ready)return;
  const question=input.value.trim();if(!question)return;
  const session=generation,started=performance.now();const controller=new AbortController();pending=controller;input.value='';resizeComposer();bubble('user',question);const answer=bubble('assistant','Сверяю условия…');const typing=make('span','kv-typing');typing.setAttribute('aria-hidden','true');for(let i=0;i<3;i++)typing.append(make('i',''));answer.append(typing);answer.classList.add('is-pending');setPending(true);
  try{
   let data;
   if(localKnowledge){const found=retrieve(localKnowledge,question,history.slice(-6));data={answer:(!found.records.length&&overviewAnswer(localKnowledge,question))||tableAnswer(found),mode:dataOrigin,sources:found.records.map(publicRecord)};}
   else{const response=await fetch(new URL('chat',base),{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify({question,history:history.slice(-6)}),signal:AbortSignal.any([controller.signal,AbortSignal.timeout(35000)])});data=await response.json();if(!response.ok)throw Error(data.error||'Не удалось получить ответ. Попробуйте ещё раз.');}
   if(session!==generation)return;controller.signal.throwIfAborted();
   const remaining=reduced.matches?0:180-(performance.now()-started);if(remaining>0)await new Promise((resolve,reject)=>{const stop=()=>{clearTimeout(timer);reject(controller.signal.reason);};const timer=setTimeout(()=>{controller.signal.removeEventListener('abort',stop);resolve();},remaining);controller.signal.addEventListener('abort',stop,{once:true});});
   if(session!==generation)return;controller.signal.throwIfAborted();typing.remove();
   answer.querySelector('.kv-message-text').textContent=neutralText(data.answer);if(data.mode!=='shared')answer.append(make('span','kv-answer-mode',data.mode==='deepseek'?'Пояснение DeepSeek · условия из таблицы':data.mode==='local'?'Поиск по файлу на устройстве · без ИИ':'Поиск по таблице'));
   if(data.notice)answer.append(make('p','kv-chat-notice',data.notice));
   if(Array.isArray(data.sources)&&data.sources.length){const sources=make('div','kv-chat-sources'),products=groupSources(data.sources);sources.setAttribute('aria-label','Условия из исходной таблицы');for(const product of products){const item=fact(product);if(products.length===1)item.open=true;sources.append(item);}answer.append(sources);}
   history.push({role:'user',content:question},{role:'assistant',content:String(data.answer).slice(0,1200)});history=history.slice(-6);
  }catch(error){if(session!==generation)return;answer.querySelector('.kv-message-text').textContent=controller.signal.aborted?'Запрос остановлен.':error instanceof SyntaxError||error.message==='Failed to fetch'?'Не удалось связаться с помощником. Попробуйте ещё раз.':error.name==='TimeoutError'?'Ответ занял слишком много времени. Попробуйте ещё раз.':error.message;input.value=question;}
  finally{if(session===generation){typing.remove();answer.classList.remove('is-pending');pending=null;setPending(false);resizeComposer();scroll();if(expanded&&!compact)input.focus({preventScroll:true});}}
 }
 $('kv-chat-form').addEventListener('submit',submit);
 input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();$('kv-chat-form').requestSubmit();}});
 input.rows=1;input.addEventListener('input',resizeComposer);input.addEventListener('focus',syncViewport);input.addEventListener('blur',()=>requestAnimationFrame(syncViewport));welcome();syncViewport();
}
