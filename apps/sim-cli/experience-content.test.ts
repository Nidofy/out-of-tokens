import {test, expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {loadFullContent} from 'oot-content';
import {validateExperiencePresentation} from 'oot-content/presentation';
import {GameSession} from 'oot-platform';
import type {ExperienceView, DuoExplanation} from 'oot-platform';
import type {Command} from 'oot-core';
import {hash} from 'oot-persistence';
import raw from '../../content/presentation/experience-v1.json';
import {experienceReceiptCopy, experienceDuoCopy} from '../web/src/experience-copy.js';
const content = loadFullContent();
const fresh = () => structuredClone(raw);
type Receipt = ExperienceView['receipts'][number];
const receipt = (reason = 'delivery-passed'): Receipt => ({jobId: '0-0', phase: 0, occurrence: 0,
    participants: ['bluewhale', 'qwen'], facts: [
        {certainty: 'certain', reason, jobId: '0-0'},
        {certainty: 'certain', reason: 'contributed-worker', jobId: '0-0', actorId: 'bluewhale'},
        {certainty: 'certain', reason: 'contributed-reviewer', jobId: '0-0', actorId: 'qwen'},
    ]});
const job = {id: '0-0', template: 'menu'};

test('presentation has 18 bilingual outcomes and two complete three-stage chains; domain and save unchanged', async () => {
    const session = new GameSession(content, 1), before = await session.exportSave(), fingerprint = hash(content);
    const data = validateExperiencePresentation(raw, content);
    expect(data.receipts).toHaveLength(18);
    for (const scene of new Set(data.receipts.map(r => r.scene))) {
        expect(data.receipts.filter(r => r.scene === scene).map(r => r.outcome).sort()).toEqual(['failed', 'passed', 'rework']);
    }
    expect(data.duos.map(d => d.id).sort()).toEqual(['bluewhale-qwen', 'mistral-llama']);
    expect(data.duos.every(d => d.stages.length === 3 && d.stages.every(s => s.lines.length === 2))).toBe(true);
    expect(hash(content)).toBe(fingerprint); expect(content).not.toHaveProperty('presentation');
    expect(await session.exportSave()).toBe(before);
    data.receipts[0]!.zh = 'detached'; expect(validateExperiencePresentation(raw).receipts[0]!.zh).not.toBe('detached');
});

test('strict validation rejects accidental rewards, missing translations, ambiguous mappings and invalid references', () => {
    expect(() => validateExperiencePresentation({...raw, reward: 100})).toThrow();
    let data = fresh(); data.receipts[0]!.en = ' '; expect(() => validateExperiencePresentation(data)).toThrow();
    data = fresh(); data.receipts[1]!.id = data.receipts[0]!.id; expect(() => validateExperiencePresentation(data)).toThrow('DUPLICATE_RECEIPT');
    data = fresh(); data.receipts[1]!.outcome = 'passed'; expect(() => validateExperiencePresentation(data)).toThrow('DUPLICATE_SCENE_OUTCOME');
    data = fresh(); data.duos[0]!.stages[0]!.lines[0]!.speaker = 'invented'; expect(() => validateExperiencePresentation(data)).toThrow('UNKNOWN_SPEAKER');
    data = fresh(); data.duos[0]!.actors[0] = 'invented'; data.duos[0]!.stages.forEach(s => {s.lines.find(l => l.speaker === 'bluewhale')!.speaker = 'invented';});
    expect(() => validateExperiencePresentation(data, content)).toThrow('UNKNOWN_PRESENTATION_DUO');
    data = fresh(); data.receipts.filter(r => r.scene === 'tea-menu').forEach(r => {r.templates = ['absent'];});
    expect(() => validateExperiencePresentation(data, content)).toThrow('UNKNOWN_PRESENTATION_TEMPLATE');
    data = fresh(); data.receipts.filter(r => r.scene === 'cafe-sign').forEach(r => {r.templates = ['menu'];});
    expect(() => validateExperiencePresentation(data)).toThrow('AMBIGUOUS_TEMPLATE');
    data = fresh(); data.contribution.en = '{secret}'; expect(() => validateExperiencePresentation(data)).toThrow('INVALID_CONTRIBUTION_TOKENS');
});

test('receipts require a unique certain outcome and independently proven participants and review', () => {
    expect(experienceReceiptCopy(undefined, job)).toMatchObject({...raw.neutral, participants: [], review: null});
    expect(experienceReceiptCopy(receipt(), {...job, id: 'other'}).zh).toBe(raw.neutral.zh);
    const r = receipt(); r.participants.push('invented');
    expect(experienceReceiptCopy(r, job)).toMatchObject({participants: ['bluewhale', 'qwen'], review: raw.reviewed});
    r.facts[2]!.jobId = 'other';
    expect(experienceReceiptCopy(r, job)).toMatchObject({participants: ['bluewhale'], review: null});
    r.facts.push({certainty: 'conditional', conditions: ['no-event-interference'], reason: 'contributed-reviewer', actorId: 'qwen', jobId: job.id});
    expect(experienceReceiptCopy(r, job).review).toBeNull();
    r.facts.push({certainty: 'certain', reason: 'delivery-failed', jobId: job.id});
    expect(experienceReceiptCopy(r, job).zh).toBe(raw.neutral.zh);
    for (const outcome of ['passed', 'rework', 'failed']) {
        const copy = experienceReceiptCopy(receipt('delivery-' + outcome), {...job, template: 'unknown'});
        expect(copy.zh).toBe(raw.receipts.find(r => r.scene === 'workshop' && r.outcome === outcome)!.zh);
    }
});

test('joint-delivery dialogue uses actual contribution roles and known job subject, never current team or failures', () => {
    const session = new GameSession(content, 1), view = session.getExperienceView();
    const duo = session.view.living.duos.find(d => d.id === 'bluewhale-qwen')!;
    view.receipts = [receipt()];
    const result = experienceDuoCopy('first-shared-delivery', duo, view, {jobs: [job]});
    expect(result.lines).toHaveLength(2);
    expect(result.lines.find(l => l.speaker === 'bluewhale')!.zh).toContain('菜单交付，我参与了制作');
    expect(result.lines.find(l => l.speaker === 'qwen')!.en).toContain('menu delivery, I contributed review');
    expect(experienceDuoCopy('first-shared-delivery', duo, view).lines).toEqual([]);
    view.receipts = [receipt('delivery-failed')];
    expect(experienceDuoCopy('first-shared-delivery', duo, view, {jobs: [job]}).lines).toEqual([]);
    view.receipts = [receipt()]; view.receipts[0]!.facts.pop();
    expect(experienceDuoCopy('first-shared-delivery', duo, view, {jobs: [job]}).lines).toEqual([]);
});

test('tea availability uses core eligibility and benefit dialogue rejects stale identity/job/draft', () => {
    const session = new GameSession(content, 1), view = session.getExperienceView();
    const duo = session.view.living.duos.find(d => d.id === 'bluewhale-qwen')!;
    expect(experienceDuoCopy('tea-ready', duo, view).lines).toEqual([]);
    expect(experienceDuoCopy('tea-ready', {...duo, canUnlock: true}, view).lines).toHaveLength(2);
    const explanation: DuoExplanation = {...view, jobId: job.id, draftKey: 'draft', duos: [{duoId: duo.id, state: 'active', reason: 'active'}]};
    const unlocked = {...duo, unlocked: true}, context = {explanation, jobId: job.id, draftKey: 'draft'};
    expect(experienceDuoCopy('unlocked-benefit', unlocked, view, context).lines).toHaveLength(2);
    for (const patch of [{revision: view.revision + 1}, {lineageId: 'old'}, {contentVersion: 'old'}, {jobId: 'other'}, {draftKey: 'old'}]) {
        expect(experienceDuoCopy('unlocked-benefit', unlocked, view, {...context, explanation: {...explanation, ...patch}}).fallback).toEqual(raw.neutral);
    }
    expect(experienceDuoCopy('unlocked-benefit', unlocked, view, {...context, jobId: undefined}).lines).toEqual([]);
    explanation.duos[0]!.state = 'inactive';
    expect(experienceDuoCopy('unlocked-benefit', unlocked, view, context).fallback).toEqual(raw.duoInactive);
    expect(experienceDuoCopy('unlocked-benefit', duo, view, context).fallback).toEqual(raw.neutral);
});

test.each(['build-2', 'guide-1'])('real %s receipts retain copy and canonical bytes after import reconstruction', async name => {
    const trace = JSON.parse(readFileSync(new URL(`./fixtures/commission-natural-${name}.json`, import.meta.url), 'utf8')) as {seed: number; commands: Command[]};
    const session = new GameSession(content, trace.seed);
    for (const command of trace.commands) expect(session.send(command).error).toBeNull();
    const before = await session.exportSave();
    const select = (s: GameSession) => s.getExperienceView().receipts.map(r => experienceReceiptCopy(r, s.view.jobs.find(j => j.id === r.jobId)));
    const copies = select(session); expect(copies.length).toBeGreaterThan(0); expect(copies.some(c => c.review !== null)).toBe(true);
    const restored = new GameSession(content, 99); await restored.importSave(before, session.lineageId);
    expect(select(restored)).toEqual(copies); expect(await restored.exportSave()).toBe(before);
}, 15000);
