import {test,expect} from 'vitest';
import {HostSaves} from 'oot-platform';
test('nonempty reconciliation preserves memory and refuses unrelated revisions',async()=>{
 let revision=2,text='old';const rows=()=>[null,null,null,{id:'auto',revision,text,savedAt:1},null,null,null,null,null];
 const saves=new HostSaves((async(_u,init)=>{if(init?.method==='POST')throw Error('TIMEOUT');return new Response(JSON.stringify({records:rows()}));}) as typeof fetch);
 await expect(saves.write('auto','new',2)).rejects.toThrow('TIMEOUT');
 expect((await saves.reconcile('auto',2,'new')).committed).toBe(false);
 revision=3;text='other';await expect(saves.reconcile('auto',2,'new')).rejects.toThrow('SAVE_CONFLICT');
 text='new';expect((await saves.reconcile('auto',2,'new')).committed).toBe(true);
 await saves.close();
});
test('explicit empty reconciliation recovers failed first write; listing alone never does',async()=>{
 let posts=0;let exists=false;const request=async(_url:unknown,init?:RequestInit)=>{
 if(init?.method==='POST'){posts++;if(posts===1)throw Error('TIMEOUT');return new Response(JSON.stringify({revision:1}));}
 const records=Array(9).fill(null);if(exists)records[3]={id:'auto',text:'saved',revision:1,savedAt:1};return new Response(JSON.stringify({records}));};
 const saves=new HostSaves(request as typeof fetch);
 await expect(saves.write('auto','save',0)).rejects.toThrow('TIMEOUT');await saves.list();await expect(saves.write('auto','save',0)).rejects.toThrow('WRITE_UNCERTAIN');expect(posts).toBe(1);
 exists=true;await expect(saves.reconcileEmpty()).rejects.toThrow('EXISTING_SAVE');await expect(saves.write('auto','save',0)).rejects.toThrow('WRITE_UNCERTAIN');
 exists=false;await saves.reconcileEmpty();expect(await saves.write('auto','save',0)).toBe(1);await saves.close();
});
