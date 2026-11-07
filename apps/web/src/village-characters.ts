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
 })();loaded.set(id,task);return task;
}
export function villagePose(character:Character,y:number,rotation:number,expression:Expression):Pose{
 return {expression,ended:false,transforms:Object.fromEntries(character.parts.map(p=>[p.id,{x:0,y:p.id==='root'?y:0,rotation:p.id==='body'?rotation:0,scaleX:1,scaleY:1}]))};
}
