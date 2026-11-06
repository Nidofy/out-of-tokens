export type Skill = 'code'|'write'|'reason'|'create'|'media'|'recall';
export interface Version { id:string; character:string; name:string; skills:Record<Skill,number>; speed:number; price:number; stability:number; context:number; modes:('cloud'|'local')[]; rhythm:number[] }
export interface Template { id:string; title:string; description:string; weights:Record<Skill,number>; workload:number; workSlots:number; reward:number; clarity:number; delivery:'oneshot' }
export interface Card {id:string; title:string; choices:{label:string; cost:number; multiplier:number}[]}
export interface Content {version:string; versions:Version[]; commissions:Template[]; events:Card[]}
export interface Member {character:string; role:'worker'|'planner'|'reviewer'; mode:'cloud'|'local'}
export interface Actor {id:string; version:string; energy:number; mood:number; load:number; busyUntil:number}
export interface Job {id:string; template:string; status:'posted'|'accepted'|'working'|'review'|'delivered'|'breached'|'rejected'|'expired'; posted:number; deadline:number; duration:number; hidden:number; work:number; progress:number; weighted:number; review:number; defects:number; reworked:boolean; advance:number; quality:number; team:Member[]}
export interface State {engineVersion:string; contentVersion:string; seed:number; absoluteSlot:number; cash:number; quota:number; purchased:number; localCapacity:number; electricity:number; debtPaid:boolean; crisisSince:number|null; bankrupt:boolean; rng:Record<'board'|'event'|'quality',number>; actors:Actor[]; jobs:Job[]; pending:{card:string; slot:number}|null; ledger:{slot:number; reason:string; amount:number}[]; tokensUsed:number}
export type Command = {type:'advance'}|{type:'choose';index:number}|{type:'accept'|'reject'|'deliver'|'rework';job:string}|{type:'clarify';job:string;character:string}|{type:'assign';job:string;team:Member[]}|{type:'buy';amount:number};
export interface DomainEvent {type:string; message:string}
export interface Result {state:State; events:DomainEvent[]; error:string|null}
