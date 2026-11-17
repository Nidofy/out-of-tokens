import type {CharacterBarkSet,ClientPersonaDef,DuoDef,GiftDef,LivingContent,LivingView,Member} from 'oot-core';
import type {GameView,NextPeriodPreview} from 'oot-platform';
import {content} from './content.js';
import {clientArt,emoteArt,giftArt,teaBreakArt} from './living-art.js';
import {actorStopKindFromPreview} from './experience-adapter.js';
import {isActorOverloaded} from './scene-layout.js';

export {actorEffectiveContext,isActorOverloaded} from './scene-layout.js';

export type {
 CharacterBarkSet,
 ChatThreadDef,
 ClientPersonaDef,
 DuoBonus,
 DuoDef,
 GiftDef,
 LivingContent,
 LivingView
} from 'oot-core';

export type EmoteKind='coffee'|'idea'|'sweat'|'sleepy'|'rice'|'sparkle';
export type LivingDuoView=LivingView['duos'][number];
export type LivingThreadView=LivingView['threads'][number];

export function fnvHash(input:string):number{
 let h=2166136261;
 for(let i=0;i<input.length;i++){
  h^=input.charCodeAt(i);
  h=Math.imul(h,16777619);
 }
 return h>>>0;
}

export function getLivingCatalog(view:GameView):LivingContent{
 return view.catalog?.living??content.campaign!.living!;
}

export function getLivingView(view:GameView):LivingView{
 return view.living;
}

export function emoteAssetSrc(emote:EmoteKind):string{
 return emoteArt(emote);
}

export function giftAssetSrc(giftId:string):string{
 return giftArt(giftId);
}

export function clientAssetSrc(clientId:string):string{
 return clientArt(clientId);
}

export function teaBreakAssetSrc():string{
 return teaBreakArt;
}

export function giftReactionTier(gift:GiftDef,actorId:string):'love'|'like'|'normal'{
 if(gift.lovedBy.includes(actorId))return 'love';
 if(gift.likedBy.includes(actorId))return 'like';
 return 'normal';
}

export function pickSocialBark(
 catalog:LivingContent,
 actorId:string,
 action:'chat'|'giftLove'|'giftNormal'|'meal'|'study',
 affinity:number,
 english:boolean
):string{
 const set=catalog.barks[actorId]?.social[action];
 if(!set)return english?'Got it—happy to pitch in!':'收到，我们一起继续吧！';
 const tier=affinity>=60?2:affinity>=25?1:0;
 const pair=set[tier]??set[0];
 return pair[english?1:0];
}

export function pickWorkBark(
 catalog:LivingContent,
 actorId:string,
 key:keyof CharacterBarkSet['work'],
 english:boolean
):string{
 const pair=catalog.barks[actorId]?.work[key];
 if(!pair)return english?'Ready at the station!':'工位已就绪，开始推进！';
 return pair[english?1:0];
}

export function pickEventQuote(
 catalog:LivingContent,
 eventId:string,
 actorId:string|undefined,
 english:boolean
):string{
 const entry=catalog.eventQuotes[eventId];
 if(entry){
  const pair=(actorId&&entry.byActor?.[actorId])||entry.default;
  return pair[english?1:0];
 }
 const fallbacks:readonly [string,string][]=[
  ['遇到个意想不到的小插曲，你看按哪条思路应对最合适？','Hit a quick fork in the road—which angle should we take?'],
  ['现场弹了条新状况，大家停手等你的决断呢。','Unexpected wrinkle on the desk—holding for your call.'],
  ['这局变数有点意思，拿主意后我们立刻跟上执行！','Interesting twist on this phase—give the word and we execute!']
 ];
 return fallbacks[fnvHash(eventId+(actorId??''))%fallbacks.length]![english?1:0];
}

export function resolveClientPersona(catalog:LivingContent,job:Pick<GameView['jobs'][number],'template'|'title'>):ClientPersonaDef{
 const spec=content.commissions.find(t=>t.id===job.template);
 let id:string|undefined;
 if(job.template==='menu'||job.template.includes('menu'))id='tea-lin';
 else if(job.template.includes('book'))id='book-zhou';
 else if(spec?.client==='rush'||job.template.includes('incubator')||job.template.includes('pitch'))id='vc-lu';
 else if(spec?.category==='media'||spec?.category==='design')id=spec.client==='novice'?'tea-lin':'curator-su';
 else if(spec?.category==='code')id=spec.client==='expert'?'tech-yan':'oss-zhe';
 else if(spec?.category==='data'||spec?.category==='research')id=spec.client==='expert'?'tech-yan':'book-zhou';
 else if(spec?.category==='write')id=spec.client==='novice'?'tea-lin':'book-zhou';
 else{
  const sig=`${job.template}|${job.title}`;
  if(sig.includes('代码')||sig.includes('接口')||sig.includes('测试'))id='tech-yan';
  else if(sig.includes('视频')||sig.includes('分镜')||sig.includes('展')||sig.includes('视觉'))id='curator-su';
  else if(sig.includes('开源')||sig.includes('PR')||sig.includes('文档'))id='oss-zhe';
 }
 id??=catalog.clients[fnvHash(job.template)%catalog.clients.length]!.id;
 return catalog.clients.find(c=>c.id===id)??catalog.clients[0]!;
}

export function pickSlotBeat(catalog:LivingContent,fromSlot:number,toSlot:number,english:boolean):string{
 const period=toSlot%4;
 const key:keyof LivingContent['slotBeats']=period===1?'toAfternoon':period===2?'toEvening':period===3?'toNight':'toMorning';
 const list=catalog.slotBeats[key];
 return list[fnvHash(`${fromSlot}->${toSlot}`)%list.length]![english?1:0];
}

export function findActiveTeamDuos(
 view:GameView,
 job:Pick<GameView['jobs'][number],'template'|'delivery'>,
 draftTeam:readonly Pick<Member,'character'|'role'|'mode'>[],
 catalog:LivingContent=getLivingCatalog(view)
):LivingDuoView[]{
 return evaluateTeamDuos(view,job,draftTeam,catalog).filter(x=>x.state==='active').map(x=>x.duo);
}

export type TeamDuoState='locked'|'inactive'|'active';

export interface TeamDuoEvaluation {
 duo:LivingDuoView;
 def:DuoDef;
 state:TeamDuoState;
 statusZh:string;
 statusEn:string;
 reasonZh:string;
 reasonEn:string;
}

export function evaluateTeamDuos(
 view:GameView,
 job:Pick<GameView['jobs'][number],'template'|'delivery'>,
 draftTeam:readonly Pick<Member,'character'|'role'|'mode'>[],
 catalog:LivingContent=getLivingCatalog(view)
):TeamDuoEvaluation[]{
 const membersByActor=new Map(draftTeam.map(m=>[m.character,m]));
 const spec=content.commissions.find(t=>t.id===job.template);
 const category=spec?.category;
 const delivery=job.delivery??spec?.delivery??'oneshot';
 const out:TeamDuoEvaluation[]=[];

 for(const duo of view.living.duos){
  const [aId,bId]=duo.actors;
  if(!membersByActor.has(aId)||!membersByActor.has(bId))continue;
  const def=catalog.duos.find(x=>x.id===duo.id);
  if(!def)continue;

  if(!duo.unlocked){
   const rem=Math.max(1,def.minDeliveries-duo.sharedDeliveries);
   out.push({
    duo,def,state:'locked',
    statusZh:'未解锁',statusEn:'Locked',
    reasonZh:duo.sharedDeliveries>=def.minDeliveries
     ?'已满同队交付次数，前往伙伴档案召开搭档茶会后可激活'
     :`还差 ${rem} 次同队交付可召开茶会解锁`,
    reasonEn:duo.sharedDeliveries>=def.minDeliveries
     ?'Co-deliveries met; host duo tea in Partner Profile to unlock'
     :`${rem} more co-delivery needed for duo tea`
   });
   continue;
  }

  if(def.bonus.kind==='clarify'){
   const q=view.actors.find(a=>a.id===aId),k=view.actors.find(a=>a.id===bId);
   const sameScene=!!q&&!!k&&q.location!=='expedition'&&q.location===k.location;
   out.push({
    duo,def,state:'inactive',
    statusZh:'仅澄清生效',statusEn:'Clarify only',
    reasonZh:sameScene
     ?'仅作用于需求澄清（同景澄清率 +12%），不提供工单执行加成'
     :'仅作用于需求澄清（需两人同景），不提供工单执行加成',
    reasonEn:sameScene
     ?'Applies to brief clarification only (+12% chance); no job execution bonus'
     :'Applies to brief clarification only (same scene required); no job execution bonus'
   });
   continue;
  }

  if(def.bonus.mode&&!duo.actors.every(id=>membersByActor.get(id)?.mode===def.bonus.mode)){
   out.push({
    duo,def,state:'inactive',
    statusZh:'当前不生效',statusEn:'Inactive',
    reasonZh:def.bonus.mode==='local'?'需两位搭档均切换为「本地」部署模式':'需两位搭档均切换为「云端」部署模式',
    reasonEn:def.bonus.mode==='local'?'Requires both partners in Local mode':'Requires both partners in Cloud mode'
   });
   continue;
  }

  if(duo.id==='kimi-glm'&&!['write','research'].includes(category??'')){
   out.push({
    duo,def,state:'inactive',
    statusZh:'当前不生效',statusEn:'Inactive',
    reasonZh:'仅在写作或研究类委托中提供质量加成',
    reasonEn:'Applies to writing or research commissions only'
   });
   continue;
  }

  if(duo.id==='gpt-gemini'&&!['design','media'].includes(category??'')){
   out.push({
    duo,def,state:'inactive',
    statusZh:'当前不生效',statusEn:'Inactive',
    reasonZh:'仅在设计或媒体类委托中提供产出加成',
    reasonEn:'Applies to design or media commissions only'
   });
   continue;
  }

  if(def.bonus.category&&category!==def.bonus.category){
   out.push({
    duo,def,state:'inactive',
    statusZh:'当前不生效',statusEn:'Inactive',
    reasonZh:'仅在媒体类委托中减少缺陷累计',
    reasonEn:'Applies to media commissions only'
   });
   continue;
  }

  if(duo.id==='gemini-minimax'&&delivery==='oneshot'){
   out.push({
    duo,def,state:'inactive',
    statusZh:'当前不生效',statusEn:'Inactive',
    reasonZh:'仅在多期或长期维护合同中生效',
    reasonEn:'Applies to multi-phase or retainer contracts only'
   });
   continue;
  }

  if(duo.id==='mistral-seedance'&&view.absoluteSlot%4!==0){
   out.push({
    duo,def,state:'inactive',
    statusZh:'本时段不生效',statusEn:'Inactive now',
    reasonZh:'仅在「上午」时段执行时提供产出加成',
    reasonEn:'Applies during Morning slots only'
   });
   continue;
  }

  out.push({
   duo,def,state:'active',
   statusZh:'当前生效',statusEn:'Active',
   reasonZh:duo.desc,
   reasonEn:duo.descEn
  });
 }

 return out;
}

const stopLines:Record<'cloud'|'local',readonly (readonly [string,string])[]>={
 local:[
  ['本地算力排满了，这槽可能得等机架腾出空位。','Local compute is full this period—I may have to pause until capacity clears.'],
  ['本地算力预算吃紧，要不要调整部署模式或排期？','Local compute budget is short—consider switching modes or pacing work.']
 ],
 cloud:[
  ['云端额度快见底了，这槽推进可能会停摆。','Cloud credits are running short—my pass may stall this period.'],
  ['云端额度不够跑完这轮了，要不要先补点额度？','Not enough cloud quota for this pass—should we top up credits first?']
 ]
};

export interface StageBubbleItem {
 id:string;
 actorId:string;
 text:string;
 emote:EmoteKind;
 buddyId?:string|undefined;
 buddyText?:string|undefined;
}

export function pickStageChatter(
 view:GameView,
 catalog:LivingContent,
 livingView:LivingView,
 english:boolean,
 stepSeed:number,
 previewStops?:NextPeriodPreview['stops']
):StageBubbleItem|null{
 const scene=view.campaign?.scene??'workshop';
 const candidates=view.actors.filter(a=>a.location===scene);
 if(candidates.length===0)return null;

 const slotIdx=view.absoluteSlot%4;
 const activeDuos=livingView.duos.filter(d=>candidates.some(a=>a.id===d.actors[0])&&candidates.some(a=>a.id===d.actors[1]));
 const unlockedDuos=activeDuos.filter(d=>d.unlocked);
 const banterPool=unlockedDuos.length>0?unlockedDuos:activeDuos;
 if(banterPool.length>0&&stepSeed%3===1){
  const duo=banterPool[fnvHash(`${view.absoluteSlot}:${stepSeed}:duo`)%banterPool.length]!;
  const def=catalog.duos.find(x=>x.id===duo.id);
  if(def&&def.banter.length>=2){
   const first=def.banter[0]!,second=def.banter[1]!;
   return {
    id:`banter:${def.id}:${stepSeed}`,
    actorId:first.speaker,
    text:english?first.en:first.zh,
    emote:'sparkle',
    buddyId:second.speaker,
    buddyText:english?second.en:second.zh
   };
  }
 }

 const speaker=candidates[fnvHash(`${view.day}:${view.absoluteSlot}:${stepSeed}`)%candidates.length]!;
 const b=catalog.barks[speaker.id]?.stage;
 if(!b)return null;

 let situation:keyof CharacterBarkSet['stage']='morning';
 let emote:EmoteKind='coffee';
 if(speaker.energy<35){situation='tired';emote='sleepy';}
 else if(isActorOverloaded(view,speaker.id)){situation='overload';emote='sweat';}
 else if(view.possibleStops.includes(speaker.id)){
  const stopKind=actorStopKindFromPreview(previewStops,speaker.id)??'cloud';
  const list=stopLines[stopKind];
  const line=list[fnvHash(`${speaker.id}:stop-${stopKind}:${stepSeed}`)%list.length]!;
  return {
   id:`chat:${speaker.id}:stop-${stopKind}:${stepSeed}`,
   actorId:speaker.id,
   text:line[english?1:0],
   emote:'sweat'
  };
 }
 else if(scene==='canteen'){situation='canteen';emote='rice';}
 else if(scene==='library'){situation='library';emote='idea';}
 else if(view.jobs.some(j=>j.status==='delivered'&&j.team.some(m=>m.character===speaker.id))&&stepSeed%4===0){situation='win';emote='sparkle';}
 else if(view.jobs.some(j=>j.status==='working'&&j.team.some(m=>m.character===speaker.id))&&slotIdx<2){situation='work';emote='idea';}
 else if(slotIdx>=2){situation='canteen';emote='coffee';}

 const pool=b[situation];
 const line=pool[fnvHash(`${speaker.id}:${situation}:${stepSeed}`)%pool.length]!;
 return {
  id:`chat:${speaker.id}:${situation}:${stepSeed}`,
  actorId:speaker.id,
  text:line[english?1:0],
  emote
 };
}
