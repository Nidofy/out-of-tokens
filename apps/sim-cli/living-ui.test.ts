import {expect,test} from 'vitest';
import {loadFullContent} from 'oot-content';
import {createInitialState,dispatchCommand,explainCapacity,explainDuos,forecastAssignment,getViewModel,previewPeriod} from 'oot-core';
import type {Content,Job,Member} from 'oot-core';
import {EXPERIENCE_CONTRACT} from 'oot-platform';
import type {CapacityExplanation,DuoExplanation} from 'oot-platform';
import {labSession} from '../web/src/office-lab.js';
import {resolveGlobalShortcut} from '../web/src/ui2-logic.js';
import {actorStopKindFromPreview,formatDuoEvaluations} from '../web/src/experience-adapter.js';
import {reactionFor} from '../web/src/scene-layout.js';
import {
 clientAssetSrc,
 emoteAssetSrc,
 getLivingCatalog,
 getLivingView,
 giftAssetSrc,
 giftReactionTier,
 pickEventQuote,
 pickSlotBeat,
 pickSocialBark,
 pickStageChatter,
 pickWorkBark,
 resolveClientPersona,
 teaBreakAssetSrc
} from '../web/src/living-adapter.js';
import {
 playFoley,
 playVoiceBlip,
 readAudioPrefs,
 syncAmbience,
 unlockAudio,
 writeAudioPrefs
} from '../web/src/audio-foley.js';

function fullRosterContent():Content{
 const c=loadFullContent();
 c.campaign!.initial=[...new Set(c.versions.map(v=>v.character))];
 c.campaign!.recruits=[];
 return c;
}

function makeWorkingJob(c:Content,templateId:string,team:Member[]):Job{
 const t=c.commissions.find(x=>x.id===templateId)!;
 return {
  id:`test-${templateId}`,
  template:t.id,
  status:'working',
  posted:0,
  deadline:100,
  duration:8,
  hidden:0,
  work:1000,
  progress:0,
  weighted:0,
  review:0,
  defects:0,
  reworked:false,
  advance:0,
  quality:0,
  team,
  phase:0,
  resumeAt:0,
  qualityBonus:0,
  clarifyingUntil:0,
  reviewCoverage:0
 };
}

test('resolveGlobalShortcut maps c/C to chat drawer and respects modal/input guards',()=>{
 const openGuard={blockedModal:false,actorOpen:false};
 expect(resolveGlobalShortcut({key:'c',ctrlKey:false,metaKey:false,altKey:false,isComposing:false,repeat:false},openGuard)).toEqual({type:'chat'});
 expect(resolveGlobalShortcut({key:'C',ctrlKey:false,metaKey:false,altKey:false,isComposing:false,repeat:false},openGuard)).toEqual({type:'chat'});
 expect(resolveGlobalShortcut({key:'c',ctrlKey:false,metaKey:false,altKey:false,isComposing:false,repeat:false,targetTag:'TEXTAREA'},openGuard)).toBeNull();
 expect(resolveGlobalShortcut({key:'c',ctrlKey:false,metaKey:false,altKey:false,isComposing:false,repeat:false},{blockedModal:true,actorOpen:false})).toBeNull();
});

test('W2-03: effective context overload handles Mistral/Kimi, storage hardware, version switch, load===context and priority rules',()=>{
 const c=fullRosterContent();
 const s=createInitialState(c,1);
 s.jobs=[];

 const capMap=(s:ReturnType<typeof createInitialState>,c:Content,ids:string[]):Record<string,CapacityExplanation>=>
  Object.fromEntries(ids.map(id=>[id,{contract:EXPERIENCE_CONTRACT,contentVersion:c.version,revision:0,lineageId:'test',...explainCapacity(s,c,id)}]));

 // Boundary: Mistral 7B base context = 4; load=4 is NOT overloaded, load=5 IS overloaded.
 const mistral=s.actors.find(a=>a.id==='mistral')!;
 expect(mistral.version).toBe('mistral.7b');
 mistral.load=4;
 let v=getViewModel(s,c);
 expect(explainCapacity(s,c,'mistral').context).toBe(4);
 expect(explainCapacity(s,c,'mistral').overloaded).toBe(false);
 expect(reactionFor(v,'mistral',false)).toBe('neutral');

 mistral.load=5;
 v=getViewModel(s,c);
 expect(explainCapacity(s,c,'mistral').overloaded).toBe(true);
 expect(reactionFor(v,'mistral',true)).toBe('surprised');
 const mistralOverloadView={...v,actors:v.actors.filter(a=>a.id==='mistral')};
 const mistralBubble=pickStageChatter(mistralOverloadView,getLivingCatalog(mistralOverloadView),getLivingView(mistralOverloadView),false,0,undefined,capMap(s,c,['mistral']));
 expect(mistralBubble?.id).toContain(':overload:');

 // Storage hardware (+2) raises Mistral 7B effective context from 4 -> 6: load=5 is no longer overloaded.
 s.campaign!.hardware.storage=2;
 v=getViewModel(s,c);
 expect(explainCapacity(s,c,'mistral').context).toBe(6);
 expect(explainCapacity(s,c,'mistral').overloaded).toBe(false);
 expect(reactionFor(v,'mistral',false)).toBe('neutral');
 mistral.load=7;
 v=getViewModel(s,c);
 expect(explainCapacity(s,c,'mistral').overloaded).toBe(true);
 expect(reactionFor(v,'mistral',true)).toBe('surprised');

 // Switching to mistral.large (context=8) + storage=2 -> effective context 10 clears load=7 overload.
 mistral.version='mistral.large';
 v=getViewModel(s,c);
 expect(explainCapacity(s,c,'mistral').context).toBe(10);
 expect(explainCapacity(s,c,'mistral').overloaded).toBe(false);
 expect(reactionFor(v,'mistral',false)).toBe('neutral');

 // Kimi 1.5 base context = 11 (+storage 0 here): load=9 & load=11 are NOT overloaded; load=12 IS overloaded.
 s.campaign!.hardware.storage=0;
 const kimi=s.actors.find(a=>a.id==='kimi')!;
 expect(kimi.version).toBe('kimi.1.5');
 kimi.load=9;
 v=getViewModel(s,c);
 expect(explainCapacity(s,c,'kimi').context).toBe(11);
 expect(explainCapacity(s,c,'kimi').overloaded).toBe(false);
 expect(reactionFor(v,'kimi',false)).toBe('neutral');
 const kimiIdleView={...v,actors:v.actors.filter(a=>a.id==='kimi')};
 expect(pickStageChatter(kimiIdleView,getLivingCatalog(kimiIdleView),getLivingView(kimiIdleView),false,0,undefined,capMap(s,c,['kimi']))?.id).not.toContain(':overload:');

 kimi.load=11;
 v=getViewModel(s,c);
 expect(explainCapacity(s,c,'kimi').overloaded).toBe(false);
 expect(reactionFor(v,'kimi',false)).toBe('neutral');

 kimi.load=12;
 v=getViewModel(s,c);
 expect(explainCapacity(s,c,'kimi').overloaded).toBe(true);
 expect(reactionFor(v,'kimi',true)).toBe('surprised');

 // Priority checks: pending.actors -> surprised; current-slot delivery -> happy; low energy -> sleepy over overload.
 const gStd=labSession(loadFullContent(),'standard'),vStd=gStd.view;
 const deliveredView={
  ...vStd,
  ledger:[...vStd.ledger,{slot:vStd.absoluteSlot,reason:`delivery:${vStd.jobs[0]!.id}`,amount:100}],
  jobs:[{...vStd.jobs[0]!,status:'delivered' as const,team:[{character:'qwen',role:'worker' as const,mode:'cloud' as const}]},...vStd.jobs.slice(1)]
 };
 expect(reactionFor(deliveredView,'qwen')).toBe('happy');
 expect(reactionFor(deliveredView,'llama')).toBe('neutral');

 const tiredOverloaded={...v,actors:v.actors.map(a=>a.id==='kimi'?{...a,energy:28,mood:90,load:20}:a)};
 expect(reactionFor(tiredOverloaded,'kimi',true)).toBe('sleepy');
 const kimiTiredOnly={...tiredOverloaded,actors:tiredOverloaded.actors.filter(a=>a.id==='kimi')};
 expect(pickStageChatter(kimiTiredOnly,getLivingCatalog(kimiTiredOnly),getLivingView(kimiTiredOnly),false,0,undefined,capMap(s,c,['kimi']))?.id).toContain(':tired:');

 // possibleStops without context overload shows surprised expression but budget stop chatter (not context overload).
 const qwenCloudJob=makeWorkingJob(c,'menu',[{character:'qwen',role:'worker',mode:'cloud'}]);
 const cloudStopState={...s,quota:0,purchased:0,jobs:[qwenCloudJob]};
 const cloudStopView=getViewModel(cloudStopState,c);
 const cloudStops=previewPeriod(cloudStopState,c).stops;
 expect(cloudStopView.possibleStops).toContain('qwen');
 expect(explainCapacity(cloudStopState,c,'qwen').overloaded).toBe(false);
 expect(reactionFor(cloudStopView,'qwen',false)).toBe('surprised');
 expect(actorStopKindFromPreview(cloudStops,'qwen')).toBe('cloud');
 const qwenOnlyCloud={...cloudStopView,actors:cloudStopView.actors.filter(a=>a.id==='qwen')};
 const qwenStopBubble=pickStageChatter(qwenOnlyCloud,getLivingCatalog(qwenOnlyCloud),getLivingView(qwenOnlyCloud),false,0,cloudStops,capMap(cloudStopState,c,['qwen']));
 expect(qwenStopBubble?.id).toContain(':stop-cloud:');
 expect(qwenStopBubble?.id).not.toContain(':overload:');

 const llamaLocalJob=makeWorkingJob(c,'bugs',[{character:'llama',role:'worker',mode:'local'}]);
 const localStopState={...s,localCapacity:0,jobs:[llamaLocalJob]};
 const localStopView=getViewModel(localStopState,c);
 const localStops=previewPeriod(localStopState,c).stops;
 expect(localStopView.possibleStops).toContain('llama');
 expect(actorStopKindFromPreview(localStops,'llama')).toBe('local');
 const llamaOnlyLocal={...localStopView,actors:localStopView.actors.filter(a=>a.id==='llama')};
 expect(pickStageChatter(llamaOnlyLocal,getLivingCatalog(llamaOnlyLocal),getLivingView(llamaOnlyLocal),false,0,localStops,capMap(localStopState,c,['llama']))?.id).toContain(':stop-local:');
});

test('W2-02: formatDuoEvaluations consumes core explainDuos across mode, category, slot, delivery, clarify, lock and absence',()=>{
 const c=fullRosterContent();
 const formatDuos=(s:ReturnType<typeof createInitialState>,jobId:string,team:Member[],v=getViewModel(s,c))=>{
  const explanation:DuoExplanation={contract:EXPERIENCE_CONTRACT,contentVersion:c.version,revision:0,lineageId:'test',jobId,draftKey:'draft',duos:explainDuos(s,c,jobId,team)};
  return formatDuoEvaluations(explanation,v,getLivingCatalog(v),new Set(team.map(m=>m.character)));
 };
 const activeIds=(rows:ReturnType<typeof formatDuos>)=>rows.filter(x=>x.state==='active').map(x=>x.duo.id);

 // 1. mistral-llama: local mode only (exact reproduction case + core forecast agreement).
 const s=createInitialState(c,1);
 s.campaign!.duos=['mistral-llama'];
 const cloudTeam:Member[]=[{character:'mistral',role:'worker',mode:'cloud'},{character:'llama',role:'worker',mode:'cloud'}];
 const mixedTeam:Member[]=[{character:'mistral',role:'worker',mode:'local'},{character:'llama',role:'worker',mode:'cloud'}];
 const localTeam:Member[]=[{character:'mistral',role:'worker',mode:'local'},{character:'llama',role:'worker',mode:'local'}];
 const jobBase=makeWorkingJob(c,'menu',cloudTeam);
 s.jobs=[jobBase];

 const viewCloud=getViewModel(s,c);
 const resCloud=formatDuos(s,jobBase.id,cloudTeam,viewCloud);
 expect(resCloud.find(x=>x.duo.id==='mistral-llama')).toMatchObject({state:'inactive',statusEn:'Inactive'});
 expect(activeIds(resCloud)).toEqual([]);
 const sNoDuo=createInitialState(c,1);
 sNoDuo.jobs=[jobBase];
 expect(forecastAssignment(s,c,jobBase).firstSlot).toEqual(forecastAssignment(sNoDuo,c,jobBase).firstSlot);

 const resMixed=formatDuos(s,jobBase.id,mixedTeam,viewCloud);
 expect(resMixed.find(x=>x.duo.id==='mistral-llama')).toMatchObject({state:'inactive'});
 expect(activeIds(resMixed)).toEqual([]);

 const jobLocal={...jobBase,team:localTeam};
 s.jobs=[jobLocal];
 const viewLocal=getViewModel(s,c);
 const resLocal=formatDuos(s,jobLocal.id,localTeam,viewLocal);
 expect(resLocal.find(x=>x.duo.id==='mistral-llama')).toMatchObject({state:'active',statusEn:'Active'});
 expect(activeIds(resLocal)).toEqual(['mistral-llama']);
 expect(forecastAssignment(s,c,jobLocal).firstSlot.progress).toBeGreaterThan(forecastAssignment(sNoDuo,c,jobLocal).firstSlot.progress);

 // 2. gpt-claude: cloud mode only.
 const sCloudOnly=createInitialState(c,1);
 sCloudOnly.campaign!.duos=['gpt-claude'];
 sCloudOnly.jobs=[makeWorkingJob(c,'menu',[{character:'gpt',role:'worker',mode:'cloud'},{character:'claude',role:'reviewer',mode:'cloud'}])];
 expect(formatDuos(sCloudOnly,sCloudOnly.jobs[0]!.id,sCloudOnly.jobs[0]!.team).find(x=>x.duo.id==='gpt-claude')?.state).toBe('active');
 expect(formatDuos(sCloudOnly,sCloudOnly.jobs[0]!.id,[{character:'gpt',role:'worker',mode:'local'},{character:'claude',role:'reviewer',mode:'cloud'}]).find(x=>x.duo.id==='gpt-claude')?.state).toBe('inactive');

 // 3. Category duos: kimi-glm (write/research only), gpt-gemini (design/media only), minimax-seedance (media only).
 const sCat=createInitialState(c,1);
 sCat.campaign!.duos=['kimi-glm','gpt-gemini','minimax-seedance'];
 sCat.jobs=[makeWorkingJob(c,'menu',[]),makeWorkingJob(c,'bugs',[]),makeWorkingJob(c,'logo',[]),makeWorkingJob(c,'video',[])];
 const menuJob=sCat.jobs.find(j=>j.template==='menu')!;
 const bugsJob=sCat.jobs.find(j=>j.template==='bugs')!;
 const logoJob=sCat.jobs.find(j=>j.template==='logo')!;
 const videoJob=sCat.jobs.find(j=>j.template==='video')!;

 const kgTeam:Member[]=[{character:'kimi',role:'worker',mode:'cloud'},{character:'glm',role:'worker',mode:'cloud'}];
 expect(formatDuos(sCat,menuJob.id,kgTeam).find(x=>x.duo.id==='kimi-glm')?.state).toBe('active');
 expect(formatDuos(sCat,bugsJob.id,kgTeam).find(x=>x.duo.id==='kimi-glm')?.state).toBe('inactive');

 const ggTeam:Member[]=[{character:'gpt',role:'worker',mode:'cloud'},{character:'gemini',role:'worker',mode:'cloud'}];
 expect(formatDuos(sCat,logoJob.id,ggTeam).find(x=>x.duo.id==='gpt-gemini')?.state).toBe('active');
 expect(formatDuos(sCat,videoJob.id,ggTeam).find(x=>x.duo.id==='gpt-gemini')?.state).toBe('active');
 expect(formatDuos(sCat,menuJob.id,ggTeam).find(x=>x.duo.id==='gpt-gemini')?.state).toBe('inactive');

 const msVideoTeam:Member[]=[{character:'minimax',role:'worker',mode:'cloud'},{character:'seedance',role:'worker',mode:'cloud'}];
 expect(formatDuos(sCat,videoJob.id,msVideoTeam).find(x=>x.duo.id==='minimax-seedance')?.state).toBe('active');
 expect(formatDuos(sCat,logoJob.id,msVideoTeam).find(x=>x.duo.id==='minimax-seedance')?.state).toBe('inactive');

 // 4. Time & delivery duos: mistral-seedance (Morning slot%4===0 only), gemini-minimax (non-oneshot only).
 const sTimeDel=createInitialState(c,1);
 sTimeDel.campaign!.duos=['mistral-seedance','gemini-minimax'];
 sTimeDel.jobs=[makeWorkingJob(c,'menu',[]),makeWorkingJob(c,'backup',[])];
 sTimeDel.absoluteSlot=0;
 const morningTeam:Member[]=[{character:'mistral',role:'worker',mode:'cloud'},{character:'seedance',role:'worker',mode:'cloud'}];
 expect(formatDuos(sTimeDel,sTimeDel.jobs[0]!.id,morningTeam).find(x=>x.duo.id==='mistral-seedance')?.state).toBe('active');
 sTimeDel.absoluteSlot=1;
 expect(formatDuos(sTimeDel,sTimeDel.jobs[0]!.id,morningTeam).find(x=>x.duo.id==='mistral-seedance')?.state).toBe('inactive');

 const gmTeam:Member[]=[{character:'gemini',role:'worker',mode:'cloud'},{character:'minimax',role:'worker',mode:'cloud'}];
 expect(formatDuos(sTimeDel,sTimeDel.jobs[0]!.id,gmTeam).find(x=>x.duo.id==='gemini-minimax')?.state).toBe('inactive');
 expect(formatDuos(sTimeDel,sTimeDel.jobs[1]!.id,gmTeam).find(x=>x.duo.id==='gemini-minimax')?.state).toBe('active');

 // 5. Clarify-only duo (qwen-kimi) boosts clarifyChance in core when in same scene, yet is never labeled active execution bonus.
 const sClar=createInitialState(c,1);
 const baseClarify=getViewModel(sClar,c).actors.find(a=>a.id==='qwen')!.clarifyChance;
 sClar.campaign!.duos=['qwen-kimi'];
 sClar.jobs=[makeWorkingJob(c,'menu',[])];
 const vClar=getViewModel(sClar,c);
 expect(vClar.actors.find(a=>a.id==='qwen')!.clarifyChance).toBeGreaterThan(baseClarify);
 const qkEval=formatDuos(sClar,sClar.jobs[0]!.id,[{character:'qwen',role:'worker',mode:'cloud'},{character:'kimi',role:'worker',mode:'cloud'}],vClar);
 expect(qkEval.find(x=>x.duo.id==='qwen-kimi')).toMatchObject({state:'inactive',statusEn:'Clarify only'});
 expect(activeIds(qkEval)).toEqual([]);

 // 6. Energy-save local duo (llama-glm) & core advance parity; plus locked & missing-member boundaries.
 const cQuiet=fullRosterContent();
 cQuiet.balance!.eventChance=0;
 const sEnergyBase=createInitialState(cQuiet,1);
 const energyJob=makeWorkingJob(cQuiet,'menu',[{character:'llama',role:'worker',mode:'local'},{character:'glm',role:'worker',mode:'local'}]);
 sEnergyBase.jobs=[structuredClone(energyJob)];
 const sEnergyDuo=createInitialState(cQuiet,1);
 sEnergyDuo.campaign!.duos=['llama-glm'];
 sEnergyDuo.jobs=[structuredClone(energyJob)];
 expect(formatDuos(sEnergyDuo,sEnergyDuo.jobs[0]!.id,energyJob.team).find(x=>x.duo.id==='llama-glm')?.state).toBe('active');
 expect(formatDuos(sEnergyDuo,sEnergyDuo.jobs[0]!.id,[{character:'llama',role:'worker',mode:'cloud'},{character:'glm',role:'worker',mode:'cloud'}]).find(x=>x.duo.id==='llama-glm')?.state).toBe('inactive');
 expect(forecastAssignment(sEnergyDuo,cQuiet,sEnergyDuo.jobs[0]!).firstSlot.members[0]!.energyCost).toBe(forecastAssignment(sEnergyBase,cQuiet,sEnergyBase.jobs[0]!).firstSlot.members[0]!.energyCost-2);
 const advBase=dispatchCommand(sEnergyBase,{type:'advance'},cQuiet);
 const advDuo=dispatchCommand(sEnergyDuo,{type:'advance'},cQuiet);
 expect(advDuo.state.actors.find(a=>a.id==='llama')!.energy).toBeGreaterThan(advBase.state.actors.find(a=>a.id==='llama')!.energy);

 const sLocked=createInitialState(c,1);
 sLocked.jobs=[makeWorkingJob(c,'menu',[])];
 expect(formatDuos(sLocked,sLocked.jobs[0]!.id,[{character:'bluewhale',role:'worker',mode:'cloud'},{character:'qwen',role:'worker',mode:'cloud'}]).find(x=>x.duo.id==='bluewhale-qwen')).toMatchObject({state:'locked',statusEn:'Locked'});
 expect(formatDuos(sLocked,sLocked.jobs[0]!.id,[{character:'bluewhale',role:'worker',mode:'cloud'}])).toEqual([]);
});

test('living-adapter reads native living-m6 catalog, Art-Batch 6 paths, personas and stage chatter',()=>{
 const g=labSession(loadFullContent(),'standard'),v=g.view;
 const catalog=getLivingCatalog(v);
 const living=getLivingView(v);

 expect([catalog.gifts.length,catalog.duos.length,catalog.threads.length,catalog.clients.length,Object.keys(catalog.barks).length]).toEqual([6,12,20,6,12]);
 expect(emoteAssetSrc('coffee')).toBe('./art/living/emote-coffee.webp');
 expect(giftAssetSrc('rice-bento')).toBe('./art/living/gift-rice-bento.webp');
 expect(clientAssetSrc('tea-lin')).toBe('./art/living/client-tea-lin.webp');
 expect(teaBreakAssetSrc()).toBe('./art/living/card-tea-break.webp');

 const lowBark=pickSocialBark(catalog,'qwen','chat',10,false);
 const midBark=pickSocialBark(catalog,'qwen','chat',40,false);
 const highBark=pickSocialBark(catalog,'qwen','chat',85,false);
 expect(lowBark.length).toBeGreaterThan(0);
 expect(midBark.length).toBeGreaterThan(0);
 expect(highBark.length).toBeGreaterThan(0);
 expect(new Set([lowBark,midBark,highBark]).size).toBe(3);

 const loveGift=catalog.gifts.find(item=>item.id==='rice-bento')!;
 expect(giftReactionTier(loveGift,'bluewhale')).toBe('love');

 expect(resolveClientPersona(catalog,{template:'menu',title:'帮楼下奶茶店写个菜单'}).id).toBe('tea-lin');
 expect(resolveClientPersona(catalog,{template:'bugs',title:'修一下网站，就一个小地方'}).id).toBe('oss-zhe');
 expect(resolveClientPersona(catalog,{template:'incubator',title:'孵化器项目'}).id).toBe('vc-lu');
 expect(pickWorkBark(catalog,'bluewhale','assignWorker',true).length).toBeGreaterThan(0);
 expect(pickEventQuote(catalog,'api-outage','llama',false).length).toBeGreaterThan(0);
 expect(pickSlotBeat(catalog,0,1,false).length).toBeGreaterThan(0);

 const bubble=pickStageChatter(v,catalog,living,false,0);
 expect(bubble).not.toBeNull();
 expect(bubble?.text.length).toBeGreaterThan(0);

 const duoBubble=pickStageChatter(v,catalog,living,false,1);
 expect(duoBubble?.buddyId).toBeTruthy();
 expect(duoBubble?.buddyText?.length).toBeGreaterThan(0);
});

test('living Wave 2 round-trips gift, tea break and free chat-reply through native oot-core session',()=>{
 const g=labSession(loadFullContent(),'initial');
 const startCash=g.view.cash;
 const startMood=g.view.actors.find(a=>a.id==='bluewhale')!.mood;

 const giftRes=g.send({type:'campaign',action:'gift',id:'bluewhale',target:'rice-bento'});
 expect(giftRes.error).toBeNull();
 expect(g.view.cash).toBe(startCash-45);
 expect(g.view.living.gifted.bluewhale).toEqual(['rice-bento']);
 expect(g.view.actors.find(a=>a.id==='bluewhale')!.mood).toBe(Math.min(100,startMood+16));
 expect(g.view.campaign!.relations.bluewhale!.affinity).toBe(10);

 const cashAfterGift=g.view.cash;
 expect(g.view.living.teaReady).toBe(true);
 const teaRes=g.send({type:'campaign',action:'tea',id:'all'});
 expect(teaRes.error).toBeNull();
 expect(g.view.cash).toBe(cashAfterGift-80);
 expect(g.view.living.teaReady).toBe(false);

 const thread=g.view.living.threads[0]!;
 const startUnread=g.view.living.unreadThreads;
 const startSlot=g.view.absoluteSlot;
 const chatRes=g.send({type:'campaign',action:'chat-reply',id:thread.id,target:'0'});
 expect(chatRes.error).toBeNull();
 expect(g.view.living.unreadThreads).toBe(startUnread-1);
 expect(g.view.living.threads.find(t=>t.id===thread.id)?.chosenReply).toBe(0);
 expect(g.view.absoluteSlot).toBe(startSlot);
});

test('audio-foley executes safely in headless test runtime without DOM audio crash',()=>{
 expect(readAudioPrefs()).toEqual({sfx:true,ambience:false});
 writeAudioPrefs({sfx:false,ambience:true});
 expect(()=>{
  unlockAudio();
  playFoley('tap',true);
  playVoiceBlip('qwen',3,true);
  syncAmbience('workshop',false,true);
 }).not.toThrow();
});
