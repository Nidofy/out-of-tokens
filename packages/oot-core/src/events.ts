import type { Card, Content, Job, State, Effect } from './model.js';
import { round } from './economy.js';
export function eligible(s: State, c: Content, card: Card, j: Job): boolean {
    if (j.status !== 'working')
        return false;
    const attending = (id: string) => s.actors.find(a => a.id === id)!.energy >= 10 && (s.absoluteSlot % 4 < 2 || s.overtime.includes(id));
    if (!j.team.some(m => m.role === 'worker' && attending(m.character)))
        return false;
    if (s.absoluteSlot - (s.eventLast[card.id] ?? -10000) < (card.cooldown ?? 0))
        return false;
    const t = c.commissions.find(t => t.id === j.template)!;
    switch (card.trigger) {
        case 'bluewhale-cloud': return j.team.some(m => m.character === 'bluewhale' && m.mode === 'cloud' && attending(m.character) && s.quota + s.purchased > 0);
        case 'cloud': return j.team.some(m => m.mode === 'cloud');
        case 'code':
        case 'data':
        case 'research': return t.category === card.trigger;
        case 'multi': return t.delivery !== 'oneshot';
        case 'novice': return t.client === 'novice';
        case 'overload': return j.team.some(m => { const a = s.actors.find(a => a.id === m.character)!; return a.load >= c.versions.find(v => v.id === a.version)!.context; });
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
