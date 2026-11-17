import {writeFileSync} from 'node:fs';
import {loadFullContent} from 'oot-content';
import {createInitialState,dispatchCommand} from 'oot-core';
import type {Command} from 'oot-core';
import {hash} from 'oot-persistence';
// Save-queue stress input, not a profitability/playability simulation.
const c=loadFullContent(),seed=21,commands:Command[]=[];let state=createInitialState(c,seed);
function send(command:Command){const r=dispatchCommand(state,command,c);if(r.error)throw Error(r.error);commands.push(command);state=r.state;}
for(let slot=0;slot<240;slot++){
 if(state.bankrupt)send({type:'restart'});
 for(const id of ['library','canteen','workshop'])send({type:'campaign',action:'visit',id});
 send({type:'advance'});
}
const fixture={name:'seed21-60-cumulative-days',purpose:'deterministic save stress; three zero-cost visits per slot; bankruptcy restarts retained; not 60 uninterrupted profitable days',seed,cumulativeSlots:240,runs:state.runs,commands,stateHash:hash(state),contentHash:hash(c),commandsHash:hash(commands)};
const path=process.argv[2];if(!path)throw Error('OUTPUT_REQUIRED');writeFileSync(path,JSON.stringify(fixture,null,2));
console.log(JSON.stringify({name:fixture.name,commands:commands.length,runs:state.runs,commandsHash:fixture.commandsHash,stateHash:fixture.stateHash}));
