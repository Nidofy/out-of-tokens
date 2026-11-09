// Run from the repository root: node harness/vf1/summarize-startup.mjs
import {readFileSync,writeFileSync} from 'node:fs';
const input='harness/vf1/vf11-preload-balanced-startup.json';
const rows=JSON.parse(readFileSync(input,'utf8'));
const viewports=[...new Set(rows.map(r=>JSON.stringify(r.viewport)))];
if(viewports.length!==1)throw Error('INCOMPARABLE_VIEWPORTS');
const median=xs=>{const a=[...xs].sort((a,b)=>a-b);return(a[(a.length-1)>>1]+a[a.length>>1])/2;};
const groups=['dev','preview'].flatMap(mode=>['standard','twelve'].map(scenario=>{
 const select=label=>rows.filter(r=>r.label===label&&r.scenario===scenario).map(r=>r.observedControlsAndCanvasMs);
 const baseline=select(`040031e-${mode}`),candidate=select(`vf11-${mode}`);
 if(baseline.length<3||candidate.length<3)throw Error('INSUFFICIENT_SAMPLES');
 const before=median(baseline),after=median(candidate);
 return {mode,scenario,baseline,candidate,baselineMedian:before,candidateMedian:after,changePercent:Math.round((after/before-1)*10000)/100};
}));
const summary={input,viewport:JSON.parse(viewports[0]),protocol:'Warm cache; six navigations per group, alternating forward/reverse order; first controls+canvas rAF observation only. Not cold-load, fully-interactive, or frame/GPU budget.',groups};
writeFileSync('harness/vf1/vf11-startup-summary.json',JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary,null,2));
