import {test,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

test.each(['http://localhost/assets/scene.js','http://localhost/deep-link'])('offline Vary: Origin cache serves %s',async url=>{
 const listeners:Record<string,(event:unknown)=>void>={};
 const scope='http://localhost/';const payload=new Response('offline-ok',{headers:{Vary:'Origin'}});
 const cache={match:async(request:string|Request,options?:CacheQueryOptions)=>{
  const target=typeof request==='string'?request:request.url;
  return options?.ignoreVary&&(target.endsWith('/scene.js')||target.endsWith('/index.html'))?payload.clone():undefined;
 }};
 runInNewContext(readFileSync(new URL('./dist/sw.js',import.meta.url),'utf8'),{URL,self:{registration:{scope},addEventListener:(name:string,fn:(event:unknown)=>void)=>listeners[name]=fn},caches:{open:async()=>cache,match:cache.match},fetch:async()=>{throw Error('SERVER_STOPPED');}});
 let response:Promise<Response>|undefined;
 listeners.fetch!({request:{url,method:'GET',mode:url.endsWith('deep-link')?'navigate':'cors'},respondWith:(r:Promise<Response>)=>response=r});
 expect(await (await response)!.text()).toBe('offline-ok');
});
