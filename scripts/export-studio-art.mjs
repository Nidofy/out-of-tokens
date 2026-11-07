import {createRequire} from 'node:module';
import {mkdir,copyFile,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
// Offline production export only: preserve masters, encode WebP, split atlas cells.
// Supply an already installed sharp path; this script never installs dependencies.
const require=createRequire(import.meta.url),sharp=require(process.argv[2]);
const input=process.argv[3],out='apps/web/public/art',masters='art/studio-v1/masters';
await mkdir(out,{recursive:true});await mkdir(masters,{recursive:true});await mkdir(join(out,'actors'),{recursive:true});
const files={garage:'8e5f5763-935c-4ec6-a1ce-e9218ad23f29',canteen:'b681ee0d-de52-49ac-b859-1405b0ec66cf',library:'2be4c9bf-b80b-48a1-afd6-078bb64700a1',incubator:'3e17e2db-d3d6-42cc-ab6a-fa694e14151f',office:'73534e47-1d36-4cd4-ba37-482b5e317c19',campus:'fde356c4-3eb9-49a7-9d47-5fb0ed5d466f',lab:'51d34841-ac85-4047-a17d-8dcd3ebac9f1',actors:'d3982a92-777d-4b36-b24e-d1c40c9a620a',stories:'e6d60106-1c97-4a50-b29e-21445605205c'};
const manifest=[];
for(const [name,id] of Object.entries(files)){
 const source=join(input,`exec-${id}.png`),master=join(masters,name+'.png');await copyFile(source,master);
 if(name==='stories'){const meta=await sharp(source).metadata(),ids=['slime','castle','paper','independent','acquired','open-source','warm-shop','paperclip']; for(let i=0;i<8;i++){const left=Math.round(i%4*meta.width/4),top=Math.round(Math.floor(i/4)*meta.height/2),width=Math.round((i%4+1)*meta.width/4)-left,height=Math.round((Math.floor(i/4)+1)*meta.height/2)-top;await sharp(source).extract({left,top,width,height}).webp({quality:88}).toFile(join(out,ids[i]+'.webp'));}}
 else if(name!=='actors'){await sharp(source).webp({quality:86}).toFile(join(out,name+'.webp'));}
 else{const meta=await sharp(source).metadata(),ids=['bluewhale','qwen','llama','mistral','gpt','claude','kimi','gemini','grok','glm','minimax','seedance'];
  for(let i=0;i<12;i++){const left=Math.round(i%4*meta.width/4),top=Math.round(Math.floor(i/4)*meta.height/3),width=Math.round((i%4+1)*meta.width/4)-left,height=Math.round((Math.floor(i/4)+1)*meta.height/3)-top;await sharp(source).extract({left,top,width,height}).resize({height:256}).webp({quality:90,alphaQuality:100}).toFile(join(out,'actors',ids[i]+'.webp'));}
 }
 manifest.push({name,master,sourceId:id,sourceSha256:createHash('sha256').update(await readFile(master)).digest('hex'),origin:'OpenAI built-in imagegen; original generated art, 2026-11-07',processing:name==='stories'?'Equal 4x2 grid extraction; WebP quality88':name==='actors'?'Equal grid extraction and height256 WebP export; alpha preserved':'WebP encoding only; original dimensions preserved'});
}
await writeFile('art/studio-v1/manifest.json',JSON.stringify(manifest,null,2));
