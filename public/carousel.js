import {eventImages} from './media.js?v=home-20261106';
const safe=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const modulo=(value,length)=>((value%length)+length)%length;

export class EventCarousel {
  constructor({stage,caption,counter,motion}) {
    Object.assign(this,{stage,caption,counter,motion});
    this.items=[];this.position=0;this.target=null;this.frame=0;this.visible=false;
    this.autoplay=true;this.hovered=false;this.focused=false;this.gesture=null;this.suppressUntil=0;
    this.reduced=matchMedia('(prefers-reduced-motion: reduce)');
    this.stage.addEventListener('pointerdown',event=>this.pointerDown(event));
    this.stage.addEventListener('pointermove',event=>this.pointerMove(event));
    this.stage.addEventListener('pointerup',event=>this.pointerEnd(event));
    this.stage.addEventListener('pointercancel',event=>this.pointerEnd(event,true));
    // Touch initially captures the button. Its bubbling loss during transfer is expected.
    this.stage.addEventListener('lostpointercapture',event=>{if(event.target===this.stage&&this.gesture?.id===event.pointerId)this.pointerEnd(event,true);});
    this.stage.addEventListener('dragstart',event=>event.preventDefault());
    this.stage.addEventListener('click',event=>{if(performance.now()<this.suppressUntil){event.preventDefault();event.stopImmediatePropagation();}},true);
    this.stage.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch'){this.hovered=true;if(this.target===null)this.snap(this.position);}});
    this.stage.addEventListener('pointerleave',()=>{this.hovered=false;this.schedule();});
    this.stage.addEventListener('focusin',()=>{this.focused=true;if(!this.gesture&&this.target===null)this.snap(this.position);});
    this.stage.addEventListener('focusout',()=>requestAnimationFrame(()=>{this.focused=this.stage.contains(document.activeElement);this.schedule();}));
    this.stage.addEventListener('keydown',event=>this.keyDown(event));
    this.stage.addEventListener('wheel',event=>this.wheel(event),{passive:false});
    this.motion.addEventListener('click',()=>{this.autoplay=!this.autoplay;if(!this.autoplay)this.snap(this.position);this.updateMotion();this.schedule();});
    this.reduced.addEventListener('change',()=>{if(this.reduced.matches){this.position=Math.round(this.position);this.target=null;this.paint();}this.updateMotion();this.schedule();});
    document.addEventListener('visibilitychange',()=>this.schedule());
    document.addEventListener('close',()=>this.schedule(),true);
    this.observer=new IntersectionObserver(entries=>{this.visible=entries[0].isIntersecting;this.schedule();},{threshold:.15});
    this.observer.observe(stage);this.resize=new ResizeObserver(()=>this.paint());this.resize.observe(stage);
    this.updateMotion();
  }
  setItems(items) {
    const same=items.map(e=>e.id).join('|')===this.items.map(e=>e.id).join('|');
    if(same)return;
    const previous=this.items[this.selected()]?.id;
    this.cancelGesture();this.items=items;this.position=Math.max(0,items.findIndex(e=>e.id===previous));this.target=null;this.lastSelected=-1;
    this.stage.innerHTML=items.map(e=>`<button class="circle-cover" data-open="${e.id}" aria-label="${safe(e.title)}, ${safe(e.date)}" tabindex="-1"><img src="${eventImages[e.id]}" alt="Иллюстрация: ${safe(e.city||e.title)}" width="1536" height="1024" draggable="false" loading="lazy"></button>`).join('');
    this.buttons=[...this.stage.querySelectorAll('button')];this.paint();this.updateMotion();this.schedule();
  }
  selected() {return this.items.length?modulo(Math.round(this.position),this.items.length):0;}
  spacing() {const width=this.stage.clientWidth;return Math.max(72,Math.min(137,width*.245));}
  autoRuns() {return this.autoplay&&!this.reduced.matches&&!this.hovered&&!this.focused&&!this.gesture&&!document.querySelector('dialog[open]');}
  schedule() {
    const animate=this.visible&&!document.hidden&&this.items.length>1&&(this.target!==null||this.autoRuns());
    if(!animate){if(this.frame)cancelAnimationFrame(this.frame);this.frame=0;this.lastTime=0;return;}
    if(!this.frame)this.frame=requestAnimationFrame(time=>this.tick(time));
  }
  tick(time) {
    this.frame=0;const dt=this.lastTime?Math.min(40,time-this.lastTime):16;this.lastTime=time;
    if(this.target!==null){const difference=this.target-this.position;this.position+=difference*(1-Math.exp(-dt/105));if(Math.abs(difference)<.001){this.position=this.target;this.target=null;}}
    else if(this.autoRuns())this.position+=dt/9000;
    if(Math.abs(this.position)>1000&&this.target===null)this.position=modulo(this.position,this.items.length);
    this.paint();this.schedule();
  }
  paint() {
    const count=this.items.length,index=this.selected(),step=this.spacing();
    for(const [i,button] of (this.buttons||[]).entries()){
      const delta=modulo(i-this.position+count/2,count)-count/2;
      const distance=Math.abs(delta),edge=count/2;
      // Fade at the seam, then recycle an invisible cover to the other end.
      const opacity=count>1?Math.max(0,Math.min(1,(edge-distance)/.38)):1;
      button.style.setProperty('--circle-x',`${delta*step}px`);
      button.style.setProperty('--circle-scale',String(1/(1+distance*.25)));
      button.style.opacity=String(opacity);button.style.zIndex=String(Math.round((count-distance)*100));
      button.style.pointerEvents=opacity<.08?'none':'';
      button.classList.toggle('is-current',i===index);button.tabIndex=i===index?0:-1;
      if(i===index)button.setAttribute('aria-current','true');else button.removeAttribute('aria-current');
    }
    if(index!==this.lastSelected||!count){
      this.lastSelected=index;const current=this.items[index];
      this.counter.textContent=count?`${index+1} / ${count}`:'0 / 0';
      this.caption.innerHTML=current?`<span>${safe(current.date)}</span><strong>${safe(current.title)}</strong>`:'Попробуйте другой формат или сбросьте фильтры.';
    }
    this.stage.dataset.currentId=this.items[index]?.id||'';
  }
  updateMotion() {
    const playing=this.autoplay&&!this.reduced.matches&&this.items.length>1;
    this.motion.disabled=this.reduced.matches||this.items.length<2;
    this.motion.setAttribute('aria-pressed',String(!playing));
    this.motion.setAttribute('aria-label',playing?'Приостановить вращение':'Включить плавное вращение');
    this.motion.innerHTML=playing?'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 4v12m6-12v12"/></svg>':'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m7 4 8 6-8 6V4Z"/></svg>';
    this.caption.setAttribute('aria-live',playing?'off':'polite');this.counter.setAttribute('aria-live','off');
  }
  snap(value) {
    if(this.items.length<2)return;
    if(this.reduced.matches){this.position=Math.round(value);this.target=null;this.paint();}
    else this.target=Math.round(value);
    this.schedule();
  }
  pointerDown(event) {
    if(this.items.length<2||(event.pointerType==='mouse'&&event.button!==0)||!event.isPrimary)return;
    this.target=null;this.gesture={id:event.pointerId,startX:event.clientX,startY:event.clientY,lastX:event.clientX,lastTime:event.timeStamp,startPosition:this.position,velocity:0,dragging:false};
    this.schedule();
  }
  pointerMove(event) {
    const g=this.gesture;if(!g||event.pointerId!==g.id)return;
    const dx=event.clientX-g.startX,dy=event.clientY-g.startY;
    if(!g.dragging){
      if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>8){this.cancelGesture();this.snap(this.position);return;}
      if(Math.abs(dx)<7)return;
      g.dragging=true;this.stage.classList.add('is-dragging');this.stage.setPointerCapture(event.pointerId);
    }
    if(event.cancelable)event.preventDefault();
    const dt=Math.max(8,event.timeStamp-g.lastTime),velocity=-(event.clientX-g.lastX)/this.spacing()/dt;
    g.velocity=Math.max(-.02,Math.min(.02,g.velocity*.55+velocity*.45));
    g.lastTime=event.timeStamp;g.lastX=event.clientX;this.position=g.startPosition-dx/this.spacing();this.paint();
  }
  pointerEnd(event,cancelled=false) {
    const g=this.gesture;if(!g||event.pointerId!==g.id)return;
    this.gesture=null;this.stage.classList.remove('is-dragging');
    if(this.stage.hasPointerCapture(event.pointerId))this.stage.releasePointerCapture(event.pointerId);
    if(g.dragging){this.suppressUntil=performance.now()+400;const speed=event.timeStamp-g.lastTime>100?0:g.velocity;this.snap(this.position+(cancelled||this.reduced.matches?0:speed*160));}
    else this.schedule();
  }
  cancelGesture() {
    const g=this.gesture;this.gesture=null;this.stage.classList.remove('is-dragging');
    if(g&&this.stage.hasPointerCapture(g.id))this.stage.releasePointerCapture(g.id);
  }
  keyDown(event) {
    let target=Math.round(this.target??this.position);
    const selected=this.items.length?modulo(target,this.items.length):0;
    if(event.key==='ArrowLeft')target--;else if(event.key==='ArrowRight')target++;else if(event.key==='Home')target-=selected;else if(event.key==='End')target+=this.items.length-1-selected;
    else if(event.key==='Enter'&&event.target===this.stage){event.preventDefault();this.buttons?.[this.selected()]?.click();return;}else return;
    event.preventDefault();this.stage.focus({preventScroll:true});this.snap(target);
  }
  wheel(event) {
    if(this.items.length<2||Math.abs(event.deltaX)<=Math.abs(event.deltaY))return;
    event.preventDefault();this.target=null;this.position+=event.deltaX/this.spacing();this.paint();
    clearTimeout(this.wheelTimer);this.wheelTimer=setTimeout(()=>this.snap(this.position),120);
  }
}
