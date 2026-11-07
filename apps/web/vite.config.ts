import {readdirSync,writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import { defineConfig } from 'vite';
export default defineConfig({
    base: './',
    plugins: [{name:'offline-build',closeBundle(){
 const art=readdirSync('dist/art',{recursive:true,withFileTypes:true}).filter(e=>e.isFile()).map(e=>(e.parentPath+'/'+e.name).replaceAll('\\','/').replace(/^dist\//,''));
 const assets=[...art,'index.html','icon.svg','manifest.webmanifest','PAPER-DOLL-LICENSE.txt',...readdirSync('dist/assets').map(f=>'assets/'+f)];
 const key='oot-alpha-'+createHash('sha256').update(assets.map(f=>f+createHash('sha256').update(readFileSync('dist/'+f)).digest('hex')).join('|')).digest('hex').slice(0,12);
 const script=`const CACHE=${JSON.stringify(key)},FILES=${JSON.stringify(assets)};
 self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES.map(f=>new URL(f,self.registration.scope).href)))));
 self.addEventListener('message',e=>{if(e.data?.type==='ACTIVATE')self.skipWaiting();});
 self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
 self.addEventListener('fetch',e=>{const u=new URL(e.request.url),base=new URL(self.registration.scope);if(e.request.method!=='GET'||u.origin!==base.origin||!u.pathname.startsWith(base.pathname)||u.pathname.includes('/api/'))return;e.respondWith(caches.open(CACHE).then(async c=>{const hit=await c.match(e.request,{ignoreVary:true});if(hit)return hit;const legacy=await caches.match(e.request,{ignoreVary:true});if(legacy)return legacy;try{return await fetch(e.request);}catch(error){if(e.request.mode==='navigate')return (await c.match(new URL('index.html',self.registration.scope).href,{ignoreVary:true}));throw error;}}));});`;
 writeFileSync('dist/sw.js',script);writeFileSync('dist/offline-assets.json',JSON.stringify({key,assets},null,2));
 }},{ name: 'browser-only-boundary', enforce: 'pre', resolveId(id) {
                if (id.startsWith('node:'))
                    throw Error('NODE_IMPORT_IN_BROWSER:' + id);
                return null;
            } }],
    esbuild: { jsx: 'automatic', jsxImportSource: 'preact' },
    build: { target: 'es2022', chunkSizeWarningLimit: 800 },
    server: { port: 5173, strictPort: true }, preview: { port: 4173, strictPort: true }
});
