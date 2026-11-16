import type {RefObject} from 'preact';
import {useState} from 'preact/hooks';
import type {GameView} from 'oot-platform';
import {Icon} from './icons.js';
import {PeriodClockIcon,PeriodDots} from './ornaments.js';
import type {AdvanceInfo,HubPanel} from './ui2-logic.js';

export interface FloatDelta {
 id:number;
 kind:'cash'|'quota'|'rp';
 text:string;
 positive:boolean;
}

type HudBarProps={
 view:GameView;
 english:boolean;
 dark:boolean;
 still:boolean;
 locked:boolean;
 hud:'board'|'view'|'more'|null;
 panel:HubPanel|null;
 placeLabel:string;
 chapterTitle:string;
 advance:AdvanceInfo;
 deltas:FloatDelta[];
 onDismissDelta:(id:number)=>void;
 onOpenHud:(next:'board'|'view'|'more')=>void;
 onOpenMap:()=>void;
 onOpenStudioFinance:()=>void;
 onOpenPanel:(next:HubPanel)=>void;
 onOpenOffice:()=>void;
 onOpenSaves:()=>void;
 onOpenSettings:()=>void;
 onToggleLocale:()=>void;
 onToggleTheme:()=>void;
 onAdvance:()=>void;
 onOpenJob:(id:string)=>void;
 moreTrigger:RefObject<HTMLButtonElement|null>;
 boardTrigger:RefObject<HTMLButtonElement|null>;
 jobsTrigger:RefObject<HTMLButtonElement|null>;
};

export function HudBar(props:HudBarProps){
 const {view,english,dark,still,locked,hud,panel,placeLabel,chapterTitle,advance,deltas,onDismissDelta,onOpenHud,onOpenMap,onOpenStudioFinance,onOpenPanel,onOpenOffice,onOpenSaves,onOpenSettings,onToggleLocale,onToggleTheme,onAdvance,onOpenJob,moreTrigger,boardTrigger,jobsTrigger}=props;
 const tr=(zh:string,en:string)=>english?en:zh;
 const p=view.campaign!;
 const [confirmAdvance,setConfirmAdvance]=useState(false);
 const slotInWeek=view.absoluteSlot%28,daysToWeekly=Math.max(1,Math.ceil((28-slotInWeek)/4));
 const periodNames=[tr('上午','Morning'),tr('下午','Afternoon'),tr('晚上','Evening'),tr('深夜','Night')];
 const reviewCount=view.jobs.filter(j=>j.status==='review').length;
 const alertCount=reviewCount+(view.liquidCash<0?1:0)+(view.debtDue>0&&view.absoluteSlot<view.debtSlot?1:0);

 const handleAdvance=()=>{
  if(advance.disabled)return;
  if(advance.urgentReviewIds.length>0&&!confirmAdvance){
   setConfirmAdvance(true);
   return;
  }
  setConfirmAdvance(false);
  onAdvance();
 };

 return (
  <>
   <header class="studio-hud ui2-hud">
    <div class="ui2-clock-pill" title={tr(`第${view.day}天 · 距周结约 ${daysToWeekly} 天`,`Day ${view.day} · Weekly bill in ~${daysToWeekly}d`)}>
     <PeriodClockIcon slot={view.absoluteSlot}/>
     <span class="village-time">{tr('第','Day ')}{view.day}{tr('天','')} · {periodNames[view.absoluteSlot%4]}</span>
     <PeriodDots slot={view.absoluteSlot}/>
     <small class="ui2-week-countdown">{tr(`周结${daysToWeekly}d`,`Bill ${daysToWeekly}d`)}</small>
    </div>
    <button class="hud-place" title={`${chapterTitle} · ${tr('打开园区地图','Open studio map')}`} onClick={onOpenMap}>
     <Icon name="pin"/><span>{placeLabel}</span>
    </button>
    <div class="hud-resources ui2-resources">
     <button class={view.liquidCash<0?'is-crisis':''} aria-label={tr(`账面现金 ¥${view.cash.toFixed(0)}，净偿付资金 ¥${view.liquidCash.toFixed(0)}`,`Cash ¥${view.cash.toFixed(0)}, net solvency ¥${view.liquidCash.toFixed(0)}`)} title={tr(`账面现金 ¥${view.cash.toFixed(0)} · 净偿付资金 ¥${view.liquidCash.toFixed(0)}`,`Cash ¥${view.cash.toFixed(0)} · Net solvency ¥${view.liquidCash.toFixed(0)}`)} onClick={onOpenStudioFinance}>
      {view.liquidCash<0?<Icon name="warning"/>:<Icon name="wallet"/>}
      <span>¥{view.cash.toFixed(0)}</span>
     </button>
     <button aria-label={tr('云端额度','Cloud quota')} title={tr('云端算力额度 · 点击管理','Cloud compute quota · Manage')} onClick={onOpenStudioFinance}>
      <Icon name="bolt"/>
      <span>{(view.quota+view.purchased).toFixed(0)} T</span>
     </button>
     <button class="hud-local-cap" aria-label={tr('单槽本地算力上限','Local capacity per slot')} title={tr('单槽本地算力上限','Local compute capacity')} onClick={onOpenStudioFinance}>
      <Icon name="chip"/>
      <span>{view.localCapacity}</span>
     </button>
     <button class="hud-rep-rp" aria-label={tr(`声望 ${view.reputation}，研发点 ${p.research} RP`,`Reputation ${view.reputation}, ${p.research} RP`)} title={tr(`声望 ${view.reputation} · 研发点 ${p.research} RP`,`Reputation ${view.reputation} · ${p.research} RP`)} onClick={()=>onOpenPanel('studio')}>
      <Icon name="star"/>
      <span>{view.reputation} · {p.research} RP</span>
     </button>
     {!still&&deltas.length>0&&(
      <div class="ui2-delta-layer" aria-hidden="true">
       {deltas.map(d=><span key={d.id} class={`ui2-delta-pop ${d.positive?'is-up':'is-down'}`} onAnimationEnd={()=>onDismissDelta(d.id)}>{d.text}</span>)}
      </div>
     )}
    </div>
    <span class="hud-spacer"/>
    <button ref={boardTrigger} class="ui2-hud-icon" title={tr('工作看板与待办','Work board & notices')} aria-label={tr('工作看板与待办','Work board & notices')} aria-expanded={hud==='board'} onClick={()=>onOpenHud('board')}>
     <Icon name="notifications"/>{alertCount>0&&<i class="hud-badge"/>}
    </button>
    <button class="ui2-hud-icon" title={tr('视角控制','Scene camera')} aria-label={tr('视角控制','Scene camera')} aria-expanded={hud==='view'} onClick={()=>onOpenHud('view')}>
     <Icon name="view"/>
    </button>
    <button ref={moreTrigger} class="ui2-hud-icon" title={tr('工作室终端','Studio terminal')} aria-label={tr('工作室终端','Studio terminal')} aria-expanded={hud==='more'} onClick={()=>onOpenHud('more')}>
     <Icon name="terminal"/>
    </button>
   </header>

   {hud==='more'&&(
    <section class="hud-popover ui2-terminal" aria-label={tr('工作室终端','Studio terminal')} onKeyDown={e=>{if(e.key==='Escape')onOpenHud('more');}}>
     <header class="drawer-head">
      <h2><Icon name="terminal"/> {tr('工作室终端','Studio terminal')}</h2>
      <button aria-label={tr('关闭面板','Close panel')} onClick={()=>onOpenHud('more')}><Icon name="close"/></button>
     </header>
     <div class="drawer-content ui2-terminal-body">
      <div class="ui2-terminal-card">
       <small>{tr(`第 ${p.chapter} 章 · ${chapterTitle}`,`Chapter ${p.chapter} · ${chapterTitle}`)}</small>
       <div class="ui2-terminal-stats">
        <span>{tr('净偿付资金','Net solvency')} <b>¥{view.liquidCash.toFixed(0)}</b></span>
        <span>{tr('声望','Reputation')} <b>{view.reputation}</b></span>
        <span>{tr('研发点','Research')} <b>{p.research} RP</b></span>
       </div>
      </div>
      <div class="ui2-terminal-grid">
       {view.office&&<button disabled={locked||p.scene!=='workshop'} title={p.scene!=='workshop'?tr('仅在工作室场景可布置','Available in workshop scene'):''} onClick={onOpenOffice}><Icon name="decor"/><span>{tr('布置办公室','Arrange office')}</span></button>}
       <button onClick={()=>onOpenHud('board')}><Icon name="notifications"/><span>{tr('工作看板','Work board')}</span></button>
       <button onClick={onOpenMap}><Icon name="map"/><span>{tr('园区地图','Studio map')}</span></button>
       <button onClick={onOpenSaves}><Icon name="save"/><span>{tr('存档与备份','Saves')}</span></button>
       <button onClick={onOpenSettings}><Icon name="settings"/><span>{tr('系统设置','Settings')}</span></button>
       <button onClick={()=>onOpenPanel('journal')}><Icon name="book"/><span>{tr('事务所履历','Chronicle')}</span></button>
      </div>
      <div class="ui2-terminal-toggles">
       <button aria-pressed={english} onClick={onToggleLocale}><Icon name="locale"/><span>{english?'English':'中文'}</span></button>
       <button aria-pressed={dark} onClick={onToggleTheme}><Icon name={dark?'moon':'sun'}/><span>{dark?tr('深色模式','Dark mode'):tr('浅色模式','Light mode')}</span></button>
      </div>
     </div>
    </section>
   )}

   <nav class="studio-dock ui2-dock" aria-label={tr('工作室导航','Studio navigation')}>
    {(['actors','jobs','studio','journal'] as const).map((id,i)=><button key={id} ref={id==='jobs'?jobsTrigger:null} aria-pressed={panel===id} onClick={()=>onOpenPanel(id)}>
     <Icon name={['people','briefcase','home','book'][i]!}/>
     <span>{[tr('伙伴','Team'),tr('委托','Jobs'),tr('工作室','Studio'),tr('手账','Journal')][i]}</span>
     {id==='jobs'&&reviewCount>0&&<i class="dock-dot"/>}
     {id==='studio'&&view.chapterGoal.ready&&<i class="dock-dot is-ready"/>}
    </button>)}
   </nav>

   <div class="ui2-advance-wrap">
    {confirmAdvance&&advance.urgentReviewIds[0]&&(
     <div class="ui2-advance-confirm" role="alert">
      <p><Icon name="warning"/> {tr('有待验收委托即将逾期，直接推进将按违约结算。','A commission awaiting review is due now. Advancing will breach it.')}</p>
      <div class="button-row">
       <button onClick={()=>{setConfirmAdvance(false);onOpenJob(advance.urgentReviewIds[0]!);}}>{tr('先去验收','Review first')}</button>
       <button class="primary" onClick={()=>{setConfirmAdvance(false);onAdvance();}}>{tr('仍推进','Proceed')}</button>
       <button onClick={()=>setConfirmAdvance(false)}>{tr('取消','Cancel')}</button>
      </div>
     </div>
    )}
    <button class="advance-period ui2-advance-btn" disabled={advance.disabled} title={advance.disabledReason??advance.subtitle} onClick={handleAdvance} data-urgent={advance.urgentReviewIds.length>0}>
     <span class="ui2-advance-icon"><Icon name="play"/></span>
     <span class="ui2-advance-copy">
      <b>{advance.label}</b>
      <small>{advance.disabledReason??advance.subtitle}</small>
     </span>
    </button>
   </div>
  </>
 );
}
