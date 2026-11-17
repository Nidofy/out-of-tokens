import {visualReviewEnabled} from './visual-review.js';
import {LabSaves,labSession} from './office-lab.js';
import {presentationEvent,commandFeedbackTarget,nextFeedback,clearLocalFeedback} from './presentation-events.js';
import type {UiFeedback,FeedbackTarget,PresentationEvent} from './presentation-events.js';
import type {SwitchConfirmRequest,UiSaveStatus} from './save-status-ui.js';
import {createSaveEncoder} from './save-encoder-host.js';
import type {ManagedSaveEncoder} from './save-encoder-host.js';
import {useEffect,useRef,useState} from 'preact/hooks';
import {
 BrowserSaves,
 CheckpointCoordinator,
 GameSession,
 HostLineageMap,
 HostSaves,
 manualSlots,
 matchesRevision,
 switchImportedSession
} from 'oot-platform';
import type {LineageMapStorage,SaveSlot,SaveStatus,SaveStorage,StoredSave,WritableSlot} from 'oot-platform';
import type {Command} from 'oot-core';
import {content} from './content.js';

class StorageFeedbackError extends Error {
 constructor(error:unknown){super(error instanceof Error?error.message:String(error));}
}

export function shouldConfirmBeforeSwitch(status:Pick<UiSaveStatus,'kind'|'storageUnavailable'>):boolean{
 return status.kind==='paused'||status.kind==='error'||status.kind==='imported-unsaved'||!!status.storageUnavailable;
}

export function switchReasonFromSaveStatus(status:Pick<UiSaveStatus,'kind'|'storageUnavailable'>):'paused'|'error'|'storage-unavailable'{
 if(status.kind==='imported-unsaved'||status.storageUnavailable)return 'storage-unavailable';
 if(status.kind==='error')return 'error';
 return 'paused';
}

type PendingSwitchAction=SwitchConfirmRequest&{execute:()=>Promise<boolean>};

const SLOT_LINEAGE_PREFIX='oot-ui:__slot_lineage__:';

function safeHostLineageStorage():LineageMapStorage|undefined{
 try{
  if(typeof window==='undefined'||!window.localStorage)return undefined;
  return window.localStorage;
 }catch{return undefined;}
}

function readSlotLineage(slot:SaveSlot,isolated:boolean):string|null{
 if(isolated)return null;
 try{
  const value=localStorage.getItem(SLOT_LINEAGE_PREFIX+slot);
  return value&&value.trim()?value:null;
 }catch{return null;}
}

function writeSlotLineage(slot:SaveSlot,id:string,isolated:boolean):void{
 if(isolated||!id)return;
 try{localStorage.setItem(SLOT_LINEAGE_PREFIX+slot,id);}catch{/* Storage denied never blocks play. */}
}

function createFaultyDevFactory(fault:string|null):IDBFactory{
 if(import.meta.env.DEV&&fault==='storage'){
  return {open(){throw Error('STORAGE_UNAVAILABLE');}} as unknown as IDBFactory;
 }
 return globalThis.indexedDB;
}

export function useGame(){
 const lab=visualReviewEnabled?new URLSearchParams(location.search).get('office-lab'):null;
 const hosted=!lab&&location.pathname.startsWith('/out-of-tokens/web/')&&new URLSearchParams(location.search).get('dsh')==='1';
 const [session]=useState(()=>lab?labSession(content,lab):new GameSession(content));
 const [storage]=useState<SaveStorage>(()=>{
  if(lab)return new LabSaves();
  if(hosted){
   const key=`oot-ui:__host_lineage__:${location.pathname}`;
   return new HostSaves(undefined,undefined,new HostLineageMap(safeHostLineageStorage(),key));
  }
  const fault=new URLSearchParams(location.search).get('test-fault');
  return new BrowserSaves('out-of-tokens-'+content.version,createFaultyDevFactory(fault));
 });
 const [view,setView]=useState(session.view);
 const [busy,setBusy]=useState(true);
 const [records,setRecords]=useState<(StoredSave|null)[]>([]);
 const [feedback,setFeedback]=useState<UiFeedback|null>(null),feedbackId=useRef(0);
 const [lineageId,setLineageId]=useState<string>(()=>session.lineageId);

 const [saveStatus,setSaveStatus]=useState<UiSaveStatus>(()=>{
  const snap=session.workerSnapshot();
  return {kind:'idle',revision:snap.revision,lineageId:snap.lineageId};
 });
 const [pendingSwitch,setPendingSwitch]=useState<PendingSwitchAction|null>(null);
 const [exportedInSwitchModal,setExportedInSwitchModal]=useState(false);

 const coordinatorRef=useRef<CheckpointCoordinator|null>(null);
 const encoderRef=useRef<ManagedSaveEncoder|null>(null);
 const lastKnownAutoRevRef=useRef(0);
 const importedUnsavedRef=useRef(false);
 const unsubRef=useRef<(() => void)|null>(null);
 const mountedRef=useRef(true);
 const lastExternalReportRevRef=useRef<number|null>(null);

 const active=useRef<Promise<unknown>>(Promise.resolve());
 const gate=useRef(true),revisions=useRef<Partial<Record<WritableSlot,number>>>({}),paused=useRef(false),storageUnavailableRef=useRef(false);

 const dismissFeedback=()=>setFeedback(null);
 // Read the latest state even when visit's async close callback predates its DONE report.
 const dismissLocalFeedback=(target:{surface:'job'|'actor';id:string})=>setFeedback(current=>clearLocalFeedback(current,target));
 const report=(code:string,target:FeedbackTarget={surface:'global'},error=false,receipt:PresentationEvent|null=null)=>{
  const next={id:++feedbackId.current,code,target,error,receipt};
  setFeedback(previous=>nextFeedback(previous,next,paused.current));
 };
 // Latest action wins; successful receipts expire, errors require dismissal or another operation.
 useEffect(()=>{if(!feedback||feedback.error)return;const expire=()=>{if(document.activeElement?.closest('.feedback-notice'))timer=setTimeout(expire,1000);else dismissFeedback();};let timer=setTimeout(expire,6000);return()=>clearTimeout(timer);},[feedback?.id]);

 const syncSlotRevisions=(rows:(StoredSave|null)[])=>{
  for(const r of rows){
   if(r&&(r.id==='auto'||manualSlots.includes(r.id as typeof manualSlots[number]))){
    revisions.current[r.id as WritableSlot]=r.revision;
    if(r.id==='auto')lastKnownAutoRevRef.current=r.revision;
   }
  }
 };

 const mapCoordinatorStatus=(raw:SaveStatus):UiSaveStatus=>{
  const live=session.workerSnapshot();
  if(raw.kind==='paused'){
   return {...raw,revision:live.revision,lineageId:live.lineageId};
  }
  if(raw.kind==='error'){
   const unavail=storageUnavailableRef.current||raw.code==='STORAGE_UNAVAILABLE'||raw.code==='STORAGE_BLOCKED';
   if(importedUnsavedRef.current&&unavail){
    return {
     kind:'imported-unsaved',
     revision:live.revision,
     lineageId:live.lineageId,
     code:'IMPORTED_NO_STORAGE',
     exportable:true,
     storageUnavailable:true
    };
   }
   return {...raw,revision:live.revision,lineageId:live.lineageId,storageUnavailable:unavail};
  }
  if(raw.kind==='saved'){
   // Monotonic revision check: older queued writes finishing after a newer command cannot mark live state saved.
   if(!matchesRevision(raw,live)){
    return importedUnsavedRef.current
     ?{kind:'imported-unsaved',revision:live.revision,lineageId:live.lineageId,code:'IMPORTED_UNSAVED',exportable:true,storageUnavailable:storageUnavailableRef.current}
     :{kind:'dirty',revision:live.revision,lineageId:live.lineageId};
   }
   return raw;
  }
  if(importedUnsavedRef.current){
   return {
    kind:'imported-unsaved',
    revision:live.revision,
    lineageId:live.lineageId,
    code:storageUnavailableRef.current?'IMPORTED_NO_STORAGE':'IMPORTED_UNSAVED',
    exportable:true,
    storageUnavailable:storageUnavailableRef.current
   };
  }
  if(!matchesRevision(raw,live)&&raw.kind==='idle'){
   return {kind:'dirty',revision:live.revision,lineageId:live.lineageId};
  }
  return {...raw,revision:live.revision,lineageId:live.lineageId};
 };

 const bindCoordinator=(expectedAutoRev:number):CheckpointCoordinator=>{
  unsubRef.current?.();
  unsubRef.current=null;
  coordinatorRef.current?.dispose();
  if(!encoderRef.current)encoderRef.current=createSaveEncoder();
  lastKnownAutoRevRef.current=expectedAutoRev;
  revisions.current.auto=expectedAutoRev;
  const coord=new CheckpointCoordinator(()=>session.checkpointSnapshot(),storage,expectedAutoRev,encoderRef.current);
  coordinatorRef.current=coord;
  unsubRef.current=coord.subscribe(status=>{
   if(!mountedRef.current||coord!==coordinatorRef.current||status.lineageId!==session.lineageId)return;
   if(status.kind==='paused'){
    paused.current=true;
    setSaveStatus(mapCoordinatorStatus(status));
    if(status.cause==='external-change'&&lastExternalReportRevRef.current!==status.revision){
     lastExternalReportRevRef.current=status.revision;
     report('EXTERNAL_CHANGE',{surface:'global'},true);
    }
    return;
   }
   if(status.kind==='error'){
    const unavail=status.code==='STORAGE_UNAVAILABLE'||status.code==='STORAGE_BLOCKED';
    if(unavail)storageUnavailableRef.current=true;
    setSaveStatus(mapCoordinatorStatus(status));
    return;
   }
   if(status.kind==='saved'){
    const live=session.workerSnapshot();
    if(matchesRevision(status,live)){
     paused.current=false;
     storageUnavailableRef.current=false;
     importedUnsavedRef.current=false;
     lastKnownAutoRevRef.current=revisions.current.auto??lastKnownAutoRevRef.current;
     writeSlotLineage('auto',live.lineageId,!!lab);
     void storage.list().then(rows=>{
      if(!mountedRef.current)return;
      syncSlotRevisions(rows);
      setRecords(rows);
     }).catch(()=>{/* Listing refresh after save is non-fatal. */});
    }
    setSaveStatus(mapCoordinatorStatus(status));
    return;
   }
   setSaveStatus(mapCoordinatorStatus(status));
  });
  return coord;
 };

 // Explicit isolated lab fault injection exercises the real notification path, never player storage.
 useEffect(()=>{
  if(!lab||!visualReviewEnabled||new URLSearchParams(location.search).get('test-fault')!=='storage-events')return;
  const inject=(e:KeyboardEvent)=>{
   if(e.ctrlKey&&e.shiftKey&&e.key==='F9'){e.preventDefault();storage.onExternalChange?.();}
   if(e.ctrlKey&&e.shiftKey&&e.key==='F10'){
    e.preventDefault();
    const coord=coordinatorRef.current;
    if(!coord)return;
    const origWrite=storage.write.bind(storage);
    storage.write=async()=>{
     storage.write=origWrite;
     throw Error('STORAGE_WRITE_FAILED');
    };
    try{coord.enqueue('command');}catch{/* Keep handler clean if already disposed. */}
   }
  };
  window.addEventListener('keydown',inject);
  return()=>window.removeEventListener('keydown',inject);
 },[lab,storage]);

 const run=(work:()=>Promise<void>,target:FeedbackTarget={surface:'global'})=>{
  if(gate.current)return Promise.resolve(false);
  gate.current=true;setBusy(true);
  const task=(async()=>{
   try{await work();return true;}
   catch(e){report(e instanceof SyntaxError?'BAD_JSON':e instanceof Error?e.message:String(e),e instanceof StorageFeedbackError?{surface:'global'}:target,true);return false;}
   finally{gate.current=false;setBusy(false);}
  })();
  active.current=task;return task;
 };

 const list=async()=>{
  const rows=await storage.list();
  syncSlotRevisions(rows);
  setRecords(rows);
 };

 useEffect(()=>{
  mountedRef.current=true;
  let live=true;
  encoderRef.current=createSaveEncoder();
  active.current=(async()=>{
   try{
    const rows=await storage.list();
    if(!live)return;
    syncSlotRevisions(rows);
    setRecords(rows);
    const auto=rows.find(r=>r?.id==='auto');
    if(auto){
     const hydratedLineage=auto.meta?.lineageId??readSlotLineage('auto',!!lab)??undefined;
     await session.importSave(auto.text,hydratedLineage);
     if(!live)return;
     writeSlotLineage('auto',session.lineageId,!!lab);
     setLineageId(session.lineageId);
     setView(session.view);
     bindCoordinator(auto.revision);
     setSaveStatus({kind:'saved',revision:session.workerSnapshot().revision,lineageId:session.lineageId,savedAt:auto.savedAt});
     if(auto.lineageReset)report('LINEAGE_RESET',{surface:'global'},false);
    }else{
     writeSlotLineage('auto',session.lineageId,!!lab);
     setLineageId(session.lineageId);
     bindCoordinator(0);
    }
   }catch(e){
    paused.current=true;
    storageUnavailableRef.current=true;
    const code=e instanceof Error?e.message:'STORAGE_UNAVAILABLE';
    if(live){
     bindCoordinator(0);
     const snap=session.workerSnapshot();
     setSaveStatus({kind:'error',revision:snap.revision,lineageId:snap.lineageId,code,exportable:true,storageUnavailable:true});
     report(code,{surface:'global'},true);
    }
   }finally{
    if(live){gate.current=false;setBusy(false);}
   }
  })();
  return()=>{
   live=false;
   mountedRef.current=false;
   unsubRef.current?.();
   unsubRef.current=null;
   coordinatorRef.current?.dispose();
   coordinatorRef.current=null;
   encoderRef.current?.dispose();
   encoderRef.current=null;
   void storage.close().catch(()=>{});
  };
 },[session,storage]);

 useEffect(()=>{
  const onVis=()=>{
   if(document.visibilityState==='hidden'&&!storageUnavailableRef.current){
    void coordinatorRef.current?.drain().catch(()=>{/* Best-effort drain on backgrounding; never mark saved synthetically. */});
   }
  };
  document.addEventListener('visibilitychange',onVis);
  return()=>document.removeEventListener('visibilitychange',onVis);
 },[]);

 useEffect(()=>{
  if(!hosted)return;
  const receive=(e:MessageEvent)=>{
   if(e.source!==parent||e.origin!==location.origin||e.data?.type!=='oot:checkpoint'||!Number.isSafeInteger(e.data.id))return;
   const id=e.data.id as number;
   void(async()=>{
    await active.current;
    const coord=coordinatorRef.current;
    if(!coord||storageUnavailableRef.current){
     parent.postMessage({type:'oot:checkpoint-result',id,ok:false},location.origin);
     return;
    }
    try{
     coord.enqueue('host-checkpoint');
     const status=await coord.drain();
     const ok=status.kind==='saved'||status.kind==='idle';
     parent.postMessage({type:'oot:checkpoint-result',id,ok},location.origin);
    }catch{
     parent.postMessage({type:'oot:checkpoint-result',id,ok:false},location.origin);
    }
   })();
  };
  window.addEventListener('message',receive);
  parent.postMessage({type:'oot:ready'},location.origin);
  return()=>window.removeEventListener('message',receive);
 },[hosted]);

 const performRestart=(confirmed=false)=>run(async()=>{
  const coord=coordinatorRef.current;
  if(!coord)throw Error('COORDINATOR_MISSING');
  const unlock=session.lockCommands();
  try{
   if(coord.canSwitchWithoutConfirm&&!storageUnavailableRef.current){
    const st=await coord.drain();
    if(st.kind!=='saved'&&st.kind!=='idle')throw Error('SWITCH_REQUIRES_CONFIRMATION');
   }else{
    if(!confirmed)throw Error('SWITCH_REQUIRES_CONFIRMATION');
    if(!coord.canSwitchWithoutConfirm)await coord.abandonPending(true);
   }
  }finally{unlock();}

  const r=session.send({type:'restart'});
  if(r.error)throw Error(r.error);

  let autoRev=0;
  if(!storageUnavailableRef.current){
   try{autoRev=(await storage.read('auto'))?.revision??0;}
   catch{storageUnavailableRef.current=true;}
  }
  paused.current=false;
  importedUnsavedRef.current=false;
  bindCoordinator(autoRev);
  writeSlotLineage('auto',session.lineageId,!!lab);
  setLineageId(session.lineageId);
  setView(session.view);
  report('Restarted',{surface:'global'});
  if(!storageUnavailableRef.current){
   coordinatorRef.current!.enqueue('restart');
  }else{
   const snap=session.workerSnapshot();
   setSaveStatus({kind:'error',revision:snap.revision,lineageId:snap.lineageId,code:'STORAGE_UNAVAILABLE',exportable:true,storageUnavailable:true});
  }
 });

 const send=(cmd:Command,target:FeedbackTarget=commandFeedbackTarget(cmd))=>{
  if(cmd.type==='restart')return performRestart(false);
  return run(async()=>{
   const cashBefore=session.view.cash;
   const r=session.send(cmd);
   if(r.error)throw Error(r.error);
   setView(session.view);
   report(cmd.type==='deliver'?'DELIVERED:'+(session.view.cash-cashBefore).toFixed(2):cmd.type==='accept'?'ACCEPTED':cmd.type==='assign'?'ASSIGNED':cmd.type==='scope'?'ScopeAgreed':r.events.filter(e=>e.type!=='CommandApplied').at(-1)?.type??r.events.at(-1)?.type??'DONE',target,false,presentationEvent(cmd,feedbackId.current+1,session.view.cash-cashBefore));
   const snap=session.workerSnapshot();
   if(storageUnavailableRef.current){
    setSaveStatus(importedUnsavedRef.current
     ?{kind:'imported-unsaved',revision:snap.revision,lineageId:snap.lineageId,code:'IMPORTED_NO_STORAGE',exportable:true,storageUnavailable:true}
     :{kind:'error',revision:snap.revision,lineageId:snap.lineageId,code:'STORAGE_UNAVAILABLE',exportable:true,storageUnavailable:true});
    return;
   }
   coordinatorRef.current?.enqueue(r.events.some(e=>e.type==='DayEnd')?'day-end':'command');
  },target);
 };

 const load=(id:SaveSlot,confirmed=false)=>run(async()=>{
  const coord=coordinatorRef.current;
  if(!coord)throw Error('COORDINATOR_MISSING');
  if(storageUnavailableRef.current&&!confirmed)throw Error('SWITCH_REQUIRES_CONFIRMATION');
  const row=await storage.read(id);
  if(!row)throw Error('NO_SAVE');
  const nextLineage=row.meta?.lineageId??readSlotLineage(id,!!lab)??undefined;
  await switchImportedSession(session,coord,row.text,{
   ...(nextLineage?{lineageId:nextLineage}:{}),
   ...(confirmed?{confirmed:true as const}:{})
  });
  const autoRow=await storage.read('auto');
  const autoRev=autoRow?.revision??0;
  paused.current=false;
  storageUnavailableRef.current=false;
  importedUnsavedRef.current=false;
  writeSlotLineage(id,session.lineageId,!!lab);
  writeSlotLineage('auto',session.lineageId,!!lab);
  if(id==='auto'||manualSlots.includes(id as typeof manualSlots[number]))revisions.current[id as WritableSlot]=row.revision;
  setLineageId(session.lineageId);
  setView(session.view);
  const nextCoord=bindCoordinator(autoRev);
  if(id==='auto'){
   setSaveStatus({kind:'saved',revision:session.workerSnapshot().revision,lineageId:session.lineageId,savedAt:row.savedAt||Date.now()});
  }else{
   nextCoord.enqueue('load');
  }
  report(row.lineageReset?'LINEAGE_RESET':'LOADED',{surface:'saves'});
  await list();
 },{surface:'saves'});

 const save=(id:WritableSlot)=>run(async()=>{
  const coord=coordinatorRef.current;
  if(!coord)throw Error('COORDINATOR_MISSING');
  if(id==='auto'){
   coord.enqueue('command');
   const st=await coord.drain();
   if(st.kind==='error'||st.kind==='paused')throw new StorageFeedbackError(st.kind==='error'?st.code:st.cause);
   await list();
   return;
  }
  const encoder=encoderRef.current??createSaveEncoder();
  const snap=session.checkpointSnapshot();
  const text=await encoder.encode(snap.input);
  revisions.current[id]=await storage.write(id,text,revisions.current[id]??0,'checkpoint',{lineageId:session.lineageId});
  writeSlotLineage(id,session.lineageId,!!lab);
  await list();
  report('SAVED',{surface:'saves'});
 },{surface:'saves'});

 const exportFile=()=>run(async()=>{
  const url=URL.createObjectURL(new Blob([await session.exportSave()],{type:'application/json'})),a=document.createElement('a');
  a.href=url;a.download='out-of-tokens-alpha.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  report('EXPORTED',{surface:'saves'});
 },{surface:'saves'});

 const importFile=(file:File|undefined,confirmed=false)=>run(async()=>{
  if(!file)return;
  if(file.size===0||file.size>8000000)throw Error('INVALID_SAVE_SIZE');
  const coord=coordinatorRef.current;
  if(!coord)throw Error('COORDINATOR_MISSING');
  if(storageUnavailableRef.current&&!confirmed)throw Error('SWITCH_REQUIRES_CONFIRMATION');
  const text=await file.text();
  await switchImportedSession(session,coord,text,confirmed?{confirmed:true as const}:{});
  let autoRev=0,available=true;
  try{autoRev=(await storage.read('auto'))?.revision??0;}catch{available=false;}
  paused.current=!available;
  storageUnavailableRef.current=!available;
  importedUnsavedRef.current=true;
  setLineageId(session.lineageId);
  setView(session.view);
  const nextCoord=bindCoordinator(autoRev);
  setSaveStatus({
   kind:'imported-unsaved',
   revision:session.workerSnapshot().revision,
   lineageId:session.lineageId,
   code:available?'IMPORTED_UNSAVED':'IMPORTED_NO_STORAGE',
   exportable:true,
   storageUnavailable:!available
  });
  if(available)nextCoord.enqueue('import');
  report(available?'LOADED':'IMPORTED_NO_STORAGE',{surface:'saves'});
 },{surface:'saves'});

 const reconcileEmpty=()=>run(async()=>{
  if(!(storage instanceof HostSaves))return;
  const rows=await storage.reconcileEmpty();
  paused.current=false;storageUnavailableRef.current=false;
  syncSlotRevisions(rows);
  setRecords(rows);
  bindCoordinator(0);
  report('RECONCILED_EMPTY',{surface:'saves'});
 },{surface:'saves'});

 const reconcile=()=>run(async()=>{
  if(!(storage instanceof HostSaves))return;
  const encoder=encoderRef.current??createSaveEncoder();
  const text=await encoder.encode(session.checkpointSnapshot().input);
  const result=await storage.reconcile('auto',lastKnownAutoRevRef.current,text);
  paused.current=false;storageUnavailableRef.current=false;
  syncSlotRevisions(result.rows);
  revisions.current.auto=result.revision;
  lastKnownAutoRevRef.current=result.revision;
  setRecords(result.rows);
  bindCoordinator(result.revision);
  const snap=session.workerSnapshot();
  setSaveStatus(result.committed
   ?{kind:'saved',revision:snap.revision,lineageId:snap.lineageId,savedAt:Date.now()}
   :{kind:'dirty',revision:snap.revision,lineageId:snap.lineageId});
  report('RECONCILED',{surface:'saves'});
 },{surface:'saves'});

 const retrySave=()=>run(async()=>{
  const coord=coordinatorRef.current;
  if(!coord||storageUnavailableRef.current)return;
  const st=await coord.retry();
  if(st.kind==='saved'){
   await list();
   report('SAVED',{surface:'saves'});
  }
 },{surface:'saves'});

 const slotLabel=(id:SaveSlot):[string,string]=>{
  const n=id.split('-')[1]??'';
  if(id.startsWith('manual-'))return [`手动档 ${n}`,`Manual slot ${n}`];
  if(id==='auto')return ['自动档','Autosave'];
  return [`边界备份 ${n}`,`Boundary backup ${n}`];
 };

 const needsSwitchConfirmation=()=>{
  const coord=coordinatorRef.current;
  return shouldConfirmBeforeSwitch(saveStatus)||(!!coord&&!coord.canSwitchWithoutConfirm);
 };

 const requestLoad=(id:SaveSlot,afterSwitch?:()=>void)=>{
  const [zh,en]=slotLabel(id);
  const execute=async(confirmed:boolean)=>{const ok=await load(id,confirmed);if(ok)afterSwitch?.();return ok;};
  if(needsSwitchConfirmation()){
   setExportedInSwitchModal(false);
   setPendingSwitch({kind:'load',targetLabelZh:zh,targetLabelEn:en,reason:switchReasonFromSaveStatus(saveStatus),execute:()=>execute(true)});
   return;
  }
  void execute(false);
 };

 const requestImportFile=(file:File|undefined,afterSwitch?:()=>void)=>{
  if(!file)return;
  const execute=async(confirmed:boolean)=>{const ok=await importFile(file,confirmed);if(ok)afterSwitch?.();return ok;};
  if(needsSwitchConfirmation()){
   setExportedInSwitchModal(false);
   setPendingSwitch({kind:'import',targetLabelZh:file.name,targetLabelEn:file.name,reason:switchReasonFromSaveStatus(saveStatus),execute:()=>execute(true)});
   return;
  }
  void execute(false);
 };

 const requestRestart=(afterSwitch?:()=>void)=>{
  const execute=async(confirmed:boolean)=>{const ok=await performRestart(confirmed);if(ok)afterSwitch?.();return ok;};
  if(needsSwitchConfirmation()){
   setExportedInSwitchModal(false);
   setPendingSwitch({kind:'restart',targetLabelZh:'继承经验重开',targetLabelEn:'Restart with founder XP',reason:switchReasonFromSaveStatus(saveStatus),execute:()=>execute(true)});
   return;
  }
  void execute(false);
 };

 const confirmPendingSwitch=async()=>{
  const req=pendingSwitch;
  if(!req)return;
  const ok=await req.execute();
  if(ok)setPendingSwitch(null);
 };

 const cancelPendingSwitch=()=>{
  setPendingSwitch(null);
  setExportedInSwitchModal(false);
 };

 const exportFromSwitchModal=async()=>{
  const ok=await exportFile();
  if(ok)setExportedInSwitchModal(true);
 };

 return{
  lab,feedback,dismissFeedback,dismissLocalFeedback,reconcile,reconcileEmpty,hosted,session,view,busy,records,
  lineageId,saveStatus,pendingSwitch,exportedInSwitchModal,
  send,load,save,exportFile,importFile,retrySave,
  requestLoad,requestImportFile,requestRestart,confirmPendingSwitch,cancelPendingSwitch,exportFromSwitchModal,
  refresh:()=>run(list)
 };
}
