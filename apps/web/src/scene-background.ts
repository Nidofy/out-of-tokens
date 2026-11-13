/** Decode before swapping; stale requests cannot replace a newer scene. */
export function sceneBackground(host:HTMLElement){
 let desired='',destroyed=false;
 const loaded=new Map<string,Promise<void>>();
 const decode=(src:string)=>{let task=loaded.get(src);if(!task){const image=new Image();image.src=src;task=image.decode().catch(error=>{loaded.delete(src);throw error;});loaded.set(src,task);}return task;};
 return {set(src:string,night:boolean,alternate?:string){if(src===desired)return;desired=src;void decode(src).then(()=>{if(destroyed||desired!==src)return;host.style.backgroundImage=`url("${src}")`;host.parentElement?.setAttribute('data-background',night?'night':'day');if(alternate)void decode(alternate).catch(()=>{});}).catch(()=>{if(desired===src)desired='';});},destroy(){destroyed=true;loaded.clear();}};
}
