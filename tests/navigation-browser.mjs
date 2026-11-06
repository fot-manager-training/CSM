import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const targets=await(await fetch('http://127.0.0.1:9222/json')).json();
const ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
let seq=0;const queue=new Map(),errors=[];
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=queue.get(m.id);queue.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);};
const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;queue.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const wait=async expression=>{for(let i=0;i<100;i++){if(await evaluate(expression))return;await delay(50);}throw Error('Timed out: '+expression);};
const open=()=>evaluate('document.getElementById("menu-toggle").getAttribute("aria-expanded")==="true"');
const key=(key,extra={})=>send('Input.dispatchKeyEvent',{type:'keyDown',key,code:key,...extra});
const click=async selector=>{const b=await evaluate(`document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect().toJSON()`);const position={x:b.x+b.width/2,y:b.y+b.height/2};await send('Input.dispatchMouseEvent',{type:'mouseMoved',...position});await send('Input.dispatchMouseEvent',{type:'mousePressed',...position,button:'left',buttons:1,clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...position,button:'left',buttons:0,clickCount:1});};
try{
 await mkdir('artifacts',{recursive:true});await send('Runtime.enable');await send('Page.enable');await send('Emulation.setTouchEmulationEnabled',{enabled:false});await send('Emulation.setEmulatedMedia',{features:[]});await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:process.env.APP_URL||'http://127.0.0.1:3000/'});await wait('document.querySelectorAll(".event-card").length===5');
 await evaluate('document.fonts.ready');assert.equal(await open(),false);assert.equal(await evaluate('document.getElementById("site-navigation").inert'),true);
 await evaluate('document.querySelector("#site-navigation a").focus()');assert.equal(await evaluate('document.activeElement.closest("#site-navigation")===null'),true,'collapsed navigation must not receive focus');
 await click('#menu-toggle');assert.equal(await open(),true);await delay(500);
 assert.equal(await evaluate('getComputedStyle(document.getElementById("site-navigation")).backgroundColor'),'rgba(0, 0, 0, 0)');assert.equal(await evaluate('getComputedStyle(document.querySelector("#site-navigation .active")).backgroundColor'),'rgb(186, 255, 0)');
 assert.equal(await evaluate('getComputedStyle(document.querySelector("#site-navigation a")).animationName'),'menu-oval-arrive');
 await click('#site-navigation [data-page="cases"]');await wait('location.hash==="#cases"&&!document.getElementById("cases-view").hidden');assert.equal(await open(),false);
 await evaluate('window.scrollTo({top:0,behavior:"instant"})');await click('#menu-toggle');await delay(500);assert.equal(await evaluate('document.querySelector("#site-navigation [aria-current=page]").dataset.page'),'cases');
 await key('Escape');assert.equal(await open(),false);assert.equal(await evaluate('document.activeElement.id'),'menu-toggle');
 await key('ArrowDown');assert.equal(await open(),true);assert.equal(await evaluate('document.activeElement.dataset.page'),'events');await key('End');assert.equal(await evaluate('document.activeElement.dataset.page'),'partners');await key('ArrowDown');assert.equal(await evaluate('document.activeElement.dataset.page'),'events');
 await key('Tab');await key('Tab');await key('Tab');assert.equal(await open(),false,'tabbing outside must close the floating navigation');
 await click('#menu-toggle');await delay(500);await click('.section-top');assert.equal(await open(),false,'outside pointer must close the menu');
 await evaluate('window.scrollTo({top:0,behavior:"instant"})');await click('#menu-toggle');await delay(500);await click('#site-navigation [data-page="partners"]');await wait('location.hash==="#partners"&&!document.getElementById("partners-view").hidden');assert.equal(await open(),false);
 await evaluate('history.back()');await wait('location.hash==="#cases"&&!document.getElementById("cases-view").hidden');assert.equal(await evaluate('document.querySelector("#site-navigation [aria-current=page]").dataset.page'),'cases');
 await evaluate('location.hash="events"');await wait('document.body.dataset.page==="events"');
 for(const width of [320,390,768,1440]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<500});await evaluate('window.scrollTo({top:0,behavior:"instant"})');await delay(100);
  assert.equal(await open(),false);assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'),`closed menu overflow at ${width}`);
  if(width===390){await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});const b=await evaluate('document.getElementById("menu-toggle").getBoundingClientRect().toJSON()');await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width/2,y:b.y+b.height/2}]});await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await wait('document.getElementById("menu-toggle").getAttribute("aria-expanded")==="true"');await send('Emulation.setTouchEmulationEnabled',{enabled:false});}
  else await click('#menu-toggle');
  assert.equal(await open(),true);await delay(550);
  assert.equal(await evaluate('getComputedStyle(document.querySelector("#site-navigation .active")).backgroundColor'),'rgb(186, 255, 0)',`active oval fill at ${width}`);
  assert.equal(await evaluate('getComputedStyle(document.querySelector("#site-navigation a:not(.active)")).backgroundColor'),'rgb(25, 78, 217)',`blue oval fill at ${width}`);
  assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'),`open menu overflow at ${width}`);
  assert.ok(await evaluate('[...document.querySelectorAll("#site-navigation a")].every(a=>{const r=a.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight})'),`menu links outside viewport at ${width}`);
  const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(`artifacts/navigation-${width}.png`,Buffer.from(shot.data,'base64'));
  await click('#menu-toggle');assert.equal(await open(),false);
 }
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await click('#menu-toggle');assert.equal(await evaluate('getComputedStyle(document.querySelector("#site-navigation a")).animationName'),'none');await key('Escape');
 assert.deepEqual(errors,[]);console.log('PASS: floating menu, real mouse and touch input, navigation and browser back, active state, Escape/outside close, keyboard and inert state, 320/390/768/1440 layouts, reduced motion, no runtime errors.');
}finally{ws.close();}
