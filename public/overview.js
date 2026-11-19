import {initNavigation} from './navigation.js?v=neutral-20261117';
import {initSiteFooter} from './site-footer.js?v=events-footer-20261119';
import {events} from './data.js?v=events-footer-20261119';
import {cases,partners} from './content.js?v=neutral-20261117';
import {competencies} from './learning-data.js?v=neutral-20261117';
import {invitationText,invitationButton,initEventInvitations} from './event-invitations.js?v=events-footer-20261119';
const $=id=>document.getElementById(id);
const frame=$('overview-frame'),stage=$('overview-stage'),panel=$('overview-panel');
const tabs=[...document.querySelectorAll('[data-overview-tab]')];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let sectionIndex=0,stepIndex=0,navigationId=0,actionId=0,ready=false,busy=false,playing=!reduced.matches,inView=false,elapsed=0,last=0,pointerTarget=null;
let toastTimer;
const notify=text=>{$('toast').textContent=text;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3200);};
initNavigation();initSiteFooter();initEventInvitations({events,notify});
function savedCount(){try{const saved=JSON.parse(localStorage.getItem('dtaas-favorites')||'[]');$('saved-count').textContent=Array.isArray(saved)?saved.length:'0';}catch{$('saved-count').textContent='0';}}
savedCount();window.addEventListener('storage',savedCount);$('saved-button').onclick=()=>{location.href='./events.html?saved=1';};
$('overview-case-count').textContent=cases.length;$('overview-partner-count').textContent=partners.length;$('overview-competency-count').textContent=competencies.length;
const royal=events.find(event=>event.id==='royal');
$('overview-invitation-text').textContent=invitationText(royal,location.href);
$('overview-invitation-copy').innerHTML=invitationButton(royal);
const pauseForUser=event=>{if(!event.isTrusted)return;actionId++;busy=false;pointerTarget=null;hidePointer();setPlaying(false);controls();$('overview-status').textContent='Автообзор на паузе. Вы управляете платформой самостоятельно.';};
$('overview-invitation').addEventListener('pointerdown',pauseForUser);$('overview-invitation').addEventListener('keydown',pauseForUser);
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function doc(){return frame.contentDocument;}
function query(selector){return doc()?.querySelector(selector);}
function click(selector){const element=query(selector);if(!element)throw Error('Control unavailable');element.click();}
function change(selector,value){const element=query(selector);if(!element)throw Error('Filter unavailable');element.value=value;element.dispatchEvent(new frame.contentWindow.Event(element.tagName==='INPUT'?'input':'change',{bubbles:true}));}
function closeDialog(){const dialog=query('dialog[open]');if(!dialog)return;const close=dialog.querySelector('.dialog-close');if(close)close.click();else dialog.close();}
async function until(predicate,valid,timeout=12000){const nav=navigationId,action=actionId,end=performance.now()+timeout;while(performance.now()<end){if(!valid()||nav!==navigationId||action!==actionId)throw new DOMException('Preview changed','AbortError');try{if(predicate())return true;}catch{}await wait(60);}throw Error('Preview timed out');}
const step=(title,description,target,part,run=()=>{},duration=5200)=>({title,description,target,part,run,duration});
const sections=[
 {id:'events',title:'Мероприятия',path:'events.html',ready:'.event-card',parts:['Выбрать событие','Посмотреть программу','Пригласить клиента'],steps:[
  step('Выберите событие на своей волне','Форматы, города и даты — в одной афише.','#search',0),
  step('Листайте афишу','Крупные карточки помогают быстро познакомиться с событиями.','.afisha-spotlight',0,()=>click('#spotlight-next')),
  step('Найдите встречу в нужном городе','Фильтры помогают выбрать событие под вашу задачу.','#region',0,()=>change('#region','Санкт-Петербург')),
  step('Откройте карточку Акселератора','Дата, площадка, условия участия и программа — внутри карточки.','#event-dialog .dialog-content h2',1,async()=>{click('#events-grid [data-open="royal"]');await until(()=>query('#event-dialog[open]'),()=>ready);}),
  step('Посмотрите, что будет на встрече','Программа и выступления экспертов доступны прямо на платформе.','#event-dialog .event-program',1),
  step('Приглашение для клиента уже готово','Скопируйте текст и отправьте его клиенту удобным способом.','#event-dialog .dialog-actions',2,()=>{$('overview-invitation').hidden=false;},7000),
  step('Смотрите события в календаре','Мини-превью и цветовые обозначения помогают ориентироваться в афише.','#calendar',0,()=>{closeDialog();click('#reset');click('#calendar-view');})
 ]},
 {id:'cases',title:'Бизнес-кейсы',path:'cases.html',ready:'.case-card',parts:['Найти похожую задачу','Разобрать решение','Оценить эффект'],steps:[
  step('Начните с задач бизнеса','В кейсбуке собраны проекты из разных отраслей.','#case-grid',0),
  step('Найдите нужный опыт','Поиск работает по клиенту, задаче и технологии.','#case-search',0,()=>change('#case-search','Петергоф')),
  step('Разберите проект Петергофа','Откройте описание решения, процессы и этап проекта.','#catalog-dialog-title',1,async()=>{click('.case-card h3 a');await until(()=>query('#catalog-dialog[open]'),()=>ready);}),
  step('Посмотрите показатели проекта','Для этого кейса отдельно указаны показатели MVP: 4 часа → 10 минут и +30% к точности оценки.','.case-results',2),
  step('Переходите к следующему кейсу','Сравнивайте подходы и находите идеи для своих бизнес-задач.','#case-grid',0,()=>{closeDialog();click('#case-reset');})
 ]},
 {id:'partners',title:'Партнёры',path:'partners.html',ready:'.partner-card',parts:['Найти команду','Изучить компетенции','Посмотреть контакты'],steps:[
  step('Найдите команду под задачу','В каталоге — вендоры, интеграторы, разработчики и консультанты.','#partner-grid',0),
  step('Уточните, какая экспертиза нужна','Ищите по названию, ИНН, отрасли или технологии.','#partner-search',0,()=>change('#partner-search','РАМАКС')),
  step('Изучите компетенции партнёра','В карточке — направления работы, технологии и отрасли.','#catalog-dialog-title',1,async()=>{click('.partner-card h3 a');await until(()=>query('#catalog-dialog[open]'),()=>ready);}),
  step('Все контакты — в карточке','Выберите, с кем обсудить задачу и следующий шаг проекта.','.partner-contacts',2),
  step('Сравните разные команды','Подбирайте партнёров по роли, технологии и аккредитации.','#partner-role',0,()=>{closeDialog();click('#partner-reset');change('#partner-role','Интегратор');})
 ]},
 {id:'learning',title:'Обучение CSM',path:'learning.html',ready:'.learning-course',parts:['Проверить знания','Выбрать модуль','Построить маршрут'],steps:[
  step('Проверьте готовность к разговору об ИИ','Чекап охватывает 8 компетенций и рабочие ситуации CSM.','#checkup',0),
  step('Попробуйте формат чекапа','Отвечайте на ситуации из практики. Обзор не выбирает ответы за вас.','#checkup-view',0,()=>{if(query('[data-checkup="start"]'))click('[data-checkup="start"]');}),
  step('Выберите, что изучить дальше','Короткие модули помогают подготовиться к разговору с клиентом.','#course-grid',1),
  step('Откройте обучающий модуль','Изучайте материалы и возвращайтесь к ним по мере практики.','#lesson-body',1,async()=>{click('#course-grid [data-course]');await until(()=>query('#lesson-dialog[open]'),()=>ready);}),
  step('Развивайтесь по личному маршруту','После прохождения чекапа появится дорожная карта с персональными рекомендациями.','#course-grid',2,()=>{closeDialog();})
 ]},
 {id:'chat',title:'Чат-бот',path:'index.html',ready:'.kv-chat-launcher',parts:['Открыть чат','Узнать возможности','Задать свой вопрос'],steps:[
  step('Помощник — всегда рядом','Откройте чат-бот и работайте с общей базой КВ.','.kv-chat-panel',0,()=>click('.kv-chat-launcher')),
  step('Посмотрите, с чем поможет чат-бот','Найти показатели, сравнить условия или выбрать вариант продукта.','.kv-helper-menu',1,async()=>{await until(()=>query('#kv-chat-input:not(:disabled)'),()=>ready,25000);click('.kv-chip-primary');},6500),
  step('Спросите о том, что вам нужно','Введите свой вопрос или выберите пример в чате. Обзор не отправляет сообщения за вас.','#kv-chat-input',2)
 ]}
];
function setPlaying(value){playing=value;last=0;panel.dataset.playing=String(value);$('overview-auto').setAttribute('aria-pressed',String(value));$('overview-auto').querySelector('span').textContent=value?'Пауза':'Автообзор';$('overview-auto-icon').setAttribute('d',value?'M7 5h4v14H7zM15 5h4v14h-4z':'m8 5 11 7-11 7Z');}
function controls(){stage.dataset.busy=String(busy);$('overview-next').disabled=busy;$('overview-previous').disabled=busy;}
function hidePointer(){$('overview-pointer').hidden=true;$('overview-highlight').hidden=true;}
function scrollInFrame(element){
 if(!element)return;const win=frame.contentWindow,r=element.getBoundingClientRect(),dialog=element.closest('dialog');
 if(dialog){const dr=dialog.getBoundingClientRect();if(element!==dialog)dialog.scrollTo({top:dialog.scrollTop+r.top-dr.top-65,behavior:reduced.matches?'instant':'smooth'});}
 else win.scrollTo({top:Math.max(0,win.scrollY+r.top-95),behavior:reduced.matches?'instant':'smooth'});
}
function pointer(){
 if(!pointerTarget?.isConnected||!ready||busy||!playing){hidePointer();return;}
 const r=pointerTarget.getBoundingClientRect(),height=stage.clientHeight,width=stage.clientWidth;
 if(r.bottom<=0||r.top>=height||r.right<=0||r.left>=width){hidePointer();return;}
 const left=Math.max(4,r.left-5),top=Math.max(4,r.top-5),w=Math.min(width-left-4,r.width+10),h=Math.min(height-top-4,r.height+10);
 const highlight=$('overview-highlight');highlight.hidden=false;highlight.style.cssText=`left:${left}px;top:${top}px;width:${w}px;height:${h}px`;
 const cursor=$('overview-pointer');cursor.hidden=false;cursor.style.left=Math.min(width-32,Math.max(8,r.left+Math.min(r.width*.7,200)))+'px';cursor.style.top=Math.min(height-37,Math.max(8,r.top+Math.min(r.height*.6,65)))+'px';
}
function detailClose(){const button=$('overview-close-detail');let dialog;try{dialog=ready?query('dialog[open]'):null;}catch{}button.hidden=!dialog;if(dialog){const r=dialog.getBoundingClientRect();button.style.left=Math.min(stage.clientWidth-44,Math.max(8,r.right-46))+'px';button.style.top=Math.max(10,r.top+11)+'px';}}
$('overview-close-detail').addEventListener('click',()=>{actionId++;busy=false;setPlaying(false);closeDialog();$('overview-invitation').hidden=true;pointerTarget=null;hidePointer();controls();detailClose();});
function setParts(){
 const section=sections[sectionIndex];$('overview-steps').replaceChildren(...section.parts.map((text,index)=>{const button=document.createElement('button');button.type='button';const marker=document.createElement('b');marker.textContent=String(index+1).padStart(2,'0');button.append(marker,document.createTextNode(text));button.dataset.overviewPart=String(index);button.addEventListener('click',()=>{setPlaying(false);const target=section.steps.findIndex(step=>step.part===index);loadSection(sectionIndex,target);});return button;}));
}
function caption(index){
 const section=sections[sectionIndex],step=section.steps[index];stepIndex=index;
 $('overview-step-count').textContent=`ШАГ ${String(index+1).padStart(2,'0')} / ${String(section.steps.length).padStart(2,'0')}`;
 $('overview-step-title').textContent=step.title;$('overview-step-description').textContent=step.description;
 $('overview-status').textContent=`${section.title}. ${step.title}. ${step.description}`;
 for(const [i,button] of [...$('overview-steps').children].entries()){if(i===step.part)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');}
 panel.dataset.section=section.id;panel.dataset.step=String(index);elapsed=0;last=0;
}
async function runStep(index,{replay=false}={}){
 const token=++actionId,nav=navigationId,step=sections[sectionIndex].steps[index];busy=true;controls();hidePointer();$('overview-invitation').hidden=true;
 if(!replay)caption(index);
 try{
  const previousDialog=query('dialog[open]');await step.run();if(token!==actionId||nav!==navigationId)return;
  const element=query(step.target);if(!element)throw Error('Preview target unavailable');
  const openedDialog=query('dialog[open]');pointerTarget=openedDialog&&openedDialog!==previousDialog?openedDialog:element;if(!replay&&pointerTarget===element)scrollInFrame(element);
  if(replay)$('overview-invitation').hidden=true;
 }catch{if(token===actionId&&nav===navigationId){setPlaying(false);$('overview-step-description').textContent='Можно продолжить самостоятельно внутри окна или открыть раздел целиком.';}}
 finally{if(token===actionId&&nav===navigationId){busy=false;controls();last=0;}}
}
function decorate(){
 const child=doc();if(!child)return;
 const style=child.createElement('style');style.textContent=`html{scroll-padding-top:20px!important}.header,.footer,.site-feedback,.overview-home-link{display:none!important}body main,.afisha-page{padding-top:24px!important}.hero{padding-top:0!important}body[data-page=home] main>section:not(.hero){display:none!important}body[data-page=home] .hero{min-height:100vh}.kv-chat-launcher{${sections[sectionIndex].id==='chat'?'':'display:none!important;'}}`;
 child.head.append(style);
 child.addEventListener('pointerdown',pauseForUser,true);child.addEventListener('keydown',pauseForUser,true);
 child.addEventListener('click',event=>{
  if(!event.isTrusted)return;const anchor=event.target.closest('a[href]');if(!anchor||anchor.target==='_blank'||anchor.hasAttribute('download'))return;
  const url=new URL(anchor.href);if(url.origin!==location.origin)return;
  const index=sections.findIndex(section=>url.pathname.endsWith('/'+section.path));
  if(index<0||url.pathname===frame.contentWindow.location.pathname)return;
  event.preventDefault();setPlaying(false);loadSection(index);
 },true);
 const wave=child.querySelector('.hero-wave,.catalog-curve');if(reduced.matches)wave?.pauseAnimations?.();
}
async function loadSection(index,target=0){
 try{const child=doc();for(const dialog of child?.querySelectorAll('dialog[open]')||[])dialog.close();for(const popover of child?.querySelectorAll('[popover]')||[])if(popover.matches(':popover-open'))popover.hidePopover();if(document.activeElement===frame)frame.blur();}catch{}
 const token=++navigationId;actionId++;sectionIndex=(index+sections.length)%sections.length;stepIndex=0;ready=false;busy=true;elapsed=0;last=0;pointerTarget=null;controls();hidePointer();$('overview-invitation').hidden=true;stage.dataset.ready='false';$('overview-loading').hidden=false;$('overview-retry').hidden=true;
 $('overview-loading').querySelector('strong').textContent='Открываем платформу';$('overview-loading').querySelector('p').textContent='Сейчас здесь появится живой обзор.';
 const section=sections[sectionIndex];tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===sectionIndex));tab.tabIndex=i===sectionIndex?0:-1;});
 const tabBounds=tabs[sectionIndex].getBoundingClientRect(),tabTrack=document.querySelector('.overview-tabs'),trackBounds=tabTrack.getBoundingClientRect();if(tabBounds.left<trackBounds.left)tabTrack.scrollLeft-=trackBounds.left-tabBounds.left+8;else if(tabBounds.right>trackBounds.right)tabTrack.scrollLeft+=tabBounds.right-trackBounds.right+8;
 panel.setAttribute('aria-labelledby','overview-tab-'+section.id);$('overview-browser-label').textContent='DTaaS СЗБ / '+section.title;
 $('overview-open-section').href='./'+section.path;frame.title='Живой обзор раздела «'+section.title+'»';setParts();caption(0);
 const url=new URL('./'+section.path,location.href);url.searchParams.set('overview-preview',section.id);frame.src=url.href;
 try{
  const loaded=await until(()=>frame.contentWindow.location.pathname===url.pathname&&query(section.ready),()=>token===navigationId,16000);if(!loaded||token!==navigationId)return;
  decorate();ready=true;stage.dataset.ready='true';$('overview-loading').hidden=true;
  for(let i=0;i<target;i++){await runStep(i,{replay:true});if(token!==navigationId)return;}
  if(token===navigationId)await runStep(target);
 }catch{if(token!==navigationId)return;busy=false;setPlaying(false);controls();$('overview-loading').querySelector('strong').textContent='Раздел пока не открылся';$('overview-loading').querySelector('p').textContent='Попробуйте ещё раз или откройте раздел по ссылке над окном.';$('overview-retry').hidden=false;}
}
async function advance(direction){
 if(busy)return;const section=sections[sectionIndex],target=stepIndex+direction;
 if(target>=section.steps.length){await loadSection(sectionIndex+1);return;}
 if(target<0){const previous=(sectionIndex-1+sections.length)%sections.length;await loadSection(previous,sections[previous].steps.length-1);return;}
 if(direction<0)await loadSection(sectionIndex,target);else await runStep(target);
}
for(const [index,tab] of tabs.entries()){
 tab.addEventListener('click',()=>loadSection(index));
 tab.addEventListener('keydown',event=>{if(!['ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[next].focus({preventScroll:true});loadSection(next);});
}
for(const button of document.querySelectorAll('[data-open-overview]'))button.addEventListener('click',()=>{const index=sections.findIndex(section=>section.id===button.dataset.openOverview);loadSection(index);$('explore').scrollIntoView({behavior:reduced.matches?'instant':'smooth'});});
$('overview-auto').addEventListener('click',()=>{if(playing){setPlaying(false);if(ready&&busy){actionId++;busy=false;controls();}}else{setPlaying(true);loadSection(sectionIndex);}});
$('overview-next').addEventListener('click',()=>{setPlaying(false);advance(1);});
$('overview-previous').addEventListener('click',()=>{setPlaying(false);advance(-1);});
$('overview-retry').addEventListener('click',()=>loadSection(sectionIndex));
const fullscreen=$('overview-fullscreen');fullscreen.hidden=!(panel.requestFullscreen&&document.fullscreenEnabled);
fullscreen.addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await panel.requestFullscreen();}catch{notify('Продолжайте обзор в окне браузера');}});
document.addEventListener('fullscreenchange',()=>{fullscreen.setAttribute('aria-label',document.fullscreenElement?'Выйти из полноэкранного режима':'Развернуть обзор на весь экран');});
new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;last=0;},{threshold:.1}).observe(stage);
document.addEventListener('visibilitychange',()=>{last=0;});
reduced.addEventListener('change',()=>{if(reduced.matches)setPlaying(false);updateWave();});
function updateWave(){const wave=document.querySelector('.overview-wave');if(reduced.matches||document.hidden)wave.pauseAnimations();else wave.unpauseAnimations();}
document.addEventListener('visibilitychange',updateWave);updateWave();
function tick(now){
 if(last&&playing&&ready&&!busy&&inView&&!document.hidden){elapsed+=now-last;const section=sections[sectionIndex],step=section.steps[stepIndex];if(elapsed>=step.duration){elapsed=0;advance(1);}}
 last=now;const section=sections[sectionIndex];tabs[sectionIndex].style.setProperty('--overview-progress',String((stepIndex+Math.min(1,elapsed/section.steps[stepIndex].duration))/section.steps.length));pointer();detailClose();requestAnimationFrame(tick);
}
setPlaying(playing);loadSection(0);requestAnimationFrame(tick);
