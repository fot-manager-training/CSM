import {cases,partners} from './content.js?v=platform-update-20261111';
export {cases,partners};
const normalize=value=>String(value??'').toLocaleLowerCase('ru').replaceAll('ё','е').trim();
export const technologies=[...new Set(partners.flatMap(p=>[...p.tags,...(p.products||[])]).concat(['Биометрия','Блокчейн','Видеоаналитика и видеонаблюдение','Интернет-вещей (IoT)','Контроль доступа','Кибербезопасность','Роботы и дроны','RPA','Дополненная и виртуальная реальность (AR/VR)','Аудиоаналитика']))].sort((a,b)=>a.localeCompare(b,'ru'));
export const partnerRoles=[...new Set(partners.flatMap(p=>p.roles?.length?p.roles:[p.role]))].sort((a,b)=>a.localeCompare(b,'ru'));
export function filterPartners({query='',role='all',technology='all',accreditation='all'}={}){
 const q=normalize(query);return partners.filter(p=>{
  const text=normalize([p.name,p.inn,p.description,p.expertise,...p.tags,...(p.products||[]),...(p.industries||[]),...(p.contacts||[]).flatMap(c=>[c.name,c.email,c.phone]),p.website,p.role,p.region].join(' '));
  const tech=normalize(technology==='1С'?'1С':technology==='Чат-боты и голосовые ассистенты'?'Чат-боты':technology);
  return (!q||text.includes(q))&&(role==='all'||(p.roles?.length?p.roles.includes(role):p.role===role))&&(technology==='all'||normalize([p.description,...p.tags,...(p.products||[])].join(' ')).includes(tech))&&(accreditation==='all'||p.accreditation===accreditation);
 });
}
export const caseIndustries=[...new Set(cases.map(c=>c.industry).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ru'));
export const caseProcesses=[...new Set(cases.flatMap(c=>c.processes||[]))].sort((a,b)=>a.localeCompare(b,'ru'));
export const caseResults=[...new Set(cases.flatMap(c=>c.results||[]))].sort((a,b)=>a.localeCompare(b,'ru'));
export function filterCases({query='',category='all',industry='all',process='all',result='all',status='all',savedOnly=false,saved=[]}={}){
 const q=normalize(query);return cases.filter(c=>(!q||normalize([c.client,c.title,c.industry,...(c.processes||[]),...(c.results||[]),c.description,...(c.details||[]),c.stage,...(c.metrics||[]).flatMap(m=>[m.value,m.description,m.context]),...c.tags,c.category,c.portfolio].join(' ')).includes(q))&&(category==='all'||c.category===category)&&(industry==='all'||c.industry===industry)&&(process==='all'||c.processes?.includes(process))&&(result==='all'||c.results?.includes(result))&&(status==='all'||c.metricKind===status)&&(!savedOnly||saved.includes(c.id)));
}
