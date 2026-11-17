import {IDBFactory} from 'fake-indexeddb';
import {expect,test} from 'vitest';
import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {loadFullContent} from 'oot-content';
import type {Command} from 'oot-core';
import {BrowserSaves,CheckpointCoordinator,GameSession,switchImportedSession} from 'oot-platform';
import type {SaveStorage} from 'oot-platform';
import {experienceFixture} from 'oot-platform/fixtures';
import {defaultSaveEncoder} from 'oot-platform/worker';
import type {SaveEncoder} from 'oot-platform/worker';
import {LabSaves,labSession} from '../web/src/office-lab.js';
import {artSlotForJobTemplate,computeCandidateDelta,describeActivityPreview,findLatestJobReceipt,formatAdvanceDisplay,formatDuoEvaluations,formatFactLine,receiptKey,stableDraftKey} from '../web/src/experience-adapter.js';
import {buildDeliveryFeedbackPayload} from '../web/src/delivery-feedback-ui.js';
import {experienceArt} from '../web/src/experience-art.js';
import {experienceDuoCopy,experienceReceiptCopy} from '../web/src/experience-copy.js';
import {getLivingCatalog,getLivingView} from '../web/src/living-adapter.js';
import {encodeViaWorkerProtocol} from '../web/src/save-encoder-host.js';
import {acceptSuggestionResult,suggestViaWorkerProtocol} from '../web/src/experience-worker-host.js';
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
import {executeManualSlotLoad,shouldConfirmBeforeSwitch,switchReasonFromSaveStatus} from '../web/src/use-game.js';

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
 expect(experienceArt('outcome-cafe-sign')).toBe('./art/experience/outcome-cafe-sign.webp');
 expect(experienceArt('outcome-community-web')).toBe('./art/experience/outcome-community-web.webp');
 expect(experienceArt('outcome-bookshop-system')).toBe('./art/experience/outcome-bookshop-system.webp');
 expect(experienceArt('outcome-bookshop-guide')).toBe('./art/experience/outcome-bookshop-guide.webp');
 expect(experienceArt('outcome-workshop-display')).toBe('./art/experience/outcome-workshop-display.webp');
 expect(experienceArt('vignette-rest-corner')).toBe('./art/experience/vignette-rest-corner.webp');
 expect(experienceArt('vignette-first-delivery')).toBe('./art/experience/vignette-first-delivery.webp');
 expect(experienceArt('outcome-unknown-slot')).toBeNull();

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

test('H4: Candidate Worker protocol matches GameSession.suggestAssignments and rejects stale revision, lineage, and draftKey',()=>{
 const c=loadFullContent();
 const g=new GameSession(c,1,'lineage-w2');
 const menu=g.view.jobs.find(j=>j.template==='menu')!;
 const qwenDraft=[{character:'qwen',role:'worker' as const,mode:'cloud' as const}];
 const draftKey=stableDraftKey(menu.id,qwenDraft);
 const draft={team:qwenDraft,draftKey};
 const snap=g.workerSnapshot();

 const direct=g.suggestAssignments(menu.id,draft);
 const {result:viaWorker}=suggestViaWorkerProtocol(snap,menu.id,draft);
 expect(viaWorker).toEqual(direct);
 expect(viaWorker.suggestions.length).toBeGreaterThanOrEqual(1);
 expect(viaWorker.evaluated).toBeLessThanOrEqual(256);

 // Current identity & draftKey pass; stale revision, wrong lineage, or modified draftKey must drop
 expect(acceptSuggestionResult(viaWorker,snap,draftKey)).toBe(true);
 expect(acceptSuggestionResult(viaWorker,{...snap,revision:snap.revision+1},draftKey)).toBe(false);
 expect(acceptSuggestionResult(viaWorker,{...snap,lineageId:'other-lineage'},draftKey)).toBe(false);
 expect(acceptSuggestionResult(viaWorker,snap,stableDraftKey(menu.id,[]))).toBe(false);

 // Candidate delta compares cleanly against live previewAssignment forecast without mutating state
 const preview=g.previewAssignment(menu.id,qwenDraft);
 expect(preview.forecast).not.toBeNull();
 const firstCand=viaWorker.suggestions[0]!;
 const delta=computeCandidateDelta(firstCand,preview.forecast);
 expect(typeof delta.cloudDelta).toBe('number');
 expect(formatFactLine(firstCand.costs[0]!,false)).toContain('云端');

 // Duo & finance explanations consume core services and map W2 reason codes without labeling netSolvency as profit
 const duoExp=g.explainTeamDuos(menu.id,draft);
 const formattedDuos=formatDuoEvaluations(duoExp,g.view,g.view.catalog!.living!);
 expect(formattedDuos.every(d=>d.reasonZh.length>0&&d.reasonEn.length>0)).toBe(true);
 const qwenOnlyDuos=formatDuoEvaluations(duoExp,g.view,g.view.catalog!.living!,new Set(['qwen']));
 expect(qwenOnlyDuos).toEqual([]);
 expect(resolveReasonCopy('duo-clarification-only',false)).toContain('需求澄清');
 expect(resolveReasonCopy('save-resources',true).toLowerCase()).toContain('quota');
 const fin=g.explainFinance();
 expect(fin.bills.length).toBeGreaterThanOrEqual(1);
 expect(resolveReasonCopy(fin.bills[0]!.reason,true)).not.toContain('Status note');
});

test('H4: SaveEncoder Worker protocol matches defaultSaveEncoder across opening, build-2, guide-1, and 962-command stress trajectory',async()=>{
 const c=loadFullContent();

 // 1. Replay build-2 (529 cmds) & guide-1 (419 cmds) transcripts into live GameSessions for byte-for-byte parity
 for(const traceFile of ['apps/sim-cli/fixtures/commission-natural-build-2.json','apps/sim-cli/fixtures/commission-natural-guide-1.json']){
  const raw=JSON.parse(readFileSync(resolve(traceFile),'utf8')) as {seed:number;commands:Command[]};
  const g=new GameSession(c,raw.seed,`trace-${raw.seed}`);
  for(const cmd of raw.commands)expect(g.send(cmd).error).toBeNull();
  const snap=g.checkpointSnapshot();
  expect(await encodeViaWorkerProtocol(snap.input)).toBe(await defaultSaveEncoder.encode(snap.input));
  const half=Math.floor(snap.input.commands.length/2);
  expect(await encodeViaWorkerProtocol({...snap.input,throughCommand:half})).toBe(await defaultSaveEncoder.encode({...snap.input,throughCommand:half}));
 }

 // 2. Amended 962-command seed21 stress input (3 visits + advance x 240 slots with restarts)
 const gStress=new GameSession(c,21,'stress-seed21');
 for(let slot=0;slot<240;slot++){
  if(gStress.view.bankrupt)expect(gStress.send({type:'restart'}).error).toBeNull();
  for(const id of ['library','canteen','workshop'] as const){
   expect(gStress.send({type:'campaign',action:'visit',id}).error).toBeNull();
  }
  expect(gStress.send({type:'advance'}).error).toBeNull();
 }
 const stressSnap=gStress.checkpointSnapshot();
 expect(stressSnap.input.commands).toHaveLength(962);
 expect(await encodeViaWorkerProtocol(stressSnap.input)).toBe(await defaultSaveEncoder.encode(stressSnap.input));
 expect(await encodeViaWorkerProtocol({...stressSnap.input,throughCommand:600})).toBe(await defaultSaveEncoder.encode({...stressSnap.input,throughCommand:600}));
});

test('I2 regression: explicit manual auto load drains dirty queue into backup-1 and stays dirty until load boundary commits',async()=>{
 const c=loadFullContent();
 const storage=new BrowserSaves('ui-i2-auto-drain',new IDBFactory());
 const session=new GameSession(c,1,'lineage-i2');
 const original=await session.exportSave();
 await storage.write('auto',original,0,'boundary',{lineageId:session.lineageId});

 let resolveEncode!:()=>void;
 const encodeGate=new Promise<void>(r=>{resolveEncode=r;});
 let resolveStarted!:()=>void;
 const encodeStarted=new Promise<void>(r=>{resolveStarted=r;});

 const gatedEncoder:SaveEncoder={
  encode:async input=>{
   resolveStarted();
   await encodeGate;
   return defaultSaveEncoder.encode(input);
  }
 };

 const oldCoord=new CheckpointCoordinator(()=>session.checkpointSnapshot(),storage,1,gatedEncoder);
 expect(session.send({type:'accept',job:'0-0'}).error).toBeNull();
 const dirtyText=await session.exportSave();
 oldCoord.enqueue('command');
 await encodeStarted;

 // Wrap storage.read so first read('auto') captures rev1 original BEFORE drain completes rev2 dirty write
 let readCount=0;
 const racedStorage:SaveStorage={
  list:()=>storage.list(),
  read:async slot=>{
   const row=await storage.read(slot);
   if(slot==='auto'&&++readCount===1)resolveEncode();
   return row;
  },
  write:(slot,text,expectedRev,policy,meta)=>storage.write(slot,text,expectedRev,policy,meta),
  remove:slot=>storage.remove(slot),
  close:()=>storage.close()
 };

 let boundCoord:CheckpointCoordinator=oldCoord;
 const res=await executeManualSlotLoad({
  id:'auto',
  confirmed:false,
  storageUnavailable:false,
  session,
  coordinator:oldCoord,
  storage:racedStorage,
  readSlotLineage:()=>session.lineageId,
  writeSlotLineage:()=>{},
  bindCoordinator:rev=>{
   boundCoord=new CheckpointCoordinator(()=>session.checkpointSnapshot(),storage,rev);
   return boundCoord;
  }
 });

 // Immediately after switch, status MUST NOT falsely say saved while disk holds dirty rev2
 expect(res.available).toBe(true);
 expect(res.status.kind).toBe('dirty');
 expect(await session.exportSave()).toBe(original);
 const diskBeforeDrain=await storage.read('auto');
 expect(diskBeforeDrain?.revision).toBe(2);
 expect(diskBeforeDrain?.text).toBe(dirtyText);

 // Once load boundary commits, auto holds selected original A and backup-1 preserves drained B
 const drained=await res.nextCoordinator.drain();
 expect(drained.kind).toBe('saved');
 expect((await storage.read('auto'))?.text).toBe(original);
 expect((await storage.read('backup-1'))?.text).toBe(dirtyText);

 boundCoord.dispose();
 await storage.close();
});

test('I3 regression: post-commit auto read failure keeps switched session rendered, unblocked, exportable, and safe from unknown-CAS writes',async()=>{
 const c=loadFullContent();
 const backing=new BrowserSaves('ui-i3-post-read-fail',new IDBFactory());
 const targetSession=new GameSession(c,1,'lineage-target');
 const menuJob=targetSession.view.jobs.find(j=>j.template==='menu')!;
 expect(targetSession.send({type:'accept',job:menuJob.id}).error).toBeNull();
 const targetSave=await targetSession.exportSave();
 await backing.write('manual-1',targetSave,0,'boundary',{lineageId:targetSession.lineageId});

 const liveSession=new GameSession(c,1,'lineage-initial');
 const oldCoord=new CheckpointCoordinator(()=>liveSession.checkpointSnapshot(),backing,0);

 let readManualDone=false;
 let writeAfterFailure=0;
 const faultStorage:SaveStorage={
  list:()=>backing.list(),
  read:async slot=>{
   if(slot==='manual-1'){
    readManualDone=true;
    return backing.read(slot);
   }
   if(slot==='auto'&&readManualDone)throw Error('INDEXEDDB_AUTO_READ_FAILED');
   return backing.read(slot);
  },
  write:(slot,text,expectedRev,policy,meta)=>{
   if(readManualDone)writeAfterFailure++;
   return backing.write(slot,text,expectedRev,policy,meta);
  },
  remove:slot=>backing.remove(slot),
  close:()=>backing.close()
 };

 let reboundCoord:CheckpointCoordinator|null=null;
 const res=await executeManualSlotLoad({
  id:'manual-1',
  confirmed:false,
  storageUnavailable:false,
  session:liveSession,
  coordinator:oldCoord,
  storage:faultStorage,
  readSlotLineage:()=>null,
  writeSlotLineage:()=>{},
  bindCoordinator:rev=>{
   reboundCoord=new CheckpointCoordinator(()=>liveSession.checkpointSnapshot(),faultStorage,rev);
   return reboundCoord;
  }
 });

 expect(res.available).toBe(false);
 expect(res.status.kind).toBe('imported-unsaved');
 expect(res.status.storageUnavailable).toBe(true);
 expect(res.status.exportable).toBe(true);
 expect(shouldConfirmBeforeSwitch(res.status)).toBe(true);
 expect(liveSession.lineageId).toBe(targetSession.lineageId);
 expect(liveSession.view.jobs.find(j=>j.id===menuJob.id)?.status).toBe('accepted');
 expect(reboundCoord).not.toBeNull();
 expect(reboundCoord).not.toBe(oldCoord);
 expect(writeAfterFailure).toBe(0);

 // Switched session stays interactive and exportable without COORDINATOR_DISPOSED
 const nextJob=liveSession.view.jobs.find(j=>j.status==='posted')!;
 expect(liveSession.send({type:'accept',job:nextJob.id}).error).toBeNull();
 expect(await liveSession.exportSave()).toContain('commands');

 reboundCoord!.dispose();
 await backing.close();
});

test('W3: artSlotForJobTemplate, receiptKey, DeliveryFeedback payload order, contributor truthfulness, and duo 3-stage chains',()=>{
 const c=loadFullContent();

 // 1. All job templates map cleanly to frozen Art-Batch 7 outcome slots
 expect(artSlotForJobTemplate('menu')).toBe('outcome-tea-menu');
 expect(artSlotForJobTemplate('translation')).toBe('outcome-cafe-sign');
 expect(artSlotForJobTemplate('website')).toBe('outcome-community-web');
 expect(artSlotForJobTemplate('website-small')).toBe('outcome-community-web');
 expect(artSlotForJobTemplate('website-phased')).toBe('outcome-community-web');
 expect(artSlotForJobTemplate('signup')).toBe('outcome-community-web');
 expect(artSlotForJobTemplate('incubator-build')).toBe('outcome-bookshop-system');
 expect(artSlotForJobTemplate('incubator-guide')).toBe('outcome-bookshop-guide');
 expect(artSlotForJobTemplate('unknown-template')).toBe('outcome-workshop-display');
 expect(artSlotForJobTemplate(undefined)).toBe('outcome-workshop-display');

 // 2. Replay real build-2 trace to inspect factual receipts, contributors, and DeliveryFeedback payload
 const raw=JSON.parse(readFileSync(resolve('apps/sim-cli/fixtures/commission-natural-build-2.json'),'utf8')) as {seed:number;commands:Command[]};
 const g=new GameSession(c,raw.seed,'w3-replay');
 for(const cmd of raw.commands){
  expect(g.send(cmd).error).toBeNull();
 }
 const expView=g.getExperienceView();
 expect(expView.receipts.length).toBeGreaterThanOrEqual(1);
 const keys=new Set(expView.receipts.map(r=>receiptKey(r)));
 expect(keys.size).toBe(expView.receipts.length);

 const passedReceipt=expView.receipts.find(r=>r.facts.some(f=>f.certainty==='certain'&&f.reason==='delivery-passed'))!;
 expect(passedReceipt).toBeDefined();
 const passedJob=g.view.jobs.find(j=>j.id===passedReceipt.jobId)!;
 expect(findLatestJobReceipt(expView.receipts,passedReceipt.jobId)?.jobId).toBe(passedReceipt.jobId);

 const receiptCopy=experienceReceiptCopy(passedReceipt,passedJob);
 expect(receiptCopy.participants).toEqual([...passedReceipt.participants]);
 expect(receiptCopy.zh.length).toBeGreaterThan(0);
 expect(receiptCopy.en.length).toBeGreaterThan(0);

 const payload=buildDeliveryFeedbackPayload(
  g.view.cash-500,
  g.view,
  expView,
  getLivingCatalog(g.view),
  getLivingView(g.view),
  passedJob.id,
  'deliver'
 );
 expect(payload).not.toBeNull();
 expect(payload!.outcome).toBe('passed');
 expect(payload!.cashDelta).toBeCloseTo(500,2);

 // 3. Duo 3-stage chains: bluewhale-qwen & mistral-llama respect evidence & active/inactive explanation gates
 const gDuo=new GameSession(c,1,'w3-duo-test');
 const livingDuo=getLivingView(gDuo.view);
 const bwQwen=livingDuo.duos.find(d=>d.id==='bluewhale-qwen')!;
 expect(experienceDuoCopy('first-shared-delivery',bwQwen,gDuo.getExperienceView(),{jobs:gDuo.view.jobs}).lines).toEqual([]);
 expect(experienceDuoCopy('tea-ready',bwQwen,gDuo.getExperienceView()).fallback).not.toBeNull();

 const mLlama=livingDuo.duos.find(d=>d.id==='mistral-llama');
 if(mLlama){
  expect(experienceDuoCopy('unlocked-benefit',mLlama,gDuo.getExperienceView(),{jobs:gDuo.view.jobs}).lines).toEqual([]);
 }
});

test('I4 regression: multi-phase deliver and rework payloads consume pre-reset receipt.assessment and stay neutral when assessment is missing',()=>{
 const c=loadFullContent();

 // 1. Multi-phase delivery in unchanged build-2 (project:incubator:1 phase 0 quality 84.96 -> next phase resets job.quality to 0)
 const build2=JSON.parse(readFileSync(resolve('apps/sim-cli/fixtures/commission-natural-build-2.json'),'utf8')) as {seed:number;commands:Command[]};
 const gMulti=new GameSession(c,build2.seed,'w3-i4-multiphase');
 let verifiedMultiphase=false;
 for(const cmd of build2.commands){
  const before=gMulti.view;
  expect(gMulti.send(cmd).error).toBeNull();
  if(cmd.type!=='deliver')continue;
  const oldJob=before.jobs.find(j=>j.id===cmd.job);
  const afterView=gMulti.view;
  const afterJob=afterView.jobs.find(j=>j.id===cmd.job);
  if(oldJob&&afterJob&&afterJob.phase>oldJob.phase&&afterJob.quality===0){
   const exp=gMulti.getExperienceView();
   const payload=buildDeliveryFeedbackPayload(
    before.cash,
    afterView,
    exp,
    getLivingCatalog(afterView),
    getLivingView(afterView),
    cmd.job,
    'deliver'
   );
   expect(payload).not.toBeNull();
   expect(payload!.outcome).toBe('passed');
   expect(payload!.receipt?.assessment?.quality).toBe(oldJob.quality);
   expect(payload!.assessment?.quality).toBe(oldJob.quality);
   expect(payload!.assessment?.passQuality).toBe(oldJob.passQuality);
   expect(payload!.job.quality).toBe(oldJob.quality);
   verifiedMultiphase=true;
   break;
  }
 }
 expect(verifiedMultiphase).toBe(true);

 // 2. Rework event retains pre-rework score & penalties in payload.assessment instead of post-rework reset values
 let verifiedRework=false;
 for(const traceFile of ['apps/sim-cli/fixtures/commission-natural-build-2.json','apps/sim-cli/fixtures/commission-natural-guide-1.json']){
  const raw=JSON.parse(readFileSync(resolve(traceFile),'utf8')) as {seed:number;commands:Command[]};
  const gRew=new GameSession(c,raw.seed,'w3-i4-rework');
  for(const cmd of raw.commands){
   const before=gRew.view;
   expect(gRew.send(cmd).error).toBeNull();
   if(cmd.type==='rework'){
    const oldJob=before.jobs.find(j=>j.id===cmd.job)!;
    const afterView=gRew.view;
    const exp=gRew.getExperienceView();
    const payload=buildDeliveryFeedbackPayload(
     before.cash,
     afterView,
     exp,
     getLivingCatalog(afterView),
     getLivingView(afterView),
     cmd.job,
     'rework'
    );
    expect(payload).not.toBeNull();
    expect(payload!.outcome).toBe('rework');
    expect(payload!.assessment?.quality).toBe(oldJob.quality);
    expect(payload!.assessment?.qualityBreakdown).toEqual(oldJob.qualityBreakdown);
    expect(payload!.job.quality).toBe(oldJob.quality);
    verifiedRework=true;
    break;
   }
  }
  if(verifiedRework)break;
 }
 expect(verifiedRework).toBe(true);

 // 3. Missing assessment (legacy v1 producer) stays strictly null instead of inheriting current phase quality
 const expNoAssess=gMulti.getExperienceView();
 const legacyReceipts=expNoAssess.receipts.map(r=>{
  const copy={...r};
  delete copy.assessment;
  return copy;
 });
 const latestId=legacyReceipts.at(-1)!.jobId;
 const neutralPayload=buildDeliveryFeedbackPayload(
  gMulti.view.cash,
  gMulti.view,
  {...expNoAssess,receipts:legacyReceipts},
  getLivingCatalog(gMulti.view),
  getLivingView(gMulti.view),
  latestId,
  'deliver'
 );
 expect(neutralPayload).not.toBeNull();
 expect(neutralPayload!.assessment).toBeNull();
});
