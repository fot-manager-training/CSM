import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const targets=await(await fetch('http://127.0.0.1:9222/json')).json();
const ws=new WebSocket(targets[0].webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
let seq=0;const queue=new Map();const errors=[];
ws.onmessage=e=>{const msg=JSON.parse(e.data);if(msg.id){const p=queue.get(msg.id);queue.delete(msg.id);msg.error?p.reject(msg.error):p.resolve(msg.result);}if(msg.method==='Runtime.exceptionThrown')errors.push(msg.params.exceptionDetails.text);};
const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;queue.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
const wait=async expression=>{for(let i=0;i<80;i++){if(await evaluate(expression))return;await new Promise(r=>setTimeout(r,50));}throw Error('Timed out: '+expression);};
try{
 await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:process.env.APP_URL || 'http://127.0.0.1:3000/'});await wait('document.querySelectorAll(".event-card").length===5');
 assert.equal(await evaluate('document.title'),'DTaaS · Северо-Запад — цифровая трансформация');
 await evaluate('localStorage.clear()');await send('Page.reload');await wait('document.querySelectorAll(".event-card").length===5 && document.getElementById("saved-count").textContent==="0"');
 await evaluate('document.querySelector("[data-category=forum]").click()');assert.equal(await evaluate('document.querySelectorAll(".event-card").length'),1);
 await evaluate('document.getElementById("reset").click();document.getElementById("search").value="Мурманск";document.getElementById("search").dispatchEvent(new Event("input"))');assert.equal(await evaluate('document.querySelectorAll(".event-card").length'),1);
 await evaluate('document.getElementById("reset").click();document.querySelector("[data-save=kaliningrad]").click()');assert.equal(await evaluate('JSON.parse(localStorage.getItem("dtaas-favorites"))[0]'),'kaliningrad');
 await evaluate('document.getElementById("saved-button").click()');assert.equal(await evaluate('document.querySelectorAll(".event-card").length'),1);
 await evaluate('document.getElementById("reset").click();document.querySelector("[data-open=aij]").click()');assert.equal(await evaluate('document.getElementById("event-dialog").open'),true);assert.match(await evaluate('document.getElementById("dialog-title").textContent'),/AI Journey/);
 await evaluate('document.getElementById("dialog-close").click();document.getElementById("calendar-view").click()');assert.equal(await evaluate('document.querySelectorAll(".calendar-event").length'),5);
 await evaluate('document.getElementById("next-month").click()');assert.equal(await evaluate('document.querySelectorAll(".calendar-event").length'),1);
 await evaluate('location.hash="cases"');await wait('!document.getElementById("cases-view").hidden');assert.equal(await evaluate('document.querySelector("#cases-view a").hostname'),'sber-northwest-casebook.tenderlion1.chatgpt.site');
 await evaluate('location.hash="partners"');await wait('!document.getElementById("partners-view").hidden');
 await evaluate('location.hash="event/aij"');await wait('document.getElementById("event-dialog").open');await evaluate('document.getElementById("dialog-close").click();document.getElementById("reset").click();document.getElementById("grid-view").click();window.scrollTo(0,0)');
 await evaluate('document.getElementById("toast").classList.remove("visible")');await new Promise(r=>setTimeout(r,700));
 let shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile('artifacts/desktop.png',Buffer.from(shot.data,'base64'));
 for(const width of [390,768,1440]){await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<500});await new Promise(r=>setTimeout(r,100));assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'),`overflow at ${width}`);if(width===390){shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile('artifacts/mobile.png',Buffer.from(shot.data,'base64'));}}
 assert.deepEqual(errors,[]);console.log('PASS: browser navigation, search, category filters, favorites, dialog, calendar, deep link, source links; responsive at 390/768/1440; no runtime errors.');
}finally{ws.close();}
