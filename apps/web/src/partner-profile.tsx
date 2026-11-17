import type {ComponentChildren} from 'preact';
import type {Command} from 'oot-core';
import type {ActivityPreview,CapacityExplanation,GameView} from 'oot-platform';
import {useEffect,useState,useRef} from 'preact/hooks';
import {describeActivityPreview} from './experience-adapter.js';
import {ExperienceArtSlot} from './experience-art-slot.js';
import {content} from './content.js';
import {FlavorPanel} from './flavor-panel.js';
import {characterProfiles,characterPosters,resolveCharacterVisual,stageBPortrait,versionDelta,recruitmentBlock,recruitmentReasons} from './character-profiles.js';
import {names} from './presentation.js';
import {sceneText,skillText} from './ui-labels.js';
import {partnerAvailability} from './partner-state.js';
import {actorIds} from './studio-ui.js';
import {Icon} from './icons.js';
import {OrnamentDivider,RhythmChart,PipTrack} from './ornaments.js';
import {isFlagshipUnlocked,resolveProfileTab} from './ui2-logic.js';
import type {ProfileTab} from './ui2-logic.js';
import {GiftPickerGrid} from './bark-overlay.js';
import type {BarkPayload} from './bark-overlay.js';
import type {DuoDef,GiftDef,LivingContent,LivingView} from './living-adapter.js';
import {pickSocialBark} from './living-adapter.js';

type Props={
 locate:(()=>void)|undefined;
 view:GameView;
 characterId:string;
 actor:GameView['actors'][number]|undefined;
 english:boolean;
 locked:boolean;
 send:(cmd:Command)=>Promise<boolean>;
 close:()=>void;
 closePanel:()=>void;
 openJob:(id:string)=>void;
 openMap:()=>void;
 selectCharacter:(id:string)=>void;
 preferredTab:ProfileTab;
 setPreferredTab:(next:ProfileTab)=>void;
 entryMode:'gallery'|'direct';
 onOpenGallery?:()=>void;
 notice:ComponentChildren;
 livingView:LivingView;
 livingCatalog:LivingContent;
 onTriggerBark:(bark:BarkPayload)=>void;
 onSendGift:(actorId:string,gift:GiftDef,okCb?:()=>void)=>void;
 onUnlockDuo:(duo:DuoDef)=>void;
 previewActivity?:(cmd:Command)=>ActivityPreview;
 capacity?:CapacityExplanation|undefined;
};

const stageBMap:Readonly<Record<string,string>>={bluewhale:'bluewhale.r1',qwen:'qwen.qwq',llama:'llama.3.1',mistral:'mistral.large',gpt:'gpt.4o',claude:'claude.sonnet',kimi:'kimi.k2',gemini:'gemini.pro'};

 export function PartnerProfile(props:Props){
 const {view,actor,characterId,english,locked,send,close,closePanel,openJob,openMap,selectCharacter,preferredTab,setPreferredTab,entryMode,onOpenGallery,notice,locate,livingView,livingCatalog,onTriggerBark,onSendGift,onUnlockDuo,previewActivity,capacity}=props;
 const tr=(zh:string,en:string)=>english?en:zh,p=view.campaign!,catalog=view.catalog!;
 const {sameScene,onExpedition,activeJobs,lifeBusy,canRecall,status}=actor?partnerAvailability(view,actor,locked):{sameScene:false,onExpedition:false,activeJobs:[],lifeBusy:false,canRecall:false,status:null};
 const scene=(id:keyof typeof sceneText|'expedition')=>id==='expedition'?tr('远征中','On expedition'):sceneText[id][english?1:0],skill=(id:keyof typeof skillText)=>skillText[id][english?1:0];
 const life=(action:Extract<Command,{type:'campaign'}>['action'],id:string,target?:string)=>send({type:'campaign',action,id,...(target?{target}:{})});
 const versions=content.versions.filter(v=>v.character===characterId),base=versions.find(v=>v.id===actor?.version)??versions[0]!;
 const [previewVersionId,setPreviewVersionId]=useState(base.id),[inverted,setInverted]=useState(false),[stageForm,setStageForm]=useState<'auto'|'standard'|'flagship'>('auto'),[giftOpen,setGiftOpen]=useState(false);
 const stageRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{setPreviewVersionId(base.id);setInverted(false);setStageForm('auto');setGiftOpen(false);},[characterId,actor?.version,base.id]);

 const activeTab=resolveProfileTab(preferredTab,!!actor);
 const v=versions.find(item=>item.id===previewVersionId)??base;
 const stageBId=stageBMap[characterId]??null;
 const flagshipSrc=stageBPortrait(characterId);
 const flagshipReady=isFlagshipUnlocked(view,characterId,stageBId);
 const isFlagshipShown=!!flagshipSrc&&(stageForm==='flagship'?true:stageForm==='standard'?false:stageBId?v.id===stageBId:flagshipReady);
 const baseVisual=resolveCharacterVisual(characterId,stageBId&&v.id===stageBId?undefined:v.id,'profile');
 const stageArtSrc=isFlagshipShown&&flagshipSrc?flagshipSrc:baseVisual.src;
 const stageWatermark=isFlagshipShown&&flagshipSrc?(flagshipSrc.split('/').pop()?.replace('.webp','').split('.').slice(1).join('.').toUpperCase()||'FLAGSHIP'):baseVisual.versionBadge;
 const silhouetteLock=isFlagshipShown&&!flagshipReady;
 const delta=versionDelta(v,base),recruit=catalog.recruits.find(r=>r.character===characterId),block=recruit?recruitmentBlock(view,recruit,locked):null;
 const diff=(n:number)=>`${n>0?'▲ +':n<0?'▼ ':'— '}${n}`;
 const different=v.id!==base.id;
 const poster=characterPosters[characterId]!;
 const rel=actor?p.relations[actor.id]:undefined;

 const versionBonuses=actor&&rel?rel.bonuses[actor.version]??{}:{};
 const trainUsed=Object.entries(versionBonuses).filter(([k])=>k!=='alignment').reduce((n,[,x])=>n+(x??0),0);
 const alignUsed=versionBonuses.alignment?1:0;
 const isLocalVersion=base.modes.includes('local');
 const rpNeeded=Math.max(0,10-p.research);
 const trainRpNeeded=Math.max(0,5-p.research);

 return (
  <div class="ui2-profile-shell" data-character={characterId}>
   <div class="ui2-avatar-rail" role="tablist" aria-label={tr('快速切换伙伴','Quick-switch teammates')}>
    {[...actorIds].sort((a,b)=>Number(view.actors.some(x=>x.id===b))-Number(view.actors.some(x=>x.id===a))).map(id=>{
     const member=view.actors.find(x=>x.id===id),rec=catalog.recruits.find(r=>r.character===id);
     const canRec=!!rec&&!recruitmentBlock(view,rec,locked);
     return <button key={id} class="ui2-rail-avatar" role="tab" aria-selected={id===characterId} data-recruited={!!member} style={{'--poster-color':characterPosters[id]!.themeColor}} title={`${names[id]} · ${member?`${tr('精力','Energy')} ${member.energy}`:canRec?tr('可招募','Eligible'):tr('待解锁','Locked')}`} onClick={()=>selectCharacter(id)}>
      <img src={`./art/ai-village/portraits/${id}.png`} alt=""/>
      <span class="ui2-rail-name">{names[id]}</span>
      {member?<i class="ui2-rail-energy" data-low={member.energy<35} style={{width:`${Math.min(100,member.energy)}%`}}/>:<i class="ui2-rail-badge" data-ready={canRec}><Icon name={canRec?'spark':'lock'}/></i>}
     </button>;
    })}
   </div>

   <div class="ui2-profile-columns">
    <aside ref={stageRef} class="ui2-profile-stage" style={{'--poster-color':poster.themeColor}}>
     <span class="ui2-stage-watermark" aria-hidden="true">{stageWatermark}</span>
     <div class="ui2-stage-art" data-inverted={inverted} data-locked-silhouette={silhouetteLock}>
      <img src={stageArtSrc} alt=""/>
      {silhouetteLock&&(
       <div class="ui2-silhouette-lock">
        <Icon name="lock"/>
        <small>{stageBId?tr('研发并切换高阶版本后解锁立绘','Unlock & equip advanced version to reveal'):tr('好感达到 60 或解锁首段故事后觉醒','Reach affinity 60 or unlock first story to awaken')}</small>
       </div>
      )}
     </div>
     <div class="ui2-stage-meta">
      <div class="ui2-stage-title">
       <strong>{poster.sWord}</strong>
       <h3>{names[characterId]}</h3>
       <span class="ui2-version-chip">{v.name}</span>
      </div>
      <OrnamentDivider/>
      <p class="ui2-stage-bio">{characterProfiles[characterId]?.[english?1:0]}</p>
      <div class="ui2-stage-controls">
       {flagshipSrc&&<button aria-pressed={isFlagshipShown} onClick={()=>setStageForm(isFlagshipShown?'standard':'flagship')}><Icon name="spark"/><span>{isFlagshipShown?tr('标准形态','Standard form'):tr('旗舰形态','Flagship form')}</span></button>}
       {characterId==='claude'&&<button aria-pressed={inverted} onClick={()=>setInverted(!inverted)}><Icon name="refresh"/><span>{tr('封号倒置视角','Inverted view')}</span></button>}
       {actor&&locate&&<button onClick={locate}><Icon name="pin"/><span>{tr('定位到场景','Locate')}</span></button>}
       {actor&&!sameScene&&!onExpedition&&<button class="primary" disabled={locked} onClick={()=>{void send({type:'campaign',action:'visit',id:actor.location}).then(ok=>{if(ok){close();closePanel();}});}}><Icon name="map"/><span>{tr(`前往${scene(actor.location)}`,`Visit ${scene(actor.location)}`)}</span></button>}
       {entryMode==='direct'&&onOpenGallery&&<button onClick={onOpenGallery}><Icon name="people"/><span>{tr('全部伙伴画廊','All teammates')}</span></button>}
      </div>
     </div>
    </aside>

    <section class="ui2-profile-detail">
     <nav class="ui2-subtabs" role="tablist" aria-label={tr('伙伴档案分页','Profile sections')}>
      {actor&&<button role="tab" aria-selected={activeTab==='vitals'} onClick={()=>setPreferredTab('vitals')}>{tr('状态与日常','Status & daily')}</button>}
      <button role="tab" aria-selected={activeTab==='model'} onClick={()=>setPreferredTab('model')}>{tr('模型与算力','Model & specs')}</button>
      {actor&&<button role="tab" aria-selected={activeTab==='training'} onClick={()=>setPreferredTab('training')}>{tr('开源微调','Fine-tuning')}</button>}
      <button role="tab" aria-selected={activeTab==='stories'} onClick={()=>setPreferredTab('stories')}>{tr('档案与故事','Stories')}</button>
     </nav>

     {notice&&<div class="ui2-profile-notice">{notice}</div>}

     <div class="ui2-profile-scroll">
      {activeTab==='vitals'&&actor&&rel&&(
       <div class="ui2-tab-pane">
        {view.absoluteSlot%4>=2&&(
         <ExperienceArtSlot
          slotId="vignette-rest-corner"
          variant="vignette"
          english={english}
          badgeText={tr('夜间作息','Evening & night')}
          title={tr('夜槽空闲即享睡眠恢复','Night rest restores energy')}
          subtitle={view.absoluteSlot%4===3?tr('深夜安排互动/聚餐/加班将跳过今晚睡眠恢复','Night activity or overtime skips sleep & load clear'):tr('晚上不默认推进合同，可聊天、送礼、聚餐或加班','Contracts pause after afternoon unless overtime is scheduled')}
         />
        )}
        <div class="ui2-vitals-grid">
         <div class="ui2-vital-card" data-warn={actor.energy<35}><small>{tr('精力','Energy')}</small><b>{actor.energy}</b><div class="ui2-meter"><i style={{width:`${actor.energy}%`}}/></div><span>{actor.energy<35?tr('精力偏低，建议休息或用餐','Low energy: rest or eat'):tr('状态良好','Steady')}</span></div>
         <div class="ui2-vital-card"><small>{tr('心情','Mood')}</small><b>{actor.mood}</b><div class="ui2-meter"><i style={{width:`${actor.mood}%`}}/></div><span>{actor.mood<45?tr('可通过聊天/送礼提升','Boost with chat or gift'):tr('心态平稳','Positive')}</span></div>
         <div class="ui2-vital-card" data-warn={capacity?.overloaded??false}>{(()=>{const effCtx=capacity?.context??v.context,overloaded=capacity?.overloaded??actor.load>effCtx;return <><small>{tr('负载','Load')}</small><b>{actor.load} / {effCtx}</b><div class="ui2-meter"><i style={{width:`${Math.min(100,Math.round(actor.load/Math.max(1,effCtx)*100))}%`}}/></div><span>{overloaded?tr('上下文已过载，产出降低且易出缺陷','Context overloaded: lower output & higher defect risk'):tr(`压力 ${rel.stress} · 饥饿 ${rel.hunger}`,`Stress ${rel.stress} · Hunger ${rel.hunger}`)}</span></>;})()}</div>
         <div class="ui2-vital-card"><small>{tr('好感','Affinity')}</small><b>{rel.affinity}</b><div class="ui2-meter"><i style={{width:`${rel.affinity}%`}}/></div><span>{tr(`当前场景：${scene(actor.location)}`,`Scene: ${scene(actor.location)}`)}</span></div>
        </div>

        {(onExpedition||!sameScene||lifeBusy)&&(
         <p class="ui2-inline-hint"><Icon name="warning"/> {onExpedition?tr('正在远征中，返程后可安排工作室活动。','On expedition. Studio activities resume upon return.'):status==='elsewhere'?tr(`当前在${scene(actor.location)}：先前往同场景即可聊天或互动。`,`Currently in ${scene(actor.location)}. Visit to interact.`):status==='work'?tr('正在负责委托工作，晚上未加班时可日常互动。','Assigned to a job; free for evening interaction when not in overtime.'):tr('本时段已有安排，推进至下一时段后恢复空闲。','Occupied this period; resumes next period.')}</p>
        )}

        {(()=>{
         const actNote=(cmd:Command)=>previewActivity?describeActivityPreview(previewActivity(cmd),english):null;
         const chatP=actNote({type:'campaign',action:'chat',id:actor.id});
         const mealP=actNote({type:'campaign',action:'meal',id:actor.id});
         const studyP=actNote({type:'campaign',action:'study',id:actor.id});
         const recallP=actNote({type:'campaign',action:'recall',id:actor.id});
         const otP=actNote({type:'overtime',character:actor.id});
         const giftPreviewCmd=livingCatalog.gifts[0]?{type:'campaign' as const,action:'gift' as const,id:actor.id,target:livingCatalog.gifts[0].id}:null;
         const giftP=giftPreviewCmd?actNote(giftPreviewCmd):null;
         return (
          <div class="ui2-actions-grid">
           <button class="ui2-action-card" disabled={locked||lifeBusy||!sameScene} onClick={()=>{void life('chat',actor.id).then(ok=>{if(ok)onTriggerBark({id:Date.now(),actorId:actor.id,emote:'sparkle',label:tr('日常聊天','Chat'),text:pickSocialBark(livingCatalog,actor.id,'chat',rel.affinity,english),deltas:[tr('压力 -10','Stress -10'),tr('心情 +5','Mood +5'),tr('好感 +3','Affinity +3')]});});}}><b>{tr('日常聊天','Chat')}</b><small>{tr('压力 -10 · 心情 +5 · 好感 +3','Stress -10 · Mood +5 · Affinity +3')}</small>{chatP?.legal&&<small class="ui2-act-preview" data-skip={chatP.skipsNightRecovery?'true':'false'}>{chatP.compactText}</small>}</button>
           <button class="ui2-action-card" aria-expanded={giftOpen} disabled={locked||lifeBusy||!sameScene} onClick={()=>setGiftOpen(v=>!v)}><b>{giftOpen?tr('收起好礼列表','Hide gifts'):tr('挑选心意好礼','Choose gift')}</b><small>{tr('6 种专属心意礼物 · 偏爱款额外惊喜','6 signature gifts · Bonus on loved items')}</small>{giftP?.legal&&<small class="ui2-act-preview" data-skip={giftP.skipsNightRecovery?'true':'false'}>{giftP.compactText}</small>}</button>
           <button class="ui2-action-card" disabled={locked||lifeBusy||!sameScene||!['canteen','library'].includes(p.scene)||view.cash<30} onClick={()=>{void life('meal',actor.id).then(ok=>{if(ok)onTriggerBark({id:Date.now(),actorId:actor.id,emote:'rice',label:tr('聚餐 / 外卖','Meal / takeaway'),text:pickSocialBark(livingCatalog,actor.id,'meal',rel.affinity,english),deltas:[tr('精力 +25','Energy +25'),tr('心情 +8','Mood +8'),tr('饥饿 -50','Hunger -50'),tr('压力 -8','Stress -8')]});});}}><b>{tr('聚餐 / 外卖 ¥30','Meal / takeaway ¥30')}</b><small>{tr('精力 +25 · 饥饿 -50 · 食堂/图书馆可用','Energy +25 · Hunger -50 · Canteen/library')}</small>{mealP?.legal&&<small class="ui2-act-preview" data-skip={mealP.skipsNightRecovery?'true':'false'}>{mealP.compactText}</small>}</button>
           <button class="ui2-action-card" disabled={locked||lifeBusy||!sameScene||p.scene!=='library'||actor.energy<10} onClick={()=>{void life('study',actor.id).then(ok=>{if(ok)onTriggerBark({id:Date.now(),actorId:actor.id,emote:'idea',label:tr('共同学习','Study together'),text:pickSocialBark(livingCatalog,actor.id,'study',rel.affinity,english),deltas:[tr('研发 +2 RP','+2 RP'),tr('精力 -10','Energy -10')]});});}}><b>{tr('共同学习 +2 RP','Study together +2 RP')}</b><small>{tr('消耗 10 精力 · 仅限图书馆场景','Costs 10 energy · Library only')}</small>{studyP?.legal&&<small class="ui2-act-preview" data-skip={studyP.skipsNightRecovery?'true':'false'}>{studyP.compactText}</small>}</button>
           <button class="ui2-action-card" disabled={!canRecall} onClick={()=>void life('recall',actor.id)}><b>{tr('请回工作室','Recall to workshop')}</b><small>{p.software.includes('remote')?tr('已部署远程协作，可跨场景呼叫','Remote software active'):tr('需位于同一非工作室场景','Same non-workshop scene required')}</small>{recallP?.legal&&<small class="ui2-act-preview">{recallP.compactText}</small>}</button>
           <button class="ui2-action-card" disabled={locked||view.absoluteSlot%4<2||onExpedition||view.overtime.includes(actor.id)||actor.energy<10||actor.busyUntil>view.absoluteSlot||!activeJobs.some(j=>j.status==='working')} onClick={()=>void send({type:'overtime',character:actor.id})}><b>{tr('安排本槽加班','Overtime this slot')}</b><small>{tr('仅晚间/深夜且需在岗与精力 >=10','Evening/night, assigned, energy >=10')}</small>{otP?.legal&&<small class="ui2-act-preview" data-skip={otP.skipsNightRecovery?'true':'false'}>{otP.compactText}</small>}</button>
          </div>
         );
        })()}

        {giftOpen&&(
         <GiftPickerGrid actorId={actor.id} gifts={livingCatalog.gifts} giftedIds={livingView.gifted[actor.id]??[]} view={view} cash={view.cash} disabled={locked||lifeBusy||!sameScene} english={english} {...(previewActivity?{previewActivity}:{})} onSelectGift={gift=>onSendGift(actor.id,gift,()=>setGiftOpen(false))}/>
        )}

        {livingView.duos.some(d=>d.actors.includes(actor.id))&&(
         <div class="ui2-duo-section">
          <h4><Icon name="link"/> {tr('搭档默契（Duo Synergy）','Duo Synergy')}</h4>
          <div class="ui2-duo-grid">
           {livingView.duos.filter(d=>d.actors.includes(actor.id)).map(d=>{
            const partnerId=d.actors[0]===actor.id?d.actors[1]:d.actors[0];
            const def=livingCatalog.duos.find(x=>x.id===d.id);
            const minDel=def?.minDeliveries??2;
            const recruitedPartner=view.actors.some(a=>a.id===partnerId);
            return (
             <article key={d.id} class="ui2-duo-card" data-unlocked={d.unlocked}>
              <div class="ui2-duo-head">
               <img src={`./art/ai-village/portraits/${partnerId}.png`} alt=""/>
               <div>
                <b>{tr(d.title,d.titleEn)} · {names[partnerId]??partnerId}</b>
                <small>{tr(`搭档交付 ${Math.min(d.sharedDeliveries,minDel)}/${minDel}`,`Co-deliveries ${Math.min(d.sharedDeliveries,minDel)}/${minDel}`)} · {d.unlocked?tr('默契已激活','Synergy active'):!recruitedPartner?tr('伙伴未招募','Partner not recruited'):d.sharedDeliveries<minDel?tr('同队交付累计进度','Ship together to unlock'):d.canUnlock?tr('可召开茶会解锁','Ready for duo tea'):tr('需双方空闲且同场景（或已装远程协作）','Both partners must be free & in same scene')}</small>
               </div>
              </div>
              <p>{tr(d.desc,d.descEn)}</p>
              {!d.unlocked&&d.sharedDeliveries>=minDel&&def&&(
               <button class="primary" disabled={locked||!d.canUnlock} onClick={()=>onUnlockDuo(def)}><Icon name="cup"/><span>{tr('召开搭档茶会 · +2 RP','Host duo tea · +2 RP')}</span></button>
              )}
             </article>
            );
           })}
          </div>
         </div>
        )}

        {activeJobs.length>0&&(
         <div class="ui2-linked-jobs">
          <h4>{tr('当前负责委托','Active assignments')}</h4>
          <div class="button-row">{activeJobs.map(j=><button key={j.id} class="primary" onClick={()=>{close();openJob(j.id);}}>{tr(j.title,j.titleEn)} · {j.progress}/{j.work} WP</button>)}</div>
         </div>
        )}
       </div>
      )}

      {activeTab==='model'&&(
       <div class="ui2-tab-pane">
        {!actor&&recruit&&(
         <div class="ui2-recruit-banner">
          <div class="ui2-recruit-reqs">
           <span>{tr('开放章节','Chapter')}: <b>{recruit.minChapter??0}</b></span>
           <span>{tr('所需声望','Reputation')}: <b>{recruit.reputation}</b></span>
           <span>{tr('招募费用','Fee')}: <b>¥{recruit.cost}</b></span>
           <span>{tr('状态','Status')}: <b>{block?recruitmentReasons[block][english?1:0]:tr('可招募','Eligible')}</b></span>
          </div>
          <button class="primary" disabled={!!block} onClick={()=>{void send({type:'campaign',action:'recruit',id:characterId}).then(ok=>{if(ok)requestAnimationFrame(()=>stageRef.current?.querySelector<HTMLButtonElement>('button')?.focus({preventScroll:true}));});}}>{tr('立即招募入驻','Recruit now')} (¥{recruit.cost})</button>
         </div>
        )}

        <div class="ui2-version-tabs" role="tablist" aria-label={tr('模型版本','Model versions')}>
         {versions.map((item,i)=><button key={item.id} role="tab" aria-selected={v.id===item.id} onClick={()=>{setPreviewVersionId(item.id);setStageForm('auto');}}>
          <b>{item.name}</b>
          <small>{actor?.version===item.id?tr('当前启用','Current'):p.unlocked.includes(item.id)?tr('已解锁','Unlocked'):i===0?tr('初始版本','Base'):tr('待研发','Research')}</small>
         </button>)}
        </div>

        <div class="ui2-specs-grid">
         <div><small>{tr('算力单价','Token cost')}</small><b>{v.price} T/WP</b>{different&&<span class={`ui2-delta ${delta.price<=0?'is-up':'is-down'}`}>{diff(delta.price)}</span>}</div>
         <div><small>{tr('推理速度','Speed')}</small><b>×{v.speed}</b>{different&&<span class={`ui2-delta ${delta.speed>=0?'is-up':'is-down'}`}>{diff(delta.speed)}</span>}</div>
         <div><small>{tr('稳定 / 上下文','Stability / Ctx')}</small><b>{v.stability} / {v.context}</b>{different&&<span class={`ui2-delta ${delta.stability+delta.context>=0?'is-up':'is-down'}`}>{diff(delta.stability)} / {diff(delta.context)}</span>}</div>
         <div><small>{tr('部署支持','Deployment')}</small><b>{v.modes.map(m=>m==='cloud'?tr('云端','Cloud'):tr('本地','Local')).join(' · ')}</b></div>
        </div>

        <div class="ui2-skills-rhythm">
         <div class="ui2-skill-bars">
          {(Object.keys(skillText) as (keyof typeof skillText)[]).map(k=>{
           const liveVal=actor&&v.id===actor.version?actor.skills[k]:v.skills[k],trainDiff=actor?actor.skills[k]-base.skills[k]:0;
           return <div class="ui2-skill-row" key={k}>
            <span>{skill(k)}</span>
            <div class="ui2-shear-track"><i style={{width:`${Math.min(100,liveVal*10)}%`}}/></div>
            <b>{liveVal}{different&&delta.skills[k]!==0?<em class={`ui2-delta ${delta.skills[k]>0?'is-up':'is-down'}`}>{delta.skills[k]>0?`+${delta.skills[k]}`:delta.skills[k]}</em>:actor&&trainDiff>0&&v.id===actor.version?<em class="ui2-delta is-up">+{trainDiff}</em>:null}</b>
           </div>;
          })}
         </div>
         <RhythmChart rhythm={v.rhythm} english={english}/>
        </div>

        {actor?(
         <div class="ui2-version-footer">
          <button class="primary" disabled={locked||actor.busy||actor.version===v.id||(!p.unlocked.includes(v.id)&&(view.cash<600||p.research<10))} onClick={()=>p.unlocked.includes(v.id)?life('switch',actor.id,v.id):life('unlock',v.id)}>
           {actor.version===v.id?tr('已是当前启用版本','Currently active'):p.unlocked.includes(v.id)?tr('切换至此版本','Switch to version'):tr('研发解锁 ¥600 / 10 RP','Research ¥600 / 10 RP')}
          </button>
          {!p.unlocked.includes(v.id)&&rpNeeded>0&&<button onClick={openMap}><Icon name="map"/><span>{tr(`还差 ${rpNeeded} RP · 查看地图去图书馆`,`Need ${rpNeeded} RP · View library on map`)}</span></button>}
          {(locked||actor.busy)&&<small class="work-disabled-reason">{tr('伙伴当前忙碌或存在未决状态，空闲后可研发或切换版本。','Available once studio state and teammate are idle.')}</small>}
         </div>
        ):(
         <p class="ui2-inline-hint"><Icon name="lock"/> {tr('招募该伙伴后即可研发或切换多版本。','Recruit this teammate to research or switch versions.')}</p>
        )}
       </div>
      )}

      {activeTab==='training'&&actor&&rel&&(
       <div class="ui2-tab-pane">
        {!isLocalVersion?(
         <div class="ui2-closed-model-card">
          <Icon name="chip"/>
          <h4>{tr('云端闭源模型架构','Cloud-hosted proprietary architecture')}</h4>
          <p>{tr(`当前版本「${base.name}」仅支持云端调用，不需要也不开放本地微调/对齐槽位。若角色拥有支持本地部署的版本，切换后即可进行微调训练。`,`"${base.name}" is cloud-only and does not use local fine-tuning slots. Switch to a local-capable version if available to fine-tune.`)}</p>
         </div>
        ):(
         <>
          <div class="ui2-pip-group">
           <PipTrack used={trainUsed} total={2} label={tr('技能微调槽位（每次 8 时段）','Skill fine-tune slots (8 periods each)')}/>
           <PipTrack used={alignUsed} total={1} label={tr('价值观对齐槽位（4 时段）','Alignment slot (4 periods)')}/>
          </div>
          {rel.training&&<p class="ui2-inline-hint"><Icon name="spark"/> {tr(`正在图书馆训练：${rel.training.skill} · 预计完成槽位 ${rel.training.until}`,`Training in library: ${rel.training.skill} · completes at slot ${rel.training.until}`)}</p>}
          <div class="ui2-actions-grid">
           {(Object.keys(skillText) as (keyof typeof skillText)[]).map(k=>{
            const tp=previewActivity?describeActivityPreview(previewActivity({type:'campaign',action:'train',id:actor.id,target:k}),english):null;
            return (
             <button key={k} class="ui2-action-card" disabled={locked||actor.busy||trainUsed>=2||view.cash<300||p.research<5} onClick={()=>life('train',actor.id,k)}>
              <b>{skill(k)} +1</b>
              <small>{tp?.legal?tp.compactText:tr('¥300 + 5 RP · 占用 8 时段 · 移至图书馆','¥300 + 5 RP · 8 periods · Moves to Library')}</small>
             </button>
            );
           })}
           {(()=>{
            const ap=previewActivity?describeActivityPreview(previewActivity({type:'campaign',action:'align',id:actor.id}),english):null;
            return (
             <button class="ui2-action-card" disabled={locked||actor.busy||alignUsed>=1||view.cash<300||p.research<5} onClick={()=>life('align',actor.id)}>
              <b>{tr('安全与输出对齐','Safety & alignment')}</b>
              <small>{ap?.legal?ap.compactText:tr('¥300 + 5 RP · 占用 4 时段 · 移至图书馆 · 降低缺陷风险','¥300 + 5 RP · 4 periods · Moves to Library · Lower defects')}</small>
             </button>
            );
           })()}
          </div>
          {trainRpNeeded>0&&<button onClick={openMap}><Icon name="map"/><span>{tr(`微调需 5 RP（当前差 ${trainRpNeeded}）· 前往图书馆地图`,`Need ${trainRpNeeded} more RP · Library map`)}</span></button>}
         </>
        )}
       </div>
      )}

      {activeTab==='stories'&&(
       <div class="ui2-tab-pane">
        {actor&&<FlavorPanel context={{actor:actor.id,scene:actor.location,slot:view.absoluteSlot,language:english?'en':'zh',mood:actor.mood,version:actor.version}}/>}
        {!actor&&<p class="ui2-inline-hint"><Icon name="lock"/> {tr('招募伙伴并提升好感后，将逐段解锁专属故事。','Recruit this teammate and build affinity to unlock personal stories.')}</p>}
        <div class="ui2-story-list">
         {catalog.stories.filter(st=>st.character===characterId).map(st=>{
          const done=!!rel?.stories.includes(st.id),unlockedStory=!!actor&&!!rel&&rel.affinity>=st.affinity;
          return <article key={st.id} class="ui2-story-card" data-unlocked={unlockedStory} data-done={done}>
           <header>
            <b>{tr('好感里程碑','Affinity milestone')} · {st.affinity}</b>
            <span>{done?tr('已阅完','Completed'):unlockedStory?tr('可阅读','Unlocked'):tr(`还差 ${Math.max(0,st.affinity-(rel?.affinity??0))} 好感`,`Need ${Math.max(0,st.affinity-(rel?.affinity??0))} affinity`)}</span>
           </header>
           {unlockedStory?(
            <>
             <p>{english?st.textEn:st.text}</p>
             <div class="button-row">{st.choices.map((c,i)=>{const sp=previewActivity?describeActivityPreview(previewActivity({type:'campaign',action:'story',id:st.id,target:String(i)}),english):null;return <button key={i} disabled={locked||done} title={sp?.compactText} onClick={()=>life('story',st.id,String(i))}>{english?c.labelEn:c.label} · {tr('好感','Aff')} +{c.affinity} / {tr('心情','Mood')} {c.mood} / +{c.research} RP{sp?.skipsNightRecovery?` · ${tr('将跳过今晚恢复','Skips sleep')}`:''}</button>;})}</div>
            </>
           ):<p class="ui2-story-locked">{tr('多和伙伴日常聊天、送礼或并肩完成委托，就能听到这段回忆。','Chat, send gifts or finish commissions together to hear this story.')}</p>}
          </article>;
         })}
        </div>
       </div>
      )}
     </div>
    </section>
   </div>
  </div>
 );
}
