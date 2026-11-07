import { test, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
test('WEB-03 early IndexedDB rejection is handled before effects; consumers still reject', () => {
 const result=spawnSync(process.execPath,['--input-type=module','-e',`
 import {BrowserSaves} from './packages/oot-platform/dist/storage.js';
 import assert from 'node:assert/strict';
 const failures=[];process.on('unhandledRejection',e=>failures.push(e.message));
 const s=new BrowserSaves('failure',{open(){throw Error('STORAGE_UNAVAILABLE')}});
 await new Promise(r=>setTimeout(r,20));
 await assert.rejects(s.list(),/STORAGE_UNAVAILABLE/);
 await assert.rejects(s.close(),/STORAGE_UNAVAILABLE/);
 assert.deepEqual(failures,[]);
 `],{encoding:'utf8'});
 expect(result.status,result.stderr).toBe(0);
});
