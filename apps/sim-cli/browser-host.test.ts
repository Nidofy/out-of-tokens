import { test, expect } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { loadContent } from 'oot-content';
import { validateContent } from 'oot-content/browser';
import { createInitialState, dispatchCommand } from 'oot-core';
import { save, restore, hash } from 'oot-persistence';
import { saveBrowser, restoreBrowser, hashBrowser } from 'oot-persistence/browser';
import { BrowserSaves, GameSession } from 'oot-platform';
import { runBot } from './src/policy.js';
test('assignment preview leaves state, command history and save bytes unchanged', async () => {
    const session = new GameSession(loadContent(), 1);
    session.send({ type: 'accept', job: '0-0' });
    const before = await session.exportSave();
    const preview = session.previewAssignment('0-0', [{ character: 'qwen', role: 'worker', mode: 'cloud' }]);
    expect(preview.error).toBeNull();
    expect(preview.estimate!.cloud).toBeGreaterThan(0);
    expect(session.previewAssignment('0-0', []).error).toBe('INVALID_TEAM');
    expect(await session.exportSave()).toBe(before);
});
test('Node and Web Crypto produce identical content, state and save envelopes', async () => {
    const c = loadContent(), run = runBot(c, 21, 'value', 7);
    expect(validateContent(c)).toEqual(c);
    expect(await hashBrowser(c)).toBe(hash(c));
    const fromNode = save(c, 21, run.commands, run.state), fromWeb = await saveBrowser(c, 21, run.commands, run.state);
    expect(fromWeb).toBe(fromNode);
    expect(hash(restore(c, fromWeb).state)).toBe(hash(run.state));
    expect(hash((await restoreBrowser(c, fromNode)).state)).toBe(hash(run.state));
    await expect(restoreBrowser(c, fromNode.replace('"schemaVersion": 1', '"schemaVersion": 99'))).rejects.toThrow('INCOMPATIBLE_SAVE');
});
test('browser save snapshots are stable even if caller changes arrays during hashing', async () => {
    const c = loadContent(), commands: unknown[] = [], state = createInitialState(c, 2), expected = save(c, 2, commands, state);
    const pending = saveBrowser(c, 2, commands, state);
    commands.push({ type: 'advance' });
    state.cash = 0;
    expect(await pending).toBe(expected);
});
test('pending events survive browser import and choices cannot settle twice', async () => {
    const c = loadContent();
    c.balance!.eventChance = 1;
    c.commissions = [{ ...c.commissions[0]!, workload: 100 }];
    c.events = [{ id: 'host-event', title: '待选', choices: [{ label: '继续', cost: 0, multiplier: 1 }] }];
    const session = new GameSession(c, 9);
    session.send({ type: 'accept', job: '0-0' });
    session.send({ type: 'assign', job: '0-0', team: [{ character: 'qwen', role: 'worker', mode: 'cloud' }] });
    session.send({ type: 'advance' });
    expect(session.view.pending).not.toBeNull();
    const restored = new GameSession(c, 1);
    await restored.importSave(await session.exportSave());
    expect(restored.view).toEqual(session.view);
    expect(restored.send({ type: 'advance' }).error).toBe('PENDING_CHOICE');
    expect(restored.send({ type: 'choose', index: 0 }).error).toBeNull();
    const after = restored.view;
    expect(restored.send({ type: 'choose', index: 0 }).error).toBe('NO_PENDING_CHOICE');
    expect(restored.view).toEqual(after);
});
test('failed or stale async import preserves the live session', async () => {
    const c = loadContent(), session = new GameSession(c, 1), before = session.view;
    await expect(session.importSave('{broken')).rejects.toThrow();
    expect(session.view).toEqual(before);
    const file = await session.exportSave(), pending = session.importSave(file);
    session.send({ type: 'advance' });
    const advanced = session.view;
    await expect(pending).rejects.toThrow('SESSION_CHANGED');
    expect(session.view).toEqual(advanced);
    const view = session.view;
    view.actors[0]!.energy = 0;
    expect(session.view.actors[0]!.energy).toBe(100);
    expect(dispatchCommand(createInitialState(c), { type: 'advance' }, c).state.absoluteSlot).toBe(1);
});
test('IndexedDB CAS prevents stale-tab overwrite and updates auto/backups atomically', async () => {
    const factory = new IDBFactory(), a = new BrowserSaves('concurrent', factory), b = new BrowserSaves('concurrent', factory);
    try {
        const writes = await Promise.allSettled([a.write('manual-1', 'first', 0), b.write('manual-1', 'second', 0)]);
        expect(writes.filter(w => w.status === 'fulfilled')).toHaveLength(1);
        expect(writes.filter(w => w.status === 'rejected')).toHaveLength(1);
        expect((await a.read('manual-1'))!.revision).toBe(1);
        for (let i = 1; i <= 7; i++)
            expect(await a.write('auto', `day-${i}`, i - 1)).toBe(i);
        expect((await b.read('auto'))!.text).toBe('day-7');
        for (let i = 1; i <= 5; i++)
            expect((await a.read(`backup-${i}` as 'backup-1'))!.text).toBe(`day-${7 - i}`);
        await expect(b.write('auto', 'stale', 0)).rejects.toThrow('SAVE_CONFLICT');
        expect((await a.read('auto'))!.text).toBe('day-7');
        expect((await a.read('backup-1'))!.text).toBe('day-6');
        expect(await a.read('manual-2')).toBeNull();
        expect(await b.write('manual-2', 'independent', 0)).toBe(1);
    }
    finally {
        await a.close();
        await b.close();
    }
});
