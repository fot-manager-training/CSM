export const fieldKeys=['minPv','pvRate','profitRate','ownership','vatRate','finResult'];
export function normalize(value){
 return String(value).normalize('NFKC').toLocaleLowerCase('ru').replace(/ё/g,'е')
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
export function overviewAnswer(knowledge,question){
 const q=normalize(question),sheet=knowledge.sheets?.[0]||'Лист1';
 if(/(?:какие|список|перечисли).*компани|компани.*(?:есть|файле|таблице)/u.test(q))return `В файле представлены компании:\n${[...new Set(knowledge.records.map(r=>r.provider))].join(', ')}.\nИсточник: ${knowledge.filename} · ${sheet}!A2:A${Math.max(...knowledge.records.map(r=>r.row))}.`;
 if(/что (?:такое|значит)|расшифру|обознача|какие.*(?:поля|показатели|столбцы)/u.test(q))return `В файле указаны: КЭС, продукт, MIN ПВ, ПВ,%, К приб,%, доля владения, НДС и ФинРез. MIN ПВ берётся из поля фиксированного вознаграждения во внешнем калькуляторе; правило его применения здесь не описано. ПВ и К приб — отдельные показатели. ФинРез указан в процентах, а не в рублях. Полной расшифровки сокращений и правил выплаты в файле нет.\nИсточник: ${knowledge.filename} · ${sheet}!A1:H1; формулы столбцов C:H.`;
 return null;
}
export function publicRecord(row){
 return {id:row.id,provider:row.provider,product:row.product,sheet:row.sheet,row:row.row,range:row.range,
  fields:fieldKeys.map(key=>({key,label:row.fields[key].label,value:row.fields[key].display,cell:row.fields[key].cell}))};
}
export function tableAnswer(result){
 if(!result.records.length)return 'В таблице не нашлось подходящих условий. Уточните компанию и полное название продукта. Правила выплаты, дата действия ставок и порядок применения MIN ПВ в файле не описаны.';
 const variant=result.records.length>1?' В файле есть несколько строк или вариантов условий: проверьте название продукта и НДС.':'';
 return `${result.ranking?'Подобраны строки по указанному показателю.':'Условия из загруженной таблицы приведены ниже.'}${variant}${result.total>result.records.length?` Показано ${result.records.length} из ${result.total} строк; уточните запрос, чтобы сузить подбор.`:''}`;
}
