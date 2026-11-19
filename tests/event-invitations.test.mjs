import {test} from 'node:test';
import assert from 'node:assert/strict';
import {events,calendarText,filterEvents} from '../public/data.js';
import {invitationText} from '../public/event-invitations.js';
import {readFile} from 'node:fs/promises';
test('AI Journey has the supplied Moscow details and links its full program',()=>{
 const e=events.find(e=>e.id==='aij');assert.equal(e.start,'2026-11-26');assert.equal(e.end,'2026-11-28');assert.equal(e.city,'Москва');assert.equal(e.venue,'Кутузовский проспект, 32, корп. 1');assert.equal(e.metro,'Кутузовская');assert.equal(e.websiteUrl,'https://aij.ru/');assert.equal(e.programOnWebsite,true);assert.equal(e.program,undefined);assert.equal(filterEvents(events,{region:'Москва'})[0].id,e.id);assert.match(calendarText(e),/URL:https:\/\/aij.ru\//);assert.match(calendarText(e),/метро «Кутузовская»/);
});
test('every invitation uses the same client template and its own facts and deep link',()=>{
 for(const e of events){const text=invitationText(e,'https://example.org/CSM/index.html');assert.ok(text.startsWith('Здравствуйте!\n\nПриглашаем вас на мероприятие «'+e.title+'».'));assert.ok(text.includes(`Дата: ${e.date} 2026.`));assert.ok(text.includes(`https://example.org/CSM/events.html#event/${e.id}`));assert.ok(text.endsWith('Будем рады видеть вас!'));assert.doesNotMatch(text,/undefined|null/);if(e.websiteUrl)assert.ok(text.includes(e.websiteUrl));if(e.time)assert.ok(text.includes('Время: '+e.time));}
 const aij=invitationText(events.find(e=>e.id==='aij'),'https://example.org/CSM/events.html');assert.match(aij,/26–28 ноября 2026/);assert.match(aij,/Метро: «Кутузовская»/);assert.match(aij,/Программа и регистрация: https:\/\/aij.ru\//);assert.doesNotMatch(aij,/Время:/);
});
test('all pages restore the DTaaS icon and region and provide feedback and ARKA',async()=>{
 for(const page of ['index','events','cases','partners','learning']){const html=await readFile(new URL('../public/'+page+'.html',import.meta.url),'utf8');assert.equal((html.match(/class="dtaas-symbol"/g)||[]).length,2);assert.equal((html.match(/class="dtaas-region">СЗБ/g)||[]).length,2);for(const handle of ['ekaterinashliakhova','im_art84'])assert.ok(html.includes('https://t.me/'+handle));assert.match(html,/class="arka-expanded"[^>]*>made by <b>ARKA<\/b>/);assert.doesNotMatch(html,/Cheshire|assets\/sber|dtaas-text-brand/);}
});
