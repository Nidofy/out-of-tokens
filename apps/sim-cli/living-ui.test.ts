import {expect,test} from 'vitest';
import {loadFullContent} from 'oot-content';
import {labSession} from '../web/src/office-lab.js';
import {resolveGlobalShortcut} from '../web/src/ui2-logic.js';
import {reactionFor} from '../web/src/scene-layout.js';
import {
 clientAssetSrc,
 emoteAssetSrc,
 findActiveTeamDuos,
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

test('resolveGlobalShortcut maps c/C to chat drawer and respects modal/input guards',()=>{
 const openGuard={blockedModal:false,actorOpen:false};
 expect(resolveGlobalShortcut({key:'c',ctrlKey:false,metaKey:false,altKey:false,isComposing:false,repeat:false},openGuard)).toEqual({type:'chat'});
 expect(resolveGlobalShortcut({key:'C',ctrlKey:false,metaKey:false,altKey:false,isComposing:false,repeat:false},openGuard)).toEqual({type:'chat'});
 expect(resolveGlobalShortcut({key:'c',ctrlKey:false,metaKey:false,altKey:false,isComposing:false,repeat:false,targetTag:'TEXTAREA'},openGuard)).toBeNull();
 expect(resolveGlobalShortcut({key:'c',ctrlKey:false,metaKey:false,altKey:false,isComposing:false,repeat:false},{blockedModal:true,actorOpen:false})).toBeNull();
});

test('reactionFor prioritizes sleepy under low energy, surprised under load or stops, and happy when upbeat',()=>{
 const g=labSession(loadFullContent(),'standard'),v=g.view;
 const deliveredView={
  ...v,
  ledger:[...v.ledger,{slot:v.absoluteSlot,reason:`delivery:${v.jobs[0]!.id}`,amount:100}],
  jobs:[{...v.jobs[0]!,status:'delivered' as const,team:[{character:'qwen',role:'worker' as const,mode:'cloud' as const}]},...v.jobs.slice(1)]
 };
 expect(reactionFor(deliveredView,'qwen')).toBe('happy');
 expect(reactionFor(deliveredView,'llama')).toBe('neutral');

 const tiredActors=v.actors.map(a=>a.id==='llama'?{...a,energy:28,mood:90}:a);
 expect(reactionFor({...v,actors:tiredActors},'llama')).toBe('sleepy');

 const heavyActors=v.actors.map(a=>a.id==='llama'?{...a,energy:80,load:9}:a);
 expect(reactionFor({...v,actors:heavyActors},'llama')).toBe('surprised');

 const stopView={...v,possibleStops:['llama']};
 expect(reactionFor(stopView,'llama')).toBe('surprised');

 const upbeatActors=v.actors.map(a=>a.id==='llama'?{...a,energy:80,mood:85,load:2}:a);
 expect(reactionFor({...v,actors:upbeatActors},'llama')).toBe('happy');
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

 const duos=findActiveTeamDuos(living.duos,['bluewhale','qwen']);
 expect(duos.some(d=>d.id==='bluewhale-qwen')).toBe(true);

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
