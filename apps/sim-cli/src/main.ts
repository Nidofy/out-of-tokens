import { createInterface } from 'node:readline';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { createInitialState, dispatchCommand } from 'oot-core';
import { render, parseLine, help, explain } from './console.js';
import { loadContent } from 'oot-content';
import { save, restore } from 'oot-persistence';
const content = loadContent();
let state = createInitialState(content, 1);
let commands: unknown[] = [];
const path = resolve('saves/manual.json');
console.log('Out of Tokens — 输入 help 查看命令；游戏内Token不消耗真实API额度。');
const show = () => console.log(render(state, content));
show();
const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY ?? false });
for await (const line of rl) {
    try {
        const [action] = line.trim().split(/\s+/);
        if (!action)
            continue;
        if (action === 'quit') {
            rl.close();
            break;
        }
        if (action === 'help') {
            console.log(help);
            continue;
        }
        if (action === 'status') {
            show();
            continue;
        }
        if (action === 'save') {
            await mkdir(dirname(path), { recursive: true });
            await writeFile(path + '.tmp', save(content, state.seed, commands, state), 'utf8');
            await rename(path + '.tmp', path);
            console.log(`已保存 ${path}`);
            continue;
        }
        if (action === 'load') {
            const restored = restore(content, await readFile(path, 'utf8'));
            state = restored.state;
            commands = restored.commands;
            show();
            continue;
        }
        const command = parseLine(line);
        const result = dispatchCommand(state, command, content);
        if (result.error)
            console.log(`操作失败: ${explain(result.error)}`);
        else {
            state = result.state;
            commands.push(command);
            for (const event of result.events)
                console.log(event.message);
            show();
        }
    }
    catch (e) {
        console.log(`操作失败: ${explain(e instanceof Error ? e.message : String(e))}`);
    }
}
