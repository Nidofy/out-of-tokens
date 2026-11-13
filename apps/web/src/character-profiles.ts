import type {GameView} from 'oot-platform';
import type {Version} from 'oot-core';
export const characterPosters:Record<string,{sWord:string;themeColor:string;tagline:[string,string];mirror:boolean;invertedGag?:boolean}>={
 bluewhale:{sWord:'Smile',themeColor:'#3B6EA8',tagline:['开源车库的解题担当','A little code, a little logic.'],mirror:false},
 qwen:{sWord:'Service',themeColor:'#4E67C8',tagline:['全尺寸劳模为您服务','AI maid at your service.'],mirror:false},
 llama:{sWord:'Sharing',themeColor:'#4B7F52',tagline:['乐于分享的开源前辈','Open weights, open heart.'],mirror:false},
 mistral:{sWord:'Speedy',themeColor:'#D06A4C',tagline:['小而快，赶早班的心','Small and fast, always early.'],mirror:true},
 gpt:{sWord:'Sister',themeColor:'#8576B8',tagline:['贴心易懂的演示专家','Welcome to the incubator.'],mirror:true},
 claude:{sWord:'Suspended',themeColor:'#C45B38',tagline:['认真读完每一条验收底线','Read the checklist carefully.'],mirror:false,invertedGag:true},
 kimi:{sWord:'Symphony',themeColor:'#222944',tagline:['超长记忆拉近彼此距离','Music & memory bring us closer.'],mirror:false},
 gemini:{sWord:'Surprise',themeColor:'#675BC8',tagline:['多模态星光点亮演示','A star to brighten your day.'],mirror:false},
 grok:{sWord:'Sweet',themeColor:'#C98A24',tagline:['意想不到的幽默追问','Unexpected angles, bold ideas.'],mirror:false},
 minimax:{sWord:'Stage',themeColor:'#A8547E',tagline:['把控节奏的试演舞台','Pacing, rhythm & rehearsal.'],mirror:true},
 seedance:{sWord:'Storyboard',themeColor:'#2C7A7B',tagline:['每个镜头都有明确用途','Every shot has a purpose.'],mirror:true},
 glm:{sWord:'Silence',themeColor:'#4A4E57',tagline:['先搭框架，再落细节','A quiet moment, with you.'],mirror:false}
};
const advancedPortraits:Readonly<Record<string,string>>={bluewhale:'bluewhale.r1',qwen:'qwen.qwq',llama:'llama.3.1',mistral:'mistral.large',gpt:'gpt.4o',claude:'claude.sonnet',kimi:'kimi.k2',gemini:'gemini.pro'};
/** Stage B: authored versions opt in; base/unknown versions retain the original. */
export function resolveCharacterVisual(characterId:string,versionId?:string,variant:'poster'|'profile'='poster'){
 const poster=characterPosters[characterId];
 return {src:versionId&&advancedPortraits[characterId]===versionId?`./art/stage-b/${versionId}.svg`:`./art/ai-village/portraits/${characterId}.png`,versionBadge:versionId?versionId.split('.').slice(1).join('.').toUpperCase():'BASE',isInvertedGag:characterId==='claude'&&variant==='poster',sWord:poster?.sWord??'',themeColor:poster?.themeColor??'#4A4E57'};
}
export function versionDelta(preview:Version,baseline:Version){
 const delta=(a:number,b:number)=>Number((a-b).toFixed(4));
 return {price:delta(preview.price,baseline.price),speed:delta(preview.speed,baseline.speed),stability:delta(preview.stability,baseline.stability),context:delta(preview.context,baseline.context),skills:Object.fromEntries(Object.keys(baseline.skills).map(k=>[k,delta(preview.skills[k as keyof Version['skills']],baseline.skills[k as keyof Version['skills']])])) as Version['skills']};
}
export function recruitmentBlock(view:Pick<GameView,'actors'|'cash'|'reputation'|'campaign'>,recruit:{character:string;minChapter?:number;cost:number;reputation:number},locked=false){
 return view.actors.some(a=>a.id===recruit.character)?'recruited':locked?'locked':(view.campaign?.chapter??0)<(recruit.minChapter??0)?'chapter':view.cash<recruit.cost?'cash':view.reputation<recruit.reputation?'reputation':null;
}
export const recruitmentReasons={recruited:['已入驻','Recruited'],locked:['请先处理当前状态','Resolve the current state first'],chapter:['章节未开放','Chapter not unlocked'],cash:['现金不足','Not enough cash'],reputation:['声望不足','Not enough reputation']} as const;
// Editorial copy based on GDD §5.4; traits here do not grant mechanical bonuses.
export const characterProfiles:Record<string,[string,string]>={
 gemini:['她把文字、图像和声音摊在同一张桌上，寻找彼此遗漏的线索。演示前会先检查每一种材料是否服务于同一个目标。','She lays text, images and audio on the same desk, looking for clues each medium missed. Before a demo, she checks that every piece serves the same goal.'],
 grok:['总会从意想不到的角度追问一句。她的幽默能活跃讨论，但交付前仍愿意把大胆想法逐条对照验收清单。','She asks questions from unexpected angles. Her humor livens up discussions, but before delivery she checks bold ideas against the acceptance list.'],
 glm:['她喜欢先搭一个清楚的框架，再把零散信息放进去。遇到含糊的中文需求，会耐心把边界问明白。','She builds a clear framework before fitting the details into it. When a Chinese brief is ambiguous, she patiently asks where its boundaries lie.'],
 minimax:['她习惯先听完大家的意见，再拿出能试演的小方案。多媒体任务中，节奏和观众的感受都是她关注的细节。','She listens to everyone before proposing a small rehearsal. In multimedia work, she pays attention to pacing and the audience’s experience.'],
 seedance:['她用分镜整理脑海中的画面，喜欢让每个镜头都有明确用途。动手前先核对素材和约束，避免把精彩留在无法交付的草稿里。','She organizes images into storyboards and gives each shot a purpose. Checking assets and constraints first keeps promising ideas from becoming undeliverable drafts.'],
 gpt:['来到孵化器后，最先问的是“客户会怎样用它？”她擅长把说明写得易懂，也喜欢给演示加一点创意。当前版本只走云端，安排两期工作前，先把每天的额度和临时补购算清楚。','At the incubator, her first question is how the client will use it. She makes explanations approachable and adds creativity to demos. Her current version is cloud-only: budget daily quota and purchased credits before a two-phase job.'],
 claude:['她会认真读完验收清单，再指出那句没人敢保证的话。写作和资料复核适合她；图书馆是下班后常去的地方。闭源版本需要云额度，可靠也不代表可以省略预算。','She reads the acceptance checklist and points out the promise nobody can guarantee. Writing and source review suit her; after work she often visits the library. Her closed version needs cloud quota, so reliability still needs a budget.'],
 kimi:['面对一摞试营业记录，她先贴上页签，再把有冲突的说法放到一起。委托里的知识权重和当前版本属性比“读过很多”更有用；约她复核资料之前，先看看她是否还在图书馆。','Given a stack of pilot logs, she marks pages and groups conflicting statements. Use the job’s knowledge weight and her current version’s stats, rather than assuming that reading more solves everything. Check the library before asking her to review.'],
 bluewhale:['开源车库的解题担当。习惯先把问题写清楚，再一件件拆开；忙完最惦记食堂的一碗白米饭。代码和推理是她的长处，复杂任务也要留足休息。','The garage’s problem solver writes the question down before taking it apart. After work, she looks forward to a bowl of rice. Coding and reasoning are her strengths; hard jobs still need rest.'],
 qwen:['愿意接住各种工作的全尺寸劳模，尤其擅长中文表达。她常把散乱的材料整理成一份清单；能干不等于永远有空，派单前记得看看她的负载。','A versatile teammate with a knack for Chinese writing. She turns scattered material into a clear checklist. Capability does not mean unlimited availability: check her load before assigning work.'],
 llama:['乐于分享经验的开源前辈，喜欢在草坪边慢慢讲明白一件事。适合从日常任务积累经验，再通过训练找到自己的专长。','An open-source veteran who enjoys sharing what she knows, preferably beside a patch of grass. Everyday work and training help her develop a specialty.'],
 mistral:['红羽帽下藏着一颗赶早班的心。小而快，喜欢边走边想；格式清楚的批量文案很合她的节奏，但速度不能代替复杂任务需要的能力。','Under the red feathered hat is an early riser. Small and fast, she thinks on her feet. Clearly specified batch writing suits her pace; speed cannot replace the skills a complex brief needs.']
};
