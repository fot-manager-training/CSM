function httpError(status,message){return Object.assign(Error(message),{status});}
function bodyJson(req,limit=49152){
 return new Promise((resolve,reject)=>{
  let size=0,chunks=[],settled=false;
  const timer=setTimeout(()=>finish(httpError(408,'Запрос выполнялся слишком долго.')),10000);timer.unref?.();
  const finish=(error,value)=>{if(settled)return;settled=true;clearTimeout(timer);error?reject(error):resolve(value);};
  req.on('data',chunk=>{if(settled)return;size+=Buffer.byteLength(chunk);if(size>limit){chunks=[];finish(httpError(413,'Слишком большой запрос.'));return;}chunks.push(Buffer.from(chunk));});
  req.on('end',()=>{if(settled)return;try{finish(null,JSON.parse(Buffer.concat(chunks).toString('utf8')));}catch{finish(httpError(400,'Не удалось прочитать запрос.'));}});
  req.on('error',()=>finish(httpError(400,'Не удалось прочитать запрос.')));
 });
}
function validateInput(body){
 if(!body||typeof body.question!=='string'||!body.question.trim()||body.question.length>1200)throw httpError(400,'Введите вопрос длиной до 1200 символов.');
 const history=body.history??[];
 if(!Array.isArray(history)||history.length>6||history.some(m=>!m||!['user','assistant'].includes(m.role)||typeof m.content!=='string'||m.content.length>1200))throw httpError(400,'Некорректная история диалога.');
 return {question:body.question.trim(),history:history.map(m=>({role:m.role,content:m.content}))};
}
export function createKvApi({knowledge,service,providerConfigured=false,allowedOrigins=[],now=Date.now,limit=20}){
 const buckets=new Map();let active=0;
 return async function handle(req,res,pathname){
  if(!pathname.startsWith('/api/kv/'))return false;
  const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Origin'};
  const send=(status,data)=>{if(!res.destroyed&&!res.writableEnded){res.writeHead(status,headers);res.end(JSON.stringify(data));}};
  const origin=req.headers.origin;
  if(origin){
   let same=false;try{const parsed=new URL(origin);same=['http:','https:'].includes(parsed.protocol)&&parsed.host===req.headers.host;}catch{}
   if(!same&&!allowedOrigins.includes(origin)){send(403,{error:'Доступ с этой страницы не разрешён.'});return true;}
   headers['Access-Control-Allow-Origin']=origin;
  }
  if(req.method==='OPTIONS'){headers['Access-Control-Allow-Methods']='GET, POST, OPTIONS';headers['Access-Control-Allow-Headers']='Content-Type';send(204,{});return true;}
  if(pathname==='/api/kv/status'&&req.method==='GET'){
   send(200,{ready:!!knowledge,providerConfigured,source:knowledge?{filename:knowledge.filename,rows:knowledge.records.length,products:new Set(knowledge.records.map(r=>r.provider+'\0'+r.product)).size,providers:new Set(knowledge.records.map(r=>r.provider)).size}:null});return true;
  }
  if(pathname!=='/api/kv/chat'){send(404,{error:'Раздел не найден.'});return true;}
  if(req.method!=='POST'){headers.Allow='POST';send(405,{error:'Используйте отправку вопроса.'});return true;}
  if(!knowledge||!service){send(503,{error:'База знаний помощника пока не подключена.'});return true;}
  if(!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type']||'')){send(415,{error:'Ожидается JSON-запрос.'});return true;}
  const ip=req.socket?.remoteAddress||'local',time=now();let bucket=buckets.get(ip);
  if(!bucket||time-bucket.since>=60000){bucket={since:time,count:0};buckets.set(ip,bucket);}
  if(buckets.size>2000)for(const [key,value] of buckets)if(time-value.since>=60000)buckets.delete(key);
  if(++bucket.count>limit||active>=3){headers['Retry-After']='60';send(429,{error:'Слишком много вопросов. Попробуйте через минуту.'});return true;}
  active++;const controller=new AbortController();
  req.once('aborted',()=>controller.abort());res.once?.('close',()=>{if(!res.writableEnded)controller.abort();});
  try{
   const input=validateInput(await bodyJson(req));
   const result=await service.ask(input.question,input.history,controller.signal);send(200,result);
  }catch(error){if(!controller.signal.aborted)send(error.status||500,{error:error.status?error.message:'Не удалось получить ответ. Попробуйте ещё раз.'});}
  finally{active--;}
  return true;
 };
}
