import assert from 'node:assert/strict';
import {browser} from './browser-support.mjs';
const b=await browser(),isOpen=()=>b.evaluate('document.getElementById("menu-toggle").getAttribute("aria-expanded")==="true"');
try{
 await b.viewport(1440);await b.navigate('events.html','document.querySelectorAll(".event-card").length===5');assert.equal(await isOpen(),false);assert.equal(await b.evaluate('document.getElementById("site-navigation").inert'),true);
 await b.click('#menu-toggle');assert.equal(await isOpen(),true);await b.delay(450);
 assert.equal(await b.evaluate('getComputedStyle(document.getElementById("site-navigation")).backgroundColor'),'rgba(0, 0, 0, 0)');assert.equal(await b.evaluate('getComputedStyle(document.querySelector("#site-navigation .active")).backgroundColor'),'rgb(234, 240, 255)');
 await b.click('#site-navigation [data-page=cases]');await b.wait('location.pathname.endsWith("cases.html")&&document.querySelectorAll(".case-card").length===9');assert.equal(await isOpen(),false);assert.equal(await b.evaluate('document.querySelector("#site-navigation [aria-current=page]").dataset.page'),'cases');
 await b.click('#menu-toggle');await b.key('Escape');assert.equal(await isOpen(),false);assert.equal(await b.evaluate('document.activeElement.id'),'menu-toggle');
 await b.key('ArrowDown');await b.wait('document.activeElement.dataset.page==="home"');await b.key('End');assert.equal(await b.evaluate('document.activeElement.dataset.page'),'partners');await b.key('ArrowDown');assert.equal(await b.evaluate('document.activeElement.dataset.page'),'home');await b.key('Escape');
 await b.click('#menu-toggle');await b.delay(450);await b.click('#site-navigation [data-page=partners]');await b.wait('location.pathname.endsWith("partners.html")&&document.querySelectorAll(".partner-card").length===12');
 await b.evaluate('history.back()');await b.wait('location.pathname.endsWith("cases.html")&&document.querySelectorAll(".case-card").length>0');
 for(const width of [320,390,768,1440]){
  await b.viewport(width);await b.evaluate('window.scrollTo({top:600,behavior:"instant"})');await b.delay(100);
  assert.ok((await b.bounds('.header .brand')).top>=0);assert.ok((await b.bounds('#menu-toggle')).top>=0);
  if(width===390){await b.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});const rect=await b.bounds('#menu-toggle');await b.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:rect.x+rect.width/2,y:rect.y+rect.height/2}]});await b.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await b.send('Emulation.setTouchEmulationEnabled',{enabled:false});}
  else await b.click('#menu-toggle');
  await b.wait('document.getElementById("menu-toggle").getAttribute("aria-expanded")==="true"');await b.delay(500);
  assert.equal(await b.evaluate('document.documentElement.scrollWidth<=innerWidth'),true,`menu overflow at ${width}`);
  assert.equal(await b.evaluate('[...document.querySelectorAll("#site-navigation a")].every(x=>{const r=x.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;})'),true);
  await b.screenshot(`menu-pinned-${width}`);await b.click('#menu-toggle');assert.equal(await isOpen(),false);
 }
 await b.click('#menu-toggle');await b.delay(450);await b.click('#content');assert.equal(await isOpen(),false);
 await b.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await b.click('#menu-toggle');assert.equal(await b.evaluate('getComputedStyle(document.querySelector("#site-navigation a")).animationName'),'none');await b.key('Escape');
 assert.deepEqual(b.errors,[]);console.log('PASS: real page navigation and browser back; fixed transparent header; floating menu with unified palette; keyboard and touch; 320/390/768/1440; reduced motion.');
}finally{b.close();}
