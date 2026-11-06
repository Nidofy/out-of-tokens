import { test, expect } from 'vitest';
import { loadAlphaContent } from 'oot-content';
import { createInitialState, dispatchCommand, getViewModel } from 'oot-core';
import { hash, save, restore } from 'oot-persistence';

test('M3-02 every character can eat at their evening location', () => {
    const c = loadAlphaContent();
    for (const id of new Set(c.versions.map(v => v.character))) {
        const s = createInitialState(c, 1);
        s.cash = 100000; s.reputation = 100;
        const recruited = s.actors.some(a => a.id === id) ? s : dispatchCommand(s, { type: 'campaign', action: 'recruit', id }, c).state;
        recruited.absoluteSlot = 2;
        recruited.campaign!.relations[id]!.hunger = 90;
        const location = getViewModel(recruited, c).actors.find(a => a.id === id)!.location;
        const before = dispatchCommand(recruited, { type: 'campaign', action: 'visit', id: location }, c).state;
        const beforeHash = hash(before);
        const result = dispatchCommand(before, { type: 'campaign', action: 'meal', id }, c);
        expect(result.error, id).toBeNull();
        expect(hash(before)).toBe(beforeHash);
        expect(result.state.cash).toBe(before.cash - 30);
        expect(result.state.campaign!.relations[id]!.hunger).toBe(40);
        expect(dispatchCommand(result.state, { type: 'campaign', action: 'meal', id }, c).error).toBe('ACTOR_BUSY');
    }
});

test('M3-02 takeaway retains scene, cash and attendance guards with atomic rejection', () => {
    const c = loadAlphaContent();
    for (const kind of ['wrong-scene', 'elsewhere', 'poor', 'busy', 'overtime'] as const) {
        const s = createInitialState(c, 1);
        s.absoluteSlot = kind === 'wrong-scene' ? 0 : 2;
        s.campaign!.scene = kind === 'wrong-scene' ? 'workshop' : kind === 'elsewhere' ? 'canteen' : 'library';
        if (kind === 'poor') s.cash = 29;
        if (kind === 'busy') s.actors.find(a => a.id === 'qwen')!.busyUntil = 3;
        if (kind === 'overtime') s.overtime = ['qwen'];
        const before = hash(s);
        const r = dispatchCommand(s, { type: 'campaign', action: 'meal', id: 'qwen' }, c);
        expect(r.error, kind).toBe({ 'wrong-scene': 'WRONG_SCENE', elsewhere: 'ACTOR_ELSEWHERE', poor: 'INSUFFICIENT_RESOURCES', busy: 'ACTOR_BUSY', overtime: 'ACTOR_BUSY' }[kind]);
        expect(r.state).toBe(s); expect(hash(s)).toBe(before);
    }
});

test('M3-02 library meal commands replay and old engine saves are refused', () => {
    const c = loadAlphaContent(); c.events = []; c.balance!.eventChance = 0;
    let s = createInitialState(c, 1);
    const commands = [{ type: 'advance' }, { type: 'advance' }, { type: 'campaign', action: 'visit', id: 'library' }, { type: 'campaign', action: 'meal', id: 'qwen' }];
    for (const cmd of commands) { const r = dispatchCommand(s, cmd, c); expect(r.error).toBeNull(); s = r.state; }
    const text = save(c, 1, commands, s);
    expect(hash(restore(c, text).state)).toBe(hash(s));
    const old = JSON.parse(text); old.engineVersion = '0.8.0';
    expect(() => restore(c, JSON.stringify(old))).toThrow('INCOMPATIBLE_SAVE');
});
