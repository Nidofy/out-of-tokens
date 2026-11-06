import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {loadContent} from '../packages/oot-content/dist/index.js';
import {hash,restore} from '../packages/oot-persistence/dist/index.js';
import {summarize,gates} from '../apps/sim-cli/dist/report.js';
const dir='harness/validation-v3';
const read=name=>JSON.parse(readFileSync(`${dir}/${name}`,'utf8'));
const summary=read('summary.json'),rows=read('batch.json'),content=loadContent();
assert.equal(summary.contentHash,hash(content));assert.equal(summary.seedStart,1001);assert.equal(summary.seedEnd,2000);
assert.equal(rows.length,5000);assert.equal(new Set(rows.map(r=>`${r.strategy}:${r.seed}`)).size,5000);
assert.deepEqual(summarize(rows),summary.summary);assert.deepEqual(gates(summary.summary),summary.gates);assert.ok(Object.values(summary.gates).every(Boolean));
assert.equal(readFileSync(`${dir}/batch.csv`,'utf8').trim().split('\n').length,5001);
for(const group of summary.summary){
 const runs=rows.filter(r=>r.strategy===group.strategy);
 assert.equal(runs.length,1000);assert.ok(runs.every(r=>r.seed>=1001&&r.seed<=2000&&r.days===60&&(r.bankrupt||r.slots===240)));
 const diagnostics=summary.diagnostics.filter(d=>d.strategy===group.strategy);
 assert.ok(diagnostics.some(d=>d.seed===1001));
 const worst=runs.reduce((a,b)=>a.netCash<b.netCash?a:b);assert.ok(diagnostics.some(d=>d.seed===worst.seed));
 const bankrupt=runs.find(r=>r.bankrupt);if(bankrupt)assert.ok(diagnostics.some(d=>d.seed===bankrupt.seed));
}
for(const diagnostic of summary.diagnostics){
 assert.match(diagnostic.replay,/^(value|greedy|random|no-clarify|clear-only)(-\d+)?-replay\.json$/);
 const state=restore(content,readFileSync(`${dir}/${diagnostic.replay}`,'utf8')).state;
 assert.equal(hash(state),diagnostic.stateHash);assert.ok(state.quota>=0&&state.purchased>=0);
}
const logs=['m0.5-install.log','m0.5-check.log','m0.5-validation.log','m0.5-smoke.log','m0.5-replay-command.log','m0.5-replays.log'];
assert.match(readFileSync('harness/m0.5-check.log','utf8'),/56 passed \(56\)/);
assert.equal((readFileSync('harness/m0.5-replays.log','utf8').match(/REPLAY_OK/g)||[]).length,summary.diagnostics.length);
const files=['pnpm-lock.yaml',...logs.map(f=>'harness/'+f),...['summary.json','batch.csv','batch.json'].map(f=>dir+'/'+f),...summary.diagnostics.map(d=>dir+'/'+d.replay)];
const manifest={fileHashEncoding:'SHA-256 of UTF-8 text with LF line endings',implementationCommit:'a91a52f0a4ea2c08ab6542c993ee91a6aa5c60b0',engineVersion:summary.engineVersion,contentVersion:summary.contentVersion,contentHash:summary.contentHash,policyVersion:summary.policyVersion,seeds:[1001,2000],games:rows.length,tests:56,replays:summary.diagnostics.length,gates:summary.gates,files:Object.fromEntries(files.map(f=>[f,createHash('sha256').update(readFileSync(f,'utf8').replace(/\r\n/g,'\n')).digest('hex')]))};
if(process.argv.includes('--record'))writeFileSync('harness/m0.5-manifest.json',JSON.stringify(manifest,null,2)+'\n');
else assert.deepEqual(manifest,JSON.parse(readFileSync('harness/m0.5-manifest.json','utf8')));
console.log(`ARTIFACTS_OK games=${rows.length} tests=56 replays=${summary.diagnostics.length} content=${summary.contentHash}`);
