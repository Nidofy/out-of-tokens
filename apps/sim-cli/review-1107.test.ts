import {test,expect} from 'vitest';
import {loadFullContent} from 'oot-content';
import {createInitialState,dispatchCommand,getViewModel} from 'oot-core';

test.each(['local','cloud'] as const)('planner/tool exact team budget works once in %s mode and replays deterministically',mode=>{
 const c=loadFullContent();c.events=[];c.balance!.eventChance=0;
 const s=createInitialState(c,1),j=s.jobs[0]!;j.status='working';j.work=1000;j.deadline=100;
 s.campaign!.software.push('prompt');
 j.team=[{character:'qwen',role:'planner',mode},{character:'llama',role:'tool',mode},{character:'bluewhale',role:'worker',mode}];
 const estimate=getViewModel(s,c).jobs[0]!.resourceEstimate;
 if(mode==='local')s.localCapacity=estimate.local;else{s.quota=estimate.cloud;s.purchased=0;}
 const before=structuredClone(s),r=dispatchCommand(s,{type:'advance'},c);
 expect(r.error).toBeNull();expect(s).toEqual(before);
 expect(r.state.resources.map(x=>x.character)).toEqual(['qwen','llama','bluewhale']);
 expect(r.state.resources.reduce((n,x)=>n+x.units,0)).toBeCloseTo(estimate[mode],2);
 expect(dispatchCommand(s,{type:'advance'},c)).toEqual(r);
 const bad=dispatchCommand(s,{type:'assign',job:j.id,team:[]},c);
 expect(bad.error).not.toBeNull();expect(bad.state).toBe(s);
});

test('commission categories retain their primary skill and expose real quality thresholds',()=>{
 const c=loadFullContent();const main={code:'code',write:'write',research:'recall',design:'create',media:'media',data:'reason'} as const;
 for(const t of c.commissions){const key=main[t.category as keyof typeof main];expect(t.weights[key],t.id).toBeGreaterThan(0);}
 const s=createInitialState(c,1),j=s.jobs[0]!,t=c.commissions.find(t=>t.id===j.template)!;
 t.qualityLines=[60,69,80];j.status='review';j.quality=85;j.deadline=100;
 expect(getViewModel(s,c).jobs[0]!.qualityLines).toEqual([60,69,80]);
 expect(dispatchCommand(s,{type:'deliver',job:j.id},c).state.reputation).toBe(4);
});
