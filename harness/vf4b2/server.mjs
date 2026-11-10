import {resolve} from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const root=process.cwd(),dir=resolve('harness/vf4b2'),require=createRequire(resolve(root,'apps/web/package.json'));
const vite=await import(pathToFileURL(require.resolve('vite')).href),url=file=>'/@fs/'+resolve(dir,file).replaceAll('\\','/');
const plugins=[{name:'b2-review-only',enforce:'pre',transform(code,id){
 if(id.endsWith('/src/use-game.ts'))return `import {b2Session} from '${url('fixtures.ts')}';\n`+code.replace('labSession(content,lab)','b2Session(content,lab)');
 if(id.endsWith('/src/office-scene.ts'))return `import {installAudit} from '${url('render-audit.js')}';\n`+code.replace('app.ticker.add(t=>',`installAudit({app,host,world,labels,objects,walkers,getState:()=>({view:latest,zone,layoutFocus,layout})});\n app.ticker.add(t=>`);
 }}];
const server=await vite.createServer({root:resolve(root,'apps/web'),cacheDir:resolve(dir,'.vite-cache/interaction'),plugins,server:{host:'127.0.0.1',port:5184,strictPort:true}});
await server.listen();console.log('B2 review server 5184; diagnostics are harness-only');
