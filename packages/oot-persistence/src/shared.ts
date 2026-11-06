import { createInitialState, dispatchCommand, engineVersion } from 'oot-core';
import type { Content, State } from 'oot-core';
export function stable(value: unknown): string {
    if (value === null || typeof value !== 'object')
        return JSON.stringify(value);
    if (Array.isArray(value))
        return '[' + Array.from(value, v => v === undefined ? 'null' : stable(v)).join(',') + ']';
    return '{' + Object.entries(value).filter(([, v]) => v !== undefined).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([k, v]) => JSON.stringify(k) + ':' + stable(v)).join(',') + '}';
}
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
export function encode(c: Content, seed: number, commands: unknown[], contentHash: string, stateHash: string): string {
    return JSON.stringify({ schemaVersion: 1, engineVersion, contentVersion: c.version, contentHash, seed, commands, stateHash }, null, 2);
}
export function decode(c: Content, text: string, contentHash: string): {
    seed: number;
    commands: unknown[];
    stateHash: unknown;
} {
    const data: unknown = JSON.parse(text);
    if (!data || typeof data !== 'object')
        throw Error('INVALID_SAVE');
    const v = data as Record<string, unknown>;
    if (v.schemaVersion !== 1 || v.engineVersion !== engineVersion || v.contentVersion !== c.version || v.contentHash !== contentHash)
        throw Error('INCOMPATIBLE_SAVE');
    if (typeof v.seed !== 'number' || !Array.isArray(v.commands) || v.commands.length > 100000)
        throw Error('INVALID_SAVE');
    return { seed: v.seed, commands: v.commands, stateHash: v.stateHash };
}
