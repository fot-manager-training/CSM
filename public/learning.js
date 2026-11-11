import {renderAssessmentResult} from './learning-results.js?v=report-dark-20261111';
import {assessmentVersion,competencies,courses,questions,gradeAssessment,recommendCourses,fotTrainingUrl} from './learning-data.js?v=report-dark-20261111';
const $=id=>document.getElementById(id);
const safe=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const storageKey='dtaas-csm-checkup-v2',courseKey='dtaas-csm-completed-v1';
export function initLearning({iconize,notify}){
 let answers={},index=0,completed=false,done=new Set(),activeCourse=null;
 try{const saved=JSON.parse(localStorage.getItem(storageKey)||'null');if(saved?.version===assessmentVersion){for(const q of questions)if(Number.isInteger(saved.answers?.[q.id])&&saved.answers[q.id]>=0&&saved.answers[q.id]<q.options.length)answers[q.id]=saved.answers[q.id];index=Math.min(questions.length-1,Math.max(0,Math.floor(Number(saved.index))||0));completed=saved.completed===true&&questions.every(q=>Number.isInteger(answers[q.id]));}}catch{}
 try{const saved=JSON.parse(localStorage.getItem(courseKey)||'[]');if(Array.isArray(saved))done=new Set(saved.filter(id=>courses.some(c=>c.id===id)));}catch{}
 const view=$('checkup-view'),dialog=$('lesson-dialog');
 const persist=()=>{try{localStorage.setItem(storageKey,JSON.stringify({version:assessmentVersion,answers,index,completed}));}catch{}};
 const courseButton=(id,label='Начать модуль')=>`<button class="primary-button" data-course="${id}" aria-haspopup="dialog" aria-controls="lesson-dialog">${label} ↗</button>`;
 function renderCourses(){
  $('course-progress').textContent=`Изучено ${done.size} из ${courses.length} модулей`;
  $('course-grid').innerHTML=courses.map((c,i)=>`<article class="learning-course" id="course-${c.id}"><div class="learning-course-top"><span>${String(i+1).padStart(2,'0')}</span><span>${safe(c.time)} · ${done.has(c.id)?'Изучен ✓':'Краткий модуль'}</span></div><span class="learning-tag">${safe(c.tag)}</span><h3>${safe(c.title)}</h3><p>${safe(c.summary)}</p><div class="learning-course-actions">${courseButton(c.id,done.has(c.id)?'Повторить модуль':'Начать модуль')}<a href="${c.files[0].href}" target="_blank" rel="noopener noreferrer">Выжимка PDF ↗</a></div></article>`).join('');iconize($('course-grid'));
 }
 function welcome(){view.innerHTML=`<div class="checkup-intro"><div><span class="eyebrow">ЧЕКАП CSM · ОКОЛО 12 МИНУТ</span><h2 id="checkup-title">Готовы к разговору<br>об ИИ-трансформации?</h2><p>${questions.length} ситуации из работы CSM по ${competencies.length} компетенциям. Проверьте, как вы находите задачу клиента, оцениваете эффект и планируете внедрение.</p><button class="primary-button" data-checkup="start">${Object.keys(answers).length?'Продолжить чекап':'Пройти чекап'} ↗</button></div><div class="checkup-competency-intro">${competencies.map((c,i)=>`<div><span style="--competency:${c.color}">${String(i+1).padStart(2,'0')}</span><p><strong>${safe(c.title)}</strong>${safe(c.description)}</p></div>`).join('')}</div></div>`;iconize(view);}
 function question(){
  const q=questions[index],c=competencies.find(c=>c.id===q.competency);
  view.innerHTML=`<div class="question-header"><span>Вопрос ${index+1} из ${questions.length}</span><span>${safe(c.title)}</span></div><progress class="question-progress" value="${index}" max="${questions.length}" aria-label="Прогресс чекапа"></progress><fieldset class="question-fieldset"><legend id="question-title" tabindex="-1">${safe(q.prompt)}</legend><div class="question-options">${q.options.map((text,i)=>`<label class="question-option"><input type="radio" name="${q.id}" value="${i}" ${answers[q.id]===i?'checked':''}><span>${safe(text)}</span></label>`).join('')}</div></fieldset><div class="question-actions"><button class="outline-button" data-checkup="back" ${index===0?'disabled':''}>Назад</button><button class="primary-button" data-checkup="next" ${Number.isInteger(answers[q.id])?'':'disabled'}>${index===questions.length-1?'Узнать результат':'Далее'} ↗</button></div>`;
  iconize(view);$('question-title').focus({preventScroll:true});$('checkup').scrollIntoView({block:'start',behavior:'instant'});
 }
 function results(){
  const result=gradeAssessment(answers);completed=true;persist();
  view.innerHTML=renderAssessmentResult(result)+`<details class="question-review"><summary>Посмотреть разбор ответов</summary>${questions.map(q=>`<article><h4>${safe(q.prompt)}</h4><p class="${answers[q.id]===q.correct?'answer-correct':'answer-incorrect'}">Ваш ответ: ${safe(q.options[answers[q.id]])}</p>${answers[q.id]!==q.correct?`<p>Правильный ответ: ${safe(q.options[q.correct])}</p>`:''}<p>${safe(q.explanation)}</p></article>`).join('')}</details>`;
  const recommendations=recommendCourses(result);$('learning-route').hidden=false;
  $('recommended-courses').innerHTML=recommendations.map(({course:c,reason},i)=>`<article class="learning-recommendation"><span class="learning-tag">Шаг ${i+1}</span><h3>${safe(c.title)}</h3><p>${safe(reason)}</p>${courseButton(c.id)}</article>`).join('');iconize(view);iconize($('recommended-courses'));
 }
 view.addEventListener('change',event=>{if(event.target.matches('input[type=radio]')){const q=questions[index];answers[q.id]=Number(event.target.value);persist();view.querySelector('[data-checkup=next]').disabled=false;}});
 view.addEventListener('click',event=>{const action=event.target.closest('[data-checkup]')?.dataset.checkup;if(!action)return;
  if(action==='restart'){answers={};index=0;completed=false;$('learning-route').hidden=true;persist();question();}
  if(action==='start'){index=questions.findIndex(q=>!Number.isInteger(answers[q.id]));if(index<0)index=0;question();}
  if(action==='back'&&index>0){index--;persist();question();}
  if(action==='next'&&Number.isInteger(answers[questions[index].id])){if(index===questions.length-1){const missing=questions.findIndex(q=>!Number.isInteger(answers[q.id]));if(missing>=0){index=missing;question();}else{results();$('checkup-title').tabIndex=-1;$('checkup-title').focus({preventScroll:true});$('checkup').scrollIntoView({block:'start',behavior:'instant'});}}else{index++;persist();question();}}
 });
 function routeCourse(){const id=location.hash.startsWith('#module/')?location.hash.slice(8):null,c=courses.find(c=>c.id===id);if(!c){if(dialog.open)dialog.close();return;}activeCourse=c.id;
  $('lesson-body').innerHTML=`<div class="lesson-content"><span class="eyebrow">${safe(c.tag)} · ${safe(c.time)}</span><h2 id="lesson-title">${safe(c.title)}</h2><p class="lesson-subtitle">${safe(c.subtitle)}</p>${c.sections.map((section,i)=>`<section><span class="learning-tag">${String(i+1).padStart(2,'0')}</span><h3>${safe(section.title)}</h3><p>${safe(section.body)}</p></section>`).join('')}<section class="lesson-checklist"><h3>Примените в работе</h3><ul>${c.checklist.map(text=>`<li>${safe(text)}</li>`).join('')}</ul></section><h3>Материалы модуля</h3><div class="lesson-files">${c.files.map(f=>`<a class="outline-button" href="${f.href}" target="_blank" rel="noopener noreferrer">${safe(f.title)} ↗</a>`).join('')}</div><button class="primary-button" id="lesson-complete">${done.has(c.id)?'Изучено ✓ · снять отметку':'Отметить модуль изученным'}</button></div>`;
  $('lesson-complete').onclick=()=>{done.has(c.id)?done.delete(c.id):done.add(c.id);try{localStorage.setItem(courseKey,JSON.stringify([...done]));}catch{}renderCourses();$('lesson-complete').textContent=done.has(c.id)?'Изучено ✓ · снять отметку':'Отметить модуль изученным';notify(done.has(c.id)?'Модуль отмечен как изученный':'Отметка снята');};iconize($('lesson-body'));if(!dialog.open)dialog.showModal();
 }
 document.addEventListener('click',event=>{const button=event.target.closest('[data-course]');if(button){if(location.hash==='#module/'+button.dataset.course)routeCourse();else location.hash='module/'+button.dataset.course;}});
 $('lesson-close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{if(location.hash.startsWith('#module/'))history.replaceState(null,'',location.pathname+location.search);document.querySelector(`[data-course="${activeCourse}"]`)?.focus({preventScroll:true});activeCourse=null;});
 dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
 window.addEventListener('hashchange',routeCourse);
 $('fot-training-link').href=fotTrainingUrl;renderCourses();completed?results():welcome();routeCourse();
}
