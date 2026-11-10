// Derive B2 diagnostics without changing the sealed B1 evidence.
import {readFileSync,writeFileSync} from 'node:fs';
const out='harness/vf4b2/';
writeFileSync(out+'server.mjs',readFileSync('harness/vf4b1/server.mjs','utf8').replaceAll('vf4b1','vf4b2').replaceAll('b1','b2').replaceAll('B1','B2'));
let code=readFileSync('harness/vf4b1/render-audit.js','utf8').replaceAll('b1','b2').replaceAll('B1','B2');
code=code.replace("seated:w.zone==='work',role:","seated:w.zone==='work'||w.zone==='meeting',zone:w.zone,seat:reservation?.seat??null,job:reservation?.job??null,role:");
code=code.replace("[...objects.values()].filter(o=>o.front.zIndex>w.root.zIndex).flatMap(o=>o.front.children).filter(n=>n.texture)","[...objects.values()].flatMap(o=>[o.back,o.front]).filter(o=>o.zIndex>w.root.zIndex).flatMap(o=>o.children).filter(n=>n.texture)");
code=code.replace("furniture.filter(o=>['basic','standard'].includes(o.kind))","furniture.filter(o=>['whiteboard','coffee'].includes(o.kind))");
code=code.replace("probes:[['desk',-65,-70],['monitor',80,-108],['transparent-top',0,-190],['transparent-corner',118,12],['chair-gap',0,-145]]","probes:(o.kind==='whiteboard'?[['solid',0,-120],['leg',-94,0],['transparent-corner',-111,-175],['gap',0,-30],['shadow',0,18]]:[['solid',-65,-65],['machine',-20,-140],['transparent-corner',70,-145],['gap',0,-180],['shadow',0,22]])");
code=code.replace('const data={at:','const data={jobs:view.jobs.map(j=>({id:j.id,title:j.title,titleEn:j.titleEn})),at:');
code=code.replace('view.office?.revision,','view.office?.revision,view.office?.items.map(i=>[i.id,i.slot]),');
code=code.replace('output.textContent=JSON.stringify(data);',"output.dataset.anchors=furniture.map(f=>f.id+':'+f.anchor.x+','+f.anchor.y).join('|');output.textContent=JSON.stringify(data);");
writeFileSync(out+'render-audit.js',code);
