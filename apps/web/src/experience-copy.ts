import raw from '../../../content/presentation/experience-v1.json';
import {validateExperiencePresentation} from 'oot-content/presentation';
import {matchesRevision} from 'oot-platform';
import type {ExperienceView, DuoExplanation, GameView} from 'oot-platform';

const copy = validateExperiencePresentation(raw);
type Receipt = ExperienceView['receipts'][number];
type CopyJob = Pick<GameView['jobs'][number], 'id' | 'template'>;
type Role = keyof typeof copy.roles;
const roleOrder: Role[] = ['planner', 'worker', 'tool', 'reviewer'];
function contributions(receipt: Receipt) {
    return [...new Set(receipt.participants)].flatMap(actorId => {
        const roles = roleOrder.filter(role => receipt.facts.some(f => f.certainty === 'certain' &&
            f.actorId === actorId && f.jobId === receipt.jobId && f.reason === 'contributed-' + role));
        return roles.length ? [{actorId, roles}] : [];
    });
}
function receiptRow(receipt: Receipt | undefined, job: CopyJob | undefined) {
    if (!receipt || !job || receipt.jobId !== job.id) return undefined;
    const results = receipt.facts.filter(f => f.certainty === 'certain' && f.jobId === job.id &&
        ['delivery-passed', 'delivery-rework', 'delivery-failed'].includes(f.reason));
    if (results.length !== 1) return undefined;
    const outcome = results[0]!.reason.slice('delivery-'.length);
    return copy.receipts.find(r => r.outcome === outcome && r.templates.includes(job.template)) ??
        copy.receipts.find(r => r.scene === 'workshop' && r.outcome === outcome);
}
export function experienceReceiptCopy(receipt: Receipt | undefined, job: CopyJob | undefined) {
    const text = receiptRow(receipt, job);
    if (!text || !receipt) return {...copy.neutral, participants: [] as string[], review: null};
    const actors = contributions(receipt);
    return {zh: text.zh, en: text.en, participants: actors.map(a => a.actorId),
        review: actors.some(a => a.roles.includes('reviewer')) ? {...copy.reviewed} : null};
}
/** Pass jobs from the same session view. Bind async duo explanations to the visible job and draft. */
export function experienceDuoCopy(
    stage: 'first-shared-delivery' | 'tea-ready' | 'unlocked-benefit',
    duo: GameView['living']['duos'][number], view: ExperienceView,
    context: {jobs?: readonly CopyJob[]; explanation?: DuoExplanation; jobId?: string; draftKey?: string} = {},
) {
    const story = copy.duos.find(d => d.id === duo.id);
    const neutral = () => ({lines: [], fallback: {...copy.neutral}});
    if (!story) return neutral();
    const lines = story.stages.find(s => s.id === stage)!.lines.map(l => ({...l}));
    if (stage === 'first-shared-delivery') {
        // Earliest proven joint acceptance, never today's assignment or a failed delivery.
        for (const receipt of view.receipts) {
            const row = receiptRow(receipt, context.jobs?.find(j => j.id === receipt.jobId));
            const actors = contributions(receipt);
            if (row?.outcome !== 'passed' || !story.actors.every(id => actors.some(a => a.actorId === id))) continue;
            for (const line of lines) {
                const actor = actors.find(a => a.actorId === line.speaker)!;
                for (const locale of ['zh', 'en'] as const) {
                    const roles = actor.roles.map(role => copy.roles[role][locale]).join(locale === 'zh' ? '、' : ', ');
                    line[locale] = copy.contribution[locale].replace('{subject}', row.subject[locale]).replace('{roles}', roles) + ' ' + line[locale];
                }
            }
            return {lines, fallback: null};
        }
        return neutral();
    }
    if (stage === 'tea-ready') return duo.canUnlock ? {lines, fallback: null} : neutral();
    const explanation = context.explanation;
    if (!duo.unlocked || !explanation || !matchesRevision(explanation, view) ||
        explanation.jobId !== context.jobId || explanation.draftKey !== context.draftKey) return neutral();
    const result = explanation.duos.find(d => d.duoId === duo.id);
    if (result?.state === 'active') return {lines, fallback: null};
    return result?.state === 'inactive' ? {lines: [], fallback: {...copy.duoInactive}} : neutral();
}
