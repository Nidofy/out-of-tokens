import type {GameView} from 'oot-platform';
import type {ActivityPreview,Condition,Fact,NextPeriodPreview} from 'oot-platform';
import {resolveReasonCopy} from './experience-ui-copy.js';
import {names} from './presentation.js';
import {sceneText} from './ui-labels.js';

export interface AdvanceInfo {
 label:string;
 subtitle:string;
 disabled:boolean;
 disabledReason:string|null;
 urgentReviewIds:string[];
}

export interface AdvanceFactRow {
 text:string;
 certainty:Fact['certainty'];
 conditions?:readonly Condition[];
}

export interface FormattedAdvanceInfo extends AdvanceInfo {
 slot:number;
 nextSlot:number;
 blocked:NextPeriodPreview['blocked'];
 nightNoOvertime:boolean;
 conditionalNote:string|null;
 working:AdvanceFactRow[];
 resting:AdvanceFactRow[];
 recoverySkipped:AdvanceFactRow[];
 waiting:AdvanceFactRow[];
 stops:AdvanceFactRow[];
 deadlines:AdvanceFactRow[];
 bills:AdvanceFactRow[];
}

function actorName(id:string|undefined):string{
 if(!id)return '';
 return names[id]??id;
}

function jobLabel(jobs:GameView['jobs'],id:string|undefined,english:boolean):string{
 if(!id)return '';
 const job=jobs.find(j=>j.id===id);
 if(!job)return id;
 return english?job.titleEn:job.title;
}

function toFactRow(fact:Fact,text:string):AdvanceFactRow{
 return fact.certainty==='conditional'
  ?{text,certainty:'conditional',conditions:fact.conditions}
  :{text,certainty:'certain'};
}

/** Formats GameSession.previewNextPeriod() into shared HUD / StageHub summary & popover lines without re-deriving rules. */
export function formatAdvanceDisplay(
 preview:NextPeriodPreview,
 busy:boolean,
 arranging:boolean,
 english:boolean,
 jobs:GameView['jobs']
):FormattedAdvanceInfo{
 const tr=(zh:string,en:string)=>english?en:zh;
 const isNightEnd=preview.slot%4===3;
 const label=isNightEnd?tr('迎来新一天','Start new day'):tr('下一时段','Next period');

 const reviewPendingIds=new Set(
  preview.waiting.filter(w=>w.reason==='review-pending'&&w.jobId).map(w=>w.jobId!)
 );
 const dueNowIds=new Set(
  preview.deadlines.filter(d=>d.reason==='due-this-slot'&&d.jobId).map(d=>d.jobId!)
 );
 const urgentReviewIds=jobs
  .filter(j=>reviewPendingIds.has(j.id)&&(dueNowIds.has(j.id)||j.deadline<=preview.slot))
  .map(j=>j.id);

 let disabled=false;
 let disabledReason:string|null=null;
 if(busy){
  disabled=true;
  disabledReason=tr('操作进行中','Operation in progress');
 }else if(arranging){
  disabled=true;
  disabledReason=resolveReasonCopy('arranging',english);
 }else if(preview.blocked){
  disabled=true;
  disabledReason=resolveReasonCopy(preview.blocked,english);
 }

 const working=preview.working.map(f=>{
  const who=actorName(f.actorId);
  const j=f.jobId?` · ${jobLabel(jobs,f.jobId,english)}`:'';
  return toFactRow(f,`${who}${j} · ${resolveReasonCopy(f.reason,english)}`);
 });

 const resting=preview.resting.map(f=>{
  const who=actorName(f.actorId);
  const amt=f.amount!==undefined?` (+${f.amount} ${tr('精力','E')})`:'';
  return toFactRow(f,`${who}${amt} · ${resolveReasonCopy(f.reason,english)}`);
 });

 const recoverySkipped=preview.recoverySkipped.map(f=>
  toFactRow(f,`${actorName(f.actorId)} · ${resolveReasonCopy(f.reason,english)}`)
 );

 const waiting=preview.waiting.map(f=>{
  const j=jobLabel(jobs,f.jobId,english);
  return toFactRow(f,j?`${j} · ${resolveReasonCopy(f.reason,english)}`:resolveReasonCopy(f.reason,english));
 });

 const stops=preview.stops.map(f=>{
  const who=actorName(f.actorId);
  const j=f.jobId?` (${jobLabel(jobs,f.jobId,english)})`:'';
  return toFactRow(f,`${who}${j} · ${resolveReasonCopy(f.reason,english)}`);
 });

 const deadlines=preview.deadlines.map(f=>
  toFactRow(f,`${jobLabel(jobs,f.jobId,english)} · ${resolveReasonCopy(f.reason,english)}`)
 );

 const bills=preview.bills.map(f=>{
  const amt=f.amount!==undefined?` ¥${f.amount.toFixed(0)}`:'';
  return toFactRow(f,`${resolveReasonCopy(f.reason,english)}${amt}`);
 });

 const allFacts:Fact[]=[
  ...preview.working,
  ...preview.resting,
  ...preview.recoverySkipped,
  ...preview.waiting,
  ...preview.stops,
  ...preview.deadlines,
  ...preview.bills
 ];
 const firstConditional=allFacts.find(f=>f.certainty==='conditional');
 const conditionalNote=firstConditional?.certainty==='conditional'
  ?resolveReasonCopy(firstConditional.conditions[0],english)
  :null;

 const nightNoOvertime=preview.slot%4>=2&&preview.working.length===0&&!preview.blocked;

 let subtitle:string;
 if(busy){
  subtitle=tr('正在处理操作…','Processing action…');
 }else if(arranging){
  subtitle=tr('先完成办公室布置','Finish office layout first');
 }else if(preview.blocked==='bankrupt'){
  subtitle=tr('工作室待重整','Studio requires restart');
 }else if(preview.blocked==='pending-choice'){
  subtitle=tr('待处理事件抉择','Resolve pending event');
 }else if(preview.blocked==='ending'){
  subtitle=tr('本周目已终局','Run completed');
 }else if(urgentReviewIds.length>0){
  subtitle=tr(`${urgentReviewIds.length} 单待验收且即将逾期`,`${urgentReviewIds.length} review due now`);
 }else if(preview.stops.length>0){
  subtitle=tr(`${preview.stops.length} 处算力预警停工`,`${preview.stops.length} capacity/quota stall`);
 }else if(reviewPendingIds.size>0){
  subtitle=tr(`${reviewPendingIds.size} 单待验收结算`,`${reviewPendingIds.size} ready for review`);
 }else if(preview.working.length>0){
  subtitle=tr(`${preview.working.length} 项执行推进中`,`${preview.working.length} active worker pass`);
 }else if(preview.slot%4>=2){
  subtitle=tr('晚间无加班 · 休整时段','Evening rest · no work');
 }else if(preview.waiting.length>0){
  subtitle=tr(`${preview.waiting.length} 项等待安排`,`${preview.waiting.length} waiting action`);
 }else{
  subtitle=tr('全员休整 · 可接单或安排','All idle · Ready for briefs');
 }

 return {
  label,
  subtitle,
  disabled,
  disabledReason,
  urgentReviewIds,
  slot:preview.slot,
  nextSlot:preview.nextSlot,
  blocked:preview.blocked,
  nightNoOvertime,
  conditionalNote,
  working,
  resting,
  recoverySkipped,
  waiting,
  stops,
  deadlines,
  bills
 };
}

export interface ActivityPreviewSummary {
 legal:boolean;
 errorText:string|null;
 tags:string[];
 compactText:string;
 occupiedSlots:number;
 skipsNightRecovery:boolean;
 joinsOvertime:boolean;
 relocatesTo:string|null;
}

function sceneLabel(scene:string,english:boolean):string{
 if(scene==='expedition')return english?'Expedition':'远征中';
 const entry=sceneText[scene as keyof typeof sceneText];
 return entry?entry[english?1:0]:scene;
}

/** Pure formatter over GameSession.previewActivity(Command) without local rule calculation. */
export function describeActivityPreview(preview:ActivityPreview,english:boolean):ActivityPreviewSummary{
 const tr=(zh:string,en:string)=>english?en:zh;
 const tags:string[]=[];
 if(preview.cash!==0)tags.push(`${preview.cash>0?'−':'+'}¥${Math.abs(preview.cash)}`);
 if(preview.research!==0)tags.push(`${preview.research>0?'−':'+'}${Math.abs(preview.research)} RP`);

 let maxOccupied=0;
 let skipsNight=false;
 let joinsOvertime=false;
 let relocatesTo:string|null=null;

 for(const a of preview.actors){
  if(a.occupiedSlots>maxOccupied)maxOccupied=a.occupiedSlots;
  if(a.skipsNightRecovery)skipsNight=true;
  if(a.joinsOvertime)joinsOvertime=true;
  if(a.relocatesTo&&!relocatesTo)relocatesTo=a.relocatesTo;
 }

 if(!preview.legal){
  const errMsg=preview.error?resolveReasonCopy(preview.error,english):tr('当前条件未满足','Action unavailable');
  return {
   legal:false,
   errorText:errMsg,
   tags,
   compactText:errMsg,
   occupiedSlots:maxOccupied,
   skipsNightRecovery:skipsNight,
   joinsOvertime,
   relocatesTo
  };
 }

 const firstOccupied=preview.actors.find(a=>a.occupiedSlots>0);
 if(firstOccupied){
  tags.push(
   firstOccupied.occupiesUntil!==null
    ?tr(`占用 ${firstOccupied.occupiedSlots} 时段（至槽位 ${firstOccupied.occupiesUntil}）`,`Occupies ${firstOccupied.occupiedSlots} slots (until slot ${firstOccupied.occupiesUntil})`)
    :tr(`占用 ${firstOccupied.occupiedSlots} 时段`,`Occupies ${firstOccupied.occupiedSlots} slots`)
  );
 }else if(joinsOvertime){
  tags.push(tr('加入本槽夜间加班','Joins overtime this slot'));
 }else{
  tags.push(tr('0 槽 · 不占用个人时段','0 slots · Free action'));
 }

 if(relocatesTo){
  const dest=sceneLabel(relocatesTo,english);
  tags.push(tr(`移至${dest}`,`Moves to ${dest}`));
 }

 if(skipsNight){
  tags.push(resolveReasonCopy('sleep-skipped-by-activity',english));
 }

 for(const g of preview.gains){
  if(g.unit&&g.amount!==undefined){
   const uLabel=g.unit==='energy'?tr('精力','Energy'):g.unit==='mood'?tr('心情','Mood'):g.unit==='affinity'?tr('好感','Affinity'):g.unit;
   tags.push(`${uLabel} +${g.amount}`);
  }
 }
 for(const l of preview.losses){
  if(l.unit&&l.amount!==undefined){
   const uLabel=l.unit==='energy'?tr('精力','Energy'):l.unit==='mood'?tr('心情','Mood'):l.unit==='affinity'?tr('好感','Affinity'):l.unit;
   tags.push(`${uLabel} −${l.amount}`);
  }
 }

 return {
  legal:true,
  errorText:null,
  tags,
  compactText:tags.join(' · '),
  occupiedSlots:maxOccupied,
  skipsNightRecovery:skipsNight,
  joinsOvertime,
  relocatesTo
 };
}

export function actorStopKindFromPreview(stops:NextPeriodPreview['stops']|undefined,actorId:string):'cloud'|'local'|null{
 const stop=stops?.find(s=>s.actorId===actorId);
 if(!stop)return null;
 return stop.reason==='local-capacity'?'local':'cloud';
}
