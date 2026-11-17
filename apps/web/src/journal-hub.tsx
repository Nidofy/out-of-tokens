import type {Command} from 'oot-core';
import {worlds} from 'oot-core';
import type {ActivityPreview,ExperienceView,FinanceExplanation,GameView} from 'oot-platform';
import {Icon} from './icons.js';
import {artSlotForJobTemplate,describeActivityPreview,formatFactLine,receiptKey} from './experience-adapter.js';
import {ExperienceArtSlot} from './experience-art-slot.js';
import {experienceReceiptCopy} from './experience-copy.js';
import {financeNetSolvencyNote} from './experience-ui-copy.js';
import {souvenirIds} from './generated-art.js';
import {ledgerLabel} from './player-labels.js';
import {names} from './presentation.js';
import {periodText} from './decision-panels.js';

export type JournalTab='chronicle'|'ledger'|'bids'|'expedition';

const endings=[
 ['independent','独立上市','Independent studio','净资金12000、声望30','Net funds 12000, reputation 30','伙伴们保留了自己的名字，也保留了决定明天的权利。','Everyone keeps their name, and the right to choose tomorrow.'],
 ['acquired','被大厂收购','Acquired','完成第4章','Complete chapter 4','新的招牌挂起来了。你把旧工牌悄悄放进抽屉。','A new sign goes up. You keep the old badges in a drawer.'],
 ['open-source','开源一切','Open everything','所有开源伙伴好感85','All open-source characters at affinity 85','门没有锁。第一位访客带来了补丁和一袋橘子。','The door stays open. The first visitor brings a patch and oranges.'],
 ['warm-shop','温暖的小店','A warm little shop','招齐12人、全员好感65','Recruit all 12; affinity 65 for everyone','大家投票决定不搬家。晚饭比融资会议更准时。','Everyone votes to stay. Dinner is more punctual than investor meetings.'],
 ['paperclip','回形针彩蛋','Paperclip ending','纸片纪念物、112槽内28次交付、全员好感<25','Paper souvenir, 28 deliveries in 112 slots, all affinity below 25','桌上全是整齐的回形针。没有人再问它们是给谁用的。','Every desk is covered in perfect paperclips. Nobody asks who needs them.']
] as const;

type JournalHubProps={
 view:GameView;
 english:boolean;
 locked:boolean;
 tab:JournalTab;
 setTab:(next:JournalTab)=>void;
 send:(cmd:Command)=>Promise<boolean>;
 hideTabs?:boolean;
 previewActivity?:(cmd:Command)=>ActivityPreview;
 finance:FinanceExplanation;
 experienceView?:ExperienceView|undefined;
 suppressVignettes?:boolean|undefined;
};

export function JournalHub({view,english,locked,tab,setTab,send,hideTabs,previewActivity,finance,experienceView,suppressVignettes}:JournalHubProps){
 const tr=(zh:string,en:string)=>english?en:zh;
 const p=view.campaign!,f=p.finale!;
 const chapterTitles=[tr('开源车库联盟','Open-source garage'),tr('第一笔大订单','The first large order'),tr('模型更新之夜','Model release night'),tr('429危机','The 429 crisis'),tr('最后一个Token','The last token')];
 const act=(action:'expedition'|'ending'|'endless'|'bid'|'challenge',id:string,target?:string)=>void send({type:'campaign',action,id,...(target?{target}:{})});
 const ledgerSummary=finance.recentLedgerSummary;
 const deliveredCount=view.jobs.filter(j=>j.status==='delivered').length;

 return (
  <div class="ui2-hub-content">
   {!hideTabs&&(
    <div class="ui2-hub-inner-tabs" role="tablist" aria-label={tr('手账栏目','Journal sections')}>
     {([['chronicle',tr('事务所履历','Chronicle')],['ledger',tr('收支与算力','Ledger & usage')],['bids',tr('对手竞标','Rival bids')],['expedition',tr('远征与终局','Expeditions & endings')]] as const).map(([id,label])=>(
      <button key={id} role="tab" aria-selected={tab===id} onClick={()=>setTab(id)}>{label}</button>
     ))}
    </div>
   )}

   {tab==='chronicle'&&(
    <div class="ui2-chronicle">
     <div class="ui2-finance-kpis">
      <div class="ui2-kpi-card"><small>{tr('运营天数','Days active')}</small><b>{view.day}</b></div>
      <div class="ui2-kpi-card"><small>{tr('创始人经验','Founder XP')}</small><b>{view.founderXP} XP</b></div>
      <div class="ui2-kpi-card"><small>{tr('在岗伙伴 / 已研技术','Team / Tech unlocked')}</small><b>{view.actors.length} / {p.software.length}</b></div>
      <div class="ui2-kpi-card"><small>{tr('当前已交付','Delivered jobs')}</small><b>{deliveredCount}</b></div>
     </div>
     {(()=>{
      const receipts=experienceView?.receipts??[];
      const hasPassed=receipts.some(r=>r.facts.some(f=>f.certainty==='certain'&&f.reason==='delivery-passed'));
      return (
       <section class="ui2-card ui2-outcome-wall" aria-label={tr('工作室成果墙','Studio outcome wall')}>
        <div class="ui2-outcome-head">
         <h4><Icon name="award"/> {tr('工作室成果墙','Studio outcome wall')}</h4>
         <small>{tr(`已归档 ${receipts.length} 条结案记录`,`${receipts.length} settled record(s)`)}{suppressVignettes?` · ${tr('紧急事项优先，已折叠庆祝横幅','Celebration banner deferred to urgent alert')}`:''}</small>
        </div>
        {hasPassed&&!suppressVignettes&&(
         <ExperienceArtSlot
          slotId="vignette-first-delivery"
          variant="vignette"
          state="delivered"
          english={english}
          badgeText={tr('交付里程碑','Delivery milestone')}
          title={tr('把约定做成作品，稳稳交给客户','Turned commitments into delivered work')}
          subtitle={tr(`累计交付 ${deliveredCount} 项委托 · 下方仅展示真实归档与在案参与伙伴`,`${deliveredCount} delivered · Only factual receipts & recorded contributors shown below`)}
         />
        )}
        {receipts.length===0?(
         <ExperienceArtSlot
          slotId="outcome-workshop-display"
          variant="outcome"
          state="neutral"
          english={english}
          badgeText={tr('成果展架空位','Empty display')}
          title={tr('完成首个交付或返工结算后，成果记录将陈列在此','Completed settlements will appear on this shelf')}
          subtitle={tr('未交付的功能、作品或未在案伙伴不会提前展示。','Undelivered work and unrecorded contributors are never shown prematurely.')}
         />
        ):(
         <div class="ui2-outcome-grid">
          {[...receipts].reverse().map(r=>{
           const job=view.jobs.find(j=>j.id===r.jobId);
           const copy=experienceReceiptCopy(r,job);
           const slotId=artSlotForJobTemplate(job?.template);
           const passed=r.facts.some(f=>f.certainty==='certain'&&f.reason==='delivery-passed');
           const rework=r.facts.some(f=>f.certainty==='certain'&&f.reason==='delivery-rework');
           const badge=passed?tr('验收通过','Accepted'):rework?tr('返工修正','Rework'):tr('未通过/违约','Failed');
           const subtitle=`${tr(`第 ${r.phase+1} 阶段`,`Phase ${r.phase+1}`)} · ${english?copy.en:copy.zh}${copy.review?` · ${english?copy.review.en:copy.review.zh}`:''}`;
           return (
            <div key={receiptKey(r)} class="ui2-outcome-card" data-outcome={passed?'passed':rework?'rework':'failed'}>
             <ExperienceArtSlot
              slotId={slotId}
              variant="outcome"
              state={passed?'delivered':'neutral'}
              english={english}
              badgeText={badge}
              title={job?(english?job.titleEn:job.title):r.jobId}
              subtitle={subtitle}
             />
             <div class="ui2-outcome-contributors">
              {copy.participants.length>0?(
               <>
                <small>{tr('记录在案的贡献伙伴','Recorded contributors')}:</small>
                <span>{copy.participants.map(id=>names[id]??id).join(' · ')}</span>
               </>
              ):(
               <small>{tr('本条回执无单独记录在案的贡献伙伴。','No individual contributor recorded on this receipt.')}</small>
              )}
             </div>
            </div>
           );
          })}
         </div>
        )}
       </section>
      );
     })()}
     <section class="ui2-card">
      <h4>{tr('工作室章节编年里程碑','Studio chapter timeline')}</h4>
      <ol class="ui2-timeline">
       {chapterTitles.map((title,idx)=>{
        const done=p.completed.includes(idx),current=p.chapter===idx;
        return <li key={idx} data-state={done?'done':current?'current':'locked'}>
         <span class="ui2-timeline-badge">{done?<Icon name="check"/>:current?<Icon name="spark"/>:<Icon name="lock"/>}</span>
         <div>
          <b>{tr(`第 ${idx} 章 · ${title}`,`Chapter ${idx} · ${title}`)}</b>
          <small>{done?tr('已达成交接里程碑','Completed'):current?tr('当前推进中','In progress'):tr('后续章节解锁','Upcoming chapter')}</small>
         </div>
        </li>;
       })}
      </ol>
      <p class="ui2-muted-note">{tr('游戏内的算力与 Token 全部为本地模拟数据，不调用外部真实付费模型接口。','All tokens and compute metrics are deterministic in-game simulation values with no external API calls.')}</p>
     </section>
    </div>
   )}

   {tab==='ledger'&&(
    <div class="ui2-ledger-pane">
     <div class="ui2-finance-kpis">
      <div class="ui2-kpi-card"><small>{tr('当前账面现金','Cash balance')}</small><b>¥{finance.cash.toFixed(2)}</b></div>
      <div class="ui2-kpi-card" data-crisis={finance.netSolvency<0}><small>{tr('净偿付资金（非利润）','Net solvency (not profit)')}</small><b>¥{finance.netSolvency.toFixed(2)}</b></div>
      <div class="ui2-kpi-card"><small>{tr('未完结预付款 / 在贷','Unfinished advances / Loan')}</small><b>¥{finance.unfinishedAdvances.toFixed(2)} / ¥{finance.loan}</b></div>
      <div class="ui2-kpi-card"><small>{tr(`近 ${ledgerSummary.count} 笔流水净流动（非利润）`,`Last ${ledgerSummary.count} cash net (not profit)`)}</small><b class={ledgerSummary.net>=0?'is-up':'is-down'}>{ledgerSummary.net>=0?'+':''}¥{ledgerSummary.net.toFixed(2)} (+{ledgerSummary.inflow.toFixed(0)} / −{ledgerSummary.outflow.toFixed(0)})</b></div>
     </div>
     <p class="ui2-inline-hint"><Icon name="info"/> {financeNetSolvencyNote(english)}</p>
     {finance.bills.length>0&&(
      <section class="ui2-card" aria-label={tr('近期已知账单拆分','Known upcoming liabilities')}>
       <h4>{tr('近期已知待结算账单（不揣测未来收入）','Known upcoming bills (no speculative future income)')}</h4>
       <ul class="ui2-ledger-list">
        {finance.bills.map((bill,idx)=><li key={idx}><span><b>{formatFactLine(bill,english)}</b></span><b>¥{(bill.amount??0).toFixed(2)}</b></li>)}
       </ul>
      </section>
     )}

     <div class="ui2-ledger-cols">
      <section class="ui2-card">
       <h4>{tr('最近 10 笔收支流水','Recent 10 cash transactions')}</h4>
       {view.ledger.length===0?(
        <div class="ui2-empty-box"><img class="empty-art" src="./art/upgrades/empty-desk.webp" alt=""/><p class="ui2-muted-note">{tr('还没有收支记录。','No cash transactions yet.')}</p></div>
       ):(
        <ul class="ui2-ledger-list">{[...view.ledger].reverse().map((row,i)=><li key={i}><span><b>{ledgerLabel(row.reason,english)}</b><small>{periodText(row.slot,english)}</small></span><b class={row.amount>=0?'is-up':'is-down'}>{row.amount>=0?'+':''}¥{row.amount.toFixed(2)}</b></li>)}</ul>
       )}
      </section>

      <section class="ui2-card">
       <h4>{tr('最近 10 笔算力消耗记录','Recent 10 compute entries')}</h4>
       {view.resources.length===0?(
        <p class="ui2-muted-note">{tr('还没有算力消耗记录。','No compute usage recorded yet.')}</p>
       ):(
        <ul class="ui2-ledger-list">{[...view.resources].reverse().map((r,i)=><li key={i}><span><b>{names[r.character]??r.character} · {r.mode==='cloud'?tr('云端','Cloud'):tr('本地','Local')}</b><small>{periodText(r.slot,english)} · {r.job}</small></span><b>{r.units.toFixed(1)} {r.mode==='cloud'?'T':'U'}</b></li>)}</ul>
       )}
      </section>
     </div>
    </div>
   )}

   {tab==='bids'&&(
    <div class="ui2-bids-pane">
     {p.chapter<2?(
      <section class="ui2-card ui2-lock-preview">
       <Icon name="lock"/>
       <h4>{tr('对手工作室竞标 · 第 2 章开放','Rival studio bids · Unlocks in Chapter 2')}</h4>
       <p class="ui2-muted-note">{tr('进入第 2 章后，可与卷王、精品、套壳救援三家对手工作室同场竞标待接委托，博弈不同报酬倍率。','Reach Chapter 2 to bid against three rival studios for adjusted reward multipliers.')}</p>
      </section>
     ):null}
     <div class="ui2-rival-grid">
      {([['budget',tr('卷王工作室','Budget rival'),tr('无隐藏需求且声望 ≥10 · 报酬 85%','No hidden needs, rep >=10 · 85% pay')],['boutique',tr('精品工作室','Boutique studio'),tr('声望 ≥20 且研发 ≥10 · 报酬 115%','Rep >=20 & 10 RP · 115% pay')],['wrapper',tr('套壳救援','Wrapper rescue'),tr('小白客户且无隐藏需求 · 报酬 150%','Novice client, no hidden needs · 150% pay')]] as const).map(([id,name,desc])=>(
       <article class="ui2-card ui2-rival-card" key={id}>
        <img class="rival-art" src={`./art/cards/rival-${id}.webp`} alt=""/>
        <div><b>{name}</b><small>{desc}</small></div>
       </article>
      ))}
     </div>
     {p.chapter>=2&&(
      <section class="ui2-card">
       <h4>{tr('当前可参与竞标的待接委托（投标费 ¥60）','Available contracts to bid (Fee ¥60)')}</h4>
       {view.jobs.filter(j=>j.status==='posted').length===0?<p class="ui2-muted-note">{tr('暂无待接委托。','No posted commissions available.')}</p>:view.jobs.filter(j=>j.status==='posted').map(j=>(
        <div class="ui2-bid-row" key={j.id}>
         <b>{english?j.titleEn:j.title}</b>
         <div class="button-row">{(['budget','boutique','wrapper'] as const).map((r,i)=><button key={r} disabled={locked||f.bids.some(b=>b.job===j.id)||(!!f.ending&&!f.endless)} onClick={()=>act('bid',j.id,r)}><img class="rival-art" src={`./art/cards/rival-${r}.webp`} alt=""/>{[tr('卷王','Budget'),tr('精品','Boutique'),tr('套壳救援','Wrapper')][i]}</button>)}</div>
        </div>
       ))}
       {f.bids.length>0&&<div class="ui2-bid-history"><h5>{tr('近期竞标记录','Recent bids')}</h5>{f.bids.slice(-5).map((b,i)=><span key={i}>{b.job} · {b.rival} · {b.won?tr('胜出','Won'):tr('落标','Lost')}</span>)}</div>}
      </section>
     )}
    </div>
   )}

   {tab==='expedition'&&(
    <div class="ui2-expedition-pane">
     {p.chapter<3&&(
      <section class="ui2-card ui2-lock-preview">
       <Icon name="lock"/>
       <h4>{tr('异世界远征与终局画册 · 第 3–4 章逐步开放','Expeditions & Endings · Chapters 3–4')}</h4>
       <p class="ui2-muted-note">{tr('第 3 章可派遣空闲伙伴前往异世界远征收集研发点与纪念物；第 4 章通关后解锁五大工作室结局。','Chapter 3 unlocks expeditions and souvenirs; Chapter 4 unlocks studio endings.')}</p>
      </section>
     )}
     <div class="ui2-exp-grid">
      <section class="ui2-card">
       <h4>{tr('异世界远征','Otherworld expeditions')}</h4>
       <div class="ui2-world-list">
        {worlds.map(w=><article class="ui2-world-item" key={w.id}>
         <img src={`./art/${w.id}.webp`} alt=""/>
         <div>
          <b>{english?w.en:w.zh}</b>
          <small>¥{w.cost} · {w.slots}{tr('槽',' slots')} · +{w.research} RP</small>
          <div class="button-row">{view.actors.map(a=>{const ep=previewActivity?describeActivityPreview(previewActivity({type:'campaign',action:'expedition',id:a.id,target:w.id}),english):null;return <button key={a.id} disabled={locked||a.busy||p.chapter<3||(!!f.ending&&!f.endless)} title={ep?.compactText} onClick={()=>act('expedition',a.id,w.id)}>{names[a.id]??a.id}</button>;})}</div>
          {(()=>{
           const sampleActor=view.actors.find(a=>!a.busy);
           const ep=sampleActor&&previewActivity?describeActivityPreview(previewActivity({type:'campaign',action:'expedition',id:sampleActor.id,target:w.id}),english):null;
           return ep?.legal?<small class="ui2-muted-note">{ep.compactText}</small>:null;
          })()}
         </div>
        </article>)}
       </div>
       {f.expeditions.filter(x=>!x.claimed).map((x,i)=><p class="ui2-inline-hint" key={i}><Icon name="spark"/> {names[x.actor]??x.actor} → {worlds.find(w=>w.id===x.world)?.[english?'en':'zh']??x.world} · {tr('返程槽位','Return slot')} {x.until}</p>)}
      </section>

      <section class="ui2-card">
       <h4>{tr('羊皮纸纪念物陈列架','Souvenir shelf')}</h4>
       <ul class="ui2-souvenir-shelf">
        {souvenirIds.map(id=>{
         const owned=f.souvenirs.includes(id),world=worlds.find(w=>w.id===id);
         return <li key={id} data-owned={owned}>
          <img class="art-icon" src={`./art/cards/souvenir-${id}.webp`} alt=""/>
          <span>{world?.[english?'en':'zh']??id}</span>
          <small>{owned?tr('已收藏','Collected'):tr('远征解锁','Expedition drop')}</small>
         </li>;
        })}
       </ul>

       <h4>{tr('事务所终局画册','Studio endings gallery')}</h4>
       {f.ending?(
        <div class="ui2-ending-active">
         <img class="ending-art" src={`./art/${f.ending}.webp`} alt=""/>
         <b>{endings.find(e=>e[0]===f.ending)?.[english?2:1]}</b>
         <p>{endings.find(e=>e[0]===f.ending)?.[english?6:5]}</p>
         <button class="primary" disabled={locked||f.endless} onClick={()=>act('endless','continue')}>{tr('开启无尽经营模式','Continue in endless mode')}</button>
        </div>
       ):null}
       {f.endless&&(
        <div class="ui2-challenge-card">
         <b>{tr('本周挑战','Weekly challenge')}</b>
         <p>{[tr('仅单价≤8的版本','Versions <=8 T/WP'),tr('全员本地部署','Local deployment only'),tr('仅基础上下文≤6的版本','Base context <=6')][Math.floor(view.absoluteSlot/28)%3]} · {tr('交付 3 单质量 ≥75 领 5 RP','3 new deliveries >=75 for 5 RP')}</p>
         <button class="primary" disabled={locked} onClick={()=>act('challenge','claim')}>{tr('领取周挑战奖励','Claim challenge')}</button>
        </div>
       )}
       {!f.ending&&(
        <div class="ui2-endings-grid">
         {endings.map(e=><div class="ui2-ending-card" key={e[0]}>
          <img src={`./art/${e[0]}.webp`} alt=""/>
          <div>
           <b>{e[english?2:1]}</b>
           <small>{e[english?4:3]}</small>
           <button disabled={locked||!p.completed.includes(4)} onClick={()=>act('ending',e[0])}>{tr('选定结局','Select')}</button>
          </div>
         </div>)}
        </div>
       )}
      </section>
     </div>
    </div>
   )}
  </div>
 );
}
