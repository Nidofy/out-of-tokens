import { createInitialState, dispatchCommand, liquidCash } from 'oot-core';
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
            if (quality < (t.qualityLines?.[0] ?? 60) + 3 || production * t.workSlots < t.workload * 1.15)
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
    let outOfTokens = 0;
    const grades = { failed: 0, pass: 0, good: 0, great: 0 };
    const daily: {
        slot: number;
        cash: number;
        quota: number;
        purchased: number;
        active: number;
        bankrupt: boolean;
        liquidCash: number;
    }[] = [];
    const deliveries: {
        job: string;
        quality: number;
        grade: string;
        role: string;
    }[] = [];
    const send = (cmd: unknown) => {
        const command = cmd as {
            type: string;
            job?: string;
        };
        if (command.type === 'deliver') {
            const j = s.jobs.find(j => j.id === command.job)!;
            const lines = c.commissions.find(t => t.id === j.template)!.qualityLines ?? [60, 75, 90];
            const grade = j.quality < lines[0] ? 'failed' : j.quality < lines[1] ? 'pass' : j.quality < lines[2] ? 'good' : 'great';
            grades[grade]++;
            deliveries.push({ job: j.id, quality: j.quality, grade, role: j.team.some(m => m.role === 'reviewer') ? 'reviewed' : 'workers' });
        }
        const previous = s.absoluteSlot;
        const r = dispatchCommand(s, cmd, c);
        if (r.error)
            throw Error(`${strategy}:${JSON.stringify(cmd)}:${r.error}`);
        outOfTokens += r.events.filter(e => e.type === 'OutOfTokens').length;
        s = r.state;
        commands.push(cmd);
        if (s.absoluteSlot !== previous && (s.absoluteSlot % 4 === 0 || s.bankrupt))
            daily.push({ slot: s.absoluteSlot, cash: s.cash, liquidCash: liquidCash(s), quota: s.quota, purchased: s.purchased, active: s.jobs.filter(live).length, bankrupt: s.bankrupt });
    };
    let chapterCash: number | null = null, chapterBankrupt = false;
    let chapterLiquid: number | null = null;
    const track = () => {
        if (chapterCash === null && (s.absoluteSlot >= 56 || s.bankrupt)) {
            chapterCash = s.cash;
            chapterLiquid = liquidCash(s);
            chapterBankrupt = s.bankrupt;
        }
    };
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
            send({ type: j.quality < (c.commissions.find(t => t.id === j.template)!.qualityLines?.[0] ?? 60) && !j.reworked && s.absoluteSlot <= j.deadline ? 'rework' : 'deliver', job: j.id });
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
            const posted = s.jobs.filter(j => j.status === 'posted' && j.clarifyingUntil <= s.absoluteSlot);
            const candidates = posted.map(j => { const t = c.commissions.find(t => t.id === j.template)!; return { j, t, options: plans(c, t, available, strategy) }; }).filter(x => liquidCash(s) >= 0 || x.t.workload * (x.t.phases ?? 1) <= 40).filter(x => strategy !== 'clear-only' || x.t.clarity >= 80);
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
        if (s.absoluteSlot % 4 < 2 && s.quota + s.purchased < 40 && s.cash >= 50 && s.jobs.some(j => j.status === 'working'))
            send({ type: 'buy', amount: 100 });
        if (s.bankrupt) {
            track();
            break;
        }
        send({ type: 'advance' });
        track();
    }
    track();
    const accepted = s.jobs.filter(j => j.advance > 0 || j.phase > 0);
    const delivered = accepted.filter(j => j.status === 'delivered').length, breached = accepted.filter(j => j.status === 'breached').length;
    const participation = Object.fromEntries(s.actors.map(a => [a.id, s.resources.filter(r => r.character === a.id).length]));
    const participantTotal = Object.values(participation).reduce((a, b) => a + b, 0);
    const moneyByJob = new Map<string, number>();
    for (const l of s.ledger) {
        const id = l.reason.slice(l.reason.lastIndexOf(':') + 1);
        moneyByJob.set(id, (moneyByJob.get(id) ?? 0) + l.amount);
    }
    const costs = new Map<string, {
        direct: number;
        quota: number;
    }>();
    let quotaTotal = 0;
    for (const r of s.resources) {
        const entry = costs.get(r.job) ?? { direct: 0, quota: 0 };
        entry.direct += r.purchased * .5 + r.electricity;
        entry.quota += r.quota;
        quotaTotal += r.quota;
        costs.set(r.job, entry);
    }
    const subscription = Math.floor(s.absoluteSlot / 28) * 1000;
    const projects = accepted.map(j => {
        const cash = moneyByJob.get(j.id) ?? 0, usage = costs.get(j.id) ?? { direct: 0, quota: 0 };
        const allocated = quotaTotal ? subscription * usage.quota / quotaTotal : 0;
        return { id: j.id, template: j.template, status: j.status, cash, directCost: usage.direct, allocatedSubscription: allocated, profit: cash - usage.direct - allocated, novice: c.commissions.find(t => t.id === j.template)!.client === 'novice' };
    });
    const settled = projects.filter(p => p.status === 'delivered' || p.status === 'breached');
    const revenue = settled.reduce((n, p) => n + Math.max(0, p.cash), 0), profit = settled.reduce((n, p) => n + p.profit, 0);
    const novice = projects.filter(p => p.novice), noviceBreached = novice.filter(p => p.status === 'breached').length;
    return { state: s, commands, projects, daily, deliveries, metrics: { seed, strategy, days, slots: s.absoluteSlot, netCash: s.cash - (c.balance?.startingCash ?? 5000), bankrupt: s.bankrupt, chapterCash, chapterLiquid, sustainedSolvent: Array.from({ length: 8 }, (_, i) => 56 + i * 4).every(slot => daily.some(d => d.slot === slot && d.liquidCash >= 0 && !d.bankrupt)), chapterBankrupt, outOfTokens, tokenPurchases: s.ledger.filter(l => l.reason === 'buy-tokens').length, chapterSolvent: chapterLiquid !== null && chapterLiquid >= 0 && !chapterBankrupt, accepted: accepted.length, delivered, breached, deliveryRate: accepted.length ? delivered / accepted.length : 0, breachRate: accepted.length ? breached / accepted.length : 0, tokens: s.resources.reduce((n, r) => n + r.quota + r.purchased, 0), localCompute: s.resources.filter(r => r.mode === 'local').reduce((n, r) => n + r.units, 0), participation, participationRate: Object.fromEntries(Object.entries(participation).map(([k, v]) => [k, participantTotal ? v / participantTotal : 0])), operatingMargin: revenue ? profit / revenue : 0, projectProfit: profit, noviceAccepted: novice.length, noviceClosed: novice.filter(p => p.status === 'delivered' || p.status === 'breached').length, noviceBreached, grades, active: accepted.length - delivered - breached } };
}
export type BotState = State;
