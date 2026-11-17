import {neutralText} from './neutral-content.js?v=neutral-20261117';
export const fieldKeys=['minPv','pvRate','profitRate','ownership','vatRate','finResult'];
export function validateKnowledge(data){
 if(data?.schemaVersion!==1||!Array.isArray(data.records)||!data.records.length||data.records.length>5000)throw Error('Invalid knowledge file');
 const ids=new Set();
 for(const row of data.records){
  if(typeof row.id!=='string'||!row.id||ids.has(row.id)||typeof row.provider!=='string'||!row.provider||typeof row.product!=='string'||!row.product||!Number.isInteger(row.row)||!row.sheet)throw Error('Invalid knowledge record');
  ids.add(row.id);for(const key of fieldKeys)if(!Number.isFinite(row.fields?.[key]?.value)||typeof row.fields[key].display!=='string')throw Error('Invalid knowledge field');
 }
 return data;
}
// One product card; equal conditions share references, distinct conditions stay selectable.
export function groupSources(rows){
 const products=new Map();
 for(const row of rows){
  const productKey=JSON.stringify([row.provider,row.product]);
  if(!products.has(productKey))products.set(productKey,{provider:row.provider,product:row.product,variants:[],conditions:new Map()});
  const product=products.get(productKey),conditionKey=JSON.stringify(fieldKeys.map(key=>row.fields.find(f=>f.key===key)?.value));
  let variant=product.conditions.get(conditionKey);
  if(!variant){variant={...row,references:[]};product.conditions.set(conditionKey,variant);product.variants.push(variant);}
  variant.references.push({id:row.id,sheet:row.sheet,row:row.row,range:row.range});
 }
 return [...products.values()].map(({conditions,...product})=>product);
}
export function normalize(value){
 return neutralText(String(value)).normalize('NFKC').toLocaleLowerCase('ru').replace(/ё/g,'е')
  .replace(/giga[\s-]*chat|гига[\s-]*чат(?:а|у|ом|е)?/gu,'гигачат')
  .replace(/giga[\s-]*code|гига[\s-]*код(?:а|у|ом|е)?/gu,'gigacode')
  .replace(/cloud[.\s]*ru|клауд(?:\.ру|ру)?/gu,'клаудру').replace(/2gis/gu,'2гис')
  .replace(/portal\s*da|портал\s*(?:да|da)/gu,'порталда').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
}
const stop=new Set('а и или в во на по для к ко у с со о об от до за из же какой какая какие как сколько чем что это укажи покажи расскажи пожалуйста есть будет будет ли да нет условия условие ставка ставки кв пв ндс мин финрез вознаграждение вознаграждения продукт продукта продукты компании компания бизнес самый самая самое самые высокий высокая высокие максимальный максимальная минимальный минимальная большой большая больше меньше топ сравни сравнить результат финансовый'.split(' '));
const stem=word=>word.length>4?word.replace(/(иями|ами|ями|ого|ему|ыми|ими|ией|иям|ах|ях|ов|ев|ий|ый|ая|ое|ые|ой|ом|ам|ям|ую|юю|а|я|ы|и|у|ю|е|о)$/u,''):word;
for(const word of 'какое низкий низкая низкие низкое маленький маленькая маленькие маленькое наибольший наибольшая наибольшие наименьший наименьшая наименьшие'.split(' '))stop.add(word);
const terms=text=>[...new Set(normalize(text).split(' ').filter(w=>w.length>=2&&!stop.has(w)&&!/^\d+$/.test(w)).map(stem))];
function ranking(question){
 const q=normalize(question);
 if(!/сам[а-я]*|максим|миним|наибол|наимень|(?:^|\s)топ(?:\s|$)/u.test(q))return null;
 let field=/финрез|финансов.*результ/u.test(q)?'finResult':/min\s*пв|мин\s*пв/u.test(q)?'minPv':/к\s*приб/u.test(q)?'profitRate':/(?:^|\s)(?:пв|кв)(?=\s|$)/u.test(q)?'pvRate':null;
 return field?{field,direction:/миним|наимень|сам[а-я]*\s*(?:низк|мал)/u.test(q)?1:-1}:null;
}
export function retrieve(knowledge,question,history=[],limit=12){
 const query=normalize(question),current=terms(question),previous=history.filter(m=>m.role==='user').slice(-2).flatMap(m=>terms(m.content));
 const effective=current.length?current:[...new Set(previous)];
 const documents=knowledge.records.map(row=>({row,provider:normalize(row.provider),product:normalize(row.product),words:terms(row.provider+' '+row.product)}));
 const frequencies=new Map(effective.map(t=>[t,documents.filter(d=>d.words.some(w=>w===t||(t.length>=4&&w.includes(t)))).length]));
 const scored=documents.map(d=>{
  let score=0;for(const t of effective){const idf=Math.log(1+documents.length/(1+(frequencies.get(t)||0)));if(d.words.some(w=>w===t||(t.length>=4&&w.includes(t))))score+=idf*(terms(d.row.product).some(w=>w===t||w.includes(t))?4:2);}
  if(query.includes(d.provider))score+=7;if(query.includes(d.product))score+=18;
  if(score>0&&current.length&&previous.length)for(const t of previous)if(d.words.includes(t))score+=.25;
  return {...d,score};
 }).filter(d=>d.score>0).sort((a,b)=>b.score-a.score);
 const best=scored[0]?.score||0;let matches=scored.filter(d=>d.score>=best*.55).map(d=>d.row);
 const order=ranking(question);if(order){if(!matches.length)matches=[...knowledge.records];matches.sort((a,b)=>order.direction*(a.fields[order.field].value-b.fields[order.field].value));}
 const rowNumber=question.match(/(?:строк[а-я]*|вариант)\s*(\d{1,4})/iu)?.[1];
 if(rowNumber)matches=knowledge.records.filter(row=>row.row===Number(rowNumber));
 const vat=/без\s+ндс/iu.test(question)?0:question.match(/ндс\s*[:=—-]?\s*(\d{1,2}(?:[,.]\d+)?)\s*%/iu)?.[1];
 if(vat!==undefined)matches=matches.filter(row=>Math.abs(row.fields.vatRate.value-Number(String(vat).replace(',','.'))/100)<1e-9);
 return {records:matches.slice(0,limit),total:matches.length,ranking:order,vatRequested:vat!==undefined};
}
export function conversationReply(question){
 const q=normalize(question);
 if(/^(?:привет(?:ик)?|здравствуй(?:те)?|добрый (?:день|вечер)|доброе утро|hello|hi|hey)(?: всем)?$/u.test(q))return 'Здравствуйте! Помогу разобраться в КВ: найти условия продукта, сравнить варианты и уточнить показатели. Что вас интересует?';
 if(/^(?:спасибо(?: большое)?|благодарю|понятно спасибо|ок спасибо)$/u.test(q))return 'Пожалуйста! Если понадобится сравнить условия или найти другой продукт — напишите.';
 if(/что (?:ты |вы )?(?:можешь|можете) (?:рассказать|сказать|посоветовать)/u.test(q))return null;
 if(/^(?:помощь|help)$/u.test(q)||/(?:что (?:ты |вы )?(?:умеешь|умеете|можешь|можете)|чем (?:ты |вы )?(?:поможешь|можешь помочь|можете помочь)|кто (?:ты|вы)|расскажи о себе|твои возможности|ваши возможности|как (?:ты работаешь|вы работаете))/u.test(q))return 'Помогаю находить условия КВ по компании и продукту, сравнивать варианты, уточнять ПВ, MIN ПВ, НДС и ФинРез. Например, спросите: «Какие условия у ГигаЧат для бизнеса ПАК?»';
 return null;
}
export function catalogReply(knowledge,question){
 const q=normalize(question);
 if(/услови|ставк|(?:^|\s)(?:пв|ндс|финрез|min)(?:\s|$)/u.test(q))return null;
 if(!/(?:какие|список|перечисли|покажи|доступн).*(?:продукт|сервис|решени)|(?:продукт|сервис|решени).*(?:есть|доступн|представлен)/u.test(q))return null;
 const providers=[...new Set(knowledge.records.map(row=>row.provider))].filter(name=>q.includes(normalize(name)));
 const rows=providers.length?knowledge.records.filter(row=>providers.includes(row.provider)):knowledge.records;
 const products=[...new Set(rows.map(row=>row.product))];
 return 'В базе есть, например:\n'+products.slice(0,10).map(name=>'• '+name).join('\n')+'\n\nКакое направление или компания вас интересует? Подберу подходящие продукты и условия.';
}
export function overviewAnswer(knowledge,question){
 const q=normalize(question);
 if(/(?:какие|список|перечисли).*компани|компани.*(?:есть|файле|таблице|базе)/u.test(q))return `В базе представлены компании:\n${[...new Set(knowledge.records.map(r=>r.provider))].join(', ')}.`;
 if(/(?:что (?:такое|значит)|расшифру|обознача|какие)/u.test(q)&&/(?:\bmin\b|пв|ндс|финрез|поля|показатели|столбцы)/u.test(q))return 'В базе есть MIN ПВ, ПВ, К приб, доля владения, НДС и ФинРез. MIN ПВ указан в рублях, остальные показатели — в процентах. ПВ и К приб — отдельные показатели. Какой показатель разобрать подробнее?';
 return null;
}
export function lookupResponse(knowledge,question,history=[]){
 const guide=conversationReply(question)||catalogReply(knowledge,question);
 const found=guide?{records:[],total:0}:retrieve(knowledge,question,history);
 const sources=found.records.map(publicRecord);
 return {answer:guide||(!sources.length&&overviewAnswer(knowledge,question))||tableAnswer(found),mode:sources.length?'lookup':'guide',sources,totalMatches:found.total,
  source:{filename:knowledge.filename,version:knowledge.sha256,notes:knowledge.notes}};
}
export function publicRecord(row){
 return {id:row.id,provider:row.provider,product:row.product,sheet:row.sheet,row:row.row,range:row.range,
  fields:fieldKeys.map(key=>({key,label:row.fields[key].label,value:row.fields[key].display,cell:row.fields[key].cell}))};
}
export function tableAnswer(result){
 if(!result.records.length)return 'В базе не нашлось подходящего продукта. Уточните его название или компанию — помогу найти условия.';
 const variant=groupSources(result.records.map(publicRecord)).some(product=>product.variants.length>1)?' В файле есть несколько вариантов условий для одного продукта. Выберите вариант внутри карточки.':'';
 return `${result.ranking?'Подобраны строки по указанному показателю.':'Условия из загруженной таблицы приведены ниже.'}${variant}${result.total>result.records.length?` Показано ${result.records.length} из ${result.total} строк; уточните запрос, чтобы сузить подбор.`:''}`;
}
