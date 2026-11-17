import {writeFileSync} from 'node:fs';
import {loadFullContent} from 'oot-content';
import {GameSession} from 'oot-platform';
import {suggestAssignmentsFromSnapshot} from 'oot-platform/worker';
import {hash} from 'oot-persistence';
const c=loadFullContent(),initial=new GameSession(c,1).workerSnapshot(),wide=structuredClone(initial);
for(const v of c.versions)if(!wide.state.actors.some(a=>a.id===v.character)){
 wide.state.actors.push({id:v.character,version:v.id,energy:100,mood:70,load:0,busyUntil:0});
 wide.state.campaign!.relations[v.character]={...wide.state.campaign!.relations.qwen!,bonuses:{},stories:[],training:null};
}
const results=[];
for(const [name,snapshot] of [['opening',initial],['controlled-full-roster',wide]] as const){
 const times:number[]=[],copies:number[]=[];let evaluated=0,truncated=false,resultHash='';
 for(let i=-5;i<30;i++){let t=performance.now();const captured=structuredClone(snapshot);const copy=performance.now()-t;t=performance.now();const r=suggestAssignmentsFromSnapshot(c,captured,'0-0',{team:[],draftKey:'fixed'});const ms=performance.now()-t;evaluated=r.evaluated;truncated=r.truncated;const digest=hash(r);if(resultHash&&digest!==resultHash)throw Error('NONDETERMINISTIC_SEARCH');resultHash=digest;if(i>=0){times.push(ms);copies.push(copy);}}
 const sorted=[...times].sort((a,b)=>a-b);results.push({name,stateHash:hash(snapshot.state),evaluated,truncated,resultHash,times,copies,p50:sorted[14],p95:sorted[28],max:sorted[29]});
}
const output=process.argv[2];if(!output)throw Error('OUTPUT_REQUIRED');writeFileSync(output,JSON.stringify({scope:'Node CPU diagnostic; browser transfer/Worker host not measured',contentHash:hash(c),warmups:5,samples:30,results},null,2));console.log(JSON.stringify(results.map(({name,evaluated,p95,max})=>({name,evaluated,p95,max})),null,2));
