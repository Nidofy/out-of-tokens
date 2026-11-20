export const furnitureKinds = ['basic', 'standard', 'whiteboard', 'coffee', 'sofa', 'server', 'dining', 'reading'] as const;
export const decorPropIds = ['decor-studio_cat', 'decor-monstera_pot', 'decor-token_jar', 'decor-vinyl_player'] as const;

type Layer = 'back' | 'front';
const layers: Record<typeof furnitureKinds[number], readonly Layer[]> = {
    basic: ['back', 'front'],
    standard: ['back', 'front'],
    whiteboard: ['back'],
    coffee: ['back'],
    sofa: ['back'],
    server: ['back'],
    dining: ['front'],
    reading: ['front'],
};

export function furnitureLayerArt(kind: string, layer: Layer): string | null {
    const id = furnitureKinds.find(candidate => candidate === kind);
    return id && layers[id].includes(layer) ? `./art/furniture/${id}-${layer}.webp` : null;
}

export function furniturePreviewArt(kind: string): string {
    const id = furnitureKinds.find(candidate => candidate === kind) ?? 'basic';
    return `./art/furniture/${id}-preview.webp`;
}

export function decorPropArt(id: string): string {
    const prop = decorPropIds.find(candidate => candidate === id) ?? 'decor-studio_cat';
    return `./art/furniture/${prop}.webp`;
}
