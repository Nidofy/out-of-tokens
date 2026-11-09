import type {ComponentChildren} from 'preact';
import type {Command} from 'oot-core';
import type {GameView} from 'oot-platform';
import {Dialog} from './dialog.js';
import {Portrait} from './studio-ui.js';
import {FlavorPanel} from './flavor-panel.js';
import {characterProfiles} from './character-profiles.js';
import {names} from './presentation.js';
import {sceneText,skillText} from './ui-labels.js';
import {partnerAvailability} from './partner-state.js';
type Props={locate:(()=>void)|undefined;view:GameView;actor:GameView['actors'][number];english:boolean;locked:boolean;send:(cmd:Command)=>Promise<boolean>;close:()=>void;closePanel:()=>void;openJob:(id:string)=>void;notice:ComponentChildren};
export function PartnerProfile({view,actor,english,locked,send,close,closePanel,openJob,notice,locate}:Props){
 const tr=(zh:string,en:string)=>english?en:zh,p=view.campaign!,catalog=view.catalog!;
 const {sameScene,onExpedition,activeJobs,lifeBusy,canRecall,status}=partnerAvailability(view,actor,locked);
 const scene=(id:keyof typeof sceneText|'expedition')=>id==='expedition'?tr('远征中','On expedition'):sceneText[id][english?1:0],skill=(id:keyof typeof skillText)=>skillText[id][english?1:0];
 const life=(action:Extract<Command,{type:'campaign'}>['action'],id:string,target?:string)=>void send({type:'campaign',action,id,...(target?{target}:{})});
 return (
<Dialog className="profile-dialog" title={tr('伙伴档案','Team profile')} close={()=>close()}>
<div class="resume-heading">
<Portrait id={actor.id} variant="profile"/>
<div>
<h3>{names[actor.id]}</h3>
<p>{characterProfiles[actor.id]?.[english?1:0]??tr('每位伙伴都有适合自己的工作。按能力选择委托，也记得照顾心情和精力。','Match skills to the brief and leave room to recharge.') }</p>
<p>{tr('擅长','Strengths')}: {Object.entries(actor.skills).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([k])=>skill(k as keyof typeof skillText)).join(' · ')}</p>
<p>{tr('当前版本','Version')}: {catalog.versions.find(v=>v.id===actor.version)?.name}</p>
</div>
</div>
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
<div class="skill-list">{Object.entries(actor.skills).map(([id,v])=>
<div>
<span>{skill(id as keyof typeof skillText)}</span>
<meter min="0" max="10" value={v}/>
<b>{v}</b>
</div>)}</div>{catalog.versions.filter(v=>v.character===actor.id).map(v=>
<p>{v.name} · {v.price}T/WP / ×{v.speed} <button disabled={locked||actor.version===v.id||(p.unlocked.includes(v.id)&&actor.busy)} onClick={()=>p.unlocked.includes(v.id)?life('switch',actor.id,v.id):life('unlock',v.id)}>{actor.version===v.id?tr('当前','Current'):p.unlocked.includes(v.id)?tr('切换','Switch'):tr('研发 ¥600 / 10RP','Research ¥600 / 10RP')}</button>
</p>)}<details>
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
</Dialog>
 );
}
