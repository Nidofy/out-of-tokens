import type {UiFeedback} from './presentation-events.js';
import {names} from './presentation.js';
import type {GameView} from 'oot-platform';
type Job=GameView['jobs'][number];
export const trackableStatuses=['review','accepted','working','waiting','posted'];
export function trackingCandidates(view:Pick<GameView,'jobs'|'projects'>){
 const active=view.jobs.filter(j=>trackableStatuses.slice(0,4).includes(j.status)).sort((a,b)=>trackableStatuses.indexOf(a.status)-trackableStatuses.indexOf(b.status)||a.deadline-b.deadline);
 return [...active.map(j=>j.id),...view.projects.filter(p=>!p.completed).map(p=>`project:${p.id}`),...view.jobs.filter(j=>j.status==='posted').map(j=>j.id)];
}
export function resolveTrackedCommission(view:Pick<GameView,'jobs'|'projects'>,locked:string|null){const ids=trackingCandidates(view);return locked&&ids.includes(locked)?locked:ids[0]??null;}
export function commissionGroup(job:Pick<Job,'status'|'hidden'|'proposals'>){return job.status==='posted'?(job.hidden||job.proposals.length?'unclear':'ready'):job.status==='waiting'?'working':job.status;}
export function commissionObjective(job:Job,slot:number,english:boolean){
 const tr=(zh:string,en:string)=>english?en:zh;
 if(job.status==='posted')return job.clarifyingUntil>slot?tr('等待客户回复，请推进下一时段','Awaiting the client; advance one period'):job.hidden?tr(`还有 ${job.hidden} 项隐藏需求，可在白天派空闲伙伴澄清`,`Clarify ${job.hidden} hidden requirements with an available teammate during daytime`):job.proposals.length?tr('对比并选择执行范围','Compare and choose a scope'):tr('需求明确，核对合同后即可接取','Brief ready. Review the contract and accept');
 if(job.status==='accepted')return tr('配置至少一位执行者并确认派遣','Choose at least one worker and confirm deployment');
 if(job.status==='working')return tr(`团队执行中 · ${job.progress}/${job.work} WP，可调整分工`,`In progress · ${job.progress}/${job.work} WP. Adjust the team if needed`);
 if(job.status==='review')return tr(`待验收 · 评分 ${job.quality} / 及格线 ${job.passQuality}，结算或返工`,`Review · Score ${job.quality} / pass ${job.passQuality}. Deliver or rework`);
 if(job.status==='waiting')return waitingText(job,english);
 return tr('委托已归档，可复盘交付记录','Archived. Review the delivery record');
}

/** Project-generated job IDs share a prefix with UI project pins: resolve exact jobs first. */
export function commissionCategory(view:Pick<GameView,'jobs'|'projects'>,id:string|null,fallback:'active'|'posted'|'history'){
 const job=view.jobs.find(j=>j.id===id);
 return job?(job.status==='posted'?'posted':trackableStatuses.includes(job.status)?'active':'history'):view.projects.some(p=>`project:${p.id}`===id)?'projects':fallback;
}

export function trackingState(view:Pick<GameView,'jobs'|'projects'>,pin:string|null){
 const id=resolveTrackedCommission(view,pin);return {id,pinned:!!pin&&pin===id};
}
export function readTrackingPin(lab:boolean,storage:Pick<Storage,'getItem'>){if(lab)return null;try{return storage.getItem('oot-tracked-commission');}catch{return null;}}
export function writeTrackingPin(lab:boolean,storage:Pick<Storage,'setItem'|'removeItem'>,pin:string|null){if(lab)return;try{if(pin)storage.setItem('oot-tracked-commission',pin);else storage.removeItem('oot-tracked-commission');}catch{/* Optional UI persistence. */}}
export function showSettlement(status:string){return ['review','delivered','breached'].includes(status);}
export function waitingText(job:Pick<Job,'phase'|'phases'>,english:boolean){return english?`Phase ${job.phase}/${job.phases} delivered · Next phase starts next daytime period`:`第 ${job.phase}/${job.phases} 期已交付 · 下一白天工作时段自动开启下一期`;}
export function commissionNotice(feedback:UiFeedback|null,selected:string|null){return !!feedback&&(feedback.target.surface==='global'||feedback.target.surface==='job'&&feedback.target.id===selected);}
export function trackerText(view:GameView,id:string,english:boolean){
 const tr=(zh:string,en:string)=>english?en:zh,j=view.jobs.find(j=>j.id===id);
 if(j){
  if(j.status==='review')return tr(`待验收 · 评分 ${j.quality} · ¥${j.reward}`,`Review · Score ${j.quality} · ¥${j.reward}`);
  if(j.status==='posted')return `${tr('待接委托','Available')} · ¥${j.reward} · ${j.hidden?tr(`${j.hidden} 项待澄清`,`${j.hidden} unclear`):tr('需求已明确','Brief clear')}`;
  if(j.status==='waiting')return waitingText(j,english);
  const remaining=Math.max(0,j.deadline-view.absoluteSlot);
  return `${j.status==='accepted'?tr('待派遣','Assign team'):tr('执行中','Working')} · ${j.progress}/${j.work} WP · ${tr(`剩 ${remaining} 时段`,`${remaining} periods left`)}${j.status==='working'?' · '+j.team.map(m=>names[m.character]).join(' / '):''}`;
 }
 const p=view.projects.find(p=>`project:${p.id}`===id);if(!p)return '';
 const route=p.routes.find(r=>r.id===p.route)??p.routes[0],step=route?.steps[p.step],job=view.jobs.find(j=>j.id===p.job);
 return `${tr('客户项目','Project')} · ${p.step+1}/${route?.steps.length??1} · ${step?tr(step.title,step.titleEn):tr('选择路线','Choose route')}${job?` · ¥${job.reward}`:''}`;
}
