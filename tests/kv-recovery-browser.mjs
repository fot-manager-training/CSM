import assert from 'node:assert/strict';
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {createSiteServer} from '../server.mjs';
import {publicRecord,retrieve} from '../public/kv-lookup.js';
import {browser} from './browser-support.mjs';

const knowledge=JSON.parse(await readFile(new URL('../public/assets/kv/knowledge.json',import.meta.url)));
const staticServer=createSiteServer(),staticHandler=staticServer.listeners('request')[0];
let awake=false,statusCalls=0,chatCalls=0;
const server=http.createServer((req,res)=>{
 const path=new URL(req.url,'http://localhost').pathname;
 const json=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(body));};
 if(path==='/kv-chat-config.js'){
  res.writeHead(200,{'Content-Type':'text/javascript'});res.end(`export const kvApiBase='http://127.0.0.1:${server.address().port}/api/kv/';`);return;
 }
 if(path==='/api/kv/status'){statusCalls++;json(awake?200:503,{ready:awake,providerConfigured:awake,source:{rows:174,products:80}});return;}
 if(path==='/api/kv/chat'){
  chatCalls++;assert.ok(awake);json(200,{answer:'Условия найдены. Выберите подходящий вариант в карточке.',mode:'deepseek',sources:retrieve(knowledge,'ГигаЧат для бизнеса ПАК').records.map(publicRecord)});return;
 }
 staticHandler(req,res);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const b=await browser();
async function ask(){
 await b.evaluate('document.getElementById("kv-chat-input").value="ГигаЧат для бизнеса ПАК";document.getElementById("kv-chat-form").requestSubmit()');
 await b.wait('document.getElementById("kv-chat-panel").getAttribute("aria-busy")==="false"&&!!document.querySelector("#kv-chat-log>article:last-child .kv-fact")');
}
try{
 await b.viewport(1440,1000);
 await b.navigate(`http://127.0.0.1:${server.address().port}/index.html`,'document.getElementById("kv-chat-launcher")');
 await b.click('#kv-chat-launcher');await b.wait('!document.getElementById("kv-chat-send").disabled');
 await ask();assert.equal(chatCalls,0);assert.equal(statusCalls,1);
 awake=true;
 for(let i=0;i<160&&statusCalls<2;i++)await b.delay(100);
 assert.ok(statusCalls>=2,'The open chat must retry a sleeping API');await b.delay(100);
 await ask();assert.equal(chatCalls,1);
 assert.match(await b.evaluate('document.querySelector("#kv-chat-log>article:last-child .kv-answer-mode").textContent'),/DeepSeek/);
 assert.equal(await b.evaluate('document.querySelectorAll("#kv-chat-log>article:last-child .kv-fact").length'),1);
 assert.deepEqual(b.errors,[]);
 console.log('PASS: unavailable API falls back to shared KV, then recovers automatically and sends subsequent questions to the model without reload.');
}finally{b.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));staticServer.close();}
