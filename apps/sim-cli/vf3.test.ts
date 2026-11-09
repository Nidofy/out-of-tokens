import {expect,test} from 'vitest';
import {loadFullContent} from 'oot-content';
import {labSession} from '../web/src/office-lab.js';
import {actorFocus,actorPlacements,jobFocus,officeCamera,actorOutsideFrame,slotPoint,workLabelOffset} from '../web/src/office-scene-spec.js';
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
