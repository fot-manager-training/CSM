import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {browser} from './browser-support.mjs';
const expected=JSON.parse(await readFile(new URL('../public/assets/kv/knowledge.json',import.meta.url),'utf8'));
const b=await browser(),last='document.querySelector("#kv-chat-log>article:last-child")';
async function ask(question){await b.evaluate(`document.getElementById('kv-chat-input').value=${JSON.stringify(question)};document.getElementById('kv-chat-form').requestSubmit()`);await b.wait(`document.getElementById('kv-chat-panel').getAttribute('aria-busy')==='false'&&${last}.classList.contains('kv-message-assistant')`);}
try{
 await b.viewport(1440,1000);await b.navigate('index.html','document.getElementById("kv-chat-launcher")');await b.click('#kv-chat-launcher');await b.wait('!document.getElementById("kv-chat-send").disabled');
 assert.equal(await b.evaluate('document.getElementById("kv-chat-status").hidden'),true);
 assert.equal(await b.evaluate('document.querySelector(".kv-chat-footnote")'),null);
 assert.equal(await b.evaluate('document.querySelector(".kv-local-source").hidden'),true);
 await b.evaluate('window.kvPosts=[];window.originalKvFetch=window.fetch;window.fetch=(url,options)=>{if(options?.method==="POST")window.kvPosts.push(String(url));return window.originalKvFetch(url,options)}');
 await ask('ГигаЧат для бизнеса ПАК');assert.doesNotMatch(await b.evaluate('document.getElementById("kv-chat-panel").innerText'),/Поиск по общей базе КВ|Сверяйте продукт и вариант условий/);assert.equal(await b.evaluate(`${last}.querySelectorAll('.kv-fact').length`),1);
 assert.equal(await b.evaluate(`${last}.querySelectorAll('.kv-variant-select option').length`),3);
 assert.equal(await b.evaluate(`${last}.querySelectorAll('.kv-variant-panel:not([hidden])').length`),0,'Different conditions require a choice');
 const records=expected.records.filter(r=>r.provider==='Салют для Бизнеса'&&r.product==='ГигаЧат для бизнеса ПАК');
 for(let i=0;i<records.length;i++){
  await b.evaluate(`(()=>{const selector=document.querySelector('.kv-variant-select');selector.value=${JSON.stringify(String(i))};selector.dispatchEvent(new Event('change'))})()`);
  const text=await b.evaluate(`${last}.querySelector('.kv-variant-panel:not([hidden])').textContent`);
  for(const field of Object.values(records[i].fields))assert.ok(text.includes(field.display));
  assert.equal(await b.evaluate(`${last}.querySelector('.kv-fact-source')`),null);
  assert.deepEqual(await b.evaluate(`Array.from(${last}.querySelectorAll('.kv-variant-panel:not([hidden]) dd'),node=>node.title)`),Object.values(records[i].fields).map(field=>records[i].sheet+'!'+field.cell));
  assert.equal(await b.evaluate(`${last}.querySelectorAll('.kv-variant-panel:not([hidden])').length`),1);
 }
 await ask('НесуществующийПродуктXYZ');assert.equal(await b.evaluate(`${last}.querySelectorAll('.kv-fact').length`),0);assert.match(await b.evaluate(`${last}.textContent`),/не нашлось/);
 await b.click('#kv-chat-clear');await ask('Покажи строку 92');assert.equal(await b.evaluate(`${last}.querySelectorAll('.kv-fact').length`),1);assert.equal(await b.evaluate(`${last}.querySelectorAll('.kv-variant-select').length`),0);assert.match(await b.evaluate(`${last}.querySelector('dd').title`),/!C92$/);
 assert.deepEqual(await b.evaluate('window.kvPosts'),[]);
 for(const width of [320,390,768,1440]){
  await b.viewport(width,950);
  for(const page of ['index','events','cases','partners','learning']){
   await b.navigate(page+'.html','document.getElementById("kv-chat-launcher")');await b.click('#kv-chat-launcher');await b.wait('!document.getElementById("kv-chat-send").disabled');await ask('ГигаЧат ПАК');
   assert.equal(await b.evaluate(`${last}.querySelectorAll('.kv-fact').length`),1);assert.equal(await b.evaluate('document.querySelectorAll("#kv-chat-panel").length'),1);assert.equal(await b.evaluate('document.querySelectorAll("#kv-chat-launcher").length'),1);assert.equal(await b.evaluate('document.querySelector(".kv-local-source").hidden'),true);
   const bounds=await b.bounds('#kv-chat-panel');assert.ok(bounds.left>=0&&bounds.right<=width&&bounds.top>=0&&bounds.bottom<=950);assert.equal(await b.evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
   if(page==='index'&&(width===390||width===1440))await b.screenshot('kv-shared-'+width);
  }
 }
 await b.send('Page.reload');await b.wait('document.readyState==="complete"&&!!document.getElementById("kv-chat-launcher")');await b.click('#kv-chat-launcher');await b.wait('!document.getElementById("kv-chat-send").disabled');await ask('ГигаЧат ПАК');assert.equal(await b.evaluate(`${last}.querySelectorAll('.kv-fact').length`),1);
 assert.deepEqual(b.errors,[]);console.log('PASS: static shared KV base loads automatically without upload; one product card; both rates selectable with exact fields; no chat POST; all five pages at 320/390/768/1440; navigation and reload.');
}finally{b.close();}
