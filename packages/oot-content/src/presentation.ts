import {z} from 'zod';
import type {Content} from 'oot-core';

const words = z.string().trim().min(1);
const pair = z.object({zh: words, en: words}).strict();
const roles = z.object({worker: pair, planner: pair, reviewer: pair, tool: pair}).strict();
export const experiencePresentationSchema = z.object({
    version: z.literal('experience-v1'),
    receipts: z.array(z.object({
        id: words,
        scene: z.enum(['tea-menu', 'cafe-sign', 'community-web', 'bookshop-system', 'bookshop-guide', 'workshop']),
        templates: z.array(words), outcome: z.enum(['passed', 'rework', 'failed']),
        zh: words, en: words, subject: pair,
    }).strict()).length(18),
    duos: z.array(z.object({
        id: z.enum(['bluewhale-qwen', 'mistral-llama']), actors: z.tuple([words, words]),
        stages: z.array(z.object({
            id: z.enum(['first-shared-delivery', 'tea-ready', 'unlocked-benefit']),
            lines: z.array(z.object({speaker: words, zh: words, en: words}).strict()).length(2),
        }).strict()).length(3),
    }).strict()).length(2),
    roles, contribution: pair, neutral: pair, reviewed: pair, duoInactive: pair,
}).strict().superRefine((data, ctx) => {
    const issue = (message: string) => ctx.addIssue({code: 'custom', message});
    const unique = (values: string[], label: string) => {
        if (new Set(values).size !== values.length) issue('DUPLICATE_' + label);
    };
    unique(data.receipts.map(r => r.id), 'RECEIPT');
    unique(data.receipts.map(r => r.scene + ':' + r.outcome), 'SCENE_OUTCOME');
    unique(data.duos.map(d => d.id), 'DUO');
    const owners = new Map<string, string>();
    for (const row of data.receipts) {
        unique(row.templates, 'TEMPLATE');
        if (row.scene === 'workshop' ? row.templates.length !== 0 : row.templates.length === 0) issue('INVALID_FALLBACK');
        const first = data.receipts.find(r => r.scene === row.scene)!;
        if (JSON.stringify(first.templates) !== JSON.stringify(row.templates) || JSON.stringify(first.subject) !== JSON.stringify(row.subject)) issue('INCONSISTENT_SCENE');
        for (const id of row.templates) {
            if (owners.has(id) && owners.get(id) !== row.scene) issue('AMBIGUOUS_TEMPLATE');
            owners.set(id, row.scene);
        }
    }
    for (const duo of data.duos) {
        unique(duo.actors, 'ACTOR');
        unique(duo.stages.map(s => s.id), 'STAGE');
        for (const stage of duo.stages) {
            unique(stage.lines.map(l => l.speaker), 'SPEAKER');
            for (const line of stage.lines) if (!duo.actors.includes(line.speaker)) issue('UNKNOWN_SPEAKER');
        }
    }
    for (const locale of ['zh', 'en'] as const) {
        const tokens = data.contribution[locale].match(/\{[^}]*\}/g)?.sort();
        if (JSON.stringify(tokens) !== JSON.stringify(['{roles}', '{subject}'])) issue('INVALID_CONTRIBUTION_TOKENS');
    }
});
export type ExperiencePresentation = z.infer<typeof experiencePresentationSchema>;
/** Standalone presentation validation. Never adds this data to domain Content. */
export function validateExperiencePresentation(value: unknown, content?: Content): ExperiencePresentation {
    const data = experiencePresentationSchema.parse(value);
    if (content) {
        for (const row of data.receipts) for (const id of row.templates) {
            if (!content.commissions.some(t => t.id === id)) throw Error('UNKNOWN_PRESENTATION_TEMPLATE:' + id);
        }
        for (const duo of data.duos) {
            const def = content.campaign?.living?.duos.find(d => d.id === duo.id);
            if (!def || duo.actors.some(id => !def.actors.includes(id))) throw Error('UNKNOWN_PRESENTATION_DUO:' + duo.id);
        }
    }
    return data;
}
