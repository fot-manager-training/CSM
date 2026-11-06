// Promotional illustrations, not photographs of the announced venues or events.
export const eventImages=Object.fromEntries(['kaliningrad','murmansk','lenoblast','royal','aij'].map(id=>[id,`./assets/events/${id==='royal'?'royal-spb':id}.webp`]));

// Editorial concept art. These illustrations do not depict client premises or partner staff.
export const caseImages=Object.fromEntries([...Array.from({length:19},(_,i)=>String(i+1).padStart(2,'0')),'23'].map(number=>[`case-${number}`,`./assets/cases/case-${number}.webp`]));
export const sceneImages={cases:'./assets/scenes/cases-banner.webp',partners:'./assets/scenes/partners-banner.webp'};
export function partnerImage(partner){
 const text=[partner.description,...partner.tags].join(' ');
 const themes=[[/медицин|здравоохран/i,'05'],[/BIM|строитель|девелоп/i,'03'],[/логист|склад|WMS|транспорт/i,'12'],[/промышлен|производ|робот/i,'19'],[/документ|ЭДО|1С|финанс/i,'17'],[/компьютерное зрение|видеонаблюд/i,'19'],[/дизайн|маркет/i,'14'],[/CRM|клиент/i,'13'],[/AI|ИИ|ML|интеллект|аналитик/i,'09'],[/облач|инфраструктур|интеграц/i,'08']];
 return caseImages[`case-${themes.find(([pattern])=>pattern.test(text))?.[1]||'13'}`];
}
