import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve, relative, isAbsolute } from 'node:path';
import { performance } from 'node:perf_hooks';
import { loadContent } from 'oot-content';
import { engineVersion } from 'oot-core';
import { save, hash, restore } from 'oot-persistence';
import { runBot, strategies } from './bot.js';
import { summarize, gates } from './report.js';
import type { Metrics } from './report.js';
const runs = Number(process.argv[2] ?? 5), days = Number(process.argv[3] ?? 14), seedStart = Number(process.argv[4] ?? 1), dir = resolve(process.argv[5] ?? 'harness/results');
const within = relative(resolve('harness'), dir);
if (!Number.isInteger(runs) || runs < 1 || runs > 1000 || !Number.isInteger(days) || days < 1 || days > 60 || !Number.isInteger(seedStart) || seedStart < 0 || seedStart + runs > 0xffffffff || within.startsWith('..') || isAbsolute(within))
    throw Error('Usage: sim:batch [runs 1..1000] [days 1..60] [seedStart] [output directory under harness] [--enforce]');
const c = loadContent(), results: Metrics[] = [], started = performance.now();
mkdirSync(dir, { recursive: true });
for (const strategy of strategies) {
    const begin = performance.now();
    for (let seed = seedStart; seed < seedStart + runs; seed++)
        results.push(runBot(c, seed, strategy, days).metrics);
    console.log(strategy, JSON.stringify({ runs, seconds: (performance.now() - begin) / 1000 }));
}
const seconds = (performance.now() - started) / 1000, summary = summarize(results), checks = gates(summary);
const write = (name: string, data: unknown) => writeFileSync(join(dir, name), JSON.stringify(data, null, 2) + '\n');
write('batch.json', results);
const scalar = results.map(r => ({ ...r, participation: undefined, participationRate: undefined, grades: undefined, ...Object.fromEntries(Object.entries(r.participationRate).map(([k, v]) => ['participation_' + k, v])), ...Object.fromEntries(Object.entries(r.grades).map(([k, v]) => ['grade_' + k, v])) }));
const keys = Object.keys(scalar[0]!).filter(k => !['participation', 'participationRate', 'grades'].includes(k));
writeFileSync(join(dir, 'batch.csv'), [keys.join(','), ...scalar.map(r => keys.map(k => (r as Record<string, unknown>)[k]).join(','))].join('\n') + '\n');
const diagnostics = [];
for (const strategy of strategies) {
    const rows = results.filter(r => r.strategy === strategy);
    const seeds = new Set([seedStart, rows.reduce((a, b) => a.netCash < b.netCash ? a : b).seed, rows.find(r => r.bankrupt)?.seed ?? seedStart]);
    for (const seed of seeds) {
        const r = runBot(c, seed, strategy, days), text = save(c, seed, r.commands, r.state);
        if (hash(restore(c, text).state) !== hash(r.state))
            throw Error('DIAGNOSTIC_REPLAY_MISMATCH');
        const name = seed === seedStart ? `${strategy}-replay.json` : `${strategy}-${seed}-replay.json`;
        writeFileSync(join(dir, name), text);
        write(`${strategy}-${seed}-diagnostic.json`, { metrics: r.metrics, projects: r.projects, daily: r.daily, deliveries: r.deliveries, stateHash: hash(r.state) });
        diagnostics.push({ strategy, seed, replay: name, stateHash: hash(r.state) });
    }
}
write('summary.json', { engineVersion, contentVersion: c.version, contentHash: hash(c), policyVersion: 3, runs, days, seedStart, seedEnd: seedStart + runs - 1, parameters: c.balance, seconds, secondsPer1000: seconds / (runs * strategies.length) * 1000, summary, gates: checks, passed: Object.values(checks).every(Boolean), diagnostics });
console.log(JSON.stringify({ summary, gates: checks, seconds }, null, 2));
if (process.argv.includes('--enforce') && !Object.values(checks).every(Boolean))
    process.exitCode = 1;
