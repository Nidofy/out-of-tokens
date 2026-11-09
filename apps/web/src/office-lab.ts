import {GameSession,saveSlots} from 'oot-platform';
import type {SaveSlot,WritableSlot,StoredSave} from 'oot-platform';
import type {Content,Command} from 'oot-core';
// Isolated DEV / visual-review fixtures: same application and commands, no player files.
export const labCases=['initial','twelve','standard','working','computer','low-energy','crisis','delivery','review','waiting','meeting'] as const;
export function labSession(source:Content,scenario:string){
 const c=structuredClone(source);c.version='office-lab-1';c.events=[];c.balance!.eventChance=0;
 if(scenario==='twelve'||scenario==='computer'){c.campaign!.initial=[...new Set(c.versions.map(v=>v.character))];c.campaign!.recruits=[];}
 if(scenario==='computer')c.versions.sort((a,b)=>Number(b.id==='gpt.4o')-Number(a.id==='gpt.4o'));
 if(['delivery','review','waiting'].includes(scenario)){const t=c.commissions.find(t=>t.id==='menu')!;t.workload=1;t.qualityLines=[1,2,3];if(scenario==='waiting')t.phases=2;}
 if(scenario==='low-energy'){c.balance!.dailyQuota=100000;c.balance!.startingCash=100000;const t=c.commissions.find(t=>t.id==='menu')!;t.workload=10000;t.workSlots=56;}
 if(scenario==='crisis')c.balance!.startingCash=100;
 const session=new GameSession(c,1),send=(cmd:Command)=>{const r=session.send(cmd);if(r.error)throw Error(`LAB:${r.error}`);};
 if(scenario==='standard'){const o=session.view.office!;send({type:'office',revision:o.revision,items:o.items.map(i=>i.id==='f1'?{...i,kind:'standard'}:i)});}
 if(['working','standard','computer','low-energy','delivery','review','waiting','meeting'].includes(scenario)){
  const id=session.view.jobs.find(j=>j.template==='menu')!.id;send({type:'accept',job:id});send({type:'assign',job:id,team:[{character:'qwen',role:'worker',mode:'cloud'},{character:scenario==='computer'?'gpt':'llama',role:'reviewer',mode:'cloud'}]});
  if(scenario==='meeting')send({type:'assign',job:id,team:[{character:'qwen',role:'worker',mode:'cloud'},{character:'llama',role:'reviewer',mode:'cloud'},{character:'bluewhale',role:'planner',mode:'cloud'}]});
  if(['delivery','review','waiting'].includes(scenario)){send({type:'advance'});if(scenario!=='review')send({type:'deliver',job:id});}
  if(scenario==='low-energy')for(let n=0;n<20&&session.view.actors.find(a=>a.id==='qwen')!.energy>=20;n++){if(session.view.absoluteSlot%4>=2)send({type:'overtime',character:'qwen'});send({type:'advance'});}
 }
 if(scenario==='crisis'){send({type:'loan',amount:1000});send({type:'buy',amount:400});}
 return session;
}
export class LabSaves {
 onExternalChange:(()=>void)|null=null;
 private rows=new Map<SaveSlot,StoredSave>();
 async list(){return saveSlots.map(id=>this.rows.get(id)??null);}
 async read(id:SaveSlot){return this.rows.get(id)??null;}
 async write(id:WritableSlot,text:string,expected:number){const prev=this.rows.get(id);if((prev?.revision??0)!==expected)throw Error('SAVE_CONFLICT');const revision=expected+1;this.rows.set(id,{id,text,revision,savedAt:0});return revision;}
 async close(){this.rows.clear();}
}
