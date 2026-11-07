import type { Card, Content, Job, State, Effect } from './model.js';
import {challengeAllows} from './finale.js';
import { round } from './economy.js';
import {effectiveVersion} from './campaign.js';
export function eligible(s: State, c: Content, card: Card, j: Job): boolean {
    if ((card.minChapter??0)>(s.campaign?.chapter??0) || j.status !== 'working')
        return false;
    const attending = (id: string) => s.actors.find(a => a.id === id)!.busyUntil <= s.absoluteSlot && s.actors.find(a => a.id === id)!.energy >= 10 && (s.absoluteSlot % 4 < 2 || s.overtime.includes(id));
    const resourced = (m: Job['team'][number]) => challengeAllows(s,c,s.actors.find(a=>a.id===m.character)!.version,m.mode) && attending(m.character) && (m.mode === 'cloud' ? s.quota + s.purchased > 0 : s.localCapacity > 0);
    if (!j.team.some(m => m.role === 'worker' && resourced(m)))
        return false;
    if (s.absoluteSlot - (s.eventLast[card.id] ?? -10000) < (card.cooldown ?? 0))
        return false;
    const t = c.commissions.find(t => t.id === j.template)!;
    switch (card.trigger) {
        case 'bluewhale-cloud': return j.team.some(m => m.character === 'bluewhale' && m.mode === 'cloud' && attending(m.character) && s.quota + s.purchased > 0);
        case 'cloud': return j.team.some(m => m.mode === 'cloud' && resourced(m));
        case 'write':
        case 'design':
        case 'media':
        case 'code':
        case 'data':
        case 'research': return t.category === card.trigger;
        case 'multi': return t.delivery !== 'oneshot';
        case 'novice': return t.client === 'novice';
        case 'overload': return j.team.some(m => { const a = s.actors.find(a => a.id === m.character)!; return resourced(m) && a.load > effectiveVersion(s,c,a,m.mode).context; });
        default: return true;
    }
}
export function applyEffects(s: State, j: Job, effects: Effect[]): number {
    let rate = 1;
    for (const e of effects) {
        if (e.kind === 'work')
            j.work = round(Math.max(j.progress, j.work + e.value));
        if (e.kind === 'quality')
            j.qualityBonus = round(Math.max(-100, Math.min(100, j.qualityBonus + e.value)));
        if (e.kind === 'defects')
            j.defects = Math.max(0, j.defects + e.value);
        if (e.kind === 'reset') {
            j.progress = 0;
            j.weighted = 0;
            j.reviewCoverage = 0;
            j.review = 0;
        }
        if (e.kind === 'tokenRate')
            rate = e.value;
        if (e.kind === 'cashPercent') {
            const amount = -round(Math.max(0, s.cash) * e.value);
            s.cash = round(s.cash + amount);
            s.ledger.push({ slot: s.absoluteSlot, reason: `event-loss:${j.id}`, amount });
        }
        if (e.kind === 'compact' || e.kind === 'mood')
            for (const m of j.team) {
                const a = s.actors.find(a => a.id === m.character)!;
                if (e.kind === 'compact')
                    a.load = Math.floor(a.load * e.value);
                else
                    a.mood = Math.min(100, Math.max(0, a.mood + e.value));
            }
    }
    return rate;
}
