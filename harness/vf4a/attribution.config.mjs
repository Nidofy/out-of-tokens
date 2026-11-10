import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const probePath=fileURLToPath(new URL('./attribution-probe.js',import.meta.url));
const mark=name=>`window.__vfAttribution?.mark('${name}');`;
export default ({mode})=>({
 base:'./',esbuild:{jsx:'automatic',jsxImportSource:'preact'},build:{target:'es2022',chunkSizeWarningLimit:800},
 plugins:[{name:'vf4a-attribution',enforce:'pre',
  transformIndexHtml(html){return mode==='production'?html:html.replace('<head>',`<head><script>${readFileSync(probePath,'utf8')}</script>`);},
  transform(code,id){
   if(mode==='production')return null;
   if(id.endsWith('/src/main.tsx'))return {code:mark('moduleEntryMs')+code,map:null};
   if(id.endsWith('/src/alpha-app.tsx')){
    code="import {useLayoutEffect as attributionCommit} from 'preact/hooks';\n"+code;
    code=code.replace('export function AlphaApp(){',`export function AlphaApp(){ attributionCommit(()=>{if(document.querySelector('.studio-hud')){${mark('firstHudCommitMs')}}},[]);`);
    code=code.replace("import('./scene.js');",`import('./scene.js').then(m=>{${mark('sceneModuleLoadedMs')}return m;});`);
    code=code.replace("void import('./scene.js').then",`void (window.__vfAttribution?.mark('sceneImportStartMs'),import('./scene.js')).then(m=>{${mark('sceneModuleLoadedMs')}return m;}).then`);
    code=code.replace("const loadScene=()=>sceneModule??=",`const loadScene=()=>sceneModule??=(window.__vfAttribution?.mark('sceneImportStartMs'),`);
    if(code.includes('const loadScene='))code=code.replace("return m;});",'return m;}));');
    code=code.replace('useEffect(()=>{let dead=false;',`(new URLSearchParams(location.search).get('attr-layout')==='1'?attributionCommit:useEffect)(()=>{${mark('sceneEffectStartMs')}let dead=false;`);
    return {code,map:null};
   }
   if(id.endsWith('/src/office-scene.ts')){
    code=code.replace('const app=new Application();',`${mark('pixiInitStartMs')}const app=new Application();`);
    code=code.replace('host.appendChild(app.canvas);',`${mark('pixiInitEndMs')}host.appendChild(app.canvas);`);
    code=code.replace("latest=view;english=locale==='en';sync();",`latest=view;english=locale==='en';${mark('firstSyncStartMs')}sync();${mark('firstSyncEndMs')}`);
    return {code,map:null};
   }
  }
 }],server:{host:'127.0.0.1',strictPort:true},preview:{host:'127.0.0.1',strictPort:true}
});
