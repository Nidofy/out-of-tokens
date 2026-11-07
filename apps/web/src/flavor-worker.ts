import {flavor,parseFlavorPack} from './flavor.js';
import type {FlavorContext} from './flavor.js';
const scope=globalThis as unknown as {onmessage:((e:MessageEvent<{id:number;context:FlavorContext;retro:boolean;pack?:string}>)=>void)|null;postMessage:(data:unknown)=>void};
scope.onmessage=e=>{try{const {id,context,retro,pack}=e.data;scope.postMessage({id,text:flavor(context,retro,pack?parseFlavorPack(pack):undefined)});}catch{scope.postMessage({id:e.data.id,error:true});}};
