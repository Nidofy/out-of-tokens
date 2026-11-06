import type { Content, State } from 'oot-core';
import { stable, replay, encode, decode } from './shared.js';
export { replay } from './shared.js';
export async function hashBrowser(value: unknown): Promise<string> {
    if (!globalThis.crypto?.subtle)
        throw Error('SECURE_CONTEXT_REQUIRED');
    const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(stable(value)));
    return Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('');
}
export async function saveBrowser(c: Content, seed: number, commands: unknown[], state: State): Promise<string> {
    // Capture before the first await so later UI commands cannot alter this save.
    const log = structuredClone(commands), snapshot = structuredClone(state);
    const [replayed, stateHash, contentHash] = await Promise.all([hashBrowser(replay(c, seed, log)), hashBrowser(snapshot), hashBrowser(c)]);
    if (replayed !== stateHash)
        throw Error('STATE_LOG_MISMATCH');
    return encode(c, seed, log, contentHash, stateHash);
}
export async function restoreBrowser(c: Content, text: string): Promise<{
    state: State;
    commands: unknown[];
}> {
    const data = decode(c, text, await hashBrowser(c));
    const state = replay(c, data.seed, data.commands);
    if (await hashBrowser(state) !== data.stateHash)
        throw Error('HASH_MISMATCH');
    return { state, commands: data.commands };
}
