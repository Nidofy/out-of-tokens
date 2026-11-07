import {loadFullContent} from '../packages/oot-content/dist/index.js';
import {createInitialState,dispatchCommand,getViewModel,liquidCash} from '../packages/oot-core/dist/index.js';
import {save,restore,hash} from '../packages/oot-persistence/dist/index.js';
import {readFileSync,writeFileSync} from 'node:fs';
const c=loadFullContent(),results=[];
// Preserve the unsuccessful first policy as a reproducible control, including full traces.
const legacy=process.argv.includes('--legacy-policy'),recovery=process.argv.includes('--recover-bankruptcy'),prefix=recovery?'a6-recovery':legacy?'a6-legacy':'a6';
if(legacy&&recovery)throw Error('Choose one policy mode');
// Already-seen training seeds only. No state/content edits, loans or hidden RNG access.
for(const seed of recovery?[2]:[1,2,3,4,5]){
 let s=createInitialState(c,seed),commands=[],daily=[],errors=[],reworks=0,reloaded=false,chapterAt=null;
 const send=cmd=>{const r=dispatchCommand(s,cmd,c);if(r.error){errors.push({slot:s.absoluteSlot,cmd,error:r.error});return false;}s=r.state;commands.push(cmd);return true;};
 if(recovery){const prior=restore(c,readFileSync(`harness/a6-legacy-seed-${seed}-replay.json`,'utf8'));s=prior.state;commands=prior.commands;if(!s.bankrupt)throw Error('Expected natural bankruptcy');if(!send({type:'restart'}))throw Error('Restart failed');}
 for(let guard=0;guard<5000&&s.absoluteSlot<112&&!s.bankrupt;guard++){
  const before=s.absoluteSlot;
  if(s.pending){const card=c.events.find(e=>e.id===s.pending.card);const choices=card.choices.map((x,i)=>({x,i})).filter(({x})=>x.cost===0||x.cost<=s.cash);choices.sort((a,b)=>{
    const score=x=>x.multiplier*10-x.cost/100+(x.effects??[]).reduce((n,e)=>n+(e.kind==='quality'?e.value*.5:e.kind==='defects'?-e.value*6:e.kind==='mood'?e.value*.3:0),0);return score(b.x)-score(a.x);
   });send({type:'choose',index:choices[0].i});continue;}
  let view=getViewModel(s,c);
  for(const j of view.jobs.filter(j=>j.status==='review')){if(j.settlement.canRework){if(send({type:'rework',job:j.id}))reworks++;}else send({type:'deliver',job:j.id});}
  if(s.campaign.chapterZero==='passed'&&s.campaign.chapter===0){send({type:'campaign',action:'chapter',id:'next'});chapterAt=s.absoluteSlot;}
  if(!reloaded&&s.absoluteSlot>=28){const text=save(c,seed,commands,s);s=restore(c,text).state;reloaded=true;}
  view=getViewModel(s,c);
  if(s.absoluteSlot%4>=2){
   for(const a of view.actors){const r=s.campaign.relations[a.id];if(a.busyUntil>s.absoluteSlot)continue;
    const action=r.hunger>=35||a.energy<70?'meal':r.stress>20||a.mood<65?'chat':null;
    if(action&&s.cash>=30){send({type:'campaign',action:'visit',id:a.location});send({type:'campaign',action,id:a.id});}
   }
  }else{
   // Accept only readable work whose primary skill meets the acceptance line.
   for(const a of getViewModel(s,c).actors.filter(a=>!a.busy&&a.energy>=35)){
    const available=getViewModel(s,c).jobs.filter(j=>j.status==='posted'&&j.hidden===0&&(legacy||s.absoluteSlot>=56||j.delivery==='oneshot')&&j.clarifyingUntil<=s.absoluteSlot&&(liquidCash(s)>=0||j.work*j.phases<=40));
    const ranked=available.map(j=>{const match=Object.entries(j.weights).reduce((n,[k,w])=>n+w*a.skills[k],0),v=c.versions.find(v=>v.id===a.version);return {j,match,score:j.reward/Math.max(1,j.work/(match*v.speed))};}).filter(x=>x.match*10>=x.j.passQuality+(legacy?5:2)&&x.j.work<=x.match*c.versions.find(v=>v.id===a.version).speed*(legacy?x.j.workSlots*.8:x.j.workSlots+1)).sort((a,b)=>b.score-a.score);
    const picked=ranked[0];if(picked){const running=getViewModel(s,c).jobs.filter(j=>j.status==='working').reduce((n,j)=>n+j.resourceEstimate.local,0);const mode=running+10*picked.match/10*c.versions.find(v=>v.id===a.version).speed*a.price<=s.localCapacity?'local':'cloud';
     if(send({type:'accept',job:picked.j.id}))send({type:'assign',job:picked.j.id,team:[{character:a.id,role:'worker',mode}]});
    }else{
     const j=getViewModel(s,c).jobs.find(j=>j.status==='posted'&&j.hidden>0&&j.clarifyingUntil<=s.absoluteSlot);if(j)send({type:'clarify',job:j.id,character:a.id});
    }
   }
   const demand=getViewModel(s,c).jobs.filter(j=>j.status==='working').reduce((n,j)=>n+j.resourceEstimate.cloud,0);const missing=Math.ceil(Math.max(0,demand-s.quota-s.purchased));if(missing&&s.cash>=missing*.5)send({type:'buy',amount:missing});
  }
  if(s.bankrupt)break;
  send({type:'advance'});
  if(s.absoluteSlot!==before&&s.absoluteSlot%4===0)daily.push({slot:s.absoluteSlot,cash:s.cash,liquid:liquidCash(s),delivered:s.jobs.filter(j=>j.status==='delivered').length,chapter:s.campaign.chapter});
 }
 const text=save(c,seed,commands,s),restored=restore(c,text),same=hash(restored.state)===hash(s);
 const result={seed,chapterAt,slots:s.absoluteSlot,bankrupt:s.bankrupt,cash:s.cash,liquid:liquidCash(s),delivered:s.jobs.filter(j=>j.status==='delivered').length,breached:s.jobs.filter(j=>j.status==='breached').length,reworks,reloaded,replayMatches:same,runs:s.runs,commandCount:commands.length,stateHash:hash(s),errors,daily};results.push(result);
 writeFileSync(`harness/${prefix}-seed-${seed}-replay.json`,text);console.log(JSON.stringify({...result,daily:undefined,errors:errors.length}));
}
writeFileSync(`harness/${prefix}-results.json`,JSON.stringify({kind:'training-reachability-not-balance-approval',policy:recovery?'restart-then-short-contracts':legacy?'legacy-control':'short-contracts-before-debt',engine:results.length&&createInitialState(c,1).engineVersion,content:c.version,contentHash:hash(c),results},null,2)+'\n');
if(results.some(r=>r.chapterAt===null||r.bankrupt||r.slots!==112||!r.replayMatches||!r.reloaded||r.errors.length))process.exitCode=1;
