/** Opt-in DEV / visual-review-build observation. No gameplay state or commands are touched. */
export function startVisualMetrics(){
 const startup=document.createElement('output');startup.id='vf-startup';startup.hidden=true;document.body.append(startup);
 const samples:number[]=[];let last=0,ready:number|null=null;
 const output=document.createElement('output');output.id='vf-metrics';output.hidden=true;document.body.append(output);
 const frame=(now:number)=>{if(last&&samples.length<180)samples.push(now-last);last=now;
  if(ready===null&&document.querySelector('.studio-hud button')&&document.querySelector('canvas')){ready=now;startup.textContent=JSON.stringify({kind:'controls-and-canvas-only',ua:navigator.userAgent,threads:navigator.hardwareConcurrency,viewport:[innerWidth,innerHeight,devicePixelRatio],observedControlsAndCanvasMs:ready,visibility:document.visibilityState,navigation:performance.getEntriesByType('navigation').map(e=>({type:(e as PerformanceNavigationTiming).type})),note:'First observed HUD controls + canvas, not assets-ready or input-latency. Separate 180-frame output is vf-metrics.'});}
  output.dataset.samples=String(samples.length);
  if(samples.length<180){requestAnimationFrame(frame);return;}
  const sorted=[...samples].sort((a,b)=>a-b),entries=performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  output.textContent=JSON.stringify({ua:navigator.userAgent,threads:navigator.hardwareConcurrency,viewport:[innerWidth,innerHeight,devicePixelRatio],observedControlsAndCanvasMs:ready,raf:{samples:sorted.length,p50:sorted[Math.floor(sorted.length*.5)],p95:sorted[Math.floor(sorted.length*.95)],over50:sorted.filter(n=>n>50).length},resources:{count:entries.length,transfer:entries.reduce((s,e)=>s+e.transferSize,0),decodedBody:entries.reduce((s,e)=>s+e.decodedBodySize,0)},note:'Diagnostic navigation sample; decodedBody is network payload, not decoded texture/GPU memory; first controls+canvas is not all assets ready.'});
 };requestAnimationFrame(frame);
}
