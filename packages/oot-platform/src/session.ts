import { createInitialState, dispatchCommand, getViewModel, forecastAssignment } from 'oot-core';
import type { Command, Content, DomainEvent, State, Member } from 'oot-core';
import { saveBrowser, restoreBrowser } from 'oot-persistence/browser';
export class GameSession {
    private state: State;
    private commands: unknown[] = [];
    private revision = 0;
    private readonly content: Content;
    constructor(content: Content, seed = 1) { this.content = structuredClone(content); this.state = createInitialState(this.content, seed); }
    get view() { return getViewModel(this.state, this.content); }
    previewAssignment(job: string, team: Member[]) {
        // Hypothetical acceptance stays on a detached command result; never enters the save log.
        const posted = this.state.jobs.find(j=>j.id===job)?.status==='posted';
        const accepted = posted ? dispatchCommand(this.state,{type:'accept',job},this.content) : null;
        const result = accepted?.error ? accepted : dispatchCommand(accepted?.state??this.state, { type: 'assign', job, team }, this.content);
        return { error: result.error, estimate: result.error ? null : getViewModel(result.state, this.content).jobs.find(j => j.id === job)!.resourceEstimate, forecast: result.error ? null : forecastAssignment(result.state,this.content,result.state.jobs.find(j=>j.id===job)!) };
    }
    send(command: Command): {
        error: string | null;
        events: DomainEvent[];
    } {
        const captured = structuredClone(command), result = dispatchCommand(this.state, captured, this.content);
        if (!result.error) {
            this.state = result.state;
            this.commands.push(captured);
            this.revision++;
        }
        return { error: result.error, events: result.events };
    }
    exportSave() { return saveBrowser(this.content, this.state.seed, this.commands, this.state); }
    async importSave(text: string) {
        const revision = this.revision, result = await restoreBrowser(this.content, text);
        if (this.revision !== revision)
            throw Error('SESSION_CHANGED');
        this.state = result.state;
        this.commands = result.commands;
        this.revision++;
    }
}
export type GameView = GameSession['view'];
