import assert from 'node:assert/strict';
import {browser} from './browser-support.mjs';
const b=await browser();
try{
 await b.viewport(1440,1100);
 await b.navigate('events.html','document.querySelectorAll(".event-card").length===5');
 await b.evaluate('localStorage.clear()');await b.navigate('events.html?check=clean','document.querySelectorAll(".event-card").length===5&&document.getElementById("saved-count").textContent==="0"');
 assert.equal(await b.evaluate('document.querySelector("#cases-view,#partners-view,.case-showcase,.partner-showcase,.hero-wave")===null'),true,'event page must contain only event content');
 assert.deepEqual(await b.evaluate('[...document.querySelectorAll(".event-card .date")].map(x=>x.textContent)'),['9 ноября','19 ноября','26 ноября','27–28 ноября','10 декабря']);
 await b.evaluate('document.querySelector("[data-category=forum]").click()');assert.equal(await b.evaluate('document.querySelectorAll(".event-card").length'),1);
 await b.evaluate('document.getElementById("reset").click();document.getElementById("search").value="Мурманск";document.getElementById("search").dispatchEvent(new Event("input"))');assert.equal(await b.evaluate('document.querySelectorAll(".event-card").length'),1);
 await b.evaluate('document.getElementById("reset").click();document.getElementById("region").value="Санкт-Петербург";document.getElementById("region").dispatchEvent(new Event("change"))');assert.equal(await b.evaluate('document.querySelectorAll(".event-card").length'),1);assert.match(await b.evaluate('document.getElementById("events-grid").textContent'),/Королевский/);
 await b.evaluate('document.getElementById("reset").click();document.querySelector("[data-save=kaliningrad]").click();document.getElementById("saved-button").click()');assert.equal(await b.evaluate('document.querySelectorAll(".event-card").length'),1);assert.equal(await b.evaluate('document.getElementById("section-title").textContent'),'Мои события');
 await b.evaluate('document.getElementById("reset").click();document.querySelector("[data-open=aij]").click()');await b.wait('document.getElementById("event-dialog").open');assert.match(await b.evaluate('document.getElementById("dialog-title").textContent'),/AI Journey/);
 await b.evaluate('document.getElementById("dialog-close").click();document.getElementById("calendar-view").click()');assert.equal(await b.evaluate('document.querySelectorAll(".calendar-event").length'),5);await b.evaluate('document.getElementById("next-month").click()');assert.equal(await b.evaluate('document.querySelectorAll(".calendar-event").length'),1);await b.evaluate('document.getElementById("grid-view").click()');
 // Preserve actual drag behavior in the secondary event carousel.
 await b.evaluate('document.getElementById("circle-motion").click();document.getElementById("circle-stage").scrollIntoView({block:"center",behavior:"instant"})');await b.delay(150);await b.evaluate('document.getElementById("circle-stage").focus({preventScroll:true})');await b.key('Home');await b.wait('document.getElementById("circle-stage").dataset.currentId==="lenoblast"');await b.delay(800);
 let rect=await b.bounds('#circle-stage'),start={x:rect.x+rect.width/2,y:rect.y+rect.height/2};
 await b.send('Input.dispatchMouseEvent',{type:'mouseMoved',...start});await b.send('Input.dispatchMouseEvent',{type:'mousePressed',...start,button:'left',buttons:1,clickCount:1});
 for(let i=1;i<=10;i++)await b.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:start.x-i*14,y:start.y,button:'left',buttons:1});
 await b.delay(140);await b.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:start.x-140,y:start.y,button:'left',buttons:0,clickCount:1});await b.wait('document.getElementById("circle-stage").dataset.currentId==="kaliningrad"');assert.equal(await b.evaluate('document.getElementById("event-dialog").open'),false);
 await b.navigate('events.html#event/aij','document.getElementById("event-dialog")?.open');await b.evaluate('document.getElementById("dialog-close").click()');await b.wait('location.hash===""');
 await b.navigate('cases.html','document.querySelectorAll(".case-card").length===9');assert.equal(await b.evaluate('document.querySelector("#events-view,#partners-view")===null'),true);assert.equal(await b.evaluate('document.querySelector("#site-navigation [aria-current=page]").dataset.page'),'cases');
 await b.evaluate('document.getElementById("case-more").click();document.getElementById("case-more").click()');assert.equal(await b.evaluate('document.querySelectorAll(".case-card").length'),20);
 await b.evaluate('document.getElementById("case-search").value="Петергоф";document.getElementById("case-search").dispatchEvent(new Event("input"))');assert.equal(await b.evaluate('document.querySelectorAll(".case-card").length'),1);
 await b.evaluate('document.querySelector("[data-case-save=case-02]").click();document.querySelector(".case-card h3 a").click()');await b.wait('document.getElementById("catalog-dialog").open');assert.match(await b.evaluate('document.getElementById("catalog-dialog-body").textContent'),/Показатели MVP/);
 await b.evaluate('document.getElementById("catalog-close").click();document.getElementById("case-reset").click();document.getElementById("case-favorites").click()');assert.equal(await b.evaluate('document.querySelectorAll(".case-card").length'),1);
 await b.navigate('cases.html#case/case-02','document.getElementById("catalog-dialog")?.open');await b.evaluate('document.getElementById("catalog-close").click()');await b.wait('location.hash===""');
 await b.navigate('partners.html','document.querySelectorAll(".partner-card").length===12');assert.equal(await b.evaluate('document.querySelector("#cases-view,#events-view")===null'),true);
 await b.evaluate('document.getElementById("partner-more").click()');assert.equal(await b.evaluate('document.querySelectorAll(".partner-card").length'),24);
 await b.evaluate('document.getElementById("partner-search").value="7840515640";document.getElementById("partner-search").dispatchEvent(new Event("input"))');assert.equal(await b.evaluate('document.querySelectorAll(".partner-card").length'),1);
 await b.evaluate('document.querySelector(".partner-card h3 a").click()');await b.wait('document.getElementById("catalog-dialog").open');assert.match(await b.evaluate('document.getElementById("catalog-dialog-body").textContent'),/ВЕЙВАКСЕСС СЕРВИС/);await b.evaluate('document.getElementById("catalog-close").click();document.getElementById("partner-reset").click();document.getElementById("partner-technology").value="Кибербезопасность";document.getElementById("partner-technology").dispatchEvent(new Event("change"))');assert.equal(await b.evaluate('document.querySelectorAll(".partner-card").length'),1);assert.match(await b.evaluate('document.getElementById("partner-grid").textContent'),/ОБИТ/);
 await b.click('#saved-button');await b.wait('location.pathname.endsWith("/events.html")&&document.querySelectorAll(".event-card").length===1');assert.equal(await b.evaluate('document.getElementById("section-title").textContent'),'Мои события');
 for(const width of [320,390,768,1440]){
  await b.viewport(width);for(const page of ['events','cases','partners']){
   await b.navigate(page+'.html',`document.body.dataset.page==="${page}"&&document.querySelectorAll('.${page==='events'?'event':page==='cases'?'case':'partner'}-card').length>0`);
   await b.evaluate('document.fonts.ready');await b.delay(100);assert.equal(await b.evaluate('document.documentElement.scrollWidth<=innerWidth'),true,`overflow ${width} ${page}`);
   assert.equal(await b.evaluate('getComputedStyle(document.body).fontFamily.includes("SB Sans Display")'),true);
   const before=await b.bounds('.header .brand');await b.evaluate('window.scrollTo({top:700,behavior:"instant"})');await b.delay(80);const after=await b.bounds('.header .brand');assert.equal(after.top,before.top,`logos must stay pinned on ${page}`);
   assert.equal(await b.evaluate('getComputedStyle(document.querySelector(".header")).backgroundColor'),'rgba(0, 0, 0, 0)');assert.equal(await b.evaluate('getComputedStyle(document.querySelector(".header")).backdropFilter'),'none');
   if(width===390||width===1440)await b.screenshot(`${page}-pinned-${width}`);
   await b.evaluate('window.scrollTo({top:0,behavior:"instant"})');if(width===390||width===1440)await b.screenshot(`${page}-page-${width}`);
  }
 }
 await b.navigate('index.html#cases','location.pathname.endsWith("cases.html")&&document.querySelectorAll(".case-card").length>0');
 assert.equal(await b.evaluate(`Promise.all([300,400,700].map(w=>document.fonts.load(w+' 18px "SB Sans Display"'))).then(all=>all.every(fonts=>fonts.length>0&&fonts.every(font=>font.status==='loaded')))`),true);
 assert.equal(await b.evaluate(`import('./media.js').then(async ({caseImages,sceneImages,eventImages})=>{const urls=[...Object.values(caseImages),...Object.values(sceneImages),...Object.values(eventImages)];return (await Promise.all(urls.map(src=>new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(image.naturalWidth>0);image.onerror=()=>resolve(false);image.src=src;})))).every(Boolean);})`),true);
 assert.deepEqual(b.errors,[]);console.log('PASS: separate real pages; event filters, favorites, calendar and mouse carousel; case/partner catalogs and details; legacy links; all fonts/images; fixed transparent header; 320/390/768/1440 layouts; no runtime errors.');
}finally{b.close();}
