import {readFileSync} from 'node:fs';
import {loadFullContent} from '../packages/oot-content/dist/index.js';
import {restore,hash} from '../packages/oot-persistence/dist/index.js';
const current=loadFullContent(),prototype=JSON.parse(readFileSync('harness/product-b-content-b1-1.json','utf8'));
for(const tag of ['v1','v2','v3']){
 const report=JSON.parse(readFileSync(`harness/product-b-${tag}-results.json`,'utf8')),content=tag==='v3'?current:prototype;
 if(report.contentHash!==hash(content))throw Error('Content hash mismatch: '+tag);
 for(const row of report.results){const {state}=restore(content,readFileSync(`harness/product-b-${tag}-${row.route}-${row.seed}-replay.json`,'utf8'));if(hash(state)!==row.stateHash)throw Error('Replay mismatch: '+tag+'/'+row.seed);}
 console.log(`${tag}: ${report.results.length} complete traces restored; ${report.results.filter(r=>r.chapterTwo!==null).length} reached chapter 2; ${report.results.filter(r=>r.bankrupt).length} bankrupt`);
}
