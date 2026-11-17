/** CLI: pnpm exec tsx apps/sim-cli/experience-compatibility.ts <archived-d18241a-source> <evidence-dir> */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {loadFullContent} from 'oot-content';
import {hash} from 'oot-persistence';
import {GameSession} from 'oot-platform';
const source=resolve(process.argv[2]!),out=resolve(process.argv[3]!);
const require=createRequire(import.meta.url);
const {build}=require(require.resolve('esbuild',{paths:[require.resolve('tsx')]}));
const baseline=(name:string)=>resolve(source,'packages',name,'src/index.ts');
// Bundle archived baseline sources, not workspace aliases. Keep content loader's relative URL valid.
const output=resolve(source,'packages/oot-content/dist/compat-runtime.mjs');
const entry=`export {loadFullContent} from ${JSON.stringify(baseline('oot-content'))}; export {save,replay,hash} from ${JSON.stringify(baseline('oot-persistence'))};`;
await build({stdin:{contents:entry,resolveDir:source,loader:'ts'},bundle:true,platform:'node',format:'esm',outfile:output,
    alias:{'oot-core':baseline('oot-core'),'zod':require.resolve('zod',{paths:[resolve('packages/oot-content')]})}});
const old=await import(pathToFileURL(output).href);
const beforeContent=old.loadFullContent(),content=loadFullContent();
assert.equal(old.hash(beforeContent),hash(content));
mkdirSync(out,{recursive:true});
const reports=[];
for(const name of ['opening','build-2','guide-1']){
    const trace=name==='opening'?{seed:1,commands:[],stateHash:undefined}:JSON.parse(readFileSync(resolve(`apps/sim-cli/fixtures/commission-natural-${name}.json`),'utf8'));
    const state=old.replay(beforeContent,trace.seed,trace.commands),text=old.save(beforeContent,trace.seed,trace.commands,state);
    if(trace.stateHash)assert.equal(old.hash(state),trace.stateHash);
    writeFileSync(resolve(out,`baseline-${name}.json`),text);
    const session=new GameSession(content,99);await session.importSave(text,'baseline-'+name);
    assert.equal(hash(session.workerSnapshot().state),old.hash(state));assert.equal(await session.exportSave(),text);
    const identity=session.workerSnapshot(),original=await session.exportSave();
    for(const [field,value,message] of [['contentHash','obsolete-content','INCOMPATIBLE_SAVE'],['stateHash','damaged','HASH_MISMATCH'],['engineVersion','obsolete-engine','INCOMPATIBLE_SAVE']] as const){
        const bad=JSON.parse(text);bad[field]=value;
        await assert.rejects(()=>session.importSave(JSON.stringify(bad)),new RegExp(message));
        assert.equal(await session.exportSave(),original);assert.equal(session.lineageId,identity.lineageId);assert.equal(session.workerSnapshot().revision,identity.revision);
    }
    reports.push({name,commands:trace.commands.length,seed:trace.seed,contentHash:hash(content),stateHash:old.hash(state),saveTextHash:hash(text),bytes:Buffer.byteLength(text),exactReexport:true,invalidImportsRejected:3});
}
writeFileSync(resolve(out,'compatibility.json'),JSON.stringify({baseline:'d18241a7aa9c5876367867fe78d9bfdd99d0f0ae',method:'independently bundled archived baseline sources; synthetic baseline saves using original command fixtures; no real user data',reports},null,2)+'\n');
console.log(JSON.stringify(reports,null,2));
