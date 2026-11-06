import { createInitialState, dispatchCommand } from 'oot-core';
import type { Content, State, Version, Member, Job, Template } from 'oot-core';
export const strategies = ['value', 'greedy', 'random', 'no-clarify', 'clear-only'] as const;
export type Strategy = typeof strategies[number];
const live = (j: Job) => ['accepted', 'working', 'review', 'waiting'].includes(j.status);
const matching = (v: Version, t: Template) => Object.entries(t.weights).reduce((n, [k, w]) => n + w * v.skills[k as keyof typeof v.skills] / 10, 0);
function plans(c: Content, t: Template, available: Version[], strategy: Strategy) {
    const options: {
        team: Member[];
        score: number;
    }[] = [];
    for (let mask = 1; mask < (1 << available.length); mask++) {
        const workers = available.filter((_, i) => mask & (1 << i));
        for (const reviewer of [undefined, ...available.filter(v => !workers.includes(v))]) {
            const production = workers.reduce((n, v) => n + 10 * matching(v, t) * v.speed, 0);
            const quality = workers.reduce((n, v) => n + 10 * matching(v, t) ** 2 * v.speed, 0) / production * 100 + (reviewer ? 10 * matching(reviewer, t) : 0);
            if (quality < 63 || production * t.workSlots < t.workload * 1.15)
                continue;
            const cost = workers.reduce((n, v) => n + 10 * matching(v, t) * v.speed * v.price, 0) + (reviewer ? 3 * matching(reviewer, t) * reviewer.speed * reviewer.price : 0);
            const count = workers.length + (reviewer ? 1 : 0);
            const occupiedSlots = t.delivery === 'retainer' ? 14 : Math.ceil(t.workload / production);
            const score = strategy === 'greedy' ? quality * 10 + production : t.reward / (occupiedSlots * count) - cost * .15;
            options.push({ team: [...workers.map(v => ({ character: v.character, role: 'worker' as const, mode: 'cloud' as const })), ...(reviewer ? [{ character: reviewer.character, role: 'reviewer' as const, mode: 'cloud' as const }] : [])], score });
        }
    }
    return options.sort((a, b) => b.score - a.score);
}
export function runBot(c: Content, seed: number, strategy: Strategy, days: number) {
    let s = createInitialState(c, seed);
    const commands: unknown[] = [];
    let rng = (Math.imul(seed, 2654435761) >>> 0) || 1;
    const random = () => { rng ^= rng << 13; rng ^= rng >>> 17; rng ^= rng << 5; return (rng >>> 0) / 4294967296; };
    const send = (cmd: unknown) => { const r = dispatchCommand(s, cmd, c); if (r.error)
        throw Error(`${strategy}:${JSON.stringify(cmd)}:${r.error}`); s = r.state; commands.push(cmd); };
    let chapterCash: number | null = null, chapterBankrupt = false;
    const track = () => { if (chapterCash === null && (s.absoluteSlot >= 56 || s.bankrupt)) {
        chapterCash = s.cash;
        chapterBankrupt = s.bankrupt;
    } };
    while (s.absoluteSlot < days * 4 && !s.bankrupt) {
        if (s.pending) {
            const card = c.events.find(e => e.id === s.pending!.card)!;
            const affordable = card.choices.map((x, i) => ({ x, i })).filter(({ x }) => x.cost === 0 || x.cost <= s.cash);
            send({ type: 'choose', index: affordable[0]!.i });
            track();
            continue;
        }
        for (const j of s.jobs.filter(j => j.status === 'review')) {
            if (s.bankrupt)
                break;
            send({ type: j.quality < 60 && !j.reworked && s.absoluteSlot <= j.deadline ? 'rework' : 'deliver', job: j.id });
        }
        if (s.bankrupt) {
            track();
            break;
        }
        // No hidden state or future RNG inspection. Scheduling uses visible board and actor availability only.
        if (s.absoluteSlot % 4 < 2) {
            const busy = () => new Set(s.jobs.filter(live).flatMap(j => j.team.map(m => m.character)));
            const free = () => c.versions.filter(v => !busy().has(v.character) && s.actors.find(a => a.id === v.character)!.busyUntil <= s.absoluteSlot && s.actors.find(a => a.id === v.character)!.energy >= 15);
            let available = free();
            const posted = s.jobs.filter(j => j.status === 'posted');
            const candidates = posted.map(j => { const t = c.commissions.find(t => t.id === j.template)!; return { j, t, options: plans(c, t, available, strategy) }; }).filter(x => s.cash >= 0 || x.t.workload <= 40).filter(x => strategy !== 'clear-only' || x.t.clarity >= 80).filter(x => strategy !== 'random' || c.versions.some(v => matching(v, x.t) * 110 >= 60));
            candidates.sort((a, b) => (b.options[0]?.score ?? -Infinity) - (a.options[0]?.score ?? -Infinity));
            if (strategy === 'random')
                for (let i = candidates.length - 1; i > 0; i--) {
                    const n = Math.floor(random() * (i + 1));
                    [candidates[i], candidates[n]] = [candidates[n]!, candidates[i]!];
                }
            for (const candidate of candidates) {
                available = free();
                if (!available.length)
                    break;
                const { j, t } = candidate;
                const feasible = plans(c, t, available, strategy);
                const best = feasible[0];
                if (!best)
                    continue;
                if (j.hidden > 0 && strategy !== 'no-clarify') {
                    for (const v of available.slice(0, j.hidden))
                        send({ type: 'clarify', job: j.id, character: v.character });
                    continue;
                }
                let team: Member[];
                if (strategy === 'random') {
                    team = feasible[Math.floor(random() * feasible.length)]!.team;
                }
                else
                    team = best!.team;
                send({ type: 'accept', job: j.id });
                send({ type: 'assign', job: j.id, team });
            }
        }
        send({ type: 'advance' });
        track();
    }
    track();
    const accepted = s.jobs.filter(j => j.advance > 0 || j.phase > 0);
    const delivered = accepted.filter(j => j.status === 'delivered').length, breached = accepted.filter(j => j.status === 'breached').length;
    const participation = Object.fromEntries(s.actors.map(a => [a.id, s.resources.filter(r => r.character === a.id).length]));
    const participantTotal = Object.values(participation).reduce((a, b) => a + b, 0);
    const projects = accepted.map(j => {
        const cash = s.ledger.filter(l => l.reason.endsWith(':' + j.id)).reduce((n, l) => n + l.amount, 0);
        const usage = s.resources.filter(r => r.job === j.id);
        // Subscription allocation by actual quota share, separately from variable spend and inherited debt.
        const quotaTotal = s.resources.reduce((n, r) => n + r.quota, 0);
        const subscription = Math.floor(s.absoluteSlot / 28) * 1000;
        const direct = usage.reduce((n, r) => n + r.purchased * .5 + r.electricity, 0);
        const allocated = quotaTotal ? subscription * usage.reduce((n, r) => n + r.quota, 0) / quotaTotal : 0;
        return { id: j.id, template: j.template, status: j.status, cash, directCost: direct, allocatedSubscription: allocated, profit: cash - direct - allocated, novice: c.commissions.find(t => t.id === j.template)!.client === 'novice' };
    });
    const settled = projects.filter(p => p.status === 'delivered' || p.status === 'breached');
    const revenue = settled.reduce((n, p) => n + Math.max(0, p.cash), 0), profit = settled.reduce((n, p) => n + p.profit, 0);
    const novice = projects.filter(p => p.novice), noviceBreached = novice.filter(p => p.status === 'breached').length;
    return { state: s, commands, projects, metrics: { seed, strategy, days, slots: s.absoluteSlot, netCash: s.cash - (c.balance?.startingCash ?? 5000), bankrupt: s.bankrupt, chapterCash, chapterBankrupt, chapterSolvent: chapterCash !== null && chapterCash >= 0 && !chapterBankrupt, accepted: accepted.length, delivered, breached, deliveryRate: accepted.length ? delivered / accepted.length : 0, breachRate: accepted.length ? breached / accepted.length : 0, tokens: s.resources.reduce((n, r) => n + r.quota + r.purchased, 0), localCompute: s.resources.filter(r => r.mode === 'local').reduce((n, r) => n + r.units, 0), participation, participationRate: Object.fromEntries(Object.entries(participation).map(([k, v]) => [k, participantTotal ? v / participantTotal : 0])), operatingMargin: revenue ? profit / revenue : 0, projectProfit: profit, noviceAccepted: novice.length, noviceBreached } };
}
export type BotState = State;
