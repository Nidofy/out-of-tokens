import type {Content,Command} from 'oot-core';
import {labSession} from '../../apps/web/src/office-lab.js';
import chapterSave from '../vf4a2/project-chapter1-save.json';
/** Review-server-only deterministic fixtures. No player saves or production import. */
export function a4Session(source:Content,scenario:string){
 if(!scenario.startsWith('a4-'))return labSession(source,scenario);
 const c=structuredClone(source),kind=scenario.slice(3);
 if(kind==='rework'){const t=c.commissions.find(t=>t.id==='menu')!;t.workload=1;t.qualityLines=[99,99,100];}
 const session=labSession(c,kind==='project'?'delivery':'initial');
 const send=(cmd:Command)=>{const r=session.send(cmd);if(r.error)throw Error(`A4 fixture ${kind}: ${r.error}`);};
 if(kind==='no-posted'){for(const job of session.view.jobs.filter(j=>j.status==='posted'))send({type:'accept',job:job.id});}
 if(kind==='project'){for(const cmd of chapterSave.commands.slice(4))send(cmd as Command);}
 if(kind==='rework'){const id=session.view.jobs.find(j=>j.template==='menu')!.id;send({type:'accept',job:id});send({type:'assign',job:id,team:[{character:'mistral',role:'worker',mode:'local'}]});send({type:'advance'});}
 if(kind==='breached'){const id=session.view.jobs.find(j=>j.template==='menu')!.id;send({type:'accept',job:id});for(let i=0;i<12;i++)send({type:'advance'});}
 if(kind==='night'){send({type:'advance'});send({type:'advance'});}
 if(kind==='clarified'||kind==='scope'){
  const id=session.view.jobs.find(j=>j.template==='website')!.id;
  for(let round=0;round<8&&session.view.jobs.find(j=>j.id===id)!.hidden;round++){
   for(const a of session.view.actors.filter(a=>!a.busy))if(session.view.jobs.find(j=>j.id===id)!.hidden)session.send({type:'clarify',job:id,character:a.id});
   if(session.view.jobs.find(j=>j.id===id)!.hidden)send({type:'advance'});
  }
  if(session.view.jobs.find(j=>j.id===id)!.hidden)throw Error('Fixture failed to clarify');
  if(kind==='scope')send({type:'advance'});
 }
 return session;
}
