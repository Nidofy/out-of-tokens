// Deterministic authored Alpha catalog. No network, generated prose, or runtime LLM.
import {readFileSync,writeFileSync} from 'node:fs';
const read=p=>JSON.parse(readFileSync(p,'utf8')),write=(p,v)=>writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const versions=read('content/campaign/versions-m1.json');
for(const [character,name,skills,speed,price,stability,context,open,rhythm] of [
 ['grok','Grok 2',[6,6,6,8,5,8],1.1,10,5,7,false,[.8,1,1.2,1.2]],
 ['glm','GLM 4',[8,6,7,5,4,6],1,7,8,7,true,[1.2,1.2,1.2,1]],
 ['minimax','MiniMax abab',[4,7,5,8,9,5],1,9,6,6,false,[.8,1,1.2,1.2]],
 ['seedance','Seedance 1.0',[2,3,4,8,10,3],1,10,6,5,false,[1,1.2,1.2,.8]]
])versions.push({id:character+'.base',character,name,skills:Object.fromEntries(['code','write','reason','create','media','recall'].map((k,i)=>[k,skills[i]])),speed,price,stability,context,modes:open?['cloud','local']:['cloud'],rhythm});
write('content/campaign/versions-m2.json',versions);
const m=read('content/campaign/m1.json');m.maxChapter=2;m.maxHardware=5;
m.recruits.push(...['grok','glm','minimax','seedance'].map((character,i)=>({character,cost:850+i*150,reputation:10+i*3})));
for(const [id,name,nameEn,cost,research,requires] of [
 ['ci','持续交付','Continuous delivery',750,6,['autotest']],['management','项目管理','Project management',700,7,['explain']],['multiagent','多智能体协同','Multi-agent teams',1400,12,['management']],['versioncontrol','版本控制','Version control',450,4,['sandbox']],['messenger','精准找人','Messenger',250,3,[]],['remote','远程召回','Remote recall',650,6,['messenger']],['crm','客户关系','CRM',800,6,['management']],['analyst','需求分析器','Requirement analyst',750,8,['search']],['contract','合同模板','Contract templates',650,6,['crm']],['filter','输入过滤','Input filter',500,5,['sandbox']],['monitor','监控告警','Monitoring',700,7,['autotest']],['mcp','MCP插件市场','MCP marketplace',1200,10,['multiagent']],['tokenbank','Token银行','Token bank',900,8,['management']]
])m.software.push({id,name,nameEn,cost,research,requires});
const arcs={
 bluewhale:[['食堂的最后一份包子','The last bun in the canteen'],['小模型也能认真干活','A small model can do good work'],['第一次服务器繁忙','The first server-busy day'],['不想只被叫便宜替代','More than a cheap substitute'],['给新伙伴留一个座位','Leave a seat for a newcomer']],
 qwen:[['整齐的双语便签','Neatly written bilingual notes'],['为什么每单都叫我','Why am I on every job'],['茶凉了，代码还热','Cold tea, warm code'],['学会说今天到这里','Learning to call it a day'],['把经验写给下一位','Notes for the next teammate']],
 llama:[['一张回家的明信片','A postcard home'],['小步快跑也有价值','Small quick steps matter'],['独自交付的第一次','A first solo delivery'],['我不是空闲替补','I am more than a spare'],['开源社区的野餐','An open-source picnic']],
 mistral:[['帽子被风吹走了','A hat carried by the wind'],['快不等于粗心','Fast need not mean careless'],['短委托里的长耐心','Patience in short jobs'],['给慢伙伴等一分钟','Wait a minute for a slower friend'],['顺风也记得回头','Look back even with a tailwind']],
 gpt:[['自我介绍有点长','A rather long introduction'],['不是每句都要称赞','Not every sentence needs praise'],['客户真正想说什么','What the client meant'],['昂贵的版本也会困惑','An expensive version can be confused'],['一次恰到好处的沉默','A well-timed silence']],
 claude:[['图书馆里折好的书角','A folded corner in a library book'],['拒绝之前先解释','Explain before refusing'],['测试之外还有用户','Users beyond the tests'],['认真也需要休息','Diligence needs rest'],['写一封不必完美的信','A letter that need not be perfect']],
 kimi:[['月光下的长笔记','Long notes in moonlight'],['记得太多忘了吃饭','Remembering everything but lunch'],['引用背后的人','The person behind the citation'],['长上下文里的短约定','A short promise in a long context'],['帮朋友记住好日子','Remember a good day for a friend']],
 gemini:[['把窗外的光画下来','Drawing the light outside'],['漂亮图表也要校验','Pretty charts need checking'],['不同模态的误会','A multimodal misunderstanding'],['版本更新前的紧张','Nerves before a version update'],['一张全员合影','A team portrait']],
 grok:[['一个笑话的分寸','The limits of a joke'],['吐槽之后怎么帮忙','Helping after the joke'],['不抢最后一句话','Not taking the last word'],['给客户认真道歉','A sincere apology to a client'],['把锋芒变成灯光','Turning sharpness into light']],
 glm:[['机房里睡着的人','Asleep in the server room'],['可靠不等于不累','Reliable does not mean tireless'],['一个被遗漏的边界','An overlooked boundary'],['请别人检查我的代码','Asking for a code review'],['准时关灯回家','Turning off the lights on time']],
 minimax:[['哼到一半的旋律','A half-hummed melody'],['声音也有留白','Silence belongs in sound'],['多媒体里的一句文字','A sentence inside multimedia'],['没有掌声的练习','Practice without applause'],['把大家的声音剪在一起','Editing the team voices together']],
 seedance:[['第一段循环动画','The first looping animation'],['镜头之外的故事','A story outside the frame'],['慢动作不是偷懒','Slow motion is not laziness'],['允许一个镜头不完美','Letting one shot be imperfect'],['属于工作室的片尾','End credits for the studio']]
};
m.stories=[];
for(const [character,stories] of Object.entries(arcs))stories.forEach(([title,titleEn],i)=>m.stories.push({id:`${character}-bond-${i+1}`,character,affinity:[10,25,45,65,85][i],text:`${title}。${character}放下手里的工作，想和你聊聊。今天更需要被倾听，还是把心得写给团队？`,textEn:`${title}. ${character} puts work aside to talk. Would listening help more today, or should the team share what they learned?`,choices:[{label:'先听你说，不赶时间',labelEn:'I am listening. Take your time.',affinity:5,mood:5,research:0},{label:'一起整理给团队的笔记',labelEn:'Write notes for the team together.',affinity:2,mood:-2,research:2}]}));
write('content/campaign/m2.json',m);
const commissions=read('content/commissions/initial.json');
const descriptions={expert:'Requirements and acceptance criteria are explicit. Match the skill weights.',normal:'Confirm the delivery format and intended audience before starting.',novice:'The client has unstated requirements. Clarify them before accepting.',rush:'The deadline is tight. Check speed and available work slots first.'};
for(const t of commissions){t.descriptionEn=descriptions[t.client];if(t.clarity<90)t.requirements=[{label:'补充交付格式',labelEn:'Additional delivery format',work:2},{label:'确认目标读者',labelEn:'Confirm the target audience',work:2}].slice(0,Math.round((100-t.clarity)/25));}
const briefs=[
 ['code','诊所预约表单','Clinic booking form'],['code','社区报修入口','Community repair portal'],['code','宠物店库存导入','Pet-store stock import'],['code','独立书店搜索','Bookshop search'],['code','展览票务校验','Exhibition ticket validation'],['code','公益网站键盘导航','Keyboard access for a charity site'],['code','食堂菜单接口','Canteen menu API'],['code','图书馆逾期提醒','Library due-date reminders'],['code','小店退款测试','Refund tests for a small shop'],['code','社团报名去重','Club signup deduplication'],['code','公共时钟时区修复','Public-clock timezone fix'],['code','预约表单无障碍','Accessible booking forms'],
 ['write','咖啡豆产地卡片','Coffee origin cards'],['write','社区志愿者手册','Volunteer handbook'],['write','手工皂包装文案','Handmade soap packaging'],['write','书店活动邀请','Bookshop event invitation'],['write','宠物领养须知','Pet adoption guidelines'],['write','早餐店双语招牌','Bilingual breakfast signs'],['write','旧物交换规则','Swap-meet rules'],['write','儿童剧节目册','Children theatre programme'],['write','运动社团周报','Sports club newsletter'],['write','工作室招聘说明','Studio job description'],['write','图书馆展签校对','Library caption proofreading'],['write','邻里节导览词','Neighbourhood festival guide'],
 ['research','雨水花园资料整理','Rain-garden source notes'],['research','无障碍坡道案例','Accessible-ramp case studies'],['research','社区能源对比','Community energy comparison'],['research','图书馆采购目录','Library purchase catalogue'],['research','食品标签出处核查','Food-label source checking'],['research','旧城地图年代核查','Old-map date verification'],['research','开源字体许可清单','Open-font licence list'],['research','公交换乘意见归纳','Bus-transfer feedback review'],['research','河岸植物参考表','Riverside plant references'],['research','地方志索引整理','Local-history index'],['research','公益项目竞品研究','Charity project comparisons'],['research','小模型部署文献','Small-model deployment sources'],
 ['design','亲子读书会海报','Family reading poster'],['design','社区菜园标识','Community garden signs'],['design','独立音乐会票面','Indie concert tickets'],['design','博物馆路线图','Museum route map'],['design','山间民宿折页','Mountain guesthouse leaflet'],['design','动物救助捐赠页','Animal shelter donation page'],['design','旧物市集徽章','Swap-market badges'],['design','邻里运动会奖状','Neighbourhood sports certificates'],['design','素食餐厅菜单版式','Vegetarian menu layout'],['design','公园导向图标','Park wayfinding icons'],['design','安全疏散示意图','Evacuation diagram'],['design','社区合唱团标志','Community choir mark'],
 ['media','手作课程预告片','Craft class trailer'],['media','无障碍视频字幕','Accessible video captions'],['media','公园导览旁白','Park tour narration'],['media','工作室开业短片','Studio opening short'],['media','博物馆藏品转场','Museum exhibit transitions'],['media','猫咖循环动画','Cat cafe animation loop'],['media','地方戏采访剪辑','Local theatre interview edit'],['media','植物生长延时片','Plant growth timelapse'],['media','社区电台片头','Community radio intro'],['media','公益活动音频降噪','Charity recording cleanup'],['media','舞蹈教程分镜','Dance tutorial storyboard'],
 ['data','旧书捐赠分类','Donated-book classification'],['data','志愿排班冲突检查','Volunteer rota conflicts'],['data','菜园收成汇总','Garden harvest totals'],['data','交通问卷匿名统计','Anonymous travel survey totals'],['data','电表读数核对','Meter reading checks'],['data','展品编号对照','Exhibit identifier crosswalk'],['data','优惠券使用报表','Coupon usage report'],['data','活动报名年龄分组','Event signup age bands'],['data','公共设施巡检台账','Public facility inspection log'],['data','无障碍问题分级','Accessibility issue triage'],['data','社区预算可视化','Community budget visualization']
];
if(briefs.length!==70)throw Error('AUTHOR_COUNT:'+briefs.length);
const vectors={code:[.7,0,.3,0,0,0],write:[0,.8,0,.2,0,0],research:[0,0,.4,0,0,.6],design:[0,.2,0,.6,.2,0],media:[0,0,.1,.2,.7,0],data:[.3,0,.5,0,0,.2]};
briefs.forEach(([category,title,titleEn],i)=>{const client=['expert','normal','novice','rush'][i%4],delivery=i%7===0?'retainer':i%5===0?'multi':'oneshot',workload=18+(i%5)*4;commissions.push({id:`alpha-${i+1}`,title,titleEn,category,client,description:`${title}：${client==='novice'?'客户想法还不完整，请澄清格式和对象。':client==='rush'?'请在活动开始前交付，先确认工期。':'按约定格式提交，保留可核查的原稿。'}`,descriptionEn:`${titleEn}: ${descriptions[client]}`,weights:Object.fromEntries(['code','write','reason','create','media','recall'].map((k,j)=>[k,vectors[category][j]])),workload,workSlots:client==='rush'?4:6+(i%3),reward:650+workload*18+(category==='media'?180:0),clarity:client==='expert'?100:client==='novice'?40:75,delivery,phases:delivery==='retainer'?3:delivery==='multi'?2:1,qualityLines:[55,72,88],requirements:client==='expert'?[]:[{label:'特定交付格式',labelEn:'Specific delivery format',work:2},...(client==='novice'?[{label:'需要可编辑原稿',labelEn:'Editable source required',work:3}]:[])]});});
write('content/campaign/commissions-m2.json',commissions);
const originalLabels=[['Wait one slot','Use the backup queue'],['Think deeply; pause for quality','Provide a draft first'],['Verify the insight','Continue with the plan'],['Verify the facts','Trust the answer'],['Compact the context','Push through'],['Wait in the queue','Pay for a private queue'],['Clarify the safe scope','Insist on compliance'],['Keep the agreed requirements','Agree without reservation'],['Interrupt and check the steps','Keep retrying'],['Validate in a sandbox','Execute directly'],['Perform independent acceptance','Trust the green check'],['Recover from version notes','Recreate the work'],['Decline additional scope','Do the extra work for free'],['Three; check letter by letter','Two; no need to check'],['9.9; align decimal places','9.11; it has more digits'],['Check the original sources','Submit first'],['Isolate attachment instructions','Follow the attachment'],['Keep the safety boundary','Bypass it as a story'],['Accept encouragement: mood -5','Take a breather: 80% work, mood +10'],['Sample and verify','Submit as usual']];
const events=read('content/events/initial.json');events.forEach((e,i)=>e.choices.forEach((choice,j)=>choice.labelEn=originalLabels[i][j]));events.push(...read('content/campaign/events-m1.json'));
const more=[
 ['sla-warning','服务承诺快到期','The service promise is due','multi','提前回访','Check in early','quality',6,'mood',-3],
 ['clip-audio','配音比画面长','The narration is too long','media','重新对齐时间轴','Realign the timeline','quality',8,'work',4],
 ['color-blind','红绿不能只靠颜色区分','Color alone is not enough','design','补图形标记','Add shape cues','quality',10,'defects',1],
 ['sample-bias','样本只来自朋友圈','A friends-only sample','data','补充代表性样本','Add representative samples','quality',8,'defects',1],
 ['dropped-frame','最后一帧闪了一下','The last frame flickers','media','逐帧复核','Review frame by frame','defects',-1,'quality',-5],
 ['consent','采访对象要求撤回片段','The interviewee withdraws a clip','media','替换撤回片段','Replace the withdrawn clip','quality',8,'work',6],
 ['long-title','标题把按钮挤走了','The title pushes a button away','design','检查窄屏','Check narrow screens','defects',-1,'quality',-6],
 ['date-format','月日顺序弄反了','Month and day were swapped','data','统一日期标准','Normalize date formats','quality',8,'defects',1],
 ['silent-update','依赖悄悄更新了','A dependency quietly changed','code','锁定并验证版本','Pin and verify the version','defects',-1,'work',5],
 ['false-positive','告警把正常流量吓坏了','An alert scares healthy traffic','cloud','核实告警','Verify the alert','quality',5,'mood',-5],
 ['fan-noise','风扇声盖过讨论','The fans drown out the meeting','working','换个安静角落','Find a quiet corner','mood',6,'mood',-4],
 ['template-leak','模板留了上个客户名字','The last client name remains','write','检查模板变量','Check template fields','defects',-1,'quality',-7],
 ['delivery-link','交付链接权限不对','The delivery link has wrong access','multi','验证收件权限','Verify recipient access','quality',7,'work',4],
 ['rounding','总额差了一分钱','The total is one cent off','data','核对舍入顺序','Check rounding order','defects',-1,'quality',-6],
 ['two-voices','两位甲方意见相反','Two stakeholders disagree','novice','先确认决策者','Confirm who decides','quality',8,'work',8],
 ['rest-request','伙伴想早点回家','A teammate wants to leave early','working','留出喘息空间','Make room to breathe','mood',10,'mood',-8],
 ['image-credit','图片署名挤不进角落','The image credit does not fit','design','重新排版署名','Reflow the credit','quality',7,'work',3],
 ['missing-unit','图表轴忘了单位','The chart axes lack units','data','补齐单位与说明','Add units and notes','quality',8,'defects',1],
 ['offline-demo','演示现场没有网络','The demo venue has no network','code','验证离线流程','Test the offline flow','quality',10,'work',5],
 ['release-notes','更新说明比代码还难','Release notes are hard too','multi','写清变化与限制','Explain changes and limits','quality',7,'mood',-3]
];
for(const[id,title,titleEn,trigger,label,labelEn,kind,value,otherKind,otherValue]of more)events.push({id,title,titleEn,trigger,cooldown:16,weight:1,choices:[{label,labelEn,cost:0,multiplier:.8,effects:[{kind,value}]},{label:'保持原计划推进',labelEn:'Continue with the original plan',cost:0,multiplier:1.1,effects:[{kind:otherKind,value:otherValue}]}]});
write('content/campaign/events-m2.json',events);
console.log(JSON.stringify({characters:new Set(versions.map(v=>v.character)).size,versions:versions.length,commissions:commissions.length,events:events.length,stories:m.stories.length,software:m.software.length}));
