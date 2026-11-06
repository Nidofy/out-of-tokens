import { readFileSync } from 'node:fs';
import { z } from 'zod';
import type { Content } from 'oot-core';
const positive = z.number().finite().positive();
const score = z.number().min(0).max(10);
const vector = (value: z.ZodNumber) => z.object({ code: value, write: value, reason: value, create: value, media: value, recall: value }).strict();
const words = z.string().min(1);
const schema = z.object({ version: words,
    versions: z.array(z.object({ id: words, character: words, name: words, skills: vector(score), speed: positive.max(2), price: positive, stability: score, context: positive, modes: z.array(z.enum(['cloud', 'local'])).min(1), rhythm: z.array(positive.max(2)).length(4) }).strict()).min(1),
    commissions: z.array(z.object({ id: words, title: words, description: words, weights: vector(z.number().min(0).max(1)).refine(v => Math.abs(Object.values(v).reduce((a, b) => a + b, 0) - 1) < 1e-8, 'weights sum'), workload: positive, workSlots: positive.int().max(56), reward: positive, clarity: z.number().min(0).max(100), delivery: z.literal('oneshot') }).strict()).min(1),
    events: z.array(z.object({ id: words, title: words, trigger: z.enum(['bluewhale-cloud', 'working']).optional(), choices: z.array(z.object({ label: words, cost: z.number().min(0), multiplier: z.number().min(0).max(2) }).strict()).min(1).refine(xs => xs.some(x => x.cost === 0), 'free escape required') }).strict())
}).strict();
export function validateContent(input: unknown): Content {
    const c = schema.parse(input);
    const ids = [...c.versions, ...c.commissions, ...c.events].map(x => x.id);
    if (new Set(ids).size !== ids.length || new Set(c.versions.map(v => v.character)).size !== c.versions.length)
        throw Error('DUPLICATE_ID');
    if (c.events.some(e => e.trigger === 'bluewhale-cloud') && !c.versions.some(v => v.character === 'bluewhale' && v.modes.includes('cloud')))
        throw Error('EVENT_REFERENCE');
    return {...c, events:c.events.map(({trigger,...card})=>trigger?{...card,trigger}:card)};
}
export function loadContent(): Content {
    const read = (path: string): unknown => JSON.parse(readFileSync(new URL(`../../../content/${path}`, import.meta.url), 'utf8'));
    return validateContent({ version: 'm0.2-2', versions: read('versions/initial.json'), commissions: read('commissions/initial.json'), events: read('events/initial.json') });
}
