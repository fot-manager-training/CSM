const mosaic=document.querySelector('.mosaic');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const fine=matchMedia('(pointer: fine)');
let frame=0;
function reset(){cancelAnimationFrame(frame);mosaic.style.setProperty('--eye-x','0px');mosaic.style.setProperty('--eye-y','0px');}
mosaic.addEventListener('pointermove',event=>{
 if(reduced.matches||!fine.matches)return;
 const r=mosaic.getBoundingClientRect();const x=Math.max(-7,Math.min(7,((event.clientX-r.left)/r.width-.5)*14));const y=Math.max(-4,Math.min(4,((event.clientY-r.top)/r.height-.5)*8));
 cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{mosaic.style.setProperty('--eye-x',x+'px');mosaic.style.setProperty('--eye-y',y+'px');});
},{passive:true});
mosaic.addEventListener('pointerleave',reset);reduced.addEventListener('change',reset);
