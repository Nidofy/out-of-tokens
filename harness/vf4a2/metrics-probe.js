(()=>{
 if(!new URLSearchParams(location.search).has('vf-attribution'))return;
 const state=window.__vf4a2={headProbeMs:performance.now(),vfMetricsLoadedMs:null,firstCanvasRafMs:null};
 const frames=[];let last=0;
 const tick=now=>{
  if(last)frames.push(now-last);last=now;
  if(state.firstCanvasRafMs===null&&document.querySelector('.studio-hud button')&&document.querySelector('canvas'))state.firstCanvasRafMs=now;
  if(frames.length<180){requestAnimationFrame(tick);return;}
  const sorted=[...frames].sort((a,b)=>a-b),ordinary=document.querySelector('#vf-startup')?.textContent;
  const output=document.createElement('output');output.id='vf-attribution';output.hidden=true;
  output.textContent=JSON.stringify({...state,ordinaryProbe:ordinary?JSON.parse(ordinary):null,raf:{samples:frames.length,p50:sorted[90],p95:sorted[171]},viewport:[innerWidth,innerHeight,devicePixelRatio],visibility:document.visibilityState,modules:performance.getEntriesByType('resource').filter(r=>/\.(?:[cm]?[jt]sx?)(?:\?|$)/.test(r.name)).map(r=>({url:r.name,responseEnd:r.responseEnd}))});document.body.append(output);
 };requestAnimationFrame(tick);
})();
