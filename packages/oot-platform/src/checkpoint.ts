import type { SaveStorage } from './host-storage.js';
import type { WritePolicy } from './storage.js';
import { defaultSaveEncoder } from './checkpoint-contract.js';
import type { CheckpointSnapshot, CheckpointReason, SaveEncoder, SaveStatus } from './checkpoint-contract.js';

type Pending = { snapshot: CheckpointSnapshot; policy: WritePolicy };
/** One coordinator per lineage. Dispose it after a successful switch; never reuse its CAS token. */
export class CheckpointCoordinator {
    private pending: Pending | null = null;
    private active: Promise<void> | null = null;
    private expectedRevision: number;
    private status: SaveStatus;
    private listeners = new Set<(status: SaveStatus) => void>();
    private disposed = false;
    private lastBoundaryRevision = -1;
    private boundaries: { revision: number; commandCount: number }[] = [];
    private readonly external = () => this.pause('external-change');
    constructor(private readonly capture: () => CheckpointSnapshot, private readonly storage: SaveStorage,
        expectedRevision: number, private readonly encoder: SaveEncoder = defaultSaveEncoder) {
        const snapshot = capture();
        this.expectedRevision = expectedRevision;
        this.status = { ...this.identity(snapshot), kind: 'idle' };
        storage.onExternalChange = this.external;
    }
    private identity(s: CheckpointSnapshot) {
        return { contract: s.contract, contentVersion: s.contentVersion, lineageId: s.lineageId, revision: s.revision };
    }
    get lineageId() { return this.status.lineageId; }
    get currentStatus(): SaveStatus { return { ...this.status }; }
    get canSwitchWithoutConfirm() { return this.status.kind !== 'paused' && this.status.kind !== 'error'; }
    private publish(status: SaveStatus) {
        this.status = status;
        // Subscriber failure must never turn a committed write into a storage failure.
        for (const listener of this.listeners) { try { listener({ ...status }); } catch { /* observer only */ } }
    }
    subscribe(fn: (status: SaveStatus) => void) { this.listeners.add(fn); fn(this.currentStatus); return () => { this.listeners.delete(fn); }; }
    pause(cause: 'external-change' | 'conflict' | 'auto-paused' = 'auto-paused') {
        this.publish({ ...this.status, kind: 'paused', cause });
    }
    enqueue(reason: CheckpointReason) {
        if (this.disposed) throw Error('COORDINATOR_DISPOSED');
        const snapshot = this.capture();
        if (snapshot.lineageId !== this.lineageId) throw Error('LINEAGE_CHANGED');
        if (snapshot.revision < this.status.revision) throw Error('STALE_CHECKPOINT');
        const policy = reason === 'command' || reason === 'host-checkpoint' ? 'checkpoint' : 'boundary';
        // Preserve boundaries as log-prefix markers, not extra retained State snapshots.
        if (policy === 'boundary' && snapshot.revision > this.lastBoundaryRevision) {
            this.boundaries.push({revision:snapshot.revision,commandCount:snapshot.input.commands.length});
            this.lastBoundaryRevision=snapshot.revision;
        }
        this.pending = { snapshot, policy: 'checkpoint' };
        if (this.canSwitchWithoutConfirm) this.publish({ ...this.identity(snapshot), kind: 'dirty' });
        else this.publish({ ...this.status, revision: snapshot.revision });
        this.start();
    }
    private start() {
        if (this.active || !this.pending || !this.canSwitchWithoutConfirm || this.disposed) return;
        // Yield the command handler. This is scheduling, not a claim of Worker execution.
        this.active = new Promise<void>(resolve => setTimeout(resolve, 0)).then(async () => {
            while (this.pending && this.canSwitchWithoutConfirm) {
                const boundary = this.boundaries.shift();
                const item: Pending = { snapshot:this.pending.snapshot, policy:boundary?'boundary':'checkpoint' };
                const identity = { ...this.identity(item.snapshot), revision:boundary?.revision??item.snapshot.revision };
                if (!boundary || boundary.revision === item.snapshot.revision) this.pending = null;
                this.publish({ ...this.status, kind: 'saving' });
                try {
                    const text = await this.encoder.encode(boundary ? {...item.snapshot.input,throughCommand:boundary.commandCount} : item.snapshot.input);
                    // External notification during encoding must prevent starting a stale write.
                    if (!this.canSwitchWithoutConfirm) { this.pending ??= item; if(boundary)this.boundaries.unshift(boundary); break; }
                    this.expectedRevision = await this.storage.write('auto', text, this.expectedRevision, item.policy, { lineageId: this.lineageId });
                    if (this.canSwitchWithoutConfirm) this.publish(this.pending
                        ? { ...this.status, kind: 'dirty' }
                        : { ...identity, kind: 'saved', savedAt: Date.now() });
                } catch (error) {
                    this.pending ??= item;
                    if(boundary)this.boundaries.unshift(boundary);
                    const code = error instanceof Error ? error.message : 'STORAGE_WRITE_FAILED';
                    if (code === 'SAVE_CONFLICT') this.pause('conflict');
                    else this.publish({ ...this.status, kind: 'error', code, exportable: true });
                }
            }
        }).finally(() => { this.active = null; });
    }
    async drain(): Promise<SaveStatus> {
        this.start();
        if (this.active) await this.active;
        return this.currentStatus;
    }
    async abandonPending(confirmed: true): Promise<void> {
        if (confirmed !== true || this.canSwitchWithoutConfirm) throw Error('ABANDON_NOT_ALLOWED');
        this.pending = null;
        this.boundaries = [];
        if (this.active) await this.active;
        this.pending = null;
        this.boundaries = [];
    }
    async retry(): Promise<SaveStatus> {
        if (this.status.kind === 'paused') return this.currentStatus; // Never refresh CAS after conflict.
        if (this.status.kind === 'error') this.publish({ ...this.status, kind: 'dirty' });
        return this.drain();
    }
    dispose() {
        if (this.active || this.pending) throw Error('CHECKPOINT_PENDING');
        this.disposed = true;
        if (this.storage.onExternalChange === this.external) this.storage.onExternalChange = null;
        this.listeners.clear();
    }
}
