import {readFileSync} from 'node:fs';
import {loadContent} from 'oot-content';
import {restore,hash} from 'oot-persistence';
try {const r=restore(loadContent(),readFileSync(process.argv[2]??'saves/manual.json','utf8'));console.log(`REPLAY_OK ${hash(r.state)} slot=${r.state.absoluteSlot}`);}catch(e){console.error(e);process.exitCode=1;}
