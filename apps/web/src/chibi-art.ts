export const chibiCharacters = [
    'bluewhale', 'qwen', 'llama', 'mistral', 'gpt', 'claude',
    'kimi', 'gemini', 'grok', 'glm', 'minimax', 'seedance',
] as const;
export const chibiFxIds = [
    'emote-focus', 'emote-sweat', 'emote-crash', 'emote-zzz',
    'emote-excited', 'emote-daze', 'prop-code_bit', 'prop-coffee_cup',
    'emote-slack', 'emote-anger', 'emote-dizzy', 'emote-heart', 'emote-alert', 'emote-spark',
    'prop-doc_page', 'prop-smoke_puff', 'prop-dust_step', 'prop-heal_leaf',
] as const;

export function hasChibiRig(characterId: string): boolean {
    return chibiCharacters.some(id => id === characterId);
}

export function chibiRigPath(characterId: string): string | null {
    return hasChibiRig(characterId) ? `./art/chibi/characters/${characterId}/rig.json` : null;
}

export function chibiFxArt(id: string): string {
    const safeId = chibiFxIds.find(candidate => candidate === id) ?? 'emote-excited';
    return `./art/chibi/fx/${safeId}.webp`;
}
