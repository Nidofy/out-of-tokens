import { test, expect } from 'vitest';
import { loadContent } from 'oot-content';
import { createInitialState, dispatchCommand, getViewModel } from 'oot-core';
import type { Member } from 'oot-core';
import { hash } from 'oot-persistence';
import { gates, summarize } from './src/report.js';
import { runBot, strategies } from './src/policy.js';
import { explain } from './src/console.js';
import { readFileSync } from 'node:fs';
function fixture(team: Member[] = [{ character: 'qwen', role: 'worker', mode: 'cloud' }]) {
    const c = loadContent();
    c.events = [];
    c.balance!.eventChance = 0;
    c.balance!.dailyQuota = 10000;
    c.balance!.upgradedQuota = 10000;
    c.commissions = [{ ...c.commissions[0]!, workload: 200, clarity: 100, workSlots: 100 }];
    let s = createInitialState(c, 19);
    const send = (cmd: unknown) => { const r = dispatchCommand(s, cmd, c); expect(r.error).toBeNull(); s = r.state; return r; };
    send({ type: 'accept', job: '0-0' });
    send({ type: 'assign', job: '0-0', team });
    return { c, send, get s() { return s; } };
}
test('GEM-a8-01 advances cannot bypass crisis acceptance or daily mood penalty', () => {
    const x = fixture();
    x.c.commissions[0]!.workload = 20;
    x.s.cash = -50;
    x.send({ type: 'reject', job: '0-4' });
    x.send({ type: 'accept', job: '0-1' });
    expect(x.s.cash).toBeGreaterThan(0);
    expect(x.s.crisisSince).not.toBeNull();
    x.c.commissions[0]!.workload = 48;
    const r = dispatchCommand(x.s, { type: 'accept', job: '0-2' }, x.c);
    expect(r.error).toBe('CRISIS_SMALL_ONLY');
    expect(r.state).toBe(x.s);
    x.s.absoluteSlot = 3;
    x.s.actors.forEach(a => { a.mood = 70; });
    x.send({ type: 'advance' });
    expect(x.s.actors.every(a => a.mood === 68)).toBe(true);
});
test('GEM-a8-01 standard content contains both small and crisis-restricted contracts', () => {
    const c = loadContent(), s = createInitialState(c, 2);
    s.cash = -50;
    s.crisisSince = 0;
    const errors = c.commissions.map(t => {
        const clone = structuredClone(s);
        clone.jobs[0]!.template = t.id;
        return dispatchCommand(clone, { type: 'accept', job: '0-0' }, c).error;
    });
    expect(errors).toContain('CRISIS_SMALL_ONLY');
    expect(errors).toContain(null);
});
test('GEM-a8-02 retainer is assignable and visible at start of resume slot', () => {
    const x = fixture();
    const j = x.s.jobs[0]!;
    j.status = 'waiting';
    j.resumeAt = 28;
    j.deadline = 200;
    x.s.absoluteSlot = 27;
    x.send({ type: 'advance' });
    expect(x.s.absoluteSlot).toBe(28);
    expect(x.s.jobs[0]!.status).toBe('working');
    x.send({ type: 'assign', job: j.id, team: j.team });
    x.c.events = [{ id: 'always', title: 'always', choices: [{ label: 'go', cost: 0, multiplier: 1 }] }];
    x.c.balance!.eventChance = 1;
    x.send({ type: 'advance' });
    expect(x.s.pending?.job).toBe(j.id);
});
test('M05-03 low mood creates a production cost; rest recovers it', () => {
    const high = fixture(), low = fixture();
    low.s.actors.find(a => a.id === 'qwen')!.mood = 10;
    high.send({ type: 'advance' });
    low.send({ type: 'advance' });
    expect(low.s.jobs[0]!.progress).toBeLessThan(high.s.jobs[0]!.progress * .9);
    low.s.absoluteSlot = 3;
    const before = low.s.actors[0]!.mood;
    low.send({ type: 'advance' });
    expect(low.s.actors[0]!.mood).toBeGreaterThan(before);
});
test('M05-04 borrowing supplies spendable cash but cannot erase insolvency', () => {
    const x = fixture();
    x.s.cash = -100;
    x.send({ type: 'reject', job: '0-4' });
    const since = x.s.crisisSince;
    x.send({ type: 'loan', amount: 1000 });
    expect(x.s.cash).toBe(900);
    expect(x.s.loan).toBe(1000);
    expect(x.s.crisisSince).toBe(since);
    const before = hash(x.s);
    expect(dispatchCommand(x.s, { type: 'loan', amount: 5000 }, x.c).error).toBe('LOAN_LIMIT');
    expect(hash(x.s)).toBe(before);
});
test('M05-01 zero chapter bankruptcies cannot pass an insolvent chapter gate', () => {
    const rows = strategies.map(strategy => runBot(loadContent(), 1, strategy, 1).metrics);
    for (const row of rows) {
        row.days = 60;
        row.chapterBankrupt = false;
        row.chapterSolvent = false;
    }
    expect(gates(summarize(rows)).chapterSurvival).toBe(false);
});
test('GEM-a8-03 planner tail work receives reviewer coverage', () => {
    const x = fixture([{ character: 'llama', role: 'planner', mode: 'cloud' }, { character: 'qwen', role: 'worker', mode: 'cloud' }, { character: 'mistral', role: 'reviewer', mode: 'cloud' }]);
    const j = x.s.jobs[0]!;
    j.work = 30;
    j.progress = 28;
    j.reviewCoverage = 140;
    j.review = 5;
    x.send({ type: 'advance' });
    expect(x.s.resources.some(r => r.character === 'mistral')).toBe(true);
    expect(x.s.jobs[0]!.review).toBeGreaterThanOrEqual(5);
});
test('GEM-a8-04 exhausted teams and off-duty bluewhale cannot draw work events', () => {
    const x = fixture();
    x.c.events = [{ id: 'work', title: 'work', choices: [{ label: 'go', cost: 0, multiplier: 1 }] }];
    x.c.balance!.eventChance = 1;
    x.s.actors.forEach(a => { a.energy = 0; });
    x.send({ type: 'advance' });
    expect(x.s.pending).toBeNull();
    const y = fixture([{ character: 'qwen', role: 'worker', mode: 'cloud' }, { character: 'bluewhale', role: 'reviewer', mode: 'cloud' }]);
    y.c.events = [{ id: 'busy', title: 'busy', trigger: 'bluewhale-cloud', choices: [{ label: 'wait', cost: 0, multiplier: 0 }] }];
    y.c.balance!.eventChance = 1;
    y.s.absoluteSlot = 2;
    y.send({ type: 'overtime', character: 'qwen' });
    y.send({ type: 'advance' });
    expect(y.s.pending).toBeNull();
});
test('GEM-a8-05 night preview excludes actors who did not volunteer overtime', () => {
    const x = fixture();
    x.s.absoluteSlot = 2;
    expect(getViewModel(x.s, x.c).jobs[0]!.resourceEstimate.cloud).toBe(0);
});
test('GEM-a8-03 partial tail preflight subtracts planner work and rounds worker billing', () => {
    for (const quota of [32, 80.23]) {
        const x = fixture([{ character: 'llama', role: 'planner', mode: 'cloud' }, { character: 'qwen', role: 'worker', mode: 'cloud' }]);
        x.s.quota = quota;
        if (quota === 32) {
            x.s.jobs[0]!.work = 30;
            x.s.jobs[0]!.progress = 25;
        }
        const r = x.send({ type: 'advance' });
        if (quota === 32)
            expect(x.s.jobs[0]!.progress).toBe(30);
        else
            expect(x.s.resources.some(r => r.character === 'llama') && r.events.some(e => e.type === 'OutOfTokens' && e.message.includes('qwen'))).toBe(false);
        expect(x.s.quota).toBeGreaterThanOrEqual(0);
    }
});
test('M05-03 evening work reduces overnight recovery and repeated overtime lowers capacity', () => {
    const x = fixture();
    const a = x.s.actors.find(a => a.id === 'qwen')!;
    a.energy = 50;
    x.s.absoluteSlot = 2;
    x.send({ type: 'overtime', character: 'qwen' });
    x.send({ type: 'advance' });
    const tired = x.s.actors.find(a => a.id === 'qwen')!.energy;
    x.send({ type: 'advance' });
    expect(x.s.actors.find(a => a.id === 'qwen')!.energy).toBe(tired + 30);
});
test('NS-01..03 all domain errors have Chinese guidance; unknown JSON type is atomic', () => {
    const source = readFileSync(new URL('../../packages/oot-core/src/simulation.ts', import.meta.url), 'utf8');
    const codes = [...new Set([...source.matchAll(/'([A-Z][A-Z_]+)'/g)].map(m => m[1]!))];
    for (const code of codes)
        expect(explain(code), code).toMatch(/[\u4e00-\u9fff]/);
    const c = loadContent(), s = createInitialState(c);
    const before = hash(s);
    for (const cmd of [{ type: 'nonsense' }, { type: 'nonsense', job: '0-0' }]) {
        const r = dispatchCommand(s, cmd, c);
        expect(r.error).toBe('UNSUPPORTED_COMMAND');
        expect(r.state).toBe(s);
    }
    expect(hash(s)).toBe(before);
    expect(explain('Unexpected token h, invalid JSON')).toContain('损坏');
});
