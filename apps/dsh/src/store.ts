import {mkdir,readFile,lstat,realpath,open} from 'node:fs/promises';
import {join} from 'node:path';
import {withFileLock,writeFileAtomic} from './vendor/atomic-write.js';
import {restore} from 'oot-persistence';
import type {Content} from 'oot-core';
import {manualSlots,saveSlots} from 'oot-platform';
import type {StoredSave,WritableSlot,SaveSlot} from 'oot-platform';
type Envelope={schemaVersion:1;slots:Partial<Record<SaveSlot,StoredSave>>};
export class FileSaves {
 private closed=false;
 private readonly lifetime=new AbortController();
 private readonly pending=new Set<Promise<unknown>>();
 private constructor(readonly file:string,private readonly content:Content){}
 static async open(profile:string,content:Content){
  const root=await realpath(profile);let dir=root;
  for(const segment of ['out-of-tokens','v1']){dir=join(dir,segment);await mkdir(dir,{recursive:true,mode:0o700});if((await lstat(dir)).isSymbolicLink()||await realpath(dir)!==dir)throw Error('UNSAFE_STORAGE_PATH');}
  return new FileSaves(join(dir,'slots.json'),content);
 }
 private async envelope():Promise<Envelope>{
  let text:string;try{const info=await lstat(this.file);if(info.isSymbolicLink()||info.size>90000000)throw Error('INVALID_STORAGE');text=await readFile(this.file,'utf8');}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return{schemaVersion:1,slots:{}};throw e;}
  const x=JSON.parse(text) as Envelope;if(x.schemaVersion!==1||!x.slots||typeof x.slots!=='object'||Array.isArray(x.slots))throw Error('INVALID_STORAGE');
  for(const [key,r] of Object.entries(x.slots)){if(!saveSlots.includes(key as SaveSlot)||!r||r.id!==key||!Number.isSafeInteger(r.revision)||r.revision<1||!Number.isFinite(r.savedAt)||typeof r.text!=='string'||r.text.length>8000000)throw Error('INVALID_STORAGE');}
  return x;
 }
 private track<T>(work:()=>Promise<T>):Promise<T>{if(this.closed)return Promise.reject(Error('HOST_CLOSED'));const p=work();this.pending.add(p);void p.then(()=>this.pending.delete(p),()=>this.pending.delete(p));return p;}
 list(){return this.track(async()=>{const e=await this.envelope();return saveSlots.map(id=>e.slots[id]??null);});}
 read(id:SaveSlot){return this.track(async()=>{if(!saveSlots.includes(id))throw Error('INVALID_SLOT');return(await this.envelope()).slots[id]??null;});}
 write(id:WritableSlot,text:string,expectedRevision:number,signal?:AbortSignal){return this.track(async()=>{
  if(![...manualSlots,'auto'].includes(id)||!Number.isSafeInteger(expectedRevision)||expectedRevision<0||expectedRevision>=Number.MAX_SAFE_INTEGER)throw Error('INVALID_SLOT');
  if(typeof text!=='string'||!text.length||text.length>8000000)throw Error('INVALID_SAVE_SIZE');
  const abort=signal?AbortSignal.any([signal,this.lifetime.signal]):this.lifetime.signal;abort.throwIfAborted();restore(this.content,text);
  return withFileLock(this.file,async()=>{
   abort.throwIfAborted();const e=await this.envelope(),previous=e.slots[id];if((previous?.revision??0)!==expectedRevision)throw Error('SAVE_CONFLICT');
   if(id==='auto'&&previous){for(let i=4;i>=1;i--){const r=e.slots[`backup-${i}` as SaveSlot];if(r)e.slots[`backup-${i+1}` as SaveSlot]={...r,id:`backup-${i+1}` as SaveSlot};}e.slots['backup-1']={...previous,id:'backup-1'};}
   e.slots[id]={id,text,revision:expectedRevision+1,savedAt:Date.now()};abort.throwIfAborted();
   // Finish publication after it starts, even on disconnect. Never replay an uncertain write.
   const serialized=JSON.stringify(e);if(Buffer.byteLength(serialized)>90000000)throw Error('STORAGE_TOO_LARGE');
   await writeFileAtomic(this.file,serialized,{mode:0o600,dirMode:0o700});const file=await open(this.file,'r+');try{await file.sync();}finally{await file.close();}
   return expectedRevision+1;
  },{signal:abort,waitMs:8000});
 });}
 async close(){this.closed=true;this.lifetime.abort();await Promise.allSettled(this.pending);}
}
