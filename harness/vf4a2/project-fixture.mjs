import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {writeFileSync} from 'node:fs';
const require=createRequire(resolve('apps/sim-cli/package.json'));
const {loadFullContent}=await import(pathToFileURL(require.resolve('oot-content')).href);
const {labSession}=await import(pathToFileURL(resolve('apps/web/src/office-lab.ts')).href);
const session=labSession(loadFullContent(),'delivery'),steps=[];
const send=command=>{const result=session.send(command);steps.push({command,error:result.error});if(result.error)throw Error(result.error);};
while(session.view.absoluteSlot<80&&!session.view.chapterGoal.ready){
 const v=session.view,j=v.jobs.find(j=>j.template==='menu'&&j.status==='posted');
 if(j&&v.absoluteSlot%4<2&&!v.actors.find(a=>a.id==='qwen').busy){send({type:'accept',job:j.id});send({type:'assign',job:j.id,team:[{character:'qwen',role:'worker',mode:'cloud'},{character:'llama',role:'reviewer',mode:'cloud'}]});}
 send({type:'advance'});
 for(const done of session.view.jobs.filter(j=>j.status==='review'))send({type:'deliver',job:done.id});
}
writeFileSync('harness/vf4a2/project-fixture-before-chapter.json',JSON.stringify({cash:session.view.cash,liquidCash:session.view.liquidCash,goal:session.view.chapterGoal,campaign:session.view.campaign,steps},null,2)+'\n');
send({type:'campaign',action:'chapter',id:'next'});
writeFileSync('harness/vf4a2/project-chapter1-save.json',await session.exportSave());
writeFileSync('harness/vf4a2/project-fixture-proof.json',JSON.stringify({scenario:'delivery',chapter:session.view.campaign.chapter,cash:session.view.cash,projects:session.view.projects.map(p=>({id:p.id,title:p.title,routes:p.routes.map(r=>r.id)})),steps},null,2)+'\n');
console.log({chapter:session.view.campaign.chapter,projects:session.view.projects.length,cash:session.view.cash});
