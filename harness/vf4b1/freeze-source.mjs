import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const dir='harness/vf4b1/',sha=b=>createHash('sha256').update(b).digest('hex');
const paths=execFileSync('git',['ls-files','apps','packages','pnpm-lock.yaml'],{encoding:'utf8'}).trim().split('\n').filter(p=>!p.includes('/public/')||/^apps\/web\/public\/art\/office\/(basic|standard)-(back|front)\.svg$/.test(p));
const files=paths.map(path=>{const b=readFileSync(path);return{path,sha256:sha(b),lfSha256:sha(b.toString().replaceAll('\r\n','\n'))};});
if(process.argv.includes('--verify')){
 const old=JSON.parse(readFileSync(dir+'source-freeze.json','utf8')),changed=files.filter(f=>{const p=old.files.find(p=>p.path===f.path);return !p||p.sha256!==f.sha256||p.lfSha256!==f.lfSha256;}).map(f=>f.path),missing=old.files.filter(p=>!files.some(f=>f.path===p.path)).map(p=>p.path),result={verifiedAt:new Date().toISOString(),fileCount:files.length,changed,missing};
 if(!process.argv.includes('--read-only'))writeFileSync(dir+'source-freeze-verified.json',JSON.stringify(result,null,2)+'\n');console.log(result);if(changed.length||missing.length)process.exitCode=1;
}else{writeFileSync(dir+'source-freeze.json',JSON.stringify({checkpoint:'VF4-B1',frozenAt:new Date().toISOString(),parent:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),performanceEvidence:'New final frozen batch: 3 versions x 2 modes x 2 populations x n6, 72 formal + 12 warmups. A4 not reused.',files},null,2)+'\n');console.log({frozen:files.length});}
