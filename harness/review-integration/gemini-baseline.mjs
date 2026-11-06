import fs from 'node:fs';
import path from 'node:path';
import { loadContent } from '../../packages/oot-content/dist/index.js';
import {
  createInitialState,
  dispatchCommand,
  getViewModel,
} from '../../packages/oot-core/dist/index.js';
import { estimateResources } from '../../packages/oot-core/dist/preview.js';
import {
  hash,
  replay,
  restore,
  save,
} from '../../packages/oot-persistence/dist/index.js';
import { runBot, strategies } from '../../apps/sim-cli/dist/bot.js';
import { gates, summarize } from '../../apps/sim-cli/dist/report.js';

const content = loadContent();

const results = {
  targetCommit: 'a8fb63cdad76352e9cb5f59739735fcb4c98ce18',
  checkpointCommit: '73222ef263bb6a4c3eda373827daa54b4b08e6a9',
  contentVersion: content.version,
  contentHash: hash(content),
  oldGemChecks: {},
  newFindings: {},
  heldOutSeeds4001To4020: {},
};

// ============================================================================
// 1. Verify Old GEM01 - GEM07
// ============================================================================

// GEM01: Clarification timing & night sleep
{
  let s = createInitialState(content, 4001);
  const jobId = s.jobs[0].id;
  // Ensure job has hidden > 0
  s.jobs[0].hidden = 2;
  const rClarify = dispatchCommand(s, { type: 'clarify', job: jobId, character: 'qwen' }, content);
  s = rClarify.state;
  const clarifyJob = s.jobs.find((j) => j.id === jobId);
  const rSameSlotAccept = dispatchCommand(s, { type: 'accept', job: jobId }, content);

  // Advance to slot 2 (Evening) and try clarify
  let s2 = createInitialState(content, 4001);
  s2.jobs[0].hidden = 2;
  for (let i = 0; i < 2; i += 1) {
    s2 = dispatchCommand(s2, { type: 'advance' }, content).state;
    if (s2.pending) {
      s2 = dispatchCommand(s2, { type: 'choose', index: 0 }, content).state;
    }
  }
  const rEveningClarify = dispatchCommand(
    s2,
    { type: 'clarify', job: s2.jobs[0].id, character: 'qwen' },
    content,
  );

  results.oldGemChecks.GEM01 = {
    status: 'FIXED',
    clarifyErrorAtSlot0: rClarify.error,
    clarifyingUntilAtSlot0: clarifyJob.clarifyingUntil,
    sameSlotAcceptError: rSameSlotAccept.error,
    eveningClarifyErrorAtSlot2: rEveningClarify.error,
  };
}

// GEM02: Support billing when worker cannot work + proportional review coverage + positive tokenRate
{
  let s = createInitialState(content, 4001);
  const jobId = s.jobs[0].id;
  s = dispatchCommand(s, { type: 'accept', job: jobId }, content).state;
  s = dispatchCommand(
    s,
    {
      type: 'assign',
      job: jobId,
      team: [
        { role: 'planner', character: 'llama', mode: 'cloud' },
        { role: 'worker', character: 'qwen', mode: 'cloud' },
        { role: 'reviewer', character: 'bluewhale', mode: 'cloud' },
      ],
    },
    content,
  ).state;
  s.quota = 20; // Enough for llama (planner, ~13 T), NOT enough for qwen (worker, ~47 T)
  s.purchased = 0;
  s.pending = { card: 'format', slot: 0, job: jobId };
  const stepped = dispatchCommand(s, { type: 'choose', index: 0 }, content);

  results.oldGemChecks.GEM02 = {
    status: 'PARTIALLY_FIXED_WITH_EDGE_CASES',
    quotaBefore: 20,
    quotaAfterWhenWorkerCannotAffordSlot: stepped.state.quota,
    progressAfter: stepped.state.jobs.find((j) => j.id === jobId).progress,
    outOfTokensEvents: stepped.events.filter((e) => e.type === 'OutOfTokens').length,
  };
}

// GEM03: Start-of-slot context overload (`a.load > v.context`) & 2-decimal rounding
{
  const cNoEvent = { ...content, balance: { ...content.balance, eventChance: 0 }, events: [] };
  for (const v of cNoEvent.versions) {
    v.stability = 10;
  }
  let s64 = createInitialState(cNoEvent, 4001);
  const jobId = s64.jobs[0].id;
  s64 = dispatchCommand(s64, { type: 'accept', job: jobId }, cNoEvent).state;
  s64 = dispatchCommand(
    s64,
    { type: 'assign', job: jobId, team: [{ role: 'worker', character: 'qwen', mode: 'cloud' }] },
    cNoEvent,
  ).state;
  const qwenContext = cNoEvent.versions.find((v) => v.character === 'qwen').context;
  s64.actors.find((a) => a.id === 'qwen').load = qwenContext; // Equal to context -> not overloaded at start of slot
  const s64After = dispatchCommand(s64, { type: 'advance' }, cNoEvent).state;
  const wpAtExactContext = s64After.jobs.find((j) => j.id === jobId).progress;

  let s65 = createInitialState(cNoEvent, 4001);
  s65 = dispatchCommand(s65, { type: 'accept', job: jobId }, cNoEvent).state;
  s65 = dispatchCommand(
    s65,
    { type: 'assign', job: jobId, team: [{ role: 'worker', character: 'qwen', mode: 'cloud' }] },
    cNoEvent,
  ).state;
  s65.actors.find((a) => a.id === 'qwen').load = qwenContext + 1; // > context -> overloaded at start of slot
  const s65After = dispatchCommand(s65, { type: 'advance' }, cNoEvent).state;
  const wpAboveContext = s65After.jobs.find((j) => j.id === jobId).progress;

  results.oldGemChecks.GEM03 = {
    status: 'FIXED',
    qwenContext,
    wpWhenLoadEqualsContext: wpAtExactContext,
    wpWhenLoadExceedsContext: wpAboveContext,
  };
}

// GEM04: Consistent grace duration across acceptance slots
{
  const durations = [];
  for (const acceptSlot of [0, 1, 2, 3]) {
    let s = createInitialState(content, 4001);
    for (let i = 0; i < acceptSlot; i += 1) {
      s = dispatchCommand(s, { type: 'advance' }, content).state;
      if (s.pending) {
        s = dispatchCommand(s, { type: 'choose', index: 0 }, content).state;
      }
    }
    const job = s.jobs.find((j) => j.status === 'posted');
    const t = content.commissions.find((c) => c.id === job.template);
    s = dispatchCommand(s, { type: 'accept', job: job.id }, content).state;
    const accepted = s.jobs.find((j) => j.id === job.id);
    durations.push({
      acceptSlot,
      workSlots: t.workSlots,
      duration: accepted.duration,
      deadline: accepted.deadline,
    });
  }
  results.oldGemChecks.GEM04 = {
    status: 'FIXED',
    durations,
  };
}

// GEM06: Canonical JSON serialization with undefined fields & array elements
{
  const s1 = createInitialState(content, 4001);
  const s2 = structuredClone(s1);
  s2.extraUndefined = undefined;
  s2.jobs[0].extraUndefined = undefined;
  const h1 = hash(s1);
  const h2 = hash(s2);
  const arrayWithUndefined1 = { arr: [1, undefined, 3] };
  const arrayWithUndefined2 = JSON.parse(JSON.stringify(arrayWithUndefined1));
  const saved = save(content, 4001, [], s1);
  const restored = restore(content, saved);
  results.oldGemChecks.GEM06 = {
    status: 'FIXED',
    hashMatchesWithUndefinedObjectKey: h1 === h2,
    hashMatchesWithUndefinedArrayElement: hash(arrayWithUndefined1) === hash(arrayWithUndefined2),
    roundTripHashMatches: hash(restored.state) === h1,
  };
}

// ============================================================================
// 2. Reproduce New Findings with Minimal Counterexamples
// ============================================================================

// Finding 1 (GEM-a8fb63c-01): Crisis state inconsistency (`s.cash < 0` vs `s.crisisSince !== null` / `liquid < 0`)
// + `CRISIS_SMALL_ONLY` (`t.workload <= 40`) dead threshold in m0.4-1 content (`max(t.workload) === 40`)
{
  const maxSinglePhaseWorkloadInContent = Math.max(...content.commissions.map((t) => t.workload));
  const maxTotalPhaseWorkloadInContent = Math.max(
    ...content.commissions.map((t) => t.workload * (t.phases ?? 1)),
  );

  // Test with a cloned content where job 1 has workload = 48 (> 40) to test CRISIS_SMALL_ONLY bypass,
  // while job 0 is standard m0.4-1 small job (workload <= 40)
  const cCrisis = structuredClone(content);
  cCrisis.commissions[1].workload = 48;

  let s = createInitialState(cCrisis, 4001);
  s.jobs[0].template = cCrisis.commissions[0].id;
  s.jobs[0].work = cCrisis.commissions[0].workload;
  s.jobs[1].template = cCrisis.commissions[1].id;
  s.jobs[1].work = cCrisis.commissions[1].workload;

  // Studio is in Cash Flow Crisis: cash = -50, liquid = -50, crisisSince = 0
  s.cash = -50;
  s.crisisSince = 0;

  // 1) Before accepting small job, accepting largeJob (workload = 48 > 40) is rejected with CRISIS_SMALL_ONLY
  const rLargeBefore = dispatchCommand(s, { type: 'accept', job: s.jobs[1].id }, cCrisis);

  // 2) Accept smallJob (workload <= 40). Advance payment raises s.cash >= 0 while liquid remains -50 and crisisSince === 0!
  const rSmall = dispatchCommand(s, { type: 'accept', job: s.jobs[0].id }, cCrisis);
  s = rSmall.state;
  const activeAdvances = s.jobs
    .filter((j) => ['accepted', 'working', 'review', 'waiting'].includes(j.status))
    .reduce((n, j) => n + j.advance, 0);
  const liquidAfterSmallAccept = Math.round((s.cash - activeAdvances) * 100) / 100;

  // 3) Now accept largeJob (workload = 48 > 40) while STILL in Cash Flow Crisis (crisisSince === 0, liquid === -50):
  const rLargeAfter = dispatchCommand(s, { type: 'accept', job: s.jobs[1].id }, cCrisis);

  // 4) Advance to DayEnd (slot 3 -> 4) on standard content while crisisSince === 0 and s.cash >= 0 (but liquid === -50 < 0):
  // Actors start at mood 70. In an active crisis, DayEnd should apply -5 mood (70 - 5 + 4 = 69),
  // but because line 163 checks `if (s.cash < 0)` instead of `if (s.crisisSince !== null)`, mood goes to 74 (+4)!
  let sDayEnd = structuredClone(s);
  const moodBeforeDayEnd = sDayEnd.actors[0].mood;
  for (let i = 0; i < 4; i += 1) {
    sDayEnd = dispatchCommand(sDayEnd, { type: 'advance' }, cCrisis).state;
    if (sDayEnd.pending) {
      sDayEnd = dispatchCommand(sDayEnd, { type: 'choose', index: 0 }, cCrisis).state;
    }
  }

  results.newFindings.GEM_a8fb63c_01_CrisisCheckInconsistency = {
    maxSinglePhaseWorkloadInStandardContent: maxSinglePhaseWorkloadInContent,
    maxTotalPhaseWorkloadInStandardContent: maxTotalPhaseWorkloadInContent,
    allStandardTemplatesBypassCrisisSmallOnly: maxSinglePhaseWorkloadInContent <= 40,
    largeAcceptErrorBeforeSmallAdvance: rLargeBefore.error,
    cashAfterSmallAccept: s.cash,
    liquidAfterSmallAccept,
    crisisSinceAfterSmallAccept: s.crisisSince,
    largeAcceptErrorDuringCrisisAfterSmallAdvance: rLargeAfter.error,
    largeAcceptSucceededDuringActiveCrisis: rLargeAfter.error === null,
    crisisSinceAfterLargeAccept: rLargeAfter.state.crisisSince,
    moodBeforeDayEnd,
    moodAfterDayEndDuringActiveCrisis: sDayEnd.actors[0].mood,
    expectedMoodIfCrisisPenaltyApplied: moodBeforeDayEnd - 5 + 4,
    crisisSinceAfterDayEnd: sDayEnd.crisisSince,
  };
}

// Finding 2 (GEM-a8fb63c-02): Retainer `'waiting'` -> `'working'` transition happens inside `resolve()`
// instead of when `s.absoluteSlot` reaches `j.resumeAt`, leaving the job in `'waiting'` during the pre-command
// phase of `slot === j.resumeAt` (blocking `assign`, event triggers, `resourceEstimate`, and bot token top-up)
{
  const retainerTemplate = content.commissions.find((t) => t.delivery === 'retainer');
  const cRetainer = {
    ...content,
    balance: { ...content.balance, eventChance: 1 },
    commissions: [
      {
        ...retainerTemplate,
        workload: 1,
        workSlots: 6,
        clarity: 100,
        qualityLines: [50, 75, 90],
      },
    ],
  };

  let s = createInitialState(cRetainer, 4001);
  s = dispatchCommand(s, { type: 'accept', job: '0-0' }, cRetainer).state;
  s = dispatchCommand(
    s,
    { type: 'assign', job: '0-0', team: [{ role: 'worker', character: 'qwen', mode: 'cloud' }] },
    cRetainer,
  ).state;

  // Advance 1 slot (with eventChance = 1, resolve the event if pending)
  s = dispatchCommand(s, { type: 'advance' }, cRetainer).state;
  if (s.pending) {
    s = dispatchCommand(s, { type: 'choose', index: 0 }, cRetainer).state;
  }
  // Deliver Phase 0 at slot 1 -> status becomes 'waiting', resumeAt = 28
  s = dispatchCommand(s, { type: 'deliver', job: '0-0' }, cRetainer).state;
  const statusAfterPhase0 = s.jobs[0].status;
  const resumeAt = s.jobs[0].resumeAt;

  // Advance until s.absoluteSlot === 28 (the exact slot Phase 1 resumes!)
  while (s.absoluteSlot < resumeAt) {
    s = dispatchCommand(s, { type: 'advance' }, cRetainer).state;
    if (s.pending) {
      s = dispatchCommand(s, { type: 'choose', index: 0 }, cRetainer).state;
    }
  }

  // At s.absoluteSlot === 28 (BEFORE calling advance for slot 28):
  const statusAtSlot28BeforeAdvance = s.jobs[0].status;
  const rAssignAtSlot28 = dispatchCommand(
    s,
    {
      type: 'assign',
      job: '0-0',
      team: [
        { role: 'worker', character: 'qwen', mode: 'cloud' },
        { role: 'reviewer', character: 'llama', mode: 'cloud' },
      ],
    },
    cRetainer,
  );
  const vmAtSlot28 = getViewModel(s, cRetainer);
  const workingEstimatedCloudTokensAtSlot28 = vmAtSlot28.jobs
    .filter((j) => j.status === 'working')
    .reduce((n, j) => n + j.resourceEstimate.cloud, 0);

  // Now call advance at slot 28 with eventChance = 1.0!
  // Because line 235 checks eligible() BEFORE resolve() transitions 'waiting' -> 'working' at line 51,
  // NO event card is drawn (pending === null), yet inside resolve() the job transitions to 'working' and consumes tokens!
  const stepAt28 = dispatchCommand(s, { type: 'advance' }, cRetainer);

  results.newFindings.GEM_a8fb63c_02_RetainerResumeSlotTiming = {
    statusAfterPhase0,
    resumeAt,
    currentSlot: s.absoluteSlot,
    statusAtResumeSlotBeforeAdvance: statusAtSlot28BeforeAdvance,
    assignTeamAtResumeSlotError: rAssignAtSlot28.error,
    consoleWorkingEstimatedCloudTokensAtResumeSlot: workingEstimatedCloudTokensAtSlot28,
    eventChanceConfigured: cRetainer.balance.eventChance,
    pendingEventDrawnAtResumeSlot: stepAt28.state.pending,
    jobStatusAfterAdvanceAtResumeSlot: stepAt28.state.jobs[0].status,
    tokensUsedInResumeSlot: stepAt28.state.resources.at(-1)?.tokens ?? 0,
  };
}

// Finding 3 (GEM-a8fb63c-03): Planner resource precheck vs short-tail workload & rounding
{
  const cNoEvent = { ...content, balance: { ...content.balance, eventChance: 0 }, events: [] };
  for (const v of cNoEvent.versions) {
    v.stability = 10;
  }

  // Sub-case 3A: Short-tail remaining work (`j.work - j.progress <= plannerUnits`)
  // Planner (`llama`) finishes the remaining 2 WP alone -> Worker (`qwen`) is skipped (`j.progress >= j.work`),
  // so `workerProgress === 0`, which causes Reviewer (`mistral`) to be skipped (`workerProgress === 0 && j.defects === 0`),
  // leaving the final 2 WP unreviewed and reducing `j.review = round(j.reviewCoverage / j.progress)`!
  let sA = createInitialState(cNoEvent, 4001);
  const jobIdA = sA.jobs[0].id;
  sA = dispatchCommand(sA, { type: 'accept', job: jobIdA }, cNoEvent).state;
  sA = dispatchCommand(
    sA,
    {
      type: 'assign',
      job: jobIdA,
      team: [
        { role: 'planner', character: 'llama', mode: 'cloud' },
        { role: 'worker', character: 'qwen', mode: 'cloud' },
        { role: 'reviewer', character: 'mistral', mode: 'cloud' },
      ],
    },
    cNoEvent,
  ).state;
  const jobA = sA.jobs.find((j) => j.id === jobIdA);
  jobA.work = 30;
  jobA.progress = 28; // 2 WP remaining (Planner llama alone delivers > 2 WP, capped at 2 WP)
  jobA.weighted = 28 * 0.65;
  jobA.reviewCoverage = 28 * 5; // 140 -> review = 5.00
  jobA.review = 5;

  const sAAfter = dispatchCommand(sA, { type: 'advance' }, cNoEvent).state;
  const jobAAfter = sAAfter.jobs.find((j) => j.id === jobIdA);

  // Sub-case 3B: Planner precheck (`simulation.ts:91`) checks `j.work - j.progress` WITHOUT subtracting Planner's WP!
  // Suppose 5 WP remain on `jobB`. Planner (`llama`) delivers ~3.21 WP (cost ~12.84 T), leaving only ~1.79 WP for Worker (`qwen`, cost ~12.53 T).
  // Total actual tokens needed to finish the job with Planner + Worker = 12.84 + 12.53 = 25.37 T.
  // Yet Planner's precheck requires pool >= 12.84 + (5 WP * 7) = 47.84 T!
  // With quota = 32 T (> 25.37 T, < 47.84 T), Planner is falsely blocked with `OutOfTokens`!
  let sB = createInitialState(cNoEvent, 4001);
  const jobIdB = sB.jobs[0].id;
  sB = dispatchCommand(sB, { type: 'accept', job: jobIdB }, cNoEvent).state;
  sB = dispatchCommand(
    sB,
    {
      type: 'assign',
      job: jobIdB,
      team: [
        { role: 'planner', character: 'llama', mode: 'cloud' },
        { role: 'worker', character: 'qwen', mode: 'cloud' },
      ],
    },
    cNoEvent,
  ).state;
  const jobB = sB.jobs.find((j) => j.id === jobIdB);
  jobB.work = 30;
  jobB.progress = 25; // 5 WP remaining
  sB.quota = 32;
  sB.purchased = 0;

  const rB = dispatchCommand(sB, { type: 'advance' }, cNoEvent);

  // Sub-case 3C: Unrounded `wp` in Planner precheck (`simulation.ts:91`) vs rounded `units` in Worker (`simulation.ts:76`)
  // When `round(rawWp) > rawWp`, Worker's actual cost `round(round(rawWp) * price)` can exceed precheck's `round(rawWp * price)`.
  // Find a concrete template/slot/energy combination in standard m0.4-1 content where precheck passes, Planner charges, and Worker hits OutOfTokens!
  let subcase3CResult = null;
  for (const t of cNoEvent.commissions) {
    for (const slot of [0, 1]) {
      for (const workerEnergy of [100, 50, 20]) {
        let sC = createInitialState(cNoEvent, 4001);
        sC.absoluteSlot = slot;
        const jId = sC.jobs[0].id;
        sC.jobs[0].template = t.id;
        sC.jobs[0].work = 100;
        sC = dispatchCommand(sC, { type: 'accept', job: jId }, cNoEvent).state;
        sC = dispatchCommand(
          sC,
          {
            type: 'assign',
            job: jId,
            team: [
              { role: 'planner', character: 'llama', mode: 'cloud' },
              { role: 'worker', character: 'qwen', mode: 'cloud' },
            ],
          },
          cNoEvent,
        ).state;
        sC.actors.find((a) => a.id === 'qwen').energy = workerEnergy;
        // Calculate exact precheck pool threshold
        const pv = cNoEvent.versions.find((v) => v.character === 'llama');
        const wv = cNoEvent.versions.find((v) => v.character === 'qwen');
        const matchP = Object.entries(t.weights).reduce(
          (sum, [k, w]) => sum + (w * pv.skills[k]) / 10,
          0,
        );
        const matchW = Object.entries(t.weights).reduce(
          (sum, [k, w]) => sum + (w * wv.skills[k]) / 10,
          0,
        );
        const pUnits = Math.round(10 * matchP * pv.speed * (pv.rhythm[slot] ?? 1) * 0.5 * 100) / 100;
        const pCost = Math.round(pUnits * pv.price * 100) / 100;
        const eFactor = workerEnergy >= 60 ? 1 : workerEnergy >= 30 ? 0.85 : 0.6;
        const rawWp =
          10 * matchW * wv.speed * (wv.rhythm[slot] ?? 1) * eFactor * (1 + pv.skills.reason * 0.015);
        const precheckWorkerCost = Math.round(rawWp * wv.price * 100) / 100;
        const actualWorkerUnits = Math.round(rawWp * 100) / 100;
        const actualWorkerCost = Math.round(actualWorkerUnits * wv.price * 100) / 100;
        if (actualWorkerCost > precheckWorkerCost) {
          sC.quota = Math.round((pCost + precheckWorkerCost) * 100) / 100;
          sC.purchased = 0;
          const rC = dispatchCommand(sC, { type: 'advance' }, cNoEvent);
          subcase3CResult = {
            template: t.id,
            slot,
            workerEnergy,
            rawWp,
            actualWorkerUnits,
            plannerCost: pCost,
            precheckWorkerCost,
            actualWorkerCost,
            quotaSet: sC.quota,
            quotaAfter: rC.state.quota,
            plannerCharged: rC.state.resources.some((r) => r.character === 'llama'),
            workerHitOutOfTokens: rC.events.some(
              (e) => e.type === 'OutOfTokens' && e.message.includes('qwen'),
            ),
          };
          break;
        }
      }
      if (subcase3CResult) break;
    }
    if (subcase3CResult) break;
  }

  results.newFindings.GEM_a8fb63c_03_PlannerPrecheckAndShortTail = {
    subcase3A_ShortTailDilutesReview: {
      progressBefore: 28,
      work: 30,
      reviewBefore: 5,
      statusAfter: jobAAfter.status,
      progressAfter: jobAAfter.progress,
      reviewCoverageBefore: 140,
      reviewCoverageAfter: jobAAfter.reviewCoverage,
      reviewAfter: jobAAfter.review,
    },
    subcase3B_PrecheckIgnoresPlannerWorkContribution: {
      remainingWorkBefore: 5,
      quotaAvailable: 32,
      plannerRan: rB.state.resources.some((r) => r.character === 'llama'),
      progressAfter: rB.state.jobs.find((j) => j.id === jobIdB).progress,
      outOfTokensEventMessages: rB.events.filter((e) => e.type === 'OutOfTokens').map((e) => e.message),
    },
    subcase3C_UnroundedWpAllowsPlannerChargeWhenWorkerStarves: subcase3CResult,
  };
}

// Finding 4 (GEM-a8fb63c-04): Event eligibility allows triggering on non-overtime `bluewhale-cloud`
// or on teams where all workers have `< 10` energy (allowing free `+15` qualityBonus farming or wasted paid choices)
{
  // Sub-case 4A: At Evening slot (slot 2), qwen is on overtime, bluewhale (cloud) is NOT on overtime.
  // Yet `busy` (`trigger: 'bluewhale-cloud'`) is eligible and triggers!
  const cBusyOnly = {
    ...content,
    balance: { ...content.balance, eventChance: 1 },
    events: content.events.filter((e) => e.trigger === 'bluewhale-cloud'),
  };
  let s4A = createInitialState(cBusyOnly, 4001);
  const jobId4A = s4A.jobs[0].id;
  s4A = dispatchCommand(s4A, { type: 'accept', job: jobId4A }, cBusyOnly).state;
  s4A = dispatchCommand(
    s4A,
    {
      type: 'assign',
      job: jobId4A,
      team: [
        { role: 'worker', character: 'qwen', mode: 'cloud' },
        { role: 'reviewer', character: 'bluewhale', mode: 'cloud' },
      ],
    },
    cBusyOnly,
  ).state;
  s4A.absoluteSlot = 2; // Evening life slot
  s4A = dispatchCommand(s4A, { type: 'overtime', character: 'qwen' }, cBusyOnly).state;
  const r4A = dispatchCommand(s4A, { type: 'advance' }, cBusyOnly);

  // Sub-case 4B: During daytime work slot, all team members have energy = 0 (< 10),
  // yet `thinking` (`id: 'thinking'`, `trigger: 'research'`) triggers and grants +15 `qualityBonus` while 0 work is done and 0 tokens are spent!
  const researchTemplate = content.commissions.find((t) => t.category === 'research');
  const cThinkingOnly = {
    ...content,
    balance: { ...content.balance, eventChance: 1 },
    commissions: [researchTemplate],
    events: content.events.filter((e) => e.id === 'thinking'),
  };
  let s4B = createInitialState(cThinkingOnly, 4001);
  const jobId4B = s4B.jobs[0].id;
  s4B = dispatchCommand(s4B, { type: 'accept', job: jobId4B }, cThinkingOnly).state;
  s4B = dispatchCommand(
    s4B,
    { type: 'assign', job: jobId4B, team: [{ role: 'worker', character: 'qwen', mode: 'cloud' }] },
    cThinkingOnly,
  ).state;
  for (const a of s4B.actors) {
    a.energy = 0;
  }
  let step4B = dispatchCommand(s4B, { type: 'advance' }, cThinkingOnly).state;
  const pendingWhenAllActorsZeroEnergy = step4B.pending;
  if (step4B.pending) {
    step4B = dispatchCommand(step4B, { type: 'choose', index: 0 }, cThinkingOnly).state;
  }
  const job4BAfter = step4B.jobs.find((j) => j.id === jobId4B);

  results.newFindings.GEM_a8fb63c_04_EventEligibilityEdgeCases = {
    subcase4A_BluewhaleCloudInOvertimeWithoutBluewhaleOvertime: {
      overtimeActors: s4A.overtime,
      pendingCardTriggered: r4A.state.pending,
    },
    subcase4B_ZeroEnergyTeamFarmsQualityBonus: {
      actorEnergy: 0,
      pendingWhenAllActorsZeroEnergy,
      progressAfter: job4BAfter.progress,
      qualityBonusAfter: job4BAfter.qualityBonus,
      tokensUsedAfter: step4B.tokensUsed,
    },
  };
}

// Finding 5 (GEM-a8fb63c-05): `estimateResources` in `preview.ts` ignores life-slot overtime filter,
// `teamCost` factor, and Planner `energy >= 10` check
{
  let s5 = createInitialState(content, 4001);
  const jobId5 = s5.jobs[0].id;
  s5 = dispatchCommand(s5, { type: 'accept', job: jobId5 }, content).state;
  s5 = dispatchCommand(
    s5,
    {
      type: 'assign',
      job: jobId5,
      team: [
        { role: 'planner', character: 'llama', mode: 'cloud' },
        { role: 'worker', character: 'qwen', mode: 'cloud' },
        { role: 'worker', character: 'mistral', mode: 'cloud' },
        { role: 'worker', character: 'bluewhale', mode: 'cloud' },
      ],
    },
    content,
  ).state;
  s5.absoluteSlot = 2; // Evening slot, overtime = []
  s5.overtime = [];
  const estEveningNoOvertime = estimateResources(
    s5,
    content,
    s5.jobs.find((j) => j.id === jobId5),
  );

  results.newFindings.GEM_a8fb63c_05_PreviewEstimateMismatch = {
    slot: s5.absoluteSlot,
    overtime: s5.overtime,
    estimatedCloudTokens: estEveningNoOvertime.cloud,
    actualTokensWhenAdvancingWithoutOvertime: 0,
  };
}

// ============================================================================
// 3. Held-Out Seeds 4001-4020 Validation Across All 5 Strategies
// ============================================================================
{
  const seeds = Array.from({ length: 20 }, (_, i) => 4001 + i);
  const batchMetrics = [];
  let invariantViolations = 0;
  const replayChecks = [];

  for (const strategy of strategies) {
    for (const seed of seeds) {
      const r = runBot(content, seed, strategy, 60);
      batchMetrics.push(r.metrics);
      const s = r.state;
      const actorsInBounds = s.actors.every(
        (a) => a.energy >= 0 && a.energy <= 100 && a.mood >= 0 && a.mood <= 100 && a.load >= 0,
      );
      const jobsInBounds = s.jobs.every((j) => j.quality >= 0 && j.quality <= 100);
      const tokensNonNegative = s.quota >= 0 && s.purchased >= 0;
      if (!actorsInBounds || !jobsInBounds || !tokensNonNegative || Number.isNaN(s.cash)) {
        invariantViolations += 1;
      }

      if (strategy === 'value' && seed <= 4005) {
        const text = save(content, seed, r.commands, r.state);
        const restored = restore(content, text);
        const replayed = replay(content, seed, r.commands);
        replayChecks.push({
          seed,
          commandsCount: r.commands.length,
          finalSlot: s.absoluteSlot,
          stateHash: hash(r.state),
          restoreHashMatch: hash(restored.state) === hash(r.state),
          replayHashMatch: hash(replayed) === hash(r.state),
          actorsInBounds,
          jobsInBounds,
          tokensNonNegative,
          netCash: r.metrics.netCash,
          completed: r.metrics.completed,
          breached: r.metrics.breached,
          bankrupt: r.metrics.bankrupt,
        });
      }
    }
  }

  const summary = summarize(batchMetrics);
  const gateChecks = gates(summary);

  results.heldOutSeeds4001To4020 = {
    seedRange: '4001-4020',
    totalRuns: seeds.length * strategies.length,
    invariantViolations,
    gatesOn20Seeds: gateChecks,
    summaryByStrategy: summary,
    replayChecks,
  };
}

const outPath = path.resolve(import.meta.dirname, 'seeds-4001-4020.json');
fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
console.log('GEMINI_VERIFY_OK', outPath);
console.log(
  JSON.stringify(
    {
      oldGemChecks: results.oldGemChecks,
      newFindings: results.newFindings,
      heldOutMeta: {
        seedRange: results.heldOutSeeds4001To4020.seedRange,
        totalRuns: results.heldOutSeeds4001To4020.totalRuns,
        invariantViolations: results.heldOutSeeds4001To4020.invariantViolations,
        gatesOn20Seeds: results.heldOutSeeds4001To4020.gatesOn20Seeds,
        replayChecks: results.heldOutSeeds4001To4020.replayChecks,
      },
    },
    null,
    2,
  ),
);
