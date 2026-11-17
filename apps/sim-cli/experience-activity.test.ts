import {commandCoverage,campaignCoverage} from './src/experience-command-coverage.js';
import { test, expect } from 'vitest';
import { loadFullContent } from 'oot-content';
import { createInitialState, dispatchCommand, activityEffects, getViewModel } from 'oot-core';
import type { Command, State } from 'oot-core';
import { hash } from 'oot-persistence';
import { GameSession } from 'oot-platform';
import { experienceFixture, experienceFixtureNames } from 'oot-platform/fixtures';
import { readFileSync } from 'node:fs';

const c = loadFullContent();
function compare(state:State,command:Command) {
    const before=hash(state), preview=activityEffects(state,c,command), result=dispatchCommand(state,command,c);
    expect(hash(state)).toBe(before);
    expect(preview.error).toBe(result.error);
    expect(preview.cash).toBeCloseTo(state.cash-result.state.cash,8);
    expect(preview.research).toBe((state.campaign?.research??0)-(result.state.campaign?.research??0));
    // Reverse coverage: a missing actor in the projection must also fail the gate.
    const beforeLocations=new Map(getViewModel(state,c).actors.map(a=>[a.id,a.location]));
    const afterLocations=new Map(getViewModel(result.state,c).actors.map(a=>[a.id,a.location]));
    const changed=state.actors.filter(before=>{
        const after=result.state.actors.find(a=>a.id===before.id)!;
        return after.busyUntil!==before.busyUntil || afterLocations.get(after.id)!==beforeLocations.get(before.id) ||
            (!state.overtime.includes(before.id)&&result.state.overtime.includes(before.id)) ||
            before.energy!==after.energy || before.mood!==after.mood ||
            state.campaign?.relations[before.id]?.affinity!==result.state.campaign?.relations[before.id]?.affinity;
    });
    expect(preview.actors.map(a=>a.actorId).sort()).toEqual(changed.map(a=>a.id).sort());
    for(const actor of preview.actors) {
        const after=result.state.actors.find(a=>a.id===actor.actorId)!;
        if(actor.occupiesUntil!==null)expect(actor.occupiesUntil).toBe(after.busyUntil);
        if(actor.joinsOvertime)expect(result.state.overtime).toContain(actor.actorId);
        const beforeActor=state.actors.find(a=>a.id===actor.actorId)!;
        expect(after.energy-beforeActor.energy).toBe(actor.energy);
        expect(after.mood-beforeActor.mood).toBe(actor.mood);
        expect((result.state.campaign?.relations[actor.actorId]?.affinity??0)-(state.campaign?.relations[actor.actorId]?.affinity??0)).toBe(actor.affinity);
        const relocated=beforeLocations.get(beforeActor.id)!==afterLocations.get(after.id);
        expect(actor.relocatesTo).toBe(relocated?afterLocations.get(after.id):null);
        expect(actor.skipsNightRecovery).toBe(state.absoluteSlot%4===3&&(after.busyUntil!==beforeActor.busyUntil||actor.joinsOvertime));
    }
    return preview;
}
test('nine development scenarios are detached, explicit and typed',()=>{
    for(const name of experienceFixtureNames) {
        const f=experienceFixture(name,c);expect(f.developmentOnly).toBe(true);expect(f.snapshot.contentVersion).toBe(c.version);
        f.snapshot.state.cash=0;expect(experienceFixture(name,c).snapshot.state.cash).not.toBe(0);
    }
});
test.each(['chat','gift','meal','study','recall','train','align','story','tea','duo','chat-reply','expedition'] as const)('activity %s compares occupancy and cost without modifying input',action=>{
    const s=createInitialState(c,1);s.absoluteSlot=3;s.cash=10000;s.campaign!.research=20;s.campaign!.scene=action==='tea'?'workshop':'library';
    const actor=s.actors.find(a=>a.id==='qwen')!;
    let id=actor.id, target:string|undefined;
    if(action==='train')target='write';
    if(action==='tea')id='all';
    if(action==='story') {const story=c.campaign!.stories!.find(x=>x.character==='qwen')!;id=story.id;target='0';s.campaign!.relations.qwen!.affinity=100;}
    if(action==='duo')id='bluewhale-qwen';
    if(action==='chat-reply'){id=c.campaign!.living!.threads[0]!.id;target='0';}
    if(action==='expedition'){s.campaign!.chapter=3;target='slime';}
    const p=compare(s,{type:'campaign',action,id,...(target?{target}:{})});
    if(['chat','gift','meal','study','train','align','story','tea','expedition'].includes(action))expect(p.error).toBeNull();
    if(action==='train')expect(p.actors[0]?.occupiedSlots).toBe(8);
    if(action==='align')expect(p.actors[0]?.occupiedSlots).toBe(4);
});
test('overtime, clarification and invalid guards compare to execution',()=>{
    const overtime=experienceFixture('overtime',c);expect(compare(overtime.snapshot.state,overtime.command!).actors[0]?.joinsOvertime).toBe(true);
    const s=createInitialState(c,1);const job=s.jobs.find(j=>j.hidden>0)!;
    expect(compare(s,{type:'clarify',job:job.id,character:'qwen'}).error).toBeNull();
    expect(compare(s,{type:'clarify',job:'missing',character:'qwen'}).error).toBe('UNKNOWN_JOB');
});
test('session preview preserves save bytes; random settlement commands are explicitly unsupported',async()=>{
    const session=new GameSession(c,1),before=await session.exportSave();
    expect(session.previewActivity({type:'advance'}).error).toBe('ACTIVITY_NOT_SUPPORTED');
    session.previewActivity({type:'campaign',action:'chat',id:'qwen'});
    expect(await session.exportSave()).toBe(before);
});
test.each(['build-2','guide-1'])('original %s trajectory retains every state while deterministic activity previews run',name=>{
    const trace=JSON.parse(readFileSync(new URL(`./fixtures/commission-natural-${name}.json`,import.meta.url),'utf8')) as {seed:number;commands:Command[];stateHash:string};
    let state=createInitialState(c,trace.seed);
    for(const command of trace.commands) {
        if(!['advance','choose','deliver','restart'].includes(command.type))compare(state,command);
        const result=dispatchCommand(state,command,c);expect(result.error).toBeNull();state=result.state;
    }
    expect(hash(state)).toBe(trace.stateHash);
});

test('successful duo and incident response keep exact zero-slot versus one-slot semantics',()=>{
    const s=createInitialState(c,1);s.absoluteSlot=3;s.campaign!.scene='workshop';
    for(const id of ['bluewhale','qwen']) {const r=s.campaign!.relations[id]!;r.location='workshop';r.locationUntil=4;}
    for(const j of s.jobs.slice(0,2)){j.status='delivered';j.team=[{character:'qwen',role:'worker',mode:'cloud'},{character:'bluewhale',role:'worker',mode:'cloud'}];}
    const duo=compare(s,{type:'campaign',action:'duo',id:'bluewhale-qwen'});
    expect(duo.error).toBeNull();expect(duo.actors).toHaveLength(2);expect(duo.actors.every(a=>a.occupiedSlots===0)).toBe(true);
    const incidentState=createInitialState(c,1),job=incidentState.jobs[0]!;
    incidentState.campaign!.incidents.push({job:job.id,at:0,deadline:2,resolved:false});
    const response=compare(incidentState,{type:'respond',job:job.id,character:'qwen'});
    expect(response.error).toBeNull();expect(response.actors[0]?.occupiedSlots).toBe(1);
});

test('all current command variants are reviewed; recall and free chat have successful reverse-delta coverage',()=>{
    expect(Object.keys(commandCoverage)).toHaveLength(17);expect(Object.keys(campaignCoverage)).toHaveLength(26);
    const s=createInitialState(c,1);s.absoluteSlot=3;s.campaign!.scene='library';
    expect(compare(s,{type:'campaign',action:'recall',id:'qwen'})).toMatchObject({error:null,actors:[{actorId:'qwen',occupiedSlots:0,relocatesTo:'workshop'}]});
    const thread=c.campaign!.living!.threads.find(t=>t.trigger.kind==='day'&&Number(t.trigger.value)===1)!;
    expect(compare(s,{type:'campaign',action:'chat-reply',id:thread.id,target:'0'}).error).toBeNull();
});
