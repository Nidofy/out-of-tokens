import {defaultSaveEncoder} from 'oot-platform/worker';
import type {SaveInput} from 'oot-platform/worker';

export interface SaveEncoderWorkerRequest {
 id:number;
 input:SaveInput;
}

export interface SaveEncoderWorkerResponse {
 id:number;
 text?:string;
 error?:string;
}

const scope=globalThis as unknown as {
 onmessage:((e:MessageEvent<SaveEncoderWorkerRequest>)=>void)|null;
 postMessage:(data:SaveEncoderWorkerResponse)=>void;
};

/**
 * Web Worker entry for canonical save encoding.
 * Delegates directly to defaultSaveEncoder so SaveInput.throughCommand prefix replay
 * and canonical save bytes remain identical across boundary and checkpoint writes.
 */
scope.onmessage=e=>{
 const {id,input}=e.data;
 void defaultSaveEncoder.encode(input).then(
  text=>scope.postMessage({id,text}),
  err=>scope.postMessage({id,error:err instanceof Error?err.message:String(err)})
 );
};
