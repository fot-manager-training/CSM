import {kvApiBase} from './kv-chat-config.js?v=kv-minimal-20261116';
import {readKvWorkbook} from './kv-workbook.js?v=kv-minimal-20261116';
import {retrieve,publicRecord,tableAnswer,overviewAnswer,groupSources} from './kv-lookup.js?v=kv-minimal-20261116';
import {loadSharedKnowledge} from './kv-shared.js?v=kv-minimal-20261116';
const make=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
export function initKvChat(){
 if(document.getElementById('kv-chat-launcher'))return;
 const launcher=make('button','kv-chat-launcher');launcher.id='kv-chat-launcher';launcher.type='button';launcher.setAttribute('aria-controls','kv-chat-panel');launcher.setAttribute('aria-expanded','false');
 launcher.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M20 11.5a8 8 0 0 1-8 8c-1.2 0-2.4-.3-3.4-.7L4 20l1.1-4.6A8 8 0 1 1 20 11.5Z"/><path d="M8 9h8M8 13h5"/></svg><span>Чат-бот</span>';
 const panel=make('section','kv-chat-panel');panel.id='kv-chat-panel';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','false');panel.setAttribute('aria-labelledby','kv-chat-title');
 panel.innerHTML=`<header class="kv-chat-header"><button type="button" class="kv-header-button" id="kv-chat-clear" title="Новый диалог" aria-label="Начать новый диалог"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 4H6a3 3 0 0 0-3 3v10l4-3h10a3 3 0 0 0 3-3v-1M17 1v6M14 4h6"/></svg></button><div class="kv-chat-brand"><h2 id="kv-chat-title">Чат-бот</h2><span>DTaaS СЗБ</span><p id="kv-chat-status" role="status">Подключаем базу знаний…</p></div><button type="button" class="kv-header-button" id="kv-chat-close" aria-label="Закрыть чат">×</button></header><div class="kv-chat-log" id="kv-chat-log" role="log" aria-label="Переписка с чат-ботом" aria-live="polite" aria-relevant="additions"></div><form class="kv-chat-form" id="kv-chat-form"><button type="button" class="kv-chat-attach" id="kv-chat-attach" aria-label="Открыть свою таблицу КВ на устройстве" title="Открыть свою таблицу КВ на устройстве"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m8 13 7-7a3 3 0 0 1 4 4L9 20a5 5 0 0 1-7-7L13 2"/></svg></button><label class="visually-hidden" for="kv-chat-input">Ваш вопрос по КВ</label><textarea id="kv-chat-input" name="question" rows="2" maxlength="1200" placeholder="Спросите о КВ" required></textarea><button class="kv-chat-send" type="submit" id="kv-chat-send" aria-label="Отправить вопрос">↑</button></form><nav class="kv-chat-suggestions" id="kv-chat-suggestions" aria-label="Возможности чат-бота и разделы сайта"></nav>`;
 document.body.append(launcher,panel);
 const $=id=>panel.querySelector('#'+id),log=$('kv-chat-log'),input=$('kv-chat-input'),send=$('kv-chat-send'),status=$('kv-chat-status');
 const connectionNotice=make('p','kv-chat-connection');connectionNotice.hidden=true;connectionNotice.setAttribute('role','status');panel.querySelector('.kv-chat-header').after(connectionNotice);
 const sourcePicker=make('div','kv-local-source'),fileLabel=make('label','kv-local-file','Выбрать КВ.xlsx'),fileInput=make('input','visually-hidden'),forgetFile=make('button','kv-local-forget','Удалить из чата');
 fileInput.id='kv-chat-file';fileInput.type='file';fileInput.accept='.xlsx';fileLabel.append(fileInput);forgetFile.type='button';forgetFile.hidden=true;
 sourcePicker.append(fileLabel,forgetFile,make('p','','Файл обрабатывается на вашем устройстве и не отправляется на сервер.'));sourcePicker.hidden=true;connectionNotice.after(sourcePicker);
 const base=new URL(kvApiBase||'./api/kv/',import.meta.url);if(!base.pathname.endsWith('/'))base.pathname+='/';
 let ready=false,checking=false,pending=null,generation=0,history=[],localKnowledge=null,dataOrigin='',importing=false;
 const scroll=()=>{log.scrollTop=log.scrollHeight;};
 function bubble(role,text){log.querySelector('.kv-welcome')?.remove();const node=make('article','kv-message kv-message-'+role);const label=make('span','kv-message-role',role==='user'?'Вы':'Чат-бот');const content=make('p','kv-message-text',text);node.append(label,content);log.append(node);scroll();return node;}
 function welcome(){log.replaceChildren();history=[];const greeting=make('article','kv-welcome');greeting.append(make('h3','','Чем помочь сегодня?'),make('p','','Узнайте условия по КВ или выберите нужный раздел ниже.'));log.append(greeting);}
 function setPending(value){send.textContent=value?'■':'↑';send.setAttribute('aria-label',value?'Остановить ответ':'Отправить вопрос');input.readOnly=value;fileInput.disabled=value||importing;forgetFile.disabled=value||importing;$('kv-chat-attach').disabled=value||importing;panel.setAttribute('aria-busy',String(value));}
 function updateControls(){status.hidden=ready;if(ready)status.textContent='';send.disabled=!ready;input.disabled=!ready;sourcePicker.hidden=ready&&dataOrigin!=='local';forgetFile.hidden=dataOrigin!=='local';for(const button of $('kv-chat-suggestions').querySelectorAll('button'))button.disabled=!ready;input.placeholder=ready?'Спросите о КВ':'База знаний загружается…';}
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
 function open(){panel.hidden=false;launcher.setAttribute('aria-expanded','true');checkStatus().then(()=>{if(!panel.hidden)(ready?input:fileInput).focus({preventScroll:true});});}
 function close(){panel.hidden=true;launcher.setAttribute('aria-expanded','false');launcher.focus({preventScroll:true});}
 launcher.onclick=()=>panel.hidden?open():close();$('kv-chat-close').onclick=close;
 $('kv-chat-attach').onclick=()=>{if(!pending&&!importing)fileInput.click();};
 $('kv-chat-clear').onclick=()=>{generation++;pending?.abort();pending=null;setPending(false);welcome();input.value='';input.focus();};
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden&&!document.querySelector('dialog[open]')){event.preventDefault();close();}});
 const helper=make('button','kv-chat-suggestion kv-chip-primary');helper.type='button';helper.append(make('span','kv-chip-icon','₽'),make('span','','Помощник по КВ'));
 helper.onclick=()=>{
  if(pending||!ready)return;
  let menu=log.querySelector('.kv-helper-menu');
  if(!menu){menu=bubble('assistant','Помогу найти ПВ, MIN ПВ, НДС и ФинРез, сравнить условия и выбрать нужный вариант. Спросите о продукте или начните с примера:');menu.classList.add('kv-helper-menu');const examples=make('div','kv-helper-examples');for(const text of ['Условия ГигаЧат для бизнеса ПАК','Какое ПВ у Портал DA?','Максимальный ПВ']){const button=make('button','kv-example',text);button.type='button';button.onclick=()=>{if(pending||!ready)return;input.value=text;$('kv-chat-form').requestSubmit();};examples.append(button);}menu.append(examples);}
  log.append(menu);scroll();input.focus({preventScroll:true});
 };
 $('kv-chat-suggestions').append(helper);
 for(const [title,href,icon] of [['Мероприятия','./events.html','▦'],['Обучение CSM','./learning.html','✦'],['Бизнес-кейсы','./cases.html','↗'],['Партнёры','./partners.html','◌']]){const link=make('a','kv-chat-suggestion');link.href=href;link.append(make('span','kv-chip-icon',icon),make('span','',title));$('kv-chat-suggestions').append(link);}
 function fact(product){
  const details=make('details','kv-fact'),summary=make('summary','');
  summary.append(make('strong','',product.product),make('span','kv-fact-provider',product.provider));
  const {variants}=product;
  const rates=[...new Set(variants.map(row=>row.fields.find(f=>f.key==='pvRate')?.value||'—'))];
  summary.append(make('span','kv-fact-preview',variants.length>1?`${variants.length} варианта условий · ПВ ${rates.join(' / ')}`:`ПВ ${rates[0]} · MIN ПВ ${variants[0].fields.find(f=>f.key==='minPv')?.value||'—'} · НДС ${variants[0].fields.find(f=>f.key==='vatRate')?.value||'—'}`));details.append(summary);
  const panels=[];let selector;
  if(variants.length>1){
   details.append(make('p','kv-chat-notice','В таблице разные условия для этого продукта. Признак сегмента не указан. Выберите вариант, чтобы увидеть все показатели.'));
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
  const follow=make('button','kv-fact-follow',`Уточнить по строке ${row.row}`);follow.type='button';follow.onclick=()=>{if(pending)return;input.value=`Расскажи об условиях «${row.product}», строка ${row.row}.`;input.focus();};panel.append(follow);details.append(panel);
  }return details;
 }
 async function submit(event){
  event.preventDefault();if(pending){pending.abort();return;}if(!ready)return;
  const question=input.value.trim();if(!question)return;
  const session=generation;const controller=new AbortController();pending=controller;input.value='';bubble('user',question);const answer=bubble('assistant','Ищу условия в таблице…');answer.classList.add('is-pending');setPending(true);
  try{
   let data;
   if(localKnowledge){const found=retrieve(localKnowledge,question,history.slice(-6));data={answer:(!found.records.length&&overviewAnswer(localKnowledge,question))||tableAnswer(found),mode:dataOrigin,sources:found.records.map(publicRecord)};}
   else{const response=await fetch(new URL('chat',base),{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify({question,history:history.slice(-6)}),signal:AbortSignal.any([controller.signal,AbortSignal.timeout(35000)])});data=await response.json();if(!response.ok)throw Error(data.error||'Не удалось получить ответ. Попробуйте ещё раз.');}
   if(session!==generation)return;controller.signal.throwIfAborted();
   answer.querySelector('.kv-message-text').textContent=data.answer;if(data.mode!=='shared')answer.append(make('span','kv-answer-mode',data.mode==='deepseek'?'Пояснение DeepSeek · условия из таблицы':data.mode==='local'?'Поиск по файлу на устройстве · без ИИ':'Поиск по таблице'));
   if(data.notice)answer.append(make('p','kv-chat-notice',data.notice));
   if(Array.isArray(data.sources)&&data.sources.length){const sources=make('div','kv-chat-sources'),products=groupSources(data.sources);sources.setAttribute('aria-label','Условия из исходной таблицы');for(const product of products){const item=fact(product);if(products.length===1)item.open=true;sources.append(item);}answer.append(sources);answer.append(make('p','kv-chat-notice','Значения сохранены в Excel. Формулы с внешними ссылками не пересчитывались.'));}
   history.push({role:'user',content:question},{role:'assistant',content:String(data.answer).slice(0,1200)});history=history.slice(-6);
  }catch(error){if(session!==generation)return;answer.querySelector('.kv-message-text').textContent=controller.signal.aborted?'Запрос остановлен.':error instanceof SyntaxError||error.message==='Failed to fetch'?'Не удалось связаться с помощником. Попробуйте ещё раз.':error.name==='TimeoutError'?'Ответ занял слишком много времени. Попробуйте ещё раз.':error.message;input.value=question;}
  finally{if(session===generation){answer.classList.remove('is-pending');pending=null;setPending(false);scroll();if(!panel.hidden)input.focus({preventScroll:true});}}
 }
 $('kv-chat-form').addEventListener('submit',submit);
 input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();$('kv-chat-form').requestSubmit();}});
 welcome();
}
