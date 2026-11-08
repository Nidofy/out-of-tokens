import type {Command} from 'oot-core';
export interface PresentationEvent {id:number;kind:'accept'|'assign'|'deliver'|'upgrade';title:[string,string];}
// A transient, bounded UI queue. No timers, rewards, RNG or save mutations here.
export function presentationEvent(command:Command,id:number,cashDelta:number):PresentationEvent|null{
 if(command.type==='accept')return {id,kind:'accept',title:['新委托已进入工作看板','New commission added to the work board']};
 if(command.type==='assign')return {id,kind:'assign',title:['伙伴已收到安排，准备开工','Team assigned and ready to work']};
 if(command.type==='deliver')return {id,kind:'deliver',title:[`验收完成 · 资金变动 ¥${cashDelta.toFixed(2)}`,`Delivery settled · Cash change ¥${cashDelta.toFixed(2)}`]};
 if(command.type==='campaign'&&command.action==='hardware')return {id,kind:'upgrade',title:['工作室设备已升级','Studio equipment upgraded']};
 return null;
}
export function enqueuePresentation(queue:PresentationEvent[],event:PresentationEvent|null){return event?[...queue,event].slice(-4):queue;}
