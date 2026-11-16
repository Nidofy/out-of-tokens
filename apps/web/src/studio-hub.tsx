import type {Command} from 'oot-core';
import type {GameView} from 'oot-platform';
import {Icon} from './icons.js';
import {PipTrack} from './ornaments.js';
import {chapterBannerArt,financeArt,softwareArt} from './generated-art.js';
import {names} from './presentation.js';
import {actorIds} from './studio-ui.js';
import {recruitmentBlock} from './character-profiles.js';
import type {HubPanel} from './ui2-logic.js';
import {teaBreakAssetSrc} from './living-adapter.js';

export type StudioTab='overview'|'finance'|'tech';

type StudioHubProps={
 view:GameView;
 english:boolean;
 locked:boolean;
 tab:StudioTab;
 setTab:(next:StudioTab)=>void;
 send:(cmd:Command)=>Promise<boolean>;
 onOpenOffice:()=>void;
 onSwitchHub:(hub:HubPanel)=>void;
 onOpenMap:()=>void;
 returnBanner?:{label:string;onReturn:()=>void}|null|undefined;
 hideTabs?:boolean;
 teaReady?:boolean;
 onTeaBreak?:()=>void;
};

export function StudioHub({view,english,locked,tab,setTab,send,onOpenOffice,onSwitchHub,onOpenMap,returnBanner,hideTabs,teaReady,onTeaBreak}:StudioHubProps){
 const tr=(zh:string,en:string)=>english?en:zh;
 const p=view.campaign!,catalog=view.catalog!;
 const life=(action:Extract<Command,{type:'campaign'}>['action'],id:string,target?:string)=>void send({type:'campaign',action,id,...(target?{target}:{})});
 const chapterTitles=[tr('开源车库联盟','Open-source garage'),tr('第一笔大订单','The first large order'),tr('模型更新之夜','Model release night'),tr('429危机','The 429 crisis'),tr('最后一个Token','The last token')];
 const activeIncidents=p.incidents.filter(i=>!i.resolved&&i.at<=view.absoluteSlot+(p.software.includes('monitor')?1:0));
 const eligibleRecruits=catalog.recruits.filter(r=>!recruitmentBlock(view,r,locked)).length;
 const hardwareItems=Object.entries(p.hardware).filter(([id])=>id!=='office'||!view.office);

 return (
  <div class="ui2-hub-content">
   {returnBanner&&(
    <div class="ui2-return-banner">
     <span><Icon name="arrow"/> {returnBanner.label}</span>
     <button class="primary" onClick={returnBanner.onReturn}>{tr('返回刚才的委托派遣','Return to commission assignment')}</button>
    </div>
   )}

   {!hideTabs&&(
    <div class="ui2-hub-inner-tabs" role="tablist" aria-label={tr('工作室功能区','Studio sections')}>
     {([['overview',tr('章节与总览','Chapter & overview')],['finance',tr('算力与财务','Compute & finance')],['tech',tr('软硬研发','Hardware & tech')]] as const).map(([id,label])=>(
      <button key={id} role="tab" aria-selected={tab===id} onClick={()=>setTab(id)}>{label}</button>
     ))}
    </div>
   )}

   {tab==='overview'&&(
    <div class="ui2-studio-overview">
     <section class="ui2-card ui2-chapter-card">
      <img class="ui2-chapter-banner" src={chapterBannerArt(p.chapter)} alt=""/>
      <div class="ui2-card-body">
       <span class="ui2-eyebrow">{tr(`第 ${p.chapter} 章`,`Chapter ${p.chapter}`)}</span>
       <h3>{chapterTitles[p.chapter]}</h3>
       <ul class="ui2-goal-list">
        {view.chapterGoal.requirements.map(r=><li key={r.label} data-met={r.met}>
         <Icon name={r.met?'check':'star'}/>
         <span>{tr(r.label,r.labelEn)}</span>
         <b>{r.current.toFixed(Number.isInteger(r.current)?0:2)} / {r.target}</b>
        </li>)}
       </ul>
       <p class="ui2-muted-note">{tr('第0章目标','Chapter 0 goal')}: {tr({pending:'待结算',passed:'达成',missed:'可继续经营后补达成'}[p.chapterZero],p.chapterZero)} · {tr('已完成章节','Completed')}: {p.completed.join(', ')||'—'}</p>
       <button class="primary" disabled={locked||!view.chapterGoal.ready} onClick={()=>life('chapter','next')}>
        {p.chapter===1?tr('举行融资路演，进入第2章','Hold pitch and enter chapter 2'):tr('确认章节目标','Complete chapter goal')}
       </button>
       {!view.chapterGoal.ready&&<small class="ui2-muted-note">{tr('达成上方全部目标后即可确认晋级。','Meet every requirement above to advance.')}</small>}
      </div>
     </section>

     <div class="ui2-studio-side">
      {view.office&&(
       <section class="ui2-card">
        <div class="ui2-card-head">
         <img class="art-icon" src="./art/upgrades/hardware-office.webp" alt=""/>
         <div>
          <h4>{tr('办公工位与布置','Stations & office layout')}</h4>
          <small>{tr(`已配置工位 ${view.office.capacity.work} · 会议席 ${view.office.capacity.meeting}`,`Stations ${view.office.capacity.work} · Meeting ${view.office.capacity.meeting}`)}</small>
         </div>
        </div>
        <button class="primary" disabled={locked||p.scene!=='workshop'} onClick={onOpenOffice}><Icon name="decor"/><span>{tr('布置办公室','Arrange office')}</span></button>
        {(locked||p.scene!=='workshop')&&<small class="ui2-muted-note">{p.scene!=='workshop'?tr('请先切换回工作室场景后再布置。','Travel back to the workshop to rearrange furniture.'):tr('请先处理当前经营状态。','Resolve the current studio state first.')}</small>}
       </section>
      )}

      <section class="ui2-card" data-alert={activeIncidents.length>0}>
       <h4><Icon name={activeIncidents.length>0?'warning':'check'}/> {tr('SLA 运维监控','SLA maintenance')}</h4>
       {activeIncidents.length===0?<p class="ui2-muted-note">{tr('当前线上运行平稳，没有待响应的维护事件。','All services steady; no pending maintenance incidents.')}</p>:activeIncidents.map(i=>(
        <div class="ui2-incident-row" key={i.job}>
         <b>{i.job}</b>
         <small>{tr('响应截止槽','Deadline slot')} {i.deadline}</small>
         <div class="button-row">{view.actors.map(a=><button key={a.id} disabled={locked||a.busy||view.absoluteSlot<i.at} onClick={()=>void send({type:'respond',job:i.job,character:a.id})}>{names[a.id]}</button>)}</div>
        </div>
       ))}
      </section>

      <section class="ui2-card" data-ready={!!teaReady&&!locked&&view.cash>=80}>
       <div class="ui2-card-head">
        {teaBreakAssetSrc(view)?<img class="art-icon" src={teaBreakAssetSrc(view)!} alt=""/>:<span class="art-icon ui2-tea-icon"><Icon name="cup"/></span>}
        <div>
         <h4>{tr('工坊全员下午茶','Studio tea break')}</h4>
         <small>{tr('每日 1 次 · 同场景伙伴精力 +12 · 心情 +10 · 压力 -8','Once daily · +12 Energy · +10 Mood · -8 Stress')}</small>
        </div>
       </div>
       {onTeaBreak&&<button class="primary" disabled={locked||!teaReady||view.cash<80} onClick={onTeaBreak}><Icon name="cup"/><span>{teaReady?tr('举办今日工坊茶歇 ¥80','Host studio tea break ¥80'):tr('今日茶歇已享用','Tea break enjoyed today')}</span></button>}
      </section>

      <section class="ui2-card">
       <h4>{tr('工作室快捷导览','Studio shortcuts')}</h4>
       <div class="ui2-shortcut-rows">
        <button onClick={()=>onSwitchHub('actors')}><span>{tr('在岗伙伴','Team')} {view.actors.length}/{actorIds.length} · {tr('可招募','Eligible')} {eligibleRecruits}</span><Icon name="arrow"/></button>
        <button onClick={()=>onSwitchHub('jobs')}><span>{tr('客户大项目与委托中心','Client projects & commissions')} ({view.projects.length})</span><Icon name="arrow"/></button>
       </div>
      </section>
     </div>
    </div>
   )}

   {tab==='finance'&&(
    <div class="ui2-studio-finance">
     <div class="ui2-finance-kpis">
      <div class="ui2-kpi-card"><small>{tr('账面现金','Cash on hand')}</small><b>¥{view.cash.toFixed(2)}</b></div>
      <div class="ui2-kpi-card" data-crisis={view.liquidCash<0}><small>{tr('净偿付资金','Net solvency')}</small><b>¥{view.liquidCash.toFixed(2)}</b></div>
      <div class="ui2-kpi-card"><small>{tr('下次周结账单','Next weekly bill')}</small><b>¥{view.nextWeeklyBill.toFixed(2)}</b></div>
      <div class="ui2-kpi-card"><small>{tr('贷款本金','Loan principal')}</small><b>¥{view.loan}</b></div>
     </div>

     <section class="ui2-card">
      <h4>{tr('算力额度补给与周订阅方案','Compute quota & subscriptions')}</h4>
      <p class="ui2-muted-note">{tr('临购 ¥0.5/T 跨日保留；订阅按日追加额度，升级按剩余周比例补差；本地算力由硬件提供，电费 ¥0.1/单位随周结扣除。','Purchased quota costs ¥0.5/T and carries over. Subscriptions add daily quota; upgrades prepay remaining week diff.')}</p>
      <div class="ui2-plan-grid">
       <article class="ui2-plan-card">
        <img class="art-icon" src={financeArt('quota-pack')} alt=""/>
        <b>{tr('临购算力包 100T','Spot pack 100T')}</b>
        <small>{tr('即时到账 · 跨日不清空','Instant · Carries over')}</small>
        <button class="primary" disabled={locked||view.cash<50} onClick={()=>void send({type:'buy',amount:100})}>{tr('购买 ¥50','Buy ¥50')}</button>
       </article>
       {[0,1,2].map(n=><article key={n} class="ui2-plan-card" data-active={p.subscription===n}>
        {n===0?<Icon name="chip"/>:<img class="art-icon" src={financeArt(n===2?'plan-pro':'plan-basic')} alt=""/>}
        <b>{tr('订阅方案','Plan')} {n}</b>
        <small>+{[0,120,300][n]} T/{tr('天','day')} · ¥{[0,120,420][n]}/{tr('周','wk')}</small>
        <button aria-pressed={p.subscription===n} disabled={locked||p.subscription===n} onClick={()=>life('subscribe',String(n))}>{p.subscription===n?tr('当前生效','Active'):tr('切换方案','Switch')}</button>
       </article>)}
      </div>
     </section>

     <section class="ui2-card ui2-loan-card">
      <div class="ui2-card-head">
       <img class="art-icon" src={financeArt('ledger-loan')} alt=""/>
       <div>
        <h4>{tr('经营周转信贷','Studio working loan')}</h4>
        <p class="ui2-muted-note">{tr('每笔借入 ¥1000（周息 5%），现金宽裕时可随时分批偿还以降低周结利息。','Borrow ¥1000 at 5% weekly interest; repay in chunks anytime.')}</p>
       </div>
      </div>
      <div class="button-row">
       <button disabled={locked} onClick={()=>void send({type:'loan',amount:1000})}>{tr('借入 ¥1000','Borrow ¥1000')}</button>
       <button disabled={locked||view.loan<=0} onClick={()=>void send({type:'repay',amount:Math.min(1000,view.loan)})}>{tr('偿还','Repay')} ¥{Math.min(1000,view.loan)}</button>
      </div>
     </section>
    </div>
   )}

   {tab==='tech'&&(
    <div class="ui2-studio-tech">
     <section>
      <h4>{tr('算力与基础设施（家具扩展请在布置中调整）','Compute & infrastructure (furniture via Arrange office)')}</h4>
      <div class="ui2-hw-grid">
       {hardwareItems.map(([id,level])=>{
        const price=[600,1800,4500,10000,24000][level]??null;
        return <article class="ui2-card ui2-hw-card" key={id}>
         <div class="ui2-card-head">
          <img class="art-icon" src={`./art/upgrades/hardware-${id}.webp`} alt=""/>
          <div>
           <b>{tr(({compute:'算力集群',storage:'高速存储',network:'园区网络',office:'办公空间'} as Record<string,string>)[id]!,id)}</b>
           <small>Lv.{level} / {catalog.maxHardware}</small>
          </div>
         </div>
         <PipTrack used={level} total={catalog.maxHardware} label={tr('升级进度','Level')}/>
         <button class="primary" disabled={locked||level>=catalog.maxHardware||price===null||view.cash<price} onClick={()=>life('hardware',id)}>
          {level>=catalog.maxHardware?tr('已达最高级','Max level'):`${tr('升级','Upgrade')} ¥${price}`}
         </button>
        </article>;
       })}
      </div>
     </section>

     <section>
      <h4>{tr('软件模块与自动化研发','Software modules & tooling')}</h4>
      <div class="ui2-sw-grid">
       {catalog.software.map(u=>{
        const owned=p.software.includes(u.id),missingPre=u.requires.filter(req=>!p.software.includes(req)),rpShort=Math.max(0,u.research-p.research);
        return <article class="ui2-card ui2-sw-card" key={u.id} data-owned={owned}>
         <div class="ui2-card-head">
          <img class="art-icon" src={softwareArt(u.id)} alt=""/>
          <div>
           <b>{english?u.nameEn:u.name}</b>
           <small>¥{u.cost} · {u.research} RP</small>
          </div>
         </div>
         <small class="ui2-muted-note">{u.requires.length?`${tr('前置','Requires')}: ${u.requires.join(', ')}`:tr('无前置依赖','No prerequisites')}</small>
         <div class="ui2-sw-actions">
          <button class={owned?'':'primary'} disabled={locked||owned||missingPre.length>0||view.cash<u.cost||p.research<u.research} onClick={()=>life('software',u.id)}>
           {owned?tr('已安装','Installed'):missingPre.length?tr('前置未满足','Prereq needed'):tr('研发安装','Research')}
          </button>
          {!owned&&rpShort>0&&<button onClick={onOpenMap}><Icon name="map"/><span>{tr(`差 ${rpShort} RP · 图书馆`,`Need ${rpShort} RP`)}</span></button>}
         </div>
        </article>;
       })}
      </div>
     </section>
    </div>
   )}
  </div>
 );
}
