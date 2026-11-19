import assert from 'node:assert/strict';
import {browser} from './browser-support.mjs';
const b=await browser();
const stageReady='document.getElementById("overview-stage")?.dataset.ready==="true"&&document.getElementById("overview-stage").dataset.busy==="false"';
const current=()=>b.evaluate('document.getElementById("overview-panel").dataset.section');
const select=async name=>{await b.evaluate(`document.getElementById('overview-tab-${name}').click()`);await wait(`${stageReady}&&document.getElementById('overview-panel').dataset.section==='${name}'`);};
async function wait(expression){for(let i=0;i<400;i++){if(await b.evaluate(expression))return;await b.delay(60);}throw Error('Timed out: '+expression);}
async function step(index){await b.evaluate('document.getElementById("overview-next").click()');await wait(`${stageReady}&&document.getElementById('overview-panel').dataset.step==='${index}'`);assert.doesNotMatch(await b.evaluate('document.getElementById("overview-step-description").textContent'),/Можно продолжить самостоятельно/);}
const child=expression=>b.evaluate(`(()=>{const d=document.getElementById('overview-frame').contentDocument;return (${expression})})()`);
try{
 await b.send('Page.bringToFront');await b.send('Emulation.setFocusEmulationEnabled',{enabled:true});await b.viewport(1440,1100);await b.navigate('overview.html',stageReady);await b.evaluate('document.fonts.ready');
 const saved=await b.evaluate('JSON.stringify(["dtaas-favorites","dtaas-case-favorites","dtaas-csm-checkup-v2","dtaas-csm-completed-v1"].map(k=>[k,localStorage.getItem(k)]))');
 assert.equal(await current(),'events');assert.equal(await b.evaluate('document.getElementById("overview-case-count").textContent'),'20');assert.equal(await b.evaluate('document.getElementById("overview-partner-count").textContent'),'68');
 await b.evaluate('document.getElementById("overview-auto").click()');
 for(let i=1;i<=6;i++){
  await step(i);
  if(i===2)assert.equal(await child('d.getElementById("region").value'),'Санкт-Петербург');
  if(i===3)assert.equal(await child('d.getElementById("event-dialog").open'),true);
  if(i===5){assert.equal(await b.evaluate('document.getElementById("overview-invitation").hidden'),false);assert.match(await b.evaluate('document.getElementById("overview-invitation-text").textContent'),/10 декабря 2026/);await b.evaluate('window.copied=[];Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:async text=>window.copied.push(text)}});document.querySelector("#overview-invitation [data-copy-invitation]").click()');await wait('window.copied.length===1');assert.match(await b.evaluate('window.copied[0]'),/Королевский Акселератор/);}
  if(i===6)assert.equal(await child('d.getElementById("calendar").hidden'),false);
 }
 await step(0);assert.equal(await current(),'cases');
 for(let i=1;i<=4;i++){await step(i);if(i===1)assert.equal(await child('d.querySelectorAll(".case-card").length'),1);if(i===3){assert.equal(await child('d.getElementById("catalog-dialog").open'),true);assert.match(await child('d.querySelector(".case-results").textContent'),/4 ч → 10 мин/);await b.evaluate('document.getElementById("overview-panel").scrollIntoView({behavior:"instant",block:"start"})');await b.screenshot('overview-case-detail-desktop');}}
 await step(0);assert.equal(await current(),'partners');
 for(let i=1;i<=4;i++){await step(i);if(i===1)assert.equal(await child('d.querySelectorAll(".partner-card").length'),1);if(i===3)assert.match(await child('d.querySelector(".partner-contacts").textContent'),/Петров Вадим/);}
 await step(0);assert.equal(await current(),'learning');
 for(let i=1;i<=4;i++){await step(i);if(i===1)assert.equal(await child('Boolean(d.querySelector(".question-options,.result-competencies"))'),true);if(i===3)assert.equal(await child('d.getElementById("lesson-dialog").open'),true);}
 await step(0);assert.equal(await current(),'chat');for(let i=1;i<=2;i++)await step(i);assert.equal(await child('Boolean(d.querySelector(".kv-helper-menu"))'),true);assert.equal(await child('d.querySelectorAll(".kv-message-user").length'),0);
 assert.equal(await b.evaluate('JSON.stringify(["dtaas-favorites","dtaas-case-favorites","dtaas-csm-checkup-v2","dtaas-csm-completed-v1"].map(k=>[k,localStorage.getItem(k)]))'),saved,'autoguide must not alter favorites or learning progress');
 await b.navigate('overview.html',stageReady);await b.evaluate('document.getElementById("overview-stage").scrollIntoView({block:"center",behavior:"instant"})');await wait('document.getElementById("overview-panel").dataset.step==="1"');assert.equal(await b.evaluate('document.getElementById("overview-panel").dataset.playing'),'true');
 // A trusted pointer event inside the actual preview hands control to the visitor.
 // The search may be above the preview after the carousel step. Bring it into view inside the child.
 await b.evaluate('document.getElementById("overview-frame").contentWindow.scrollTo({top:0,behavior:"instant"});document.getElementById("overview-stage").scrollIntoView({block:"start",behavior:"instant"})');await b.delay(450);
 const point=await child('(()=>{const r=d.getElementById("search").getBoundingClientRect(),f=document.getElementById("overview-frame").getBoundingClientRect();return {x:f.left+r.left+r.width/2,y:f.top+r.top+r.height/2}})()');
 await b.send('Page.bringToFront');await b.send('Input.dispatchMouseEvent',{type:'mouseMoved',...point});await b.delay(150);await b.send('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',buttons:1,clickCount:1});await b.send('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button:'left',buttons:0,clickCount:1});await wait('document.getElementById("overview-panel").dataset.playing==="false"');
 await b.evaluate('document.getElementById("overview-tab-cases").click();document.getElementById("overview-tab-partners").click();document.getElementById("overview-tab-learning").click()');await wait(`${stageReady}&&document.getElementById('overview-panel').dataset.section==='learning'`);await b.delay(200);assert.equal(await child('d.body.dataset.page'),'learning');
 for(const width of [320,390,768,1440]){
  await b.viewport(width,1100);await b.evaluate('window.scrollTo({top:0,behavior:"instant"})');await b.delay(100);assert.equal(await b.evaluate('document.documentElement.scrollWidth<=innerWidth'),true,`hero overflow ${width}`);if(width===390)await b.screenshot('overview-hero-mobile');
  for(const name of ['events','cases','partners','learning','chat']){await select(name);assert.equal(await b.evaluate('document.documentElement.scrollWidth<=innerWidth'),true,`${name} overflow ${width}`);assert.equal(await b.evaluate('document.querySelectorAll("[role=tab][aria-selected=true]").length'),1);assert.equal(await child('d.documentElement.scrollWidth<=d.defaultView.innerWidth'),true,`embedded ${name} overflow ${width}`);}
  if(width===390){await select('cases');await step(1);await step(2);await b.evaluate('document.getElementById("overview-stage").scrollIntoView({block:"start",behavior:"instant"})');await b.delay(250);await b.screenshot('overview-case-detail-mobile');await wait('document.getElementById("overview-close-detail").hidden===false');await b.evaluate('document.getElementById("overview-close-detail").click()');assert.equal(await child('d.getElementById("catalog-dialog").open'),false);}
 }
 await b.viewport(1440,1100);await select('events');await b.evaluate('document.getElementById("overview-fullscreen").scrollIntoView({block:"center",behavior:"instant"})');await b.click('#overview-fullscreen');await wait('document.fullscreenElement===document.getElementById("overview-panel")');await b.evaluate('document.exitFullscreen()');
 await b.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await b.navigate('overview.html',stageReady);assert.equal(await b.evaluate('document.getElementById("overview-panel").dataset.playing'),'false');await b.delay(250);assert.equal(await b.evaluate('document.getElementById("overview-panel").dataset.step'),'0');await select('cases');await b.evaluate('document.getElementById("overview-tab-cases").focus()');await b.key('ArrowRight');await wait(`${stageReady}&&document.getElementById('overview-panel').dataset.section==='partners'`);
 await b.send('Emulation.setEmulatedMedia',{features:[]});assert.deepEqual(b.errors,[]);console.log('PASS: five live sections, all guide actions, real filters and details, invitation copy, calendar, no automatic messages or saved-progress changes, automatic switching, trusted manual takeover, rapid switching, 320/390/768/1440 layouts, fullscreen and reduced motion.');
}finally{b.close();}
