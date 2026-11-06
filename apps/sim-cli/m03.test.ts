import { test, expect } from 'vitest';
import { loadContent, validateContent } from 'oot-content';
import { createInitialState, dispatchCommand, getViewModel } from 'oot-core';
import type { Content, State } from 'oot-core';
import { save, restore, hash } from 'oot-persistence';
import { parseLine } from './src/console.js';
function fixture(delivery: 'oneshot' | 'multi' | 'retainer' = 'oneshot'): Content {
    const c = loadContent();
    c.balance!.rewardScale = 1;
    c.balance!.dailyQuota = 300;
    c.balance!.upgradedQuota = 600;
    c.balance!.eventChance = 0;
    c.events = [];
    c.commissions = [{ ...c.commissions[0]!, workload: 1, workSlots: 6, qualityLines: [60, 75, 90], reward: 500, clarity: 100, delivery, phases: delivery === 'oneshot' ? 1 : 2 }];
    for (const v of c.versions) {
        v.stability = 10;
        v.skills = { code: 8, write: 8, reason: 8, create: 8, media: 8, recall: 8 };
        v.rhythm = [1, 1, 1, 1];
    }
    return c;
}
function session(c = fixture()) {
    let state = createInitialState(c, 3);
    const commands: unknown[] = [];
    const send = (cmd: unknown) => { const r = dispatchCommand(state, cmd, c); expect(r.error).toBeNull(); state = r.state; commands.push(cmd); };
    return { c, get state() { return state; }, commands, send, assign() { send({ type: 'accept', job: '0-0' }); send({ type: 'assign', job: '0-0', team: [{ character: 'qwen', role: 'worker', mode: 'cloud' }] }); } };
}
test('30 distinct templates cover six categories, four clients, and three delivery modes', () => {
    const c = loadContent();
    expect(c.commissions).toHaveLength(30);
    expect(c.events).toHaveLength(20);
    expect(c.versions).toHaveLength(4);
    expect(new Set(c.commissions.map(t => t.category)).size).toBe(6);
    expect(new Set(c.commissions.map(t => t.client)).size).toBe(4);
    expect(new Set(c.commissions.map(t => t.delivery)).size).toBe(3);
    for (const t of c.commissions) {
        expect(t.titleEn?.length).toBeGreaterThan(0);
        expect(t.description.length).toBeGreaterThan(0);
    }
});
test('multi phases pay each milestone once and advance without a second prepayment', () => {
    const x = session(fixture('multi'));
    x.assign();
    x.send({ type: 'advance' });
    x.send({ type: 'deliver', job: '0-0' });
    expect(x.state.jobs[0]!.phase).toBe(1);
    expect(x.state.jobs[0]!.status).toBe('working');
    expect(x.state.jobs[0]!.advance).toBe(0);
    x.send({ type: 'advance' });
    x.send({ type: 'deliver', job: '0-0' });
    expect(x.state.jobs[0]!.status).toBe('delivered');
    expect(x.state.cash).toBe(6150);
    expect(x.state.ledger.filter(l => l.reason === 'advance:0-0')).toHaveLength(1);
    expect(x.state.ledger.filter(l => l.reason === 'delivery:0-0')).toHaveLength(2);
});
test('retainer reserves staff, resumes at a weekly boundary, and restores identically', () => {
    const x = session(fixture('retainer'));
    x.assign();
    x.send({ type: 'advance' });
    x.send({ type: 'deliver', job: '0-0' });
    expect(x.state.jobs[0]!.resumeAt).toBe(28);
    expect(x.state.jobs[0]!.status).toBe('waiting');
    const resources = x.state.resources.length;
    x.send({ type: 'accept', job: '0-1' });
    expect(dispatchCommand(x.state, { type: 'assign', job: '0-1', team: [{ character: 'qwen', role: 'worker', mode: 'cloud' }] }, x.c).error).toBe('ACTOR_BUSY');
    while (x.state.absoluteSlot < 28)
        x.send({ type: 'advance' });
    expect(x.state.resources.length).toBe(resources);
    const restored = restore(x.c, save(x.c, 3, x.commands, x.state)).state;
    const next = dispatchCommand(restored, { type: 'advance' }, x.c);
    x.send({ type: 'advance' });
    expect(hash(next.state)).toBe(hash(x.state));
    expect(x.state.jobs[0]!.status).toBe('review');
});
test('loan ceiling, weekly interest, repayment and error rollback', () => {
    const x = session();
    x.send({ type: 'loan', amount: 1000 });
    expect(x.state.loan).toBe(1000);
    expect(dispatchCommand(x.state, { type: 'loan', amount: 5000 }, x.c).error).toBe('LOAN_LIMIT');
    while (x.state.absoluteSlot < 28)
        x.send({ type: 'advance' });
    expect(x.state.cash).toBe(3650);
    expect(x.state.ledger.filter(l => l.reason === 'loan-interest')).toHaveLength(1);
    x.send({ type: 'repay', amount: 1000 });
    expect(x.state.cash).toBe(2650);
    expect(x.state.loan).toBe(0);
    expect(dispatchCommand(x.state, { type: 'repay', amount: 1 }, x.c).state).toBe(x.state);
});
test('three consecutive crisis windows bankrupt; restart retains discovered cards and experience', () => {
    const x = session();
    x.state.cash = -1;
    x.state.peakReputation = 30;
    x.state.discovered = ['busy'];
    while (!x.state.bankrupt)
        x.send({ type: 'advance' });
    expect(x.state.crises).toHaveLength(3);
    expect(x.state.absoluteSlot).toBe(25);
    x.send({ type: 'restart' });
    expect(x.state.cash).toBe(5000);
    expect(x.state.loan).toBe(0);
    expect(x.state.founderXP).toBe(3);
    expect(x.state.discovered).toEqual(['busy']);
    expect(x.state.runs).toBe(2);
    expect(dispatchCommand(x.state, { type: 'restart' }, x.c).error).toBe('NOT_BANKRUPT');
});
test('a loan can rescue cash crisis; mood and reputation fall on continued crises', () => {
    const x = session();
    x.state.cash = -500;
    x.state.reputation = 50;
    x.send({ type: 'advance' });
    expect(x.state.crisisSince).not.toBeNull();
    x.send({ type: 'loan', amount: 1000 });
    expect(x.state.crisisSince).toBeNull();
    expect(x.state.bankrupt).toBe(false);
    x.state.cash = -500;
    x.send({ type: 'advance' });
    expect(x.state.reputation).toBe(40);
});
test('overtime costs energy and mood once; sleeping clears context', () => {
    const c = fixture();
    c.commissions[0]!.workload = 100;
    const x = session(c);
    x.assign();
    x.send({ type: 'advance' });
    x.send({ type: 'advance' });
    const actor = x.state.actors.find(a => a.id === 'qwen')!;
    const energy = actor.energy, mood = actor.mood;
    x.send({ type: 'overtime', character: 'qwen' });
    expect(dispatchCommand(x.state, { type: 'overtime', character: 'qwen' }, c).error).toBe('ALREADY_OVERTIME');
    x.send({ type: 'advance' });
    const after = x.state.actors.find(a => a.id === 'qwen')!;
    expect(after.energy).toBe(energy - 18);
    expect(after.mood).toBe(mood - 10);
    expect(x.state.overtime).toEqual([]);
    x.send({ type: 'advance' });
    expect(x.state.actors.find(a => a.id === 'qwen')!.load).toBe(0);
});
test('20 cards each reach a pending choice through dispatch and all choices resolve once', () => {
    const full = loadContent();
    for (const card of full.events) {
        const c = fixture();
        c.events = [card];
        c.balance!.eventChance = 1;
        const t = c.commissions[0]!;
        t.workload = 100;
        t.workSlots = 20;
        t.category = card.trigger === 'code' || card.trigger === 'data' || card.trigger === 'research' ? card.trigger : 'code';
        t.client = 'novice';
        if (card.trigger === 'multi') {
            t.delivery = 'multi';
            t.phases = 2;
        }
        const x = session(c);
        x.send({ type: 'accept', job: '0-0' });
        x.send({ type: 'assign', job: '0-0', team: [{ character: 'bluewhale', role: 'worker', mode: 'cloud' }] });
        // Boundary fixture for a long continuous work session; separate overtime tests exercise natural load growth.
        if (card.trigger === 'overload')
            x.state.actors.find(a => a.id === 'bluewhale')!.load = 8;
        x.send({ type: 'advance' });
        expect(x.state.pending?.card, card.id).toBe(card.id);
        for (let i = 0; i < card.choices.length; i++) {
            const before = hash(x.state);
            const r = dispatchCommand(x.state, { type: 'choose', index: i }, c);
            expect(r.error, card.id).toBeNull();
            expect(r.state.absoluteSlot).toBe(1);
            expect(r.state.pending).toBeNull();
            expect(r.state.eventHistory).toHaveLength(1);
            expect(hash(x.state)).toBe(before);
            expect(dispatchCommand(r.state, { type: 'choose', index: i }, c).error).toBe('NO_PENDING_CHOICE');
        }
    }
});
test('cooldown suppresses repeated cards and events never affect unrelated jobs', () => {
    const c = fixture();
    c.events = [{ id: 'specific', title: 'Specific', trigger: 'code', cooldown: 12, choices: [{ label: 'stop', cost: 0, multiplier: 0 }] }];
    c.balance!.eventChance = 1;
    c.commissions[0]!.category = 'code';
    const x = session(c);
    x.assign();
    x.send({ type: 'accept', job: '0-1' });
    x.send({ type: 'assign', job: '0-1', team: [{ character: 'mistral', role: 'worker', mode: 'cloud' }] });
    x.send({ type: 'advance' });
    const targeted = x.state.pending!.job;
    x.send({ type: 'choose', index: 0 });
    expect(x.state.jobs.find(j => j.id === targeted)!.progress).toBe(0);
    expect(x.state.jobs.filter(j => j.progress > 0)).toHaveLength(1);
    x.send({ type: 'advance' });
    expect(x.state.pending).toBeNull();
});
test('content rejects invalid phase counts, ranges and arbitrary executable effect names', () => {
    const c = loadContent();
    expect(() => validateContent({ ...c, commissions: [{ ...c.commissions[0], phases: 2 }] })).toThrow();
    expect(() => validateContent({ ...c, balance: { ...c.balance, interest: -1 } })).toThrow();
    expect(() => validateContent({ ...c, events: [{ ...c.events[0], choices: [{ label: 'x', cost: 0, multiplier: 1, effects: [{ kind: 'eval', value: 1 }] }] }] })).toThrow();
});
test('new CLI commands parse and pending effects are detached from content', () => {
    expect(parseLine('loan 1000')).toEqual({ type: 'loan', amount: 1000 });
    expect(parseLine('repay 500')).toEqual({ type: 'repay', amount: 500 });
    expect(parseLine('restart')).toEqual({ type: 'restart' });
    expect(parseLine('overtime qwen')).toEqual({ type: 'overtime', character: 'qwen' });
    const c = loadContent();
    const s: State = createInitialState(c);
    s.pending = { card: 'thinking', slot: 0 };
    const before = hash(c);
    const vm = getViewModel(s, c);
    vm.pending!.choices[0]!.effects![0]!.value = 99;
    expect(hash(c)).toBe(before);
});
test('context event is reachable through natural continuous overtime commands', () => {
    const c = fixture();
    c.commissions[0]!.workload = 200;
    c.commissions[0]!.workSlots = 20;
    c.events = [loadContent().events.find(e => e.id === 'context')!];
    c.balance!.eventChance = 1;
    const x = session(c);
    x.send({ type: 'accept', job: '0-0' });
    x.send({ type: 'assign', job: '0-0', team: [{ character: 'mistral', role: 'worker', mode: 'cloud' }] });
    x.send({ type: 'advance' });
    x.send({ type: 'advance' });
    x.send({ type: 'overtime', character: 'mistral' });
    x.send({ type: 'advance' });
    x.send({ type: 'overtime', character: 'mistral' });
    x.send({ type: 'advance' });
    x.send({ type: 'advance' });
    expect(x.state.pending?.card).toBe('context');
});
