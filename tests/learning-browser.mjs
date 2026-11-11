import assert from 'node:assert/strict';
import {browser} from './browser-support.mjs';
import {questions} from '../public/learning-data.js';
import {cases} from '../public/content.js';
import {filterCases} from '../public/catalog-data.js';
const b=await browser();
const click=async selector=>{await b.evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center',behavior:'instant'})`);await b.click(selector);};
const answer=async(q,value)=>{await click(`input[name="${q.id}"][value="${value}"]`);await click('[data-checkup=next]');};
const select=async(id,value)=>b.evaluate(`{const field=document.getElementById(${JSON.stringify(id)});field.value=${JSON.stringify(value)};field.dispatchEvent(new Event('change'));}`);
try{
 await b.viewport(1440,1100);await b.navigate('learning.html','document.querySelectorAll(".learning-course").length===4');
 await b.evaluate('localStorage.removeItem("dtaas-csm-checkup-v1");localStorage.removeItem("dtaas-csm-completed-v1")');
 await b.navigate('learning.html?clean=1','document.querySelectorAll(".learning-course").length===4');
 assert.equal(await b.evaluate('document.getElementById("fot-training-link").href'),'https://fot-manager-training.github.io/fot-manager-training/?choose-segment=1');
 assert.equal(await b.evaluate('document.querySelector("#site-navigation [aria-current=page]").dataset.page'),'learning');
 await click('[data-checkup=start]');assert.equal(await b.evaluate('document.querySelector("[data-checkup=next]").disabled'),true);
 await answer(questions[0],questions[0].correct);await click('[data-checkup=back]');assert.equal(await b.evaluate('document.querySelector("input:checked").value'),String(questions[0].correct));
 await click('[data-checkup=next]');await b.navigate('learning.html?resume=1','document.querySelector("[data-checkup=start]")');await click('[data-checkup=start]');assert.equal(await b.evaluate('document.querySelector("input").name'),'q2');
 for(const q of questions.slice(1))await answer(q,q.correct);
 assert.equal(await b.evaluate('document.querySelector(".donut-total").textContent'),'100');assert.match(await b.evaluate('document.querySelector(".competency-donut").getAttribute("aria-label")'),/100 из 100/);
 assert.equal(await b.evaluate('document.getElementById("checkup-title").textContent'),'Экспертный');assert.equal(await b.evaluate('document.querySelectorAll(".result-competencies progress").length'),5);assert.ok(await b.evaluate('document.querySelectorAll(".learning-recommendation").length>=2'));
 await b.evaluate('document.getElementById("checkup").scrollIntoView({block:"start",behavior:"instant"})');await b.screenshot('learning-result-desktop');
 await b.navigate('learning.html?restore=1','document.querySelector(".donut-total")');assert.equal(await b.evaluate('document.querySelector(".donut-total").textContent'),'100');
 await click('[data-checkup=restart]');for(const q of questions)await answer(q,(q.correct+1)%q.options.length);
 assert.equal(await b.evaluate('document.querySelector(".donut-total").textContent'),'0');assert.equal(await b.evaluate('document.getElementById("checkup-title").textContent'),'Стартовый');
 assert.deepEqual(await b.evaluate('[...document.querySelectorAll(".learning-recommendation [data-course]")].slice(0,2).map(x=>x.dataset.course)'),['genai-sales','pdlc-quick']);
 await click('.learning-recommendation [data-course="genai-sales"]');await b.wait('document.getElementById("lesson-dialog").open');assert.equal(await b.evaluate('location.hash'),'#module/genai-sales');assert.equal(await b.evaluate('document.querySelectorAll(".lesson-files a").length'),2);
 assert.equal(await b.evaluate('Promise.all([...document.querySelectorAll(".lesson-files a")].map(async a=>(await fetch(a.href)).ok)).then(x=>x.every(Boolean))'),true);
 await click('#lesson-complete');assert.match(await b.evaluate('document.getElementById("course-progress").textContent'),/1 из 4/);await click('#lesson-close');await b.wait('!document.getElementById("lesson-dialog").open&&location.hash===""');
 await b.navigate('learning.html?completion=1','document.querySelector(".donut-total")');assert.match(await b.evaluate('document.getElementById("course-progress").textContent'),/1 из 4/);
 for(const width of [320,390,768,1440]){
  await b.viewport(width,1100);await b.evaluate('window.scrollTo({top:0,behavior:"instant"})');await b.delay(100);
  assert.equal(await b.evaluate('document.documentElement.scrollWidth<=innerWidth'),true,`learning overflow at ${width}`);
  assert.equal(await b.evaluate('document.querySelector(".seagull-section").naturalWidth>0'),true);
  await b.evaluate('document.getElementById("checkup").scrollIntoView({block:"start",behavior:"instant"})');if(width===390)await b.screenshot('learning-result-mobile');
  await click('#course-pdlc-deep [data-course]');await b.wait('document.getElementById("lesson-dialog").open');assert.equal(await b.evaluate('document.getElementById("lesson-dialog").scrollWidth<=document.getElementById("lesson-dialog").clientWidth'),true);await click('#lesson-close');
 }
 await b.navigate('cases.html','document.querySelectorAll(".case-card").length===20');const c=cases[0];
 for(const [id,value] of [['case-industry',c.industry],['case-process',c.processes[0]],['case-result',c.results[0]]])await select(id,value);
 assert.equal(await b.evaluate('document.querySelectorAll(".case-card").length'),filterCases({industry:c.industry,process:c.processes[0],result:c.results[0]}).length);
 await click('#case-reset');assert.equal(await b.evaluate('document.querySelectorAll(".case-card").length'),20);assert.equal(await b.evaluate('document.getElementById("case-more").hidden'),true);
 await b.navigate('partners.html','document.querySelectorAll(".partner-card").length===36');await click('#partner-more');assert.equal(await b.evaluate('document.querySelectorAll(".partner-card").length'),60);await click('#partner-more');assert.equal(await b.evaluate('document.querySelectorAll(".partner-card").length'),68);
 await b.navigate('events.html#event/murmansk','document.getElementById("event-dialog")?.open');assert.equal(await b.evaluate('document.querySelectorAll(".event-program li").length'),6);assert.equal(await b.evaluate('document.querySelectorAll(".event-speakers article").length'),4);await b.wait('document.querySelector(".event-qr img").naturalWidth>0');assert.equal(await b.evaluate('document.querySelector(".event-qr a").href'),'https://murmansk-digitalday.ru/');assert.match(await b.evaluate('document.querySelector(".event-qr img").alt'),/Мурманске/);assert.doesNotMatch(await b.evaluate('document.getElementById("dialog-body").textContent'),/Файл .ics добавит/);
 assert.deepEqual(b.errors,[]);console.log('PASS: checkup answers/back/resume/0 and 100 points, competencies, recommendations, persisted results and course completion, seven PDFs, responsive course dialogs, combined case filters, expanded catalogs, Murmansk program and QR.');
}finally{b.close();}
