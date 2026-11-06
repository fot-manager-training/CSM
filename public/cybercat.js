import * as THREE from './vendor/three.module.min.js';

export function initCybercat(){
 const host=document.getElementById('cybercat-viewer');if(!host)return;
 let renderer;
 try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}catch{return;}
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
 renderer.domElement.setAttribute('aria-hidden','true');host.append(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,1,.1,40);
 camera.position.set(0,.3,7.7);camera.lookAt(0,.25,0);
 scene.add(new THREE.HemisphereLight(0xffffff,0xa6b3c9,2.2));
 for(const [color,intensity,position] of [[0xffffff,3,[-4,6,5]],[0xffe0c6,2,[5,2,-3]],[0xbbffdd,1.1,[-4,0,-2]]]){const light=new THREE.DirectionalLight(color,intensity);light.position.set(...position);scene.add(light);}
 // Softbox reflections give the curved white and chrome surfaces real depth.
 const room=new THREE.Scene();room.add(new THREE.Mesh(new THREE.BoxGeometry(14,12,14),new THREE.MeshBasicMaterial({color:0x8d99ad,side:THREE.BackSide})));
 for(const [x,y,z,w,h,power] of [[-4,4,3,4,6,4],[4,2,1,2,5,3],[0,5,-2,5,4,4],[0,-4,4,5,2,1.5]]){const panel=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color().setScalar(power),side:THREE.DoubleSide}));panel.position.set(x,y,z);panel.lookAt(0,0,0);room.add(panel);}
 const pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;pmrem.dispose();room.traverse(item=>{item.geometry?.dispose();item.material?.dispose();});
 const pearl=new THREE.MeshPhysicalMaterial({color:0xe9eeef,metalness:.38,roughness:.24,clearcoat:1,clearcoatRoughness:.16});
 const chrome=new THREE.MeshStandardMaterial({color:0xc2cbd0,metalness:.92,roughness:.19});
 const graphite=new THREE.MeshPhysicalMaterial({color:0x071a15,metalness:.38,roughness:.19,clearcoat:1,clearcoatRoughness:.08});
 const innerEar=new THREE.MeshStandardMaterial({color:0x738b86,metalness:.75,roughness:.28});
 const neon=new THREE.MeshStandardMaterial({color:0x0acd59,emissive:0x00d949,emissiveIntensity:.8,metalness:.1,roughness:.25});
 const eyeMaterial=new THREE.MeshBasicMaterial({color:0x9effc5,toneMapped:false});
 const cat=new THREE.Group();scene.add(cat);
 const rounded=(width,height,radius)=>{const s=new THREE.Shape(),x=-width/2,y=-height/2;s.moveTo(x+radius,y);s.lineTo(x+width-radius,y);s.quadraticCurveTo(x+width,y,x+width,y+radius);s.lineTo(x+width,y+height-radius);s.quadraticCurveTo(x+width,y+height,x+width-radius,y+height);s.lineTo(x+radius,y+height);s.quadraticCurveTo(x,y+height,x,y+height-radius);s.lineTo(x,y+radius);s.quadraticCurveTo(x,y,x+radius,y);return s;};
 const solid=(shape,depth,bevel,material,position=[0,0,0])=>{const geometry=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:bevel>0,bevelSize:bevel,bevelThickness:bevel,bevelSegments:8,curveSegments:24,steps:1});geometry.translate(0,0,-depth/2);const mesh=new THREE.Mesh(geometry,material);mesh.position.set(...position);cat.add(mesh);return mesh;};
 solid(rounded(2.35,1.82,.5),1,.17,pearl);
 solid(rounded(2.20,1.56,.43),.08,.10,chrome,[0,-.02,.64]);
 solid(rounded(2.12,1.48,.4),.05,.07,neon,[0,-.02,.755]);
 solid(rounded(2.04,1.40,.38),.06,.06,graphite,[0,-.02,.81]);
 function earShape(scale=1){const s=new THREE.Shape();s.moveTo(-.48*scale,0);s.quadraticCurveTo(-.43*scale,.42*scale,-.12*scale,.88*scale);s.quadraticCurveTo(0,1.02*scale,.12*scale,.88*scale);s.lineTo(.48*scale,0);s.quadraticCurveTo(0,-.12*scale,-.48*scale,0);return s;}
 for(const side of [-1,1]){
  const ear=solid(earShape(),.35,.10,pearl,[side*.91,.78,-.05]);ear.rotation.z=-side*.16;
  const inset=solid(earShape(.65),.035,.035,innerEar,[side*.92,.93,.23]);inset.rotation.z=-side*.16;
  const cup=new THREE.Mesh(new THREE.CylinderGeometry(.56,.56,.32,64),pearl);cup.rotation.z=Math.PI/2;cup.position.set(side*1.43,-.03,-.03);cat.add(cup);
  const disk=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.05,64),chrome);disk.rotation.z=Math.PI/2;disk.position.set(side*1.62,-.03,-.03);cat.add(disk);
  for(const [radius,tube,material,x] of [[.46,.045,chrome,1.62],[.39,.033,neon,1.66]]){const ring=new THREE.Mesh(new THREE.TorusGeometry(radius,tube,14,64),material);ring.rotation.y=Math.PI/2;ring.position.set(side*x,-.03,-.03);cat.add(ring);}
 }
 for(const z of [-.34,-.49]){const band=new THREE.Mesh(new THREE.TorusGeometry(1.43,.075,12,64,Math.PI),chrome);band.position.set(0,.08,z);cat.add(band);}
 for(const side of [-1,1])solid(rounded(.32,.43,.11),.025,.035,eyeMaterial,[side*.46,.17,.91]);
 const smile=new THREE.CatmullRomCurve3([new THREE.Vector3(-.18,-.32,.92),new THREE.Vector3(-.08,-.39,.93),new THREE.Vector3(.06,-.39,.93),new THREE.Vector3(.18,-.32,.92)]);
 cat.add(new THREE.Mesh(new THREE.TubeGeometry(smile,32,.027,10,false),eyeMaterial));
 // A soft additive halo sits behind the bright eyes, without a full-screen postprocess.
 const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=128;const context=glowCanvas.getContext('2d'),gradient=context.createRadialGradient(64,64,8,64,64,64);gradient.addColorStop(0,'rgba(64,255,143,.38)');gradient.addColorStop(.45,'rgba(64,255,143,.12)');gradient.addColorStop(1,'rgba(64,255,143,0)');context.fillStyle=gradient;context.fillRect(0,0,128,128);
 const glowTexture=new THREE.CanvasTexture(glowCanvas);glowTexture.colorSpace=THREE.SRGBColorSpace;for(const side of [-1,1]){const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,transparent:true,opacity:.3,depthWrite:false,blending:THREE.AdditiveBlending}));glow.position.set(side*.46,.17,.96);glow.scale.set(.9,.95,1);cat.add(glow);}
 solid(rounded(1.5,.85,.22),.025,.035,chrome,[0,0,-.68]);
 for(const y of [-.14,0,.14])solid(rounded(.65,.025,.01),.02,.008,graphite,[0,y,-.73]);
 solid(rounded(.18,.04,.015),.015,.008,neon,[0,-.31,-.73]);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let visible=false,frame=0,lastTime=0,touch=null;
 const neutral={yaw:-.12,pitch:-.04};let yaw=neutral.yaw,pitch=neutral.pitch,target={...neutral};
 const render=()=>{cat.rotation.set(pitch,yaw,0);renderer.render(scene,camera);host.dataset.rotation=yaw.toFixed(4);host.dataset.pitch=pitch.toFixed(4);};
 const unsettled=()=>Math.abs(target.yaw-yaw)+Math.abs(target.pitch-pitch)>.0001;
 function schedule(){if(!frame&&visible&&!document.hidden&&!host.classList.contains('webgl-lost')&&unsettled())frame=requestAnimationFrame(tick);}
 function tick(time){frame=0;const dt=lastTime?Math.min(100,time-lastTime):16;lastTime=time;const amount=1-Math.exp(-dt/90);yaw+=(target.yaw-yaw)*amount;pitch+=(target.pitch-pitch)*amount;if(!unsettled()){yaw=target.yaw;pitch=target.pitch;lastTime=0;}render();schedule();}
 function lookAt(next){target={yaw:THREE.MathUtils.clamp(next.yaw,-.6,.6),pitch:THREE.MathUtils.clamp(next.pitch,-.32,.32)};if(reduced.matches){yaw=target.yaw;pitch=target.pitch;if(visible&&!document.hidden)render();}else schedule();}
 function follow(event){const bounds=host.getBoundingClientRect();lookAt({yaw:(event.clientX-bounds.x-bounds.width/2)/Math.max(160,innerWidth*.42)*.55,pitch:(event.clientY-bounds.y-bounds.height/2)/Math.max(150,innerHeight*.38)*.3});}
 const resize=()=>{const {width,height}=host.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();render();};
 new ResizeObserver(resize).observe(host);
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;lastTime=0;if(!visible&&frame){cancelAnimationFrame(frame);frame=0;}if(visible)render();schedule();},{threshold:.1}).observe(host);
 // Look at the pointer; never add time-based spin or release inertia.
 window.addEventListener('pointermove',event=>{if(event.pointerType==='mouse'||event.pointerType==='pen')follow(event);else if(touch===event.pointerId)follow(event);},{passive:true});
 document.documentElement.addEventListener('pointerleave',()=>lookAt(neutral));
 host.addEventListener('pointerdown',event=>{if(event.pointerType==='touch'){touch=event.pointerId;follow(event);}});
 const release=event=>{if(touch===event.pointerId){touch=null;lookAt(neutral);}};
 window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release);
 host.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(event.key))return;event.preventDefault();const next={...target};if(event.key==='ArrowLeft')next.yaw-=.15;if(event.key==='ArrowRight')next.yaw+=.15;if(event.key==='ArrowUp')next.pitch-=.1;if(event.key==='ArrowDown')next.pitch+=.1;lookAt(event.key==='Home'?neutral:next);});
 host.addEventListener('dblclick',()=>lookAt(neutral));
 reduced.addEventListener('change',()=>{if(frame)cancelAnimationFrame(frame);frame=0;lastTime=0;yaw=target.yaw;pitch=target.pitch;if(visible)render();});
 document.addEventListener('visibilitychange',()=>{lastTime=0;if(document.hidden&&frame){cancelAnimationFrame(frame);frame=0;}schedule();});
 renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();host.classList.add('webgl-lost');if(frame)cancelAnimationFrame(frame);frame=0;host.querySelector('img')?.removeAttribute('aria-hidden');});
 renderer.domElement.addEventListener('webglcontextrestored',()=>{host.classList.remove('webgl-lost');resize();schedule();});
 resize();host.dataset.ready='true';host.querySelector('img')?.setAttribute('aria-hidden','true');schedule();
}
