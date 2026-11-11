import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {competencies,courses,questions,gradeAssessment,recommendCourses} from '../public/learning-data.js';
import {cases} from '../public/content.js';
import {filterCases} from '../public/catalog-data.js';
const answersFor=n=>Object.fromEntries(questions.map((q,i)=>[q.id,i<n?q.correct:(q.correct+1)%q.options.length]));
test('ten questions balance the five competencies; score and level boundaries are consistent',()=>{
 assert.equal(questions.length,10);assert.equal(new Set(questions.map(q=>q.id)).size,10);
 for(const c of competencies)assert.equal(questions.filter(q=>q.competency===c.id).length,2);
 for(const [correct,level] of [[0,'Стартовый'],[3,'Стартовый'],[4,'Практический'],[6,'Практический'],[7,'Продвинутый'],[8,'Продвинутый'],[9,'Экспертный'],[10,'Экспертный']]){
  const result=gradeAssessment(answersFor(correct));assert.equal(result.total,correct*10);assert.equal(result.level,level);assert.equal(result.competencies.reduce((sum,c)=>sum+c.score,0),result.total);
 }
 assert.ok(gradeAssessment(answersFor(10)).competencies.every(c=>c.score===20&&c.percent===100));
});
test('incomplete or invalid answers never produce an assessment result',()=>{
 for(const answers of [null,{}, {...answersFor(10),q1:4},{...answersFor(10),q1:-1},{...answersFor(10),q1:'1'}])assert.throws(()=>gradeAssessment(answers),TypeError);
});
test('recommendations respond to weak competencies and remain unique',()=>{
 const starter=recommendCourses(gradeAssessment(answersFor(0)));assert.deepEqual(starter.slice(0,2).map(x=>x.course.id),['genai-sales','pdlc-quick']);
 const answers=answersFor(10);for(const q of questions.filter(q=>q.competency==='governance'))answers[q.id]=(q.correct+1)%4;
 assert.equal(recommendCourses(gradeAssessment(answers))[0].course.id,'pdlc-deep');
 for(let score=0;score<=10;score++){const list=recommendCourses(gradeAssessment(answersFor(score)));assert.ok(list.length>0&&list.length<=3);assert.equal(new Set(list.map(x=>x.course.id)).size,list.length);assert.ok(list.every(x=>x.reason));}
});
test('every advertised PDF exists and has a PDF signature',async()=>{
 const files=courses.flatMap(c=>c.files);assert.equal(new Set(files.map(f=>f.href)).size,7);
 for(const file of files){const buffer=await readFile(new URL('../public/'+file.href,import.meta.url));assert.equal(buffer.subarray(0,4).toString(),'%PDF');}
});
test('industry, changed process and outcome filters combine without changing metric context',()=>{
 assert.ok(cases.every(c=>c.industry&&c.processes.length&&c.results.length));
 for(const c of cases){const selected=filterCases({industry:c.industry,process:c.processes[0],result:c.results[0]});assert.ok(selected.some(x=>x.id===c.id));assert.ok(selected.every(x=>x.industry===c.industry&&x.processes.includes(c.processes[0])&&x.results.includes(c.results[0])));}
 assert.equal(filterCases({result:'Нет такого результата'}).length,0);assert.equal(filterCases().length,20);
});
