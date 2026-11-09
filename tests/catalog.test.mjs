import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cases,partners,filterCases,filterPartners} from '../public/catalog-data.js';
test('all supplied records imported with distinct IDs and original final case number',()=>{
 assert.equal(partners.length,68);assert.equal(cases.length,20);
 assert.equal(new Set(partners.map(x=>x.id)).size,68);assert.equal(new Set(cases.map(x=>x.id)).size,20);
 assert.equal(partners.at(-1).name,'LAND PRO');assert.equal(cases.at(-1).number,'23');assert.equal(cases.at(-1).client,'Самокат');
 for(const p of partners)assert.ok(p.name&&p.role&&p.inn&&p.region&&p.accreditation);
 for(const c of cases)assert.ok(c.client&&c.title&&c.description&&c.metricKind&&c.metricValue&&c.metricDescription);
});
test('targets, MVP and pilot figures keep source context',()=>{
 assert.equal(cases.find(c=>c.client==='Элемент').metricKind,'Целевые показатели');
 assert.equal(cases.find(c=>c.client==='ГМЗ Петергоф').metricKind,'Показатели MVP');
 assert.equal(cases.find(c=>c.client==='ВКА им. Можайского').metricKind,'Результаты пилота');
 assert.equal(cases.find(c=>c.client==='БФУ им. Канта').metricKind,'Количественные метрики не указаны');
 assert.equal(cases.find(c=>c.client==='Самокат').source,'Практика из СберПро');
});
test('case filters combine search, task, metric context and saved cases',()=>{
 assert.equal(filterCases({query:'петергоф'})[0].metricValue,'10 мин');
 assert.equal(filterCases({query:'1С',category:'Финансы'}).length,2);
 assert.equal(filterCases({status:'Целевые показатели'}).length,3);
 assert.equal(filterCases({savedOnly:true,saved:['case-02']})[0].client,'ГМЗ Петергоф');
 assert.equal(filterCases({query:'несуществующий проект'}).length,0);
});
test('partner filters match INN, combined roles and untagged technologies',()=>{
 assert.equal(filterPartners({query:'7840515640'})[0].name,'ООО "ВЕЙВАКСЕСС СЕРВИС"');
 assert.ok(filterPartners({role:'Вендор'}).some(p=>p.role==='Вендор · Интегратор'));
 assert.equal(filterPartners({technology:'Кибербезопасность'})[0].name,'ООО "ОБИТ"');
 assert.equal(filterPartners({technology:'Роботы и дроны'})[0].name,'ООО "ИНДУТЕХ"');
 assert.ok(filterPartners({technology:'Чат-боты и голосовые ассистенты'}).length>0);
 assert.equal(filterPartners({query:'Бындюсофт',role:'Интегратор'}).length,0);
 assert.ok(filterPartners({accreditation:'Не уточнено'}).every(p=>p.accreditation==='Не уточнено'));
});
test('unknown fields and original identifiers stay unchanged',()=>{
 assert.equal(partners.find(p=>p.name==='Лаборатория ВС').inn,'не указан');
 assert.equal(partners.find(p=>p.name==='Лаборатория ВС').region,'Регион не указан');
 assert.equal(partners.find(p=>p.name==='РАУ ИТ').inn,'780156260');
 assert.ok(partners.every(p=>p.gigaCowork==='не уточнено'));
});
test('presentation supplements enrich existing cases without duplicating clients or changing IDs',()=>{
 const supplements=cases.filter(c=>c.sourceDocument);
 assert.equal(supplements.length,19);
 assert.equal(new Set(cases.map(c=>c.id)).size,20);
 assert.equal(supplements.reduce((total,c)=>total+c.metrics.length,0),47);
 for(const c of supplements){
  assert.equal(c.sourceDocument.title,'Заявки все 2026.pptx');
  assert.ok(c.sourceDocument.slides.length&&c.sourceDocument.slides.every(n=>n>=1&&n<=6));
  assert.ok(c.stage&&c.details.length>=2);
  assert.ok(c.metrics.every(m=>m.value&&m.description&&m.context));
 }
 assert.equal(cases.find(c=>c.id==='case-23').sourceDocument,undefined);
});
test('new metrics preserve pilot outcomes, targets and the tax-reporting time baseline',()=>{
 const get=id=>cases.find(c=>c.id===id);
 assert.ok(get('case-02').metrics.some(m=>m.value==='+30%'&&m.context==='Показатели MVP'));
 assert.ok(get('case-19').metrics.some(m=>m.value==='10% → 0,01%'&&m.context==='Результаты пилота'));
 const pnt=get('case-17');assert.equal(pnt.metrics.find(m=>m.description==='Подготовка налогового отчёта.').value,'30% от текущего времени');
 assert.ok(pnt.metrics.filter(m=>/ввод|налогового отчёта|классификация/.test(m.description)).every(m=>m.context==='Целевые показатели'));
 assert.ok(['case-03','case-11','case-12'].every(id=>get(id).metrics.every(m=>m.context==='Целевые показатели')));
});
test('HR-Link projects and unquantified training remain separate',()=>{
 const hr=cases.filter(c=>c.client==='HR-Link');assert.equal(hr.length,2);
 assert.ok(hr.find(c=>c.id==='case-14').metrics.every(m=>m.context==='Качественный эффект'));
 assert.equal(hr.find(c=>c.id==='case-15').metrics.length,6);
 assert.ok(hr.find(c=>c.id==='case-15').metrics.every(m=>m.context==='Пилот и ожидаемые показатели'));
 assert.equal(cases.find(c=>c.id==='case-16').metrics.length,0);
});
test('search finds newly supplied processes and secondary outcomes',()=>{
 assert.deepEqual(filterCases({query:'эскроу'}).map(c=>c.id),['case-18']);
 assert.deepEqual(filterCases({query:'0,01%'}).map(c=>c.id),['case-19']);
 assert.deepEqual(filterCases({query:'Лабораторией нейронаук'}).map(c=>c.id),['case-08']);
});
test('partner enrichment keeps all 68 stable records and adds only sourced details',()=>{
 assert.deepEqual(partners.map(p=>p.id),Array.from({length:68},(_,i)=>`partner-${i+1}`));
 assert.equal(new Set(partners.map(p=>p.sourceRecord.id)).size,68);
 assert.equal(partners.filter(p=>p.website).length,64);
 assert.equal(partners.filter(p=>p.contacts.length).length,60);
 assert.equal(partners.filter(p=>p.industries.length).length,61);
 for(const p of partners){
  assert.equal(p.sourceRecord.url,'https://sber-northwest-casebook.tenderlion1.chatgpt.site/#partners');
  assert.equal(p.sourceRecord.checkedAt,'2026-11-09');
  if(p.website)assert.equal(new URL(p.website).protocol,'https:');
 }
 const empty=partners.find(p=>p.name==='НордКлан');assert.equal(empty.website,'');assert.deepEqual(empty.contacts,[]);assert.deepEqual(empty.industries,[]);
 assert.equal(partners.find(p=>p.name==='РАУ ИТ').innNeedsReview,true);
});
test('partner search covers sourced industries, contacts, products and full roles',()=>{
 assert.ok(filterPartners({query:'ramax.ru'}).some(p=>p.id==='partner-1'));
 assert.ok(filterPartners({query:'Добыча полезных ископаемых'}).some(p=>p.id==='partner-1'));
 assert.ok(filterPartners({query:'Петров Вадим'}).some(p=>p.id==='partner-1'));
 assert.equal(filterPartners({query:'ИНФИНАЙТ СИНЕРДЖИ',role:'Разработчик'}).length,1);
 assert.equal(filterPartners({query:'ИНФИНАЙТ СИНЕРДЖИ',role:'Интегратор'}).length,0);
 assert.equal(filterPartners({query:'LAND PRO',technology:'Сервисы Сбера (API)'}).length,1);
 assert.ok(filterPartners({role:'Консультант'}).some(p=>p.id==='partner-1'));
 assert.ok(partners.every(p=>p.gigaCowork==='не уточнено'));
});
