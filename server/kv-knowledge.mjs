import {readFile} from 'node:fs/promises';
import {validateKnowledge} from '../public/kv-lookup.js';
import {neutralKnowledge} from '../public/neutral-content.js';
export * from '../public/kv-lookup.js';
export async function loadKnowledge(filename){
 return neutralKnowledge(validateKnowledge(JSON.parse(await readFile(filename,'utf8'))));
}
