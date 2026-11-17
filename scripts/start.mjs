import {loadEnvFile} from 'node:process';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
try{loadEnvFile(fileURLToPath(new URL('../.env',import.meta.url)));}
catch(error){if(error.code!=='ENOENT')throw Error('Не удалось прочитать серверный файл окружения.');}

// The child reads proxy/CA options at startup; credentials stay in its environment.
// Existing environment bindings take precedence over the ignored local .env file.
const server=spawn(process.execPath,[fileURLToPath(new URL('../server.mjs',import.meta.url))],{
 cwd:root,stdio:'inherit',env:{...process.env,
  NODE_USE_ENV_PROXY:process.env.NODE_USE_ENV_PROXY??'1',
  NODE_USE_SYSTEM_CA:process.env.NODE_USE_SYSTEM_CA??'1'}
});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.kill(signal));
server.once('error',()=>{console.error('Не удалось запустить сервер.');process.exitCode=1;});
server.once('exit',(code,signal)=>{process.exitCode=code??(signal==='SIGTERM'?143:130);});
