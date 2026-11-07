import {useEffect,useRef,useState} from 'preact/hooks';
import {BrowserSaves,HostSaves,GameSession,manualSlots} from 'oot-platform';
import type {SaveSlot,StoredSave,WritableSlot} from 'oot-platform';
import type {Command} from 'oot-core';
import {content} from './content.js';
export function useGame(){
 const hosted=location.pathname.startsWith('/out-of-tokens/web/')&&new URLSearchParams(location.search).get('dsh')==='1';
 const [session]=useState(()=>new GameSession(content)),[storage]=useState(()=>hosted?new HostSaves():new BrowserSaves('out-of-tokens-'+content.version,import.meta.env.DEV && new URLSearchParams(location.search).get('test-fault')==='storage' ? {open(){throw Error('STORAGE_UNAVAILABLE');}} as unknown as IDBFactory : globalThis.indexedDB));
 const [view,setView]=useState(session.view),[busy,setBusy]=useState(true),[message,setMessage]=useState(''),[records,setRecords]=useState<(StoredSave|null)[]>([]);
 const active=useRef<Promise<unknown>>(Promise.resolve());
 const gate=useRef(true),revisions=useRef<Partial<Record<WritableSlot,number>>>({}),paused=useRef(false);
 const run=(work:()=>Promise<void>)=>{if(gate.current)return Promise.resolve(false);gate.current=true;setBusy(true);const task=(async()=>{try{await work();return true;}catch(e){setMessage(e instanceof SyntaxError?'BAD_JSON':e instanceof Error?e.message:String(e));return false;}finally{gate.current=false;setBusy(false);}})();active.current=task;return task;};
 const list=async()=>setRecords(await storage.list());
 const write=async(id:WritableSlot)=>{if(id==='auto'&&paused.current)throw Error('AUTO_PAUSED');revisions.current[id]=await storage.write(id,await session.exportSave(),revisions.current[id]??0);await list();};
 useEffect(()=>{let live=true;storage.onExternalChange=()=>{paused.current=true;if(live)setMessage('EXTERNAL_CHANGE');};active.current=(async()=>{try{const rows=await storage.list();if(!live)return;setRecords(rows);for(const r of rows)if(r&&(r.id==='auto'||manualSlots.includes(r.id as typeof manualSlots[number])))revisions.current[r.id as WritableSlot]=r.revision;const auto=rows.find(r=>r?.id==='auto');if(auto){await session.importSave(auto.text);if(live)setView(session.view);}}catch(e){paused.current=true;if(live)setMessage(e instanceof Error?e.message:'STORAGE_UNAVAILABLE');}finally{if(live){gate.current=false;setBusy(false);}}})();return()=>{live=false;void storage.close().catch(()=>{});};},[session,storage]);
 useEffect(()=>{if(!hosted)return;const receive=(e:MessageEvent)=>{if(e.source!==parent||e.origin!==location.origin||e.data?.type!=='oot:checkpoint'||!Number.isSafeInteger(e.data.id))return;const id=e.data.id;void(async()=>{await active.current;const ok=await run(()=>write('auto'));parent.postMessage({type:'oot:checkpoint-result',id,ok},location.origin);})();};window.addEventListener('message',receive);return()=>window.removeEventListener('message',receive);});
 const send=(cmd:Command)=>run(async()=>{const r=session.send(cmd);if(r.error)throw Error(r.error);setView(session.view);setMessage(r.events.at(-1)?.type??'DONE');if(hosted||r.events.some(e=>['DayEnd','Restarted'].includes(e.type))){try{await write('auto');}catch(e){paused.current=true;throw e;}}});
 const load=(id:SaveSlot)=>run(async()=>{const row=await storage.read(id);if(!row)throw Error('NO_SAVE');const auto=await storage.read('auto');await session.importSave(row.text);if(id==='auto'||manualSlots.includes(id as typeof manualSlots[number]))revisions.current[id as WritableSlot]=row.revision;revisions.current.auto=auto?.revision??0;paused.current=false;setView(session.view);setMessage('LOADED');await list();});
 const save=(id:WritableSlot)=>run(async()=>{await write(id);setMessage('SAVED');});
 const exportFile=()=>run(async()=>{const url=URL.createObjectURL(new Blob([await session.exportSave()],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='out-of-tokens-alpha.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setMessage('EXPORTED');});
 const importFile=(file:File|undefined)=>run(async()=>{if(!file)return;if(file.size===0||file.size>8000000)throw Error('INVALID_SAVE_SIZE');let available=true;try{revisions.current.auto=(await storage.read('auto'))?.revision??0;}catch{available=false;}await session.importSave(await file.text());paused.current=!available;setView(session.view);setMessage(available?'LOADED':'IMPORTED_NO_STORAGE');});
 const reconcileEmpty=()=>run(async()=>{if(!(storage instanceof HostSaves))return;const rows=await storage.reconcileEmpty();revisions.current={};paused.current=false;setRecords(rows);setMessage('RECONCILED_EMPTY');});
 return{reconcileEmpty,hosted,session,view,busy,message,records,send,load,save,exportFile,importFile,refresh:()=>run(list)};
}
