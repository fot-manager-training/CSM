// Floating oval links, matching the social-project reference at c9418df.
export function initNavigation(){
 const header=document.querySelector('.header');
 const toggle=document.getElementById('menu-toggle');
 const navigation=document.getElementById('site-navigation');
 const links=[...navigation.querySelectorAll('a')];
 let open=false;
 function setOpen(value,{returnFocus=false}={}){
  open=value;header.dataset.menuOpen=String(open);
  toggle.setAttribute('aria-expanded',String(open));
  const label=open?'Свернуть меню':'Развернуть меню';
  toggle.setAttribute('aria-label',label);toggle.title=label;
  navigation.inert=!open;navigation.setAttribute('aria-hidden',String(!open));
  if(returnFocus)toggle.focus({preventScroll:true});
 }
 toggle.addEventListener('click',()=>setOpen(!open));
 toggle.addEventListener('keydown',event=>{
  if(!['ArrowDown','ArrowUp'].includes(event.key))return;
  event.preventDefault();setOpen(true);const index=event.key==='ArrowDown'?0:links.length-1;
  requestAnimationFrame(()=>{if(open)links[index].focus({preventScroll:true});});
 });
 navigation.addEventListener('keydown',event=>{
  if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
  const index=links.indexOf(document.activeElement);if(index<0)return;
  event.preventDefault();
  const next=event.key==='Home'?0:event.key==='End'?links.length-1:(index+(event.key==='ArrowDown'?1:-1)+links.length)%links.length;
  links[next].focus({preventScroll:true});
 });
 navigation.addEventListener('click',event=>{
  const link=event.target.closest('a');if(!link)return;
  setOpen(false,{returnFocus:navigation.contains(document.activeElement)});
  if(new URL(link.href).pathname===location.pathname)document.getElementById('content').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 });
 const inside=target=>navigation.contains(target)||toggle.contains(target);
 document.addEventListener('pointerdown',event=>{if(open&&!inside(event.target))setOpen(false);});
 document.addEventListener('focusin',event=>{if(open&&!inside(event.target))setOpen(false);});
 document.addEventListener('keydown',event=>{if(open&&event.key==='Escape'){event.preventDefault();setOpen(false,{returnFocus:true});}});
 window.addEventListener('hashchange',()=>{if(open)setOpen(false,{returnFocus:navigation.contains(document.activeElement)});});
 setOpen(false);
}
