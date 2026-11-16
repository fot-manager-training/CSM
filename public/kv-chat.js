import {kvApiBase} from './kv-chat-config.js?v=kv-local-20261116';
import {readKvWorkbook} from './kv-workbook.js?v=kv-local-20261116';
import {retrieve,publicRecord,tableAnswer,overviewAnswer} from './kv-lookup.js';
const make=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
export function initKvChat(){
 if(document.getElementById('kv-chat-launcher'))return;
 const launcher=make('button','kv-chat-launcher');launcher.id='kv-chat-launcher';launcher.type='button';launcher.setAttribute('aria-controls','kv-chat-panel');launcher.setAttribute('aria-expanded','false');
 launcher.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M20 11.5a8 8 0 0 1-8 8c-1.2 0-2.4-.3-3.4-.7L4 20l1.1-4.6A8 8 0 1 1 20 11.5Z"/><path d="M8 9h8M8 13h5"/></svg><span>Вопрос по КВ</span>';
 const panel=make('section','kv-chat-panel');panel.id='kv-chat-panel';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','false');panel.setAttribute('aria-labelledby','kv-chat-title');
 panel.innerHTML=`<header class="kv-chat-header"><div><h2 id="kv-chat-title">Помощник по КВ</h2><p id="kv-chat-status" role="status">Ответы по вашей таблице</p></div><div class="kv-chat-actions"><button type="button" id="kv-chat-clear" title="Новый диалог" aria-label="Начать новый диалог">↺</button><button type="button" id="kv-chat-close" aria-label="Закрыть чат">×</button></div></header><div class="kv-chat-log" id="kv-chat-log" role="log" aria-label="Переписка с помощником" aria-live="polite" aria-relevant="additions"></div><div class="kv-chat-suggestions" id="kv-chat-suggestions"></div><form class="kv-chat-form" id="kv-chat-form"><label class="visually-hidden" for="kv-chat-input">Ваш вопрос по КВ</label><textarea id="kv-chat-input" name="question" rows="2" maxlength="1200" placeholder="Продукт, компания или условие…" required></textarea><button class="kv-chat-send" type="submit" id="kv-chat-send" aria-label="Отправить вопрос">↑</button></form><p class="kv-chat-footnote">Сверяйте продукт и вариант условий. Enter — отправить, Shift+Enter — новая строка.</p>`;
 document.body.append(launcher,panel);
 const $=id=>panel.querySelector('#'+id),log=$('kv-chat-log'),input=$('kv-chat-input'),send=$('kv-chat-send'),status=$('kv-chat-status');
 const connectionNotice=make('p','kv-chat-connection');connectionNotice.hidden=true;connectionNotice.setAttribute('role','status');panel.querySelector('.kv-chat-header').after(connectionNotice);
 const sourcePicker=make('div','kv-local-source'),fileLabel=make('label','kv-local-file','Выбрать КВ.xlsx'),fileInput=make('input','visually-hidden'),forgetFile=make('button','kv-local-forget','Удалить из чата');
 fileInput.id='kv-chat-file';fileInput.type='file';fileInput.accept='.xlsx';fileLabel.append(fileInput);forgetFile.type='button';forgetFile.hidden=true;
 sourcePicker.append(fileLabel,forgetFile,make('p','','Файл обрабатывается на вашем устройстве и не отправляется на сервер.'));sourcePicker.hidden=true;connectionNotice.after(sourcePicker);
 const base=new URL(kvApiBase||'./api/kv/',import.meta.url);if(!base.pathname.endsWith('/'))base.pathname+='/';
 let ready=false,checking=false,pending=null,generation=0,history=[],localKnowledge=null,importing=false;
 const scroll=()=>{log.scrollTop=log.scrollHeight;};
 function bubble(role,text){const node=make('article','kv-message kv-message-'+role);const label=make('span','kv-message-role',role==='user'?'Вы':'Помощник');const content=make('p','kv-message-text',text);node.append(label,content);log.append(node);scroll();return node;}
 function welcome(){log.replaceChildren();history=[];bubble('assistant','Спросите про условия продукта или сравните варианты. Я покажу ПВ, MIN ПВ, ФинРез и другие значения с указанием строки. Если в файле несколько вариантов, помогу их различить.');}
 function setPending(value){send.textContent=value?'■':'↑';send.setAttribute('aria-label',value?'Остановить ответ':'Отправить вопрос');input.readOnly=value;fileInput.disabled=value||importing;forgetFile.disabled=value||importing;panel.setAttribute('aria-busy',String(value));}
 function updateControls(){send.disabled=!ready;input.disabled=!ready;sourcePicker.hidden=ready&&!localKnowledge;forgetFile.hidden=!localKnowledge;for(const button of $('kv-chat-suggestions').children)button.disabled=!ready;input.placeholder=ready?'Например: условия ГигаЧат ПАК':'Сначала выберите КВ.xlsx';}
 function showLocalStatus(){ready=true;status.textContent=`${localKnowledge.records.length} строк · ${localKnowledge.filename} · на устройстве`;connectionNotice.textContent='Таблица открыта. Задайте вопрос ниже — поиск работает без сервера. Файл доступен до обновления этой страницы.';connectionNotice.hidden=false;updateControls();}
 fileInput.onchange=async()=>{
  const file=fileInput.files?.[0];if(!file||pending||importing)return;
  importing=true;fileInput.disabled=true;send.disabled=true;input.disabled=true;forgetFile.disabled=true;status.textContent='Читаю таблицу на устройстве…';
  try{const knowledge=await readKvWorkbook(file);generation++;localKnowledge=knowledge;welcome();showLocalStatus();input.focus({preventScroll:true});}
  catch(error){connectionNotice.textContent=error.message||'Не удалось прочитать книгу. Выберите сохранённую копию .xlsx.';connectionNotice.hidden=false;if(localKnowledge){ready=true;status.textContent=`${localKnowledge.records.length} строк · предыдущий файл сохранён`;}else{ready=false;status.textContent='Выберите таблицу КВ';}updateControls();}
  finally{importing=false;fileInput.disabled=false;forgetFile.disabled=false;fileInput.value='';}
 };
 forgetFile.onclick=()=>{if(pending||importing)return;generation++;localKnowledge=null;ready=false;welcome();input.value='';updateControls();checkStatus();};
 async function checkStatus(){
  if(localKnowledge){showLocalStatus();return;}
  if(checking)return;checking=true;send.disabled=true;input.disabled=true;connectionNotice.hidden=true;status.textContent='Подключаем базу знаний…';
  try{if(!kvApiBase&&location.hostname.endsWith('.github.io'))throw Object.assign(Error(),{code:'API_NOT_CONFIGURED'});const response=await fetch(new URL('status',base),{credentials:'omit',signal:AbortSignal.timeout(10000)});if(response.status===404)throw Object.assign(Error(),{code:'API_NOT_CONFIGURED'});if(!response.ok)throw Error();const data=await response.json();if(localKnowledge)return;ready=data.ready===true;status.textContent=ready?`${data.source.rows} строк · ${data.source.products} продуктов · КВ.xlsx`:'Выберите таблицу КВ';if(!ready){connectionNotice.textContent='Выберите КВ.xlsx на устройстве, чтобы начать поиск по условиям.';connectionNotice.hidden=false;}}
  catch(error){if(localKnowledge)return;ready=false;const missing=error.code==='API_NOT_CONFIGURED';status.textContent=missing?'Выберите таблицу КВ':'Сервер недоступен · можно открыть файл';connectionNotice.textContent='Нажмите «Выбрать КВ.xlsx». После выбора файла можно задавать вопросы по продуктам и условиям прямо здесь.';connectionNotice.hidden=false;}
  finally{checking=false;if(localKnowledge)showLocalStatus();else updateControls();}
 }
 function open(){panel.hidden=false;launcher.setAttribute('aria-expanded','true');checkStatus().then(()=>{if(!panel.hidden)(ready?input:fileInput).focus({preventScroll:true});});}
 function close(){panel.hidden=true;launcher.setAttribute('aria-expanded','false');launcher.focus({preventScroll:true});}
 launcher.onclick=()=>panel.hidden?open():close();$('kv-chat-close').onclick=close;
 $('kv-chat-clear').onclick=()=>{generation++;pending?.abort();pending=null;setPending(false);welcome();input.value='';input.focus();};
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden&&!document.querySelector('dialog[open]')){event.preventDefault();close();}});
 for(const text of ['Условия ГигаЧат для бизнеса ПАК','Сравни ГигаЧат ПАК и Облако','Какое ПВ у Портал DA?']){
  const button=make('button','kv-chat-suggestion',text);button.type='button';button.onclick=()=>{if(pending)return;input.value=text;if(ready)$('kv-chat-form').requestSubmit();else input.focus();};$('kv-chat-suggestions').append(button);
 }
 function fact(row){
  const details=make('details','kv-fact'),summary=make('summary','');
  summary.append(make('strong','',row.product),make('span','kv-fact-provider',row.provider));
  const pick=key=>row.fields.find(field=>field.key===key)?.value||'—';
  summary.append(make('span','kv-fact-preview',`ПВ ${pick('pvRate')} · MIN ПВ ${pick('minPv')} · НДС ${pick('vatRate')}`));details.append(summary);
  const dl=make('dl','kv-fact-fields');for(const field of row.fields){const div=make('div','');const dt=make('dt','',field.label),dd=make('dd','',field.value);dd.title=`${row.sheet}!${field.cell}`;div.append(dt,dd);dl.append(div);}
  details.append(dl,make('p','kv-fact-source',`КВ.xlsx · ${row.sheet}!${row.range}`));
  const follow=make('button','kv-fact-follow',`Уточнить по строке ${row.row}`);follow.type='button';follow.onclick=()=>{if(pending)return;input.value=`Расскажи об условиях «${row.product}», строка ${row.row}.`;input.focus();};details.append(follow);return details;
 }
 async function submit(event){
  event.preventDefault();if(pending){pending.abort();return;}if(!ready)return;
  const question=input.value.trim();if(!question)return;
  const session=generation;const controller=new AbortController();pending=controller;input.value='';bubble('user',question);const answer=bubble('assistant','Ищу условия в таблице…');answer.classList.add('is-pending');setPending(true);
  try{
   let data;
   if(localKnowledge){const found=retrieve(localKnowledge,question,history.slice(-6));data={answer:(!found.records.length&&overviewAnswer(localKnowledge,question))||tableAnswer(found),mode:'local',sources:found.records.map(publicRecord)};}
   else{const response=await fetch(new URL('chat',base),{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify({question,history:history.slice(-6)}),signal:AbortSignal.any([controller.signal,AbortSignal.timeout(35000)])});data=await response.json();if(!response.ok)throw Error(data.error||'Не удалось получить ответ. Попробуйте ещё раз.');}
   if(session!==generation)return;controller.signal.throwIfAborted();
   answer.querySelector('.kv-message-text').textContent=data.answer;answer.append(make('span','kv-answer-mode',data.mode==='deepseek'?'Пояснение DeepSeek · условия из таблицы':data.mode==='local'?'Поиск по файлу на устройстве · без ИИ':'Поиск по таблице'));
   if(data.notice)answer.append(make('p','kv-chat-notice',data.notice));
   if(Array.isArray(data.sources)&&data.sources.length){const sources=make('div','kv-chat-sources');sources.setAttribute('aria-label','Условия из исходной таблицы');for(const row of data.sources){const item=fact(row);if(data.sources.length===1)item.open=true;sources.append(item);}answer.append(sources);answer.append(make('p','kv-chat-notice','Значения сохранены в Excel. Формулы с внешними ссылками не пересчитывались.'));}
   history.push({role:'user',content:question},{role:'assistant',content:String(data.answer).slice(0,1200)});history=history.slice(-6);
  }catch(error){if(session!==generation)return;answer.querySelector('.kv-message-text').textContent=controller.signal.aborted?'Запрос остановлен.':error instanceof SyntaxError||error.message==='Failed to fetch'?'Не удалось связаться с помощником. Попробуйте ещё раз.':error.name==='TimeoutError'?'Ответ занял слишком много времени. Попробуйте ещё раз.':error.message;input.value=question;}
  finally{if(session===generation){answer.classList.remove('is-pending');pending=null;setPending(false);scroll();if(!panel.hidden)input.focus({preventScroll:true});}}
 }
 $('kv-chat-form').addEventListener('submit',submit);
 input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();$('kv-chat-form').requestSubmit();}});
 welcome();
}
