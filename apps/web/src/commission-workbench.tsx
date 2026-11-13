import {useState,useRef,useLayoutEffect} from 'preact/hooks';
import type {ComponentChildren} from 'preact';
import type {Command,Member} from 'oot-core';
import type {GameSession,GameView} from 'oot-platform';
import {commissionObjective,showSettlement,waitingText} from './commission-tracking.js';
import {Portrait} from './studio-ui.js';
import {AssignmentForecast,DeliverySummary,periodText} from './decision-panels.js';
import {names} from './presentation.js';
import {skillText} from './ui-labels.js';
export type JobFilter='active'|'posted'|'history';
export function jobMatchesGroup(status:string,filter:JobFilter){return (filter==='active'?['accepted','working','waiting','review']:filter==='posted'?['posted']:['delivered','breached']).includes(status);}
export function filterJobs<T extends {status:string;title:string;titleEn:string}>(jobs:T[],filter:JobFilter,search:string,english:boolean){return jobs.filter(j=>jobMatchesGroup(j.status,filter)&&(english?j.titleEn:j.title).toLowerCase().includes(search.trim().toLowerCase()));}
export function clarificationWait(job:{status:string;clarifyingUntil:number},slot:number){return job.status==='posted'&&job.clarifyingUntil>slot;}
export type WorkbenchProps={trackControl?:ComponentChildren;onAccepted?:()=>void;onRejected?:()=>void;locate:(()=>void)|undefined;view:GameView;job:GameView['jobs'][number];english:boolean;locked:boolean;send:(cmd:Command)=>Promise<boolean>;previewAssignment:GameSession['previewAssignment'];close:()=>void;closePanel:()=>void;messages:Record<string,[string,string]>;notice:ComponentChildren};
export function CommissionWorkbench({view,job,english,locked,send,previewAssignment,close,closePanel,messages,notice,locate,trackControl,onAccepted,onRejected}:WorkbenchProps){
 const tr=(zh:string,en:string)=>english?en:zh,p=view.campaign!,skill=(id:keyof typeof skillText)=>skillText[id][english?1:0];
 const [workStep,setWorkStep]=useState(['accepted','working'].includes(job.status)?'team':'brief'),[team,setTeam]=useState<Record<string,{role:'none'|Member['role'];mode:Member['mode']}>>(()=>Object.fromEntries(view.actors.map(a=>{const m=job.team.find(m=>m.character===a.id);return[a.id,{role:m?.role??'none',mode:m?.mode??'cloud'}];})));
 const workbenchRef=useRef<HTMLDivElement>(null);
 const focusTeam=()=>{setWorkStep('team');requestAnimationFrame(()=>{if(matchMedia('(max-height:479px)').matches)workbenchRef.current?.querySelector('.work-deployment')?.scrollIntoView({block:'start'});workbenchRef.current?.querySelector<HTMLSelectElement>('.work-team select')?.focus({preventScroll:true});});};
 useLayoutEffect(()=>{if(['accepted','working'].includes(job.status)&&matchMedia('(max-height:479px)').matches)workbenchRef.current?.querySelector('.work-deployment')?.scrollIntoView({block:'start'});},[]);
 const workLayout=['posted','accepted','working'].includes(job.status)?'tri':'single';
 const members=Object.entries(team).filter(([,v])=>v.role!=='none').map(([character,v])=>({character,role:v.role as Member['role'],mode:v.mode})),preview=workLayout==='tri'?previewAssignment(job.id,members):null;
 return (
<div class="commission-workspace"><div class="commission-scroll"><header class="commission-heading"><h2>{english?job.titleEn:job.title}</h2><div class="commission-meta"><span>{tr(({posted:'待接委托',accepted:'待派遣',working:'执行中',waiting:'阶段已交付',review:'待验收',delivered:'已交付',breached:'已违约'} as Record<string,string>)[job.status]??job.status,job.status)}</span><span>{job.phases>1?`${tr('阶段','Phase')} ${Math.min(job.phase+1,job.phases)}/${job.phases}`:tr('单期委托','One phase')}</span><span>{job.status==='posted'?`${job.workSlots} ${tr('工作时段','work periods')}`:periodText(job.deadline,english)}</span>{locate&&<button onClick={locate}>{tr('定位工位','Locate workstation')}</button>}</div><p class="commission-objective">▸ {tr('当前目标','Current objective')} · {commissionObjective(job,view.absoluteSlot,english)}</p></header>
<div ref={workbenchRef} tabIndex={-1} class="workbench" data-layout={workLayout} data-step={workStep}>
{workLayout==='tri'&&<nav class="work-steps" aria-label={tr('委托视图','Commission view')}>{(['brief','team'] as const).map(id=><button aria-pressed={workStep===id} onClick={()=>id==='team'?focusTeam():setWorkStep(id)}>{id==='brief'?tr('委托简报','Brief'):tr('团队派遣与预估','Team & forecast')}</button>)}</nav>}
<section class="work-brief">{job.status==='review'&&!job.settlement.canRework&&<small class="work-disabled-reason">{job.settlement.tier!=='fail'?tr('已达到验收线，无需返工。','Quality meets the pass line; no rework needed.'):job.settlement.late>0?tr('已逾期，不能返工；结算将按违约扣款。','Deadline passed; rework unavailable. Settlement incurs a breach charge.'):tr('已使用返工机会；结算将按违约扣款。','Rework already used. Settlement incurs a breach charge.')}</small>}{job.status==='review'&&!job.settlement.canDeliver&&<small>{tr('未达验收线，请先返工；当前不能结算。','Below the pass line. Rework before settlement.')}</small>}{job.status==='waiting'&&<p class="waiting-notice">{waitingText(job,english)}</p>}{showSettlement(job.status)&&<div class="commission-settlement">

<div class="quality-result">
<strong>{job.quality}</strong><small>{tr('及格线','Pass')} {job.passQuality}</small>
<span>{tr('交付质量','Delivery quality')}<small>{job.quality>=job.qualityLines[2]!?tr('出色','Excellent'):job.quality>=job.qualityLines[1]!?tr('优良','Good'):job.quality>=job.passQuality?tr('达到验收线','Meets acceptance'):tr('需要返工','Needs rework')}</small>
</span>
</div><div class="commission-payment"><b>{tr('现金变动','Cash change')} ¥{(['delivered','breached'].includes(job.status)?[...view.ledger].reverse().find(r=>r.reason===`${job.status==='breached'?'breach':'delivery'}:${job.id}`)?.amount:job.settlement.net)?.toFixed(2)??'—'}</b><DeliverySummary job={job} english={english} settled={[...view.ledger].reverse().find(r=>r.reason===`${job.status==='breached'?'breach':'delivery'}:${job.id}`)}/></div>{p.software.includes('explain')&&<p>{tr('基础 / 审查 / 事件 / 隐藏惩罚 / 缺陷惩罚','Base / review / event / hidden penalty / defect penalty')}: {Object.values(job.qualityBreakdown).join(' / ')}</p>}</div>}{workLayout==='tri'&&<div class="commission-weights">{Object.entries(job.weights).map(([k,v])=><div><span>{skill(k as keyof typeof skillText)} {Math.round(v*100)}%</span><meter min={0} max={1} value={v}/></div>)}</div>}
<h3>{workLayout==='tri'?tr('01 · 理解需求','01 · Understand the brief'):tr('委托需求','Commission brief')}</h3>
<p>{english?job.descriptionEn:job.description}</p>
<p>{tr('工作量 / 截止时间 / 及格线','Work / deadline / passing quality')}: {job.work} / {job.status==='posted'?`${job.workSlots} ${tr('白天工作时段（接单时起算）','daytime work periods from acceptance')}`:job.deadline?`${tr('第','Day ')}${Math.floor(job.deadline/4)+1}${tr('天','')} · ${[tr('上午','Morning'),tr('下午','Afternoon'),tr('晚上','Evening'),tr('深夜','Night')][job.deadline%4]}`:'—'} / {job.passQuality}</p>{job.revealedRequirements.map(r=>
<p>{english?r.labelEn:r.label} +{r.work} WP</p>)}{job.status==='posted'&&<>{job.proposals.length>0&&<section class="campaign-panel">
<h3>{tr('确认真正需要的范围','Agree on the actual scope')}</h3>
<p>{tr('澄清全部需求后，下个时段可选择方案；选择后不能切回原方案，也不会自动接单。','After clarifying all requirements, choose a plan next period. The choice cannot be reversed and does not accept the job automatically.')}</p>{job.proposals.map(o=>
<button disabled={locked||job.hidden>0||job.clarifyingUntil>view.absoluteSlot} onClick={()=>{void send({type:'scope',job:job.id,option:o.id}).then(ok=>{if(ok)requestAnimationFrame(()=>workbenchRef.current?.focus({preventScroll:true}));});}}>{english?o.labelEn:o.label} · {o.phases} {tr('期','phases')} × {o.work} WP · ¥{o.reward}/{tr('期','phase')} · {o.workSlots} {tr('工作时段/期','work periods/phase')}</button>)}</section>}{job.hidden>0&&<p>{tr('澄清成功率：知识影响揭示；每次占1槽/15精力，失败不揭示。','Clarification success depends on knowledge. Each attempt uses one personal slot and 15 energy, even on failure.')}</p>}{job.hidden>0&&view.actors.every(a=>a.busy||a.location==='expedition')&&<p class="work-disabled-reason">{tr('当前没有可澄清的空闲伙伴，请推进时段或调整安排。','No teammate is available to clarify. Advance time or adjust assignments.')}</p>}{job.hidden>0&&view.absoluteSlot%4>=2&&<p class="work-disabled-reason">{tr('夜晚不能澄清需求，请等到下个白天工作时段。','Clarification is unavailable at night. Wait for the next daytime work period.')}</p>}{job.hidden===0&&!clarificationWait(job,view.absoluteSlot)&&<p>{tr('甲方需求已明确，可以直接接单。','The brief is clear. You can accept directly.')}</p>}<div class="button-row">{job.hidden>0&&view.actors.map(a=>
<button disabled={locked||a.busy||a.location==='expedition'||a.energy<15||clarificationWait(job,view.absoluteSlot)||view.absoluteSlot%4>=2} onClick={()=>{void send({type:'clarify',job:job.id,character:a.id}).then(ok=>{if(ok)requestAnimationFrame(()=>workbenchRef.current?.focus({preventScroll:true}));});}}>{names[a.id]} {Math.round(a.clarifyChance*100)}%{a.energy<15?tr(' · 精力不足15',' · Needs 15 energy'):a.busy?tr(' · 忙碌',' · Busy'):''}</button>)}</div>
</>}
{job.status==='posted'&&<div class="contract-cards">{[[tr('合同报酬','Reward'),`¥${job.reward}`],[tr('工作总量','Work'),`${job.work} WP`],[tr('交付窗口','Window'),`${job.workSlots} ${tr('时段','periods')}`],[tr('质量红线','Quality'),`≥ ${job.passQuality}`]].map(([label,value])=><div><span>◇ {label}</span><b>{value}</b></div>)}</div>}</section>{['posted','accepted','working'].includes(job.status)&&<div class="work-deployment">
<section class="work-team">
<p>{Object.entries(job.weights).filter(([,v])=>v>0).map(([k,v])=>`${skill(k as keyof typeof skillText)} ${Math.round(v*100)}%`).join(' · ')}</p>{view.office&&<p class="facility-summary">{tr('设施容量：电脑','Facilities: computers')} {view.office.capacity.work} · {tr('会议席','Meeting seats')} {view.office.capacity.meeting}</p>}<fieldset class="assignment-team">
<legend>{tr('派遣岗位与模式','Roles and deployment')}</legend>{view.actors.map(a=>{const role=team[a.id]?.role??'none',needsComputerSupport=!!view.office?.requirements.find(r=>r.actor===a.id)?.computerSupport||!!view.office?.computerTemplates.includes(job.template),inThisJob=job.team.some(m=>m.character===a.id);return <label class="team-row">
<span class="candidate">
<Portrait id={a.id} variant="candidate"/>
<span>
<b>{names[a.id]}</b>
<small>{tr('精力 / 负载','Energy / load')}: {a.energy} / {a.load} · {a.price}T/WP · {inThisJob?tr('本单在岗','On this job'):a.busy?tr('其他安排占用','Occupied'):tr('空闲','Available')}</small>
<small>{role!=='none'&&view.office?(needsComputerSupport||['worker','tool'].includes(role)?tr('电脑工位','Computer station'):tr('会议席','Meeting seat')):''}</small>
</span>
</span>
<select aria-label={`${names[a.id]} ${tr('岗位','role')}`} value={team[a.id]?.role??'none'} onChange={e=>setTeam(prev=>({...prev,[a.id]:{role:e.currentTarget.value as 'none'|Member['role'],mode:prev[a.id]?.mode??'cloud'}}))}>{(['none','worker','planner','reviewer','tool'] as const).map((r,i)=>
<option value={r}>{tr(['不参与','执行者','负责人','审查者','工具人'][i]!,['Not assigned','Worker','Planner','Reviewer','Tool'][i]!)}</option>)}</select>
<select aria-label={`${names[a.id]} ${tr('模式','mode')}`} value={team[a.id]?.mode??'cloud'} onChange={e=>setTeam(prev=>({...prev,[a.id]:{role:prev[a.id]?.role??'none',mode:e.currentTarget.value as Member['mode']}}))}>{a.modes.map(mode=>
<option value={mode}>{tr(mode==='cloud'?'云端':'本地',mode==='cloud'?'Cloud':'Local')}</option>)}</select>
</label>;})}</fieldset>
</section>
<section class="work-result">
<h3>{tr('实时预估','Live forecast')}</h3>
<p>{tr('本槽无事件资源上限估计（未加班的夜间为0）','Current-slot resource estimate, excluding events (zero at night without overtime)')}: {preview?.estimate?`${preview.estimate.cloud}T / ${preview.estimate.local} ${tr('本地','local')}`:'—'}</p>{job.status==='posted'&&members.length===0&&<p>{tr('接单后需安排至少一位执行者；也可现在先试选伙伴预览工期与预算。','Assign at least one worker after accepting, or try a team now to preview time and budget.')}</p>}{preview?.error&&!(job.status==='posted'&&members.length===0)&&<p role="alert" class="assignment-error">{tr(...(messages[preview.error]??[preview.error,preview.error]))}</p>}{preview?.forecast&&<AssignmentForecast value={preview.forecast} english={english}/>}</section></div>}
</div></div><footer class="work-confirm">{trackControl}{job.status==='posted'?<>
<span>{notice}<b>{tr('报酬','Reward')} ¥{job.reward} · {job.work} WP · {job.workSlots} {tr('工作时段','work periods')}</b>
<small>{tr('队伍仅供试算；关闭后丢弃未提交草稿。','Team is a preview; closing discards the draft.')}</small>
{clarificationWait(job,view.absoluteSlot)&&<small class="work-disabled-reason">{tr('刚澄清过，请等下一时段再接单或确认范围。','Just clarified: wait until the next period to accept or agree on scope.')}</small>}
</span>

<button disabled={locked} onClick={()=>{void send({type:'reject',job:job.id}).then(ok=>{if(ok)onRejected?.();});}}>{tr('拒绝','Decline')}</button>
<button class="primary" disabled={locked||job.clarifyingUntil>view.absoluteSlot} onClick={()=>{void send({type:'accept',job:job.id}).then(ok=>{if(ok){focusTeam();onAccepted?.();}});}}>{tr('接取委托','Accept commission')}</button>
</>:workLayout==='tri'?<>
<span>{notice}<b>{members.length} {tr('位伙伴','teammates')}</b>
<small>{preview?.error?tr(...(messages[preview.error]??[preview.error,preview.error])):tr('关闭后未提交的队伍草稿会丢弃。','Closing discards the unsubmitted team draft.')}</small>
</span>

<button class="primary" disabled={locked||!!preview?.error} onClick={()=>{void send({type:'assign',job:job.id,team:members}).then(ok=>{if(ok){close();closePanel();}});}}>{tr('确认派遣','Assign team')}</button>
</>:<>
<span>{notice}<b>{job.status==='review'?tr('核对结算后交付','Check settlement before delivery'):job.status==='waiting'?tr('等待下一阶段','Waiting for the next phase'):tr('委托已结束','Commission closed')}</b>
</span>
{job.status==='review'&&<>
<button disabled={locked||!job.settlement.canRework} onClick={()=>{void send({type:'rework',job:job.id}).then(ok=>{if(ok)focusTeam();});}}>{tr('返工','Rework')}</button>
<button class="primary" disabled={locked||!job.settlement.canDeliver} onClick={()=>{void send({type:'deliver',job:job.id}).then(ok=>{if(ok){close();closePanel();}});}}>{job.settlement.tier==='fail'?tr('违约结案','Settle breach'):tr('验收结算','Deliver')}</button>
</>}</>}</footer>
</div>
 );
}
