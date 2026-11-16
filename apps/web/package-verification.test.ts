import {it,expect} from 'vitest';
import {readdirSync,readFileSync,mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {chapterBannerArt,projectCoverArt,financeArt,ritualBackdropArt,stampSealCrestArt} from './src/generated-art.js';

it('maps chapter, project, finance and ritual art to shipped offline assets',()=>{
 const offline=JSON.parse(readFileSync(resolve('apps/web/dist/offline-assets.json'),'utf8')) as {assets:string[]};
 const covers=['garage','incubator','release-night','crisis-429','last-token'];
 const paths=[ritualBackdropArt,stampSealCrestArt];
 for(const [chapter,name] of covers.entries()){
  const path=`./art/cards/project-${name}.webp`;
  expect(chapterBannerArt(chapter)).toBe(path);expect(projectCoverArt('unknown',chapter)).toBe(path);
  expect(projectCoverArt('incubator',chapter)).toBe('./art/cards/project-incubator.webp');paths.push(path);
 }
 for(const chapter of [-1,5,NaN,Infinity])expect(chapterBannerArt(chapter)).toBe('./art/cards/project-last-token.webp');
 expect(projectCoverArt('unknown')).toBe('./art/cards/project-incubator.webp');
 for(const kind of ['quota-pack','plan-basic','plan-pro','ledger-loan'] as const){const path=financeArt(kind);expect(path).toBe(`./art/upgrades/finance-${kind}.webp`);paths.push(path);}
 expect(ritualBackdropArt).toBe('./art/cards/ritual-stage-backdrop.webp');expect(stampSealCrestArt).toBe('./art/cards/stamp-seal-crest.webp');
 for(const path of paths){expect(offline.assets).toContain(path.slice(2));expect(readFileSync(resolve('apps/web/dist',path))).toEqual(readFileSync(resolve('apps/web/public',path)));}
});

it('rejects a hash-valid package declaring desktop without its executable and stale web build metadata',()=>{
 const root=mkdtempSync(join(tmpdir(),'oot-package-test-')),sha='1'.repeat(40),files:Record<string,string>={};
 const put=(file:string,text:string)=>{const path=join(root,file);mkdirSync(dirname(path),{recursive:true});writeFileSync(path,text);files[file]=createHash('sha256').update(text).digest('hex');};
 const metadata={sourceCommit:sha,engineVersion:'0.11.0',contentVersion:'m5-1'};
 try{
  for(const file of ['start.mjs','start.cmd','web/index.html','dsh/dist/index.js','dsh/dist/client.js','dsh/dist/content.json','dsh/cordis.patch.yml'])put(file,'fixture');
  for(const file of ['web/build-meta.json','dsh/dist/build-meta.json'])put(file,JSON.stringify(metadata));
  const manifest=()=>writeFileSync(join(root,'manifest.json'),JSON.stringify({schemaVersion:1,...metadata,desktopIncluded:true,files}));
  const verify=()=>spawnSync(process.execPath,[resolve('scripts/verify-playtest.mjs'),root],{encoding:'utf8'});
  manifest();let result=verify();expect(result.status).not.toBe(0);expect(result.stderr).toContain('MISSING:desktop/out-of-tokens.exe');
  put('web/build-meta.json',JSON.stringify({...metadata,sourceCommit:'2'.repeat(40)}));manifest();result=verify();expect(result.status).not.toBe(0);expect(result.stderr).toContain('BUILD_SOURCE_MISMATCH');
 }finally{rmSync(root,{recursive:true,force:true});}
});

it('includes generated PWA icons and Stage B portraits in the offline bundle',()=>{
 const publicRoot=resolve('apps/web/public'),dist=resolve('apps/web/dist');
 const offline=JSON.parse(readFileSync(join(dist,'offline-assets.json'),'utf8')) as {assets:string[]};
 const manifest=JSON.parse(readFileSync(join(publicRoot,'manifest.webmanifest'),'utf8')) as {icons:{src:string}[]};
 for(const icon of manifest.icons){const path=icon.src.replace('./','');expect(offline.assets).toContain(path);expect(readFileSync(join(dist,path))).toEqual(readFileSync(join(publicRoot,path)));}
 const portraits=JSON.parse(readFileSync(join(publicRoot,'art/stage-b/manifest.json'),'utf8')) as {file:string;sha256:string;bytes:number}[];
 for(const entry of portraits){const path='art/stage-b/'+entry.file;expect(offline.assets).toContain(path);expect(createHash('sha256').update(readFileSync(join(dist,path))).digest('hex')).toBe(entry.sha256);expect(entry.bytes).toBeLessThan(200000);}
});

it('verifies each generated runtime asset and its offline copy against provenance',()=>{
 for(const dir of readdirSync(resolve('art')).filter(name=>/^art-batch-[2345]$/.test(name))){
  const manifest=JSON.parse(readFileSync(resolve('art',dir,'manifest.json'),'utf8')) as {file:string;publicFile?:string;sha256:string;bytes:number}[];
  const offline=JSON.parse(readFileSync(resolve('apps/web/dist/offline-assets.json'),'utf8')) as {assets:string[]};
  for(const entry of manifest.filter(e=>e.publicFile)){
   expect(offline.assets).toContain(entry.publicFile);
   for(const folder of ['public','dist']){const bytes=readFileSync(resolve('apps/web',folder,entry.publicFile!));expect(bytes.length).toBe(entry.bytes);expect(createHash('sha256').update(bytes).digest('hex')).toBe(entry.sha256);}
   const limit=dir!=='art-batch-5'?400000:entry.publicFile!.startsWith('art/stage-b/')?200000:entry.publicFile!.startsWith('art/upgrades/')?40000:entry.publicFile!.endsWith('stamp-seal-crest.webp')?50000:180000;
   expect(entry.bytes).toBeLessThan(limit);
   expect(readFileSync(resolve('art',dir,entry.file))).toEqual(readFileSync(resolve('apps/web/public',entry.publicFile!)));
  }
 }
});
