import {test,expect} from 'vitest';
import {workFurnitureHitArea,separateOfficeLabels,officeCamera,slotPoint} from '../web/src/office-scene-spec.js';
test('B1 furniture alpha masks reject transparent padding and shadows at the floor anchor',()=>{
 const rgba=new Uint8ClampedArray(280*240*4),paint=(x:number,y:number,a:number)=>{rgba[((y+200)*280+x+140)*4+3]=a;};
 paint(-65,-70,255);paint(98,-108,255);paint(118,12,66);paint(0,-145,0);paint(-140,-200,96);
 const hit=workFurnitureHitArea(rgba);
 expect(hit.contains(-65,-70)).toBe(true);expect(hit.contains(98,-108)).toBe(true);
 expect(hit.contains(118,12)).toBe(false);expect(hit.contains(0,-145)).toBe(false);
 expect(hit.contains(-140,-200)).toBe(true);expect(hit.contains(-140.01,-200)).toBe(false);expect(hit.contains(140,40)).toBe(false);
 rgba.fill(0);expect(hit.contains(-65,-70)).toBe(true);
});
test('B1 small same-row nameplates separate without shrinking or changing source placements',()=>{
 const rows=[{id:'bluewhale',x:147,y:295,width:78,height:20},{id:'qwen',x:215,y:295,width:62,height:20},{id:'llama',x:215,y:320,width:62,height:20}],before=JSON.stringify(rows),placed=separateOfficeLabels(rows,844);
 const first=placed.find(r=>r.id==='bluewhale')!,second=placed.find(r=>r.id==='qwen')!;
 expect(second.x-second.width/2).toBeGreaterThanOrEqual(first.x+first.width/2+3);expect(second.y).toBe(295);expect(second.width).toBe(62);expect(JSON.stringify(rows)).toBe(before);
 expect(placed.find(r=>r.id==='llama')!.x).toBe(215);
});
test('B1 work-slot world/screen mapping is reversible for all four cameras and viewports',()=>{
 for(const [width,height] of [[1280,720],[844,390],[560,800],[390,844]])for(let n=1;n<=4;n++){
  const p=slotPoint(`work-${n}`);expect(p).toEqual({x:640+(n-1)*260,y:795});
  for(const zone of ['overview','work-left','work-right'] as const)for(const focus of [null,{x:p.x,y:p.y-110}]){
   const c=officeCamera(width!,height!,zone,focus),screen={x:c.x+p.x*c.scale,y:c.y+p.y*c.scale};
   expect((screen.x-c.x)/c.scale).toBeCloseTo(p.x,8);expect((screen.y-c.y)/c.scale).toBeCloseTo(p.y,8);
   expect(c.x).toBeLessThanOrEqual(0);expect(c.x+1920*c.scale).toBeGreaterThanOrEqual(width!-.001);
  }
 }
});
import {readableSlotLabel} from '../web/src/office-editor.js';
import {jobMatchesGroup,filterJobs,clarificationWait} from '../web/src/commission-workbench.js';
test('A4 readable office labels preserve numbers and unknown IDs',()=>{
 for(const [zone,zh,en] of [['work','工位','Station'],['meeting','会议席','Meeting'],['lounge','休闲位','Lounge'],['server','机柜位','Server']]){
  expect(readableSlotLabel(`${zone}-12`,false)).toBe(`${zh} 12`);expect(readableSlotLabel(`${zone}-12`,true)).toBe(`${en} 12`);
 }
 for(const id of ['work-x','unknown-1','work-1-extra',''])expect(readableSlotLabel(id,true)).toBe(id);
});
test('A4 job groups include every displayed lifecycle state and search respects locale',()=>{
 const jobs=['posted','accepted','working','waiting','review','delivered','breached','expired','rejected'].map(status=>({status,title:'菜单文案',titleEn:'Cafe MENU'})),before=JSON.stringify(jobs);
 expect(filterJobs(jobs,'active','',false).map(j=>j.status)).toEqual(['accepted','working','waiting','review']);
 expect(filterJobs(jobs,'history','',false).map(j=>j.status)).toEqual(['delivered','breached']);
 expect(filterJobs(jobs,'posted',' menu ',true)).toHaveLength(1);expect(filterJobs(jobs,'posted','menu',false)).toHaveLength(0);
 expect(filterJobs(jobs,'posted','菜单',false)).toHaveLength(1);expect(jobMatchesGroup('rejected','history')).toBe(false);expect(JSON.stringify(jobs)).toBe(before);
});
test('A4 clarification wait ends exactly at the next available period',()=>{
 expect(clarificationWait({status:'posted',clarifyingUntil:2},1)).toBe(true);expect(clarificationWait({status:'posted',clarifyingUntil:2},2)).toBe(false);expect(clarificationWait({status:'accepted',clarifyingUntil:2},1)).toBe(false);
});
import {characterPosters,resolveCharacterVisual,versionDelta,recruitmentBlock} from '../web/src/character-profiles.js';
test('VF4-A3 all twelve portraits preserve Stage A contract and profile stays upright',()=>{
 expect(Object.keys(characterPosters)).toHaveLength(12);
 for(const id of Object.keys(characterPosters)){
  expect(resolveCharacterVisual(id)).toMatchObject({src:`./art/ai-village/portraits/${id}.png`,versionBadge:'BASE',isInvertedGag:id==='claude',sWord:characterPosters[id]!.sWord,themeColor:characterPosters[id]!.themeColor});
  expect(resolveCharacterVisual(id,`${id}.v2.test`,'profile')).toMatchObject({versionBadge:'V2.TEST',isInvertedGag:false});
 }
});
test('VF4-A3 deltas cover six skills and engineering metrics without mutation',async()=>{
 const c=await loadFullContent(),base=c.versions[0]!,before=JSON.stringify(base),v={...base,skills:{code:9,write:8,reason:7,create:6,media:5,recall:4},price:base.price+2,speed:base.speed-0.1,stability:base.stability+1,context:base.context-1};
 const d=versionDelta(v,base);expect(d).toMatchObject({price:2,speed:-0.1,stability:1,context:-1});
 for(const k of Object.keys(v.skills) as (keyof typeof v.skills)[])expect(d.skills[k]).toBe(v.skills[k]-base.skills[k]);
 expect(versionDelta(base,base).skills).toEqual({code:0,write:0,reason:0,create:0,media:0,recall:0});expect(JSON.stringify(base)).toBe(before);
});
test('VF4-A3 recruitment respects equality boundaries and every blocker',async()=>{
 const view=labSession(await loadFullContent(),'standard').view,r={character:'claude',cost:100,reputation:10,minChapter:1};
 const ready={...view,cash:100,reputation:10,campaign:{...view.campaign!,chapter:1}};
 expect(recruitmentBlock(ready,r)).toBeNull();expect(recruitmentBlock(ready,r,true)).toBe('locked');
 expect(recruitmentBlock({...ready,cash:99},r)).toBe('cash');expect(recruitmentBlock({...ready,reputation:9},r)).toBe('reputation');
 expect(recruitmentBlock({...ready,campaign:{...ready.campaign,chapter:0}},r)).toBe('chapter');
 expect(recruitmentBlock(ready,{...r,character:ready.actors[0]!.id})).toBe('recruited');
});
import {loadFullContent} from 'oot-content';
import {labSession} from '../web/src/office-lab.js';
import {partnerAvailability} from '../web/src/partner-state.js';
import {commandFeedbackTarget,feedbackSurface,presentationEvent,nextFeedback,clearLocalFeedback} from '../web/src/presentation-events.js';
import type {UiFeedback} from '../web/src/presentation-events.js';
import {saveSlotRows} from '../web/src/dialog.js';
import type {StoredSave} from 'oot-platform';
import {projectActionBlock} from '../web/src/project-panel.js';

test('project presentation blockers preserve chapter, busy and retry affordability boundaries',()=>{
 expect(projectActionBlock(false,1,1,100,100)).toBeNull();
 expect(projectActionBlock(false,1,1,-1)).toBeNull(); // Starting/advancing has no UI cash gate.
 expect(projectActionBlock(false,1,1,99,100)).toBe('cash');
 expect(projectActionBlock(false,2,1,1000)).toBe('chapter');
 expect(projectActionBlock(true,1,1,1000)).toBe('busy');
 expect(projectActionBlock(true,2,1,0,100)).toBe('busy');
});

test('system saves expose nine stable slots, only manual slots can be saved and empty slots cannot load',()=>{
 const rows=saveSlotRows([],false);
 expect(rows.map(r=>r.id)).toEqual(['manual-1','manual-2','manual-3','auto','backup-1','backup-2','backup-3','backup-4','backup-5']);
 expect(rows.filter(r=>r.canSave).map(r=>r.id)).toEqual(['manual-1','manual-2','manual-3']);
 expect(rows.some(r=>r.canLoad)).toBe(false);
});
test('system save records are matched by ID, including zero timestamps and reordered partial responses',()=>{
 const manual:StoredSave={id:'manual-2',savedAt:0,revision:1,text:'isolated test'},backup:StoredSave={...manual,id:'backup-5'};
 const records=[backup,null,manual],before=JSON.stringify(records),rows=saveSlotRows(records,false);
 expect(rows.find(r=>r.id==='manual-1')).toMatchObject({record:null,canLoad:false});
 expect(rows.find(r=>r.id==='manual-2')).toMatchObject({record:manual,canLoad:true,canSave:true});
 expect(rows.find(r=>r.id==='backup-5')).toMatchObject({record:backup,canLoad:true,canSave:false});
 expect(JSON.stringify(records)).toBe(before);
});
test('busy state disables every save and load without hiding existing records',()=>{
 const record:StoredSave={id:'manual-1',savedAt:0,revision:1,text:'isolated test'};
 const rows=saveSlotRows([record],true);
 expect(rows.every(r=>!r.canLoad&&!r.canSave)).toBe(true);
 expect(rows[0]!.record).toBe(record);
});
test('save success and load feedback have one Saves owner; global errors retain priority across it',()=>{
 const target={surface:'saves' as const},saved:UiFeedback={id:1,code:'SAVED',target,error:false,receipt:null};
 for(const code of ['SAVED','LOADED'])expect(feedbackSurface({...saved,code},{saves:true,modal:true})).toBe('saves');
 expect(feedbackSurface(saved,{actor:'qwen',saves:false,modal:true})).toBeNull();
 const conflict:UiFeedback={...saved,code:'EXTERNAL_CHANGE',target:{surface:'global'},error:true};
 expect(feedbackSurface(nextFeedback(conflict,saved,true),{saves:true,modal:true})).toBe('saves');
 expect(nextFeedback(conflict,saved,true)).toBe(conflict);
});

test.each(['job','actor'] as const)('closing %s removes only matching ephemeral feedback before reopening',surface=>{
 const target={surface,id:'object-a'},base:UiFeedback={id:1,code:'INSUFFICIENT_RESOURCES',target,error:true,receipt:null};
 for(const feedback of [base,{...base,error:false,code:'DONE'},{...base,receipt:{id:1,kind:'accept' as const,title:['',''] as [string,string]}}]){
  expect(clearLocalFeedback(feedback,target)).toBeNull();
  expect(clearLocalFeedback(feedback,{surface,id:'object-b'})).toBe(feedback);
 }
 for(const kind of ['assign','deliver'] as const){
  const receipt={...base,error:false,receipt:{id:1,kind,title:['',''] as [string,string]}};
  const after=clearLocalFeedback(receipt,target);
  expect(after).toBe(receipt);expect(feedbackSurface(after,{saves:false,modal:false})).toBe('global');
 }
 for(const code of ['EXTERNAL_CHANGE','AUTO_PAUSED']){
  const global={...base,target:{surface:'global' as const},code};
  expect(clearLocalFeedback(global,target)).toBe(global);
 }
 expect(clearLocalFeedback(null,target)).toBeNull();
});
test('a close updater created before visit completion clears the latest DONE and preserves a later global error',()=>{
 const target={surface:'actor' as const,id:'qwen'};
 // useGame passes this updater to setFeedback, never captures the rendered feedback value.
 const close=(current:UiFeedback|null)=>clearLocalFeedback(current,target);
 const done:UiFeedback={id:2,code:'DONE',target,error:false,receipt:null};
 expect(close(done)).toBeNull();
 const global:UiFeedback={...done,id:3,code:'EXTERNAL_CHANGE',target:{surface:'global'},error:true};
 expect(close(nextFeedback(global,done,true))).toBe(global);
});

function evening(){
 const g=labSession(loadFullContent(),'standard');
 for(let n=0;n<2;n++)expect(g.send({type:'advance'}).error).toBeNull();
 const actor=g.view.actors.find(a=>a.id==='qwen')!;
 expect(actor.busy).toBe(true);expect(actor.location).toBe('library');
 expect(g.send({type:'campaign',action:'visit',id:'library'}).error).toBeNull();
 return g;
}
test.each(['chat','gift','meal','study','recall'] as const)('assigned evening teammate can %s under real core rules',action=>{
 const g=evening(),actor=g.view.actors.find(a=>a.id==='qwen')!;
 expect(partnerAvailability(g.view,actor)).toMatchObject({sameScene:true,lifeBusy:false,canRecall:true});
 expect(g.send({type:'campaign',action,id:actor.id}).error).toBeNull();
 const next=g.view.actors.find(a=>a.id===actor.id)!;
 if(action==='recall'){
  // Recall moves the teammate for one slot; the existing core does not consume a personal action.
  expect(next.location).toBe('workshop');expect(partnerAvailability(g.view,next).canRecall).toBe(false);
 }else{
  expect(partnerAvailability(g.view,next).lifeBusy).toBe(true);
  expect(g.send({type:'overtime',character:actor.id}).error).toBe('NO_ACTIVE_ACTOR');
 }
});
test('daytime assignment and evening overtime block life actions independently of location',()=>{
 const g=labSession(loadFullContent(),'standard');
 expect(partnerAvailability(g.view,g.view.actors.find(a=>a.id==='qwen')!).lifeBusy).toBe(true);
 const night=evening();expect(night.send({type:'overtime',character:'qwen'}).error).toBeNull();
 const actor=night.view.actors.find(a=>a.id==='qwen')!;
 expect(actor.location).toBe('workshop');
 expect(partnerAvailability(night.view,actor)).toMatchObject({lifeBusy:true,canRecall:false});
 expect(partnerAvailability(night.view,actor).status).toBe('work');
 expect(night.send({type:'campaign',action:'chat',id:'qwen'}).error).toBe('ACTOR_BUSY');
});
test('status prioritizes expedition and occupancy over a different scene',()=>{
 const g=evening();g.send({type:'campaign',action:'visit',id:'workshop'});
 const actor=g.view.actors.find(a=>a.id==='qwen')!;
 expect(partnerAvailability(g.view,actor).status).toBe('elsewhere');
 expect(partnerAvailability(g.view,{...actor,busyUntil:g.view.absoluteSlot+1}).status).toBe('occupied');
 expect(partnerAvailability(g.view,{...actor,location:'expedition',busyUntil:g.view.absoluteSlot+1}).status).toBe('expedition');
});
test('local errors, visits and accept receipts never escape to S1; assign/deliver do',()=>{
 const base:UiFeedback={id:1,code:'INSUFFICIENT_FUNDS',target:{surface:'actor',id:'qwen'},error:true,receipt:null};
 const closed={saves:false,modal:false};
 for(const target of [{surface:'actor',id:'qwen'},{surface:'job',id:'a'},{surface:'saves'}] as const){
  expect(feedbackSurface({...base,target},closed)).toBeNull();
  expect(feedbackSurface({...base,target,error:false,code:'DONE'},closed)).toBeNull();
 }
 for(const kind of ['accept','assign','deliver'] as const){
  expect(feedbackSurface({...base,error:false,target:{surface:'job',id:'a'},receipt:{id:2,kind,title:['','']}},closed)).toBe(kind==='accept'?null:'global');
 }
});
test.each(['EXTERNAL_CHANGE','AUTO_PAUSED','STORAGE_UNAVAILABLE','SAVE_CONFLICT','WRITE_UNCERTAIN'])('paused %s stays visible through ordinary success until acknowledgement or recovery',code=>{
 const error:UiFeedback={id:1,code,target:{surface:'global'},error:true,receipt:null};
 for(const surface of ['job','actor','saves'] as const){
  expect(feedbackSurface(error,{job:surface==='job'?'a':undefined,actor:surface==='actor'?'qwen':undefined,saves:surface==='saves',modal:true})).toBe(surface);
 }
 const success:UiFeedback={id:2,code:'ACCEPTED',target:{surface:'job',id:'a'},error:false,receipt:null};
 expect(nextFeedback(error,success,true)).toBe(error);
 expect(nextFeedback(null,success,true)).toBe(success);
 expect(nextFeedback(error,success,false)).toBe(success);
 expect(nextFeedback(error,{...error,id:3},true).id).toBe(3);
});
test('recall requires same scene or existing remote software, never expedition or a UI lock',()=>{
 const g=evening();expect(g.send({type:'campaign',action:'visit',id:'workshop'}).error).toBeNull();
 const view=g.view,actor=view.actors.find(a=>a.id==='qwen')!;
 expect(partnerAvailability(view,actor).canRecall).toBe(false);
 view.campaign!.software.push('remote');
 expect(partnerAvailability(view,actor).canRecall).toBe(true);
 expect(partnerAvailability(view,actor,true).canRecall).toBe(false);
 expect(partnerAvailability(view,{...actor,location:'expedition'}).canRecall).toBe(false);
});
test('feedback has one owning live surface and never leaks a global advance into a profile',()=>{
 const base:UiFeedback={id:1,code:'SlotResolved',target:{surface:'global'},error:false,receipt:null};
 expect(feedbackSurface(base,{actor:'qwen',saves:false,modal:true})).toBeNull();
 expect(feedbackSurface(base,{saves:false,modal:false})).toBe('global');
 const job={...base,target:commandFeedbackTarget({type:'accept',job:'a'}),receipt:presentationEvent({type:'accept',job:'a'},2,0)};
 expect(feedbackSurface(job,{job:'a',saves:false,modal:true})).toBe('job');
 expect(feedbackSurface(job,{job:'b',saves:false,modal:true})).toBeNull();
 expect(feedbackSurface(job,{actor:'qwen',saves:false,modal:true})).toBeNull();
 const actor={...base,target:{surface:'actor' as const,id:'qwen'},error:true};
 expect(feedbackSurface(actor,{actor:'qwen',saves:false,modal:true})).toBe('actor');
 expect(feedbackSurface(actor,{actor:'llama',saves:false,modal:true})).toBeNull();
 expect(feedbackSurface({...base,target:{surface:'saves'}},{saves:true,modal:true})).toBe('saves');
});
