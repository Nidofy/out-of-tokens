import { run, content, agg } from './opus-original.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
const results = {};
for (const [name, strategy, options] of [
  ['value','value',{}], ['overtime','value',{overtime:true}],
  ['overtimeAhead','value',{overtime:true,buy:'ahead'}],
  ['random','random',{}], ['randomLoan','random',{loan:true}],
]) {
  const rows=[];
  for(let seed=5001;seed<=5200;seed++) rows.push(run(content,seed,strategy,60,options).metrics);
  results[name]=agg(rows);
}
const controlled=JSON.parse(readFileSync('harness/review-experiments.json','utf8'));
results.bestCharacters=[...new Set(controlled.templates.flatMap(t=>t.best.team.map(m=>m.character)))];
results.qwenBestTemplates=controlled.templates.filter(t=>t.best.team.some(m=>m.character==='qwen')).length;
writeFileSync('harness/review-integration/opus-baseline.json',JSON.stringify(results,null,2)+'\n');
console.log(JSON.stringify(results,null,2));
