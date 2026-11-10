import {useLayoutEffect,useRef} from 'preact/hooks';
import type {ComponentChildren} from 'preact';
import {manualSlots,saveSlots} from 'oot-platform';
import type {SaveSlot,StoredSave,WritableSlot} from 'oot-platform';

export function Dialog({title,close,children,dismissible=true,className='',layout,system=false,notice,returnFocus}:{title:string;close:()=>void;children:ComponentChildren;dismissible?:boolean;className?:string;layout?:'tri'|'single';system?:boolean;notice?:ComponentChildren;returnFocus?:()=>HTMLElement|null}){
 const ref=useRef<HTMLDialogElement>(null);
 useLayoutEffect(()=>{
  const previous=returnFocus?.()??document.activeElement as HTMLElement|null,dialog=ref.current!;
  dialog.showModal();dialog.focus({preventScroll:true});
  return()=>{dialog.close();queueMicrotask(()=>{
   // A replacement modal owns focus; restoring an old trigger would steal it.
   if(document.querySelector('dialog[open],[role="dialog"][aria-modal="true"]'))return;
   if(previous?.isConnected)previous.focus({preventScroll:true});
  });};
 },[]);
 return <dialog data-layout={layout} class={`${className}${system?' system-dialog':''}`} ref={ref} tabIndex={-1} aria-label={title} onCancel={e=>{e.preventDefault();if(dismissible)close();}}><div class="dialog-head"><h2>{title}</h2>{dismissible&&<button aria-label="Close / 关闭" onClick={close}>×</button>}</div>{system?<>{notice&&<div class="system-notice">{notice}</div>}<div class="system-body">{children}</div></>:children}</dialog>;
}

/** Stable slot IDs own records; partial or reordered storage responses never relabel a save. */
export function saveSlotRows(records:readonly (StoredSave|null)[],busy:boolean){
 return saveSlots.map(id=>{const record=records.find(r=>r?.id===id)??null,manual=manualSlots.includes(id as typeof manualSlots[number]);return {id,record,manual,canSave:manual&&!busy,canLoad:!!record&&!busy};});
}
export function SaveSlots({records,busy,english,save,load}:{records:readonly (StoredSave|null)[];busy:boolean;english:boolean;save:(id:WritableSlot)=>void;load:(id:SaveSlot)=>void}){
 const tr=(zh:string,en:string)=>english?en:zh,rows=saveSlotRows(records,busy);
 const renderRows=(kind:'manual'|'auto'|'backup')=>rows.filter(r=>kind==='manual'?r.manual:kind==='auto'?r.id==='auto':r.id.startsWith('backup-')).map(row=>{
  const number=row.id.split('-')[1],label=row.manual?tr(`手动档 ${number}`,`Manual slot ${number}`):row.id==='auto'?tr('自动档','Autosave'):tr(`备份 ${number}`,`Backup ${number}`);
  return <li class="save-row" key={row.id} data-slot={row.id}><div class="save-meta"><b>{label}</b>{row.record?<time dateTime={new Date(row.record.savedAt).toISOString()}>{new Date(row.record.savedAt).toLocaleString(english?'en':'zh-CN')}</time>:<span class="save-empty">{tr('空','Empty')}</span>}</div><div class="save-actions">{row.manual&&<button disabled={!row.canSave} aria-label={`${tr('保存','Save')} · ${label}`} onClick={()=>save(row.id as WritableSlot)}>{tr('保存','Save')}</button>}<button disabled={!row.canLoad} aria-label={`${tr('载入','Load')} · ${label}`} onClick={()=>load(row.id)}>{tr('载入','Load')}</button></div></li>;
 });
 return <div class="save-groups"><section aria-label={tr('手动存档','Manual saves')}><h3>{tr('手动存档','Manual saves')}</h3><ul>{renderRows('manual')}</ul></section><section aria-label={tr('自动存档','Automatic save')}><h3>{tr('自动存档','Automatic save')}</h3><p class="system-caption">{tr('由游戏自动保存；有记录后可载入。','Saved by the game. Load is available when a record exists.')}</p><ul>{renderRows('auto')}</ul></section><details class="save-backups"><summary>{tr('备份档','Backups')} · 5</summary><p class="system-caption">{tr('保存产生的历史备份；空槽位暂不可载入。','Earlier backups created by saves. Empty slots cannot be loaded.')}</p><ul>{renderRows('backup')}</ul></details></div>;
}
