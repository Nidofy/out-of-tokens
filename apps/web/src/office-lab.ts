import {GameSession,manualSlots,saveSlots} from 'oot-platform';
import type {SaveMeta,SaveSlot,SaveStorage,StoredSave,WritableSlot,WritePolicy} from 'oot-platform';
import type {Content,Command} from 'oot-core';
// Isolated DEV / visual-review fixtures: same application and commands, no player files.
export const labCases=['initial','twelve','twelve-basic','twelve-standard','twelve-meeting','standard','working','computer','low-energy','crisis','delivery','review','waiting','meeting'] as const;
export function labSession(source:Content,scenario:string){
 const c=structuredClone(source);c.version='office-lab-1';c.events=[];c.balance!.eventChance=0;
 if(scenario.startsWith('twelve')||scenario==='computer'){c.campaign!.initial=[...new Set(c.versions.map(v=>v.character))];c.campaign!.recruits=[];}
 if(scenario==='computer')c.versions.sort((a,b)=>Number(b.id==='gpt.4o')-Number(a.id==='gpt.4o'));
 if(['delivery','review','waiting'].includes(scenario)){const t=c.commissions.find(t=>t.id==='menu')!;t.workload=1;t.qualityLines=[1,2,3];if(scenario==='waiting')t.phases=2;}
 if(scenario==='low-energy'){c.balance!.dailyQuota=100000;c.balance!.startingCash=100000;const t=c.commissions.find(t=>t.id==='menu')!;t.workload=10000;t.workSlots=56;}
 if(scenario==='crisis')c.balance!.startingCash=100;
 const session=new GameSession(c,1),send=(cmd:Command)=>{const r=session.send(cmd);if(r.error)throw Error(`LAB:${r.error}`);};
 if(scenario==='standard'||scenario==='twelve-standard'){const o=session.view.office!;send({type:'office',revision:o.revision,items:o.items.map(i=>i.id==='f1'?{...i,kind:'standard'}:i)});}
 if(['twelve-basic','twelve-standard','twelve-meeting','working','standard','computer','low-energy','delivery','review','waiting','meeting'].includes(scenario)){
  const id=session.view.jobs.find(j=>j.template==='menu')!.id;send({type:'accept',job:id});send({type:'assign',job:id,team:[{character:'qwen',role:'worker',mode:'cloud'},{character:scenario==='computer'?'gpt':'llama',role:'reviewer',mode:'cloud'}]});
  if(scenario==='twelve-basic'||scenario==='twelve-standard')send({type:'assign',job:id,team:[{character:'glm',role:'worker',mode:'cloud'},{character:'llama',role:'reviewer',mode:'cloud'},{character:'mistral',role:'planner',mode:'cloud'}]});
  if(scenario==='meeting'||scenario==='twelve-meeting')send({type:'assign',job:id,team:[{character:'qwen',role:'worker',mode:'cloud'},{character:'llama',role:'reviewer',mode:'cloud'},{character:'bluewhale',role:'planner',mode:'cloud'}]});
  if(['delivery','review','waiting'].includes(scenario)){send({type:'advance'});if(scenario!=='review')send({type:'deliver',job:id});}
  if(scenario==='low-energy')for(let n=0;n<20&&session.view.actors.find(a=>a.id==='qwen')!.energy>=20;n++){if(session.view.absoluteSlot%4>=2)send({type:'overtime',character:'qwen'});send({type:'advance'});}
 }
 if(scenario==='crisis'){send({type:'loan',amount:1000});send({type:'buy',amount:400});}
 return session;
}
export class LabSaves implements SaveStorage {
 onExternalChange:(()=>void)|null=null;
 private rows=new Map<SaveSlot,StoredSave>();
 async list(){return saveSlots.map(id=>{const r=this.rows.get(id);return r?{...r,...(r.meta?{meta:{...r.meta}}:{})}:null;});}
 async read(id:SaveSlot){
  if(!saveSlots.includes(id))throw Error('INVALID_SLOT');
  const r=this.rows.get(id);
  return r?{...r,...(r.meta?{meta:{...r.meta}}:{})}:null;
 }
 async write(id:WritableSlot,text:string,expected:number,policy:WritePolicy='boundary',meta?:SaveMeta){
  if(policy!=='checkpoint'&&policy!=='boundary')throw Error('INVALID_WRITE_POLICY');
  if(meta&&(typeof meta.lineageId!=='string'||!meta.lineageId.trim()))throw Error('INVALID_LINEAGE');
  if(![...manualSlots,'auto'].includes(id)||!Number.isSafeInteger(expected)||expected<0)throw Error('INVALID_SLOT');
  if(typeof text!=='string'||text.length===0||text.length>8000000)throw Error('INVALID_SAVE_SIZE');
  const prev=this.rows.get(id);
  if((prev?.revision??0)!==expected)throw Error('SAVE_CONFLICT');
  const revision=expected+1;
  if(id==='auto'&&prev&&policy==='boundary'){
   for(let i=4;i>=1;i--){
    const b=this.rows.get(`backup-${i}` as SaveSlot);
    if(b)this.rows.set(`backup-${i+1}` as SaveSlot,{...b,id:`backup-${i+1}` as SaveSlot,...(b.meta?{meta:{...b.meta}}:{})});
   }
   this.rows.set('backup-1',{...prev,id:'backup-1',...(prev.meta?{meta:{...prev.meta}}:{})});
  }
  const capturedMeta=meta?{lineageId:meta.lineageId}:undefined;
  this.rows.set(id,{id,text,revision,savedAt:0,...(capturedMeta?{meta:capturedMeta}:{})});
  return revision;
 }
 async close(){this.rows.clear();}
}
