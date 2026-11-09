import {test,expect} from 'vitest';
import {loadFullContent,validateContent} from 'oot-content';
import {createInitialState,dispatchCommand,officeCommand,officeLimit,getViewModel,officeSlots} from 'oot-core';
import type {Member} from 'oot-core';
import {GameSession,BrowserSaves} from 'oot-platform';
import {IDBFactory} from 'fake-indexeddb';
import {labSession,labCases,LabSaves} from '../web/src/office-lab.js';
import {officeCamera,slotPoint} from '../web/src/office-scene-spec.js';
const team=(ids:string[],role:Member['role']='worker'):Member[]=>ids.map(character=>({character,role,mode:'local'}));
function fixture(){const c=loadFullContent();c.events=[];c.balance!.eventChance=0;let s=createInitialState(c,1);const id=s.jobs[0]!.id;s=dispatchCommand(s,{type:'accept',job:id},c).state;return {c,s,id};}
test('three stations accept three workers and one meeting planner, rejecting fourth worker atomically',()=>{
 const {c,s,id}=fixture(),before=structuredClone(s);
 const bad=dispatchCommand(s,{type:'assign',job:id,team:team(c.campaign!.initial)},c);expect(bad.error).toBe('NO_WORKSTATION');expect(bad.state).toBe(s);expect(s).toEqual(before);
 const r=dispatchCommand(s,{type:'assign',job:id,team:[...team(c.campaign!.initial.slice(0,3)),...team(['mistral'],'planner')]},c);expect(r.error).toBeNull();expect(r.state.campaign!.office!.reservations.mistral!.zone).toBe('meeting');
});
test('purchase fourth station charges once and enables fourth worker; replay/revision prevents repeat',async()=>{
 const c=loadFullContent(),g=new GameSession(c,1),old=await g.exportSave(),o=g.view.office!,cmd=officeCommand([...o.items,{id:'new:0',kind:'basic',slot:'work-4'}],o.revision);
 expect(g.previewOffice(cmd)).toMatchObject({error:null,cost:180});expect(await g.exportSave()).toBe(old);
 expect(g.send(cmd).error).toBeNull();expect(g.view.cash).toBe(4820);expect(g.view.office!.capacity.work).toBe(4);expect(g.send(cmd).error).toBe('OFFICE_CONFLICT');
 const id=g.view.jobs[0]!.id;g.send({type:'accept',job:id});expect(g.send({type:'assign',job:id,team:team(c.campaign!.initial)}).error).toBeNull();
 const restored=new GameSession(c,22);await restored.importSave(await g.exportSave());expect(restored.view).toEqual(g.view);
});
test('cross-job and meeting capacity are global; existing reservations remain stable',()=>{
 const {c,s,id}=fixture();let r=dispatchCommand(s,{type:'assign',job:id,team:team(['qwen','llama'])},c);expect(r.error).toBeNull();const old=structuredClone(r.state.campaign!.office!.reservations);const id2=r.state.jobs[1]!.id;r=dispatchCommand(r.state,{type:'accept',job:id2},c);
 const fail=dispatchCommand(r.state,{type:'assign',job:id2,team:team(['bluewhale','mistral'])},c);expect(fail.error).toBe('NO_WORKSTATION');
 r=dispatchCommand(r.state,{type:'assign',job:id2,team:[...team(['bluewhale']),...team(['mistral'],'planner')]},c);expect(r.error).toBeNull();expect(r.state.campaign!.office!.reservations.qwen).toEqual(old.qwen);
});
test('computer requirements override support role for explicit version and template',()=>{
 const {c,s,id}=fixture();c.campaign!.office!.computerVersions.push('mistral.7b');const r=dispatchCommand(s,{type:'assign',job:id,team:[...team(['qwen','llama','bluewhale']),...team(['mistral'],'planner')]},c);expect(r.error).toBe('NO_WORKSTATION');
 c.campaign!.office!.computerVersions=[];c.campaign!.office!.computerTemplates.push(s.jobs[0]!.template);expect(dispatchCommand(s,{type:'assign',job:id,team:[...team(['qwen','llama','bluewhale']),...team(['mistral'],'reviewer')]},c).error).toBe('NO_WORKSTATION');
});
test('clarification claims a meeting seat for one slot, cannot overbook, releases on advance',()=>{
 const {c,s}=fixture(),job=s.jobs.find(j=>j.template==='website')!;job.hidden=4;let current=s;
 for(const character of ['qwen','llama']){const r=dispatchCommand(current,{type:'clarify',job:job.id,character},c);expect(r.error).toBeNull();current=r.state;}
 expect(dispatchCommand(current,{type:'clarify',job:job.id,character:'bluewhale'},c).error).toBe('NO_MEETING_SEAT');
 const next=dispatchCommand(current,{type:'advance'},c);expect(next.error).toBeNull();expect(next.state.campaign!.office!.reservations).toEqual({});
});
test.each(['working','review','waiting'] as const)('%s facilities cannot be moved, upgraded or stored',status=>{
 const {c,s,id}=fixture();const r=dispatchCommand(s,{type:'assign',job:id,team:team(['qwen'])},c);const current=r.state;current.jobs[0]!.status=status;
 const o=current.campaign!.office!,reserved=o.reservations.qwen!.item;
 for(const change of [{slot:null},{kind:'standard'},{slot:'work-4'}]){const cmd=officeCommand(o.items.map(i=>i.id===reserved?{...i,...change}:i),o.revision);const result=dispatchCommand(current,cmd,c);expect(result.error).toBe('FURNITURE_IN_USE');expect(result.state).toBe(current);}
 current.jobs[0]!.status='delivered';const next=dispatchCommand(current,{type:'advance'},c).state;expect(next.campaign!.office!.reservations.qwen).toBeUndefined();
});
test('swap, warehouse and upgrade are conserved; malformed edits roll back cash, state and RNG',()=>{
 const {c,s}=fixture(),o=s.campaign!.office!,items=o.items.map(i=>({...i}));items[0]!.slot='work-2';items[1]!.slot='work-1';items[2]!.slot=null;items[0]!.kind='standard';
 const r=dispatchCommand(s,officeCommand(items,o.revision),c);expect(r.error).toBeNull();expect(s.cash-r.state.cash).toBe(370);expect(r.state.campaign!.office!.items).toHaveLength(5);
 const invalid=[items.slice(1),[...items,items[0]!],items.map(i=>i.id==='f1'?{...i,slot:'meeting-1'}:i),[...items,{id:'f999',kind:'basic',slot:null}]];
 for(const draft of invalid){const before=structuredClone(s),result=dispatchCommand(s,officeCommand(draft,o.revision),c);expect(result.error).not.toBeNull();expect(result.state).toBe(s);expect(s).toEqual(before);}
 s.cash=10;expect(dispatchCommand(s,officeCommand(items,o.revision),c).error).toBe('INSUFFICIENT_CASH');
});
test.each([0,1,2,3,4])('chapter %s slot limits and capacity match published limits',chapter=>{
 const {c,s}=fixture();s.campaign!.chapter=chapter;const o=s.campaign!.office!;expect(officeSlots(chapter).filter(x=>x.startsWith('work'))).toHaveLength(officeLimit(chapter));
 expect(dispatchCommand(s,officeCommand([...o.items,{id:'new:0',kind:'basic',slot:`work-${officeLimit(chapter)+1}`}],0),c).error).toBe('INVALID_OFFICE_SLOT');
});
test('content validates furniture and requirement references',()=>{const c=loadFullContent();c.campaign!.office!.computerVersions.push('missing');expect(()=>validateContent(c)).toThrow('OFFICE_REFERENCE');});
test.each(labCases)('real HUD fixture %s creates isolated reproducible session',async name=>{const a=labSession(loadFullContent(),name),b=labSession(loadFullContent(),name);expect(a.view).toEqual(b.view);expect(await a.exportSave()).toBe(await b.exportSave());});
test('fixture storage is disposable and never opens browser storage',async()=>{const storage=new LabSaves();expect(await storage.list()).toHaveLength(9);await storage.write('manual-1','test',0);expect((await storage.read('manual-1'))?.revision).toBe(1);await storage.close();expect(await storage.read('manual-1')).toBeNull();});
test.each([[390,844],[680,900],[1280,720],[1920,1080],[2560,1080]])('camera maps work focus within HUD safe rectangle at %s×%s',(w,h)=>{const cam=officeCamera(w,h,'work-left');for(const id of ['work-1','work-2']){const p=slotPoint(id);const x=cam.x+p.x*cam.scale,y=cam.y+p.y*cam.scale;expect(x).toBeGreaterThan(cam.clip.x);expect(x).toBeLessThan(cam.clip.x+cam.clip.width);expect(y).toBeGreaterThan(cam.clip.y);expect(y+40*cam.scale).toBeLessThan(cam.clip.y+cam.clip.height);}});
test('view office data is detached',()=>{const {c,s}=fixture(),v=getViewModel(s,c);v.office!.items[0]!.slot=null;expect(s.campaign!.office!.items[0]!.slot).toBe('work-1');});
test('office ownership, purchases and reservations survive IndexedDB close/reopen and replay',async()=>{
 const c=loadFullContent(),session=new GameSession(c,1),factory=new IDBFactory(),db=new BrowserSaves('office-reopen',factory),o=session.view.office!;
 expect(session.send(officeCommand([...o.items,{id:'new:0',kind:'basic',slot:'work-4'}],0)).error).toBeNull();
 const id=session.view.jobs[0]!.id;session.send({type:'accept',job:id});session.send({type:'assign',job:id,team:team(['qwen'])});
 await db.write('manual-1',await session.exportSave(),0);await db.close();const reopened=new BrowserSaves('office-reopen',factory);
 try{const restored=new GameSession(c,9);await restored.importSave((await reopened.read('manual-1'))!.text);expect(restored.view).toEqual(session.view);expect(await restored.exportSave()).toBe(await session.exportSave());}finally{await reopened.close();}
});
