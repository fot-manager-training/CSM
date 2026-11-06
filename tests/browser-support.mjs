import {mkdir,writeFile} from 'node:fs/promises';
export const base=process.env.APP_URL||'http://127.0.0.1:3000/';
export async function browser(){
 const targets=await(await fetch('http://127.0.0.1:9222/json')).json();
 const ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
 let seq=0;const queue=new Map(),errors=[];
 ws.onmessage=e=>{const msg=JSON.parse(e.data);if(msg.id){const p=queue.get(msg.id);queue.delete(msg.id);msg.error?p.reject(msg.error):p.resolve(msg.result);}if(msg.method==='Runtime.exceptionThrown')errors.push(msg.params.exceptionDetails.text);};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;queue.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 const delay=ms=>new Promise(r=>setTimeout(r,ms));
 const wait=async expression=>{for(let i=0;i<120;i++){if(await evaluate(expression))return;await delay(50);}throw Error('Timed out: '+expression);};
 const viewport=(width,height=1000)=>send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
 const navigate=async(path,ready)=>{await send('Page.navigate',{url:new URL(path,base).href});await wait(ready||'document.readyState==="complete"');};
 const bounds=selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect().toJSON()`);
 const click=async selector=>{const b=await bounds(selector),p={x:b.x+b.width/2,y:b.y+b.height/2};await send('Input.dispatchMouseEvent',{type:'mouseMoved',...p});await send('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',buttons:1,clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',buttons:0,clickCount:1});};
 const key=key=>send('Input.dispatchKeyEvent',{type:'keyDown',key,code:key});
 const screenshot=async(name,full=false)=>{await mkdir('artifacts',{recursive:true});const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:full});await writeFile(`artifacts/${name}.png`,Buffer.from(shot.data,'base64'));};
 await send('Runtime.enable');await send('Page.enable');await send('Emulation.setTouchEmulationEnabled',{enabled:false});await send('Emulation.setEmulatedMedia',{features:[]});
 return {send,evaluate,wait,delay,viewport,navigate,bounds,click,key,screenshot,errors,close:()=>ws.close()};
}
