import { hashBrowser } from 'oot-persistence/browser';
import type { StoredSave } from './storage.js';

export interface LineageMapStorage { getItem(key:string):string|null; setItem(key:string,value:string):void }
/** Host-only presentation identity, bound to exact slot/CAS/content; never trusts imported metadata. */
export class HostLineageMap {
    private entries: Record<string,string> = {};
    constructor(private readonly storage?: LineageMapStorage, private readonly key='oot-host-lineage:v1') {
        try {
            const parsed=JSON.parse(storage?.getItem(key)??'{}') as Record<string,unknown>;
            if(parsed && typeof parsed==='object' && !Array.isArray(parsed))
                this.entries=Object.fromEntries(Object.entries(parsed).filter((entry):entry is [string,string]=>typeof entry[1]==='string'&&entry[1].length>0).slice(-64));
        } catch { /* Broken/unavailable presentation metadata never blocks loading domain saves. */ }
    }
    private async identity(record:StoredSave) { return `${record.id}:${record.revision}:${await hashBrowser(record.text)}`; }
    async bind(record:StoredSave,lineageId:string) {
        this.entries[await this.identity(record)]=lineageId;
        this.entries=Object.fromEntries(Object.entries(this.entries).slice(-64));
        try { this.storage?.setItem(this.key,JSON.stringify(this.entries)); } catch { /* Session memory remains available. */ }
    }
    async restore(record:StoredSave):Promise<StoredSave> {
        const id=await this.identity(record),existing=this.entries[id];
        if(existing)return {...record,meta:{lineageId:existing}};
        const lineageId=globalThis.crypto.randomUUID();await this.bind(record,lineageId);
        return {...record,meta:{lineageId},lineageReset:true};
    }
}
