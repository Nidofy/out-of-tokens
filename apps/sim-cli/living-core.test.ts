import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {loadFullContent,loadAlphaContent,loadContent,validateContent} from 'oot-content';
import {createInitialState,dispatchCommand,getViewModel,forecastAssignment,type State,type Content,type Command,type Job} from 'oot-core';
import {hash,save,restore} from 'oot-persistence';

const c=loadFullContent();
const action=(action:string,id:string,target?:string)=>({type:'campaign',action,id,...(target===undefined?{}:{target})});
function apply(s:State,cmd:unknown,content=c){const r=dispatchCommand(s,cmd,content);expect(r.error,JSON.stringify(cmd)).toBeNull();return r.state;}
function rejected(s:State,cmd:unknown,error:string,content=c){const before=hash(s),r=dispatchCommand(s,cmd,content);expect(r.error).toBe(error);expect(r.state).toBe(s);expect(hash(s)).toBe(before);expect(r.events).toEqual([]);}
function setup(){const s=createInitialState(c,31);s.cash=100000;s.quota=100000;s.localCapacity=100000;return s;}
function roster(s:State,ids:string[]){s.campaign!.chapter=4;s.reputation=1000;for(const id of ids)if(!s.actors.some(a=>a.id===id))s=apply(s,action('recruit',id));return s;}
function delivered(s:State,ids:string[],count=2){for(let n=0;n<count;n++)s.jobs.push({...s.jobs[0]!,id:'history-'+n,status:'delivered',team:ids.map(character=>({character,role:'worker',mode:'cloud'}))});return s;}
function job(s:State,ids:string[],mode:'local'|'cloud'='cloud',category?:string){
    const t=c.commissions.find(t=>(!category||t.category===category)&&t.delivery==='oneshot')!;
    const j:Job={...s.jobs[0]!,id:'test-work',template:t.id,status:'accepted',team:[],work:10000,progress:0,weighted:0,reviewCoverage:0,hidden:0,defects:0,deadline:10000};
    s.jobs.push(j);return apply(s,{type:'assign',job:j.id,team:ids.map(character=>({character,role:'worker',mode}))});
}
describe('Living Studio content and legacy compatibility',()=>{
    it('loads the exact complete bilingual library while legacy loaders remain optional',()=>{
        expect(validateContent(c)).toEqual(c);const l=c.campaign!.living!;
        expect([l.gifts.length,l.duos.length,l.threads.length,l.clients.length,Object.keys(l.barks).length]).toEqual([6,12,20,6,12]);
        expect(loadContent().campaign?.living).toBeUndefined();expect(loadAlphaContent().campaign?.living).toBeUndefined();
        for(const key of ['gifted','lastTeaDay','duos','chatLog'])expect(Object.hasOwn(createInitialState(c).campaign!,key)).toBe(false);
    });
    it('rejects unknown references, duplicate ids, invalid triggers and incomplete bark keys',()=>{
        const mutations=((l:NonNullable<NonNullable<Content['campaign']>['living']>)=>[
            ()=>{l.gifts[0]!.lovedBy[0]='missing';},()=>{l.gifts[0]!.id=l.gifts[1]!.id;},
            ()=>{l.duos[0]!.actors.reverse();},()=>{l.threads[0]!.replies[0]!.targetActor='missing';},
            ()=>{l.eventQuotes.missing={default:['例','Example']};},()=>{delete l.barks.bluewhale;},()=>{l.threads[0]!.trigger={kind:'day',value:'tomorrow'};}
        ]);
        for(let i=0;i<7;i++){const bad=JSON.parse(JSON.stringify(c)) as Content;mutations(bad.campaign!.living!)[i]!();expect(()=>validateContent(bad)).toThrow();}
    });
    it('preserves all sixty story ids, unlocks and numeric outcomes from the baseline',()=>{
        const stories=c.campaign!.stories!;expect(stories).toHaveLength(60);
        const numeric=(s:typeof stories[number])=>({id:s.id,character:s.character,affinity:s.affinity,choices:s.choices.map(({affinity,mood,research})=>({affinity,mood,research}))});
        // Canonical numeric projection of 21a20d2; also works in shallow CI checkouts.
        expect(hash(stories.map(numeric))).toBe('5b03265bd804d41f38a289cf0b396d55dfb9ac2da869902c438b6a797b373557');
        expect(JSON.stringify(stories)).not.toMatch(/陪伴：|记录：|Stay together:|Keep a note:/);
        for(const s of stories.filter(s=>s.character==='bluewhale'))expect(s.text+s.choices.map(x=>x.label).join('')).not.toMatch(/白鲸|他/);
        for(const s of stories.filter(s=>/bond-[345]$/.test(s.id))){expect([...s.text].length).toBeGreaterThanOrEqual(80);expect([...s.text].length).toBeLessThanOrEqual(130);}
    });
    it.each(['build-2','guide-1'])('replays original stateHash with living content: %s',name=>{
        const t=JSON.parse(readFileSync(new URL(`./fixtures/commission-natural-${name}.json`,import.meta.url),'utf8'));
        let s=createInitialState(c,t.seed);for(const cmd of t.commands)s=apply(s,cmd);
        expect(hash(s)).toBe(t.stateHash);expect(hash(restore(c,save(c,t.seed,t.commands,s)).state)).toBe(t.stateHash);
    });
    it('keeps the frozen persistence content-hash boundary explicit',()=>{
        const old=JSON.parse(JSON.stringify(c)) as Content;delete old.campaign!.living;
        const before=createInitialState(old,1);expect(hash(before)).toBe(hash(createInitialState(c,1)));
        expect(()=>restore(c,save(old,1,[],before))).toThrow('INCOMPATIBLE_SAVE');
    });
});
describe('Living actions',()=>{
    it('retains the exact generic gift path and RNG, with or without living content',()=>{
        const old=JSON.parse(JSON.stringify(c)) as Content;delete old.campaign!.living;
        const s=setup(),cmd=action('gift','bluewhale');const next=apply(s,cmd);
        expect(next).toEqual(apply(s,cmd,old));expect(next.cash).toBe(s.cash-60);expect(next.rng).toEqual(s.rng);expect(next.campaign!.clarifyRng).toBe(s.campaign!.clarifyRng);
        expect(next.campaign!.gifted).toBeUndefined();expect(apply(s,action('gift','bluewhale','missing'),old)).toEqual(next);
    });
    it.each([['bluewhale',16,10,10],['llama',12,7,5],['mistral',8,4,0]] as const)('applies gift preference for %s without mutating the original', (id,mood,affinity,stress)=>{
        const s=setup(),a=s.actors.find(a=>a.id===id)!;a.mood=40;s.campaign!.relations[id]!.stress=30;const before=hash(s);
        const next=apply(s,action('gift',id,'rice-bento'));
        expect(next.cash).toBe(s.cash-45);expect(next.actors.find(a=>a.id===id)!.mood).toBe(40+mood);
        expect(next.campaign!.relations[id]).toMatchObject({affinity,stress:30-stress});expect(next.campaign!.gifted![id]).toEqual(['rice-bento']);expect(hash(s)).toBe(before);
        next.absoluteSlot=1;expect(apply(next,action('gift',id,'rice-bento')).campaign!.gifted![id]).toEqual(['rice-bento']);
        rejected(s,action('gift',id,'missing'),'UNKNOWN_GIFT');s.cash=0;rejected(s,action('gift',id,'rice-bento'),'INSUFFICIENT_RESOURCES');
    });
    it('enforces tea scene, cash, attendance and daily cooldown; excludes expeditions',()=>{
        let s=setup();for(const a of s.actors){a.energy=50;a.mood=50;s.campaign!.relations[a.id]!.stress=20;}
        s.campaign!.finale!.expeditions.push({actor:'mistral',world:'test',until:20} as NonNullable<NonNullable<State['campaign']>['finale']>['expeditions'][number]);
        const before=s;s=apply(s,action('tea','all'));expect(s.absoluteSlot).toBe(before.absoluteSlot);expect(s.cash).toBe(before.cash-80);
        expect(s.actors.find(a=>a.id==='bluewhale')).toMatchObject({energy:62,mood:58});expect(s.actors.find(a=>a.id==='mistral')).toMatchObject({energy:50,mood:50});
        rejected(s,action('tea','all'),'TEA_COOLDOWN');s.absoluteSlot=4;expect(getViewModel(s,c).living.teaReady).toBe(true);s=apply(s,action('tea','all'));expect(s.campaign!.lastTeaDay).toBe(2);
        s.absoluteSlot=8;s.campaign!.scene='library';rejected(s,action('tea','all'),'WRONG_SCENE');s.campaign!.scene='workshop';s.cash=0;rejected(s,action('tea','all'),'INSUFFICIENT_RESOURCES');
        s.cash=1000;for(const a of s.actors)a.busyUntil=9;rejected(s,action('tea','all'),'ACTOR_BUSY');expect(getViewModel(s,c).living.teaReady).toBe(false);
    });
    it('unlocks a duo only after two deliveries with both partners available',()=>{
        let s=setup();rejected(s,action('duo','bluewhale-qwen'),'DUO_LOCKED');delivered(s,['bluewhale','qwen'],1);rejected(s,action('duo','bluewhale-qwen'),'DUO_LOCKED');
        s.jobs.push({...s.jobs.at(-1)!,id:'second'});const view=getViewModel(s,c).living.duos.find(d=>d.id==='bluewhale-qwen')!;expect(view).toMatchObject({sharedDeliveries:2,canUnlock:true,unlocked:false});
        s.actors[0]!.busyUntil=1;rejected(s,action('duo','bluewhale-qwen'),'ACTOR_BUSY');s.actors[0]!.busyUntil=0;
        s.campaign!.scene='library';rejected(s,action('duo','bluewhale-qwen'),'ACTOR_ELSEWHERE');s.campaign!.software.push('remote');s=apply(s,action('duo','bluewhale-qwen'));
        expect(s.campaign!.research).toBe(2);expect(s.campaign!.relations.bluewhale!.affinity).toBe(3);rejected(s,action('duo','bluewhale-qwen'),'DUO_LOCKED');
    });
    it('replies once for free without slots, RNG or busy time and isolates view snapshots',()=>{
        const s=setup(),view=getViewModel(s,c),thread=view.living.threads[0]!;expect(thread).toBeDefined();
        rejected(s,action('chat-reply',thread.id,'3'),'INVALID_CHOICE');rejected(s,action('chat-reply','missing','0'),'THREAD_LOCKED');
        const n=apply(s,action('chat-reply',thread.id,'0'));expect(n.absoluteSlot).toBe(s.absoluteSlot);expect(n.cash).toBe(s.cash);expect(n.ledger).toEqual(s.ledger);expect(n.rng).toEqual(s.rng);
        expect(n.actors.map(a=>a.busyUntil)).toEqual(s.actors.map(a=>a.busyUntil));expect(n.campaign!.chatLog![thread.id]).toBe(0);rejected(n,action('chat-reply',thread.id,'1'),'THREAD_LOCKED');
        const target=thread.replies[0]!.targetActor;expect(n.campaign!.relations[target]!.affinity).toBe(s.campaign!.relations[target]!.affinity+2);expect(n.actors.find(a=>a.id===target)!.mood).toBe(s.actors.find(a=>a.id===target)!.mood+3);
        const derived=getViewModel(n,c);derived.living.threads[0]!.messages[0]!.zh='mutated';derived.catalog!.living!.gifts[0]!.lovedBy.push('bad');expect(getViewModel(n,c).living.threads[0]!.messages[0]!.zh).not.toBe('mutated');expect(c.campaign!.living!.gifts[0]!.lovedBy).not.toContain('bad');
    });
    it('holds recruit threads until arrival and snapshots nested discovery state independently',()=>{
        const s=setup(),thread=c.campaign!.living!.threads.find(t=>t.trigger.kind==='recruit')!;
        rejected(s,action('chat-reply',thread.id,'0'),'THREAD_LOCKED');
        let n=roster(s,[String(thread.trigger.value)]);expect(getViewModel(n,c).living.threads.some(t=>t.id===thread.id)).toBe(true);
        n=apply(n,action('gift','bluewhale','rice-bento'));const view=getViewModel(n,c);view.living.gifted.bluewhale!.push('bad');view.campaign!.gifted!.bluewhale!.push('also-bad');
        expect(n.campaign!.gifted!.bluewhale).toEqual(['rice-bento']);
        const original=hash(n);n=apply(n,action('chat-reply',thread.id,'0'));expect(n.campaign!.gifted!.bluewhale).toEqual(['rice-bento']);expect(hash(s)).not.toBe(original);
    });
});
describe('Shared duo resolution and forecast',()=>{
    const quiet={...c,balance:{...c.balance!,eventChance:0}};
    it('matches first-slot progress and compute spending after actual assign and advance',()=>{
        let s=delivered(setup(),['bluewhale','qwen']);s=apply(s,action('duo','bluewhale-qwen'));s=job(s,['bluewhale','qwen']);
        const j=s.jobs.at(-1)!,preview=forecastAssignment(s,quiet,j);const old=JSON.parse(JSON.stringify(s)) as State;delete old.campaign!.duos;
        expect(preview.firstSlot.progress).toBeGreaterThan(forecastAssignment(old,quiet,j).firstSlot.progress);
        const n=apply(s,{type:'advance'},quiet);expect(n.jobs.at(-1)!.progress).toBe(preview.firstSlot.progress);
        expect(n.resources.filter(r=>r.job===j.id).reduce((sum,r)=>sum+r.units,0)).toBeCloseTo(preview.firstSlot.cloud+preview.firstSlot.local,2);
    });
    it('limits morning efficiency to the morning and multi efficiency to multi contracts',()=>{
        let s=roster(setup(),['seedance']);s.campaign!.duos=['mistral-seedance'];s=job(s,['mistral','seedance']);const j=s.jobs.at(-1)!;
        for(const slot of [0,1]){s.absoluteSlot=slot;const old=JSON.parse(JSON.stringify(s)) as State;delete old.campaign!.duos;const x=forecastAssignment(s,c,j).firstSlot.progress,y=forecastAssignment(old,c,j).firstSlot.progress;expect(x>y).toBe(slot===0);}
    });
    it('adds local energy savings in both preview and settlement without cloud leakage',()=>{
        let s=roster(setup(),['glm']);s.campaign!.duos=['llama-glm'];s=job(s,['llama','glm'],'local');const j=s.jobs.at(-1)!,view=forecastAssignment(s,quiet,j),n=apply(s,{type:'advance'},quiet);
        for(const m of view.firstSlot.members)expect(s.actors.find(a=>a.id===m.character)!.energy-n.actors.find(a=>a.id===m.character)!.energy).toBe(m.energyCost);
        const old=JSON.parse(JSON.stringify(s)) as State;delete old.campaign!.duos;expect(view.firstSlot.members[0]!.energyCost).toBe(forecastAssignment(old,c,j).firstSlot.members[0]!.energyCost-2);
        j.team.forEach(m=>{m.mode='cloud';});expect(forecastAssignment(s,c,j).firstSlot).toEqual(forecastAssignment(old,c,j).firstSlot);
    });
    it('adds same-scene Qwen/Kimi clarification without consuming RNG',()=>{
        const s=roster(setup(),['kimi']),base=getViewModel(s,c).actors.find(a=>a.id==='qwen')!.clarifyChance;s.campaign!.duos=['qwen-kimi'];const before=hash(s);
        expect(getViewModel(s,c).actors.find(a=>a.id==='qwen')!.clarifyChance).toBeCloseTo(Math.min(1,base+.12));expect(hash(s)).toBe(before);
        s.campaign!.relations.kimi!.location='library';s.campaign!.relations.kimi!.locationUntil=4;expect(getViewModel(s,c).actors.find(a=>a.id==='qwen')!.clarifyChance).toBe(base);
    });
    it.each([
        ['bluewhale-qwen','code','cloud',0,'oneshot',true],
        ['mistral-llama','code','local',0,'oneshot',true],
        ['mistral-llama','code','cloud',0,'oneshot',false],
        ['gpt-gemini','design','cloud',0,'oneshot',true],
        ['gpt-gemini','media','cloud',0,'oneshot',true],
        ['gpt-gemini','code','cloud',0,'oneshot',false],
        ['gpt-claude','code','cloud',0,'oneshot',true],
        ['mistral-seedance','media','cloud',1,'oneshot',false],
        ['gemini-minimax','media','cloud',0,'multi',true],
        ['gemini-minimax','media','cloud',0,'retainer',true],
        ['gemini-minimax','media','cloud',0,'oneshot',false]
    ] as const)('respects efficiency conditions %s/%s/%s/%s/%s',(id,category,mode,slot,delivery,boost)=>{
        const duo=c.campaign!.living!.duos.find(d=>d.id===id)!;let s=roster(setup(),duo.actors);s.campaign!.duos=[id];s=job(s,duo.actors,mode);s.absoluteSlot=slot;
        const j=s.jobs.at(-1)!,spec={...quiet,commissions:quiet.commissions.map(t=>t.id===j.template?{...t,category,delivery}:t)};
        const old=JSON.parse(JSON.stringify(s)) as State;delete old.campaign!.duos;
        const p=forecastAssignment(s,spec,j),q=forecastAssignment(old,spec,j);expect(p.firstSlot.progress>q.firstSlot.progress).toBe(boost);
        expect(apply(s,{type:'advance'},spec).jobs.at(-1)!.progress).toBe(p.firstSlot.progress);
    });
    it.each([['claude-grok','code',true],['kimi-glm','write',true],['kimi-glm','research',true],['kimi-glm','media',false]] as const)('adds bounded phase quality and preview for %s/%s',(id,category,boost)=>{
        const duo=c.campaign!.living!.duos.find(d=>d.id===id)!;let s=roster(setup(),duo.actors);s.campaign!.duos=[id];s=job(s,duo.actors);const j=s.jobs.at(-1)!;
        j.work=1;j.qualityBonus=-30;
        const spec={...quiet,commissions:quiet.commissions.map(t=>t.id===j.template?{...t,category}:t)};
        const old=JSON.parse(JSON.stringify(s)) as State;delete old.campaign!.duos;
        const result=apply(s,{type:'advance'},spec),baseline=apply(old,{type:'advance'},spec);
        expect(result.jobs.at(-1)!.status).toBe('review');expect(result.jobs.at(-1)!.quality-baseline.jobs.at(-1)!.quality).toBeCloseTo(boost?5:0,2);
        const p=forecastAssignment(s,spec,j).quality!,q=forecastAssignment(old,spec,j).quality!;expect(p[0]!-q[0]!).toBe(boost?5:0);
    });
    it('guards only newly generated defects once per slot, keeps the same RNG draws',()=>{
        let guarded=0;
        for(let seed=1;seed<=24;seed++){
            let s=roster(createInitialState(c,seed),['claude']);s.cash=100000;s.quota=100000;s.localCapacity=100000;s.campaign!.duos=['bluewhale-claude'];s=job(s,['bluewhale','claude']);s.jobs.at(-1)!.defects=2;
            for(const a of s.actors){a.energy=20;a.load=100;}
            const spec={...quiet,versions:quiet.versions.map(v=>({...v,stability:0}))},old=JSON.parse(JSON.stringify(s)) as State;delete old.campaign!.duos;
            const n=apply(s,{type:'advance'},spec),b=apply(old,{type:'advance'},spec),added=b.jobs.at(-1)!.defects-2;
            expect(n.jobs.at(-1)!.defects).toBe(2+Math.max(0,added-1));expect(n.rng).toEqual(b.rng);if(added>0)guarded++;
        }
        expect(guarded).toBeGreaterThan(0);
    });
    it('prevents defects before the reviewer can spend repair work on them',()=>{
        let repairedWithoutGuard=0;
        for(let seed=1;seed<=32;seed++){
            let s=roster(createInitialState(c,seed),['claude']);s.cash=100000;s.quota=100000;s.campaign!.duos=['bluewhale-claude'];s=job(s,['bluewhale','claude']);const j=s.jobs.at(-1)!;j.team[1]!.role='reviewer';
            for(const a of s.actors){a.energy=20;a.load=100;}
            const spec={...quiet,versions:quiet.versions.map(v=>({...v,stability:0,skills:{...v.skills,reason:10}}))},old=JSON.parse(JSON.stringify(s)) as State;delete old.campaign!.duos;
            const n=apply(s,{type:'advance'},spec),b=apply(old,{type:'advance'},spec);
            expect(n.jobs.at(-1)!.defects).toBe(0);expect(n.jobs.at(-1)!.work).toBe(j.work);if(b.jobs.at(-1)!.work>j.work)repairedWithoutGuard++;
        }
        expect(repairedWithoutGuard).toBeGreaterThan(0);
    });
    it('preserves lazy fields through save and deterministic replay of new commands',()=>{
        const commands:Command[]=[{type:'campaign',action:'gift',id:'bluewhale',target:'rice-bento'},{type:'campaign',action:'tea',id:'all'}];let s=createInitialState(c,17);for(const cmd of commands)s=apply(s,cmd);
        const n=restore(c,save(c,17,commands,s)).state;expect(hash(n)).toBe(hash(s));expect(n.campaign!.gifted).toEqual({bluewhale:['rice-bento']});
    });
});
