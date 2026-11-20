import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createInitialState,getViewModel} from 'oot-core';
import {loadFullContent} from 'oot-content';
import {decorPropArt,decorPropIds,furnitureKinds,furnitureLayerArt,furniturePreviewArt} from '../web/src/furniture-art.js';
import {
 DAY_FURNITURE_TINT,
 FURNITURE_FX_ANCHORS,
 NIGHT_FURNITURE_TINT,
 WORKSHOP_DECOR_PLACEMENTS,
 canvasToFurnitureWorld,
 decorClearsSlots,
 furnitureTintFor,
 resolveFurnitureLayerUrl,
 resolveFurniturePreviewUrl,
 resolveServerLoadLevel
} from '../web/src/art/furniture-rig.js';
import {extractOfficePois} from '../web/src/office-nav.js';
import {slotPoint} from '../web/src/office-scene-spec.js';

const ALL_WORKSHOP_SLOTS=[
 'work-1','work-2','work-3','work-4','work-5','work-6','work-7','work-8','work-9','work-10','work-11','work-12',
 'meeting-1','meeting-2',
 'lounge-1','lounge-2','lounge-3','lounge-4',
 'server-1','server-2'
] as const;

describe('Art-Batch 11 furniture upgrade & clickable decor integration',()=>{
 it('validates apps/web/public/art/furniture/catalog.json schema and anchors match runtime tables',()=>{
  const raw=readFileSync(resolve(process.cwd(),'apps/web/public/art/furniture/catalog.json'),'utf8');
  const catalog=JSON.parse(raw) as {
   schemaVersion:number;
   layerCanvas:[number,number];
   worldOriginPx:[number,number];
   furniture:Array<{
    kind:string;
    layers:Array<'back'|'front'>;
    preview:string;
    anchors:{screenRect?:number[];steamAnchor?:number[];ledPoints?:number[][];seatY?:number};
   }>;
   decor:Array<{id:string;file:string;feet:[number,number];visibleHeight:number}>;
  };
  expect(catalog.schemaVersion).toBe(1);
  expect(catalog.layerCanvas).toEqual([560,480]);
  expect(catalog.worldOriginPx).toEqual([280,400]);

  for(const kind of furnitureKinds){
   const entry=catalog.furniture.find(f=>f.kind===kind);
   expect(entry,`${kind} missing in catalog.json`).toBeDefined();
   expect(entry!.preview).toBe(furniturePreviewArt(kind).replace('./art/furniture/',''));
   for(const layer of ['back','front'] as const){
    if(entry!.layers.includes(layer)){
     expect(furnitureLayerArt(kind,layer)).toBe(`./art/furniture/${kind}-${layer}.webp`);
    }else{
     expect(furnitureLayerArt(kind,layer)).toBeNull();
    }
   }
   const runtimeAnchors=FURNITURE_FX_ANCHORS[kind];
   if(entry!.anchors.screenRect)expect(runtimeAnchors.screenRect).toEqual(entry!.anchors.screenRect);
   if(entry!.anchors.steamAnchor)expect(runtimeAnchors.steamAnchor).toEqual(entry!.anchors.steamAnchor);
   if(entry!.anchors.ledPoints)expect(runtimeAnchors.ledPoints).toEqual(entry!.anchors.ledPoints);
   if(entry!.anchors.seatY!==undefined)expect(runtimeAnchors.seatY).toBe(entry!.anchors.seatY);
  }
  for(const id of decorPropIds){
   const d=catalog.decor.find(item=>item.id===id);
   expect(d,`${id} missing in catalog.json`).toBeDefined();
   expect(decorPropArt(id)).toBe(`./art/furniture/${d!.file}`);
   expect(d!.feet).toEqual([128,236]);
  }
 });

 it('resolves modern WebP URLs by default and skips intentionally empty layers cleanly',()=>{
  expect(resolveFurnitureLayerUrl('basic','back')).toEqual({url:'./art/furniture/basic-back.webp',isLegacy:false});
  expect(resolveFurnitureLayerUrl('basic','front')).toEqual({url:'./art/furniture/basic-front.webp',isLegacy:false});
  expect(resolveFurnitureLayerUrl('standard','front')).toEqual({url:'./art/furniture/standard-front.webp',isLegacy:false});
  expect(resolveFurnitureLayerUrl('sofa','back')).toEqual({url:'./art/furniture/sofa-back.webp',isLegacy:false});
  expect(resolveFurnitureLayerUrl('sofa','front')).toBeNull();
  expect(resolveFurnitureLayerUrl('dining','back')).toBeNull();
  expect(resolveFurnitureLayerUrl('dining','front')).toEqual({url:'./art/furniture/dining-front.webp',isLegacy:false});
  expect(resolveFurniturePreviewUrl('coffee')).toBe('./art/furniture/coffee-preview.webp');
  expect(resolveFurniturePreviewUrl('server')).toBe('./art/furniture/server-preview.webp');
 });

 it('maps 560x480 canvas coordinates to 280x240 furniture world space accurately',()=>{
  expect(canvasToFurnitureWorld(280,400)).toEqual({x:0,y:0});
  expect(canvasToFurnitureWorld(0,0)).toEqual({x:-140,y:-200});
  expect(canvasToFurnitureWorld(560,480)).toEqual({x:140,y:40});
 });

 it('computes day/night furniture tint and server load levels deterministically',()=>{
  expect(furnitureTintFor(false)).toBe(DAY_FURNITURE_TINT);
  expect(furnitureTintFor(true)).toBe(NIGHT_FURNITURE_TINT);

  const content=loadFullContent();
  const state=createInitialState(content,1);
  const calmVm=getViewModel(state,content);
  expect(resolveServerLoadLevel(calmVm,false)).toBe('calm');
  expect(resolveServerLoadLevel(calmVm,true)).toBe('hot');

  state.jobs[0]!.status='working';
  const busyVm=getViewModel(state,content);
  expect(resolveServerLoadLevel(busyVm,false)).toBe('busy');

  const stopVm={...busyVm,possibleStops:['bluewhale']};
  expect(resolveServerLoadLevel(stopVm,false)).toBe('hot');
 });

 it('keeps all 4 clickable decor placements clear of every workshop furniture slot across chapters 0..4',()=>{
  expect(WORKSHOP_DECOR_PLACEMENTS.map(p=>p.id).sort()).toEqual([...decorPropIds].sort());
  for(let chapter=0;chapter<=4;chapter++){
   for(const decor of WORKSHOP_DECOR_PLACEMENTS){
    expect(
     decorClearsSlots(decor,ALL_WORKSHOP_SLOTS,chapter),
     `${decor.id} too close to a slot in chapter ${chapter}`
    ).toBe(true);
   }
  }
 });

 it('aligns sofa POI cushion height cleanly above bottom skirt',()=>{
  const items=[{id:'f99',kind:'sofa',slot:'lounge-2'}];
  const pois=extractOfficePois(items,0,'workshop');
  const sofaPoi=pois.find(p=>p.kind==='sofa');
  expect(sofaPoi).toBeDefined();
  const anchor=slotPoint('lounge-2',0);
  expect(sofaPoi!.y).toBe(anchor.y+12);
 });
});
