import {test,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {loadFullContent} from 'oot-content';
import {GameSession} from 'oot-platform';
import type {Command} from 'oot-core';
const c=loadFullContent();
test('learning is explicit per node, ignores rejected commands, and view is detached',()=>{
 const s=new GameSession(c,1);expect(s.getExperienceView().learning.every(n=>!n.observed)).toBe(true);
 expect(s.send({type:'deliver',job:'0-0'}).error).not.toBeNull();expect(s.getExperienceView().learning.find(n=>n.node==='deliver')!.observed).toBe(false);expect(s.getExperienceView().receipts).toEqual([]);
 s.send({type:'accept',job:'0-0'});const view=s.getExperienceView();expect(view.learning.find(n=>n.node==='accept')!.observed).toBe(true);expect(view.learning.find(n=>n.node==='assign')!.observed).toBe(false);
 view.learning[0]!.observed=false;expect(s.getExperienceView().learning[0]!.observed).toBe(true);
});
test.each(['build-2','guide-1'])('factual receipts and seven learning facts reconstruct on %s import',async name=>{
 const trace=JSON.parse(readFileSync(new URL(`./fixtures/commission-natural-${name}.json`,import.meta.url),'utf8')) as {seed:number;commands:Command[]};
 const s=new GameSession(c,trace.seed);const contributions=new Map<string,Set<string>>(),outcomes=new Set<string>();let deliveries=0,resets=0,reworkResets=0;
 for(const cmd of trace.commands){
  const before=s.workerSnapshot().state;
  const assessed=cmd.type==='deliver'||cmd.type==='rework'?s.view.jobs.find(j=>j.id===cmd.job):undefined;
  const result=s.send(cmd);expect(result.error).toBeNull();const after=s.workerSnapshot().state;
  for(const resource of after.resources.slice(before.resources.length)){const j=before.jobs.find(j=>j.id===resource.job)!;const key=`${j.id}:${j.phase}`,set=contributions.get(key)??new Set<string>();set.add(resource.character);contributions.set(key,set);}
  if(cmd.type==='deliver'||cmd.type==='rework'){
   const j=before.jobs.find(j=>j.id===cmd.job)!,key=`${j.id}:${j.phase}`,receipt=s.getExperienceView().receipts.at(-1)!;
   expect(receipt.participants).toEqual([...(contributions.get(key)??[])].sort());expect(receipt.phase).toBe(j.phase);
   const {quality,passQuality,qualityLines,qualityBreakdown}=assessed!;
   expect(receipt.assessment).toEqual({quality,passQuality,qualityLines,qualityBreakdown});
   outcomes.add(receipt.facts[0]!.reason);
   const next=after.jobs.find(job=>job.id===j.id)!;
   if(cmd.type==='deliver'&&next.phase>j.phase&&next.status!=='delivered'){
    resets++;expect(next.quality).toBe(0);expect(receipt.assessment!.quality).toBeGreaterThan(0);
   }
   if(cmd.type==='rework'&&qualityBreakdown.defectPenalty>0){
    reworkResets++;expect(s.view.jobs.find(job=>job.id===j.id)!.qualityBreakdown.defectPenalty).toBe(0);
    expect(receipt.assessment!.qualityBreakdown.defectPenalty).toBeGreaterThan(0);
   }
   if(cmd.type==='deliver'){deliveries++;contributions.delete(key);}
  }
 }
 const original=s.getExperienceView();expect(deliveries).toBeGreaterThan(0);expect(resets).toBeGreaterThan(0);expect(original.learning.every(n=>n.observed)).toBe(true);
 expect(reworkResets).toBeGreaterThan(0);expect([...outcomes].sort()).toEqual(['delivery-failed','delivery-passed','delivery-rework']);
 const exported=await s.exportSave(),restored=new GameSession(c,99);await restored.importSave(exported,s.lineageId);
 expect(restored.getExperienceView().learning).toEqual(original.learning);expect(restored.getExperienceView().receipts).toEqual(original.receipts);expect(restored.getExperienceView().goal).toEqual(original.goal);
 expect(await restored.exportSave()).toBe(exported);
 const last=original.receipts.at(-1)!;last.participants.push('invented-actor');expect(s.getExperienceView().receipts.at(-1)!.participants).not.toContain('invented-actor');
 const preserved=structuredClone(last.assessment);last.assessment!.quality=-1;last.assessment!.qualityLines.fill(-1);last.assessment!.qualityBreakdown.hiddenPenalty=-1;
 expect(s.getExperienceView().receipts.at(-1)!.assessment).toEqual(preserved);expect(await s.exportSave()).toBe(exported);
},15000);
