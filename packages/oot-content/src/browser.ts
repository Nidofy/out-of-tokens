import { z } from 'zod';
import type { Content } from 'oot-core';
const positive = z.number().finite().positive();
const score = z.number().min(0).max(10);
const vector = (value: z.ZodNumber) => z.object({ code: value, write: value, reason: value, create: value, media: value, recall: value }).strict();
const words = z.string().min(1);
const pair=z.tuple([words,words]);
const message=z.object({speaker:words,zh:words,en:words}).strict();
const reply=z.object({label:words,labelEn:words,targetActor:words,responseZh:words,responseEn:words}).strict();
const stages=['morning','work','tired','overload','canteen','library','win'] as const;
const socials=['chat','giftLove','giftNormal','meal','study'] as const;
const workLines=['assignWorker','assignPlanner','assignReviewer','assignTool','clarifyHit','clarifyMiss'] as const;
const exactRecord=<T extends z.ZodType>(keys:readonly string[],value:T)=>z.record(z.string(),value).superRefine((v,ctx)=>{if(Object.keys(v).length!==keys.length||keys.some(k=>!Object.hasOwn(v,k)))ctx.addIssue({code:'custom',message:'exact keys required'});});
export const livingSchema=z.object({
    gifts:z.array(z.object({id:words,name:words,nameEn:words,cost:z.number().int().min(45).max(70),desc:words,descEn:words,lovedBy:z.array(words).min(2).max(3),likedBy:z.array(words).min(2).max(3)}).strict()).length(6),
    duos:z.array(z.object({id:words,actors:pair,title:words,titleEn:words,minDeliveries:z.literal(2),bonus:z.object({kind:z.enum(['efficiency','quality','clarify','energySave','defectGuard']),value:positive.max(100),mode:z.enum(['local','cloud']).optional(),category:z.enum(['code','write','research','design','media','data']).optional()}).strict().superRefine((b,ctx)=>{if((['efficiency','clarify'].includes(b.kind)&&b.value>1)||(['quality','energySave','defectGuard'].includes(b.kind)&&!Number.isInteger(b.value)))ctx.addIssue({code:'custom',message:'invalid bonus magnitude'});}),desc:words,descEn:words,banter:z.array(message).min(2).max(3)}).strict()).length(12),
    threads:z.array(z.object({id:words,title:words,titleEn:words,trigger:z.discriminatedUnion('kind',[
        z.object({kind:z.literal('recruit'),value:words}).strict(),
        z.object({kind:z.enum(['day','deliveries','overtime','weeklyBill','crisis']),value:positive.int()}).strict(),
        z.object({kind:z.literal('chapter'),value:z.number().int().min(0).max(4)}).strict()
    ]),messages:z.array(message).min(2).max(4),replies:z.array(reply).min(2).max(3)}).strict()).length(20),
    clients:z.array(z.object({id:words,name:words,nameEn:words,role:words,roleEn:words,style:z.enum(['novice','normal','expert','rush']),quotes:exactRecord(['excellent','good','pass','fail'],pair)}).strict()).length(6),
    barks:z.record(z.string(),z.object({stage:exactRecord(stages,z.array(pair).min(2)),social:exactRecord(socials,z.tuple([pair,pair,pair])),work:exactRecord(workLines,pair)}).strict()),
    eventQuotes:z.record(z.string(),z.object({default:pair,byActor:z.record(z.string(),pair).optional()}).strict()),
    slotBeats:exactRecord(['toAfternoon','toEvening','toNight','toMorning'],z.array(pair).min(4))
}).strict();
const effect = z.object({ kind: z.enum(['work', 'quality', 'defects', 'mood', 'compact', 'reset', 'tokenRate', 'cashPercent']), value: z.number().finite().min(-100).max(100) }).strict().superRefine((e, ctx) => {
    if (['compact', 'cashPercent'].includes(e.kind) && (e.value < 0 || e.value > 1))
        ctx.addIssue({ code: 'custom', message: 'fraction 0..1' });
    if (e.kind === 'tokenRate' && (e.value < .1 || e.value > 3))
        ctx.addIssue({ code: 'custom', message: 'token rate .1..3' });
    if (e.kind === 'defects' && !Number.isInteger(e.value))
        ctx.addIssue({ code: 'custom', message: 'integer defects' });
});
const balanceSchema = z.object({ startingCash: positive, debt: positive, debtSlot: positive.int(), weekly: positive, dailyQuota: positive, upgradedQuota: positive, localCapacity: positive, loanLimit: positive, interest: z.number().min(0).max(1), eventChance: z.number().min(0).max(1), rewardScale: positive, crisisLength: positive.int(), bankruptcyFloor: z.number().negative() }).strict();
const project = z.object({id:words,chapter:z.number().int().min(1).max(4),title:words,titleEn:words,brief:words,briefEn:words,requiredForChapter:z.boolean(),retryCost:z.number().finite().min(0),research:z.number().int().min(0).max(20),routes:z.array(z.object({id:words,label:words,labelEn:words,description:words,descriptionEn:words,steps:z.array(z.object({template:words,quality:z.number().min(1).max(100),feedback:words,feedbackEn:words}).strict()).min(1).max(8)}).strict()).min(2).max(3)}).strict();
const officeSchema=z.object({catalog:z.array(z.object({id:words,name:words,nameEn:words,zone:z.enum(['work','meeting','lounge','server']),price:z.number().int().min(0),seats:z.number().int().min(0).max(4),upgradeFrom:words.optional(),efficiency:z.number().min(0).max(.5).optional(),energyCost:z.number().int().min(-5).max(5).optional()}).strict()).min(5),computerVersions:z.array(words),computerTemplates:z.array(words)}).strict();
const schema = z.object({ version: words,
    versions: z.array(z.object({ id: words, character: words, name: words, skills: vector(score), speed: positive.max(2), price: positive, stability: score, context: positive, modes: z.array(z.enum(['cloud', 'local'])).min(1), rhythm: z.array(positive.max(2)).length(4) }).strict()).min(1),
    commissions: z.array(z.object({ offerOnly:z.boolean().optional(), proposals:z.array(z.object({id:words,label:words,labelEn:words,template:words}).strict()).min(2).max(3).optional(), minChapter:z.number().int().min(0).max(4).optional(), id: words, title: words, titleEn: words.optional(), category: z.enum(['code', 'write', 'research', 'design', 'media', 'data']).optional(), client: z.enum(['expert', 'normal', 'novice', 'rush']).optional(), phases: z.number().int().min(1).max(4).optional(), qualityLines: z.tuple([z.number().min(1).max(100), z.number().min(1).max(100), z.number().min(1).max(100)]).refine(x => x[0] < x[1] && x[1] < x[2], 'ordered quality lines').optional(), description: words, descriptionEn: words.optional(), requirements: z.array(z.object({label:words,labelEn:words,work:z.number().min(0).max(20)}).strict()).max(4).optional(), weights: vector(z.number().min(0).max(1)).refine(v => Math.abs(Object.values(v).reduce((a, b) => a + b, 0) - 1) < 1e-8, 'weights sum'), workload: positive, workSlots: positive.int().max(56), reward: positive, clarity: z.number().min(0).max(100), delivery: z.enum(['oneshot', 'multi', 'retainer']) }).strict().refine(t => t.delivery === 'oneshot' ? (t.phases ?? 1) === 1 : (t.phases ?? 1) >= 2, 'delivery phases')).min(1),
    events: z.array(z.object({ minChapter:z.number().int().min(0).max(4).optional(), id: words, title: words, titleEn: words.optional(), cooldown: z.number().int().min(0).optional(), weight: positive.optional(), trigger: z.enum(['bluewhale-cloud', 'working', 'code', 'write', 'design', 'media', 'research', 'data', 'multi', 'cloud', 'overload', 'novice']).optional(), choices: z.array(z.object({ label: words, labelEn: words.optional(), cost: z.number().min(0), multiplier: z.number().min(0).max(2), effects: z.array(effect).optional() }).strict()).min(1).refine(xs => xs.some(x => x.cost === 0), 'free escape required') }).strict()),
    balance: balanceSchema.optional(),
    campaign: z.object({ living:livingSchema.optional(), office:officeSchema.optional(), projects:z.array(project).optional(), openingJobs:z.array(words).length(5).optional(),starterJobs:z.array(words).min(5).optional(), initial: z.array(words).min(1), recruits: z.array(z.object({character: words, cost: positive, reputation: z.number().min(0), minChapter:z.number().int().min(0).max(4).optional()}).strict()), software: z.array(z.object({id: words, name: words, nameEn: words, cost: positive, research: z.number().int().min(0), requires: z.array(words)}).strict()), maxHardware: z.number().int().min(1).max(5), maxChapter:z.number().int().min(0).max(4).optional(), stories:z.array(z.object({id:words,character:words,affinity:z.number().min(0).max(100),text:words,textEn:words,choices:z.array(z.object({label:words,labelEn:words,affinity:z.number().min(-10).max(10),mood:z.number().min(-20).max(20),research:z.number().int().min(0).max(5)}).strict()).length(2)}).strict()).optional() }).strict().optional()
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
        const office=c.campaign.office;if(office){if(new Set(office.catalog.map(x=>x.id)).size!==office.catalog.length||['basic','standard','whiteboard','coffee'].some(id=>!office.catalog.some(x=>x.id===id)))throw Error('OFFICE_REFERENCE');for(const d of office.catalog){if(d.zone!=='work'&&((d.efficiency??0)!==0||(d.energyCost??0)!==0))throw Error('OFFICE_REFERENCE');if(d.zone==='work'&&d.seats!==1)throw Error('OFFICE_REFERENCE');if(d.upgradeFrom){const from=office.catalog.find(x=>x.id===d.upgradeFrom);if(!from||from.price>d.price||from.zone!==d.zone)throw Error('OFFICE_REFERENCE');}}for(const id of office.computerVersions)if(!c.versions.some(v=>v.id===id))throw Error('OFFICE_REFERENCE');for(const id of office.computerTemplates)if(!c.commissions.some(t=>t.id===id))throw Error('OFFICE_REFERENCE');}

        for(const id of [...(c.campaign.openingJobs??[]),...(c.campaign.starterJobs??[])])if(!c.commissions.some(t=>t.id===id&&!t.offerOnly&&(t.minChapter??0)===0))throw Error('OPENING_REFERENCE');
        const projects=c.campaign.projects??[];
        if(new Set(projects.map(d=>d.id)).size!==projects.length)throw Error('PROJECT_REFERENCE');
        for(const d of projects){
            if(d.chapter>(c.campaign.maxChapter??0)||new Set(d.routes.map(r=>r.id)).size!==d.routes.length)throw Error('PROJECT_REFERENCE');
            for(const r of d.routes)for(const step of r.steps){const t=c.commissions.find(t=>t.id===step.template);if(!t||!t.offerOnly||t.proposals||(t.minChapter??0)>d.chapter||step.quality!==(t.qualityLines?.[0]??60))throw Error('PROJECT_REFERENCE');}
        }
        const p = c.campaign, roster = [...p.initial, ...p.recruits.map(r => r.character)];
        if (new Set(roster).size !== roster.length || roster.some(id => !c.versions.some(v => v.character === id)) || c.versions.some(v => !roster.includes(v.character))) throw Error('CAMPAIGN_REFERENCE');
        if(p.stories && (new Set(p.stories.map(x=>x.id)).size !== p.stories.length || p.stories.some(x=>!roster.includes(x.character)))) throw Error('STORY_REFERENCE');
        if(p.living){
            const l=p.living,unique=(xs:string[])=>new Set(xs).size===xs.length;
            const allIds=[...l.gifts,...l.duos,...l.threads,...l.clients].map(x=>x.id);
            if(!unique(allIds))throw Error('LIVING_DUPLICATE_ID');
            const refs=(xs:string[])=>xs.every(id=>roster.includes(id));
            const giftIds=['rice-bento','espresso-pods','fountain-pen','prism-sketchbook','vinyl-coaster','keycap-artisan'];
            const clientIds=['tea-lin','book-zhou','tech-yan','curator-su','oss-zhe','vc-lu'];
            if(l.gifts.some(g=>!giftIds.includes(g.id))||l.clients.some(c=>!clientIds.includes(c.id)))throw Error('LIVING_REFERENCE');
            for(const g of l.gifts)if(!refs([...g.lovedBy,...g.likedBy])||!unique([...g.lovedBy,...g.likedBy]))throw Error('LIVING_REFERENCE');
            for(const d of l.duos)if(!refs(d.actors)||d.actors[0]>=d.actors[1]||!d.banter.every(m=>d.actors.includes(m.speaker)))throw Error('LIVING_REFERENCE');
            for(const t of l.threads){
                if(!refs([...t.messages.map(m=>m.speaker),...t.replies.map(r=>r.targetActor)])||(t.trigger.kind==='recruit'&&!p.recruits.some(r=>r.character===t.trigger.value)))throw Error('LIVING_REFERENCE');
            }
            if(Object.keys(l.barks).length!==roster.length||!refs(Object.keys(l.barks)))throw Error('LIVING_REFERENCE');
            const eventIds=[...c.events.map(e=>e.id),'default','bluewhale-cloud','working','code','write','design','media','research','data','multi','cloud','overload','novice'];
            // A deliberately disabled event deck may retain dormant presentation quotes.
            // Active decks still reject dangling event ids; actor references always apply.
            const eventsDisabled=c.events.length===0&&c.balance?.eventChance===0;
            for(const [id,q] of Object.entries(l.eventQuotes))if((!eventsDisabled&&!eventIds.includes(id))||!refs(Object.keys(q.byActor??{})))throw Error('LIVING_REFERENCE');
        }
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
