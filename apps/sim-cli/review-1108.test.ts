import {test,expect} from 'vitest';
import {loadFullContent} from 'oot-content';
import {createInitialState,dispatchCommand,forecastAssignment} from 'oot-core';
import {GameSession} from 'oot-platform';
import {stationLayout} from '../web/src/scene-layout.js';
import {scenePageSize} from '../web/src/scene-spec.js';
import {enqueuePresentation,presentationEvent} from '../web/src/presentation-events.js';

test('presentation receipts are bounded, deterministic and independent from commands',()=>{
 const command={type:'deliver' as const,job:'example'},event=presentationEvent(command,1,42)!;
 expect(event.title[0]).toContain('42.00');expect(command).toEqual({type:'deliver',job:'example'});
 let queue=[event];for(let i=2;i<9;i++)queue=enqueuePresentation(queue,presentationEvent(command,i,0));
 expect(queue.map(e=>e.id)).toEqual([5,6,7,8]);expect(presentationEvent({type:'advance'},9,0)).toBeNull();
});

test('protected clarification survives full save replay',async()=>{
 const c=loadFullContent(),game=new GameSession(c,1),job=game.view.jobs.find(j=>j.template==='website')!;
 expect(game.send({type:'clarify',job:job.id,character:'qwen'}).error).toBeNull();
 for(let n=0;n<4;n++)expect(game.send({type:'advance'}).error).toBeNull();
 const restored=new GameSession(c,9);await restored.importSave(await game.exportSave());
 expect(restored.view).toEqual(game.view);expect(restored.view.jobs.find(j=>j.id===job.id)!.status).toBe('posted');
});

test('hypothetical posted assignment does not accept, charge or change saved replay',async()=>{
 const game=new GameSession(loadFullContent(),1),j=game.view.jobs[0]!,before=await game.exportSave();
 const team=[{character:'qwen',role:'worker' as const,mode:'local' as const}];
 const quote=game.previewAssignment(j.id,team);expect(quote.error).toBeNull();expect(quote.forecast?.completion).not.toBeNull();
 expect(await game.exportSave()).toBe(before);expect(game.previewAssignment(j.id,[]).error).not.toBeNull();
 expect(game.send({type:'accept',job:j.id}).error).toBeNull();expect(game.previewAssignment(j.id,team)).toEqual(quote);
});
test('clarified offers survive next daylight and then expire, including failed attempts',()=>{
 const c=loadFullContent();c.events=[];c.balance!.eventChance=0;
 let s=createInitialState(c,1);const id=s.jobs.find(j=>j.template==='website')!.id;
 const attempt=dispatchCommand(s,{type:'clarify',job:id,character:'qwen'},c);expect(attempt.error).toBeNull();s=attempt.state;
 while(s.absoluteSlot<4)s=dispatchCommand(s,{type:'advance'},c).state;
 expect(s.jobs.find(j=>j.id===id)!.status).toBe('posted');
 expect(dispatchCommand(s,{type:'accept',job:id},c).error).toBeNull();
 while(s.absoluteSlot<8)s=dispatchCommand(s,{type:'advance'},c).state;
 expect(s.jobs.find(j=>j.id===id)!.status).toBe('expired');
});
test('chapter zero keeps its curated board beyond day seven',()=>{
 const c=loadFullContent(),s=createInitialState(c,1);s.absoluteSlot=31;
 const r=dispatchCommand(s,{type:'advance'},c);expect(r.error).toBeNull();
 for(const j of r.state.jobs.filter(j=>j.posted===32))expect(c.campaign!.starterJobs).toContain(j.template);
});
test('resource warnings use only the remaining work',()=>{
 const c=loadFullContent(),s=createInitialState(c,1),j=s.jobs[0]!;j.work=1;j.team=[{character:'qwen',role:'worker',mode:'cloud'}];s.quota=7;s.purchased=0;
 const f=forecastAssignment(s,c,j);expect(f.firstSlot.cloud).toBe(7);expect(f.risks.cloud).toBe(false);
});
test.each([[390,844],[680,900],[1280,720],[1920,1080]])('paged scene keeps names separated and actors legible at %s × %s',(w,h)=>{
 const points=stationLayout(w,h,scenePageSize(w));
 for(const p of points){expect(p.scale*150).toBeGreaterThanOrEqual(75);expect(p.x-61).toBeGreaterThanOrEqual(0);expect(p.x+61).toBeLessThanOrEqual(w);}
 for(let i=1;i<points.length;i++)expect(points[i]!.x-points[i-1]!.x).toBeGreaterThanOrEqual(122);
});
