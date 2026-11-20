const outcomes = ['pitch-demo', 'code-ops', 'release-night', 'crisis-429', 'museum-media', 'open-dawn'];
const software = ['rag', 'vllm', 'autotest', 'multiagent', 'versioncontrol', 'tokenbank', 'prompt', 'remote'];
const vignettes = ['chapter-clear', 'duo-tea', 'crisis-429'];

export function expansionOutcomeArt(id: string): string | null {
    return outcomes.includes(id) ? `./art/expansion/outcome-${id}.webp` : null;
}

export function expansionSoftwareArt(id: string): string | null {
    return software.includes(id) ? `./art/expansion/software-${id}.webp` : null;
}

export function expansionVignetteArt(id: string): string | null {
    return vignettes.includes(id) ? `./art/expansion/vignette-${id}.webp` : null;
}

export const worldTownMapArt = './art/expansion/world-town-map.webp';
