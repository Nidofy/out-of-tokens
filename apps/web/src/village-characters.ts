import {Assets,Texture} from 'pixi.js';
import type {Character,Expression,Pose} from './art/types.js';
import {actorIds} from './studio-ui.js';
export interface VillageRig {character:Character;textures:Map<string,Texture>}
const loaded=new Map<string,Promise<VillageRig>>();
/** Fixed local production assets, copied byte-for-byte from the user's AI Village. */
export function loadVillageCharacter(id:string):Promise<VillageRig>{
 if(!actorIds.includes(id))return Promise.reject(Error('UNKNOWN_CHARACTER'));
 const existing=loaded.get(id);if(existing)return existing;
 const task=(async()=>{const base=`./art/ai-village/${id}/`,response=await fetch(base+'character.json');if(!response.ok)throw Error('CHARACTER_UNAVAILABLE');const character=await response.json() as Character;
  const files=[...new Set(character.parts.flatMap(p=>[p.file,...Object.values(p.expressions??{})].filter((f):f is string=>!!f)))];
  const textures=new Map(await Promise.all(files.map(async file=>[file,await Assets.load<Texture>(base+file)] as const)));return {character,textures};
 })();loaded.set(id,task);void task.catch(()=>{if(loaded.get(id)===task)loaded.delete(id);});return task;
}
export function villagePose(character:Character,y:number,rotation:number,expression:Expression):Pose{
 return {expression,ended:false,transforms:Object.fromEntries(character.parts.map(p=>[p.id,{x:0,y:p.id==='root'?y:0,rotation:p.id==='body'?rotation:0,scaleX:1,scaleY:1}]))};
}
export function activityPose(character:Character,phase:number,activity:string,walking:boolean,expression:Expression,still:boolean):Pose{
 const wave=still?0:Math.sin(phase*(walking?10:activity==='work'?6:2));
 const pose=villagePose(character,still?0:walking?wave*8:expression==='happy'?-Math.abs(wave)*15:wave*4,activity==='rest'?3:activity==='review'||activity==='read'?2:0,expression==='neutral'&&activity==='rest'?'sleepy':expression);
 for(const [id,t] of Object.entries(pose.transforms)){
  if(id==='arm-left'||id==='arm-right'){const side=id==='arm-left'?1:-1;t.rotation=walking?side*wave*9:activity==='work'?side*(12+wave*3):activity==='meal'?side*(24+wave*5):activity==='read'||activity==='review'?side*17:0;}
  if(id==='leg-left'||id==='leg-right')t.rotation=walking?(id==='leg-left'?1:-1)*wave*7:0;
  if(id==='head'&&(activity==='review'||activity==='think'))t.rotation=still?0:wave*2;
 }
 return pose;
}
