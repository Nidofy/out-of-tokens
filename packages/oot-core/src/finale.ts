import type {Command, Content, State} from './model.js';
import {liquidCash,round} from './economy.js';
export type Ending = 'independent' | 'acquired' | 'open-source' | 'warm-shop' | 'paperclip';
export interface FinaleState {
 ending:Ending|null;endless:boolean;endlessAt:number;
 expeditions:{actor:string;world:string;until:number;claimed:boolean}[];
 souvenirs:string[];bids:{job:string;rival:string;won:boolean}[];
 challengeWeek:number;challengeWins:number[];
}
const check=(ok:unknown,error:string)=>{if(!ok)throw Error(error);};
export const worlds=[
 {id:'slime',zh:'史莱姆集市',en:'Slime market',slots:8,cost:120,research:3},
 {id:'castle',zh:'魔王城档案馆',en:'Castle archive',slots:12,cost:240,research:7},
 {id:'paper',zh:'纸片宇宙',en:'Paper universe',slots:16,cost:480,research:12}
] as const;
export function finaleGoal(s:State):boolean{
 const p=s.campaign!,f=p.finale;if(!f)return false;
 if(p.chapter===3)return s.reputation>=20&&liquidCash(s)>=4000&&p.hardware.network>=2&&f.bids.some(b=>b.won);
 return p.chapter===4&&f.souvenirs.length>=2&&p.research>=30&&liquidCash(s)>=6000;
}
export function endingReady(s:State,c:Content,id:string):boolean{
 const p=s.campaign!,f=p.finale;if(!f||f.ending||!p.completed.includes(4))return false;
 const fullRoster=s.actors.length===new Set(c.versions.map(v=>v.character)).size;
 switch(id){
 case 'independent':return liquidCash(s)>=12000&&s.reputation>=30;
 case 'acquired':return true;
 case 'open-source':return c.versions.filter(v=>v.modes.includes('local')).every(v=>!!p.relations[v.character]&&p.relations[v.character]!.affinity>=85);
 case 'warm-shop':return fullRoster&&s.actors.every(a=>p.relations[a.id]!.affinity>=65);
 case 'paperclip':return f.souvenirs.includes('paper')&&s.absoluteSlot>=112&&s.ledger.filter(l=>l.reason.startsWith('delivery:')&&l.slot>=s.absoluteSlot-112).length>=28&&s.actors.every(a=>p.relations[a.id]!.affinity<25);
 default:return false;
 }
}
export function tickFinale(s:State){
 const p=s.campaign,f=p?.finale;if(!p||!f)return;
 for(const trip of f.expeditions){if(trip.claimed||trip.until>s.absoluteSlot)continue;trip.claimed=true;const world=worlds.find(w=>w.id===trip.world)!;p.research+=world.research;if(!f.souvenirs.includes(world.id))f.souvenirs.push(world.id);}
 f.challengeWeek=Math.floor(s.absoluteSlot/28);
}
export function challengeAllows(s:State,c:Content,version:string,mode:string):boolean{
 if(!s.campaign?.finale?.endless)return true;
 const challenge=Math.floor(s.absoluteSlot/28)%3,v=c.versions.find(v=>v.id===version)!;
 return challenge===0?v.price<=8:challenge===1?mode==='local':v.context<=6;
}
export function applyFinale(s:State,c:Content,cmd:Extract<Command,{type:'campaign'}>):boolean{
 if(!['expedition','ending','endless','bid','challenge'].includes(cmd.action))return false;
 const p=s.campaign!,f=p.finale;check(f&&(c.campaign?.maxChapter??0)>=4,'FINALE_LOCKED');
 if(cmd.action==='ending'){check(endingReady(s,c,cmd.id),'ENDING_LOCKED');f!.ending=cmd.id as Ending;return true;}
 if(cmd.action==='endless'){check(f!.ending&&!f!.endless,'ENDLESS_LOCKED');f!.endless=true;f!.endlessAt=s.absoluteSlot;return true;}
 check(!f!.ending||f!.endless,'ENDING_FINISHED');
 if(cmd.action==='expedition'){
  const w=worlds.find(w=>w.id===cmd.target),a=s.actors.find(a=>a.id===cmd.id);check(p.chapter>=3&&w&&a,'EXPEDITION_LOCKED');
  check(a!.busyUntil<=s.absoluteSlot&&!s.overtime.includes(a!.id)&&!s.jobs.some(j=>['accepted','working','review','waiting'].includes(j.status)&&j.team.some(m=>m.character===a!.id)),'ACTOR_BUSY');
  check(s.cash>=w!.cost&&a!.energy>=30,'INSUFFICIENT_RESOURCES');
  s.cash=round(s.cash-w!.cost);s.ledger.push({slot:s.absoluteSlot,reason:'expedition:'+w!.id,amount:-w!.cost});a!.energy-=20;a!.busyUntil=s.absoluteSlot+w!.slots;
  f!.expeditions.push({actor:a!.id,world:w!.id,until:a!.busyUntil,claimed:false});return true;
 }
 if(cmd.action==='bid'){
  const j=s.jobs.find(j=>j.id===cmd.id),t=j&&c.commissions.find(t=>t.id===j.template);check(p.chapter>=2&&j?.status==='posted'&&t&&!f!.bids.some(b=>b.job===cmd.id),'BID_LOCKED');
  check(['budget','boutique','wrapper'].includes(cmd.target??''),'UNKNOWN_RIVAL');check(s.cash>=60,'INSUFFICIENT_RESOURCES');
  const won=cmd.target==='budget'?j!.hidden===0&&s.reputation>=10:cmd.target==='boutique'?s.reputation>=20&&p.research>=10:t!.client==='novice'&&j!.hidden===0;
  s.cash=round(s.cash-60);s.ledger.push({slot:s.absoluteSlot,reason:'bid:'+cmd.id,amount:-60});f!.bids.push({job:cmd.id,rival:cmd.target!,won});
  if(won)j!.rewardFactor=cmd.target==='budget'?.85:cmd.target==='wrapper'?1.5:1.15;else j!.status='rejected';return true;
 }
 const week=Math.floor(s.absoluteSlot/28);check(f!.endless&&!f!.challengeWins.includes(week),'CHALLENGE_LOCKED');
 const jobs=s.jobs.filter(j=>j.status==='delivered'&&j.posted>=Math.max(week*28,f!.endlessAt)&&j.challengeWeek===week);
 check(jobs.filter(j=>j.quality>=75).length>=3,'CHALLENGE_LOCKED');
 f!.challengeWins.push(week);p.research+=5;return true;
}
