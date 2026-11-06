import assert from 'node:assert/strict';
import {browser} from './browser-support.mjs';
const b=await browser(),rotation=()=>b.evaluate('Number(document.getElementById("cybercat-viewer").dataset.rotation)');
try{
 await b.viewport(1440,1000);await b.navigate('events.html','document.getElementById("cybercat-viewer")?.dataset.ready==="true"');
 assert.equal(await b.evaluate('!!document.querySelector("#cybercat-viewer canvas").getContext("webgl2")'),true);
 await b.delay(200);const idle=await rotation();await b.delay(450);assert.equal(await rotation(),idle,'the cat must not rotate by itself');
 await b.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:35,y:330});await b.delay(1000);const left=await rotation();assert.ok(left<-.3,'the cat must look at the cursor without pressing a mouse button');
 await b.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:1410,y:340});await b.delay(1100);const right=await rotation();assert.ok(right>left+.3,'the cat must follow the cursor back to the right');assert.ok(Math.abs(right)<=.6001);
 await b.delay(700);const settled=await rotation();await b.delay(400);assert.equal(await rotation(),settled,'a stationary pointer must leave the cat stationary');
 await b.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:500,y:980});await b.delay(1000);assert.ok(Math.abs(await b.evaluate('Number(document.getElementById("cybercat-viewer").dataset.pitch)'))<=.3201,'the face must remain within a small tilt');
 await b.evaluate('document.getElementById("cybercat-viewer").focus({preventScroll:true})');await b.key('Home');await b.wait('Math.abs(Number(document.getElementById("cybercat-viewer").dataset.rotation)+.12)<.0002');await b.key('ArrowRight');await b.wait('Math.abs(Number(document.getElementById("cybercat-viewer").dataset.rotation)-.03)<.0002');
 await b.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await b.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:20,y:200});const reduced=await rotation();await b.delay(300);assert.equal(await rotation(),reduced);
 await b.viewport(390);await b.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});await b.evaluate('window.scrollTo({top:0,behavior:"instant"})');await b.delay(100);
 const rect=await b.bounds('#cybercat-viewer'),point={x:rect.x+rect.width/2-15,y:rect.y+rect.height/2};
 await b.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});const initialTouch=await rotation();
 for(let i=1;i<=5;i++)await b.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:point.x+i*7,y:point.y}]});
 assert.ok(await rotation()>initialTouch+.05,'touch must let the cat look at the finger');await b.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await rotation(),-.12,'touch release returns to the neutral front view');
 await b.send('Emulation.setTouchEmulationEnabled',{enabled:false});await b.send('Emulation.setEmulatedMedia',{features:[]});
 await b.evaluate('window.scrollTo({top:document.body.scrollHeight,behavior:"instant"})');await b.delay(200);const offscreen=await rotation();await b.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:50,y:500});await b.delay(300);assert.equal(await rotation(),offscreen,'offscreen model must not render');
 assert.deepEqual(b.errors,[]);console.log('PASS: real 3D geometry follows the cursor without a click; no auto spin or idle motion; bounded front-facing angles; keyboard and touch; reduced motion; offscreen pause.');
}finally{b.close();}
