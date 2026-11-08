import type { Actor, CampaignState, Command, Content, Relation, Scene, Skill, State, Version } from './model.js';
import {applyFinale,tickFinale} from './finale.js';
import {applyProject} from './projects.js';
import {chapterGoal} from './chapter-goal.js';
import { liquidCash, round } from './economy.js';
const check = (ok: unknown, error: string) => { if (!ok) throw Error(error); };
const cap = (n: number) => Math.max(0, Math.min(100, n));
export const newRelation = (): Relation => ({ xp: 0, affinity: 0, location: null, locationUntil: 0, training: null, bonuses: {}, stories: [], stress: 0, hunger: 0 });
export function initialCampaign(c: Content): CampaignState {
    return { ...(c.campaign?.projects?{projects:{}}:{}), ...((c.campaign?.maxChapter??0)>=4?{finale:{ending:null,endless:false,endlessAt:0,expeditions:[],souvenirs:[],bids:[],challengeWeek:0,challengeWins:[]}}:{}), chapterStarted: 0, clarifyRng: 1, subscription: 0, incidents: [], chapter: 0, chapterZero: 'pending', completed: [], scene: 'workshop', research: 0, software: [], hardware: { office: 0, compute: 0, storage: 0, network: 0 }, unlocked: c.versions.filter((v, i, all) => all.findIndex(x => x.character === v.character) === i).map(v => v.id), relations: Object.fromEntries(c.campaign!.initial.map(id => [id, newRelation()])) };
}
export function cloneCampaign(p: CampaignState): CampaignState {
    return { ...p, ...(p.projects?{projects:Object.fromEntries(Object.entries(p.projects).map(([id,value])=>[id,{...value,history:[...value.history]}]))}:{}), ...(p.finale?{finale:{...p.finale,expeditions:p.finale.expeditions.map(x=>({...x})),souvenirs:[...p.finale.souvenirs],bids:p.finale.bids.map(x=>({...x})),challengeWins:[...p.finale.challengeWins]}}:{}), incidents:p.incidents.map(x=>({...x})), completed: [...p.completed], software: [...p.software], hardware: { ...p.hardware }, unlocked: [...p.unlocked], relations: Object.fromEntries(Object.entries(p.relations).map(([id, r]) => [id, { ...r, stories: [...r.stories], training: r.training ? { ...r.training } : null, bonuses: Object.fromEntries(Object.entries(r.bonuses).map(([v, skills]) => [v, { ...skills }])) }])) };
}
export const owns = (s: State, id: string) => s.campaign?.software.includes(id) ?? false;
export function actorScene(s: State, a: Actor): Scene | 'expedition' {
    if (s.campaign?.finale?.expeditions.some(x=>x.actor===a.id && x.until>s.absoluteSlot)) return 'expedition';
    const r = s.campaign?.relations[a.id];
    if (r?.location && r.locationUntil > s.absoluteSlot) return r.location;
    if (s.absoluteSlot % 4 < 2 || s.overtime.includes(a.id)) return 'workshop';
    return ['qwen', 'claude', 'kimi', 'glm'].includes(a.id) ? 'library' : 'canteen';
}
export function effectiveVersion(s: State, c: Content, a: Actor, mode: 'cloud' | 'local' = 'cloud'): Version {
    const v = c.versions.find(v => v.id === a.version)!;
    const p = s.campaign;
    if (!p) return v;
    const b = p.relations[a.id]?.bonuses[a.version] ?? {};
    return { ...v, skills: Object.fromEntries(Object.entries(v.skills).map(([k, n]) => [k, Math.min(10, (n + (b[k as Skill] ?? 0)) * (k === 'reason' && mode === 'local' && owns(s, 'vllm') ? 1.3 : 1))])) as Version['skills'], context: v.context + p.hardware.storage, stability: Math.min(10, v.stability + (b.alignment ?? 0)) };
}
export function tickCampaign(s: State) {
    tickFinale(s);
    const p = s.campaign;
    if (!p) return;
    for (const r of Object.values(p.relations)) if (r.training && r.training.until <= s.absoluteSlot) {
        const t = r.training, b = r.bonuses[t.version] ??= {};
        b[t.skill] = (b[t.skill] ?? 0) + 1;
        r.training = null;
    }
    if (s.absoluteSlot >= 56 && p.chapterZero !== 'passed') p.chapterZero = s.debtPaid && liquidCash(s) >= 0 && s.jobs.some(j => j.phase > 0) ? 'passed' : 'missed';
}
const actions = ['project-start', 'project-next', 'visit', 'chat', 'gift', 'meal', 'study', 'recall', 'recruit', 'unlock', 'switch', 'train', 'align', 'software', 'hardware', 'chapter', 'story', 'subscribe', 'expedition', 'ending', 'endless', 'bid', 'challenge'];
export function parseCampaign(v: Record<string, unknown>): Extract<Command, { type: 'campaign' }> {
    check(typeof v.action === 'string' && actions.includes(v.action) && typeof v.id === 'string' && (v.target === undefined || typeof v.target === 'string'), 'INVALID_CAMPAIGN_COMMAND');
    return { type: 'campaign', action: v.action as Extract<Command, { type: 'campaign' }>['action'], id: v.id as string, ...(v.target === undefined ? {} : { target: v.target as string }) };
}
export function applyCampaign(s: State, c: Content, cmd: Extract<Command, { type: 'campaign' }>) {
    check(s.campaign && c.campaign, 'NO_CAMPAIGN');
    const p = s.campaign!, spec = c.campaign!;
    if(applyProject(s,c,cmd)||applyFinale(s,c,cmd))return;
    const pay = (cash: number, research = 0) => { check(s.cash >= cash && p.research >= research, 'INSUFFICIENT_RESOURCES'); s.cash = round(s.cash - cash); p.research -= research; s.ledger.push({ slot: s.absoluteSlot, amount: -cash, reason: `campaign:${cmd.action}:${cmd.id}` }); };
    if (cmd.action === 'visit') { check(['workshop', 'canteen', 'library'].includes(cmd.id), 'UNKNOWN_SCENE'); p.scene = cmd.id as Scene; return; }
    if (cmd.action === 'recruit') {
        const recruit = spec.recruits.find(x => x.character === cmd.id);
        check(recruit && p.chapter >= (recruit.minChapter??0) && !s.actors.some(a => a.id === cmd.id) && s.reputation >= recruit.reputation, 'RECRUIT_LOCKED');
        pay(recruit!.cost);
        s.actors.push({ id: cmd.id, version: c.versions.find(v => v.character === cmd.id)!.id, energy: 100, mood: 70, load: 0, busyUntil: 0 });
        p.relations[cmd.id] = newRelation(); return;
    }
    if (cmd.action === 'software') {
        const u = spec.software.find(x => x.id === cmd.id);
        check(u && !p.software.includes(cmd.id) && u.requires.every(id => p.software.includes(id)), 'UPGRADE_LOCKED');
        pay(u!.cost, u!.research); p.software.push(cmd.id); return;
    }
    if (cmd.action === 'hardware') {
        check(Object.hasOwn(p.hardware, cmd.id), 'UNKNOWN_HARDWARE');
        const key = cmd.id as keyof typeof p.hardware, level = p.hardware[key];
        check(level < spec.maxHardware, 'MAX_LEVEL'); pay([600, 1800, 4500, 10000, 24000][level]!); p.hardware[key]++;
        if (key === 'compute') s.localCapacity = [120, 200, 800, 3000, 10000, 24000][p.hardware.compute]!;
        return;
    }
    if (cmd.action === 'chapter') {
        const ready = chapterGoal(s,c).ready;
        check(!p.completed.includes(p.chapter) && ready, 'CHAPTER_LOCKED');
        p.completed.push(p.chapter);
        if(p.chapter < (spec.maxChapter ?? 0)) {p.chapter++;p.chapterStarted=s.absoluteSlot;}
        return;
    }
    if (cmd.action === 'subscribe') {
        const level=Number(cmd.id);check([0,1,2].includes(level) && level !== p.subscription, 'INVALID_SUBSCRIPTION');
        // Pay the positive difference for the remainder of this week, never refund downgrades.
        pay(Math.ceil(Math.max(0, [0,120,420][level]!-[0,120,420][p.subscription]!) * (28-s.absoluteSlot%28)/28));
        p.subscription=level;return;
    }
    if(cmd.action === 'story') {
        const story=spec.stories?.find(t=>t.id===cmd.id);check(story,'UNKNOWN_STORY');
        const r=p.relations[story!.character],a=s.actors.find(a=>a.id===story!.character);
        check(r && a && r.affinity>=story!.affinity && !r.stories.includes(cmd.id) && actorScene(s,a)===p.scene && a.busyUntil<=s.absoluteSlot,'STORY_LOCKED');
        check(cmd.target==='0'||cmd.target==='1','INVALID_CHOICE');const choice=story!.choices[Number(cmd.target)]!;
        r!.affinity=cap(r!.affinity+choice.affinity);a!.mood=cap(a!.mood+choice.mood);p.research+=choice.research;r!.stories.push(cmd.id);a!.busyUntil=s.absoluteSlot+1;return;
    }
    if (cmd.action === 'unlock') {
        const v = c.versions.find(v => v.id === cmd.id);
        check(v && s.actors.some(a => a.id === v.character) && !p.unlocked.includes(cmd.id), 'VERSION_LOCKED');
        pay(600, 10); p.unlocked.push(cmd.id); return;
    }
    const a = s.actors.find(a => a.id === cmd.id); check(a, 'UNKNOWN_ACTOR');
    const r = p.relations[a!.id]!;
    const assigned = s.jobs.some(j => ['accepted', 'working', 'review', 'waiting'].includes(j.status) && j.team.some(m => m.character === a!.id));
    check(a!.busyUntil <= s.absoluteSlot && !s.overtime.includes(a!.id), 'ACTOR_BUSY');
    if (cmd.action === 'switch') {
        check(!assigned, 'ACTOR_BUSY'); const v = c.versions.find(v => v.id === cmd.target && v.character === a!.id);
        check(v && p.unlocked.includes(v.id), 'VERSION_LOCKED'); a!.version = v!.id; a!.load = 0; return;
    }
    if (cmd.action === 'train' || cmd.action === 'align') {
        check(!assigned && c.versions.find(v => v.id === a!.version)!.modes.includes('local'), 'TRAINING_LOCKED');
        const skill = cmd.action === 'align' ? 'alignment' : cmd.target as Skill;
        check(['code', 'write', 'reason', 'create', 'media', 'recall', 'alignment'].includes(skill), 'UNKNOWN_SKILL');
        const b = r.bonuses[a!.version] ?? {};
        check(skill === 'alignment' ? !b.alignment : Object.entries(b).filter(([k]) => k !== 'alignment').reduce((n, [, x]) => n + (x ?? 0), 0) < 2, 'TRAINING_LIMIT');
        pay(300, 5); a!.busyUntil = s.absoluteSlot + (skill === 'alignment' ? 4 : 8); r.training = { until: a!.busyUntil, version: a!.version, skill }; r.location = 'library'; r.locationUntil = a!.busyUntil; return;
    }
    check(!assigned || s.absoluteSlot % 4 >= 2, 'ACTOR_BUSY');
    check(actorScene(s, a!) === p.scene || (cmd.action === 'recall' && owns(s,'remote')), 'ACTOR_ELSEWHERE');
    if (cmd.action === 'recall') { check(actorScene(s,a!) !== 'workshop', 'ALREADY_HERE');if(owns(s,'remote') && actorScene(s,a!) !== p.scene) a!.mood=cap(a!.mood-5); r.location = 'workshop'; r.locationUntil = s.absoluteSlot + 1; r.affinity = cap(r.affinity + 1); return; }
    if (cmd.action === 'meal') { check(p.scene === 'canteen' || p.scene === 'library', 'WRONG_SCENE'); pay(30); r.hunger=cap(r.hunger-50);r.stress=cap(r.stress-8); a!.energy = cap(a!.energy + 25); a!.mood = cap(a!.mood + 8); }
    if (cmd.action === 'study') { check(p.scene === 'library', 'WRONG_SCENE'); check(a!.energy >= 10, 'TIRED'); a!.energy -= 10; r.xp += 10; p.research += 2; }
    if (cmd.action === 'chat') { r.stress=cap(r.stress-10); a!.mood = cap(a!.mood + 5); r.affinity = cap(r.affinity + 3); }
    if (cmd.action === 'gift') { pay(60); a!.mood = cap(a!.mood + 10); r.affinity = cap(r.affinity + 5); }
    a!.busyUntil = s.absoluteSlot + 1;
}

export const clarifyChance=(s:State,c:Content,a:Actor)=>Math.min(.95,.35+.04*effectiveVersion(s,c,a).skills.recall+(owns(s,'analyst')?.15:0));
export function clarifyRoll(s:State):number {let x=s.campaign!.clarifyRng;x^=x<<13;x^=x>>>17;x^=x<<5;s.campaign!.clarifyRng=x>>>0;return(x>>>0)/4294967296;}
export const needsFactor=(s:State,id:string)=>{const r=s.campaign?.relations[id];return r&&s.campaign&&r.hunger>=70?.85:1;};
