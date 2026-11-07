import {test,expect} from 'vitest';
import {loadFullContent} from 'oot-content';
import {createInitialState,dispatchCommand,getViewModel} from 'oot-core';

test('endless preview excludes unavailable support and uses local planner upgrades',()=>{
 const c=loadFullContent(),s=createInitialState(c,1),j=s.jobs[0]!;j.status='working';j.work=1000;
 j.team=[{character:'qwen',role:'planner',mode:'local'},{character:'llama',role:'worker',mode:'cloud'}];
 const before=getViewModel(s,c).jobs[0]!.resourceEstimate.cloud;s.campaign!.software.push('vllm');
 expect(getViewModel(s,c).jobs[0]!.resourceEstimate.cloud).toBeGreaterThan(before);
 s.campaign!.finale!.endless=true;s.absoluteSlot=28;
 j.team=[{character:'bluewhale',role:'planner',mode:'cloud'},{character:'llama',role:'worker',mode:'local'}];
 const withPlanner=getViewModel(s,c).jobs[0]!.resourceEstimate.local;j.team=j.team.slice(1);
 expect(withPlanner).toBe(getViewModel(s,c).jobs[0]!.resourceEstimate.local);
});

test('late chapter zero solvency recovers campaign access',()=>{
 const c=loadFullContent();c.events=[];const s=createInitialState(c,1);
 s.absoluteSlot=60;s.cash=20000;s.debtPaid=true;s.campaign!.chapterZero='missed';s.jobs[0]!.phase=1;
 const r=dispatchCommand(s,{type:'advance'},c);
 expect(r.state.campaign!.chapterZero).toBe('passed');
 expect(dispatchCommand(r.state,{type:'campaign',action:'chapter',id:'next'},c).error).toBeNull();
});
test('expedition travellers are absent locally and provisioned while away',()=>{
 const c=loadFullContent();c.events=[];c.balance!.eventChance=0;let s=createInitialState(c,1);
 s.campaign!.chapter=3;s.campaign!.relations.qwen!.hunger=40;
 s=dispatchCommand(s,{type:'campaign',action:'expedition',id:'qwen',target:'paper'},c).state;
 expect(getViewModel(s,c).actors.find(a=>a.id==='qwen')!.location).toBe('expedition');
 for(let n=0;n<16;n++)s=dispatchCommand(s,{type:'advance'},c).state;
 expect(s.campaign!.relations.qwen!.hunger).toBe(40);
 expect(s.actors.find(a=>a.id==='qwen')!.mood).toBe(70);
 expect(s.campaign!.finale!.souvenirs).toContain('paper');
});
