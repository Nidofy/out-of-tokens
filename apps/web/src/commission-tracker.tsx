import {useState} from 'preact/hooks';
import type {GameView} from 'oot-platform';
import {trackingCandidates,trackerText} from './commission-tracking.js';

export function CommissionHudTracker({view,id,english,open,track,locate}:{view:GameView;id:string|null;english:boolean;open:(id:string)=>void;track:(id:string)=>void;locate:undefined|(()=>void)}){
 const [collapsed,setCollapsed]=useState(false),tr=(zh:string,en:string)=>english?en:zh;
 const job=view.jobs.find(j=>j.id===id),project=view.projects.find(p=>`project:${p.id}`===id),ids=trackingCandidates(view);
 if(!id||(!job&&!project))return null;
 const tone=job?.status==='working'&&job.deadline-view.absoluteSlot<=1?'accepted':job?.status??'project';
 const title=job?tr(job.title,job.titleEn):tr(project!.title,project!.titleEn);
 const meta=trackerText(view,id,english);
 return <section class="commission-tracker" data-collapsed={collapsed} data-tone={tone} aria-label={tr('实时委托追踪','Live commission tracker')}><button class="tracker-main" title={title} onClick={()=>collapsed?setCollapsed(false):open(id)}><CommissionEmblem kind={tone}/><span><b>{title}</b><i class="tracker-progress"><i style={{width:`${job?Math.min(100,job.progress/Math.max(1,job.work)*100):0}%`}}/></i><small>{meta}</small></span></button>{!collapsed&&<>{locate&&<button aria-label={tr('定位工位','Locate workstation')} onClick={locate}>◎</button>}{ids.length>1&&<button aria-label={tr('轮换追踪','Cycle tracking')} onClick={()=>track(ids[(ids.indexOf(id)+1)%ids.length]!)}>{ids.indexOf(id)+1}/{ids.length}</button>}<button class="tracker-collapse" aria-label={tr('折叠追踪','Collapse tracker')} onClick={()=>setCollapsed(true)}>−</button></>}</section>;
}

/** Small original geometric marks shared by the HUD and log; no workbench dependency. */
export function CommissionEmblem({kind='working'}:{kind?:string}){
 const shapes:Record<string,string>={project:'M7 12 12 16 16 8 20 16 25 12 22 24H10Z',history:'M10 8H22V24H10ZM13 12H19M13 16H19M13 20H17',posted:'M16 9V18M16 21V23',accepted:'M16 9V18M16 21V23',review:'M10 16 14 20 23 10',active:'M16 9 18 14 23 16 18 18 16 23 14 18 9 16 14 14Z'};
 return <svg class="commission-emblem" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 2 30 16 16 30 2 16Z" fill="none" stroke="currentColor"/><path d={shapes[kind]??'M16 10 22 16 16 22 10 16Z'} fill={kind==='working'?'currentColor':'none'} stroke="currentColor" stroke-width="1.8"/></svg>;
}
