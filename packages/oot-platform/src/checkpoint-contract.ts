import type { Content, State } from 'oot-core';
import { saveBrowser } from 'oot-persistence/browser';

export const EXPERIENCE_CONTRACT = 1 as const;
export interface RevisionIdentity {
    contract: typeof EXPERIENCE_CONTRACT;
    contentVersion: string;
    revision: number;
    lineageId: string;
}
export interface WorkerSnapshot extends RevisionIdentity { seed: number; state: State }
export interface SaveInput { content: Content; seed: number; commands: readonly unknown[]; state: State }
export interface CheckpointSnapshot extends WorkerSnapshot { input: SaveInput }
export interface SaveEncoder { encode(input: SaveInput): Promise<string> }
/** Scheduling is the coordinator's responsibility; this implementation still replays synchronously. */
export const defaultSaveEncoder: SaveEncoder = {
    encode: input => saveBrowser(input.content, input.seed, [...input.commands], input.state),
};
export function matchesRevision(a: RevisionIdentity, b: RevisionIdentity): boolean {
    return a.contract === b.contract && a.contentVersion === b.contentVersion && a.revision === b.revision && a.lineageId === b.lineageId;
}
export type CheckpointReason = 'command' | 'host-checkpoint' | 'day-end' | 'restart' | 'import' | 'load';
export type SaveStatus = RevisionIdentity & (
    | { kind: 'idle' | 'dirty' | 'saving' }
    | { kind: 'saved'; savedAt: number }
    | { kind: 'paused'; cause: 'external-change' | 'conflict' | 'auto-paused' }
    | { kind: 'error'; code: string; exportable: true }
);
