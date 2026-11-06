import { strategies } from './policy.js';
import type { runBot } from './policy.js';
export type Metrics = ReturnType<typeof runBot>['metrics'];
export function summarize(rows: Metrics[]) {
    return strategies.map(strategy => {
        const group = rows.filter(r => r.strategy === strategy);
        if (!group.length)
            throw Error('MISSING_STRATEGY:' + strategy);
        const sum = (f: (r: Metrics) => number) => group.reduce((n, r) => n + f(r), 0);
        const accepted = sum(r => r.accepted), noviceClosed = sum(r => r.noviceClosed);
        const participation: Record<string, number> = {};
        for (const r of group)
            for (const [id, n] of Object.entries(r.participation))
                participation[id] = (participation[id] ?? 0) + n;
        const all = Object.values(participation).reduce((n, x) => n + x, 0);
        const grades = { failed: sum(r => r.grades.failed), pass: sum(r => r.grades.pass), good: sum(r => r.grades.good), great: sum(r => r.grades.great) };
        return { strategy, runs: group.length, days: group[0]!.days, bankruptcy: sum(r => +r.bankrupt) / group.length, chapterBankruptcy: sum(r => +r.chapterBankrupt) / group.length, chapterSolvent: sum(r => +r.chapterSolvent) / group.length, chapterCash: sum(r => r.chapterCash ?? 0) / group.length, netCash: sum(r => r.netCash) / group.length, deliveryRate: accepted ? sum(r => r.delivered) / accepted : 0, breachRate: accepted ? sum(r => r.breached) / accepted : 0, active: sum(r => r.active), noviceClosed, noviceBreached: sum(r => r.noviceBreached), noviceBreachRate: noviceClosed ? sum(r => r.noviceBreached) / noviceClosed : 0, tokens: sum(r => r.tokens) / group.length, localCompute: sum(r => r.localCompute) / group.length, outOfTokens: sum(r => r.outOfTokens), tokenPurchases: sum(r => r.tokenPurchases), participation, participationRate: Object.fromEntries(Object.entries(participation).map(([k, n]) => [k, all ? n / all : 0])), grades, operatingMargin: sum(r => r.operatingMargin) / group.length };
    });
}
export function gates(summary: ReturnType<typeof summarize>) {
    const value = summary.find(r => r.strategy === 'value')!, random = summary.find(r => r.strategy === 'random')!, no = summary.find(r => r.strategy === 'no-clarify')!;
    return { chapterSurvival: value.days >= 14 && value.chapterBankruptcy < .05, randomRisk: random.days === 60 && random.bankruptcy >= .4 && random.bankruptcy <= .7, characterCoverage: Object.keys(value.participationRate).length === 4 && Object.values(value.participationRate).every(n => n >= .03), clarification: value.noviceClosed >= 30 && no.noviceClosed >= 30 && no.noviceBreachRate > 2 * value.noviceBreachRate };
}
