import {createInitialState,dispatchCommand} from 'oot-core';
import type {Content,State,Version} from 'oot-core';
export const strategies=['value','greedy','random','no-clarify','clear-only'] as const;
export type Strategy=typeof strategies[number];
export function runBot(c:Content,seed:number,strategy:Strategy,days:number) {
 let s=createInitialState(c,seed);const commands:unknown[]=[];let rng=seed||1;
 const participation:Record<string,number>=Object.fromEntries(s.actors.map(a=>[a.id,0]));
 const send=(cmd:unknown)=>{const r=dispatchCommand(s,cmd,c);if(r.error)throw Error(`${strategy}:${JSON.stringify(cmd)}:${r.error}`);s=r.state;commands.push(cmd);};
 const random=()=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296;};
 while(s.absoluteSlot<days*4&&!s.bankrupt){
  if(s.pending){send({type:'choose',index:0});continue;}
  for(const j of s.jobs.filter(j=>j.status==='review'))send({type:j.quality<60&&!j.reworked&&s.absoluteSlot<=j.deadline?'rework':'deliver',job:j.id});
  if(!s.jobs.some(j=>['accepted','working','review'].includes(j.status))){
   const jobs=s.jobs.filter(j=>j.status==='posted'&&(strategy!=='clear-only'||c.commissions.find(t=>t.id===j.template)!.clarity>=80));
   const job=strategy==='random'?jobs[Math.floor(random()*jobs.length)]:jobs.sort((a,b)=>c.commissions.find(t=>t.id===a.template)!.workload-c.commissions.find(t=>t.id===b.template)!.workload)[0];
   if(job){
    if(job.hidden>0&&strategy!=='no-clarify'&&strategy!=='random'){
     const free=s.actors.filter(a=>a.busyUntil<=s.absoluteSlot&&a.energy>=15);
     for(const a of free.slice(0,job.hidden))send({type:'clarify',job:job.id,character:a.id});
     send({type:'advance'});continue;
    }
    const t=c.commissions.find(t=>t.id===job.template)!;
    const matching=(v:Version)=>Object.entries(t.weights).reduce((n,[k,w])=>n+w*v.skills[k as keyof typeof v.skills],0);
    const ranked=[...c.versions].sort((a,b)=>strategy==='greedy'?matching(b)-matching(a):matching(b)*b.speed/b.price-matching(a)*a.speed/a.price);
    if(strategy==='random')for(let i=ranked.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[ranked[i],ranked[j]]=[ranked[j]!,ranked[i]!];}
    send({type:'accept',job:job.id});
    const team=ranked.map((v,i)=>({character:v.character,role:i===3?'reviewer':'worker',mode:'cloud'}));
    send({type:'assign',job:job.id,team});for(const m of team)participation[m.character]!++;
   }
  }
  send({type:'advance'});
 }
 const accepted=s.jobs.filter(j=>j.advance>0);const delivered=accepted.filter(j=>j.status==='delivered').length;const breached=accepted.filter(j=>j.status==='breached').length;
 const income=s.ledger.filter(l=>l.reason.startsWith('advance:')||l.reason.startsWith('delivery:')).reduce((n,l)=>n+l.amount,0);
 const costs=-s.ledger.filter(l=>l.amount<0).reduce((n,l)=>n+l.amount,0)+s.electricity;
 return {state:s,commands,metrics:{seed,strategy,days,slots:s.absoluteSlot,netCash:s.cash-5000,bankrupt:s.bankrupt,accepted:accepted.length,delivered,breached,deliveryRate:accepted.length?delivered/accepted.length:0,breachRate:accepted.length?breached/accepted.length:0,tokens:s.tokensUsed,participation,operatingMargin:income?(income-costs)/income:0}};
}
export type BotState=State;
