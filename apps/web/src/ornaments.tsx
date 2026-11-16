import {Icon} from './icons.js';

export function PeriodClockIcon({slot}:{slot:number}){
 const kinds=['dawn','noon','dusk','moon'] as const;
 return <span class="ui2-period-icon" data-period={slot%4}><Icon name={kinds[slot%4]??'dawn'}/></span>;
}

export function PeriodDots({slot}:{slot:number}){
 const current=slot%4;
 return <span class="ui2-period-dots" aria-hidden="true">{[0,1,2,3].map(i=><i class={i===current?'is-active':i<current?'is-passed':''}/>)}</span>;
}

export function OrnamentDivider({label}:{label?:string}){
 return <div class="ui2-divider" aria-hidden={!label}><span/><svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><path d="M10 2 18 10 10 18 2 10Z" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M10 6 14 10 10 14 6 10Z" fill="currentColor"/></svg>{label&&<b>{label}</b>}<span/></div>;
}

export function RhythmChart({rhythm,english}:{rhythm:readonly number[];english:boolean}){
 const labels=english?['AM','PM','EVE','NT']:['上午','下午','晚上','深夜'],peak=Math.max(...rhythm);
 return <div class="ui2-rhythm" role="group" aria-label={english?'Time-of-day rhythm':'四时段效率节律'}>{rhythm.map((v,i)=><div class={v>=peak?'is-peak':''} key={i}><small>×{v}</small><div class="ui2-rhythm-track"><i style={{height:`${Math.max(18,Math.min(100,Math.round((v/1.5)*100)))}%`}}/></div><span>{labels[i]}</span></div>)}</div>;
}

export function PipTrack({used,total,label}:{used:number;total:number;label:string}){
 return <div class="ui2-pip-track" aria-label={label}><span>{label}</span><div class="ui2-pips" aria-hidden="true">{Array.from({length:total},(_,i)=><i class={i<used?'is-filled':''} key={i}/>)}</div><b>{used}/{total}</b></div>;
}

export function QualitySealSvg({score,passLine,tier,english}:{score:number;passLine:number;tier:'excellent'|'good'|'pass'|'fail';english:boolean}){
 const titles={excellent:english?'EXCELLENT':'出色',good:english?'GOOD':'优良',pass:english?'ACCEPTED':'达标',fail:english?'REWORK':'待返工'};
 return <div class="ui2-seal" data-tier={tier}><svg class="ui2-seal-ring" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="6 4"/><circle cx="60" cy="60" r="46" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M60 4 63 11 60 15 57 11ZM60 116 63 109 60 105 57 109ZM4 60 11 63 15 60 11 57ZM116 60 109 63 105 60 109 57Z" fill="currentColor"/></svg><div class="ui2-seal-core"><small>{titles[tier]}</small><strong>{score}</strong><span>{english?'Pass':'及格'} {passLine}</span></div></div>;
}
