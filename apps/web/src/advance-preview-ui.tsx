import {useEffect,useRef} from 'preact/hooks';
import {Icon} from './icons.js';
import type {AdvanceFactRow,FormattedAdvanceInfo} from './experience-adapter.js';
import {periodText} from './decision-panels.js';

function FactSection({title,rows,tone}:{title:string;rows:AdvanceFactRow[];tone?:'warn'|'danger'}){
 if(rows.length===0)return null;
 return (
  <div class={`ui2-adv-group${tone?` is-${tone}`:''}`}>
   <h5>{title}</h5>
   <ul>
    {rows.map((r,i)=>(
     <li key={i}>
      <span>{r.text}</span>
      {r.certainty==='conditional'&&<em>?</em>}
     </li>
    ))}
   </ul>
  </div>
 );
}

export function AdvancePreviewPopover({
 display,
 open,
 english,
 inline=false,
 onClose
}:{
 display:FormattedAdvanceInfo;
 open:boolean;
 english:boolean;
 inline?:boolean;
 onClose:()=>void;
}){
 const panelRef=useRef<HTMLElement>(null);
 const tr=(zh:string,en:string)=>english?en:zh;

 useEffect(()=>{
  if(!open)return;
  panelRef.current?.focus({preventScroll:true});
 },[open]);

 if(!open)return null;

 return (
  <section
   ref={panelRef}
   tabIndex={-1}
   class={`ui2-advance-popover${inline?' is-in-hub':''}`}
   role="region"
   aria-label={tr('推进下一时段预览','Next period advance preview')}
   onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();onClose();}}}
  >
   <header class="ui2-adv-pop-head">
    <div>
     <small>{periodText(display.slot,english)} → {periodText(display.nextSlot,english)}</small>
     <h4>{tr('本时段推进预览（不会提前扣费推进）','Next period preview (read-only)')}</h4>
    </div>
    <button type="button" class="ui2-adv-pop-close" aria-label={tr('收起推进预览','Close advance preview')} onClick={onClose}>
     <Icon name="close"/>
    </button>
   </header>

   <div class="ui2-adv-pop-body">
    {display.blocked&&(
     <p class="ui2-adv-alert is-danger">
      <Icon name="warning"/> {display.disabledReason??display.subtitle}
     </p>
    )}
    {display.nightNoOvertime&&(
     <p class="ui2-adv-note">
      <Icon name="clock"/> {tr('晚间无加班安排，合同本时段不推进，伙伴以休息/私生活结算。','No overtime scheduled for night/evening; contracts pause while teammates rest or attend activities.')}
     </p>
    )}

    <FactSection title={tr('停工风险与算力预警','Stalls & capacity alerts')} rows={display.stops} tone="danger"/>
    <FactSection title={tr('预计执勤与加班','Scheduled work & overtime')} rows={display.working}/>
    <FactSection title={tr('预计休整与恢复','Rest & recovery')} rows={display.resting}/>
    <FactSection title={tr('深夜恢复被活动跳过','Sleep recovery skipped')} rows={display.recoverySkipped} tone="warn"/>
    <FactSection title={tr('等待中委托','Waiting commissions')} rows={display.waiting}/>
    <FactSection title={tr('合同到期提示','Deadlines')} rows={display.deadlines} tone="warn"/>
    <FactSection title={tr('即将触发账单','Upcoming bills')} rows={display.bills} tone="warn"/>

    {display.conditionalNote&&(
     <p class="ui2-adv-cond">
      <Icon name="info"/> {display.conditionalNote}
     </p>
    )}
   </div>
  </section>
 );
}
