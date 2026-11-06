export const manualSlots = ['manual-1', 'manual-2', 'manual-3'] as const;
export type WritableSlot = typeof manualSlots[number] | 'auto';
export const saveSlots = [...manualSlots, 'auto', 'backup-1', 'backup-2', 'backup-3', 'backup-4', 'backup-5'] as const;
export type SaveSlot = typeof saveSlots[number];
export interface StoredSave {
    id: SaveSlot;
    text: string;
    revision: number;
    savedAt: number;
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
    }
    async read(id: SaveSlot): Promise<StoredSave | null> {
        if (!saveSlots.includes(id))
            throw Error('INVALID_SLOT');
        const db = await this.db;
        return new Promise((resolve, reject) => { const req = db.transaction('slots', 'readonly').objectStore('slots').get(id); req.onsuccess = () => resolve((req.result as StoredSave | undefined) ?? null); req.onerror = () => reject(req.error); });
    }
    async list(): Promise<(StoredSave | null)[]> { return Promise.all(saveSlots.map(id => this.read(id))); }
    async write(id: WritableSlot, text: string, expectedRevision: number): Promise<number> {
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
                // Rotations and the new pointer commit together in one transaction.
                if (id === 'auto' && previous) {
                    for (let i = 1; i < 5; i++) {
                        const backup = store.get(`backup-${i}`);
                        backup.onsuccess = () => {
                            if (backup.result)
                                store.put({ ...backup.result, id: `backup-${i + 1}` });
                        };
                    }
                    store.put({ ...previous, id: 'backup-1' });
                }
                store.put({ id, text, revision: next, savedAt: Date.now() } satisfies StoredSave);
            };
        });
        this.channel?.postMessage({ id, revision });
        return revision;
    }
    async close() { this.channel?.close(); (await this.db).close(); }
}
