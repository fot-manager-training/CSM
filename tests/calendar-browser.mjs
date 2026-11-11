import assert from 'node:assert/strict';
import {browser} from './browser-support.mjs';
const b=await browser();
try{
 await b.viewport(1440,1100);await b.navigate('events.html','document.querySelectorAll(".event-card").length===8');
 assert.equal(await b.evaluate('getComputedStyle(document.getElementById("date-track")).overflowY'),'hidden');
 assert.equal(await b.evaluate('(()=>{const t=document.getElementById("date-track");t.scrollTop=50;return t.scrollTop})()'),0);
 for(const id of ['date-track','spotlight-track'])assert.equal(await b.evaluate(`getComputedStyle(document.getElementById('${id}'),'::-webkit-scrollbar').display`),'none');
 await b.evaluate('document.getElementById("calendar-view").click()');
 assert.equal(await b.evaluate('document.querySelectorAll(".calendar-event img").length'),5);
 assert.equal(await b.evaluate('document.querySelectorAll(".calendar-legend li").length'),4);
 assert.equal(await b.evaluate('new Set([...document.querySelectorAll(".calendar-event")].map(e=>getComputedStyle(e).backgroundColor)).size'),4);
 assert.equal(await b.evaluate('new Set([...document.querySelectorAll(\'.calendar-event[data-open="aij"]\')].map(e=>getComputedStyle(e).backgroundColor)).size'),1);
 await b.evaluate('document.querySelector(\'.calendar-event[data-open="murmansk"] img\').scrollIntoView({block:"center",behavior:"instant"})');await b.click('.calendar-event[data-open="murmansk"] img');await b.wait('document.getElementById("event-dialog").open');assert.match(await b.evaluate('document.getElementById("dialog-title").textContent'),/Мурманске/);await b.evaluate('document.getElementById("dialog-close").click();document.getElementById("next-month").click()');
 assert.equal(await b.evaluate('document.querySelectorAll(".calendar-event img").length'),2);assert.equal(await b.evaluate('document.querySelectorAll(".calendar-legend li").length'),2);
 await b.evaluate('document.getElementById("month").value="05";document.getElementById("month").dispatchEvent(new Event("change"))');assert.equal(await b.evaluate('document.querySelectorAll(".calendar-event img").length'),4);assert.equal(await b.evaluate('document.querySelectorAll(".calendar-legend li").length'),1);
 await b.evaluate('document.getElementById("reset").click()');
 for(const width of [320,390,768,1440]){
  await b.viewport(width,1100);await b.evaluate('document.getElementById("calendar").scrollIntoView({block:"start",behavior:"instant"});window.scrollBy({top:-110,behavior:"instant"})');await b.delay(150);
  assert.equal(await b.evaluate('document.documentElement.scrollWidth<=innerWidth'),true,`calendar overflow at ${width}`);
  assert.equal(await b.evaluate('document.getElementById("calendar").scrollWidth<=document.getElementById("calendar").clientWidth'),true);
  if(width===390||width===1440)await b.screenshot(`calendar-previews-${width}`);
 }
 assert.deepEqual(b.errors,[]);console.log('PASS: date rail cannot scroll vertically; hidden WebKit scrollbars; calendar thumbnails, four unique event colours and legend, thumbnail opens event, multi-day events, month changes, 320/390/768/1440.');
}finally{b.close();}
