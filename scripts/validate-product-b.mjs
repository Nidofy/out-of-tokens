import {loadFullContent} from '../packages/oot-content/dist/index.js';
import {createInitialState,dispatchCommand,getViewModel,liquidCash,forecastAssignment,chapterGoal} from '../packages/oot-core/dist/index.js';
import {save,restore,hash} from '../packages/oot-persistence/dist/index.js';
import {writeFileSync} from 'node:fs';
const c=loadFullContent(),results=[],tag=process.argv[2]??'v1';
if(!/^v\d+$/.test(tag))throw Error('Use a version tag, e.g. v1');
// Already consumed training seeds, only public rules and present-state observations.
for(const route of ['build','guide'])for(const seed of [1,2,3,4,5]){
 let s=createInitialState(c,seed),commands=[],daily=[],errors=[],reworks=0,reloads=0,chapterOne=null,chapterTwo=null;
 const send=cmd=>{const r=dispatchCommand(s,cmd,c);if(r.error){errors.push({slot:s.absoluteSlot,cmd,error:r.error});return false;}s=r.state;commands.push(cmd);return true;};
 const life=(action,id,target)=>send({type:'campaign',action,id,...(target?{target}:{})});
 let lastSavedJob='';
 for(let guard=0;guard<6000&&s.absoluteSlot<280&&!s.bankrupt&&s.campaign.chapter<2;guard++){
  if(s.pending){const choices=c.events.find(e=>e.id===s.pending.card).choices.map((x,i)=>({x,i})).filter(({x})=>x.cost===0||x.cost<=s.cash);const score=x=>x.multiplier*10-x.cost/100+(x.effects??[]).reduce((n,e)=>n+(e.kind==='quality'?e.value*.5:e.kind==='defects'?-e.value*6:e.kind==='mood'?e.value*.3:0),0);choices.sort((a,b)=>score(b.x)-score(a.x));send({type:'choose',index:choices[0].i});continue;}
  for(const j of getViewModel(s,c).jobs.filter(j=>j.status==='review')){if(j.settlement.canRework){if(send({type:'rework',job:j.id}))reworks++;}else send({type:'deliver',job:j.id});}
  if(s.campaign.chapter===0&&chapterGoal(s,c).ready){life('chapter','next');chapterOne=s.absoluteSlot;}
  if(s.campaign.chapter===1){
   // Chapter recruits use real costs; the guide route pairs knowledge work with cloud review.
   for(const hire of route==='guide'?['kimi','claude']:['kimi']){const r=c.campaign.recruits.find(r=>r.character===hire);if(!s.actors.some(a=>a.id===hire)&&s.reputation>=r.reputation&&liquidCash(s)>=r.cost+400)life('recruit',hire);}
   let project=getViewModel(s,c).projects[0];
   if(!project.route)life('project-start','incubator',route);
   project=getViewModel(s,c).projects[0];
   if(project.canAdvance||project.canRetry&&s.cash>=project.retryCost)life('project-next','incubator');
   if(chapterGoal(s,c).ready){life('chapter','next');chapterTwo=s.absoluteSlot;break;}
   project=getViewModel(s,c).projects[0];
   if(project.job!==lastSavedJob){const text=save(c,seed,commands,s);s=restore(c,text).state;reloads++;lastSavedJob=project.job;}
  }
  let view=getViewModel(s,c);
  if(s.absoluteSlot%4>=2){
   for(const a of view.actors){const r=s.campaign.relations[a.id];if(a.busyUntil>s.absoluteSlot)continue;const action=r.hunger>=35||a.energy<70?'meal':r.stress>20||a.mood<65?'chat':null;if(action&&s.cash>=30){life('visit',a.location);life(action,a.id);}}
  }else{
   const project=view.projects[0],job=project?.job?s.jobs.find(j=>j.id===project.job):null;
   if(project&&!project.completed&&job){
    const free=view.actors.filter(a=>!a.busy&&a.energy>=40);
    if(job.status==='posted'&&job.hidden>0&&job.clarifyingUntil<=s.absoluteSlot&&free.length){const a=[...free].sort((a,b)=>b.skills.recall-a.skills.recall)[0];send({type:'clarify',job:job.id,character:a.id});}
    if(job.status==='posted'&&job.hidden===0&&job.clarifyingUntil<=s.absoluteSlot&&free.length>=2)send({type:'accept',job:job.id});
    const current=s.jobs.find(j=>j.id===project.job);
    if(current.status==='accepted'){
     const available=getViewModel(s,c).actors.filter(a=>!a.busy&&a.energy>=40),candidates=[];
     for(const worker of available)for(const reviewer of available)if(worker.id!==reviewer.id){
      const team=[{character:worker.id,role:'worker',mode:worker.modes.includes('local')?'local':'cloud'},{character:reviewer.id,role:'reviewer',mode:reviewer.modes.includes('local')?'local':'cloud'}];
      const trial=dispatchCommand(s,{type:'assign',job:current.id,team},c);if(trial.error)continue;
      const f=forecastAssignment(trial.state,c,trial.state.jobs.find(j=>j.id===current.id));if(f.quality&&!f.risks.late&&!f.risks.capacity)candidates.push({team,score:f.quality[0]*100-f.cloud*.5-f.electricity+(route==='guide'&&reviewer.id==='claude'?500:0)});
     }
     candidates.sort((a,b)=>b.score-a.score);if(candidates.length)send({type:'assign',job:current.id,team:candidates[0].team});
    }
   }
   // Keep other people earning on ordinary one-shot jobs while the project holds its team.
   view=getViewModel(s,c);
   for(const a of view.actors.filter(a=>!a.busy&&a.energy>=35)){
    // Reserve two teammates when the current project needs clarification or assignment.
    const waiting=project&&!project.completed&&s.jobs.some(j=>j.id===project.job&&['posted','accepted'].includes(j.status));if(waiting)break;
    const available=getViewModel(s,c).jobs.filter(j=>j.status==='posted'&&j.hidden===0&&j.delivery==='oneshot'&&!j.id.startsWith('project:')&&j.clarifyingUntil<=s.absoluteSlot&&(liquidCash(s)>=0||j.work*j.phases<=40));
    const ranked=available.map(j=>{const match=Object.entries(j.weights).reduce((n,[k,w])=>n+w*a.skills[k],0),v=c.versions.find(v=>v.id===a.version);return {j,match,score:j.reward/Math.max(1,j.work/(match*v.speed))};}).filter(x=>x.match*10>=x.j.passQuality+2&&x.j.work<=x.match*c.versions.find(v=>v.id===a.version).speed*(x.j.workSlots+1)).sort((a,b)=>b.score-a.score);
    if(ranked[0]){const p=ranked[0],v=c.versions.find(v=>v.id===a.version),running=getViewModel(s,c).jobs.filter(j=>j.status==='working').reduce((n,j)=>n+j.resourceEstimate.local,0),mode=a.modes.includes('local')&&running+p.match*v.speed*a.price<=s.localCapacity?'local':'cloud';if(send({type:'accept',job:p.j.id}))send({type:'assign',job:p.j.id,team:[{character:a.id,role:'worker',mode}]});}
    else{const j=getViewModel(s,c).jobs.find(j=>j.status==='posted'&&j.hidden>0&&!j.id.startsWith('project:')&&j.clarifyingUntil<=s.absoluteSlot);if(j)send({type:'clarify',job:j.id,character:a.id});}
   }
   const demand=getViewModel(s,c).jobs.filter(j=>j.status==='working').reduce((n,j)=>n+j.resourceEstimate.cloud,0),missing=Math.ceil(Math.max(0,demand-s.quota-s.purchased));if(missing&&s.cash>=missing*.5)send({type:'buy',amount:missing});
  }
  if(s.bankrupt)break;send({type:'advance'});
  if(s.absoluteSlot%4===0)daily.push({slot:s.absoluteSlot,cash:s.cash,liquid:liquidCash(s),chapter:s.campaign.chapter});
 }
 const text=save(c,seed,commands,s),same=hash(restore(c,text).state)===hash(s),project=getViewModel(s,c).projects[0];
 const result={route,seed,chapterOne,chapterTwo,slots:s.absoluteSlot,bankrupt:s.bankrupt,cash:s.cash,liquid:liquidCash(s),reworks,reloads,replayMatches:same,commandCount:commands.length,stateHash:hash(s),project,errors,daily};results.push(result);
 writeFileSync(`harness/product-b-${tag}-${route}-${seed}-replay.json`,text);console.log(JSON.stringify({...result,daily:undefined,project:project?{step:project.step,completed:project.completed,attempts:project.attempts,accounting:project.accounting}:null,errors:errors.length}));
}
writeFileSync(`harness/product-b-${tag}-results.json`,JSON.stringify({kind:'training-paths-not-balance-approval',engine:createInitialState(c,1).engineVersion,content:c.version,contentHash:hash(c),results},null,2)+'\n');
if(results.some(r=>r.chapterTwo===null||r.bankrupt||!r.replayMatches||r.errors.length||r.reloads<3))process.exitCode=1;
