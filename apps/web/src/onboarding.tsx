import {useState} from 'preact/hooks';
import type {GameView} from 'oot-platform';
const guideKey='oot-ui-opening-guide-v1';
function guideHidden(){try{return localStorage.getItem(guideKey)==='hidden';}catch{return false;}}
export function onboardingStep(view:GameView){
 if(view.bankrupt)return {key:'restart',job:null};
 const review=view.jobs.find(j=>j.status==='review');if(review)return {key:review.settlement.canRework?'rework':'deliver',job:review.id};
 if(view.campaign&&view.campaign.chapter>0)return {key:'chapter',job:null};
 const unassigned=view.jobs.find(j=>j.status==='accepted');if(unassigned)return {key:'assign',job:unassigned.id};
 if(view.absoluteSlot%4>=2&&view.absoluteSlot<28)return {key:'rest',job:null};
 if(view.jobs.some(j=>j.status==='working'))return {key:'work',job:null};
 const delivered=view.jobs.filter(j=>j.status==='delivered');
 const menu=view.jobs.find(j=>j.template==='menu'&&j.status==='posted');
 if(!delivered.length&&menu)return {key:'menu',job:menu.id};
 const unclear=view.jobs.find(j=>j.status==='posted'&&j.hidden>0);
 if(unclear&&view.absoluteSlot<28)return {key:'clarify',job:unclear.id};
 return {key:view.absoluteSlot<28?'next':'weekly',job:null};
}
export function Onboarding({view,english,openJob,openPanel}:{view:GameView;english:boolean;openJob:(id:string)=>void;openPanel:(id:'jobs'|'actors'|'studio')=>void}){
 const [hidden,setHidden]=useState(guideHidden),step=onboardingStep(view),tr=(zh:string,en:string)=>english?en:zh;
 const toggle=()=>{const next=!hidden;setHidden(next);try{localStorage.setItem(guideKey,next?'hidden':'shown');}catch{/* Preference storage must not block play. */}};
 const copy:Record<string,[string,string]>={menu:['第一单：奶茶菜单。读清范围与能力权重，再接单。','First job: the tea menu. Read the scope and skill weights before accepting.'],assign:['至少选择一位执行者。比较方案预算与质量风险，再确认派遣。','Choose at least one worker. Compare budget and quality risks, then assign.'],work:['推进时段执行委托；事件出现时先作选择。留意资源与看板。','Advance time to work; resolve events when they appear. Watch resources and the work board.'],clarify:['接下一单前先澄清。每次占用伙伴一个时段；失败也会消耗精力。','Clarify before accepting. Each attempt takes a personal period and energy, even if it fails.'],rest:['晚上不默认工作。去食堂吃饭、图书馆找人或聊天；休息后再比较方案。','Evenings are not automatic work periods. Eat, visit or chat, then compare the rested team.'],deliver:['查看评级、扣分与本次尾款，再验收。多期合同只结算当前一期。','Read the grade, penalties and cash change before delivery. Multi-phase jobs settle one phase at a time.'],rework:['质量未过线，但还有一次返工机会。返工后重新派遣并复核截止时间。','Quality is below the line, but rework is available. Reassign and check the deadline afterwards.'],next:['可以接新单，也可以先读伙伴故事。第7天有账单，第14天结算旧债。','Take another job or read a teammate’s story. Bills arrive on day 7 and inherited debt on day 14.'],weekly:['检查净偿付资金与下一次周结。第0章目标是偿清旧债后仍能经营。','Check net solvency and the next bill. Chapter zero asks you to keep operating after inherited debt is settled.'],restart:['工作室需要重新出发。经营面板可继承重开；检查旧账与人手安排。','The studio needs a fresh start. Restart from management and reconsider bills and staffing.']};
 copy.chapter=['第一笔大订单已开放。到工作室选择交付路线，逐期验收；项目材料和经营目标都达成后再举行路演。','The large order is open. Choose a route in Studio and accept every phase. Hold the pitch after both project materials and business goals are ready.'];
 if((view.campaign?.chapter??0)>1)copy.chapter=['新章节已开始。到工作室查看目标进度，再决定招募、研发和下一份合同。','A new chapter has begun. Check goal progress in Studio before recruiting, researching or accepting another contract.'];
 if(view.absoluteSlot<56)copy.weekly=['第14天要结算旧债。先看净偿付资金：多期合同持续占用人手，预付款还不是净收入。短单可更快回款。','Inherited debt is due on day 14. Check net solvency: multi-phase contracts keep teammates occupied, and advances are not earned income. Short jobs can pay sooner.'];
 return <aside class="onboarding"><button class="guide-toggle" aria-expanded={!hidden} onClick={toggle}>{tr('回形针 · 开业手册','Paperclip · Opening guide')} {hidden?'+':'−'}</button>{!hidden&&<><p>{copy[step.key]?.[english?1:0]}</p><button onClick={()=>step.job?openJob(step.job):openPanel(step.key==='rest'?'actors':step.key==='weekly'||step.key==='restart'||step.key==='chapter'?'studio':'jobs')}>{tr('去看看','Take a look')}</button></>}</aside>;
}
