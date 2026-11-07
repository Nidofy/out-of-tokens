import type {Content,Job,State} from './model.js';
import {balance} from './economy.js';
import {owns} from './campaign.js';
const round=(n:number)=>Math.round(n*100)/100;
export function settlement(s:State,c:Content,j:Job){
 const t=c.commissions.find(t=>t.id===j.template)!;
 const lines=t.qualityLines??[60,75,90];
 const tier:'excellent'|'good'|'pass'|'fail'=j.quality>=lines[2]!?'excellent':j.quality>=lines[1]!?'good':j.quality>=lines[0]!?'pass':'fail';
 const multiplier=tier==='excellent'?1.35:tier==='good'?1.15:tier==='pass'?1:0;
 const late=Math.max(0,s.absoluteSlot-j.deadline),lateFactor=Math.max(0,1-late*.1);
 const contract=t.reward*(j.rewardFactor??1)*balance(c).rewardScale*(owns(s,'crm')&&t.delivery==='retainer'?1.2:1);
 const gross=round(contract*multiplier*lateFactor);
 const penalty=round(t.reward*balance(c).rewardScale*.3);
 const canRework=j.status==='review'&&tier==='fail'&&!j.reworked&&s.absoluteSlot<=j.deadline;
 return {tier,multiplier,late,lateFactor,contract:round(contract),gross,advance:j.advance,net:tier==='fail'?round(-j.advance-t.reward*balance(c).rewardScale*.3):round(gross-j.advance),penalty,canRework,
  canDeliver:j.status==='review'&&!canRework,reputation:tier==='excellent'?4:tier==='good'?2:tier==='pass'?1:-8};
}
