import {BrowserSaves,CheckpointCoordinator,GameSession} from 'oot-platform';
import {content} from './content.js';
import {stableDraftKey} from './experience-adapter.js';
import {createSuggestionClient} from './experience-worker-host.js';
import {createSaveEncoder} from './save-encoder-host.js';

interface FrozenSaveBenchInput {
 name:string;
 seed:number;
 commands:Parameters<GameSession['send']>[0][];
 canonical:string;
 stateHash:string;
}

function summarize(values:readonly number[]){
 const sorted=[...values].sort((a,b)=>a-b);
 return {
  p50:sorted[Math.min(sorted.length-1,14)]??0,
  p95:sorted[Math.min(sorted.length-1,28)]??0,
  max:sorted[sorted.length-1]??0
 };
}

function collectDomAudit(){
 const vw=window.innerWidth,vh=window.innerHeight;
 const docOverflowX=document.documentElement.scrollWidth-document.documentElement.clientWidth;
 const bodyOverflowX=document.body.scrollWidth-document.body.clientWidth;
 const selectors='button,summary,select,input,[role="tab"]';
 const shortControls:{label:string;tag:string;w:number;h:number}[]=[];
 const hitTests:{label:string;cx:number;cy:number;pass:boolean;hitTag:string;hitClass:string}[]=[];

 for(const node of document.querySelectorAll<HTMLElement>(selectors)){
  const style=getComputedStyle(node);
  if(style.visibility==='hidden'||style.display==='none')continue;
  const r=node.getBoundingClientRect();
  if(r.width<=0||r.height<=0)continue;
  if(r.right<0||r.bottom<0||r.left>vw||r.top>vh)continue;
  const label=(node.getAttribute('aria-label')||node.textContent||'').trim().replace(/\s+/g,' ').slice(0,48)||node.tagName;
  if((node.tagName==='BUTTON'||node.getAttribute('role')==='tab')&&(r.width<43.5||r.height<43.5)){
   shortControls.push({label,tag:node.tagName,w:Math.round(r.width*10)/10,h:Math.round(r.height*10)/10});
  }
  const cx=Math.round(r.left+r.width/2),cy=Math.round(r.top+r.height/2);
  if(cx>=2&&cy>=2&&cx<=vw-2&&cy<=vh-2){
   const hit=document.elementFromPoint(cx,cy) as HTMLElement|null;
   const pass=!!hit&&(hit===node||node.contains(hit)||hit.contains(node));
   hitTests.push({
    label,
    cx,
    cy,
    pass,
    hitTag:hit?.tagName??'NONE',
    hitClass:(hit?.className&&typeof hit.className==='string'?hit.className:'').slice(0,48)
   });
  }
 }

 const artSlots=[...document.querySelectorAll<HTMLElement>('[data-slot-id]')].map(el=>{
  const img=el.querySelector('img');
  const r=el.getBoundingClientRect();
  return {
   slotId:el.dataset.slotId??'',
   variant:el.dataset.variant??'',
   artState:el.dataset.artState??'',
   width:Math.round(r.width),
   height:Math.round(r.height),
   naturalWidth:img?.naturalWidth??0,
   naturalHeight:img?.naturalHeight??0
  };
 });

 return {
  viewport:[vw,vh,window.devicePixelRatio],
  locale:document.documentElement.lang,
  theme:document.documentElement.dataset.theme??'light',
  motion:document.documentElement.dataset.motion??'full',
  docOverflowX,
  bodyOverflowX,
  shortControlsCount:shortControls.length,
  shortControls,
  hitTestedCount:hitTests.length,
  hitFailures:hitTests.filter(h=>!h.pass),
  artSlots
 };
}

export function startExpAudit(){
 const out=document.createElement('output');
 out.id='exp-audit';
 out.hidden=true;
 document.body.append(out);
 const write=()=>{
  try{out.textContent=JSON.stringify(collectDomAudit());}catch{ /* ignore mid-unmount read */ }
 };
 write();
 setInterval(write,350);
 window.addEventListener('resize',write,{passive:true});
 window.addEventListener('click',()=>setTimeout(write,60),true);
 window.addEventListener('keydown',()=>setTimeout(write,60),true);
}

export async function startExpPerf(){
 const out=document.createElement('output');
 out.id='exp-perf-report';
 out.dataset.status='running';
 out.hidden=true;
 document.body.append(out);

 const longTasks:number[]=[];
 let observer:PerformanceObserver|null=null;
 try{
  if(typeof PerformanceObserver!=='undefined'){
   observer=new PerformanceObserver(list=>{
    for(const entry of list.getEntries())longTasks.push(entry.duration);
   });
   observer.observe({type:'longtask',buffered:false});
  }
 }catch{ /* longtask observer optional */ }

 try{
  const resp=await fetch('./__perf_inputs.json');
  if(!resp.ok)throw Error(`PERF_INPUTS_HTTP_${resp.status}`);
  const payload=await resp.json() as {inputs:FrozenSaveBenchInput[]};

  const saveResults=[];
  for(const input of payload.inputs){
   const session=new GameSession(content,input.seed);
   for(const cmd of input.commands){
    const res=session.send(cmd);
    if(res.error)throw Error(`REPLAY_ERROR_${input.name}:${res.error}`);
   }
   const exported=await session.exportSave();
   if(exported!==input.canonical)throw Error(`CANONICAL_MISMATCH_${input.name}`);

   const directDb=`oot-perf-io-${input.name}-${Date.now()}`;
   const e2eDb=`oot-perf-e2e-${input.name}-${Date.now()}`;
   const directStorage=new BrowserSaves(directDb,window.indexedDB);
   const e2eStorage=new BrowserSaves(e2eDb,window.indexedDB);
   const encoder=createSaveEncoder();
   let directRev=0;
   const e2eCoord=new CheckpointCoordinator(()=>session.checkpointSnapshot(),e2eStorage,0,encoder);

   const captureMainMs:number[]=[];
   const workerPostMs:number[]=[];
   const workerRoundtripMs:number[]=[];
   const prefixEncodeMs:number[]=[];
   const idbWriteMs:number[]=[];
   const enqueueMainMs:number[]=[];
   const e2eCommitMs:number[]=[];
   let usedSaveWorker=false;
   const halfCmds=Math.floor(input.commands.length/2);

   for(let i=-5;i<30;i++){
    const tCap=performance.now();
    const snap=session.checkpointSnapshot();
    const capDur=performance.now()-tCap;

    const tEnc=performance.now();
    const text=await encoder.encode(snap.input);
    const encDur=performance.now()-tEnc;
    const postDur=encoder.stats.lastPostMs;
    usedSaveWorker=usedSaveWorker||encoder.stats.usedWorker;
    if(text!==input.canonical)throw Error(`WORKER_BYTES_MISMATCH_${input.name}`);

    const tPrefix=performance.now();
    await encoder.encode({...snap.input,throughCommand:halfCmds});
    const prefixDur=performance.now()-tPrefix;

    const tIo=performance.now();
    directRev=await directStorage.write('auto',text,directRev,i%5===4?'boundary':'checkpoint',{lineageId:session.lineageId});
    const ioDur=performance.now()-tIo;

    const tEnq=performance.now();
    e2eCoord.enqueue('command');
    const enqDur=performance.now()-tEnq;
    const st=await e2eCoord.drain();
    const e2eDur=performance.now()-tEnq;
    if(st.kind!=='saved'&&st.kind!=='idle'){
     throw Error(`UNEXPECTED_STATUS_${st.kind}`);
    }
    if(i>=0){
     captureMainMs.push(capDur);
     workerPostMs.push(postDur);
     workerRoundtripMs.push(encDur);
     prefixEncodeMs.push(prefixDur);
     idbWriteMs.push(ioDur);
     enqueueMainMs.push(enqDur);
     e2eCommitMs.push(e2eDur);
    }
   }

   e2eCoord.dispose();
   encoder.dispose();
   await directStorage.close();
   await e2eStorage.close();
   for(const db of [directDb,e2eDb]){
    await new Promise<void>(resolve=>{
     const req=window.indexedDB.deleteDatabase(db);
     req.onsuccess=()=>resolve();
     req.onerror=()=>resolve();
     req.onblocked=()=>resolve();
    });
   }

   saveResults.push({
    name:input.name,
    commands:input.commands.length,
    stateHash:input.stateHash,
    bytes:exported.length,
    usedSaveWorker,
    summary:{
     captureMainMs:summarize(captureMainMs),
     workerPostMs:summarize(workerPostMs),
     workerRoundtripMs:summarize(workerRoundtripMs),
     prefixEncodeMs:summarize(prefixEncodeMs),
     idbWriteMs:summarize(idbWriteMs),
     enqueueMainMs:summarize(enqueueMainMs),
     e2eCommitMs:summarize(e2eCommitMs)
    },
    samples:{captureMainMs,workerPostMs,workerRoundtripMs,prefixEncodeMs,idbWriteMs,enqueueMainMs,e2eCommitMs}
   });
  }

  // Candidate Search Worker benchmark (5 warmups + 30 samples)
  const candClient=createSuggestionClient();
  const openSession=new GameSession(content,1);
  const openJob=openSession.view.jobs.find(j=>j.template==='menu')!;
  const openDraft=[{character:'qwen',role:'worker' as const,mode:'cloud' as const}];
  const openDraftObj={team:openDraft,draftKey:stableDraftKey(openJob.id,openDraft)};

  const blockingMs:number[]=[];
  const roundTripMs:number[]=[];
  const workerComputeMs:number[]=[];
  const evaluatedCounts:number[]=[];
  let usedSearchWorker=false;

  for(let i=-5;i<30;i++){
   const tClone=performance.now();
   const snap=openSession.workerSnapshot();
   const cloneMs=performance.now()-tClone;
   const {result,timing}=await candClient.suggest(snap,cloneMs,openJob.id,openDraftObj);
   usedSearchWorker=usedSearchWorker||timing.usedWorker;
   const direct=openSession.suggestAssignments(openJob.id,openDraftObj);
   if(JSON.stringify(result.suggestions)!==JSON.stringify(direct.suggestions)){
    throw Error('WORKER_SEARCH_PARITY_MISMATCH');
   }
   if(i>=0){
    blockingMs.push(timing.mainThreadBlockingMs);
    roundTripMs.push(timing.roundTripMs);
    workerComputeMs.push(timing.workerComputeMs);
    evaluatedCounts.push(result.evaluated);
   }
  }
  candClient.dispose();
  observer?.disconnect();

  out.textContent=JSON.stringify({
   visibility:document.visibilityState,
   ua:navigator.userAgent,
   cores:navigator.hardwareConcurrency,
   warmups:5,
   samples:30,
   longTaskCount:longTasks.length,
   maxLongTaskMs:longTasks.length?Math.max(...longTasks):0,
   saveResults,
   candidateSearch:{
    jobId:openJob.id,
    usedSearchWorker,
    evaluated:evaluatedCounts[0]??0,
    summary:{
     mainThreadBlockingMs:summarize(blockingMs),
     roundTripMs:summarize(roundTripMs),
     workerComputeMs:summarize(workerComputeMs)
    },
    samples:{mainThreadBlockingMs:blockingMs,roundTripMs,workerComputeMs}
   }
  },null,2);
  out.dataset.status='done';
 }catch(err){
  observer?.disconnect();
  out.textContent=JSON.stringify({error:err instanceof Error?err.message:String(err)});
  out.dataset.status='error';
 }
}
