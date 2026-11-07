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
    commissions: z.array(z.object({ offerOnly:z.boolean().optional(), proposals:z.array(z.object({id:words,label:words,labelEn:words,template:words}).strict()).min(2).max(3).optional(), minChapter:z.number().int().min(0).max(4).optional(), id: words, title: words, titleEn: words.optional(), category: z.enum(['code', 'write', 'research', 'design', 'media', 'data']).optional(), client: z.enum(['expert', 'normal', 'novice', 'rush']).optional(), phases: z.number().int().min(1).max(4).optional(), qualityLines: z.tuple([z.number().min(1).max(100), z.number().min(1).max(100), z.number().min(1).max(100)]).refine(x => x[0] < x[1] && x[1] < x[2], 'ordered quality lines').optional(), description: words, descriptionEn: words.optional(), requirements: z.array(z.object({label:words,labelEn:words,work:z.number().min(0).max(20)}).strict()).max(4).optional(), weights: vector(z.number().min(0).max(1)).refine(v => Math.abs(Object.values(v).reduce((a, b) => a + b, 0) - 1) < 1e-8, 'weights sum'), workload: positive, workSlots: positive.int().max(56), reward: positive, clarity: z.number().min(0).max(100), delivery: z.enum(['oneshot', 'multi', 'retainer']) }).strict().refine(t => t.delivery === 'oneshot' ? (t.phases ?? 1) === 1 : (t.phases ?? 1) >= 2, 'delivery phases')).min(1),
    events: z.array(z.object({ minChapter:z.number().int().min(0).max(4).optional(), id: words, title: words, titleEn: words.optional(), cooldown: z.number().int().min(0).optional(), weight: positive.optional(), trigger: z.enum(['bluewhale-cloud', 'working', 'code', 'write', 'design', 'media', 'research', 'data', 'multi', 'cloud', 'overload', 'novice']).optional(), choices: z.array(z.object({ label: words, labelEn: words.optional(), cost: z.number().min(0), multiplier: z.number().min(0).max(2), effects: z.array(effect).optional() }).strict()).min(1).refine(xs => xs.some(x => x.cost === 0), 'free escape required') }).strict()),
    balance: balanceSchema.optional(),
    campaign: z.object({ openingJobs:z.array(words).length(5).optional(),starterJobs:z.array(words).min(5).optional(), initial: z.array(words).min(1), recruits: z.array(z.object({character: words, cost: positive, reputation: z.number().min(0)}).strict()), software: z.array(z.object({id: words, name: words, nameEn: words, cost: positive, research: z.number().int().min(0), requires: z.array(words)}).strict()), maxHardware: z.number().int().min(1).max(5), maxChapter:z.number().int().min(0).max(4).optional(), stories:z.array(z.object({id:words,character:words,affinity:z.number().min(0).max(100),text:words,textEn:words,choices:z.array(z.object({label:words,labelEn:words,affinity:z.number().min(-10).max(10),mood:z.number().min(-20).max(20),research:z.number().int().min(0).max(5)}).strict()).length(2)}).strict()).optional() }).strict().optional()
}).strict();
export function validateContent(input: unknown): Content {
    const c = schema.parse(input);
    const ids = [...c.versions, ...c.commissions, ...c.events].map(x => x.id);
    if (new Set(ids).size !== ids.length || (!c.campaign && new Set(c.versions.map(v => v.character)).size !== c.versions.length))
        throw Error('DUPLICATE_ID');
    for(const t of c.commissions)if(t.proposals){
        if(new Set(t.proposals.map(p=>p.id)).size!==t.proposals.length)throw Error('PROPOSAL_REFERENCE');
        for(const p of t.proposals){const target=c.commissions.find(x=>x.id===p.template);if(!target||!target.offerOnly||target.proposals||(target.minChapter??0)>(t.minChapter??0))throw Error('PROPOSAL_REFERENCE');}
    }
    if (c.campaign) {
        for(const id of [...(c.campaign.openingJobs??[]),...(c.campaign.starterJobs??[])])if(!c.commissions.some(t=>t.id===id&&!t.offerOnly&&(t.minChapter??0)===0))throw Error('OPENING_REFERENCE');
        const p = c.campaign, roster = [...p.initial, ...p.recruits.map(r => r.character)];
        if (new Set(roster).size !== roster.length || roster.some(id => !c.versions.some(v => v.character === id)) || c.versions.some(v => !roster.includes(v.character))) throw Error('CAMPAIGN_REFERENCE');
        if(p.stories && (new Set(p.stories.map(x=>x.id)).size !== p.stories.length || p.stories.some(x=>!roster.includes(x.character)))) throw Error('STORY_REFERENCE');
        const unlocked = new Set<string>();
        for (const u of p.software) {
            if (unlocked.has(u.id) || u.requires.some(id => !unlocked.has(id))) throw Error('UPGRADE_REFERENCE');
            unlocked.add(u.id);
        }
    }
    if (c.events.some(e => e.trigger === 'bluewhale-cloud') && !c.versions.some(v => v.character === 'bluewhale' && v.modes.includes('cloud')))
        throw Error('EVENT_REFERENCE');
    // Strip explicit undefined optional keys while keeping the validated data shape.
    return JSON.parse(JSON.stringify(c)) as Content;
}
export const contentVersion = 'm0.6-1';
