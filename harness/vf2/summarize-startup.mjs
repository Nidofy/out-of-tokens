// From repository root: node harness/vf2/summarize-startup.mjs
import {readFileSync,writeFileSync} from 'node:fs';
const median=values=>{const xs=[...values].sort((a,b)=>a-b);return(xs[(xs.length-1)>>1]+xs[xs.length>>1])/2;};
const summarize=(file,modes)=>{
 const rows=JSON.parse(readFileSync(`harness/vf2/${file}`,'utf8'));
 const viewport=[...new Set(rows.map(r=>JSON.stringify(r.viewport)))];
 if(viewport.length!==1||viewport[0]!=='[1280,720,1.0000000447034836]')throw Error('INCOMPARABLE_VIEWPORT');
 return {file,viewport:JSON.parse(viewport[0]),groups:modes.flatMap(mode=>['standard','twelve'].map(scenario=>{
  const samples=Object.fromEntries(['040031e','2bd6d40','vf2'].map(label=>{
   const group=rows.filter(r=>r.label===`${label}-${mode}`&&r.scenario===scenario);
   if(group.length!==6||new Set(group.map(r=>r.round)).size!==6)throw Error('EXPECTED_SIX_ROUNDS');
   return[label,group.map(r=>r.observedControlsAndCanvasMs)];
  }));
  const medians=Object.fromEntries(Object.entries(samples).map(([key,value])=>[key,median(value)]));
  const change=baseline=>Math.round((medians.vf2/medians[baseline]-1)*10000)/100;
  return{mode,scenario,samples,medians,changeVs040031e:change('040031e'),changeVsVf11:change('2bd6d40')};
 }))};
};
const result={protocol:'Warm cache, six alternating forward/reverse rounds per group. HUD+canvas first rAF observation; not assets-ready, input latency or a full performance budget.',primary:summarize('startup-balanced.json',['dev','preview']),confirmation:summarize('startup-dev-confirmation.json',['dev'])};
writeFileSync('harness/vf2/startup-summary.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
