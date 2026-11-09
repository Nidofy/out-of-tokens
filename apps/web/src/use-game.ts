import {visualReviewEnabled} from './visual-review.js';
import {LabSaves,labSession} from './office-lab.js';
import {presentationEvent,commandFeedbackTarget,nextFeedback} from './presentation-events.js';
import type {UiFeedback,FeedbackTarget,PresentationEvent} from './presentation-events.js';
import {useEffect,useRef,useState} from 'preact/hooks';
import {BrowserSaves,HostSaves,GameSession,manualSlots} from 'oot-platform';
import type {SaveSlot,StoredSave,WritableSlot} from 'oot-platform';
import type {Command} from 'oot-core';
import {content} from './content.js';
class StorageFeedbackError extends Error {
 constructor(error:unknown){super(error instanceof Error?error.message:String(error));}
}
export function useGame(){
 const lab=visualReviewEnabled?new URLSearchParams(location.search).get('office-lab'):null;
 const hosted=!lab&&location.pathname.startsWith('/out-of-tokens/web/')&&new URLSearchParams(location.search).get('dsh')==='1';
 const [session]=useState(()=>lab?labSession(content,lab):new GameSession(content)),[storage]=useState(()=>lab?new LabSaves():hosted?new HostSaves():new BrowserSaves('out-of-tokens-'+content.version,import.meta.env.DEV && new URLSearchParams(location.search).get('test-fault')==='storage' ? {open(){throw Error('STORAGE_UNAVAILABLE');}} as unknown as IDBFactory : globalThis.indexedDB));
 const [view,setView]=useState(session.view),[busy,setBusy]=useState(true),[records,setRecords]=useState<(StoredSave|null)[]>([]);
 const [feedback,setFeedback]=useState<UiFeedback|null>(null),feedbackId=useRef(0);
 const dismissFeedback=()=>setFeedback(null);
 const report=(code:string,target:FeedbackTarget={surface:'global'},error=false,receipt:PresentationEvent|null=null)=>{const next={id:++feedbackId.current,code,target,error,receipt};setFeedback(previous=>nextFeedback(previous,next,paused.current));};
 // Latest action wins; successful receipts expire, errors require dismissal or another operation.
 useEffect(()=>{if(!feedback||feedback.error)return;const expire=()=>{if(document.activeElement?.closest('.feedback-notice'))timer=setTimeout(expire,1000);else dismissFeedback();};let timer=setTimeout(expire,6000);return()=>clearTimeout(timer);},[feedback?.id]);
 const savedAuto=useRef('');
 const desktop=new URLSearchParams(location.search).get('desktop')==='1';
 const active=useRef<Promise<unknown>>(Promise.resolve());
 const gate=useRef(true),revisions=useRef<Partial<Record<WritableSlot,number>>>({}),paused=useRef(false);
 // Explicit isolated lab fault injection exercises the real notification path, never player storage.
 useEffect(()=>{if(!lab||!visualReviewEnabled||new URLSearchParams(location.search).get('test-fault')!=='storage-events')return;const inject=(e:KeyboardEvent)=>{if(e.ctrlKey&&e.shiftKey&&e.key==='F9'){e.preventDefault();storage.onExternalChange?.();}};window.addEventListener('keydown',inject);return()=>window.removeEventListener('keydown',inject);},[lab,storage]);
 const run=(work:()=>Promise<void>,target:FeedbackTarget={surface:'global'})=>{if(gate.current)return Promise.resolve(false);gate.current=true;setBusy(true);const task=(async()=>{try{await work();return true;}catch(e){report(e instanceof SyntaxError?'BAD_JSON':e instanceof Error?e.message:String(e),e instanceof StorageFeedbackError?{surface:'global'}:target,true);return false;}finally{gate.current=false;setBusy(false);}})();active.current=task;return task;};
 const list=async()=>setRecords(await storage.list());
 const write=async(id:WritableSlot)=>{if(id==='auto'&&paused.current)throw Error('AUTO_PAUSED');const text=await session.exportSave();if(id==='auto'&&savedAuto.current===text)return;revisions.current[id]=await storage.write(id,text,revisions.current[id]??0);if(id==='auto')savedAuto.current=text;await list();};
 useEffect(()=>{let live=true;storage.onExternalChange=()=>{paused.current=true;if(live)report('EXTERNAL_CHANGE',{surface:'global'},true);};active.current=(async()=>{try{const rows=await storage.list();if(!live)return;setRecords(rows);for(const r of rows)if(r&&(r.id==='auto'||manualSlots.includes(r.id as typeof manualSlots[number])))revisions.current[r.id as WritableSlot]=r.revision;const auto=rows.find(r=>r?.id==='auto');if(auto){await session.importSave(auto.text);savedAuto.current=auto.text;if(live)setView(session.view);}}catch(e){paused.current=true;if(live)report(e instanceof Error?e.message:'STORAGE_UNAVAILABLE',{surface:'global'},true);}finally{if(live){gate.current=false;setBusy(false);}}})();return()=>{live=false;void storage.close().catch(()=>{});};},[session,storage]);
 useEffect(()=>{if(!hosted)return;const receive=(e:MessageEvent)=>{if(e.source!==parent||e.origin!==location.origin||e.data?.type!=='oot:checkpoint'||!Number.isSafeInteger(e.data.id))return;const id=e.data.id;void(async()=>{await active.current;const ok=await run(()=>write('auto'));parent.postMessage({type:'oot:checkpoint-result',id,ok},location.origin);})();};window.addEventListener('message',receive);parent.postMessage({type:'oot:ready'},location.origin);return()=>window.removeEventListener('message',receive);});
 const send=(cmd:Command,target:FeedbackTarget=commandFeedbackTarget(cmd))=>run(async()=>{const cashBefore=session.view.cash;const r=session.send(cmd);if(r.error)throw Error(r.error);setView(session.view);report(cmd.type==='deliver'?'DELIVERED:'+(session.view.cash-cashBefore).toFixed(2):cmd.type==='accept'?'ACCEPTED':cmd.type==='assign'?'ASSIGNED':cmd.type==='scope'?'ScopeAgreed':r.events.filter(e=>e.type!=='CommandApplied').at(-1)?.type??r.events.at(-1)?.type??'DONE',target,false,presentationEvent(cmd,feedbackId.current+1,session.view.cash-cashBefore));if(hosted||desktop||r.events.some(e=>['DayEnd','Restarted'].includes(e.type))){try{await write('auto');}catch(e){paused.current=true;throw new StorageFeedbackError(e);}}},target);

 const load=(id:SaveSlot)=>run(async()=>{const row=await storage.read(id);if(!row)throw Error('NO_SAVE');const auto=await storage.read('auto');await session.importSave(row.text);if(id==='auto'||manualSlots.includes(id as typeof manualSlots[number]))revisions.current[id as WritableSlot]=row.revision;revisions.current.auto=auto?.revision??0;paused.current=false;setView(session.view);report('LOADED',{surface:'saves'});await list();},{surface:'saves'});
 const save=(id:WritableSlot)=>run(async()=>{await write(id);report('SAVED',{surface:'saves'});},{surface:'saves'});
 const exportFile=()=>run(async()=>{const url=URL.createObjectURL(new Blob([await session.exportSave()],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='out-of-tokens-alpha.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);report('EXPORTED',{surface:'saves'});},{surface:'saves'});
 const importFile=(file:File|undefined)=>run(async()=>{if(!file)return;if(file.size===0||file.size>8000000)throw Error('INVALID_SAVE_SIZE');let available=true;try{revisions.current.auto=(await storage.read('auto'))?.revision??0;}catch{available=false;}await session.importSave(await file.text());paused.current=!available;setView(session.view);report(available?'LOADED':'IMPORTED_NO_STORAGE',{surface:'saves'});},{surface:'saves'});
 const reconcileEmpty=()=>run(async()=>{if(!(storage instanceof HostSaves))return;const rows=await storage.reconcileEmpty();revisions.current={};paused.current=false;setRecords(rows);report('RECONCILED_EMPTY',{surface:'saves'});},{surface:'saves'});
 const reconcile=()=>run(async()=>{if(!(storage instanceof HostSaves))return;const text=await session.exportSave();const result=await storage.reconcile('auto',revisions.current.auto??0,text);revisions.current.auto=result.revision;paused.current=false;if(result.committed)savedAuto.current=text;setRecords(result.rows);report('RECONCILED',{surface:'saves'});},{surface:'saves'});
 return{lab,feedback,dismissFeedback,reconcile,reconcileEmpty,hosted,session,view,busy,records,send,load,save,exportFile,importFile,refresh:()=>run(list)};
}
