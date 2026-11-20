export const portraitCharacters = [
    'bluewhale', 'qwen', 'llama', 'mistral', 'gpt', 'claude',
    'kimi', 'gemini', 'grok', 'glm', 'minimax', 'seedance',
] as const;

function portraitPath(directory: 'base' | 'flagship' | 'avatars', id: string): string | null {
    return portraitCharacters.some(character => character === id) ? `./art/portraits/${directory}/${id}.webp` : null;
}

export function basePortraitArt(id: string): string | null {
    return portraitPath('base', id);
}

export function flagshipPortraitArt(id: string): string | null {
    return portraitPath('flagship', id);
}

export function avatarPortraitArt(id: string): string | null {
    return portraitPath('avatars', id);
}

export const portraitEmotions = ['happy', 'flustered', 'focused'] as const;
const expressionCharacters = ['bluewhale', 'qwen', 'llama', 'mistral', 'gpt', 'claude'];

export function expressionAvatarArt(id: string, emotion: string): string | null {
    if (!expressionCharacters.includes(id) || !portraitEmotions.some(state => state === emotion)) return null;
    return `./art/portraits/expressions/${id}-${emotion}.webp`;
}
