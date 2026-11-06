import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {loadContent} from '../packages/oot-content/dist/index.js';
import {hash,restore} from '../packages/oot-persistence/dist/index.js';
import {summarize,gates} from '../apps/sim-cli/dist/report.js';
const dir='harness/validation-v4', read=p=>JSON.parse(readFileSync(p,'utf8'));
const summary=read(`${dir}/summary.json`),rows=read(`${dir}/batch.json`),content=loadContent();
assert.equal(summary.contentHash,hash(content));assert.equal(summary.engineVersion,'0.5.0');assert.equal(summary.policyVersion,4);
assert.equal(rows.length,5000);assert.equal(new Set(rows.map(r=>`${r.strategy}:${r.seed}`)).size,5000);
assert.equal(summary.seedStart,3001);assert.equal(summary.seedEnd,4000);
assert.deepEqual(summarize(rows),summary.summary);assert.deepEqual(gates(summary.summary),summary.gates);assert.ok(Object.values(summary.gates).every(Boolean));
assert.equal(readFileSync(`${dir}/batch.csv`,'utf8').trim().split('\n').length,5001);
for(const group of summary.summary){
 const runs=rows.filter(r=>r.strategy===group.strategy);assert.equal(runs.length,1000);
 assert.ok(runs.every(r=>r.seed>=3001&&r.seed<=4000&&r.days===60&&(r.bankrupt||r.slots===240)));
 const diagnostics=summary.diagnostics.filter(d=>d.strategy===group.strategy);
 assert.ok(diagnostics.some(d=>d.seed===3001));
 assert.ok(diagnostics.some(d=>d.seed===runs.reduce((a,b)=>a.netCash<b.netCash?a:b).seed));
 const failed=runs.find(r=>r.bankrupt);if(failed)assert.ok(diagnostics.some(d=>d.seed===failed.seed));
}
for(const d of summary.diagnostics){
 assert.match(d.replay,/^(value|greedy|random|no-clarify|clear-only)(-\d+)?-replay\.json$/);
 const state=restore(content,readFileSync(`${dir}/${d.replay}`,'utf8')).state;
 assert.equal(hash(state),d.stateHash);assert.ok(state.quota>=0&&state.purchased>=0);
}
const controlled=read('harness/review-integration/controlled-final.json');assert.equal(controlled.contentHash,hash(content));
const niches=controlled.templates.filter(t=>!t.best.team.some(m=>m.character==='qwen')&&t.best.team.some(m=>m.role==='worker'&&['llama','mistral'].includes(m.character)));
assert.ok(niches.length>=2,'LOW_COST_NICHE_REGRESSION');
const variants=read('harness/review-integration/variants-validation.json');assert.equal(variants.start,3001);assert.equal(variants.count,200);assert.equal(variants.policyParity,50);
assert.ok(variants.results['random-loan'].bankrupt>=.30&&variants.results['random-loan'].bankrupt<=.70);
// This is a known failed gate, not a passing engineering assertion.
const overtimePassed=variants.overtimeGain<=.25&&variants.overtimeAheadGain<=.25;
const log=readFileSync('harness/review-integration/check-final.log','utf8');assert.match(log,/74 passed \(74\)/);
const files=['pnpm-lock.yaml','harness/review-integration/check-final.log','harness/review-integration/red.log','harness/review-integration/controlled-final.json','harness/review-integration/variants-validation.json',...readdirSync(dir).map(f=>`${dir}/${f}`),...['gemini','opus','sonnet'].map(n=>`harness/reviews/m0.5-a8fb63c-${n}-report.md`)];
const manifest={baseline:'a8fb63cdad76352e9cb5f59739735fcb4c98ce18',contentHash:summary.contentHash,engineVersion:summary.engineVersion,policyVersion:4,seeds:[3001,4000],games:5000,tests:74,replays:summary.diagnostics.length,gates:summary.gates,overtimePassed,openP1:overtimePassed?[]:['M05-03'],nicheTemplates:niches.map(t=>t.template),fileHashEncoding:'SHA256 UTF8 LF',files:Object.fromEntries(files.map(f=>[f,createHash('sha256').update(readFileSync(f,'utf8').replace(/\r\n/g,'\n')).digest('hex')]))};
if(process.argv.includes('--record'))writeFileSync('harness/m0.6-manifest.json',JSON.stringify(manifest,null,2)+'\n');
else assert.deepEqual(manifest,read('harness/m0.6-manifest.json'));
console.log(`ARTIFACTS_OK games=5000 tests=74 replays=${summary.diagnostics.length}; OPEN_P1=${manifest.openP1.join(',')}; businessApproval=false`);
if(process.argv.includes('--require-business')&&manifest.openP1.length)process.exitCode=1;
