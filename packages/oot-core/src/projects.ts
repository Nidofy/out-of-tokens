import type {Content,State,Command,ProjectDefinition,ProjectState} from './model.js';
import {postedJob} from './jobs.js';
import {round} from './economy.js';
const check=(ok:unknown,error:string)=>{if(!ok)throw Error(error);};
function progress(s:State,d:ProjectDefinition,p:ProjectState){
 const route=d.routes.find(r=>r.id===p.route)!,step=route.steps[p.step]!,job=s.jobs.find(j=>j.id===p.job)!;
 const successful=job.status==='delivered'&&job.quality>=step.quality;
 const retry=!successful&&['expired','rejected','breached','delivered'].includes(job.status);
 return {route,step,job,successful,retry};
}
function issue(s:State,c:Content,d:ProjectDefinition,p:ProjectState){
 const step=d.routes.find(r=>r.id===p.route)!.steps[p.step]!,t=c.commissions.find(t=>t.id===step.template)!;
 p.job=`project:${d.id}:${p.history.length}`;p.attempts++;p.history.push(p.job);
 s.jobs.push(postedJob(t,p.job,s.absoluteSlot));
}
export function applyProject(s:State,c:Content,cmd:Extract<Command,{type:'campaign'}>):boolean {
 if(cmd.action!=='project-start'&&cmd.action!=='project-next')return false;
 const d=c.campaign?.projects?.find(d=>d.id===cmd.id),campaign=s.campaign!;
 check(d&&campaign.chapter===d.chapter,'PROJECT_LOCKED');
 const states=campaign.projects??={},p=states[cmd.id];
 if(cmd.action==='project-start'){
  check(!p,'PROJECT_ACTIVE');check(d!.routes.some(r=>r.id===cmd.target),'PROJECT_ROUTE');
  const fresh:ProjectState={route:cmd.target!,step:0,job:'',attempts:0,history:[],completed:false};
  states[cmd.id]=fresh;campaign.projects=states;issue(s,c,d!,fresh);return true;
 }
 check(p,'PROJECT_LOCKED');check(!p!.completed,'PROJECT_COMPLETE');
 const next=progress(s,d!,p!);check(next.successful||next.retry,'PROJECT_NOT_READY');
 if(next.successful){
  if(p!.step===next.route.steps.length-1){p!.completed=true;campaign.research+=d!.research;return true;}
  p!.step++;p!.attempts=0;
 }else{
  check(s.cash>=d!.retryCost,'INSUFFICIENT_RESOURCES');s.cash=round(s.cash-d!.retryCost);
  s.ledger.push({slot:s.absoluteSlot,reason:`project-retry:${d!.id}`,amount:-d!.retryCost});
 }
 issue(s,c,d!,p!);return true;
}
export function projectViews(s:State,c:Content){
 return (c.campaign?.projects??[]).filter(d=>d.chapter<=(s.campaign?.chapter??0)).map(d=>{
  const p=s.campaign?.projects?.[d.id],next=p?progress(s,d,p):null;
  const ids=new Set(p?.history??[]),resources=s.resources.filter(r=>ids.has(r.job));
  const receipts=s.ledger.filter(l=>['advance:','delivery:','breach:'].some(prefix=>l.reason.startsWith(prefix)&&ids.has(l.reason.slice(prefix.length))));
  return {id:d.id,chapter:d.chapter,title:d.title,titleEn:d.titleEn,brief:d.brief,briefEn:d.briefEn,research:d.research,retryCost:d.retryCost,
   routes:d.routes.map(r=>({id:r.id,label:r.label,labelEn:r.labelEn,description:r.description,descriptionEn:r.descriptionEn,steps:r.steps.map(step=>{const t=c.commissions.find(t=>t.id===step.template)!;return {title:t.title,titleEn:t.titleEn??t.title,quality:step.quality,phases:t.phases??1};})})),
   route:p?.route??null,step:p?.step??0,attempts:p?.attempts??0,completed:p?.completed??false,job:p?.job??null,
   status:next?.job.status??null,quality:next?.job.quality??null,target:next?.step.quality??null,
   canAdvance:!!next?.successful&&!p?.completed,canRetry:!!next?.retry&&!p?.completed,
   feedback:next?.successful?next.step.feedback:null,feedbackEn:next?.successful?next.step.feedbackEn:null,
   feedbackHistory:next?next.route.steps.slice(0,p!.completed?next.route.steps.length:p!.step).map(step=>({text:step.feedback,textEn:step.feedbackEn})):[],
   lastStep:!!next&&p!.step===next.route.steps.length-1,
   accounting:{receipts:round(receipts.reduce((sum,l)=>sum+l.amount,0)),cloud:round(resources.reduce((sum,r)=>sum+r.quota+r.purchased,0)),purchased:round(resources.reduce((sum,r)=>sum+r.purchased,0)),electricity:round(resources.reduce((sum,r)=>sum+r.electricity,0)),retries:s.ledger.filter(l=>l.reason===`project-retry:${d.id}`).reduce((sum,l)=>sum-l.amount,0)}};
 });
}
