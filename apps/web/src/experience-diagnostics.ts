import {h,render} from 'preact';
import {BrowserSaves,CheckpointCoordinator,GameSession} from 'oot-platform';
import type {Draft} from 'oot-platform';
import {suggestAssignmentsFromSnapshot} from 'oot-platform/worker';
import {content} from './content.js';
import {stableDraftKey} from './experience-adapter.js';
import {ExperienceArtSlot} from './experience-art-slot.js';
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

function isClippedByScrollAncestor(el:HTMLElement,cx:number,cy:number):boolean{
 let p=el.parentElement;
 while(p&&p!==document.body&&p!==document.documentElement){
  const s=getComputedStyle(p);
  if(['auto','scroll','hidden','clip'].includes(s.overflowY)||['auto','scroll','hidden','clip'].includes(s.overflowX)){
   const pr=p.getBoundingClientRect();
   if(cx<pr.left+1||cx>pr.right-1||cy<pr.top+1||cy>pr.bottom-1)return true;
  }
  p=p.parentElement;
 }
 return false;
}

function collectDomAudit(){
 const vw=window.innerWidth,vh=window.innerHeight;
 const docOverflowX=document.documentElement.scrollWidth-document.documentElement.clientWidth;
 const bodyOverflowX=document.body.scrollWidth-document.body.clientWidth;
 const openDialogs=[...document.querySelectorAll<HTMLDialogElement>('dialog[open]')];
 const scope:ParentNode=openDialogs.at(-1)??document.body;
 const candidates=[...scope.querySelectorAll<HTMLElement>('button,summary,select,input,[role="tab"]')];
 const extraBark=document.querySelector<HTMLElement>('.ui2-bark-card');
 if(extraBark&&!scope.contains(extraBark)){
  candidates.push(...extraBark.querySelectorAll<HTMLElement>('button'));
 }
 const shortControls:{label:string;tag:string;w:number;h:number}[]=[];
 const hitTests:{label:string;cx:number;cy:number;pass:boolean;hitTag:string;hitClass:string}[]=[];

 for(const node of candidates){
  const style=getComputedStyle(node);
  if(style.visibility==='hidden'||style.display==='none'||style.pointerEvents==='none')continue;
  if((node as HTMLButtonElement).disabled)continue;
  const r=node.getBoundingClientRect();
  if(r.width<=0||r.height<=0)continue;
  if(r.right<0||r.bottom<0||r.left>vw||r.top>vh)continue;
  const label=(node.getAttribute('aria-label')||node.textContent||'').trim().replace(/\s+/g,' ').slice(0,48)||node.tagName;
  if((node.tagName==='BUTTON'||node.getAttribute('role')==='tab')&&(r.width<43.5||r.height<43.5)){
   shortControls.push({label,tag:node.tagName,w:Math.round(r.width*10)/10,h:Math.round(r.height*10)/10});
  }
  const cx=Math.round(Math.min(vw-2,Math.max(2,r.left+r.width/2)));
  const cy=Math.round(Math.min(vh-2,Math.max(2,r.top+r.height/2)));
  if(isClippedByScrollAncestor(node,cx,cy))continue;
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

function postDiagReport(kind:string,body:string){
 try{
  void fetch(`./__diag_report?kind=${encodeURIComponent(kind)}`,{
   method:'POST',
   headers:{'content-type':'application/json'},
   body
  }).catch(()=>{});
 }catch{ /* optional diagnostic collector */ }
}

export function startExpAudit(){
 const out=document.createElement('output');
 out.id='exp-audit';
 out.hidden=true;
 document.body.append(out);
 let lastJson='';
 const write=()=>{
  try{
   const json=JSON.stringify(collectDomAudit());
   out.textContent=json;
   if(json!==lastJson){
    lastJson=json;
    postDiagReport('audit',json);
   }
  }catch{ /* ignore mid-unmount read */ }
 };
 write();
 setInterval(write,400);
 window.addEventListener('resize',write,{passive:true});
 window.addEventListener('click',()=>setTimeout(write,80),true);
 window.addEventListener('keydown',()=>setTimeout(write,80),true);
}

export function startArtPreview(){
 const sp=new URLSearchParams(location.search);
 const dark=sp.get('theme')==='dark';
 const english=sp.get('locale')==='en';
 document.documentElement.dataset.theme=dark?'dark':'light';
 document.documentElement.lang=english?'en':'zh-CN';
 const slots=[
  {id:'outcome-tea-menu',variant:'outcome' as const,zh:'茶坊手绘菜单',en:'Tea shop menu'},
  {id:'outcome-cafe-sign',variant:'outcome' as const,zh:'街角咖啡馆双语手写牌',en:'Corner cafe chalkboard sign'},
  {id:'outcome-community-web',variant:'outcome' as const,zh:'社区活动网页',en:'Community event web page'},
  {id:'outcome-bookshop-system',variant:'outcome' as const,zh:'旧书店会员积分与订单台账',en:'Used bookshop order & points'},
  {id:'outcome-bookshop-guide',variant:'outcome' as const,zh:'旧书店使用指南手册',en:'Used bookshop user handbook'},
  {id:'outcome-workshop-display',variant:'outcome' as const,zh:'工作室成果展架空位',en:'Studio outcome display shelf'},
  {id:'vignette-rest-corner',variant:'vignette' as const,zh:'夜间作息角横幅',en:'Night rest corner vignette'},
  {id:'vignette-first-delivery',variant:'vignette' as const,zh:'首单交付里程碑横幅',en:'First delivery milestone vignette'}
 ];
 const host=document.getElementById('app')!;
 render(
  h('main',{style:{padding:'12px',minHeight:'100dvh',background:'var(--paper)',color:'var(--ink)'}},
   h('h1',{style:{margin:'0 0 8px',fontSize:'18px'}},`${english?'Art-Batch 7 Five-Viewport Crop Review':'Art-Batch 7 全八槽五视口裁切核验'} (${window.innerWidth}x${window.innerHeight})`),
   h('div',{class:'ui2-outcome-grid'},
    slots.map(s=>
     h('div',{key:s.id,class:'ui2-outcome-card'},
      h(ExperienceArtSlot,{
       slotId:s.id,
       variant:s.variant,
       english,
       state:s.id==='outcome-workshop-display'?'neutral':'delivered',
       badgeText:s.id,
       title:english?s.en:s.zh,
       subtitle:english?'Crop & readability check across 5 viewports':'五视口裁切与安全区文字可读性核验'
      })
     )
    )
   )
  ),
  host
 );
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

  // Candidate Search Worker benchmark (5 warmups + 30 samples for opening-176 & controlled-full-roster-256)
  const candClient=createSuggestionClient();
  const openSession=new GameSession(content,1);
  const openJob=openSession.view.jobs.find(j=>j.template==='menu')!;
  const openDraft=[{character:'qwen',role:'worker' as const,mode:'cloud' as const}];
  const openDraftObj={team:openDraft,draftKey:stableDraftKey(openJob.id,openDraft)};

  const fullSession=new GameSession(content,1);
  const fullSnap=fullSession.workerSnapshot();
  for(const v of content.versions){
   if(!fullSnap.state.actors.some(a=>a.id===v.character)){
    fullSnap.state.actors.push({id:v.character,version:v.id,energy:100,mood:70,load:0,busyUntil:0});
    fullSnap.state.campaign!.relations[v.character]={...fullSnap.state.campaign!.relations.qwen!,bonuses:{},stories:[],training:null};
   }
  }
  const fullDraftObj={team:[],draftKey:'wide'};

  const runSearchCase=async(
   name:string,
   getSnap:()=>{snap:ReturnType<GameSession['workerSnapshot']>;cloneMs:number},
   jobId:string,
   draftObj:Draft
  )=>{
   const blockingMs:number[]=[];
   const roundTripMs:number[]=[];
   const workerComputeMs:number[]=[];
   const evaluatedCounts:number[]=[];
   let usedSearchWorker=false;
   let truncated=false;

   for(let i=-5;i<30;i++){
    const {snap,cloneMs}=getSnap();
    const {result,timing}=await candClient.suggest(snap,cloneMs,jobId,draftObj);
    usedSearchWorker=usedSearchWorker||timing.usedWorker;
    truncated=truncated||result.truncated;
    const direct=suggestAssignmentsFromSnapshot(content,snap,jobId,draftObj);
    if(JSON.stringify(result.suggestions)!==JSON.stringify(direct.suggestions)){
     throw Error(`WORKER_SEARCH_PARITY_MISMATCH_${name}`);
    }
    if(i>=0){
     blockingMs.push(timing.mainThreadBlockingMs);
     roundTripMs.push(timing.roundTripMs);
     workerComputeMs.push(timing.workerComputeMs);
     evaluatedCounts.push(result.evaluated);
    }
   }

   return {
    name,
    jobId,
    usedSearchWorker,
    evaluated:evaluatedCounts[0]??0,
    truncated,
    summary:{
     mainThreadBlockingMs:summarize(blockingMs),
     roundTripMs:summarize(roundTripMs),
     workerComputeMs:summarize(workerComputeMs)
    },
    samples:{mainThreadBlockingMs:blockingMs,roundTripMs,workerComputeMs}
   };
  };

  const candOpen=await runSearchCase('opening-176',()=>{
   const t=performance.now();
   const snap=openSession.workerSnapshot();
   return {snap,cloneMs:performance.now()-t};
  },openJob.id,openDraftObj);

  const candFull=await runSearchCase('controlled-full-roster-256',()=>{
   const t=performance.now();
   const snap=structuredClone(fullSnap);
   return {snap,cloneMs:performance.now()-t};
  },'0-0',fullDraftObj);

  candClient.dispose();
  observer?.disconnect();

  const jsonReport=JSON.stringify({
   visibility:document.visibilityState,
   ua:navigator.userAgent,
   cores:navigator.hardwareConcurrency,
   warmups:5,
   samples:30,
   longTaskCount:longTasks.length,
   maxLongTaskMs:longTasks.length?Math.max(...longTasks):0,
   saveResults,
   candidateSearchCases:[candOpen,candFull]
  },null,2);
  out.textContent=jsonReport;
  out.dataset.status='done';
  postDiagReport('perf',jsonReport);
  const pre=document.createElement('pre');
  pre.id='exp-perf-pre';
  pre.dataset.status='done';
  pre.style.cssText='position:fixed;inset:12px;z-index:99999;overflow:auto;margin:0;padding:12px;border-radius:12px;background:#111815;color:#d6f5d6;font:12px/1.4 monospace;';
  pre.textContent=jsonReport;
  document.body.append(pre);
 }catch(err){
  observer?.disconnect();
  const errJson=JSON.stringify({error:err instanceof Error?err.message:String(err)});
  out.textContent=errJson;
  out.dataset.status='error';
  postDiagReport('perf-error',errJson);
 }
}
