import {readFileSync} from 'node:fs';
import {test, expect} from 'vitest';
import {loadFullContent} from 'oot-content';
import {createInitialState, dispatchCommand, getViewModel, chapterGoal} from 'oot-core';
import {hash, save, restore} from 'oot-persistence';

// Command-only, disposable replays generated under current rules. No saved-state
// injection, browser responses, balance overrides, or held-out balance seeds.
test.each(['build-2', 'guide-1'])('natural chapter and three-step project replay: %s', name => {
  const trace = JSON.parse(readFileSync(new URL(`./fixtures/commission-natural-${name}.json`, import.meta.url), 'utf8')) as {seed:number; commands:unknown[]; stateHash:string};
  const c = loadFullContent(), contentHash = hash(c);
  let s = createInitialState(c, trace.seed), unlocked = false, retries = 0, reloads = 0;
  const commands: unknown[] = [], delivered = new Set<number>();
  expect(s.campaign!.chapter).toBe(0);
  expect(getViewModel(s,c).projects).toEqual([]);
  expect(dispatchCommand(s,{type:'campaign',action:'project-start',id:'incubator',target:'build'},c).error).toBe('PROJECT_LOCKED');
  for (const command of trace.commands) {
    const cmd = command as {type:string; action?:string; job?:string};
    const before = s, p = getViewModel(s,c).projects[0];
    if (cmd.type === 'campaign' && cmd.action === 'chapter' && s.campaign!.chapter === 0) {
      expect(chapterGoal(s,c).ready).toBe(true);
      expect(s.campaign!.chapterZero).toBe('passed');
      expect(s.jobs.some(j=>j.status==='delivered')).toBe(true);
      unlocked = true;
    }
    const result = dispatchCommand(s,command,c);
    expect(result.error, JSON.stringify(command)).toBeNull();
    s = result.state; commands.push(command);
    if (cmd.type === 'campaign' && cmd.action === 'project-start') {
      expect(unlocked).toBe(true); expect(s.campaign!.chapter).toBe(1);
    }
    if (cmd.type === 'campaign' && cmd.action === 'project-next') {
      const after = getViewModel(s,c).projects[0]!;
      if (p!.canRetry) {
        retries++;
        expect(p!.canAdvance).toBe(false);
        expect(s.cash).toBeCloseTo(before.cash-p!.retryCost, 2);
        expect(after.step).toBe(p!.step);
        expect(after.job).not.toBe(p!.job);
        expect(after.status).toBe('posted');
        expect(after.attempts).toBe(p!.attempts+1);
        expect(after.canRetry).toBe(false);
        expect(s.jobs.find(j=>j.id===p!.job)).toEqual(before.jobs.find(j=>j.id===p!.job));
        expect(s.ledger.at(-1)).toMatchObject({reason:'project-retry:incubator',amount:-p!.retryCost});
        const duplicate = dispatchCommand(s,command,c);
        expect(duplicate.error).toBe('PROJECT_NOT_READY'); expect(duplicate.state).toBe(s);
      } else {
        expect(p!.canAdvance).toBe(true); expect(p!.status).toBe('delivered');
        expect(p!.quality).toBeGreaterThanOrEqual(p!.target!); delivered.add(p!.step);
      }
      // Save is checked against a fresh replay, then restored without real I/O.
      const restored = restore(c,save(c,trace.seed,commands,s));
      expect(hash(restored.state)).toBe(hash(s)); s = restored.state; reloads++;
    }
  }
  expect(unlocked).toBe(true); expect([...delivered]).toEqual([0,1,2]);
  expect(reloads).toBeGreaterThanOrEqual(3);
  expect(s.campaign!.projects!.incubator!.completed).toBe(true);
  expect(s.campaign!.chapter).toBe(2); expect(s.bankrupt).toBe(false);
  expect(retries).toBe(name==='build-2'?1:0);
  expect(hash(s)).toBe(trace.stateHash); expect(hash(c)).toBe(contentHash);
});
