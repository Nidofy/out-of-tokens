import {useEffect,useRef,useState} from 'preact/hooks';
import type {ExperienceView,GameView} from 'oot-platform';
import {artSlotForJobTemplate,findLatestJobReceipt} from './experience-adapter.js';
import {ExperienceArtSlot} from './experience-art-slot.js';
import {experienceDuoCopy,experienceReceiptCopy} from './experience-copy.js';
import {Dialog} from './dialog.js';
import {Icon} from './icons.js';
import {clientAssetSrc,resolveClientPersona} from './living-adapter.js';
import type {ClientPersonaDef,LivingContent,LivingView} from './living-adapter.js';
import {names} from './presentation.js';

export interface DeliveryDuoStageNote {
 duoId:string;
 titleZh:string;
 titleEn:string;
 lines:{speaker:string;zh:string;en:string}[];
}

export type ReceiptAssessment=NonNullable<ExperienceView['receipts'][number]['assessment']>;

export interface DeliveryFeedbackPayload {
 job:GameView['jobs'][number];
 assessment:ReceiptAssessment|null;
 cashDelta:number;
 action:'deliver'|'rework';
 outcome:'passed'|'rework'|'failed';
 persona?:ClientPersonaDef|undefined;
 receipt?:ExperienceView['receipts'][number]|undefined;
 duoStages:DeliveryDuoStageNote[];
}

export function buildDeliveryFeedbackPayload(
 beforeCash:number,
 afterView:GameView,
 expView:ExperienceView,
 livingCatalog:LivingContent,
 livingView:LivingView,
 jobId:string,
 action:'deliver'|'rework'
):DeliveryFeedbackPayload|null{
 const rawJob=afterView.jobs.find(j=>j.id===jobId);
 if(!rawJob)return null;
 const receipt=findLatestJobReceipt(expView.receipts,jobId);
 const assessment:ReceiptAssessment|null=receipt?.assessment
  ?{
    quality:receipt.assessment.quality,
    passQuality:receipt.assessment.passQuality,
    qualityLines:[...receipt.assessment.qualityLines] as typeof rawJob.qualityLines,
    qualityBreakdown:{...receipt.assessment.qualityBreakdown}
   }
  :null;
 // Multi-phase deliver and rework reset afterView.jobs[]; bind display fields to pre-command receipt.assessment.
 const job:GameView['jobs'][number]=assessment
  ?{
    ...rawJob,
    quality:assessment.quality,
    passQuality:assessment.passQuality,
    qualityLines:assessment.qualityLines,
    qualityBreakdown:assessment.qualityBreakdown
   }
  :rawJob;
 const hasPassed=!!receipt?.facts.some(f=>f.certainty==='certain'&&f.reason==='delivery-passed');
 const hasRework=action==='rework'||!!receipt?.facts.some(f=>f.certainty==='certain'&&f.reason==='delivery-rework');
 const outcome:DeliveryFeedbackPayload['outcome']=hasRework?'rework':(hasPassed||rawJob.status==='delivered'||rawJob.status==='waiting')?'passed':'failed';
 const receiptCopy=experienceReceiptCopy(receipt,job);
 const duoStages:DeliveryDuoStageNote[]=[];
 if(outcome==='passed'){
  for(const duo of livingView.duos){
   if(!duo.actors.every(id=>receiptCopy.participants.includes(id)))continue;
   const copy=experienceDuoCopy('first-shared-delivery',duo,expView,{jobs:afterView.jobs});
   if(copy.lines.length>0){
    duoStages.push({
     duoId:duo.id,
     titleZh:duo.title,
     titleEn:duo.titleEn,
     lines:copy.lines
    });
   }
  }
 }
 return {
  job,
  assessment,
  cashDelta:afterView.cash-beforeCash,
  action,
  outcome,
  persona:resolveClientPersona(livingCatalog,job),
  receipt,
  duoStages
 };
}

function prefersReducedMotionNow():boolean{
 if(typeof window==='undefined'||typeof window.matchMedia!=='function')return false;
 return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function DeliveryFeedbackModal({
 payload,
 english,
 still,
 returnFocus,
 close
}:{
 payload:DeliveryFeedbackPayload;
 english:boolean;
 still:boolean;
 returnFocus?:()=>HTMLElement|null;
 close:()=>void;
}){
 const tr=(zh:string,en:string)=>english?en:zh;
 const instantStatic=still||prefersReducedMotionNow();
 const [revealedStep,setRevealedStep]=useState<number>(instantStatic?4:1);
 const continueBtnRef=useRef<HTMLButtonElement>(null);

 useEffect(()=>{
  if(instantStatic){
   setRevealedStep(4);
   return;
  }
  setRevealedStep(1);
  const t2=setTimeout(()=>setRevealedStep(s=>Math.max(s,2)),220);
  const t3=setTimeout(()=>setRevealedStep(s=>Math.max(s,3)),440);
  const t4=setTimeout(()=>setRevealedStep(4),660);
  return()=>{
   clearTimeout(t2);
   clearTimeout(t3);
   clearTimeout(t4);
  };
 },[payload,instantStatic]);

 const {job,assessment,cashDelta,action,outcome,persona,receipt,duoStages}=payload;
 const receiptCopy=experienceReceiptCopy(receipt,job);
 const slotId=artSlotForJobTemplate(job.template);
 const gradeTier:'excellent'|'good'|'pass'|'fail'=outcome==='rework'||outcome==='failed'
  ?'fail'
  :assessment===null
   ?'pass'
   :assessment.quality>=(assessment.qualityLines[2]??90)
    ?'excellent'
    :assessment.quality>=(assessment.qualityLines[1]??75)
     ?'good'
     :'pass';
 const outcomeTitle=outcome==='rework'
  ?tr('进入返工修正','Returned for rework')
  :outcome==='failed'
   ?tr('未通过验收（违约结案）','Not accepted (contract breached)')
   :gradeTier==='excellent'
    ?tr('出色交付 · 验收通过','Excellent delivery · Accepted')
    :gradeTier==='good'
     ?tr('优良交付 · 验收通过','Good delivery · Accepted')
     :tr('验收通过 · 阶段交付完成','Delivery accepted');
 const scoreSummaryText=assessment!==null
  ?tr(`质量评分 ${assessment.quality} / 验收线 ${assessment.passQuality}`,`Quality ${assessment.quality} / Pass line ${assessment.passQuality}`)
  :tr('本阶段评分快照未单独记录','Phase score snapshot not separately recorded');
 const breakdownSummaryText=assessment!==null
  ?`${tr('质量评分','Quality')} ${assessment.quality}（${tr('及格线','Pass')} ${assessment.passQuality}） · ${tr('未澄清扣分','Hidden penalty')} −${assessment.qualityBreakdown.hiddenPenalty} · ${tr('缺陷扣分','Defect penalty')} −${assessment.qualityBreakdown.defectPenalty}`
  :tr('该条回执未附带独立评分明细，此处不代填后续阶段数值。','No separate assessment snapshot was attached to this receipt.');
 const cashSigned=`${cashDelta>=0?'+':'−'}¥${Math.abs(cashDelta).toFixed(2)}`;
 const avatarSrc=persona?clientAssetSrc(persona.id):null;

 return (
  <Dialog
   system
   className="ui2-delivery-dialog"
   title={english?job.titleEn:job.title}
   close={close}
   {...(returnFocus?{returnFocus}:{})}
  >
   <div class="ui2-delivery-flow" data-still={instantStatic?'true':'false'} data-revealed={revealedStep}>
    <section class="ui2-delivery-step" data-feedback-step="result" data-revealed={revealedStep>=1?'true':'false'}>
     <span class="ui2-step-index">{tr('1. 交付结果','1. Result')}</span>
     <ExperienceArtSlot
      slotId={slotId}
      variant="outcome"
      english={english}
      state={outcome==='passed'?'delivered':'neutral'}
      badgeText={outcome==='passed'?tr('交付完成','Delivered'):outcome==='rework'?tr('返工阶段','Rework'):tr('未通过','Failed')}
      title={outcomeTitle}
      subtitle={scoreSummaryText}
     />
    </section>

    <section class="ui2-delivery-step" data-feedback-step="reason" data-revealed={revealedStep>=2?'true':'false'}>
     <span class="ui2-step-index">{tr('2. 成因说明','2. Reason')}</span>
     <p class="ui2-delivery-prose">
      {english?receiptCopy.en:receiptCopy.zh}
      {receiptCopy.review?` · ${english?receiptCopy.review.en:receiptCopy.review.zh}`:''}
     </p>
     <small class="ui2-muted-note">
      {breakdownSummaryText}
     </small>
    </section>

    <section class="ui2-delivery-step" data-feedback-step="cash" data-revealed={revealedStep>=3?'true':'false'}>
     <span class="ui2-step-index">{tr('3. 钱款变动','3. Cash')}</span>
     <div class="ui2-delivery-cash-row">
      <b>{cashSigned}</b>
      <small>
       {action==='rework'
        ?tr('返工阶段现金变动 ¥0.00，当前不扣违约金。','¥0.00 cash change on rework; no breach charge applied.')
        :tr('结算入账为合同净现金变动，不等于经营利润；先前消耗的额度与电费不重复扣款。','Booked as net contract cash delta (not profit); previously spent credits and electricity are not charged twice.')}
      </small>
     </div>
    </section>

    <section class="ui2-delivery-step" data-feedback-step="response" data-revealed={revealedStep>=4?'true':'false'}>
     <span class="ui2-step-index">{tr('4. 人物回应','4. Response')}</span>
     <div class="ui2-outcome-contributors">
      {receiptCopy.participants.length>0?(
       <>
        <small>{tr('记录在案的贡献伙伴','Recorded contributors')}:</small>
        <span>{receiptCopy.participants.map(id=>names[id]??id).join(' · ')}</span>
       </>
      ):(
       <small>{tr('本阶段暂无记录在案的个人贡献明细。','No individual contributor breakdown recorded for this phase.')}</small>
      )}
     </div>
     {persona&&(
      <div class="ui2-client-card">
       <div class="ui2-client-avatar">{avatarSrc&&<img src={avatarSrc} alt=""/>}</div>
       <div>
        <b>{english?persona.nameEn:persona.name} · <small>{english?persona.roleEn:persona.role}</small></b>
        <p>“{persona.quotes[gradeTier][english?1:0]}”</p>
       </div>
      </div>
     )}
     {duoStages.map(duo=>(
      <div key={duo.duoId} class="ui2-duo-story-box" data-duo-id={duo.duoId}>
       <b><Icon name="link"/> {tr(duo.titleZh,duo.titleEn)}</b>
       {duo.lines.map((line,idx)=>(
        <p key={idx}><b>{names[line.speaker]??line.speaker}:</b> “{english?line.en:line.zh}”</p>
       ))}
      </div>
     ))}
    </section>

    <footer class="ui2-delivery-actions">
     {revealedStep<4&&(
      <button
       type="button"
       class="ui2-delivery-skip"
       onClick={()=>{
        setRevealedStep(4);
        requestAnimationFrame(()=>continueBtnRef.current?.focus({preventScroll:true}));
       }}
      >
       {tr('跳过动画','Skip animation')}
      </button>
     )}
     <button
      ref={continueBtnRef}
      type="button"
      class="primary ui2-delivery-close"
      onClick={close}
     >
      {tr('确认继续','Continue')}
     </button>
    </footer>
   </div>
  </Dialog>
 );
}
