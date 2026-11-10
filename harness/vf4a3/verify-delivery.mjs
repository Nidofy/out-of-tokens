import {readFileSync,writeFileSync,readdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const dir='harness/vf4a3/',read=f=>JSON.parse(readFileSync(dir+f,'utf8')),git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const allowed=['apps/web/src/alpha-app.tsx','apps/web/src/vf1.css','apps/sim-cli/vf2.test.ts','docs/STATUS.md','docs/VF4_CHECKPOINT.md'];
const changed=[...git('diff','9ad47c7b67b82cf86e9922f02f7cc398ec5b73bc','--name-only').split('\n'),...git('ls-files','--others','--exclude-standard').split('\n')].filter(Boolean);
const outside=changed.filter(p=>!allowed.includes(p)&&!p.startsWith(dir)&&!p.startsWith('harness/reviews/'));
const protectedPaths=['packages','pnpm-lock.yaml','apps/web/public','apps/web/src/commission-workbench.tsx','apps/web/src/dialog.tsx','apps/web/src/scene.ts','apps/web/src/office-scene.ts','apps/web/src/village-characters.ts','apps/web/src/art/paper-doll.ts','apps/web/src/scene-navigation.ts','apps/web/src/main.tsx','apps/web/src/vf-metrics.ts'];
const protectedDiff=git('diff','d3e0c87','--name-only','--',...protectedPaths),longProtectedDiff=git('diff','2bd6d40','--name-only','--','packages','pnpm-lock.yaml','apps/web/public/art/ai-village');
const freezeChanges=read('source-freeze.json').files.filter(f=>{const b=readFileSync(f.path),hash=x=>createHash('sha256').update(x).digest('hex');return hash(b)!==f.sha256||hash(b.toString().replaceAll('\r\n','\n'))!==f.lfSha256;}).map(f=>f.path);
const rows=read('interaction-results.json'),resolvedFailure='390-claude-recruited-in-place';
const errors=rows.filter(r=>!r.bodyMetrics||!r.bodyRect||r.bodyMetrics.scrollWidth>r.bodyMetrics.clientWidth||r.shortControls.length||(r.focusInDialog===false&&r.label!==resolvedFailure)).map(r=>r.label);
const summary=read('startup-summary.json'),samples=read('startup-balanced.json');
const finalRows=rows.filter(r=>r.label.startsWith('A31-final-'));
const a31Checks={
 finalMatrix:finalRows.length===12&&[1280,844,560,390].every(w=>['jump-focus','single-Escape','claude-visible'].every(name=>finalRows.some(r=>r.label===`A31-final-${w}-${name}`&&Object.values(r.assertions).every(x=>x===true)))),
 actualJumpFocus:finalRows.filter(r=>r.label.endsWith('jump-focus')).every(r=>r.focusInDrawer&&!r.focus.startsWith('<body')),
 singleEscapeRestoresDock:finalRows.filter(r=>r.label.endsWith('single-Escape')).every(r=>!r.drawerOpen&&r.focusDockIndex===2),
 performanceEvidenceUnchanged:!git('diff','9ad47c7','--name-only','--',dir+'startup-*'),
 onlyFocusAndCss:!git('diff','9ad47c7','--name-only','--','apps','packages','pnpm-lock.yaml').split('\n').filter(Boolean).some(p=>!['apps/web/src/alpha-app.tsx','apps/web/src/vf1.css'].includes(p)),
};
const diagnostics=readdirSync('apps/web/dist/assets').filter(f=>f.endsWith('.js')&&/vf-metrics|vf-startup|vf-attribution|vf4a2-locked/.test(readFileSync('apps/web/dist/assets/'+f,'utf8')));
const cacheErrors=readdirSync(dir).filter(f=>f.endsWith('.log')&&/EPERM/.test(readFileSync(dir+f,'utf8')));
const checks={whitelist:!outside.length,protectedEmpty:!protectedDiff,longProtectedEmpty:!longProtectedDiff,sourceFrozen:!freezeChanges.length,interactionChecks:!errors.length,recruitFocusFixed:rows.some(r=>r.label==='390-claude-recruited-focus-fixed'&&r.focusInDialog),equalN6:summary.primary.every(g=>Object.values(g.samples).every(a=>a.length===6)),formal72:samples.length===72,environment:samples.every(r=>r.raf.p50<=25&&r.visibility==='visible'&&r.viewport[0]===1280&&r.viewport[1]===720),noConfirmationRequired:!summary.confirmationRequired&&!existsSync(dir+'startup-confirmation.json'),productionNoProbe:!diagnostics.length,noCacheErrors:!cacheErrors.length,cacheRemoved:!existsSync(dir+'.vite-cache'),portsClosed:read('cleanup.json').listeners.length===0,browserRestored:read('browser-cleanup.json').viewportReset&&read('browser-cleanup.json').testTabClosed};
Object.assign(checks,a31Checks);
const result={at:new Date().toISOString(),checkpoint:'VF4-A3.1',checks,counts:{interactions:rows.length,a31:rows.filter(r=>r.checkpoint==='VF4-A3.1').length,finalMatrix:finalRows.length,formal:samples.length,warmup:read('startup-warmup-excluded.json').length},outside,protectedDiff,longProtectedDiff,freezeChanges,errors,diagnostics,cacheErrors,resolvedFailure,historicalDrawerFocus:'A3 Studio-to-Actors records containing body focus were incorrectly accepted by the old verifier. Retained as historical evidence; superseded by A31-final jump-focus and single-Escape assertions.',performance:summary};
writeFileSync(dir+'delivery-verification.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({checks,counts:result.counts},null,2));if(Object.values(checks).some(x=>!x))process.exitCode=1;
