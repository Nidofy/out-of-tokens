import {it,expect,vi} from 'vitest';
import {readdirSync,readFileSync,mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {chapterBannerArt,projectCoverArt,financeArt,ritualBackdropArt,stampSealCrestArt} from './src/generated-art.js';
import {emoteArt,giftArt,clientArt,teaBreakArt} from './src/living-art.js';
import {decorPropArt, decorPropIds, furnitureKinds, furnitureLayerArt, furniturePreviewArt} from './src/furniture-art.js';
import {avatarPortraitArt, basePortraitArt, flagshipPortraitArt, portraitCharacters} from './src/portraits-art.js';

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

const batch8Fx = ['emote-focus', 'emote-sweat', 'emote-crash', 'emote-zzz',
 'emote-excited', 'emote-daze', 'prop-code_bit', 'prop-coffee_cup'];
const batch9Fx = ['emote-slack', 'emote-anger', 'emote-dizzy', 'emote-heart', 'emote-alert',
 'emote-spark', 'prop-doc_page', 'prop-smoke_puff', 'prop-dust_step', 'prop-heal_leaf'];

const batch10ACharacters = ['qwen', 'llama', 'mistral', 'gpt', 'claude'] as const;
const batch10BCharacters = ['kimi', 'gemini', 'grok', 'glm', 'minimax', 'seedance'] as const;
const chibiPoses = ['stand_3q', 'walk_3q', 'work_front', 'rest_3q', 'back_3q'] as const;

type Pixels = [string, number, number, number[], number[], number | null, number, number];

function inspectChibiPixels(paths: string[]): Pixels[] {
 const inspect = spawnSync('python', ['-c', [
  'import json, math, sys',
  'from PIL import Image, ImageChops',
  'result = []',
  'for path in sys.argv[1:]:',
  '    with Image.open(path) as image:',
  '        alpha = image.getchannel("A")',
  '        l,t,r,b = alpha.getbbox()',
  '        band = alpha.crop((l, b-math.ceil((b-t)*0.15), r, b))',
  '        columns = [x+l for y in range(band.height) for x in range(band.width) if band.getpixel((x,y))] if image.width == 512 else []',
  '        head = alpha.crop((l,t,r,t+math.ceil((b-t)*0.45))).getbbox()',
  '        red,green,blue = image.convert("RGB").split()',
  '        ink = ImageChops.lighter(red, ImageChops.lighter(green,blue)).point(lambda c: 255 if c==0 else 0)',
  '        cutoff = 1 if image.format == "WEBP" else 14',
  '        black = ImageChops.multiply(ink, alpha.point(lambda a: 255 if a>=cutoff else 0)).histogram()[255]',
  '        result.append([image.format, *image.size, alpha.getextrema(), [l,t,r,b], sum(columns)/len(columns) if columns else None, head[2]-head[0], black])',
  'print(json.dumps(result))',
 ].join('\n'), ...paths], {encoding: 'utf8'});
 expect(inspect.status, inspect.error?.message ?? inspect.stderr).toBe(0);
 return JSON.parse(inspect.stdout);
}

it('limits chibi paths to all twelve studio partners and eighteen shipped stickers', () => {
 expect(chibiCharacters).toEqual(['bluewhale', ...batch10ACharacters, ...batch10BCharacters]);
 expect(chibiFxIds).toEqual([...batch8Fx, ...batch9Fx]);
 for (const id of chibiCharacters) {
  expect(hasChibiRig(id)).toBe(true);
  expect(chibiRigPath(id)).toBe(`./art/chibi/characters/${id}/rig.json`);
 }
 for (const id of chibiFxIds) expect(chibiFxArt(id)).toBe(`./art/chibi/fx/${id}.webp`);
 for (const id of ['', '../bluewhale', 'fx/../../x', '..\\bluewhale', '%2e%2e', '/emote-focus',
  'constructor', '__proto__', 'toString', 'Bluewhale', 'emote-focus?x']) {
  expect(hasChibiRig(id)).toBe(false);
  expect(chibiRigPath(id)).toBeNull();
  expect(chibiFxArt(id)).toBe('./art/chibi/fx/emote-excited.webp');
 }
});

it.each([8, 9])('checks Art-Batch %i PNGs, decoded WebP geometry, rig, catalog and offline copies', batchNo => {
 const batch = 'art/art-batch-' + batchNo;
 const characterDir = 'art/chibi/characters/bluewhale';
 const poseIds = ['stand_3q', 'walk_3q', 'work_front', 'rest_3q'];
 const ref = 'art/art-batch-8/masters/bluewhale/ref_sheet.png';
 const portrait = 'apps/web/public/art/ai-village/portraits/bluewhale.png';
 const paths = [characterDir + '/rig.json', 'art/chibi/fx/catalog.json'];
 const sha = (path: string) => createHash('sha256').update(readFileSync(resolve(path))).digest('hex');
 type Entry = {
  id: string; file: string; publicFile?: string; sha256: string; bytes: number;
  width: number; height: number; alphaBounds: number[]; alphaRange: number[];
  model: string; tool: string; parameters: {transparent_background: boolean}; prompt: string;
  references: {file: string; sha256: string}[]; masterSha256?: string;
  visiblePureBlackPixels?: number;
  normalization?: {visibleHeight: number; feet: number[]; shoeCentroidX: number; warnings: string[];
   standHeadWidth?: number; backHeadWidth?: number; headWidthRatio?: number};
 };
 const entries: Entry[] = JSON.parse(readFileSync(join(batch, 'manifest.json'), 'utf8'));
 const runtimeIds = batchNo === 8 ? [...poseIds, ...batch8Fx] : ['back_3q', ...batch9Fx];
 const masterIds = batchNo === 8 ? ['ref_sheet', ...runtimeIds] : runtimeIds;
 const masters = entries.filter(e => !e.publicFile);
 const runtime = entries.filter(e => e.publicFile);
 expect(masters.map(e => e.id).sort()).toEqual([...masterIds].sort());
 expect(runtime.map(e => e.id).sort()).toEqual([...runtimeIds].sort());
 const pixels = inspectChibiPixels([...entries.map(e => resolve(batch, e.file)),
  resolve('apps/web/public', characterDir, 'stand_3q.webp')]);
 const rig = JSON.parse(readFileSync(resolve('apps/web/public', paths[0]!), 'utf8'));
 expect(rig).toMatchObject({schemaVersion: 2, renderer: 'maple-chibi', id: 'bluewhale', canvas: [512,512],
  feet: [256,480], visibleHeight: 400, facingDefault: 'right', heightScale: 1, optionalPoses: {back_3q: {file: 'back_3q.webp'},
   react_front: null}, faceOverrides: null, motionProfile: {walkSpeed: 1, hopHeight: 10, stepCadenceHz: 3.2,
   squashAmount: 0.06, breathAmp: 0.025}});
 expect(Object.keys(rig.poses).sort()).toEqual([...poseIds].sort());
 expect(rig.anchors).toEqual(rig.poses.stand_3q.anchors);
 const catalog = JSON.parse(readFileSync(resolve('apps/web/public', paths[1]!), 'utf8')) as
  {id: string; file: string; bytes: number; sha256: string; anchor: string; animationPreset: string; scale: number}[];
 expect(catalog.map(item => item.id)).toEqual(chibiFxIds);
 // Preserve every historical field and catalog position at the Phase 1 baseline.
 const jsonHash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
 expect(jsonHash({...rig, optionalPoses: {...rig.optionalPoses, back_3q: null}}))
  .toBe('ba25d939bf71b681cfea4ccbd0b40fd0df22058193625fa1c82aaa9b7aaa19e7');
 expect(jsonHash(catalog.slice(0, 8))).toBe('9dbe42f1255777b708f23afdfb946294e0685b954a0b0c427e153a792426d37a');
 for (const [index, e] of entries.entries()) {
  const pose = poseIds.includes(e.id) || e.id === 'back_3q';
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
  let references: string[] = [];
  if (e.id === 'ref_sheet') references = [portrait, 'apps/web/public/art/stage-b/bluewhale.r1.webp'];
  else if (e.id === 'walk_3q' || e.id === 'back_3q') references = [ref, 'art/art-batch-8/masters/bluewhale/stand_3q.png'];
  else if (pose) references = [ref, portrait];
  else if (batchNo === 9) references = ['emote-focus', 'emote-sweat', 'prop-coffee_cup']
   .map(id => 'art/art-batch-8/masters/fx/' + id + '.png');
  expect(e.references).toEqual(references.map(file => ({file, sha256: sha(file)})));
  const [format, width, height, range, bounds, centroid, headWidth, black] = pixels[index]!;
  expect([format, width, height, range, bounds]).toEqual([
   e.publicFile ? 'WEBP' : 'PNG', e.width, e.height, e.alphaRange, e.alphaBounds]);
  expect(range).toEqual([0,255]);
  expect(width).toBe(height);
  if (batchNo === 9) expect(black).toBe(0);
  if (!e.publicFile) continue;
  if (batchNo === 9) expect(e.visiblePureBlackPixels).toBe(black);
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
   const config = e.id === 'back_3q' ? rig.optionalPoses.back_3q : rig.poses[e.id];
   if (e.id === 'back_3q') {
    const standWidth = pixels.at(-1)![6];
    expect(e.normalization).toMatchObject({standHeadWidth: standWidth, backHeadWidth: headWidth,
     headWidthRatio: headWidth / standWidth});
   }
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
 const allChibiPaths = ['art/chibi/fx/catalog.json',
  ...chibiCharacters.flatMap(id => ['rig.json', ...chibiPoses.map(p => p + '.webp')]
   .map(name => `art/chibi/characters/${id}/${name}`)),
  ...chibiFxIds.map(id => chibiFxArt(id).slice(2))];
 expect(offline.assets.filter(p => p.startsWith('art/chibi/')).sort()).toEqual(allChibiPaths.sort());
 for (const path of paths) expect(sha(join('apps/web/dist', path))).toBe(sha(join('apps/web/public', path)));
});

type Batch10Entry = {
 characterId: string; id: string; file: string; publicFile?: string; sha256: string; bytes: number;
 width: number; height: number; alphaRange: number[]; alphaBounds: number[]; model: string; tool: string;
 sourceSha256?: string; masterSha256?: string; blackPixelsAtAlpha14OrAbove?: number; visiblePureBlackPixels?: number;
 references?: {file: string; sha256: string}[]; parameters: {transparent_background: boolean};
 normalization?: {visibleHeight: number; poseScale: number; headWidthRatio: number; shoeCentroidX: number};
};
const batch10Profiles = {
 qwen: [1, 9, 3.1, 0.055, 0.024], llama: [0.96, 9, 2.9, 0.05, 0.024],
 mistral: [1.08, 11, 3.5, 0.065, 0.026], gpt: [1, 9, 3, 0.05, 0.023], claude: [0.98, 8.5, 2.95, 0.05, 0.022],
 kimi: [0.98, 9, 3, 0.05, 0.023], gemini: [1.04, 10, 3.25, 0.058, 0.025],
 grok: [1.06, 10.5, 3.35, 0.06, 0.026], glm: [0.94, 8, 2.8, 0.045, 0.021],
 minimax: [1.02, 9.5, 3.15, 0.055, 0.025], seedance: [1.05, 10, 3.3, 0.058, 0.025],
};
const batch10Versions = {
 qwen: 'qwen.qwq', llama: 'llama.3.1', mistral: 'mistral.large', gpt: 'gpt.4o', claude: 'claude.sonnet',
 kimi: 'kimi.k2', gemini: 'gemini.pro', grok: 'grok.3', glm: 'glm.plus', minimax: 'minimax.01', seedance: 'seedance.pro',
};

const phase3Cases = [
 ...batch10ACharacters.map(id => ({id, batchName: '10A', count: batch10ACharacters.length})),
 ...batch10BCharacters.map(id => ({id, batchName: '10B', count: batch10BCharacters.length})),
];
it.each(phase3Cases)('verifies Art-Batch $batchName masters, rig, decoded poses and offline copies for $id', ({id, batchName, count}) => {
 const batch = 'art/art-batch-' + batchName.toLowerCase();
 const publicDir = `art/chibi/characters/${id}`;
 const read = (path: string) => readFileSync(resolve(path));
 const sha = (path: string) => createHash('sha256').update(read(path)).digest('hex');
 const all: Batch10Entry[] = JSON.parse(readFileSync(join(batch, 'manifest.json'), 'utf8'));
 expect(all).toHaveLength(count * 12);
 const entries = all.filter(e => e.characterId === id);
 const masters = entries.filter(e => !e.publicFile);
 const runtime = entries.filter(e => e.publicFile && e.id !== 'rig');
 const names = ['ref_sheet', ...chibiPoses];
 const inventory = ['rig.json', ...chibiPoses.map(pose => pose + '.webp')].sort();
 const masterDir = `${batch}/masters/${id}`;
 const offline = JSON.parse(readFileSync('apps/web/dist/offline-assets.json', 'utf8')) as {assets: string[]};
 expect(readdirSync(masterDir).sort()).toEqual(names.map(pose => pose + '.png').sort());
 expect(masters.map(e => e.id).sort()).toEqual([...names].sort());
 expect(runtime.map(e => e.id).sort()).toEqual([...chibiPoses].sort());
 expect(entries.filter(e => e.id === 'rig')).toHaveLength(1);
 expect(readdirSync(join('apps/web/public', publicDir)).sort()).toEqual(inventory);
 expect(offline.assets.filter(path => path.startsWith(publicDir + '/')).sort()).toEqual(inventory.map(name => publicDir + '/' + name));
 for (const e of entries) {
  const file = e.publicFile ? e.file : join(batch, e.file);
  expect(read(file).length).toBe(e.bytes);
  expect(sha(file)).toBe(e.sha256);
  if (e.publicFile) {
   expect(e.publicFile).toBe(`${publicDir}/${e.id === 'rig' ? 'rig.json' : e.id + '.webp'}`);
   expect(e.file).toBe('apps/web/public/' + e.publicFile);
   expect(sha(join('apps/web/dist', e.publicFile))).toBe(e.sha256);
  }
 }
 const rig = JSON.parse(readFileSync(join('apps/web/public', publicDir, 'rig.json'), 'utf8'));
 const [walkSpeed, hopHeight, stepCadenceHz, squashAmount, breathAmp] = batch10Profiles[id];
 expect(rig).toMatchObject({schemaVersion: 2, renderer: 'maple-chibi', id, feet: [256,480], visibleHeight: 400,
  canvas: [512,512], facingDefault: 'right', heightScale: 1, optionalPoses: {react_front: null}, faceOverrides: null,
  motionProfile: {walkSpeed, hopHeight, stepCadenceHz, squashAmount, breathAmp}});
 expect(Object.keys(rig.poses).sort()).toEqual(chibiPoses.slice(0,4).sort());
 expect(Object.keys(rig.optionalPoses).sort()).toEqual(['back_3q', 'react_front']);
 expect(rig.anchors).toEqual(rig.poses.stand_3q.anchors);
 const images = [...masters, ...runtime];
 const pixels = inspectChibiPixels(images.map(e => resolve(e.publicFile ? e.file : join(batch, e.file))));
 const standWidth = pixels[images.findIndex(e => e.publicFile && e.id === 'stand_3q')]![6];
 for (const [i, e] of images.entries()) {
  const [format, width, height, range, bounds, center, headWidth, black] = pixels[i]!;
  expect([format, width, height, range, bounds, black]).toEqual([e.publicFile ? 'WEBP' : 'PNG', e.width, e.height,
   e.alphaRange, e.alphaBounds, 0]);
  expect(width).toBe(height);
  expect(range).toEqual([0,255]);
  expect(e).toMatchObject({tool: 'built-in image_gen', model: 'unknown; not exposed', parameters: {transparent_background: true}});
  const master = `${masterDir}/${e.id}.png`;
  if (!e.publicFile) {
   expect(e.file).toBe(`masters/${id}/${e.id}.png`);
   expect(e.sourceSha256).toBe(e.sha256);
   expect(e.blackPixelsAtAlpha14OrAbove).toBe(black);
   const portrait = `apps/web/public/art/ai-village/portraits/${id}.png`;
   const ref = masterDir + '/ref_sheet.png';
   const references = e.id === 'ref_sheet' ? [portrait, `apps/web/public/art/stage-b/${batch10Versions[id]}.webp`,
    'art/art-batch-8/masters/bluewhale/ref_sheet.png'] : [ref, ['walk_3q','back_3q'].includes(e.id) ? masterDir + '/stand_3q.png' : portrait];
   expect(e.references).toEqual(references.map(file => ({file, sha256: sha(file)})));
   continue;
  }
  expect(e.masterSha256).toBe(sha(master));
  expect(e.visiblePureBlackPixels).toBe(black);
  expect(width).toBe(512);
  expect(e.bytes).toBeLessThan(90000);
  const [l,t,r,b] = bounds as [number, number, number, number];
  const visibleHeight = b-t;
  expect(b-1).toBe(480);
  expect(Math.min(l, 512-r)).toBeGreaterThanOrEqual(12);
  expect(Math.abs(center! - 256)).toBeLessThan(1);
  expect(headWidth).toBe(standWidth);
  const seated = e.id === 'work_front' || e.id === 'rest_3q';
  if (seated) {
   expect(visibleHeight).toBeGreaterThanOrEqual(356);
   expect(visibleHeight).toBeLessThanOrEqual(392);
  } else expect(visibleHeight).toBe(400);
  const pose = e.id === 'back_3q' ? rig.optionalPoses.back_3q : rig.poses[e.id];
  expect(pose).toMatchObject({file: e.id + '.webp', mirrorable: e.id !== 'work_front', feet: [256,480],
   visibleHeight, headWidthRatio: headWidth/standWidth, poseScale: 1, anchors: {deskClipY: 370}});
  expect(pose.anchors.headTop[1]).toBe(t);
  if (e.id === 'work_front') expect(pose.anchors.propHand[1]).toBeLessThan(370);
  expect(e.normalization).toMatchObject({visibleHeight, feet: [256,480], headWidthRatio: headWidth/standWidth,
   headWidth, standHeadWidth: standWidth, quality: 88, method: 6, poseScale: 1});
  expect(e.normalization!.shoeCentroidX).toBeCloseTo(center!, 5);
 }
});

const furnitureLayers = {
 basic: ['back', 'front'], standard: ['back', 'front'], whiteboard: ['back'], coffee: ['back'],
 sofa: ['back'], server: ['back'], dining: ['front'], reading: ['front'],
} as const;
const batch11Decor = ['decor-studio_cat', 'decor-monstera_pot', 'decor-token_jar', 'decor-vinyl_player'];

it('limits Art-Batch 11 paths to shipped layers, previews and decor', () => {
 expect(furnitureKinds).toEqual(Object.keys(furnitureLayers));
 expect(decorPropIds).toEqual(batch11Decor);
 for (const kind of furnitureKinds) {
  const layers: readonly string[] = furnitureLayers[kind];
  for (const layer of ['back', 'front'] as const) {
   expect(furnitureLayerArt(kind, layer)).toBe(layers.includes(layer) ? `./art/furniture/${kind}-${layer}.webp` : null);
  }
  expect(furniturePreviewArt(kind)).toBe(`./art/furniture/${kind}-preview.webp`);
 }
 for (const id of decorPropIds) expect(decorPropArt(id)).toBe(`./art/furniture/${id}.webp`);
 for (const invalid of ['', '../../office', 'basic/../sofa', 'basic%2f..', '__proto__', 'constructor', 'toString', 'BASIC']) {
  expect(furnitureLayerArt(invalid, 'front')).toBeNull();
  expect(furnitureLayerArt('basic', invalid as 'front')).toBeNull();
  expect(furniturePreviewArt(invalid)).toBe('./art/furniture/basic-preview.webp');
  expect(decorPropArt(invalid)).toBe('./art/furniture/decor-studio_cat.webp');
 }
});

type FurnitureEntry = {
 id: string; file: string; publicFile?: string; width?: number; height?: number; bytes: number; sha256: string;
 alphaRange?: number[]; alphaBounds?: number[]; visiblePureBlackPixels?: number; sourceSha256?: string[];
};

it('verifies Art-Batch 11 PNGs, decoded WebPs, composite sources, catalog and offline copies', () => {
 const batch = 'art/art-batch-11';
 const pub = 'art/furniture/';
 const entries: FurnitureEntry[] = JSON.parse(readFileSync(join(batch, 'manifest.json'), 'utf8'));
 const layers = furnitureKinds.flatMap(k => furnitureLayers[k].map(l => k + '-' + l));
 const previews = furnitureKinds.map(k => k + '-preview');
 const originals = [...layers, ...batch11Decor];
 const images = [...originals, ...previews];
 const inventory = [...images.map(k => k + '.webp'), 'catalog.json'].sort();
 const sha = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');
 const offline: {assets: string[]} = JSON.parse(readFileSync('apps/web/dist/offline-assets.json', 'utf8'));
 expect(entries).toHaveLength(37);
 expect(new Set(entries.map(e => e.file)).size).toBe(37);
 expect(readdirSync(join(batch, 'masters')).sort()).toEqual(originals.map(k => k + '.png').sort());
 expect(readdirSync(join(batch, 'runtime')).sort()).toEqual(images.map(k => k + '.webp').sort());
 expect(readdirSync(join('apps/web/public', pub)).sort()).toEqual(inventory);
 expect(offline.assets.filter(p => p.startsWith(pub)).sort()).toEqual(inventory.map(p => pub + p));
 const masters = entries.filter(e => !e.publicFile);
 const runtime = entries.filter(e => e.publicFile && e.id !== 'catalog');
 expect(masters.map(e => e.id).sort()).toEqual(originals.sort());
 expect(runtime.map(e => e.id).sort()).toEqual(images.sort());
 const byId = (id: string) => runtime.find(e => e.id === id)!;
 const pixels = inspectChibiPixels([...masters, ...runtime].map(e => resolve(batch, e.file)));
 for (const [i, e] of [...masters, ...runtime].entries()) {
  const master = !e.publicFile;
  expect(e.file).toBe(master ? 'masters/' + e.id + '.png' : 'runtime/' + e.id + '.webp');
  const path = join(batch, e.file);
  expect(readFileSync(path).length).toBe(e.bytes);
  expect(sha(path)).toBe(e.sha256);
  const [format, w, h, range, bounds, , , black] = pixels[i]!;
  expect([format, w, h, range, bounds]).toEqual([master ? 'PNG' : 'WEBP', e.width, e.height, e.alphaRange, e.alphaBounds]);
  if (master) {
   expect(e).toMatchObject({tool: 'built-in image_gen', model: 'unknown; not exposed', parameters: {transparent_background: true}});
   expect(range[0]).toBe(0);
   expect(range[1]).toBeGreaterThanOrEqual(250);
   continue;
  }
  expect(e.publicFile).toBe(pub + e.id + '.webp');
  for (const folder of ['public', 'dist']) expect(sha(join('apps/web', folder, e.publicFile!))).toBe(e.sha256);
  expect(e).toMatchObject({visiblePureBlackPixels: 0, encoder: {quality: 88, method: 6}});
  expect([range, black]).toEqual([[0, 255], 0]);
  expect([w, h]).toEqual(layers.includes(e.id) ? [560, 480] : [256, 256]);
  expect(e.bytes).toBeLessThan(w === 560 ? 70000 : 35000);
  if (previews.includes(e.id)) {
   const kind = furnitureKinds.find(k => e.id === k + '-preview')!;
   expect(e.sourceSha256).toEqual(furnitureLayers[kind].map(l => byId(kind + '-' + l).sha256));
   expect(Math.min(bounds[0]!, bounds[1]!, 256 - bounds[2]!, 256 - bounds[3]!)).toBeGreaterThanOrEqual(26);
  } else {
   expect(e.sourceSha256).toEqual([masters.find(m => m.id === e.id)!.sha256]);
  }
 }
 const catalogEntry = entries.find(e => e.id === 'catalog')!;
 const catalogPath = join('apps/web/public', pub, 'catalog.json');
 expect(catalogEntry.file).toBe('apps/web/public/art/furniture/catalog.json');
 expect(catalogEntry.publicFile).toBe(pub + 'catalog.json');
 expect(readFileSync(catalogPath).length).toBe(catalogEntry.bytes);
 for (const f of ['public', 'dist']) expect(sha(join('apps/web', f, pub, 'catalog.json'))).toBe(catalogEntry.sha256);
 const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
 expect(catalog).toMatchObject({schemaVersion: 1, layerCanvas: [560,480], pixelsPerWorldUnit: 2, worldOriginPx: [280,400],
  previewCanvas: [256,256], decorCanvas: [256,256]});
 expect(catalog.furniture).toHaveLength(8);
 for (const [i, kind] of furnitureKinds.entries()) {
  expect(catalog.furniture[i]).toMatchObject({kind, layers: furnitureLayers[kind], preview: kind + '-preview.webp',
   alphaBounds: Object.fromEntries(furnitureLayers[kind].map(l => [l, byId(kind + '-' + l).alphaBounds])),
   previewAlphaBounds: byId(kind + '-preview').alphaBounds});
 }
 expect(catalog.decor).toHaveLength(4);
 for (const [i, id] of batch11Decor.entries()) {
  const e = byId(id), [l,t,r,b] = e.alphaBounds as [number,number,number,number];
  expect(catalog.decor[i]).toMatchObject({id, file: id + '.webp', feet: [128,236], visibleHeight: b-t, bytes: e.bytes,
   sha256: e.sha256, alphaBounds: e.alphaBounds});
  expect(b-1).toBe(236);
  expect(Math.min(l,t,256-r)).toBeGreaterThanOrEqual(20);
  expect(Math.max(r-l,b-t)).toBeGreaterThanOrEqual(192);
  expect(Math.max(r-l,b-t)).toBeLessThanOrEqual(204);
 }
});

it('checks Art-Batch 11 layer registration, desk opacity, catalog anchors and editor composition', () => {
 const result = spawnSync('python', ['-c', [
  'import json, numpy as np',
  'from pathlib import Path',
  'from PIL import Image',
  'root = Path("apps/web/public/art/furniture")',
  'catalog = json.loads((root / "catalog.json").read_bytes())',
  'dims = {"whiteboard":(430,460,340,360,412),"coffee":(320,350,310,330,424),"sofa":(460,490,265,290,424),"server":(220,250,370,390,426),"dining":(460,500,240,280,428),"reading":(460,500,240,280,428)}',
  'for obj in catalog["furniture"]:',
  '    kind = obj["kind"]',
  '    merged = Image.new("RGBA", (560,480))',
  '    for layer in obj["layers"]:',
  '        image = Image.open(root / (kind+"-"+layer+".webp")).convert("RGBA")',
  '        merged.alpha_composite(image)',
  '        a = np.asarray(image.getchannel("A")); l,t,r,b = image.getchannel("A").getbbox()',
  '        assert abs((l+r)/2-280)<=1, kind',
  '        if kind in ("basic","standard"):',
  '            if layer=="back": assert 260<=b-t<=290 and b-1==396, kind',
  '            else:',
  '                assert 460<=r-l<=500 and b-1==428, kind',
  '                assert 222<=np.flatnonzero((a[:,210:351]>=248).all(axis=1))[0]<=224, kind',
  '                assert a[224:261,210:351].min()==255 and a[284:385,180:381].min()==255, kind',
  '                x,y,w,h=obj["anchors"]["screenRect"]; assert w>0 and h>0 and a[y:y+h,x:x+w].min()>=248, kind',
  '        else:',
  '            w0,w1,h0,h1,foot=dims[kind]; assert w0<=r-l<=w1 and h0<=b-t<=h1 and b-1==foot, kind',
  '    for field in ("seatY",) if kind in ("sofa","basic","standard") else (): assert 0<obj["anchors"][field]<400',
  '    if kind=="server":',
  '        assert len(obj["anchors"]["ledPoints"])>=2',
  '        for x,y in obj["anchors"]["ledPoints"]: assert a[y,x]>=248',
  '    if kind=="coffee": x,y=obj["anchors"]["steamAnchor"]; assert l<x<r and t<y<b',
  '    crop=merged.crop(merged.getchannel("A").getbbox()); scale=202/max(crop.size)',
  '    thumb=crop.resize(tuple(round(v*scale) for v in crop.size),Image.Resampling.LANCZOS).getchannel("A").point(lambda a:a if a>=14 else 0)',
  '    thumb=thumb.crop(thumb.getbbox()); expected=Image.new("L",(256,256)); expected.paste(thumb,((256-thumb.width)//2,(256-thumb.height)//2))',
  '    assert expected.tobytes()==Image.open(root/obj["preview"]).getchannel("A").tobytes(), kind',
  'for obj in catalog["decor"]:',
  '    a=np.asarray(Image.open(root/obj["file"]).getchannel("A")); center=np.average(np.arange(256),weights=a.sum(axis=0))',
  '    assert abs(center-128)<=0.5 and abs(center-obj["alphaCentroidX"])<1e-6, obj["id"]',
 ].join('\n')], {encoding: 'utf8'});
 expect(result.status, result.error?.message ?? result.stderr).toBe(0);
});

const portraitTiers = ['base', 'flagship', 'avatar'] as const;
const portraitPaths = {base: basePortraitArt, flagship: flagshipPortraitArt, avatar: avatarPortraitArt};
const batch12ACharacters = ['bluewhale', ...batch10ACharacters] as const;
type PortraitTier = typeof portraitTiers[number];
type ArtFile = {file: string; sha256: string; bytes: number};
type PortraitReference = ArtFile & {external?: boolean};
type PortraitMaster = ArtFile & {
 method: string; references: PortraitReference[];
 editedFrom?: ArtFile & {references: PortraitReference[]};
 attachmentGuide?: ArtFile;
};
type PortraitManifest = {
 catalog: ArtFile; masters: Record<string, Record<PortraitTier, PortraitMaster>>;
 runtime: (ArtFile & {id: string; tier: PortraitTier; sourceSha256: string; encoder: {quality: number; method: number}})[];
};
type PortraitEntry = {
 path: string; width: number; height: number; sha256: string; bytes: number;
 alphaRange: number[]; alphaBounds: [number, number, number, number]; visiblePureBlackPixels: number;
 eyes: [number, number][]; headRegion: [number, number, number, number]; headCentroid: [number, number]; eyeCenter: [number, number];
};

it('resolves each shipped portrait tier and rejects unknown or path-like character IDs', () => {
 expect(portraitCharacters).toEqual([...batch12ACharacters, ...batch10BCharacters]);
 for (const tier of portraitTiers) {
  const directory = tier === 'avatar' ? 'avatars' : tier;
  for (const id of portraitCharacters) expect(portraitPaths[tier](id)).toBe(`./art/portraits/${directory}/${id}.webp`);
  for (const id of ['', 'Bluewhale', '../qwen', '%2fclaude', 'llama.webp', 'gpt?x', '__proto__', 'constructor']) {
   expect(portraitPaths[tier](id)).toBeNull();
  }
 }
});

it('decodes all 36 partner portraits and verifies both art batches, the catalog and both offline packages', () => {
 const directory = 'art/portraits/';
 const publicRoot = 'apps/web/public';
 const catalogPath = publicRoot + '/' + directory + 'catalog.json';
 const catalog: {characters: Record<string, Record<PortraitTier, PortraitEntry>>} = JSON.parse(readFileSync(catalogPath, 'utf8'));
 const loadBatch = (batch: string): PortraitManifest => JSON.parse(readFileSync(join(batch, 'manifest.json'), 'utf8'));
 const first = loadBatch('art/art-batch-12a'), second = loadBatch('art/art-batch-12b');
 const digest = (path: string) => {
  const bytes = readFileSync(path);
  return {bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex')};
 };
 expect(catalog).toMatchObject({schemaVersion: 1, portraitCanvas: [768, 1024], avatarCanvas: [256, 256]});
 expect(Object.keys(catalog.characters).sort()).toEqual([...portraitCharacters].sort());
 expect(Object.keys(first.masters).sort()).toEqual([...batch12ACharacters].sort());
 expect(Object.keys(second.masters).sort()).toEqual([...batch10BCharacters].sort());
 expect(first.runtime).toHaveLength(18);
 expect(second.runtime).toHaveLength(18);
 expect(second.catalog).toEqual({file: catalogPath, ...digest(catalogPath)});
 // Recreate the historical six-entry JSON with the original exporter's float formatting.
 const historical = spawnSync('python', ['-c', [
  'import json, sys',
  'from pathlib import Path',
  'catalog = json.loads(Path(sys.argv[1]).read_bytes())',
  'catalog["characters"] = {key: catalog["characters"][key] for key in sys.argv[2:]}',
  'sys.stdout.buffer.write((json.dumps(catalog, ensure_ascii=False, indent=2) + "\\n").encode())',
 ].join('\n'), catalogPath, ...batch12ACharacters]);
 expect(historical.status, historical.stderr?.toString()).toBe(0);
 expect(first.catalog).toEqual({file: catalogPath, bytes: historical.stdout.length,
  sha256: createHash('sha256').update(historical.stdout).digest('hex')});
 const published = new Map([[directory + 'catalog.json', second.catalog.sha256]]);
 const files: PortraitEntry[] = [];
 for (const id of portraitCharacters) {
  const from12A = Object.hasOwn(first.masters, id);
  const batch = from12A ? 'art/art-batch-12a' : 'art/art-batch-12b';
  const manifest = from12A ? first : second;
  const entries = catalog.characters[id]!;
  const masters = manifest.masters[id]!;
  const refBatch = id === 'bluewhale' ? '8' : from12A ? '10a' : '10b';
  const version = id === 'bluewhale' ? 'bluewhale.r1' : batch10Versions[id];
  const lobby = `art/art-batch-${refBatch}/masters/${id}/ref_sheet.png`;
  const original = '../../dsh_docs/live2d_assets/Character-reference/';
  expect(Object.keys(entries).sort()).toEqual([...portraitTiers].sort());
  expect(readdirSync(join(batch, 'masters', id)).sort()).toEqual(portraitTiers.map(t => t + '.png').sort());
  for (const tier of portraitTiers) {
   const entry = entries[tier], master = masters[tier];
   expect(master.file).toBe(`${batch}/masters/${id}/${tier}.png`);
   expect(master).toMatchObject(digest(master.file));
   const refs = master.references.map(r => r.file);
   for (const ref of master.references) {
    if (ref.file.startsWith(original)) {
     expect(ref.external).toBe(true);
     expect(ref.sha256).toMatch(/^[a-f0-9]{64}$/);
     expect(ref.bytes).toBeGreaterThan(0);
    } else {
     expect(ref).toMatchObject(digest(ref.file));
    }
   }
   if (!from12A) {
    expect(master.method).toBe('built-in image_gen');
    const styleTiers = tier === 'base' ? ['base', 'flagship'] : ['base', 'flagship', 'avatars'];
    const parent = master.editedFrom?.file ?? masters.base.file;
    expect(refs).toEqual([original + 'style_reference.jpg',
     ...styleTiers.map(t => publicRoot + '/' + directory + t + '/bluewhale.webp'),
     original + id + '.jpg', lobby, ...(tier === 'base' ? [] : [parent])]);
    if (master.editedFrom) {
     expect(parent).toBe(`${batch}/studies/${id}-${tier}.png`);
     expect(master.editedFrom).toMatchObject(digest(parent));
     expect(master.editedFrom.references).toEqual([...master.references.slice(0, -1),
      {file: masters.base.file, ...digest(masters.base.file)}]);
     const guide = `${batch}/studies/${id}-five-rule-guide.png`;
     expect(master.attachmentGuide).toEqual({file: guide, ...digest(guide)});
    }
   } else if (master.method === 'built-in image_gen') {
    expect(refs.slice(0, 2)).toEqual([lobby, `${publicRoot}/art/stage-b/${version}.webp`]);
    if (tier !== 'base') expect(refs[2]).toBe(masters.base.file);
   } else {
    expect([tier, master.method, refs]).toEqual(['avatar', 'native-resolution contour crop', [masters.base.file]]);
   }
   const publicFile = directory + entry.path;
   expect('./' + publicFile).toBe(portraitPaths[tier](id));
   const file = publicRoot + '/' + publicFile;
   const actual = digest(file);
   expect(entry).toMatchObject(actual);
   const runtime = manifest.runtime.find(e => e.id === id && e.tier === tier);
   expect(runtime).toMatchObject({file, ...actual, sourceSha256: master.sha256, encoder: {method: 6}});
   expect(runtime!.encoder.quality).toBeGreaterThanOrEqual(86);
   expect(runtime!.encoder.quality).toBeLessThanOrEqual(90);
   published.set(publicFile, actual.sha256);
   files.push(entry);
  }
 }
 const pixels = inspectChibiPixels(files.map(e => resolve(publicRoot, directory, e.path)));
 for (const [i, entry] of files.entries()) {
  const [format, w, h, range, bounds, , , black] = pixels[i]!;
  expect([format, w, h, range, bounds, black]).toEqual(['WEBP', entry.width, entry.height, entry.alphaRange, entry.alphaBounds, 0]);
  expect([range, entry.visiblePureBlackPixels]).toEqual([[0, 255], 0]);
  const [l, t, r, b] = entry.alphaBounds;
  const [hl, ht, hr, hb] = entry.headRegion;
  const [hx, hy] = entry.headCentroid;
  expect(l <= hl && hl < hx && hx < hr && hr <= r && t <= ht && ht < hy && hy < hb && hb <= b).toBe(true);
  expect(entry.eyes).toHaveLength(2);
  for (const axis of [0, 1] as const) {
   expect(entry.eyeCenter[axis]).toBeCloseTo((entry.eyes[0]![axis] + entry.eyes[1]![axis]) / 2, 1);
  }
  if (entry.path.startsWith('avatars/')) {
   expect([w, h]).toEqual([256, 256]);
   expect(entry.bytes).toBeLessThanOrEqual(35000);
   expect(Math.min(l, t, w - r, h - b)).toBeGreaterThanOrEqual(12);
   for (const [, y] of entry.eyes) expect(y >= h * 0.38 && y <= h * 0.54).toBe(true);
   expect(Math.abs(entry.eyeCenter[0] - w / 2)).toBeLessThanOrEqual(16);
  } else {
   expect([w, h]).toEqual([768, 1024]);
   expect(entry.bytes).toBeLessThanOrEqual(140000);
   expect(t >= 24 && Math.min(l, w - r) >= 12 && b - t >= 840 && b - t <= 972 && b >= 990 && b <= h).toBe(true);
  }
 }
 expect(published.size).toBe(37);
 for (const root of ['apps/web/dist', 'apps/dsh/dist/web']) {
  const offline: {assets: string[]} = JSON.parse(readFileSync(join(root, 'offline-assets.json'), 'utf8'));
  expect(offline.assets.filter(p => p.startsWith(directory)).sort()).toEqual([...published.keys()].sort());
  for (const [path, hash] of published) expect(digest(join(root, path)).sha256).toBe(hash);
 }
});

it('keeps Gemini’s pink iris on the viewer’s left and gold iris on the right in all three decoded portraits', () => {
 const result = spawnSync('python', ['-c', [
  'import json, sys',
  'from pathlib import Path',
  'from PIL import Image, ImageStat',
  'root = Path(sys.argv[1])',
  'entries = json.loads((root / "catalog.json").read_bytes())["characters"]["gemini"]',
  'for tier, entry in entries.items():',
  '    left, right = entry["eyes"]',
  '    assert left[0] < right[0], (tier, left, right)',
  '    radius = max(1, round((right[0] - left[0]) * 0.14))',
  '    colors = []',
  '    with Image.open(root / entry["path"]) as image:',
  '        for eye in (left, right):',
  '            x, y = map(round, eye)',
  '            iris = image.crop((x-radius, y-radius, x+radius+1, y+radius+1)).convert("RGB")',
  '            colors.append(ImageStat.Stat(iris).median)',
  '    (pr, pg, pb), (gr, gg, gb) = colors',
  '    assert pr > pb > pg + 15 and gr > gg > gb + 15, (tier, colors)',
 ].join('\n'), resolve('apps/web/public/art/portraits')], {encoding: 'utf8'});
 expect(result.status, result.error?.message ?? result.stderr).toBe(0);
});

it('preserves the five lines of Kimi K2’s music staff in the decoded WebP', () => {
 const result = spawnSync('python', ['-c', [
  'from itertools import groupby',
  'from PIL import Image',
  'import sys',
  'with Image.open(sys.argv[1]) as image:',
  '    for x in (398, 418, 480):',
  '        # The staff crosses the navy skirt here, clear of jewelry and star glints.',
  '        column = image.crop((x, 795, x+1, 880)).convert("RGB")',
  '        gold = [r >= 190 and g >= 142 and r-b >= 15 for r, g, b in column.getdata()]',
  '        strokes = sum(1 for lit, pixels in groupby(gold) if lit)',
  '        assert strokes == 5, (x, strokes)',
 ].join('\n'), resolve('apps/web/public/art/portraits/flagship/kimi.webp')], {encoding: 'utf8'});
 expect(result.status, result.error?.message ?? result.stderr).toBe(0);
});
