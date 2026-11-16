import {expect,test} from 'vitest';
import {loadFullContent} from 'oot-content';
import {labSession} from '../web/src/office-lab.js';
import {resolveGlobalShortcut} from '../web/src/ui2-logic.js';
import {reactionFor} from '../web/src/scene-layout.js';
import {
 emptyLocalLivingState,
 findActiveTeamDuos,
 getLivingCatalog,
 getLivingView,
 giftReactionTier,
 pickEventQuote,
 pickSlotBeat,
 pickSocialBark,
 pickStageChatter,
 pickWorkBark,
 resolveClientPersona
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

test('living-adapter resolves affinity-tiered barks, client personas, team duos and stage chatter cleanly',()=>{
 const g=labSession(loadFullContent(),'standard'),v=g.view;
 const catalog=getLivingCatalog(v);
 const living=getLivingView(v,emptyLocalLivingState());

 const lowBark=pickSocialBark(catalog,'qwen','chat',10,false);
 const midBark=pickSocialBark(catalog,'qwen','chat',40,false);
 const highBark=pickSocialBark(catalog,'qwen','chat',85,false);
 expect(lowBark.length).toBeGreaterThan(0);
 expect(midBark.length).toBeGreaterThan(0);
 expect(highBark.length).toBeGreaterThan(0);
 expect(new Set([lowBark,midBark,highBark]).size).toBe(3);

 const loveGift=catalog.gifts.find(item=>item.id==='rice-bento')!;
 expect(giftReactionTier(loveGift,'bluewhale')).toBe('love');

 const persona=resolveClientPersona(catalog,{template:'menu-copy',title:'茶饮新品文案与社媒海报'});
 expect(persona.id).toBe('tea-lin');
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
