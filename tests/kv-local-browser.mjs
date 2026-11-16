import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {browser} from './browser-support.mjs';
import {loadKnowledge} from '../server/kv-knowledge.mjs';

const workbook=process.env.KV_WORKBOOK_FILE;
assert.ok(workbook,'Set KV_WORKBOOK_FILE to the original local КВ.xlsx; this test uses a static server without an API.');
const expected=await loadKnowledge(new URL('../server/private/kv-knowledge.json',import.meta.url));
const b=await browser(),last='document.querySelector("#kv-chat-log>article:last-child")';
async function selectFile(){
 const {root}=await b.send('DOM.getDocument');
 const {nodeId}=await b.send('DOM.querySelector',{nodeId:root.nodeId,selector:'#kv-chat-file'});
 await b.send('DOM.setFileInputFiles',{nodeId,files:[resolve(workbook)]});
 await b.wait('!document.getElementById("kv-chat-send").disabled');
}
async function ask(question){await b.evaluate(`document.getElementById('kv-chat-input').value=${JSON.stringify(question)};document.getElementById('kv-chat-form').requestSubmit()`);await b.wait(`${last}.querySelector('.kv-answer-mode')`);}
try{
 await b.viewport(1440,1000);await b.navigate('index.html','document.getElementById("kv-chat-launcher")');await b.click('#kv-chat-launcher');await b.wait('!document.querySelector(".kv-local-source").hidden');
 assert.equal(await b.evaluate('document.getElementById("kv-chat-send").disabled'),true);
 await b.evaluate(`window.kvFetches=[];window.originalKvFetch=window.fetch;window.fetch=(url,options)=>{window.kvFetches.push({url:String(url),method:options?.method||'GET'});return window.originalKvFetch(url,options)};document.getElementById('kv-chat-file').addEventListener('change',async e=>{const file=e.target.files[0];window.kvImportedCheck=await(await import('./kv-workbook.js?v=kv-local-20261116')).readKvWorkbook(file)},{once:true});`);
 await selectFile();await b.wait('!!window.kvImportedCheck');
 const actual=await b.evaluate('window.kvImportedCheck');assert.equal(actual.records.length,174);
 for(const record of expected.records){const found=actual.records.find(r=>r.id===record.id);assert.ok(found);assert.equal(found.product,record.product);assert.equal(found.provider,record.provider);for(const [key,field]of Object.entries(record.fields)){assert.equal(found.fields[key].value,field.value);assert.equal(found.fields[key].display,field.display);assert.equal(found.fields[key].cell,field.cell);}}
 await ask('Условия ГигаЧат для бизнеса ПАК');assert.equal(await b.evaluate(`${last}.querySelectorAll('.kv-fact').length`),2);assert.match(await b.evaluate(`${last}.textContent`),/на устройстве · без ИИ/);
 await ask('Покажи строку 92');assert.equal(await b.evaluate(`${last}.querySelectorAll('.kv-fact').length`),1);assert.match(await b.evaluate(`${last}.textContent`),/A92:H92/);
 await ask('НесуществующийПродуктXYZ');assert.equal(await b.evaluate(`${last}.querySelectorAll('.kv-fact').length`),0);assert.match(await b.evaluate(`${last}.textContent`),/не нашлось/);
 await ask('Какие компании есть в файле?');assert.ok((await b.evaluate(`${last}.textContent`)).includes(expected.records[0].provider));
 await b.evaluate(`(async()=>{const file=new File(['bad content'],'broken.xlsx');try{await(await import('./kv-workbook.js?v=kv-local-20261116')).readKvWorkbook(file);window.kvBadFile='accepted'}catch(e){window.kvBadFile=e.message}})()`);assert.notEqual(await b.evaluate('window.kvBadFile'),'accepted');
 await b.evaluate(`const files=new DataTransfer();files.items.add(new File(['bad'],'wrong.pdf'));document.getElementById('kv-chat-file').files=files.files;document.getElementById('kv-chat-file').dispatchEvent(new Event('change',{bubbles:true}))`);await b.wait('document.querySelector(".kv-chat-connection").textContent.includes(".xlsx")');assert.equal(await b.evaluate('document.getElementById("kv-chat-send").disabled'),false);
 await ask('ГигаЧат ПАК');assert.equal(await b.evaluate(`${last}.querySelectorAll('.kv-fact').length`),2);
 assert.deepEqual(await b.evaluate('window.kvFetches'),[],'Local file and questions must never be uploaded or sent to any API');
 await b.click('#kv-chat-clear');assert.equal(await b.evaluate('document.querySelectorAll("#kv-chat-log>article").length'),1);await ask('ГигаЧат ПАК');assert.equal(await b.evaluate(`${last}.querySelectorAll('.kv-fact').length`),2);
 await b.click('.kv-local-forget');await b.wait('document.getElementById("kv-chat-send").disabled');assert.equal(await b.evaluate('document.querySelectorAll(".kv-fact").length'),0);
 for(const width of [320,390,1440]){
  await b.viewport(width,900);
  for(const page of ['index','events','cases','partners','learning']){
   await b.navigate(page+'.html','document.getElementById("kv-chat-launcher")');await b.click('#kv-chat-launcher');await b.wait('!document.querySelector(".kv-local-source").hidden');await selectFile();await ask('ГигаЧат ПАК');assert.equal(await b.evaluate(`${last}.querySelectorAll('.kv-fact').length`),2);
   const rect=await b.bounds('#kv-chat-panel');assert.ok(rect.left>=0&&rect.right<=width&&rect.top>=0&&rect.bottom<=900);assert.equal(await b.evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
   if(page==='index'&&width!==320)await b.screenshot('kv-local-'+width);
  }
 }
 assert.deepEqual(b.errors,[]);
 console.log('PASS: static site without an API; local XLSX import; all 174 records and 1044 cached values/displays match Excel; real answers and variants; no uploads/API calls; invalid files; clear/forget; all five pages at 320/390/1440.');
}finally{b.close();}
