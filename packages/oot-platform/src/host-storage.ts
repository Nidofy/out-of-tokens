import {saveSlots,manualSlots} from './storage.js';
import type {SaveSlot,StoredSave,WritableSlot} from './storage.js';
export interface SaveStorage{onExternalChange:(()=>void)|null;list():Promise<(StoredSave|null)[]>;read(id:SaveSlot):Promise<StoredSave|null>;write(id:WritableSlot,text:string,expectedRevision:number):Promise<number>;close():Promise<void>}
/** Authenticated same-origin host only. A lost response never triggers a retry. */
export class HostSaves implements SaveStorage {
 onExternalChange:(()=>void)|null=null;
 private readonly lifetime=new AbortController();
 private readonly pending=new Set<Promise<unknown>>();
 private uncertain=false;
 constructor(private readonly request:typeof fetch=globalThis.fetch.bind(globalThis),private readonly endpoint='/out-of-tokens/api/saves'){}
 private async call(init?:RequestInit):Promise<{records?:(StoredSave|null)[];revision?:number}>{
  this.lifetime.signal.throwIfAborted();const p=this.request(this.endpoint,{...init,credentials:'same-origin',redirect:'error',cache:'no-store',signal:AbortSignal.any([this.lifetime.signal,AbortSignal.timeout(10000)])}).then(async r=>{const b=await r.json() as {error?:string;records?:(StoredSave|null)[];revision?:number};if(!r.ok)throw Error(b.error??'HOST_ERROR');return b;});this.pending.add(p);try{return await p;}finally{this.pending.delete(p);}
 }
 async list(){const rows=(await this.call()).records;if(!Array.isArray(rows)||rows.length!==saveSlots.length||rows.some((r,i)=>r!==null&&(!r||r.id!==saveSlots[i]||typeof r.text!=='string'||!Number.isSafeInteger(r.revision)||r.revision<1)))throw Error('INVALID_HOST_RESPONSE');return rows;}
 async read(id:SaveSlot){if(!saveSlots.includes(id))throw Error('INVALID_SLOT');const rows=await this.list();this.uncertain=false;return rows.find(r=>r?.id===id)??null;}
 async write(id:WritableSlot,text:string,expectedRevision:number){
  if(this.uncertain)throw Error('WRITE_UNCERTAIN');if(![...manualSlots,'auto'].includes(id))throw Error('INVALID_SLOT');
  try{const b=await this.call({method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,text,expectedRevision})});if(b.revision!==expectedRevision+1)throw Error('INVALID_HOST_RESPONSE');return b.revision;}
  catch(e){this.uncertain=true;this.onExternalChange?.();throw e;}
 }
 async close(){this.lifetime.abort();await Promise.allSettled(this.pending);}
}
