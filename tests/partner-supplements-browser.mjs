import assert from 'node:assert/strict';
import {browser} from './browser-support.mjs';
const b=await browser();
const search=value=>b.evaluate(`document.getElementById('partner-search').value=${JSON.stringify(value)};document.getElementById('partner-search').dispatchEvent(new Event('input'))`);
try{
 await b.viewport(1440);await b.navigate('partners.html','document.querySelectorAll(".partner-card").length===36');
 await search('Петров Вадим');assert.equal(await b.evaluate('document.querySelectorAll(".partner-card").length'),1);
 await b.evaluate('document.querySelector(".partner-cover").scrollIntoView({block:"center",behavior:"instant"})');await b.delay(80);await b.click('.partner-cover');await b.wait('document.getElementById("catalog-dialog").open');
 assert.equal(await b.evaluate('document.querySelector("#catalog-dialog a.primary-button").href'),'https://ramax.ru/');
 assert.equal(await b.evaluate('document.querySelectorAll(".partner-contact a[href^=mailto]").length'),1);
 assert.equal(await b.evaluate('document.querySelectorAll(".partner-contact a[href^=tel]").length'),1);
 assert.match(await b.evaluate('document.getElementById("catalog-dialog-body").textContent'),/Добыча полезных ископаемых/);
 assert.match(await b.evaluate('document.getElementById("catalog-dialog-body").textContent'),/не география оказания услуг/);
 await b.evaluate('document.getElementById("catalog-close").click();document.getElementById("partner-reset").click();document.getElementById("partner-role").value="Разработчик";document.getElementById("partner-role").dispatchEvent(new Event("change"))');
 await search('ИНФИНАЙТ СИНЕРДЖИ');assert.equal(await b.evaluate('document.querySelectorAll(".partner-card").length'),1);
 await b.evaluate('document.getElementById("partner-reset").click();document.getElementById("partner-technology").value="Сервисы Сбера (API)";document.getElementById("partner-technology").dispatchEvent(new Event("change"))');await search('LAND PRO');assert.equal(await b.evaluate('document.querySelectorAll(".partner-card").length'),1);
 await b.evaluate('document.getElementById("partner-reset").click();while(!document.getElementById("partner-more").hidden)document.getElementById("partner-more").click()');assert.equal(await b.evaluate('document.querySelectorAll(".partner-card").length'),68);
 for(const width of [1440,390,320]){
  await b.viewport(width);
  for(const id of ['partner-1','partner-3','partner-10','partner-64','partner-68']){
   await b.navigate(`partners.html#partner/${id}`,'document.getElementById("catalog-dialog")?.open');
   assert.doesNotMatch(await b.evaluate('document.getElementById("catalog-dialog-body").textContent'),/Источник:|Сайт-источник|Партнеры\.xlsx/);
   assert.equal(await b.evaluate('document.querySelector("#catalog-dialog .catalog-detail-portfolio,#catalog-dialog .dialog-actions .outline-button")===null'),true);
   assert.equal(await b.evaluate('document.documentElement.scrollWidth<=innerWidth'),true,`page overflow ${width}`);
   assert.equal(await b.evaluate('document.getElementById("catalog-dialog").scrollWidth<=document.getElementById("catalog-dialog").clientWidth'),true,`dialog overflow ${id} at ${width}`);
   assert.equal(await b.evaluate('[...document.querySelectorAll("#catalog-dialog a")].every(a=>["https:","http:","mailto:","tel:"].includes(new URL(a.href).protocol))'),true);
   if(id==='partner-10'){
    assert.equal(await b.evaluate('document.querySelectorAll(".partner-contact,#catalog-dialog a.primary-button").length'),0);
    assert.doesNotMatch(await b.evaluate('document.getElementById("catalog-dialog-body").textContent'),/контакт в почте/);
   }
   if(id==='partner-64')assert.match(await b.evaluate('document.getElementById("catalog-dialog-body").textContent'),/Требует уточнения в реестре/);
   if(id==='partner-3'&&width!==320){await b.evaluate('document.querySelector(".partner-contacts").scrollIntoView({block:"center",behavior:"instant"})');await b.screenshot(`partner-supplements-${width}`);}
  }
 }
 await b.viewport(390);await b.navigate('index.html','document.querySelectorAll(".partner-profile").length===8');assert.equal(await b.evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
 assert.deepEqual(b.errors,[]);
 console.log('PASS: contact/industry/product/role search, full 68 records, business links without source references, unknown fields preserved, invalid registry INN marked, desktop and 320/390 dialogs, home layout, no runtime errors.');
}finally{b.close();}
