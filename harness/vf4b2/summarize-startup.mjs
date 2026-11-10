import {readFileSync,writeFileSync,existsSync} from 'node:fs';
const dir='harness/vf4b2/',read=f=>JSON.parse(readFileSync(dir+f,'utf8'));
const median=xs=>{const s=[...xs].sort((a,b)=>a-b);return (s[2]+s[3])/2;};
const summarize=rows=>['dev','preview'].flatMap(mode=>['standard','twelve'].map(scenario=>{
 const groups=Object.fromEntries(['040031e','c68541d','current'].map(label=>{const values=rows.filter(r=>r.mode===mode&&r.scenario===scenario&&r.label===label).map(r=>r.observedControlsAndCanvasMs);if(values.length!==6)throw Error('Expected n=6');return[label,{n:values.length,medianMs:median(values),values}];}));
 const change=baseline=>100*(groups.current.medianMs/groups[baseline].medianMs-1);
 return {mode,scenario,groups,changeVs040Percent:change('040031e'),changeVsVf31Percent:change('c68541d')};
}));
const primary=summarize(read('startup-balanced.json')),confirmationRequired=primary.some(r=>r.changeVsVf31Percent>10),confirmation=existsSync(dir+'startup-confirmation.json')?summarize(read('startup-confirmation.json')):undefined;
const summary={metric:'observedControlsAndCanvasMs; not complete assetsReady',primary,confirmationRequired,...(confirmation?{confirmation}:{})};
writeFileSync(dir+'startup-summary.json',JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary,null,2));
