import type { Content, State, Job } from './model.js';
// A conservative per-slot estimate: final partial work, events and outages can lower actual spend.
export function estimateResources(s: State, c: Content, j: Job) {
    let cloud = 0, local = 0;
    const t = c.commissions.find(t => t.id === j.template)!;
    const planner = j.team.find(m => m.role === 'planner');
    const pv = planner ? c.versions.find(v => v.character === planner.character) : undefined;
    for (const m of j.team) {
        const a = s.actors.find(a => a.id === m.character)!;
        const v = c.versions.find(v => v.id === a.version)!;
        if (a.energy < 10)
            continue;
        const match = Object.entries(t.weights).reduce((sum, [k, w]) => sum + w * v.skills[k as keyof typeof v.skills] / 10, 0);
        const role = m.role === 'worker' ? (1 + (pv?.skills.reason ?? 0) * .015) : m.role === 'planner' ? .5 : .3;
        const cost = 10 * match * v.speed * v.price * role * (a.energy >= 60 ? 1 : a.energy >= 30 ? .85 : .6) * (v.rhythm[s.absoluteSlot % 4] ?? 1) * (a.load > v.context ? .7 : 1);
        if (m.mode === 'cloud')
            cloud += cost;
        else
            local += cost;
    }
    return { cloud: Math.round(cloud * 100) / 100, local: Math.round(local * 100) / 100 };
}
