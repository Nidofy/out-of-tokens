import {test,expect} from 'vitest';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadContent} from 'oot-content';
import {runBot} from './src/bot.js';
test('real CLI accepts commands, reports invalid input, saves, loads and replays',()=>{
 const cwd=mkdtempSync(join(tmpdir(),'oot-cli-'));
 const bot=runBot(loadContent(),1,'value',7);
 const script=['help','nonsense',...bot.commands.map(c=>JSON.stringify(c)),'save','load','quit'].join('\n')+'\n';
 const result=spawnSync(process.execPath,[fileURLToPath(new URL('./dist/main.js',import.meta.url))],{cwd,input:script,encoding:'utf8',timeout:20000,maxBuffer:8*1024*1024});
 expect(result.error).toBeUndefined();expect(result.status,result.stderr).toBe(0);
 expect(result.stdout.match(/操作失败/g)).toHaveLength(1);expect(result.stdout).toContain('已保存');
 const saved=JSON.parse(readFileSync(join(cwd,'saves/manual.json'),'utf8'));expect(saved.commands).toHaveLength(bot.commands.length);
 const replay=spawnSync(process.execPath,[fileURLToPath(new URL('./dist/replay.js',import.meta.url)),join(cwd,'saves/manual.json')],{cwd,encoding:'utf8',timeout:20000});
 expect(replay.status,replay.stderr).toBe(0);expect(replay.stdout).toContain('REPLAY_OK');
});
