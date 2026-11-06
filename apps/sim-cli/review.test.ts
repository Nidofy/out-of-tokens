import { test, expect } from 'vitest';
import { loadContent } from 'oot-content';
import { createInitialState, dispatchCommand, getViewModel } from 'oot-core';
import type { Member } from 'oot-core';
import { hash, save, restore } from 'oot-persistence';
import { render } from './src/console.js';
function setup(team: Member[] = [{ character: 'qwen', role: 'worker', mode: 'cloud' }]) {
    const c = loadContent();
    c.events = [];
    c.balance!.eventChance = 0;
    c.balance!.dailyQuota = 10000;
    c.balance!.rewardScale = 1;
    c.commissions = [{ ...c.commissions[0]!, clarity: 100, workload: 200, workSlots: 20 }];
    for (const v of c.versions) {
        v.skills = { code: 8, write: 8, reason: 8, create: 8, media: 8, recall: 8 };
        v.speed = 1;
        v.price = 1;
        v.stability = 10;
        v.rhythm = [1, 1, 1, 1];
    }
    let s = createInitialState(c, 19);
    const send = (cmd: unknown) => { const r = dispatchCommand(s, cmd, c); expect(r.error).toBeNull(); s = r.state; };
    send({ type: 'accept', job: '0-0' });
    send({ type: 'assign', job: '0-0', team });
    return { c, send, get s() { return s; } };
}
test('GEM01 clarification blocks same-slot acceptance, rejects life slots atomically, permits next slot', () => {
    const c = loadContent();
    c.commissions = [{ ...c.commissions[0]!, clarity: 20 }];
    c.events = [];
    let s = createInitialState(c, 7);
    s = dispatchCommand(s, { type: 'clarify', job: '0-0', character: 'qwen' }, c).state;
    expect(dispatchCommand(s, { type: 'accept', job: '0-0' }, c).error).toBe('STILL_CLARIFYING');
    s = dispatchCommand(s, { type: 'advance' }, c).state;
    expect(dispatchCommand(s, { type: 'accept', job: '0-0' }, c).error).toBeNull();
    s.absoluteSlot = 3;
    const before = hash(s);
    const r = dispatchCommand(s, { type: 'clarify', job: '0-1', character: 'mistral' }, c);
    expect(r.error).toBe('NOT_WORK_SLOT');
    expect(r.state).toBe(s);
    expect(hash(s)).toBe(before);
    expect(dispatchCommand(s, { type: 'advance' }, c).state.actors.find(a => a.id === 'qwen')!.energy).toBe(100);
});
const support: Member[] = [{ character: 'qwen', role: 'worker', mode: 'cloud' }, { character: 'bluewhale', role: 'planner', mode: 'cloud' }, { character: 'llama', role: 'reviewer', mode: 'cloud' }];
test('GEM02 support roles never bill when workers are unable to work', () => {
    for (const reason of ['energy', 'tokens', 'outage']) {
        const x = setup(support);
        if (reason === 'energy')
            x.s.actors.find(a => a.id === 'qwen')!.energy = 0;
        if (reason === 'tokens')
            x.s.quota = 3;
        if (reason === 'outage') {
            x.c.events = [{ id: 'stop', title: '停', choices: [{ label: 'stop', cost: 0, multiplier: 0 }] }];
            x.s.pending = { card: 'stop', job: '0-0', slot: 0 };
        }
        x.send(reason === 'outage' ? { type: 'choose', index: 0 } : { type: 'advance' });
        expect(x.s.resources, reason).toHaveLength(0);
        expect(x.s.jobs[0]!.progress).toBe(0);
    }
});
test('GEM02 positive events boost workers without surcharging support, review coverage is proportional', () => {
    const normal = setup(support), boost = setup(support);
    boost.c.events = [{ id: 'tip', title: 'tip', choices: [{ label: 'go', cost: 0, multiplier: 1.2 }] }];
    boost.s.pending = { card: 'tip', job: '0-0', slot: 0 };
    normal.send({ type: 'advance' });
    boost.send({ type: 'choose', index: 0 });
    for (const character of ['bluewhale', 'llama'])
        expect(boost.s.resources.find(r => r.character === character)!.units).toBe(normal.s.resources.find(r => r.character === character)!.units);
    expect(boost.s.resources.find(r => r.character === 'qwen')!.units).toBeGreaterThan(normal.s.resources.find(r => r.character === 'qwen')!.units);
    const reviewed = normal.s.jobs[0]!.review;
    normal.send({ type: 'assign', job: '0-0', team: [support[0]!] });
    normal.send({ type: 'advance' });
    expect(normal.s.jobs[0]!.review).toBeLessThan(reviewed);
});
test('GEM03 context threshold uses start-of-slot load consistently', () => {
    const below = setup(), at = setup(), above = setup();
    const ctx = at.c.versions.find(v => v.character === 'qwen')!.context;
    below.s.actors.find(a => a.id === 'qwen')!.load = ctx - 1;
    at.s.actors.find(a => a.id === 'qwen')!.load = ctx;
    above.s.actors.find(a => a.id === 'qwen')!.load = ctx + 1;
    for (const x of [below, at, above])
        x.send({ type: 'advance' });
    expect(at.s.jobs[0]!.progress).toBe(below.s.jobs[0]!.progress);
    expect(above.s.jobs[0]!.progress).toBeCloseTo(at.s.jobs[0]!.progress * .7);
    expect(at.s.rng.quality).toBe(below.s.rng.quality);
});
test('GEM04 equal grace length for all acceptance slots', () => {
    const c = loadContent();
    const lengths = [];
    for (let slot = 0; slot < 4; slot++) {
        const s = createInitialState(c);
        s.absoluteSlot = slot;
        lengths.push(dispatchCommand(s, { type: 'accept', job: '0-0' }, c).state.jobs[0]!.duration);
    }
    expect(new Set(lengths).size).toBe(1);
});
test('GEM06 canonical JSON and optional content fields survive save round trip', () => {
    expect(hash({ a: 1, b: undefined })).toBe(hash({ a: 1 }));
    expect(hash([undefined, 1])).toBe(hash([null, 1]));
    const c = loadContent();
    c.commissions[0]!.titleEn = undefined;
    const s = createInitialState(c, 11);
    expect(hash(restore(c, save(c, 11, [], s)).state)).toBe(hash(s));
});
test('OPUS07 planner adds half production and OPUS08 fourth worker pays collaboration cost', () => {
    const x = setup(support);
    x.send({ type: 'advance' });
    expect(x.s.jobs[0]!.progress).toBe(4 + 8 * 1.12);
    const two = setup(support.slice(0, 2).map(m => ({ ...m, role: 'worker' }))), four = setup(loadContent().versions.map(v => ({ character: v.character, role: 'worker', mode: 'cloud' })));
    two.send({ type: 'advance' });
    four.send({ type: 'advance' });
    expect(two.s.jobs[0]!.progress).toBe(16);
    expect(four.s.jobs[0]!.progress).toBe(28.8);
});
test('OPUS06 local contention is visible and OPUS14 prepayment cannot reset a crisis', () => {
    const x = setup(support.map(m => ({ ...m, mode: 'local' })));
    x.s.localCapacity = 1;
    expect(render(x.s, x.c)).toContain('资源预警');
    expect(getViewModel(x.s, x.c).jobs[0]!.resourceEstimate.local).toBeGreaterThan(1);
    const y = setup();
    y.c.commissions[0]!.workload = 30;
    y.s.cash = -100;
    y.send({ type: 'advance' });
    const since = y.s.crisisSince;
    y.send({ type: 'accept', job: '0-1' });
    expect(y.s.cash).toBeGreaterThan(0);
    expect(y.s.crisisSince).toBe(since);
});
test('SONNET08 stale choices and invalid actor IDs roll back without consuming RNG', () => {
    const x = setup();
    x.s.pending = { card: 'missing', slot: -1 };
    const before = hash(x.s);
    expect(dispatchCommand(x.s, { type: 'choose', index: 0 }, x.c).error).toBe('STALE_CHOICE');
    expect(hash(x.s)).toBe(before);
    x.s.pending = null;
    expect(dispatchCommand(x.s, { type: 'assign', job: '0-0', team: [{ character: 'unknown', role: 'worker', mode: 'cloud' }] }, x.c).error).toBe('UNKNOWN_ACTOR');
});
