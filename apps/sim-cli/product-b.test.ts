import {test,expect} from 'vitest';
import {loadFullContent,validateContent} from 'oot-content';
import {createInitialState,dispatchCommand,getViewModel,chapterGoal} from 'oot-core';
import type {State,Content} from 'oot-core';
import {hash,restore} from 'oot-persistence';
import {readFileSync} from 'node:fs';
const act=(s:State,c:Content,action:string,id='incubator',target?:string)=>dispatchCommand(s,{type:'campaign',action,id,target},c);
function started(route='build'){const c=loadFullContent(),s=createInitialState(c,1);s.campaign!.chapter=1;const r=act(s,c,'project-start','incubator',route);expect(r.error).toBeNull();return {c,s:r.state};}
test('project definitions reject broken references, duplicate routes and unattainable chapters',()=>{
 const c=loadFullContent();expect(c.campaign!.projects).toHaveLength(1);
 for(const damage of [(d:Content)=>{d.campaign!.projects![0]!.routes[0]!.steps[0]!.template='menu';},(d:Content)=>{d.campaign!.projects![0]!.routes[1]!.id='build';},(d:Content)=>{d.campaign!.maxChapter=0;}]){const bad=structuredClone(c);damage(bad);expect(()=>validateContent(bad)).toThrow('PROJECT_REFERENCE');}
});
test('chapter and route checks are atomic; authored jobs never enter the random board',()=>{
 const c=loadFullContent(),s=createInitialState(c,1),before=hash(s);expect(act(s,c,'project-start','incubator','build').error).toBe('PROJECT_LOCKED');expect(hash(s)).toBe(before);
 s.campaign!.chapter=1;expect(act(s,c,'project-start','incubator','missing').state).toBe(s);
 const {s:running}=started();expect(act(running,c,'project-start','incubator','guide').state).toBe(running);expect(act(running,c,'project-next').error).toBe('PROJECT_NOT_READY');
 let fresh=createInitialState(c,4);fresh.campaign!.chapter=1;for(let i=0;i<32;i++)fresh=dispatchCommand(fresh,{type:'advance'},c).state;expect(fresh.jobs.some(j=>j.template.startsWith('incubator-'))).toBe(false);
});
test.each(['expired','rejected','breached','delivered'] as const)('%s project attempt can be retried once per ended contract without erasing costs',status=>{
 const {s,c}=started();const j=s.jobs.find(j=>j.id===s.campaign!.projects!.incubator!.job)!;j.status=status;j.quality=50;s.cash=59;const before=hash(s);expect(act(s,c,'project-next').error).toBe('INSUFFICIENT_RESOURCES');expect(hash(s)).toBe(before);
 s.cash=100;const r=act(s,c,'project-next');expect(r.error).toBeNull();expect(r.state.cash).toBe(40);expect(r.state.campaign!.projects!.incubator!.history).toHaveLength(2);expect(s.campaign!.projects!.incubator!.history).toHaveLength(1);expect(r.state.jobs.find(x=>x.id===j.id)!.status).toBe(status);expect(act(r.state,c,'project-next').error).toBe('PROJECT_NOT_READY');expect(getViewModel(r.state,c).projects[0]!.accounting.retries).toBe(60);
});
test.each(['build','guide'])('%s route advances only from its own accepted results and grants once',route=>{
 const initial=started(route),c=initial.c;let s=initial.s;const research=s.campaign!.research;
 for(let stage=0;stage<3;stage++){
  const p=s.campaign!.projects!.incubator!,j=s.jobs.find(j=>j.id===p.job)!;j.status='review';j.quality=90;expect(act(s,c,'project-next').error).toBe('PROJECT_NOT_READY');
  j.status='delivered';j.phase=c.commissions.find(t=>t.id===j.template)!.phases!;
  const before=hash(s),r=act(s,c,'project-next');expect(r.error).toBeNull();expect(hash(s)).toBe(before);s=r.state;
 }
 expect(s.campaign!.projects!.incubator!.completed).toBe(true);expect(s.campaign!.research).toBe(research+4);expect(act(s,c,'project-next').error).toBe('PROJECT_COMPLETE');
 s.reputation=15;s.cash=4000;expect(chapterGoal(s,c).ready).toBe(true);expect(act(s,c,'chapter','next').state.campaign!.chapter).toBe(2);
 const view=getViewModel(s,c);view.campaign!.projects!.incubator!.history.push('bad');view.catalog!.projects![0]!.routes[0]!.steps[0]!.quality=0;expect(s.campaign!.projects!.incubator!.history).toHaveLength(3);expect(c.campaign!.projects![0]!.routes[0]!.steps[0]!.quality).toBe(65);
});
test('pitch requires the project as well as solvency; recruit chapter gates preserve old content behavior',()=>{
 const {s,c}=started();s.reputation=100;s.cash=10000;const j=s.jobs[0]!;j.status='delivered';j.quality=90;j.phase=2;j.template='incubator-build';expect(chapterGoal(s,c).ready).toBe(false);expect(act(s,c,'chapter','next').state).toBe(s);
 expect(act(s,c,'recruit','gpt').error).toBeNull();expect(act(s,c,'recruit','gemini').error).toBe('RECRUIT_LOCKED');
});
test('project acceptance uses the contract line, and its bill counts only that project',()=>{
 const {s,c}=started();for(const d of c.campaign!.projects!)for(const route of d.routes)for(const step of route.steps)expect(step.quality).toBe(c.commissions.find(t=>t.id===step.template)!.qualityLines![0]);
 const id=s.campaign!.projects!.incubator!.job;
 s.resources.push({slot:0,job:id,character:'qwen',mode:'cloud',units:10,quota:6,purchased:4,electricity:0},{slot:0,job:id,character:'bluewhale',mode:'local',units:20,quota:0,purchased:0,electricity:2},{slot:0,job:'unrelated',character:'qwen',mode:'cloud',units:100,quota:100,purchased:0,electricity:0});
 s.ledger.push({slot:0,reason:`advance:${id}`,amount:100},{slot:0,reason:`delivery:${id}`,amount:600},{slot:0,reason:'delivery:unrelated',amount:999});
 const before=hash(s),bill=getViewModel(s,c).projects[0]!.accounting;expect(bill).toEqual({receipts:700,cloud:10,purchased:4,electricity:2,retries:0});expect(hash(s)).toBe(before);
});
test('the previous A6 save is explicitly rejected by the new engine and content',()=>{
 const old=readFileSync(new URL('../../harness/a6-seed-1-replay.json',import.meta.url),'utf8');expect(()=>restore(loadFullContent(),old)).toThrow('INCOMPATIBLE_SAVE');
});
