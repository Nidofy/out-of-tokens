import {stationEffects,workEnergyCost} from './office.js';
import {challengeAllows} from './finale.js';
import { effectiveVersion, owns, needsFactor } from './campaign.js';
import type { Content, State, Job } from './model.js';
import { moodFactor, fatigueFactor } from './economy.js';
// A conservative per-slot estimate: final partial work, events and outages can lower actual spend.
export function estimateResources(s: State, c: Content, j: Job, partial = false) {
    let cloud = 0, local = 0;
    let progress = j.progress, weighted = 0, coverage = 0;
    const members: {character:string;mode:string;cost:number;energyCost:number;efficiency:number;station:string|null}[]=[];
    const t = c.commissions.find(t => t.id === j.template)!;
    const attending = (id: string) => s.actors.find(a => a.id === id)!.busyUntil <= s.absoluteSlot && s.actors.find(a => a.id === id)!.energy >= 10 && (s.absoluteSlot % 4 < 2 || s.overtime.includes(id));
    const allowed = (m: Job['team'][number]) => attending(m.character) && challengeAllows(s,c,s.actors.find(a=>a.id===m.character)!.version,m.mode);
    const planner = j.team.find(m => m.role === 'planner' && allowed(m));
    const pv = planner ? effectiveVersion(s, c, s.actors.find(a => a.id === planner.character)!, planner.mode) : undefined;
    for (const m of [...j.team].sort((a,b)=>({planner:0,tool:1,worker:2,reviewer:3}[a.role]-{planner:0,tool:1,worker:2,reviewer:3}[b.role]) || (a.character<b.character?-1:a.character>b.character?1:0))) {
        const a = s.actors.find(a => a.id === m.character)!;
        const v = effectiveVersion(s, c, a, m.mode);
        if (!attending(a.id) || !challengeAllows(s,c,a.version,m.mode))
            continue;
        const match = Object.entries(t.weights).reduce((sum, [k, w]) => sum + w * v.skills[k as keyof typeof v.skills] / 10, 0);
        const role = m.role === 'worker' ? (1 + (pv?.skills.reason ?? 0) * .015) * (1 - (owns(s,'management')?0:.05) * Math.max(0, j.team.filter(m => m.role === 'worker').length - 2)) : m.role === 'planner' || m.role === 'tool' ? .5 : .3;
        const station=stationEffects(s,c,a.id,j.id,m.role);
        const units = (owns(s, 'prompt') && j.progress === 0 ? ((m.role==='worker'||m.role==='reviewer')&&j.team.some(m=>m.role==='tool'&&allowed(m))?1.4:1.2) : 1) * 10 * match * v.speed * (1 + (s.campaign?.hardware.office ?? 0) * .1) * (1+station.efficiency) * role * moodFactor(a.mood) * needsFactor(s,a.id) * fatigueFactor(a, s.absoluteSlot) * (a.energy >= 60 ? 1 : a.energy >= 30 ? .85 : .6) * (v.rhythm[s.absoluteSlot % 4] ?? 1) * (a.load > v.context ? .7 : 1);
        if (partial && m.role === 'reviewer' && progress === j.progress && j.defects === 0) continue;
        const output = partial && m.role !== 'reviewer' ? Math.min(Math.round(units * 100) / 100, Math.max(0, Math.round((j.work - progress) * 100) / 100)) : Math.round(units * 100) / 100;
        if (partial && (m.role === 'worker' || m.role === 'planner')) { progress = Math.round((progress + output) * 100) / 100; weighted += output * match; }
        if (partial && m.role === 'reviewer' && output > 0) coverage += (progress - j.progress) * match * 10;
        const cost = Math.round(output * v.price * 100) / 100;
        members.push({character:a.id,mode:m.mode,cost:Math.round(cost*100)/100,energyCost:output>0?Math.min(a.energy,workEnergyCost(s.absoluteSlot,station.energyCost)):0,efficiency:station.efficiency,station:station.station});
        if (m.mode === 'cloud')
            cloud += cost;
        else
            local += cost;
    }
    return { members, cloud: Math.round(cloud * 100) / 100, local: Math.round(local * 100) / 100, progress, weighted, coverage };
}

// Scenario projection only: freeze personal condition, assume resources are supplied,
// no events/new defects/rework. Never read or advance RNG. Only this phase is planned.
export function forecastAssignment(s: State, c: Content, job: Job) {
    const j = {...job}, horizon = 112;
    let cloud = 0, local = 0, workSlots = 0, completion: number | null = null;
    let capacityRisk = false;
    const firstSlot = estimateResources(s, c, j, true);
    for (let offset = 0; offset < horizon; offset++) {
        const slot = s.absoluteSlot + offset;
        const frame = {...s, absoluteSlot: slot, overtime: offset === 0 ? s.overtime : []};
        const step = estimateResources(frame, c, j, true);
        const required = step;
        cloud += step.cloud; local += step.local;
        capacityRisk ||= required.local > s.localCapacity;
        if (step.progress > j.progress) workSlots++;
        j.progress = step.progress; j.weighted += step.weighted; j.reviewCoverage += step.coverage;
        if (j.progress >= j.work) { completion = slot + 1; break; }
    }
    const base = 100 * j.weighted / Math.max(1,j.progress) + j.reviewCoverage / Math.max(1,j.progress) + j.qualityBonus - 8 * j.hidden - 6 * j.defects;
    const cap = (n:number) => Math.round(Math.max(0,Math.min(100,n)));
    const conditions = job.team.map(m => {
        const a = s.actors.find(a=>a.id===m.character)!;
        const v = effectiveVersion(s,c,a,m.mode);
        return {character:a.id,energy:a.energy,mood:a.mood,overloaded:a.load>v.context,needs:needsFactor(s,a.id)<1};
    });
    return {firstSlot, completion, workSlots, horizon, cloud:Math.round(cloud*100)/100,local:Math.round(local*100)/100,electricity:Math.round(local*10)/100,
        quality:completion===null?null:[cap(base-5),cap(base+5)],
        risks:{noProgress:completion===null,late:completion!==null&&completion>job.deadline,capacity:capacityRisk,cloud:firstSlot.cloud>s.quota+s.purchased,hidden:job.hidden>0,condition:conditions.some(a=>a.energy<60||a.mood<50||a.overloaded||a.needs)},conditions};
}
