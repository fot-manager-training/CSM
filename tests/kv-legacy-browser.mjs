import assert from 'node:assert/strict';
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {createSiteServer} from '../server.mjs';
import {publicRecord} from '../public/kv-lookup.js';
import {browser} from './browser-support.mjs';

const knowledge=JSON.parse(await readFile(new URL('../public/assets/kv/knowledge.json',import.meta.url)));
const staticServer=createSiteServer(),staticHandler=staticServer.listeners('request')[0];
let modern=false;
const oldAnswer='В таблице не нашлось подходящих условий. Уточните компанию и полное название продукта. Правила выплаты, дата действия ставок и порядок применения MIN ПВ в файле не описаны.';
const server=http.createServer(async(req,res)=>{
 const path=new URL(req.url,'http://localhost').pathname;
 const json=body=>{res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(body));};
 if(path==='/kv-chat-config.js'){res.writeHead(200,{'Content-Type':'text/javascript'});res.end(`export const kvApiBase='http://127.0.0.1:${server.address().port}/api/kv/';`);return;}
 if(path==='/api/kv/status'){json({ready:true,providerConfigured:true,source:{rows:174,products:80}});return;}
 if(path==='/api/kv/chat'){
  const chunks=[];for await(const chunk of req)chunks.push(chunk);const {question}=JSON.parse(Buffer.concat(chunks));
  if(modern){json({answer:'Вы можете спросить меня о КВ — помогу разобраться.',mode:'deepseek',sources:[],apiVersion:2,revision:'abcdef0'});return;}
  const stray=question.includes('продукты');json({answer:oldAnswer,mode:stray?'deepseek':'lookup',sources:stray?[publicRecord(knowledge.records[0])]:[]});return;
 }
 staticHandler(req,res);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const b=await browser();
async function ask(question){
 await b.evaluate(`document.getElementById('kv-chat-input').value=${JSON.stringify(question)};document.getElementById('kv-chat-form').requestSubmit()`);
 await b.wait('document.getElementById("kv-chat-panel").getAttribute("aria-busy")==="false"&&!!document.querySelector("#kv-chat-log>article:last-child.kv-message-assistant")');
 return b.evaluate('document.querySelector("#kv-chat-log>article:last-child").textContent');
}
try{
 await b.viewport(390,900);await b.navigate(`http://127.0.0.1:${server.address().port}/index.html`,'document.getElementById("kv-chat-launcher")');
 assert.equal(await b.evaluate('getComputedStyle(document.querySelector(".hero h1")).color'),'rgb(255, 255, 255)');
 await b.click('#kv-chat-launcher');await b.wait('!document.getElementById("kv-chat-send").disabled');
 for(const question of ['привет','что умеешь','а какие продукты есть?']){
  const text=await ask(question);assert.doesNotMatch(text,/не нашлось|Правила выплаты|Поиск по таблице|Пояснение DeepSeek/);
  assert.equal(await b.evaluate('document.querySelectorAll("#kv-chat-log>article:last-child .kv-fact").length'),0);
  if(question.includes('продукты'))assert.ok(text.includes(knowledge.records[0].product));
 }
 assert.equal(await b.evaluate('document.getElementById("kv-chat-panel").dataset.backendVersion'),'0');
 modern=true;const text=await ask('что умеешь');assert.match(text,/Вы можете спросить меня/);assert.match(text,/Пояснение DeepSeek/);
 assert.equal(await b.evaluate('document.getElementById("kv-chat-panel").dataset.backendVersion'),'2');
 assert.equal(await b.evaluate('document.getElementById("kv-chat-panel").dataset.backendRevision'),'abcdef0');
 assert.deepEqual(b.errors,[]);
 await b.screenshot('chat-recovered-from-old-server');
 console.log('PASS: the exact old server replies from user screenshots are repaired for greetings, help and product lists; no random cards or false AI badge; modern AI replies and revision tracking remain intact; hero title is white.');
}finally{b.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));staticServer.close();}
