import type {Draft,SuggestResult,WorkerSnapshot} from 'oot-platform';
import {suggestAssignmentsFromSnapshot} from 'oot-platform/worker';
import {content} from './content.js';

export interface CandidateWorkerRequest {
 id:number;
 snapshot:WorkerSnapshot;
 jobId:string;
 draft:Draft;
}

export interface CandidateWorkerResponse {
 id:number;
 result?:SuggestResult;
 workerComputeMs?:number;
 error?:string;
}

const scope=globalThis as unknown as {
 onmessage:((e:MessageEvent<CandidateWorkerRequest>)=>void)|null;
 postMessage:(data:CandidateWorkerResponse)=>void;
};

/**
 * Web Worker entry for bounded candidate assignment search.
 * Uses only readonly content and pure suggestAssignmentsFromSnapshot from oot-platform/worker.
 */
scope.onmessage=e=>{
 const {id,snapshot,jobId,draft}=e.data;
 const t0=performance.now();
 try{
  const result=suggestAssignmentsFromSnapshot(content,snapshot,jobId,draft);
  const workerComputeMs=performance.now()-t0;
  scope.postMessage({id,result,workerComputeMs});
 }catch(err){
  scope.postMessage({id,error:err instanceof Error?err.message:String(err)});
 }
};
