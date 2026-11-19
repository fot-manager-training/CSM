import assert from 'node:assert/strict';
import {mkdir,readFile,rm} from 'node:fs/promises';
import {browser} from './browser-support.mjs';
const b=await browser(),downloadPath='/tmp/csm-presentation-export',file=downloadPath+'/DTaaS-SZB-presentation.html';
const ready='document.querySelector(".film[data-scene]")&&document.readyState==="complete"';
const time=()=>b.evaluate('Number(document.getElementById("timeline").value)');
const scene=()=>b.evaluate('Number(document.getElementById("film").dataset.scene)');
const chapter=i=>b.evaluate(`document.querySelectorAll('.chapters button')[${i}].click()`);
const seek=second=>b.evaluate(`document.getElementById('timeline').value=${second};document.getElementById('timeline').dispatchEvent(new Event('input'))`);
try{
 await b.send('Page.bringToFront');await b.send('Emulation.setFocusEmulationEnabled',{enabled:true});
 await b.viewport(1440,1100);await b.navigate('presentation.html',ready);await b.wait('Number(document.getElementById("timeline").value)>.1');
 await b.evaluate('document.getElementById("play").click()');const paused=await time();await b.delay(220);assert.equal(await time(),paused);
 await b.evaluate('document.getElementById("next").click()');assert.equal(await scene(),1);await b.evaluate('document.getElementById("previous").click()');assert.equal(await scene(),0);
 await seek(26.8);assert.equal(await scene(),2);await b.evaluate('document.getElementById("play").click()');await b.wait('document.getElementById("film").dataset.scene==="3"');await b.evaluate('document.getElementById("play").click()');
 assert.match(await b.evaluate('document.querySelector(".scene.is-active").textContent'),/Показатель MVP/);
 await b.evaluate('document.getElementById("film-stage").focus()');await b.key('ArrowRight');assert.equal(await scene(),4);await b.key('ArrowLeft');assert.equal(await scene(),3);
 await seek(75);assert.equal(await b.evaluate('document.getElementById("film").classList.contains("is-ended")'),true);assert.equal(await b.evaluate('document.getElementById("play").getAttribute("aria-label")'),'Посмотреть сначала');await b.evaluate('document.getElementById("play").click()');assert.equal(await scene(),0);await b.evaluate('document.getElementById("play").click()');
 await b.evaluate('document.getElementById("fullscreen").scrollIntoView({block:"center",behavior:"instant"})');await b.click('#fullscreen');await b.wait('document.fullscreenElement===document.getElementById("film")');await b.evaluate('document.exitFullscreen()');
 for(const width of [320,390,768,1440]){
  await b.viewport(width,1000);await b.evaluate('document.fonts.ready');
  for(let i=0;i<8;i++){
   await chapter(i);await b.delay(30);assert.equal(await scene(),i);assert.equal(await b.evaluate('document.querySelectorAll(".scene.is-active:not([inert])").length'),1);assert.equal(await b.evaluate('document.querySelectorAll(".chapters button[aria-current=step]").length'),1);
   assert.equal(await b.evaluate('document.documentElement.scrollWidth<=innerWidth'),true,`page overflow at ${width}/${i}`);
   const outside=await b.evaluate(`(()=>{const stage=document.getElementById('film-stage').getBoundingClientRect();return [...document.querySelectorAll('.scene.is-active .scene-content h1,.scene.is-active .scene-content h2,.scene.is-active .scene-content h3,.scene.is-active .scene-content .lead,.scene.is-active .scene-content .learning-stop,.scene.is-active .scene-content .chat-demo,.scene.is-active .scene-content .outro-actions')].filter(el=>{const r=el.getBoundingClientRect();return r.left<stage.left-1||r.right>stage.right+1||r.bottom>stage.bottom-8||r.top<stage.top;}).map(el=>el.className||el.tagName)})()`);assert.deepEqual(outside,[],`clipped scene ${width}/${i}`);
  }
  if(width===390||width===1440){await chapter(4);await b.delay(750);await b.screenshot(`presentation-partners-${width}`);await chapter(6);await b.delay(750);await b.screenshot(`presentation-chat-${width}`);}
 }
 await b.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await b.navigate('presentation.html',ready);assert.equal(await b.evaluate('document.getElementById("film").classList.contains("is-paused")'),true);await b.delay(150);assert.equal(await time(),0);await chapter(5);assert.equal(await scene(),5);
 await b.send('Emulation.setEmulatedMedia',{features:[]});await b.viewport(1440,1100);await b.navigate('presentation.html',ready);await b.evaluate('document.getElementById("play").click()');await chapter(3);
 await mkdir(downloadPath,{recursive:true});await rm(file,{force:true});await b.send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath});await b.evaluate('document.getElementById("download").scrollIntoView({block:"center",behavior:"instant"})');await b.click('#download');
 let exported;for(let i=0;i<80;i++){try{exported=await readFile(file,'utf8');break;}catch{await b.delay(100);}}assert.ok(exported?.length>400000,'standalone file includes fonts');assert.doesNotMatch(exported,/<script[^>]+src=/);assert.doesNotMatch(exported,/<link[^>]+rel="stylesheet"/);assert.match(exported,/<style>@font-face/);assert.match(exported,/src="data:image\/png;base64/);
 await b.send('Network.enable');await b.send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});await b.send('Page.navigate',{url:'about:blank'});await b.wait('location.href==="about:blank"');const tree=await b.send('Page.getFrameTree');await b.send('Page.setDocumentContent',{frameId:tree.frameTree.frame.id,html:exported});await b.wait(ready);await b.evaluate('document.fonts.ready');assert.equal(await b.evaluate('document.fonts.check(\'18px "SB Sans Display"\')'),true);assert.equal(await b.evaluate('getComputedStyle(document.getElementById("download")).display'),'none');assert.equal(await b.evaluate('document.querySelector(".brand img").naturalWidth'),64);
 await b.evaluate('document.getElementById("play").click()');await chapter(6);assert.equal(await scene(),6);assert.equal(await b.evaluate('document.querySelector(".chapters [aria-current=step]").dataset.scene'),'6');await b.evaluate('document.getElementById("play").click()');const before=await time();await b.delay(200);assert.ok(await time()>before,'offline playback advances');
 await b.send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});await b.send('Network.disable');
 await b.navigate('index.html','document.querySelector(".circle-cover")');assert.equal(await b.evaluate('document.querySelector(".about-presentation").getAttribute("href")'),'./presentation.html');
 assert.deepEqual(b.errors,[]);console.log('PASS: autoplay, pause, boundaries, chapters, seek, replay, keyboard, fullscreen; all eight scenes at four widths; reduced motion; single-file download and offline playback with embedded fonts/logo; homepage link.');
}finally{await b.send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1}).catch(()=>{});b.close();}
