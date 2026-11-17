import {test,expect} from 'vitest';
import {IDBFactory} from 'fake-indexeddb';
import {BrowserSaves} from 'oot-platform';
test('independent: checkpoint between boundaries must not replace last boundary backup',async()=>{
 const s=new BrowserSaves('post-merge-independent',new IDBFactory());
 await s.write('auto','boundary-A',0,'boundary',{lineageId:'A'});
 for(let i=1;i<=50;i++) await s.write('auto',`checkpoint-${i}`,i,'checkpoint',{lineageId:'A'});
 await s.write('auto','boundary-B',51,'boundary',{lineageId:'B'});
 const backup=await s.read('backup-1');console.log(JSON.stringify({expected:'boundary-A',actual:backup}));
 await s.close();expect(backup?.text).toBe('boundary-A');
});

test('boundary head survives reopen and failed CAS without losing the five prior boundaries',async()=>{
 const factory=new IDBFactory();let s=new BrowserSaves('post-merge-reopen',factory);let rev=0;
 for(let n=0;n<7;n++){
  rev=await s.write('auto',`boundary-${n}`,rev,'boundary',{lineageId:`run-${n}`});
  for(let i=0;i<3;i++)rev=await s.write('auto',`checkpoint-${n}-${i}`,rev,'checkpoint');
  await expect(s.write('auto','wrong',rev-1,'boundary')).rejects.toThrow('SAVE_CONFLICT');
  await s.close();s=new BrowserSaves('post-merge-reopen',factory);
 }
 expect((await s.list()).slice(4).map(x=>[x?.text,x?.meta?.lineageId])).toEqual([5,4,3,2,1].map(n=>[`boundary-${n}`,`run-${n}`]));
 expect((await s.read('auto'))?.text).toBe('checkpoint-6-2');await s.close();
});

test('independent: held first write preserves natural 50-command boundary prefixes',async()=>{
 const {readFileSync}=await import('node:fs');
 const {loadFullContent}=await import('oot-content');
 const {GameSession,CheckpointCoordinator}=await import('oot-platform');
 const trace=JSON.parse(readFileSync(new URL('./fixtures/commission-natural-build-2.json',import.meta.url),'utf8'));
 const session=new GameSession(loadFullContent(),trace.seed),s=new BrowserSaves('independent-queue',new IDBFactory());
 let release!:()=>void,start!:()=>void;const hold=new Promise<void>(r=>release=r),started=new Promise<void>(r=>start=r);
 const write=s.write.bind(s),writes:{count:number;text:string}[]=[];let active=0,max=0;
 s.write=async(...args)=>{active++;max=Math.max(max,active);if(!writes.length){start();await hold;}writes.push({count:JSON.parse(args[1]).commands.length,text:args[1]});try{return await write(...args);}finally{active--;}};
 const coord=new CheckpointCoordinator(()=>session.checkpointSnapshot(),s,0);const boundaries:number[]=[];
 for(let i=0;i<50;i++){const r=session.send(trace.commands[i]);expect(r.error).toBeNull();const boundary=r.events.some(e=>e.type==='DayEnd');if(boundary)boundaries.push(i+1);coord.enqueue(boundary?'day-end':'command');if(i===0)await started;}
 release();expect((await coord.drain()).kind).toBe('saved');
 expect(boundaries).toEqual([16,31,47]);expect(writes.map(w=>w.count)).toEqual([1,16,31,47,50]);expect(max).toBe(1);
 expect((await s.read('auto'))?.text).toBe(await session.exportSave());
 expect((await s.read('backup-1'))?.text).toBe(writes[2]!.text);
 expect((await s.read('backup-2'))?.text).toBe(writes[1]!.text);
 console.log(JSON.stringify({boundaries,writes:writes.map(w=>w.count),max}));coord.dispose();await s.close();
});
