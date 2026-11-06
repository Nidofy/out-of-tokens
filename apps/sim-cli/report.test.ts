import { test, expect } from 'vitest';
import { loadContent } from 'oot-content';
import { hash, replay } from 'oot-persistence';
import { runBot, strategies } from './src/policy.js';
import { summarize, gates } from './src/report.js';
test('pooled rates retain failed runs, use closed novice orders, and short windows cannot pass gates', () => {
    const rows = strategies.map(strategy => runBot(loadContent(), 3, strategy, 3).metrics);
    const first = rows[0]!;
    first.accepted = 10;
    first.delivered = 8;
    first.breached = 1;
    first.active = 1;
    first.noviceAccepted = 100;
    first.noviceClosed = 4;
    first.noviceBreached = 1;
    rows.push({ ...first, seed: 4, bankrupt: true, accepted: 2, delivered: 0, breached: 2, active: 0, noviceAccepted: 50, noviceClosed: 2, noviceBreached: 2 });
    const summary = summarize(rows), v = summary[0]!;
    expect(v.bankruptcy).toBe(.5);
    expect(v.deliveryRate).toBe(8 / 12);
    expect(v.breachRate).toBe(3 / 12);
    expect(v.noviceBreachRate).toBe(3 / 6);
    expect(gates(summary).chapterSurvival).toBe(false);
    expect(gates(summary).randomRisk).toBe(false);
    expect(gates(summary).clarification).toBe(false);
});
test('low-quota simulations stop on bankruptcy from purchase and replay all completed runs', () => {
    const c = loadContent();
    c.balance!.dailyQuota = 60;
    c.balance!.upgradedQuota = 120;
    c.balance!.rewardScale = .8;
    for (let seed = 1; seed <= 100; seed++) {
        const r = runBot(c, seed, 'random', 60);
        expect(r.state.bankrupt || r.state.absoluteSlot === 240).toBe(true);
        if (r.commands.at(-1) && JSON.stringify(r.commands.at(-1)).includes('buy'))
            expect(hash(replay(c, seed, r.commands))).toBe(hash(r.state));
    }
}, 10000);
