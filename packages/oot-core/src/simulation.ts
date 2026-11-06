import { deadlineAfterWorkSlots } from './clock.js';
import { engineVersion } from './version.js';
import type { Actor, Command, Content, DomainEvent, Job, Member, Result, State, Version } from './model.js';
const round = (n: number) => Math.round(n * 100) / 100;
const clamp = (n: number) => Math.max(0, Math.min(100, round(n)));
function mix(n: number): number { n = Math.imul(n ^ (n >>> 16), 0x21f0aaad); n = Math.imul(n ^ (n >>> 15), 0x735a2d97); return (n ^ (n >>> 15)) >>> 0 || 1; }
export function draw(state: State, stream: keyof State['rng']): number {
    let x = state.rng[stream];
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    state.rng[stream] = x >>> 0;
    return (x >>> 0) / 4294967296;
}
function requireRule(ok: unknown, message: string): asserts ok { if (!ok)
    throw Error(message); }
function money(s: State, amount: number, reason: string) { s.cash = round(s.cash + amount); s.ledger.push({ slot: s.absoluteSlot, reason, amount: round(amount) }); }
function refill(s: State, c: Content) {
    for (const j of s.jobs)
        if (j.status === 'posted' && s.absoluteSlot - j.posted >= 4)
            j.status = 'expired';
    for (let n = 0; n < 3; n++) {
        const t = c.commissions[Math.floor(draw(s, 'board') * c.commissions.length)]!;
        s.jobs.push({ id: `${s.absoluteSlot}-${n}`, template: t.id, status: 'posted', posted: s.absoluteSlot, deadline: 0, duration: 0, hidden: Math.round((100 - t.clarity) / 25), work: t.workload, progress: 0, weighted: 0, review: 0, defects: 0, reworked: false, advance: 0, quality: 0, team: [] });
    }
}
export function createInitialState(c: Content, seed = 1): State {
    requireRule(Number.isSafeInteger(seed) && seed >= 0 && seed <= 0xffffffff, 'INVALID_SEED');
    requireRule(c.versions.length > 0 && c.commissions.length > 0, 'EMPTY_CONTENT');
    const state: State = { engineVersion, contentVersion: c.version, seed, absoluteSlot: 0, cash: 5000, quota: 300, purchased: 0, localCapacity: 120, electricity: 0, debtPaid: false, crisisSince: null, bankrupt: false, rng: { board: (seed ^ 0x12345678) >>> 0 || 1, event: (seed ^ 0x87654321) >>> 0 || 2, quality: (seed ^ 0xabcdef01) >>> 0 || 3 }, actors: c.versions.map(v => ({ id: v.character, version: v.id, energy: 100, mood: 70, load: 0, busyUntil: 0 })), jobs: [], pending: null, ledger: [], resources: [], tokensUsed: 0 };
    for (const stream of ['board', 'event', 'quality'] as const)
        state.rng[stream] = mix(state.rng[stream]);
    refill(state, c);
    return state;
}
const active = (j: Job) => j.status === 'working' || j.status === 'accepted' || j.status === 'review';
function occupied(s: State, id: string, except = '') { return s.actors.find(a => a.id === id)!.busyUntil > s.absoluteSlot || s.jobs.some(j => j.id !== except && active(j) && j.team.some(m => m.character === id)); }
function version(c: Content, a: Actor): Version { return c.versions.find(v => v.id === a.version)!; }
function match(c: Content, j: Job, v: Version): number { const w = c.commissions.find(t => t.id === j.template)!.weights; return Object.entries(w).reduce((sum, [key, value]) => sum + value * v.skills[key as keyof typeof w] / 10, 0); }
function breach(s: State, c: Content, j: Job) { money(s, -j.advance - c.commissions.find(t => t.id === j.template)!.reward * 0.3, `breach:${j.id}`); j.status = 'breached'; }
function resolve(s: State, c: Content, events: DomainEvent[], multiplier = 1, target?: string) {
    const worked = new Set<string>();
    let local = s.localCapacity;
    if (s.absoluteSlot % 4 < 2)
        for (const j of s.jobs.filter(j => j.status === 'working')) {
            let bonus = 1;
            const order = { planner: 0, worker: 1, reviewer: 2 };
            for (const m of [...j.team].sort((a, b) => order[a.role] - order[b.role] || (a.character < b.character ? -1 : a.character > b.character ? 1 : 0))) {
                const a = s.actors.find(a => a.id === m.character)!;
                const v = version(c, a);
                const matching = match(c, j, v);
                if (a.energy < 10)
                    continue;
                if (m.role === 'worker' && j.progress >= j.work)
                    continue;
                const energy = a.energy >= 60 ? 1 : a.energy >= 30 ? 0.85 : 0.6;
                const effect = target && (m.character !== target || m.mode !== 'cloud') ? 1 : multiplier;
                let units = round(10 * matching * v.speed * energy * (v.rhythm[s.absoluteSlot % 4] ?? 1) * (a.load > v.context ? 0.7 : 1) * effect * (m.role === 'worker' ? bonus : m.role === 'planner' ? 0.5 : 0.3));
                if (m.role === 'worker')
                    units = Math.min(units, round(j.work - j.progress));
                if (units <= 0)
                    continue;
                const cost = round(units * v.price);
                if ((m.mode === 'local' ? local : s.quota + s.purchased) < cost) {
                    events.push({ type: 'OutOfTokens', message: `${a.id} 资源不足，停工` });
                    continue;
                }
                const q = m.mode === 'cloud' ? Math.min(s.quota, cost) : 0;
                const purchased = m.mode === 'cloud' ? round(cost - q) : 0;
                const electricity = m.mode === 'local' ? round(cost * 0.1) : 0;
                if (m.mode === 'local') {
                    local = round(local - cost);
                    s.electricity = round(s.electricity + electricity);
                }
                else {
                    s.quota = round(s.quota - q);
                    s.purchased = round(s.purchased - purchased);
                }
                s.resources.push({ slot: s.absoluteSlot, job: j.id, character: a.id, mode: m.mode, units: cost, quota: q, purchased, electricity });
                events.push({ type: 'ResourceSpent', message: `${a.id}: ${cost} ${m.mode === 'cloud' ? 'T' : '本地算力'}，委托 ${j.id}` });
                s.tokensUsed = round(s.tokensUsed + cost);
                worked.add(a.id);
                a.energy = clamp(a.energy - 15);
                a.load++;
                if (m.role === 'planner')
                    bonus = 1 + v.skills.reason * 0.015;
                if (m.role === 'worker') {
                    const delivered = Math.min(units, Math.max(0, j.work - j.progress));
                    j.progress = round(j.progress + delivered);
                    j.weighted = round(j.weighted + delivered * matching);
                    if (draw(s, 'quality') < 0.25 * (1 - v.stability / 10) * (energy === 0.6 ? 1.5 : 1) * (a.load > v.context ? 1.5 : 1))
                        j.defects++;
                }
                if (m.role === 'reviewer') {
                    j.review = Math.max(j.review, matching * 10);
                    const defects = j.defects;
                    for (let n = 0; n < defects; n++)
                        if (draw(s, 'quality') < Math.min(1, 0.4 + 0.05 * v.skills.reason)) {
                            j.defects--;
                            j.work += 5;
                        }
                }
            }
            if (j.progress >= j.work) {
                j.status = 'review';
                j.quality = clamp(100 * j.weighted / Math.max(1, j.progress) + j.review - 8 * j.hidden - 6 * j.defects + (draw(s, 'quality') * 10 - 5));
                events.push({ type: 'Ready', message: `${j.id} 待交付，质量 ${j.quality}` });
            }
        }
    for (const a of s.actors)
        if (!worked.has(a.id) && a.busyUntil <= s.absoluteSlot) {
            a.energy = clamp(a.energy + (s.absoluteSlot % 4 === 3 ? 60 : 15));
            if (s.absoluteSlot % 4 === 3)
                a.load = 0;
        }
    s.absoluteSlot++;
    s.pending = null;
    for (const j of s.jobs)
        if (active(j) && s.absoluteSlot > j.deadline + Math.floor(j.duration / 2))
            breach(s, c, j);
    if (s.absoluteSlot % 4 === 0) {
        s.quota = s.absoluteSlot >= 8 ? 600 : 300;
        refill(s, c);
        events.push({ type: 'DayEnd', message: '日结：配额刷新' });
    }
    if (s.absoluteSlot % 28 === 0) {
        money(s, -2300 - s.electricity, 'weekly');
        s.electricity = 0;
        events.push({ type: 'WeekEnd', message: '周结：房租、订阅、电费' });
    }
    if (s.absoluteSlot >= 56 && !s.debtPaid) {
        money(s, -8000, 'inherited-debt');
        s.debtPaid = true;
    }
    events.push({ type: 'SlotResolved', message: `进入时段 ${s.absoluteSlot}` });
}
function parse(input: unknown): Command {
    requireRule(typeof input === 'object' && input !== null && !Array.isArray(input), 'INVALID_COMMAND');
    const v = input as Record<string, unknown>;
    const t = v.type;
    if (t === 'advance')
        return { type: t };
    if (t === 'choose' || t === 'buy') {
        const n = v[t === 'choose' ? 'index' : 'amount'];
        requireRule(typeof n === 'number' && Number.isSafeInteger(n) && n >= 0 && n <= 1000000, 'INVALID_NUMBER');
        return t === 'choose' ? { type: t, index: n } : { type: t, amount: n };
    }
    requireRule(typeof v.job === 'string', 'INVALID_JOB');
    if (t === 'accept' || t === 'reject' || t === 'deliver' || t === 'rework')
        return { type: t, job: v.job };
    if (t === 'clarify') {
        requireRule(typeof v.character === 'string', 'INVALID_ACTOR');
        return { type: t, job: v.job, character: v.character };
    }
    if (t === 'assign') {
        requireRule(Array.isArray(v.team) && v.team.length > 0 && v.team.length <= 4, 'INVALID_TEAM');
        const team: Member[] = v.team.map((x: unknown) => { requireRule(typeof x === 'object' && x !== null, 'INVALID_MEMBER'); const m = x as Record<string, unknown>; requireRule(typeof m.character === 'string' && (m.role === 'worker' || m.role === 'reviewer' || m.role === 'planner') && (m.mode === 'cloud' || m.mode === 'local'), 'INVALID_MEMBER'); return { character: m.character, role: m.role, mode: m.mode }; });
        return { type: t, job: v.job, team };
    }
    throw Error('UNSUPPORTED_COMMAND');
}
export function dispatchCommand(original: State, input: unknown, c: Content): Result {
    const events: DomainEvent[] = [];
    try {
        const cmd = parse(input);
        requireRule(!original.bankrupt, 'BANKRUPT');
        requireRule(original.engineVersion === engineVersion && original.contentVersion === c.version, 'VERSION_MISMATCH');
        requireRule(!original.pending || cmd.type === 'choose', 'PENDING_CHOICE');
        const s: State = JSON.parse(JSON.stringify(original));
        if (cmd.type === 'advance') {
            const cards = c.events.filter(card => card.trigger !== 'bluewhale-cloud' || s.jobs.some(j => j.status === 'working' && j.team.some(m => m.character === 'bluewhale' && m.mode === 'cloud')));
            if (cards.length && s.absoluteSlot % 4 < 2 && s.jobs.some(j => j.status === 'working') && draw(s, 'event') < 0.25) {
                const card = cards[Math.floor(draw(s, 'event') * cards.length)]!;
                s.pending = { card: card.id, slot: s.absoluteSlot };
                events.push({ type: 'PendingChoice', message: card.title });
            }
            else
                resolve(s, c, events);
        }
        else if (cmd.type === 'choose') {
            requireRule(s.pending, 'NO_PENDING_CHOICE');
            requireRule(s.pending.slot === s.absoluteSlot, 'STALE_CHOICE');
            const card = c.events.find(e => e.id === s.pending!.card)!;
            const choice = card.choices[cmd.index];
            requireRule(choice, 'INVALID_CHOICE');
            requireRule(choice.cost === 0 || s.cash >= choice.cost, 'INSUFFICIENT_CASH');
            money(s, -choice.cost, `event:${card.id}`);
            resolve(s, c, events, choice.multiplier, card.trigger === 'bluewhale-cloud' ? 'bluewhale' : undefined);
        }
        else if (cmd.type === 'buy') {
            requireRule(cmd.amount > 0 && s.cash >= cmd.amount * 0.5, 'INSUFFICIENT_CASH');
            money(s, -cmd.amount * 0.5, 'buy-tokens');
            s.purchased += cmd.amount;
        }
        else {
            const j = s.jobs.find(j => j.id === cmd.job);
            requireRule(j, 'UNKNOWN_JOB');
            const t = c.commissions.find(t => t.id === j.template)!;
            if (cmd.type === 'accept') {
                requireRule(j.status === 'posted', 'NOT_POSTED');
                j.status = 'accepted';
                j.deadline = deadlineAfterWorkSlots(s.absoluteSlot, t.workSlots);
                j.duration = j.deadline - s.absoluteSlot;
                j.advance = round(t.reward * 0.3);
                money(s, j.advance, `advance:${j.id}`);
            }
            else if (cmd.type === 'reject') {
                requireRule(j.status === 'posted', 'NOT_POSTED');
                j.status = 'rejected';
            }
            else if (cmd.type === 'clarify') {
                requireRule(j.status === 'posted' && j.hidden > 0, 'NOT_CLARIFIABLE');
                const a = s.actors.find(a => a.id === cmd.character);
                requireRule(a && !occupied(s, a.id) && a.energy >= 15, 'ACTOR_BUSY');
                a.busyUntil = s.absoluteSlot + 1;
                a.energy -= 15;
                j.hidden = Math.max(0, j.hidden - 1);
            }
            else if (cmd.type === 'assign') {
                requireRule(j.status === 'accepted' || j.status === 'working', 'NOT_ASSIGNABLE');
                requireRule(new Set(cmd.team.map(m => m.character)).size === cmd.team.length, 'DUPLICATE_ACTOR');
                requireRule(cmd.team.some(m => m.role === 'worker') && cmd.team.filter(m => m.role === 'reviewer').length <= 1 && cmd.team.filter(m => m.role === 'planner').length <= 1, 'INVALID_ROLES');
                for (const m of cmd.team) {
                    const a = s.actors.find(a => a.id === m.character);
                    requireRule(a && !occupied(s, a.id, j.id), 'ACTOR_BUSY');
                    requireRule(version(c, a).modes.includes(m.mode), 'UNSUPPORTED_DEPLOYMENT');
                }
                j.team = cmd.team;
                j.status = 'working';
            }
            else if (cmd.type === 'deliver') {
                requireRule(j.status === 'review', 'NOT_READY');
                if (j.quality < 60) {
                    requireRule(j.reworked || s.absoluteSlot > j.deadline, 'REWORK_AVAILABLE');
                    breach(s, c, j);
                }
                else {
                    const multiplier = j.quality >= 90 ? 1.35 : j.quality >= 75 ? 1.15 : 1;
                    const late = Math.max(0, s.absoluteSlot - j.deadline);
                    money(s, round(t.reward * multiplier * Math.max(0, 1 - late * 0.1)) - j.advance, `delivery:${j.id}`);
                    j.status = 'delivered';
                }
            }
            else if (cmd.type === 'rework') {
                requireRule(j.status === 'review' && j.quality < 60 && !j.reworked && s.absoluteSlot <= j.deadline, 'NO_REWORK');
                j.reworked = true;
                j.hidden = 0;
                j.defects = 0;
                j.work = round(j.work + t.workload * 0.2);
                j.status = 'working';
            }
        }
        if (s.cash < 0) {
            s.crisisSince ??= s.absoluteSlot;
            if (s.cash < -20000 || s.absoluteSlot - s.crisisSince >= 12)
                s.bankrupt = true;
        }
        else
            s.crisisSince = null;
        if ('job' in cmd)
            events.push({ type: 'CommandApplied', message: `${cmd.type}: ${cmd.job}` });
        return { state: s, events, error: null };
    }
    catch (e) {
        return { state: original, events: [], error: e instanceof Error ? e.message : 'INVALID_COMMAND' };
    }
}
export const advanceSlot = (s: State, c: Content) => dispatchCommand(s, { type: 'advance' }, c);
export function getViewModel(s: State, c: Content) {
    const card = s.pending ? c.events.find(e => e.id === s.pending!.card) : null;
    return { absoluteSlot: s.absoluteSlot, day: Math.floor(s.absoluteSlot / 4) + 1, slot: ['上午', '下午', '晚上', '深夜'][s.absoluteSlot % 4], cash: s.cash, quota: s.quota, purchased: s.purchased, localCapacity: s.localCapacity, electricity: s.electricity, nextWeeklyBill: 2300 + s.electricity, debtDue: s.debtPaid ? 0 : 8000, debtSlot: 56, bankrupt: s.bankrupt, crisisSince: s.crisisSince, actors: s.actors.map(a => ({ ...a, busy: occupied(s, a.id), skills: { ...version(c, a).skills }, price: version(c, a).price, modes: [...version(c, a).modes] })), jobs: s.jobs.filter(j => !['expired', 'rejected'].includes(j.status)).map(j => { const t = c.commissions.find(t => t.id === j.template)!; return { ...j, title: t.title, description: t.description, weights: { ...t.weights }, reward: t.reward, workSlots: t.workSlots, clarity: t.clarity, passQuality: 60, overdue: active(j) && s.absoluteSlot > j.deadline, team: j.team.map(m => ({ ...m })) }; }), pending: card ? { ...card, choices: card.choices.map(x => ({ ...x })) } : null, ledger: s.ledger.slice(-10).map(x => ({ ...x })), resources: s.resources.slice(-10).map(x => ({ ...x })) };
}
