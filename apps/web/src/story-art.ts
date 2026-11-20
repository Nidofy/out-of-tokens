const clients = ['tea-lin', 'book-zhou', 'tech-yan', 'curator-su', 'oss-zhe', 'vc-lu'];
const endings = ['independent', 'acquired', 'open-source', 'warm-shop', 'paperclip'];
const worlds = ['slime', 'paper', 'castle'];
const mascotPoses = ['idle', 'alert'];

export function storyClientArt(id: string): string | null {
    return clients.includes(id) ? `./art/story/client-${id}.webp` : null;
}

export function endingArt(id: string): string | null {
    return endings.includes(id) ? `./art/story/ending-${id}.webp` : null;
}

export function worldArt(id: string): string | null {
    return worlds.includes(id) ? `./art/story/world-${id}.webp` : null;
}

export function paperclipMascotArt(pose: string): string | null {
    return mascotPoses.includes(pose) ? `./art/story/mascot-paperclip-${pose}.webp` : null;
}
