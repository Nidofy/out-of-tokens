import {test,expect} from 'vitest';
import {waitingUpdate,activateUpdate} from './src/updates.js';
test('PWA first installation and an already activated worker do not leave a stale button',()=>{
 const worker={state:'installed'} as ServiceWorker;
 expect(waitingUpdate({waiting:worker},false)).toBeNull();
 expect(waitingUpdate({waiting:worker},true)).toBe(worker);
 expect(waitingUpdate({waiting:null},true)).toBeNull();
 expect(waitingUpdate({waiting:{state:'activated'} as ServiceWorker},true)).toBeNull();
});
test('PWA activation subscribes before posting and reloads on takeover',()=>{
 const service=new EventTarget();let reloads=0;
 const worker={state:'installed',postMessage(){service.dispatchEvent(new Event('controllerchange'));}} as unknown as ServiceWorker;
 activateUpdate(worker,service as unknown as ServiceWorkerContainer,()=>reloads++);
 service.dispatchEvent(new Event('controllerchange'));expect(reloads).toBe(1);
 activateUpdate({state:'activated'} as ServiceWorker,service as unknown as ServiceWorkerContainer,()=>reloads++);expect(reloads).toBe(2);
});
