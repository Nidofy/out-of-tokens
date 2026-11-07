import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root='apps/web/public/art/ai-village',rows=[];
for(const e of readdirSync(root,{withFileTypes:true}).filter(e=>e.isDirectory()&&e.name!=='portraits')){
 const character=JSON.parse(readFileSync(`${root}/${e.name}/character.json`));const files=[...new Set(character.parts.flatMap(p=>[p.file,...Object.values(p.expressions??{})].filter(Boolean)))];let rgba=0,bytes=0;
 for(const f of files){const b=readFileSync(`${root}/${e.name}/${f}`);rgba+=b.readUInt32BE(16)*b.readUInt32BE(20)*4;bytes+=b.length;}
 rows.push({id:e.name,files:files.length,bytes,rgba});
}
const result={kind:'static-budget-not-GPU-measurement',rows,totalRGBA:rows.reduce((n,r)=>n+r.rgba,0),totalBytes:rows.reduce((n,r)=>n+r.bytes,0),sourceManifestHash:createHash('sha256').update(readFileSync('art/ai-village-chibi-v1/manifest.json')).digest('hex')};
writeFileSync('harness/a5-art-budget.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
