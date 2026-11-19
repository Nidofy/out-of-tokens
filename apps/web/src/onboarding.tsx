import {useEffect,useMemo,useRef,useState} from 'preact/hooks';
import type {ExperienceView,GameView} from 'oot-platform';
import {Icon} from './icons.js';
import {ExperienceArtSlot} from './experience-art-slot.js';
import {resolveReasonCopy} from './experience-ui-copy.js';
import {readLearningPrefs,resumeLearning,skipAllLearning,skipLearningNode,subscribeLearningPrefs} from './experience-ui-state.js';
import type {LearningNodeId,LearningPrefs,UiKeyValueStore} from './experience-ui-state.js';
import type {HubPanel} from './ui2-logic.js';

export function shouldHideSceneOnboarding(experience:ExperienceView,prefs:LearningPrefs):boolean{
 if(prefs.skippedAll)return true;
 return experience.learning.length>0&&experience.learning.every(item=>item.observed||prefs.skippedNodes.includes(item.node));
}

interface NodeCopy {
 labelZh:string;
 labelEn:string;
 textZh:string;
 textEn:string;
 ctaZh:string;
 ctaEn:string;
 panel:HubPanel;
}

const NODE_META:Record<LearningNodeId,NodeCopy>={
 accept:{
  labelZh:'接单',
  labelEn:'Accept',
  textZh:'打开待接委托卡查看工期、技能权重与质量红线，再点击接取委托。',
  textEn:'Open a commission card to check scope, skill weights, and pass quality before accepting.',
  ctaZh:'查看待接委托',
  ctaEn:'View briefs',
  panel:'jobs'
 },
 assign:{
  labelZh:'派遣',
  labelEn:'Assign',
  textZh:'为已接委托安排至少一位执行者，用实时预估核对算力预算与条件质量区间后再派遣。',
  textEn:'Assign at least one worker and check live compute cost and quality estimate before confirming.',
  ctaZh:'去派遣队伍',
  ctaEn:'Assign team',
  panel:'jobs'
 },
 advance:{
  labelZh:'推进',
  labelEn:'Advance',
  textZh:'点击右下角推进进入下一时段；可先点旁边的预览按钮确认谁工作、谁休息或谁会停工。',
  textEn:'Advance to run the current period; expand the preview icon anytime to see who works, rests, or stalls.',
  ctaZh:'打开工作台委托',
  ctaEn:'Check jobs',
  panel:'jobs'
 },
 deliver:{
  labelZh:'验收',
  labelEn:'Deliver',
  textZh:'阶段完工后进入待验收：核对总评、未澄清扣分与尾款变化；低于及格线可先返工一次。',
  textEn:'Review score, hidden penalties, and payout on completion; rework once before delivery if below pass line.',
  ctaZh:'去验收结算',
  ctaEn:'Review delivery',
  panel:'jobs'
 },
 clarify:{
  labelZh:'澄清',
  labelEn:'Clarify',
  textZh:'遇到含隐藏需求的委托时，接单前请先派合适伙伴澄清（占 1 时段/15 精力），避免验收扣分。',
  textEn:'Clarify hidden requirements before accepting (costs 1 slot / 15 energy) to avoid hidden quality penalties.',
  ctaZh:'找待澄清委托',
  ctaEn:'Find hidden briefs',
  panel:'jobs'
 },
 rest:{
  labelZh:'休整',
  labelEn:'Rest',
  textZh:'晚上不默认工作，深夜完整睡眠可大幅回升精力并清零负载；若安排深夜活动或加班会跳过今晚恢复。',
  textEn:'Evenings pause commissions by default. Full night sleep restores energy and clears load unless occupied.',
  ctaZh:'看伙伴精力与作息',
  ctaEn:'Check teammate rest',
  panel:'actors'
 },
 bill:{
  labelZh:'账单',
  labelEn:'Bills',
  textZh:'第 7 天迎来周结（房租/订阅/本地电费），第 14 天结算旧债；关注净偿付资金，勿把预付款当利润。',
  textEn:'Weekly bills settle every 7 days and inherited debt settles on Day 14. Track net solvency, not cash advances.',
  ctaZh:'看算力与财务',
  ctaEn:'View finance',
  panel:'studio'
 }
};

function defaultRecommendedNode(experience:ExperienceView,skipped:readonly LearningNodeId[]):LearningNodeId{
 const byGoal:Partial<Record<string,LearningNodeId>>={
  'choose-commission':'accept',
  'assign-team':'assign',
  'advance-period':'advance',
  'review-delivery':'deliver'
 };
 const goalMapped=experience.goal?.reason?byGoal[experience.goal.reason]:undefined;
 if(goalMapped&&!skipped.includes(goalMapped))return goalMapped;
 const nextUnseen=experience.learning.find(item=>!item.observed&&!skipped.includes(item.node));
 if(nextUnseen)return nextUnseen.node;
 return experience.learning.find(item=>!skipped.includes(item.node))?.node??'accept';
}

export function Onboarding({
 view,
 experience,
 lineageId,
 uiStore,
 english,
 hidden,
 surface='scene',
 openJob,
 openPanel,
 openFinance
}:{
 isolated?:boolean;
 view:GameView;
 experience:ExperienceView;
 lineageId:string;
 uiStore:UiKeyValueStore;
 english:boolean;
 hidden?:boolean|undefined;
 surface?:'scene'|'drawer'|undefined;
 openJob:(id:string)=>void;
 openPanel:(id:HubPanel)=>void;
 openFinance?:()=>void;
}){
 const tr=(zh:string,en:string)=>english?en:zh;
 const [prefs,setPrefs]=useState(()=>readLearningPrefs(uiStore,lineageId));
 const [open,setOpen]=useState(()=>!readLearningPrefs(uiStore,lineageId).skippedAll&&(view.campaign?.chapter??0)===0);
 const [selectedNode,setSelectedNode]=useState<LearningNodeId|null>(null);
 const mountedSync=useRef({uiStore,lineageId});
 const prefsRef=useRef(prefs);
 prefsRef.current=prefs;

 useEffect(()=>subscribeLearningPrefs(()=>{
  const prev=prefsRef.current;
  const next=readLearningPrefs(uiStore,lineageId);
  setPrefs(next);
  if(next.skippedAll)setOpen(false);
  else if(prev.skippedAll)setOpen(true);
 }),[uiStore,lineageId]);

 useEffect(()=>{
  if(mountedSync.current.uiStore===uiStore&&mountedSync.current.lineageId===lineageId)return;
  mountedSync.current={uiStore,lineageId};
  const nextPrefs=readLearningPrefs(uiStore,lineageId);
  setPrefs(nextPrefs);
  setOpen(!nextPrefs.skippedAll&&(view.campaign?.chapter??0)===0);
  setSelectedNode(null);
 },[uiStore,lineageId]);

 const recommended=defaultRecommendedNode(experience,prefs.skippedNodes);
 const activeNode=selectedNode??recommended;
 const meta=NODE_META[activeNode];
 const observedCount=experience.learning.filter(l=>l.observed).length;
 const activeObserved=!!experience.learning.find(l=>l.node===activeNode)?.observed;
 const activeSkipped=prefs.skippedNodes.includes(activeNode);

 const handleToggle=()=>{
  if(prefs.skippedAll){
   const next=resumeLearning(uiStore,lineageId);
   setPrefs(next);
   setOpen(true);
   return;
  }
  setOpen(v=>!v);
 };

 const handleSkipNode=()=>{
  const next=skipLearningNode(uiStore,lineageId,activeNode);
  setPrefs(next);
  setSelectedNode(null);
 };

 const handleSkipAll=()=>{
  const next=skipAllLearning(uiStore,lineageId,true);
  setPrefs(next);
  setOpen(false);
  setSelectedNode(null);
 };

 const handleReopenAll=()=>{
  const next=resumeLearning(uiStore,lineageId);
  setPrefs(next);
  setSelectedNode(null);
  setOpen(true);
 };

 const goalLine=experience.goal?resolveReasonCopy(experience.goal.reason,english):null;
 const cbRef=useRef({openJob,openPanel,openFinance});
 cbRef.current={openJob,openPanel,openFinance};

 const body=useMemo(()=>{
  const runCtaAction=()=>{
   if(activeNode==='bill'&&cbRef.current.openFinance){cbRef.current.openFinance();return;}
   if(activeNode==='accept'||activeNode==='assign'||activeNode==='deliver'||activeNode==='clarify'){
    const target=activeNode==='deliver'
     ?view.jobs.find(j=>j.status==='review')
     :activeNode==='assign'
      ?view.jobs.find(j=>j.status==='accepted')
      :activeNode==='clarify'
       ?view.jobs.find(j=>j.status==='posted'&&j.hidden>0)
       :view.jobs.find(j=>j.template==='menu'&&j.status==='posted')??view.jobs.find(j=>j.status==='posted');
    if(target){cbRef.current.openJob(target.id);return;}
   }
   cbRef.current.openPanel(meta.panel);
  };
  return (
   <>
    <div class="ui2-guide-head">
     <button
      type="button"
      class="guide-toggle"
      aria-expanded={open}
      onClick={handleToggle}
     >
      <span>{tr('回形针 · 7项核心引导','Paperclip · 7-step guide')} ({observedCount}/7)</span>
      <b>{prefs.skippedAll?tr('重开','Reopen'):open?'−':'+'}</b>
     </button>
     {surface==='scene'?(
      <button
       type="button"
       class="ui2-guide-close"
       aria-label={tr('关闭引导','Close guide')}
       title={tr('关闭主界面引导（可在右上工作看板重开）','Close guide (reopen anytime in Work Board)')}
       onClick={handleSkipAll}
      >
       <Icon name="close"/>
      </button>
     ):(prefs.skippedAll||prefs.skippedNodes.length>0)&&(
      <button type="button" class="ui2-guide-reopen" onClick={handleReopenAll}>
       {tr('重看全部','Reopen all')}
      </button>
     )}
    </div>

    {open&&(
     <div class="ui2-guide-body">
      {goalLine&&(
       <small class="ui2-guide-goal">
        <Icon name="spark"/> {tr('当前建议：','Suggested: ')}{goalLine}
       </small>
      )}

      <div class="ui2-guide-pills" role="tablist" aria-label={tr('七项学习节点','Seven learning steps')}>
       {experience.learning.map(item=>{
        const m=NODE_META[item.node];
        const skipped=prefs.skippedNodes.includes(item.node);
        return (
         <button
          key={item.node}
          type="button"
          role="tab"
          aria-selected={item.node===activeNode}
          class="ui2-guide-pill"
          data-observed={item.observed?'true':'false'}
          data-skipped={skipped?'true':'false'}
          onClick={()=>setSelectedNode(item.node)}
         >
          {item.observed&&<Icon name="check"/>}
          <span>{english?m.labelEn:m.labelZh}</span>
         </button>
        );
       })}
      </div>

      <p class="ui2-guide-copy">
       <b>{english?meta.labelEn:meta.labelZh}</b>
       {activeObserved&&<em> · {tr('已实践','Observed')}</em>}
       {activeSkipped&&<em> · {tr('已跳过','Skipped')}</em>}
       {' — '}
       {english?meta.textEn:meta.textZh}
      </p>

      {activeNode==='rest'&&(
       <ExperienceArtSlot
        slotId="vignette-rest-corner"
        variant="vignette"
        english={english}
        badgeText={tr('作息提示','Rest vignette')}
        title={tr('休整与深夜睡眠恢复','Rest & night sleep recovery')}
        subtitle={tr('空槽休息恢复精力；占满深夜时段将跳过睡前恢复与清零负载','Rest restores energy; occupying Night slot skips sleep & load clear')}
       />
      )}

      <div class="ui2-guide-actions">
       <button type="button" class="primary" onClick={runCtaAction}>{english?meta.ctaEn:meta.ctaZh}</button>
       {!activeSkipped&&(
        <button type="button" onClick={handleSkipNode}>{tr('跳过本条','Skip step')}</button>
       )}
       {surface==='scene'&&prefs.skippedNodes.length>0&&(
        <button type="button" onClick={handleReopenAll}>{tr('重看全部','Reopen all')}</button>
       )}
       <button type="button" onClick={handleSkipAll}>{tr('跳过全部','Skip all')}</button>
      </div>
     </div>
    )}
   </>
  );
 },[open,prefs,selectedNode,experience,view,english,surface]);

 if(surface==='scene'&&shouldHideSceneOnboarding(experience,prefs))return null;

 return (
  <aside class="onboarding" hidden={hidden} aria-label={tr('回形针经营引导','Paperclip studio guide')}>
   {body}
  </aside>
 );
}
