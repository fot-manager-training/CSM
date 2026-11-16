import assert from 'node:assert/strict';
import {browser} from './browser-support.mjs';
import {loadKnowledge} from '../server/kv-knowledge.mjs';
const knowledge=await loadKnowledge(new URL('../server/private/kv-knowledge.json',import.meta.url));
const b=await browser();
const last='document.querySelector("#kv-chat-log>article:last-child")';
async function ask(question){await b.evaluate(`document.getElementById('kv-chat-input').value=${JSON.stringify(question)}`);await b.click('#kv-chat-send');await b.wait(`document.getElementById('kv-chat-panel').getAttribute('aria-busy')==='false'&&${last}.classList.contains('kv-message-assistant')`);}
try{
 await b.viewport(1440,1100);await b.navigate('index.html','document.getElementById("kv-chat-launcher")');await b.click('#kv-chat-launcher');await b.wait('!document.getElementById("kv-chat-send").disabled');
 assert.match(await b.evaluate('document.getElementById("kv-chat-status").textContent'),/174 строк/);
 await ask('ГигаЧат для бизнеса ПАК');
 const expected=knowledge.records.filter(r=>r.provider==='Салют для Бизнеса'&&r.product==='ГигаЧат для бизнеса ПАК');
 assert.equal(await b.evaluate(`${last}.querySelectorAll('.kv-fact').length`),1);
 assert.equal(await b.evaluate(`${last}.querySelectorAll('.kv-variant-select option').length`),expected.length+1);
 const sources=await b.evaluate(`${last}.textContent`);for(const row of expected){assert.ok(sources.includes(row.sheet+'!'+row.range));assert.ok(sources.includes(row.fields.pvRate.display));}
 assert.equal(await b.evaluate(`${last}.querySelector('.kv-answer-mode').textContent`),'Поиск по таблице');
 assert.equal(await b.evaluate('document.querySelector(".kv-fact").open'),true);await b.evaluate('const selector=document.querySelector(".kv-variant-select");selector.value="0";selector.dispatchEvent(new Event("change"))');assert.equal(await b.evaluate('document.querySelectorAll(".kv-variant-panel:not([hidden]) .kv-fact-fields>div").length'),6);
 await b.evaluate('document.querySelector(".kv-fact-follow").scrollIntoView({block:"center",behavior:"instant"})');await b.click('.kv-fact-follow');assert.match(await b.evaluate('document.getElementById("kv-chat-input").value'),/строка 2/);await b.click('#kv-chat-send');await b.wait(`${last}.querySelectorAll('.kv-fact').length===1&&!${last}.classList.contains('is-pending')`);
 await ask('НесуществующийПродуктXYZ');assert.equal(await b.evaluate(`${last}.querySelectorAll('.kv-fact').length`),0);assert.match(await b.evaluate(`${last}.textContent`),/не нашлось/);
 await ask('<img src=x onerror="window.KV_XSS=true"> ГигаЧат ПАК');assert.equal(await b.evaluate('window.KV_XSS===true'),false);assert.equal(await b.evaluate('document.querySelector("#kv-chat-panel img")===null'),true);
 await b.evaluate(`window.originalKvFetch=window.fetch;window.fetch=(url,options)=>String(url).endsWith('/chat')?new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new DOMException('Stopped','AbortError')))):window.originalKvFetch(url,options)`);
 await b.evaluate('document.getElementById("kv-chat-input").value="ПАК"');await b.click('#kv-chat-send');assert.equal(await b.evaluate('document.getElementById("kv-chat-panel").getAttribute("aria-busy")'),'true');await b.click('#kv-chat-send');await b.wait('document.getElementById("kv-chat-panel").getAttribute("aria-busy")==="false"');assert.match(await b.evaluate(`${last}.textContent`),/остановлен/);await b.evaluate('window.fetch=window.originalKvFetch');
 await b.click('#kv-chat-clear');assert.equal(await b.evaluate('document.querySelectorAll("#kv-chat-log>article").length'),1);
 await b.key('Escape');assert.equal(await b.evaluate('document.getElementById("kv-chat-panel").hidden'),true);assert.equal(await b.evaluate('document.activeElement.id'),'kv-chat-launcher');
 for(const width of [320,390,768,1440]){
  await b.viewport(width,1000);for(const page of ['index','events','cases','partners','learning']){
   await b.navigate(page+'.html','document.getElementById("kv-chat-launcher")');await b.click('#kv-chat-launcher');await b.wait('!document.getElementById("kv-chat-send").disabled');
   const rect=await b.bounds('#kv-chat-panel');assert.ok(rect.left>=0&&rect.right<=width&&rect.top>=0&&rect.bottom<=1000,`chat bounds ${page} ${width}`);assert.equal(await b.evaluate('document.documentElement.scrollWidth<=innerWidth'),true);assert.ok(await b.evaluate('getComputedStyle(document.getElementById("kv-chat-input")).fontFamily.includes("SB Sans Display")'));
   if(page==='index'&&(width===390||width===1440)){await ask('ГигаЧат для бизнеса ПАК');await b.screenshot('kv-chat-'+width);}
   await b.click('#kv-chat-close');
  }
 }
 await b.evaluate('window.originalKvFetch=window.fetch;window.fetch=()=>Promise.reject(new TypeError("Failed to fetch"))');await b.click('#kv-chat-launcher');await b.wait('document.getElementById("kv-chat-status").textContent.includes("недоступн")');assert.equal(await b.evaluate('document.getElementById("kv-chat-send").disabled'),true);await b.click('#kv-chat-close');await b.evaluate('window.fetch=window.originalKvFetch');await b.click('#kv-chat-launcher');await b.wait('!document.getElementById("kv-chat-send").disabled');
 await b.click('#kv-chat-close');await b.evaluate('window.originalKvFetch=window.fetch;window.fetch=()=>Promise.resolve(new Response("Not found",{status:404}))');await b.click('#kv-chat-launcher');await b.wait('!document.querySelector(".kv-local-source").hidden');assert.equal(await b.evaluate('document.getElementById("kv-chat-input").disabled'),true);assert.match(await b.evaluate('document.querySelector(".kv-chat-connection").textContent'),/Выбрать КВ.xlsx/);await b.evaluate('window.fetch=window.originalKvFetch');
 assert.equal(await b.evaluate('performance.getEntriesByType("resource").some(e=>e.name.includes("api.deepseek.com"))'),false);
 assert.deepEqual(b.errors,[]);console.log('PASS: real KV source variants and cell references, follow-up by row, unknown product, safe text, cancel/clear/Escape, all five pages at 320/390/768/1440, offline recovery, no browser-side provider calls.');
}finally{b.close();}
