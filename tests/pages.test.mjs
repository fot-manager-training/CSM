import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const pages=['events','cases','partners'];
test('each section is an independently loadable HTML page with a correct menu',async()=>{
 for(const page of pages){const html=await readFile(new URL(`../public/${page}.html`,import.meta.url),'utf8');assert.match(html,new RegExp(`body data-page="${page}"`));assert.match(html,new RegExp(`id="${page}-view"`));assert.match(html,new RegExp(`data-page="${page}" aria-current="page"`));for(const other of pages){assert.match(html,new RegExp(`href="./${other}.html"`));if(other!==page)assert.doesNotMatch(html,new RegExp(`id="${other}-view"`));}assert.doesNotMatch(html,/case-showcase|partner-showcase|hero-wave|connection-title/);}
});
test('the root page opens the event catalog without a separate landing',async()=>{assert.equal(await readFile(new URL('../public/index.html',import.meta.url),'utf8'),await readFile(new URL('../public/events.html',import.meta.url),'utf8'));});
