/** Art-Batch 7 W1 samples only. Missing assets return null so A can render its text fallback. */
export const experienceArtPaths = {
    'outcome-tea-menu': './art/experience/outcome-tea-menu.webp',
    'vignette-rest-corner': './art/experience/vignette-rest-corner.webp',
} as const;
export function experienceArt(id: string): string | null {
    return Object.hasOwn(experienceArtPaths,id) ? experienceArtPaths[id as keyof typeof experienceArtPaths] : null;
}
