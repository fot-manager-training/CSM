import {readFile} from 'node:fs/promises';
import {fieldKeys} from '../public/kv-lookup.js';
export * from '../public/kv-lookup.js';
export async function loadKnowledge(filename){
 const data=JSON.parse(await readFile(filename,'utf8'));
 if(data.schemaVersion!==1||!Array.isArray(data.records)||!data.records.length||data.records.length>5000)throw Error('Invalid knowledge file');
 const ids=new Set();
 for(const row of data.records){
  if(!row.id||ids.has(row.id)||!row.provider||!row.product||!Number.isInteger(row.row)||!row.sheet)throw Error('Invalid knowledge record');
  ids.add(row.id);for(const key of fieldKeys)if(!Number.isFinite(row.fields?.[key]?.value)||typeof row.fields[key].display!=='string')throw Error('Invalid knowledge field');
 }
 return data;
}
