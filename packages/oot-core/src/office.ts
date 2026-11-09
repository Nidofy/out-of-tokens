import type {Content,Member,State} from './model.js';
export type OfficeZone='work'|'meeting'|'lounge'|'server';
export interface FurnitureDefinition {id:string;name:string;nameEn:string;zone:OfficeZone;price:number;seats:number;upgradeFrom?:string;}
export interface OfficeDefinition {catalog:FurnitureDefinition[];computerVersions:string[];computerTemplates:string[];}
export interface Furniture {id:string;kind:string;slot:string|null;}
export interface Reservation {item:string;seat:number;job:string;zone:OfficeZone;until?:number;}
export interface OfficeState {revision:number;nextId:number;items:Furniture[];reservations:Record<string,Reservation>;}
export type OfficeCommand={type:'office';revision:number;items:Furniture[]};
export const officeLimit=(chapter:number)=>[4,6,9,12,16][Math.min(4,chapter)]!;
export function officeSlots(chapter:number){return [ ...Array.from({length:officeLimit(chapter)},(_,i)=>`work-${i+1}`),'meeting-1','meeting-2','lounge-1','lounge-2','lounge-3','server-1','server-2'];}
export const slotZone=(slot:string)=>slot.split('-')[0] as OfficeZone;
const check=(ok:unknown,error:string):void=>{if(!ok)throw Error(error);};
export function initialOffice():OfficeState{return {revision:0,nextId:6,items:[{id:'f1',kind:'basic',slot:'work-1'},{id:'f2',kind:'basic',slot:'work-2'},{id:'f3',kind:'basic',slot:'work-3'},{id:'f4',kind:'whiteboard',slot:'meeting-1'},{id:'f5',kind:'coffee',slot:'lounge-1'}],reservations:{}};}
export function cloneOffice(o:OfficeState):OfficeState{return {...o,items:o.items.map(i=>({...i})),reservations:Object.fromEntries(Object.entries(o.reservations).map(([id,r])=>[id,{...r}]))};}
export function requiredFacility(c:Content,version:string,role:Member['role'],template:string):OfficeZone{
 return role==='worker'||role==='tool'||c.campaign?.office?.computerVersions.includes(version)||c.campaign?.office?.computerTemplates.includes(template)?'work':'meeting';
}
export function reserveOffice(s:State,c:Content){
 const o=s.campaign?.office,d=c.campaign?.office;if(!o||!d)return;
 const wanted:{actor:string;job:string;zone:OfficeZone;until?:number}[]=[];
 for(const j of s.jobs.filter(j=>['accepted','working','waiting','review'].includes(j.status)))for(const m of j.team){const a=s.actors.find(a=>a.id===m.character)!;wanted.push({actor:m.character,job:j.id,zone:requiredFacility(c,a.version,m.role,j.template)});}
 for(const [actor,r] of Object.entries(o.reservations))if(r.until!==undefined&&r.until>s.absoluteSlot&&!wanted.some(w=>w.actor===actor))wanted.push({actor,job:r.job,zone:r.zone,until:r.until});
 const seats=o.items.filter(i=>i.slot!==null).flatMap(i=>{const def=d.catalog.find(x=>x.id===i.kind)!;return Array.from({length:def.seats},(_,seat)=>({item:i.id,seat,zone:def.zone}));});
 const next:OfficeState['reservations']={},used=new Set<string>();
 const claim=(w:typeof wanted[number],seat:typeof seats[number])=>{next[w.actor]={...seat,job:w.job,...(w.until===undefined?{}:{until:w.until})};used.add(`${seat.item}:${seat.seat}`);};
 for(const w of wanted){const old=o.reservations[w.actor],seat=seats.find(x=>x.item===old?.item&&x.seat===old?.seat&&x.zone===w.zone);if(seat&&!used.has(`${seat.item}:${seat.seat}`))claim(w,seat);}
 for(const w of wanted.filter(w=>!next[w.actor])){const seat=seats.find(x=>x.zone===w.zone&&!used.has(`${x.item}:${x.seat}`));check(seat,w.zone==='work'?'NO_WORKSTATION':'NO_MEETING_SEAT');claim(w,seat!);}
 o.reservations=next;
}
export function reserveClarification(s:State,c:Content,actor:string,job:string){
 const o=s.campaign?.office;if(!o)return;
 const a=s.actors.find(x=>x.id===actor)!,j=s.jobs.find(x=>x.id===job)!;
 o.reservations[actor]={item:'',seat:0,zone:requiredFacility(c,a.version,'planner',j.template),job:`clarify:${job}`,until:s.absoluteSlot+1};reserveOffice(s,c);
}
export function parseOffice(v:Record<string,unknown>):OfficeCommand{
 check(Number.isSafeInteger(v.revision)&&Number(v.revision)>=0&&Array.isArray(v.items)&&v.items.length<=64,'INVALID_OFFICE');
 const items=(v.items as unknown[]).map(x=>{check(x&&typeof x==='object','INVALID_OFFICE');const i=x as Record<string,unknown>;check(typeof i.id==='string'&&/^(f[1-9]\d*|new:[0-9]+)$/.test(i.id)&&typeof i.kind==='string'&&(i.slot===null||typeof i.slot==='string'),'INVALID_OFFICE');return {id:i.id as string,kind:i.kind as string,slot:i.slot as string|null};});
 return {type:'office',revision:v.revision as number,items};
}
export function applyOffice(s:State,c:Content,cmd:OfficeCommand){
 const p=s.campaign,o=p?.office,d=c.campaign?.office;check(o&&p&&d,'NO_OFFICE');
 check(o!.revision===cmd.revision,'OFFICE_CONFLICT');check(new Set(cmd.items.map(i=>i.id)).size===cmd.items.length,'DUPLICATE_FURNITURE');
 check(o!.items.every(old=>cmd.items.some(i=>i.id===old.id)),'FURNITURE_MISSING');
 const slots=officeSlots(p!.chapter),occupied=new Set<string>();let cost=0;
 for(const i of cmd.items){
  const def=d!.catalog.find(x=>x.id===i.kind);check(def,'UNKNOWN_FURNITURE');
  if(i.slot!==null){check(slots.includes(i.slot)&&slotZone(i.slot)===def!.zone,'INVALID_OFFICE_SLOT');check(!occupied.has(i.slot),'SLOT_OCCUPIED');occupied.add(i.slot);}
  const old=o!.items.find(x=>x.id===i.id);
  if(old){if(old.kind!==i.kind){check(def!.upgradeFrom===old.kind,'INVALID_FURNITURE_UPGRADE');cost+=def!.price-d!.catalog.find(x=>x.id===old.kind)!.price;}
   if(Object.values(o!.reservations).some(r=>r.item===old.id))check(old.slot===i.slot&&old.kind===i.kind,'FURNITURE_IN_USE');
  }else{check(i.id.startsWith('new:'),'UNKNOWN_FURNITURE');cost+=def!.price;}
 }
 check(cost>=0&&s.cash>=cost,'INSUFFICIENT_CASH');check(JSON.stringify(cmd.items)!==JSON.stringify(o!.items),'OFFICE_NO_CHANGES');
 o!.items=cmd.items.map(i=>({...i,id:i.id.startsWith('new:')?`f${o!.nextId++}`:i.id}));o!.revision++;
 if(cost){s.cash-=cost;s.ledger.push({slot:s.absoluteSlot,reason:'office:purchase',amount:-cost});}
 reserveOffice(s,c);
}
export function officeView(s:State,c:Content){const o=s.campaign?.office,d=c.campaign?.office;if(!o||!d)return null;return {...cloneOffice(o),catalog:d.catalog.map(x=>({...x})),slots:officeSlots(s.campaign!.chapter),capacity:{work:o.items.filter(i=>i.slot&&slotZone(i.slot)==='work').length,meeting:o.items.filter(i=>i.slot&&slotZone(i.slot)==='meeting').reduce((n,i)=>n+d.catalog.find(x=>x.id===i.kind)!.seats,0)},requirements:s.actors.map(a=>({actor:a.id,computerSupport:d.computerVersions.includes(a.version)})),computerTemplates:[...d.computerTemplates]};}
export function officeCost(items:Furniture[],original:Furniture[],catalog:FurnitureDefinition[]){return items.reduce((sum,i)=>sum+(catalog.find(d=>d.id===i.kind)?.price??0)-(catalog.find(d=>d.id===original.find(o=>o.id===i.id)?.kind)?.price??0),0);}
export function officeCommand(items:Furniture[],revision:number):OfficeCommand{return {type:'office',items:items.map(i=>({...i})),revision};}
