import { test, expect } from 'vitest';
import { loadContent, validateContent } from 'oot-content';
import { createInitialState, dispatchCommand, getViewModel } from 'oot-core';
import type { Content } from 'oot-core';
import { hash, save, restore } from 'oot-persistence';
import { parseLine, render } from './src/console.js';
function fixture(): Content {
    const c = loadContent();
    c.events = [];
    c.commissions = [{ ...c.commissions[0]!, workload: 4, workSlots: 4, clarity: 100 }];
    for (const v of c.versions) {
        v.skills = { code: 8, write: 8, reason: 8, create: 8, media: 8, recall: 8 };
        v.stability = 10;
        v.speed = 1;
        v.rhythm = [1, 1, 1, 1];
    }
    return c;
}
function session(c = fixture()) {
    let state = createInitialState(c, 19);
    const commands: unknown[] = [];
    return { c, get state() { return state; }, commands, send(cmd: unknown) { const r = dispatchCommand(state, cmd, c); expect(r.error).toBeNull(); state = r.state; commands.push(cmd); return r; } };
}
const worker = { character: 'qwen', role: 'worker', mode: 'cloud' };
test('accept, assign, deliver and terminal operations are exactly once', () => {
    const x = session();
    x.send({ type: 'accept', job: '0-0' });
    expect(x.state.cash).toBe(5150);
    x.send({ type: 'assign', job: '0-0', team: [worker] });
    x.send({ type: 'advance' });
    expect(x.state.jobs[0]!.status).toBe('review');
    expect(x.state.resources).toHaveLength(1);
    expect(x.state.resources[0]!.units).toBe(28);
    expect(x.state.quota).toBe(272);
    x.send({ type: 'deliver', job: '0-0' });
    expect(x.state.cash).toBe(5575);
    for (const type of ['deliver', 'accept', 'rework', 'reject']) {
        const r = dispatchCommand(x.state, { type, job: '0-0' }, x.c);
        expect(r.error).toBeTruthy();
        expect(r.state).toBe(x.state);
    }
});
test('failed quality can be reworked once and delivered after hidden penalties clear', () => {
    const c = fixture();
    c.commissions[0]!.clarity = 0;
    const x = session(c);
    x.send({ type: 'accept', job: '0-0' });
    x.send({ type: 'assign', job: '0-0', team: [worker] });
    x.send({ type: 'advance' });
    expect(x.state.jobs[0]!.quality).toBeLessThan(60);
    expect(dispatchCommand(x.state, { type: 'deliver', job: '0-0' }, c).error).toBe('REWORK_AVAILABLE');
    x.send({ type: 'rework', job: '0-0' });
    expect(x.state.jobs[0]!.work).toBe(4.8);
    x.send({ type: 'advance' });
    expect(x.state.jobs[0]!.quality).toBeGreaterThanOrEqual(60);
    x.send({ type: 'deliver', job: '0-0' });
    expect(x.state.jobs[0]!.status).toBe('delivered');
    expect(x.state.resources.reduce((n, r) => n + r.units, 0)).toBe(33.6);
});
test('clarification occupies a slot without starting deadline, rejects repeated use', () => {
    const c = fixture();
    c.commissions[0]!.clarity = 20;
    const x = session(c);
    x.send({ type: 'clarify', job: '0-0', character: 'qwen' });
    expect(x.state.jobs[0]!.deadline).toBe(0);
    expect(dispatchCommand(x.state, { type: 'clarify', job: '0-1', character: 'qwen' }, c).error).toBe('ACTOR_BUSY');
    x.send({ type: 'advance' });
    x.send({ type: 'accept', job: '0-0' });
    expect(x.state.jobs[0]!.deadline).toBe(9);
    x.send({ type: 'assign', job: '0-0', team: [worker] });
});
test('reject is free and listings expire on the next morning', () => {
    const x = session();
    x.send({ type: 'reject', job: '0-0' });
    expect(x.state.cash).toBe(5000);
    for (let i = 0; i < 4; i++)
        x.send({ type: 'advance' });
    expect(x.state.jobs[1]!.status).toBe('expired');
    expect(x.state.jobs.filter(j => j.status === 'posted')).toHaveLength(3);
});
test('overdue unstaffed commission breaches once and refunds advance plus penalty', () => {
    const x = session();
    x.send({ type: 'accept', job: '0-0' });
    const end = x.state.jobs[0]!.deadline + Math.floor(x.state.jobs[0]!.duration / 2);
    while (x.state.absoluteSlot <= end)
        x.send({ type: 'advance' });
    expect(x.state.jobs[0]!.status).toBe('breached');
    expect(x.state.cash).toBe(4850);
    x.send({ type: 'advance' });
    expect(x.state.ledger.filter(l => l.reason === 'breach:0-0')).toHaveLength(1);
});
test('quota precedes purchased balance, purchased balance survives the night', () => {
    const x = session();
    x.send({ type: 'buy', amount: 100 });
    x.send({ type: 'accept', job: '0-0' });
    x.send({ type: 'assign', job: '0-0', team: [worker] });
    x.send({ type: 'advance' });
    expect(x.state.resources[0]!.quota).toBe(28);
    expect(x.state.resources[0]!.purchased).toBe(0);
    while (x.state.absoluteSlot < 4)
        x.send({ type: 'advance' });
    expect(x.state.quota).toBe(300);
    expect(x.state.purchased).toBe(100);
});
test('partially validated team fails with no mutation or output', () => {
    const x = session();
    x.send({ type: 'accept', job: '0-0' });
    const before = hash(x.state);
    const r = dispatchCommand(x.state, { type: 'assign', job: '0-0', team: [worker, { ...worker, character: 'missing' }] }, x.c);
    expect(r.error).toBe('ACTOR_BUSY');
    expect(r.state).toBe(x.state);
    expect(r.events).toEqual([]);
    expect(hash(x.state)).toBe(before);
});
test('reviewer sees all current-slot defects regardless of actor id', () => {
    const c = fixture();
    c.versions.find(v => v.character === 'bluewhale')!.skills.reason = 10;
    const x = session(c);
    x.send({ type: 'accept', job: '0-0' });
    x.send({ type: 'assign', job: '0-0', team: [worker, { character: 'bluewhale', role: 'reviewer', mode: 'cloud' }] });
    x.state.jobs[0]!.defects = 2;
    x.send({ type: 'advance' });
    expect(x.state.resources.map(r => r.character)).toEqual(['qwen', 'bluewhale']);
    expect(x.state.jobs[0]!.defects).toBeLessThan(2);
    expect(x.state.jobs[0]!.work).toBeGreaterThan(4);
});
test('local deployment never draws cloud busy event', () => {
    const c = fixture();
    c.events = [loadContent().events[0]!];
    for (let seed = 1; seed <= 50; seed++) {
        let s = createInitialState(c, seed);
        for (const cmd of [{ type: 'accept', job: '0-0' }, { type: 'assign', job: '0-0', team: [{ character: 'bluewhale', role: 'worker', mode: 'local' }] }, { type: 'advance' }])
            s = dispatchCommand(s, cmd, c).state;
        expect(s.pending).toBeNull();
        expect(s.absoluteSlot).toBe(1);
    }
});
test('busy event pauses only affected cloud actor, and charges choice once', () => {
    const c = fixture();
    c.events = loadContent().events;
    const x = session(c);
    x.send({ type: 'accept', job: '0-0' });
    x.send({ type: 'assign', job: '0-0', team: [worker, { character: 'bluewhale', role: 'worker', mode: 'cloud' }] });
    x.state.pending = { card: 'busy', slot: 0 };
    x.send({ type: 'choose', index: 0 });
    expect(x.state.resources.map(r => r.character)).toEqual(['qwen']);
    expect(x.state.jobs[0]!.progress).toBe(4);
    expect(dispatchCommand(x.state, { type: 'choose', index: 0 }, c).error).toBe('NO_PENDING_CHOICE');
});
test('restore and uninterrupted execution have identical future state and events', () => {
    const x = session();
    x.send({ type: 'accept', job: '0-0' });
    x.send({ type: 'assign', job: '0-0', team: [worker] });
    let restored = restore(x.c, save(x.c, 19, x.commands, x.state)).state;
    for (let i = 0; i < 32; i++) {
        const next = dispatchCommand(restored, { type: 'advance' }, x.c);
        const live = x.send({ type: 'advance' });
        expect(next.events).toEqual(live.events);
        expect(hash(next.state)).toBe(hash(x.state));
        restored = next.state;
    }
});
test('schema rejects unescapable events and dangling trigger references', () => {
    const c = loadContent();
    expect(() => validateContent({ ...c, events: [{ ...c.events[0], choices: [{ label: 'pay', cost: 1, multiplier: 1 }] }] })).toThrow();
    expect(() => validateContent({ ...c, versions: c.versions.filter(v => v.character !== 'bluewhale') })).toThrow('EVENT_REFERENCE');
});
test('CLI grammar rejects malformed numbers, extra arguments and partial teams', () => {
    for (const input of ['buy', 'choose -1', 'buy 1e3', 'advance extra', 'assign 0-0 qwen:worker:cloud:extra'])
        expect(() => parseLine(input)).toThrow();
    expect(parseLine('assign 0-0 qwen')).toEqual({ type: 'assign', job: '0-0', team: [worker] });
});
test('decision view exposes reward, weights, deadline, roles and bills without references', () => {
    const c = loadContent(), s = createInitialState(c);
    const before = hash(s);
    const vm = getViewModel(s, c);
    expect(render(s, c)).toContain('报酬');
    expect(render(s, c)).toContain('权重');
    expect(render(s, c)).toContain('周结');
    vm.actors[0]!.skills.code = 999;
    vm.jobs[0]!.weights.code = 999;
    expect(hash(s)).toBe(before);
    expect(c.versions[0]!.skills.code).toBe(7);
});
test('old engine saves are explicitly rejected rather than silently reinterpreted', () => {
    const x = session();
    const old = JSON.parse(save(x.c, 19, [], x.state));
    old.engineVersion = '0.1.0';
    expect(() => restore(x.c, JSON.stringify(old))).toThrow('INCOMPATIBLE_SAVE');
});
test('paid choice and resources are not charged twice after reload', () => {
    const c = fixture();
    c.events = [loadContent().events[0]!];
    let found = false;
    for (let seed = 1; seed < 100 && !found; seed++) {
        let s = createInitialState(c, seed);
        const commands: unknown[] = [{ type: 'accept', job: '0-0' }, { type: 'assign', job: '0-0', team: [{ ...worker, character: 'bluewhale' }] }, { type: 'advance' }];
        for (const cmd of commands)
            s = dispatchCommand(s, cmd, c).state;
        if (!s.pending)
            continue;
        found = true;
        const choice = { type: 'choose', index: 1 };
        const r = dispatchCommand(restore(c, save(c, seed, commands, s)).state, choice, c);
        expect(r.error).toBeNull();
        const loaded = restore(c, save(c, seed, [...commands, choice], r.state)).state;
        expect(loaded.ledger.filter(l => l.reason === 'event:busy')).toHaveLength(1);
        expect(loaded.resources).toHaveLength(1);
        const retry = dispatchCommand(loaded, choice, c);
        expect(retry.state).toBe(loaded);
        expect(retry.error).toBe('NO_PENDING_CHOICE');
    }
    expect(found).toBe(true);
});
