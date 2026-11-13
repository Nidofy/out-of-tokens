/** Decode before swapping; retain only the two most recently requested backgrounds. */
export function sceneBackground(host:HTMLElement){
 let desired='',destroyed=false;
 const loaded=new Map<string,{image:HTMLImageElement;ready:Promise<void>}>();
 const decode=(src:string)=>{
  let entry=loaded.get(src);
  if(entry){loaded.delete(src);loaded.set(src,entry);return entry.ready;}
  const image=new Image();image.src=src;
  entry={image,ready:image.decode().catch(error=>{if(loaded.get(src)===entry)loaded.delete(src);throw error;})};
  loaded.set(src,entry);
  while(loaded.size>2)loaded.delete(loaded.keys().next().value!);
  return entry.ready;
 };
 // Do not predecode an unseen alternate while character textures are loading.
 return {set(src:string,night:boolean){if(destroyed||src===desired)return;desired=src;void decode(src).then(()=>{if(destroyed||desired!==src)return;host.style.backgroundImage=`url("${src}")`;host.parentElement?.setAttribute('data-background',night?'night':'day');}).catch(()=>{if(desired===src)desired='';});},destroy(){destroyed=true;loaded.clear();}};
}
