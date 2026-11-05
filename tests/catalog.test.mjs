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
