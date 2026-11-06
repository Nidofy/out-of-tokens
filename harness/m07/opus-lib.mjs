// Opus 41dd3c4 review harness. Derived from harness/review-integration/opus-v4.mjs (copied, not modified in place).
// Baseline options reproduce apps/sim-cli policy v4 exactly (asserted in y0-selftest). No engine/content changes.
import { createInitialState, dispatchCommand, liquidCash } from '../../packages/oot-core/dist/index.js';
import { loadContent } from '../../packages/oot-content/dist/index.js';
export const content = loadContent();
const live = j => ['accepted', 'working', 'review', 'waiting'].includes(j.status);
const matching = (v, t) => Object.entries(t.weights).reduce((n, [k, w]) => n + w * v.skills[k] / 10, 0);
export const BASE = { filter: 'v3', hiddenAware: false, buy: 'v3', overtime: 'none', loan: 'none', local: 'none', tip: 0, fork: null };
function plans(c, t, available, strategy, o, hidden) {
  const options = [];
  const pass = (t.qualityLines?.[0] ?? 60) + 3 + (o.hiddenAware ? 8 * hidden : 0);
  for (let mask = 1; mask < (1 << available.length); mask++) {
    const workers = available.filter((_, i) => mask & (1 << i));
    const rest = available.filter(v => !workers.includes(v));
    for (const reviewer of [undefined, ...rest]) {
      const production = workers.reduce((n, v) => n + 10 * matching(v, t) * v.speed, 0);
      const quality = workers.reduce((n, v) => n + 10 * matching(v, t) ** 2 * v.speed, 0) / production * 100 + (reviewer ? 10 * matching(reviewer, t) : 0);
      const qOK = quality >= pass, tOK = production * t.workSlots >= t.workload * 1.15;
      if (o.filter === 'v3' && (!qOK || !tOK)) continue;
      const cost = workers.reduce((n, v) => n + 10 * matching(v, t) * v.speed * v.price, 0) + (reviewer ? 3 * matching(reviewer, t) * reviewer.speed * reviewer.price : 0);
      const count = workers.length + (reviewer ? 1 : 0);
      const occupiedSlots = t.delivery === 'retainer' ? 14 : Math.ceil(t.workload / production);
      const score = strategy === 'greedy' ? quality * 10 + production : t.reward / (occupiedSlots * count) - cost * .15;
      const mode = ch => o.local === 'ds-qwen' && ['bluewhale', 'qwen'].includes(ch) ? 'local' : 'cloud';
      options.push({ team: [...workers.map(v => ({ character: v.character, role: 'worker', mode: mode(v.character) })), ...(reviewer ? [{ character: reviewer.character, role: 'reviewer', mode: mode(reviewer.character) }] : [])], score });
    }
  }
  return options.sort((a, b) => b.score - a.score);
}
// step-level driver so experiments can fork a state mid-game
export function makeDriver(c, seed, strategy, opt = {}) {
  const o = { ...BASE, ...opt };
  const d = { s: createInitialState(c, seed), rng: (Math.imul(seed, 2654435761) >>> 0) || 1, ot: 0, oot: 0, loans: 0, chapter: null, snaps: [], tipSeen: 0, o, strategy, c };
  return d;
}
export function cloneDriver(d) { return { ...d, s: structuredClone(d.s), snaps: [...d.snaps], o: { ...d.o } }; }
export function step(d) {
  const { c, o, strategy } = d;
  const random = () => { d.rng ^= d.rng << 13; d.rng ^= d.rng >>> 17; d.rng ^= d.rng << 5; return (d.rng >>> 0) / 4294967296; };
  const send = cmd => { const prev = d.s.absoluteSlot; const r = dispatchCommand(d.s, cmd, c); if (r.error) throw Error(`${strategy}:${JSON.stringify(cmd)}:${r.error}`); d.oot += r.events.filter(e => e.type === 'OutOfTokens').length; d.s = r.state; if (d.s.absoluteSlot !== prev && (d.s.absoluteSlot % 4 === 0 || d.s.bankrupt)) d.snaps.push({ slot: d.s.absoluteSlot, liquid: liquidCash(d.s), cash: d.s.cash, bankrupt: d.s.bankrupt }); if (d.chapter === null && (d.s.absoluteSlot >= 56 || d.s.bankrupt)) d.chapter = { cash: d.s.cash, liquid: liquidCash(d.s), bankrupt: d.s.bankrupt }; };
  let s = d.s;
  if (s.pending) {
    const card = c.events.find(e => e.id === s.pending.card);
    if (card.id === 'tip' && o.fork) return 'fork';
    const aff = card.choices.map((x, i) => ({ x, i })).filter(({ x }) => x.cost === 0 || x.cost <= s.cash);
    const pick = card.id === 'tip' && aff.some(a => a.i === o.tip) ? o.tip : aff[0].i;
    send({ type: 'choose', index: pick }); return 'ok';
  }
  for (const j of d.s.jobs.filter(j => j.status === 'review')) { if (d.s.bankrupt) break; send({ type: j.quality < (c.commissions.find(t => t.id === j.template).qualityLines?.[0] ?? 60) && !j.reworked && d.s.absoluteSlot <= j.deadline ? 'rework' : 'deliver', job: j.id }); }
  if (d.s.bankrupt) return 'end';
  s = d.s;
  if (s.absoluteSlot % 4 < 2) {
    const busy = () => new Set(d.s.jobs.filter(live).flatMap(j => j.team.map(m => m.character)));
    const free = () => c.versions.filter(v => !busy().has(v.character) && d.s.actors.find(a => a.id === v.character).busyUntil <= d.s.absoluteSlot && d.s.actors.find(a => a.id === v.character).energy >= 15);
    let available = free();
    const posted = d.s.jobs.filter(j => j.status === 'posted' && j.clarifyingUntil <= d.s.absoluteSlot);
    const candidates = posted.map(j => { const t = c.commissions.find(t => t.id === j.template); return { j, t, options: plans(c, t, available, strategy, o, j.hidden) }; }).filter(x => liquidCash(d.s) >= 0 || x.t.workload * (x.t.phases ?? 1) <= 40).filter(x => strategy !== 'clear-only' || x.t.clarity >= 80);
    candidates.sort((a, b) => (b.options[0]?.score ?? -Infinity) - (a.options[0]?.score ?? -Infinity));
    if (strategy === 'random') for (let i = candidates.length - 1; i > 0; i--) { const n = Math.floor(random() * (i + 1)); [candidates[i], candidates[n]] = [candidates[n], candidates[i]]; }
    for (const cand of candidates) {
      available = free(); if (!available.length) break;
      const { j, t } = cand;
      const feasible = plans(c, t, available, strategy, o, j.hidden);
      const best = feasible[0]; if (!best) continue;
      if (j.hidden > 0 && strategy !== 'no-clarify') { for (const v of available.slice(0, j.hidden)) send({ type: 'clarify', job: j.id, character: v.character }); continue; }
      const team = strategy === 'random' ? feasible[Math.floor(random() * feasible.length)].team : best.team;
      send({ type: 'accept', job: j.id }); send({ type: 'assign', job: j.id, team });
    }
  }
  // overtime modes: 'energy60' (= committed helper), 'always' (every evening, energy>=10), 'mood45' (energy>=60 and mood>=45), 'night' (evening+deep night, energy>=10)
  const slot = d.s.absoluteSlot % 4;
  if (o.overtime !== 'none' && (slot === 2 || (slot === 3 && o.overtime === 'night'))) {
    for (const j of d.s.jobs.filter(j => j.status === 'working')) for (const m of j.team) {
      const a = d.s.actors.find(a => a.id === m.character);
      const ok = o.overtime === 'energy60' ? a.energy >= 60 : o.overtime === 'mood45' ? a.energy >= 60 && a.mood >= 45 : a.energy >= 10;
      if (ok && !d.s.overtime.includes(a.id)) { send({ type: 'overtime', character: a.id }); d.ot++; }
    }
  }
  const working = d.s.absoluteSlot % 4 < 2 || d.s.overtime.length;
  const need = () => d.s.jobs.filter(j => j.status === 'working').reduce((n, j) => n + j.team.filter(m => m.mode === 'cloud' && (d.s.absoluteSlot % 4 < 2 || d.s.overtime.includes(m.character))).reduce((k, m) => { const v = c.versions.find(v => v.character === m.character); const t = c.commissions.find(t => t.id === j.template); return k + 10 * matching(v, t) * v.speed * v.price * 1.2 * (m.role === 'worker' ? 1.1 : m.role === 'planner' ? .5 : .3); }, 0), 0);
  // loan 'need': borrow only the cash shortfall required to keep Token purchases going; repay as soon as cash allows.
  if (o.loan === 'need' && working) {
    const gap = Math.ceil(need() - d.s.quota - d.s.purchased);
    const want = o.buy === 'ahead' ? gap * .5 : (d.s.absoluteSlot % 4 < 2 && d.s.quota + d.s.purchased < 40 && d.s.jobs.some(j => j.status === 'working') ? 50 : 0);
    if (want > 0 && d.s.cash < want && d.s.loan < c.balance.loanLimit) { const amt = Math.min(c.balance.loanLimit - d.s.loan, Math.ceil((want - d.s.cash) / 100) * 100); if (amt > 0) { send({ type: 'loan', amount: amt }); d.loans++; } }
  }
  if (o.loan === 'need' && d.s.loan > 0 && d.s.cash - d.s.loan > 500) send({ type: 'repay', amount: d.s.loan });
  if (o.loan === 'panic' && liquidCash(d.s) < 0 && d.s.loan < c.balance.loanLimit) { send({ type: 'loan', amount: c.balance.loanLimit - d.s.loan }); d.loans++; }
  if (o.loan === 'panic' && d.s.loan > 0 && d.s.cash - d.s.loan > 3000) send({ type: 'repay', amount: d.s.loan });
  if (o.buy === 'v3') { if (d.s.absoluteSlot % 4 < 2 && d.s.quota + d.s.purchased < 40 && d.s.cash >= 50 && d.s.jobs.some(j => j.status === 'working')) send({ type: 'buy', amount: 100 }); }
  else if (o.buy === 'ahead' && working) { const gap = Math.ceil(need() - d.s.quota - d.s.purchased); if (gap > 0 && d.s.cash >= gap * .5) send({ type: 'buy', amount: gap }); }
  if (d.s.bankrupt) return 'end';
  send({ type: 'advance' });
  return d.s.bankrupt ? 'end' : 'ok';
}
export function finish(d, days) { while (d.s.absoluteSlot < days * 4 && !d.s.bankrupt) { const r = step(d); if (r === 'end') break; if (r === 'fork') throw Error('UNHANDLED_FORK'); } return d; }
export function run(c, seed, strategy, days, opt = {}) { return metrics(finish(makeDriver(c, seed, strategy, opt), days), days); }
export function metrics(d, days) {
  const s = d.s, c = d.c;
  const acc = s.jobs.filter(j => j.advance > 0 || j.phase > 0);
  const roleOf = (job, ch) => s.jobs.find(j => j.id === job)?.team.find(m => m.character === ch)?.role ?? '?';
  const paid = {}, wp = {}, soloJobs = {};
  for (const r of s.resources) { const k = r.character + ':' + roleOf(r.job, r.character); paid[k] = (paid[k] ?? 0) + 1; }
  for (const j of acc) if (j.team.length === 1) { const k = j.team[0].character + ':' + j.template; soloJobs[k] = (soloJobs[k] ?? 0) + 1; }
  const sustained = Array.from({ length: 8 }, (_, i) => 56 + i * 4).every(slot => d.snaps.some(x => x.slot === slot && x.liquid >= 0 && !x.bankrupt));
  return { seed: s.seed, strategy: d.strategy, slots: s.absoluteSlot, bankrupt: s.bankrupt, cash: s.cash, liquid: liquidCash(s), chapterCash: d.chapter?.cash ?? null, chapterLiquid: d.chapter?.liquid ?? null, chapterSolvent: !!d.chapter && d.chapter.liquid >= 0 && !d.chapter.bankrupt, sustained, income14: s.ledger.filter(l => l.slot < 56 && /^(advance|delivery|breach):/.test(l.reason)).reduce((n, l) => n + l.amount, 0), income: s.ledger.filter(l => /^(advance|delivery|breach):/.test(l.reason)).reduce((n, l) => n + l.amount, 0), buy14: -s.ledger.filter(l => l.slot < 56 && l.reason === 'buy-tokens').reduce((n, l) => n + l.amount, 0), accepted: acc.length, breached: acc.filter(j => j.status === 'breached').length, crises: s.crises.length, loans: d.loans, loanMax: d.loanMax ?? 0, loanOutstanding: s.loan, interest: -s.ledger.filter(l => l.reason === 'loan-interest').reduce((n, l) => n + l.amount, 0), ot: d.ot, oot: d.oot, minMood: Math.min(...s.actors.map(a => a.mood)), paid, soloJobs };
}
export function agg(rows) {
  const m = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN;
  return { n: rows.length, chapterSolvent: +m(rows.map(r => +r.chapterSolvent)).toFixed(3), sustained: +m(rows.map(r => +r.sustained)).toFixed(3), chapterCash: +m(rows.map(r => r.chapterCash ?? 0)).toFixed(1), chapterLiquid: +m(rows.map(r => r.chapterLiquid ?? 0)).toFixed(1), income14: +m(rows.map(r => r.income14)).toFixed(0), buy14: +m(rows.map(r => r.buy14)).toFixed(1), bankrupt60: +m(rows.map(r => +r.bankrupt)).toFixed(3), finalCash: +m(rows.map(r => r.cash)).toFixed(0), breachRate: +(rows.reduce((n, r) => n + r.breached, 0) / Math.max(1, rows.reduce((n, r) => n + r.accepted, 0))).toFixed(4), ot: +m(rows.map(r => r.ot)).toFixed(1), oot: +m(rows.map(r => r.oot)).toFixed(2), loanRuns: rows.filter(r => r.loans > 0).length, interest: +m(rows.map(r => r.interest)).toFixed(0), loanOutstanding: +m(rows.map(r => r.loanOutstanding)).toFixed(0), minMood: +m(rows.map(r => r.minMood)).toFixed(1) };
}
