const emotes = ['coffee', 'idea', 'sweat', 'sleepy', 'rice', 'sparkle'];
const gifts = ['rice-bento', 'espresso-pods', 'fountain-pen', 'prism-sketchbook', 'vinyl-coaster', 'keycap-artisan'];
const clients = ['tea-lin', 'book-zhou', 'tech-yan', 'curator-su', 'oss-zhe', 'vc-lu'];

export function emoteArt(id: string): string {
    return `./art/living/emote-${emotes.includes(id) ? id : 'sparkle'}.webp`;
}
export function giftArt(id: string): string {
    return `./art/living/gift-${gifts.includes(id) ? id : 'keycap-artisan'}.webp`;
}
export function clientArt(id: string): string {
    return `./art/living/client-${clients.includes(id) ? id : 'book-zhou'}.webp`;
}
export const teaBreakArt = './art/living/card-tea-break.webp';
