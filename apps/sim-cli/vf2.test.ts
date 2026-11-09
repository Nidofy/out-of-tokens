import {test,expect} from 'vitest';
import {loadFullContent} from 'oot-content';
import {labSession} from '../web/src/office-lab.js';
import {partnerAvailability} from '../web/src/partner-state.js';
import {commandFeedbackTarget,feedbackSurface,presentationEvent} from '../web/src/presentation-events.js';
import type {UiFeedback} from '../web/src/presentation-events.js';

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
 expect(night.send({type:'campaign',action:'chat',id:'qwen'}).error).toBe('ACTOR_BUSY');
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
