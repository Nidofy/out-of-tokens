import { suggestAssignmentsFromSnapshot } from './suggestions.js';
import { ExperienceProjection, rebuildExperience } from './experience-projection.js';
import { createInitialState, dispatchCommand, getViewModel, forecastAssignment, activityEffects, previewPeriod, explainCapacity, explainDuos, explainMoney } from 'oot-core';
import type { Command, Content, DomainEvent, State, Member } from 'oot-core';
import { saveBrowser, restoreBrowser } from 'oot-persistence/browser';
import { EXPERIENCE_CONTRACT } from './checkpoint-contract.js';
import type { ActivityPreview, NextPeriodPreview, ExperienceView, ExperienceSession, Fact, Draft, SuggestResult, CapacityExplanation, DuoExplanation, FinanceExplanation } from './experience-contract.js';
import type { WorkerSnapshot, CheckpointSnapshot } from './checkpoint-contract.js';
export class GameSession implements ExperienceSession {
    private state: State;
    private commands: unknown[] = [];
    private revision = 0;
    private experience = new ExperienceProjection();
    private readonly content: Content;
    private lineage: string;
    private commandsLocked = false;
    constructor(content: Content, seed = 1, lineageId = globalThis.crypto.randomUUID()) { this.lineage = lineageId; this.content = structuredClone(content); this.state = createInitialState(this.content, seed); }
    get lineageId() { return this.lineage; }
    lockCommands(): () => void {
        if (this.commandsLocked) throw Error('SESSION_SWITCHING');
        this.commandsLocked = true;
        return () => { this.commandsLocked = false; };
    }
    workerSnapshot(): WorkerSnapshot {
        return { contract: EXPERIENCE_CONTRACT, contentVersion: this.content.version, revision: this.revision, lineageId: this.lineage, seed: this.state.seed, state: structuredClone(this.state) };
    }
    checkpointSnapshot(): CheckpointSnapshot {
        const snapshot = this.workerSnapshot();
        return { ...snapshot, input: { content: structuredClone(this.content), seed: snapshot.seed, commands: structuredClone(this.commands), state: snapshot.state } };
    }
    get view() { return getViewModel(this.state, this.content); }
    private identity() { return {contract:EXPERIENCE_CONTRACT,contentVersion:this.content.version,revision:this.revision,lineageId:this.lineage}; }
    suggestAssignments(jobId:string,draft:Draft):SuggestResult { return suggestAssignmentsFromSnapshot(this.content,this.workerSnapshot(),jobId,draft); }
    explainActorCapacity(actorId:string):CapacityExplanation { return {...this.identity(),...explainCapacity(this.state,this.content,actorId)}; }
    explainTeamDuos(jobId:string,draft:Draft):DuoExplanation { return {...this.identity(),jobId,draftKey:draft.draftKey,duos:explainDuos(this.state,this.content,jobId,draft.team)}; }
    explainFinance():FinanceExplanation { return {...this.identity(),...explainMoney(this.state,this.content)}; }
    getExperienceView(): ExperienceView {
        return {...this.experience.view(this.state),contract:EXPERIENCE_CONTRACT,contentVersion:this.content.version,revision:this.revision,lineageId:this.lineage};
    }
    previewNextPeriod(): NextPeriodPreview {
        return {...previewPeriod(this.state,this.content),contract:EXPERIENCE_CONTRACT,contentVersion:this.content.version,revision:this.revision,lineageId:this.lineage};
    }
    previewActivity(command: Command): ActivityPreview {
        const result = activityEffects(this.state, this.content, command);
        const gains: Fact[] = [], losses: Fact[] = [];
        for (const actor of result.actors) for (const unit of ['energy', 'mood', 'affinity'] as const) {
            const amount = actor[unit];
            if (amount) (amount > 0 ? gains : losses).push({ reason: 'activity-'+unit, actorId:actor.actorId, amount:Math.abs(amount), unit, certainty:'certain' });
        }
        const contract = EXPERIENCE_CONTRACT, contentVersion = this.content.version, revision = this.revision, lineageId = this.lineage;
        return {contract, contentVersion, revision, lineageId, legal:result.error===null,
            ...(result.error?{error:result.error}:{}), cash:result.cash, research:result.research,
            actors:result.actors.map(({actorId,occupiedSlots,occupiesUntil,skipsNightRecovery,joinsOvertime,relocatesTo})=>({actorId,occupiedSlots,occupiesUntil,skipsNightRecovery,joinsOvertime,relocatesTo})), gains, losses};
    }
    previewAssignment(job: string, team: Member[]) {
        // Hypothetical acceptance stays on a detached command result; never enters the save log.
        const posted = this.state.jobs.find(j=>j.id===job)?.status==='posted';
        const accepted = posted ? dispatchCommand(this.state,{type:'accept',job},this.content) : null;
        const result = accepted?.error ? accepted : dispatchCommand(accepted?.state??this.state, { type: 'assign', job, team }, this.content);
        return { error: result.error, estimate: result.error ? null : getViewModel(result.state, this.content).jobs.find(j => j.id === job)!.resourceEstimate, forecast: result.error ? null : forecastAssignment(result.state,this.content,result.state.jobs.find(j=>j.id===job)!) };
    }
    previewOffice(command: Extract<Command,{type:'office'}>) {const r=dispatchCommand(this.state,command,this.content);return {error:r.error,cost:r.error?0:this.state.cash-r.state.cash,office:r.error?null:getViewModel(r.state,this.content).office};}
    send(command: Command): {
        error: string | null;
        events: DomainEvent[];
    } {
        if (this.commandsLocked) return { error: 'SESSION_SWITCHING', events: [] };
        const captured = structuredClone(command), result = dispatchCommand(this.state, captured, this.content);
        if (!result.error) {
            this.experience.observe(this.state,result,captured);
            this.state = result.state;
            if (result.events.some(e => e.type === 'Restarted')) this.lineage = globalThis.crypto.randomUUID();
            this.commands.push(captured);
            this.revision++;
        }
        return { error: result.error, events: result.events };
    }
    exportSave() { return saveBrowser(this.content, this.state.seed, this.commands, this.state); }
    async prepareImport(text: string, lineageId?: string): Promise<() => void> {
        const revision = this.revision, result = await restoreBrowser(this.content, text);
        if (this.revision !== revision) throw Error('SESSION_CHANGED');
        if (lineageId !== undefined && !lineageId.trim()) throw Error('INVALID_LINEAGE');
        const nextLineage = lineageId ?? globalThis.crypto.randomUUID();
        const experience = rebuildExperience(this.content, result.state.seed, result.commands);
        let applied = false;
        return () => {
            if (applied || this.revision !== revision) throw Error('SESSION_CHANGED');
            this.state = result.state;
            this.experience = experience;
            this.commands = result.commands;
            this.lineage = nextLineage;
            this.revision++;
            applied = true;
        };
    }
    async importSave(text: string, lineageId?: string) { (await this.prepareImport(text, lineageId))(); }
}
export type GameView = GameSession['view'];
