import {expect,test} from 'vitest';
import {loadFullContent} from 'oot-content';
import {explainCapacity,createInitialState,getViewModel} from 'oot-core';
import {labSession} from '../web/src/office-lab.js';

test('core explainCapacity activeEfficiency follows active job, role, reservation and overtime',()=>{
 const c=loadFullContent(),g=labSession(c,'standard');
 const baseline=explainCapacity((g.workerSnapshot().state),c,'qwen').activeEfficiency;
 expect(baseline).toBe(.1);
 const snap=g.workerSnapshot();
 const reservation=snap.state.campaign!.office!.reservations.qwen!;
 const job=snap.state.jobs.find(j=>j.id===reservation.job)!;
 const member=job.team.find(m=>m.character==='qwen')!;
 const partner=snap.state.actors.find(a=>a.id!=='qwen')!;
 // Keep an active recruited worker alongside qwen so core previewPeriod actually executes the job when testing non-worker roles.
 job.team.push({character:partner.id,role:'worker',mode:'cloud'});
 for(const role of ['tool','reviewer'] as const){member.role=role;expect(explainCapacity(snap.state,c,'qwen').activeEfficiency).toBe(0);}
 member.role='planner';expect(explainCapacity(snap.state,c,'qwen').activeEfficiency).toBe(.1);
 snap.state.absoluteSlot=2;expect(explainCapacity(snap.state,c,'qwen').activeEfficiency).toBe(0);
 snap.state.overtime.push('qwen',partner.id);expect(explainCapacity(snap.state,c,'qwen').activeEfficiency).toBe(.1);
 job.status='delivered';expect(explainCapacity(snap.state,c,'qwen').activeEfficiency).toBe(0);
 job.status='working';reservation.job='another-job';expect(explainCapacity(snap.state,c,'qwen').activeEfficiency).toBe(0);
 reservation.job=job.id;snap.state.campaign!.office!.items.find(i=>i.id===reservation.item)!.slot=null;
 expect(explainCapacity(snap.state,c,'qwen').activeEfficiency).toBe(0);
 expect(getViewModel(createInitialState(c,1),c).actors.length).toBeGreaterThan(0);
});
