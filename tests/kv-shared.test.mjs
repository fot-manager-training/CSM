import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateKnowledge,fieldKeys,groupSources,publicRecord,retrieve} from '../public/kv-lookup.js';
test('shared KV base is complete, usable without a server and excludes original formulas',async()=>{
 const raw=await readFile(new URL('../public/assets/kv/knowledge.json',import.meta.url),'utf8');
 const data=validateKnowledge(JSON.parse(raw));assert.equal(data.records.length,174);
 const products=groupSources(data.records.map(publicRecord));assert.equal(products.length,80);
 assert.equal(products.reduce((sum,p)=>sum+p.variants.length,0),129);
 assert.equal(products.flatMap(p=>p.variants).reduce((sum,v)=>sum+v.references.length,0),174);
 for(const row of data.records)for(const key of fieldKeys)assert.deepEqual(Object.keys(row.fields[key]).sort(),['cell','display','label','value']);
 assert.doesNotMatch(raw,/"formula"|DEEPSEEK_API_KEY|sk-[A-Za-z0-9]{20,}|\[1\]!|server\/private/);
 const pak=groupSources(retrieve(data,'ГигаЧат для бизнеса ПАК').records.map(publicRecord));
 assert.equal(pak.length,1);assert.equal(pak[0].variants.length,2);
});
