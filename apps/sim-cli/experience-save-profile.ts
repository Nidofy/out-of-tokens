import { readFileSync, writeFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { loadFullContent } from 'oot-content';
import { replay, hash, save } from 'oot-persistence';
import { hashBrowser } from 'oot-persistence/browser';
import { defaultSaveEncoder } from 'oot-platform';
const c=loadFullContent();
const inputs=['build-2','guide-1'].map(name=>({name,...JSON.parse(readFileSync(`apps/sim-cli/fixtures/commission-natural-${name}.json`,'utf8')) as {seed:number;commands:unknown[];stateHash:string}}));
// Planned runBot/full-content 60-day input failed because the legacy bot assumes all roster actors exist.
// Retain that failure; measure only the two already frozen inputs, without substituting a favorable log.
const output=process.argv[2];if(!output)throw Error('OUTPUT_DIRECTORY_REQUIRED');
writeFileSync(output+'/inputs.json',JSON.stringify(inputs));
const results=[];
for(const input of inputs){
 const state=replay(c,input.seed,input.commands),canonical=save(c,input.seed,input.commands,state);
 if(hash(state)!==input.stateHash)throw Error('TRACE_MISMATCH');
 const samples=[];
 for(let i=-5;i<30;i++){
  let t=performance.now();const captured=structuredClone({content:c,seed:input.seed,commands:input.commands,state});const copyMs=performance.now()-t;
  t=performance.now();replay(c,input.seed,input.commands);const replayMs=performance.now()-t;
  t=performance.now();await hashBrowser(state);const stateHashMs=performance.now()-t;
  t=performance.now();await hashBrowser(c);const contentHashMs=performance.now()-t;
  t=performance.now();const text=await defaultSaveEncoder.encode(captured);const canonicalTotalMs=performance.now()-t;
  if(text!==canonical)throw Error('ENCODER_BYTES_MISMATCH');
  if(i>=0)samples.push({copyMs,replayMs,stateHashMs,contentHashMs,canonicalTotalMs});
 }
 const summary=Object.fromEntries(Object.keys(samples[0]!).map(key=>{const values=samples.map(s=>s[key as keyof typeof s]).sort((a,b)=>a-b);return [key,{p50:values[14],p95:values[28],max:values[29]}];}));
 results.push({name:input.name,steps:input.commands.length,inputHash:hash(input.commands),stateHash:input.stateHash,samples,summary});
}
writeFileSync(output+'/node-save-profile.json',JSON.stringify({device:cpus()[0]?.model,node:process.version,platform:process.platform,contentHash:hash(c),warmups:5,samples:30,scope:'Node CPU diagnostic only; browser main-thread/I-O/queue/Worker transfer unmeasured; not performance acceptance',results},null,2));
console.log(JSON.stringify(results.map(({name,steps,summary})=>({name,steps,summary})),null,2));
