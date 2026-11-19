import {Dialog} from './dialog.js';
import {Icon} from './icons.js';
import {saveAlertBannerCopy,saveStatusPillText,switchConfirmCopy} from './experience-ui-copy.js';
import type {SwitchTargetKind} from './experience-ui-copy.js';

export type UiSaveStatus={
 kind:'idle'|'dirty'|'saving'|'saved'|'paused'|'error'|'imported-unsaved';
 revision:number;
 lineageId:string;
 savedAt?:number|undefined;
 cause?:'external-change'|'conflict'|'auto-paused'|undefined;
 code?:string|undefined;
 exportable?:boolean|undefined;
 storageUnavailable?:boolean|undefined;
};

export interface SwitchConfirmRequest {
 kind:SwitchTargetKind;
 targetLabelZh:string;
 targetLabelEn:string;
 reason:'paused'|'error'|'storage-unavailable';
}

export function SaveStatusPill({status,english,onClick}:{status:UiSaveStatus;english:boolean;onClick:()=>void}){
 const tr=(zh:string,en:string)=>english?en:zh;
 const text=saveStatusPillText(status,english);
 const alert=status.kind==='paused'||status.kind==='error'||status.kind==='imported-unsaved';
 const icon=alert?'warning':status.kind==='saving'||status.kind==='dirty'?'refresh':'save';
 return (
  <button
   type="button"
   class="ui2-hud-save-pill"
   data-save-kind={status.kind}
   aria-label={tr(`存档状态：${text} · 点击管理存档`,`Save status: ${text} · Manage saves`)}
   title={tr(`存档状态：${text}（修订 ${status.revision}）`,`Save status: ${text} (revision ${status.revision})`)}
   onClick={onClick}
  >
   <Icon name={icon}/>
   <span>{text}</span>
  </button>
 );
}

export function saveBannerIncidentKey(status:UiSaveStatus):string|null{
 if(status.kind!=='paused'&&status.kind!=='error'&&status.kind!=='imported-unsaved')return null;
 const reason=status.storageUnavailable?'storage-unavailable':`${status.cause??''}:${status.code??''}`;
 return `${status.lineageId}:${status.kind}:${reason}`;
}

export function SaveAlertBanner({
 status,
 english,
 busy,
 onExport,
 onOpenSaves,
 onRetry,
 onDismiss
}:{
 status:UiSaveStatus;
 english:boolean;
 busy:boolean;
 onExport:()=>void;
 onOpenSaves?:()=>void;
 onRetry?:()=>void;
 onDismiss?:()=>void;
}){
 const copy=saveAlertBannerCopy(status,english);
 if(!copy)return null;
 const tr=(zh:string,en:string)=>english?en:zh;
 return (
  <section class="ui2-save-banner" data-save-kind={status.kind} role="alert" aria-live="assertive">
   <div class="ui2-save-banner-copy">
    <Icon name="warning"/>
    <div>
     <b>{copy.title}</b>
     <p>{copy.detail}</p>
    </div>
    {onDismiss&&(
     <button
      type="button"
      class="ui2-save-banner-close"
      aria-label={tr('关闭保存提示','Dismiss save alert')}
      title={tr('关闭浮层提示（顶部状态胶囊与存档面板仍可随时查看）','Dismiss banner (status pill and Saves dialog remain available)')}
      onClick={onDismiss}
     >
      <Icon name="close"/>
     </button>
    )}
   </div>
   <div class="ui2-save-banner-actions">
    <button type="button" disabled={busy} onClick={onExport}>
     <Icon name="save"/>
     <span>{tr('导出当前进度','Export current progress')}</span>
    </button>
    {copy.canRetry&&onRetry&&(
     <button type="button" disabled={busy} onClick={onRetry}>
      <Icon name="refresh"/>
      <span>{tr('重试保存','Retry save')}</span>
     </button>
    )}
    {onOpenSaves&&(
     <button type="button" class="primary" disabled={busy} onClick={onOpenSaves}>
      <span>{tr('打开存档恢复','Open saves')}</span>
     </button>
    )}
   </div>
  </section>
 );
}

export function SwitchConfirmDialog({
 request,
 english,
 busy,
 exportedInModal,
 onExport,
 onConfirm,
 onCancel
}:{
 request:SwitchConfirmRequest|null;
 english:boolean;
 busy:boolean;
 exportedInModal:boolean;
 onExport:()=>void;
 onConfirm:()=>void;
 onCancel:()=>void;
}){
 if(!request)return null;
 const targetLabel=english?request.targetLabelEn:request.targetLabelZh;
 const copy=switchConfirmCopy(request.kind,targetLabel,request.reason,english);
 return (
  <Dialog system className="ui2-switch-confirm-dialog" title={copy.title} close={onCancel}>
   <div class="ui2-switch-confirm-body">
    <p class="ui2-switch-warning" role="alert">
     <Icon name="warning"/>
     <span>{copy.warning}</span>
    </p>
    <p>{copy.reasonNote}</p>
    {exportedInModal&&<p class="ui2-inline-hint" role="status"><Icon name="check"/> <span>{copy.exportedHint}</span></p>}
    <div class="ui2-switch-confirm-actions">
     <button type="button" disabled={busy} onClick={onExport}>
      <Icon name="save"/>
      <span>{copy.exportBtn}</span>
     </button>
     <button type="button" class="primary" disabled={busy} onClick={onConfirm}>
      <span>{copy.confirmBtn}</span>
     </button>
     <button type="button" disabled={busy} onClick={onCancel}>
      <span>{copy.cancelBtn}</span>
     </button>
    </div>
   </div>
  </Dialog>
 );
}
