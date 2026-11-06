import {makeDriver,finish,metrics,agg,step,cloneDriver,content} from '../harness/m07/opus-lib.mjs';
import {dispatchCommand,liquidCash} from '../packages/oot-core/dist/index.js';
import {hash} from '../packages/oot-persistence/dist/index.js';
import {writeFileSync,mkdirSync} from 'node:fs';
const start=Number(process.argv[2]??1),count=Number(process.argv[3]??100),out=process.argv[4]??'harness/m07/baseline-business.json';
const configs={value:{},energy60:{overtime:'energy60'},always:{overtime:'always'},night:{overtime:'night'},ahead:{buy:'ahead'},'energy-ahead':{buy:'ahead',overtime:'energy60'},random:{},'random-loan':{loan:'panic'},skilled:{buy:'ahead',overtime:'energy60',local:'ds-qwen'}};
const groups={},rows={};
for(const [name,opt] of Object.entries(configs)){
 rows[name]=[];
 for(let seed=start;seed<start+count;seed++)rows[name].push(metrics(finish(makeDriver(content,seed,name.startsWith('random')?'random':'value',opt),60),60));
 groups[name]=agg(rows[name]);console.log(name,JSON.stringify(groups[name]));
}
let tipN=0,decline=0,accept=0,tie=0;
for(let seed=start;seed<start+count;seed++){
 const d=makeDriver(content,seed,'value',{overtime:'always',fork:true});let guard=0;
 while(d.s.absoluteSlot<240&&!d.s.bankrupt&&guard++<5000){
  const result=step(d);if(result==='end')break;if(result!=='fork')continue;
  const job=d.s.jobs.find(j=>j.id===d.s.pending.job),mood=Math.min(...job.team.map(m=>d.s.actors.find(a=>a.id===m.character).mood));
  if(mood<50){tipN++; const branch=index=>{const b=cloneDriver(d);b.o.fork=false;const r=dispatchCommand(b.s,{type:'choose',index},content);if(r.error)throw Error(r.error);b.s=r.state;const end=b.s.absoluteSlot+28;while(b.s.absoluteSlot<end&&!b.s.bankrupt)if(step(b)==='end')break;return liquidCash(b.s)-(b.s.bankrupt?20000:0);};const delta=branch(0)-branch(1);if(delta>1)accept++;else if(delta< -1)decline++;else tie++;}
  d.s=dispatchCommand(d.s,{type:'choose',index:0},content).state;
 }
}
const solo=rows.value.reduce((sum,r)=>sum+Object.entries(r.soloJobs).filter(([k])=>/^(mistral|llama):(translation|newsletter)$/.test(k)).reduce((n,[,v])=>n+v,0),0),rescued=rows.random.filter((r,i)=>r.bankrupt&&!rows['random-loan'][i].bankrupt).length;
const gains={income:groups.energy60.income14/groups.value.income14-1,cash:groups.energy60.chapterCash/groups.value.chapterCash-1};
const checks={income:gains.income<=.10,overwork:groups.always.income14<groups.energy60.income14,night:groups.night.bankrupt60>groups.value.bankrupt60,tip:tipN>=30&&decline/tipN>=.25,loan:rescued>0&&groups['random-loan'].bankrupt60>=.3&&groups['random-loan'].bankrupt60<=.7,niche:solo>=count/10};
const result={contentHash:hash(content),start,count,groups,rows,gains,tip:{n:tipN,decline,accept,tie,rate:decline/tipN},solo,rescued,checks};
mkdirSync(out.slice(0,out.lastIndexOf('/')),{recursive:true});writeFileSync(out,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({gains,tip:result.tip,solo,rescued,checks}));
if(process.argv.includes('--enforce')&&!Object.values(checks).every(Boolean))process.exitCode=1;
