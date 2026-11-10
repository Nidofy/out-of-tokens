import {readFileSync,writeFileSync,openSync,closeSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawn,spawnSync,execFileSync} from 'node:child_process';
const dir=resolve('harness/vf4a2'),root=process.cwd(),mode=process.argv[2];
const versions=[{label:'040031e',root:resolve('../vf11-perf-baseline'),port:5182},{label:'6f3a191',root:resolve('../vf31-vf3-baseline'),port:5185},{label:'c68541d',root:resolve('../vf4a-vf31-baseline'),port:5186},{label:'current',root,port:5181}];
const args=v=>[resolve(dir,'server.mjs'),'--root',v.root,'--cacheDir',resolve(dir,'.vite-cache',v.label),'--port',String(v.port)];
if(mode==='build'){
 for(const v of versions){const result=spawnSync(process.execPath,[...args(v),'--build'],{encoding:'utf8',windowsHide:true});writeFileSync(resolve(dir,v.label+'-review-build.log'),result.stdout+result.stderr);if(result.status)throw Error(v.label+' build failed');console.log(v.label+' build OK');}
}else if(mode==='stop'){
 for(const file of ['processes.json','active-processes.json'])if(existsSync(resolve(dir,file)))for(const p of JSON.parse(readFileSync(resolve(dir,file),'utf8'))){try{const line=execFileSync('powershell',['-NoProfile','-Command',`(Get-CimInstance Win32_Process -Filter "ProcessId = ${p.pid}").CommandLine`],{encoding:'utf8'});if(line.includes('vf4a2')&&line.includes('server.mjs'))process.kill(p.pid);}catch(e){if(e.code!=='ESRCH')throw e;}}
}else if(['dev','preview'].includes(mode)){
 const records=[];for(const v of versions){const stamp=new Date().toISOString().replace(/[:.]/g,'-'),out=openSync(resolve(dir,`${v.label}-${mode}-${stamp}.log`),'w'),err=openSync(resolve(dir,`${v.label}-${mode}-${stamp}.err.log`),'w');const child=spawn(process.execPath,[...args(v),...(mode==='preview'?['--preview']:[])],{cwd:root,detached:true,windowsHide:true,stdio:['ignore',out,err]});child.unref();closeSync(out);closeSync(err);records.push({...v,mode,pid:child.pid,cacheDir:resolve(dir,'.vite-cache',v.label)});}
 writeFileSync(resolve(dir,'active-processes.json'),JSON.stringify(records,null,2)+'\n');console.log(records);
}else throw Error('Expected build/dev/preview/stop');
