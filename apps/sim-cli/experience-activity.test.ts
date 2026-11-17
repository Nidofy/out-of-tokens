import { test, expect } from 'vitest';
import { loadFullContent } from 'oot-content';
import { createInitialState, dispatchCommand, activityEffects } from 'oot-core';
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
    for(const actor of preview.actors) {
        const after=result.state.actors.find(a=>a.id===actor.actorId)!;
        if(actor.occupiesUntil!==null)expect(actor.occupiesUntil).toBe(after.busyUntil);
        if(actor.joinsOvertime)expect(result.state.overtime).toContain(actor.actorId);
        expect(after.energy-state.actors.find(a=>a.id===actor.actorId)!.energy).toBe(actor.energy);
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
