import assert from 'node:assert/strict';
import {browser} from './browser-support.mjs';
const b=await browser();
const panel='document.getElementById("kv-chat-panel")';
async function open(){await b.click('#kv-chat-launcher');await b.wait(`${panel}.dataset.state==='open'&&!document.getElementById('kv-chat-send').disabled`);}
async function close(){await b.click('#kv-chat-close');await b.wait(`${panel}.hidden`);assert.equal(await b.evaluate('document.getElementById("kv-chat-launcher").hidden'),false);assert.equal(await b.evaluate('document.querySelector("main").inert'),false);assert.equal(await b.evaluate('document.querySelector(".header").inert'),false);assert.equal(await b.evaluate('document.documentElement.classList.contains("kv-chat-modal")'),false);}
async function unobscured(){
 const result=await b.evaluate(`(()=>{const panel=${panel},r=panel.getBoundingClientRect(),fail=[];for(let x=r.left+24;x<r.right-20;x+=45)for(let y=r.top+24;y<r.bottom-20;y+=45){const node=document.elementFromPoint(x,y);if(!node||!panel.contains(node))fail.push({x,y,tag:node?.className});}return fail})()`);assert.deepEqual(result,[],'Site cards or navigation cover the chat');
 for(const selector of ['#kv-chat-close','#kv-chat-send']){const rect=await b.bounds(selector);assert.equal(await b.evaluate(`document.querySelector(${JSON.stringify(selector)}).contains(document.elementFromPoint(${rect.x+rect.width/2},${rect.y+rect.height/2}))`),true,selector+' is obscured');}
}
async function within(width,height){const r=await b.bounds('#kv-chat-panel');assert.ok(r.left>=0&&r.right<=width+.5&&r.top>=0&&r.bottom<=height+.5,JSON.stringify(r));assert.equal(await b.evaluate('document.documentElement.scrollWidth<=innerWidth'),true);await unobscured();
 const centers=await b.evaluate('["kv-chat-attach","kv-chat-input","kv-chat-send"].map(id=>{const r=document.getElementById(id).getBoundingClientRect();return r.top+r.height/2})');
 assert.ok(Math.max(...centers)-Math.min(...centers)<=1,'Composer icon, text and send button must share a vertical center');
 const svg=await b.bounds('#kv-chat-send svg'),button=await b.bounds('#kv-chat-send');assert.ok(Math.abs(svg.y+svg.height/2-button.y-button.height/2)<=1,'Send arrow must be centered');
}
try{
 await b.viewport(1440,900);await b.navigate('index.html','document.querySelectorAll(".circle-cover").length===8');await b.evaluate('document.getElementById("circle-stage").scrollIntoView({block:"center",behavior:"instant"})');await open();
 assert.equal(await b.evaluate(`${panel}.matches(':popover-open')`),true);await within(1440,900);const initial=await b.bounds('#kv-chat-panel');assert.ok(initial.width<=440&&initial.height<=640);
 assert.equal(await b.evaluate(`${panel}.getAnimations({subtree:true}).some(a=>a.animationName==='kv-glow')`),true);
 for(const section of ['.case-showcase','.partner-showcase']){await b.evaluate(`document.querySelector(${JSON.stringify(section)}).scrollIntoView({block:'center',behavior:'instant'})`);await within(1440,900);assert.equal((await b.bounds('#kv-chat-panel')).bottom,initial.bottom);}
 await b.screenshot('chat-position-desktop');await close();
 for(const [width,height]of [[668,650],[390,640],[320,568],[844,390]]){
  await b.viewport(width,height);
  for(const page of ['index','events','cases','partners','learning']){
   await b.navigate(page+'.html','document.getElementById("kv-chat-launcher")');await open();await within(width,height);
   assert.equal(await b.evaluate(`${panel}.getAttribute('aria-modal')`),'true');assert.equal(await b.evaluate('document.querySelector("main").inert'),true);assert.equal(await b.evaluate('document.getElementById("kv-chat-launcher").hidden'),true);
   const footer=await b.bounds('#kv-chat-suggestions'),form=await b.bounds('#kv-chat-form');assert.ok(footer.top>=form.bottom-.5);assert.ok(footer.bottom<=height);assert.ok(await b.evaluate('getComputedStyle(document.getElementById("kv-chat-input")).fontSize==="16px"'));
   await b.click('#kv-chat-sections-toggle');await b.wait('!document.getElementById("kv-section-links").hidden');
   for(const title of ['Мероприятия','Обучение CSM','Бизнес-кейсы','Партнёры'])assert.equal(await b.evaluate(`(()=>{const link=Array.from(document.querySelectorAll('#kv-section-links a')).find(a=>a.textContent.includes(${JSON.stringify(title)})),r=link.getBoundingClientRect(),p=${panel}.getBoundingClientRect();return r.width>50&&r.left>=p.left&&r.right<=p.right&&r.top>=p.top&&r.bottom<=p.bottom&&link.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))})()`),true,title);
   await b.key('Escape');assert.equal(await b.evaluate('document.getElementById("kv-section-links").hidden'),true);assert.equal(await b.evaluate(`${panel}.hidden`),false);
   if(page==='cases'&&width===668)await b.screenshot('chat-window-668');if(page==='index'&&width===320)await b.screenshot('chat-mobile-320');
   await close();assert.equal(await b.evaluate('document.activeElement.id'),'kv-chat-launcher');
  }
 }
 await b.viewport(390,844);await b.navigate('index.html','document.getElementById("kv-chat-launcher")');await open();
 await b.evaluate(`document.getElementById('kv-chat-sections-toggle').focus()`);await b.key('Tab');assert.equal(await b.evaluate('document.activeElement.id'),'kv-chat-clear');
 await b.evaluate(`document.getElementById('kv-chat-input').focus();Object.defineProperty(window.visualViewport,'height',{get:()=>300,configurable:true});Object.defineProperty(window.visualViewport,'offsetTop',{get:()=>40,configurable:true});window.visualViewport.dispatchEvent(new Event('resize'))`);
 await b.wait(`${panel}.dataset.keyboard==='true'`);let r=await b.bounds('#kv-chat-panel');assert.ok(r.top>=40&&r.bottom<=340);assert.equal(await b.evaluate('getComputedStyle(document.getElementById("kv-chat-suggestions")).display'),'none');assert.ok((await b.bounds('#kv-chat-send')).bottom<=340);await unobscured();
 await b.evaluate(`document.getElementById('kv-chat-input').value='вопрос\\n'.repeat(20);document.getElementById('kv-chat-input').dispatchEvent(new Event('input'))`);assert.ok((await b.bounds('#kv-chat-input')).height<=104);assert.ok((await b.bounds('#kv-chat-send')).bottom<=340);assert.ok((await b.bounds('#kv-chat-log')).height>50);
 await b.evaluate(`delete window.visualViewport.height;delete window.visualViewport.offsetTop;window.visualViewport.dispatchEvent(new Event('resize'))`);await b.wait(`${panel}.dataset.keyboard==='false'`);await close();
 await open();await b.send('Input.dispatchMouseEvent',{type:'mousePressed',x:3,y:3,button:'left',buttons:1,clickCount:1});await b.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:3,y:3,button:'left',buttons:0,clickCount:1});await b.wait(`${panel}.hidden`);
 await b.evaluate(`document.getElementById('kv-chat-launcher').click();document.getElementById('kv-chat-launcher').click();document.getElementById('kv-chat-launcher').click()`);await b.wait(`${panel}.dataset.state==='open'`);await b.delay(250);assert.equal(await b.evaluate(`${panel}.hidden`),false);
 await b.evaluate(`document.getElementById('kv-chat-input').value='ГигаЧат ПАК';document.getElementById('kv-chat-form').requestSubmit()`);assert.equal(await b.evaluate(`${panel}.getAttribute('aria-busy')`),'true');assert.equal(await b.evaluate('document.querySelectorAll(".kv-typing i").length'),3);await b.wait(`${panel}.getAttribute('aria-busy')==='false'`);assert.equal(await b.evaluate('document.querySelectorAll(".kv-typing").length'),0);assert.equal(await b.evaluate('document.querySelectorAll(".kv-fact").length'),1);await close();
 await b.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await b.navigate('cases.html','document.getElementById("kv-chat-launcher")');await open();assert.equal(await b.evaluate(`${panel}.getAnimations({subtree:true}).length`),0);assert.equal(await b.evaluate(`document.getElementById('kv-chat-close').click();${panel}.hidden`),true);
 await b.send('Emulation.setEmulatedMedia',{features:[]});
 const {identifier}=await b.send('Page.addScriptToEvaluateOnNewDocument',{source:"Object.defineProperty(HTMLElement.prototype,'showPopover',{value:undefined,configurable:true})"});
 try{await b.viewport(668,650);await b.navigate('index.html','document.querySelectorAll(".circle-cover").length===8');await b.evaluate('document.getElementById("circle-stage").scrollIntoView({block:"center",behavior:"instant"})');await open();assert.equal(await b.evaluate(`${panel}.dataset.layer`),'fixed');await within(668,650);assert.equal(await b.evaluate('document.querySelector(".kv-chat-scrim").hidden'),false);await close();}finally{await b.send('Page.removeScriptToEvaluateOnNewDocument',{identifier});}
 assert.deepEqual(b.errors,[]);console.log('PASS: no header/carousel occlusion, scrolling desktop, all five pages in small/phone/landscape windows, full section menu, keyboard viewport, focus restoration, backdrop, rapid toggles, typing indicator, reduced motion and older-browser fallback.');
}finally{await b.send('Emulation.setEmulatedMedia',{features:[]});b.close();}
