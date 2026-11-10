from pathlib import Path
p=Path('apps/web/src/alpha-app.tsx')
s=p.read_text(encoding='utf-8').replace("import {characterProfiles}","import {characterPosters,resolveCharacterVisual,recruitmentBlock,recruitmentReasons}")
s=s.replace('Drawer,Portrait,sceneArt','Drawer,actorIds,sceneArt')
s=s.replace("const managementTrigger=", "const [actorFilter,setActorFilter]=useState<'all'|'recruited'|'available'>('all');\n const managementTrigger=")
s=s.replace("if(next==='studio'||next==='journal')", "if((next==='studio'||next==='journal'||next==='actors')&&!panel)")
s=s.replace("panel==='studio'||panel==='journal';", "panel==='studio'||panel==='journal'||panel==='actors';")
start=s.index(" {panel==='actors'&&")
end=s.index(" {panel==='jobs'&&",start)
s=s[:start]+''' {panel==='actors'&&<div class="management-content">
 <div class="management-tabs">{(['all','recruited','available'] as const).map((f,i)=><button aria-pressed={actorFilter===f} onClick={()=>setActorFilter(f)}>{[tr('全部','All'),tr('已入驻','Recruited'),tr('待招募','Available')][i]} ({[actorIds.length,view.actors.length,actorIds.length-view.actors.length][i]})</button>)}</div>
 <div class="poster-grid">{actorIds.filter(id=>actorFilter==='all'||(actorFilter==='recruited')===view.actors.some(a=>a.id===id)).map(id=>{
 const a=view.actors.find(a=>a.id===id),r=catalog.recruits.find(r=>r.character===id),poster=characterPosters[id]!,v=catalog.versions.find(v=>a?v.id===a.version:v.character===id)!,visual=resolveCharacterVisual(id,v.id),block=r?recruitmentBlock(view,r,locked):null;
 const top=Object.entries(a?.skills??v.skills).filter(([k])=>k!=='recall').sort((a,b)=>b[1]-a[1]).slice(0,2).map(([k])=>k);
 return <button class="poster-card" key={id} data-character={id} data-recruited={!!a} data-mirror={poster.mirror} style={{'--poster-color':poster.themeColor}} onClick={()=>setActorId(id)}>
 <span class="poster-title"><strong class="poster-word">{poster.sWord}</strong><b>{names[id]}</b><span>{poster.tagline[english?1:0]}</span><small>{v.name}</small></span>
 <img class="poster-art" src={visual.src} alt="" loading="lazy"/><span class="poster-check-strip"><span class="poster-stamp">STUDIO O.T.</span>{(['code','write','reason','create','media'] as const).map(k=><span>{top.includes(k)?'☑':'□'} {skill(k)}</span>)}</span>
 <span class="poster-status-bar">{a?`${scene(a.location)} · ${tr('精力','Energy')} ${a.energy} · ${tr('心情','Mood')} ${a.mood} · ${tr('负载','Load')} ${a.load}`:r?<>{tr('待招募','Not recruited')} · ¥{r.cost} · {tr('声望','Reputation')} {r.reputation} · {tr('开放章节','Chapter')} {r.minChapter??0}<br/>{block?recruitmentReasons[block][english?1:0]:tr('✨ 可招募 · 点击查看档案','✨ Available · View profile')}</>:null}</span>
 </button>;})}</div><div class="management-card"><p class="management-caption">{tr('本槽可能停工','May stop this period')}: {view.possibleStops.map(id=>names[id]).join(', ')||'—'}</p><p class="management-caption">{tr('空闲可恢复精力；深夜空闲可恢复心情。高饥饿与压力会抵消恢复，查看角色状态后安排吃饭或休息。','Idle time restores energy; idle nights restore mood. Hunger and stress can offset recovery. Check each character before choosing a meal or rest.')}</p></div></div>}
'''+s[end:]
start=s.index(' <details class="management-card"><summary>{tr(\'伙伴招募与人手\'')
end=s.index('</details>',start)+len('</details>')
s=s[:start]+''' <details class="management-card"><summary>{tr('伙伴招募与人手','Recruitment and staffing')}</summary><p class="management-caption">{tr('在岗伙伴','Recruited teammates')} {view.actors.length} · {tr('可招募','Eligible')} {catalog.recruits.filter(r=>!recruitmentBlock(view,r,locked)).length}</p><button onClick={()=>{setActorFilter('all');setPanel('actors');}}>{tr('打开伙伴与招募画廊','Open teammate & recruitment gallery')}</button></details>'''+s[end:]
s=s.replace("{actor&&!view.pending&&!job&&<PartnerProfile key={actor.id} locate={actorFocus(view,actor.id)?()=>locate(actorFocus(view,actor.id)):undefined} actor={actor}","{actorId&&!view.pending&&!job&&<PartnerProfile key={actorId} characterId={actorId} locate={actor&&actorFocus(view,actor.id)?()=>locate(actorFocus(view,actor.id)):undefined} actor={actor}")
s=s.replace("send(cmd,{surface:'actor',id:actor.id})", "send(cmd,{surface:'actor',id:actorId})")
s=s.replace("actor:actor?.id,saves,modal:!!(view.pending||job||actor||", "actor:actorId??undefined,saves,modal:!!(view.pending||job||actorId||")
p.write_text(s,encoding='utf-8')
p=Path('apps/web/src/partner-profile.tsx');s=p.read_text(encoding='utf-8')
s=s.replace("import {Portrait} from './studio-ui.js';","import {useState} from 'preact/hooks';\nimport {content} from './content.js';")
s=s.replace('import {characterProfiles}', 'import {characterProfiles,resolveCharacterVisual,versionDelta,recruitmentBlock,recruitmentReasons}')
s=s.replace("actor:GameView['actors'][number];", "characterId:string;actor:GameView['actors'][number]|undefined;")
s=s.replace('{view,actor,english', '{view,actor,characterId,english')
s=s.replace('partnerAvailability(view,actor,locked)',"actor?partnerAvailability(view,actor,locked):{sameScene:false,onExpedition:false,activeJobs:[],lifeBusy:false,canRecall:false,status:null}")
pos=s.index(' return (')
s=s[:pos]+''' const versions=content.versions.filter(v=>v.character===characterId),base=versions.find(v=>v.id===actor?.version)??versions[0]!;
 const [previewVersionId,setPreviewVersionId]=useState(base.id),[inverted,setInverted]=useState(false);
 const v=versions.find(v=>v.id===previewVersionId)??base,visual=resolveCharacterVisual(characterId,v.id,'profile'),delta=versionDelta(v,base),recruit=catalog.recruits.find(r=>r.character===characterId),block=recruit?recruitmentBlock(view,recruit,locked):null;
 const diff=(n:number)=>`Δ ${n>0?'+':''}${n}`,different=v.id!==base.id;
 const inspector=<section class="profile-section management-content version-inspector"><h3>{tr('模型版本切换与规格细节检视器','Model Version Inspector')}</h3>
 <div class="management-tabs">{versions.map((item,i)=><button aria-pressed={v.id===item.id} onClick={()=>setPreviewVersionId(item.id)}>{item.name} · {actor?.version===item.id?tr('当前','Current'):p.unlocked.includes(item.id)?tr('已解锁','Unlocked'):i===0?tr('初始','Initial'):tr('待研发','Research required')}</button>)}</div>
 <div class="profile-vitals version-metrics"><div><small>{tr('算力单价','Cost')}</small><b>{v.price} T/WP</b>{different&&<small>{diff(delta.price)}</small>}</div><div><small>{tr('推理速度','Speed')}</small><b>×{v.speed}</b>{different&&<small>{diff(delta.speed)}</small>}</div><div><small>{tr('稳定性 / 上下文','Stability / Context')}</small><b>{v.stability} / {v.context}</b>{different&&<small>{diff(delta.stability)} / {diff(delta.context)}</small>}</div><div><small>{tr('部署方式','Modes')}</small><b>{v.modes.map(m=>m==='cloud'?tr('☁ 云端','☁ Cloud'):tr('▣ 本地','▣ Local')).join(' · ')}</b></div></div>
 <div class="skill-list">{(Object.keys(skillText) as (keyof typeof skillText)[]).map(k=><div><span>{skill(k)}</span><meter min="0" max="10" value={v.skills[k]}/><b>{v.skills[k]} {different&&<small>{diff(delta.skills[k])}</small>}</b></div>)}</div>
 {actor&&<p>{tr('当前训练加成（已计入实时能力）','Current training bonus (included in live skills)')}: {(Object.keys(skillText) as (keyof typeof skillText)[]).filter(k=>actor.skills[k]!==base.skills[k]).map(k=>`${skill(k)} ${diff(actor.skills[k]-base.skills[k])}`).join(' · ')||'—'}</p>}
 <p class="version-rhythm">{v.rhythm.map((n,i)=>`${[tr('上午','Morning'),tr('下午','Afternoon'),tr('晚上','Evening'),tr('深夜','Night')][i]} ×${n}`).join(' · ')}</p>
 {actor?<><button class="primary" disabled={locked||actor.busy||actor.version===v.id} onClick={()=>p.unlocked.includes(v.id)?life('switch',actor.id,v.id):life('unlock',v.id)}>{actor.version===v.id?tr('当前版本','Current version'):p.unlocked.includes(v.id)?tr('切换至此版本','Switch to this version'):tr('研发解锁 ¥600 / 10RP','Research ¥600 / 10RP')}</button>{(locked||actor.busy)&&<p>{tr('当前状态或伙伴忙碌，暂不可研发或切换。','Resolve the current state and wait for this teammate to be free.')}</p>}</>:<button disabled>{tr('招募伙伴后可研发或切换版本','Recruit this teammate to research or switch versions')}</button>}</section>;
'''+s[pos:]
start=s.index('<div class="resume-heading">');end=s.index('<div class="profile-vitals">',start)
s=s[:start]+'''<div class="resume-heading poster-profile-heading" style={{'--poster-color':visual.themeColor}}>
<div class="profile-art-frame" data-inverted={inverted}><img src={visual.src} alt=""/></div><div><h3>{names[characterId]} · {visual.sWord}</h3><b>{visual.versionBadge}</b><p>{characterProfiles[characterId]?.[english?1:0]}</p>{characterId==='claude'&&<button aria-pressed={inverted} onClick={()=>setInverted(!inverted)}>{tr('🙃 切换封号倒置视角','🙃 Toggle suspended view')}</button>}</div></div>
{!actor&&recruit&&<><div class="profile-vitals"><div><small>{tr('开放章节','Chapter')}</small><b>{recruit.minChapter??0}</b></div><div><small>{tr('所需声望','Reputation')}</small><b>{recruit.reputation}</b></div><div><small>{tr('招募费用','Cost')}</small><b>¥{recruit.cost}</b></div><div><small>{tr('当前状态','Status')}</small><b>{block?recruitmentReasons[block][english?1:0]:tr('可招募','Eligible')}</b></div></div><button class="primary" disabled={!!block} onClick={()=>life('recruit',characterId)}>{tr('立即招募','Recruit now')} (¥{recruit.cost})</button>{notice}</>}
{inspector}
{actor&&<>
'''+s[end:]
start=s.index('<div class="skill-list">',s.index("好感 / 经验"));end=s.index('<summary>{tr(\'开源训练',start)
s=s[:start]+'<details>\n'+s[end:]
s=s.replace('</Dialog>',"</>}{!actor&&<p>{tr('伙伴故事（招募并提升好感后解锁）','Character stories unlock after recruitment and growing affinity.')}</p>}\n</Dialog>")
p.write_text(s,encoding='utf-8')
