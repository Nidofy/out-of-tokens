// Deterministic SVG assembly of licensed paper-doll parts, preserving the originals.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..'),out=resolve(root,'apps/web/public/art/stage-b');
const versions={bluewhale:'r1',qwen:'qwq',llama:'3.1',mistral:'large',gpt:'4o',claude:'sonnet',kimi:'k2',gemini:'pro'};
const hash=b=>createHash('sha256').update(b).digest('hex'),manifest=[];
mkdirSync(out,{recursive:true});
for(const [id,version] of Object.entries(versions)){
 const base=resolve(root,'apps/web/public/art/ai-village',id),raw=readFileSync(resolve(base,'character.json')),c=JSON.parse(raw),sources=[{file:`${id}/character.json`,sha256:hash(raw)}];
 const angles={'arm-left':-12,'arm-right':12,head:-2};
 const paint=(p,parent)=>{
  const file=p.expressions?.happy??p.file;let image='';
  if(file){const bytes=readFileSync(resolve(base,file));sources.push({file:`${id}/${file}`,sha256:hash(bytes)});image=`<image x="${p.offset[0]-p.pivot[0]}" y="${p.offset[1]-p.pivot[1]}" width="${p.size[0]}" height="${p.size[1]}" href="data:image/png;base64,${bytes.toString('base64')}"/>`;}
  return `<g transform="translate(${p.pivot[0]-(parent?.pivot[0]??0)} ${p.pivot[1]-(parent?.pivot[1]??0)}) rotate(${angles[p.id]??0})">${image}${c.parts.filter(x=>x.parent===p.id).sort((a,b)=>a.z-b.z).map(x=>paint(x,p)).join('')}</g>`;
 };
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-96 -96 1216 1216" width="608" height="608"><title>${id}.${version}</title>${c.parts.filter(p=>p.parent===null).map(p=>paint(p,null)).join('')}</svg>\n`;
 const file=`${id}.${version}.svg`;writeFileSync(resolve(out,file),svg);
 manifest.push({version:`${id}.${version}`,file,sha256:hash(svg),bytes:Buffer.byteLength(svg),sourceCommit:'f4c2ac633d5ad5e9ee0f7c2cd66bd1af9fc90352',sources,pose:{expression:'happy',angles},license:'MIT; see LICENSE.txt; no additional trademark or character-rights claim'});
}
writeFileSync(resolve(out,'LICENSE.txt'),readFileSync(resolve(root,'apps/web/public/art/ai-village/LICENSE.txt')));
writeFileSync(resolve(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify(manifest.map(({version,bytes,sha256})=>({version,bytes,sha256})),null,2));
