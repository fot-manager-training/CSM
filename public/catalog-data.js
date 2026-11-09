import {cases,partners} from './content.js?v=cases-20261109';
export {cases,partners};
const normalize=value=>String(value??'').toLocaleLowerCase('ru').replaceAll('ё','е').trim();
export const technologies=[...new Set(partners.flatMap(p=>p.tags).concat(['Биометрия','Блокчейн','Видеоаналитика и видеонаблюдение','Интернет-вещей (IoT)','Контроль доступа','Кибербезопасность','Роботы и дроны','RPA','Дополненная и виртуальная реальность (AR/VR)','Аудиоаналитика']))].sort((a,b)=>a.localeCompare(b,'ru'));
export function filterPartners({query='',role='all',technology='all',accreditation='all'}={}){
 const q=normalize(query);return partners.filter(p=>{
  const text=normalize([p.name,p.inn,p.description,...p.tags,p.role,p.region].join(' '));
  const tech=normalize(technology==='1С'?'1С':technology==='Чат-боты и голосовые ассистенты'?'Чат-боты':technology);
  return (!q||text.includes(q))&&(role==='all'||p.role.includes(role))&&(technology==='all'||normalize(p.description+' '+p.tags.join(' ')).includes(tech))&&(accreditation==='all'||p.accreditation===accreditation);
 });
}
export function filterCases({query='',category='all',status='all',savedOnly=false,saved=[]}={}){
 const q=normalize(query);return cases.filter(c=>(!q||normalize([c.client,c.title,c.description,...(c.details||[]),c.stage,...(c.metrics||[]).flatMap(m=>[m.value,m.description,m.context]),...c.tags,c.category,c.portfolio].join(' ')).includes(q))&&(category==='all'||c.category===category)&&(status==='all'||c.metricKind===status)&&(!savedOnly||saved.includes(c.id)));
}
