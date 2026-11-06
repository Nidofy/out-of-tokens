import {readFileSync} from 'node:fs';
const loadContent=()=>JSON.parse(readFileSync('harness/protocol-v3-content.json','utf8'));
import {runBot} from '../apps/sim-cli/dist/policy.js';
import {writeFileSync} from 'node:fs';
const rows=[];
for(const scale of [.6,.65,.7,.75,.8,1])for(const strategy of ['value','random','no-clarify']){
 const c=loadContent();c.balance.dailyQuota=150;c.balance.upgradedQuota=300;for(const t of c.commissions)if(t.qualityLines[1]===69)t.qualityLines[1]=70;c.balance.rewardScale=scale;
 const runs=Array.from({length:100},(_,i)=>runBot(c,i+1,strategy,60).metrics);
 const sum=f=>runs.reduce((n,r)=>n+f(r),0);
 const grades={good:sum(r=>r.grades.good),great:sum(r=>r.grades.great),all:sum(r=>Object.values(r.grades).reduce((a,b)=>a+b,0))};
 const row={scale,strategy,bankruptcy:sum(r=>+r.bankrupt)/100,chapterCash:sum(r=>r.chapterCash)/100,chapterBankruptcy:sum(r=>+r.chapterBankrupt)/100,chapterSolvent:sum(r=>+r.chapterSolvent)/100,noviceRate:sum(r=>r.noviceBreached)/sum(r=>r.noviceClosed),buys:sum(r=>r.tokenPurchases),stops:sum(r=>r.outOfTokens),grades,participation:Object.fromEntries(Object.keys(runs[0].participation).map(k=>[k,sum(r=>r.participation[k])/sum(r=>Object.values(r.participation).reduce((a,b)=>a+b,0))]))};
 rows.push(row);console.log(JSON.stringify(row));
}
writeFileSync('harness/calibration-v3.json',JSON.stringify(rows,null,2)+'\n');
