import {test,expect} from 'vitest';
import {loadFullContent,validateContent} from 'oot-content';
import {createInitialState,dispatchCommand} from 'oot-core';
import {GameSession} from 'oot-platform';
test('opening curriculum is deterministic, declared and does not draw offers directly',()=>{
 const c=loadFullContent(),s=createInitialState(c,1);expect(s.jobs.map(j=>j.template)).toEqual(c.campaign!.openingJobs);
 let state=s;for(let i=0;i<32;i++)state=dispatchCommand(state,{type:'advance'},c).state;
 expect(state.jobs.some(j=>j.template.startsWith('website-'))).toBe(false);
 const broken=structuredClone(c);broken.commissions.find(t=>t.id==='website')!.proposals![0]!.template='missing';expect(()=>validateContent(broken)).toThrow('PROPOSAL_REFERENCE');
});
test.each(['small','phased'])('scope %s changes a clarified posted offer atomically and survives replay',async option=>{
 const c=loadFullContent(),game=new GameSession(c,1);let j=game.view.jobs.find(j=>j.template==='website')!;
 const before=await game.exportSave();expect(game.send({type:'scope',job:j.id,option}).error).toBe('SCOPE_NOT_CLARIFIED');expect(await game.exportSave()).toBe(before);
 for(let attempt=0;attempt<8&&j.hidden;attempt++){
  for(const a of game.view.actors.filter(a=>!a.busy))if(j.hidden){game.send({type:'clarify',job:j.id,character:a.id});j=game.view.jobs.find(x=>x.id===j.id)!;}
  if(j.hidden)game.send({type:'advance'});
 }
 expect(j.hidden).toBe(0);expect(game.send({type:'scope',job:j.id,option}).error).toBe('SCOPE_NOT_CLARIFIED');game.send({type:'advance'});
 expect(game.send({type:'scope',job:j.id,option}).error).toBeNull();expect(game.view.jobs.find(x=>x.id===j.id)!.work).toBe(option==='small'?22:26);
 expect(game.send({type:'scope',job:j.id,option}).error).toBe('INVALID_OPTION');
 expect(game.send({type:'accept',job:j.id}).error).toBeNull();
 const saved=await game.exportSave(),restored=new GameSession(c,1);await restored.importSave(saved);expect(restored.view).toEqual(game.view);
});
test('first companion stories are reachable and cannot award twice',()=>{
 const c=loadFullContent(),s=createInitialState(c,1);
 for(const id of c.campaign!.initial){const story=c.campaign!.stories!.find(st=>st.character===id)!;expect(story.affinity).toBe(0);const cmd={type:'campaign',action:'story',id:story.id,target:'0'};
  const r=dispatchCommand(s,cmd,c);expect(r.error).toBeNull();expect(r.state.campaign!.research).toBe(s.campaign!.research+1);expect(dispatchCommand(r.state,cmd,c).state).toBe(r.state);
 }
});
