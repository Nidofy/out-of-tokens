import{FileSaves}from'./src/store.ts';
import{loadFullContent}from'oot-content';
import{createInitialState}from'oot-core';
import{save}from'oot-persistence';
const c=loadFullContent(),s=await FileSaves.open(process.env.OOT_TEST_PROFILE,c);
try{await s.write('auto',save(c,11,[],createInitialState(c,11)),0);console.log('won');}
catch(e){if(e.message!=='SAVE_CONFLICT')throw e;console.log('conflict');}
finally{await s.close();}
