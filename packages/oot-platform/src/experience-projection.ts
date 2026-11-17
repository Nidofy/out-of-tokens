import {createInitialState,dispatchCommand,getViewModel} from 'oot-core';
import type {Content,State,Command,Result} from 'oot-core';
import type {ExperienceView,Fact} from './experience-contract.js';
const nodes=['accept','assign','advance','deliver','clarify','rest','bill'] as const;
type Node=typeof nodes[number];
export class ExperienceProjection {
    private learned=new Set<Node>();
    private contributions=new Map<string,Map<string,Set<string>>>();
    private receipts:ExperienceView['receipts']=[];
    observe(before:State,result:Result,command:Command,content:Content) {
        if(result.error)return;
        if(result.events.some(e=>e.type==='Restarted')){this.learned.clear();this.contributions.clear();this.receipts=[];return;}
        if(['accept','assign','advance','deliver','clarify'].includes(command.type))this.learned.add(command.type as Node);
        const resources=result.state.resources.slice(before.resources.length);
        for(const resource of resources) {
            const job=before.jobs.find(j=>j.id===resource.job);if(!job)continue;
            const key=`${job.id}:${job.phase}`,actors=this.contributions.get(key)??new Map<string,Set<string>>();
            const roles=actors.get(resource.character)??new Set<string>();
            const role=job.team.find(m=>m.character===resource.character)?.role;
            if(role)roles.add(role);actors.set(resource.character,roles);this.contributions.set(key,actors);
        }
        if(result.state.absoluteSlot>before.absoluteSlot){
            const worked=new Set([...resources.map(r=>r.character),...before.overtime]);
            if(before.actors.some(a=>a.busyUntil<=before.absoluteSlot&&!worked.has(a.id)))this.learned.add('rest');
        }
        const ledger=result.state.ledger.slice(before.ledger.length);
        if(ledger.some(l=>['weekly','loan-interest','inherited-debt'].includes(l.reason)))this.learned.add('bill');
        if(command.type==='deliver'||command.type==='rework') {
            const job=before.jobs.find(j=>j.id===command.job)!;
            const after=result.state.jobs.find(j=>j.id===job.id)!;
            const actors=this.contributions.get(`${job.id}:${job.phase}`)??new Map<string,Set<string>>();
            const reason=command.type==='rework'?'delivery-rework':after.phase>job.phase?'delivery-passed':'delivery-failed';
            const facts:Fact[]=[{certainty:'certain',reason,jobId:job.id}];
            for(const [actorId,roles] of actors)for(const role of roles)facts.push({certainty:'certain',reason:`contributed-${role}`,actorId,jobId:job.id});
            const cash=ledger.filter(l=>l.reason===`delivery:${job.id}`||l.reason===`breach:${job.id}`).reduce((n,l)=>n+l.amount,0);
            if(command.type==='deliver')facts.push({certainty:'certain',reason:'delivery-cash',amount:cash,unit:'cash',jobId:job.id});
            // The next phase clears quality; rework clears penalties. Preserve the public
            // pre-command assessment instead of recomputing rules from the resulting job.
            const {quality,passQuality,qualityLines,qualityBreakdown}=getViewModel(before,content).jobs.find(j=>j.id===job.id)!;
            const assessment={quality,passQuality,qualityLines,qualityBreakdown};
            this.receipts.push({jobId:job.id,phase:job.phase,occurrence:this.receipts.length,participants:[...actors.keys()].sort(),facts,assessment});
            if(command.type==='deliver')this.contributions.delete(`${job.id}:${job.phase}`);
        }
    }
    view(state:State):Pick<ExperienceView,'learning'|'goal'|'receipts'> {
        const review=state.jobs.find(j=>j.status==='review'),working=state.jobs.find(j=>j.status==='working'||j.status==='waiting'),accepted=state.jobs.find(j=>j.status==='accepted');
        const ended=!!state.campaign?.finale?.ending&&!state.campaign.finale.endless;
        const reason=state.bankrupt?'restart-workshop':ended?'view-ending':state.pending?'resolve-pending-choice':review?'review-delivery':working?'advance-period':accepted?'assign-team':'choose-commission';
        const jobId=state.bankrupt||ended?undefined:state.pending?state.pending.job:(review??working??accepted)?.id;
        return {learning:nodes.map(node=>({node,observed:this.learned.has(node)})),goal:{certainty:'certain',reason,...(jobId?{jobId}:{})},receipts:structuredClone(this.receipts)};
    }
}
export function rebuildExperience(content:Content,seed:number,commands:readonly unknown[]) {
    const projection=new ExperienceProjection();let state=createInitialState(content,seed);
    for(const command of commands){const result=dispatchCommand(state,command,content);if(result.error)throw Error('EXPERIENCE_REPLAY:'+result.error);projection.observe(state,result,command as Command,content);state=result.state;}
    return projection;
}
