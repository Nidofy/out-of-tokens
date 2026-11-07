import {test,expect} from 'vitest';
import {loadFullContent,validateContent} from 'oot-content';
import {createInitialState,dispatchCommand} from 'oot-core';
import {hash,save,restore} from 'oot-persistence';
test('synthetic campaign reaches chapters 0–4, expedition, ending and endless via replayable commands',()=>{
 // Controlled engineering fixture, deliberately not a balance or fun measurement.
 const c=loadFullContent();c.events=[];c.balance={...c.balance!,startingCash:100000,debt:1,weekly:1,dailyQuota:10000,eventChance:0};
 for(const v of c.versions){v.skills={code:10,write:10,reason:10,create:10,media:10,recall:10};v.context=100;v.speed=2;}
 c.commissions=c.commissions.filter(t=>t.delivery!=='oneshot').slice(0,6).map((t,i)=>({...t,id:'fixture-'+i,delivery:i%2?'retainer' as const:'multi' as const,phases:3,requirements:[],clarity:100,workload:1,workSlots:10,reward:1000,qualityLines:[1,2,3]}));
 delete c.campaign!.openingJobs;delete c.campaign!.starterJobs;
 validateContent(c);let s=createInitialState(c,1);const commands:unknown[]=[];
 const send=(cmd:unknown)=>{const r=dispatchCommand(s,cmd,c);if(!r.error){s=r.state;commands.push(cmd);}return r.error;};
 const life=(action:string,id:string,target?:string)=>send({type:'campaign',action,id,target});
 life('hardware','network');life('hardware','network');
 for(let guard=0;guard<300&&!s.campaign!.completed.includes(4);guard++){
  for(const j of [...s.jobs])if(j.status==='review')send({type:'deliver',job:j.id});
  life('chapter','next');
  const p=s.campaign!,f=p.finale!;
  if(p.chapter===2){for(const id of ['bluewhale.r1','qwen.qwq'])if(!p.unlocked.includes(id))life('unlock',id);}
  if(p.chapter>=2&&!f.bids.some(b=>b.won)){const j=s.jobs.find(j=>j.status==='posted');if(j)life('bid',j.id,'budget');}
  if(p.chapter>=3){for(const [actor,world] of [['mistral','slime'],['bluewhale','castle']] as const)if(!f.expeditions.some(x=>x.world===world))life('expedition',actor,world);}
  if(s.absoluteSlot%4>=2){life('visit','library');life('study','qwen');}
  const existing=s.jobs.find(j=>['accepted','working','review','waiting'].includes(j.status));
  if(!existing){const desired=p.chapter===1?'multi':'retainer';const j=s.jobs.find(j=>j.status==='posted'&&c.commissions.find(t=>t.id===j.template)!.delivery===desired);if(j){send({type:'accept',job:j.id});send({type:'assign',job:j.id,team:[{character:'llama',role:'worker',mode:'cloud'}]});}}
  expect(send({type:'advance'})).toBeNull();
 }
 expect(s.campaign!.completed).toEqual([0,1,2,3,4]);
 expect(life('ending','acquired')).toBeNull();expect(life('endless','continue')).toBeNull();
 const text=save(c,1,commands,s);expect(hash(restore(c,text).state)).toBe(hash(s));expect(s.campaign!.finale!.souvenirs.sort()).toEqual(['castle','slime']);
});
