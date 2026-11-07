// F1.2/F1.3 diagnostics (not gates): tip fork outcomes bucketed by team min mood; mood<5 actor-slot share; recovery time.
// Uses committed harness/m07/opus-lib.mjs read-only (imports only). Training seeds 1-100 only; adapted by integrator; diagnostic, not gates.
import { makeDriver, cloneDriver, step, content, finish } from '../m07/opus-lib.mjs';
import { dispatchCommand, liquidCash, createInitialState } from '../../packages/oot-core/dist/index.js';
import { writeFileSync } from 'node:fs';
const B = { zero: { n: 0, d: 0, a: 0, t: 0 }, low: { n: 0, d: 0, a: 0, t: 0 }, mid: { n: 0, d: 0, a: 0, t: 0 } };
for (let seed = 1; seed <= 100; seed++) {
  const d = makeDriver(content, seed, 'value', { overtime: 'always', fork: true }); let g = 0;
  while (d.s.absoluteSlot < 240 && !d.s.bankrupt && g++ < 5000) {
    const r = step(d); if (r === 'end') break; if (r !== 'fork') continue;
    const job = d.s.jobs.find(j => j.id === d.s.pending.job), mood = Math.min(...job.team.map(m => d.s.actors.find(a => a.id === m.character).mood));
    if (mood < 50) {
      const k = mood === 0 ? 'zero' : mood < 25 ? 'low' : 'mid'; B[k].n++;
      const br = i => { const b = cloneDriver(d); b.o.fork = false; b.s = dispatchCommand(b.s, { type: 'choose', index: i }, content).state; const end = b.s.absoluteSlot + 28; while (b.s.absoluteSlot < end && !b.s.bankrupt) if (step(b) === 'end') break; return liquidCash(b.s) - (b.s.bankrupt ? 20000 : 0); };
      const delta = br(0) - br(1); if (delta > 1) B[k].a++; else if (delta < -1) B[k].d++; else B[k].t++;
    }
    d.s = dispatchCommand(d.s, { type: 'choose', index: 0 }, content).state;
  }
}
// mood<5 share in skilled & energy60
const low = {};
for (const [name, opt] of [['energy60', { overtime: 'energy60' }], ['skilled', { buy: 'ahead', overtime: 'energy60', local: 'ds-qwen' }]]) {
  let slots = 0, lowSlots = 0;
  for (let seed = 1; seed <= 100; seed++) { const d = makeDriver(content, seed, 'value', opt); while (d.s.absoluteSlot < 240 && !d.s.bankrupt) { if (step(d) === 'end') break; if (d.s.absoluteSlot % 4 === 0) for (const a of d.s.actors) { slots++; if (a.mood < 5) lowSlots++; } } }
  low[name] = +(lowSlots / slots).toFixed(4);
}
// recovery: actor at mood 0, never assigned, M0 content; count days to reach 40
let s = createInitialState(content, 1); for (const a of s.actors) a.mood = 0; let days = 0; s.jobs.forEach(j => j.status = 'rejected');
while (Math.min(...s.actors.map(a => a.mood)) < 40 && days < 100) { for (let i = 0; i < 4; i++) { const r = dispatchCommand(s, { type: 'advance' }, content); s = r.state; if (s.pending) s = dispatchCommand(s, { type: 'choose', index: 0 }, content).state; } days++; }
const out = { tipBuckets: B, nonTieDeclineShare: Object.fromEntries(Object.entries(B).map(([k, v]) => [k, v.d + v.a ? +(v.d / (v.d + v.a)).toFixed(3) : null])), moodBelow5ActorDayShare: low, idleRecoveryDays0to40: days };
writeFileSync(new URL('./training-counterfactual-1-100.json', import.meta.url), JSON.stringify(out, null, 1)); console.log(JSON.stringify(out));
