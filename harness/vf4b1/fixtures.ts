import type {Content,Command,Member} from 'oot-core';
import {labSession} from '../../apps/web/src/office-lab.js';
export const samples=['bluewhale','qwen','llama','mistral','glm'];
/** Isolated review-only content; real office/accept/assign commands and renderer. */
export function b1Session(source:Content,scenario:string){
 if(!scenario.startsWith('b1-'))return labSession(source,scenario);
 const [,kind,population,rotationText,rolesText]=scenario.split('-'),rotation=Number(rotationText),roleRotation=Number(rolesText),c=structuredClone(source);
 c.version='vf4b1-lab';c.events=[];c.balance!.eventChance=0;c.balance!.startingCash=100000;c.balance!.dailyQuota=100000;
 const roster=Array.from({length:4},(_,i)=>samples[(i+rotation)%5]!);
 c.campaign!.initial=population==='12'?[...roster,...[...new Set(c.versions.map(v=>v.character))].filter(id=>!roster.includes(id))]:roster;
 c.campaign!.recruits=[];
 // Make the representative menu a computer task for planner as well as worker/tool.
 c.campaign!.office!.computerTemplates.push('menu');
 const mcp=c.campaign!.software.find(s=>s.id==='mcp')!;mcp.cost=0;mcp.research=0;mcp.requires=[];
 const session=labSession(c,'initial'),commands:Command[]=[];
 const send=(command:Command)=>{const result=session.send(command);if(result.error)throw Error('B1 fixture '+result.error);commands.push(command);};
 const office=session.view.office!;
 send({type:'office',revision:office.revision,items:[...office.items.map(i=>i.slot?.startsWith('work')?{...i,kind:kind!}:i),{id:'new:0',kind:kind!,slot:'work-4'}]});
 if(rolesText!=='idle'){
  send({type:'campaign',action:'software',id:'mcp'});
  const job=session.view.jobs.find(j=>j.template==='menu')!;send({type:'accept',job:job.id});
  const roles:Member['role'][]=['worker','planner','tool','worker'];
  send({type:'assign',job:job.id,team:roster.map((character,i)=>({character,role:roles[(i+roleRotation)%4]!,mode:'cloud'}))});
 }
 return session;
}
