import type {State,Content} from './model.js';
import {liquidCash} from './economy.js';
export function chapterGoal(s:State,c:Content){
 const p=s.campaign,requirements:{id:string;label:string;labelEn:string;current:number;target:number;met:boolean}[]=[];
 const add=(id:string,label:string,labelEn:string,current:number,target:number)=>requirements.push({id,label,labelEn,current,target,met:current>=target});
 if(!p)return {ready:false,requirements};
 const completed=s.jobs.filter(j=>j.posted>=p.chapterStarted&&j.status==='delivered');
 if(p.chapter===0)add('debt','结清旧债并完成交付','Settle inherited debt and deliver a job',+(p.chapterZero==='passed'),1);
 if(p.chapter===1){add('reputation','声望','Reputation',s.reputation,15);add('cash','净偿付资金','Net solvency',liquidCash(s),2500);add('multi','本章多轮合同末期质量≥75','Final phase quality 75+ on a chapter multi-phase job',+completed.some(j=>j.phase>=2&&j.quality>=75&&c.commissions.find(t=>t.id===j.template)!.delivery==='multi'),1);}
 if(p.chapter===2){add('retainer','本章三期长期合同末期质量≥80','Final phase quality 80+ on a three-phase chapter retainer',+completed.some(j=>j.phase>=3&&j.quality>=80&&c.commissions.find(t=>t.id===j.template)!.delivery==='retainer'),1);add('versions','高级版本研发数','Advanced versions researched',p.unlocked.length-new Set(c.versions.map(v=>v.character)).size,2);}
 if(p.chapter===3){add('reputation','声望','Reputation',s.reputation,20);add('cash','净偿付资金','Net solvency',liquidCash(s),4000);add('network','网络等级','Network level',p.hardware.network,2);add('bid','赢得竞标','Win a bid',+(p.finale?.bids.some(b=>b.won)??false),1);}
 if(p.chapter===4){add('souvenirs','远征纪念物种类','Distinct expedition souvenirs',p.finale?.souvenirs.length??0,2);add('research','保留研发点','Research retained',p.research,30);add('cash','净偿付资金','Net solvency',liquidCash(s),6000);}
 for(const d of c.campaign?.projects??[])if(d.chapter===p.chapter&&d.requiredForChapter)add(d.id,d.title,d.titleEn,+(p.projects?.[d.id]?.completed??false),1);
 return {ready:!p.completed.includes(p.chapter)&&requirements.length>0&&requirements.every(r=>r.met),requirements};
}
