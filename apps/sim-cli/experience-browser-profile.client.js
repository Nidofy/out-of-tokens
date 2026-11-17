import {GameSession,BrowserSaves,CheckpointCoordinator} from '__PLATFORM__';
import {replay,hashBrowser} from '__PERSISTENCE__';
import {createSaveEncoder} from '__ENCODER__';
import {content} from '__CONTENT__';
const status=document.querySelector('#status');
const check=(ok,message)=>{if(!ok)throw Error(message);};
const yieldTask=()=>new Promise(resolve=>setTimeout(resolve,0));
const summary=rows=>Object.fromEntries(Object.keys(rows[0]).filter(k=>typeof rows[0][k]==='number'&&!['started','finished'].includes(k)).map(k=>{const a=rows.map(r=>r[k]).sort((a,b)=>a-b);return[k,{p50:a[14],p95:a[28],max:a.at(-1)}];}));
document.querySelector('#start').onclick=async()=>{
 document.querySelector('#start').disabled=true;
 const results=[],visibility=[],longTasks=[];
 const observer=new PerformanceObserver(list=>longTasks.push(...list.getEntries().map(e=>({start:e.startTime,duration:e.duration}))));
 observer.observe({type:'longtask',buffered:true});
 const changed=()=>visibility.push({at:performance.now(),state:document.visibilityState});document.addEventListener('visibilitychange',changed);
 let error=null;
 try{
  const inputs=await(await fetch('/inputs.json')).json();
  for(const input of inputs){
   check(document.visibilityState==='visible','BACKGROUND_TAB');
   const session=new GameSession(content,1);await session.importSave(input.canonical,'benchmark-'+input.name);
   const encoder=createSaveEncoder(),dbName='oot-experience-bench-'+crypto.randomUUID(),store=new BrowserSaves(dbName);
   let revision=0,current=null,captureEnd=0;
   const capture=()=>{const t=performance.now(),v=session.checkpointSnapshot();if(current)current.captureMs=performance.now()-t;captureEnd=performance.now();return v;};
   const trackedEncoder={encode:async value=>{const t=performance.now();current.queueMs=t-captureEnd;const text=await encoder.encode(value);current.encoderMs=performance.now()-t;current.postMessageMs=encoder.stats.lastPostMs;current.worker=encoder.stats.usedWorker;check(text===input.canonical,'CANONICAL_BYTES');return text;}};
   const storage={onExternalChange:null,list:()=>store.list(),read:id=>store.read(id),close:()=>store.close(),write:async(...args)=>{const t=performance.now();const v=await store.write(...args);current.ioMs=performance.now()-t;revision=v;return v;}};
   const record={name:input.name,steps:input.commands.length,commandsHash:input.commandsHash,stateHash:input.stateHash,policies:{},phases:[]};results.push(record);
   try{
    for(const policy of ['checkpoint','boundary']){
     const rows=[];record.policies[policy]={samples:rows};
     for(let i=-5;i<30;i++){
      await yieldTask();check(document.visibilityState==='visible','BACKGROUND_TAB');
      status.textContent=`${input.name} ${policy}: ${i<0?'warmup '+(i+6):'sample '+(i+1)}/30`;
      current={};const t0=performance.now();const coordinator=new CheckpointCoordinator(capture,storage,revision,trackedEncoder);const constructMs=performance.now()-t0;
      const started=performance.now();coordinator.enqueue(policy==='boundary'?'load':'command');const enqueueMs=performance.now()-started;
      const state=await coordinator.drain(),finished=performance.now();
      check(state.kind==='saved','NOT_SAVED:'+state.kind);check(current.worker,'WORKER_FALLBACK');
      check((await store.read('auto')).text===input.canonical,'DISK_BYTES');coordinator.dispose();
      if(i>=0)rows.push({...current,started,finished,constructMs,enqueueMs,totalMs:finished-started,visibility:document.visibilityState});
     }
     record.policies[policy].summary=summary(rows);
    }
    // Separate diagnostic probes: never attribute synchronous replay probes to the production Worker path.
    for(let i=-5;i<30;i++){
     await yieldTask();check(document.visibilityState==='visible','BACKGROUND_TAB');
     status.textContent=`${input.name} independent CPU phase probes: ${i+1}/30`;
     let t=performance.now();const snapshot=session.checkpointSnapshot();const copyMs=performance.now()-t;
     t=performance.now();const state=replay(content,input.seed,input.commands);const replayMs=performance.now()-t;
     t=performance.now();check(await hashBrowser(state)===input.stateHash,'STATE_HASH');const stateHashMs=performance.now()-t;
     t=performance.now();await hashBrowser(content);const contentHashMs=performance.now()-t;
     check(snapshot.input.commands.length===input.commands.length,'CAPTURE_LOG');
     if(i>=0)record.phases.push({copyMs,replayMs,stateHashMs,contentHashMs});
    }
    record.phaseSummary=summary(record.phases);
   }finally{encoder.dispose();await store.close();await new Promise((resolve,reject)=>{const r=indexedDB.deleteDatabase(dbName);r.onsuccess=()=>resolve();r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('BENCH_DB_BLOCKED'));});}
  }
 }catch(e){error=String(e);}
 await yieldTask();observer.disconnect();document.removeEventListener('visibilitychange',changed);
 const report={userAgent:navigator.userAgent,hardwareConcurrency:navigator.hardwareConcurrency,visibility,longTasks,results,error,finishedVisibility:document.visibilityState};
 const response=await fetch('/results',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(report)});
 status.textContent=(error?'FAILED: '+error:'Completed fixed samples')+'; report '+(response.ok?'saved':'FAILED TO SAVE')+'\n'+results.map(r=>r.name+': '+JSON.stringify(Object.fromEntries(Object.entries(r.policies).map(([p,v])=>[p,v.summary])))).join('\n');
};
