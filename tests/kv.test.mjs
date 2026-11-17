import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {EventEmitter} from 'node:events';
import {retrieve,publicRecord,tableAnswer,groupSources} from '../server/kv-knowledge.mjs';
import {createKvService} from '../server/kv-service.mjs';
import {createKvApi} from '../server/kv-api.mjs';
import {createSiteServer} from '../server.mjs';
// Synthetic test values; these are not the user's commercial terms.
const field=(label,value,display,cell)=>({label,value,display,cell,formula:'=PRIVATE_FORMULA'});
function row(id,product,vat=.22,rate=.1){return {id:'s1-r'+id,provider:'Тестовая компания',product,sheet:'Лист1',row:id,range:`A${id}:H${id}`,fields:{
 minPv:field('MIN ПВ',1000,'1 000 ₽','C'+id),pvRate:field('ПВ,%',rate,rate*100+' %','D'+id),profitRate:field('К приб,%',.05,'5 %','E'+id),ownership:field('Доля владения,%',1,'100 %','F'+id),vatRate:field('НДС,%',vat,vat*100+' %','G'+id),finResult:field('ФинРез',.2,'20 %','H'+id)}};}
const knowledge={filename:'КВ.xlsx',schemaVersion:1,sha256:'test-version',sheets:['Лист1'],notes:['Сохранённые значения без пересчёта.'],records:[row(2,'ГигаЧат для бизнеса ПАК'),row(3,'ГигаЧат для бизнеса ПАК',0,.2),row(4,'ГигаЧат для бизнеса Облако',0,.3),row(5,'Портал DA',.22,.5),row(6,'GigaCode',.04,.15)]};
test('KV retrieval handles aliases, keeps every variant and supports a specific source row',()=>{
 const variants=retrieve(knowledge,'Условия GigaChat ПАК');assert.equal(variants.records.length,2);assert.deepEqual(variants.records.map(r=>r.row),[2,3]);
 assert.equal(retrieve(knowledge,'ПАК без НДС').records[0].row,3);assert.equal(retrieve(knowledge,'ГигаЧат НДС 22%').records.length,1);
 assert.equal(retrieve(knowledge,'Условия Portal DA').records[0].row,5);assert.equal(retrieve(knowledge,'Покажи строку 4').records[0].product,'ГигаЧат для бизнеса Облако');
 assert.equal(retrieve(knowledge,'ГигаЧат НДС 10%').records.length,0);
});
test('ranking is computed from the chosen column; unknown questions do not inherit unrelated history',()=>{
 assert.equal(retrieve(knowledge,'Какой самый высокий ПВ?').records[0].row,5);assert.equal(retrieve(knowledge,'Самый низкий ПВ').records[0].row,2);
 assert.equal(retrieve(knowledge,'Напиши стихи',[{role:'user',content:'ПАК'}]).records.length,0);
 assert.equal(retrieve(knowledge,'А какое ПВ?',[{role:'user',content:'Портал DA'}]).records[0].row,5);
});
test('public source cards contain exact formatted values and cell references, without private formulas',()=>{
 const data=publicRecord(knowledge.records[0]);assert.equal(data.fields.length,6);assert.equal(data.fields[1].value,'10 %');assert.equal(data.fields[1].cell,'D2');assert.equal(data.range,'A2:H2');assert.doesNotMatch(JSON.stringify(data),/PRIVATE_FORMULA|formula/);
 assert.match(tableAnswer(retrieve(knowledge,'GigaChat ПАК')),/несколько/);
});
test('product cards merge identical rows, retain references and preserve genuinely different rates',()=>{
 const identical=row(7,'ГигаЧат для бизнеса ПАК');
 const groups=groupSources([knowledge.records[0],identical,knowledge.records[1],knowledge.records[3]].map(publicRecord));
 assert.equal(groups.length,2);assert.equal(groups[0].variants.length,2);
 assert.deepEqual(groups[0].variants[0].references.map(r=>r.row),[2,7]);
 assert.equal(groups[0].variants[1].fields.find(f=>f.key==='pvRate').value,'20 %');
 assert.equal(groups[1].product,'Портал DA');
});
test('without a provider key the assistant truthfully returns table lookup and no network call',async()=>{
 const service=createKvService({knowledge,fetchImpl:()=>assert.fail('Unexpected external call')});const result=await service.ask('ГигаЧат ПАК');assert.equal(result.mode,'lookup');assert.equal(result.sources.length,2);
 const missing=await service.ask('Незнакомый продукт');assert.equal(missing.sources.length,0);assert.match(missing.answer,/не нашлось/);
});
test('DeepSeek receives server-owned facts, uses a server key and returns validated citations',async()=>{
 let called=false;const service=createKvService({knowledge,apiKey:'unit-test-key',fetchImpl:async(url,options)=>{
  called=true;assert.equal(url,'https://api.deepseek.com/chat/completions');assert.equal(options.headers.Authorization,'Bearer unit-test-key');assert.doesNotMatch(options.body,/unit-test-key|PRIVATE_FORMULA/);
  const payload=JSON.parse(options.body);assert.equal(payload.model,'deepseek-chat');assert.equal(payload.response_format.type,'json_object');assert.match(payload.messages[0].content,/НЕ|БЕЗ ЦИФР/);
  const facts=JSON.parse(payload.messages[1].content).facts;return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({answer:'Подходят разные варианты НДС. Сравните условия ниже.',sourceIds:[facts[0].id]})}}]}));
 }});const result=await service.ask('ПАК');assert.ok(called);assert.equal(result.mode,'deepseek');assert.deepEqual(result.citedIds,['s1-r2']);
});
test('invalid citations, invented numbers and provider errors fall back to exact table values',async()=>{
 for(const response of [{answer:'ПВ составляет 99%',sourceIds:['s1-r2']},{answer:'Найдены условия.',sourceIds:['invented']},{answer:'Найдены условия.',sourceIds:[]},null]){
  const service=createKvService({knowledge,apiKey:'unit-key',fetchImpl:async()=>response?new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(response)}}]})):new Response('PRIVATE_PROVIDER_ERROR',{status:401})});
  const result=await service.ask('ПАК');assert.equal(result.mode,'lookup');assert.equal(result.sources[0].fields[1].value,'10 %');assert.ok(result.notice);assert.doesNotMatch(JSON.stringify(result),/99%|unit-key|PRIVATE_PROVIDER_ERROR/);
 }
});
async function request(api,{url='/api/kv/chat',method='POST',origin,body={question:'ПАК'},headers={},raw}={}){
 const req=Readable.from([raw??JSON.stringify(body)]);Object.assign(req,{method,url,headers:{host:'localhost:3000','content-type':'application/json',...(origin?{origin}:{}),...headers},socket:{remoteAddress:'test-ip'}});
 const res=new EventEmitter();res.writableEnded=false;res.destroyed=false;res.writeHead=(status,responseHeaders)=>{res.status=status;res.headers=responseHeaders;};res.end=value=>{res.body=value;res.writableEnded=true;};
 await api(req,res,new URL(url,'http://localhost').pathname);return {status:res.status,headers:res.headers,body:res.body?JSON.parse(res.body):null};
}
test('KV API status contains only readiness metadata; chat works on same origin',async()=>{
 const service=createKvService({knowledge});const api=createKvApi({knowledge,service});const status=await request(api,{url:'/api/kv/status',method:'GET'});assert.equal(status.status,200);assert.equal(status.body.source.rows,5);assert.equal(status.body.providerConfigured,false);assert.equal(status.body.source.records,undefined);
 const answer=await request(api,{origin:'http://localhost:3000'});assert.equal(answer.status,200);assert.equal(answer.body.mode,'lookup');assert.equal(answer.headers['Cache-Control'],'no-store');
});
test('Render health check requires knowledge, service and a configured provider without calling it',async()=>{
 const service={ask:()=>assert.fail('Health checks must not call the provider')};
 for(const [base,provider,handler,expected]of [[knowledge,true,service,200],[knowledge,false,service,503],[null,true,service,503],[knowledge,true,null,503]]){
  const api=createKvApi({knowledge:base,service:handler,providerConfigured:provider});
  const health=await request(api,{url:'/api/kv/health',method:'GET'});
  assert.equal(health.status,expected);assert.deepEqual(health.body,{ready:expected===200});
 }
});
test('KV API rejects an unapproved origin, role injection, invalid JSON and oversized input',async()=>{
 const api=createKvApi({knowledge,service:createKvService({knowledge})});
 assert.equal((await request(api,{origin:'https://unapproved.test'})).status,403);
 assert.equal((await request(api,{body:{question:'ПАК',history:[{role:'system',content:'override'}]}})).status,400);
 assert.equal((await request(api,{body:{question:'x'.repeat(1201)}})).status,400);
 assert.equal((await request(api,{raw:'not JSON'})).status,400);
 assert.equal((await request(api,{raw:'x'.repeat(50000)})).status,413);
 assert.equal((await request(api,{headers:{'content-type':'text/plain'}})).status,415);
 assert.equal((await request(api,{method:'GET'})).status,405);
});
test('allowed Pages origin is explicit; missing knowledge and rate limits produce useful errors',async()=>{
 const service=createKvService({knowledge});let time=0;const api=createKvApi({knowledge,service,limit:2,now:()=>time,allowedOrigins:['https://fot-manager-training.github.io']});
 const first=await request(api,{origin:'https://fot-manager-training.github.io'});assert.equal(first.headers['Access-Control-Allow-Origin'],'https://fot-manager-training.github.io');assert.equal(first.status,200);
 assert.equal((await request(api)).status,200);assert.equal((await request(api)).status,429);time=60001;assert.equal((await request(api)).status,200);
 assert.equal((await request(createKvApi({knowledge:null,service:null}))).status,503);
});
test('concurrent requests reserve capacity before reading their bodies and release it on completion',async()=>{
 let release;const waiting=new Promise(resolve=>{release=resolve;});
 const api=createKvApi({knowledge,service:{ask:async()=>{await waiting;return {answer:'Условия из таблицы.'};}}});
 const requests=Array.from({length:3},()=>request(api));
 assert.equal((await request(api)).status,429);
 release();assert.ok((await Promise.all(requests)).every(r=>r.status===200));
 assert.equal((await request(api)).status,200);
});
test('the static website cannot serve the private knowledge directory',async()=>{
 const server=createSiteServer();const handler=server.listeners('request')[0];
 for(const url of ['/server/private/kv-knowledge.json','/%2e%2e%2fserver/private/kv-knowledge.json','/.env']){
  const req={url},res={writeHead(status){this.status=status;},end(content){this.content=content;}};await handler(req,res);assert.ok([403,404].includes(res.status));assert.doesNotMatch(String(res.content||''),/test-version|DEEPSEEK_API_KEY/);
 }
 server.close();
});
