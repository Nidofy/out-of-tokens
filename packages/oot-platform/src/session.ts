import { createInitialState, dispatchCommand, getViewModel, forecastAssignment } from 'oot-core';
import type { Command, Content, DomainEvent, State, Member } from 'oot-core';
import { saveBrowser, restoreBrowser } from 'oot-persistence/browser';
import { EXPERIENCE_CONTRACT } from './checkpoint-contract.js';
import type { WorkerSnapshot, CheckpointSnapshot } from './checkpoint-contract.js';
export class GameSession {
    private state: State;
    private commands: unknown[] = [];
    private revision = 0;
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
            this.state = result.state;
            this.commands.push(captured);
            this.revision++;
        }
        return { error: result.error, events: result.events };
    }
    exportSave() { return saveBrowser(this.content, this.state.seed, this.commands, this.state); }
    async importSave(text: string, lineageId?: string) {
        const revision = this.revision, result = await restoreBrowser(this.content, text);
        if (this.revision !== revision)
            throw Error('SESSION_CHANGED');
        const nextLineage = lineageId ?? globalThis.crypto.randomUUID();
        this.state = result.state;
        this.commands = result.commands;
        this.lineage = nextLineage;
        this.revision++;
    }
}
export type GameView = GameSession['view'];
