import {defaultSaveEncoder} from 'oot-platform/worker';
import type {SaveEncoder,SaveInput} from 'oot-platform/worker';
import type {SaveEncoderWorkerRequest,SaveEncoderWorkerResponse} from './save-encoder-worker.js';

export interface SaveEncoderStats {
 lastPostMs:number;
 lastTotalMs:number;
 usedWorker:boolean;
 sampleCount:number;
}

export interface ManagedSaveEncoder extends SaveEncoder {
 dispose():void;
 readonly stats:SaveEncoderStats;
}

/**
 * Pure message-protocol verification helper using defaultSaveEncoder.encode(input)
 * across the Worker request/response envelope so Vitest verifies throughCommand parity.
 */
export async function encodeViaWorkerProtocol(input:SaveInput):Promise<string>{
 const req:SaveEncoderWorkerRequest={id:1,input};
 try{
  const text=await defaultSaveEncoder.encode(req.input);
  const res:SaveEncoderWorkerResponse={id:req.id,text};
  if(res.error)throw Error(res.error);
  return res.text!;
 }catch(err){
  const res:SaveEncoderWorkerResponse={id:req.id,error:err instanceof Error?err.message:String(err)};
  throw Error(res.error);
 }
}

/**
 * Creates a SaveEncoder backed by a persistent Web Worker when available in the browser,
 * falling back cleanly to defaultSaveEncoder when Worker is unavailable or errors on startup.
 */
export function createSaveEncoder():ManagedSaveEncoder{
 let worker:Worker|null=null;
 let workerDisabled=typeof Worker==='undefined';
 let seq=0;
 let disposed=false;
 const pending=new Map<number,{resolve:(text:string)=>void;reject:(err:Error)=>void;startedAt:number}>();
 const stats:SaveEncoderStats={lastPostMs:0,lastTotalMs:0,usedWorker:false,sampleCount:0};

 const ensureWorker=():Worker|null=>{
  if(disposed||workerDisabled)return null;
  if(worker)return worker;
  try{
   const w=new Worker(new URL('./save-encoder-worker.ts',import.meta.url),{type:'module'});
   w.onmessage=(e:MessageEvent<SaveEncoderWorkerResponse>)=>{
    const item=pending.get(e.data.id);
    if(!item)return;
    pending.delete(e.data.id);
    stats.lastTotalMs=performance.now()-item.startedAt;
    stats.sampleCount++;
    if(typeof e.data.error==='string'){item.reject(Error(e.data.error));return;}
    item.resolve(e.data.text??'');
   };
   w.onerror=()=>{
    workerDisabled=true;
    worker=null;
    const queued=[...pending.entries()];
    pending.clear();
    for(const [,item] of queued)item.reject(Error('SAVE_WORKER_ERROR'));
   };
   worker=w;
   return w;
  }catch{
   workerDisabled=true;
   return null;
  }
 };

 const encodeFallback=async(input:SaveInput):Promise<string>=>{
  const t0=performance.now();
  const text=await defaultSaveEncoder.encode(input);
  stats.lastPostMs=0;
  stats.lastTotalMs=performance.now()-t0;
  stats.usedWorker=false;
  stats.sampleCount++;
  return text;
 };

 return {
  stats,
  async encode(input:SaveInput):Promise<string>{
   const w=ensureWorker();
   if(!w)return encodeFallback(input);
   const id=++seq;
   const t0=performance.now();
   try{
    return await new Promise<string>((resolve,reject)=>{
     pending.set(id,{resolve,reject,startedAt:t0});
     try{
      w.postMessage({id,input} satisfies SaveEncoderWorkerRequest);
      stats.lastPostMs=performance.now()-t0;
      stats.usedWorker=true;
     }catch(err){
      pending.delete(id);
      reject(err instanceof Error?err:Error(String(err)));
     }
    });
   }catch(err){
    if(err instanceof Error&&err.message==='INVALID_CHECKPOINT_PREFIX')throw err;
    if(!workerDisabled)throw err;
    return encodeFallback(input);
   }
  },
  dispose(){
   disposed=true;
   worker?.terminate();
   worker=null;
   for(const [,item] of pending)item.reject(Error('ENCODER_DISPOSED'));
   pending.clear();
  }
 };
}
