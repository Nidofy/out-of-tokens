import {expect,test} from 'vitest';
import {loadFullContent} from 'oot-content';
import {labSession} from '../web/src/office-lab.js';
import {actorFocus,actorPlacements,jobFocus,officeCamera,clampZoom,clampOfficePan,zoomOfficeCamera,defaultCameraPan,actorOutsideFrame,slotPoint,workLabelOffset} from '../web/src/office-scene-spec.js';
import {actorHitArea,furnitureHitArea} from '../web/src/office-hit-area.js';
import {sceneCamera,initialSceneCamera,dismissPresence} from '../web/src/scene-navigation.js';

test.each([[1280,720],[390,844],[560,800],[844,390]])('editor preview/resize/exit restores the exact S1 camera at %sx%s',(width,height)=>{
 const g=labSession(loadFullContent(),'standard'),before=JSON.stringify(g.view);
 for(const origin of [initialSceneCamera,sceneCamera(initialSceneCamera,{type:'locate',focus:actorFocus(g.view,'qwen')}),sceneCamera(initialSceneCamera,{type:'zone',zone:'meeting'})]){
  const expected=officeCamera(width!,height!,origin.cameraZone,origin.sceneFocus);
  let state=sceneCamera(origin,{type:'preview',focus:width!<900?slotPoint('work-1'):null});
  // Resizing and selecting another slot also leave S1's explicit focus and zone intact.
  state=sceneCamera(state,{type:'preview',focus:slotPoint('work-3')});
  state=sceneCamera(state,{type:'preview',focus:null});
  state=sceneCamera(state,{type:'editor-close'}); // Both save and cancel use this transition.
  expect(state).toEqual(origin);
  expect(officeCamera(width!,height!,state.cameraZone,state.sceneFocus)).toEqual(expected);
  expect(sceneCamera(state,{type:'reset'})).toEqual(initialSceneCamera);
 }
 expect(JSON.stringify(g.view)).toBe(before);
});
test('locations dismissal restores the trigger only for an explicit non-modal close',()=>{
 for(const reason of ['escape','close'] as const){
  expect(dismissPresence(true,reason,false)).toEqual({open:false,restoreFocus:true});
  expect(dismissPresence(false,reason,false)).toEqual({open:false,restoreFocus:false});
 }
 expect(dismissPresence(true,'escape',true)).toEqual({open:true,restoreFocus:false});
 // Modal opening owns focus; closing it must not resurrect the locations list.
 const hidden=dismissPresence(true,'modal',true);
 expect(hidden).toEqual({open:false,restoreFocus:false});
 expect(dismissPresence(hidden.open,'escape',false)).toEqual({open:false,restoreFocus:false});
});

test.each([[1280,720],[1920,1080],[390,844],[560,800],[844,390]])('explicit locate/reset at %sx%s is presentation only and keeps the target visible',(width,height)=>{
 const g=labSession(loadFullContent(),'standard'),before=JSON.stringify(g.view),p=actorPlacements(g.view).find(p=>p.id==='qwen')!,focus=actorFocus(g.view,'qwen')!;
 const overview=officeCamera(width!,height!,'overview'),located=officeCamera(width!,height!,'overview',focus);
 expect(located).not.toEqual(overview);
 expect(actorOutsideFrame(p.x,p.y,220,located.scale,located,width!,height!)).toBe(false);
 expect(officeCamera(width!,height!,'overview')).toEqual(overview);
 expect(jobFocus(g.view,g.view.jobs.find(j=>j.status==='working')!.id)).toEqual(focus);
 expect(JSON.stringify(g.view)).toBe(before);
});
test('locate respects current scene and actual reservation lifetime',()=>{
 const g=labSession(loadFullContent(),'initial');expect(jobFocus(g.view,g.view.jobs[0]!.id)).toBeNull();
 g.send({type:'campaign',action:'visit',id:'library'});
 expect(actorFocus(g.view,'qwen')).toBeNull();expect(jobFocus(g.view,g.view.jobs[0]!.id)).toBeNull();
});
test('shared geometry retains twelve unique idle anchors and separate meeting seats',()=>{
 const twelve=actorPlacements(labSession(loadFullContent(),'twelve').view);
 expect(twelve).toHaveLength(12);expect(new Set(twelve.map(p=>`${p.x}/${p.y}`)).size).toBe(12);
 expect(twelve.some(p=>p.id==='glm')).toBe(true);
 // Lower aisle heads must clear the occupied desk's nameplate, including GLM/Seedance.
 expect(twelve[8]!.y-172).toBeGreaterThan(slotPoint('work-1').y+workLabelOffset+18);
 const meeting=actorPlacements(labSession(loadFullContent(),'meeting').view).filter(p=>p.zone==='meeting');
 expect(meeting).toHaveLength(2);expect(Math.abs(meeting[0]!.x-meeting[1]!.x)).toBe(144);
});
test.each(['twelve-basic','twelve-standard','twelve-meeting'])('%s fixture uses valid three-member assignments',scenario=>{
 const g=labSession(loadFullContent(),scenario);
 expect(g.view.actors).toHaveLength(12);
 expect(g.view.jobs.find(j=>j.status==='working')!.team).toHaveLength(3);
});
test.each(['bluewhale','qwen','llama','mistral','gpt','claude','kimi','gemini','grok','glm','minimax','seedance'])('%s uses the same reserved computer anchor and upper-body hit geometry',id=>{
 const g=labSession(loadFullContent(),'twelve'),job=g.view.jobs.find(j=>j.template==='menu')!;
 expect(g.send({type:'accept',job:job.id}).error).toBeNull();
 expect(g.send({type:'assign',job:job.id,team:[{character:id,role:'worker',mode:'cloud'}]}).error).toBeNull();
 const p=actorPlacements(g.view).find(p=>p.id===id)!;expect(p).toMatchObject({...slotPoint('work-1'),seated:true,zone:'work'});
 expect(actorHitArea(true).contains(0,-180)).toBe(true);
 expect(furnitureHitArea('basic','front').contains(0,-180)).toBe(false);
 expect(furnitureHitArea('basic','front').contains(0,-50)).toBe(true);
 expect(actorHitArea(true).contains(0,-50)).toBe(false);
});
test.each([[390,844],[560,800],[844,390],[1280,720]])('camera pan and focal zoom clamp to world bounds and preserve editor preview isolation at %sx%s',(width,height)=>{
 expect(clampZoom(.5)).toBe(1);expect(clampZoom(1.256)).toBe(1.26);expect(clampZoom(2)).toBe(1.5);
 const base=officeCamera(width!,height!,'overview');
 const left=clampOfficePan(width!,height!,'overview',null,1,{x:9999,y:9999}),right=clampOfficePan(width!,height!,'overview',null,1,{x:-9999,y:-9999});
 const camLeft=officeCamera(width!,height!,'overview',null,1,left),camRight=officeCamera(width!,height!,'overview',null,1,right);
 expect(camLeft.x).toBeCloseTo(0,6);expect(camRight.x+1920*camRight.scale).toBeCloseTo(width!,5);
 if(width!<height!)expect(left.x).toBeGreaterThan(200);else if(width!/height!>16/9)expect(left.y).toBeGreaterThan(50);
 const focal={x:width!*0.35,y:height!*0.45},worldBefore={x:(focal.x-base.x)/base.scale,y:(focal.y-base.y)/base.scale};
 const zoomed=zoomOfficeCamera(width!,height!,'overview',null,1,defaultCameraPan,1.3,focal),camZoom=officeCamera(width!,height!,'overview',null,zoomed.zoom,zoomed.pan);
 expect(zoomed.zoom).toBe(1.3);expect(camZoom.x).toBeLessThanOrEqual(0);expect(camZoom.y).toBeLessThanOrEqual(0);
 expect(camZoom.x+1920*camZoom.scale).toBeGreaterThanOrEqual(width!-1e-6);expect(camZoom.y+1080*camZoom.scale).toBeGreaterThanOrEqual(height!-1e-6);
 const worldAfter={x:(focal.x-camZoom.x)/camZoom.scale,y:(focal.y-camZoom.y)/camZoom.scale};
 if(camZoom.x<0&&camZoom.x>width!-1920*camZoom.scale)expect(worldAfter.x).toBeCloseTo(worldBefore.x,4);
 let s=sceneCamera(initialSceneCamera,{type:'zoom',zoom:1.3,pan:zoomed.pan});
 s=sceneCamera(s,{type:'pan',pan:left});
 const panned=s;
 s=sceneCamera(s,{type:'preview',focus:slotPoint('work-2')});
 s=sceneCamera(s,{type:'editor-close'});
 expect(s).toEqual(panned);
 expect(sceneCamera(s,{type:'reset'})).toEqual(initialSceneCamera);
});
