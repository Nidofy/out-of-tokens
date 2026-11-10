import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const arg=name=>process.argv[process.argv.indexOf(name)+1],root=resolve(arg('--root')),cacheDir=resolve(arg('--cacheDir')),port=Number(arg('--port'));
const require=createRequire(resolve(root,'apps/web/package.json'));
const vite=await import(pathToFileURL(require.resolve('vite')).href),probe=process.argv.includes('--probe'),preview=process.argv.includes('--preview');
process.chdir(resolve(root,'apps/web'));
const plugins=probe?[{name:'vf4a2-isolated-review',enforce:'pre',
 transformIndexHtml(html){return html.replace('<head>',`<head><script>${readFileSync(new URL('./metrics-probe.js',import.meta.url),'utf8')}</script>`);},
 transform(code,id){
  if(id.endsWith('/src/main.tsx'))return code.replace('m=>m.startVisualMetrics()',"m=>{if(window.__vf4a2)window.__vf4a2.vfMetricsLoadedMs=performance.now();m.startVisualMetrics();}");
  if(id.endsWith('/src/alpha-app.tsx'))return code.replace('locked=busy||',"locked=(new URLSearchParams(location.search).has('office-lab')&&new URLSearchParams(location.search).has('vf4a2-locked'))||busy||");
 }
}]:[];
const config={root:process.cwd(),cacheDir,plugins,server:{host:'127.0.0.1',port,strictPort:true},preview:{host:'127.0.0.1',port,strictPort:true}};
console.log(JSON.stringify({root,cacheDir,port,probe,preview}));
if(process.argv.includes('--build'))await vite.build({...config,mode:'visual-review'});else if(preview)await vite.preview(config);else {const server=await vite.createServer(config);await server.listen();}
