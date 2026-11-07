import {test,expect} from 'vitest';
import {HostSaves} from 'oot-platform';
test('explicit empty reconciliation recovers failed first write; listing alone never does',async()=>{
 let posts=0;let exists=false;const request=async(_url:unknown,init?:RequestInit)=>{
 if(init?.method==='POST'){posts++;if(posts===1)throw Error('TIMEOUT');return new Response(JSON.stringify({revision:1}));}
 const records=Array(9).fill(null);if(exists)records[3]={id:'auto',text:'saved',revision:1,savedAt:1};return new Response(JSON.stringify({records}));};
 const saves=new HostSaves(request as typeof fetch);
 await expect(saves.write('auto','save',0)).rejects.toThrow('TIMEOUT');await saves.list();await expect(saves.write('auto','save',0)).rejects.toThrow('WRITE_UNCERTAIN');expect(posts).toBe(1);
 exists=true;await expect(saves.reconcileEmpty()).rejects.toThrow('EXISTING_SAVE');await expect(saves.write('auto','save',0)).rejects.toThrow('WRITE_UNCERTAIN');
 exists=false;await saves.reconcileEmpty();expect(await saves.write('auto','save',0)).toBe(1);await saves.close();
});
