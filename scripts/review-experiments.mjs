import {loadContent} from '../packages/oot-content/dist/index.js';
import {createInitialState,dispatchCommand} from '../packages/oot-core/dist/index.js';
import {runBot} from '../apps/sim-cli/dist/policy.js';
import {writeFileSync} from 'node:fs';
const content=loadContent(),rows=[];
// Controlled first-milestone comparisons: no events, fully clarified, abundant cloud quota.
const roles=['none','worker','planner','reviewer'],teams=[];
for(let code=1;code<256;code++){
 let n=code;const team=[];
 for(const v of content.versions){const role=roles[n%4];n=Math.floor(n/4);if(role!=='none')team.push({character:v.character,role,mode:'cloud'});}
 if(team.some(m=>m.role==='worker')&&team.filter(m=>m.role==='planner').length<=1&&team.filter(m=>m.role==='reviewer').length<=1)teams.push(team);
}
for(const template of content.commissions){
 const c=structuredClone(content);c.events=[];c.balance.dailyQuota=10000;c.balance.upgradedQuota=10000;c.commissions=[{...template,clarity:100,delivery:'oneshot',phases:1}];
 const outcomes=[];
 for(const team of teams){
  let cash=0,spent=0,people=0,quality=0,delivered=0,working=0;
  for(let seed=1;seed<=20;seed++){
   let s=createInitialState(c,seed);
   const send=cmd=>{const r=dispatchCommand(s,cmd,c);if(r.error)throw Error(r.error);s=r.state;};
   send({type:'accept',job:'0-0'});send({type:'assign',job:'0-0',team});
   while(!['delivered','breached'].includes(s.jobs[0].status)){
    const j=s.jobs[0];
    if(j.status==='review')send({type:j.quality<template.qualityLines[0]&&!j.reworked&&s.absoluteSlot<=j.deadline?'rework':'deliver',job:j.id});
    else {if(s.absoluteSlot%4<2)working++;send({type:'advance'});}
   }
   const j=s.jobs[0];delivered+=+(j.status==='delivered');quality+=j.quality;
   cash+=s.ledger.filter(l=>l.reason.endsWith(':0-0')).reduce((n,l)=>n+l.amount,0);
   spent+=s.resources.reduce((n,r)=>n+r.units,0);people+=s.resources.length;
  }
  outcomes.push({team,deliveryRate:delivered/20,quality:quality/20,netRevenuePerPersonSlot:people?(cash-spent*.5)/people:0,cash:cash/20,tokens:spent/20,workSlots:working/20});
 }
 outcomes.sort((a,b)=>b.netRevenuePerPersonSlot-a.netRevenuePerPersonSlot);
 const plannerAdvantage=outcomes.filter(o=>o.team.length===3&&o.team.some(m=>m.role==='planner')&&o.team.every(m=>m.role!=='reviewer')).map(p=>{
  const same=outcomes.find(o=>o.team.length===3&&o.team.every(m=>m.role==='worker')&&o.team.every(m=>p.team.some(q=>q.character===m.character)));
  return same?{planner:p,workers:same,gain:p.netRevenuePerPersonSlot-same.netRevenuePerPersonSlot}:null;
 }).filter(Boolean).sort((a,b)=>b.gain-a.gain)[0];
 rows.push({template:template.id,best:outcomes[0],bestSingle:outcomes.filter(o=>o.team.length===1),plannerAdvantage});
}
const ablation=[];
for(const excluded of [null,...content.versions.map(v=>v.character)]){
 const c=structuredClone(content);if(excluded)c.versions=c.versions.filter(v=>v.character!==excluded);
 let cash=0,income=0,deliveries=0,parallel=0,slots=0;
 for(let seed=1;seed<=100;seed++){
  const r=runBot(c,seed,'value',14);cash+=r.state.cash;deliveries+=r.metrics.delivered;
  income+=r.state.ledger.filter(l=>l.reason.startsWith('delivery:')||l.reason.startsWith('advance:')||l.reason.startsWith('breach:')).reduce((n,l)=>n+l.amount,0);
  // Daily snapshots are diagnostic only, not an estimate of all working slots.
  parallel+=r.daily.filter(d=>d.active>=2).length;slots+=r.daily.length;
 }
 ablation.push({excluded,runs:100,chapterCash:cash/100,netProjectReceipts:income/100,deliveries:deliveries/100,parallelDailySnapshotRate:parallel/slots});
}
writeFileSync('harness/review-experiments.json',JSON.stringify({protocol:'20 seeds per composition; controlled clarified first milestone; net receipts minus Token valued at 0.5/T per paid service slot; ablations 100 seeds x14 days using full engine',templates:rows,ablation},null,2)+'\n');
console.log(JSON.stringify({bestCharacters:[...new Set(rows.flatMap(r=>r.best.team.map(m=>m.character)))],plannerWins:rows.filter(r=>r.plannerAdvantage?.gain>0).map(r=>({template:r.template,gain:r.plannerAdvantage.gain})),ablation},null,2));
