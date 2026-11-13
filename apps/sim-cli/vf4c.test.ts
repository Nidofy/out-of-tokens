import {test,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {loadFullContent} from 'oot-content';
import {labSession} from '../web/src/office-lab.js';
import {actorPlacements,slotPoint,separateOfficeLabels} from '../web/src/office-scene-spec.js';
const digest=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
test('nameplates avoid another visible face without hiding or shrinking labels',()=>{
 const face={x:220,y:260,width:60,height:60},row={id:'minimax',x:270,y:250,width:100,height:36};
 const result=separateOfficeLabels([row],844,390,[face])[0]!;
 expect(result.width).toBe(row.width);expect(result.height).toBe(row.height);
 const overlap=Math.max(0,Math.min(result.x+result.width/2,face.x+face.width)-Math.max(result.x-result.width/2,face.x))*Math.max(0,Math.min(result.y+result.height,face.y+face.height)-Math.max(result.y,face.y));
 expect(overlap).toBe(0);expect(result.y).toBeGreaterThanOrEqual(0);
});
test('Stage B manifest verifies every source/output and all derived assets are precached',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../web/public/art/stage-b/manifest.json',import.meta.url),'utf8')) as {file:string;sha256:string;sources:{file:string;sha256:string}[]}[];
 const offline=JSON.parse(readFileSync(new URL('../web/dist/offline-assets.json',import.meta.url),'utf8')) as {assets:string[]};
 expect(manifest).toHaveLength(8);
 for(const entry of manifest){
  expect(digest(readFileSync(new URL(`../web/public/art/stage-b/${entry.file}`,import.meta.url)))).toBe(entry.sha256);
  expect(offline.assets).toContain(`art/stage-b/${entry.file}`);
  for(const source of entry.sources)expect(digest(readFileSync(new URL(`../web/public/art/ai-village/${source.file}`,import.meta.url)))).toBe(source.sha256);
 }
});
test('public twelve-person rows leave body/label clearance and later chapters clear workstations',()=>{
 const view=labSession(loadFullContent(),'twelve').view;
 for(const scene of ['canteen','library'] as const){
  const rows=actorPlacements({...view,campaign:{...view.campaign!,scene},actors:view.actors.map(a=>({...a,location:scene}))});
  expect(rows).toHaveLength(12);
  for(const a of rows)for(const b of rows)if(a.id!==b.id&&Math.abs(a.x-b.x)<150)expect(Math.abs(a.y-b.y)).toBeGreaterThanOrEqual(210);
 }
 for(const chapter of [1,2,3,4]){
  const rows=actorPlacements({...view,campaign:{...view.campaign!,chapter}});
  const qwen=rows.find(a=>a.id==='qwen')!;
  for(const item of view.office!.items.filter(i=>i.kind==='basic'))expect(Math.abs(qwen.x-slotPoint(item.slot!,chapter).x)).toBeGreaterThanOrEqual(220);
 }
});
