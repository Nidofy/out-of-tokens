import {expect,test} from 'vitest';
import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {loadFullContent} from 'oot-content';
import {CheckpointCoordinator,GameSession,switchImportedSession} from 'oot-platform';
import {experienceFixture} from 'oot-platform/fixtures';
import {defaultSaveEncoder} from 'oot-platform/worker';
import {LabSaves,labSession} from '../web/src/office-lab.js';
import {describeActivityPreview,formatAdvanceDisplay} from '../web/src/experience-adapter.js';
import {experienceArt} from '../web/src/experience-art.js';
import {encodeViaWorkerProtocol} from '../web/src/save-encoder-host.js';
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

test('H2: LabSaves preserves boundary backups across 50 checkpoint writes and honors hosted honest copy',async()=>{
 const lab=new LabSaves();
 // Initial boundary write + 50 ordinary checkpoints must never pollute backup-1..5
 let rev=await lab.write('auto','save-0',0,'boundary',{lineageId:'run-alpha'});
 expect(rev).toBe(1);
 for(let i=1;i<=50;i++){
  rev=await lab.write('auto',`ckpt-${i}`,rev,'checkpoint',{lineageId:'run-alpha'});
 }
 expect((await lab.read('backup-1'))).toBeNull();
 // Next boundary write rotates previous auto ('ckpt-50') + meta into backup-1
 rev=await lab.write('auto','boundary-1',rev,'boundary',{lineageId:'run-alpha'});
 expect((await lab.read('backup-1'))?.text).toBe('ckpt-50');
 expect((await lab.read('backup-1'))?.meta?.lineageId).toBe('run-alpha');
 // 3-arg legacy write compatibility preserved
 await expect(lab.write('manual-1','manual-save',0)).resolves.toBe(1);
 await expect(lab.write('auto','stale',0,'checkpoint')).rejects.toThrow('SAVE_CONFLICT');
 expect(backupPolicyCopy(false,true).summaryTitle).toContain('宿主端');
 expect(backupPolicyCopy(true,true).summaryTitle.toLowerCase()).toContain('host');
});

test('H2: Worker save-encoder protocol matches defaultSaveEncoder byte-for-byte including throughCommand prefix',async()=>{
 const c=loadFullContent();
 const g=new GameSession(c,1);
 const job=g.view.jobs.find(j=>j.template==='menu')!;
 expect(g.send({type:'accept',job:job.id}).error).toBeNull();
 expect(g.send({type:'assign',job:job.id,team:[{character:'qwen',role:'worker',mode:'cloud'}]}).error).toBeNull();
 expect(g.send({type:'advance'}).error).toBeNull();

 const snap=g.checkpointSnapshot();
 const fullDefault=await defaultSaveEncoder.encode(snap.input);
 const fullWorker=await encodeViaWorkerProtocol(snap.input);
 expect(fullWorker).toBe(fullDefault);

 const prefixInput={...snap.input,throughCommand:2};
 const prefixDefault=await defaultSaveEncoder.encode(prefixInput);
 const prefixWorker=await encodeViaWorkerProtocol(prefixInput);
 expect(prefixWorker).toBe(prefixDefault);
 expect(prefixWorker).not.toBe(fullWorker);

 await expect(encodeViaWorkerProtocol({...snap.input,throughCommand:99})).rejects.toThrow('INVALID_CHECKPOINT_PREFIX');
});

test('H2: CheckpointCoordinator and switchImportedSession enforce drain on normal switch and confirmed abandonPending on paused switch',async()=>{
 const c=loadFullContent();
 const g=new GameSession(c,1,'lineage-main');
 const other=new GameSession(c,2,'lineage-other');
 const exportedOther=await other.exportSave();
 const storage=new LabSaves();
 let coord=new CheckpointCoordinator(()=>g.checkpointSnapshot(),storage,0,defaultSaveEncoder);

 expect(g.send({type:'advance'}).error).toBeNull();
 coord.enqueue('command');
 // Pause via external-change before flush finishes
 storage.onExternalChange?.();
 expect(coord.currentStatus.kind).toBe('paused');
 await expect(switchImportedSession(g,coord,exportedOther)).rejects.toThrow('SWITCH_REQUIRES_CONFIRMATION');
 // Cancellation / bad JSON keeps current lineage and queue intact
 await expect(switchImportedSession(g,coord,'{not-json',{confirmed:true})).rejects.toThrow();
 expect(g.lineageId).toBe('lineage-main');

 // Confirmed switch on valid save abandons pending, switches identity, returns saved:false
 const res=await switchImportedSession(g,coord,exportedOther,{confirmed:true});
 expect(res.saved).toBe(false);
 expect(g.lineageId).toBe(res.lineageId);
 // Normal drain on a clean coordinator succeeds without confirmed flag
 coord=new CheckpointCoordinator(()=>g.checkpointSnapshot(),storage,0,defaultSaveEncoder);
 coord.enqueue('import');
 const drained=await coord.drain();
 expect(drained.kind).toBe('saved');
 coord.dispose();
});

test('H3: previewNextPeriod and previewActivity adapters consume core previews across C0 fixtures and 7 learning nodes',async()=>{
 const c=loadFullContent();
 const g=new GameSession(c,1);

 // Night activity at slot 3 flags skipsNightRecovery; group chat confirms 0 slots
 const nightFx=experienceFixture('night-e40-load5',c);
 expect(nightFx.command).not.toBeNull();
 const gNight=new GameSession(c,1);
 await gNight.importSave(await gNight.exportSave()); // baseline valid save
 const trainFx=experienceFixture('training',c);
 const otFx=experienceFixture('overtime',c);
 expect(otFx.command).not.toBeNull();

 // Run live GameSession checks for chat-reply (0 slots), clarify, train (8 slots -> library), align (4 slots -> library), and night sleep skip
 const thread=g.view.living.threads[0]!;
 const chatSummary=describeActivityPreview(g.previewActivity({type:'campaign',action:'chat-reply',id:thread.id,target:'0'}),false);
 expect(chatSummary.legal).toBe(true);
 expect(chatSummary.occupiedSlots).toBe(0);
 expect(chatSummary.compactText).toContain('0 槽');

 // Advance to Night (slot 3) to test night-time activity preview & shared nightNoOvertime advance summary
 for(let i=0;i<3;i++)expect(g.send({type:'advance'}).error).toBeNull();
 expect(g.view.absoluteSlot%4).toBe(3);
 const advNight=formatAdvanceDisplay(g.previewNextPeriod(),false,false,false,g.view.jobs);
 expect(advNight.nightNoOvertime).toBe(true);
 expect(advNight.resting.length).toBeGreaterThan(0);

 const targetActor=g.view.actors.find(a=>!a.busy&&a.location!=='expedition')!;
 if(targetActor.location!==g.view.campaign!.scene){
  expect(g.send({type:'campaign',action:'visit',id:targetActor.location}).error).toBeNull();
 }
 const nightChat=describeActivityPreview(g.previewActivity({type:'campaign',action:'chat',id:targetActor.id}),false);
 expect(nightChat.legal).toBe(true);
 expect(nightChat.skipsNightRecovery).toBe(true);
 expect(nightChat.compactText).toContain('跳过今晚睡眠');

 // Train/align with research >=5 verifies 8/4 slots + library relocation deterministically
 const labLocal=labSession(c,'twelve');
 for(let step=0;step<8&&(labLocal.view.campaign?.research??0)<5;step++){
  if(labLocal.view.campaign?.scene!=='library')labLocal.send({type:'campaign',action:'visit',id:'library'});
  for(const a of labLocal.view.actors.filter(x=>!x.busy&&x.location==='library')){
   labLocal.send({type:'campaign',action:'study',id:a.id});
  }
  labLocal.send({type:'advance'});
 }
 expect(trainFx.command?.type).toBe('campaign');
 let verifiedTrain=false;
 for(const a of labLocal.view.actors){
  const p=labLocal.previewActivity({type:'campaign',action:'train',id:a.id,target:'code'});
  if(p.legal){
   const d=describeActivityPreview(p,false);
   expect(d.occupiedSlots).toBe(8);
   expect(d.relocatesTo).toBe('library');
   const ap=describeActivityPreview(labLocal.previewActivity({type:'campaign',action:'align',id:a.id}),false);
   expect(ap.occupiedSlots).toBe(4);
   expect(ap.relocatesTo).toBe('library');
   verifiedTrain=true;
   break;
  }
 }
 expect(verifiedTrain).toBe(true);

 // ExperienceProjection goal/receipt codes & whitelist art samples resolve cleanly
 expect(resolveReasonCopy('choose-commission',false)).toContain('接单');
 expect(resolveReasonCopy('delivery-passed',true).toLowerCase()).toContain('pass');
 expect(experienceArt('outcome-tea-menu')).toBe('./art/experience/outcome-tea-menu.webp');
 expect(experienceArt('vignette-rest-corner')).toBe('./art/experience/vignette-rest-corner.webp');
 expect(experienceArt('outcome-bookshop-guide')).toBeNull();

 // Learning facts from real ExperienceView remain isolated per lineage
 const gLearn=new GameSession(c,1,'lineage-learn');
 const jobMenu=gLearn.view.jobs.find(j=>j.template==='menu')!;
 expect(gLearn.send({type:'accept',job:jobMenu.id}).error).toBeNull();
 const expView=gLearn.getExperienceView();
 expect(expView.learning).toHaveLength(7);
 expect(expView.learning.find(n=>n.node==='accept')?.observed).toBe(true);
 expect(expView.learning.find(n=>n.node==='deliver')?.observed).toBe(false);

 // Production module graph (built in apps/web/dist) proves fixtures never enter production
 const graphPath=resolve('apps/web/dist/assets/experience-module-graph.json');
 if(existsSync(graphPath)){
  const graph=JSON.parse(readFileSync(graphPath,'utf8')) as {fixtureReachable:boolean};
  expect(graph.fixtureReachable).toBe(false);
 }
});
