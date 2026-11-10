import {useState,useRef} from 'preact/hooks';
import type {ComponentChildren} from 'preact';
import type {Command,Member} from 'oot-core';
import type {GameSession,GameView} from 'oot-platform';
import {Dialog} from './dialog.js';
import {Portrait} from './studio-ui.js';
import {AssignmentForecast,DeliverySummary} from './decision-panels.js';
import {names} from './presentation.js';
import {skillText} from './ui-labels.js';
export type JobFilter='active'|'posted'|'history';
export function jobMatchesGroup(status:string,filter:JobFilter){return (filter==='active'?['accepted','working','waiting','review']:filter==='posted'?['posted']:['delivered','breached']).includes(status);}
export function filterJobs<T extends {status:string;title:string;titleEn:string}>(jobs:T[],filter:JobFilter,search:string,english:boolean){return jobs.filter(j=>jobMatchesGroup(j.status,filter)&&(english?j.titleEn:j.title).toLowerCase().includes(search.trim().toLowerCase()));}
export function clarificationWait(job:{status:string;clarifyingUntil:number},slot:number){return job.status==='posted'&&job.clarifyingUntil>slot;}
type Props={locate:(()=>void)|undefined;view:GameView;job:GameView['jobs'][number];english:boolean;locked:boolean;send:(cmd:Command)=>Promise<boolean>;previewAssignment:GameSession['previewAssignment'];close:()=>void;closePanel:()=>void;messages:Record<string,[string,string]>;notice:ComponentChildren};
export function CommissionWorkbench({view,job,english,locked,send,previewAssignment,close,closePanel,messages,notice,locate}:Props){
 const tr=(zh:string,en:string)=>english?en:zh,p=view.campaign!,skill=(id:keyof typeof skillText)=>skillText[id][english?1:0];
 const [workStep,setWorkStep]=useState('brief'),[team,setTeam]=useState<Record<string,{role:'none'|Member['role'];mode:Member['mode']}>>(()=>Object.fromEntries(view.actors.map(a=>{const m=job.team.find(m=>m.character===a.id);return[a.id,{role:m?.role??'none',mode:m?.mode??'cloud'}];})));
 const workbenchRef=useRef<HTMLDivElement>(null);
 const focusTeam=()=>{setWorkStep('team');requestAnimationFrame(()=>workbenchRef.current?.querySelector<HTMLSelectElement>('.work-team select')?.focus({preventScroll:true}));};
 const workLayout=['posted','accepted','working'].includes(job.status)?'tri':'single';
 const members=Object.entries(team).filter(([,v])=>v.role!=='none').map(([character,v])=>({character,role:v.role as Member['role'],mode:v.mode})),preview=workLayout==='tri'?previewAssignment(job.id,members):null;
 return (
<Dialog layout={workLayout} className="workbench-dialog" title={english?job.titleEn:job.title} close={()=>close()}>
<div ref={workbenchRef} tabIndex={-1} class="workbench" data-layout={workLayout} data-step={workStep}>
<nav class="work-steps" aria-label={tr('委托步骤','Commission steps')}>{(['brief','team','result'] as const).map((id,i)=>
<button aria-pressed={workStep===id} onClick={()=>setWorkStep(id)}>{i+1} · {tr(['需求','队伍','预估'][i]!,['Brief','Team','Forecast'][i]!)}</button>)}</nav>
<section class="work-brief">
<h3>{workLayout==='tri'?tr('01 · 理解需求','01 · Understand the brief'):tr('委托需求','Commission brief')}</h3>
{locate&&<button onClick={locate}>{tr('定位到场景','Locate in scene')}</button>}<p>{english?job.descriptionEn:job.description}</p>
<p>{tr('工作量 / 截止时间 / 及格线','Work / deadline / passing quality')}: {job.work} / {job.status==='posted'?`${job.workSlots} ${tr('白天工作时段（接单时起算）','daytime work periods from acceptance')}`:job.deadline?`${tr('第','Day ')}${Math.floor(job.deadline/4)+1}${tr('天','')} · ${[tr('上午','Morning'),tr('下午','Afternoon'),tr('晚上','Evening'),tr('深夜','Night')][job.deadline%4]}`:'—'} / {job.passQuality}</p>{job.revealedRequirements.map(r=>
<p>{english?r.labelEn:r.label} +{r.work} WP</p>)}{job.status==='posted'&&<>{job.proposals.length>0&&<section class="campaign-panel">
<h3>{tr('确认真正需要的范围','Agree on the actual scope')}</h3>
<p>{tr('澄清全部需求后，下个时段可选择方案；选择后不能切回原方案，也不会自动接单。','After clarifying all requirements, choose a plan next period. The choice cannot be reversed and does not accept the job automatically.')}</p>{job.proposals.map(o=>
<button disabled={locked||job.hidden>0||job.clarifyingUntil>view.absoluteSlot} onClick={()=>{void send({type:'scope',job:job.id,option:o.id}).then(ok=>{if(ok)requestAnimationFrame(()=>workbenchRef.current?.focus({preventScroll:true}));});}}>{english?o.labelEn:o.label} · {o.phases} {tr('期','phases')} × {o.work} WP · ¥{o.reward}/{tr('期','phase')} · {o.workSlots} {tr('工作时段/期','work periods/phase')}</button>)}</section>}{job.hidden>0&&<p>{tr('澄清成功率：知识影响揭示；每次占1槽/15精力，失败不揭示。','Clarification success depends on knowledge. Each attempt uses one personal slot and 15 energy, even on failure.')}</p>}{job.hidden>0&&view.absoluteSlot%4>=2&&<p class="work-disabled-reason">{tr('夜晚不能澄清需求，请等到下个白天工作时段。','Clarification is unavailable at night. Wait for the next daytime work period.')}</p>}{job.hidden===0&&!clarificationWait(job,view.absoluteSlot)&&<p>{tr('甲方需求已明确，可以直接接单。','The brief is clear. You can accept directly.')}</p>}<div class="button-row">{job.hidden>0&&view.actors.map(a=>
<button disabled={locked||a.busy||view.absoluteSlot%4>=2} onClick={()=>{void send({type:'clarify',job:job.id,character:a.id}).then(ok=>{if(ok)requestAnimationFrame(()=>workbenchRef.current?.focus({preventScroll:true}));});}}>{names[a.id]} {Math.round(a.clarifyChance*100)}%</button>)}</div>
</>}{['review','delivered','breached'].includes(job.status)&&<>
<DeliverySummary job={job} english={english} settled={[...view.ledger].reverse().find(r=>r.reason===`${job.status==='breached'?'breach':'delivery'}:${job.id}`)}/>
<div class="quality-result">
<strong>{job.quality}</strong>
<span>{tr('交付质量','Delivery quality')}<small>{job.quality>=job.qualityLines[2]!?tr('出色','Excellent'):job.quality>=job.qualityLines[1]!?tr('优良','Good'):job.quality>=job.passQuality?tr('达到验收线','Meets acceptance'):tr('需要返工','Needs rework')}</small>
</span>
</div>{p.software.includes('explain')&&<p>{tr('基础 / 审查 / 事件 / 隐藏惩罚 / 缺陷惩罚','Base / review / event / hidden penalty / defect penalty')}: {Object.values(job.qualityBreakdown).join(' / ')}</p>}</>}{job.status==='waiting'&&<p class="waiting-notice">{tr('当前阶段已交付，下一阶段将于下个白天工作时段开启。','This phase is delivered. The next phase opens in the next daytime work period.')}</p>}
 </section>{['posted','accepted','working'].includes(job.status)&&<>
<section class="work-team">
<h3>{tr('02 · 安排伙伴','02 · Build the team')}</h3>{view.office&&<p class="facility-summary">{tr('设施容量：电脑','Facilities: computers')} {view.office.capacity.work} · {tr('会议席','Meeting seats')} {view.office.capacity.meeting} · {tr('工作/工具岗位需要电脑；支持岗位通常使用会议席，特定版本或任务需要电脑。','Workers/tools need computers; support usually uses meeting seats, with version/task exceptions.')}</p>}<fieldset class="assignment-team">
<legend>{tr('派遣岗位与模式','Roles and deployment')}</legend>{view.actors.map(a=>{const role=team[a.id]?.role??'none',needsComputerSupport=!!view.office?.requirements.find(r=>r.actor===a.id)?.computerSupport||!!view.office?.computerTemplates.includes(job.template),inThisJob=job.team.some(m=>m.character===a.id);return <label class="team-row">
<span class="candidate">
<Portrait id={a.id} variant="candidate"/>
<span>
<b>{names[a.id]}</b>
<small>{tr('精力 / 负载','Energy / load')}: {a.energy} / {a.load} · {a.price}T/WP · {inThisJob?tr('本单在岗','On this job'):a.busy?tr('其他安排占用','Occupied'):tr('空闲','Available')}</small>
<small>{Object.entries(a.skills).sort((x,y)=>y[1]-x[1]).slice(0,2).map(([k,v])=>`${skill(k as keyof typeof skillText)} ${v}`).join(' · ')}{view.office&&<> · {role==='none'?(needsComputerSupport?tr('需电脑工位（含支持岗）','Computer required (including support)'):tr('执行/工具需电脑 · 支持用会议席','Work/tool: computer · Support: meeting seat')):(['worker','tool'].includes(role)||needsComputerSupport?tr('使用：电脑工位','Uses: computer'):tr('使用：会议席位','Uses: meeting seat'))}</>}</small>
</span>
</span>
<select aria-label={`${names[a.id]} ${tr('岗位','role')}`} value={team[a.id]?.role??'none'} onChange={e=>setTeam(prev=>({...prev,[a.id]:{role:e.currentTarget.value as 'none'|Member['role'],mode:prev[a.id]?.mode??'cloud'}}))}>{(['none','worker','planner','reviewer','tool'] as const).map((r,i)=>
<option value={r}>{tr(['不参与','执行者','负责人','审查者','工具人'][i]!,['Not assigned','Worker','Planner','Reviewer','Tool'][i]!)}</option>)}</select>
<select aria-label={`${names[a.id]} ${tr('模式','mode')}`} value={team[a.id]?.mode??'cloud'} onChange={e=>setTeam(prev=>({...prev,[a.id]:{role:prev[a.id]?.role??'none',mode:e.currentTarget.value as Member['mode']}}))}>{a.modes.map(mode=>
<option value={mode}>{tr(mode==='cloud'?'云端':'本地',mode==='cloud'?'Cloud':'Local')}</option>)}</select>
</label>;})}</fieldset>
</section>
<section class="work-result">
<h3>{tr('03 · 核对方案','03 · Check the plan')}</h3>
<p>{tr('本槽无事件资源上限估计（未加班的夜间为0）','Current-slot resource estimate, excluding events (zero at night without overtime)')}: {preview?.estimate?`${preview.estimate.cloud}T / ${preview.estimate.local} ${tr('本地','local')}`:'—'}</p>{job.status==='posted'&&members.length===0&&<p>{tr('接单后需安排至少一位执行者；也可现在先试选伙伴预览工期与预算。','Assign at least one worker after accepting, or try a team now to preview time and budget.')}</p>}{preview?.error&&!(job.status==='posted'&&members.length===0)&&<p role="alert" class="assignment-error">{tr(...(messages[preview.error]??[preview.error,preview.error]))}</p>}{preview?.forecast&&<AssignmentForecast value={preview.forecast} english={english}/>}</section>
<footer class="work-confirm">{job.status==='posted'?<>
<span>{notice}<b>{tr('报酬','Reward')} ¥{job.reward} · {job.work} WP · {job.workSlots} {tr('工作时段','work periods')}</b>
<small>{tr('队伍仅供试算；关闭后丢弃未提交草稿。','Team is a preview; closing discards the draft.')}</small>
{clarificationWait(job,view.absoluteSlot)&&<small class="work-disabled-reason">{tr('刚澄清过，请等下一时段再接单或确认范围。','Just clarified: wait until the next period to accept or agree on scope.')}</small>}
</span>
<button onClick={()=>close()}>{tr('取消','Cancel')}</button>
<button disabled={locked} onClick={()=>{void send({type:'reject',job:job.id}).then(ok=>{if(ok)close();});}}>{tr('拒绝','Decline')}</button>
<button class="primary" disabled={locked||job.clarifyingUntil>view.absoluteSlot} onClick={()=>{void send({type:'accept',job:job.id}).then(ok=>{if(ok)focusTeam();});}}>{tr('接单','Accept')}</button>
</>:<>
<span>{notice}<b>{members.length} {tr('位伙伴','teammates')}</b>
<small>{preview?.error?tr(...(messages[preview.error]??[preview.error,preview.error])):tr('关闭后未提交的队伍草稿会丢弃。','Closing discards the unsubmitted team draft.')}</small>
</span>
<button onClick={()=>close()}>{tr('取消','Cancel')}</button>
<button class="primary" disabled={locked||!!preview?.error} onClick={()=>{void send({type:'assign',job:job.id,team:members}).then(ok=>{if(ok){close();closePanel();}});}}>{tr('确认派遣','Assign team')}</button>
</>}</footer>
</>}
 {workLayout==='single'&&<footer class="work-confirm">
<span>{notice}<b>{job.status==='review'?tr('核对结算后交付','Check settlement before delivery'):job.status==='waiting'?tr('等待下一阶段','Waiting for the next phase'):tr('委托已结束','Commission closed')}</b>
</span>
<button onClick={()=>close()}>{tr('关闭','Close')}</button>{job.status==='review'&&<>
<button disabled={locked||!job.settlement.canRework} onClick={()=>{void send({type:'rework',job:job.id}).then(ok=>{if(ok)focusTeam();});}}>{tr('返工','Rework')}</button>
<button class="primary" disabled={locked||!job.settlement.canDeliver} onClick={()=>{void send({type:'deliver',job:job.id}).then(ok=>{if(ok){close();closePanel();}});}}>{tr('验收结算','Deliver')}</button>
</>}</footer>}
 </div>
</Dialog>
 );
}
