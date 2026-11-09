import {expect,test} from 'vitest';
import {loadFullContent} from 'oot-content';
import {labSession} from '../web/src/office-lab.js';
import {activeStationBonus} from '../web/src/scene-layout.js';

test('scene station bonus follows active job, role, reservation and overtime',()=>{
 const view=labSession(loadFullContent(),'standard').view;
 const reservation=view.office!.reservations.qwen!;
 const job=view.jobs.find(j=>j.id===reservation.job)!;
 const member=job.team.find(m=>m.character==='qwen')!;
 expect(activeStationBonus(view,'qwen')).toBe(.1);
 for(const role of ['tool','reviewer'] as const){member.role=role;expect(activeStationBonus(view,'qwen')).toBe(0);}
 member.role='planner';expect(activeStationBonus(view,'qwen')).toBe(.1);
 view.absoluteSlot=2;expect(activeStationBonus(view,'qwen')).toBe(0);
 view.overtime.push('qwen');expect(activeStationBonus(view,'qwen')).toBe(.1);
 job.status='delivered';expect(activeStationBonus(view,'qwen')).toBe(0);
 job.status='working';reservation.job='another-job';expect(activeStationBonus(view,'qwen')).toBe(0);
 reservation.job=job.id;view.office!.items.find(i=>i.id===reservation.item)!.slot=null;
 expect(activeStationBonus(view,'qwen')).toBe(0);
});
