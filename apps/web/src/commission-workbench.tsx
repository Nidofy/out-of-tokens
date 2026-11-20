import {useState,useEffect,useRef,useLayoutEffect} from 'preact/hooks';
import type {ComponentChildren} from 'preact';
import type {Command,Member} from 'oot-core';
import type {ActivityPreview,Draft,DuoExplanation,ExperienceView,GameSession,GameView,SuggestResult} from 'oot-platform';
import {commissionObjective,showSettlement,waitingText} from './commission-tracking.js';
import {artSlotForJobTemplate,computeCandidateDelta,describeActivityPreview,findLatestJobReceipt,formatDuoEvaluations,formatFactLine,stableDraftKey} from './experience-adapter.js';
import type {SuggestionTimingSample} from './experience-worker-host.js';
import {ExperienceArtSlot} from './experience-art-slot.js';
import {experienceDuoCopy} from './experience-copy.js';
import {Portrait} from './studio-ui.js';
import {resolveAvatarArt} from './art/portrait-resolver.js';
import {AssignmentForecast,DeliverySummary,periodText} from './decision-panels.js';
import {names} from './presentation.js';
import {skillText} from './ui-labels.js';
import {Icon} from './icons.js';
import {QualitySealSvg} from './ornaments.js';
import {topJobSkillWeights} from './ui2-logic.js';
import {explainLiveTeamFit,resolveReasonCopy} from './experience-ui-copy.js';
import {filterValidLastTeamMembers} from './experience-ui-state.js';
import {getLivingCatalog,pickWorkBark,resolveClientPersona} from './living-adapter.js';
import type {CharacterBarkSet,LivingContent,LivingView} from './living-adapter.js';

export type JobFilter='active'|'posted'|'history';
export type DraftTeam=Record<string,{role:'none'|Member['role'];mode:Member['mode']}>;

export function jobMatchesGroup(status:string,filter:JobFilter){return (filter==='active'?['accepted','working','waiting','review']:filter==='posted'?['posted']:['delivered','breached']).includes(status);}
export function filterJobs<T extends {status:string;title:string;titleEn:string}>(jobs:T[],filter:JobFilter,search:string,english:boolean){return jobs.filter(j=>jobMatchesGroup(j.status,filter)&&(english?j.titleEn:j.title).toLowerCase().includes(search.trim().toLowerCase()));}
export function clarificationWait(job:{status:string;clarifyingUntil:number},slot:number){return job.status==='posted'&&job.clarifyingUntil>slot;}

export type WorkbenchProps={
 trackControl?:ComponentChildren;
 onAccepted?:()=>void;
 onRejected?:()=>void;
 locate:(()=>void)|undefined;
 view:GameView;
 job:GameView['jobs'][number];
 english:boolean;
 locked:boolean;
 send:(cmd:Command)=>Promise<boolean>;
 previewAssignment:GameSession['previewAssignment'];
 close:()=>void;
 closePanel:()=>void;
 messages:Record<string,[string,string]>;
 notice:ComponentChildren;
 savedDraft?:DraftTeam|undefined;
 lastTeam?:readonly Member[]|undefined;
 onSaveDraft?:(jobId:string,draft:DraftTeam)=>void;
 onJumpToOffice?:(draft:DraftTeam)=>void;
 onJumpToFinance?:(draft:DraftTeam)=>void;
 onJumpToActor?:(actorId:string,draft:DraftTeam)=>void;
 onOpenMap?:()=>void;
 livingView?:LivingView|undefined;
 livingCatalog?:LivingContent|undefined;
 onWorkBark?:((actorId:string,key:keyof CharacterBarkSet['work'])=>void)|undefined;
 previewActivity?:(cmd:Command)=>ActivityPreview;
 explainTeamDuos?:(jobId:string,draft:Draft)=>DuoExplanation;
 requestSuggestions?:(jobId:string,draft:Draft)=>Promise<{result:SuggestResult;timing:SuggestionTimingSample}|null>;
 experienceView?:ExperienceView|undefined;
};

export function CommissionWorkbench({view,job,english,locked,send,previewAssignment,close,closePanel,messages,notice,locate,trackControl,onAccepted,onRejected,savedDraft,lastTeam,onSaveDraft,onJumpToOffice,onJumpToFinance,onJumpToActor,onOpenMap,livingView,livingCatalog,onWorkBark,previewActivity,explainTeamDuos,requestSuggestions,experienceView}:WorkbenchProps){
 const tr=(zh:string,en:string)=>english?en:zh,p=view.campaign!,skill=(id:keyof typeof skillText)=>skillText[id][english?1:0];
 const [workStep,setWorkStep]=useState(['accepted','working'].includes(job.status)?'team':'brief');
 const [team,setTeam]=useState<DraftTeam>(()=>savedDraft??Object.fromEntries(view.actors.map(a=>{const m=job.team.find(m=>m.character===a.id);return[a.id,{role:m?.role??'none',mode:m?.mode??'cloud'}];})));
 const [workBark,setWorkBark]=useState<{actorId:string;text:string}|null>(null);
 const [reuseNote,setReuseNote]=useState<string|null>(null);
 const [candidateState,setCandidateState]=useState<{status:'idle'|'loading'|'ready'|'error';result?:SuggestResult;timing?:SuggestionTimingSample;error?:string}>({status:'idle'});
 const clarifyAttemptRef=useRef<{actorId:string;hidden:number;until:number}|null>(null);
 const workbenchRef=useRef<HTMLDivElement>(null);
 const activeCatalog=livingCatalog??getLivingCatalog(view);
 const roleBarkKey:Record<Member['role'],keyof CharacterBarkSet['work']>={worker:'assignWorker',planner:'assignPlanner',reviewer:'assignReviewer',tool:'assignTool'};
 const emitWorkBark=(actorId:string,key:keyof CharacterBarkSet['work'])=>{
  setWorkBark({actorId,text:pickWorkBark(activeCatalog,actorId,key,english)});
  onWorkBark?.(actorId,key);
 };
 useEffect(()=>{
  const pending=clarifyAttemptRef.current;
  if(!pending)return;
  if(job.hidden<pending.hidden){clarifyAttemptRef.current=null;emitWorkBark(pending.actorId,'clarifyHit');}
  else if(job.clarifyingUntil!==pending.until){clarifyAttemptRef.current=null;emitWorkBark(pending.actorId,'clarifyMiss');}
 },[job.hidden,job.clarifyingUntil]);

 const updateTeam=(updater:(prev:DraftTeam)=>DraftTeam)=>{
  setTeam(prev=>{
   const next=updater(prev);
   onSaveDraft?.(job.id,next);
   return next;
  });
 };

 const focusTeam=()=>{setWorkStep('team');requestAnimationFrame(()=>{if(matchMedia('(max-height:479px)').matches)workbenchRef.current?.querySelector('.work-deployment')?.scrollIntoView({block:'start'});workbenchRef.current?.querySelector<HTMLSelectElement>('.work-team select')?.focus({preventScroll:true});});};
 useLayoutEffect(()=>{if(['accepted','working'].includes(job.status)&&matchMedia('(max-height:479px)').matches)workbenchRef.current?.querySelector('.work-deployment')?.scrollIntoView({block:'start'});},[]);

 const workLayout=['posted','accepted','working'].includes(job.status)?'tri':'single';
 const members=Object.entries(team).filter(([,v])=>v.role!=='none').map(([character,v])=>({character,role:v.role as Member['role'],mode:v.mode}));
 const draftKey=stableDraftKey(job.id,members);
 const draftObj:Draft={team:members,draftKey};
 const preview=workLayout==='tri'?previewAssignment(job.id,members):null;
 const topSkills=topJobSkillWeights(job.weights,2);
 const maxTeamSlots=p.chapter<=2?4:6;
 const roleShort:Record<Member['role'],string>={worker:tr('执行','Worker'),planner:tr('负责','Planner'),reviewer:tr('审查','Review'),tool:tr('工具','Tool')};
 const stationUsed=members.filter(m=>{
  const needsComputer=!!view.office?.requirements.find(r=>r.actor===m.character)?.computerSupport||!!view.office?.computerTemplates.includes(job.template);
  return needsComputer||['worker','tool'].includes(m.role);
 }).length;
 const meetingUsed=members.length-stationUsed;

 const sealTier=job.quality>=(job.qualityLines[2]??90)?'excellent':job.quality>=(job.qualityLines[1]??75)?'good':job.quality>=job.passQuality?'pass':'fail';
 const settledEntry=[...view.ledger].reverse().find(r=>r.reason===`${job.status==='breached'?'breach':'delivery'}:${job.id}`);
 const netCash=(['delivered','breached'].includes(job.status)?settledEntry?.amount:job.settlement.net)??null;
 const stationError=preview?.error==='NO_WORKSTATION'||preview?.error==='NO_MEETING_SEAT';
 const cloudRisk=!!preview?.forecast?.risks.cloud;
 const capacityRisk=!!preview?.forecast?.risks.capacity||stationError;
 const conditionRisk=!!preview?.forecast?.risks.condition||!!preview?.forecast?.risks.noProgress;
 const lateRisk=!!preview?.forecast?.risks.late;
 const canJumpOffice=!!view.office&&p.scene==='workshop'&&!locked;
 const liveFit=workLayout==='tri'?explainLiveTeamFit(view,job,members,preview,english):null;
 const canOfferCandidates=workLayout==='tri'&&['posted','accepted','working'].includes(job.status);

 const searchSignature=`${job.id}:${view.absoluteSlot}:${job.status}:${job.hidden}:${job.work}:${view.cash}:${view.quota+view.purchased}:${view.localCapacity}:${view.actors.map(a=>`${a.id}@${a.version}:${a.energy}:${a.busy?1:0}`).join(',')}:${draftKey}`;
 useEffect(()=>{
  if(!canOfferCandidates||!requestSuggestions){setCandidateState({status:'idle'});return;}
  let cancelled=false;
  setCandidateState(prev=>prev.result?{...prev,status:'loading'}:{status:'loading'});
  void requestSuggestions(job.id,draftObj).then(res=>{
   if(cancelled||!res)return;
   if(res.result.draftKey!==draftKey)return;
   setCandidateState({status:'ready',result:res.result,timing:res.timing});
  }).catch(err=>{
   if(cancelled)return;
   setCandidateState({status:'error',error:err instanceof Error?err.message:String(err)});
  });
  return()=>{cancelled=true;};
 },[canOfferCandidates,searchSignature,requestSuggestions]);

 const applySuggestedDraft=(suggestedMembers:readonly Member[],kindLabel:string)=>{
  setReuseNote(tr(
   `已将「${kindLabel}」填入可修改草稿；可自由调整岗位或部署模式，不会自动接单、购买或派遣。`,
   `Loaded "${kindLabel}" into editable draft. Adjust freely—never auto-accepts, buys, or assigns.`
  ));
  updateTeam(()=>{
   const blank:DraftTeam=Object.fromEntries(view.actors.map(a=>[a.id,{role:'none',mode:a.modes.includes('cloud')?'cloud':a.modes[0]!}]));
   for(const m of suggestedMembers)blank[m.character]={role:m.role,mode:m.mode};
   return blank;
  });
 };

 const applyLastTeamDraft=()=>{
  if(!lastTeam||lastTeam.length===0)return;
  const {valid,dropped}=filterValidLastTeamMembers(lastTeam,view);
  updateTeam(()=>{
   const blank:DraftTeam=Object.fromEntries(view.actors.map(a=>[a.id,{role:'none',mode:a.modes.includes('cloud')?'cloud':a.modes[0]!}]));
   for(const m of valid)blank[m.character]={role:m.role,mode:m.mode};
   return blank;
  });
  if(valid.length===0){
   setReuseNote(tr('上次队伍成员当前均忙碌或已不可用，请手动调整人选。','Previous squad teammates are currently busy or incompatible; please pick manually.'));
  }else if(dropped.length>0){
   setReuseNote(tr(`已预填可出勤成员（已跳过忙碌/不兼容：${dropped.map(id=>names[id]??id).join('、')}）。请核对实时预估与协同后再确认。`,`Prefilled available members (skipped busy/incompatible: ${dropped.map(id=>names[id]??id).join(', ')}). Review live forecast before confirming.`));
  }else{
   setReuseNote(tr('已按上次队伍预填并重新校验；可随时修改，不会自动派遣。','Prefilled and re-validated from last squad; edit freely—never assigns automatically.'));
  }
 };

 const clearSampleDraft=()=>{
  setReuseNote(null);
  updateTeam(prev=>Object.fromEntries(Object.entries(prev).map(([id,v])=>[id,{role:'none',mode:v.mode}])));
 };

 return (
  <div class="commission-workspace">
   <div class="commission-scroll">
    <header class="commission-heading">
     <h2>{english?job.titleEn:job.title}</h2>
     <div class="commission-meta">
      <span>{tr(({posted:'待接委托',accepted:'待派遣',working:'执行中',waiting:'阶段已交付',review:'待验收',delivered:'已交付',breached:'已违约'} as Record<string,string>)[job.status]??job.status,job.status)}</span>
      <span>{job.phases>1?`${tr('阶段','Phase')} ${Math.min(job.phase+1,job.phases)}/${job.phases}`:tr('单期委托','One phase')}</span>
      <span>{job.status==='posted'?`${job.workSlots} ${tr('工作时段','work periods')}`:periodText(job.deadline,english)}</span>
      {locate&&<button onClick={locate}>{tr('定位工位','Locate workstation')}</button>}
     </div>
     <p class="commission-objective">▸ {tr('当前目标','Current objective')} · {commissionObjective(job,view.absoluteSlot,english)}</p>
    </header>

    <div ref={workbenchRef} tabIndex={-1} class="workbench" data-layout={workLayout} data-step={workStep}>
     {workLayout==='tri'&&<nav class="work-steps" aria-label={tr('委托视图','Commission view')}>{(['brief','team'] as const).map(id=><button key={id} aria-pressed={workStep===id} onClick={()=>id==='team'?focusTeam():setWorkStep(id)}>{id==='brief'?tr('委托简报','Brief'):tr('团队派遣与预估','Team & forecast')}</button>)}</nav>}

     <section class="work-brief">
      {job.status==='review'&&!job.settlement.canRework&&<small class="work-disabled-reason">{job.settlement.tier!=='fail'?tr('已达到验收线，无需返工。','Quality meets the pass line; no rework needed.'):job.settlement.late>0?tr('已逾期，不能返工；结算将按违约扣款。','Deadline passed; rework unavailable. Settlement incurs a breach charge.'):tr('已使用返工机会；结算将按违约扣款。','Rework already used. Settlement incurs a breach charge.')}</small>}
      {job.status==='review'&&!job.settlement.canDeliver&&<small>{tr('未达验收线，请先返工；当前不能结算。','Below the pass line. Rework before settlement.')}</small>}
      {job.status==='waiting'&&<p class="waiting-notice">{waitingText(job,english)}</p>}

      {showSettlement(job.status)&&(()=>{
       const latestReceipt=experienceView?findLatestJobReceipt(experienceView.receipts,job.id):undefined;
       const histAssessment=job.status==='review'?null:(latestReceipt?.assessment??null);
       const displayQuality=job.status==='review'?job.quality:histAssessment?.quality??null;
       const displayPass=job.status==='review'?job.passQuality:histAssessment?.passQuality??null;
       const displayBreakdown=job.status==='review'?job.qualityBreakdown:histAssessment?.qualityBreakdown??null;
       const displayTier=job.status==='review'
        ?sealTier
        :histAssessment
         ?(histAssessment.quality>=(histAssessment.qualityLines[2]??90)?'excellent':histAssessment.quality>=(histAssessment.qualityLines[1]??75)?'good':histAssessment.quality>=histAssessment.passQuality?'pass':'fail')
         :'pass';
       return (
        <div class="commission-settlement ui2-settlement">
         {displayQuality!==null&&displayPass!==null&&<QualitySealSvg score={displayQuality} passLine={displayPass} tier={displayTier} english={english}/>}
         <div class="commission-payment">
          <b>{tr('现金变动','Cash change')} ¥{netCash!==null?netCash.toFixed(2):'—'}</b>
          <DeliverySummary job={job} english={english} settled={settledEntry} persona={resolveClientPersona(activeCatalog,job)} view={view} receipt={latestReceipt}/>
          {p.software.includes('explain')&&displayBreakdown&&(
           <div class="ui2-quality-breakdown">
            <small>{tr('评分构成（基础 / 审查 / 事件 / 隐藏扣分 / 缺陷扣分）','Breakdown (Base / Review / Event / Hidden / Defect)')}</small>
            <div class="ui2-breakdown-chips">
             <span>{tr('基础','Base')} {displayBreakdown.base}</span>
             <span class="is-up">+{displayBreakdown.review} {tr('审查','Rev')}</span>
             <span>{displayBreakdown.event>=0?`+${displayBreakdown.event}`:displayBreakdown.event} {tr('事件','Evt')}</span>
             <span class={displayBreakdown.hiddenPenalty>0?'is-down':''}>−{displayBreakdown.hiddenPenalty} {tr('隐藏','Hid')}</span>
             <span class={displayBreakdown.defectPenalty>0?'is-down':''}>−{displayBreakdown.defectPenalty} {tr('缺陷','Def')}</span>
            </div>
           </div>
          )}
         </div>
        </div>
       );
      })()}

      {workLayout==='tri'&&(
       <div class="ui2-brief-highlights" aria-label={tr('首屏关键信息','Brief highlights')}>
        <div>
         <small>{tr('做什么','Scope')}</small>
         <b>{english?job.descriptionEn:job.description}</b>
        </div>
        <div>
         <small>{tr('何时交','Window')}</small>
         <b>{job.status==='posted'?`${job.workSlots} ${tr('白天工作时段','daytime work periods')}`:periodText(job.deadline,english)}</b>
        </div>
        <div>
         <small>{tr('关注什么与验收线','Focus & pass line')}</small>
         <b>{tr('质量','Quality')} ≥ {job.passQuality} · {topSkills.map(t=>`${skill(t.skill)} ${t.pct}%`).join(' / ')||tr('综合能力','Balanced')}</b>
        </div>
       </div>
      )}

      {job.status!=='breached'&&(()=>{
       const histQual=job.status==='delivered'&&experienceView
        ?findLatestJobReceipt(experienceView.receipts,job.id)?.assessment?.quality??null
        :null;
       return (
        <ExperienceArtSlot
         slotId={artSlotForJobTemplate(job.template)}
         variant="outcome"
         english={english}
         state={job.status==='delivered'?'delivered':'preview'}
         badgeText={job.status==='delivered'?tr('已交付成果','Delivered'):tr('成果示意','Outcome preview')}
         title={english?job.titleEn:job.title}
         subtitle={job.status==='delivered'
          ?(histQual!==null
            ?tr(`成交评级 · ${histQual} 分 · 实收报酬已入账`,`Final quality ${histQual} · Payout settled`)
            :tr('已验收归档 · 实收报酬已入账','Delivered & settled'))
          :tr(`质量 ≥ ${job.passQuality} 通过验收 · ${job.workSlots} 工作时段`,`Quality ≥ ${job.passQuality} to pass · ${job.workSlots} work periods`)}
        />
       );
      })()}

      {workLayout==='tri'&&<div class="commission-weights">{Object.entries(job.weights).map(([k,v])=><div key={k}><span>{skill(k as keyof typeof skillText)} {Math.round(v*100)}%</span><meter min={0} max={1} value={v}/></div>)}</div>}
      <h3>{workLayout==='tri'?tr('01 · 理解需求','01 · Understand the brief'):tr('委托需求','Commission brief')}</h3>
      <p>{english?job.descriptionEn:job.description}</p>
      <p>{tr('工作量 / 截止时间 / 及格线','Work / deadline / passing quality')}: {job.work} / {job.status==='posted'?`${job.workSlots} ${tr('白天工作时段（接单时起算）','daytime work periods from acceptance')}`:job.deadline?`${tr('第','Day ')}${Math.floor(job.deadline/4)+1}${tr('天','')} · ${[tr('上午','Morning'),tr('下午','Afternoon'),tr('晚上','Evening'),tr('深夜','Night')][job.deadline%4]}`:'—'} / {job.passQuality}</p>
      {job.revealedRequirements.map(r=><p key={r.label}>{english?r.labelEn:r.label} +{r.work} WP</p>)}

      {job.status==='posted'&&(
       <>
        {job.proposals.length>0&&(
         <section class="campaign-panel">
          <h3>{tr('确认真正需要的范围','Agree on the actual scope')}</h3>
          <p>{tr('澄清全部需求后，下个时段可选择方案；选择后不能切回原方案，也不会自动接单。','After clarifying all requirements, choose a plan next period. The choice cannot be reversed and does not accept the job automatically.')}</p>
          {job.proposals.map(o=><button key={o.id} disabled={locked||job.hidden>0||job.clarifyingUntil>view.absoluteSlot} onClick={()=>{void send({type:'scope',job:job.id,option:o.id}).then(ok=>{if(ok)requestAnimationFrame(()=>workbenchRef.current?.focus({preventScroll:true}));});}}>{english?o.labelEn:o.label} · {o.phases} {tr('期','phases')} × {o.work} WP · ¥{o.reward}/{tr('期','phase')} · {o.workSlots} {tr('工作时段/期','work periods/phase')}</button>)}
         </section>
        )}
        {job.hidden>0&&<p>{tr('澄清成功率：知识影响揭示；每次占1槽/15精力，失败不揭示。','Clarification success depends on knowledge. Each attempt uses one personal slot and 15 energy, even on failure.')}</p>}
        {job.hidden>0&&view.actors.every(a=>a.busy||a.location==='expedition')&&<p class="work-disabled-reason">{tr('当前没有可澄清的空闲伙伴，请推进时段或调整安排。','No teammate is available to clarify. Advance time or adjust assignments.')}</p>}
        {job.hidden>0&&view.absoluteSlot%4>=2&&<p class="work-disabled-reason">{tr('夜晚不能澄清需求，请等到下个白天工作时段。','Clarification is unavailable at night. Wait for the next daytime work period.')}</p>}
        {job.hidden===0&&!clarificationWait(job,view.absoluteSlot)&&<p>{tr('甲方需求已明确，可以直接接单。','The brief is clear. You can accept directly.')}</p>}
        <div class="button-row">{job.hidden>0&&view.actors.map(a=>{const cp=previewActivity?describeActivityPreview(previewActivity({type:'clarify',job:job.id,character:a.id}),english):null;return <button key={a.id} disabled={locked||a.busy||a.location==='expedition'||a.energy<15||clarificationWait(job,view.absoluteSlot)||view.absoluteSlot%4>=2} title={cp?.compactText} onClick={()=>{clarifyAttemptRef.current={actorId:a.id,hidden:job.hidden,until:job.clarifyingUntil};void send({type:'clarify',job:job.id,character:a.id}).then(ok=>{if(ok)requestAnimationFrame(()=>workbenchRef.current?.focus({preventScroll:true}));else clarifyAttemptRef.current=null;});}}>{names[a.id]} {Math.round(a.clarifyChance*100)}%{a.energy<15?tr(' · 精力不足15',' · Needs 15 energy'):a.busy?tr(' · 忙碌',' · Busy'):cp?.skipsNightRecovery?tr(' · 占深夜',' · Skips sleep'):''}</button>;})}</div>
       </>
      )}

      {job.status==='posted'&&<div class="contract-cards">{[[tr('合同报酬','Reward'),`¥${job.reward}`],[tr('工作总量','Work'),`${job.work} WP`],[tr('交付窗口','Window'),`${job.workSlots} ${tr('时段','periods')}`],[tr('质量红线','Quality'),`≥ ${job.passQuality}`]].map(([label,value])=><div key={label}><span>◇ {label}</span><b>{value}</b></div>)}</div>}
     </section>

     {['posted','accepted','working'].includes(job.status)&&(
      <div class="work-deployment">
       {canOfferCandidates&&(
        <section class="ui2-candidates-section" aria-label={tr('推荐候选方案对比','Suggested team comparisons')}>
         <div class="ui2-candidates-head">
          <div>
           <h4><Icon name="spark"/> {tr('可选方案对比（只供试选与比较差值）','Candidate comparisons (editable draft only)')}</h4>
           {candidateState.timing&&(
            <small
             class="ui2-muted-note"
             data-worker-used={candidateState.timing.usedWorker?'true':'false'}
             data-blocking-ms={candidateState.timing.mainThreadBlockingMs.toFixed(2)}
             data-roundtrip-ms={candidateState.timing.roundTripMs.toFixed(2)}
            >
             {candidateState.timing.usedWorker?tr('Web Worker 搜索','Web Worker search'):tr('同步搜索','Sync fallback')} · {tr(`已评估 ${candidateState.timing.evaluated} 案`,`Evaluated ${candidateState.timing.evaluated}`)} · {tr(`主线程 ${candidateState.timing.mainThreadBlockingMs.toFixed(1)} ms`,`Main ${candidateState.timing.mainThreadBlockingMs.toFixed(1)} ms`)}{candidateState.timing.truncated?tr('（256 上限截断）',' (capped at 256)'):''}
            </small>
           )}
          </div>
          <div class="ui2-sample-team-actions">
           {lastTeam&&lastTeam.length>0&&(
            <button type="button" onClick={applyLastTeamDraft}>
             <Icon name="refresh"/>
             <span>{tr('沿用上次队伍','Reuse last team')}</span>
            </button>
           )}
           {members.length>0&&(
            <button type="button" onClick={clearSampleDraft}>
             <span>{tr('清空草稿','Clear draft')}</span>
            </button>
           )}
          </div>
         </div>
         {reuseNote&&<small class="ui2-muted-note">{reuseNote}</small>}
         {candidateState.status==='loading'&&!candidateState.result&&(
          <p class="ui2-muted-note">{tr('正在计算省资源 / 稳质量 / 赶交期候选方案…','Searching candidate assignments…')}</p>
         )}
         {candidateState.status==='error'&&candidateState.error&&(
          <p class="ui2-muted-note">{resolveReasonCopy(candidateState.error,english)}</p>
         )}
         {candidateState.result&&candidateState.result.suggestions.length===0&&(
          <div class="ui2-candidate-empty">
           <b>{tr('0 个可执行候选方案','0 feasible plans')}</b>
           <p>{resolveReasonCopy(candidateState.result.none?.reason??'no-legal-team',english)}</p>
          </div>
         )}
         {candidateState.result&&candidateState.result.suggestions.length>0&&(
          <div class="ui2-candidates-grid">
           {candidateState.result.suggestions.map(cand=>{
            const kindTitle=cand.kind==='save-resources'?tr('省资源','Save resources'):cand.kind==='stable-quality'?tr('稳质量','Stable quality'):tr('赶交期','Fast delivery');
            const delta=computeCandidateDelta(cand,preview?.forecast??null);
            const qRange=cand.forecast.quality?`${cand.forecast.quality[0]}–${cand.forecast.quality[1]}`:'—';
            const sameAsDraft=stableDraftKey(job.id,cand.team)===draftKey;
            return (
             <article key={cand.id} class="ui2-candidate-card" data-kind={cand.kind} data-selected={sameAsDraft?'true':'false'}>
              <header>
               <b>{kindTitle}</b>
               <span>{cand.forecast.workSlots} {tr('时段','slots')} · {tr('质量','Q')} {qRange}</span>
              </header>
              <div class="ui2-candidate-team">
               {cand.team.map(m=>(
                <span key={m.character} class="ui2-candidate-member">
                 <img src={resolveAvatarArt(m.character)} alt=""/>
                 <em>{names[m.character]??m.character} · {roleShort[m.role]} · {m.mode==='cloud'?tr('云端','Cloud'):tr('本地','Local')}</em>
                </span>
               ))}
              </div>
              <div class="ui2-candidate-costs">
               {cand.costs.map((c,ci)=><small key={ci}>{formatFactLine(c,english)}</small>)}
              </div>
              {delta.cloudDelta!==null?(
               <p class="ui2-candidate-delta">
                {tr('相对当前草稿','Vs draft')}: {tr('工期','Slots')} {delta.workSlotsDelta!>=0?`+${delta.workSlotsDelta}`:delta.workSlotsDelta} · {tr('云端','Cloud')} {delta.cloudDelta>=0?`+${delta.cloudDelta}`:delta.cloudDelta}T{delta.qualityCeilingDelta!==null?` · ${tr('质量上限','Q max')} ${delta.qualityCeilingDelta>=0?`+${delta.qualityCeilingDelta}`:delta.qualityCeilingDelta}`:''}
               </p>
              ):(
               <p class="ui2-candidate-delta">{tr('可直接载入可改草稿后再微调对比。','Load into editable draft to customize and compare.')}</p>
              )}
              <button type="button" disabled={locked||sameAsDraft} onClick={()=>applySuggestedDraft(cand.team,kindTitle)}>
               {sameAsDraft?tr('当前草稿一致','Matches current draft'):tr('填入草稿（可改）','Load draft (editable)')}
              </button>
             </article>
            );
           })}
          </div>
         )}
        </section>
       )}
       <section class="work-team">
        <div class="ui2-squad-strip" aria-label={tr('已选编队席位','Selected squad slots')}>
         <div class="ui2-squad-slots">
          {Array.from({length:maxTeamSlots},(_,idx)=>{
           const m=members[idx];
           return m?(
            <div class="ui2-squad-slot is-filled" key={idx}>
             <img src={resolveAvatarArt(m.character)} alt=""/>
             <span>{roleShort[m.role]}</span>
            </div>
           ):<div class="ui2-squad-slot is-empty" key={idx}><span>+</span></div>;
          })}
         </div>
         {view.office&&(
          <div class="ui2-squad-capacity">
           <span>{tr('电脑','Station')} <b>{stationUsed}/{view.office.capacity.work}</b></span>
           <span>{tr('会议','Meet')} <b>{meetingUsed}/{view.office.capacity.meeting}</b></span>
          </div>
         )}
        </div>

        {(()=>{
         const duoExplanation=explainTeamDuos?explainTeamDuos(job.id,draftObj):null;
         const teamActorIds=new Set(members.map(m=>m.character));
         const teamDuos=livingView&&duoExplanation?formatDuoEvaluations(duoExplanation,view,activeCatalog,teamActorIds):[];
         return teamDuos.length>0?(
          <div class="ui2-synergy-strip" aria-label={tr('搭档协同状态','Team duo synergies')}>
           {teamDuos.map(item=>{
            const story=experienceView&&duoExplanation
             ?experienceDuoCopy('unlocked-benefit',item.duo,experienceView,{explanation:duoExplanation,jobId:job.id,draftKey})
             :null;
            return (
             <span key={item.duo.id} class={`ui2-synergy-chip is-${item.state}`} data-duo-state={item.state}>
              <Icon name={item.state==='locked'?'lock':'link'}/>
              <b>{tr(item.duo.title,item.duo.titleEn)}</b>
              <em class="ui2-synergy-state">{tr(item.statusZh,item.statusEn)}</em>
              <small>{tr(item.reasonZh,item.reasonEn)}</small>
              {story&&story.lines.map((line,li)=>(
               <small key={li} class="ui2-duo-line"><b>{names[line.speaker]??line.speaker}:</b> “{english?line.en:line.zh}”</small>
              ))}
             </span>
            );
           })}
          </div>
         ):null;
        })()}

        {workBark&&(
         <div class="ui2-work-bark" role="status">
          <img src={resolveAvatarArt(workBark.actorId)} alt=""/>
          <span><b>{names[workBark.actorId]??workBark.actorId}:</b> “{workBark.text}”</span>
         </div>
        )}

        <p>{Object.entries(job.weights).filter(([,v])=>v>0).map(([k,v])=>`${skill(k as keyof typeof skillText)} ${Math.round(v*100)}%`).join(' · ')}</p>
        <fieldset class="assignment-team">
         <legend>{tr('派遣岗位与模式','Roles and deployment')}</legend>
         {view.actors.map(a=>{
          const role=team[a.id]?.role??'none',needsComputerSupport=!!view.office?.requirements.find(r=>r.actor===a.id)?.computerSupport||!!view.office?.computerTemplates.includes(job.template),inThisJob=job.team.some(m=>m.character===a.id);
          return <label class="team-row" key={a.id} data-selected-role={role!=='none'}>
           <span class="candidate">
            <Portrait id={a.id} variant="candidate"/>
            <span>
             <b>{names[a.id]}</b>
             <span class="ui2-skill-match">{topSkills.map(t=><em key={t.skill}>{skill(t.skill)} <b>{a.skills[t.skill]}</b></em>)}</span>
             <small>{tr('精力/负载','E/L')}: {a.energy}/{a.load} · {a.price}T/WP · {inThisJob?tr('本单在岗','On job'):a.busy?tr('占用','Busy'):tr('空闲','Free')}</small>
             {role!=='none'&&view.office&&<small>{needsComputerSupport||['worker','tool'].includes(role)?tr('电脑工位','Computer station'):tr('会议席','Meeting seat')}</small>}
            </span>
           </span>
           <select aria-label={`${names[a.id]} ${tr('岗位','role')}`} value={team[a.id]?.role??'none'} onChange={e=>{const nextRole=e.currentTarget.value as 'none'|Member['role'];updateTeam(prev=>({...prev,[a.id]:{role:nextRole,mode:prev[a.id]?.mode??'cloud'}}));if(nextRole!=='none')emitWorkBark(a.id,roleBarkKey[nextRole]);}}>{(['none','worker','planner','reviewer','tool'] as const).map((r,i)=><option key={r} value={r}>{tr(['不参与','执行者','负责人','审查者','工具人'][i]!,['Not assigned','Worker','Planner','Reviewer','Tool'][i]!)}</option>)}</select>
           <select aria-label={`${names[a.id]} ${tr('模式','mode')}`} value={team[a.id]?.mode??'cloud'} onChange={e=>updateTeam(prev=>({...prev,[a.id]:{role:prev[a.id]?.role??'none',mode:e.currentTarget.value as Member['mode']}}))}>{a.modes.map(mode=><option key={mode} value={mode}>{tr(mode==='cloud'?'云端':'本地',mode==='cloud'?'Cloud':'Local')}</option>)}</select>
          </label>;
         })}
        </fieldset>
       </section>

       <section class="work-result">
        <h3>{tr('实时预估','Live forecast')}</h3>
        {liveFit&&(
         <div class="ui2-fit-card" data-pass={liveFit.meetsPassFloor===null?'none':liveFit.meetsPassFloor?'ok':'risk'}>
          <b>{liveFit.headline}</b>
          {liveFit.detailLines.map((line,i)=><small key={i}>{line}</small>)}
          {liveFit.costNote&&<small class="ui2-fit-cost">{liveFit.costNote}</small>}
         </div>
        )}
        <p>{tr('本槽无事件资源上限估计（未加班的夜间为0）','Current-slot resource estimate, excluding events (zero at night without overtime)')}: {preview?.estimate?`${preview.estimate.cloud}T / ${preview.estimate.local} ${tr('本地','local')}`:'—'}</p>
        {job.status==='posted'&&members.length===0&&<p>{tr('接单后需安排至少一位执行者；也可现在先试选伙伴预览工期与预算。','Assign at least one worker after accepting, or try a team now to preview time and budget.')}</p>}
        {preview?.error&&!(job.status==='posted'&&members.length===0)&&(
         <div class="ui2-error-box">
          <p role="alert" class="assignment-error">{tr(...(messages[preview.error]??[preview.error,preview.error]))}</p>
          {stationError&&view.office&&(
           <button disabled={!canJumpOffice} onClick={()=>{if(canJumpOffice)onJumpToOffice?.(team);}}><Icon name="decor"/><span>{canJumpOffice?tr('前往布置补购并保留草稿 →','Arrange office (keep draft) →'):p.scene!=='workshop'?tr('先切回工作室才能布置','Return to workshop to arrange'):tr('当前锁定暂不可布置','Unavailable while locked')}</span></button>
          )}
          {stationError&&p.scene!=='workshop'&&onOpenMap&&<button onClick={onOpenMap}><Icon name="map"/><span>{tr('查看地图回工作室','Map to workshop')}</span></button>}
         </div>
        )}
        {cloudRisk&&onJumpToFinance&&(
         <div class="ui2-error-box">
          <button onClick={()=>onJumpToFinance(team)}><Icon name="bolt"/><span>{tr('前往算力补给并保留草稿 →','Compute & finance (keep draft) →')}</span></button>
         </div>
        )}
        {(capacityRisk||conditionRisk||lateRisk||(job.hidden>0&&job.status==='posted'))&&(
         <div class="ui2-remedies-box" aria-label={tr('当前风险补救入口','Remedies & adjustments')}>
          <b>{tr('可执行调整与补救入口（不会自动扣费）：','Actionable remedies (never spends automatically):')}</b>
          <div class="ui2-remedies-actions">
           {job.hidden>0&&job.status==='posted'&&(
            <button type="button" onClick={()=>{setWorkStep('brief');requestAnimationFrame(()=>workbenchRef.current?.querySelector<HTMLElement>('.work-brief')?.scrollIntoView({block:'start'}));}}>
             <Icon name="info"/><span>{tr(`先澄清剩余 ${job.hidden} 项需求`,`Clarify ${job.hidden} hidden needs`)}</span>
            </button>
           )}
           {capacityRisk&&canJumpOffice&&onJumpToOffice&&(
            <button type="button" onClick={()=>onJumpToOffice(team)}>
             <Icon name="decor"/><span>{tr('布置工作室扩容本地/工位 →','Arrange stations / racks →')}</span>
            </button>
           )}
           {conditionRisk&&onJumpToActor&&(members[0]?.character??view.actors[0]?.id)&&(
            <button type="button" onClick={()=>onJumpToActor(members[0]?.character??view.actors[0]!.id,team)}>
             <Icon name="cup"/><span>{tr('检查伙伴精力/负载与休整 →','Check teammate rest & load →')}</span>
            </button>
           )}
          </div>
         </div>
        )}
        {preview?.forecast&&<AssignmentForecast value={preview.forecast} english={english}/>}
       </section>
      </div>
     )}
    </div>
   </div>

   <footer class="work-confirm">
    {trackControl}
    {job.status==='posted'?(
     <>
      <span>{notice}<b>{tr('报酬','Reward')} ¥{job.reward} · {job.work} WP · {job.workSlots} {tr('工作时段','work periods')}</b>
       <small>{tr('队伍仅供试算；关闭后丢弃未提交草稿。','Team is a preview; closing discards the draft.')}</small>
       {clarificationWait(job,view.absoluteSlot)&&<small class="work-disabled-reason">{tr('刚澄清过，请等下一时段再接单或确认范围。','Just clarified: wait until the next period to accept or agree on scope.')}</small>}
      </span>
      <button disabled={locked} onClick={()=>{void send({type:'reject',job:job.id}).then(ok=>{if(ok)onRejected?.();});}}>{tr('拒绝','Decline')}</button>
      <button class="primary" disabled={locked||job.clarifyingUntil>view.absoluteSlot} onClick={()=>{void send({type:'accept',job:job.id}).then(ok=>{if(ok){focusTeam();onAccepted?.();}});}}>{tr('接取委托','Accept commission')}</button>
     </>
    ):workLayout==='tri'?(
     <>
      <span>{notice}<b>{members.length} {tr('位伙伴','teammates')}</b>
       <small>{preview?.error?tr(...(messages[preview.error]??[preview.error,preview.error])):tr('确认派遣后提交方案。','Confirm to submit this assignment.')}</small>
      </span>
      <button class="primary" disabled={locked||!!preview?.error} onClick={()=>{void send({type:'assign',job:job.id,team:members}).then(ok=>{if(ok){close();closePanel();}});}}>{tr('确认派遣','Assign team')}</button>
     </>
    ):(
     <>
      <span>{notice}<b>{job.status==='review'?tr('核对结算后交付','Check settlement before delivery'):job.status==='waiting'?tr('等待下一阶段','Waiting for the next phase'):tr('委托已结束','Commission closed')}</b></span>
      {job.status==='review'&&(
       <>
        <button disabled={locked||!job.settlement.canRework} onClick={()=>{void send({type:'rework',job:job.id}).then(ok=>{if(ok)focusTeam();});}}>{tr('返工','Rework')}</button>
        <button class="primary" disabled={locked||!job.settlement.canDeliver} onClick={()=>{void send({type:'deliver',job:job.id}).then(ok=>{if(ok){close();closePanel();}});}}>{job.settlement.tier==='fail'?tr('违约结案','Settle breach'):tr('验收结算','Deliver')}</button>
       </>
      )}
     </>
    )}
   </footer>
  </div>
 );
}
