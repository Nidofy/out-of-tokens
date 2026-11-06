import { test, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContent } from 'oot-content';
import { runBot } from './src/bot.js';
import { hash } from 'oot-persistence';
test('real CLI accepts commands, reports invalid input, saves, loads and replays', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'oot-cli-'));
    const bot = runBot(loadContent(), 1, 'value', 7);
    const inputLine = (value: unknown) => {
        const c = value as {
            type: string;
            job?: string;
            character?: string;
            index?: number;
            amount?: number;
            team?: {
                character: string;
                role: string;
                mode: string;
            }[];
        };
        if (c.type === 'assign')
            return `assign ${c.job} ${c.team!.map(m => `${m.character}:${m.role}:${m.mode}`).join(' ')}`;
        if (c.type === 'clarify')
            return `clarify ${c.job} ${c.character}`;
        if (c.type === 'choose')
            return `choose ${c.index}`;
        if (c.type === 'buy')
            return `buy ${c.amount}`;
        return c.type + (c.job ? ` ${c.job}` : '');
    };
    const script = ['help', 'nonsense', ...bot.commands.map(inputLine), 'save', 'load', 'status', 'quit'].join('\n') + '\n';
    const result = spawnSync(process.execPath, [fileURLToPath(new URL('./dist/main.js', import.meta.url))], { cwd, input: script, encoding: 'utf8', timeout: 20000, maxBuffer: 8 * 1024 * 1024 });
    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout.match(/操作失败/g)).toHaveLength(1);
    expect(result.stdout).toContain('已保存');
    expect(result.stdout).toContain('权重');
    expect(result.stdout).toContain('报酬');
    expect(result.stdout).toContain('delivered');
    const saved = JSON.parse(readFileSync(join(cwd, 'saves/manual.json'), 'utf8'));
    expect(saved.commands).toHaveLength(bot.commands.length);
    const replay = spawnSync(process.execPath, [fileURLToPath(new URL('./dist/replay.js', import.meta.url)), join(cwd, 'saves/manual.json')], { cwd, encoding: 'utf8', timeout: 20000 });
    expect(replay.status, replay.stderr).toBe(0);
    expect(replay.stdout).toContain('REPLAY_OK');
});
test('real CLI accepts JSON commands and produces the same state as the engine', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'oot-json-'));
    const bot = runBot(loadContent(), 1, 'value', 3);
    const script = ['load', '{bad JSON', ...bot.commands.map(c => JSON.stringify(c)), 'save', 'load', 'quit'].join('\n') + '\n';
    const result = spawnSync(process.execPath, [fileURLToPath(new URL('./dist/main.js', import.meta.url))], { cwd, input: script, encoding: 'utf8', timeout: 20000, maxBuffer: 8 * 1024 * 1024 });
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('尚无存档');
    expect(result.stdout.match(/操作失败/g)).toHaveLength(2);
    const saved = JSON.parse(readFileSync(join(cwd, 'saves/manual.json'), 'utf8'));
    expect(saved.stateHash).toBe(hash(bot.state));
    expect(saved.commands).toEqual(bot.commands);
});
