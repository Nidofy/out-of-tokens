/** Art-Batch 7 complete eight-asset whitelist. Unknown IDs return null so A can render its text fallback. */
export const experienceArtPaths = {
    'outcome-tea-menu': './art/experience/outcome-tea-menu.webp',
    'outcome-cafe-sign': './art/experience/outcome-cafe-sign.webp',
    'outcome-community-web': './art/experience/outcome-community-web.webp',
    'outcome-bookshop-system': './art/experience/outcome-bookshop-system.webp',
    'outcome-bookshop-guide': './art/experience/outcome-bookshop-guide.webp',
    'outcome-workshop-display': './art/experience/outcome-workshop-display.webp',
    'vignette-first-delivery': './art/experience/vignette-first-delivery.webp',
    'vignette-rest-corner': './art/experience/vignette-rest-corner.webp',
} as const;
export function experienceArt(id: string): string | null {
    return Object.hasOwn(experienceArtPaths,id) ? experienceArtPaths[id as keyof typeof experienceArtPaths] : null;
}
