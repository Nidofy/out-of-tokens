import {chapterBannerArt,eventArt,ritualBackdropArt} from './generated-art.js';
import './generated-art.css';
import {sceneCamera,initialSceneCamera,dismissPresence} from './scene-navigation.js';
import {loadScene,preloadWorkshop} from './scene-preload.js';
import {visualReviewEnabled} from './visual-review.js';
import {actorFocus,jobFocus,zoneNames,clampOfficePan,zoomOfficeCamera,defaultCameraPan} from './office-scene-spec.js';
import type {CameraPan,OfficeFocus,CameraZone} from './office-scene-spec.js';
import type {Furniture} from 'oot-core';
import {Onboarding} from './onboarding.js';
import {characterPosters,resolveCharacterVisual,stageBPortrait,recruitmentBlock,recruitmentReasons} from './character-profiles.js';
import {effectLabel} from './player-labels.js';
import {controllerTracker} from './update-observer.js';
import {Icon} from './icons.js';
import {Portrait,actorIds,sceneArt,chapterPlaces} from './studio-ui.js';
import {waitingUpdate,activateUpdate} from './updates.js';
import {useEffect,useMemo,useRef,useState,useReducer} from 'preact/hooks';
import type {DraftTeam,JobFilter} from './commission-workbench.js';
import {CommissionHudTracker} from './commission-tracker.js';
import {trackingState,readTrackingPin,writeTrackingPin,commissionNotice} from './commission-tracking.js';
import './commission.css';
import {FeedbackNotice,feedbackSurface} from './feedback-notice.js';
import type {Command} from 'oot-core';
import type {CapacityExplanation,GameView} from 'oot-platform';
import type {DeliveryFeedbackPayload} from './delivery-feedback-ui.js';
import {useGame} from './use-game.js';
import {names} from './presentation.js';
import {sceneText,skillText} from './ui-labels.js';
import {StageHubShell} from './stage-hub.js';
import {HudBar} from './hud-bar.js';
import type {FloatDelta} from './hud-bar.js';
import type {StudioTab} from './studio-hub.js';
import type {JournalTab} from './journal-hub.js';
import {isFlagshipUnlocked,resolveGlobalShortcut} from './ui2-logic.js';
import type {HubPanel,ProfileTab} from './ui2-logic.js';
import {formatAdvanceDisplay} from './experience-adapter.js';
import type {ActorHeadAnchor} from './office-scene.js';
import {readAudioPrefs,writeAudioPrefs,unlockAudio,playFoley,playVoiceBlip,syncAmbience} from './audio-foley.js';
import {getLivingCatalog,getLivingView,giftReactionTier,pickSocialBark,pickEventQuote,pickSlotBeat,pickStageChatter} from './living-adapter.js';
import type {DuoDef,GiftDef} from './living-adapter.js';
import {EmoteBadge,StageChatterOverlay,PeriodBeatBanner} from './stage-chatter.js';
import {BarkOverlay} from './bark-overlay.js';
import type {BarkPayload} from './bark-overlay.js';
import {createBrowserUiStore,createMemoryUiStore,readThreadReadIds,markThreadRead,countUnreadThreads,readLastTeamDraft,writeLastTeamDraft} from './experience-ui-state.js';
import type {Member} from 'oot-core';
import {SaveAlertBanner,SwitchConfirmDialog,saveBannerIncidentKey} from './save-status-ui.js';

type Tr=(zh:string,en:string)=>string;
type ReturnContext={panel:'jobs';jobId:string}|{panel:'actors';actorId:string};
type RitualCard={kind:'recruit'|'version'|'chapter';title:string;subtitle:string;badge:string;img:string;themeColor:string;sWord?:string};
type SecondaryPanels=typeof import('./secondary-panels.js');

export {preloadWorkshop};
let secondaryMod:SecondaryPanels|null=null;
let secondaryTask:Promise<SecondaryPanels>|undefined;
const loadSecondaryPanels=()=>secondaryTask??=import('./secondary-panels.js').then(m=>(secondaryMod=m));

function Scene({view,english,select,furniture,camera,zone,zoom,pan,onCamera,presence,anchors,paused,capacityByActor}:{paused:boolean;zone:CameraZone;zoom:number;pan:CameraPan;onCamera:(next:{zoom:number;pan:CameraPan;clearFocus?:boolean|undefined})=>void;presence:(ids:string[])=>void;anchors?:(next:Record<string,ActorHeadAnchor>)=>void;camera:OfficeFocus;view:GameView;english:boolean;select:(id:string)=>void;furniture:(id:string)=>void;capacityByActor?:Readonly<Record<string,CapacityExplanation>>}){
 const host=useRef<HTMLDivElement>(null),scene=useRef<Awaited<ReturnType<typeof import('./scene.js')['createWorkshop']>>|null>(null),latest=useRef({view,english,camera,zone,zoom,pan,paused,capacityByActor}),presenceRef=useRef(presence),anchorsRef=useRef(anchors),cameraRef=useRef(onCamera),click=useRef(select),furnitureClick=useRef(furniture);
 furnitureClick.current=furniture;latest.current={view,english,camera,zone,zoom,pan,paused,capacityByActor};presenceRef.current=presence;anchorsRef.current=anchors;cameraRef.current=onCamera;click.current=select;
 const[failed,setFailed]=useState(false);
 useEffect(()=>{let dead=false;void loadScene().then(m=>{if(import.meta.env.DEV&&new URLSearchParams(location.search).get('test-fault')==='renderer')throw Error('TEST_RENDER_FAILURE');return m;}).then(m=>m.createWorkshop(host.current!,id=>click.current(id),id=>furnitureClick.current(id),ids=>presenceRef.current(ids),next=>cameraRef.current(next),next=>anchorsRef.current?.(next),latest.current.view)).then(s=>{if(dead){s.destroy();return;}scene.current=s;s.update(latest.current.view,latest.current.english?'en':'zh',latest.current.camera,latest.current.zone,latest.current.zoom,latest.current.pan,latest.current.paused,latest.current.capacityByActor);}).catch(()=>{if(!dead)setFailed(true);});return()=>{dead=true;scene.current?.destroy();scene.current=null;};},[]);
 useEffect(()=>scene.current?.update(view,english?'en':'zh',camera,zone,zoom,pan,paused,capacityByActor),[view,english,camera,zone,zoom,pan,paused,capacityByActor]);
 return <div class="workshop" ref={host} aria-label={english?'Current scene; use the navigation below':'当前场景；可通过下方导航操作'}>{failed&&<p class="scene-fallback">{english?'Scene unavailable. All controls below still work.':'场景暂不可用，下方操作仍可使用。'}</p>}</div>;
}

const messages:Record<string,[string,string]>={DONE:['安排好了。','Done.'],SAVED:['进度已保存。','Progress saved.'],LOADED:['存档已载入。','Save loaded.'],EXPORTED:['已导出进度。','Save exported.'],BAD_JSON:['JSON格式损坏，当前进度不变。','Invalid JSON. Current progress is unchanged.'],EXTERNAL_CHANGE:['另一窗口更新了存档，自动保存已暂停。请先载入最新档。','Another tab updated saves. Autosave paused; load the latest save.'],AUTO_PAUSED:['自动存档暂停，请先载入最新档。','Autosave paused. Load the latest save.'],SAVE_CONFLICT:['存档已被更新，请载入后再保存。','Save changed elsewhere. Load it before saving.'],STORAGE_UNAVAILABLE:['存储不可用，可继续玩并导出进度。','Storage unavailable. Continue playing and export your progress.'],IMPORTED_NO_STORAGE:['文件已载入，后续请用导出保存。','Imported. Use export to save further progress.'],INCOMPATIBLE_SAVE:['版本不兼容，请用原版本打开。','Incompatible save. Open it with its original version.'],HASH_MISMATCH:['存档校验失败，当前进度保持不变。','Save integrity check failed. Current progress is unchanged.'],ACTOR_BUSY:['伙伴正在忙碌，请推进时段或换人。','This character is busy. Advance time or choose someone else.'],ACTOR_ELSEWHERE:['先去同一场景找伙伴。','Visit the character in their current scene.'],WRONG_SCENE:['这项活动需要去食堂或图书馆。','Visit the appropriate scene for this activity.'],INSUFFICIENT_RESOURCES:['现金或研发点不足。','Not enough cash or research points.'],INSUFFICIENT_CASH:['现金不足。','Not enough cash.'],STORY_LOCKED:['剧情好感、位置或时段条件未满足。','Story requirements, location or availability are not met.'],CHAPTER_LOCKED:['本章经营目标尚未完成。','This chapter business goal is not complete.'],CRISIS_SMALL_ONLY:['危机期仅能接总量≤40WP的合同。','During a crisis, only contracts up to 40 total WP are allowed.'],VERSION_LOCKED:['请先研发该版本。','Research that version first.'],UPGRADE_LOCKED:['请完成前置研发；已安装升级不能重复购买。','Complete prerequisites; installed upgrades cannot be bought twice.'],TRAINING_LIMIT:['已达该版本训练上限。','This version has reached its training limit.'],TRAINING_LOCKED:['只有空闲开源角色能训练。','Only idle open-source characters can train.'],RECRUIT_LOCKED:['招募需要达到章节、声望和资金条件，且不能重复招募。','Recruitment requires the chapter, reputation and cash; each teammate joins once.'],INVALID_ROLES:['至少一位执行者，负责人和审查者各最多一位。','Use at least one worker and at most one planner and reviewer.'],PENDING_CHOICE:['先处理当前事件。','Resolve the pending event first.'],Clarified:['揭示了新的需求，请查看委托。','A requirement was revealed. Check the commission.'],ClarificationMiss:['这次未揭示新要求，仍消耗个人时段。','No new requirement was revealed; the personal slot was used.'],DayEnd:['新的一天，配额已刷新。','A new day; quota refreshed.'],SlotResolved:['时段已推进。','Time advanced.'],CommandApplied:['委托操作已完成。','Commission updated.'],PendingChoice:['发生了一件事。','An event needs your decision.']};
const officeErrors:Record<string,[string,string]>={NO_WORKSTATION:['电脑工位不足，请补购工位或减少电脑岗位。','Not enough computer stations. Buy one or reduce computer roles.'],NO_MEETING_SEAT:['会议席位不足，请放置白板或减少会议岗位。','Not enough meeting seats. Place a whiteboard or reduce meeting roles.'],FURNITURE_IN_USE:['该设施正在被任务使用，验收或结束任务后再调整。','This facility is reserved by a job. Finish the job before changing it.'],OFFICE_CONFLICT:['布局已变化，请退出后重新打开。','Layout changed. Close and reopen the editor.'],OFFICE_NO_CHANGES:['布局没有变化。','The layout is unchanged.'],INVALID_OFFICE_SLOT:['家具与槽位类型不匹配。','Furniture does not fit this slot.'],SLOT_OCCUPIED:['该槽位已占用，请交换位置或先收回家具。','This slot is occupied. Swap positions or store the item first.'],INSUFFICIENT_CASH:['现金不足，请减少采购。','Not enough cash. Reduce purchases.'],USE_OFFICE_LAYOUT:['请在布置办公室中管理工位。','Manage stations in Arrange office.'],OfficeArranged:['办公室布置已保存。','Office layout saved.']};
Object.assign(messages,officeErrors,{
 PROJECT_LOCKED:['当前章节尚未开放该项目，或项目还未开始。','This project is unavailable in this chapter or has not started.'],
 PROJECT_ACTIVE:['路线已经确定，请继续当前项目。','A route is already selected. Continue the current project.'],
 PROJECT_ROUTE:['请选择有效的交付路线。','Choose a valid delivery route.'],
 PROJECT_NOT_READY:['先完成当前合同，并达到项目验收要求。','Finish this contract and meet the project acceptance requirement.'],
 PROJECT_COMPLETE:['项目已经归档，不会重复发奖。','This project is archived; rewards cannot be claimed again.'],
 ScopeAgreed:['范围已确认，请核对新合同再接单。','Scope agreed. Read the revised contract before accepting.'],
 SCOPE_NOT_CLARIFIED:['先澄清全部需求，并等待下个时段再协商。','Clarify every requirement and wait until the next period before agreeing on scope.'],
 ACCEPTED:['接单成功，请为委托安排执行者。','Accepted. Assign a worker to begin.'],
 ASSIGNED:['队伍已就位，推进时段开始工作。','Team assigned. Advance time to work.'],
 RECONCILED:['自动档已只读核对，当前进度保留；可以继续保存。','Autosave reconciled. Current progress is preserved.'],
 RECONCILED_EMPTY:['宿主确认所有槽位为空，可以重新保存。','Host confirmed empty slots. You may save again.'],
 EXISTING_SAVE:['宿主已有存档，请显式载入，不覆盖。','A save exists. Load it explicitly before writing.'],
 WRITE_UNCERTAIN:['上次写入结果不确定，请先载入最新档对账；也可导出当前进度。','Write outcome unknown. Load the latest save to reconcile, or export current progress.'],
 Restarted:['新的工作室，新的开始。','A new studio, a new start.'],
 ENDING_FINISHED:['本周目已结束，可选择继续无尽经营。','This run has ended. Continue in endless mode.'],
 CHALLENGE_TEAM:['队伍不符合本周挑战，请调整版本或部署方式。','Adjust versions or deployment for this weekly challenge.'],
 HOST_CLOSED:['宿主已关闭，请重新打开工坊。','Host closed. Reopen the workshop.'],
 INVALID_TEAM:['至少一位执行者，伙伴不可重复；第0–2章最多4人，后续最多6人。','Choose at least one worker without duplicates; at most 4 members in chapters 0–2, then 6.'],
 TOOL_LOCKED:['工具岗位需要先研发工具调用升级，且最多安排1名工具人。','Research the tool-calling upgrade first; at most one tool teammate is allowed.'],
 STILL_CLARIFYING:['澄清占用尚未结束，请推进到下一时段后再接单或试算。','Clarification is still in progress. Advance one period before accepting or previewing.'],
 TEA_COOLDOWN:['今日工坊茶歇已经办过了，明天再来吧。','Today’s studio tea break has already been held.'],
 DUO_LOCKED:['尚未满足搭档茶会解锁条件（需同队交付2次且未解锁）。','Duo synergy requirements are not yet met.'],
 THREAD_LOCKED:['该群聊话题暂不可回复或已回复过。','This chat thread is locked or already answered.'],
 UNKNOWN_GIFT:['未找到该心意礼物。','Unknown gift item.'],
 TIRED:['伙伴精力不足，请先休息或用餐。','Not enough energy. Rest or have a meal first.'],
 LINEAGE_RESET:['宿主存档来源已重置，本局提示与未读状态将按新会话记录。','Host save lineage reset; UI unread and onboarding flags start fresh for this run.'],
 SESSION_SWITCHING:['正在切换会话，请稍候再操作。','Session switch in progress; wait a moment before sending commands.'],
 SWITCH_REQUIRES_CONFIRMATION:['存在未保存或异常状态，请先导出并确认后再切换存档。','Confirm discarding or exporting unsaved progress before switching saves.'],
 ALREADY_HERE:['伙伴已经在工作室里了。','This teammate is already at the workshop.']
});
for(const code of ['FINALE_LOCKED','ENDING_LOCKED','ENDLESS_LOCKED','EXPEDITION_LOCKED','BID_LOCKED','CHALLENGE_LOCKED'])messages[code]=['条件尚未满足，请查看面板要求。','Requirements are not met. Check the panel.'];

export function AlphaApp(){

 const [{sceneFocus,editorFocus,cameraZone,zoom:cameraZoom,pan:cameraPan},cameraDispatch]=useReducer(sceneCamera,initialSceneCamera);
 const [offscreen,setOffscreen]=useState<string[]>([]),[locationsOpen,setLocationsOpen]=useState(false),locationsTrigger=useRef<HTMLButtonElement>(null);
 const [arranging,setArranging]=useState(false),[layoutItems,setLayoutItems]=useState<Furniture[]|null>(null);

 const game=useGame(),{view,busy,send}=game;
 const [panel,updatePanel]=useState<HubPanel|null>(null);
 const [portraitsWarm,setPortraitsWarm]=useState(false);
 const [secondary,setSecondary]=useState<SecondaryPanels|null>(()=>secondaryMod);
 const lastHubRef=useRef<HubPanel>('actors');
 if(panel)lastHubRef.current=panel;
 const [studioTab,setStudioTab]=useState<StudioTab>('overview');
 const [journalTab,setJournalTab]=useState<JournalTab>('chronicle');
 const [preferredProfileTab,setPreferredProfileTab]=useState<ProfileTab>('vitals');
 const [actorEntry,setActorEntry]=useState<'gallery'|'direct'>('gallery');
 const [actorFilter,setActorFilter]=useState<'all'|'recruited'|'available'>('all');
 const [jobFilter,setJobFilter]=useState<JobFilter>('active');
 const [jobId,updateJobId]=useState<string|null>(null),[actorId,setActorId]=useState<string|null>(null);
 const [jobInDetail,setJobInDetail]=useState(false);
 const [draftTeams,setDraftTeams]=useState<Record<string,DraftTeam>>({});
 const [returnTo,setReturnTo]=useState<ReturnContext|null>(null);

 const [mapOpen,setMapOpen]=useState(false),[settings,setSettings]=useState(false),[saves,setSaves]=useState(false);
 const [dark,setDark]=useState(()=>{
  if(visualReviewEnabled&&new URLSearchParams(location.search).has('theme'))return new URLSearchParams(location.search).get('theme')==='dark';
  try{return localStorage.getItem('oot-display-theme')==='1';}catch{return false;}
 });
 const [still,setStill]=useState(()=>{
  if(visualReviewEnabled&&new URLSearchParams(location.search).has('motion'))return new URLSearchParams(location.search).get('motion')==='still';
  try{return localStorage.getItem('oot-display-motion')==='1';}catch{return false;}
 });
 const [english,setEnglish]=useState(()=>{
  if(visualReviewEnabled&&new URLSearchParams(location.search).has('locale'))return new URLSearchParams(location.search).get('locale')==='en';
  try{return localStorage.getItem('oot-display-locale')==='1';}catch{return false;}
 });
 const [reloadReady,setReloadReady]=useState(false),[update,setUpdate]=useState<ServiceWorker|null>(null);
 const [hud,setHud]=useState<'board'|'view'|'more'|null>(null);
 const [ritual,setRitual]=useState<RitualCard|null>(null),[ritualReady,setRitualReady]=useState(false);
 const [deliveryFeedback,setDeliveryFeedback]=useState<DeliveryFeedbackPayload|null>(null);
 const [deltas,setDeltas]=useState<FloatDelta[]>([]);
 const [audioPrefs,setAudioPrefs]=useState(readAudioPrefs);
 const [activeBark,setActiveBark]=useState<BarkPayload|null>(null);
 const [chatOpen,setChatOpen]=useState(false);
 const [periodBeat,setPeriodBeat]=useState<string|null>(null);
 const [anchors,setAnchors]=useState<Record<string,ActorHeadAnchor>>({});
 const [chatterStep,setChatterStep]=useState(0),[banterPhase,setBanterPhase]=useState<0|1>(0);
 const [dismissedSaveKey,setDismissedSaveKey]=useState<string|null>(null);
 const [uiStore]=useState(()=>game.lab?createMemoryUiStore():createBrowserUiStore());
 const [readThreadIds,setReadThreadIds]=useState<Set<string>>(()=>readThreadReadIds(uiStore,game.lineageId));
 const [lastTeam,setLastTeam]=useState<Member[]>(()=>readLastTeamDraft(uiStore,game.lineageId));
 useEffect(()=>{
  setReadThreadIds(readThreadReadIds(uiStore,game.lineageId));
  setLastTeam(readLastTeamDraft(uiStore,game.lineageId));
 },[uiStore,game.lineageId]);

 const moreTrigger=useRef<HTMLButtonElement>(null),boardTrigger=useRef<HTMLButtonElement>(null),chatTrigger=useRef<HTMLButtonElement>(null),jobsTrigger=useRef<HTMLButtonElement>(null);
 const commissionTrigger=useRef<HTMLElement|null>(null),officeTrigger=useRef<HTMLElement|null>(null),officeDockIndex=useRef(-1),managementTrigger=useRef<HTMLElement|null>(null);
 const prevSnap=useRef<{cash:number;quota:number;rp:number;actors:string[];chapter:number;versions:Record<string,string>;awakened:string[]}|null>(null);
 const seenRituals=useRef<Set<string>>(new Set());
 const hydrated=useRef(false);
 const deltaSeq=useRef(0);
 const lastSlotRef=useRef<number|null>(null);
 const barkSeqRef=useRef(0);
 const barkTriggerRef=useRef<HTMLElement|null>(null);

 const [trackedJobId,setTrackedJobId]=useState<string|null>(()=>{if(game.lab)return null;try{return readTrackingPin(false,localStorage);}catch{return null;}});
 useEffect(()=>{if(!game.lab)try{writeTrackingPin(false,localStorage,trackedJobId);}catch{/* Storage denied is harmless. */}},[trackedJobId]);
 const tracking=trackingState(view,trackedJobId),tracked=tracking.id;
 useEffect(()=>{if(trackedJobId&&!tracking.pinned)setTrackedJobId(null);},[tracking.pinned,trackedJobId]);

 const clearTransientState=()=>{prevSnap.current=null;seenRituals.current.clear();lastSlotRef.current=null;setTrackedJobId(null);setDraftTeams({});setReturnTo(null);setActiveBark(null);setPeriodBeat(null);setDeliveryFeedback(null);setDismissedSaveKey(null);};
 const commissionReturnFocus=()=>[commissionTrigger.current,jobsTrigger.current,boardTrigger.current].find(e=>e?.isConnected&&!e.closest('dialog,.studio-drawer,.priority-rail'))??boardTrigger.current;
 const selectCommission=(id:string|null)=>{if(jobId!==id&&jobId)game.dismissLocalFeedback({surface:'job',id:jobId});updateJobId(id);setJobInDetail(!!id);};
 const setJobId=(id:string|null)=>{if(id){if(panel!=='jobs')commissionTrigger.current=document.activeElement as HTMLElement;setHud(null);setActorId(null);updatePanel('jobs');}selectCommission(id);};

 const setPanel=(next:HubPanel|null)=>{
  if(next==='jobs'&&panel!=='jobs'){commissionTrigger.current=document.activeElement as HTMLElement;setHud(null);setActorId(null);selectCommission(null);}
  if(next&&!panel){const active=document.activeElement as HTMLElement|null;managementTrigger.current=active?.closest('.studio-dock')?active:moreTrigger.current;}
  if(next!=='actors')setActorId(null);
  updatePanel(next);
 };

 const closeHub=()=>{
  if(actorId)game.dismissLocalFeedback({surface:'actor',id:actorId});
  if(jobId)game.dismissLocalFeedback({surface:'job',id:jobId});
  setActiveBark(null);setActorId(null);selectCommission(null);updatePanel(null);
  requestAnimationFrame(()=>{if(!document.querySelector('dialog[open]'))(managementTrigger.current??moreTrigger.current)?.focus({preventScroll:true});});
 };

 const openDirectActor=(id:string)=>{
  const active=document.activeElement as HTMLElement|null;
  if(active)managementTrigger.current=active;
  setActiveBark(null);setHud(null);setLocationsOpen(false);
  setActorEntry('direct');setActorId(id);updatePanel('actors');
 };

 const openOffice=(ctx?:ReturnContext)=>{
  if(ctx)setReturnTo(ctx);
  officeTrigger.current=panel?managementTrigger.current:moreTrigger.current;
  officeDockIndex.current=Array.from(document.querySelectorAll('.studio-dock button')).findIndex(button=>button===officeTrigger.current);
  setHud(null);updatePanel(null);setArranging(true);
 };

 useEffect(()=>{if(arranging||!officeTrigger.current)return;const frame=requestAnimationFrame(()=>{const trigger=officeDockIndex.current>=0?document.querySelectorAll<HTMLButtonElement>('.studio-dock button')[officeDockIndex.current]:officeTrigger.current;trigger?.focus({preventScroll:true});officeTrigger.current=null;});return()=>cancelAnimationFrame(frame);},[arranging]);

 const openHud=(next:'board'|'view'|'more')=>{setLocationsOpen(false);updatePanel(null);setHud(hud===next?null:next);};
 useEffect(()=>{if(panel){setHud(null);setLocationsOpen(false);}},[panel]);
 useEffect(()=>{if(!hud)return;const previous=document.activeElement as HTMLElement|null;document.querySelector<HTMLButtonElement>(hud==='view'?'.office-camera button':'.hud-popover button,.priority-rail button')?.focus({preventScroll:true});return()=>{if(previous?.isConnected)previous.focus({preventScroll:true});};},[hud]);

 const tr:Tr=(zh,en)=>english?en:zh,p=view.campaign!,catalog=view.catalog!,locked=busy||!!view.pending||view.bankrupt;
 const job=view.jobs.find(j=>j.id===jobId),actor=view.actors.find(a=>a.id===actorId);
 const closeActor=()=>{if(actorId)game.dismissLocalFeedback({surface:'actor',id:actorId});setActorId(null);};
 const closeJob=()=>{if(jobId)game.dismissLocalFeedback({surface:'job',id:jobId});selectCommission(null);};
 const locate=(focus:OfficeFocus)=>{if(!focus)return;closeActor();closeJob();updatePanel(null);setHud(null);setLocationsOpen(false);cameraDispatch({type:'locate',focus});};
 const resetCamera=()=>cameraDispatch({type:'reset'});
 const cameraMoved=!!(sceneFocus||cameraZone!=='overview'||cameraZoom!==1||Math.abs(cameraPan.x)>=1||Math.abs(cameraPan.y)>=1);
 const stepZoom=(delta:number)=>{
  const stage=document.querySelector<HTMLElement>('.workshop'),w=stage?.clientWidth||innerWidth,h=stage?.clientHeight||innerHeight;
  if(sceneFocus&&cameraZoom===1&&delta<0){cameraDispatch({type:'zoom',zoom:1.3,pan:clampOfficePan(w,h,cameraZone,null,1.3,defaultCameraPan),clearFocus:true});return;}
  const next=zoomOfficeCamera(w,h,cameraZone,sceneFocus,cameraZoom,cameraPan,cameraZoom+delta);
  cameraDispatch({type:'zoom',zoom:next.zoom,pan:next.pan});
 };

 const modalOpen=!!(panel||mapOpen||saves||settings||arranging||chatOpen||view.pending||view.bankrupt||ritual||deliveryFeedback||game.pendingSwitch);
 const closeLocations=(reason:'escape'|'close'|'modal')=>{const next=dismissPresence(locationsOpen,reason,modalOpen);setLocationsOpen(next.open);if(next.restoreFocus)locationsTrigger.current?.focus({preventScroll:true});};
 useEffect(()=>{if(modalOpen)closeLocations('modal');},[modalOpen]);
 useEffect(()=>{resetCamera();setLocationsOpen(false);},[p.scene]);

 useEffect(()=>{
  const curActors=view.actors.map(a=>a.id),curQuota=view.quota+view.purchased,curRp=p.research;
  const curVersions=Object.fromEntries(view.actors.map(a=>[a.id,a.version]));
  const curAwakened=(['grok','glm','minimax','seedance'] as const).filter(id=>view.actors.some(a=>a.id===id)&&isFlagshipUnlocked(view,id,null));
  const snap={cash:view.cash,quota:curQuota,rp:curRp,actors:curActors,chapter:p.chapter,versions:curVersions,awakened:curAwakened};
  if(!hydrated.current){
   if(busy)return;
   hydrated.current=true;
   prevSnap.current=snap;
   return;
  }
  const prev=prevSnap.current;
  if(prev){
   const nextDeltas:FloatDelta[]=[];
   const dc=view.cash-prev.cash,dq=curQuota-prev.quota,dr=curRp-prev.rp;
   if(Math.abs(dc)>=1)nextDeltas.push({id:++deltaSeq.current,kind:'cash',text:`${dc>0?'+':''}¥${dc.toFixed(0)}`,positive:dc>0});
   if(Math.abs(dq)>=1)nextDeltas.push({id:++deltaSeq.current,kind:'quota',text:`${dq>0?'+':''}${dq.toFixed(0)} T`,positive:dq>0});
   if(dr!==0)nextDeltas.push({id:++deltaSeq.current,kind:'rp',text:`${dr>0?'+':''}${dr} RP`,positive:dr>0});
   if(nextDeltas.length>0&&!still)setDeltas(list=>[...list,...nextDeltas].slice(-3));

   if(!visualReviewEnabled&&!game.lab){
    const addedActor=curActors.find(id=>!prev.actors.includes(id)&&!seenRituals.current.has(`rec:${id}`));
    if(addedActor){
     seenRituals.current.add(`rec:${addedActor}`);
     const pos=characterPosters[addedActor]!;
     setRitual({kind:'recruit',title:names[addedActor]??addedActor,subtitle:pos.tagline[english?1:0],badge:tr('新伙伴入驻','New teammate'),img:`./art/ai-village/portraits/${addedActor}.png`,themeColor:pos.themeColor,sWord:pos.sWord});
    }else if(p.chapter>prev.chapter&&!seenRituals.current.has(`ch:${p.chapter}`)){
     seenRituals.current.add(`ch:${p.chapter}`);
     const chapterNames=[tr('开源车库联盟','Open-source garage'),tr('第一笔大订单','The first large order'),tr('模型更新之夜','Model release night'),tr('429危机','The 429 crisis'),tr('最后一个Token','The last token')];
     setRitual({kind:'chapter',title:chapterNames[p.chapter]??'',subtitle:tr('工作室迈入全新阶段','Your studio reached a new stage'),badge:`CHAPTER ${p.chapter}`,img:chapterBannerArt(p.chapter),themeColor:'#9a6318'});
    }else{
     const switchedAdv=view.actors.find(a=>prev.versions[a.id]&&prev.versions[a.id]!==a.version&&resolveCharacterVisual(a.id,a.version,'profile').src.includes('/art/stage-b/')&&!seenRituals.current.has(`ver:${a.version}`));
     if(switchedAdv){
      seenRituals.current.add(`ver:${switchedAdv.version}`);
      const pos=characterPosters[switchedAdv.id]!;
      setRitual({kind:'version',title:`${names[switchedAdv.id]} · ${switchedAdv.version}`,subtitle:pos.tagline[english?1:0],badge:tr('进阶版本觉醒','Advanced version'),img:resolveCharacterVisual(switchedAdv.id,switchedAdv.version,'profile').src,themeColor:pos.themeColor,sWord:pos.sWord});
     }else{
      const awakenedId=curAwakened.find(id=>!prev.awakened.includes(id)&&!seenRituals.current.has(`awk:${id}`));
      const awakenedArt=awakenedId?stageBPortrait(awakenedId):null;
      if(awakenedId&&awakenedArt){
       seenRituals.current.add(`awk:${awakenedId}`);
       const pos=characterPosters[awakenedId]!;
       setRitual({kind:'version',title:names[awakenedId]??awakenedId,subtitle:pos.tagline[english?1:0],badge:tr('旗舰共鸣觉醒','Flagship resonance'),img:awakenedArt,themeColor:pos.themeColor,sWord:pos.sWord});
      }
     }
    }
   }
  }
  prevSnap.current=snap;
 },[view,busy,still]);

 useEffect(()=>{
  if(!ritual){setRitualReady(false);return;}
  if(still){setRitualReady(true);return;}
  const t=setTimeout(()=>setRitualReady(true),350);
  return()=>clearTimeout(t);
 },[ritual,still]);

 useEffect(()=>{
  const onKey=(e:KeyboardEvent)=>{
   const el=e.target as HTMLElement|null;
   const cmd=resolveGlobalShortcut({key:e.key,ctrlKey:e.ctrlKey,metaKey:e.metaKey,altKey:e.altKey,isComposing:e.isComposing,repeat:e.repeat,targetTag:el?.tagName,targetEditable:el?.isContentEditable},{blockedModal:!!(view.pending||view.bankrupt||arranging||saves||settings||mapOpen||ritual||deliveryFeedback||game.pendingSwitch),actorOpen:panel==='actors'&&!!actorId});
   if(!cmd)return;
   e.preventDefault();
   if(cmd.type==='panel'){setActiveBark(null);setChatOpen(false);setPanel(cmd.panel);}
   else if(cmd.type==='map'){setActiveBark(null);setHud(null);setChatOpen(false);setMapOpen(m=>!m);}
   else if(cmd.type==='chat'){setActiveBark(null);setHud(null);updatePanel(null);setChatOpen(o=>!o);}
   else if(cmd.type==='actor-step'&&actorId){
    const idx=actorIds.indexOf(actorId);
    const next=actorIds[(idx+cmd.delta+actorIds.length)%actorIds.length]!;
    setActorId(next);
   }
  };
  window.addEventListener('keydown',onKey);
  return()=>window.removeEventListener('keydown',onKey);
 },[view.pending,view.bankrupt,arranging,saves,settings,mapOpen,ritual,game.pendingSwitch,panel,actorId]);

 const code=game.feedback?.code??'',shownMessage=code.startsWith('REPLAY_')?'HASH_MISMATCH':code;
 const message=shownMessage.startsWith('DELIVERED:')?tr('本阶段已结算，现金变动 ¥','Phase settled. Cash change ¥')+shownMessage.slice(10):shownMessage?(messages[shownMessage]?.[english?1:0]??tr('操作提示：','Action: ')+code):tr('读一张委托，再安排合适的伙伴。','Read a commission, then choose the right team.');
 const feedbackChannel=feedbackSurface(game.feedback,{job:job?.id,actor:actorId??undefined,saves,modal:!!(panel||chatOpen||view.pending||view.bankrupt||saves||settings||mapOpen||arranging||ritual||game.pendingSwitch)});
 const hideGenericDone=!!activeBark&&shownMessage==='DONE';
 const notice=useMemo(()=><FeedbackNotice feedback={game.feedback} message={message} english={english} dismiss={game.dismissFeedback}/>,[game.feedback,message,english,game.dismissFeedback]);
 const life=(action:Extract<Command,{type:'campaign'}>['action'],id:string,target?:string)=>void send({type:'campaign',action,id,...(target?{target}:{})});
 const fx=(kind:Parameters<typeof playFoley>[0],speakActor?:string)=>{if(still||!audioPrefs.sfx)return;playFoley(kind,true);if(speakActor)playVoiceBlip(speakActor,3,true);};
 const triggerBark=(bark:BarkPayload)=>{
  unlockAudio();
  const active=document.activeElement as HTMLElement|null;
  if(active&&!active.closest('.ui2-bark-card'))barkTriggerRef.current=active;
  setActiveBark({...bark,id:++barkSeqRef.current});
  fx('tap',bark.actorId);
 };
 const dismissBark=()=>{
  const active=document.activeElement as HTMLElement|null;
  const wasInBark=!!active?.closest('.ui2-bark-card');
  setActiveBark(null);
  if(wasInBark){
   requestAnimationFrame(()=>{
    const prev=barkTriggerRef.current;
    if(prev?.isConnected&&!(prev as HTMLButtonElement).disabled){prev.focus({preventScroll:true});return;}
    document.querySelector<HTMLElement>('dialog[open] .stage-hub-close, dialog[open]')?.focus({preventScroll:true});
   });
  }
 };
 const updateAnchors=(next:Record<string,ActorHeadAnchor>)=>{
  setAnchors(prev=>{
   const keys=Object.keys(next);
   if(keys.length===Object.keys(prev).length&&keys.every(k=>{const a=prev[k],b=next[k];return a&&b&&a.x===b.x&&a.y===b.y&&a.visible===b.visible;}))return prev;
   return next;
  });
 };
 const toggleSfx=()=>{unlockAudio();setAudioPrefs(prev=>{const next={...prev,sfx:!prev.sfx};writeAudioPrefs(next);if(next.sfx)playFoley('tap',true);return next;});};
 const toggleAmbience=()=>{unlockAudio();setAudioPrefs(prev=>{const next={...prev,ambience:!prev.ambience};writeAudioPrefs(next);return next;});};
 const scene=(id:keyof typeof sceneText|'expedition')=>id==='expedition'?tr('远征中','On expedition'):sceneText[id][english?1:0];
 const chapterTitles=[tr('开源车库联盟','Open-source garage'),tr('第一笔大订单','The first large order'),tr('模型更新之夜','Model release night'),tr('429危机','The 429 crisis'),tr('最后一个Token','The last token')];
 const hubOpen=!!(panel&&!view.pending&&!view.bankrupt);
 const activeHub:HubPanel=panel??lastHubRef.current;
 const showPortraits=portraitsWarm||hubOpen;
 useEffect(()=>{if(hubOpen&&!portraitsWarm)setPortraitsWarm(true);},[hubOpen,portraitsWarm]);
 const needSecondary=!!(arranging||chatOpen||saves||settings||mapOpen||view.pending||view.bankrupt||ritual||deliveryFeedback||(hubOpen&&(activeHub!=='actors'||!!actorId)));
 useEffect(()=>{if(needSecondary&&!secondary)void loadSecondaryPanels().then(m=>setSecondary(m));},[needSecondary,secondary]);
 const nextPeriod=useMemo(()=>game.session.previewNextPeriod(),[game.session,view]);
 const experienceView=useMemo(()=>game.session.getExperienceView(),[game.session,view]);
 const needsFinance=hubOpen&&(activeHub==='studio'||activeHub==='journal');
 const financeExplanation=useMemo(()=>needsFinance?game.session.explainFinance():null,[game.session,view,needsFinance]);
 const capacityByActor=useMemo(()=>Object.fromEntries(view.actors.map(a=>[a.id,game.session.explainActorCapacity(a.id)])),[game.session,view]);
 const previewAct=(c:Command)=>game.session.previewActivity(c);
 const advanceInfo=useMemo(()=>formatAdvanceDisplay(nextPeriod,busy,arranging,english,view.jobs),[nextPeriod,busy,arranging,english,view.jobs]);
 const livingCatalog=useMemo(()=>getLivingCatalog(view),[view]);
 const livingView=useMemo(()=>getLivingView(view),[view]);
 const unreadThreads=useMemo(()=>countUnreadThreads(livingView.threads,readThreadIds),[livingView.threads,readThreadIds]);
 const chatterBubble=useMemo(()=>pickStageChatter(view,livingCatalog,livingView,english,chatterStep,nextPeriod.stops,capacityByActor),[view,livingCatalog,livingView,english,chatterStep,nextPeriod.stops,capacityByActor]);
 const sceneView=useMemo(()=>layoutItems&&view.office?{...view,office:{...view.office,items:layoutItems}}:view,[view,layoutItems]);
 const posterCards=useMemo(()=>actorIds.filter(id=>actorFilter==='all'||(actorFilter==='recruited')===view.actors.some(a=>a.id===id)).map(id=>{
  const a=view.actors.find(x=>x.id===id),r=catalog.recruits.find(x=>x.character===id),poster=characterPosters[id]!,v=catalog.versions.find(x=>a?x.id===a.version:x.character===id)!,visual=resolveCharacterVisual(id,v.id),block=r?recruitmentBlock(view,r,locked):null;
  const top=Object.entries(a?.skills??v.skills).filter(([k])=>k!=='recall').sort((x,y)=>y[1]-x[1]).slice(0,2).map(([k])=>k);
  return {id,a,r,poster,v,visual,reason:block?recruitmentReasons[block]:null,top};
 }),[view,catalog,actorFilter,locked]);
 const actorsGallery=useMemo(()=>(
  <div class="ui2-hub-content">
   <div class="poster-grid ui2-poster-grid">
    {posterCards.map(({id,a,r,poster,v,visual,reason,top})=>(
     <button class="poster-card" key={id} data-character={id} data-recruited={!!a} data-mirror={poster.mirror} style={{'--poster-color':poster.themeColor}} onClick={()=>{setActorEntry('gallery');setActorId(id);}}>
      <span class="poster-title"><strong class="poster-word">{poster.sWord}</strong><b>{names[id]}</b><span>{poster.tagline[english?1:0]}</span><small>{v.name}</small></span>
      <img class="poster-art" src={showPortraits?visual.src:undefined} alt="" decoding="async"/>
      <span class="poster-check-strip"><span class="poster-stamp">STUDIO O.T.</span>{(['code','write','reason','create','media'] as const).map(k=><span key={k}>{top.includes(k)?'☑':'□'} {skillText[k][english?1:0]}</span>)}</span>
      <span class="poster-status-bar">{a?`${a.location==='expedition'?(english?'On expedition':'远征中'):sceneText[a.location][english?1:0]} · ${english?'Energy':'精力'} ${a.energy} · ${english?'Mood':'心情'} ${a.mood} · ${english?'Load':'负载'} ${a.load}/${capacityByActor[a.id]?.context??''}`:r?<>{english?'Not recruited':'待招募'} · ¥{r.cost} · {english?'Reputation':'声望'} {r.reputation} · {english?'Chapter':'开放章节'} {r.minChapter??0}<br/>{reason?reason[english?1:0]:(english?'Eligible · View profile':'可招募 · 点击查看档案')}</>:null}</span>
     </button>
    ))}
   </div>
   <div class="ui2-card"><small class="ui2-muted-note">{english?'May stop this period':'本槽可能停工'}: {view.possibleStops.map(id=>names[id]).join(', ')||'—'}</small></div>
  </div>
 ),[posterCards,english,view.possibleStops,capacityByActor,showPortraits]);
 const saveIncidentKey=saveBannerIncidentKey(game.saveStatus);
 const showSaveBanner=!!saveIncidentKey&&dismissedSaveKey!==saveIncidentKey;
 useEffect(()=>{if(!saveIncidentKey&&dismissedSaveKey!==null)setDismissedSaveKey(null);},[saveIncidentKey,dismissedSaveKey]);
 const imminentBreach=view.jobs.some(j=>['accepted','working','review'].includes(j.status)&&j.deadline-view.absoluteSlot<=1);
 const urgentPriorityActive=(showSaveBanner&&(game.saveStatus.kind==='paused'||game.saveStatus.kind==='error'))||!!view.pending||imminentBreach;

 useEffect(()=>{
  const unlock=()=>unlockAudio();
  window.addEventListener('pointerdown',unlock,{once:true,passive:true});
  window.addEventListener('keydown',unlock,{once:true,passive:true});
  return()=>{window.removeEventListener('pointerdown',unlock);window.removeEventListener('keydown',unlock);syncAmbience('workshop',false,false);};
 },[]);
 useEffect(()=>{syncAmbience(p.scene,view.absoluteSlot%4>=2,audioPrefs.ambience&&!still);},[p.scene,view.absoluteSlot,audioPrefs.ambience,still]);
 useEffect(()=>{
  if(busy)return;
  const prevSlot=lastSlotRef.current;
  lastSlotRef.current=view.absoluteSlot;
  if(prevSlot!==null&&view.absoluteSlot>prevSlot){
   if(!urgentPriorityActive)setPeriodBeat(pickSlotBeat(livingCatalog,prevSlot,view.absoluteSlot,english));
   fx('advance');
  }
 },[view.absoluteSlot,busy,english]);
 useEffect(()=>{if(!periodBeat)return;const t=setTimeout(()=>setPeriodBeat(null),still?2200:3400);return()=>clearTimeout(t);},[periodBeat,still]);
 useEffect(()=>{if(!activeBark)return;const t=setTimeout(dismissBark,still?4500:5400);return()=>clearTimeout(t);},[activeBark?.id,still]);
 useEffect(()=>{if(ritual)fx('stamp');},[ritual]);
 useEffect(()=>{if(shownMessage.startsWith('DELIVERED:'))fx('coin');},[shownMessage]);
 useEffect(()=>{
  if(modalOpen||arranging||still||visualReviewEnabled)return;
  const timer=setInterval(()=>{setBanterPhase(0);setChatterStep(s=>s+1);},6500);
  return()=>clearInterval(timer);
 },[modalOpen,arranging,still]);
 useEffect(()=>{
  if(modalOpen||arranging||still||visualReviewEnabled||!chatterBubble?.buddyId)return;
  setBanterPhase(0);
  const t=setTimeout(()=>setBanterPhase(1),2600);
  return()=>clearTimeout(t);
 },[chatterBubble?.id,modalOpen,arranging,still]);

 const handleSendGift=async(targetActorId:string,gift:GiftDef,okCb?:()=>void)=>{
  unlockAudio();
  const rel=p.relations[targetActorId];
  const tier=giftReactionTier(gift,targetActorId);
  const ok=await send({type:'campaign',action:'gift',id:targetActorId,target:gift.id},{surface:'actor',id:targetActorId});
  if(!ok)return;
  okCb?.();
  triggerBark({
   id:Date.now(),
   actorId:targetActorId,
   emote:tier==='love'?'sparkle':'coffee',
   label:tr(gift.name,gift.nameEn),
   text:pickSocialBark(livingCatalog,targetActorId,tier==='love'?'giftLove':'giftNormal',rel?.affinity??0,english),
   deltas:tier==='love'
    ?[tr('偏爱礼物','Loved gift'),tr('心情 +16','Mood +16'),tr('好感 +10','Affinity +10'),tr('压力 -10','Stress -10')]
    :tier==='like'
     ?[tr('喜欢礼物','Liked gift'),tr('心情 +12','Mood +12'),tr('好感 +7','Affinity +7'),tr('压力 -5','Stress -5')]
     :[tr('心意送达','Gift received'),tr('心情 +8','Mood +8'),tr('好感 +4','Affinity +4')]
  });
 };
 const handleTeaBreak=async()=>{
  unlockAudio();
  if(locked||!livingView.teaReady)return;
  const ok=await send({type:'campaign',action:'tea',id:'all'});
  if(!ok)return;
  const speaker=view.actors.find(a=>a.location===p.scene)?.id??view.actors[0]?.id??'bluewhale';
  triggerBark({
   id:Date.now(),
   actorId:speaker,
   emote:'coffee',
   label:tr('工坊下午茶','Studio tea break'),
   text:tr('茶歇点心端上桌啦，大家先放慢节奏充会儿电，下半程继续冲刺！','Tea and pastries are served—everyone take a breather before the next sprint!'),
   deltas:[tr('在场精力 +12','Team Energy +12'),tr('心情 +8','Mood +8'),tr('压力 -8','Stress -8')]
  });
 };
 const handleUnlockDuo=async(duo:DuoDef)=>{
  unlockAudio();
  if(locked)return;
  const ok=await send({type:'campaign',action:'duo',id:duo.id});
  if(!ok)return;
  const first=duo.banter[0],second=duo.banter[1];
  triggerBark({
   id:Date.now(),
   actorId:first?.speaker??duo.actors[0],
   partnerId:second?.speaker??duo.actors[1],
   emote:'sparkle',
   label:tr(duo.title,duo.titleEn),
   text:first?(english?first.en:first.zh):tr(duo.desc,duo.descEn),
   partnerText:second?(english?second.en:second.zh):undefined,
   deltas:[tr('搭档默契已激活','Duo Synergy unlocked'),tr('双方好感 +3 · 心情 +6','+3 Affinity · +6 Mood'),'+2 RP']
  });
 };
 const handleReplyChat=async(threadId:string,replyIndex:number)=>{
  unlockAudio();
  if(locked)return;
  const thread=livingView.threads.find(t=>t.id===threadId);
  const reply=thread?.replies[replyIndex];
  const ok=await send({type:'campaign',action:'chat-reply',id:threadId,target:String(replyIndex)});
  if(!ok)return;
  fx('message',reply?.targetActor);
 };

 useEffect(()=>{
  document.documentElement.lang=english?'en':'zh-CN';
  if(!visualReviewEnabled||!new URLSearchParams(location.search).has('locale')){
   try{localStorage.setItem('oot-display-locale',english?'1':'0');}catch{/* Storage denied is harmless. */}
  }
 },[english]);
 useEffect(()=>{if(!('serviceWorker'in navigator)||visualReviewEnabled||new URLSearchParams(location.search).has('desktop')||new URLSearchParams(location.search).has('dsh'))return;let live=true;const changed=controllerTracker(navigator.serviceWorker.controller);void navigator.serviceWorker.register('./sw.js').then(reg=>{const observe=()=>{if(live)setUpdate(waitingUpdate(reg,!!navigator.serviceWorker.controller));};observe();reg.waiting?.addEventListener('statechange',observe);reg.addEventListener('updatefound',()=>reg.installing?.addEventListener('statechange',observe));navigator.serviceWorker.addEventListener('controllerchange',()=>{if(live){setUpdate(null);if(changed(navigator.serviceWorker.controller))setReloadReady(true);}});}).catch(()=>{});return()=>{live=false;};},[]);
 useEffect(()=>{
  document.documentElement.dataset.theme=dark?'dark':'light';
  document.documentElement.dataset.motion=still?'still':'full';
  const sp=new URLSearchParams(location.search);
  if(!visualReviewEnabled||!sp.has('theme')){
   try{localStorage.setItem('oot-display-theme',dark?'1':'0');}catch{/* Storage denied is harmless. */}
  }
  if(!visualReviewEnabled||!sp.has('motion')){
   try{localStorage.setItem('oot-display-motion',still?'1':'0');}catch{/* Storage denied is harmless. */}
  }
 },[dark,still]);

 const hubTitle={actors:actorId&&activeHub==='actors'?`${names[actorId]} · ${tr('伙伴档案','Profile')}`:tr('工作室伙伴','Our teammates'),jobs:tr('委托日志','Commission log'),studio:tr('经营工作室','Studio hub'),journal:tr('事务所手账','Studio journal')}[activeHub];
 const hubBack=activeHub==='actors'&&actorId&&actorEntry==='gallery'?{label:tr('返回画廊','Back to gallery'),onClick:closeActor}:activeHub==='jobs'&&jobInDetail&&matchMedia('(max-width:679px)').matches?{label:tr('返回列表','Back to list'),onClick:()=>selectCommission(null)}:null;
 const rawHubNotice=hideGenericDone?null:activeHub==='actors'&&actorId&&feedbackChannel==='actor'?notice:activeHub==='jobs'&&commissionNotice(game.feedback,jobId)?notice:null;
 const saveAlertNotice=useMemo(()=>showSaveBanner
  ?<SaveAlertBanner status={game.saveStatus} english={english} busy={busy} onExport={()=>void game.exportFile()} onOpenSaves={()=>{setHud(null);setSaves(true);void game.refresh();}} onRetry={()=>{setDismissedSaveKey(null);void game.retrySave();}} onDismiss={()=>setDismissedSaveKey(saveIncidentKey)}/>
  :null,[showSaveBanner,saveIncidentKey,game.saveStatus,english,busy]);
 const hubNotice=(saveAlertNotice||rawHubNotice)?<>{saveAlertNotice}{rawHubNotice}</>:null;
 const hubTabs=useMemo(()=>activeHub==='actors'&&!actorId?(
  <div role="tablist" aria-label={tr('伙伴筛选','Filter teammates')}>
   {(['all','recruited','available'] as const).map((f,i)=><button key={f} role="tab" aria-selected={actorFilter===f} onClick={()=>setActorFilter(f)}>{[tr('全部','All'),tr('已入驻','Recruited'),tr('待招募','Available')][i]} ({[actorIds.length,view.actors.length,actorIds.length-view.actors.length][i]})</button>)}
  </div>
 ):activeHub==='studio'?(
  <div role="tablist" aria-label={tr('工作室功能区','Studio sections')}>
   {([['overview',tr('章节与总览','Chapter & overview')],['finance',tr('算力与财务','Compute & finance')],['tech',tr('软硬研发','Hardware & tech')]] as const).map(([id,label])=><button key={id} role="tab" aria-selected={studioTab===id} onClick={()=>setStudioTab(id)}>{label}</button>)}
  </div>
 ):activeHub==='journal'?(
  <div role="tablist" aria-label={tr('手账栏目','Journal sections')}>
   {([['chronicle',tr('事务所履历','Chronicle')],['ledger',tr('收支与算力','Ledger & usage')],['bids',tr('对手竞标','Rival bids')],['expedition',tr('远征与终局','Expeditions & endings')]] as const).map(([id,label])=><button key={id} role="tab" aria-selected={journalTab===id} onClick={()=>setJournalTab(id)}>{label}</button>)}
  </div>
 ):null,[activeHub,actorId,actorFilter,studioTab,journalTab,english,view.actors.length]);

 const appCbRef=useRef({openOffice,openDirectActor,setJobId,setHud,setLocationsOpen,setOffscreen,updateAnchors,cameraDispatch,closeLocations,stepZoom,resetCamera,setTrackedJobId,setPanel,setJobFilter,setStudioTab,handleReplyChat,dismissBark,updatePanel,setMapOpen,setSaves,fx,unlockAudio,send,readThreadIds,uiStore,game,clearTransientState,markThreadRead});
 appCbRef.current={openOffice,openDirectActor,setJobId,setHud,setLocationsOpen,setOffscreen,updateAnchors,cameraDispatch,closeLocations,stepZoom,resetCamera,setTrackedJobId,setPanel,setJobFilter,setStudioTab,handleReplyChat,dismissBark,updatePanel,setMapOpen,setSaves,fx,unlockAudio,send,readThreadIds,uiStore,game,clearTransientState,markThreadRead};

 const sceneStageLayer=useMemo(()=>(
  <div class="scene-stage" data-period={view.absoluteSlot%4}>
   <Scene paused={modalOpen&&!arranging} camera={arranging?editorFocus:sceneFocus} zone={arranging?'overview':cameraZone} zoom={arranging?1:cameraZoom} pan={arranging?defaultCameraPan:cameraPan} capacityByActor={capacityByActor} onCamera={next=>appCbRef.current.cameraDispatch({type:'zoom',zoom:next.zoom,pan:next.pan,clearFocus:next.clearFocus})} presence={ids=>appCbRef.current.setOffscreen(ids)} anchors={next=>appCbRef.current.updateAnchors(next)} view={sceneView} english={english} select={id=>appCbRef.current.openDirectActor(id)} furniture={id=>{const reservation=Object.values(sceneView.office?.reservations??{}).find(r=>r.item===id);if(reservation&&!reservation.job.startsWith('clarify:'))appCbRef.current.setJobId(reservation.job);else if(sceneView.campaign?.scene==='workshop'&&!locked){appCbRef.current.openOffice();}}}/>
   <StageChatterOverlay bubble={chatterBubble} step={banterPhase} anchors={anchors} view={sceneView} hidden={modalOpen||arranging||urgentPriorityActive} onInspectActor={id=>{appCbRef.current.unlockAudio();appCbRef.current.fx('tap',id);appCbRef.current.openDirectActor(id);}}/>
   {hud==='view'&&<nav class="office-camera" aria-label={tr('场景视角','Scene camera')}><div class="camera-zones">{(Object.keys(zoneNames) as CameraZone[]).map(id=><button key={id} aria-pressed={!sceneFocus&&cameraZone===id&&Math.abs(cameraPan.x)<1&&Math.abs(cameraPan.y)<1} onClick={()=>{appCbRef.current.cameraDispatch({type:'zone',zone:id});}}>{zoneNames[id][english?1:0]}</button>)}</div><div class="camera-zoom-row" role="group" aria-label={tr('镜头缩放','Camera zoom')}><button aria-label={tr('缩小','Zoom out')} disabled={!sceneFocus&&cameraZoom<=1} onClick={()=>appCbRef.current.stepZoom(-.1)}>−</button><output aria-label={tr('当前缩放','Current zoom')}>{Math.round((sceneFocus?1.6*cameraZoom:cameraZoom)*100)}%</output><button aria-label={tr('放大','Zoom in')} disabled={cameraZoom>=1.5} onClick={()=>appCbRef.current.stepZoom(.1)}>+</button><button disabled={!cameraMoved} onClick={()=>appCbRef.current.resetCamera()}>{tr('恢复全景','Reset view')}</button></div><small class="camera-hint">{tr('单指拖动平移 · 双指或滚轮缩放','Drag to pan · Pinch or wheel to zoom')}</small></nav>}
  </div>
 ),[view.absoluteSlot,modalOpen,arranging,editorFocus,sceneFocus,cameraZone,cameraZoom,cameraPan,capacityByActor,sceneView,english,chatterBubble,banterPhase,anchors,urgentPriorityActive,hud,locked,cameraMoved]);

 const sceneLeftStack=useMemo(()=>(
  <div class="scene-left-stack">
   <div class="scene-tools" hidden={!!(arranging||(hud&&hud!=='view'))}>
    {cameraMoved&&<button class="reset-view" onClick={()=>appCbRef.current.resetCamera()}>{tr('返回全景','Reset view')}</button>}
    <button ref={locationsTrigger} aria-expanded={locationsOpen} onClick={()=>{appCbRef.current.setLocationsOpen(!locationsOpen);appCbRef.current.setHud(null);appCbRef.current.updatePanel(null);}}>{tr('伙伴位置','Locations')} · {offscreen.length+view.actors.filter(a=>a.location!==p.scene).length} {tr('画外','out of view')}</button>
   </div>
   {!arranging&&locationsOpen&&(
    <section class="scene-presence" aria-label={tr('伙伴位置','Teammate locations')}>
     <header><b>{tr('伙伴位置','Teammate locations')}</b><button aria-label={tr('关闭位置列表','Close locations')} onClick={()=>appCbRef.current.closeLocations('close')}><Icon name="close"/></button></header>
     {view.actors.map(a=><div key={a.id}><span><b>{names[a.id]}</b><small>{a.location!==p.scene?scene(a.location):offscreen.includes(a.id)?tr('同场景 · 画外','Here · out of view'):tr('同场景 · 画内','Here · in view')}</small></span><button onClick={()=>{const focus=actorFocus(view,a.id);if(focus)locate(focus);else{appCbRef.current.setLocationsOpen(false);appCbRef.current.openDirectActor(a.id);}}}>{actorFocus(view,a.id)?tr('定位','Locate'):tr('查看伙伴','View teammate')}</button></div>)}
    </section>
   )}
   <CommissionHudTracker view={view} id={tracked} english={english} open={id=>appCbRef.current.setJobId(id)} track={id=>appCbRef.current.setTrackedJobId(id)} locate={tracked&&jobFocus(view,tracked)?()=>locate(jobFocus(view,tracked)):undefined}/>
   <Onboarding hidden={!!(arranging||locationsOpen)} surface="scene" isolated={!!game.lab} view={view} experience={experienceView} lineageId={game.lineageId} uiStore={uiStore} english={english} openJob={id=>appCbRef.current.setJobId(id)} openPanel={id=>{appCbRef.current.setPanel(id);if(id==='jobs')appCbRef.current.setJobFilter('posted');}} openFinance={()=>{appCbRef.current.setStudioTab('finance');appCbRef.current.setPanel('studio');}}/>
  </div>
 ),[arranging,hud,cameraMoved,locationsOpen,offscreen,view,p.scene,english,tracked,experienceView,game.lineageId,game.lab,uiStore]);

 const priorityFeedbackLayer=useMemo(()=>(
  <div class="priority-feedback">
   {showSaveBanner&&(
    <SaveAlertBanner
     status={game.saveStatus}
     english={english}
     busy={busy}
     onExport={()=>void appCbRef.current.game.exportFile()}
     onOpenSaves={()=>{appCbRef.current.setHud(null);appCbRef.current.setSaves(true);void appCbRef.current.game.refresh();}}
     onRetry={()=>{setDismissedSaveKey(null);void appCbRef.current.game.retrySave();}}
     onDismiss={()=>setDismissedSaveKey(saveIncidentKey)}
    />
   )}
   {view.liquidCash<0&&<button class="crisis-chip" onClick={()=>{appCbRef.current.setStudioTab('finance');appCbRef.current.setPanel('studio');}}><Icon name="warning"/> {tr('现金流预警 · 净偿付资金','Cash-flow warning · Net solvency')} ¥{view.liquidCash.toFixed(0)} · {view.crises}/3</button>}
   {(update||reloadReady)&&<button class="update-chip" onClick={()=>{appCbRef.current.setHud(null);appCbRef.current.setSaves(true);}}>{tr('新版本可用 · 先保存进度','Update available · Save progress first')}</button>}
  </div>
 ),[showSaveBanner,saveIncidentKey,game.saveStatus,english,busy,view.liquidCash,view.crises,update,reloadReady]);

 const messengerLayer=useMemo(()=>chatOpen&&secondary?(
  <secondary.MessengerDrawer
   open={chatOpen}
   close={()=>setChatOpen(false)}
   threads={livingView.threads}
   readIds={readThreadIds}
   onMarkRead={tid=>{const next=appCbRef.current.markThreadRead(uiStore,game.lineageId,tid);setReadThreadIds(new Set(next));}}
   english={english}
   still={still}
   locked={locked}
   previewActivity={previewAct}
   onReply={(tid,idx)=>{void appCbRef.current.handleReplyChat(tid,idx);}}
   returnFocus={()=>chatTrigger.current}
  />
 ):null,[chatOpen,secondary,livingView.threads,readThreadIds,english,still,locked,uiStore,game.lineageId]);

 const switchConfirmLayer=useMemo(()=>(
  <SwitchConfirmDialog
   request={game.pendingSwitch}
   english={english}
   busy={busy}
   exportedInModal={game.exportedInSwitchModal}
   onExport={()=>void appCbRef.current.game.exportFromSwitchModal()}
   onConfirm={()=>void appCbRef.current.game.confirmPendingSwitch()}
   onCancel={game.cancelPendingSwitch}
  />
 ),[game.pendingSwitch,english,busy,game.exportedInSwitchModal,game.cancelPendingSwitch]);

 const dialogOpen=!!(hubOpen||mapOpen||saves||settings||chatOpen||view.pending||view.bankrupt||ritual||deliveryFeedback||game.pendingSwitch);
 return (
  <div class="studio-app" onKeyDown={e=>{if(e.key==='Escape'&&!modalOpen){if(locationsOpen){closeLocations('escape');e.preventDefault();e.stopPropagation();}else if(hud){setHud(null);e.stopPropagation();}}}} data-panel={panel??'closed'} data-modal={dialogOpen?'open':'closed'} data-view-open={hud==='view'} data-overlay={hud??'closed'} data-mode={arranging?'layout':'office'}>
   {game.lab&&<div class="office-lab-badge">LAB · {game.lab} · isolated memory saves</div>}
   {sceneStageLayer}

   {sceneLeftStack}

   <HudBar
    view={view}
    english={english}
    dark={dark}
    still={still}
    locked={locked}
    hud={hud}
    panel={panel}
    dockHidden={!!(dialogOpen||hud||arranging)}
    placeLabel={p.scene==='workshop'?chapterPlaces[p.chapter]![english?1:0]:scene(p.scene)}
    chapterTitle={chapterTitles[p.chapter]??''}
    advance={advanceInfo}
    deltas={deltas}
    unreadThreads={unreadThreads}
    teaReady={livingView.teaReady}
    audioPrefs={audioPrefs}
    saveStatus={game.saveStatus}
    onDismissDelta={id=>setDeltas(list=>list.filter(d=>d.id!==id))}
    onOpenHud={openHud}
    onOpenMap={()=>{setActiveBark(null);setHud(null);setMapOpen(true);}}
    onOpenChat={()=>{unlockAudio();setActiveBark(null);setHud(null);updatePanel(null);setChatOpen(true);fx('flip');}}
    onTeaBreak={()=>{void handleTeaBreak();}}
    onOpenStudioFinance={()=>{setActiveBark(null);setStudioTab('finance');setPanel('studio');}}
    onOpenPanel={id=>{setActiveBark(null);setChatOpen(false);setPanel(panel===id?null:id);setTimeout(()=>{unlockAudio();fx('flip');},0);}}
    onWarmDock={()=>{if(!portraitsWarm)setPortraitsWarm(true);}}
    onOpenOffice={()=>openOffice()}
    onOpenSaves={()=>{setActiveBark(null);setHud(null);setSaves(true);void game.refresh();}}
    onOpenSettings={()=>{setActiveBark(null);setHud(null);setSettings(true);}}
    onToggleLocale={()=>setEnglish(!english)}
    onToggleTheme={()=>setDark(!dark)}
    onToggleSfx={toggleSfx}
    onToggleAmbience={toggleAmbience}
    onAdvance={()=>{unlockAudio();void send({type:'advance'});}}
    onOpenJob={setJobId}
    moreTrigger={moreTrigger}
    boardTrigger={boardTrigger}
    chatTrigger={chatTrigger}
    jobsTrigger={jobsTrigger}
   />

   <PeriodBeatBanner text={periodBeat} hidden={modalOpen||arranging||urgentPriorityActive}/>
   <BarkOverlay bark={hubOpen?null:activeBark} view={view} english={english} onClose={dismissBark}/>

   {hud==='board'&&(
    <aside class="priority-rail" aria-label={tr('工作看板','Work board')} onKeyDown={e=>{if(e.key==='Escape')setHud(null);}}>
     <header class="drawer-head"><h2>{tr('工作看板','Work board')}</h2><button aria-label={tr('关闭面板','Close panel')} onClick={()=>setHud(null)}><Icon name="close"/></button></header>
     <div class="drawer-content">
      <details class="work-board" open>
       <summary>{tr('工作看板','Work board')} · {view.jobs.filter(j=>['accepted','working','waiting','review'].includes(j.status)).length} {tr('进行中','active')}</summary>
       <p>{tr('空闲伙伴','Available')}: {view.actors.filter(a=>!a.busy&&a.location!=='expedition').map(a=>names[a.id]).join(' · ')||'—'}</p>
       {view.jobs.filter(j=>['accepted','working','waiting','review'].includes(j.status)).sort((a,b)=>Number(b.status==='review')-Number(a.status==='review')||a.deadline-b.deadline).map(j=><button key={j.id} onClick={()=>setJobId(j.id)}><b>{english?j.titleEn:j.title}</b><small>{tr(({accepted:'待派遣',working:'执行中',waiting:'等下一期',review:'待验收'} as Record<string,string>)[j.status]!,j.status)} · {j.progress}/{j.work} WP</small></button>)}
      </details>
      <Onboarding surface="drawer" isolated={!!game.lab} view={view} experience={experienceView} lineageId={game.lineageId} uiStore={uiStore} english={english} openJob={setJobId} openPanel={id=>{setPanel(id);if(id==='jobs')setJobFilter('posted');}} openFinance={()=>{setHud(null);setStudioTab('finance');setPanel('studio');}}/>
     </div>
    </aside>
   )}

   {priorityFeedbackLayer}
   {feedbackChannel==='global'&&!hideGenericDone&&<div class="status-toast">{notice}</div>}

   {!view.pending&&!view.bankrupt&&(
    <StageHubShell
     open={hubOpen}
     hub={activeHub}
     switchHub={next=>{setActiveBark(null);if(next==='studio'&&returnTo?.panel!=='jobs')setReturnTo(null);setPanel(next);}}
     title={hubTitle}
     tabs={hubTabs}
     backAction={hubBack}
     notice={hubNotice}
     view={view}
     advance={advanceInfo}
     onAdvance={()=>void send({type:'advance'})}
     onOpenReview={id=>setJobId(id)}
     english={english}
     close={closeHub}
     returnFocus={activeHub==='jobs'?commissionReturnFocus:()=>managementTrigger.current}
     overlay={hubOpen&&activeBark?<BarkOverlay bark={activeBark} view={view} english={english} inModal onClose={dismissBark}/>:null}
     onCancel={()=>{
      if(activeHub==='actors'&&actorId&&actorEntry==='gallery'){closeActor();return true;}
      if(activeHub==='jobs'&&jobInDetail&&matchMedia('(max-width:679px)').matches){selectCommission(null);return true;}
      return false;
     }}
    >
     {activeHub==='actors'&&actorId?(
      secondary?<secondary.PartnerProfile
       key="stage-profile"
       characterId={actorId}
       locate={actor&&actorFocus(view,actor.id)?()=>locate(actorFocus(view,actor.id)):undefined}
       actor={actor}
       view={view}
       english={english}
       locked={locked}
       send={cmd=>{if(cmd.type!=='campaign'||!['chat','gift','meal','study','tea','duo'].includes(cmd.action))setActiveBark(null);return send(cmd,{surface:'actor',id:actorId});}}
       close={closeActor}
       closePanel={closeHub}
       openJob={setJobId}
       openMap={()=>{setActiveBark(null);updatePanel(null);setMapOpen(true);}}
       selectCharacter={id=>setActorId(id)}
       preferredTab={preferredProfileTab}
       setPreferredTab={setPreferredProfileTab}
       entryMode={actorEntry}
       onOpenGallery={()=>{setActorEntry('gallery');closeActor();}}
       notice={null}
       livingView={livingView}
       livingCatalog={livingCatalog}
       onTriggerBark={triggerBark}
       onSendGift={(targetId,gift,okCb)=>{void handleSendGift(targetId,gift,okCb);}}
       onUnlockDuo={duo=>{void handleUnlockDuo(duo);}}
       previewActivity={previewAct}
       capacity={capacityByActor[actorId]}
       experienceView={experienceView}
       suppressVignettes={urgentPriorityActive}
      />:null
     ):activeHub==='actors'?(
      actorsGallery
     ):activeHub==='jobs'?(
      secondary?<secondary.CommissionLog
       selected={jobId}
       select={selectCommission}
       clearLocal={()=>{if(jobId)game.dismissLocalFeedback({surface:'job',id:jobId});}}
       initialGroup={jobFilter}
       tracked={tracked}
       pinned={tracking.pinned}
       track={setTrackedJobId}
       locateJob={id=>jobFocus(view,id)?()=>locate(jobFocus(view,id)):undefined}
       drafts={draftTeams}
       lastTeam={lastTeam}
       onSaveDraft={(id,draft)=>setDraftTeams(prev=>({...prev,[id]:draft}))}
       onJumpToOffice={draft=>{if(jobId){setDraftTeams(prev=>({...prev,[jobId]:draft}));openOffice({panel:'jobs',jobId});}}}
       onJumpToFinance={draft=>{if(jobId){setDraftTeams(prev=>({...prev,[jobId]:draft}));setReturnTo({panel:'jobs',jobId});setStudioTab('finance');updatePanel('studio');}}}
       onJumpToActor={(aid,draft)=>{if(jobId){setDraftTeams(prev=>({...prev,[jobId]:draft}));setReturnTo({panel:'jobs',jobId});setActorEntry('direct');setPreferredProfileTab('vitals');setActorId(aid);updatePanel('actors');}}}
       onOpenMap={()=>{updatePanel(null);setMapOpen(true);}}
       onDetailStateChange={setJobInDetail}
       view={view}
       english={english}
       locked={locked}
       send={async cmd=>{
        setActiveBark(null);
        const beforeCash=game.session.view.cash;
        const ok=await send(cmd);
        if(ok&&cmd.type==='assign'){writeLastTeamDraft(uiStore,game.lineageId,cmd.team);setLastTeam(cmd.team);}
        if(ok&&(cmd.type==='deliver'||cmd.type==='rework')&&!game.session.view.pending&&!game.session.view.bankrupt){
         const afterView=game.session.view;
         const payload=secondary.buildDeliveryFeedbackPayload(beforeCash,afterView,game.session.getExperienceView(),getLivingCatalog(afterView),getLivingView(afterView),cmd.job,cmd.type);
         if(payload)setDeliveryFeedback(payload);
        }
        return ok;
       }}
       previewAssignment={(id,members)=>game.session.previewAssignment(id,members)}
       explainTeamDuos={(id,draft)=>game.session.explainTeamDuos(id,draft)}
       requestSuggestions={(id,draft)=>game.requestSuggestions(id,draft)}
       experienceView={experienceView}
       close={closeHub}
       closePanel={closeHub}
       messages={messages}
       notice={null}
       livingView={livingView}
       livingCatalog={livingCatalog}
       onWorkBark={aid=>{fx('tap',aid);}}
       previewActivity={previewAct}
      />:null
     ):activeHub==='studio'?(
      secondary?<secondary.StudioHub
       view={view}
       english={english}
       locked={locked}
       tab={studioTab}
       setTab={setStudioTab}
       send={cmd=>{setActiveBark(null);return send(cmd);}}
       onOpenOffice={()=>openOffice(returnTo?.panel==='jobs'?returnTo:undefined)}
       onSwitchHub={next=>setPanel(next)}
       onOpenMap={()=>{updatePanel(null);setMapOpen(true);}}
       returnBanner={returnTo?.panel==='jobs'?{label:tr('正处理派遣算力/设施缺口','Resolving assignment requirement'),onReturn:()=>{const targetJob=returnTo.jobId;setReturnTo(null);setJobId(targetJob);}}:null}
       hideTabs
       teaReady={livingView.teaReady}
       onTeaBreak={()=>{void handleTeaBreak();}}
       previewActivity={previewAct}
       finance={financeExplanation??game.session.explainFinance()}
      />:null
     ):(
      secondary?<secondary.JournalHub view={view} english={english} locked={locked} tab={journalTab} setTab={setJournalTab} send={send} hideTabs previewActivity={previewAct} finance={financeExplanation??game.session.explainFinance()} experienceView={experienceView} suppressVignettes={urgentPriorityActive}/>:null
     )}
    </StageHubShell>
   )}

   {mapOpen&&secondary&&<secondary.Dialog system className="map-dialog" title={tr('去哪里坐坐？','Where shall we go?')} close={()=>setMapOpen(false)}>
    <p>{tr('切换场景不推进时段。伙伴按自己的日程活动。','Changing scenes does not advance time. Teammates follow their own schedules.')}</p>
    {locked&&<p class="system-caption">{busy?tr('正在处理操作，请稍候再切换场景。','An operation is in progress. Please wait before travelling.'):tr('请先处理当前事件或经营状态，再切换场景。','Resolve the current event or studio state before travelling.')}</p>}
    <div class="world-map">
     <svg class="map-road" viewBox="0 0 600 350" preserveAspectRatio="none" aria-hidden="true"><path d="M100 70 Q300 50 300 175 T500 280" fill="none" stroke="#b08c63" stroke-width="12" stroke-dasharray="12 8"/></svg>
     {(Object.keys(sceneText) as (keyof typeof sceneText)[]).map(id=>{
      const night=view.absoluteSlot%4>=2;
      const hint=id==='workshop'?(night?tr('加班筹备 · 查看委托进度','Overtime prep · Check jobs'):tr('接单 · 派遣 · 布置','Jobs · Assign · Layout')):id==='canteen'?(night?tr('夜间聚餐 · 休息聊天','Evening meal · Rest & chat'):tr('吃饭 ¥30 · 休息 · 聊天','Meals ¥30 · Rest · Chat')):(night?tr('晚间共学 +2RP · 微调/访友','Evening study +2RP · Train'):tr('学习 +2RP · 微调 · 访友','Study +2RP · Train · Visit'));
      return <button key={id} disabled={locked} aria-pressed={p.scene===id} onClick={()=>{life('visit',id);setMapOpen(false);}}>
       <img src={sceneArt(id,p.chapter,night)} alt=""/>
       {p.scene===id&&<span class="ui2-here-pill">{tr('当前所在','Current')}</span>}
       <b>{scene(id)}</b>
       <span class="map-people">{view.actors.filter(a=>a.location===id&&(id===p.scene||p.software.includes('messenger'))).map(a=><span key={a.id} title={names[a.id]}><Portrait id={a.id} variant="map"/></span>)}</span>
       <span class="ui2-map-hint"><Icon name={id==='workshop'?'briefcase':id==='canteen'?'sun':'book'}/><small>{hint}</small></span>
      </button>;
     })}
    </div>
   </secondary.Dialog>}

   {settings&&secondary&&<secondary.Dialog system className="settings-dialog" returnFocus={()=>moreTrigger.current} title={tr('让这里更合心意','Make yourself at home')} close={()=>setSettings(false)}>
    <p class="system-intro">{tr('调整界面的语言与显示方式。','Choose the language and appearance of your studio.')}</p>
    <div class="settings-list">
     <button aria-pressed={english} onClick={()=>setEnglish(!english)}><span>{tr('界面语言','Interface language')}</span><b>{english?'English':'中文'}</b></button>
     <button aria-pressed={dark} onClick={()=>setDark(!dark)}><span>{tr('深色界面','Dark interface')}</span><b>{dark?tr('开启','On'):tr('关闭','Off')}</b></button>
     <button aria-pressed={still} onClick={()=>setStill(!still)}><span>{tr('减少动态效果','Reduce motion')}</span><b>{still?tr('开启','On'):tr('关闭','Off')}</b></button>
     <button aria-pressed={audioPrefs.sfx} onClick={toggleSfx}><span>{tr('界面与气泡音效','UI & voice blips')}</span><b>{audioPrefs.sfx?tr('开启','On'):tr('关闭','Off')}</b></button>
     <button aria-pressed={audioPrefs.ambience} onClick={toggleAmbience}><span>{tr('场景环境底噪','Scene ambience')}</span><b>{audioPrefs.ambience?tr('开启','On'):tr('关闭','Off')}</b></button>
     <button onClick={()=>{setSettings(false);setSaves(true);void game.refresh();}}>{tr('存档与备份','Saves and backups')}</button>
    </div>
    <footer class="system-footer"><p>{tr('独立本机存档 · 无真实模型调用','Local independent saves · No real model calls')}</p><a href="./PAPER-DOLL-LICENSE.txt">PaperDoll · MIT</a> · <a href="./art/ai-village/LICENSE.txt" target="_blank" rel="noreferrer">AI Village Q版角色</a></footer>
   </secondary.Dialog>}

   {messengerLayer}

   {view.pending&&secondary&&(()=>{
    const pendingActor=view.actors.find(a=>view.pending!.actors.includes(a.id));
    const taggedId=actorIds.find(id=>view.pending!.id.includes(id));
    const evActor=pendingActor??(taggedId?view.actors.find(a=>a.id===taggedId):undefined)??view.actors.find(a=>a.location===p.scene)??view.actors[0];
    return (
     <secondary.Dialog className="pending-choice ui2-event-dialog" title={english?view.pending.titleEn??view.pending.title:view.pending.title} close={()=>{}} dismissible={false}>
      <div class="ui2-event-layout">
       <div class="ui2-event-media">
        <img class="event-cover" src={eventArt(view.pending.id)} alt=""/>
        {evActor&&(
         <div class="ui2-event-actor">
          <div class="ui2-event-actor-avatar">
           <img class="ui2-event-portrait" src={`./art/ai-village/portraits/${evActor.id}.png`} alt=""/>
           <EmoteBadge emote="sweat" view={view}/>
          </div>
          <div>
           <b>{names[evActor.id]??evActor.id}</b>
           <small>“{pickEventQuote(livingCatalog,view.pending.id,evActor.id,english)}”</small>
          </div>
         </div>
        )}
        <p class="ui2-muted-note"><Icon name="warning"/> {tr('先作选择，时间才会继续。','Choose an action before time continues.')}</p>
       </div>
       <div class="ui2-event-choices">
        {view.pending.choices.map((c,index)=><button key={index} class="ui2-choice-card" disabled={busy} onClick={()=>void send({type:'choose',index})}>
         <b>{english?c.labelEn??c.label:c.label}</b>
         <span class="ui2-choice-tags">
          {c.cost!==0&&<em class="is-down">{tr('现金','Cash')} −¥{c.cost}</em>}
          {c.multiplier!==1&&<em>{tr('速度','Speed')} ×{c.multiplier}</em>}
          {c.effects?.map((e,ei)=><em key={ei}>{effectLabel(e.kind,e.value,english)}</em>)}
          {c.cost===0&&c.multiplier===1&&!c.effects?.length&&<em>{tr('无直接数值调整','No direct stat delta')}</em>}
         </span>
        </button>)}
       </div>
      </div>
     </secondary.Dialog>
    );
   })()}

   {view.bankrupt&&!view.pending&&secondary&&<secondary.Dialog system className="bankrupt-dialog" title={tr('先喘口气，再重新出发。','Take a breath. Start again.')} close={()=>{}} dismissible={false}>
    <p>{tr('工作室资金已低于破产底线。你可以保留部分创始人经验并开启新的一轮经营，或者载入更早期的手动存档调整策略。','Studio funds dropped below the bankruptcy floor. Restart with founder experience or load an earlier manual save.')}</p>
    <div class="button-row">
     <button class="primary" disabled={busy} onClick={()=>game.requestRestart(clearTransientState)}>{tr('继承经验重开','Restart with founder experience')}</button>
     <button disabled={busy} onClick={()=>{setSaves(true);void game.refresh();}}>{tr('打开存档列表','Open saves')}</button>
    </div>
   </secondary.Dialog>}

   {saves&&secondary&&<secondary.Dialog system className="saves-dialog" returnFocus={()=>moreTrigger.current} title={tr('存档与备份','Saves and backups')} close={()=>setSaves(false)} notice={feedbackChannel==='saves'?notice:null}>
    <SaveAlertBanner
     status={game.saveStatus}
     english={english}
     busy={busy}
     onExport={()=>void game.exportFile()}
     onRetry={()=>{setDismissedSaveKey(null);void game.retrySave();}}
    />
    {(update||reloadReady)&&<p class="system-update"><button onClick={()=>update?activateUpdate(update,navigator.serviceWorker,()=>location.reload()):location.reload()}>{tr('已保存或导出进度，刷新到新版本','Progress saved or exported — refresh to new version')}</button></p>}
    {game.hosted&&<button disabled={busy} onClick={()=>void game.reconcile()}>{tr('只读核对自动档（保留当前进度）','Reconcile autosave without replacing current progress')}</button>}
    <p class="system-intro">{secondary.backupPolicyCopy(english,game.hosted).dialogIntro}</p>
    <secondary.SaveSlots records={game.records} busy={busy} english={english} hosted={game.hosted} save={id=>void game.save(id)} load={id=>game.requestLoad(id,clearTransientState)}/>
    <section class="save-transfer" aria-label={tr('文件备份','File backups')}><h3>{tr('文件备份','File backups')}</h3><button disabled={busy} onClick={()=>void game.exportFile()}>{tr('导出当前进度','Export current progress')}</button><label>{tr('导入文件','Import file')}<input type="file" accept="application/json,.json" disabled={busy} onChange={e=>{e.currentTarget.closest('dialog')?.focus({preventScroll:true});const file=e.currentTarget.files?.[0];if(file)game.requestImportFile(file,clearTransientState);e.currentTarget.value='';}}/></label></section>
   </secondary.Dialog>}

   {switchConfirmLayer}

   {arranging&&view.office&&secondary&&<secondary.OfficeEditor view={view} session={game.session} english={english} send={send} onPreview={(items,camera)=>{setLayoutItems(items);cameraDispatch({type:'preview',focus:camera});}} close={()=>{setArranging(false);setLayoutItems(null);cameraDispatch({type:'editor-close'});if(returnTo?.panel==='jobs'){const j=returnTo.jobId;setReturnTo(null);setJobId(j);}}}/>}

   {deliveryFeedback&&!view.pending&&!view.bankrupt&&secondary&&(
    <secondary.DeliveryFeedbackModal
     payload={deliveryFeedback}
     english={english}
     still={still}
     returnFocus={()=>jobsTrigger.current??moreTrigger.current}
     close={()=>setDeliveryFeedback(null)}
    />
   )}

   {ritual&&secondary&&<secondary.Dialog className="ui2-ritual-dialog" title={ritual.badge} close={()=>{if(ritualReady)setRitual(null);}}>
    <div class="ui2-ritual-stage" style={{'--poster-color':ritual.themeColor}} onClick={()=>{if(ritualReady)setRitual(null);}}>
     <img class="ui2-ritual-backdrop" src={ritualBackdropArt} alt="" aria-hidden="true"/>
     <div class="ui2-ritual-beam" aria-hidden="true"/>
     <img class="ui2-ritual-art" src={ritual.img} alt=""/>
     <div class="ui2-ritual-copy">
      <span class="ui2-eyebrow">{ritual.badge}</span>
      {ritual.sWord&&<strong>{ritual.sWord}</strong>}
      <h2>{ritual.title}</h2>
      <p>{ritual.subtitle}</p>
     </div>
     <button class="ui2-ritual-skip" onClick={e=>{e.stopPropagation();setRitual(null);}}>{tr('继续','Continue')}</button>
    </div>
   </secondary.Dialog>}
  </div>
 );
}
