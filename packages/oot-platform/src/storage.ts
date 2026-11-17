export const manualSlots = ['manual-1', 'manual-2', 'manual-3'] as const;
export type WritableSlot = typeof manualSlots[number] | 'auto';
export const saveSlots = [...manualSlots, 'auto', 'backup-1', 'backup-2', 'backup-3', 'backup-4', 'backup-5'] as const;
export type SaveSlot = typeof saveSlots[number];
export type WritePolicy = 'checkpoint' | 'boundary';
export interface SaveMeta { lineageId: string }
export interface StoredSave {
    id: SaveSlot;
    text: string;
    revision: number;
    savedAt: number;
    meta?: SaveMeta;
    lineageReset?: boolean;
}
export class BrowserSaves {
    private readonly db: Promise<IDBDatabase>;
    private readonly channel: BroadcastChannel | null;
    onExternalChange: (() => void) | null = null;
    constructor(name = 'out-of-tokens-m1', factory: IDBFactory = globalThis.indexedDB) {
        this.channel = typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(name) : null;
        if (this.channel)
            this.channel.onmessage = () => this.onExternalChange?.();
        this.db = new Promise((resolve, reject) => {
            if (!factory) {
                reject(Error('STORAGE_UNAVAILABLE'));
                return;
            }
            const request = factory.open(name, 1);
            let failed = false;
            request.onupgradeneeded = () => request.result.createObjectStore('slots', { keyPath: 'id' });
            request.onerror = () => reject(request.error ?? Error('STORAGE_UNAVAILABLE'));
            request.onblocked = () => { failed = true; reject(Error('STORAGE_BLOCKED')); };
            request.onsuccess = () => { if (failed) {
                request.result.close();
                return;
            } request.result.onversionchange = () => request.result.close(); resolve(request.result); };
        });
        // Observe immediate failure before a UI effect attaches; preserve rejection for callers.
        void this.db.catch(() => {});
    }
    async read(id: SaveSlot): Promise<StoredSave | null> {
        if (!saveSlots.includes(id))
            throw Error('INVALID_SLOT');
        const db = await this.db;
        return new Promise((resolve, reject) => { const req = db.transaction('slots', 'readonly').objectStore('slots').get(id); req.onsuccess = () => resolve((req.result as StoredSave | undefined) ?? null); req.onerror = () => reject(req.error); });
    }
    async list(): Promise<(StoredSave | null)[]> { return Promise.all(saveSlots.map(id => this.read(id))); }
    async write(id: WritableSlot, text: string, expectedRevision: number, policy: WritePolicy = 'boundary', meta?: SaveMeta): Promise<number> {
        if (policy !== 'checkpoint' && policy !== 'boundary') throw Error('INVALID_WRITE_POLICY');
        if (meta && (typeof meta.lineageId !== 'string' || !meta.lineageId.trim())) throw Error('INVALID_LINEAGE');
        const capturedMeta = meta ? { lineageId: meta.lineageId } : undefined;
        if (![...manualSlots, 'auto'].includes(id) || !Number.isSafeInteger(expectedRevision) || expectedRevision < 0)
            throw Error('INVALID_SLOT');
        if (typeof text !== 'string' || text.length === 0 || text.length > 8000000)
            throw Error('INVALID_SAVE_SIZE');
        const db = await this.db;
        const revision = await new Promise<number>((resolve, reject) => {
            const transaction = db.transaction('slots', 'readwrite'), store = transaction.objectStore('slots');
            let failure: Error | null = null, next = 0;
            transaction.oncomplete = () => resolve(next);
            transaction.onerror = () => reject(failure ?? transaction.error ?? Error('STORAGE_WRITE_FAILED'));
            transaction.onabort = () => reject(failure ?? transaction.error ?? Error('STORAGE_WRITE_FAILED'));
            const read = store.get(id);
            read.onsuccess = () => {
                const previous = read.result as StoredSave | undefined;
                if ((previous?.revision ?? 0) !== expectedRevision) {
                    failure = Error('SAVE_CONFLICT');
                    transaction.abort();
                    return;
                }
                next = expectedRevision + 1;
                const nextRecord = { id, text, revision: next, savedAt: Date.now(), ...(capturedMeta ? { meta: capturedMeta } : {}) } satisfies StoredSave;
                // Keep the last boundary separately: ordinary checkpoints replace auto.
                // This private platform record never enters save text or the public slot list.
                if (id === 'auto') {
                    const head = store.get('boundary-head');
                    head.onsuccess = () => {
                        const boundary = (head.result as StoredSave | undefined) ?? previous;
                        if (boundary && policy === 'boundary') {
                            for (let i = 1; i < 5; i++) {
                                const backup = store.get(`backup-${i}`);
                                backup.onsuccess = () => {
                                    if (backup.result)
                                        store.put({ ...backup.result, id: `backup-${i + 1}` });
                                };
                            }
                            store.put({ ...boundary, id: 'backup-1' });
                        }
                        // Legacy databases have no head; preserve their known recovery point.
                        if (policy === 'boundary' || !head.result)
                            store.put({ ...(policy === 'boundary' ? nextRecord : boundary ?? nextRecord), id: 'boundary-head' });
                    };
                }
                store.put(nextRecord);
            };
        });
        this.channel?.postMessage({ id, revision });
        return revision;
    }
    async close() { this.channel?.close(); (await this.db).close(); }
}
