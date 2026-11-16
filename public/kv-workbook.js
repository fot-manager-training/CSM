import {fieldKeys} from './kv-lookup.js?v=kv-clean-20261116';

const MAX_FILE=32*1024*1024,MAX_EXPANDED=64*1024*1024;
const labels=['КЭС','Продукт','MIN ПВ','ПВ,%','К приб,%','Доля владения,%','НДС,%','ФинРез'];
const fail=message=>{throw Error(message);};
const elements=(node,name)=>Array.from(node.getElementsByTagNameNS('*',name));
function xml(text){
 if(/<!DOCTYPE|<!ENTITY/i.test(text))fail('В файле обнаружен неподдерживаемый XML.');
 const doc=new DOMParser().parseFromString(text,'application/xml');
 if(elements(doc,'parsererror').length)fail('Не удалось прочитать XML книги Excel.');
 return doc;
}
function archive(buffer){
 const bytes=new Uint8Array(buffer),view=new DataView(buffer),entries=new Map();
 let end=-1;
 for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(view.getUint32(i,true)===0x06054b50&&i+22+view.getUint16(i+20,true)===bytes.length){end=i;break;}
 if(end<0)fail('Выберите книгу Excel в формате .xlsx.');
 const count=view.getUint16(end+10,true),directory=view.getUint32(end+16,true);
 if(view.getUint16(end+4,true)||view.getUint16(end+6,true)||count>4096||directory>=end)fail('Неподдерживаемая структура книги Excel.');
 let offset=directory,total=0;
 for(let i=0;i<count;i++){
  if(offset+46>end||view.getUint32(offset,true)!==0x02014b50)fail('Повреждён архив Excel.');
  const nameLength=view.getUint16(offset+28,true),extraLength=view.getUint16(offset+30,true),commentLength=view.getUint16(offset+32,true);
  const next=offset+46+nameLength+extraLength+commentLength;
  if(next>end)fail('Повреждён архив Excel.');
  const name=new TextDecoder().decode(bytes.subarray(offset+46,offset+46+nameLength));
  const entry={flags:view.getUint16(offset+8,true),method:view.getUint16(offset+10,true),size:view.getUint32(offset+24,true),compressed:view.getUint32(offset+20,true),offset:view.getUint32(offset+42,true)};
  if(entry.flags&1)fail('Книга защищена паролем. Выберите доступную копию .xlsx.');
  total+=entry.size;if(total>MAX_EXPANDED)fail('Распакованная книга слишком большая.');
  if(entries.has(name))fail('В архиве Excel есть повторяющиеся файлы.');
  entries.set(name,entry);offset=next;
 }
 return async function read(name,optional=false){
  const entry=entries.get(name);if(!entry){if(optional)return null;fail('В книге отсутствует обязательный файл Excel.');}
  const start=entry.offset;
  if(start+30>directory||view.getUint32(start,true)!==0x04034b50)fail('Повреждён архив Excel.');
  const dataStart=start+30+view.getUint16(start+26,true)+view.getUint16(start+28,true);
  if(dataStart+entry.compressed>directory)fail('Повреждён архив Excel.');
  let data=bytes.subarray(dataStart,dataStart+entry.compressed);
  if(entry.method===8){
   if(typeof DecompressionStream==='undefined')fail('Для чтения Excel обновите браузер.');
   let decompressor;try{decompressor=new DecompressionStream('deflate-raw');}catch{fail('Этот браузер не поддерживает чтение .xlsx. Откройте сайт в обновлённом браузере.');}
   const reader=new Blob([data]).stream().pipeThrough(decompressor).getReader(),parts=[];let length=0;
   while(true){const {value,done}=await reader.read();if(done)break;length+=value.length;if(length>entry.size||length>MAX_EXPANDED){await reader.cancel();fail('Размер распакованной книги превышает допустимый.');}parts.push(value);}
   data=new Uint8Array(length);let position=0;for(const part of parts){data.set(part,position);position+=part.length;}
  }else if(entry.method!==0)fail('Неподдерживаемое сжатие книги Excel.');
  if(data.length!==entry.size)fail('Повреждён файл внутри книги Excel.');
  return xml(new TextDecoder().decode(data));
 };
}
const textContent=node=>elements(node,'t').map(t=>t.textContent).join('');
function cellValue(cell,strings){
 const type=cell.getAttribute('t'),value=elements(cell,'v')[0]?.textContent;
 if(type==='inlineStr')return textContent(cell);
 if(type==='s'){
  const index=Number(value);if(!Number.isInteger(index)||index<0||index>=strings.length)fail('Повреждён список строк Excel.');
  return strings[index];
 }
 if(type==='str')return value||'';
 if(type==='e'||type==='b')return null;
 if(value===undefined||value.trim()==='')return null;
 const number=Number(value);return Number.isFinite(number)?number:null;
}
function display(value,money=false){
 return new Intl.NumberFormat('ru-RU',{useGrouping:money,maximumFractionDigits:money?2:6}).format(value*(money?1:100))+(money?' ₽':' %');
}

// Reads cached values only. No formulas, macros, external links or network requests run.
export async function readKvWorkbook(file){
 if(!/\.xlsx$/i.test(file.name)||!file.size||file.size>MAX_FILE)fail('Выберите файл .xlsx размером до 32 МБ.');
 const buffer=await file.arrayBuffer(),read=archive(buffer);
 const workbook=await read('xl/workbook.xml'),relationships=await read('xl/_rels/workbook.xml.rels');
 const shared=await read('xl/sharedStrings.xml',true),strings=shared?elements(shared,'si').map(textContent):[];
 const sheets=elements(workbook,'sheet');if(!sheets.length||sheets.length>10)fail('В книге должно быть от одного до десяти листов.');
 const records=[],sheetNames=[];
 for(let sheetIndex=0;sheetIndex<sheets.length;sheetIndex++){
  const sheet=sheets[sheetIndex],name=sheet.getAttribute('name');
  const relationshipId=sheet.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id');
  const relationship=elements(relationships,'Relationship').find(r=>r.getAttribute('Id')===relationshipId);
  const target=relationship?.getAttribute('Target');
  if(!target||relationship.getAttribute('TargetMode')==='External'||/^[a-z]+:/i.test(target))fail('Внешние листы Excel не поддерживаются.');
  const path=new URL(target,'https://workbook.invalid/xl/workbook.xml').pathname.slice(1);
  if(!path.startsWith('xl/worksheets/'))fail('Неподдерживаемый тип листа Excel.');
  const doc=await read(path),rows=elements(doc,'row');if(rows.length>5000)fail('В книге слишком много строк.');
  let headerFound=false;sheetNames.push(name);
  for(const row of rows){
   const number=Number(row.getAttribute('r'));if(!Number.isInteger(number)||number<1||number>5000)fail('Некорректный номер строки Excel.');
   const cells=new Map();
   for(const cell of elements(row,'c')){
    const ref=cell.getAttribute('r'),match=/^([A-H])(\d+)$/.exec(ref||'');
    if(match&&Number(match[2])===number)cells.set(match[1],cellValue(cell,strings));
   }
   const values=Array.from('ABCDEFGH',letter=>cells.get(letter));
   if(number===1){if(values.some((value,i)=>String(value??'').trim()!==labels[i]))fail(`В листе «${name}» ожидаются колонки КЭС, Продукт, MIN ПВ, ПВ,%, К приб,%, Доля владения,%, НДС,% и ФинРез.`);headerFound=true;continue;}
   if(values.every(value=>value==null))continue;
   if(!values.slice(0,2).every(v=>typeof v==='string'&&v.trim())||!values.slice(2).every(Number.isFinite))fail(`Нет сохранённых значений: ${name}!A${number}:H${number}. Сохраните книгу в Excel и выберите её снова.`);
   const fields={};for(let i=0;i<fieldKeys.length;i++){const key=fieldKeys[i];fields[key]={label:labels[i+2],value:values[i+2],display:display(values[i+2],key==='minPv'),cell:'CDEFGH'[i]+number};}
   records.push({id:`s${sheetIndex+1}-r${number}`,provider:values[0].trim(),product:values[1].trim(),sheet:name,row:number,range:`A${number}:H${number}`,fields});
   if(records.length>5000)fail('В книге слишком много строк.');
  }
  if(!headerFound)fail('В книге отсутствуют заголовки A1:H1.');
 }
 if(!records.length)fail('В книге нет данных КВ.');
 return {schemaVersion:1,filename:file.name,sheets:sheetNames,records,notes:['Использованы сохранённые в Excel значения; внешние формулы не пересчитывались.','Дата действия условий и правило применения MIN ПВ в файле не указаны.']};
}
