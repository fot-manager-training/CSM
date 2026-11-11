import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {competencies,courses,questions,assessmentLevels,gradeAssessment,recommendCourses} from '../public/learning-data.js';
import {radarGeometry} from '../public/learning-results.js';
import {cases} from '../public/content.js';
import {filterCases} from '../public/catalog-data.js';
const answersFor=n=>Object.fromEntries(questions.map((q,i)=>[q.id,i<n?q.correct:(q.correct+1)%q.options.length]));
test('32 questions balance eight competencies and five level boundaries remain consistent',()=>{
 assert.equal(questions.length,32);assert.equal(competencies.length,8);assert.equal(new Set(questions.map(q=>q.id)).size,32);
 for(const c of competencies)assert.equal(questions.filter(q=>q.competency===c.id).length,4);
 for(const [correct,level] of [[0,'Низкий'],[6,'Низкий'],[7,'Догоняющий'],[12,'Догоняющий'],[13,'Средний'],[19,'Средний'],[20,'Продвинутый'],[25,'Продвинутый'],[26,'Высокий'],[32,'Высокий']]){
  const result=gradeAssessment(answersFor(correct));assert.equal(result.total,Math.round(correct/32*100));assert.equal(result.level,level);assert.equal(result.competencies.reduce((sum,c)=>sum+c.score,0),correct);assert.equal(result.questionCount,32);assert.equal(assessmentLevels[result.levelIndex].title,level);
 }
 assert.ok(gradeAssessment(answersFor(32)).competencies.every(c=>c.score===4&&c.percent===100));
 assert.ok(courses.every(c=>c.competencies.every(id=>competencies.some(x=>x.id===id))));
});
test('incomplete or invalid answers never produce an assessment result',()=>{
 for(const answers of [null,{}, {...answersFor(32),'strategy-1':4},{...answersFor(32),'strategy-1':-1},{...answersFor(32),'strategy-1':'1'},Object.fromEntries(Array.from({length:10},(_,i)=>['q'+(i+1),0]))])assert.throws(()=>gradeAssessment(answers),TypeError);
});
test('recommendations respond to weak competencies and remain unique',()=>{
 const starter=recommendCourses(gradeAssessment(answersFor(0)));assert.deepEqual(starter.slice(0,2).map(x=>x.course.id),['genai-sales','pdlc-quick']);
 const answers=answersFor(32);for(const q of questions.filter(q=>q.competency==='ethics'))answers[q.id]=(q.correct+1)%4;
 assert.equal(recommendCourses(gradeAssessment(answers))[0].course.id,'pdlc-deep');
 for(let score=0;score<=32;score++){const list=recommendCourses(gradeAssessment(answersFor(score)));assert.ok(list.length>0&&list.length<=3);assert.equal(new Set(list.map(x=>x.course.id)).size,list.length);assert.ok(list.every(x=>x.reason));}
});
test('radar uses measured percentages and handles zero, maximum and mixed results',()=>{
 const zero=gradeAssessment(answersFor(0)),full=gradeAssessment(answersFor(32));
 for(const compact of [false,true]){
  const empty=radarGeometry(zero.competencies,compact);assert.ok(empty.points.every(p=>p.x===empty.cx&&p.y===empty.cy));
  const filled=radarGeometry(full.competencies,compact);assert.equal(filled.rings.length,5);assert.ok(filled.points.every((p,i)=>p.x===filled.axes[i].x&&p.y===filled.axes[i].y));assert.ok(filled.points[0].y<filled.cy);assert.ok(filled.points[2].x>filled.cx);assert.ok(filled.points[4].y>filled.cy);
  const mixed=full.competencies.map((c,i)=>({...c,percent:i===2?50:0}));const geometry=radarGeometry(mixed,compact);assert.equal(geometry.points[2].x-geometry.cx,(geometry.axes[2].x-geometry.cx)/2);
 }
 assert.throws(()=>radarGeometry([]),RangeError);assert.throws(()=>radarGeometry(full.competencies.map(c=>({...c,percent:101}))),RangeError);
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
