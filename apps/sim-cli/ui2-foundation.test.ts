import {expect,test} from 'vitest';
import {loadFullContent} from 'oot-content';
import {labSession} from '../web/src/office-lab.js';
import {advancePeriodInfo,resolveGlobalShortcut,resolveProfileTab,isFlagshipUnlocked,topJobSkillWeights,ledgerWindowSummary,stepDampedCamera} from '../web/src/ui2-logic.js';

test('advancePeriodInfo surfaces disabled blockers and urgent review alerts accurately',()=>{
 const g=labSession(loadFullContent(),'standard'),v=g.view;
 expect(advancePeriodInfo(v,true,false,false)).toMatchObject({disabled:true});
 expect(advancePeriodInfo(v,false,true,false)).toMatchObject({disabled:true});
 expect(advancePeriodInfo({...v,bankrupt:true},false,false,true).disabled).toBe(true);
 const reviewJob={...v.jobs[0]!,status:'review' as const,deadline:v.absoluteSlot};
 const urgent=advancePeriodInfo({...v,jobs:[reviewJob,...v.jobs.slice(1)]},false,false,false);
 expect(urgent.disabled).toBe(false);
 expect(urgent.urgentReviewIds).toEqual([reviewJob.id]);
});

test('resolveGlobalShortcut blocks modifier keys, inputs, IME and modal states',()=>{
 const openGuard={blockedModal:false,actorOpen:true};
 expect(resolveGlobalShortcut({key:'1',ctrlKey:true,metaKey:false,altKey:false,isComposing:false,repeat:false},openGuard)).toBeNull();
 expect(resolveGlobalShortcut({key:'2',ctrlKey:false,metaKey:false,altKey:false,isComposing:true,repeat:false},openGuard)).toBeNull();
 expect(resolveGlobalShortcut({key:'3',ctrlKey:false,metaKey:false,altKey:false,isComposing:false,repeat:false,targetTag:'INPUT'},openGuard)).toBeNull();
 expect(resolveGlobalShortcut({key:'4',ctrlKey:false,metaKey:false,altKey:false,isComposing:false,repeat:false},{blockedModal:true,actorOpen:false})).toBeNull();
 expect(resolveGlobalShortcut({key:'ArrowLeft',ctrlKey:false,metaKey:false,altKey:false,isComposing:false,repeat:false},openGuard)).toBeNull();
 expect(resolveGlobalShortcut({key:'[',ctrlKey:false,metaKey:false,altKey:false,isComposing:false,repeat:false},openGuard)).toEqual({type:'actor-step',delta:-1});
 expect(resolveGlobalShortcut({key:'2',ctrlKey:false,metaKey:false,altKey:false,isComposing:false,repeat:false},openGuard)).toEqual({type:'panel',panel:'jobs'});
});

test('resolveProfileTab safely falls back for unrecruited characters without overwriting preference',()=>{
 expect(resolveProfileTab('vitals',false)).toBe('model');
 expect(resolveProfileTab('training',false)).toBe('model');
 expect(resolveProfileTab('stories',false)).toBe('stories');
 expect(resolveProfileTab('vitals',true)).toBe('vitals');
});

test('isFlagshipUnlocked supports both multi-version research and affinity/story resonance',()=>{
 const g=labSession(loadFullContent(),'twelve'),v=g.view;
 expect(isFlagshipUnlocked(v,'bluewhale','bluewhale.r1')).toBe(false);
 const unlockedView={...v,campaign:{...v.campaign!,unlocked:[...v.campaign!.unlocked,'bluewhale.r1']}};
 expect(isFlagshipUnlocked(unlockedView,'bluewhale','bluewhale.r1')).toBe(true);
 expect(isFlagshipUnlocked(v,'grok',null)).toBe(false);
 const bondedView={...v,campaign:{...v.campaign!,relations:{...v.campaign!.relations,grok:{...v.campaign!.relations.grok!,affinity:60}}}};
 expect(isFlagshipUnlocked(bondedView,'grok',null)).toBe(true);
});

test('topJobSkillWeights and ledgerWindowSummary compute bounded display summaries',()=>{
 const top=topJobSkillWeights({code:.5,write:.1,reason:.3,create:.1,media:0,recall:0},2);
 expect(top).toEqual([{skill:'code',weight:.5,pct:50},{skill:'reason',weight:.3,pct:30}]);
 expect(ledgerWindowSummary([{slot:1,reason:'a',amount:120},{slot:2,reason:'b',amount:-45.5}])).toEqual({count:2,inflow:120,outflow:45.5,net:74.5});
});

test('stepDampedCamera snaps instantly on bypass and converges smoothly otherwise',()=>{
 const current={x:0,y:0,scale:1},target={x:200,y:100,scale:1.4};
 expect(stepDampedCamera(current,target,16,true)).toEqual({values:target,settled:true});
 const step1=stepDampedCamera(current,target,16,false);
 expect(step1.settled).toBe(false);
 expect(step1.values.x).toBeGreaterThan(0);
 expect(step1.values.x).toBeLessThan(200);
 const near={x:199.8,y:99.9,scale:1.3999};
 expect(stepDampedCamera(near,target,16,false)).toEqual({values:target,settled:true});
});
