import {readFileSync} from 'node:fs';
const loadContent=()=>JSON.parse(readFileSync('harness/protocol-v3-content.json','utf8'));
import {runBot} from '../apps/sim-cli/dist/policy.js';
import {writeFileSync} from 'node:fs';
const rows=[];
for(const quota of [120,150,180,200])for(const strategy of ['value','random','no-clarify']){
 const c=loadContent();c.balance.dailyQuota=Math.round(quota/2);c.balance.upgradedQuota=quota;c.balance.rewardScale=.8;
 for(const t of c.commissions)if(t.qualityLines[1]===70)t.qualityLines[1]=69;
 const runs=Array.from({length:100},(_,i)=>runBot(c,i+1,strategy,60).metrics);
 const sum=f=>runs.reduce((n,r)=>n+f(r),0);
 const row={quota,strategy,bankruptcy:sum(r=>+r.bankrupt)/100,chapterCash:sum(r=>r.chapterCash)/100,chapterSolvent:sum(r=>+r.chapterSolvent)/100,noviceRate:sum(r=>r.noviceBreached)/sum(r=>r.noviceClosed),buysPerWeek:sum(r=>r.tokenPurchases)/sum(r=>r.slots/28),stopsPerWeek:sum(r=>r.outOfTokens)/sum(r=>r.slots/28),goodRate:sum(r=>r.grades.good)/sum(r=>Object.values(r.grades).reduce((a,b)=>a+b,0)),greatRate:sum(r=>r.grades.great)/sum(r=>Object.values(r.grades).reduce((a,b)=>a+b,0))};rows.push(row);console.log(JSON.stringify(row));
}
writeFileSync('harness/quota-scan-v3.json',JSON.stringify(rows,null,2)+'\n');
