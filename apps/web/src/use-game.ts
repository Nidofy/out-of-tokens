import {visualReviewEnabled} from './visual-review.js';
import {LabSaves,labSession} from './office-lab.js';
import {presentationEvent,commandFeedbackTarget,nextFeedback,clearLocalFeedback} from './presentation-events.js';
import type {UiFeedback,FeedbackTarget,PresentationEvent} from './presentation-events.js';
import type {SwitchConfirmRequest,UiSaveStatus} from './save-status-ui.js';
import {useEffect,useRef,useState} from 'preact/hooks';
import {BrowserSaves,HostSaves,GameSession,manualSlots} from 'oot-platform';
import type {SaveSlot,StoredSave,WritableSlot} from 'oot-platform';
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

function freshLineageId():string{
 return typeof globalThis.crypto?.randomUUID==='function'?globalThis.crypto.randomUUID():`run-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
}

const SLOT_LINEAGE_PREFIX='oot-ui:__slot_lineage__:';

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

export function useGame(){
 const lab=visualReviewEnabled?new URLSearchParams(location.search).get('office-lab'):null;
 const hosted=!lab&&location.pathname.startsWith('/out-of-tokens/web/')&&new URLSearchParams(location.search).get('dsh')==='1';
 const [session]=useState(()=>lab?labSession(content,lab):new GameSession(content));
 const [storage]=useState(()=>lab?new LabSaves():hosted?new HostSaves():new BrowserSaves('out-of-tokens-'+content.version,import.meta.env.DEV && new URLSearchParams(location.search).get('test-fault')==='storage' ? {open(){throw Error('STORAGE_UNAVAILABLE');}} as unknown as IDBFactory : globalThis.indexedDB));
 const [view,setView]=useState(session.view);
 const [busy,setBusy]=useState(true);
 const [records,setRecords]=useState<(StoredSave|null)[]>([]);
 const [feedback,setFeedback]=useState<UiFeedback|null>(null),feedbackId=useRef(0);
 const [lineageId,setLineageId]=useState<string>(()=>(lab?`lab-${lab}`:freshLineageId()));
 const sessionRevRef=useRef(0);
 const savedRevRef=useRef(0);
 const lineageRef=useRef(lineageId);
 lineageRef.current=lineageId;

 const [saveStatus,setSaveStatus]=useState<UiSaveStatus>(()=>({kind:'idle',revision:0,lineageId}));
 const [pendingSwitch,setPendingSwitch]=useState<PendingSwitchAction|null>(null);
 const [exportedInSwitchModal,setExportedInSwitchModal]=useState(false);

 const publishSave=(next:UiSaveStatus)=>{
  setSaveStatus(next);
 };

 const dismissFeedback=()=>setFeedback(null);
 // Read the latest state even when visit's async close callback predates its DONE report.
 const dismissLocalFeedback=(target:{surface:'job'|'actor';id:string})=>setFeedback(current=>clearLocalFeedback(current,target));
 const report=(code:string,target:FeedbackTarget={surface:'global'},error=false,receipt:PresentationEvent|null=null)=>{const next={id:++feedbackId.current,code,target,error,receipt};setFeedback(previous=>nextFeedback(previous,next,paused.current));};
 // Latest action wins; successful receipts expire, errors require dismissal or another operation.
 useEffect(()=>{if(!feedback||feedback.error)return;const expire=()=>{if(document.activeElement?.closest('.feedback-notice'))timer=setTimeout(expire,1000);else dismissFeedback();};let timer=setTimeout(expire,6000);return()=>clearTimeout(timer);},[feedback?.id]);

 const savedAuto=useRef('');
 const desktop=new URLSearchParams(location.search).get('desktop')==='1';
 const active=useRef<Promise<unknown>>(Promise.resolve());
 const gate=useRef(true),revisions=useRef<Partial<Record<WritableSlot,number>>>({}),paused=useRef(false),storageUnavailableRef=useRef(false);

 // Explicit isolated lab fault injection exercises the real notification path, never player storage.
 useEffect(()=>{
  if(!lab||!visualReviewEnabled||new URLSearchParams(location.search).get('test-fault')!=='storage-events')return;
  const inject=(e:KeyboardEvent)=>{
   if(e.ctrlKey&&e.shiftKey&&e.key==='F9'){e.preventDefault();storage.onExternalChange?.();}
   if(e.ctrlKey&&e.shiftKey&&e.key==='F10'){
    e.preventDefault();
    publishSave({kind:'error',revision:sessionRevRef.current,lineageId:lineageRef.current,code:'STORAGE_WRITE_FAILED',exportable:true,storageUnavailable:false});
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

 const list=async()=>setRecords(await storage.list());

 const write=async(id:WritableSlot,targetRevision=sessionRevRef.current,targetLineage=lineageRef.current)=>{
  if(id==='auto'&&paused.current)throw Error('AUTO_PAUSED');
  const text=await session.exportSave();
  if(id==='auto'&&savedAuto.current===text){
   if(targetLineage===lineageRef.current){
    savedRevRef.current=Math.max(savedRevRef.current,targetRevision);
    publishSave(savedRevRef.current>=sessionRevRef.current
     ?{kind:'saved',revision:sessionRevRef.current,lineageId:targetLineage,savedAt:Date.now()}
     :{kind:'dirty',revision:sessionRevRef.current,lineageId:targetLineage});
   }
   return;
  }
  if(id==='auto'&&targetLineage===lineageRef.current){
   publishSave({kind:'saving',revision:sessionRevRef.current,lineageId:targetLineage});
  }
  try{
   revisions.current[id]=await storage.write(id,text,revisions.current[id]??0);
   if(id==='auto'){
    savedAuto.current=text;
    writeSlotLineage('auto',targetLineage,!!lab);
    if(targetLineage===lineageRef.current){
     savedRevRef.current=Math.max(savedRevRef.current,targetRevision);
     publishSave(savedRevRef.current>=sessionRevRef.current
      ?{kind:'saved',revision:sessionRevRef.current,lineageId:targetLineage,savedAt:Date.now()}
      :{kind:'dirty',revision:sessionRevRef.current,lineageId:targetLineage});
    }
   }else{
    writeSlotLineage(id,lineageRef.current,!!lab);
   }
   await list();
  }catch(e){
   const code=e instanceof Error?e.message:'STORAGE_WRITE_FAILED';
   if(id==='auto'){
    if(code==='SAVE_CONFLICT'){
     paused.current=true;
     publishSave({kind:'paused',cause:'conflict',revision:sessionRevRef.current,lineageId:lineageRef.current});
    }else{
     const unavail=code==='STORAGE_UNAVAILABLE'||code==='STORAGE_BLOCKED';
     if(unavail)storageUnavailableRef.current=true;
     publishSave({kind:'error',revision:sessionRevRef.current,lineageId:lineageRef.current,code,exportable:true,storageUnavailable:unavail});
    }
   }
   throw e;
  }
 };

 useEffect(()=>{
  let live=true;
  storage.onExternalChange=()=>{
   paused.current=true;
   if(live){
    publishSave({kind:'paused',cause:'external-change',revision:sessionRevRef.current,lineageId:lineageRef.current});
    report('EXTERNAL_CHANGE',{surface:'global'},true);
   }
  };
  active.current=(async()=>{
   try{
    const rows=await storage.list();
    if(!live)return;
    setRecords(rows);
    for(const r of rows)if(r&&(r.id==='auto'||manualSlots.includes(r.id as typeof manualSlots[number])))revisions.current[r.id as WritableSlot]=r.revision;
    const auto=rows.find(r=>r?.id==='auto');
    if(auto){
     await session.importSave(auto.text);
     const hydratedLineage=readSlotLineage('auto',!!lab)??lineageRef.current;
     lineageRef.current=hydratedLineage;
     writeSlotLineage('auto',hydratedLineage,!!lab);
     savedAuto.current=auto.text;
     sessionRevRef.current++;
     savedRevRef.current=sessionRevRef.current;
     if(live){
      setLineageId(hydratedLineage);
      setView(session.view);
      publishSave({kind:'saved',revision:sessionRevRef.current,lineageId:hydratedLineage,savedAt:auto.savedAt});
     }
    }else if(live){
     writeSlotLineage('auto',lineageRef.current,!!lab);
     publishSave({kind:'idle',revision:sessionRevRef.current,lineageId:lineageRef.current});
    }
   }catch(e){
    paused.current=true;
    storageUnavailableRef.current=true;
    const code=e instanceof Error?e.message:'STORAGE_UNAVAILABLE';
    if(live){
     publishSave({kind:'error',revision:sessionRevRef.current,lineageId:lineageRef.current,code,exportable:true,storageUnavailable:true});
     report(code,{surface:'global'},true);
    }
   }finally{
    if(live){gate.current=false;setBusy(false);}
   }
  })();
  return()=>{live=false;void storage.close().catch(()=>{});};
 },[session,storage]);

 useEffect(()=>{
  if(!hosted)return;
  const receive=(e:MessageEvent)=>{
   if(e.source!==parent||e.origin!==location.origin||e.data?.type!=='oot:checkpoint'||!Number.isSafeInteger(e.data.id))return;
   const id=e.data.id;
   void(async()=>{await active.current;const ok=await run(()=>write('auto'));parent.postMessage({type:'oot:checkpoint-result',id,ok},location.origin);})();
  };
  window.addEventListener('message',receive);
  parent.postMessage({type:'oot:ready'},location.origin);
  return()=>window.removeEventListener('message',receive);
 });

 const send=(cmd:Command,target:FeedbackTarget=commandFeedbackTarget(cmd))=>run(async()=>{
  const cashBefore=session.view.cash;
  const r=session.send(cmd);
  if(r.error)throw Error(r.error);
  const rev=++sessionRevRef.current;
  let activeLineage=lineageRef.current;
  if(r.events.some(e=>e.type==='Restarted')){
   activeLineage=freshLineageId();
   lineageRef.current=activeLineage;
   setLineageId(activeLineage);
  }
  setView(session.view);
  report(cmd.type==='deliver'?'DELIVERED:'+(session.view.cash-cashBefore).toFixed(2):cmd.type==='accept'?'ACCEPTED':cmd.type==='assign'?'ASSIGNED':cmd.type==='scope'?'ScopeAgreed':r.events.filter(e=>e.type!=='CommandApplied').at(-1)?.type??r.events.at(-1)?.type??'DONE',target,false,presentationEvent(cmd,feedbackId.current+1,session.view.cash-cashBefore));
  if(storageUnavailableRef.current){
   publishSave({kind:'imported-unsaved',revision:rev,lineageId:activeLineage,code:'IMPORTED_NO_STORAGE',exportable:true,storageUnavailable:true});
  }else if(hosted||desktop||r.events.some(e=>['DayEnd','Restarted'].includes(e.type))){
   try{await write('auto',rev,activeLineage);}catch(e){paused.current=true;throw new StorageFeedbackError(e);}
  }else if(!paused.current){
   publishSave({kind:'dirty',revision:rev,lineageId:activeLineage});
  }
 },target);

 const load=(id:SaveSlot)=>run(async()=>{
  const row=await storage.read(id);
  if(!row)throw Error('NO_SAVE');
  const auto=await storage.read('auto');
  await session.importSave(row.text);
  const nextLineage=readSlotLineage(id,!!lab)??freshLineageId();
  writeSlotLineage(id,nextLineage,!!lab);
  writeSlotLineage('auto',nextLineage,!!lab);
  lineageRef.current=nextLineage;
  setLineageId(nextLineage);
  const rev=++sessionRevRef.current;
  savedRevRef.current=rev;
  if(id==='auto'||manualSlots.includes(id as typeof manualSlots[number]))revisions.current[id as WritableSlot]=row.revision;
  revisions.current.auto=auto?.revision??0;
  paused.current=false;
  storageUnavailableRef.current=false;
  setView(session.view);
  publishSave({kind:'saved',revision:rev,lineageId:nextLineage,savedAt:Date.now()});
  report('LOADED',{surface:'saves'});
  await list();
 },{surface:'saves'});

 const save=(id:WritableSlot)=>run(async()=>{await write(id);report('SAVED',{surface:'saves'});},{surface:'saves'});

 const exportFile=()=>run(async()=>{
  const url=URL.createObjectURL(new Blob([await session.exportSave()],{type:'application/json'})),a=document.createElement('a');
  a.href=url;a.download='out-of-tokens-alpha.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  report('EXPORTED',{surface:'saves'});
 },{surface:'saves'});

 const importFile=(file:File|undefined)=>run(async()=>{
  if(!file)return;
  if(file.size===0||file.size>8000000)throw Error('INVALID_SAVE_SIZE');
  let available=true;
  try{revisions.current.auto=(await storage.read('auto'))?.revision??0;}catch{available=false;}
  await session.importSave(await file.text());
  const nextLineage=freshLineageId();
  lineageRef.current=nextLineage;
  setLineageId(nextLineage);
  const rev=++sessionRevRef.current;
  paused.current=!available;
  storageUnavailableRef.current=!available;
  setView(session.view);
  publishSave({
   kind:'imported-unsaved',
   revision:rev,
   lineageId:nextLineage,
   code:available?'IMPORTED_UNSAVED':'IMPORTED_NO_STORAGE',
   exportable:true,
   storageUnavailable:!available
  });
  report(available?'LOADED':'IMPORTED_NO_STORAGE',{surface:'saves'});
 },{surface:'saves'});

 const reconcileEmpty=()=>run(async()=>{
  if(!(storage instanceof HostSaves))return;
  const rows=await storage.reconcileEmpty();
  revisions.current={};paused.current=false;storageUnavailableRef.current=false;
  setRecords(rows);
  publishSave({kind:'idle',revision:sessionRevRef.current,lineageId:lineageRef.current});
  report('RECONCILED_EMPTY',{surface:'saves'});
 },{surface:'saves'});

 const reconcile=()=>run(async()=>{
  if(!(storage instanceof HostSaves))return;
  const text=await session.exportSave();
  const result=await storage.reconcile('auto',revisions.current.auto??0,text);
  revisions.current.auto=result.revision;paused.current=false;storageUnavailableRef.current=false;
  if(result.committed)savedAuto.current=text;
  setRecords(result.rows);
  publishSave({kind:'saved',revision:sessionRevRef.current,lineageId:lineageRef.current,savedAt:Date.now()});
  report('RECONCILED',{surface:'saves'});
 },{surface:'saves'});

 const retrySave=()=>run(async()=>{
  if(saveStatus.kind!=='error'||saveStatus.storageUnavailable)return;
  await write('auto',sessionRevRef.current,lineageRef.current);
  report('SAVED',{surface:'saves'});
 },{surface:'saves'});

 const slotLabel=(id:SaveSlot):[string,string]=>{
  const n=id.split('-')[1]??'';
  if(id.startsWith('manual-'))return [`手动档 ${n}`,`Manual slot ${n}`];
  if(id==='auto')return ['自动档','Autosave'];
  return [`边界备份 ${n}`,`Boundary backup ${n}`];
 };

 const requestLoad=(id:SaveSlot,afterSwitch?:()=>void)=>{
  const [zh,en]=slotLabel(id);
  const execute=async()=>{const ok=await load(id);if(ok)afterSwitch?.();return ok;};
  if(shouldConfirmBeforeSwitch(saveStatus)){
   setExportedInSwitchModal(false);
   setPendingSwitch({kind:'load',targetLabelZh:zh,targetLabelEn:en,reason:switchReasonFromSaveStatus(saveStatus),execute});
   return;
  }
  void execute();
 };

 const requestImportFile=(file:File|undefined,afterSwitch?:()=>void)=>{
  if(!file)return;
  const execute=async()=>{const ok=await importFile(file);if(ok)afterSwitch?.();return ok;};
  if(shouldConfirmBeforeSwitch(saveStatus)){
   setExportedInSwitchModal(false);
   setPendingSwitch({kind:'import',targetLabelZh:file.name,targetLabelEn:file.name,reason:switchReasonFromSaveStatus(saveStatus),execute});
   return;
  }
  void execute();
 };

 const requestRestart=(afterSwitch?:()=>void)=>{
  const execute=async()=>{const ok=await send({type:'restart'});if(ok)afterSwitch?.();return ok;};
  if(shouldConfirmBeforeSwitch(saveStatus)){
   setExportedInSwitchModal(false);
   setPendingSwitch({kind:'restart',targetLabelZh:'继承经验重开',targetLabelEn:'Restart with founder XP',reason:switchReasonFromSaveStatus(saveStatus),execute});
   return;
  }
  void execute();
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
