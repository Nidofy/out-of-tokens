export type SecondaryLoadStatus='idle'|'loading'|'ready'|'error';

export interface SecondaryLoadState<T> {
 status:SecondaryLoadStatus;
 module:T|null;
 error:string|null;
 attempts:number;
}

export interface SecondaryLoader<T> {
 getState:()=>SecondaryLoadState<T>;
 subscribe:(listener:(state:SecondaryLoadState<T>)=>void)=>()=>void;
 ensure:()=>Promise<T|null>;
 retry:()=>Promise<T|null>;
}

/**
 * Resolves a cache-busted same-origin ESM URL for explicit retries so the browser's
 * module map does not replay a previously cached failed import under the same URL.
 */
export function resolveRetryModuleUrl(
 importerSource:string,
 baseUrl:string,
 retryIndex:number,
 lastErrorMessage?:string
):string|null{
 if(!baseUrl||retryIndex<1)return null;
 const fromSource=/import\(\s*['"`]([^'"`]+)['"`]\s*\)/.exec(importerSource)?.[1];
 const fromError=lastErrorMessage?/(https?:\/\/[^\s)'"`]+\.m?js(?:\?[^\s)'"`]*)?)/.exec(lastErrorMessage)?.[1]:undefined;
 const raw=fromSource??fromError;
 if(!raw)return null;
 try{
  const base=new URL(baseUrl);
  const target=new URL(raw,base);
  if((base.protocol==='http:'||base.protocol==='https:')&&target.origin!==base.origin)return null;
  target.searchParams.set('vcr4Retry',String(retryIndex));
  return target.href;
 }catch{
  return null;
 }
}

/**
 * Coordinates lazy panel chunk loading with shared loading/error/ready state,
 * non-poisoning promise rejection handling, and explicit URL-busted user retries.
 */
export function createSecondaryLoader<T>(
 rawImporter:(retryIndex:number)=>Promise<T>,
 baseUrl:string,
 dynamicImporter:(url:string)=>Promise<T>=url=>import(/* @vite-ignore */ url) as Promise<T>
):SecondaryLoader<T>{
 let state:SecondaryLoadState<T>={status:'idle',module:null,error:null,attempts:0};
 let inFlight:Promise<T|null>|null=null;
 let retryIndex=0;
 let lastErrorMsg='';
 const listeners=new Set<(next:SecondaryLoadState<T>)=>void>();

 const notify=()=>{
  for(const listener of listeners)listener(state);
 };

 const startLoad=(idx:number):Promise<T|null>=>{
  state={status:'loading',module:null,error:null,attempts:state.attempts+1};
  notify();
  const task=Promise.resolve().then(()=>{
   if(idx>0){
    const retryUrl=resolveRetryModuleUrl(rawImporter.toString(),baseUrl,idx,lastErrorMsg);
    if(retryUrl)return dynamicImporter(retryUrl);
   }
   return rawImporter(idx);
  }).then(
   mod=>{
    inFlight=null;
    lastErrorMsg='';
    state={status:'ready',module:mod,error:null,attempts:state.attempts};
    notify();
    return mod;
   },
   err=>{
    inFlight=null;
    lastErrorMsg=err instanceof Error?err.message:String(err);
    state={status:'error',module:null,error:'SECONDARY_LOAD_FAILED',attempts:state.attempts};
    notify();
    return null;
   }
  );
  inFlight=task;
  return task;
 };

 return {
  getState:()=>state,
  subscribe(listener){
   listeners.add(listener);
   return()=>{listeners.delete(listener);};
  },
  ensure(){
   if(state.status==='ready')return Promise.resolve(state.module);
   if(inFlight)return inFlight;
   if(state.status==='error')return Promise.resolve(null);
   return startLoad(0);
  },
  retry(){
   if(state.status==='ready')return Promise.resolve(state.module);
   if(inFlight)return inFlight;
   retryIndex+=1;
   return startLoad(retryIndex);
  }
 };
}
