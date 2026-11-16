import type {GameView} from 'oot-platform';
import type {Skill} from 'oot-core';

export type HubPanel='actors'|'jobs'|'studio'|'journal';
export type ProfileTab='vitals'|'model'|'training'|'stories';

export interface AdvanceInfo {
 label:string;
 subtitle:string;
 disabled:boolean;
 disabledReason:string|null;
 urgentReviewIds:string[];
}

export function advancePeriodInfo(view:GameView,busy:boolean,arranging:boolean,english:boolean):AdvanceInfo{
 const tr=(zh:string,en:string)=>english?en:zh;
 const p=view.campaign,endingDone=!!p?.finale?.ending&&!p.finale.endless;
 const slot=view.absoluteSlot%4;
 const label=slot===3?tr('迎来新一天','Start new day'):tr('下一时段','Next period');
 const urgentReviewIds=view.jobs.filter(j=>j.status==='review'&&j.deadline<=view.absoluteSlot).map(j=>j.id);
 if(busy)return {label,subtitle:tr('正在处理操作…','Processing action…'),disabled:true,disabledReason:tr('操作进行中','Operation in progress'),urgentReviewIds};
 if(arranging)return {label,subtitle:tr('先完成办公室布置','Finish office layout first'),disabled:true,disabledReason:tr('布置草稿未保存','Layout editor is open'),urgentReviewIds};
 if(view.bankrupt)return {label,subtitle:tr('工作室待重整','Studio requires restart'),disabled:true,disabledReason:tr('请先处理破产重开','Resolve bankruptcy restart first'),urgentReviewIds};
 if(view.pending)return {label,subtitle:tr('待处理事件抉择','Resolve pending event'),disabled:true,disabledReason:tr('先作出事件抉择','Resolve the pending event first'),urgentReviewIds};
 if(endingDone)return {label,subtitle:tr('本周目已终局','Run completed'),disabled:true,disabledReason:tr('已达成结局，可开启无尽经营','Ending reached; start endless mode to continue'),urgentReviewIds};

 const reviewCount=view.jobs.filter(j=>j.status==='review').length;
 const workingCount=view.jobs.filter(j=>j.status==='working').length;
 const assignedCount=view.jobs.filter(j=>j.status==='accepted').length;
 if(urgentReviewIds.length>0)return {label,subtitle:tr(`${urgentReviewIds.length} 单待验收且即将逾期`,`${urgentReviewIds.length} review due now`),disabled:false,disabledReason:null,urgentReviewIds};
 if(reviewCount>0)return {label,subtitle:tr(`${reviewCount} 单待验收结算`,`${reviewCount} ready for review`),disabled:false,disabledReason:null,urgentReviewIds};
 if(workingCount>0)return {label,subtitle:tr(`${workingCount} 单推进中`,`${workingCount} in progress`),disabled:false,disabledReason:null,urgentReviewIds};
 if(assignedCount>0)return {label,subtitle:tr(`${assignedCount} 单待派遣团队`,`${assignedCount} awaiting team`),disabled:false,disabledReason:null,urgentReviewIds};
 if(slot>=2)return {label,subtitle:tr('夜晚休整恢复时段','Evening recovery period'),disabled:false,disabledReason:null,urgentReviewIds};
 return {label,subtitle:tr('全员待命 · 可先接单','All idle · Ready for briefs'),disabled:false,disabledReason:null,urgentReviewIds};
}

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
