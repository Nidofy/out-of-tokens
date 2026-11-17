import type { Content, State, Job, Version } from './model.js';
import { balance, round, moodFactor, fatigueFactor } from './economy.js';
import { effectiveVersion, activeJobDuos, duoEfficiency, owns, needsFactor } from './campaign.js';
import { stationEffects } from './office.js';
import { estimateResources } from './preview.js';
import { challengeAllows } from './finale.js';
import { eligible } from './events.js';

type Certainty = {certainty:'certain'} | {certainty:'conditional';conditions:readonly ['no-event-interference']};
type Fact<R extends string> = Certainty & {reason:R;actorId?:string;jobId?:string;amount?:number;unit?:'energy'|'cash'};
export interface PeriodFacts {
    slot:number;nextSlot:number;
    working:Fact<'contract-work'|'overtime'>[];
    resting:Fact<'idle-recover'|'night-sleep'>[];
    recoverySkipped:Fact<'sleep-skipped-by-activity'>[];
    waiting:Fact<'next-work-slot'|'clarify-pending'|'review-pending'>[];
    stops:Fact<'cloud-quota'|'local-capacity'>[];
    deadlines:Fact<'due-this-slot'|'due-next-day'>[];
    bills:Fact<'weekly-bill'|'debt-due'|'electricity'>[];
    blocked:null|'pending-choice'|'bankrupt'|'ending'|'arranging';
}
const version=(c:Content,a:State['actors'][number],s:State,mode:'cloud'|'local')=>effectiveVersion(s,c,a,mode);
const match=(c:Content,j:Job,v:Version)=>Object.entries(c.commissions.find(t=>t.id===j.template)!.weights).reduce((sum,[key,value])=>sum+value*v.skills[key as keyof typeof v.skills]/10,0);
/** Independent scalar projection. Never dispatches advance/choose, rolls RNG, or computes quality. */
export function previewPeriod(s:State,c:Content):PeriodFacts {
    const result:PeriodFacts={slot:s.absoluteSlot,nextSlot:s.absoluteSlot+1,working:[],resting:[],recoverySkipped:[],waiting:[],stops:[],deadlines:[],bills:[],blocked:null};
    result.blocked=s.bankrupt?'bankrupt':s.campaign?.finale?.ending&&!s.campaign.finale.endless?'ending':s.pending?'pending-choice':null;
    if(result.blocked)return result;
    const possibleEvent=balance(c).eventChance>0&&(s.absoluteSlot%4<2||s.overtime.length>0)&&c.events.some(card=>s.jobs.some(j=>eligible(s,c,card,j)));
    const certainty:Certainty=possibleEvent?{certainty:'conditional',conditions:['no-event-interference']}:{certainty:'certain'};
    const {working,resting,stops,waiting,deadlines,bills,recoverySkipped}=result;
    const worked=new Set<string>();
    let quota=s.quota,purchased=s.purchased,local=s.localCapacity,electricity=s.electricity;
    if (s.absoluteSlot % 4 < 2 || s.overtime.length)
        for (const j of s.jobs.filter(j => j.status === 'working' || (j.status === 'waiting' && j.resumeAt <= s.absoluteSlot)).map(j=>({...j}))) {
            const progressBefore = j.progress;
            const duos=activeJobDuos(s,c,j);
            let bonus = 1, toolReady = false;
            // Reserve the support budget once, before any member spends resources.
            const budget = estimateResources(s, c, j, true);
            const supportBudgetReady = !j.team.some(m => m.role === 'tool') || (budget.cloud <= quota + purchased && budget.local <= local);
            const order = { planner: 0, worker: 2, tool: 1, reviewer: 3 };
            for (const m of [...j.team].sort((a, b) => order[a.role] - order[b.role] || (a.character < b.character ? -1 : a.character > b.character ? 1 : 0))) {
                const a = s.actors.find(a => a.id === m.character)!;
                if(!challengeAllows(s,c,a.version,m.mode))continue;
                const v = version(c, a, s, m.mode);
                const matching = match(c, j, v);
                if (s.absoluteSlot % 4 >= 2 && !s.overtime.includes(a.id))
                    continue;
                if (a.energy < 10 || a.busyUntil > s.absoluteSlot)
                    continue;
                if (m.role === 'worker' && j.progress >= j.work)
                    continue;
                const station=stationEffects(s,c,a.id,j.id,m.role);
                const energy = a.energy >= 60 ? 1 : a.energy >= 30 ? 0.85 : 0.6;
                const overloaded = a.load > v.context;
                const teamCost = 1 - (owns(s, 'management') ? 0 : .05) * Math.max(0, j.team.filter(m => m.role === 'worker').length - 2);
                if (m.role === 'reviewer' && j.progress === progressBefore && j.defects === 0)
                    continue;
                let units = round((owns(s, 'prompt') && progressBefore === 0 ? 1 + .2 * (toolReady ? 2 : 1) : 1) * 10 * matching * v.speed * (1 + (s.campaign?.hardware.office ?? 0) * .1) * (1+station.efficiency) * duoEfficiency(duos,a.id) * energy * moodFactor(a.mood) * needsFactor(s,a.id) * fatigueFactor(a, s.absoluteSlot) * (v.rhythm[s.absoluteSlot % 4] ?? 1) * (overloaded ? 0.7 : 1) *  (m.role === 'worker' ? bonus * teamCost : m.role === 'planner' || m.role === 'tool' ? 0.5 : 0.3));
                if (m.role === 'worker' || m.role === 'planner' || m.role === 'tool')
                    units = Math.min(units, round(j.work - j.progress));
                if (units <= 0)
                    continue;
                const cost = round(units * v.price);
                if (m.role === 'planner' || m.role === 'tool') {
                    if (!supportBudgetReady) continue;
                    const ready = j.team.filter(w => w.role === 'worker').some(w => {
                        const wa = s.actors.find(a => a.id === w.character)!;
                        const wv = version(c, wa, s, w.mode);
                        if(!challengeAllows(s,c,wa.version,w.mode))return false;
                        if (wa.energy < 10 || wa.busyUntil > s.absoluteSlot || (s.absoluteSlot % 4 >= 2 && !s.overtime.includes(wa.id)))
                            return false;
                        const wp = Math.min(Math.max(0, round(j.work - j.progress - units)), round((owns(s, 'prompt') && progressBefore === 0 ? 1.2 : 1) * (1 + (s.campaign?.hardware.office ?? 0) * .1) * (1+stationEffects(s,c,wa.id,j.id,w.role).efficiency) * duoEfficiency(duos,wa.id) * 10 * match(c, j, wv) * wv.speed * (wv.rhythm[s.absoluteSlot % 4] ?? 1) * (wa.energy >= 60 ? 1 : wa.energy >= 30 ? .85 : .6) * moodFactor(wa.mood) * needsFactor(s,wa.id) * fatigueFactor(wa, s.absoluteSlot) * (wa.load > wv.context ? .7 : 1) *  (m.role === 'planner' ? 1 + v.skills.reason * .015 : bonus) * teamCost));
                        const pool = (w.mode === 'cloud' ? quota + purchased : local) - (w.mode === m.mode ? cost : 0);
                        return round(pool) >= round(wp * wv.price);
                    });
                    if (!ready)
                        continue;
                }
                if ((m.mode === 'local' ? local : quota + purchased) < cost) {
                    stops.push({ ...certainty, actorId:a.id,jobId:j.id,reason:m.mode==='cloud'?'cloud-quota':'local-capacity' });
                    continue;
                }
                if(m.mode==='local'){local=round(local-cost);electricity=round(electricity+round(cost*.1));}
                else {const q=Math.min(quota,cost);quota=round(quota-q);purchased=round(purchased-round(cost-q));}
                worked.add(a.id);
                working.push({...certainty,reason:'contract-work',actorId:a.id,jobId:j.id});
                if(m.role==='tool')toolReady=true;
                if(m.role==='planner')bonus=1+v.skills.reason*.015;
                if(m.role==='worker'||m.role==='planner')j.progress=round(j.progress+Math.min(units,Math.max(0,j.work-j.progress)));
            }
        }
    for(const id of s.overtime){if(!worked.has(id))working.push({...certainty,reason:'overtime',actorId:id});worked.add(id);}
    for(const a of s.actors) {
        if(a.busyUntil>s.absoluteSlot){if(s.absoluteSlot%4===3)recoverySkipped.push({...certainty,reason:'sleep-skipped-by-activity',actorId:a.id});continue;}
        if(!worked.has(a.id))resting.push({...certainty,reason:s.absoluteSlot%4===3?'night-sleep':'idle-recover',actorId:a.id,amount:Math.min(100-a.energy,s.absoluteSlot%4===3?(a.lastOvertimeSlot===s.absoluteSlot-1?30:60):15),unit:'energy'});
    }
    for(const j of s.jobs) {
        if(j.status==='review')waiting.push({certainty:'certain',reason:'review-pending',jobId:j.id});
        if(j.status==='posted'&&j.clarifyingUntil>s.absoluteSlot)waiting.push({certainty:'certain',reason:'clarify-pending',jobId:j.id});
        if((j.status==='waiting'&&j.resumeAt>s.absoluteSlot)||(j.status==='working'&&s.absoluteSlot%4>=2&&!j.team.some(m=>s.overtime.includes(m.character))))waiting.push({certainty:'certain',reason:'next-work-slot',jobId:j.id});
        if(['accepted','working','review','waiting'].includes(j.status)) {
            if(j.deadline===s.absoluteSlot)deadlines.push({certainty:'certain',reason:'due-this-slot',jobId:j.id});
            else if(Math.floor(j.deadline/4)===Math.floor(s.absoluteSlot/4)+1)deadlines.push({certainty:'certain',reason:'due-next-day',jobId:j.id});
        }
    }
    if(result.nextSlot%28===0){
        bills.push({...certainty,reason:'weekly-bill',amount:balance(c).weekly+[0,120,420][s.campaign?.subscription??0]!+round(s.loan*balance(c).interest),unit:'cash'});
        bills.push({...certainty,reason:'electricity',amount:electricity,unit:'cash'});
    }
    if(!s.debtPaid&&result.nextSlot>=balance(c).debtSlot)bills.push({...certainty,reason:'debt-due',amount:balance(c).debt,unit:'cash'});
    return result;
}
