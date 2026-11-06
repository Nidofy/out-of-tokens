import {createInterface} from 'node:readline';
import {mkdir,readFile,rename,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {createInitialState,dispatchCommand,getViewModel} from 'oot-core';
import {loadContent} from 'oot-content';
import {save,restore} from 'oot-persistence';
const content=loadContent();let state=createInitialState(content,1);let commands:unknown[]=[];
const path=resolve('saves/manual.json');
console.log('Out of Tokens — 输入 help 查看命令；游戏内Token不消耗真实API额度。');
const show=()=>console.log(JSON.stringify(getViewModel(state,content),null,2));
show();
const rl=createInterface({input:process.stdin,output:process.stdout,terminal:process.stdin.isTTY??false});
for await(const line of rl){
 try{
  const [action,...args]=line.trim().split(/\s+/);
  if(!action)continue;
  if(action==='quit'){rl.close();break;}
  if(action==='help'){console.log('status | advance | accept/reject/deliver/rework JOB | clarify JOB ACTOR | assign JOB ACTOR:worker:cloud ACTOR:reviewer:local | choose INDEX(从0开始) | buy T | save | load | quit\n也支持Command JSON。澄清占用角色当前时段。');continue;}
  if(action==='status'){show();continue;}
  if(action==='save'){await mkdir(dirname(path),{recursive:true});await writeFile(path+'.tmp',save(content,state.seed,commands,state),'utf8');await rename(path+'.tmp',path);console.log(`已保存 ${path}`);continue;}
  if(action==='load'){const restored=restore(content,await readFile(path,'utf8'));state=restored.state;commands=restored.commands;show();continue;}
  let command:unknown;
  if(line.trim().startsWith('{'))command=JSON.parse(line);
  else if(action==='assign')command={type:action,job:args[0],team:args.slice(1).map(x=>{const [character,role='worker',mode='cloud']=x.split(':');return {character,role,mode};})};
  else if(action==='choose')command={type:action,index:Number(args[0])};
  else if(action==='buy')command={type:action,amount:Number(args[0])};
  else command={type:action,job:args[0],character:args[1]};
  const result=dispatchCommand(state,command,content);
  if(result.error)console.log(`操作失败: ${result.error}`);else {state=result.state;commands.push(command);for(const event of result.events)console.log(event.message);show();}
 }catch(e){console.log(`操作失败: ${e instanceof Error?e.message:String(e)}`);}
}
