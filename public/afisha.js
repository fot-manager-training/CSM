import {eventYear,eventMonthBounds} from './data.js?v=arkhangelsk-20261110';
const $=id=>document.getElementById(id);
const safe=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function initAfisha({state,onChange,images,iconize,setMonth}){
 let shownMonth=11,builtMonth=0,lastCards='',drag=null,suppressUntil=0;
 const track=$('date-track'),spotlight=$('spotlight-track');
 $('all-filters').onclick=()=>{const open=$('event-filters').hidden;$('event-filters').hidden=!open;$('all-filters').setAttribute('aria-expanded',String(open));};
 $('event-type').onchange=event=>{state.category=event.target.value;onChange();};
 $('date-all').onclick=()=>{state.day='all';onChange();};
 track.addEventListener('click',event=>{const button=event.target.closest('[data-day]');if(button){state.day=state.day===button.dataset.day?'all':button.dataset.day;onChange();}});
 function changeMonth(month){shownMonth=month;state.month=String(month).padStart(2,'0');state.day='all';setMonth(month);$('month').value=state.month;onChange();}
 $('date-month-prev').onclick=()=>changeMonth(Math.max(eventMonthBounds.min,shownMonth-1));$('date-month-next').onclick=()=>changeMonth(Math.min(eventMonthBounds.max,shownMonth+1));
 // Touch uses native horizontal scrolling. Mouse dragging suppresses date clicks.
 track.addEventListener('pointerdown',event=>{if(event.pointerType==='mouse'&&event.button===0)drag={id:event.pointerId,x:event.clientX,scroll:track.scrollLeft,moved:false};});
 track.addEventListener('pointermove',event=>{if(!drag||event.pointerId!==drag.id)return;const distance=event.clientX-drag.x;if(!drag.moved&&Math.abs(distance)>6){drag.moved=true;track.setPointerCapture(event.pointerId);track.classList.add('is-dragging');}if(drag.moved){event.preventDefault();track.scrollLeft=drag.scroll-distance;}});
 const end=event=>{if(!drag||drag.id!==event.pointerId)return;if(drag.moved)suppressUntil=performance.now()+400;drag=null;track.classList.remove('is-dragging');if(track.hasPointerCapture(event.pointerId))track.releasePointerCapture(event.pointerId);};
 track.addEventListener('pointerup',end);track.addEventListener('pointercancel',end);track.addEventListener('lostpointercapture',end);
 track.addEventListener('click',event=>{if(performance.now()<suppressUntil){event.preventDefault();event.stopImmediatePropagation();}},true);
 function updateSpotlight(){const max=spotlight.scrollWidth-spotlight.clientWidth;$('spotlight-prev').disabled=spotlight.scrollLeft<=2;$('spotlight-next').disabled=spotlight.scrollLeft>=max-2;}
 for(const [id,direction] of [['spotlight-prev',-1],['spotlight-next',1]])$(id).onclick=()=>spotlight.scrollBy({left:direction*((spotlight.firstElementChild?.getBoundingClientRect().width||400)+20),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 spotlight.addEventListener('scroll',updateSpotlight,{passive:true});new ResizeObserver(updateSpotlight).observe(spotlight);
 function dates(){
  if(state.month!=='all')shownMonth=Number(state.month);
  $('datebar-month').textContent=new Intl.DateTimeFormat('ru',{month:'long',year:'numeric',timeZone:'Europe/Moscow'}).format(new Date(Date.UTC(eventYear,shownMonth-1,15))).replace(/ г\.$/,'');
  $('date-month-prev').disabled=shownMonth===eventMonthBounds.min;$('date-month-next').disabled=shownMonth===eventMonthBounds.max;
  if(builtMonth!==shownMonth){
   builtMonth=shownMonth;const count=new Date(Date.UTC(eventYear,shownMonth,0)).getUTCDate();
   track.innerHTML=Array.from({length:count},(_,i)=>{const date=new Date(Date.UTC(eventYear,shownMonth-1,i+1)),day=`${eventYear}-${String(shownMonth).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`;return `<button class="date-day ${[0,6].includes(date.getUTCDay())?'is-weekend':''}" data-day="${day}" aria-pressed="false" aria-label="${new Intl.DateTimeFormat('ru',{dateStyle:'full',timeZone:'UTC'}).format(date)}"><strong>${i+1}</strong><span>${new Intl.DateTimeFormat('ru',{weekday:'short',timeZone:'UTC'}).format(date)}</span></button>`;}).join('');
   const today=Object.fromEntries(new Intl.DateTimeFormat('en',{year:'numeric',month:'numeric',day:'numeric',timeZone:'Europe/Moscow'}).formatToParts(new Date()).map(part=>[part.type,Number(part.value)]));
   if(today.year===eventYear&&today.month===shownMonth){const button=track.querySelector(`[data-day="${eventYear}-${String(shownMonth).padStart(2,'0')}-${String(today.day).padStart(2,'0')}"]`);track.scrollLeft=button?button.offsetLeft-track.firstElementChild.offsetLeft:0;}else track.scrollLeft=0;
  }
  $('date-all').setAttribute('aria-pressed',String(state.day==='all'));
  for(const button of track.querySelectorAll('[data-day]'))button.setAttribute('aria-pressed',String(button.dataset.day===state.day));
 }
 return {
  render(list){
   dates();$('event-type').value=state.category;
   const count=[state.category!=='all',state.region!=='all',state.month!=='all',state.day!=='all',!!state.query,state.savedOnly].filter(Boolean).length;$('active-filter-count').hidden=count===0;$('active-filter-count').textContent=count;
   const cards=['business-dinner','arkhangelsk','royal','aij','kaliningrad','murmansk','lenoblast','dss-spb'].map(id=>list.find(event=>event.id===id)).filter(Boolean),key=cards.map(event=>event.id).join('|');
   document.querySelector('.afisha-spotlight').hidden=!cards.length;
   if(key!==lastCards){lastCards=key;spotlight.innerHTML=cards.map(event=>`<button class="spotlight-card" data-open="${event.id}"><img src="${images[event.id]}" alt="" width="1536" height="1024" loading="lazy"><span class="spotlight-copy"><span>${safe(event.type)} · ${safe(event.date)}</span><strong>${safe(event.title)}</strong><span>${safe(event.city||'Искусственный интеллект')}</span></span><span class="spotlight-action">Подробнее ↗</span></button>`).join('');spotlight.scrollLeft=0;iconize(spotlight);}
   updateSpotlight();
  },
  reset(){shownMonth=11;builtMonth=0;}
 };
}
