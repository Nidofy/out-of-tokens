import type {GameView} from 'oot-platform';
import type {Command} from 'oot-core';
export function projectActionBlock(busy:boolean,chapter:number,projectChapter:number,cash:number,retryCost?:number):'busy'|'chapter'|'cash'|null{
 return busy?'busy':chapter!==projectChapter?'chapter':retryCost!==undefined&&cash<retryCost?'cash':null;
}
export function ProjectPanel({view,english,busy,send,openJob}:{view:GameView;english:boolean;busy:boolean;send:(c:Command)=>unknown;openJob:(id:string)=>void}){
 const tr=(zh:string,en:string)=>english?en:zh;
 const reason=(blocked:ReturnType<typeof projectActionBlock>)=>blocked==='busy'?tr('请先完成当前操作或处理经营状态。','Finish the current operation or resolve the studio state.'):blocked==='chapter'?tr('仅当前章节的项目可以继续操作。','Only projects in the current chapter can proceed.'):blocked==='cash'?tr('现金不足以支付重约费。','Not enough cash for the rebooking fee.'):'';
 return <>{view.projects.length===0&&<p class="management-caption">{tr('当前没有客户项目；随章节推进会收到新的邀请。','No client projects yet. New invitations arrive as chapters progress.')}</p>}{view.projects.map(p=>{const route=p.routes.find(r=>r.id===p.route),step=route?.steps[p.step],blocked=projectActionBlock(busy,view.campaign?.chapter??-1,p.chapter,view.cash),retryBlocked=projectActionBlock(busy,view.campaign?.chapter??-1,p.chapter,view.cash,p.retryCost);return <section class="project-panel management-card" key={p.id} aria-label={tr(p.title,p.titleEn)}>
  {p.id==='incubator'&&<img class="project-cover" src="./art/cards/project-incubator.webp" alt=""/>}<span class="eyebrow">{tr('客户项目','Client project')} · {tr('第','Chapter ')} {p.chapter}</span><h3>{tr(p.title,p.titleEn)}</h3><p>{tr(p.brief,p.briefEn)}</p>
  {!route?<div class="project-routes">{p.routes.map(r=><article key={r.id}><h4>{tr(r.label,r.labelEn)}</h4><p>{tr(r.description,r.descriptionEn)}</p><ol>{r.steps.map(s=><li>{tr(s.title,s.titleEn)} · {s.phases}{tr('期',' phases')} · {tr('每期质量','Quality per phase')} ≥{s.quality}</li>)}</ol><button disabled={!!blocked} onClick={()=>send({type:'campaign',action:'project-start',id:p.id,target:r.id})}>{tr('选择这条路线','Choose this route')}</button>{blocked&&<small>{reason(blocked)}</small>}</article>)}</div>:<>
   <p><b>{tr(route.label,route.labelEn)}</b> · {p.completed?tr('交付记录已归档','Delivery record archived'):`${p.step+1}/${route.steps.length}`} · {tr('本单尝试','Job attempt')} {p.attempts}</p>
   <ol class="project-steps">{route.steps.map((s,i)=><li class={p.completed||i<p.step?'done':i===p.step?'current':''}>{p.completed||i<p.step?'✓ ':''}{tr(s.title,s.titleEn)}</li>)}</ol>
   {!p.completed&&<p>{tr('当前要求','Current requirement')}: {step?.phases}{tr('期全部交付，每期质量至少',' phases delivered; quality per phase at least ')} {p.target}。{p.quality!==null&&p.status==='delivered'&&`${tr('实际','Actual')}: ${p.quality}`}</p>}
   {p.feedback&&<blockquote>{tr(p.feedback,p.feedbackEn!)}</blockquote>}
   {p.feedbackHistory.length>0&&<details><summary>{tr('此前的客户回信','Earlier client feedback')}</summary>{p.feedbackHistory.map(f=><blockquote>{tr(f.text,f.textEn)}</blockquote>)}</details>}
   <div class="button-row">{p.job&&!['expired','rejected'].includes(p.status??'')&&<button onClick={()=>openJob(p.job!)}>{tr('打开当前委托','Open current job')}</button>}
   {p.canAdvance&&<button disabled={!!blocked} onClick={()=>send({type:'campaign',action:'project-next',id:p.id})}>{p.lastStep?`${tr('归档路演材料','Archive pitch materials')} · +${p.research} RP`:tr('确认反馈，领取下一单','Confirm feedback and get next job')}</button>}
   {p.canRetry&&<button disabled={!!retryBlocked} onClick={()=>send({type:'campaign',action:'project-next',id:p.id})}>{tr('重新约单','Rebook this job')} · ¥{p.retryCost}</button>}</div>
   {(p.canRetry?retryBlocked:blocked)&&<small>{reason(p.canRetry?retryBlocked:blocked)}</small>}
   {p.canRetry&&<p>{tr('当前合同已结束但未满足项目要求。原收支与违约不撤销；重约会生成同阶段新合同。','This contract ended without meeting the project requirement. Its payments and penalties remain. Rebooking creates a new contract for this stage.')}</p>}
   <details><summary>{tr('项目实际用量与收支','Actual project usage and cash flow')}</summary><p>{tr('合同现金流（含预付款/尾款/违约）','Contract cash flow (advances, settlements and breaches)')} ¥{p.accounting.receipts.toFixed(2)} · {tr('重约费','Rebooking fees')} ¥{p.accounting.retries.toFixed(2)}</p><p>{tr('云端消耗','Cloud use')} {p.accounting.cloud.toFixed(2)} T · {tr('其中已购额度消耗','Purchased quota used')} {p.accounting.purchased.toFixed(2)} T · {tr('累计本地电费','Accrued electricity')} ¥{p.accounting.electricity.toFixed(2)}</p><small>{tr('这是用量与现金流，不是利润。云额度不重复扣现金，电费在周结收取；套餐、租金与人手机会成本未分摊。','Usage and cash flow, not profit. Quota use is not another cash charge; electricity is paid weekly. Subscription, rent and staffing opportunity costs are not allocated.')}</small></details>
  </>}
  <small>{tr('路线确认后不改约。邀请至少保留一天，随后在早晨刷新时过期；可付重约费恢复。无额外路演现金奖励。','Route choices are final. Offers last at least one day, then expire on a morning refresh; rebooking costs a fee. The pitch has no extra cash reward.')}</small>
 </section>;})}</>;
}
