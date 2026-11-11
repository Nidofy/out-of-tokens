import type {Content,Command} from 'oot-core';
import {labSession} from '../../apps/web/src/office-lab.js';
import {b2Session,samples} from '../vf4b2/fixtures.js';
export function b3Session(source:Content,scenario:string){
 if(!scenario.startsWith('b3-'))return b2Session(source,scenario);
 const [,kind,pop,rotationText,state,slotText]=scenario.split('-'),rotation=Number(rotationText),slot=Number(slotText),c=structuredClone(source),roster=Array.from({length:4},(_,i)=>samples[(rotation+i)%5]!);
 c.version='vf4b3-lab';c.events=[];c.balance!.eventChance=0;c.balance!.startingCash=100000;c.balance!.dailyQuota=100000;
 c.campaign!.initial=pop==='12'?[...roster,...[...new Set(c.versions.map(v=>v.character))].filter(id=>!roster.includes(id))]:roster;c.campaign!.recruits=[];
 c.versions.sort((a,b)=>{const index=(id:string)=>{const i=roster.indexOf(id);return i<0?99:i;};return index(a.character)-index(b.character);});
 const session=labSession(c,'initial'),send=(cmd:Command)=>{const r=session.send(cmd);if(r.error)throw Error('B3 fixture '+r.error);};
 if(kind==='sofa'||kind==='server'){
  const zone=kind==='sofa'?'lounge':'server',o=session.view.office!,items=o.items.map(i=>i.slot===zone+'-'+slot?{...i,slot:null}:i);
  items.push({id:'new:0',kind,slot:zone+'-'+slot});
  if(state==='edit'){for(const i of items)if(i.slot===zone+'-2')i.slot=null;items.push({id:'new:1',kind,slot:zone+'-2'});}
  send({type:'office',revision:o.revision,items});
  if(state==='working'){const job=session.view.jobs.find(j=>j.template==='menu')!;send({type:'accept',job:job.id});send({type:'assign',job:job.id,team:[{character:roster[0]!,role:'worker',mode:'cloud'},{character:roster[1]!,role:'reviewer',mode:'cloud'}]});}
 }else{
  // Isolated rendered-view fixture; production schedules and saves are unchanged.
  const get=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(session),'view')!.get!;
  Object.defineProperty(session,'view',{get(){const v=get.call(session),scene=kind==='dining'?'canteen':'library';return {...v,campaign:{...v.campaign,scene},actors:v.actors.map((a:object)=>({...a,location:scene}))};}});
 }
 return session;
}
