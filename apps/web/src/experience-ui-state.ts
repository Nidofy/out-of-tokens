import type {Member} from 'oot-core';
import type {GameView} from 'oot-platform';
import type {LivingThreadView} from './living-adapter.js';

export const UI_META_PREFIX='oot-ui:';
export const UI_LINEAGES_KEY='oot-ui:__lineages__';
export const MAX_UI_LINEAGES=8;

export type LearningNodeId='accept'|'assign'|'advance'|'deliver'|'clarify'|'rest'|'bill';

export interface LearningPrefs {
 skippedNodes:LearningNodeId[];
 skippedAll:boolean;
}

export interface UiKeyValueStore {
 getItem(key:string):string|null;
 setItem(key:string,value:string):void;
 removeItem(key:string):void;
}

export function createBrowserUiStore(storage:Storage|undefined=typeof localStorage!=='undefined'?localStorage:undefined):UiKeyValueStore{
 return {
  getItem(key){try{return storage?.getItem(key)??null;}catch{return null;}},
  setItem(key,value){try{storage?.setItem(key,value);}catch{/* Private browsing or denied storage never blocks play. */}},
  removeItem(key){try{storage?.removeItem(key);}catch{/* Ignore storage removal failure. */}}
 };
}

export function createMemoryUiStore():UiKeyValueStore{
 const map=new Map<string,string>();
 return {
  getItem:k=>map.get(k)??null,
  setItem:(k,v)=>{map.set(k,v);},
  removeItem:k=>{map.delete(k);}
 };
}

function lineageKey(lineageId:string,suffix:'threads'|'learning'|'last-team'){
 return `${UI_META_PREFIX}${lineageId}:${suffix}`;
}

export function touchUiLineage(store:UiKeyValueStore,lineageId:string):string[]{
 if(!lineageId)return [];
 let list:string[]=[];
 try{
  const raw=store.getItem(UI_LINEAGES_KEY);
  const parsed=raw?JSON.parse(raw):[];
  if(Array.isArray(parsed))list=parsed.filter((x):x is string=>typeof x==='string'&&x.length>0);
 }catch{list=[];}
 const next=[...list.filter(id=>id!==lineageId),lineageId];
 while(next.length>MAX_UI_LINEAGES){
  const evicted=next.shift()!;
  store.removeItem(lineageKey(evicted,'threads'));
  store.removeItem(lineageKey(evicted,'learning'));
  store.removeItem(lineageKey(evicted,'last-team'));
 }
 store.setItem(UI_LINEAGES_KEY,JSON.stringify(next));
 return next;
}

export function readThreadReadIds(store:UiKeyValueStore,lineageId:string):Set<string>{
 if(!lineageId)return new Set();
 try{
  const raw=store.getItem(lineageKey(lineageId,'threads'));
  const parsed=raw?JSON.parse(raw):[];
  return new Set(Array.isArray(parsed)?parsed.filter((x):x is string=>typeof x==='string'):[]);
 }catch{return new Set();}
}

export function markThreadRead(store:UiKeyValueStore,lineageId:string,threadId:string):Set<string>{
 touchUiLineage(store,lineageId);
 const current=readThreadReadIds(store,lineageId);
 if(current.has(threadId))return current;
 current.add(threadId);
 store.setItem(lineageKey(lineageId,'threads'),JSON.stringify([...current]));
 return current;
}

export function isThreadUnread(thread:Pick<LivingThreadView,'id'|'chosenReply'>,readIds:ReadonlySet<string>):boolean{
 return thread.chosenReply===null&&!readIds.has(thread.id);
}

export function countUnreadThreads(threads:readonly Pick<LivingThreadView,'id'|'chosenReply'>[],readIds:ReadonlySet<string>):number{
 let count=0;
 for(const t of threads)if(isThreadUnread(t,readIds))count++;
 return count;
}

export function readLearningPrefs(store:UiKeyValueStore,lineageId:string):LearningPrefs{
 if(!lineageId)return {skippedNodes:[],skippedAll:false};
 try{
  const raw=store.getItem(lineageKey(lineageId,'learning'));
  if(!raw)return {skippedNodes:[],skippedAll:false};
  const parsed=JSON.parse(raw) as Partial<LearningPrefs>;
  return {
   skippedNodes:Array.isArray(parsed.skippedNodes)?parsed.skippedNodes.filter((x):x is LearningNodeId=>typeof x==='string') as LearningNodeId[]:[],
   skippedAll:Boolean(parsed.skippedAll)
  };
 }catch{return {skippedNodes:[],skippedAll:false};}
}

const learningListeners=new Set<() => void>();

export function subscribeLearningPrefs(listener:()=>void):()=>void{
 learningListeners.add(listener);
 return()=>{learningListeners.delete(listener);};
}

function notifyLearningPrefs():void{
 for(const listener of learningListeners)listener();
}

export function skipLearningNode(store:UiKeyValueStore,lineageId:string,node:LearningNodeId):LearningPrefs{
 touchUiLineage(store,lineageId);
 const prefs=readLearningPrefs(store,lineageId);
 if(!prefs.skippedNodes.includes(node))prefs.skippedNodes=[...prefs.skippedNodes,node];
 store.setItem(lineageKey(lineageId,'learning'),JSON.stringify(prefs));
 notifyLearningPrefs();
 return prefs;
}

export function skipAllLearning(store:UiKeyValueStore,lineageId:string,skippedAll:boolean):LearningPrefs{
 touchUiLineage(store,lineageId);
 const prefs=readLearningPrefs(store,lineageId);
 prefs.skippedAll=skippedAll;
 store.setItem(lineageKey(lineageId,'learning'),JSON.stringify(prefs));
 notifyLearningPrefs();
 return prefs;
}

export function resumeLearning(store:UiKeyValueStore,lineageId:string):LearningPrefs{
 touchUiLineage(store,lineageId);
 const prefs:LearningPrefs={skippedNodes:[],skippedAll:false};
 store.setItem(lineageKey(lineageId,'learning'),JSON.stringify(prefs));
 notifyLearningPrefs();
 return prefs;
}

export function writeLastTeamDraft(store:UiKeyValueStore,lineageId:string,team:readonly Member[]):void{
 if(!lineageId||team.length===0)return;
 touchUiLineage(store,lineageId);
 store.setItem(lineageKey(lineageId,'last-team'),JSON.stringify(team.map(m=>({character:m.character,role:m.role,mode:m.mode}))));
}

export function readLastTeamDraft(store:UiKeyValueStore,lineageId:string):Member[]{
 if(!lineageId)return [];
 try{
  const raw=store.getItem(lineageKey(lineageId,'last-team'));
  const parsed=raw?JSON.parse(raw):[];
  if(!Array.isArray(parsed))return [];
  return parsed.filter((m):m is Member=>
   typeof m==='object'&&m!==null&&typeof m.character==='string'
   &&['worker','planner','reviewer','tool'].includes(m.role)
   &&['cloud','local'].includes(m.mode)
  );
 }catch{return [];}
}

export function filterValidLastTeamMembers(saved:readonly Member[],view:GameView):{valid:Member[];dropped:string[]}{
 const maxTeam=(view.campaign?.chapter??0)<=2?4:6;
 const hasToolUpgrade=!!view.campaign?.software.includes('mcp');
 const valid:Member[]=[];
 const dropped:string[]=[];
 let toolCount=0,plannerCount=0,reviewerCount=0;
 for(const m of saved){
  const actor=view.actors.find(a=>a.id===m.character);
  if(!actor||actor.busy||actor.location==='expedition'){dropped.push(m.character);continue;}
  if(!actor.modes.includes(m.mode)){dropped.push(m.character);continue;}
  if(m.role==='tool'&&(!hasToolUpgrade||toolCount>=1)){dropped.push(m.character);continue;}
  if(m.role==='planner'&&plannerCount>=1){dropped.push(m.character);continue;}
  if(m.role==='reviewer'&&reviewerCount>=1){dropped.push(m.character);continue;}
  if(valid.length>=maxTeam){dropped.push(m.character);continue;}
  if(m.role==='tool')toolCount++;
  if(m.role==='planner')plannerCount++;
  if(m.role==='reviewer')reviewerCount++;
  valid.push({...m});
 }
 return {valid,dropped};
}
