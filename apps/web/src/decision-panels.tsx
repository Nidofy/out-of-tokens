import {names} from './presentation.js';
import type {ExperienceView,GameSession,GameView} from 'oot-platform';
import {experienceReceiptCopy} from './experience-copy.js';
import type {ClientPersonaDef} from './living-adapter.js';
import {resolveClientAvatarArt} from './art/story-expansion-resolver.js';
type Forecast=NonNullable<ReturnType<GameSession['previewAssignment']>['forecast']>;
export function periodText(slot:number,english:boolean){return `${english?'Day ':'第'}${Math.floor(slot/4)+1}${english?'':'天'} · ${(english?['Morning','Afternoon','Evening','Night']:['上午','下午','晚上','深夜'])[slot%4]}`;}
export function AssignmentForecast({value,english}:{value:Forecast;english:boolean}){
 const tr=(zh:string,en:string)=>english?en:zh;
 const labels={noProgress:tr('冻结当前状态时无完成预测；休息恢复后请重新比较方案。','No completion under frozen conditions; compare again after rest.'),late:tr('按此方案可能逾期，考虑换人或缩小同时进行的工作。','This plan may miss the deadline. Reassign or reduce concurrent work.'),capacity:tr('单槽本地算力不足，实际会停工。','Local capacity is insufficient for a planned period.'),cloud:tr('本槽云端额度不足，需要换部署方式或补充额度。','Cloud credits are insufficient this period.'),hidden:tr('未澄清需求会扣质量分；派遣不会自动揭示需求。','Unclear requirements reduce quality; assignment does not clarify them.'),condition:tr('伙伴状态有风险：吃饭、休息或降低负载后再比较方案。','Teammate condition is at risk: compare after food, rest or lower load.')};
 return <section class="campaign-panel forecast-panel" aria-label={tr('派遣方案预估','Assignment forecast')}><h3>{tr('这支队伍能做到什么？','What can this team do?')}</h3><div class="forecast-grid"><div><small>{tr('本阶段完成时间','Phase completion')}</small><b>{value.completion===null?'—':periodText(value.completion,english)}</b><small>{value.workSlots} {tr('工作时段','work periods')}</small></div><div><small>{tr('本阶段资源预算','Phase resource budget')}</small><b>{value.cloud} T / {value.local} {tr('本地算力','local units')}</b><small>{tr('本地电费周结','Local electricity at weekly billing')} ¥{value.electricity.toFixed(2)}</small></div><div><small>{tr('条件质量区间','Conditional quality range')}</small><b>{value.quality?.join('–')??'—'}</b></div></div><ul class="forecast-members" aria-label={tr('工位与精力预估','Station and energy estimate')}>{value.firstSlot.members.map(m=><li><b>{names[m.character]??m.character}</b><span class="station-pill" data-tier={m.station??'meeting'}>{m.station?tr(m.station==='basic'?'基础工位':'标准工位',m.station==='basic'?'Basic station':'Standard station'):tr('会议席','Meeting seat')}</span><span class="bonus-pill" data-boost={m.efficiency>0}>{tr('产出加成','Work bonus')} +{Math.round(m.efficiency*100)}%</span><span class="energy-pill">{tr('本槽成功执行时精力','Energy if this period executes')} −{m.energyCost}</span></li>)}</ul><p>{tr('假设：保持当前精力、心情和负载，资源充足，无新事件、缺陷或返工；仅算当前阶段，未来夜间不自动加班。不是结果保证。','Assumes unchanged energy, mood and load, sufficient resources, no new events, defects or rework. Current phase only; no automatic future overtime. Not a guarantee.')}</p><p>{tr('云端数字是游戏额度消耗，不是再次扣现金；跨日配额和补购没有计入预算。','Cloud figures are game credits, not another cash charge. Daily renewals and purchases are not included.')}</p><ul class="forecast-risks">{Object.entries(value.risks).filter(([,on])=>on).map(([key])=><li>{labels[key as keyof typeof labels]}</li>)}</ul></section>;
}
export function DeliverySummary({job,english,settled,persona,receipt}:{job:GameView['jobs'][number];english:boolean;settled?:GameView['ledger'][number]|undefined;persona?:ClientPersonaDef|undefined;view?:GameView|undefined;receipt?:ExperienceView['receipts'][number]|undefined}){
 const tr=(zh:string,en:string)=>english?en:zh,r=job.settlement;
 const receiptCopy=receipt?experienceReceiptCopy(receipt,job):null;
 const historical=['delivered','breached'].includes(job.status);
 const histAssessment=historical?(receipt?.assessment??null):null;
 const quoteTier:'excellent'|'good'|'pass'|'fail'=job.status==='breached'
  ?'fail'
  :job.status==='delivered'
   ?(histAssessment
     ?(histAssessment.quality>=(histAssessment.qualityLines[2]??90)?'excellent':histAssessment.quality>=(histAssessment.qualityLines[1]??75)?'good':'pass')
     :'pass')
   :r.tier;
 const avatarSrc=persona?resolveClientAvatarArt(persona.id):null;
 const clientNote=persona&&(
  <div class="ui2-client-card">
   <div class="ui2-client-avatar">
    <img src={avatarSrc!} alt=""/>
   </div>
   <div>
    <b>{english?persona.nameEn:persona.name} · <small>{english?persona.roleEn:persona.role}</small></b>
    <p>“{persona.quotes[quoteTier][english?1:0]}”</p>
   </div>
  </div>
 );
 const contributorsLine=receiptCopy&&receiptCopy.participants.length>0?(
  <p class="ui2-outcome-line-meta">
   <b>{tr('记录在案的贡献伙伴','Recorded contributors')}:</b> {receiptCopy.participants.map(id=>names[id]??id).join(' · ')}
  </p>
 ):null;

 // Strict W3 order: Result -> Reason -> Cash -> Partner & Client Response (never call cash net "profit").
 if(historical)return (
  <section class="campaign-panel" aria-label={tr('历史结算记录','Settlement history')}>
   <div data-settlement-part="result">
    <h3>{job.status==='breached'?tr('合同已违约','Contract breached'):tr('合同已交付','Contract delivered')}</h3>
   </div>
   <div data-settlement-part="reason">
    {receiptCopy&&<p>{english?receiptCopy.en:receiptCopy.zh}{receiptCopy.review?` · ${english?receiptCopy.review.en:receiptCopy.review.zh}`:''}</p>}
    {histAssessment?(
     <p>{tr('结案评分','Recorded quality')}: {histAssessment.quality} / {histAssessment.passQuality} · {tr('未澄清需求扣分','Unclear requirements penalty')}: −{histAssessment.qualityBreakdown.hiddenPenalty} · {tr('缺陷扣分','Defect penalty')}: −{histAssessment.qualityBreakdown.defectPenalty}</p>
    ):(
     <p>{tr('该结案记录不含独立评分明细快照，此处不按当前界面重算历史质量分。','No separate score breakdown snapshot on this record; historical quality is not recomputed from current state.')}</p>
    )}
   </div>
   <div data-settlement-part="cash">
    {settled?<dl class="settlement-grid"><dt>{tr('最后一次实际结算','Last actual settlement')}</dt><dd>{periodText(settled.slot,english)}</dd><dt>{tr('现金变动','Cash change')}</dt><dd>¥{settled.amount.toFixed(2)}</dd></dl>:<p>{tr('这笔结算已不在近期流水摘要中；此处不按当前日期重算历史金额。','This settlement is outside the recent ledger summary. Historical amounts are not recalculated using today’s date.')}</p>}
    <p>{tr('仅展示已发生的结算；多期合同各期单独入账，此处现金变动不是利润。','Recorded settlements only; each phase books separately and cash delta is not profit.')}</p>
   </div>
   <div data-settlement-part="response">
    {contributorsLine}
    {clientNote}
   </div>
  </section>
 );

 const titles={excellent:tr('出色','Excellent'),good:tr('优良','Good'),pass:tr('通过验收','Accepted'),fail:tr('未通过验收','Not accepted')};
 return (
  <section class="campaign-panel" aria-label={tr('交付结算说明','Delivery settlement')}>
   <div data-settlement-part="result">
    <h3>{titles[r.tier]}</h3>
   </div>
   <div data-settlement-part="reason">
    <p>{tr('未澄清需求扣分','Unclear requirements penalty')}: −{job.qualityBreakdown.hiddenPenalty} · {tr('缺陷扣分','Defect penalty')}: −{job.qualityBreakdown.defectPenalty} · {tr('逾期','Late')}: {r.late} {tr('时段','periods')}</p>
    {receiptCopy&&<p>{english?receiptCopy.en:receiptCopy.zh}{receiptCopy.review?` · ${english?receiptCopy.review.en:receiptCopy.review.zh}`:''}</p>}
    {r.canRework&&<p>{tr('仍可返工，先修正后再交付；目前不会扣违约款。','Rework is available. Fix the work before delivery; no breach charge is due now.')}</p>}
   </div>
   <div data-settlement-part="cash">
    <dl class="settlement-grid"><dt>{tr('本阶段合同基数','Phase contract base')}</dt><dd>¥{r.contract.toFixed(2)}</dd><dt>{tr('评级倍率 / 逾期倍率','Grade / deadline multiplier')}</dt><dd>×{r.multiplier} / ×{r.lateFactor.toFixed(2)}</dd><dt>{tr('已收预付款','Advance already received')}</dt><dd>¥{r.advance.toFixed(2)}</dd><dt>{r.tier==='fail'?tr('违约时现金变动','Cash change on breach'):tr('本次结算现金变动','Cash change on delivery')}</dt><dd>¥{r.net.toFixed(2)}</dd></dl>
    <p>{tr('先前消耗的额度与电费不在此重复扣除；多期合同每期单独结算，现金变动非利润。','Previously consumed credits and electricity are not charged again here. Each contract phase settles separately and cash delta is not profit.')}</p>
   </div>
   <div data-settlement-part="response">
    {contributorsLine}
    {clientNote??<p>{persona?persona.quotes[r.tier][english?1:0]:r.tier==='fail'?tr('先把遗漏补上，我们再验收一次。','Let’s address what is missing before accepting the work.'):r.tier==='excellent'?tr('这份交付比约定多走了一步，谢谢你们。','This delivery went beyond the brief. Thank you.'):tr('交付符合约定，辛苦了。','The delivery meets the brief. Thank you.')}</p>}
   </div>
  </section>
 );
}
