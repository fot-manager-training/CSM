import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const pages=['events','cases','partners'];
test('each section is an independently loadable HTML page with a correct menu',async()=>{
 for(const page of pages){const html=await readFile(new URL(`../public/${page}.html`,import.meta.url),'utf8');assert.match(html,new RegExp(`body data-page="${page}"`));assert.match(html,new RegExp(`id="${page}-view"`));assert.match(html,new RegExp(`data-page="${page}" aria-current="page"`));for(const other of pages){assert.match(html,new RegExp(`href="./${other}.html"`));if(other!==page)assert.doesNotMatch(html,new RegExp(`id="${other}-view"`));}assert.doesNotMatch(html,/case-showcase|partner-showcase|hero-wave|connection-title/);}
});
test('the root restores the home while all catalogs stay separate',async()=>{const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');assert.match(html,/body data-page="home"/);assert.match(html,/hero-wave/);assert.match(html,/id="cybercat-viewer"/);assert.match(html,/case-showcase/);assert.match(html,/partner-showcase/);assert.match(html,/data-page="home" aria-current="page"/);for(const page of pages){assert.match(html,new RegExp(`href="./${page}.html"`));assert.doesNotMatch(html,new RegExp(`id="${page}-view"`));}});
