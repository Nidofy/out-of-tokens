import type {Content,Command,Member} from 'oot-core';
import {labSession} from '../../apps/web/src/office-lab.js';
export const samples=['bluewhale','qwen','llama','mistral','glm'];
/** B2 uses real commands and only reachable office slots; no production save writes. */
export function b2Session(source:Content,scenario:string){
 if(!scenario.startsWith('b2-'))return labSession(source,scenario);
 const [,kind,pop,rotationText,rolesText,slotText]=scenario.split('-'),rotation=Number(rotationText),slot=Number(slotText),c=structuredClone(source),roster=Array.from({length:4},(_,i)=>samples[(rotation+i)%5]!);
 c.version='vf4b2-lab';c.events=[];c.balance!.eventChance=0;c.balance!.startingCash=100000;c.balance!.dailyQuota=100000;
 c.campaign!.initial=pop==='12'?[...roster,...[...new Set(c.versions.map(v=>v.character))].filter(id=>!roster.includes(id))]:roster;c.campaign!.recruits=[];
 // Exercise both support roles in meeting seats, even for computer-capable versions.
 c.campaign!.office!.computerVersions=[];c.campaign!.office!.computerTemplates=[];
 const session=labSession(c,'initial'),send=(command:Command)=>{const result=session.send(command);if(result.error)throw Error('B2 fixture '+result.error);};
 const o=session.view.office!;const items=o.items.map(i=>i.kind===kind?{...i,slot:(kind==='whiteboard'?'meeting-':'lounge-')+slot}:i);
 if(rolesText==='edit')items.push({id:'new:0',kind:kind!,slot:(kind==='whiteboard'?'meeting-':'lounge-')+(slot===1?2:1)});
 if(JSON.stringify(items)!==JSON.stringify(o.items))send({type:'office',revision:o.revision,items});
 if(kind==='whiteboard'&&/^[01]$/.test(rolesText!)){
  const job=session.view.jobs.find(j=>j.template==='menu')!;send({type:'accept',job:job.id});
  const roles:Member['role'][]=Number(rolesText)===0?['planner','reviewer']:['reviewer','planner'];
  send({type:'assign',job:job.id,team:[{character:roster[0]!,role:roles[0]!,mode:'cloud'},{character:roster[1]!,role:roles[1]!,mode:'cloud'},{character:roster[2]!,role:'worker',mode:'cloud'}]});
 }
 return session;
}
