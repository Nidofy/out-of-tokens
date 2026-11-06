import { initialCampaign, cloneCampaign, effectiveVersion, parseCampaign, applyCampaign, tickCampaign, actorScene, owns, clarifyChance, clarifyRoll, needsFactor } from './campaign.js';
import { deadlineAfterWorkSlots } from './clock.js';
import { balance, crisis, liquidCash, moodFactor, fatigueFactor } from './economy.js';
import { eligible, applyEffects } from './events.js';
import { engineVersion } from './version.js';
import { estimateResources } from './preview.js';
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
function requireRule(ok: unknown, message: string): asserts ok {
    if (!ok)
        throw Error(message);
}
function money(s: State, amount: number, reason: string) { s.cash = round(s.cash + amount); s.ledger.push({ slot: s.absoluteSlot, reason, amount: round(amount) }); }
function refill(s: State, c: Content) {
    for (const j of s.jobs)
        if (j.status === 'posted' && s.absoluteSlot - j.posted >= 4)
            j.status = 'expired';
    for (let n = 0; n < 5; n++) {
        const t = c.commissions[Math.floor(draw(s, 'board') * c.commissions.length)]!;
        s.jobs.push({ id: `${s.absoluteSlot}-${n}`, template: t.id, status: 'posted', posted: s.absoluteSlot, deadline: 0, duration: 0, hidden: t.requirements?.length ?? Math.round((100 - t.clarity) / 25), work: t.workload, progress: 0, weighted: 0, review: 0, defects: 0, reworked: false, advance: 0, quality: 0, team: [], phase: 0, resumeAt: 0, qualityBonus: 0, clarifyingUntil: 0, reviewCoverage: 0 });
    }
}
export function createInitialState(c: Content, seed = 1): State {
    requireRule(Number.isSafeInteger(seed) && seed >= 0 && seed <= 0xffffffff, 'INVALID_SEED');
    requireRule(c.versions.length > 0 && c.commissions.length > 0, 'EMPTY_CONTENT');
    const b = balance(c);
    const state: State = { overtime: [], loan: 0, crises: [], reputation: 0, peakReputation: 0, founderXP: 0, runs: 1, discovered: [], eventLast: {}, eventHistory: [], engineVersion, contentVersion: c.version, seed, absoluteSlot: 0, cash: b.startingCash, quota: b.dailyQuota, purchased: 0, localCapacity: b.localCapacity, electricity: 0, debtPaid: false, crisisSince: null, bankrupt: false, rng: { board: (seed ^ 0x12345678) >>> 0 || 1, event: (seed ^ 0x87654321) >>> 0 || 2, quality: (seed ^ 0xabcdef01) >>> 0 || 3 }, actors: c.versions.filter((v, i, all) => all.findIndex(x => x.character === v.character) === i && (!c.campaign || c.campaign.initial.includes(v.character))).map(v => ({ id: v.character, version: v.id, energy: 100, mood: 70, load: 0, busyUntil: 0 })), jobs: [], pending: null, ledger: [], resources: [], tokensUsed: 0 };
    for (const stream of ['board', 'event', 'quality'] as const)
        state.rng[stream] = mix(state.rng[stream]);
    if (c.campaign) {state.campaign = initialCampaign(c);state.campaign.clarifyRng=mix(seed ^ 0x49feab21);}
    refill(state, c);
    return state;
}
const active = (j: Job) => j.status === 'working' || j.status === 'accepted' || j.status === 'review' || j.status === 'waiting';
function occupied(s: State, id: string, except = '') { return s.actors.find(a => a.id === id)!.busyUntil > s.absoluteSlot || s.jobs.some(j => j.id !== except && active(j) && j.team.some(m => m.character === id)); }
function version(c: Content, a: Actor, s?: State, mode?: Member['mode']): Version { return s ? effectiveVersion(s, c, a, mode) : c.versions.find(v => v.id === a.version)!; }
function match(c: Content, j: Job, v: Version): number { const w = c.commissions.find(t => t.id === j.template)!.weights; return Object.entries(w).reduce((sum, [key, value]) => sum + value * v.skills[key as keyof typeof w] / 10, 0); }
function tRecall(c: Content, j: Job) { return c.commissions.find(t => t.id === j.template)!.weights.recall > 0; }
function breach(s: State, c: Content, j: Job) { money(s, -j.advance - c.commissions.find(t => t.id === j.template)!.reward * balance(c).rewardScale * 0.3, `breach:${j.id}`); j.status = 'breached'; s.reputation = Math.max(0, s.reputation - 8); }
function resolve(s: State, c: Content, events: DomainEvent[], multiplier = 1, target?: string, eventJob?: string, tokenRate = 1) {
    const worked = new Set<string>();
    let local = s.localCapacity;
    for (const j of s.jobs)
        if (j.status === 'waiting' && s.absoluteSlot >= j.resumeAt)
            j.status = 'working';
    if (s.absoluteSlot % 4 < 2 || s.overtime.length)
        for (const j of s.jobs.filter(j => j.status === 'working')) {
            const progressBefore = j.progress;
            let bonus = 1, toolReady = false;
            const order = { planner: 0, worker: 2, tool: 1, reviewer: 3 };
            for (const m of [...j.team].sort((a, b) => order[a.role] - order[b.role] || (a.character < b.character ? -1 : a.character > b.character ? 1 : 0))) {
                const a = s.actors.find(a => a.id === m.character)!;
                const v = version(c, a, s, m.mode);
                const matching = match(c, j, v);
                if (s.absoluteSlot % 4 >= 2 && !s.overtime.includes(a.id))
                    continue;
                if (a.energy < 10 || a.busyUntil > s.absoluteSlot)
                    continue;
                if (m.role === 'worker' && j.progress >= j.work)
                    continue;
                const energy = a.energy >= 60 ? 1 : a.energy >= 30 ? 0.85 : 0.6;
                const overloaded = a.load > v.context;
                const affected = (!eventJob || eventJob === j.id) && (!target || (m.character === target && m.mode === 'cloud'));
                const effect = affected ? (m.role === 'worker' ? multiplier : Math.min(1, multiplier)) : 1;
                const teamCost = 1 - (owns(s, 'management') ? 0 : .05) * Math.max(0, j.team.filter(m => m.role === 'worker').length - 2);
                if (m.role === 'reviewer' && j.progress === progressBefore && j.defects === 0)
                    continue;
                let units = round((owns(s, 'prompt') && progressBefore === 0 ? 1 + .2 * (toolReady ? 2 : 1) : 1) * 10 * matching * v.speed * (1 + (s.campaign?.hardware.office ?? 0) * .1) * energy * moodFactor(a.mood) * needsFactor(s,a.id) * fatigueFactor(a, s.absoluteSlot) * (v.rhythm[s.absoluteSlot % 4] ?? 1) * (overloaded ? 0.7 : 1) * effect * (m.role === 'worker' ? bonus * teamCost : m.role === 'planner' || m.role === 'tool' ? 0.5 : 0.3));
                if (m.role === 'worker' || m.role === 'planner' || m.role === 'tool')
                    units = Math.min(units, round(j.work - j.progress));
                if (units <= 0)
                    continue;
                const cost = round(units * v.price * (affected ? tokenRate : 1));
                if (m.role === 'planner' || m.role === 'tool') {
                    if(j.team.some(member=>member.role==='tool')){const budget=estimateResources(s,c,j);if(budget.cloud>s.quota+s.purchased||budget.local>local)continue;}
                    const ready = j.team.filter(w => w.role === 'worker').some(w => {
                        const wa = s.actors.find(a => a.id === w.character)!;
                        const wv = version(c, wa);
                        if (wa.energy < 10 || wa.busyUntil > s.absoluteSlot || (s.absoluteSlot % 4 >= 2 && !s.overtime.includes(wa.id)))
                            return false;
                        const workerAffected = (!eventJob || eventJob === j.id) && (!target || (w.character === target && w.mode === 'cloud'));
                        const wf = workerAffected ? multiplier : 1;
                        if (wf === 0)
                            return false;
                        const wp = Math.min(Math.max(0, round(j.work - j.progress - units)), round((owns(s, 'prompt') && progressBefore === 0 ? 1.2 : 1) * (1 + (s.campaign?.hardware.office ?? 0) * .1) * 10 * match(c, j, wv) * wv.speed * (wv.rhythm[s.absoluteSlot % 4] ?? 1) * (wa.energy >= 60 ? 1 : wa.energy >= 30 ? .85 : .6) * moodFactor(wa.mood) * needsFactor(s,wa.id) * fatigueFactor(wa, s.absoluteSlot) * (wa.load > wv.context ? .7 : 1) * wf * (1 + v.skills.reason * .015) * teamCost));
                        const pool = (w.mode === 'cloud' ? s.quota + s.purchased : local) - (w.mode === m.mode ? cost : 0);
                        return round(pool) >= round(wp * wv.price * (workerAffected ? tokenRate : 1));
                    });
                    if (!ready)
                        continue;
                }
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
                if (s.campaign) {s.campaign.relations[a.id]!.xp++;if(c.campaign?.maxChapter===2)s.campaign.relations[a.id]!.stress=clamp(s.campaign.relations[a.id]!.stress+4);}
                a.energy = clamp(a.energy - (s.absoluteSlot % 4 === 3 ? 22.5 : s.absoluteSlot % 4 === 2 ? 18 : 15));
                a.mood = clamp(a.mood - (s.absoluteSlot % 4 === 3 ? 20 : s.absoluteSlot % 4 === 2 ? 10 : 1));
                a.load++;
                if (m.role === 'tool') toolReady = true;
                if (m.role === 'planner')
                    bonus = 1 + v.skills.reason * 0.015;
                if (m.role === 'worker' || m.role === 'planner') {
                    const delivered = Math.min(units, Math.max(0, j.work - j.progress));
                    j.progress = round(j.progress + delivered);
                    j.weighted = round(j.weighted + delivered * matching);
                    if (m.role === 'worker' && draw(s, 'quality') < 0.25 * (owns(s, 'rag') ? 1 - .25 * (toolReady ? 2 : 1) : 1) * (owns(s, 'search') && tRecall(c, j) ? 1 - .2 * (toolReady ? 2 : 1) : 1) * (1 - v.stability / 10) * (energy === 0.6 ? 1.5 : 1) * (overloaded ? 1.5 : 1))
                        j.defects++;
                }
                if (m.role === 'reviewer') {
                    j.reviewCoverage = round(j.reviewCoverage + (j.progress - progressBefore) * matching * 10);
                    const defects = j.defects;
                    for (let n = 0; n < defects; n++)
                        if (draw(s, 'quality') < Math.min(1, 0.4 + 0.05 * v.skills.reason + (owns(s, 'autotest') ? .15 : 0))) {
                            j.defects--;
                            j.work += 5;
                        }
                }
            }
            j.review = round(j.reviewCoverage / Math.max(1, j.progress));
            if (j.progress >= j.work) {
                j.status = 'review';
                j.quality = clamp(100 * j.weighted / Math.max(1, j.progress) + j.review + j.qualityBonus - 8 * j.hidden - 6 * j.defects + (draw(s, 'quality') * 10 - 5));
                events.push({ type: 'Ready', message: `${j.id} 待交付，质量 ${j.quality}` });
            }
        }
    for (const id of s.overtime) {
        const a = s.actors.find(a => a.id === id)!;
        a.lastOvertimeSlot = s.absoluteSlot;
        if (!worked.has(id)) {
            a.energy = clamp(a.energy - (s.absoluteSlot % 4 === 3 ? 22.5 : 18));
            a.mood = clamp(a.mood - (s.absoluteSlot % 4 === 3 ? 20 : 10));
            worked.add(id);
        }
    }
    for (const a of s.actors)
        if (!worked.has(a.id) && a.busyUntil <= s.absoluteSlot) {
            const eveningWorked = a.lastOvertimeSlot === s.absoluteSlot - 1;
            a.energy = clamp(a.energy + (s.absoluteSlot % 4 === 3 ? (eveningWorked ? 30 : 60) : 15));
            if (s.absoluteSlot % 4 === 3) a.mood = clamp(a.mood + 3);
            if (s.absoluteSlot % 4 === 3)
                a.load = 0;
        }
    if (c.campaign?.maxChapter===2 && s.campaign) for(const a of s.actors){const r=s.campaign.relations[a.id]!;r.hunger=clamp(r.hunger+3);if(!worked.has(a.id)&&s.absoluteSlot%4===3)r.stress=clamp(r.stress-8);if(s.absoluteSlot%4===3&&(r.hunger>=80||r.stress>=80))a.mood=clamp(a.mood-5);}
    s.absoluteSlot++;
    for (const j of s.jobs)
        if (j.status === 'waiting' && s.absoluteSlot >= j.resumeAt)
            j.status = 'working';
    s.overtime = [];
    s.pending = null;
    for (const j of s.jobs)
        if (active(j) && s.absoluteSlot > j.deadline + Math.floor(j.duration / 2))
            breach(s, c, j);
    if (s.absoluteSlot % 4 === 0) {
        s.quota = (s.absoluteSlot >= 8 ? balance(c).upgradedQuota : balance(c).dailyQuota) + (owns(s,'tokenbank') ? Math.floor(s.quota*.2) : 0) + [0,120,300][s.campaign?.subscription ?? 0]!;
        if (liquidCash(s) < 0)
            for (const a of s.actors)
                a.mood = clamp(a.mood - 5);
        refill(s, c);
        events.push({ type: 'DayEnd', message: '日结：配额刷新' });
    }
    if (s.absoluteSlot % 28 === 0) {
        money(s, -balance(c).weekly - s.electricity - [0,120,420][s.campaign?.subscription ?? 0]!, 'weekly');
        if (s.loan > 0)
            money(s, -round(s.loan * balance(c).interest), 'loan-interest');
        s.reputation = Math.floor(s.reputation * 0.98);
        s.electricity = 0;
        events.push({ type: 'WeekEnd', message: '周结：房租、订阅、电费' });
    }
    if (s.absoluteSlot >= balance(c).debtSlot && !s.debtPaid) {
        money(s, -balance(c).debt, 'inherited-debt');
        s.debtPaid = true;
    }
    events.push({ type: 'SlotResolved', message: `进入时段 ${s.absoluteSlot}` });
}
function parse(input: unknown): Command {
    requireRule(typeof input === 'object' && input !== null && !Array.isArray(input), 'INVALID_COMMAND');
    const v = input as Record<string, unknown>;
    const t = v.type;
    requireRule(typeof t === 'string' && ['campaign', 'overtime', 'restart', 'loan', 'repay', 'advance', 'choose', 'buy', 'accept', 'reject', 'deliver', 'rework', 'clarify', 'respond', 'assign'].includes(t), 'UNSUPPORTED_COMMAND');
    if (t === 'campaign') return parseCampaign(v);
    if (t === 'overtime') {
        requireRule(typeof v.character === 'string', 'INVALID_ACTOR');
        return { type: t, character: v.character };
    }
    if (t === 'restart')
        return { type: t };
    if (t === 'loan' || t === 'repay') {
        requireRule(typeof v.amount === 'number' && Number.isSafeInteger(v.amount) && v.amount > 0, 'INVALID_NUMBER');
        return { type: t, amount: v.amount };
    }
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
    if (t === 'clarify' || t === 'respond') {
        requireRule(typeof v.character === 'string', 'INVALID_ACTOR');
        return { type: t, job: v.job, character: v.character };
    }
    if (t === 'assign') {
        requireRule(Array.isArray(v.team) && v.team.length > 0 && v.team.length <= 6, 'INVALID_TEAM');
        const team: Member[] = v.team.map((x: unknown) => { requireRule(typeof x === 'object' && x !== null, 'INVALID_MEMBER'); const m = x as Record<string, unknown>; requireRule(typeof m.character === 'string' && (m.role === 'worker' || m.role === 'reviewer' || m.role === 'planner' || m.role === 'tool') && (m.mode === 'cloud' || m.mode === 'local'), 'INVALID_MEMBER'); return { character: m.character, role: m.role, mode: m.mode }; });
        return { type: t, job: v.job, team };
    }
    throw Error('UNSUPPORTED_COMMAND');
}
export function dispatchCommand(original: State, input: unknown, c: Content): Result {
    const events: DomainEvent[] = [];
    try {
        const cmd = parse(input);
        requireRule(!original.bankrupt || cmd.type === 'restart', 'BANKRUPT');
        requireRule(original.engineVersion === engineVersion && original.contentVersion === c.version, 'VERSION_MISMATCH');
        requireRule(!original.pending || cmd.type === 'choose', 'PENDING_CHOICE');
        if (cmd.type === 'restart') {
            requireRule(original.bankrupt, 'NOT_BANKRUPT');
            const fresh = createInitialState(c, original.seed);
            fresh.runs = original.runs + 1;
            fresh.discovered = [...original.discovered];
            fresh.founderXP = original.founderXP + Math.floor(original.peakReputation / 10);
            if (fresh.campaign) fresh.campaign.research = fresh.founderXP;
            return { state: fresh, events: [{ type: 'Restarted', message: '保留图鉴和创始人经验，工作室重新开张' }], error: null };
        }
        const s: State = { ...original, ...(original.campaign ? { campaign: cloneCampaign(original.campaign) } : {}), overtime: [...original.overtime], rng: { ...original.rng }, actors: original.actors.map(a => ({ ...a })), jobs: original.jobs.map(j => ({ ...j, team: j.team.map(m => ({ ...m })) })), pending: original.pending ? { ...original.pending } : null, ledger: [...original.ledger], resources: [...original.resources], crises: [...original.crises], discovered: [...original.discovered], eventLast: { ...original.eventLast }, eventHistory: [...original.eventHistory] };
        if (cmd.type === 'campaign') applyCampaign(s, c, cmd);
        else if (cmd.type === 'advance') {
            const cards = c.events.map(source => source.trigger === 'bluewhale-cloud' && s.campaign ? {...source,weight:(source.weight ?? 1) * .9 ** s.campaign.hardware.network} : source).map(card => ({ card, jobs: s.jobs.filter(j => eligible(s, c, card, j)) })).filter(x => x.jobs.length);
            if (cards.length && (s.absoluteSlot % 4 < 2 || s.overtime.length) && draw(s, 'event') < balance(c).eventChance) {
                let pick = draw(s, 'event') * cards.reduce((n, x) => n + (x.card.weight ?? 1), 0);
                let chosen = cards[0]!;
                for (const x of cards) {
                    pick -= x.card.weight ?? 1;
                    if (pick < 0) {
                        chosen = x;
                        break;
                    }
                }
                const job = chosen.jobs[Math.floor(draw(s, 'event') * chosen.jobs.length)]!;
                s.pending = { card: chosen.card.id, slot: s.absoluteSlot, job: job.id };
                events.push({ type: 'PendingChoice', message: chosen.card.title });
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
            money(s, -choice.cost, `event:${card.id}:${s.pending.job ?? ''}`);
            const job = s.jobs.find(j => j.id === s.pending!.job) || s.jobs.find(j => j.status === 'working');
            const effects = (choice.effects ?? []).filter(e => !(e.kind === 'reset' && (owns(s,'versioncontrol') || (owns(s, 'sandbox') && card.id === 'delete'))) && !(owns(s,'filter') && card.id === 'injection' && e.kind === 'cashPercent')).map(e => e.kind === 'compact' && owns(s, 'compact') ? {...e,value:0} : e);
            const rate = job ? applyEffects(s, job, effects) : 1;
            s.eventLast[card.id] = s.absoluteSlot;
            s.eventHistory.push({ slot: s.absoluteSlot, card: card.id, job: job?.id ?? '' });
            if (!s.discovered.includes(card.id))
                s.discovered.push(card.id);
            resolve(s, c, events, choice.multiplier, card.trigger === 'bluewhale-cloud' ? 'bluewhale' : undefined, job?.id, rate);
        }
        else if (cmd.type === 'overtime') {
            requireRule(s.absoluteSlot % 4 >= 2, 'NOT_LIFE_SLOT');
            requireRule(s.actors.some(a => a.id === cmd.character && a.energy >= 10 && a.busyUntil <= s.absoluteSlot) && s.jobs.some(j => j.status === 'working' && j.team.some(m => m.character === cmd.character)), 'NO_ACTIVE_ACTOR');
            requireRule(!s.overtime.includes(cmd.character), 'ALREADY_OVERTIME');
            s.overtime.push(cmd.character);
        }
        else if (cmd.type === 'loan') {
            requireRule(s.loan + cmd.amount <= balance(c).loanLimit, 'LOAN_LIMIT');
            s.loan += cmd.amount;
            money(s, cmd.amount, 'loan');
            const week = Math.floor(s.absoluteSlot / 28);
            if (liquidCash(s) < 0 && s.loanGraceWeek !== week) {
                s.loanGraceWeek = week;
                s.loanGraceUntil = s.absoluteSlot + 12;
            }
        }
        else if (cmd.type === 'repay') {
            requireRule(cmd.amount <= s.loan && cmd.amount <= s.cash, 'INVALID_REPAYMENT');
            s.loan -= cmd.amount;
            money(s, -cmd.amount, 'repay');
        }
        else if (cmd.type === 'buy') {
            requireRule(cmd.amount > 0, 'POSITIVE_AMOUNT_REQUIRED');
            requireRule(s.cash >= cmd.amount * 0.5, 'INSUFFICIENT_CASH');
            money(s, -cmd.amount * 0.5, 'buy-tokens');
            s.purchased += cmd.amount;
        }
        else {
            const j = s.jobs.find(j => j.id === cmd.job);
            requireRule(j, 'UNKNOWN_JOB');
            const t = c.commissions.find(t => t.id === j.template)!;
            if (cmd.type === 'accept') {
                requireRule(j.status === 'posted', 'NOT_POSTED');
                requireRule(j.clarifyingUntil <= s.absoluteSlot, 'STILL_CLARIFYING');
                requireRule(liquidCash(s) >= 0 || (t.workload + (t.requirements ?? []).reduce((n,r)=>n+r.work,0)) * (t.phases ?? 1) <= 40, 'CRISIS_SMALL_ONLY');
                j.status = 'accepted';
                if(t.requirements)j.work=t.workload+t.requirements.reduce((n,r)=>n+r.work,0);
                j.deadline = deadlineAfterWorkSlots(s.absoluteSlot, t.workSlots);
                j.duration = t.workSlots * 2;
                j.resumeAt = s.absoluteSlot;
                j.advance = round(t.reward * balance(c).rewardScale * (owns(s,'contract') ? .5 : .3));
                money(s, j.advance, `advance:${j.id}`);
            }
            else if (cmd.type === 'reject') {
                requireRule(j.status === 'posted', 'NOT_POSTED');
                j.status = 'rejected';
            }
            else if (cmd.type === 'clarify') {
                requireRule(s.absoluteSlot % 4 < 2, 'NOT_WORK_SLOT');
                requireRule(j.status === 'posted' && j.hidden > 0, 'NOT_CLARIFIABLE');
                const a = s.actors.find(a => a.id === cmd.character);
                requireRule(a, 'UNKNOWN_ACTOR');
                requireRule(!occupied(s, a.id) && a.energy >= 15, 'ACTOR_BUSY');
                a.busyUntil = s.absoluteSlot + 1;
                a.energy -= 15;
                if(c.campaign?.maxChapter!==2 || clarifyRoll(s)<clarifyChance(s,c,a)){const requirement=t.requirements?.[j.revealed ?? 0];j.work+=requirement?.work ?? 0;j.revealed=(j.revealed ?? 0)+1;j.hidden=Math.max(0,j.hidden-1);events.push({type:'Clarified',message:requirement?.label ?? '揭示一条隐藏要求'});}else events.push({type:'ClarificationMiss',message:'本次未揭示新要求，可再次澄清'});
                j.clarifyingUntil = s.absoluteSlot + 1;
            }
            else if (cmd.type === 'respond') {
                const a=s.actors.find(a=>a.id===cmd.character),incident=s.campaign?.incidents.find(x=>x.job===j.id&&!x.resolved&&x.at<=s.absoluteSlot&&x.deadline>=s.absoluteSlot);
                requireRule(a&&incident,'NO_INCIDENT');requireRule(!occupied(s,a.id)&&a.energy>=15,'ACTOR_BUSY');a.energy-=15;a.busyUntil=s.absoluteSlot+1;incident.resolved=true;
            }
            else if (cmd.type === 'assign') {
                requireRule(j.status === 'accepted' || j.status === 'working', 'NOT_ASSIGNABLE');
                requireRule(cmd.team.length <= (owns(s,'multiagent') ? 6 : 4), 'INVALID_TEAM');
                requireRule(new Set(cmd.team.map(m => m.character)).size === cmd.team.length, 'DUPLICATE_ACTOR');
                requireRule(cmd.team.some(m => m.role === 'worker') && cmd.team.filter(m => m.role === 'reviewer').length <= 1 && cmd.team.filter(m => m.role === 'planner').length <= 1, 'INVALID_ROLES');
                for (const m of cmd.team) {
                    const a = s.actors.find(a => a.id === m.character);
                    requireRule(a, 'UNKNOWN_ACTOR');
                    requireRule(!occupied(s, a.id, j.id), 'ACTOR_BUSY');
                    requireRule(version(c, a, s).modes.includes(m.mode), 'UNSUPPORTED_DEPLOYMENT');
                }
                requireRule(cmd.team.filter(m=>m.role==='tool').length<=1 && (!cmd.team.some(m=>m.role==='tool')||owns(s,'mcp')), 'TOOL_LOCKED');
                j.team = cmd.team;
                j.status = 'working';
            }
            else if (cmd.type === 'deliver') {
                requireRule(j.status === 'review', 'NOT_READY');
                if (j.quality < (t.qualityLines?.[0] ?? 60)) {
                    requireRule(j.reworked || s.absoluteSlot > j.deadline, 'REWORK_AVAILABLE');
                    breach(s, c, j);
                }
                else {
                    const multiplier = j.quality >= (t.qualityLines?.[2] ?? 90) ? 1.35 : j.quality >= (t.qualityLines?.[1] ?? 75) ? 1.15 : 1;
                    const late = Math.max(0, s.absoluteSlot - j.deadline);
                    money(s, round(t.reward * balance(c).rewardScale * (owns(s,'crm') && t.delivery==='retainer' ? 1.2 : 1) * multiplier * Math.max(0, 1 - late * 0.1)) - j.advance, `delivery:${j.id}`);
                    s.reputation += j.quality >= (t.qualityLines?.[2] ?? 90) ? 4 : j.quality >= (t.qualityLines?.[1] ?? 75) ? 2 : 1;
                    if(c.campaign?.maxChapter===2 && s.campaign && draw(s,'quality') < Math.min(.9,j.defects*.3+(t.delivery==='retainer'?.2:0))){const at=s.absoluteSlot+28+(draw(s,'quality')<.5?0:28);s.campaign.incidents.push({job:j.id,at,deadline:at+2,resolved:false});}
                    j.phase++;
                    if (j.phase < (t.phases ?? 1)) {
                        j.status = t.delivery === 'retainer' || (s.campaign && !owns(s,'ci')) ? 'waiting' : 'working';
                        j.resumeAt = t.delivery === 'retainer' ? j.resumeAt + 28 : s.absoluteSlot + (s.campaign && !owns(s,'ci') ? 1 : 0);
                        j.progress = 0;
                        j.weighted = 0;
                        j.defects = 0;
                        j.review = 0;
                        j.reviewCoverage = 0;
                        j.quality = 0;
                        j.qualityBonus = 0;
                        j.work = t.workload + (t.requirements ?? []).reduce((n,r)=>n+r.work,0);
                        j.reworked = false;
                        j.advance = 0;
                        j.deadline = deadlineAfterWorkSlots(j.resumeAt, t.workSlots);
                        j.duration = t.workSlots * 2;
                    }
                    else
                        j.status = 'delivered';
                }
            }
            else if (cmd.type === 'rework') {
                requireRule(j.status === 'review' && j.quality < (t.qualityLines?.[0] ?? 60) && !j.reworked && s.absoluteSlot <= j.deadline, 'NO_REWORK');
                j.reworked = true;
                j.hidden = 0;
                j.defects = 0;
                j.work = round(j.work + t.workload * 0.2);
                j.status = 'working';
            }
        }
        if(s.campaign)for(const incident of s.campaign.incidents){if(!incident.resolved && s.absoluteSlot>incident.deadline){incident.resolved=true;money(s,-150,'sla-penalty:'+incident.job);s.reputation=Math.max(0,s.reputation-3);}}
        tickCampaign(s);
        crisis(s, c);
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
    let cloudBudget=s.quota+s.purchased,localBudget=s.localCapacity;
    const possibleStops:string[]=[];
    for(const j of s.jobs.filter(j=>j.status==='working'))for(const m of estimateResources(s,c,j).members){if(m.mode==='cloud'){if(cloudBudget<m.cost)possibleStops.push(m.character);else cloudBudget-=m.cost;}else{if(localBudget<m.cost)possibleStops.push(m.character);else localBudget-=m.cost;}}
    const card = s.pending ? c.events.find(e => e.id === s.pending!.card) : null;
    return { possibleStops, campaign: s.campaign ? cloneCampaign(s.campaign) : null, catalog: c.campaign ? { ...c.campaign, stories: c.campaign.stories?.map(x=>({...x,choices:x.choices.map(o=>({...o}))})) ?? [], initial: [...c.campaign.initial], recruits: c.campaign.recruits.map(x => ({...x})), software: c.campaign.software.map(x => ({...x, requires: [...x.requires]})), versions: c.versions.map(v => ({ id: v.id, character: v.character, name: v.name, skills: {...v.skills}, price: v.price, speed: v.speed })) } : null, liquidCash: liquidCash(s), overtime: [...s.overtime], loanGraceUntil: s.loanGraceUntil ?? 0, crisisLength: balance(c).crisisLength, absoluteSlot: s.absoluteSlot, day: Math.floor(s.absoluteSlot / 4) + 1, slot: ['上午', '下午', '晚上', '深夜'][s.absoluteSlot % 4], cash: s.cash, quota: s.quota, purchased: s.purchased, localCapacity: s.localCapacity, electricity: s.electricity, loan: s.loan, crises: s.crises.length, reputation: s.reputation, founderXP: s.founderXP, nextWeeklyBill: balance(c).weekly + [0,120,420][s.campaign?.subscription ?? 0]! + s.electricity + round(s.loan * balance(c).interest), debtDue: s.debtPaid ? 0 : balance(c).debt, debtSlot: balance(c).debtSlot, bankrupt: s.bankrupt, crisisSince: s.crisisSince, actors: s.actors.map(a => ({ ...a, clarifyChance: c.campaign?.maxChapter===2 ? clarifyChance(s,c,a) : 1, location: actorScene(s, a), busy: occupied(s, a.id), skills: { ...version(c, a, s).skills }, price: version(c, a, s).price, modes: [...version(c, a, s).modes] })), jobs: s.jobs.filter(j => !['expired', 'rejected'].includes(j.status)).map(j => { const t = c.commissions.find(t => t.id === j.template)!; return { ...j, title: t.title, titleEn: t.titleEn ?? t.title, description: t.description, descriptionEn: t.descriptionEn ?? t.description, revealedRequirements: (t.requirements ?? []).slice(0,j.revealed ?? 0).map(r=>({...r})), weights: { ...t.weights }, reward: round(t.reward * balance(c).rewardScale), delivery: t.delivery, phases: t.phases ?? 1, workSlots: t.workSlots, clarity: t.clarity, passQuality: t.qualityLines?.[0] ?? 60, qualityLines: [...(t.qualityLines ?? [60, 75, 90])], resourceEstimate: estimateResources(s, c, j), qualityBreakdown: { base: round(100 * j.weighted / Math.max(1, j.progress)), review: j.review, event: j.qualityBonus, hiddenPenalty: 8 * j.hidden, defectPenalty: 6 * j.defects }, overdue: active(j) && s.absoluteSlot > j.deadline, team: j.team.map(m => ({ ...m })) }; }), pending: card ? { ...card, choices: card.choices.map(x => ({ ...x, ...(x.effects ? { effects: x.effects.map(e => ({ ...e })) } : {}) })) } : null, ledger: s.ledger.slice(-10).map(x => ({ ...x })), resources: s.resources.slice(-10).map(x => ({ ...x })) };
}
