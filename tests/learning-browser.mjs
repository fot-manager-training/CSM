import assert from 'node:assert/strict';
import {browser} from './browser-support.mjs';
import {questions,competencies} from '../public/learning-data.js';
import {cases} from '../public/content.js';
import {filterCases} from '../public/catalog-data.js';
const b=await browser();
const click=async selector=>{await b.evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center',behavior:'instant'})`);await b.click(selector);};
const answer=async(q,value)=>{await click(`input[name="${q.id}"][value="${value}"]`);await click('[data-checkup=next]');};
const select=async(id,value)=>b.evaluate(`{const field=document.getElementById(${JSON.stringify(id)});field.value=${JSON.stringify(value)};field.dispatchEvent(new Event('change'));}`);
try{
 await b.viewport(1440,1100);await b.navigate('learning.html','document.querySelectorAll(".learning-course").length===4');
 await b.evaluate('localStorage.removeItem("dtaas-csm-checkup-v2");localStorage.setItem("dtaas-csm-checkup-v1",JSON.stringify({version:"csm-ai-v1",completed:true,answers:{q1:1}}));localStorage.removeItem("dtaas-csm-completed-v1")');
 await b.navigate('learning.html?clean=1','document.querySelectorAll(".learning-course").length===4');
 assert.equal(await b.evaluate('document.getElementById("fot-training-link").href'),'https://fot-manager-training.github.io/fot-manager-training/?choose-segment=1');
 assert.equal(await b.evaluate('document.querySelector("#site-navigation [aria-current=page]").dataset.page'),'learning');
 await click('[data-checkup=start]');assert.equal(await b.evaluate('document.querySelector("[data-checkup=next]").disabled'),true);
 await answer(questions[0],questions[0].correct);await click('[data-checkup=back]');assert.equal(await b.evaluate('document.querySelector("input:checked").value'),String(questions[0].correct));
 await click('[data-checkup=next]');await b.navigate('learning.html?resume=1','document.querySelector("[data-checkup=start]")');await click('[data-checkup=start]');assert.equal(await b.evaluate('document.querySelector("input").name'),questions[1].id);
 for(const q of questions.slice(1))await answer(q,q.correct);
 assert.equal(await b.evaluate('document.querySelector(".result-total-score").textContent'),'100');assert.match(await b.evaluate('document.querySelector(".result-total").textContent'),/100 из 100/);
 assert.equal(await b.evaluate('document.querySelector(".level-step.is-current>span").textContent'),'Высокий');assert.equal(await b.evaluate('document.querySelectorAll(".result-competencies dl>div").length'),8);assert.ok(await b.evaluate('document.querySelectorAll(".learning-recommendation").length>=2'));
 await b.evaluate('document.getElementById("checkup").scrollIntoView({block:"start",behavior:"instant"})');await b.screenshot('learning-result-desktop');
 await b.navigate('learning.html?restore=1','document.querySelector(".result-total-score")');assert.equal(await b.evaluate('document.querySelector(".result-total-score").textContent'),'100');
 await click('[data-checkup=restart]');for(const q of questions)await answer(q,(q.correct+1)%q.options.length);
 assert.equal(await b.evaluate('document.querySelector(".result-total-score").textContent'),'0');assert.equal(await b.evaluate('document.querySelector(".level-step.is-current>span").textContent'),'Низкий');
 assert.deepEqual(await b.evaluate('[...document.querySelectorAll(".learning-recommendation [data-course]")].slice(0,2).map(x=>x.dataset.course)'),['genai-sales','pdlc-quick']);
 await click('.learning-recommendation [data-course="genai-sales"]');await b.wait('document.getElementById("lesson-dialog").open');assert.equal(await b.evaluate('location.hash'),'#module/genai-sales');assert.equal(await b.evaluate('document.querySelectorAll(".lesson-files a").length'),2);
 assert.equal(await b.evaluate('Promise.all([...document.querySelectorAll(".lesson-files a")].map(async a=>(await fetch(a.href)).ok)).then(x=>x.every(Boolean))'),true);
 await click('#lesson-complete');assert.match(await b.evaluate('document.getElementById("course-progress").textContent'),/1 из 4/);assert.equal(await b.evaluate('document.querySelectorAll(".roadmap-step.is-complete").length'),1);assert.match(await b.evaluate('document.getElementById("route-progress").textContent'),/Изучено 1 из/);await click('#lesson-close');await b.wait('!document.getElementById("lesson-dialog").open&&location.hash===""');
 await b.navigate('learning.html?completion=1','document.querySelector(".result-total-score")');assert.match(await b.evaluate('document.getElementById("course-progress").textContent'),/1 из 4/);
 // Mixed scores must produce the measured eight-axis profile and advanced level.
 await click('[data-checkup=restart]');const targets={strategy:2,infrastructure:2,data:4,people:2,ethics:4,research:4,usage:1,value:4},seen={};
 for(const q of questions){const index=seen[q.competency]||0;seen[q.competency]=index+1;await answer(q,index<targets[q.competency]?q.correct:(q.correct+1)%4);}
 assert.equal(await b.evaluate('document.querySelector(".result-total-score").textContent'),'72');assert.equal(await b.evaluate('document.querySelector(".level-step[aria-current=step]>span").textContent'),'Продвинутый');
 assert.equal(await b.evaluate('document.querySelectorAll(".radar-wide .radar-point").length'),8);assert.equal(await b.evaluate('document.querySelectorAll(".level-step").length'),5);
 assert.equal(await b.evaluate('document.querySelectorAll(".result-competencies progress").length'),8);assert.equal(await b.evaluate('document.querySelector(".result-banner,.competency-donut")===null'),true);assert.notEqual(await b.evaluate('getComputedStyle(document.querySelector(".checkup-result")).backgroundColor'),'rgb(250, 251, 251)');
 await click('.question-review summary');assert.equal(await b.evaluate('document.querySelectorAll(".question-review article").length'),32);await click('.question-review summary');
 await click('.radar-wide [data-competency="data"]');assert.match(await b.evaluate('document.querySelector(".radar-insight").textContent'),/Данные: 4 из 4/);assert.equal(await b.evaluate('document.querySelector("[data-competency-row=data]").classList.contains("is-active")'),true);
 assert.equal(await b.evaluate('getComputedStyle(document.querySelector(".radar-wide [data-competency-label=data]")).fill'),await b.evaluate('getComputedStyle(document.querySelector("[data-competency-row=data] strong")).color'));
 await b.navigate('learning.html?mixed=1','document.querySelector(".result-total-score")');assert.equal(await b.evaluate('document.querySelector(".result-total-score").textContent'),'72');
 for(const width of [320,390,768,1440]){
  await b.viewport(width,1100);await b.evaluate('window.scrollTo({top:0,behavior:"instant"})');await b.delay(100);
  assert.equal(await b.evaluate('document.documentElement.scrollWidth<=innerWidth'),true,`learning overflow at ${width}`);
  assert.equal(await b.evaluate('document.querySelector(".seagull-section").naturalWidth>0'),true);
  await b.evaluate('document.getElementById("checkup").scrollIntoView({block:"start",behavior:"instant"})');if(width===390||width===1440)await b.screenshot('learning-radar-'+width);
  assert.equal(await b.evaluate('getComputedStyle(document.querySelector(innerWidth<=650?".radar-compact":".radar-wide")).display'), 'block');
  assert.equal(await b.evaluate('document.querySelectorAll(".level-step.is-current").length'),1);
  await click('#course-pdlc-deep [data-course]');await b.wait('document.getElementById("lesson-dialog").open');assert.equal(await b.evaluate('document.getElementById("lesson-dialog").scrollWidth<=document.getElementById("lesson-dialog").clientWidth'),true);await click('#lesson-close');
 }
 await b.navigate('cases.html','document.querySelectorAll(".case-card").length===20');const c=cases[0];
 for(const [id,value] of [['case-industry',c.industry],['case-process',c.processes[0]],['case-result',c.results[0]]])await select(id,value);
 assert.equal(await b.evaluate('document.querySelectorAll(".case-card").length'),filterCases({industry:c.industry,process:c.processes[0],result:c.results[0]}).length);
 await click('#case-reset');assert.equal(await b.evaluate('document.querySelectorAll(".case-card").length'),20);assert.equal(await b.evaluate('document.getElementById("case-more").hidden'),true);
 await b.navigate('partners.html','document.querySelectorAll(".partner-card").length===36');await click('#partner-more');assert.equal(await b.evaluate('document.querySelectorAll(".partner-card").length'),60);await click('#partner-more');assert.equal(await b.evaluate('document.querySelectorAll(".partner-card").length'),68);
 await b.navigate('events.html#event/murmansk','document.getElementById("event-dialog")?.open');assert.equal(await b.evaluate('document.querySelectorAll(".event-program li").length'),6);assert.equal(await b.evaluate('document.querySelectorAll(".event-speakers article").length'),4);await b.wait('document.querySelector(".event-qr img").naturalWidth>0');assert.equal(await b.evaluate('document.querySelector(".event-qr a").href'),'https://murmansk-digitalday.ru/');assert.match(await b.evaluate('document.querySelector(".event-qr img").alt'),/Мурманске/);assert.doesNotMatch(await b.evaluate('document.getElementById("dialog-body").textContent'),/Файл .ics добавит/);
 assert.deepEqual(b.errors,[]);console.log('PASS: 32-question checkup, back/resume, 0/72/100 points, five levels, eight-axis radar, recommendations, persisted results and course completion, seven PDFs, responsive course dialogs, combined case filters, expanded catalogs, Murmansk program and QR.');
}finally{b.close();}
