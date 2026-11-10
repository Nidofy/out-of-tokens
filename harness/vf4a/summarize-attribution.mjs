import {readFileSync,writeFileSync} from 'node:fs';
const rows=JSON.parse(readFileSync('harness/vf4a/dev-attribution.json','utf8'));
const median=xs=>{const a=[...xs].sort((x,y)=>x-y);return (a[(a.length-1)>>1]+a[a.length>>1])/2;};
const rounded=n=>Math.round(n*100)/100;
const groups=[];
for(const label of ['040031e','6f3a191','c68541d'])for(const [mode,scenario] of [['dev','standard'],['dev','twelve'],['preview','twelve']]){
 const group=rows.filter(r=>r.label===label&&r.mode===mode&&r.scenario===scenario);
 if(group.length!==6)throw Error('Six rounds required');
 const values=group.map(r=>({...r.phases,canvas:r.marks.firstCanvasRafMs,sceneImport:r.marks.sceneModuleLoadedMs-r.marks.sceneImportStartMs,effectToInit:r.marks.pixiInitStartMs-r.marks.sceneEffectStartMs,moduleCount:r.moduleCount,lastModuleResponse:r.lastModuleResponseMs,longtaskCount:r.longtasksBeforeCanvas.length,longtaskMs:r.longtasksBeforeCanvas.reduce((n,t)=>n+t.duration,0)}));
 const metrics=Object.fromEntries(Object.keys(values[0]).map(key=>[key,{median:rounded(median(values.map(v=>v[key]))),odd:rounded(median(values.filter((_,i)=>group[i].round%2).map(v=>v[key]))),even:rounded(median(values.filter((_,i)=>!(group[i].round%2)).map(v=>v[key])))}]));
 for(const m of Object.values(metrics))m.oddMinusEven=rounded(m.odd-m.even);
 groups.push({label,mode,scenario,metrics,samples:group.map(r=>({round:r.round,marks:r.marks,phases:r.phases}))});
}
const output={protocol:'54 samples, six alternating rounds, all samples retained',groups};
writeFileSync('harness/vf4a/attribution-summary.json',JSON.stringify(output,null,2)+'\n');
for(const g of groups)console.log(JSON.stringify({label:g.label,mode:g.mode,scenario:g.scenario,metrics:g.metrics}));
