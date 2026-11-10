import {events,filterEvents} from './data.js?v=events-20261110';
import {initShowcases,renderEventRail} from './showcase.js?v=events-20261110';
export function initHome({iconize}){
 initShowcases({iconize});renderEventRail(events);
 const buttons=[...document.querySelectorAll('.discovery-categories [data-category]')];
 for(const button of buttons)button.addEventListener('click',()=>{for(const item of buttons){item.classList.toggle('active',item===button);item.setAttribute('aria-pressed',String(item===button));}renderEventRail(filterEvents(events,{category:button.dataset.category}));});
 document.addEventListener('click',event=>{const button=event.target.closest('[data-open]');if(button)location.href=`./events.html#event/${encodeURIComponent(button.dataset.open)}`;});
}
