import {readFile} from 'node:fs/promises';
import {validateKnowledge} from '../public/kv-lookup.js';
export * from '../public/kv-lookup.js';
export async function loadKnowledge(filename){
 return validateKnowledge(JSON.parse(await readFile(filename,'utf8')));
}
