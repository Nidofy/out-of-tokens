import {clearLocalFeedback} from '../web/src/presentation-events.js';
import {labSession} from '../web/src/office-lab.js';
import {test,expect} from 'vitest';
import {GameSession} from 'oot-platform';
import {content} from '../web/src/content.js';
import {trackingState,readTrackingPin,writeTrackingPin,commissionNotice,showSettlement,trackerText,waitingText,commissionCategory,resolveTrackedCommission,trackingCandidates,commissionGroup,commissionObjective} from '../web/src/commission-tracking.js';
test('tracking respects manual pins and deterministic urgency, then falls back after closure',()=>{
 const view=new GameSession(content,1).view,base=view.jobs[0]!;
 const jobs=[{...base,id:'working-late',status:'working' as const,deadline:9},{...base,id:'working-early',status:'working' as const,deadline:3},{...base,id:'accepted',status:'accepted' as const},{...base,id:'review',status:'review' as const},{...base,id:'posted',status:'posted' as const}];
 const v={jobs,projects:[]};expect(trackingCandidates(v)).toEqual(['review','accepted','working-early','working-late','posted']);
 expect(resolveTrackedCommission(v,'working-late')).toBe('working-late');expect(resolveTrackedCommission(v,'missing')).toBe('review');
 expect(resolveTrackedCommission({jobs:jobs.map(j=>({...j,status:'delivered' as const})),projects:[]},'review')).toBe(null);
 expect(resolveTrackedCommission({jobs:[],projects:[]},null)).toBe(null);
});
test('project pins and fallback precede available jobs, completed projects are omitted',()=>{
 const view=new GameSession(content,1).view,project=view.projects[0]!;
 const v={jobs:view.jobs,projects:[{...project,id:'p',completed:false}]};
 expect(resolveTrackedCommission(v,null)).toBe('project:p');expect(resolveTrackedCommission(v,'project:p')).toBe('project:p');
 expect(resolveTrackedCommission({...v,projects:[{...v.projects[0]!,completed:true}]},'project:p')).toBe(view.jobs[0]!.id);
});
test('groups and next action distinguish clarification wait, hidden requirements and scope',()=>{
 const base=new GameSession(content,1).view.jobs[0]!;
 expect(commissionGroup({...base,status:'posted',hidden:0,proposals:[]})).toBe('ready');
 expect(commissionGroup({...base,status:'waiting'})).toBe('working');
 expect(commissionGroup({...base,status:'posted',hidden:1})).toBe('unclear');
 expect(commissionObjective({...base,status:'posted',clarifyingUntil:2},1,true)).toContain('Awaiting');
 expect(commissionObjective({...base,status:'posted',clarifyingUntil:0,hidden:1},1,true)).toContain('Clarify');
 for(const status of ['accepted','working','review','waiting','delivered','breached'] as const){expect(commissionObjective({...base,status},1,true)).not.toBe(commissionObjective({...base,status},1,false));}
});

test('project-generated jobs open the job workbench, not the project directory',()=>{
 const view=new GameSession(content,1).view,job={...view.jobs[0]!,id:'project:incubator:0',status:'review' as const};
 expect(commissionCategory({...view,jobs:[job]},job.id,'posted')).toBe('active');
 expect(commissionCategory(view,null,'posted')).toBe('posted');
});

test('effective tracking stays synchronized when pinning, releasing and closing a job',()=>{
 const view=new GameSession(content,1).view,auto=trackingState(view,null),other=view.jobs[1]!.id;
 expect(auto).toEqual({id:view.jobs[0]!.id,pinned:false});
 expect(trackingState(view,other)).toEqual({id:other,pinned:true});
 expect(trackingState(view,null)).toEqual(auto);
 expect(trackingState({...view,jobs:view.jobs.map(j=>j.id===other?{...j,status:'rejected' as const}:j)},other)).toEqual(auto);
});
test('Lab tracking never accesses real UI storage and optional storage failures are harmless',()=>{
 let calls=0;const unavailable={getItem(){calls++;throw Error('blocked');},setItem(){calls++;throw Error('blocked');},removeItem(){calls++;throw Error('blocked');}};
 expect(readTrackingPin(true,unavailable)).toBe(null);writeTrackingPin(true,unavailable,'0-0');expect(calls).toBe(0);
 expect(readTrackingPin(false,unavailable)).toBe(null);expect(()=>writeTrackingPin(false,unavailable,null)).not.toThrow();
});
test('waiting after an actual phase settlement is a transition, not a failed score',()=>{
 const view=labSession(content,'waiting').view,j=view.jobs.find(j=>j.status==='waiting')!;
 expect(j.quality).toBe(0);expect(j.settlement.tier).toBe('fail');expect(showSettlement(j.status)).toBe(false);
 expect(waitingText(j,true)).toContain(`Phase ${j.phase}/${j.phases} delivered`);
 expect(trackerText(view,j.id,true)).not.toContain('0/');expect(commissionObjective(j,view.absoluteSlot,true)).toContain('Next phase');
 for(const status of ['review','delivered','breached'])expect(showSettlement(status)).toBe(true);
});
test('project and global notices remain visible without a selected job, while previous job errors clear',()=>{
 const global={id:1,code:'PROJECT_LOCKED',target:{surface:'global' as const},error:true,receipt:null};
 for(const id of [null,'project:incubator','0-0'])expect(commissionNotice(global,id)).toBe(true);
 const local={...global,target:{surface:'job' as const,id:'0-0'}};
 expect(commissionNotice(local,'0-0')).toBe(true);expect(commissionNotice(local,'0-1')).toBe(false);
 expect(clearLocalFeedback(local,{surface:'job',id:'0-0'})).toBe(null);
 expect(clearLocalFeedback(global,{surface:'job',id:'0-0'})).toBe(global);
});
test('history project jobs route to history and state copy distinguishes available and unassigned',()=>{
 const view=new GameSession(content,1).view,base=view.jobs[0]!;
 for(const status of ['delivered','breached'] as const)expect(commissionCategory({...view,jobs:[{...base,id:'project:incubator:0',status}]},'project:incubator:0','active')).toBe('history');
 expect(trackerText(view,base.id,true)).toContain('Brief clear');
 expect(trackerText({...view,jobs:[{...base,status:'accepted'}]},base.id,true)).toMatch(/^Assign team/);
});
