import assert from 'node:assert/strict';
import {browser} from './browser-support.mjs';
const b=await browser();
try{
 await b.viewport(1440);await b.navigate('events.html','document.querySelectorAll(".event-card").length===7');
 await b.evaluate('document.querySelector(".favorite").scrollIntoView({block:"center",behavior:"instant"})');await b.delay(80);
 assert.equal(await b.evaluate('[...document.querySelectorAll(".favorite")].every(button=>{const a=button.getBoundingClientRect(),svg=button.querySelector("svg").getBoundingClientRect();return svg.left>=a.left&&svg.right<=a.right&&svg.top>=a.top&&svg.bottom<=a.bottom})'),true);
 const id=await b.evaluate('document.querySelector(".favorite").dataset.save'),before=await b.evaluate('document.querySelector(".favorite").getAttribute("aria-pressed")');
 await b.click('.favorite svg');assert.equal(await b.evaluate(`document.querySelector('[data-save="${id}"]').getAttribute('aria-pressed')`),before==='true'?'false':'true');assert.equal(await b.evaluate('document.getElementById("event-dialog").open'),false);
 await b.navigate('events.html#event/business-dinner','document.getElementById("event-dialog")?.open');
 assert.equal(await b.evaluate('document.querySelectorAll(".event-program li").length'),5);assert.equal(await b.evaluate('document.querySelectorAll(".event-speakers article").length'),3);
 assert.match(await b.evaluate('document.getElementById("dialog-body").textContent'),/Юсуповский дворец/);assert.match(await b.evaluate('document.getElementById("dialog-body").textContent'),/17:00–23:30/);
 assert.equal(await b.evaluate('document.querySelector(".ics-note")===null'),true);
 assert.equal(await b.evaluate('fetch(document.querySelector(".event-documents a").href).then(r=>r.ok)'),true);
 await b.evaluate('document.getElementById("dialog-close").click();document.getElementById("month").value="05";document.getElementById("month").dispatchEvent(new Event("change"))');
 assert.equal(await b.evaluate('document.querySelectorAll(".event-card").length'),1);assert.match(await b.evaluate('document.getElementById("datebar-month").textContent'),/май/i);assert.equal(await b.evaluate('document.querySelectorAll(".date-day").length'),31);
 await b.evaluate('document.getElementById("calendar-view").click()');assert.equal(await b.evaluate('document.querySelectorAll(".calendar-event").length'),4);
 await b.evaluate('document.getElementById("reset").click()');assert.match(await b.evaluate('document.querySelector(".calendar-heading").textContent'),/ноябрь/i);
 for(const width of [1440,390,320]){await b.viewport(width);for(const id of ['business-dinner','dss-spb']){await b.navigate(`events.html#event/${id}`,'document.getElementById("event-dialog")?.open');assert.equal(await b.evaluate('document.querySelector(".ics-note")===null'),true);assert.equal(await b.evaluate('document.documentElement.scrollWidth<=innerWidth'),true);assert.equal(await b.evaluate('document.getElementById("event-dialog").scrollWidth<=document.getElementById("event-dialog").clientWidth'),true);if(width!==320){await b.evaluate('document.querySelector(".event-program").scrollIntoView({block:"start",behavior:"instant"})');await b.screenshot(`new-event-${id}-${width}`);}}}
 assert.deepEqual(b.errors,[]);console.log('PASS: SVG favorites fit their circles and toggle without opening a dialog; event times, venues, agenda, speakers, PDFs, May calendar and reset; .ics note removed; desktop/mobile detail layouts.');
}finally{b.close();}
