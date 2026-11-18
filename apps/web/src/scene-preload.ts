let sceneModule:Promise<typeof import('./scene.js')>|undefined;
export const loadScene=()=>sceneModule??=import('./scene.js');
/** Begin the always-visible scene download alongside the first UI render. */
export function preloadWorkshop(){void loadScene().catch(()=>{});}
if(typeof window!=='undefined'){
 const sp=new URLSearchParams(location.search);
 const skip=((import.meta.env.DEV||import.meta.env.MODE==='visual-review')&&sp.has('art-preview'))||(import.meta.env.DEV&&sp.has('scene-lab'));
 if(!skip)preloadWorkshop();
}
