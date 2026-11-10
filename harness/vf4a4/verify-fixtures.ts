import {a4Session} from './fixtures.ts';
import {content} from '../../apps/web/src/content.ts';
import {writeFileSync} from 'node:fs';
const result=[];
for(const scenario of ['a4-project','a4-rework','a4-breached','a4-night','a4-clarified','a4-scope','a4-no-posted']){const s=a4Session(content,scenario);result.push({scenario,slot:s.view.absoluteSlot,chapter:s.view.campaign.chapter,jobs:s.view.jobs.map(j=>({id:j.id,template:j.template,status:j.status,hidden:j.hidden,clarifyingUntil:j.clarifyingUntil,canRework:j.settlement.canRework})),save:JSON.parse(await s.exportSave())});}
writeFileSync('harness/vf4a4/fixture-proof.json',JSON.stringify(result,null,2));console.log(result.map(r=>({scenario:r.scenario,slot:r.slot,chapter:r.chapter,status:r.jobs.map(j=>j.status)})));
