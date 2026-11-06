import { createHash } from 'node:crypto';
import type { Content, State } from 'oot-core';
import { stable, replay, encode, decode } from './shared.js';
export { replay } from './shared.js';
export const hash = (value: unknown) => createHash('sha256').update(stable(value)).digest('hex');
export function save(c: Content, seed: number, commands: unknown[], state: State): string {
    if (hash(replay(c, seed, commands)) !== hash(state))
        throw Error('STATE_LOG_MISMATCH');
    return encode(c, seed, commands, hash(c), hash(state));
}
export function restore(c: Content, text: string): {
    state: State;
    commands: unknown[];
} {
    const data = decode(c, text, hash(c)), state = replay(c, data.seed, data.commands);
    if (hash(state) !== data.stateHash)
        throw Error('HASH_MISMATCH');
    return { state, commands: data.commands };
}
