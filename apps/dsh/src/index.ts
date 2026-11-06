import {readFile,readdir,realpath} from 'node:fs/promises';
import {dirname,join,relative,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import type {IncomingMessage,ServerResponse} from 'node:http';
import {validateContent} from 'oot-content';
import type {WritableSlot} from 'oot-platform';
import {FileSaves} from './store.js';
export const name='out-of-tokens';
export const inject=['connection','profileContext'];
export const prefix='/out-of-tokens/';
export type Handler=(req:IncomingMessage,res:ServerResponse,next:()=>unknown)=>Promise<unknown>;
export interface HostContext{profileContext:{dir:string};on(event:'connection/request',handler:Handler):unknown;effect(factory:()=>()=>Promise<void>):unknown}
const mime:Record<string,string>={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json','.webmanifest':'application/manifest+json','.txt':'text/plain; charset=utf-8'};
async function assets(root:string){const map=new Map<string,Buffer>();const base=await realpath(root);async function walk(dir:string){for(const entry of await readdir(dir,{withFileTypes:true})){if(entry.isSymbolicLink())throw Error('UNSAFE_ASSET');const path=join(dir,entry.name);if(entry.isDirectory())await walk(path);else if(entry.isFile())map.set(relative(base,path).split(sep).join('/'),await readFile(path));}}await walk(base);return map;}
async function body(req:IncomingMessage,signal:AbortSignal){if(!req.headers['content-type']?.startsWith('application/json'))throw Error('JSON_REQUIRED');let size=0;const chunks:Buffer[]=[];for await(const chunk of req){signal.throwIfAborted();const b=Buffer.from(chunk);size+=b.length;if(size>17000000)throw Error('BODY_TOO_LARGE');chunks.push(b);}return JSON.parse(Buffer.concat(chunks).toString('utf8')) as {id:WritableSlot;text:string;expectedRevision:number};}
export async function apply(ctx:HostContext,directory=dirname(fileURLToPath(import.meta.url))){
 const lifetime=new AbortController(),pending=new Set<Promise<unknown>>();let store:FileSaves|undefined;
 const opening=(async()=>{const content=validateContent(JSON.parse(await readFile(join(directory,'content.json'),'utf8')));store=await FileSaves.open(ctx.profileContext.dir,content);return assets(join(directory,'web'));})();
 ctx.effect(()=>async()=>{lifetime.abort();await opening.catch(()=>{});await Promise.allSettled(pending);await store?.close();});
 const files=await opening;if(lifetime.signal.aborted)return;
 ctx.on('connection/request',async(req,res,next)=>{
  if(!(req.url??'').startsWith(prefix))return next();
  const request=new AbortController(),cancel=()=>{request.abort();if(!req.complete)req.destroy();};
  const timer=setTimeout(cancel,10000);res.once('close',cancel);lifetime.signal.addEventListener('abort',cancel,{once:true});
  const signal=AbortSignal.any([request.signal,lifetime.signal]);
  const json=(status:number,value:unknown)=>{if(!res.destroyed&&!res.writableEnded){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));}};
  const work=(async()=>{try{
   signal.throwIfAborted();if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host){json(403,{error:'FOREIGN_ORIGIN'});return;}
   const path=(req.url??'').split('?')[0]!;
   if(path===prefix+'api/saves'&&req.method==='GET'){json(200,{records:await store!.list()});return;}
   if(path===prefix+'api/saves'&&req.method==='POST'){const b=await body(req,signal);json(200,{revision:await store!.write(b.id,b.text,b.expectedRevision,signal)});return;}
   if(req.method==='GET'&&path.startsWith(prefix+'web/')){const key=decodeURIComponent(path.slice((prefix+'web/').length))||'index.html',file=files.get(key);if(file){res.writeHead(200,{'Content-Type':mime[extname(key)]??'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; worker-src 'self' blob:; frame-ancestors 'self'; object-src 'none'; base-uri 'none'"});res.end(file);return;}}
   json(404,{error:'NOT_FOUND'});
  }catch(e){const error=e instanceof SyntaxError?'BAD_JSON':e instanceof Error?e.message:'HOST_ERROR';json(error==='SAVE_CONFLICT'?409:signal.aborted?503:400,{error});}})();
  pending.add(work);try{await work;}finally{pending.delete(work);clearTimeout(timer);res.off('close',cancel);lifetime.signal.removeEventListener('abort',cancel);}
 });
}
