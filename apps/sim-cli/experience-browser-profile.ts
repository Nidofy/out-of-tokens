/** Isolated real-browser service probe; never imports or writes player saves.
 * pnpm exec tsx apps/sim-cli/experience-browser-profile.ts <integration-root> <long-input.json> <new-output-dir> <port>
 */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {cpus} from 'node:os';
import {loadFullContent} from 'oot-content';
import {replay,save,hash} from 'oot-persistence';
const [appArg,longArg,outArg,portArg]=process.argv.slice(2);
if(!appArg||!longArg||!outArg||!portArg)throw Error('EXPECTED_ROOT_LONG_OUTPUT_PORT');
const app=resolve(appArg),out=resolve(outArg),port=Number(portArg),origin=`http://127.0.0.1:${port}`;
mkdirSync(out,{recursive:true});
const c=loadFullContent(),inputs=['build-2','guide-1'].map(name=>({name,...JSON.parse(readFileSync(resolve(`apps/sim-cli/fixtures/commission-natural-${name}.json`),'utf8'))}));
inputs.push(JSON.parse(readFileSync(longArg,'utf8')));
for(const input of inputs){const s=replay(c,input.seed,input.commands);if(hash(s)!==input.stateHash)throw Error('INPUT_HASH');input.canonical=save(c,input.seed,input.commands,s);input.commandsHash=hash(input.commands);}
writeFileSync(resolve(out,'inputs.json'),JSON.stringify(inputs));
const meta={integrationSHA:execFileSync('git',['-c','safe.directory='+app.replaceAll('\\','/'),'-C',app,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),device:cpus()[0]?.model,contentHash:hash(c),warmups:5,samples:30,scope:'isolated browser services: real A SaveEncoder Worker + B coordinator + native IndexedDB; not the full Pixi UI/Host or complete H6 acceptance; Worker return-transfer not independently instrumented'};
writeFileSync(resolve(out,'metadata.json'),JSON.stringify(meta,null,2));
const url=(path:string)=>'/@fs/'+resolve(app,path).replaceAll('\\','/');
let client=readFileSync(new URL('./experience-browser-profile.client.js',import.meta.url),'utf8');
client=client.replaceAll('__PLATFORM__',url('packages/oot-platform/src/index.ts')).replaceAll('__PERSISTENCE__',url('packages/oot-persistence/src/browser.ts')).replaceAll('__ENCODER__',url('apps/web/src/save-encoder-host.ts')).replaceAll('__CONTENT__',url('apps/web/src/content.ts'));
writeFileSync(resolve(out,'profile.js'),client);
writeFileSync(resolve(out,'index.html'),'<!doctype html><html lang="en"><meta charset="utf-8"><title>Experience save service benchmark</title><h1>Isolated save service benchmark</h1><p>Disposable IndexedDB only. Three frozen inputs, 5 warmups + 30 samples per policy. Keep this tab visible.</p><button id="start">Run fixed samples</button><pre id="status">Ready</pre><script type="module" src="/profile.js"></script></html>');
const require=createRequire(import.meta.url),vite=await import(pathToFileURL(require.resolve('vite',{paths:[resolve(app,'apps/web')]})).href);
const server=await vite.createServer({configFile:false,root:out,server:{host:'127.0.0.1',port,strictPort:true,fs:{allow:[app,out]}},plugins:[{name:'local-profile-result',configureServer(s){s.middlewares.use('/results',(req,res,next)=>{
 if(req.method!=='POST')return next();if(req.headers.origin!==origin){res.statusCode=403;res.end();return;}
 let body='';req.on('data',chunk=>{body+=chunk;if(body.length>8000000)req.destroy();});req.on('end',()=>{try{const result=JSON.parse(body);writeFileSync(resolve(out,'browser-results.json'),JSON.stringify({...meta,...result},null,2),{flag:'wx'});res.end('saved');}catch(e){res.statusCode=500;res.end(String(e));}});
});}}]});
await server.listen();console.log(origin);
process.on('SIGINT',()=>{void server.close().then(()=>process.exit(0));});
