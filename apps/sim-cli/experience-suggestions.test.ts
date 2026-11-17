import {test,expect} from 'vitest';
import {loadFullContent} from 'oot-content';
import {GameSession,EXPERIENCE_CONTRACT} from 'oot-platform';
import {suggestAssignmentsFromSnapshot} from 'oot-platform/worker';
import {createInitialState,dispatchCommand,explainCapacity,explainDuos,explainMoney,liquidCash,previewPeriod} from 'oot-core';
import type {Member,Command} from 'oot-core';
import {hash} from 'oot-persistence';
const c=loadFullContent();
test('suggestions are bounded, deduplicated, stable and byte-equivalent through Worker entry',async()=>{
 const session=new GameSession(c,1),draft={draftKey:'opening-1',team:[]};
 const before=await session.exportSave(),snapshot=session.workerSnapshot();
 const start=performance.now(),result=session.suggestAssignments('0-0',draft),elapsed=performance.now()-start;
 console.log('candidate main-thread diagnostic ms',elapsed,'evaluated',result.evaluated);
 expect(result).toEqual(suggestAssignmentsFromSnapshot(c,snapshot,'0-0',draft));
 expect(result).toEqual(session.suggestAssignments('0-0',draft));
 expect(result.evaluated).toBeLessThanOrEqual(256);expect(result.suggestions.length).toBeGreaterThan(0);expect(result.suggestions.length).toBeLessThanOrEqual(3);
 expect(new Set(result.suggestions.map(x=>x.id)).size).toBe(result.suggestions.length);
 expect(await session.exportSave()).toBe(before);
 const accepted=dispatchCommand(snapshot.state,{type:'accept',job:'0-0'},c);expect(accepted.error).toBeNull();
 for(const suggestion of result.suggestions)expect(dispatchCommand(accepted.state,{type:'assign',job:'0-0',team:suggestion.team},c).error).toBeNull();
 expect(JSON.stringify(result)).not.toContain('requirements');
 const wrong={...snapshot,contentVersion:'different'};expect(()=>suggestAssignmentsFromSnapshot(c,wrong,'0-0',draft)).toThrow('STALE_WORKER_CONTENT');
});
test('large controlled roster is truncated and invalid/blocked jobs return zero plans',()=>{
 const session=new GameSession(c,1),snapshot=session.workerSnapshot(),s=snapshot.state;
 for(const v of c.versions)if(!s.actors.some(a=>a.id===v.character)){
  s.actors.push({id:v.character,version:v.id,energy:100,mood:70,load:0,busyUntil:0});
  s.campaign!.relations[v.character]={...s.campaign!.relations.qwen!,bonuses:{},stories:[],training:null};
 }
 const before=hash(s),result=suggestAssignmentsFromSnapshot(c,snapshot,'0-0',{team:[],draftKey:'wide'});
 expect(result.evaluated).toBe(256);expect(result.truncated).toBe(true);expect(hash(s)).toBe(before);
 expect(suggestAssignmentsFromSnapshot(c,snapshot,'missing',{team:[],draftKey:'none'}).suggestions).toEqual([]);
 s.bankrupt=true;expect(suggestAssignmentsFromSnapshot(c,snapshot,'0-0',{team:[],draftKey:'blocked'}).none?.reason).toBe('BANKRUPT');
});
test('finance separates advances, liabilities and last-ten-row cash flows',()=>{
 let s=createInitialState(c,1);s=dispatchCommand(s,{type:'accept',job:'0-0'},c).state;
 for(let i=0;i<12;i++)s.ledger.push({slot:0,reason:'controlled',amount:i%2?10:-3});s.loan=100;s.electricity=12.5;
 const result=explainMoney(s,c);expect(result.netSolvency).toBe(liquidCash(s));expect(result.cash-result.loan-result.unfinishedAdvances).toBeCloseTo(result.netSolvency,8);
 expect(result.recentLedgerSummary).toEqual({count:10,inflow:50,outflow:15,net:35});expect(result.bills.find(f=>f.reason==='accrued-electricity')?.amount).toBe(12.5);
});
test('capacity uses effective storage and actual current-slot workstation participation',()=>{
 let s=createInitialState(c,1);s.campaign!.hardware.storage=2;
 for(const cmd of [{type:'accept',job:'0-0'},{type:'assign',job:'0-0',team:[{character:'qwen',role:'worker',mode:'cloud'}]}] as Command[]){const r=dispatchCommand(s,cmd,c);expect(r.error).toBeNull();s=r.state;}
 const actor=s.actors.find(a=>a.id==='qwen')!,base=c.versions.find(v=>v.id===actor.version)!.context;
 actor.load=base+1;expect(explainCapacity(s,c,'qwen').overloaded).toBe(false);actor.load=base+3;expect(explainCapacity(s,c,'qwen').overloaded).toBe(true);
 expect(explainCapacity(s,c,'qwen').context).toBe(base+2);
 s.absoluteSlot=3;expect(previewPeriod(s,c).working).toEqual([]);expect(explainCapacity(s,c,'qwen').activeEfficiency).toBe(0);
});
test('duo explanations preserve lock/mode/category gates and clarification is not job benefit',()=>{
 const s=createInitialState(c,1);const team:Member[]=[{character:'mistral',role:'worker',mode:'cloud'},{character:'llama',role:'worker',mode:'cloud'}];
 expect(explainDuos(s,c,'0-0',team).find(d=>d.duoId==='mistral-llama')?.state).toBe('locked');
 s.campaign!.duos=['mistral-llama','qwen-kimi'];
 expect(explainDuos(s,c,'0-0',team).find(d=>d.duoId==='mistral-llama')?.state).toBe('inactive');
 expect(explainDuos(s,c,'0-0',team.map(m=>({...m,mode:'local'}))).find(d=>d.duoId==='mistral-llama')?.state).toBe('active');
 expect(explainDuos(s,c,'0-0',[{character:'qwen',role:'worker',mode:'cloud'},{character:'kimi',role:'planner',mode:'cloud'}]).find(d=>d.duoId==='qwen-kimi')).toMatchObject({state:'inactive',reason:'duo-clarification-only'});
});
test('session explanation endpoints bind current revision and draft identity',()=>{
 const s=new GameSession(c,1);expect(s.explainFinance().contract).toBe(EXPERIENCE_CONTRACT);s.send({type:'accept',job:'0-0'});
 expect(s.explainActorCapacity('qwen').revision).toBe(1);expect(s.explainTeamDuos('0-0',{team:[],draftKey:'changed'}).draftKey).toBe('changed');
});

import {getViewModel} from 'oot-core';
import {evaluateTeamDuos} from '../web/src/living-adapter.js';
import {actorEffectiveContext,isActorOverloaded} from '../web/src/scene-layout.js';
import {ledgerWindowSummary} from '../web/src/ui2-logic.js';
test('application-layer migration matrix compares every duo across modes, categories, periods and locks',()=>{
 const full={...c,campaign:{...c.campaign!,initial:[...new Set(c.versions.map(v=>v.character))]}};
 const templates=[...new Map(c.commissions.map(t=>[`${t.category}:${t.delivery}`,t])).values()];
 let compared=0;
 for(const duo of c.campaign!.living!.duos)for(const mode of ['cloud','local'] as const)for(const slot of [0,1,2,3])for(const unlocked of [false,true])for(const template of templates){
  const s=createInitialState(full,1);s.absoluteSlot=slot;s.jobs[0]!.template=template.id;s.campaign!.duos=unlocked?[duo.id]:[];
  const team:Member[]=duo.actors.map(character=>({character,role:'worker',mode}));
  const view=getViewModel(s,full),job=view.jobs[0]!;
  const old=evaluateTeamDuos(view,job,team).find(x=>x.duo.id===duo.id)!;
  expect(explainDuos(s,full,job.id,team).find(x=>x.duoId===duo.id)?.state).toBe(old.state);compared++;
 }
 expect(compared).toBeGreaterThan(500);
},20000);
test('application-layer capacity and ledger migrations agree for known old-correct cases',()=>{
 const s=createInitialState(c,1);s.campaign!.hardware.storage=3;
 for(const actor of s.actors)for(const load of [0,10,30]){actor.load=load;const view=getViewModel(s,c),fresh=explainCapacity(s,c,actor.id);expect(fresh.context).toBe(actorEffectiveContext(view,actor.id));expect(fresh.overloaded).toBe(isActorOverloaded(view,actor.id));}
 s.ledger=[{slot:0,amount:100,reason:'loan'},{slot:0,amount:-10,reason:'buy'}];expect(explainMoney(s,c).recentLedgerSummary).toEqual(ledgerWindowSummary(getViewModel(s,c).ledger));
});
