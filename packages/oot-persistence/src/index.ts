import { createHash } from 'node:crypto';
import { createInitialState, dispatchCommand, engineVersion } from 'oot-core';
import type { Content, State } from 'oot-core';
function stable(value: unknown): string {
    if (value === null || typeof value !== 'object')
        return JSON.stringify(value);
    if (Array.isArray(value))
        return '[' + value.map(stable).join(',') + ']';
    return '{' + Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([k, v]) => JSON.stringify(k) + ':' + stable(v)).join(',') + '}';
}
export const hash = (value: unknown) => createHash('sha256').update(stable(value)).digest('hex');
export function replay(c: Content, seed: number, commands: unknown[]): State {
    let state = createInitialState(c, seed);
    for (const command of commands) {
        const r = dispatchCommand(state, command, c);
        if (r.error)
            throw Error(`REPLAY_COMMAND:${r.error}`);
        state = r.state;
    }
    return state;
}
export function save(c: Content, seed: number, commands: unknown[], state: State): string {
    if (hash(replay(c, seed, commands)) !== hash(state))
        throw Error('STATE_LOG_MISMATCH');
    return JSON.stringify({ schemaVersion: 1, engineVersion, contentVersion: c.version, contentHash: hash(c), seed, commands, stateHash: hash(state) }, null, 2);
}
export function restore(c: Content, text: string): {
    state: State;
    commands: unknown[];
} {
    const data: unknown = JSON.parse(text);
    if (!data || typeof data !== 'object')
        throw Error('INVALID_SAVE');
    const v = data as Record<string, unknown>;
    if (v.schemaVersion !== 1 || v.engineVersion !== engineVersion || v.contentVersion !== c.version || v.contentHash !== hash(c))
        throw Error('INCOMPATIBLE_SAVE');
    if (typeof v.seed !== 'number' || !Array.isArray(v.commands) || v.commands.length > 100000)
        throw Error('INVALID_SAVE');
    const state = replay(c, v.seed, v.commands);
    if (hash(state) !== v.stateHash)
        throw Error('HASH_MISMATCH');
    return { state, commands: v.commands };
}
