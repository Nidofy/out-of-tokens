import type {GameView} from 'oot-platform';
import type {Skill} from 'oot-core';
export type {AdvanceInfo} from './experience-adapter.js';

export type HubPanel='actors'|'jobs'|'studio'|'journal';
export type ProfileTab='vitals'|'model'|'training'|'stories';

export type ShortcutCommand=
 |{type:'panel';panel:HubPanel}
 |{type:'map'}
 |{type:'chat'}
 |{type:'actor-step';delta:-1|1};

export interface ShortcutInput {
 key:string;
 ctrlKey:boolean;
 metaKey:boolean;
 altKey:boolean;
 isComposing:boolean;
 repeat:boolean;
 targetTag?:string|undefined;
 targetEditable?:boolean|undefined;
}

export interface ShortcutGuardState {
 blockedModal:boolean;
 actorOpen:boolean;
}

export function resolveGlobalShortcut(input:ShortcutInput,state:ShortcutGuardState):ShortcutCommand|null{
 if(input.ctrlKey||input.metaKey||input.altKey||input.isComposing||input.repeat)return null;
 const tag=input.targetTag?.toUpperCase()??'';
 if(tag==='INPUT'||tag==='SELECT'||tag==='TEXTAREA'||input.targetEditable)return null;
 if(state.blockedModal)return null;
 if(input.key==='1')return {type:'panel',panel:'actors'};
 if(input.key==='2')return {type:'panel',panel:'jobs'};
 if(input.key==='3')return {type:'panel',panel:'studio'};
 if(input.key==='4')return {type:'panel',panel:'journal'};
 if(input.key==='m'||input.key==='M')return {type:'map'};
 if(input.key==='c'||input.key==='C')return {type:'chat'};
 if(state.actorOpen&&input.key==='[')return {type:'actor-step',delta:-1};
 if(state.actorOpen&&input.key===']')return {type:'actor-step',delta:1};
 return null;
}

export function resolveProfileTab(preferred:ProfileTab,hasActor:boolean):ProfileTab{
 if(!hasActor&&(preferred==='vitals'||preferred==='training'))return 'model';
 return preferred;
}

export function isFlagshipUnlocked(view:Pick<GameView,'campaign'>,characterId:string,stageBVersionId:string|null):boolean{
 const p=view.campaign;
 if(!p)return false;
 if(stageBVersionId&&p.unlocked.includes(stageBVersionId))return true;
 const rel=p.relations[characterId];
 if(!rel)return false;
 return rel.affinity>=60||rel.stories.length>=1;
}

export function topJobSkillWeights(weights:Record<Skill,number>,limit=2):{skill:Skill;weight:number;pct:number}[]{
 return (Object.entries(weights) as [Skill,number][])
  .filter(([,w])=>w>0)
  .sort((a,b)=>b[1]-a[1])
  .slice(0,limit)
  .map(([skill,weight])=>({skill,weight,pct:Math.round(weight*100)}));
}

export function ledgerWindowSummary(ledger:readonly {slot:number;reason:string;amount:number}[]){
 let inflow=0,outflow=0;
 for(const row of ledger){
  if(row.amount>=0)inflow+=row.amount;
  else outflow+=Math.abs(row.amount);
 }
 return {count:ledger.length,inflow:Number(inflow.toFixed(2)),outflow:Number(outflow.toFixed(2)),net:Number((inflow-outflow).toFixed(2))};
}

export interface CameraTargetValues {
 x:number;
 y:number;
 scale:number;
}

/** Frame-rate independent exponential damping (tau = 75 ms); bypasses instantly during pointer drag/zoom or reduced motion. */
export function stepDampedCamera(current:CameraTargetValues,target:CameraTargetValues,dtMs:number,bypass:boolean):{values:CameraTargetValues;settled:boolean}{
 if(bypass||dtMs<=0)return {values:{...target},settled:true};
 const alpha=1-Math.exp(-Math.min(dtMs,100)/75);
 const nx=current.x+(target.x-current.x)*alpha;
 const ny=current.y+(target.y-current.y)*alpha;
 const ns=current.scale+(target.scale-current.scale)*alpha;
 if(Math.abs(target.x-nx)<0.5&&Math.abs(target.y-ny)<0.5&&Math.abs(target.scale-ns)<0.002){
  return {values:{...target},settled:true};
 }
 return {values:{x:nx,y:ny,scale:ns},settled:false};
}
