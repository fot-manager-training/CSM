const hero=document.querySelector('.hero');
const art=document.querySelector('.hero-art');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const pointer=matchMedia('(hover: hover) and (pointer: fine)');
let frame=0;
function reset(){cancelAnimationFrame(frame);art.style.setProperty('--tilt-x','0deg');art.style.setProperty('--tilt-y','0deg');art.style.setProperty('--drift-x','0px');art.style.setProperty('--drift-y','0px');}
hero.addEventListener('pointermove',event=>{
 if(reduced.matches||!pointer.matches)return;
 const r=hero.getBoundingClientRect();const x=(event.clientX-r.left)/r.width-.5;const y=(event.clientY-r.top)/r.height-.5;
 cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{art.style.setProperty('--tilt-x',`${-y*14}deg`);art.style.setProperty('--tilt-y',`${x*18}deg`);art.style.setProperty('--drift-x',`${x*12}px`);art.style.setProperty('--drift-y',`${y*12}px`);});
},{passive:true});
hero.addEventListener('pointerleave',reset);reduced.addEventListener('change',reset);
if('IntersectionObserver' in window){
 const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}},{threshold:.1});
 for(const element of document.querySelectorAll('.connection,.footer')){element.classList.add('scroll-reveal');observer.observe(element);}
}
