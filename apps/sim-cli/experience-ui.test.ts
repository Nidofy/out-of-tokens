import {expect,test} from 'vitest';
import {loadFullContent} from 'oot-content';
import {GameSession} from 'oot-platform';
import {labSession} from '../web/src/office-lab.js';
import {
 backupPolicyCopy,
 buildSampleTeamDraft,
 explainLiveTeamFit,
 financeNetSolvencyNote,
 lineageResetNoticeCopy,
 messengerStatusCopy,
 resolveReasonCopy,
 saveAlertBannerCopy,
 saveStatusPillText,
 switchConfirmCopy
} from '../web/src/experience-ui-copy.js';
import {
 MAX_UI_LINEAGES,
 UI_LINEAGES_KEY,
 countUnreadThreads,
 createMemoryUiStore,
 isThreadUnread,
 markThreadRead,
 readThreadReadIds,
 resumeLearning,
 skipAllLearning,
 skipLearningNode,
 readLearningPrefs,
 writeLastTeamDraft,
 readLastTeamDraft,
 filterValidLastTeamMembers
} from '../web/src/experience-ui-state.js';
import {shouldConfirmBeforeSwitch,switchReasonFromSaveStatus} from '../web/src/use-game.js';

test('oot-ui:<lineageId>:* isolates metadata per lineage and evicts LRU beyond 8 namespaces without touching non-oot-ui keys',()=>{
 const store=createMemoryUiStore();
 store.setItem('unrelated-domain-or-pref','keep-me');
 for(let i=1;i<=10;i++){
  const id=`lineage-${i}`;
  markThreadRead(store,id,`t-${i}`);
  skipLearningNode(store,id,'accept');
  writeLastTeamDraft(store,id,[{character:'qwen',role:'worker',mode:'cloud'}]);
 }
 const list=JSON.parse(store.getItem(UI_LINEAGES_KEY)!) as string[];
 expect(list).toHaveLength(MAX_UI_LINEAGES);
 expect(list[0]).toBe('lineage-3');
 expect(list[7]).toBe('lineage-10');
 expect(readThreadReadIds(store,'lineage-1').size).toBe(0);
 expect(readThreadReadIds(store,'lineage-2').size).toBe(0);
 expect(readThreadReadIds(store,'lineage-3').has('t-3')).toBe(true);
 expect(readLearningPrefs(store,'lineage-10').skippedNodes).toEqual(['accept']);
 expect(readLastTeamDraft(store,'lineage-1')).toEqual([]);
 expect(readLastTeamDraft(store,'lineage-10')).toHaveLength(1);
 expect(store.getItem('unrelated-domain-or-pref')).toBe('keep-me');

 skipAllLearning(store,'lineage-10',true);
 expect(readLearningPrefs(store,'lineage-10').skippedAll).toBe(true);
 resumeLearning(store,'lineage-10');
 expect(readLearningPrefs(store,'lineage-10')).toEqual({skippedNodes:[],skippedAll:false});
});

test('EXP-05: group chat separates read vs replied without dispatching commands or losing later reply reward',async()=>{
 const store=createMemoryUiStore();
 const g=new GameSession(loadFullContent(),1);
 const initialThreads=g.view.living.threads;
 expect(initialThreads.length).toBeGreaterThanOrEqual(1);
 const target=initialThreads[0]!;
 const saveBefore=await g.exportSave();
 const affBefore=g.view.campaign!.relations[target.replies[0]!.targetActor]!.affinity;

 expect(countUnreadThreads(initialThreads,readThreadReadIds(store,'run-a'))).toBe(initialThreads.length);
 expect(isThreadUnread(target,readThreadReadIds(store,'run-a'))).toBe(true);

 const readIds=markThreadRead(store,'run-a',target.id);
 expect(isThreadUnread(target,readIds)).toBe(false);
 expect(countUnreadThreads(g.view.living.threads,readIds)).toBe(initialThreads.length-1);
 // Reading never mutates domain state, affinity, or save bytes.
 expect(await g.exportSave()).toBe(saveBefore);
 expect(g.view.campaign!.relations[target.replies[0]!.targetActor]!.affinity).toBe(affBefore);
 // Player can still reply later once for the reward.
 const reply=target.replies[0]!;
 const res=g.send({type:'campaign',action:'chat-reply',id:target.id,target:'0'});
 expect(res.error).toBeNull();
 expect(g.view.campaign!.relations[reply.targetActor]!.affinity).toBe(affBefore+2);
 // Unread status in a fresh run lineage remains untouched.
 expect(isThreadUnread(target,readThreadReadIds(store,'run-b'))).toBe(true);
 expect(messengerStatusCopy(false).readPendingBadge).toContain('已读');
});

test('A-W1-6: live first-order forecast fit explains pass line and picks editable sample team dynamically without hardcoded ranges',async()=>{
 const g=new GameSession(loadFullContent(),1);
 const menu=g.view.jobs.find(j=>j.template==='menu')!;
 const mistralTeam=[{character:'mistral',role:'worker' as const,mode:'cloud' as const}];
 const qwenTeam=[{character:'qwen',role:'worker' as const,mode:'cloud' as const}];

 const mistralPreview=g.previewAssignment(menu.id,mistralTeam);
 const mistralFit=explainLiveTeamFit(g.view,menu,mistralTeam,mistralPreview,false);
 expect(mistralFit.passLine).toBe(menu.passQuality);
 expect(mistralFit.qualityRange).toEqual(mistralPreview.forecast!.quality);
 expect(mistralFit.meetsPassFloor).toBe(false);
 expect(mistralFit.headline).toContain(String(menu.passQuality));

 const qwenPreview=g.previewAssignment(menu.id,qwenTeam);
 const qwenFit=explainLiveTeamFit(g.view,menu,qwenTeam,qwenPreview,true);
 expect(qwenFit.meetsPassFloor).toBe(true);
 expect(qwenFit.qualityRange).toEqual(qwenPreview.forecast!.quality);

 const saveBefore=await g.exportSave();
 const sample=buildSampleTeamDraft(g.view,menu,(id,team)=>g.previewAssignment(id,team));
 expect(sample).not.toBeNull();
 const samplePreview=g.previewAssignment(menu.id,sample!);
 expect(samplePreview.error).toBeNull();
 expect(samplePreview.forecast!.quality![0]).toBeGreaterThanOrEqual(menu.passQuality);
 // Sampling never mutates session state.
 expect(await g.exportSave()).toBe(saveBefore);
});

test('reason copy maps known codes and deterministically falls back on unknown codes; backup copy reflects boundary policy',()=>{
 expect(resolveReasonCopy('sleep-skipped-by-activity',false)).toContain('跳过今晚睡眠');
 expect(resolveReasonCopy('sleep-skipped-by-activity',true)).toContain('skips sleep');
 expect(resolveReasonCopy('UNMAPPED_FUTURE_REASON',false)).toContain('UNMAPPED_FUTURE_REASON');
 expect(resolveReasonCopy('UNMAPPED_FUTURE_REASON',true)).toContain('UNMAPPED_FUTURE_REASON');
 expect(resolveReasonCopy('activity-energy',false)).toContain('精力');
 expect(resolveReasonCopy('activity-mood',true).toLowerCase()).toContain('mood');
 expect(resolveReasonCopy('activity-affinity',false)).toContain('好感');
 expect(resolveReasonCopy('SWITCH_REQUIRES_CONFIRMATION',true).toLowerCase()).toContain('confirm');
 expect(lineageResetNoticeCopy(false)).toContain('重置');
 expect(lineageResetNoticeCopy(true).toLowerCase()).toContain('lineage reset');
 expect(backupPolicyCopy(false).summaryTitle).toContain('边界节点');
 expect(backupPolicyCopy(true).summaryHint).toContain('DayEnd');
 expect(financeNetSolvencyNote(false)).not.toContain('利润');
 expect(financeNetSolvencyNote(true).toLowerCase()).toContain('not earned profit');
});

test('save status & two-state switch confirmation guard trigger strictly on paused/error/storage-unavailable',()=>{
 const base={revision:3,lineageId:'run-1'};
 expect(shouldConfirmBeforeSwitch({...base,kind:'idle'})).toBe(false);
 expect(shouldConfirmBeforeSwitch({...base,kind:'dirty'})).toBe(false);
 expect(shouldConfirmBeforeSwitch({...base,kind:'saving'})).toBe(false);
 expect(shouldConfirmBeforeSwitch({...base,kind:'saved'})).toBe(false);

 expect(shouldConfirmBeforeSwitch({...base,kind:'paused',cause:'external-change'})).toBe(true);
 expect(switchReasonFromSaveStatus({...base,kind:'paused',cause:'external-change'})).toBe('paused');
 expect(shouldConfirmBeforeSwitch({...base,kind:'error',code:'STORAGE_WRITE_FAILED'})).toBe(true);
 expect(switchReasonFromSaveStatus({...base,kind:'error'})).toBe('error');
 expect(shouldConfirmBeforeSwitch({...base,kind:'imported-unsaved',storageUnavailable:true})).toBe(true);
 expect(switchReasonFromSaveStatus({...base,kind:'imported-unsaved',storageUnavailable:true})).toBe('storage-unavailable');

 expect(saveStatusPillText({...base,kind:'imported-unsaved'},false)).toBe('已载入但尚未保存');
 expect(saveAlertBannerCopy({...base,kind:'imported-unsaved',storageUnavailable:false},false)?.detail).toContain('尚未写入自动档');
 expect(saveAlertBannerCopy({...base,kind:'imported-unsaved',storageUnavailable:true},false)?.detail).toContain('存储不可用');
 expect(saveAlertBannerCopy({...base,kind:'paused',cause:'conflict'},false)?.title).toContain('暂停');
 expect(saveAlertBannerCopy({...base,kind:'error',code:'STORAGE_WRITE_FAILED',storageUnavailable:false},true)?.canRetry).toBe(true);
 expect(switchConfirmCopy('load','自动档','paused',false).warning).toContain('当前内存进度尚未保存，将被所选存档替换');
 expect(switchConfirmCopy('load','Autosave','paused',true).exportBtn).toContain('Export');
});

test('filterValidLastTeamMembers revalidates busy actors and mode compatibility against current view',()=>{
 const g=labSession(loadFullContent(),'working');
 const res=filterValidLastTeamMembers([
  {character:'qwen',role:'worker',mode:'cloud'},
  {character:'deepseek',role:'reviewer',mode:'local'},
  {character:'bluewhale',role:'planner',mode:'cloud'}
 ],g.view);
 expect(res.dropped).toContain('qwen'); // already busy on working job
 expect(res.dropped).toContain('deepseek'); // cloud-only initial version cannot use local
 expect(res.valid).toEqual([{character:'bluewhale',role:'planner',mode:'cloud'}]);
});
