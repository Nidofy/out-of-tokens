import { readFileSync } from 'node:fs';
import { z } from 'zod';
import type { Content } from 'oot-core';
const positive = z.number().finite().positive();
const score = z.number().min(0).max(10);
const vector = (value: z.ZodNumber) => z.object({ code: value, write: value, reason: value, create: value, media: value, recall: value }).strict();
const words = z.string().min(1);
const effect = z.object({ kind: z.enum(['work', 'quality', 'defects', 'mood', 'compact', 'reset', 'tokenRate', 'cashPercent']), value: z.number().finite().min(-100).max(100) }).strict().superRefine((e, ctx) => {
    if (['compact', 'cashPercent'].includes(e.kind) && (e.value < 0 || e.value > 1))
        ctx.addIssue({ code: 'custom', message: 'fraction 0..1' });
    if (e.kind === 'tokenRate' && (e.value < .1 || e.value > 3))
        ctx.addIssue({ code: 'custom', message: 'token rate .1..3' });
    if (e.kind === 'defects' && !Number.isInteger(e.value))
        ctx.addIssue({ code: 'custom', message: 'integer defects' });
});
const balanceSchema = z.object({ startingCash: positive, debt: positive, debtSlot: positive.int(), weekly: positive, dailyQuota: positive, upgradedQuota: positive, localCapacity: positive, loanLimit: positive, interest: z.number().min(0).max(1), eventChance: z.number().min(0).max(1), rewardScale: positive, crisisLength: positive.int(), bankruptcyFloor: z.number().negative() }).strict();
const schema = z.object({ version: words,
    versions: z.array(z.object({ id: words, character: words, name: words, skills: vector(score), speed: positive.max(2), price: positive, stability: score, context: positive, modes: z.array(z.enum(['cloud', 'local'])).min(1), rhythm: z.array(positive.max(2)).length(4) }).strict()).min(1),
    commissions: z.array(z.object({ id: words, title: words, titleEn: words.optional(), category: z.enum(['code', 'write', 'research', 'design', 'media', 'data']).optional(), client: z.enum(['expert', 'normal', 'novice', 'rush']).optional(), phases: z.number().int().min(1).max(4).optional(), qualityLines: z.tuple([z.number().min(1).max(100), z.number().min(1).max(100), z.number().min(1).max(100)]).refine(x => x[0] < x[1] && x[1] < x[2], 'ordered quality lines').optional(), description: words, weights: vector(z.number().min(0).max(1)).refine(v => Math.abs(Object.values(v).reduce((a, b) => a + b, 0) - 1) < 1e-8, 'weights sum'), workload: positive, workSlots: positive.int().max(56), reward: positive, clarity: z.number().min(0).max(100), delivery: z.enum(['oneshot', 'multi', 'retainer']) }).strict().refine(t => t.delivery === 'oneshot' ? (t.phases ?? 1) === 1 : (t.phases ?? 1) >= 2, 'delivery phases')).min(1),
    events: z.array(z.object({ id: words, title: words, titleEn: words.optional(), cooldown: z.number().int().min(0).optional(), weight: positive.optional(), trigger: z.enum(['bluewhale-cloud', 'working', 'code', 'research', 'data', 'multi', 'cloud', 'overload', 'novice']).optional(), choices: z.array(z.object({ label: words, cost: z.number().min(0), multiplier: z.number().min(0).max(2), effects: z.array(effect).optional() }).strict()).min(1).refine(xs => xs.some(x => x.cost === 0), 'free escape required') }).strict()),
    balance: balanceSchema.optional()
}).strict();
export function validateContent(input: unknown): Content {
    const c = schema.parse(input);
    const ids = [...c.versions, ...c.commissions, ...c.events].map(x => x.id);
    if (new Set(ids).size !== ids.length || new Set(c.versions.map(v => v.character)).size !== c.versions.length)
        throw Error('DUPLICATE_ID');
    if (c.events.some(e => e.trigger === 'bluewhale-cloud') && !c.versions.some(v => v.character === 'bluewhale' && v.modes.includes('cloud')))
        throw Error('EVENT_REFERENCE');
    // Strip explicit undefined optional keys while keeping the validated data shape.
    return JSON.parse(JSON.stringify(c)) as Content;
}
export function loadContent(): Content {
    const read = (path: string): unknown => JSON.parse(readFileSync(new URL(`../../../content/${path}`, import.meta.url), 'utf8'));
    return validateContent({ version: 'm0.4-1', versions: read('versions/initial.json'), commissions: read('commissions/initial.json'), events: read('events/initial.json'), balance: read('balance/standard.json') });
}
