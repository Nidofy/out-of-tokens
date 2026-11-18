import {useState,useRef,useEffect,useLayoutEffect,useMemo} from 'preact/hooks';
import type {ComponentChildren} from 'preact';
import type {GameView} from 'oot-platform';
import {Icon} from './icons.js';
import type {HubPanel} from './ui2-logic.js';
import type {FormattedAdvanceInfo} from './experience-adapter.js';
import {AdvancePreviewPopover} from './advance-preview-ui.js';

type StageHubProps={
 open?:boolean;
 hub:HubPanel;
 switchHub:(next:HubPanel)=>void;
 title:string;
 emblem?:ComponentChildren;
 tabs?:ComponentChildren;
 backAction?:{label:string;onClick:()=>void}|null|undefined;
 notice?:ComponentChildren;
 view:GameView;
 advance:FormattedAdvanceInfo;
 onAdvance:()=>void;
 onOpenReview:(id:string)=>void;
 english:boolean;
 close:()=>void;
 returnFocus?:()=>HTMLElement|null;
 onCancel?:()=>boolean;
 overlay?:ComponentChildren;
 children:ComponentChildren;
};

 export function StageHubShell({open=true,hub,switchHub,title,emblem,tabs,backAction,notice,view,advance,onAdvance,onOpenReview,english,close,returnFocus,onCancel,overlay,children}:StageHubProps){
 const tr=(zh:string,en:string)=>english?en:zh;
 const p=view.campaign!;
 const dialogRef=useRef<HTMLDialogElement>(null);
 const [confirmAdvance,setConfirmAdvance]=useState(false);
 const [previewOpen,setPreviewOpen]=useState(false);
 const previewTriggerRef=useRef<HTMLButtonElement>(null);
 const suppressEscCloseRef=useRef(false);
 const focusTarget=useRef(returnFocus);
 focusTarget.current=returnFocus;
 const cbRef=useRef({switchHub,onAdvance,onOpenReview,close,onCancel,handleAdvanceClick:()=>{}});
 cbRef.current.switchHub=switchHub;
 cbRef.current.onAdvance=onAdvance;
 cbRef.current.onOpenReview=onOpenReview;
 cbRef.current.close=close;
 cbRef.current.onCancel=onCancel;
 const stateRef=useRef({previewOpen,confirmAdvance});
 stateRef.current={previewOpen,confirmAdvance};

 useLayoutEffect(()=>{
  if(dialogRef.current)dialogRef.current.inert=!open;
 },[open]);

 useEffect(()=>{
  const node=dialogRef.current;
  if(!open){
   setConfirmAdvance(false);
   setPreviewOpen(false);
   return;
  }
  if(node&&!node.contains(document.activeElement))node.focus({preventScroll:true});
  const onWinKey=(e:KeyboardEvent)=>{
   if(document.querySelector('dialog[open]:not(.stage-hub)'))return;
   if(e.key==='Escape'){
    e.preventDefault();
    e.stopPropagation();
    if(suppressEscCloseRef.current){suppressEscCloseRef.current=false;return;}
    if(stateRef.current.previewOpen){
     setPreviewOpen(false);
     requestAnimationFrame(()=>previewTriggerRef.current?.focus({preventScroll:true}));
     return;
    }
    if(stateRef.current.confirmAdvance){setConfirmAdvance(false);return;}
    if(cbRef.current.onCancel?.())return;
    cbRef.current.close();
    return;
   }
   if(e.key==='Tab'&&node){
    const list=Array.from(node.querySelectorAll<HTMLElement>('button:not(:disabled),[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])')).filter(el=>el.offsetParent!==null);
    if(!list.length)return;
    if(e.shiftKey){
     if(document.activeElement===list[0]||document.activeElement===node){
      e.preventDefault();
      list[list.length-1]!.focus({preventScroll:true});
     }
    }else if(document.activeElement===list[list.length-1]||!node.contains(document.activeElement)){
     e.preventDefault();
     list[0]!.focus({preventScroll:true});
    }
   }
  };
  window.addEventListener('keydown',onWinKey,true);
  return()=>{
   window.removeEventListener('keydown',onWinKey,true);
   requestAnimationFrame(()=>{
    if(!document.querySelector('dialog[open],[role="dialog"][aria-modal="true"]'))focusTarget.current?.()?.focus({preventScroll:true});
   });
  };
 },[open]);

 const hasReviewJob=view.jobs.some(j=>j.status==='review');
 const systems:{id:HubPanel;icon:string;label:string;badge?:boolean}[]=[
  {id:'actors',icon:'people',label:tr('伙伴','Team')},
  {id:'jobs',icon:'briefcase',label:tr('委托','Jobs'),badge:hasReviewJob},
  {id:'studio',icon:'home',label:tr('工作室','Studio'),badge:view.chapterGoal.ready},
  {id:'journal',icon:'book',label:tr('手账','Journal')}
 ];

 const handleAdvanceClick=()=>{
  if(advance.disabled)return;
  if(advance.urgentReviewIds.length>0&&!confirmAdvance){
   setConfirmAdvance(true);
   return;
  }
  setConfirmAdvance(false);
  cbRef.current.onAdvance();
 };
 cbRef.current.handleAdvanceClick=handleAdvanceClick;

 const railNav=useMemo(()=>(
  <nav class="stage-hub-rail" aria-label={tr('主系统导航','Primary systems')}>
   {systems.map(item=><button key={item.id} aria-pressed={hub===item.id} onClick={()=>{setConfirmAdvance(false);cbRef.current.switchHub(item.id);}} title={item.label}>
    <Icon name={item.icon}/><span>{item.label}</span>{item.badge&&<i class="ui2-dot" aria-hidden="true"/>}
   </button>)}
  </nav>
 ),[hub,english,hasReviewJob,view.chapterGoal.ready]);

 const bottomNav=useMemo(()=>(
  <nav class="stage-hub-bottom-nav" aria-label={tr('主系统切换','Switch system')}>
   {systems.map(item=><button key={item.id} aria-pressed={hub===item.id} onClick={()=>{setConfirmAdvance(false);cbRef.current.switchHub(item.id);}}>
    <Icon name={item.icon}/><span>{item.label}</span>{item.badge&&<i class="ui2-dot" aria-hidden="true"/>}
   </button>)}
  </nav>
 ),[hub,english,hasReviewJob,view.chapterGoal.ready]);

 const headerRight=useMemo(()=>(
  <div class="stage-hub-right">
   <div class="stage-hub-currencies" aria-label={tr('工作室资产','Studio resources')}>
    <span class={view.liquidCash<0?'is-crisis':''} title={tr(`账面现金 ¥${view.cash.toFixed(0)} · 净偿付资金 ¥${view.liquidCash.toFixed(0)}`,`Cash ¥${view.cash.toFixed(0)} · Net solvency ¥${view.liquidCash.toFixed(0)}`)}>
     <Icon name="wallet"/><b>¥{view.cash.toFixed(0)}</b>
    </span>
    <span class="hub-curr-quota" title={tr('云端额度','Cloud quota')}>
     <Icon name="bolt"/><b>{(view.quota+view.purchased).toFixed(0)} T</b>
    </span>
    <span class="hub-curr-rp" title={tr(`声望 ${view.reputation} · 研发点 ${p.research} RP`,`Reputation ${view.reputation} · ${p.research} RP`)}>
     <Icon name="star"/><b>{p.research} RP</b>
    </span>
   </div>
   <button
    ref={previewTriggerRef}
    type="button"
    class="stage-hub-preview-btn"
    aria-expanded={previewOpen}
    aria-label={tr('查看下一时段推进预览','Preview next period')}
    title={tr('展开下一时段预览（不推进）','Expand next period preview (does not advance)')}
    onClick={()=>setPreviewOpen(v=>!v)}
   >
    <Icon name="info"/>
   </button>
   <button class="stage-hub-advance" disabled={advance.disabled} title={advance.disabledReason??advance.subtitle} onClick={()=>cbRef.current.handleAdvanceClick()}>
    <Icon name="play"/><span>{advance.label}</span>
   </button>
   <button class="stage-hub-close" aria-label={tr('关闭面板','Close panel')} onClick={()=>cbRef.current.close()}><Icon name="close"/></button>
  </div>
 ),[view.liquidCash,view.cash,view.quota,view.purchased,view.reputation,p.research,previewOpen,advance,english]);

 return (
  <>
   <div class="stage-hub-scrim" data-open={open?'true':'false'} aria-hidden="true"/>
   <dialog ref={dialogRef} open={open||undefined} aria-hidden={!open?'true':undefined} tabIndex={-1} class="stage-hub" data-hub={hub} data-has-back={backAction?'true':undefined} data-has-tabs={tabs?'true':undefined} aria-modal={open?'true':undefined} aria-label={title} onKeyDown={e=>{if(e.key==='Escape'&&previewOpen){e.preventDefault();e.stopPropagation();suppressEscCloseRef.current=true;queueMicrotask(()=>{suppressEscCloseRef.current=false;});setPreviewOpen(false);requestAnimationFrame(()=>previewTriggerRef.current?.focus({preventScroll:true}));}}}>
    <div class="stage-hub-frame">
     {railNav}
     <div class="stage-hub-main">
      <header class="stage-hub-top">
       <div class="stage-hub-title-row">
        {backAction&&<button class="stage-hub-back" onClick={backAction.onClick}><Icon name="back"/><span>{backAction.label}</span></button>}
        <h2>{emblem}<span>{title}</span></h2>
       </div>
       {tabs&&<div class="stage-hub-tabs">{tabs}</div>}
       {headerRight}
      </header>
      {previewOpen&&(
       <AdvancePreviewPopover
        display={advance}
        open={previewOpen}
        english={english}
        inline
        onClose={()=>{suppressEscCloseRef.current=true;queueMicrotask(()=>{suppressEscCloseRef.current=false;});setPreviewOpen(false);requestAnimationFrame(()=>previewTriggerRef.current?.focus({preventScroll:true}));}}
       />
      )}
      {confirmAdvance&&advance.urgentReviewIds[0]&&(
       <div class="stage-hub-confirm" role="alert">
        <span><Icon name="warning"/> {tr('有即将逾期的待验收委托，直接推进将按违约结算。','A commission awaiting review is due now. Advancing settles it as breached.')}</span>
        <div class="button-row">
         <button onClick={()=>{setConfirmAdvance(false);cbRef.current.onOpenReview(advance.urgentReviewIds[0]!);}}>{tr('去验收','Review now')}</button>
         <button class="primary" onClick={()=>{setConfirmAdvance(false);cbRef.current.onAdvance();}}>{tr('仍要推进','Advance anyway')}</button>
         <button onClick={()=>setConfirmAdvance(false)}>{tr('取消','Cancel')}</button>
        </div>
       </div>
      )}
      {notice&&<div class="stage-hub-notice">{notice}</div>}
      <div class="stage-hub-body">{children}</div>
     </div>
    </div>
    {bottomNav}
    {overlay}
   </dialog>
  </>
 );
}
