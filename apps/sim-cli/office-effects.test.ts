import {test,expect} from 'vitest';
import {loadFullContent,validateContent} from 'oot-content';
import {createInitialState,dispatchCommand,officeCommand,stationEffects,forecastAssignment} from 'oot-core';
import type {Command,Member} from 'oot-core';
import {GameSession} from 'oot-platform';
import {save,restore} from 'oot-persistence';

function fixture(standard=false,role:Member['role']='worker'){
 const c=loadFullContent();c.events=[];c.balance!.eventChance=0;c.balance!.dailyQuota=10000;c.balance!.localCapacity=10000;
 for(const t of c.commissions)t.workload=1000;
 let s=createInitialState(c,1);const commands:Command[]=[];
 const send=(cmd:Command)=>{const r=dispatchCommand(s,cmd,c);expect(r.error).toBeNull();s=r.state;commands.push(cmd);return r;};
 if(standard){const o=s.campaign!.office!;send(officeCommand(o.items.map(i=>i.id==='f1'?{...i,kind:'standard'}:i),o.revision));}
 const id=s.jobs[0]!.id;send({type:'accept',job:id});
 if(role==='tool')s.campaign!.software.push('mcp'); // Synthetic support boundary; replay test uses the default worker.
 send({type:'assign',job:id,team:[{character:'qwen',role,mode:'cloud'},...(role==='worker'?[]:[{character:'bluewhale',role:'worker' as const,mode:'cloud' as const}])]});
 return {c,commands,send,id,get s(){return s;}};
}

test('standard upgrade increases real output by 10%, keeps per-WP price and saves 2 energy',()=>{
 const a=fixture(),b=fixture(true),aCash=a.s.cash,bCash=b.s.cash;
 expect(aCash-bCash).toBe(370);
 const predicted=forecastAssignment(b.s,b.c,b.s.jobs[0]!).firstSlot;
 a.send({type:'advance'});b.send({type:'advance'});
 const base=a.s.jobs[0]!.progress,upgraded=b.s.jobs[0]!.progress;
 expect(upgraded).toBeCloseTo(Math.round(base*110)/100,1);
 expect(upgraded).toBe(predicted.progress);
 expect(b.s.resources[0]!.units).toBe(predicted.cloud);
 expect(a.s.actors.find(a=>a.id==='qwen')!.energy).toBe(83);
 expect(b.s.actors.find(a=>a.id==='qwen')!.energy).toBe(85);
 expect(predicted.members[0]!.energyCost).toBe(15);
 expect(a.s.cash).toBe(aCash);expect(b.s.cash).toBe(bCash);
});

test.each(['cloud','local'] as const)('%s forecast and partial final work charge only executed output',mode=>{
 const f=fixture(true);f.send({type:'assign',job:f.id,team:[{character:'qwen',role:'worker',mode}]});
 f.s.jobs[0]!.work=1;const before=structuredClone(f.s),forecast=forecastAssignment(f.s,f.c,f.s.jobs[0]!);
 expect(f.s).toEqual(before);expect(forecast.firstSlot.progress).toBe(1);
 f.send({type:'advance'});expect(f.s.jobs[0]!.progress).toBe(1);
 expect(f.s.resources[0]!.units).toBe(forecast.firstSlot[mode]);
 expect(f.s.resources[0]!.units).toBe(f.c.versions.find(v=>v.id==='qwen.2.5')!.price);
});

test('stored and unreserved standard stations never add output or energy effects',()=>{
 const f=fixture();const o=f.s.campaign!.office!;o.items.push({id:'f6',kind:'standard',slot:null},{id:'f7',kind:'standard',slot:'work-4'});
 expect(stationEffects(f.s,f.c,'qwen',f.id,'worker')).toEqual({station:'basic',efficiency:0,energyCost:2});
 expect(stationEffects(f.s,f.c,'qwen','other-job','worker').station).toBeNull();
 expect(stationEffects(f.s,f.c,'mistral',f.id,'worker').station).toBeNull();
});

test.each(['planner','reviewer','tool'] as const)('%s uses its reserved facility; only WP-producing roles gain output',role=>{
 const f=fixture(true,role),r=f.s.campaign!.office!.reservations.qwen!;
 if(role!=='tool')expect(r.zone).toBe('meeting');
 const natural=stationEffects(f.s,f.c,'qwen',f.id,role);
 expect(natural.efficiency).toBe(0);expect(natural.energyCost).toBe(0);
 // Explicit computer-support requirement claims the standard seat before the worker.
 const g=fixture(true);if(role==='tool')g.s.campaign!.software.push('mcp');
 g.c.campaign!.office!.computerVersions.push('qwen.2.5');
 g.send({type:'assign',job:g.id,team:[{character:'qwen',role,mode:'cloud'},{character:'bluewhale',role:'worker',mode:'cloud'}]});
 expect(stationEffects(g.s,g.c,'qwen',g.id,role).efficiency).toBe(role==='planner'?.1:0);
 const predicted=forecastAssignment(g.s,g.c,g.s.jobs[0]!).firstSlot;
 g.send({type:'advance'});expect(g.s.jobs[0]!.progress).toBe(predicted.progress);
 expect(g.s.resources.reduce((n,r)=>n+r.units,0)).toBeCloseTo(predicted.cloud,2);
});

test.each([2,3])('actual overtime in slot %s adds basic-chair fatigue once',slot=>{
 const f=fixture();f.s.absoluteSlot=slot;f.send({type:'overtime',character:'qwen'});
 const predicted=forecastAssignment(f.s,f.c,f.s.jobs[0]!).firstSlot;
 f.send({type:'advance'});expect(f.s.actors.find(a=>a.id==='qwen')!.energy).toBe(100-predicted.members[0]!.energyCost);
 expect(predicted.members[0]!.energyCost).toBe(slot===2?20:24.5);
});

test('stopped workers get no station fatigue; energy clamp and estimate agree at low energy',()=>{
 const f=fixture();f.s.quota=0;f.send({type:'advance'});expect(f.s.resources).toHaveLength(0);expect(f.s.actors.find(a=>a.id==='qwen')!.energy).toBe(100);
 const low=fixture();low.s.actors.find(a=>a.id==='qwen')!.energy=10;
 expect(forecastAssignment(low.s,low.c,low.s.jobs[0]!).firstSlot.members[0]!.energyCost).toBe(10);
 low.send({type:'advance'});expect(low.s.actors.find(a=>a.id==='qwen')!.energy).toBe(0);
});

test('effects are optional for legacy content and invalid furniture effects are rejected',()=>{
 const f=fixture();delete f.c.campaign!.office;
 expect(stationEffects(f.s,f.c,'qwen',f.id,'worker')).toEqual({station:null,efficiency:0,energyCost:0});
 for(const mutate of [(c:ReturnType<typeof loadFullContent>)=>{c.campaign!.office!.catalog[0]!.efficiency=1;},(c:ReturnType<typeof loadFullContent>)=>{c.campaign!.office!.catalog.find(d=>d.id==='coffee')!.energyCost=2;}]){const c=loadFullContent();mutate(c);expect(()=>validateContent(c)).toThrow();}
});

test('in-use upgrade rolls back all state; O4 purchase/work replay is exact',()=>{
 const f=fixture(),before=structuredClone(f.s),o=f.s.campaign!.office!;
 const r=dispatchCommand(f.s,officeCommand(o.items.map(i=>i.id==='f1'?{...i,kind:'standard'}:i),o.revision),f.c);
 expect(r.error).toBe('FURNITURE_IN_USE');expect(r.state).toBe(f.s);expect(f.s).toEqual(before);
 const upgraded=fixture(true);upgraded.send({type:'advance'});upgraded.send({type:'advance'});
 const restored=restore(upgraded.c,save(upgraded.c,1,upgraded.commands,upgraded.s));expect(restored.state).toEqual(upgraded.s);
});

test('0.15 office-1 saves are rejected without replacing the current session',async()=>{
 const c=loadFullContent(),session=new GameSession(c,1),text=await session.exportSave(),old=JSON.parse(text);old.engineVersion='0.15.0';old.contentVersion='office-1';
 await expect(session.importSave(JSON.stringify(old))).rejects.toThrow('INCOMPATIBLE_SAVE');expect(await session.exportSave()).toBe(text);
});
