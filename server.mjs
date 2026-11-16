import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {loadKnowledge} from './server/kv-knowledge.mjs';
import {createKvService} from './server/kv-service.mjs';
import {createKvApi} from './server/kv-api.mjs';
const root = path.resolve(fileURLToPath(new URL('./public/', import.meta.url)));
const projectRoot = fileURLToPath(new URL('./',import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.ttf': 'font/ttf', '.otf': 'font/otf' };
export function createSiteServer({kvApi}={}){return http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if(kvApi&&await kvApi(req,res,pathname))return;
    const target = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!target.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
    const content = await readFile(target);
    res.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
    res.end(content);
  } catch { res.writeHead(404); res.end('Not found'); }
});}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 let knowledge=null;
 try{knowledge=await loadKnowledge(path.resolve(projectRoot,process.env.KV_KNOWLEDGE_PATH||'server/private/kv-knowledge.json'));}
 catch{console.log('KV knowledge is not loaded; import the workbook to enable chat.');}
 const apiKey=process.env.DEEPSEEK_API_KEY||'';
 const service=knowledge?createKvService({knowledge,apiKey,model:process.env.DEEPSEEK_MODEL||'deepseek-chat'}):null;
 const kvApi=createKvApi({knowledge,service,providerConfigured:!!apiKey,allowedOrigins:(process.env.KV_ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean)});
 createSiteServer({kvApi}).listen(Number(process.env.PORT||3000),'0.0.0.0',()=>console.log('DTaaS platform running on port '+(process.env.PORT||3000)));
}
