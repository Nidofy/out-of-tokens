// Opus review harness: parametrised copy of apps/sim-cli/src/policy.ts (policy v3) for controlled variants.
// Baseline options reproduce runBot exactly (asserted in x0-selftest). No engine/content changes.
import { createInitialState, dispatchCommand } from '../../packages/oot-core/dist/index.js';
import { loadContent } from '../../packages/oot-content/dist/index.js';
export const content = loadContent();
const live = j => ['accepted', 'working', 'review', 'waiting'].includes(j.status);
const matching = (v, t) => Object.entries(t.weights).reduce((n, [k, w]) => n + w * v.skills[k] / 10, 0);
export const BASE = { filter: 'v3', hiddenAware: false, buy: 'v3', overtime: false, loan: false, local: 'none', planner: false };
function plans(c, t, available, strategy, o, hidden) {
  const options = [];
  const pass = (t.qualityLines?.[0] ?? 60) + 3 + (o.hiddenAware ? 8 * hidden : 0);
  for (let mask = 1; mask < (1 << available.length); mask++) {
    const workers = available.filter((_, i) => mask & (1 << i));
    const rest = available.filter(v => !workers.includes(v));
    const extras = [[undefined, undefined]];
    for (const r of rest) extras.push([r, undefined]);
    if (o.planner) for (const p of rest) { extras.push([undefined, p]); for (const r of rest) if (r !== p) extras.push([r, p]); }
    for (const [reviewer, planner] of extras) {
      const teamCost = 1 - .05 * Math.max(0, workers.length - 2);
      const boost = planner ? 1 + planner.skills.reason * .015 : 1;
      const wprod = workers.reduce((n, v) => n + 10 * matching(v, t) * v.speed, 0);
      const production = planner ? wprod * boost * teamCost + 5 * matching(planner, t) * planner.speed : wprod;
      const qnum = workers.reduce((n, v) => n + 10 * matching(v, t) ** 2 * v.speed * (planner ? boost * teamCost : 1), 0) + (planner ? 5 * matching(planner, t) ** 2 * planner.speed : 0);
      const quality = qnum / production * 100 + (reviewer ? 10 * matching(reviewer, t) : 0);
      const qOK = quality >= pass, tOK = production * t.workSlots >= t.workload * 1.15;
      if (o.filter === 'v3' && (!qOK || !tOK)) continue;
      if (o.filter === 'quality-only' && !qOK) continue;
      if (o.filter === 'time-only' && !tOK) continue;
      const cost = workers.reduce((n, v) => n + 10 * matching(v, t) * v.speed * v.price, 0) + (reviewer ? 3 * matching(reviewer, t) * reviewer.speed * reviewer.price : 0) + (planner ? 5 * matching(planner, t) * planner.speed * planner.price : 0);
      const count = workers.length + (reviewer ? 1 : 0) + (planner ? 1 : 0);
      const occupiedSlots = t.delivery === 'retainer' ? 14 : Math.ceil(t.workload / production);
      const score = strategy === 'greedy' ? quality * 10 + production : t.reward / (occupiedSlots * count) - cost * .15;
      const mode = ch => o.local === 'all' ? 'local' : o.local === 'ds-qwen' && ['bluewhale', 'qwen'].includes(ch) ? 'local' : 'cloud';
      options.push({ team: [...(planner ? [{ character: planner.character, role: 'planner', mode: mode(planner.character) }] : []), ...workers.map(v => ({ character: v.character, role: 'worker', mode: mode(v.character) })), ...(reviewer ? [{ character: reviewer.character, role: 'reviewer', mode: mode(reviewer.character) }] : [])], score });
    }
  }
  return options.sort((a, b) => b.score - a.score);
}
export function run(c, seed, strategy, days, opt = {}) {
  const o = { ...BASE, ...opt };
  let s = createInitialState(c, seed);
  let rng = (Math.imul(seed, 2654435761) >>> 0) || 1;
  const random = () => { rng ^= rng << 13; rng ^= rng >>> 17; rng ^= rng << 5; return (rng >>> 0) / 4294967296; };
  let outOfTokens = 0, loans = 0, otSlots = 0;
  const send = cmd => { const r = dispatchCommand(s, cmd, c); if (r.error) throw Error(`${strategy}:${JSON.stringify(cmd)}:${r.error}`); outOfTokens += r.events.filter(e => e.type === 'OutOfTokens').length; s = r.state; };
  const liquid = () => s.cash - s.jobs.filter(live).reduce((n, j) => n + j.advance, 0);
  while (s.absoluteSlot < days * 4 && !s.bankrupt) {
    if (s.pending) { const card = c.events.find(e => e.id === s.pending.card); const aff = card.choices.map((x, i) => ({ x, i })).filter(({ x }) => x.cost === 0 || x.cost <= s.cash); send({ type: 'choose', index: aff[0].i }); continue; }
    for (const j of s.jobs.filter(j => j.status === 'review')) { if (s.bankrupt) break; send({ type: j.quality < (c.commissions.find(t => t.id === j.template).qualityLines?.[0] ?? 60) && !j.reworked && s.absoluteSlot <= j.deadline ? 'rework' : 'deliver', job: j.id }); }
    if (s.bankrupt) break;
    if (o.loan && liquid() < 0 && s.loan < (c.balance.loanLimit)) { const amt = Math.min(c.balance.loanLimit - s.loan, Math.ceil(-liquid() / 100) * 100 + 500); send({ type: 'loan', amount: amt }); loans++; }
    if (o.loan && s.loan > 0 && liquid() > s.loan + 3000) send({ type: 'repay', amount: s.loan });
    if (s.absoluteSlot % 4 < 2) {
      const busy = () => new Set(s.jobs.filter(live).flatMap(j => j.team.map(m => m.character)));
      const free = () => c.versions.filter(v => !busy().has(v.character) && s.actors.find(a => a.id === v.character).busyUntil <= s.absoluteSlot && s.actors.find(a => a.id === v.character).energy >= 15);
      let available = free();
      const posted = s.jobs.filter(j => j.status === 'posted' && j.clarifyingUntil <= s.absoluteSlot);
      const candidates = posted.map(j => { const t = c.commissions.find(t => t.id === j.template); return { j, t, options: plans(c, t, available, strategy, o, j.hidden) }; }).filter(x => s.cash >= 0 || x.t.workload <= 40).filter(x => strategy !== 'clear-only' || x.t.clarity >= 80);
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
    if (o.overtime && s.absoluteSlot % 4 === 2) {
      for (const j of s.jobs.filter(j => j.status === 'working')) for (const m of j.team) {
        const a = s.actors.find(a => a.id === m.character);
        if (a.energy >= 60 && !s.overtime.includes(a.id)) { send({ type: 'overtime', character: a.id }); otSlots++; }
      }
    }
    const working = s.absoluteSlot % 4 < 2 || s.overtime.length;
    if (o.buy === 'v3') { if (s.absoluteSlot % 4 < 2 && s.quota + s.purchased < 40 && s.cash >= 50 && s.jobs.some(j => j.status === 'working')) send({ type: 'buy', amount: 100 }); }
    else if (o.buy === 'ahead' && working) {
      const need = s.jobs.filter(j => j.status === 'working').reduce((n, j) => n + j.team.filter(m => m.mode === 'cloud' && (s.absoluteSlot % 4 < 2 || s.overtime.includes(m.character))).reduce((k, m) => { const v = c.versions.find(v => v.character === m.character); const t = c.commissions.find(t => t.id === j.template); return k + 10 * matching(v, t) * v.speed * v.price * 1.2 * (m.role === 'worker' ? 1.1 : m.role === 'planner' ? .5 : .3); }, 0), 0);
      const gap = Math.ceil(need - s.quota - s.purchased);
      if (gap > 0 && s.cash >= gap * .5) send({ type: 'buy', amount: gap });
    }
    if (s.bankrupt) break;
    send({ type: 'advance' });
  }
  return { state: s, metrics: measure(c, s, seed, strategy, days, { outOfTokens, loans, otSlots }) };
}
export function measure(c, s, seed, strategy, days, extra = {}) {
  // cash/liquid timeline from ledger; outstanding advances cleared at first delivery/breach of the job.
  const adv = new Map(), firstSettle = new Map();
  for (const l of s.ledger) { const [kind, id] = [l.reason.split(':')[0], l.reason.slice(l.reason.lastIndexOf(':') + 1)]; if (kind === 'advance') adv.set(id, { slot: l.slot, amount: l.amount }); if ((kind === 'delivery' || kind === 'breach') && !firstSettle.has(id)) firstSettle.set(id, l.slot); }
  const cashAt = slot => 5000 + s.ledger.filter(l => l.slot <= slot).reduce((n, l) => n + l.amount, 0);
  const outAt = slot => [...adv].filter(([id, a]) => a.slot <= slot && !((firstSettle.get(id) ?? Infinity) <= slot)).reduce((n, [, a]) => n + a.amount, 0);
  const reached = slot => s.absoluteSlot >= slot;
  const ch = reached(56) ? cashAt(56) : null;
  let firstNegLiquid = null; for (let k = 0; k <= Math.min(s.absoluteSlot, 240); k += 4) if (cashAt(k) - outAt(k) < 0) { firstNegLiquid = k; break; }
  let sustained = reached(84) && !s.bankrupt || (s.absoluteSlot >= 84);
  if (reached(56)) for (let k = 56; k <= Math.min(84, s.absoluteSlot); k += 4) if (cashAt(k) - outAt(k) < 0) { sustained = false; break; }
  if (!reached(84)) sustained = false;
  // participation by role, WP by character, real parallel work
  const roleOf = (job, ch) => s.jobs.find(j => j.id === job)?.team.find(m => m.character === ch)?.role ?? '?';
  const byRole = {}, wp = {};
  const perSlot = new Map();
  for (const r of s.resources) {
    const role = roleOf(r.job, r.character); const key = r.character + ':' + role; byRole[key] = (byRole[key] ?? 0) + 1;
    const v = c.versions.find(v => v.character === r.character);
    if (role !== 'reviewer') { wp[r.character] = (wp[r.character] ?? 0) + r.units / v.price; const set = perSlot.get(r.slot) ?? new Set(); set.add(r.job); perSlot.set(r.slot, set); }
  }
  const workedSlots = [...perSlot.values()];
  const acc = s.jobs.filter(j => j.advance > 0 || j.phase > 0);
  const nov = acc.filter(j => c.commissions.find(t => t.id === j.template).client === 'novice');
  const income = s.ledger.filter(l => /^(advance|delivery|breach):/.test(l.reason)).reduce((n, l) => n + l.amount, 0);
  return { seed, strategy, days, slots: s.absoluteSlot, bankrupt: s.bankrupt, cash: s.cash, chapterCash: ch, chapterLiquid: reached(56) ? cashAt(56) - outAt(56) : null, chapterSolvent: ch !== null && ch >= 0, chapterLiquidSolvent: reached(56) && cashAt(56) - outAt(56) >= 0, sustained84: sustained, firstNegLiquid, crisesTotal: s.crises.length, byRole, wp, parallelWorkRate: workedSlots.length ? workedSlots.filter(x => x.size >= 2).length / workedSlots.length : 0, income14: s.ledger.filter(l => l.slot <= 56 && /^(advance|delivery|breach):/.test(l.reason)).reduce((n, l) => n + l.amount, 0), income, accepted: acc.length, delivered: acc.filter(j => j.status === 'delivered').length, breached: acc.filter(j => j.status === 'breached').length, noviceClosed: nov.filter(j => ['delivered', 'breached'].includes(j.status)).length, noviceBreached: nov.filter(j => j.status === 'breached').length, noviceByTemplate: Object.fromEntries([...new Set(nov.map(j => j.template))].map(t => [t, { closed: nov.filter(j => j.template === t && ['delivered', 'breached'].includes(j.status)).length, breached: nov.filter(j => j.template === t && j.status === 'breached').length }])), purchasesYuan: -s.ledger.filter(l => l.reason === 'buy-tokens').reduce((n, l) => n + l.amount, 0), leftoverPurchased: s.purchased, localUnits: s.resources.filter(r => r.mode === 'local').reduce((n, r) => n + r.units, 0), loan: s.loan, interest: -s.ledger.filter(l => l.reason === 'loan-interest').reduce((n, l) => n + l.amount, 0), minMood: Math.min(...s.actors.map(a => a.mood)), ...extra };
}
export function agg(rows) {
  const m = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN;
  const nc = rows.reduce((n, r) => n + r.noviceClosed, 0);
  const role = {}; for (const r of rows) for (const [k, v] of Object.entries(r.byRole)) role[k] = (role[k] ?? 0) + v;
  const rt = Object.values(role).reduce((a, b) => a + b, 0);
  const wp = {}; for (const r of rows) for (const [k, v] of Object.entries(r.wp)) wp[k] = (wp[k] ?? 0) + v;
  const wt = Object.values(wp).reduce((a, b) => a + b, 0);
  return { n: rows.length, chapterCash: +m(rows.map(r => r.chapterCash ?? 0)).toFixed(1), chapterSolvent: +m(rows.map(r => +r.chapterSolvent)).toFixed(3), chapterLiquidSolvent: +m(rows.map(r => +r.chapterLiquidSolvent)).toFixed(3), sustained84: +m(rows.map(r => +r.sustained84)).toFixed(3), bankrupt: +m(rows.map(r => +r.bankrupt)).toFixed(3), income14: +m(rows.map(r => r.income14)).toFixed(0), finalCash: +m(rows.map(r => r.cash)).toFixed(0), noviceClosed: nc, noviceBreach: nc ? +(rows.reduce((n, r) => n + r.noviceBreached, 0) / nc).toFixed(4) : null, breachRate: +(rows.reduce((n, r) => n + r.breached, 0) / rows.reduce((n, r) => n + r.accepted, 0)).toFixed(4), parallelWorkRate: +m(rows.map(r => r.parallelWorkRate)).toFixed(3), outOfTokens: +m(rows.map(r => r.outOfTokens ?? 0)).toFixed(2), purchasesYuan: +m(rows.map(r => r.purchasesYuan)).toFixed(1), leftoverPurchasedT: +m(rows.map(r => r.leftoverPurchased)).toFixed(1), loanRuns: rows.filter(r => r.loans > 0).length, otSlots: +m(rows.map(r => r.otSlots ?? 0)).toFixed(1), interest: +m(rows.map(r => r.interest)).toFixed(0), roleShare: Object.fromEntries(Object.entries(role).sort().map(([k, v]) => [k, +(v / rt).toFixed(4)])), wpShare: Object.fromEntries(Object.entries(wp).sort().map(([k, v]) => [k, +(v / wt).toFixed(4)])) };
}
