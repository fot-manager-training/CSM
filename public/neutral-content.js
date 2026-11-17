// Neutral display names preserve source rows, products and financial conditions.
const providerNames={
 devices:'Умные устройства',а:'Тендерная платформа',a:'Тендерная платформа',
 звукбизнес:'Музыкальные сервисы для бизнеса',здоровье:'Медицинские сервисы',
 лигал:'Юридические сервисы',маркетинг:'Маркетинговые сервисы',мобайл:'Телеком-сервисы',
 решения:'Операционные решения',селлер:'Рекламные сервисы',сервис:'ИТ-сервисы',
 сити:'Городские решения',тех:'Технологические платформы',университет:'Корпоративная академия'
};
export function neutralProvider(value){
 const name=String(value??''),key=name.replace(/^(?:сбер|sber)[\s-]*/iu,'').replace(/[\s-]+/gu,'').toLocaleLowerCase('ru');
 return /^(?:сбер|sber)/iu.test(name)?providerNames[key]||neutralText(name):name;
}
export function neutralText(value){
 if(typeof value!=='string'||/^(?:https?:|mailto:|tel:)/i.test(value))return value;
 return value.replace(/DTaaS\s+СЗБ/giu,'DTaaS')
  .replace(/Сервисы Сбера \(API\)/giu,'Корпоративные API')
  .replace(/Практика из СберПро/giu,'Отраслевая практика')
  .replace(/Кампус СберУниверситета/giu,'Учебный кампус')
  .replace(/СберПодбор/giu,'Подбор персонала')
  .replace(/Sbergile/giu,'Agile-консалтинг')
  .replace(/Сбер\s*А:\s*/giu,'')
  .replace(/(?:Сбер|Sber)\s+[АA](?![\p{L}\p{N}])/giu,'Тендерная платформа')
  .replace(/Process Mining от Сбера/giu,'Process Mining')
  .replace(/ГК Сбера и Партнеров/giu,'партнёрской экосистемы')
  .replace(/СберУниверситета/giu,'корпоративной академии')
  .replace(/СберУниверситете/giu,'корпоративной академии')
  .replace(/СберУниверситет/giu,'корпоративная академия')
  .replace(/(?:Сбер|Sber)[\s-]*(?:Devices|Звук\s*Бизнес|Здоровье|Маркетинг|Мобайл|Решения|Селлер|Сервис|Сити|Тех|Лигал)/giu,neutralProvider)
  .replace(/Сбер[-\s]?Сервис/giu,'ИТ-сервисы')
  .replace(/Северо-Западного банка/giu,'банка')
  .replace(/Сбербанк(а|е|у|ом)?/giu,(_,ending)=>'банк'+(ending||''))
  .replace(/(?<![\p{L}\p{N}])Сбер(ом|а|е|у)?(?![\p{L}\p{N}])/giu,(_,ending)=>({ом:'банком',а:'банка',е:'банке',у:'банку'}[ending?.toLowerCase()]||'банк'));
}
export function neutralKnowledge(data){
 return {...data,records:data.records.map(row=>({...row,provider:neutralProvider(row.provider),product:neutralText(row.product)}))};
}
