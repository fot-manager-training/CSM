import {validateKnowledge} from './kv-lookup.js?v=recovery-v2-20261117';
import {neutralKnowledge} from './neutral-content.js?v=neutral-20261117';
let pending;
export function loadSharedKnowledge(){
 if(!pending)pending=(async()=>{
  const response=await fetch(new URL('./assets/kv/knowledge.json?v=neutral-20261117',import.meta.url),{credentials:'omit',signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw Error('Shared KV base unavailable');
  const text=await response.text();if(text.length>4*1024*1024)throw Error('Shared KV base too large');
  return neutralKnowledge(validateKnowledge(JSON.parse(text)));
 })().catch(error=>{pending=null;throw error;});
 return pending;
}
