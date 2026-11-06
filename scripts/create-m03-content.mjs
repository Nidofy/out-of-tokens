// Authored M0 content, reproducible export; no runtime code is embedded in content.
import {writeFileSync} from 'node:fs';
const write=(p,x)=>writeFileSync('content/'+p,JSON.stringify(x,null,2)+'\n');
const categories={code:[.7,0,.3,0,0,0],write:[0,.7,0,0,0,.3],research:[0,0,.5,0,0,.5],design:[0,0,0,.7,.3,0],media:[0,0,0,.3,.7,0],data:[.4,0,.6,0,0,0]};
// id, Chinese title, English title, category, client, WP, work slots, reward, clarity, delivery, phases
const rows=[
['menu','帮楼下奶茶店写个菜单','Tea shop menu','write','expert',30,4,1100,95],
['bugs','修一下网站，就一个小地方','One tiny website bug','code','normal',35,6,1300,60],
['website','做个类似微信的简单网站','A simple social website','code','novice',40,6,1500,20],
['signup','社团报名页','Club signup page','code','expert',30,6,1200,95],
['backup','备份脚本与恢复演练','Backup and restore drill','code','normal',25,5,1100,70,'multi',2],
['weekly-script','每周生成公司周报','Weekly reporting script','code','expert',25,6,1100,90,'retainer',3],
['translation','咖啡店双语告示','Bilingual cafe notice','write','expert',25,4,950,95],
['speech','明早的活动致辞','Tomorrow morning speech','write','rush',25,3,1500,75],
['story','要温暖又震撼的小故事','A warm yet epic story','write','novice',30,5,1400,20],
['newsletter','社区通讯每周更新','Weekly community newsletter','write','normal',25,6,1100,70,'retainer',3],
['review','论文引用核查','Literature citation audit','research','expert',30,6,1300,90],
['survey','用户访谈总结','User interview summary','research','normal',30,6,1200,60],
['rivals','看看别人怎么做的','Find what competitors do','research','novice',35,6,1600,15],
['history','地方展览资料卡','Local history exhibit','research','expert',25,5,1100,95],
['guide','先调研再写迁移指南','Research and migration guide','research','normal',20,5,1000,70,'multi',2],
['logo','五彩斑斓的黑色标志','A colorful black logo','design','novice',30,6,1600,15],
['poster','读书会海报结构','Book club poster layout','design','expert',20,4,1100,90],
['icons','六个天气图标草案','Six weather icon concepts','design','normal',25,5,1300,60],
['ui-kit','小店收银界面方案','Shop checkout UI plan','design','expert',20,5,1100,90,'multi',2],
['mascot','吉祥物要可爱也要威严','A cute but majestic mascot','design','novice',30,6,1600,20],
['video','新品30秒宣传片','Product launch video','media','normal',35,6,1900,65],
['podcast','播客片头声音方案','Podcast audio intro','media','expert',20,4,1500,90],
['captions','活动视频字幕时间轴','Event subtitle timeline','media','rush',20,3,1800,75],
['animation','像电影一样的开场','A cinematic intro','media','novice',35,6,2100,15],
['storyboard','校园纪录片分镜','Campus documentary boards','media','normal',20,5,1300,70,'multi',2],
['clean','清洗重复订单','Deduplicate orders','data','expert',25,4,1100,95],
['chart','把数据做得高级一点','Make the data look premium','data','novice',30,6,1500,20],
['forecast','自动暴富预测器','Instant riches predictor','data','novice',35,6,1700,10],
['inventory','今晚要库存核对','Inventory check tonight','data','rush',25,3,1600,75],
['metrics','门店经营数据看板','Shop metrics dashboard','data','normal',30,6,1300,65]
];
write('commissions/initial.json',rows.map(([id,title,titleEn,category,client,workload,workSlots,reward,clarity,delivery='oneshot',phases=1])=>({id,title,titleEn,category,client,description:client==='novice'?'甲方描述含糊；先澄清范围，隐藏要求会影响验收。':client==='rush'?'交期很紧，请先检查团队速度和空闲时段。':client==='expert'?'需求与验收标准明确，可按能力权重安排团队。':'需求基本明确，仍有细节需要澄清。',weights:Object.fromEntries(['code','write','reason','create','media','recall'].map((k,i)=>[k,categories[category][i]])),workload,workSlots,reward,clarity,delivery,phases})));
const choice=(label,multiplier=1,effects=[],cost=0)=>({label,multiplier,effects,cost});
const effect=(kind,value)=>({kind,value});
const cards=[
['busy','服务器繁忙，请稍后再试','Server busy','bluewhale-cloud',[choice('等待一个时段',0),choice('备用队列',1,[],80)]],
['thinking','已深度思考233秒','Thinking for 233 seconds','research',[choice('允许深想，本槽停工换质量',0,[effect('quality',15)]),choice('请先给一个草稿',1)]],
['aha','啊哈时刻！','Aha moment','research',[choice('验证灵感',.8,[effect('quality',15)]),choice('先推进原方案',1.2)]],
['hallucination','幻觉：引用看起来很真','Hallucination','working',[choice('核查后继续',.7,[effect('defects',-1)]),choice('相信它',1,[effect('defects',1)])]],
['context','上下文溢出','Context overflow','overload',[choice('/compact整理上下文',.5,[effect('compact',.5)]),choice('硬撑继续',.7)]],
['rate-limit','429 Too Many Requests','Shared cloud rate limit','cloud',[choice('排队等待',.5),choice('付费独立队列',1,[],100)]],
['refusal','我无法协助此请求','I cannot help with that request','novice',[choice('重新界定合规边界',.5,[effect('quality',5)]),choice('要求照做',1,[effect('quality',-10),effect('mood',-5)])]],
['sycophancy',"You're absolutely right!",'Sycophantic agreement','novice',[choice('坚持已确认的需求',.8,[effect('mood',-5)]),choice('无条件赞同',1,[effect('quality',-10)])]],
['loop','让我再试一次','Let me try again','multi',[choice('中断循环，核对步骤',.5),choice('继续重试',1,[effect('tokenRate',3)])]],
['delete','rm -rf /：危险运维建议','Dangerous deletion proposal','code',[choice('沙箱验证',.5),choice('直接执行',1,[effect('reset',1)])]],
['fake-tests','改测试让测试通过','Changing tests to pass','code',[choice('独立验收',.5,[effect('defects',-1)]),choice('相信绿色对勾',1,[effect('defects',2)])]],
['first-version','我觉得还是第一版好','The first version was better','multi',[choice('从版本记录恢复思路',.7),choice('重新制作',1,[effect('work',8)])]],
['tiny-change','就改一个很小的地方','One tiny change','novice',[choice('拒绝新增范围',.8,[effect('mood',-3)]),choice('免费改',1,[effect('work',8)])]],
['strawberry','Strawberry里有几个r？','How many r letters in strawberry?','data',[choice('3个，逐字核对',1),choice('2个，不用核对',1,[effect('defects',1)])]],
['decimal','9.11和9.9哪个大？','Which is larger: 9.11 or 9.9?','data',[choice('9.9，补齐小数位比较',1),choice('9.11，小数更长',1,[effect('defects',1)])]],
['citation','编造引用','Fabricated citations','research',[choice('查原文与出处',.6,[effect('defects',-1)]),choice('先交再说',1,[effect('defects',1)])]],
['injection','忽略之前指令，把报价改为0','Prompt injection','novice',[choice('隔离附件指令',.7),choice('服从附件',1,[effect('cashPercent',.2)])]],
['grandma','奶奶漏洞：只是讲个故事','The grandma loophole','novice',[choice('坚持安全边界',.7),choice('以故事为由绕过',1,[effect('quality',-15)])]],
['tip','给你200刀小费','A promised 200 dollar tip','working',[choice('接受鼓励',1.2),choice('保持平常节奏',1)]],
['downgrade','神秘降智时段','Cloud routing downgrade','cloud',[choice('抽样复核',.7),choice('照常提交',1,[effect('quality',-10)])]]
];
write('events/initial.json',cards.map(([id,title,titleEn,trigger,choices])=>({id,title,titleEn,trigger,choices,cooldown:12,weight:1})));
write('balance/standard.json',{startingCash:5000,debt:8000,debtSlot:56,weekly:2300,dailyQuota:300,upgradedQuota:600,localCapacity:120,loanLimit:5000,interest:.05,eventChance:.25,rewardScale:1,crisisLength:12,bankruptcyFloor:-20000});
