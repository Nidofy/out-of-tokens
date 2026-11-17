import { test, expect } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { loadContent } from 'oot-content';
import { BrowserSaves, GameSession, CheckpointCoordinator, defaultSaveEncoder, matchesRevision } from 'oot-platform';
import type { SaveEncoder, SaveStatus } from 'oot-platform';

const deferred = () => { let resolve!: () => void; const promise = new Promise<void>(r => { resolve = r; }); return { promise, resolve }; };
const tick = () => new Promise(resolve => setTimeout(resolve, 10));

test('50 command checkpoints preserve boundary backups and their original lineage', async () => {
    const storage = new BrowserSaves('boundary', new IDBFactory());
    await storage.write('auto', 'old-run', 0, 'boundary', { lineageId: 'old' });
    await storage.write('auto', 'boundary', 1, 'boundary', { lineageId: 'new' });
    const backups = (await storage.list()).slice(4);
    for (let i = 0; i < 50; i++) await storage.write('auto', `command-${i}`, i + 2, 'checkpoint', { lineageId: 'new' });
    expect((await storage.list()).slice(4)).toEqual(backups);
    await expect(storage.write('auto', 'stale', 1, 'boundary', { lineageId: 'wrong' })).rejects.toThrow('SAVE_CONFLICT');
    expect((await storage.list()).slice(4)).toEqual(backups);
    await storage.write('auto', 'next-boundary', 52, 'boundary', { lineageId: 'third' });
    expect((await storage.read('backup-1'))?.text).toBe('command-49');
    expect((await storage.read('backup-2'))?.meta?.lineageId).toBe('old');
    await storage.close();
});

test('snapshot encoding matches canonical export and is detached from subsequent commands', async () => {
    const session = new GameSession(loadContent(), 1), snapshot = session.checkpointSnapshot();
    const expected = await session.exportSave();
    expect(session.send({ type: 'accept', job: '0-0' }).error).toBeNull();
    expect(await defaultSaveEncoder.encode(snapshot.input)).toBe(expected);
    expect(matchesRevision(snapshot, session.workerSnapshot())).toBe(false);
    snapshot.state.cash = 0;
    expect(session.workerSnapshot().state.cash).not.toBe(0);
});

test('import failure preserves lineage; explicit slot lineage and file-import lineage are distinct', async () => {
    const session = new GameSession(loadContent(), 1), lineage = session.lineageId, text = await session.exportSave();
    await expect(session.importSave('bad')).rejects.toThrow();
    expect(session.lineageId).toBe(lineage);
    await session.importSave(text, 'backup-lineage');
    expect(session.lineageId).toBe('backup-lineage');
    await session.importSave(text);
    expect(session.lineageId).not.toBe('backup-lineage');
    expect(await session.exportSave()).toBe(text);
});

test('encoder is deferred; one active plus one latest pending; old completion never reports newest saved', async () => {
    const session = new GameSession(loadContent(), 1), storage = new BrowserSaves('queue', new IDBFactory());
    const gate = deferred(), started = deferred(), calls: number[] = [], states: SaveStatus[] = [];
    const encoder: SaveEncoder = { async encode(input) { calls.push(input.commands.length); if (calls.length === 1) { started.resolve(); await gate.promise; } return defaultSaveEncoder.encode(input); } };
    const c = new CheckpointCoordinator(() => session.checkpointSnapshot(), storage, 0, encoder);
    c.subscribe(s => states.push(s));
    c.enqueue('command');
    expect(calls).toEqual([]);
    await started.promise;
    session.send({ type: 'accept', job: '0-0' }); c.enqueue('command');
    session.send({ type: 'reject', job: '0-1' }); c.enqueue('command');
    const latest = session.workerSnapshot().revision;
    expect(states.filter(s => s.kind === 'saved')).toHaveLength(0);
    gate.resolve();
    expect((await c.drain()).kind).toBe('saved');
    expect(calls).toEqual([0, latest]);
    expect(states.filter(s => s.kind === 'saved').map(s => s.revision)).toEqual([latest]);
    expect((await storage.read('auto'))?.text).toBe(await session.exportSave());
    c.dispose(); await storage.close();
});

test('CAS conflict pauses without overwriting external data; confirmed abandon allows disposal', async () => {
    const session = new GameSession(loadContent(), 1), storage = new BrowserSaves('conflict', new IDBFactory());
    await storage.write('auto', 'other-tab', 0);
    const c = new CheckpointCoordinator(() => session.checkpointSnapshot(), storage, 0);
    c.enqueue('command');
    expect(await c.drain()).toMatchObject({ kind: 'paused', cause: 'conflict' });
    expect((await c.retry()).kind).toBe('paused');
    expect((await storage.read('auto'))?.text).toBe('other-tab');
    await c.abandonPending(true); c.dispose(); await storage.close();
});

test('external pause while encoding prevents write and abandonment waits for encoding', async () => {
    const session = new GameSession(loadContent(), 1), storage = new BrowserSaves('pause', new IDBFactory());
    const gate = deferred(), started = deferred();
    const c = new CheckpointCoordinator(() => session.checkpointSnapshot(), storage, 0, { async encode(input) { started.resolve(); await gate.promise; return defaultSaveEncoder.encode(input); } });
    await expect(c.abandonPending(true)).rejects.toThrow('ABANDON_NOT_ALLOWED');
    c.enqueue('command'); await started.promise; storage.onExternalChange?.();
    let finished = false; const abandoned = c.abandonPending(true).then(() => { finished = true; });
    await tick(); expect(finished).toBe(false); gate.resolve(); await abandoned;
    expect(await storage.read('auto')).toBeNull(); c.dispose(); await storage.close();
});

test('unavailable storage keeps session exportable, retry never repeats a domain command', async () => {
    const session = new GameSession(loadContent(), 1), storage = new BrowserSaves('unavailable', undefined);
    session.send({ type: 'accept', job: '0-0' }); const text = await session.exportSave();
    const c = new CheckpointCoordinator(() => session.checkpointSnapshot(), storage, 0);
    c.enqueue('command'); expect(await c.drain()).toMatchObject({ kind: 'error', exportable: true });
    await c.retry(); expect(await session.exportSave()).toBe(text);
    await c.abandonPending(true); c.dispose();
});

test('normal switch locks new commands, drains, and failed import preserves current identity', async () => {
    const session = new GameSession(loadContent(), 1), storage = new BrowserSaves('switch', new IDBFactory());
    const c = new CheckpointCoordinator(() => session.checkpointSnapshot(), storage, 0);
    c.enqueue('command'); const unlock = session.lockCommands();
    expect(session.send({ type: 'accept', job: '0-0' }).error).toBe('SESSION_SWITCHING');
    expect((await c.drain()).kind).toBe('saved');
    const identity = session.workerSnapshot();
    await expect(session.importSave('bad')).rejects.toThrow();
    expect(matchesRevision(identity, session.workerSnapshot())).toBe(true);
    unlock(); expect(session.send({ type: 'accept', job: '0-0' }).error).toBeNull();
    c.dispose(); await storage.close();
});

test('abandon waits for already submitted I/O and does not cancel its commit', async () => {
    const session = new GameSession(loadContent(), 1), storage = new BrowserSaves('committing', new IDBFactory());
    const original = storage.write.bind(storage), gate = deferred(), submitted = deferred();
    storage.write = async (...args) => { submitted.resolve(); await gate.promise; return original(...args); };
    const c = new CheckpointCoordinator(() => session.checkpointSnapshot(), storage, 0);
    c.enqueue('command'); await submitted.promise; c.pause();
    let finished = false; const pending = c.abandonPending(true).then(() => { finished = true; });
    await tick(); expect(finished).toBe(false); gate.resolve(); await pending;
    expect((await storage.read('auto'))?.revision).toBe(1);
    expect(c.currentStatus.kind).toBe('paused'); c.dispose(); await storage.close();
});

test('boundary snapshots cannot be replaced before they commit', async () => {
    const session = new GameSession(loadContent(), 1), storage = new BrowserSaves('boundary-flight', new IDBFactory());
    const gate = deferred(), started = deferred();
    const c = new CheckpointCoordinator(() => session.checkpointSnapshot(), storage, 0, { async encode(input) { started.resolve(); await gate.promise; return defaultSaveEncoder.encode(input); } });
    c.enqueue('day-end');
    expect(() => c.enqueue('command')).toThrow('BOUNDARY_DRAIN_REQUIRED');
    await started.promise;
    expect(() => c.enqueue('command')).toThrow('BOUNDARY_DRAIN_REQUIRED');
    gate.resolve(); expect((await c.drain()).kind).toBe('saved');
    c.dispose(); await storage.close();
});

test('development fixture is absent from production root exports; Worker encoding uses canonical bytes', async () => {
    const root = await import('oot-platform');
    const worker = await import('oot-platform/worker');
    const { experienceFixture } = await import('oot-platform/fixtures');
    expect('experienceFixture' in root).toBe(false);
    expect(experienceFixture('pending-choice').blocked).toBe('pending-choice');
    const fixture = experienceFixture('night-rest'); fixture.resting.length = 0;
    expect(experienceFixture('night-rest').resting.length).toBe(1);
    const session = new GameSession(loadContent(), 1);
    expect(await worker.defaultSaveEncoder.encode(session.checkpointSnapshot().input)).toBe(await session.exportSave());
});
