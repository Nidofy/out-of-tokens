import {test,expect} from 'vitest';
import {loadFullContent} from 'oot-content';
import {createInitialState,dispatchCommand,forecastAssignment,settlement,getViewModel} from 'oot-core';
import {GameSession} from 'oot-platform';

test.each([.1,1,4,20])('short work %s forecasts only remaining output without changing RNG/state',remaining=>{
 const c=loadFullContent();c.events=[];c.balance!.eventChance=0;
 const s=createInitialState(c,1),j=s.jobs[0]!;j.work=remaining;j.status='working';j.deadline=100;j.team=[{character:'qwen',role:'worker',mode:'local'}];
 const before=structuredClone(s),f=forecastAssignment(s,c,j);
 expect(s).toEqual(before);expect(f).toEqual(forecastAssignment(s,c,j));
 const r=dispatchCommand(s,{type:'advance'},c);
 expect(r.error).toBeNull();expect(r.state.resources.reduce((n,r)=>n+r.units,0)).toBeCloseTo(f.firstSlot.local,2);
 expect(f.firstSlot.progress).toBeLessThanOrEqual(j.work);
 expect(f.electricity).toBeCloseTo(f.local*.1,2);
});
test('projection counts night waits, warns of deadlines and admits frozen exhausted teams cannot finish',()=>{
 const c=loadFullContent(),s=createInitialState(c,1),j=s.jobs[0]!;s.absoluteSlot=2;j.work=1;j.deadline=3;j.team=[{character:'qwen',role:'worker',mode:'local'}];
 const f=forecastAssignment(s,c,j);expect(f.firstSlot.local).toBe(0);expect(f.completion).toBe(5);expect(f.risks.late).toBe(true);
 s.actors.find(a=>a.id==='qwen')!.energy=0;
 expect(forecastAssignment(s,c,j).completion).toBeNull();
});
test.each([55,60,75,90])('settlement quote agrees with real cash and reputation for quality %s',quality=>{
 const c=loadFullContent(),s=createInitialState(c,1),j=s.jobs[0]!,t=c.commissions.find(t=>t.id===j.template)!;
 t.qualityLines=[60,75,90];t.delivery='retainer';j.status='review';j.quality=quality;j.deadline=1;j.advance=80;j.rewardFactor=1.2;s.absoluteSlot=3;s.campaign!.software.push('crm');
 const quote=settlement(s,c,j),r=dispatchCommand(s,{type:'deliver',job:j.id},c);
 expect(r.error).toBeNull();expect(r.state.cash-s.cash).toBeCloseTo(quote.net,2);expect(r.state.reputation).toBe(Math.max(0,s.reputation+quote.reputation));
 expect(getViewModel(s,c).jobs[0]!.settlement).toEqual(quote);
});
test('failed quality offers rework before breach and quotes full advance clawback at zero late payout',()=>{
 const c=loadFullContent(),s=createInitialState(c,1),j=s.jobs[0]!;j.status='review';j.quality=0;j.deadline=20;j.advance=100;
 expect(settlement(s,c,j)).toMatchObject({canRework:true,canDeliver:false});
 expect(dispatchCommand(s,{type:'deliver',job:j.id},c).state).toBe(s);
 j.quality=100;s.absoluteSlot=40;expect(settlement(s,c,j).net).toBe(-100);
});
test('repeated and invalid assignment previews leave exported saves identical',async()=>{
 const game=new GameSession(loadFullContent(),1),job=game.view.jobs[0]!;
 expect(game.send({type:'accept',job:job.id}).error).toBeNull();const before=await game.exportSave();
 for(let n=0;n<8;n++)game.previewAssignment(job.id,[{character:'qwen',role:'worker',mode:'local'}]);
 expect(game.previewAssignment(job.id,[]).forecast).toBeNull();expect(await game.exportSave()).toBe(before);
});
