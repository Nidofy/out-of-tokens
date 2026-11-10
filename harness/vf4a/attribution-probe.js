// Injected by attribution.config.mjs only; absent from ordinary dev/production builds.
if(new URLSearchParams(location.search).has('vf-attribution')){
 const marks={},longtasks=[],frames=[];let previous=0,observer;
 window.__vfAttribution={mark(name){if(marks[name]===undefined)marks[name]=performance.now();}};
 const longtaskSupported=PerformanceObserver.supportedEntryTypes.includes('longtask');
 if(longtaskSupported){observer=new PerformanceObserver(list=>{for(const e of list.getEntries())longtasks.push({start:e.startTime,duration:e.duration});});observer.observe({type:'longtask',buffered:true});}
 const output=document.createElement('output');output.id='vf-attribution';output.hidden=true;
 document.addEventListener('DOMContentLoaded',()=>document.body.append(output),{once:true});
 const frame=now=>{
  if(previous)frames.push(now-previous);previous=now;
  if(document.querySelector('.studio-hud button')&&document.querySelector('canvas'))window.__vfAttribution.mark('firstCanvasRafMs');
  if(frames.length<180||marks.firstSyncEndMs===undefined){output.textContent=JSON.stringify({pending:true,marks,frames:frames.length,lastRaf:now,recentFrames:frames.slice(-8),visibility:document.visibilityState});requestAnimationFrame(frame);return;}
  const entries=performance.getEntriesByType('resource');
  const modules=entries.filter(e=>e.initiatorType==='script'&&/\.(?:[cm]?js|tsx?)(?:\?|$)|\/@vite\/|\/@id\//.test(e.name)).map(e=>({url:e.name,initiator:e.initiatorType,start:e.startTime,responseEnd:e.responseEnd,duration:e.duration,transfer:e.transferSize}));
  const phase=(end,start)=>marks[end]- (start?marks[start]:0);
  const sorted=[...frames].sort((a,b)=>a-b);
  output.textContent=JSON.stringify({marks,phases:{navigationToEntry:phase('moduleEntryMs'),entryToHud:phase('firstHudCommitMs','moduleEntryMs'),hudToSceneLoaded:phase('sceneModuleLoadedMs','firstHudCommitMs'),sceneLoadedToCanvasRaf:phase('firstCanvasRafMs','sceneModuleLoadedMs'),hudToSceneEffect:phase('sceneEffectStartMs','firstHudCommitMs'),pixiInit:phase('pixiInitEndMs','pixiInitStartMs'),firstSync:phase('firstSyncEndMs','firstSyncStartMs'),syncToRaf:phase('firstCanvasRafMs','firstSyncEndMs')},modules,moduleCount:modules.length,lastModuleResponseMs:Math.max(0,...modules.map(e=>e.responseEnd)),longtaskSupported,longtasks,longtasksBeforeCanvas:longtasks.filter(e=>e.start<=marks.firstCanvasRafMs),raf:{samples:frames.length,p50:sorted[Math.floor(sorted.length*.5)],p95:sorted[Math.floor(sorted.length*.95)]},viewport:[innerWidth,innerHeight,devicePixelRatio],visibility:document.visibilityState,ua:navigator.userAgent,threads:navigator.hardwareConcurrency});
  output.dataset.ready='true';observer?.disconnect();
 };requestAnimationFrame(frame);
}
