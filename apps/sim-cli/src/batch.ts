import { mkdirSync, writeFileSync } from 'node:fs';
import { loadContent } from 'oot-content';
import { save } from 'oot-persistence';
import { runBot, strategies } from './bot.js';
const runs = Number(process.argv[2] ?? 5), days = Number(process.argv[3] ?? 14);
if (!Number.isInteger(runs) || runs < 1 || runs > 1000 || !Number.isInteger(days) || days < 1 || days > 60)
    throw Error('Usage: sim:batch [runs 1..1000] [days 1..60]');
const c = loadContent();
const results = [];
mkdirSync('harness/results', { recursive: true });
for (const strategy of strategies)
    for (let seed = 1; seed <= runs; seed++) {
        const r = runBot(c, seed, strategy, days);
        results.push(r.metrics);
        if (seed === 1)
            writeFileSync(`harness/results/${strategy}-replay.json`, save(c, seed, r.commands, r.state));
    }
writeFileSync('harness/results/batch.json', JSON.stringify(results, null, 2));
const keys = ['seed', 'strategy', 'days', 'slots', 'netCash', 'bankrupt', 'accepted', 'delivered', 'breached', 'deliveryRate', 'breachRate', 'tokens', 'operatingMargin'] as const;
writeFileSync('harness/results/batch.csv', [keys.join(','), ...results.map(r => keys.map(k => r[k]).join(','))].join('\n') + '\n');
for (const strategy of strategies) {
    const rows = results.filter(r => r.strategy === strategy);
    console.log(strategy, JSON.stringify({ runs, days, bankruptcy: rows.filter(r => r.bankrupt).length / runs, netCash: rows.reduce((s, r) => s + r.netCash, 0) / runs }));
}
