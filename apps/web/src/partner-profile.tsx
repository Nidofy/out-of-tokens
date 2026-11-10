import type {ComponentChildren} from 'preact';
import type {Command} from 'oot-core';
import type {GameView} from 'oot-platform';
import {Dialog} from './dialog.js';
import {useState,useRef} from 'preact/hooks';
import {content} from './content.js';
import {FlavorPanel} from './flavor-panel.js';
import {characterProfiles,resolveCharacterVisual,versionDelta,recruitmentBlock,recruitmentReasons} from './character-profiles.js';
import {names} from './presentation.js';
import {sceneText,skillText} from './ui-labels.js';
import {partnerAvailability} from './partner-state.js';
type Props={locate:(()=>void)|undefined;view:GameView;characterId:string;actor:GameView['actors'][number]|undefined;english:boolean;locked:boolean;send:(cmd:Command)=>Promise<boolean>;close:()=>void;closePanel:()=>void;openJob:(id:string)=>void;notice:ComponentChildren};
export function PartnerProfile({view,actor,characterId,english,locked,send,close,closePanel,openJob,notice,locate}:Props){
 const tr=(zh:string,en:string)=>english?en:zh,p=view.campaign!,catalog=view.catalog!;
 const {sameScene,onExpedition,activeJobs,lifeBusy,canRecall,status}=actor?partnerAvailability(view,actor,locked):{sameScene:false,onExpedition:false,activeJobs:[],lifeBusy:false,canRecall:false,status:null};
 const scene=(id:keyof typeof sceneText|'expedition')=>id==='expedition'?tr('远征中','On expedition'):sceneText[id][english?1:0],skill=(id:keyof typeof skillText)=>skillText[id][english?1:0];
 const life=(action:Extract<Command,{type:'campaign'}>['action'],id:string,target?:string)=>void send({type:'campaign',action,id,...(target?{target}:{})});
 const versions=content.versions.filter(v=>v.character===characterId),base=versions.find(v=>v.id===actor?.version)??versions[0]!;
 const [previewVersionId,setPreviewVersionId]=useState(base.id),[inverted,setInverted]=useState(false),inspectorRef=useRef<HTMLElement>(null);
 const v=versions.find(v=>v.id===previewVersionId)??base,visual=resolveCharacterVisual(characterId,v.id,'profile'),delta=versionDelta(v,base),recruit=catalog.recruits.find(r=>r.character===characterId),block=recruit?recruitmentBlock(view,recruit,locked):null;
 const diff=(n:number)=>`Δ ${n>0?'+':''}${n}`,different=v.id!==base.id;
 const inspector=<section ref={inspectorRef} class="profile-section management-content version-inspector"><h3>{tr('模型版本切换与规格细节检视器','Model Version Inspector')}</h3>
 <div class="management-tabs">{versions.map((item,i)=><button aria-pressed={v.id===item.id} onClick={()=>setPreviewVersionId(item.id)}>{item.name} · {actor?.version===item.id?tr('当前','Current'):p.unlocked.includes(item.id)?tr('已解锁','Unlocked'):i===0?tr('初始','Initial'):tr('待研发','Research required')}</button>)}</div>
 <div class="profile-vitals version-metrics"><div><small>{tr('算力单价','Cost')}</small><b>{v.price} T/WP</b>{different&&<small>{diff(delta.price)}</small>}</div><div><small>{tr('推理速度','Speed')}</small><b>×{v.speed}</b>{different&&<small>{diff(delta.speed)}</small>}</div><div><small>{tr('稳定性 / 上下文','Stability / Context')}</small><b>{v.stability} / {v.context}</b>{different&&<small>{diff(delta.stability)} / {diff(delta.context)}</small>}</div><div><small>{tr('部署方式','Modes')}</small><b>{v.modes.map(m=>m==='cloud'?tr('☁ 云端','☁ Cloud'):tr('▣ 本地','▣ Local')).join(' · ')}</b></div></div>
 <div class="skill-list">{(Object.keys(skillText) as (keyof typeof skillText)[]).map(k=><div><span>{skill(k)}</span><meter min="0" max="10" value={v.skills[k]}/><b>{v.skills[k]} {different&&<small>{diff(delta.skills[k])}</small>}</b></div>)}</div>
 {actor&&<p>{tr('当前训练加成（已计入实时能力）','Current training bonus (included in live skills)')}: {(Object.keys(skillText) as (keyof typeof skillText)[]).filter(k=>actor.skills[k]!==base.skills[k]).map(k=>`${skill(k)} ${diff(actor.skills[k]-base.skills[k])}`).join(' · ')||'—'}</p>}
 <p class="version-rhythm">{v.rhythm.map((n,i)=>`${[tr('上午','Morning'),tr('下午','Afternoon'),tr('晚上','Evening'),tr('深夜','Night')][i]} ×${n}`).join(' · ')}</p>
 {actor?<><button class="primary" disabled={locked||actor.busy||actor.version===v.id} onClick={()=>p.unlocked.includes(v.id)?life('switch',actor.id,v.id):life('unlock',v.id)}>{actor.version===v.id?tr('当前版本','Current version'):p.unlocked.includes(v.id)?tr('切换至此版本','Switch to this version'):tr('研发解锁 ¥600 / 10RP','Research ¥600 / 10RP')}</button>{(locked||actor.busy)&&<p>{tr('当前状态或伙伴忙碌，暂不可研发或切换。','Resolve the current state and wait for this teammate to be free.')}</p>}</>:<button disabled>{tr('招募伙伴后可研发或切换版本','Recruit this teammate to research or switch versions')}</button>}</section>;
 return (
<Dialog className="profile-dialog" title={tr('伙伴档案','Team profile')} close={()=>close()}>
<div class="resume-heading poster-profile-heading" style={{'--poster-color':visual.themeColor}}>
<div class="profile-art-frame" data-inverted={inverted}><img src={visual.src} alt=""/></div><div><h3>{names[characterId]} · {visual.sWord}</h3><b>{visual.versionBadge}</b><p>{characterProfiles[characterId]?.[english?1:0]}</p>{characterId==='claude'&&<button aria-pressed={inverted} onClick={()=>setInverted(!inverted)}>{tr('🙃 切换封号倒置视角','🙃 Toggle suspended view')}</button>}</div></div>
{!actor&&recruit&&<><div class="profile-vitals"><div><small>{tr('开放章节','Chapter')}</small><b>{recruit.minChapter??0}</b></div><div><small>{tr('所需声望','Reputation')}</small><b>{recruit.reputation}</b></div><div><small>{tr('招募费用','Cost')}</small><b>¥{recruit.cost}</b></div><div><small>{tr('当前状态','Status')}</small><b>{block?recruitmentReasons[block][english?1:0]:tr('可招募','Eligible')}</b></div></div><button class="primary" disabled={!!block} onClick={()=>{void send({type:'campaign',action:'recruit',id:characterId}).then(ok=>{if(ok)requestAnimationFrame(()=>inspectorRef.current?.querySelector<HTMLButtonElement>('button[aria-pressed=true]')?.focus({preventScroll:true}));});}}>{tr('立即招募','Recruit now')} (¥{recruit.cost})</button>{notice}</>}
{inspector}
{actor&&<>
<div class="profile-vitals">
<div>
<small>{tr('所在场景','Location')}</small>
<b>{scene(actor.location)}</b>
</div>
<div>
<small>{tr('精力','Energy')}</small>
<b>{actor.energy}</b>
</div>
<div>
<small>{tr('心情','Mood')}</small>
<b>{actor.mood}</b>
</div>
<div>
<small>{tr('负载','Load')}</small>
<b>{actor.load}</b>
</div>
</div>{(onExpedition||!sameScene||lifeBusy)&&<p class="profile-status">{onExpedition?tr('正在远征中，返程后可安排工作室活动。','On expedition. Studio activities resume after returning.'):status==='elsewhere'?tr(`当前在${scene(actor.location)}：先去找伙伴即可聊天或互动。`,`Currently in ${scene(actor.location)}. Visit this teammate to interact.`):status==='work'?tr('正在负责委托工作，空闲后可聊天。','Working on a commission. Chat becomes available when free.'):tr('本时段已有安排，下一时段可聊天。','Occupied this period. Chat becomes available next period.')}</p>}<div class="profile-actions">
{locate&&<button onClick={locate}>{tr('定位到场景','Locate in scene')}</button>}<button onClick={()=>life('chat',actor.id)} disabled={locked||lifeBusy||!sameScene}>{tr('聊天','Chat')}</button>{activeJobs.map(j=>
<button class="primary" onClick={()=>{close();openJob(j.id);}}>{tr('查看工作','View work')}</button>)}{!sameScene&&!onExpedition&&<button class={activeJobs.length?'':'primary'} disabled={locked} onClick={()=>{void send({type:'campaign',action:'visit',id:actor.location}).then(ok=>{if(ok){close();closePanel();}});}}>{tr('去找伙伴','Visit character')}</button>}</div>{notice}<details class="profile-section">
<summary>{tr('互动与日程','Interactions and schedule')}</summary>
<p>{tr('送礼需 ¥60；吃饭需在食堂/图书馆（¥30），学习需在图书馆且精力至少10。均需伙伴同场景且本时段空闲（在岗伙伴晚间未加班时可互动）；请回工作室需在食堂/图书馆且同场景，或已研发远程协作；加班需执行中的委托、精力至少10且本时段未被其他活动占用，仅限晚间/深夜且不可重复安排。','Gifts cost ¥60. Meals require the canteen/library and ¥30; study requires the library and 10 energy. These activities need a teammate free this period in the same scene; assigned teammates can interact after work without overtime. Recall from the canteen/library requires the same scene or Remote Collaboration. Overtime requires an active job, 10 energy and no conflicting activity; evening/night only, once per period.')}</p>
<div class="button-row">
<button disabled={locked||lifeBusy||!sameScene||view.cash<60} onClick={()=>life('gift',actor.id)}>{tr('送礼 ¥60','Gift ¥60')}</button>
<button disabled={locked||lifeBusy||!sameScene||!['canteen','library'].includes(p.scene)||view.cash<30} onClick={()=>life('meal',actor.id)}>{tr('吃饭/图书馆外卖 ¥30','Meal / library takeaway ¥30')}</button>
<button disabled={locked||lifeBusy||!sameScene||p.scene!=='library'||actor.energy<10} onClick={()=>life('study',actor.id)}>{tr('学习 +2RP','Study +2RP')}</button>{!onExpedition&&<button disabled={!canRecall} onClick={()=>life('recall',actor.id)}>{tr('请回工作室','Recall to workshop')}</button>}{onExpedition&&<button disabled title={tr('远征需等到返程，当前规则不支持提前召回。','Expeditions cannot be recalled early under the current rules.')}>{tr('远征中，等待返程','On expedition; awaiting return')}</button>}<button disabled={locked||view.absoluteSlot%4<2||onExpedition||view.overtime.includes(actor.id)||actor.energy<10||actor.busyUntil>view.absoluteSlot||!activeJobs.some(j=>j.status==='working')} onClick={()=>void send({type:'overtime',character:actor.id})}>{tr('本槽加班','Overtime this slot')}</button>
</div>
</details>
<details class="profile-section">
<summary>{tr('能力、版本与成长','Skills, versions and growth')}</summary>
<p>{tr('好感 / 经验 / 压力 / 饥饿','Affinity / XP / stress / hunger')}: {p.relations[actor.id]!.affinity} / {p.relations[actor.id]!.xp} / {p.relations[actor.id]!.stress} / {p.relations[actor.id]!.hunger}</p>
<details>
<summary>{tr('开源训练（微调8槽/对齐4槽，¥300 + 5RP）','Open-source training (8 slots; alignment 4 slots; ¥300 + 5RP)')}</summary>{(Object.keys(skillText) as (keyof typeof skillText)[]).map(k=>
<button disabled={locked||actor.busy} onClick={()=>life('train',actor.id,k)}>{skill(k)} +1</button>)}<button disabled={locked||actor.busy} onClick={()=>life('align',actor.id)}>{tr('对齐','Align')}</button>
</details>
</details>
<details class="profile-section">
<summary>{tr('伙伴故事','Character stories')}</summary>{catalog.stories.filter(st=>st.character===actor.id).map(st=>
<details>
<summary>{tr('好感','Affinity')} {st.affinity} {p.relations[actor.id]!.stories.includes(st.id)?'✓':''}</summary>{p.relations[actor.id]!.affinity>=st.affinity?<p>{english?st.textEn:st.text}</p>:<p>{tr('再熟悉一些，就能听到这段故事。','Get to know this teammate to unlock the story.')}</p>}{p.relations[actor.id]!.affinity>=st.affinity&&st.choices.map((c,i)=>
<button disabled={locked||p.relations[actor.id]!.affinity<st.affinity||p.relations[actor.id]!.stories.includes(st.id)} onClick={()=>life('story',st.id,String(i))}>{english?c.labelEn:c.label} · {tr('好感','Affinity')} +{c.affinity} / {tr('心情','Mood')} {c.mood} / RP +{c.research}</button>)}</details>)}</details>
<FlavorPanel context={{actor:actor.id,scene:actor.location,slot:view.absoluteSlot,language:english?'en':'zh',mood:actor.mood,version:actor.version}}/>
</>}{!actor&&<p>{tr('伙伴故事（招募并提升好感后解锁）','Character stories unlock after recruitment and growing affinity.')}</p>}
</Dialog>
 );
}
