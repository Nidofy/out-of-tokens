import {it,expect,vi} from 'vitest';
import {readdirSync,readFileSync,mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {chapterBannerArt,projectCoverArt,financeArt,ritualBackdropArt,stampSealCrestArt} from './src/generated-art.js';
import {emoteArt,giftArt,clientArt,teaBreakArt} from './src/living-art.js';

// Full-batch byte comparisons exceeded 5s before Batch 6 on this Windows host.
// This is an integrity test, not a performance gate; retain every byte assertion.
vi.setConfig({testTimeout:15000});

it('ships all nineteen Living assets, original masters and whitelist paths with verified provenance',()=>{
 const emotes=['coffee','idea','sweat','sleepy','rice','sparkle'];
 const gifts=['rice-bento','espresso-pods','fountain-pen','prism-sketchbook','vinyl-coaster','keycap-artisan'];
 const clients=['tea-lin','book-zhou','tech-yan','curator-su','oss-zhe','vc-lu'];
 const paths=[...emotes.map(emoteArt),...gifts.map(giftArt),...clients.map(clientArt),teaBreakArt];
 expect(paths).toEqual([...emotes.map(id=>`./art/living/emote-${id}.webp`),...gifts.map(id=>`./art/living/gift-${id}.webp`),...clients.map(id=>`./art/living/client-${id}.webp`),'./art/living/card-tea-break.webp']);
 for(const id of ['','../coffee','../../office/basic','constructor','__proto__','toString','coffee/../../x','%2e%2e','COFFEE']){
  expect(emoteArt(id)).toBe('./art/living/emote-sparkle.webp');expect(giftArt(id)).toBe('./art/living/gift-keycap-artisan.webp');expect(clientArt(id)).toBe('./art/living/client-book-zhou.webp');
 }
 type Entry={file:string;publicFile?:string;sha256:string;bytes:number;width:number;height:number;alphaRange:[number,number];model:string};
 const entries=JSON.parse(readFileSync(resolve('art/art-batch-6/manifest.json'),'utf8')) as Entry[];
 const runtime=entries.filter(e=>e.publicFile),masters=entries.filter(e=>e.file.startsWith('masters/'));
 expect(runtime).toHaveLength(19);expect(masters).toHaveLength(19);expect(new Set(entries.map(e=>e.file)).size).toBe(38);
 expect(runtime.map(e=>'./'+e.publicFile).sort()).toEqual([...paths].sort());
 expect(readdirSync(resolve('apps/web/public/art/living')).sort()).toEqual(paths.map(p=>p.split('/').at(-1)!).sort());
 const offline=JSON.parse(readFileSync(resolve('apps/web/dist/offline-assets.json'),'utf8')) as {assets:string[]};
 const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
 for(const e of entries){
  const bytes=readFileSync(resolve('art/art-batch-6',e.file));expect(bytes.length).toBe(e.bytes);expect(sha(bytes)).toBe(e.sha256);expect(e.model).toMatch(/unknown|not exposed/i);
  if(e.file.startsWith('masters/')){expect(bytes.subarray(1,4).toString()).toBe('PNG');expect([bytes.readUInt32BE(16),bytes.readUInt32BE(20)]).toEqual([e.width,e.height]);}
  if(!e.publicFile)continue;
  const banner=e.publicFile.endsWith('card-tea-break.webp'),client=e.publicFile.includes('/client-'),emote=e.publicFile.includes('/emote-');
  expect([e.width,e.height]).toEqual(banner?[640,360]:client?[256,256]:[128,128]);
  expect(e.bytes).toBeLessThan(banner?160000:client?60000:emote?30000:35000);
  if(!banner)expect(e.alphaRange).toEqual([0,255]);
  expect(offline.assets).toContain(e.publicFile);
  for(const folder of ['public','dist']){const copy=readFileSync(resolve('apps/web',folder,e.publicFile));expect(copy.length).toBe(e.bytes);expect(sha(copy)).toBe(e.sha256);}
  const master=masters.find(m=>m.file===e.file.replace('runtime/','masters/').replace('.webp','.png'));expect(master).toBeDefined();
 }
});

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

import {experienceArt,experienceArtPaths} from './src/experience-art.js';
it('verifies all eight Batch 7 assets, provenance, whitelist, dimensions and offline bytes',()=>{
 const entries=JSON.parse(readFileSync(resolve('art/art-batch-7/manifest.json'),'utf8')) as {id:string;file:string;publicFile?:string;sha256:string;bytes:number;width:number;height:number;model:string;promptFile:string;promptSha256:string}[];
 expect(entries).toHaveLength(16);const runtime=entries.filter(e=>e.publicFile);expect(runtime).toHaveLength(8);
 const expected=['outcome-tea-menu','outcome-cafe-sign','outcome-community-web','outcome-bookshop-system','outcome-bookshop-guide','outcome-workshop-display','vignette-rest-corner','vignette-first-delivery'].sort();
 expect(runtime.map(e=>e.id).sort()).toEqual(expected);expect(entries.filter(e=>!e.publicFile).map(e=>e.id).sort()).toEqual(expected);
 expect(new Set(entries.map(e=>e.file)).size).toBe(16);
 expect(readdirSync(resolve('apps/web/public/art/experience')).sort()).toEqual(expected.map(id=>id+'.webp').sort());
 const originalSamples={'outcome-tea-menu':'5fa39c0ba38150bb3507e2f52fecaa3bd6ca66096de4682cdce26999b620638c','vignette-rest-corner':'58d3213405597fdc41528c54dc8570aafa93424f5ce22c3b3cb9ec417cfafc96'};
 for(const [id,sha] of Object.entries(originalSamples))expect(runtime.find(e=>e.id===id)!.sha256).toBe(sha);
 const offline=JSON.parse(readFileSync(resolve('apps/web/dist/offline-assets.json'),'utf8')) as {assets:string[]};
 expect(runtime.map(e=>'./'+e.publicFile).sort()).toEqual(Object.values(experienceArtPaths).sort());
 for(const id of ['__proto__','constructor','../x','outcome-unknown'])expect(experienceArt(id)).toBeNull();
 let total=0;
 for(const e of entries){
  const prompt=readFileSync(resolve('art/art-batch-7',e.promptFile));expect(createHash('sha256').update(prompt).digest('hex')).toBe(e.promptSha256);
  const bytes=readFileSync(resolve('art/art-batch-7',e.file));expect(bytes.length).toBe(e.bytes);expect(createHash('sha256').update(bytes).digest('hex')).toBe(e.sha256);expect(e.model).toContain('unknown');
  if(!e.publicFile){expect([bytes.readUInt32BE(16),bytes.readUInt32BE(20)]).toEqual([e.width,e.height]);continue;}
  expect(bytes.subarray(0,4).toString()).toBe('RIFF');expect(bytes.subarray(12,16).toString()).toBe('VP8 ');
  expect([bytes.readUInt16LE(26)&0x3fff,bytes.readUInt16LE(28)&0x3fff]).toEqual([e.width,e.height]);
  const banner=e.file.includes('vignette-');expect([e.width,e.height]).toEqual(banner?[960,320]:[768,512]);expect(e.bytes).toBeLessThanOrEqual(banner?150000:100000);total+=e.bytes;
  expect(offline.assets).toContain(e.publicFile);
  for(const folder of ['public','dist'])expect(readFileSync(resolve('apps/web',folder,e.publicFile))).toEqual(bytes);
 }
 expect(total).toBeLessThanOrEqual(900000);
});

import {chibiCharacters, chibiFxIds, hasChibiRig, chibiRigPath, chibiFxArt} from './src/chibi-art.js';

it('limits Art-Batch 8 paths to the phase one character and eight shared stickers', () => {
 expect(chibiCharacters).toEqual(['bluewhale']);
 expect(chibiFxIds).toEqual(['emote-focus', 'emote-sweat', 'emote-crash', 'emote-zzz',
  'emote-excited', 'emote-daze', 'prop-code_bit', 'prop-coffee_cup']);
 expect(hasChibiRig('bluewhale')).toBe(true);
 expect(chibiRigPath('bluewhale')).toBe('./art/chibi/characters/bluewhale/rig.json');
 for (const id of chibiFxIds) expect(chibiFxArt(id)).toBe(`./art/chibi/fx/${id}.webp`);
 for (const id of ['', '../bluewhale', 'fx/../../x', '..\\bluewhale', '%2e%2e', '/emote-focus',
  'constructor', '__proto__', 'toString', 'Bluewhale', 'emote-focus?x']) {
  expect(hasChibiRig(id)).toBe(false);
  expect(chibiRigPath(id)).toBeNull();
  expect(chibiFxArt(id)).toBe('./art/chibi/fx/emote-excited.webp');
 }
});

it('checks Art-Batch 8 PNGs, decoded WebP geometry, rig, catalog and every offline copy', () => {
 const batch = 'art/art-batch-8';
 const characterDir = 'art/chibi/characters/bluewhale';
 const poseIds = ['stand_3q', 'walk_3q', 'work_front', 'rest_3q'];
 const ref = batch + '/masters/bluewhale/ref_sheet.png';
 const portrait = 'apps/web/public/art/ai-village/portraits/bluewhale.png';
 const paths = [characterDir + '/rig.json', 'art/chibi/fx/catalog.json'];
 const sha = (path: string) => createHash('sha256').update(readFileSync(resolve(path))).digest('hex');
 type Entry = {
  id: string; file: string; publicFile?: string; sha256: string; bytes: number;
  width: number; height: number; alphaBounds: number[]; alphaRange: number[];
  model: string; tool: string; parameters: {transparent_background: boolean}; prompt: string;
  references: {file: string; sha256: string}[]; masterSha256?: string;
  normalization?: {visibleHeight: number; feet: number[]; shoeCentroidX: number; warnings: string[]};
 };
 const entries: Entry[] = JSON.parse(readFileSync(join(batch, 'manifest.json'), 'utf8'));
 const masterIds = ['ref_sheet', ...poseIds, ...chibiFxIds];
 const masters = entries.filter(e => !e.publicFile);
 const runtime = entries.filter(e => e.publicFile);
 expect(masters.map(e => e.id).sort()).toEqual([...masterIds].sort());
 expect(runtime.map(e => e.id).sort()).toEqual(masterIds.slice(1).sort());
 // Decode the alpha plane independently of the exporter and metadata, including for untouched PNGs.
 const inspect = spawnSync('python', ['-c', [
  'import json, math, sys',
  'from PIL import Image',
  'result = []',
  'for path in sys.argv[1:]:',
  '    with Image.open(path) as image:',
  '        alpha = image.getchannel("A")',
  '        l,t,r,b = alpha.getbbox()',
  '        band = alpha.crop((l, b-math.ceil((b-t)*0.15), r, b))',
  '        columns = [x+l for y in range(band.height) for x in range(band.width) if band.getpixel((x,y))] if image.width == 512 else []',
  '        result.append([image.format, *image.size, alpha.getextrema(), [l,t,r,b], sum(columns)/len(columns) if columns else None])',
  'print(json.dumps(result))',
 ].join('\n'), ...entries.map(e => resolve(batch, e.file))], {encoding: 'utf8'});
 expect(inspect.status, inspect.error?.message ?? inspect.stderr).toBe(0);
 type Pixels = [string, number, number, number[], number[], number | null];
 const pixels: Pixels[] = JSON.parse(inspect.stdout);
 const rig = JSON.parse(readFileSync(resolve('apps/web/public', paths[0]!), 'utf8'));
 expect(rig).toMatchObject({schemaVersion: 2, renderer: 'maple-chibi', id: 'bluewhale', canvas: [512,512],
  feet: [256,480], visibleHeight: 400, facingDefault: 'right', heightScale: 1, optionalPoses: {back_3q: null,
   react_front: null}, faceOverrides: null, motionProfile: {walkSpeed: 1, hopHeight: 10, stepCadenceHz: 3.2,
   squashAmount: 0.06, breathAmp: 0.025}});
 expect(Object.keys(rig.poses).sort()).toEqual([...poseIds].sort());
 expect(rig.anchors).toEqual(rig.poses.stand_3q.anchors);
 const catalog = JSON.parse(readFileSync(resolve('apps/web/public', paths[1]!), 'utf8')) as
  {id: string; file: string; bytes: number; sha256: string; anchor: string; animationPreset: string; scale: number}[];
 expect(catalog.map(item => item.id).sort()).toEqual([...chibiFxIds].sort());
 for (const [index, e] of entries.entries()) {
  const pose = poseIds.includes(e.id);
  const character = e.id === 'ref_sheet' || pose;
  const masterFile = `masters/${character ? 'bluewhale' : 'fx'}/${e.id}.png`;
  const relative = `${pose ? 'characters/bluewhale' : 'fx'}/${e.id}.webp`;
  expect(e.file).toBe(e.publicFile ? 'runtime/' + relative : masterFile);
  const local = resolve(batch, e.file);
  expect(sha(local)).toBe(e.sha256);
  expect(readFileSync(local).length).toBe(e.bytes);
  expect(e.tool).toBe('built-in image_gen');
  expect(e.model).toBe('unknown; not exposed');
  expect(e.parameters.transparent_background).toBe(true);
  expect(e.prompt.length).toBeGreaterThan(100);
  const references = e.id === 'ref_sheet' ? [portrait, 'apps/web/public/art/stage-b/bluewhale.r1.webp']
   : e.id === 'walk_3q' ? [ref, batch + '/masters/bluewhale/stand_3q.png'] : pose ? [ref, portrait] : [];
  expect(e.references).toEqual(references.map(file => ({file, sha256: sha(file)})));
  const [format, width, height, range, bounds, centroid] = pixels[index]!;
  expect([format, width, height, range, bounds]).toEqual([
   e.publicFile ? 'WEBP' : 'PNG', e.width, e.height, e.alphaRange, e.alphaBounds]);
  expect(range).toEqual([0,255]);
  expect(width).toBe(height);
  if (!e.publicFile) continue;
  expect(e.masterSha256).toBe(sha(join(batch, masterFile)));
  expect(e.publicFile).toBe('art/chibi/' + relative);
  paths.push(e.publicFile);
  expect(sha(resolve('apps/web/public', e.publicFile))).toBe(e.sha256);
  expect(width).toBe(pose ? 512 : 128);
  expect(e.bytes).toBeLessThan(pose ? 90000 : 25000);
  const [left, top, right, bottom] = bounds as [number, number, number, number];
  if (pose) {
   const actualHeight = bottom - top;
   expect(left).toBeGreaterThanOrEqual(12);
   expect(right - 1).toBeLessThanOrEqual(500);
   expect(bottom - 1).toBe(480);
   expect(actualHeight).toBe(e.id === 'work_front' ? 348 : 400);
   expect(centroid).not.toBeNull();
   expect(Math.abs(centroid! - 256)).toBeLessThanOrEqual(0.5);
   expect(e.normalization!.shoeCentroidX).toBeCloseTo(centroid!, 4);
   expect(e.normalization).toMatchObject({visibleHeight: actualHeight, feet: [256,480], warnings: []});
   const config = rig.poses[e.id];
   expect(config).toMatchObject({file: e.id + '.webp', feet: [256,480], visibleHeight: actualHeight,
    mirrorable: e.id !== 'work_front', warnings: []});
   if (e.id === 'work_front') expect(config.seatedOffsetY).toBe(-42);
   expect(config.anchors.deskClipY).toBe(370);
   expect(config.anchors.headTop[1]).toBe(top);
   for (const name of ['headTop', 'faceCenter', 'emoteLeft', 'emoteRight', 'propHand']) {
    const point = config.anchors[name];
    expect(point).toHaveLength(2);
    expect(point.every((v: number) => Number.isInteger(v) && v >= 0 && v < 512)).toBe(true);
   }
  } else {
   expect(Math.min(left, top, 128-right, 128-bottom)).toBeGreaterThanOrEqual(16);
   const item = catalog.find(item => item.id === e.id)!;
   expect(item).toMatchObject({file: e.id + '.webp', bytes: e.bytes, sha256: e.sha256});
   expect(['headTop', 'emoteLeft', 'emoteRight', 'propHand']).toContain(item.anchor);
   expect(['pulse', 'drop', 'shake', 'float', 'pop', 'rise']).toContain(item.animationPreset);
   expect(item.scale).toBeGreaterThan(0);
  }
 }
 const offline = JSON.parse(readFileSync(resolve('apps/web/dist/offline-assets.json'), 'utf8')) as {assets: string[]};
 expect(offline.assets.filter(p => p.startsWith('art/chibi/')).sort()).toEqual([...paths].sort());
 for (const path of paths) expect(sha(join('apps/web/dist', path))).toBe(sha(join('apps/web/public', path)));
});
