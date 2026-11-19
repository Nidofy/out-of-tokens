import type {Member} from 'oot-core';
import type {GameSession,GameView} from 'oot-platform';
import type {UiSaveStatus} from './save-status-ui.js';
import {topJobSkillWeights} from './ui2-logic.js';
import {skillText} from './ui-labels.js';
import {names} from './presentation.js';

export type SwitchTargetKind='load'|'import'|'restart';

const REASON_MAP:Record<string,readonly [string,string]>={
 'contract-work':['执行合同工作','Working on commission'],
 'overtime':['夜间加班推进','Night overtime work'],
 'idle-recover':['空闲常规休整（精力 +15）','Idle rest recovery (+15 energy)'],
 'night-sleep':['深夜睡眠恢复（精力回升、负载清零）','Night sleep recovery (energy up, load cleared)'],
 'sleep-skipped-by-activity':['占用深夜时段，将跳过今晚睡眠与负载恢复','Night period occupied; skips sleep & load reset'],
 'next-work-slot':['等待下一个白天工作时段','Waiting for next daytime work slot'],
 'clarify-pending':['需求澄清占用中，需等待下个时段','Clarification pending until next period'],
 'review-pending':['阶段工作已完成，等待验收结算','Work complete; awaiting delivery review'],
 'cloud-quota':['云端算力额度不足，本槽可能停工','Cloud quota insufficient; may stall this period'],
 'local-capacity':['本地单槽算力上限不足，本槽可能停工','Local slot capacity exceeded; may stall'],
 'due-this-slot':['本时段截止，不处理将逾期或违约','Due this period; advancing risks breach'],
 'due-next-day':['次日截止，注意预留审查与交付窗口','Due next day; reserve review window'],
 'weekly-bill':['即将触发周结（房租、订阅与本地电费）','Upcoming weekly bill (rent, subscription, electricity)'],
 'debt-due':['第 14 天旧债结算到期','Inherited debt settlement due on Day 14'],
 'electricity':['累计本地算力待结电费','Pending local-compute electricity charge'],
 'pending-choice':['有待决策事件，必须先选择才能推进','Pending event choice must be resolved first'],
 bankrupt:['工作室处于破产状态，请重开或读档','Studio bankrupt; restart or load a save'],
 ending:['本周目已终局，可开启无尽经营或读档','Run completed; enter endless mode or load a save'],
 arranging:['正在布置办公室，请先保存或取消布局','Arranging office; save or cancel layout first'],
 'no-event-interference':['前提：未触发随机事件干扰','Assumes no random event interference'],
 'resources-available':['前提：推进时云端额度与本地算力充足','Assumes sufficient cloud & local capacity'],
 'no-new-defects':['前提：未产生新增缺陷或隐藏扣分','Assumes no new defects or hidden penalties'],
 'personal-condition-unchanged':['前提：伙伴精力、心情与负载条件不变','Assumes teammate energy, mood & load stay unchanged'],
 'external-change':['另一窗口更新了存档，自动保存已暂停。请导出或载入最新档。','Another tab updated saves. Autosave paused; export or load the latest save.'],
 conflict:['存档版本冲突，自动保存已暂停以防覆盖。请导出或载入最新档。','Save conflict detected. Autosave paused to prevent overwrite; export or load the latest save.'],
 'auto-paused':['自动保存已暂停，请先导出当前进度或载入存档。','Autosave paused; export current progress or load a save.'],
 STORAGE_UNAVAILABLE:['本地存储不可用，进度仅保存在当前内存，请及时导出。','Storage unavailable. Progress is in-memory only; export to keep it.'],
 STORAGE_BLOCKED:['浏览器存储被拦截，进度仅在内存中保留，请导出备份。','Storage blocked. Progress remains in memory; export to back up.'],
 IMPORTED_NO_STORAGE:['已载入但尚未保存（存储不可用，请用导出保存进度）','Loaded, not saved (storage unavailable; use Export)'],
 SAVE_CONFLICT:['存档已被更新，请导出或载入最新档后再继续。','Save changed elsewhere. Export or load the latest save to resume.'],
 WRITE_UNCERTAIN:['上次宿主写入状态未知，请先载入最新档核对或导出当前进度。','Host write outcome unknown. Load latest to reconcile or export progress.'],
 INCOMPATIBLE_SAVE:['检测到旧版不兼容自动档，为防覆盖已暂停自动写入；可导出当前进度，或在存档面板手动保存覆盖。','Incompatible existing autosave detected; autosave paused to avoid overwriting it. Export current progress or manually save over a slot.'],
 HASH_MISMATCH:['自动档校验不一致，已暂停自动写入；可导出当前进度或在存档面板恢复。','Save integrity mismatch; autosave paused. Export current progress or recover from Saves.'],
 BAD_JSON:['存档数据损坏，已暂停自动写入；可导出当前进度或在存档面板恢复。','Corrupted save JSON; autosave paused. Export current progress or recover from Saves.'],
 STORAGE_WRITE_FAILED:['写入本地存储失败，进度仍保留在内存中；可点击重试或导出备份。','Local storage write failed; progress remains in memory. Retry save or export a backup.'],
 'activity-energy':['伙伴精力变化','Partner energy change'],
 'activity-mood':['伙伴心情变化','Partner mood change'],
 'activity-affinity':['伙伴好感度变化','Partner affinity change'],
 ACTIVITY_NOT_SUPPORTED:['该命令属于结算或切换边界，不支持活动预览。','Settlement or switch command does not support activity preview.'],
 SESSION_SWITCHING:['正在切换会话，请稍候再操作。','Session switch in progress; wait a moment before sending commands.'],
 SWITCH_REQUIRES_CONFIRMATION:['存在未保存或异常状态，须先确认后再切换存档。','Confirm discarding or exporting unsaved progress before switching saves.'],
 INVALID_CHECKPOINT_PREFIX:['检查点回放前缀异常，已保留当前进度并暂停本次写入。','Invalid checkpoint replay prefix; current state kept intact.'],
 LINEAGE_RESET:['宿主存档来源已重置，本局提示与未读状态将按新会话记录。','Host save lineage reset; UI unread and onboarding flags start fresh for this run.'],
 'choose-commission':['阅读需求权重与验收线，选择合适委托并接单','Read brief weights and pass line, then accept a commission'],
 'assign-team':['为已接委托安排执行者与部署模式','Assign workers and deployment mode to an accepted commission'],
 'advance-period':['推进时段开始本阶段工作与日常结算','Advance period to execute scheduled work and settlement'],
 'review-delivery':['质量已达待验收状态，核对扣分与报酬后交付','Review quality breakdown and payout before delivering'],
 'resolve-pending-choice':['先作出当前事件抉择再继续推进','Resolve the pending event choice before advancing'],
 'view-ending':['本周目已达成终局，可查看手账结局或开启无尽经营','Run completed; inspect the ending in Journal or enter endless mode'],
 'restart-workshop':['工作室已触发破产底线，可继承创始人经验重开或读档','Studio hit bankruptcy floor; restart with founder XP or load a save'],
 'delivery-rework':['本次选择返工重整，尚未结案','Sent back for rework before final delivery'],
 'delivery-passed':['达到质量验收线，本阶段顺利通过','Met pass line; delivery phase accepted'],
 'delivery-failed':['未达合同约定或已违约结案','Below brief bar or settled as breach'],
 'contributed-worker':['担任执行者直接推进工量','Executed phase workload as worker'],
 'contributed-planner':['担任负责人统筹拆解提效','Coordinated phase as planner'],
 'contributed-reviewer':['担任审查者把关质量减少缺陷','Reviewed quality to reduce defects'],
 'contributed-tool':['担任工具人提供辅助支持','Provided tool-calling support'],
 'delivery-cash':['本阶段实际交付现金净结算','Actual net cash settled for this phase'],
 'low-cash-cost':['现金与新增预算支出较低','Lower additional cash & compute budget'],
 'low-quota':['节省云端算力额度','Lower cloud quota consumption'],
 'high-quality':['条件质量预估更稳健，包含较高匹配或审查余量','Stronger conditional quality margin or review coverage'],
 'fast-completion':['预计完成时段更短，优先赶交期','Faster projected completion window'],
 'clarify-only':['仅作用于需求澄清，不提供工单执行加成','Clarification bonus only; no execution bonus'],
 'mode-mismatch':['需两位搭档切换至指定部署模式后生效','Requires both partners in the specified deployment mode'],
 'category-mismatch':['仅在指定类别的委托中生效','Applies only to matching commission categories'],
 'morning-only':['仅在上午时段工作时生效','Applies during Morning periods only'],
 'multi-phase-only':['仅在多期或长期维护合同中生效','Applies to multi-phase or retainer contracts only'],
 'not-unlocked':['搭档默契尚未召开茶会解锁','Duo synergy not unlocked via tea yet'],
 'no-feasible-team':['当前在岗人手或约束下暂无可承诺方案','No feasible team satisfies constraints with current roster'],
 'save-resources':['节省资源与即时额度','Saves quota & immediate cash'],
 'stable-quality':['条件质量预计更高更稳','Higher conditional quality'],
 'fast-delivery':['预计更快完成本阶段','Faster projected completion'],
 'projected-cloud':['阶段预计云端额度消耗','Projected phase cloud quota'],
 'projected-local':['阶段预计本地算力消耗','Projected phase local compute'],
 'immediate-quota-cash':['本槽预计补购额度现金缺口','Immediate quota shortfall cash'],
 'below-quality-line':['条件质量下限低于本单验收线','Quality floor below pass line'],
 'no-legal-team':['当前约束与在岗人手下暂无可执行团队，可调整工位、休整或先澄清需求','No legal team under current roster or constraints; adjust stations, rest, or clarify first'],
 UNKNOWN_JOB:['当前委托不存在或已离开面板','Commission not found'],
 'duo-locked':['尚未通过搭档茶会解锁','Not yet unlocked via duo tea'],
 'duo-clarification-only':['仅作用于需求澄清，不提供工单执行加成','Clarification only; no job execution bonus'],
 'duo-active':['搭档默契条件已满足并生效','Duo synergy conditions met and active'],
 'duo-team-missing':['需两位搭档同时编入草稿团队','Both partners required in draft team'],
 'duo-mode-mismatch':['需两位搭档切换至指定相同部署模式','Requires both partners in the matching deployment mode'],
 'duo-conditions-unmet':['当前委托类别、合同类型或时段未满足生效条件','Commission category, contract type, or period conditions not met'],
 'next-weekly-base':['下周基础账单（房租、订阅与在贷利息）','Upcoming weekly base bill (rent, subscription, loan interest)'],
 'accrued-electricity':['累计本地算力待结电费','Accrued local-compute electricity'],
 'unpaid-inherited-debt':['第 14 天待结遗留债务本金','Unpaid inherited debt due on Day 14']
};

export function resolveReasonCopy(code:string,english:boolean):string{
 const known=REASON_MAP[code];
 if(known)return known[english?1:0];
 return english?`Status note (code: ${code})`:`状态提示（代码：${code}）`;
}

export function saveStatusPillText(status:UiSaveStatus,english:boolean):string{
 const tr=(zh:string,en:string)=>english?en:zh;
 switch(status.kind){
  case 'idle':
  case 'saved':
   return tr('已保存','Saved');
  case 'dirty':
   return tr('待保存…','Queued…');
  case 'saving':
   return tr('保存中…','Saving…');
  case 'paused':
   return tr('保存暂停','Save paused');
  case 'error':
   return tr('保存失败','Save error');
  case 'imported-unsaved':
   return tr('已载入但尚未保存','Loaded · unsaved');
 }
}

export function saveAlertBannerCopy(status:UiSaveStatus,english:boolean):{title:string;detail:string;canRetry:boolean}|null{
 const tr=(zh:string,en:string)=>english?en:zh;
 if(status.kind==='paused'){
  const causeCode=status.cause==='external-change'?'external-change':status.cause==='conflict'?'conflict':'auto-paused';
  return {
   title:tr('自动保存已暂停（保留当前内存进度）','Autosave paused (in-memory progress kept)'),
   detail:resolveReasonCopy(causeCode,english),
   canRetry:false
  };
 }
 if(status.kind==='imported-unsaved'){
  return {
   title:tr('已载入但尚未保存','Loaded, not saved'),
   detail:status.storageUnavailable
    ?resolveReasonCopy('IMPORTED_NO_STORAGE',english)
    :tr('文件已载入内存，尚未写入自动档；请手动保存或推进至跨日自动保存。','Save loaded in memory, not written to autosave yet; save manually or advance to day end.'),
   canRetry:false
  };
 }
 if(status.kind==='error'){
  return {
   title:tr('自动保存写入失败（业务操作未丢失）','Autosave write failed (progress intact in memory)'),
   detail:status.code?resolveReasonCopy(status.code,english):resolveReasonCopy('STORAGE_UNAVAILABLE',english),
   canRetry:!status.storageUnavailable
  };
 }
 return null;
}

export function switchConfirmCopy(
 targetKind:SwitchTargetKind,
 targetLabel:string,
 reason:'paused'|'error'|'storage-unavailable',
 english:boolean
){
 const tr=(zh:string,en:string)=>english?en:zh;
 const actionName=targetKind==='load'?tr(`载入「${targetLabel}」`,`load "${targetLabel}"`):targetKind==='import'?tr(`导入「${targetLabel}」`,`import "${targetLabel}"`):tr('继承经验重开','restart with founder experience');
 return {
  title:tr('未保存进度切换确认','Confirm switching with unsaved progress'),
  warning:tr('当前内存进度尚未保存，将被所选存档替换。','Current in-memory progress is not saved and will be replaced by the selected save.'),
  reasonNote:reason==='storage-unavailable'
   ?tr(`存储当前不可用，无法在切换前自动落盘；确定要继续${actionName}吗？`,`Storage is unavailable so progress cannot be flushed first. Proceed to ${actionName}?`)
   :tr(`自动保存当前处于暂停或失败状态，无法安全排空队列；确定要放弃内存进度并${actionName}吗？`,`Autosave is paused or failing so the queue cannot drain safely. Discard in-memory progress and ${actionName}?`),
  exportBtn:tr('导出当前进度','Export current progress'),
  exportedHint:tr('已导出当前内存存档，现在可放心决定是否切换。','Current in-memory save exported.'),
  confirmBtn:tr('放弃未存进度并切换','Discard unsaved & switch'),
  cancelBtn:tr('取消（保留当前进度）','Cancel (keep current)')
 };
}

export function backupPolicyCopy(english:boolean,hosted=false){
 const tr=(zh:string,en:string)=>english?en:zh;
 if(hosted){
  return {
   summaryTitle:tr('备份档（宿主端最近 5 次保存）','Backups (Last 5 host saves)'),
   summaryHint:tr(
    '宿主端由服务端保存接口自动保留最近 5 次自动档副本（含冲突保护）。',
    'The host save service keeps the last 5 autosave revisions server-side with conflict checks.'
   ),
   dialogIntro:tr(
    '3 个手动档、1 个自动档、宿主端最近 5 次保存备份；冲突会拒绝覆盖。旧版本存档须用原版本打开。',
    '3 manual slots, 1 autosave, and last 5 host save backups. Conflicts refuse overwrite. Older saves need their original version.'
   )
  };
 }
 return {
  summaryTitle:tr('备份档（最近 5 个跨日/边界节点）','Backups (Last 5 boundary nodes)'),
  summaryHint:tr(
   '仅在跨日（DayEnd）、重开、导入或手动读档时轮转保留最近 5 个边界节点；普通操作检查点只更新自动档。',
   'Rotates only at DayEnd, Restart, Import, or Manual Load (keeps last 5 boundary nodes); regular command checkpoints update autosave only.'
  ),
  dialogIntro:tr(
   '3 个手动档、1 个自动档、最近 5 个跨日/边界节点备份；冲突会拒绝覆盖。旧版本存档须用原版本打开。',
   '3 manual slots, 1 autosave, and 5 recent day-end/boundary backups. Conflicts refuse overwrite. Older saves need their original version.'
  )
 };
}

export function messengerStatusCopy(english:boolean){
 const tr=(zh:string,en:string)=>english?en:zh;
 return {
  streamRule:tr(
   '0 槽免费群聊：进入正文即消未读；可先离开，稍后随时回来回复一次（+2 好感 / +3 心情）',
   '0-slot free chat: reading clears the unread badge; reply anytime later once (+2 Aff / +3 Mood)'
  ),
  unreadBadge:tr('未读 · 可回复 +2 好感','Unread · Reply +2 Aff'),
  readPendingBadge:tr('已读 · 可稍后回复','Read · Reply anytime'),
  repliedBadge:tr('已回复','Replied'),
  promptSelect:tr('点击左侧话题进入正文；阅读本身不消耗时段，也不会自动领奖。','Select a topic on the left to read; opening never consumes a period or auto-claims rewards.')
 };
}

export interface LiveTeamFitExplanation {
 hasTeam:boolean;
 passLine:number;
 qualityRange:[number,number]|null;
 meetsPassFloor:boolean|null;
 headline:string;
 detailLines:string[];
 costNote:string|null;
}

type PreviewOutcome=ReturnType<GameSession['previewAssignment']>;

export function explainLiveTeamFit(
 view:GameView,
 job:GameView['jobs'][number],
 members:readonly Member[],
 preview:PreviewOutcome|null,
 english:boolean
):LiveTeamFitExplanation{
 const tr=(zh:string,en:string)=>english?en:zh;
 const topSkills=topJobSkillWeights(job.weights,2);
 const skillLabel=(id:keyof typeof skillText)=>skillText[id][english?1:0];
 const focusWeightsText=topSkills.map(t=>`${skillLabel(t.skill)} ${t.pct}%`).join(' + ');

 if(members.length===0){
  return {
   hasTeam:false,
   passLine:job.passQuality,
   qualityRange:null,
   meetsPassFloor:null,
   headline:tr(
    `验收线 ≥ ${job.passQuality} · 重点看 ${focusWeightsText||'综合能力'}`,
    `Pass line >= ${job.passQuality} · Focus on ${focusWeightsText||'key skills'}`
   ),
   detailLines:[
    tr(
     `先选人试配：不同伙伴在 ${focusWeightsText||'本单权重'} 与算力单价（T/WP）上各有擅长，右侧会实时给出工期、预算与条件质量区间。`,
     `Pick a trial team: teammates differ in ${focusWeightsText||'weighted skills'} and token cost (T/WP); live duration, budget and conditional quality appear on the right.`
    )
   ],
   costNote:null
  };
 }

 const forecast=preview?.forecast??null;
 const rawQ=forecast?.quality;
 const qualityRange:[number,number]|null=rawQ&&rawQ.length>=2&&rawQ[0]!==undefined&&rawQ[1]!==undefined?[rawQ[0],rawQ[1]]:null;
 const meetsPassFloor=qualityRange?qualityRange[0]>=job.passQuality:null;
 const memberNames=members.map(m=>names[m.character]??m.character).join(' + ');

 const detailLines:string[]=[];
 for(const m of members){
  const actor=view.actors.find(a=>a.id===m.character);
  if(!actor)continue;
  const skillSummary=topSkills.map(t=>`${skillLabel(t.skill)} ${actor.skills[t.skill]}`).join(' / ');
  detailLines.push(
   tr(
    `${names[actor.id]??actor.id}（${m.role==='worker'?'执行':m.role==='reviewer'?'审查':m.role==='planner'?'负责':'工具'} · ${m.mode==='cloud'?'云端':'本地'}）：${skillSummary}，单价 ${actor.price} T/WP`,
    `${names[actor.id]??actor.id} (${m.role} · ${m.mode}): ${skillSummary}, ${actor.price} T/WP`
   )
  );
 }

 let headline:string;
 if(preview?.error){
  headline=tr(`${memberNames}：当前配置不可派遣`,`${memberNames}: configuration cannot be assigned`);
 }else if(qualityRange){
  const [qMin,qMax]=qualityRange;
  if(qMin>=job.passQuality){
   headline=tr(
    `${memberNames}：条件质量 ${qMin}–${qMax}（下限已达验收线 ≥ ${job.passQuality}）`,
    `${memberNames}: conditional quality ${qMin}–${qMax} (floor meets pass line >= ${job.passQuality})`
   );
  }else if(qMax>=job.passQuality){
   headline=tr(
    `${memberNames}：条件质量 ${qMin}–${qMax}（下限低于验收线 ${job.passQuality}，存在不达标风险）`,
    `${memberNames}: conditional quality ${qMin}–${qMax} (floor below pass line ${job.passQuality}; risk of missing target)`
   );
  }else{
   headline=tr(
    `${memberNames}：条件质量 ${qMin}–${qMax}（低于验收线 ${job.passQuality}，建议换人或加审查）`,
    `${memberNames}: conditional quality ${qMin}–${qMax} (below pass line ${job.passQuality}; swap or add review)`
   );
  }
 }else{
  headline=tr(`${memberNames}：当前条件下暂无完整预估`,`${memberNames}: no complete forecast under current conditions`);
 }

 let costNote:string|null=null;
 if(forecast){
  const onTime=forecast.workSlots<=job.workSlots;
  costNote=tr(
   `预计占用 ${forecast.workSlots}/${job.workSlots} 个工作时段 · 预算 ${forecast.cloud}T / ${forecast.local} 本地算力${onTime?'':'（可能超窗口）'}`,
   `Projected ${forecast.workSlots}/${job.workSlots} work periods · ${forecast.cloud}T / ${forecast.local} local${onTime?'':' (may miss window)'}`
  );
 }

 return {
  hasTeam:true,
  passLine:job.passQuality,
  qualityRange,
  meetsPassFloor,
  headline,
  detailLines,
  costNote
 };
}

export function buildSampleTeamDraft(
 view:GameView,
 job:GameView['jobs'][number],
 previewAssignment:GameSession['previewAssignment']
):Member[]|null{
 const freeActors=view.actors.filter(a=>!a.busy&&a.location!=='expedition');
 const candidates:Member[][]=[];
 // 1) Single workers sorted by cheapest cloud/local fit so caller compares dynamically via real previewAssignment
 for(const a of freeActors){
  const mode=a.modes.includes('cloud')?'cloud':a.modes[0]!;
  candidates.push([{character:a.id,role:'worker',mode}]);
 }
 // 2) Worker + reviewer pairs if single worker cannot meet pass line or needs review margin
 for(const w of freeActors){
  for(const r of freeActors){
   if(w.id===r.id)continue;
   const wm=w.modes.includes('cloud')?'cloud':w.modes[0]!;
   const rm=r.modes.includes('cloud')?'cloud':r.modes[0]!;
   candidates.push([{character:w.id,role:'worker',mode:wm},{character:r.id,role:'reviewer',mode:rm}]);
  }
 }

 let bestPassing: {team:Member[];cloud:number;slots:number;qMin:number}|null=null;
 let bestFallback:{team:Member[];qMax:number;slots:number}|null=null;

 for(const team of candidates){
  const res=previewAssignment(job.id,team);
  if(res.error||!res.forecast)continue;
  const f=res.forecast;
  if(f.risks.noProgress||f.risks.capacity)continue;
  const q=f.quality;
  const qMin=q?.[0],qMax=q?.[1];
  if(qMin!==undefined&&qMin>=job.passQuality&&!f.risks.late&&!f.risks.cloud){
   if(!bestPassing||team.length<bestPassing.team.length||(team.length===bestPassing.team.length&&(f.cloud<bestPassing.cloud||(f.cloud===bestPassing.cloud&&qMin>bestPassing.qMin)))){
    bestPassing={team,cloud:f.cloud,slots:f.workSlots,qMin};
   }
  }
  if(!bestFallback||(qMax??0)>bestFallback.qMax){
   bestFallback={team,qMax:qMax??0,slots:f.workSlots};
  }
 }

 return bestPassing?.team??bestFallback?.team??null;
}

export function financeNetSolvencyNote(english:boolean):string{
 return english
  ?'Net solvency = cash - loan - unfinished advances. Some cash comes from unfinished contracts and is not earned profit yet.'
  :'净偿付资金 = 账面现金 − 贷款 − 未完成订单预付款；账户里部分现金来自未完成订单，暂不能都当作赚到的钱。';
}

export function lineageResetNoticeCopy(english:boolean):string{
 return resolveReasonCopy('LINEAGE_RESET',english);
}
