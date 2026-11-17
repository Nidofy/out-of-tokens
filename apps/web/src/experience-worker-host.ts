import {matchesRevision} from 'oot-platform';
import type {Draft,RevisionIdentity,SuggestResult,WorkerSnapshot} from 'oot-platform';
import {suggestAssignmentsFromSnapshot} from 'oot-platform/worker';
import {content} from './content.js';
import type {CandidateWorkerRequest,CandidateWorkerResponse} from './experience-worker.js';

export interface SuggestionTimingSample {
 jobId:string;
 draftKey:string;
 revision:number;
 lineageId:string;
 usedWorker:boolean;
 snapshotCloneMs:number;
 mainThreadPostMs:number;
 mainThreadBlockingMs:number;
 workerComputeMs:number;
 roundTripMs:number;
 evaluated:number;
 truncated:boolean;
 droppedStale:boolean;
}

export interface ManagedSuggestionClient {
 suggest(snapshot:WorkerSnapshot,snapshotCloneMs:number,jobId:string,draft:Draft):Promise<{result:SuggestResult;timing:SuggestionTimingSample}>;
 dispose():void;
 readonly lastTiming:SuggestionTimingSample|null;
 readonly samples:readonly SuggestionTimingSample[];
}

/**
 * Strict Contract v1 identity + draftKey guard: rejects any asynchronous suggestion result
 * whose contract, contentVersion, revision, lineageId, or draftKey no longer matches.
 */
export function acceptSuggestionResult(
 result:SuggestResult,
 currentIdentity:RevisionIdentity,
 currentDraftKey:string
):boolean{
 return matchesRevision(result,currentIdentity)&&result.draftKey===currentDraftKey;
}

/**
 * Pure protocol helper exercising the Worker request/response envelope synchronously
 * in non-Worker environments (Vitest) so output parity & identity guards stay directly verifiable.
 */
export function suggestViaWorkerProtocol(
 snapshot:WorkerSnapshot,
 jobId:string,
 draft:Draft
):{result:SuggestResult;workerComputeMs:number}{
 const req:CandidateWorkerRequest={id:1,snapshot,jobId,draft};
 const t0=performance.now();
 const result=suggestAssignmentsFromSnapshot(content,req.snapshot,req.jobId,req.draft);
 const res:CandidateWorkerResponse={id:req.id,result,workerComputeMs:performance.now()-t0};
 if(typeof res.error==='string'||!res.result)throw Error(res.error??'SUGGEST_WORKER_ERROR');
 return {result:res.result,workerComputeMs:res.workerComputeMs??0};
}

export function createSuggestionClient():ManagedSuggestionClient{
 let worker:Worker|null=null;
 let workerDisabled=typeof Worker==='undefined';
 let disposed=false;
 let seq=0;
 const pending=new Map<number,{
  resolve:(value:{result:SuggestResult;timing:SuggestionTimingSample})=>void;
  reject:(err:Error)=>void;
  jobId:string;
  draftKey:string;
  revision:number;
  lineageId:string;
  snapshotCloneMs:number;
  mainThreadPostMs:number;
  startedAt:number;
 }>();
 const samples:SuggestionTimingSample[]=[];
 let lastTiming:SuggestionTimingSample|null=null;

 const recordSample=(sample:SuggestionTimingSample)=>{
  lastTiming=sample;
  samples.push(sample);
  if(samples.length>20)samples.shift();
 };

 const ensureWorker=():Worker|null=>{
  if(disposed||workerDisabled)return null;
  if(worker)return worker;
  try{
   const w=new Worker(new URL('./experience-worker.ts',import.meta.url),{type:'module'});
   w.onmessage=(e:MessageEvent<CandidateWorkerResponse>)=>{
    const item=pending.get(e.data.id);
    if(!item)return;
    pending.delete(e.data.id);
    if(typeof e.data.error==='string'||!e.data.result){
     item.reject(Error(e.data.error??'SUGGEST_WORKER_ERROR'));
     return;
    }
    const applyStart=performance.now();
    const result=e.data.result;
    const roundTripMs=applyStart-item.startedAt;
    const applyMs=performance.now()-applyStart;
    const timing:SuggestionTimingSample={
     jobId:item.jobId,
     draftKey:item.draftKey,
     revision:item.revision,
     lineageId:item.lineageId,
     usedWorker:true,
     snapshotCloneMs:item.snapshotCloneMs,
     mainThreadPostMs:item.mainThreadPostMs,
     mainThreadBlockingMs:item.snapshotCloneMs+item.mainThreadPostMs+applyMs,
     workerComputeMs:e.data.workerComputeMs??0,
     roundTripMs,
     evaluated:result.evaluated,
     truncated:result.truncated,
     droppedStale:false
    };
    recordSample(timing);
    item.resolve({result,timing});
   };
   w.onerror=()=>{
    workerDisabled=true;
    worker=null;
    const queued=[...pending.entries()];
    pending.clear();
    for(const [,item] of queued)item.reject(Error('SUGGEST_WORKER_ERROR'));
   };
   worker=w;
   return w;
  }catch{
   workerDisabled=true;
   return null;
  }
 };

 const runFallback=(
  snapshot:WorkerSnapshot,
  snapshotCloneMs:number,
  jobId:string,
  draft:Draft
 ):Promise<{result:SuggestResult;timing:SuggestionTimingSample}>=>{
  const t0=performance.now();
  const {result,workerComputeMs}=suggestViaWorkerProtocol(snapshot,jobId,draft);
  const totalMs=performance.now()-t0;
  const timing:SuggestionTimingSample={
   jobId,
   draftKey:draft.draftKey,
   revision:snapshot.revision,
   lineageId:snapshot.lineageId,
   usedWorker:false,
   snapshotCloneMs,
   mainThreadPostMs:0,
   mainThreadBlockingMs:snapshotCloneMs+totalMs,
   workerComputeMs,
   roundTripMs:totalMs,
   evaluated:result.evaluated,
   truncated:result.truncated,
   droppedStale:false
  };
  recordSample(timing);
  return Promise.resolve({result,timing});
 };

 return {
  get lastTiming(){return lastTiming;},
  get samples(){return samples;},
  suggest(snapshot,snapshotCloneMs,jobId,draft){
   if(disposed)return Promise.reject(Error('SUGGEST_CLIENT_DISPOSED'));
   const w=ensureWorker();
   if(!w)return runFallback(snapshot,snapshotCloneMs,jobId,draft);
   const id=++seq;
   const postStart=performance.now();
   return new Promise((resolve,reject)=>{
    const item={
     resolve,
     reject,
     jobId,
     draftKey:draft.draftKey,
     revision:snapshot.revision,
     lineageId:snapshot.lineageId,
     snapshotCloneMs,
     mainThreadPostMs:0,
     startedAt:postStart
    };
    pending.set(id,item);
    try{
     w.postMessage({id,snapshot,jobId,draft} satisfies CandidateWorkerRequest);
     item.mainThreadPostMs=performance.now()-postStart;
    }catch{
     pending.delete(id);
     workerDisabled=true;
     w.terminate();
     worker=null;
     void runFallback(snapshot,snapshotCloneMs,jobId,draft).then(resolve,reject);
    }
   });
  },
  dispose(){
   disposed=true;
   const queued=[...pending.entries()];
   pending.clear();
   for(const [,item] of queued)item.reject(Error('SUGGEST_CLIENT_DISPOSED'));
   worker?.terminate();
   worker=null;
  }
 };
}
