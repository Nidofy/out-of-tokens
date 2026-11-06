// Local contract fixture, not a DSH installation. Never uses a real user profile.
import{createServer}from'node:http';
import{mkdtemp,readFile,rm}from'node:fs/promises';
import{tmpdir}from'node:os';
import{join,resolve}from'node:path';
import{apply}from'../apps/dsh/dist/index.js';
const profile=await mkdtemp(join(tmpdir(),'oot-m3-harness-')),cleanups=[];let handler;
await apply({profileContext:{dir:profile},on(_event,fn){handler=fn;},effect(fn){cleanups.push(fn());}},resolve('apps/dsh/dist'));
const page=`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>DSH contract fixture</title><body><header data-conversation-header-corner></header><h1>DSH contract fixture — 临时档案，不是真实小院验收</h1><div class="village-community-map"><button data-place="workshop">AI 工坊</button><button data-place="library">邻接图书馆</button></div><p id="neighbor">邻接功能就绪</p><button id="unload">卸载工坊适配器</button><p id="result"></p><script type="module">
import{apply}from'/fixture-client.js';const cleanup=[],listeners=[];apply({get(){return{state:{getSnapshot(){return'connected'},subscribe(fn){listeners.push(fn);return()=>listeners.splice(listeners.indexOf(fn),1)}}}},on(){},effect(fn){cleanup.push(fn())}});
document.querySelector('[data-place="library"]').onclick=()=>document.querySelector('#neighbor').textContent='邻接图书馆仍可使用';
document.querySelector('#unload').onclick=async()=>{for(const fn of cleanup.reverse())await fn();document.querySelector('#result').textContent='适配器已卸载';};
</script></body></html>`;
const server=createServer((req,res)=>{if(req.url==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(page);return;}if(req.url==='/fixture-client.js'){void readFile('apps/dsh/dist/client.js').then(b=>{res.setHeader('Content-Type','text/javascript');res.end(b);});return;}void handler(req,res,()=>{res.statusCode=404;res.end('Not found');});});
server.listen(5181,'127.0.0.1',()=>console.log('Contract fixture http://localhost:5181 ; temporary profile: '+profile));
let closing=false;async function close(){if(closing)return;closing=true;for(const fn of cleanups.reverse())await fn();server.closeAllConnections();server.close();if(!resolve(profile).startsWith(resolve(tmpdir())+'\\oot-m3-harness-')&&!resolve(profile).startsWith(resolve(tmpdir())+'/oot-m3-harness-'))throw Error('UNSAFE_CLEANUP');await rm(profile,{recursive:true,force:true});}
process.on('SIGINT',()=>void close());process.on('SIGTERM',()=>void close());
