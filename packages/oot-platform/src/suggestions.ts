import {dispatchCommand,forecastAssignment} from 'oot-core';
import type {Content,Member,State} from 'oot-core';
import type {WorkerSnapshot} from './checkpoint-contract.js';
import {EXPERIENCE_CONTRACT} from './checkpoint-contract.js';
import type {Draft,SuggestResult,AssignmentSuggestion,Fact} from './experience-contract.js';
const key=(team:Member[])=>[...team].sort((a,b)=>a.character<b.character?-1:a.character>b.character?1:0).map(m=>`${m.character}:${m.role}:${m.mode}`).join('|');
/** Bounded deterministic search. Only accept/assign hypothetical results are evaluated; no purchasing or overtime. */
export function suggestAssignmentsFromSnapshot(c:Content,snapshot:WorkerSnapshot,jobId:string,draft:Draft):SuggestResult {
 if(snapshot.contract!==EXPERIENCE_CONTRACT||snapshot.contentVersion!==c.version||snapshot.state.contentVersion!==c.version)throw Error('STALE_WORKER_CONTENT');
 const identity={contract:snapshot.contract,contentVersion:snapshot.contentVersion,revision:snapshot.revision,lineageId:snapshot.lineageId,draftKey:draft.draftKey};
 const empty=(reason:string):SuggestResult=>({...identity,suggestions:[],evaluated:0,truncated:false,none:{certainty:'certain',reason,jobId}});
 const source=snapshot.state,job=source.jobs.find(j=>j.id===jobId);if(!job)return empty('UNKNOWN_JOB');
 const acceptance=job.status==='posted'?dispatchCommand(source,{type:'accept',job:jobId},c):null;
 if(acceptance?.error)return empty(acceptance.error);
 const state:State=acceptance?.state??source;
 const members:Member[]=state.actors.filter(a=>a.busyUntil<=state.absoluteSlot&&!state.jobs.some(j=>j.id!==jobId&&['accepted','working','review','waiting'].includes(j.status)&&j.team.some(m=>m.character===a.id)))
  .sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0).flatMap(a=>c.versions.find(v=>v.id===a.version)!.modes.slice().sort().map(mode=>({character:a.id,role:'worker' as const,mode})));
 const seen=new Set<string>(),valid:{id:string;team:Member[];forecast:ReturnType<typeof forecastAssignment>;cash:number}[]=[];
 let evaluated=0,truncated=false;
 function evaluate(team:Member[]){
  const id=key(team);if(seen.has(id))return true;seen.add(id);
  if(evaluated===256){truncated=true;return false;}evaluated++;
  const r=dispatchCommand(state,{type:'assign',job:jobId,team},c);if(r.error)return true;
  const assigned=r.state.jobs.find(j=>j.id===jobId)!;const forecast=forecastAssignment(r.state,c,assigned);
  // Token purchases are half a cash unit each, and only current-slot shortfall is immediate cash demand.
  const cash=Math.ceil(Math.max(0,forecast.firstSlot.cloud-state.quota-state.purchased))*.5;
  valid.push({id,team:team.map(m=>({...m})),forecast,cash});return true;
 }
 if(draft.team.length)evaluate(draft.team);
 for(const m of members)if(!evaluate([m]))break;
 outer:for(const worker of members)for(const partner of members){if(worker.character===partner.character)continue;for(const role of ['worker','planner','reviewer','tool'] as const)if(!evaluate([worker,{...partner,role}]))break outer;}
 // Extend real current drafts where capacity allows; search is intentionally bounded, not globally optimal.
 if(!truncated&&draft.team.length>=2)for(const m of members)if(!draft.team.some(a=>a.character===m.character)&&!evaluate([...draft.team,m]))break;
 const stable=(a:typeof valid[number],b:typeof valid[number])=>a.id<b.id?-1:a.id>b.id?1:0;
 const rankings=[
  {kind:'save-resources' as const,rank:(a:typeof valid[number],b:typeof valid[number])=>a.cash-b.cash||a.forecast.cloud-b.forecast.cloud||a.forecast.local-b.forecast.local||stable(a,b)},
  {kind:'stable-quality' as const,rank:(a:typeof valid[number],b:typeof valid[number])=>(b.forecast.quality?.[0]??-1)-(a.forecast.quality?.[0]??-1)||a.cash-b.cash||stable(a,b)},
  {kind:'fast-delivery' as const,rank:(a:typeof valid[number],b:typeof valid[number])=>(a.forecast.completion??Infinity)-(b.forecast.completion??Infinity)||a.cash-b.cash||stable(a,b)},
 ];
 const suggestions:AssignmentSuggestion[]=[],selected=new Set<string>();
 for(const {kind,rank} of rankings){const winner=[...valid].sort(rank)[0];if(!winner||selected.has(winner.id))continue;selected.add(winner.id);
  const conditions=['no-event-interference','resources-available','no-new-defects','personal-condition-unchanged'] as const;
  const advantages:Fact[]=[{certainty:'conditional',conditions,reason:kind,jobId}];
  const costs:Fact[]=[{certainty:'conditional',conditions,reason:'projected-cloud',amount:winner.forecast.cloud,unit:'quota',jobId},{certainty:'conditional',conditions,reason:'projected-local',amount:winner.forecast.local,unit:'capacity',jobId},{certainty:'conditional',conditions,reason:'immediate-quota-cash',amount:winner.cash,unit:'cash',jobId}];
  if((winner.forecast.quality?.[0]??0)<(c.commissions.find(t=>t.id===job.template)!.qualityLines?.[0]??60))costs.push({certainty:'conditional',conditions,reason:'below-quality-line',jobId});
  suggestions.push({id:winner.id,kind,team:winner.team,forecast:winner.forecast,advantages,costs});
 }
 return {...identity,suggestions,evaluated,truncated,...(!suggestions.length?{none:{certainty:'certain' as const,reason:'no-legal-team',jobId}}:{})};
}
