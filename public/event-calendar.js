import {eventImages} from './media.js?v=platform-update-20261111';
const safe=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tones={
 kaliningrad:['#c4a3ff','#302545'],murmansk:['#7dc8ff','#1a354d'],lenoblast:['#9ddd9b','#203e32'],
 royal:['#ffc38e','#443123'],aij:['#f6a2dc','#422a41'],'business-dinner':['#67e2ca','#1b3d3c'],
 'dss-spb':['#ebd477','#403c24'],arkhangelsk:['#b1bdce','#2d3646']
};
function style(event){const [accent,bg]=tones[event.id]||tones.arkhangelsk;return `--event-accent:${accent};--event-bg:${bg}`;}
export function calendarEvent(event){
 return `<button class="calendar-event" data-open="${event.id}" style="${style(event)}" aria-label="${safe(event.title)} · ${safe(event.date)} · ${safe(event.city||'Место уточняется')}"><img src="${eventImages[event.id]}" alt="" width="180" height="100" loading="lazy"><span class="calendar-event-title">${safe(event.title)}</span></button>`;
}
export function calendarLegend(list){
 return list.length?`<ul class="calendar-legend" aria-label="Цветовые обозначения мероприятий">${list.map(event=>`<li style="${style(event)}"><i aria-hidden="true"></i><span>${safe(event.title)}</span></li>`).join('')}</ul>`:'';
}
