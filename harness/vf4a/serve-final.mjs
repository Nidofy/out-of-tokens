import {readFileSync,writeFileSync,openSync,closeSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawn} from 'node:child_process';
const root=process.cwd(),dir=resolve('harness/vf4a');
const versions=[{label:'040031e',root:resolve('../vf11-perf-baseline'),dev:5182,preview:5184},{label:'c68541d',root:resolve('../vf4a-vf31-baseline'),dev:5185,preview:5186},{label:'vf4a',root,dev:5181,preview:5183}];
if(process.argv.includes('--stop')){
 for(const p of JSON.parse(readFileSync(resolve(dir,'active-processes.json'),'utf8'))){try{process.kill(p.pid);}catch(e){if(e.code!=='ESRCH')throw e;}}
}else{
 const rows=[];
 for(const v of versions)for(const mode of ['dev','preview']){
  const label=v.label+'-'+mode,out=openSync(resolve(dir,label+'.out.log'),'w'),err=openSync(resolve(dir,label+'.err.log'),'w');
  const child=spawn(process.execPath,[resolve(v.root,'apps/web/node_modules/vite/bin/vite.js'),...(mode==='preview'?['preview']:[]),'--host','127.0.0.1','--port',String(v[mode]),'--strictPort'],{cwd:resolve(v.root,'apps/web'),detached:true,windowsHide:true,stdio:['ignore',out,err]});
  child.unref();closeSync(out);closeSync(err);rows.push({label,port:v[mode],pid:child.pid,root:v.root});
 }
 writeFileSync(resolve(dir,'active-processes.json'),JSON.stringify(rows,null,2)+'\n');console.log(rows);
}
