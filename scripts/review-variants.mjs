import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
// Preserve the received reviewer helper; adapt only crisis eligibility to engine 0.5.
const original=readFileSync('harness/review-integration/opus-original.mjs','utf8');
const adapted=original.replace('s.cash >= 0 || x.t.workload <= 40', "liquid() - s.loan >= 0 || x.t.workload * (x.t.phases ?? 1) <= 40");
writeFileSync('harness/review-integration/opus-v4.mjs',adapted);
const {run,content,agg}=await import('../harness/review-integration/opus-v4.mjs');
const {runBot}=await import('../apps/sim-cli/dist/policy.js');
const {hash}=await import('../packages/oot-persistence/dist/index.js');
const start=Number(process.argv[2]??1),count=Number(process.argv[3]??100),out=process.argv[4]??'harness/review-integration/variants-training.json';
for(let seed=1;seed<=10;seed++) for(const strategy of ['value','greedy','random','no-clarify','clear-only']) {
 if(hash(run(content,seed,strategy,60).state)!==hash(runBot(content,seed,strategy,60).state))throw Error(`POLICY_PARITY:${seed}:${strategy}`);
}
const configs=[['value','value',{}],['greedy','greedy',{}],['random-feasible','random',{}],['random-unconstrained','random',{filter:'none'}],['random-loan','random',{loan:true}],['overtime','value',{overtime:true}],['overtime-ahead','value',{overtime:true,buy:'ahead'}],['skilled','value',{overtime:true,buy:'ahead',local:'ds-qwen'}],['no-clarify','no-clarify',{}],['hidden-aware','no-clarify',{hiddenAware:true}]];
const results={}, templateRates={};
for(const [name,strategy,opt] of configs){
 const rows=[];
 for(let seed=start;seed<start+count;seed++)rows.push(run(content,seed,strategy,60,opt).metrics);
 results[name]=agg(rows);
 templateRates[name]={};
 for(const r of rows)for(const [id,v] of Object.entries(r.noviceByTemplate)) {const t=templateRates[name][id]??={closed:0,breached:0};t.closed+=v.closed;t.breached+=v.breached;}
 console.log(name,JSON.stringify(results[name]));
}
const base=templateRates.value,no=templateRates['no-clarify'];
const total=Object.values(base).reduce((s,t)=>s+t.closed,0);
const weighted=Object.entries(base).reduce((s,[id,t])=>s+(no[id]?.closed?no[id].breached/no[id].closed:0)*t.closed/total,0);
const result={start,count,policyParity:50,measurement:'Reviewer variants chapter cash uses end of slot56 commands; formal batch uses start of slot56. Loan solvent metric in this legacy helper excludes principal: use formal metrics for gate.',results,templateRates,weightedNoClarifyBreach:weighted,weightedRatio:weighted/results.value.noviceBreach,overtimeGain:results.overtime.chapterCash/results.value.chapterCash-1,overtimeAheadGain:results['overtime-ahead'].chapterCash/results.value.chapterCash-1};
mkdirSync(out.substring(0,out.lastIndexOf('/')),{recursive:true});writeFileSync(out,JSON.stringify(result,null,2)+'\n');
