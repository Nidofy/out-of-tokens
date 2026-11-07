import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {join,resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const source=resolve(process.argv[2]),dest='apps/web/public/art/ai-village',audit='art/ai-village-chibi-v1';
const sha=execFileSync('git',['-c',`safe.directory=${source.replaceAll('\\','/')}`,'-C',source,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
const base=join(source,'packages/ai-village'),ids=['bluewhale','qwen','llama','mistral','gpt','claude','kimi','gemini','grok','glm','minimax','seedance'];
const hash=b=>createHash('sha256').update(b).digest('hex'),inventory=[];
async function copy(from,to,expected){const bytes=await readFile(from),sha256=hash(bytes);if(expected&&sha256!==expected)throw Error('SOURCE_HASH_MISMATCH:'+from);await mkdir(resolve(to,'..'),{recursive:true});await copyFile(from,to);inventory.push({source:relative(source,from).replaceAll('\\','/'),file:to.replaceAll('\\','/'),bytes:bytes.length,sha256});}
const portraits=JSON.parse(await readFile(join(base,'assets/portraits/manifest.json'),'utf8'));
for(const id of ids){const dir=join(base,'assets/characters',id),c=JSON.parse(await readFile(join(dir,'character.json'),'utf8')),m=JSON.parse(await readFile(join(dir,'manifest.json'),'utf8'));if(!m.approvedForRelease)throw Error('SOURCE_NOT_PRODUCTION:'+id);
 await copy(join(dir,'character.json'),join(dest,id,'character.json'));await copy(join(dir,'manifest.json'),join(audit,'source-manifests',id+'.json'));
 const files=new Set(c.parts.flatMap(p=>[p.file,...Object.values(p.expressions??{})].filter(Boolean)));
 for(const file of files){const entry=m.parts.find(p=>p.file===file);if(!entry?.sha256)throw Error('MISSING_SOURCE_HASH:'+id+'/'+file);await copy(join(dir,file),join(dest,id,file),entry.sha256);}
 await copy(join(base,'assets/portraits',id+'.png'),join(dest,'portraits',id+'.png'),portraits.files.find(x=>x.file===`portraits/${id}.png`).sha256);
}
await copy(join(base,'LICENSE'),join(dest,'LICENSE.txt'));await copy(join(base,'assets/portraits/manifest.json'),join(audit,'source-portraits-manifest.json'));
await mkdir(audit,{recursive:true});await writeFile(join(audit,'manifest.json'),JSON.stringify({sourceCommit:sha,sourceRepository:'adjacent dsh_plugin',authorization:'User explicitly requested direct reuse of AI Village characters, Q-style first',mode:'Original production PNG parts, rigs and portraits copied verbatim; no generation or pixel editing',files:inventory},null,2));console.log(JSON.stringify({sourceCommit:sha,characters:ids.length,files:inventory.length,bytes:inventory.reduce((n,x)=>n+x.bytes,0),hashes:'all copied part and portrait hashes match source manifests'},null,2));
