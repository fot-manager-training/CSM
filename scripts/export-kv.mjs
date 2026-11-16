import {writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {loadKnowledge,fieldKeys} from '../server/kv-knowledge.mjs';

// The owner requested a shared public KV base. Export values, never external formulas.
const input=resolve(process.argv[2]||'server/private/kv-knowledge.json');
const output=resolve(process.argv[3]||'public/assets/kv/knowledge.json');
const source=await loadKnowledge(input);
const records=source.records.map(row=>({id:row.id,provider:row.provider,product:row.product,sheet:row.sheet,row:row.row,range:row.range,
 fields:Object.fromEntries(fieldKeys.map(key=>{const field=row.fields[key];return [key,{label:field.label,value:field.value,display:field.display,cell:field.cell}];}))}));
const data={schemaVersion:1,filename:source.filename,sha256:source.sha256,sheets:source.sheets,notes:source.notes,records};
await mkdir(dirname(output),{recursive:true});await writeFile(output,JSON.stringify(data)+'\n');
console.log(`Exported shared KV base: ${records.length} rows, ${new Set(records.map(r=>JSON.stringify([r.provider,r.product]))).size} products; no formulas.`);
