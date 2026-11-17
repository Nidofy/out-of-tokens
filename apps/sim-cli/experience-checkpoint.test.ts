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

test('multiple boundary prefixes survive fast commands with only the latest pending snapshot', async () => {
    const session = new GameSession(loadContent(), 1), storage = new BrowserSaves('boundary-flight', new IDBFactory());
    const gate = deferred(), started = deferred(); let first=true;
    const c = new CheckpointCoordinator(() => session.checkpointSnapshot(), storage, 0, { async encode(input) { if(first){first=false;started.resolve();await gate.promise;} return defaultSaveEncoder.encode(input); } });
    const writes:string[]=[];const originalWrite=storage.write.bind(storage);storage.write=async(...args)=>{writes.push(args[1]);return originalWrite(...args);};
    const initial=await session.exportSave();c.enqueue('day-end');await started.promise;
    session.send({type:'accept',job:'0-0'});const boundary=await session.exportSave();c.enqueue('day-end');
    session.send({type:'reject',job:'0-1'});c.enqueue('command');
    gate.resolve();expect((await c.drain()).kind).toBe('saved');
    expect((await storage.read('auto'))?.text).toBe(await session.exportSave());
    expect((await storage.read('backup-1'))?.text).toBe(initial);
    // The second boundary itself was committed before the latest ordinary checkpoint.
    expect((await storage.read('auto'))?.revision).toBe(3);
    expect(writes).toEqual([initial,boundary,await session.exportSave()]);
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

import { switchImportedSession } from 'oot-platform';
test('invalid import preserves pending progress before abnormal switch abandonment', async () => {
    const session=new GameSession(loadContent(),1), storage=new BrowserSaves('invalid-switch',new IDBFactory());
    const c=new CheckpointCoordinator(()=>session.checkpointSnapshot(),storage,0);
    c.pause();session.send({type:'accept',job:'0-0'});c.enqueue('command');
    const text=await session.exportSave(),lineage=session.lineageId;
    await expect(switchImportedSession(session,c,'bad',{confirmed:true})).rejects.toThrow();
    expect(session.lineageId).toBe(lineage);expect(await session.exportSave()).toBe(text);
    expect(()=>c.dispose()).toThrow('CHECKPOINT_PENDING');
    await c.abandonPending(true);c.dispose();await storage.close();
});
test('confirmed unavailable-storage import succeeds but is explicitly not saved', async () => {
    const session=new GameSession(loadContent(),1), storage=new BrowserSaves('no-storage-switch',undefined);
    const target=await session.exportSave(), c=new CheckpointCoordinator(()=>session.checkpointSnapshot(),storage,0);
    session.send({type:'accept',job:'0-0'});c.enqueue('command');await c.drain();
    await expect(switchImportedSession(session,c,target)).rejects.toThrow('SWITCH_REQUIRES_CONFIRMATION');
    expect(session.workerSnapshot().revision).toBe(1);
    const result=await switchImportedSession(session,c,target,{confirmed:true,lineageId:'restored-slot'});
    expect(result).toEqual({lineageId:'restored-slot',saved:false});
    expect(await session.exportSave()).toBe(target);
});
test('normal import drains old lineage, preserves backup identity, and unlocks commands',async()=>{
    const session=new GameSession(loadContent(),1),storage=new BrowserSaves('normal-switch',new IDBFactory());
    const target=await session.exportSave(),old=session.lineageId;
    const c=new CheckpointCoordinator(()=>session.checkpointSnapshot(),storage,0);
    session.send({type:'accept',job:'0-0'});c.enqueue('command');
    await switchImportedSession(session,c,target,{lineageId:'restore'});
    expect((await storage.read('auto'))?.meta?.lineageId).toBe(old);
    const next=new CheckpointCoordinator(()=>session.checkpointSnapshot(),storage,1);next.enqueue('load');await next.drain();
    expect((await storage.read('backup-1'))?.meta?.lineageId).toBe(old);
    expect((await storage.read('auto'))?.meta?.lineageId).toBe('restore');
    expect(session.send({type:'accept',job:'0-0'}).error).toBeNull();next.dispose();await storage.close();
});


test('prefix encoding matches canonical earlier save and rejects invalid prefixes',async()=>{
    const session=new GameSession(loadContent(),1),initial=await session.exportSave();
    session.send({type:'accept',job:'0-0'});const captured=session.checkpointSnapshot().input;
    expect(await defaultSaveEncoder.encode({...captured,throughCommand:0})).toBe(initial);
    await expect(defaultSaveEncoder.encode({...captured,throughCommand:2})).rejects.toThrow('INVALID_CHECKPOINT_PREFIX');
});

import { HostLineageMap } from 'oot-platform';
test('Host presentation identity is scoped to slot/CAS/content and unknown records reset safely',async()=>{
    const data=new Map<string,string>(), storage={getItem:(key:string)=>data.get(key)??null,setItem:(key:string,value:string)=>{data.set(key,value);}};
    const map=new HostLineageMap(storage),row={id:'auto' as const,text:'save-a',revision:1,savedAt:0};
    await map.bind(row,'run-a');
    expect((await new HostLineageMap(storage).restore(row)).meta?.lineageId).toBe('run-a');
    for(const different of [{...row,revision:2},{...row,text:'save-b'},{...row,id:'backup-1' as const}]) {
        const restored=await map.restore(different);expect(restored.lineageReset).toBe(true);expect(restored.meta?.lineageId).not.toBe('run-a');
    }
    expect((await map.restore(row)).lineageReset).toBeUndefined();
});


test('manual auto-load after drain remains unsaved until a fresh load boundary commits',async()=>{
    const storage=new BrowserSaves('auto-load-drain-race',new IDBFactory()),session=new GameSession(loadContent(),1);
    const original=await session.exportSave();await storage.write('auto',original,0,'boundary',{lineageId:session.lineageId});
    const started=deferred(),release=deferred();
    const encoder:SaveEncoder={encode:async input=>{started.resolve();await release.promise;return defaultSaveEncoder.encode(input);}};
    const oldCoordinator=new CheckpointCoordinator(()=>session.checkpointSnapshot(),storage,1,encoder);
    expect(session.send({type:'accept',job:'0-0'}).error).toBeNull();oldCoordinator.enqueue('command');await started.promise;
    // The UI reads its chosen auto row before draining the pending local checkpoint.
    const selected=(await storage.read('auto'))!;expect(selected.text).toBe(original);release.resolve();
    const {switchImportedSession}=await import('oot-platform');
    const switched=await switchImportedSession(session,oldCoordinator,selected.text,{lineageId:selected.meta!.lineageId});
    const disk=(await storage.read('auto'))!;
    expect(switched.saved).toBe(false);expect(await session.exportSave()).toBe(original);
    expect(disk.revision).toBe(2);expect(disk.text).not.toBe(original);
    // Even when the selected slot was auto, the switch requires a new boundary write.
    const next=new CheckpointCoordinator(()=>session.checkpointSnapshot(),storage,disk.revision);
    next.enqueue('load');expect((await next.drain()).kind).toBe('saved');
    expect((await storage.read('auto'))!.text).toBe(original);
    expect((await storage.read('backup-1'))!.text).toBe(disk.text);
    expect((await storage.read('backup-1'))!.meta?.lineageId).toBe(session.lineageId);
    next.dispose();await storage.close();
});
