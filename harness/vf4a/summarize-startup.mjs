import {readFileSync,writeFileSync,existsSync} from 'node:fs';
const median=values=>{const xs=[...values].sort((a,b)=>a-b);return(xs[(xs.length-1)>>1]+xs[xs.length>>1])/2;};
function summarize(file,modes){
 const rows=JSON.parse(readFileSync(`harness/vf4a/${file}`,'utf8'));
 if(rows.some(r=>JSON.stringify(r.viewport)!=='[1280,720,1.0000000447034836]'))throw Error('INCOMPARABLE_VIEWPORT');
 return {file,groups:modes.flatMap(mode=>['standard','twelve'].map(scenario=>{
  const samples=Object.fromEntries(['040031e','c68541d','vf4a'].map(label=>{
   const group=rows.filter(r=>r.label===`${label}-${mode}`&&r.scenario===scenario);
   if(group.length!==6||new Set(group.map(r=>r.round)).size!==6)throw Error('EXPECTED_SIX_ROUNDS');
   return [label,group.map(r=>r.observedControlsAndCanvasMs)];
  }));
  const medians=Object.fromEntries(Object.entries(samples).map(([label,values])=>[label,median(values)]));
  const change=base=>Math.round((medians.vf4a/medians[base]-1)*10000)/100;
  return {mode,scenario,samples,medians,changeVs040031e:change('040031e'),changeVsVf31:change('c68541d')};
 }))};
}
const result={protocol:'Warm-cache first HUD+canvas rAF observation; six alternating forward/reverse rounds. Not assets-ready or complete performance budget.',primary:summarize('startup-balanced.json',['dev','preview'])};
if(existsSync('harness/vf4a/startup-confirmation.json'))result.confirmation=summarize('startup-confirmation.json',['dev','preview']);
writeFileSync('harness/vf4a/startup-summary.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
