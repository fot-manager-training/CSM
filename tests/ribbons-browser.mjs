import assert from 'node:assert/strict';
import {browser} from './browser-support.mjs';
const b=await browser();
const ribbonCount=()=>b.evaluate('document.querySelector("main > .ribbon-layer").children.length');
try{
 for(const page of ['index','events','cases','partners']){
  const ready=page==='index'?'document.querySelectorAll(".partner-profile").length===8':page==='events'?'document.querySelectorAll(".event-card").length===5':`document.querySelectorAll('.${page==='cases'?'case':'partner'}-card').length>0`;
  await b.viewport(1440);await b.navigate(`${page}.html`,ready);
  await b.wait('document.querySelectorAll(".background-ribbon").length>1');
  assert.equal(await b.evaluate('[...document.querySelectorAll(".ribbon-layer")].every(x=>x.getAttribute("aria-hidden")==="true"&&getComputedStyle(x).pointerEvents==="none")'),true);
  const variants=await b.evaluate('[...new Set([...document.querySelectorAll(".background-ribbon")].map(x=>x.dataset.variant))]');
  assert.ok(variants.some(x=>['loop','coil'].includes(x)),`${page}: loop variant`);
  assert.ok(variants.some(x=>!['loop','coil'].includes(x)),`${page}: open curve variant`);
  for(const width of [320,390,480,768,1440]){
   await b.viewport(width);await b.evaluate('document.fonts.ready');await b.delay(80);
   assert.equal(await b.evaluate('document.documentElement.scrollWidth<=innerWidth'),true,`${page}: overflow at ${width}`);
   if(page==='events'){
    const toggle=await b.bounds('.afisha-filterbar .view-toggle'),bar=await b.bounds('.afisha-filterbar');
    assert.ok(toggle.top>=bar.top&&toggle.bottom<=bar.bottom+1,`filter controls at ${width}`);
   }
  }
  if(page==='cases'||page==='partners'){
   const kind=page==='cases'?'case':'partner';await b.viewport(390);await b.delay(120);
   const before=await ribbonCount();
   await b.evaluate(`document.getElementById('${kind}-more').scrollIntoView({block:'center',behavior:'instant'})`);
   await b.click(`#${kind}-more`);await b.wait(`document.querySelector('main > .ribbon-layer').children.length>${before}`);
   const field=`document.getElementById('${kind}-search')`;
   await b.evaluate(`${field}.value='zzz-no-results';${field}.dispatchEvent(new Event('input',{bubbles:true}))`);
   await b.wait(`document.querySelector('main > .ribbon-layer').children.length<${before}`);
   assert.equal(await b.evaluate(`document.getElementById('${kind}-empty').hidden`),false);
  }
 }
 assert.deepEqual(b.errors,[]);
 console.log('PASS: decorative waves and loops on all pages, no pointer interception, background grows/shrinks with catalogs, filter controls and no overflow at 320/390/480/768/1440.');
}finally{b.close();}
