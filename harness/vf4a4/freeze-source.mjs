import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const dir='harness/vf4a4/';
const sha=data=>createHash('sha256').update(data).digest('hex');
const paths=execFileSync('git',['ls-files','apps','packages','pnpm-lock.yaml'],{encoding:'utf8'}).trim().split('\n').filter(p=>!p.includes('/public/'));
const files=paths.map(path=>{const data=readFileSync(path);return {path,sha256:sha(data),lfSha256:sha(data.toString('utf8').replaceAll('\r\n','\n'))};});
if(process.argv.includes('--verify')){
 const previous=JSON.parse(readFileSync(dir+'source-freeze.json','utf8'));
 const changed=files.filter(f=>{const p=previous.files.find(p=>p.path===f.path);return !p||p.sha256!==f.sha256||p.lfSha256!==f.lfSha256;}).map(f=>f.path);
 const missing=previous.files.filter(p=>!files.some(f=>f.path===p.path)).map(p=>p.path);
 const result={verifiedAt:new Date().toISOString(),fileCount:files.length,changed,missing};
 writeFileSync(dir+'source-freeze-verified.json',JSON.stringify(result,null,2)+'\n');console.log(result);
 if(changed.length||missing.length)process.exitCode=1;
}else{
 writeFileSync(dir+'source-freeze.json',JSON.stringify({frozenAt:new Date().toISOString(),checkpoint:'VF4-A4',parent:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),previousImplementation:'d1072f6b2d0f7bd42b3a1078164753b0acc6fec8',performanceEvidence:'A4: 3 versions x 4 cells x 6 rounds, 72 formal; 12 warmups.',files},null,2)+'\n');console.log({frozen:files.length});
}
