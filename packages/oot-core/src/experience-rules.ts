import type {Content,State,Member} from './model.js';
import {activeJobDuos,effectiveVersion} from './campaign.js';
import {stationEffects} from './office.js';
import {balance,round,liquidCash} from './economy.js';
import {previewPeriod} from './period-preview.js';
export function explainCapacity(s:State,c:Content,actorId:string){
 const actor=s.actors.find(a=>a.id===actorId);if(!actor)throw Error('UNKNOWN_ACTOR');
 const context=effectiveVersion(s,c,actor).context,plan=previewPeriod(s,c);
 const stations=s.jobs.flatMap(j=>{const m=j.team.find(m=>m.character===actorId);if(!m||!['accepted','working','waiting','review'].includes(j.status))return [];const effect=stationEffects(s,c,actorId,j.id,m.role);return [{jobId:j.id,stationId:effect.station===null?null:s.campaign?.office?.reservations[actorId]?.item??null,efficiency:effect.efficiency,energyCost:effect.energyCost}];});
 return {actorId,context,load:actor.load,overloaded:actor.load>context,stations,activeEfficiency:Math.max(0,...stations.filter(x=>plan.working.some(f=>f.actorId===actorId&&f.jobId===x.jobId)).map(x=>x.efficiency))};
}
export function explainDuos(s:State,c:Content,jobId:string,team:Member[]){
 const job=s.jobs.find(j=>j.id===jobId);if(!job)throw Error('UNKNOWN_JOB');
 const active=new Set(activeJobDuos(s,c,{...job,team}).map(d=>d.id));
 return (c.campaign?.living?.duos??[]).map(d=>{
  const unlocked=s.campaign?.duos?.includes(d.id)??false;
  const state:'locked'|'inactive'|'active'=!unlocked?'locked':active.has(d.id)&&d.bonus.kind!=='clarify'?'active':'inactive';
  const reason=!unlocked?'duo-locked':active.has(d.id)?(d.bonus.kind==='clarify'?'duo-clarification-only':'duo-active'):!d.actors.every(id=>team.some(m=>m.character===id))?'duo-team-missing':d.bonus.mode&&!d.actors.every(id=>team.some(m=>m.character===id&&m.mode===d.bonus.mode))?'duo-mode-mismatch':'duo-conditions-unmet';
  return {duoId:d.id,state,reason};
 });
}
export function explainMoney(s:State,c:Content){
 const unfinishedAdvances=round(s.jobs.filter(j=>['accepted','working','review','waiting'].includes(j.status)).reduce((n,j)=>n+j.advance,0));
 const ledger=s.ledger.slice(-10),inflow=round(ledger.filter(l=>l.amount>=0).reduce((n,l)=>n+l.amount,0)),outflow=round(-ledger.filter(l=>l.amount<0).reduce((n,l)=>n+l.amount,0));
 return {cash:s.cash,loan:s.loan,unfinishedAdvances,netSolvency:liquidCash(s),recentLedgerSummary:{count:ledger.length,inflow,outflow,net:round(inflow-outflow)},
  bills:[{certainty:'certain' as const,reason:'next-weekly-base',amount:balance(c).weekly+[0,120,420][s.campaign?.subscription??0]!+round(s.loan*balance(c).interest),unit:'cash' as const},
   {certainty:'certain' as const,reason:'accrued-electricity',amount:s.electricity,unit:'cash' as const},
   ...(!s.debtPaid?[{certainty:'certain' as const,reason:'unpaid-inherited-debt',amount:balance(c).debt,unit:'cash' as const}]:[])]};
}
