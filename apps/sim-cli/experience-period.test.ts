import {test,expect} from 'vitest';
import {readFileSync,writeFileSync} from 'node:fs';
import {loadFullContent} from 'oot-content';
import {createInitialState,dispatchCommand,previewPeriod} from 'oot-core';
import type {State,Content,Command,PeriodFacts} from 'oot-core';
import {hash} from 'oot-persistence';
import {GameSession} from 'oot-platform';
const content=loadFullContent();
function compare(s:State,c:Content,p:PeriodFacts) {
 const r=dispatchCommand(s,{type:'advance'},c);
 if(p.blocked){expect(r.error).toBe({'pending-choice':'PENDING_CHOICE',bankrupt:'BANKRUPT',ending:'ENDING_FINISHED',arranging:'OFFICE_ARRANGING'}[p.blocked]);return 'blocked';}
 expect(r.error).toBeNull();
 if(r.events.some(e=>e.type==='PendingChoice')) {
  expect([...p.working,...p.resting,...p.bills].every(f=>f.certainty==='conditional')).toBe(true);
  expect(r.state.absoluteSlot).toBe(s.absoluteSlot);return 'interrupted';
 }
 expect(r.state.absoluteSlot).toBe(p.nextSlot);
 const resources=r.state.resources.slice(s.resources.length);
 expect(p.working.filter(f=>f.reason==='contract-work').map(f=>`${f.jobId}:${f.actorId}`)).toEqual(resources.map(f=>`${f.job}:${f.character}`));
 const actualStops=r.events.filter(e=>e.type==='OutOfTokens').map(e=>e.message.split(' ')[0]);
 expect(p.stops.map(f=>f.actorId)).toEqual(actualStops);
 const worked=new Set([...resources.map(f=>f.character),...s.overtime]);
 const resting=s.actors.filter(a=>!worked.has(a.id)&&a.busyUntil<=s.absoluteSlot);
 expect(p.resting.map(f=>f.actorId)).toEqual(resting.map(a=>a.id));
 for(const fact of p.resting){const before=s.actors.find(a=>a.id===fact.actorId)!,after=r.state.actors.find(a=>a.id===fact.actorId)!;expect(after.energy-before.energy).toBeCloseTo(fact.amount!,8);if(s.absoluteSlot%4===3)expect(after.load).toBe(0);}
 expect(p.recoverySkipped.map(f=>f.actorId)).toEqual(s.absoluteSlot%4===3?s.actors.filter(a=>a.busyUntil>s.absoluteSlot).map(a=>a.id):[]);
 const bills=r.state.ledger.slice(s.ledger.length).filter(l=>['weekly','loan-interest','inherited-debt'].includes(l.reason));
 expect(p.bills.reduce((sum,f)=>sum+f.amount!,0)).toBeCloseTo(-bills.reduce((sum,l)=>sum+l.amount,0),8);
 for(const f of p.deadlines){const j=s.jobs.find(j=>j.id===f.jobId)!;expect(f.reason==='due-this-slot'?j.deadline===s.absoluteSlot:Math.floor(j.deadline/4)===Math.floor(s.absoluteSlot/4)+1).toBe(true);}
 return 'settled';
}
test.each(['build-2','guide-1'])('preview every state on unchanged %s trajectory',name=>{
 const trace=JSON.parse(readFileSync(new URL(`./fixtures/commission-natural-${name}.json`,import.meta.url),'utf8')) as {seed:number;commands:Command[];stateHash:string};
 let s=createInitialState(content,trace.seed);const counts={states:0,certain:0,conditional:0,blocked:0,interrupted:0,settled:0,controlled:0};const hashes:string[]=[];
 const noEvent:Content={...content,events:[],balance:{...content.balance!,eventChance:0}};
 for(const cmd of trace.commands){
  const before=hash(s),p=previewPeriod(s,content);counts.states++;
  const poison={...s,rng:new Proxy(s.rng,{get(){throw Error('PREVIEW_READ_RNG');}})};expect(previewPeriod(poison,content)).toEqual(p);
  expect(hash(s)).toBe(before);hashes.push(before);
  for(const f of [...p.working,...p.resting,...p.stops,...p.bills])counts[f.certainty]++;
  if(cmd.type==='advance') {
   counts[compare(s,content,p)]++;
   if(!p.blocked){const controlled=previewPeriod(s,noEvent);expect([...controlled.working,...controlled.resting,...controlled.bills].every(f=>f.certainty==='certain')).toBe(true);compare(s,noEvent,controlled);counts.controlled++;}
  }
  const r=dispatchCommand(s,cmd,content);expect(r.error).toBeNull();s=r.state;
 }
 expect(hash(s)).toBe(trace.stateHash);
 expect(counts.certain).toBeGreaterThan(0);expect(counts.conditional).toBeGreaterThan(0);
 console.log(name,JSON.stringify(counts));
 if(process.env.EXPERIENCE_EVIDENCE)writeFileSync(`${process.env.EXPERIENCE_EVIDENCE}/preview-${name}.json`,JSON.stringify({counts,hashes,finalHash:hash(s)},null,2));
});
test('night recovery, busy sleep loss, zero-quota stops and pending-choice guards',()=>{
 const s=createInitialState(content,1);s.absoluteSlot=3;s.actors[0]!.energy=40;s.actors[0]!.load=5;s.actors[1]!.busyUntil=4;
 compare(s,content,previewPeriod(s,content));expect(previewPeriod(s,content).resting[0]?.amount).toBe(60);
 s.pending={card:content.events[0]!.id,slot:3};compare(s,content,previewPeriod(s,content));
 s.pending=null;s.bankrupt=true;compare(s,content,previewPeriod(s,content));
});
test('session exposes preview without altering save or revision',async()=>{
 const session=new GameSession(content,1),before=await session.exportSave(),revision=session.workerSnapshot().revision;
 expect(session.previewNextPeriod().revision).toBe(revision);expect(await session.exportSave()).toBe(before);
});

test('controlled mixed roles, depleted resources, low energy, overtime and bill boundaries',()=>{
 const c:Content={...content,events:[],balance:{...content.balance!,eventChance:0}};
 const teams:Extract<Command,{type:'assign'}>['team'][]=[
  [{character:'qwen',role:'worker',mode:'cloud'}],
  [{character:'qwen',role:'worker',mode:'local'},{character:'bluewhale',role:'planner',mode:'cloud'}],
  [{character:'qwen',role:'worker',mode:'cloud'},{character:'bluewhale',role:'reviewer',mode:'local'},{character:'llama',role:'tool',mode:'cloud'}],
 ];
 let cases=0,stops=0;
 for(const team of teams){
  let base=createInitialState(c,1);base.campaign!.software.push('mcp','prompt','multiagent');
  for(const cmd of [{type:'accept',job:'0-0'},{type:'assign',job:'0-0',team}] as Command[]){const r=dispatchCommand(base,cmd,c);expect(r.error).toBeNull();base=r.state;}
  for(const slot of [0,1,2,3,27,55])for(const quota of [0,1,300])for(const local of [0,1,120])for(const energy of [9,40,100]){
   const s=structuredClone(base);s.absoluteSlot=slot;s.quota=quota;s.purchased=0;s.localCapacity=local;
   for(const a of s.actors)a.energy=energy;
   if(slot%4>=2)s.overtime=team.map(m=>m.character);
   const p=previewPeriod(s,c);compare(s,c,p);cases++;stops+=p.stops.length;
  }
 }
 expect(cases).toBe(486);expect(stops).toBeGreaterThan(0);
});
