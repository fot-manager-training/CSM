import assert from 'node:assert/strict';
import {browser} from './browser-support.mjs';
const b=await browser();
try{
 await b.viewport(1440);await b.navigate('cases.html','document.querySelectorAll(".case-card").length===9');
 // New secondary outcomes must be discoverable, not only visible inside a dialog.
 await b.evaluate('document.getElementById("case-search").value="0,01%";document.getElementById("case-search").dispatchEvent(new Event("input"))');
 assert.equal(await b.evaluate('document.querySelectorAll(".case-card").length'),1);
 await b.evaluate('document.querySelector(".case-cover").scrollIntoView({block:"center",behavior:"instant"})');await b.delay(100);await b.click('.case-cover');await b.wait('document.getElementById("catalog-dialog").open');
 assert.match(await b.evaluate('document.getElementById("catalog-dialog-body").textContent'),/10% → 0,01%/);
 assert.equal(await b.evaluate('document.querySelectorAll(".case-results>div").length'),2);
 await b.evaluate('document.getElementById("catalog-close").click()');
 // Verify the longest result set and a case without numerical outcomes at both sizes.
 for(const width of [1440,390,320]){
  await b.viewport(width);
  for(const [id,count] of [['case-02',2],['case-15',6],['case-17',6],['case-16',0],['case-23',0]]){
   await b.navigate(`cases.html#case/${id}`,'document.getElementById("catalog-dialog")?.open');
   assert.equal(await b.evaluate('document.querySelectorAll(".case-results>div").length'),count);
   if(id!=='case-23'){
    assert.match(await b.evaluate('document.getElementById("catalog-dialog-body").textContent'),/Заявки все 2026.pptx · слайд/);
    assert.equal(await b.evaluate('document.querySelector("#catalog-dialog .dialog-actions a")===null'),true,'new document must not link to the old source');
   }
   if(id==='case-15')assert.equal(await b.evaluate('[...document.querySelectorAll(".case-results dt")].every(x=>x.textContent==="Пилот и ожидаемые показатели")'),true);
   if(id==='case-17')assert.match(await b.evaluate('document.querySelector(".case-results").textContent'),/30% от текущего времени/);
   if(id==='case-16')assert.match(await b.evaluate('document.getElementById("catalog-dialog-body").textContent'),/Количественные метрики не указаны/);
   if(id==='case-23')assert.equal(await b.evaluate('document.querySelector("#catalog-dialog .dialog-actions a").textContent.trim()'),'Источник');
   assert.equal(await b.evaluate('document.documentElement.scrollWidth<=innerWidth'),true,`page overflow ${id} at ${width}`);
   assert.equal(await b.evaluate('document.getElementById("catalog-dialog").scrollWidth<=document.getElementById("catalog-dialog").clientWidth'),true,`dialog overflow ${id} at ${width}`);
   if(id==='case-17'&&width!==320){await b.evaluate('document.querySelector(".case-results").scrollIntoView({block:"start",behavior:"instant"})');await b.screenshot(`case-supplements-${width}`);}
  }
 }
 // A long dialog must still allow saving and closing with a keyboard.
 await b.evaluate('document.getElementById("catalog-dialog-save").scrollIntoView({block:"center",behavior:"instant"})');
 const wasSaved=await b.evaluate('document.getElementById("catalog-dialog-save").getAttribute("aria-pressed")');await b.click('#catalog-dialog-save');assert.equal(await b.evaluate('document.getElementById("catalog-dialog-save").getAttribute("aria-pressed")'),wasSaved==='true'?'false':'true');
 await b.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27,nativeVirtualKeyCode:27});await b.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27,nativeVirtualKeyCode:27});await b.wait('!document.getElementById("catalog-dialog").open');
 assert.deepEqual(b.errors,[]);
 console.log('PASS: new outcome search, complete result lists, source attribution, mixed target/pilot context, no fabricated numbers, original Samokat source, save/close, desktop and 320/390 mobile dialogs.');
}finally{b.close();}
