/** Opt-in DEV-only observation. No gameplay state or commands are touched. */
export function startVisualMetrics(){
 const samples:number[]=[];let last=0,ready:number|null=null;
 const output=document.createElement('output');output.id='vf-metrics';output.hidden=true;document.body.append(output);
 const frame=(now:number)=>{if(last&&samples.length<180)samples.push(now-last);last=now;
  if(ready===null&&document.querySelector('.studio-hud button')&&document.querySelector('canvas'))ready=now;
  if(samples.length<180){requestAnimationFrame(frame);return;}
  const sorted=[...samples].sort((a,b)=>a-b),entries=performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  output.textContent=JSON.stringify({ua:navigator.userAgent,threads:navigator.hardwareConcurrency,viewport:[innerWidth,innerHeight,devicePixelRatio],observedControlsAndCanvasMs:ready,raf:{samples:sorted.length,p50:sorted[Math.floor(sorted.length*.5)],p95:sorted[Math.floor(sorted.length*.95)],over50:sorted.filter(n=>n>50).length},resources:{count:entries.length,transfer:entries.reduce((s,e)=>s+e.transferSize,0),decodedBody:entries.reduce((s,e)=>s+e.decodedBodySize,0)},note:'DEV navigation sample; decodedBody is network payload, not decoded texture/GPU memory; first controls+canvas is not all assets ready.'});
 };requestAnimationFrame(frame);
}
