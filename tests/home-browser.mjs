import assert from 'node:assert/strict';
import {browser} from './browser-support.mjs';
const b=await browser();
try{
 await b.viewport(1440,1100);await b.navigate('index.html','document.body.dataset.page==="home"&&document.querySelectorAll(".circle-cover").length===8&&document.querySelectorAll(".accordion-item").length===6');
 assert.equal(await b.evaluate('document.querySelector(".hero").getBoundingClientRect().top'),0,'hero must continue behind the fixed header');assert.match(await b.evaluate('getComputedStyle(document.querySelector(".hero")).backgroundImage'),/linear-gradient/);
 assert.equal(await b.evaluate('document.querySelector(".hero-mascot,#cybercat-viewer,.connection")===null'),true);assert.equal(await b.evaluate('performance.getEntriesByType("resource").some(x=>/cybercat|three.module/.test(x.name))'),false);
 assert.match(await b.evaluate('document.querySelector("h1").textContent'),/скажите «да»/);assert.equal(await b.evaluate('document.querySelector("#site-navigation [aria-current=page]").dataset.page'),'home');
 assert.equal(await b.evaluate('document.querySelector("#events-view,#cases-view,#partners-view")===null'),true);
 await b.evaluate('document.querySelectorAll("[data-expand-case]")[1].click()');assert.equal(await b.evaluate('document.querySelector(".accordion-item.is-expanded").dataset.casePanel'),'case-02');assert.equal(await b.evaluate('document.querySelector(".accordion-item.is-expanded .accordion-copy a").getAttribute("href")'),'./cases.html#case/case-02');
 await b.evaluate('document.querySelector(".accordion-item.is-expanded .accordion-copy a").click()');await b.wait('location.pathname.endsWith("cases.html")&&document.getElementById("catalog-dialog")?.open');await b.evaluate('document.getElementById("catalog-close").click()');await b.click('.header .brand');await b.wait('document.body.dataset.page==="home"&&document.querySelectorAll(".circle-cover").length===8');
 await b.evaluate('document.querySelector("[data-category=accelerator]").click()');assert.equal(await b.evaluate('document.querySelectorAll(".circle-cover").length'),1);assert.match(await b.evaluate('document.querySelector(".circle-cover img").src'),/royal-spb\.webp/);
 await b.evaluate('document.querySelector(".circle-cover").click()');await b.wait('location.pathname.endsWith("events.html")&&document.getElementById("event-dialog")?.open');assert.match(await b.evaluate('document.querySelector(".dialog-poster img").src'),/royal-spb\.webp/);assert.match(await b.evaluate('document.getElementById("dialog-body").textContent'),/Санкт-Петербург/);
 for(const width of [320,390,768,1440]){
  await b.viewport(width);await b.navigate('index.html', 'document.body.dataset.page==="home"&&document.querySelectorAll(".partner-profile").length===8');await b.evaluate('document.fonts.ready');await b.delay(250);
  assert.equal(await b.evaluate('document.documentElement.scrollWidth<=innerWidth'),true,`home overflow at ${width}`);
  const before=await b.bounds('.header .brand');await b.evaluate('window.scrollTo({top:700,behavior:"instant"})');await b.delay(80);assert.equal((await b.bounds('.header .brand')).top,before.top);assert.equal(await b.evaluate('getComputedStyle(document.querySelector(".header")).backgroundColor'),'rgba(0, 0, 0, 0)');
  await b.evaluate('window.scrollTo({top:0,behavior:"instant"})');if(width===390||width===1440){await b.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await b.delay(100);await b.screenshot(`restored-home-${width}`);await b.send('Emulation.setEmulatedMedia',{features:[]});}
 }
 await b.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await b.wait('document.querySelector(".hero-wave").animationsPaused()');
 assert.deepEqual(b.errors,[]);console.log('PASS: restored home; standalone catalog links; logos return home; live case previews; generated Saint Petersburg image on event detail and carousel; fixed transparent header, continuous hero background and no mascot; 320/390/768/1440; reduced motion; no runtime errors.');
}finally{b.close();}
