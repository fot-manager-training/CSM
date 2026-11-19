export function initSiteFooter(){
 for(const button of document.querySelectorAll('.arka-credit')){
  let hovered=false,pinned=false,dismissed=false;
  const update=()=>{const open=!dismissed&&(hovered||pinned||button.matches(':focus-visible'));button.classList.toggle('is-revealed',open);button.setAttribute('aria-expanded',String(open));};
  button.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch'){hovered=true;dismissed=false;update();}});
  button.addEventListener('pointerleave',()=>{hovered=false;update();});
  button.addEventListener('focus',()=>{dismissed=false;update();});
  button.addEventListener('blur',()=>{pinned=false;dismissed=false;update();});
  button.addEventListener('click',()=>{const open=button.getAttribute('aria-expanded')!=='true';pinned=open;dismissed=!open;update();});
  button.addEventListener('keydown',event=>{if(event.key==='Escape'){pinned=false;dismissed=true;update();}});
  document.addEventListener('pointerdown',event=>{if(!button.contains(event.target)){pinned=false;dismissed=true;update();}});
 }
}
