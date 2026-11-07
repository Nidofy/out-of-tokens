export function waitingUpdate(reg: Pick<ServiceWorkerRegistration,'waiting'>, controlled: boolean) {
 return controlled && reg.waiting?.state === 'installed' ? reg.waiting : null;
}
export function activateUpdate(worker: ServiceWorker, service: Pick<ServiceWorkerContainer,'addEventListener'|'removeEventListener'>, reload:()=>void) {
 if(worker.state==='activated'){reload();return;}
 const done=()=>{service.removeEventListener('controllerchange',done);reload();};
 service.addEventListener('controllerchange',done,{once:true});
 worker.postMessage({type:'ACTIVATE'});
}
