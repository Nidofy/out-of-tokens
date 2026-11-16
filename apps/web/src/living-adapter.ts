import type {Skill} from 'oot-core';
import type {GameView} from 'oot-platform';

export type EmoteKind='coffee'|'idea'|'sweat'|'sleepy'|'rice'|'sparkle';

export interface GiftDef {
 id:string;
 name:string;
 nameEn:string;
 cost:number;
 desc:string;
 descEn:string;
 lovedBy:readonly string[];
 likedBy:readonly string[];
}

export interface DuoBonus {
 kind:'efficiency'|'quality'|'clarify'|'energySave'|'defectGuard';
 value:number;
 mode?:'local'|'cloud';
 category?:Skill;
}

export interface DuoDef {
 id:string;
 actors:readonly [string,string];
 title:string;
 titleEn:string;
 minDeliveries:number;
 bonus:DuoBonus;
 desc:string;
 descEn:string;
 banter:readonly {speaker:string;zh:string;en:string}[];
}

export interface ChatThreadDef {
 id:string;
 title:string;
 titleEn:string;
 trigger:{
  kind:'day'|'chapter'|'deliveries'|'recruit'|'overtime'|'weeklyBill'|'crisis';
  value:number|string;
 };
 messages:readonly {speaker:string;zh:string;en:string}[];
 replies:readonly {
  label:string;
  labelEn:string;
  targetActor:string;
  responseZh:string;
  responseEn:string;
 }[];
}

export interface ClientPersonaDef {
 id:string;
 name:string;
 nameEn:string;
 role:string;
 roleEn:string;
 style:'novice'|'normal'|'expert'|'rush';
 quotes:Record<'excellent'|'good'|'pass'|'fail',readonly [string,string]>;
}

export type SocialTriple=readonly [readonly [string,string],readonly [string,string],readonly [string,string]];

export interface CharacterBarkSet {
 stage:Record<'morning'|'work'|'tired'|'overload'|'canteen'|'library'|'win',readonly (readonly [string,string])[]>;
 social:Record<'chat'|'giftLove'|'giftNormal'|'meal'|'study',SocialTriple>;
 work:Record<'assignWorker'|'assignPlanner'|'assignReviewer'|'assignTool'|'clarifyHit'|'clarifyMiss',readonly [string,string]>;
}

export interface LivingContent {
 gifts:readonly GiftDef[];
 duos:readonly DuoDef[];
 threads:readonly ChatThreadDef[];
 clients:readonly ClientPersonaDef[];
 barks:Record<string,CharacterBarkSet>;
 eventQuotes:Record<string,{default:readonly [string,string];byActor?:Record<string,readonly [string,string]>}>;
 slotBeats:Record<'toAfternoon'|'toEvening'|'toNight'|'toMorning',readonly (readonly [string,string])[]>;
}

export interface LivingDuoView {
 id:string;
 actors:readonly [string,string];
 title:string;
 titleEn:string;
 desc:string;
 descEn:string;
 sharedDeliveries:number;
 unlocked:boolean;
 canUnlock:boolean;
}

export interface LivingThreadView {
 id:string;
 title:string;
 titleEn:string;
 messages:readonly {speaker:string;zh:string;en:string}[];
 replies:readonly {label:string;labelEn:string;targetActor:string;responseZh:string;responseEn:string}[];
 chosenReply:number|null;
}

export interface LivingView {
 teaReady:boolean;
 gifted:Record<string,string[]>;
 duos:LivingDuoView[];
 threads:LivingThreadView[];
 unreadThreads:number;
}

export interface LocalLivingOverlayState {
 gifted:Record<string,string[]>;
 lastTeaDay:number;
 duos:string[];
 chatLog:Record<string,number>;
}

export const emptyLocalLivingState=():LocalLivingOverlayState=>({gifted:{},lastTeaDay:0,duos:[],chatLog:{}});

const gifts:readonly GiftDef[]=[
 {id:'rice-bento',name:'现蒸腊味白米饭',nameEn:'Steamed Rice Bento',cost:45,desc:'趁热端上桌的食堂特供双拼饭',descEn:'Steaming canteen roast over fragrant white rice.',lovedBy:['bluewhale','qwen'],likedBy:['llama','glm']},
 {id:'espresso-pods',name:'深烘浓缩咖啡豆',nameEn:'Dark Roast Espresso',cost:55,desc:'早班醒神必备，焦香利落不拖泥带水',descEn:'Crisp dark-roast pods built for brisk morning sprints.',lovedBy:['mistral','claude'],likedBy:['grok','kimi']},
 {id:'fountain-pen',name:'黄铜钢笔与墨水',nameEn:'Brass Fountain Pen',cost:65,desc:'顺滑写感配墨绿色非褪色签批墨水',descEn:'Balanced brass pen paired with deep sage archival ink.',lovedBy:['kimi','claude','glm'],likedBy:['gpt','llama']},
 {id:'prism-sketchbook',name:'硫酸纸分镜草图本',nameEn:'Vellum Storyboard Pad',cost:70,desc:'透光分镜页配一块可折射微光的光学棱镜',descEn:'Translucent storyboard pad with a pocket glass prism.',lovedBy:['seedance','gemini'],likedBy:['gpt','minimax']},
 {id:'vinyl-coaster',name:'爵士黑胶与热可可',nameEn:'Jazz Vinyl & Cocoa',cost:70,desc:'暖灯试演夜少不了的绒面爵士配热可可',descEn:'Acoustic lounge vinyl paired with spiced marshmallow cocoa.',lovedBy:['minimax','gpt'],likedBy:['kimi','grok']},
 {id:'keycap-artisan',name:'琥珀机械键帽礼盒',nameEn:'Amber Artisan Keycap',cost:60,desc:'透光琥珀树脂内嵌微型四芒星雕件',descEn:'Translucent amber resin keycaps inlaid with starlight filigree.',lovedBy:['grok','llama'],likedBy:['bluewhale','mistral','seedance']}
];

const duos:readonly DuoDef[]=[
 {
  id:'bluewhale-qwen',actors:['bluewhale','qwen'],title:'白板双拆解',titleEn:'Chalkboard Split',minDeliveries:2,
  bonus:{kind:'efficiency',value:0.08},desc:'同队执行委托时产出 +8%',descEn:'+8% work output when both join the same commission',
  banter:[
   {speaker:'bluewhale',zh:'步骤拆成四段放在白板左侧了，中午食堂还有现蒸米饭吗？',en:'Split the algorithm on the left board—does canteen still have fresh rice?'},
   {speaker:'qwen',zh:'清单我都编号啦！写完这轮刚好顺路一起去二号窗口。',en:'All numbered on the checklist! Let’s head to Window 2 right after this pass.'}
  ]
 },
 {
  id:'claude-grok',actors:['claude','grok'],title:'红线拉扯组',titleEn:'Redline Banter',minDeliveries:2,
  bonus:{kind:'quality',value:5},desc:'同队交付最终质量 +5',descEn:'+5 final quality when working together',
  banter:[
   {speaker:'grok',zh:'如果客户其实想要会自己吐槽的报错页面呢？',en:'What if the client secretly wants an error page that roasts them back?'},
   {speaker:'claude',zh:'先让我把“不得误导用户”那条从合同第 9 页划出来，留半个彩蛋倒可以。',en:'Let me check page 9 first. One gentle easter egg is fine if it stays honest.'}
  ]
 },
 {
  id:'llama-mistral',actors:['llama','mistral'],title:'开源快慢调音',titleEn:'Open-Weight Cadence',minDeliveries:2,
  bonus:{kind:'efficiency',value:0.1,mode:'local'},desc:'本地模式同队产出 +10%',descEn:'+10% output in local mode together',
  banter:[
   {speaker:'mistral',zh:'红羽帽已经预热好了，模板给我我先冲三份！',en:'Feathered hat ready—hand me the templates and I’ll draft three right away!'},
   {speaker:'llama',zh:'慢半拍检查下权重分布，跑稳了就能一路顺过去。',en:'Check the weight split for half a beat—once steady, sprint ahead.'}
  ]
 },
 {
  id:'glm-kimi',actors:['glm','kimi'],title:'长文立骨搭档',titleEn:'Spine & Index',minDeliveries:2,
  bonus:{kind:'quality',value:5,category:'write'},desc:'写作/调研类委托质量 +5',descEn:'+5 quality on writing & research jobs together',
  banter:[
   {speaker:'glm',zh:'我先把三大章结构骨架立好，每一节留出了出处锚点。',en:'Three-part skeleton is up, with clean citation anchors left in every section.'},
   {speaker:'kimi',zh:'太省心了，刚才那 40 页试营业记录我都按你的标题贴好了页签。',en:'Perfect—I’ve already tabbed all 40 pages of pilot logs against your headings.'}
  ]
 },
 {
  id:'gemini-gpt',actors:['gemini','gpt'],title:'星光路演秀',titleEn:'Showcase Glow',minDeliveries:2,
  bonus:{kind:'efficiency',value:0.09,category:'create'},desc:'创作/路演类委托产出 +9%',descEn:'+9% output on creative & showcase tasks',
  banter:[
   {speaker:'gpt',zh:'我把技术术语翻成了店主第一眼能看懂的三句价值说明。',en:'Translated the architecture jargon into three lines any shopkeeper understands.'},
   {speaker:'gemini',zh:'那我把配图、波形和动画帧全对齐到这三句话的节拍上！',en:'Then I’ll sync every diagram, waveform and frame to those three beats!'}
  ]
 },
 {
  id:'minimax-seedance',actors:['minimax','seedance'],title:'试演分镜班',titleEn:'Rehearsal Cut',minDeliveries:2,
  bonus:{kind:'defectGuard',value:1,category:'media'},desc:'多媒体委托缺陷风险 -1',descEn:'-1 defect accumulation on media tasks',
  banter:[
   {speaker:'seedance',zh:'第三镜转场我砍掉两秒空镜，保证每个画面都紧扣需求。',en:'Trimmed two seconds on shot three so every frame serves the brief.'},
   {speaker:'minimax',zh:'正好！这段人声进点跟鼓点对齐后，试演效果稳了一倍。',en:'Matches the vocal cue cleanly—rehearsal pacing feels twice as tight now.'}
  ]
 },
 {
  id:'bluewhale-claude',actors:['bluewhale','claude'],title:'严谨零返工',titleEn:'Zero-Defect Proof',minDeliveries:2,
  bonus:{kind:'defectGuard',value:1},desc:'同队时缺陷累计降低',descEn:'Reduces defect buildup per slot together',
  banter:[
   {speaker:'bluewhale',zh:'边界条件我全部写成了单测断言，哪怕凌晨跑也不会漏。',en:'Turned every edge case into assertions so even late-night runs hold.'},
   {speaker:'claude',zh:'和你的草稿合校通常只用看一轮。不过第 4 条备注还是再加一句免责。',en:'Your drafts take half the review pass—let’s still clarify note four.'}
  ]
 },
 {
  id:'kimi-qwen',actors:['kimi','qwen'],title:'跨页备忘录',titleEn:'Cross-Ref Memo',minDeliveries:2,
  bonus:{kind:'clarify',value:0.12},desc:'同景澄清需求成功率 +12%',descEn:'+12% clarify success rate when together',
  banter:[
   {speaker:'qwen',zh:'客户嘴上说“跟上次差不多”，其实邮件末尾改了一个交付日期。',en:'Client wrote “same as last time”, but quietly shifted the delivery window.'},
   {speaker:'kimi',zh:'抓到了，我在三周前的通话记录里找到对应条款了。',en:'Caught it—matched it straight to the call notes from three weeks ago.'}
  ]
 },
 {
  id:'claude-gpt',actors:['claude','gpt'],title:'甲方翻译官',titleEn:'Client Translator',minDeliveries:2,
  bonus:{kind:'efficiency',value:0.07,mode:'cloud'},desc:'云端模式同队产出 +7%',descEn:'+7% cloud-mode output together',
  banter:[
   {speaker:'gpt',zh:'别直接丢冷冰冰的拒绝条款，我帮你在前面加上替代方案。',en:'Don’t drop a cold rejection clause—I’ll soften it with two friendly alternatives.'},
   {speaker:'claude',zh:'方案温和归温和，核心红线半毫米都不许退让。',en:'Warm phrasing is welcome; the acceptance boundary stays razor sharp.'}
  ]
 },
 {
  id:'mistral-seedance',actors:['mistral','seedance'],title:'早班快剪手',titleEn:'Morning Rough Cut',minDeliveries:2,
  bonus:{kind:'efficiency',value:0.1},desc:'上午时段同队执行效率 +10%',descEn:'+10% morning-slot output together',
  banter:[
   {speaker:'mistral',zh:'上午咖啡还没凉透，前三段配音草稿先铺进轨道！',en:'Coffee’s still hot—three voice drafts are already dropped onto the timeline!'},
   {speaker:'seedance',zh:'收到了，我已经标好时间码，中午饭前出粗剪版。',en:'Got them, timecodes locked—we’ll have a clean rough cut before lunch.'}
  ]
 },
 {
  id:'glm-llama',actors:['glm','llama'],title:'青草地框架坊',titleEn:'Lawn Architecture',minDeliveries:2,
  bonus:{kind:'energySave',value:2,mode:'local'},desc:'本地同队工作精力消耗 -2',descEn:'-2 work energy cost in local mode together',
  banter:[
   {speaker:'llama',zh:'按这个开源基座跑一天也不累，顺便还能给新人讲透原理。',en:'With this open architecture, we can run steady all afternoon without burnout.'},
   {speaker:'glm',zh:'嗯，结构清晰了，大家返工心累自然就少一半。',en:'True—once boundaries are explicit, nobody wastes stamina guessing.'}
  ]
 },
 {
  id:'gemini-minimax',actors:['gemini','minimax'],title:'多模态合奏',titleEn:'Multimodal Ensemble',minDeliveries:2,
  bonus:{kind:'efficiency',value:0.08},desc:'多阶段合同执行产出 +8%',descEn:'+8% output on multi-phase contracts together',
  banter:[
   {speaker:'gemini',zh:'你看这张色板加一段轻微弦乐和声，客户一定记住第一眼。',en:'Match this palette with a soft string swell—they’ll remember the opening frame.'},
   {speaker:'minimax',zh:'二期演示咱们直接用现场试演版，把节奏感拉满。',en:'Let’s stage phase two as a live rehearsal—let the pacing speak.'}
  ]
 }
];

const threads:readonly ChatThreadDef[]=[
 {
  id:'day1-open',title:'车库开张第一天',titleEn:'Day 1 · Garage Opening',trigger:{kind:'day',value:1},
  messages:[
   {speaker:'qwen',zh:'早安各位！白板擦干净了，我顺手把开业三张小委托按难易度贴在最上面。',en:'Morning everyone! Whiteboard is spotless, and I pinned our opening briefs on top.'},
   {speaker:'mistral',zh:'奶茶店那单我看过权重啦，写得快又不需要深逻辑，谁冲第一棒？',en:'Peeked at the tea shop menu—light logic, brisk writing. Who wants first shift?'},
   {speaker:'bluewhale',zh:'先吃早饭或先澄清都行，别一上来把全队精力全按空了。对了食堂中午有白米饭吗？',en:'Don’t drain everyone on turn one. Also—does canteen serve steamed rice today?'}
  ],
  replies:[
   {label:'先理顺茶店菜单，稳稳拿下首单回款',labelEn:'Let’s tackle the tea menu cleanly first',targetActor:'qwen',responseZh:'明白！清单已就位，我去电脑工位热身啦。',responseEn:'On it! Checklist ready—warming up at Station 1.'},
   {label:'放心，中午一定请大家去食堂加菜',labelEn:'Lunch treat at the canteen is on me today',targetActor:'bluewhale',responseZh:'那上午干活可就更有劲头了！',responseEn:'Now that puts real wind in our sails!'}
  ]
 },
 {
  id:'first-delivery',title:'首单顺利交付',titleEn:'First Commission Delivered',trigger:{kind:'deliveries',value:1},
  messages:[
   {speaker:'llama',zh:'第一笔尾款落袋了。虽说是小单，整条接单、派单和验收流程总算跑通啦。',en:'First balance settled! Small contract, but the whole pipeline hums cleanly now.'},
   {speaker:'mistral',zh:'火漆章盖下去那一刻好解压！顺便问下，我帽子的羽毛没被风吹歪吧？',en:'That wax seal sound felt so satisfying! Wait—is my hat feather still straight?'}
  ],
  replies:[
   {label:'大家都辛苦了，算算余额准备下一个目标',labelEn:'Great work team—let’s eye our next goal',targetActor:'llama',responseZh:'稳扎稳打，车库早晚能换成窗明几净的大工作室。',responseEn:'Step by step, this garage will turn into a bright studio.'},
   {label:'羽毛很帅，下午的文案依然靠你带节奏',labelEn:'Hat looks sharp—afternoon copy is yours',targetActor:'mistral',responseZh:'收到！喝完手头这杯冰美式就开工！',responseEn:'Copy that! Ready once I finish this iced americano!'}
  ]
 },
 {
  id:'day3-rhythm',title:'算力与作息备忘',titleEn:'Quota & Evening Rhythm',trigger:{kind:'day',value:3},
  messages:[
   {speaker:'bluewhale',zh:'提醒一句：晚上大家会自动去食堂和图书馆回血，别强行卡在深夜满负载工作。',en:'Reminder: teammates naturally unwind at night—don’t push red-line load nonstop.'},
   {speaker:'qwen',zh:'第 7 天要结周账单，第 14 天还有旧债，手头现金留出安全垫才踏实。',en:'Weekly bill lands on Day 7 and inherited debt on Day 14—keep a cash cushion.'}
  ],
  replies:[
   {label:'收到，我会留够备用金再看要不要扩家具',labelEn:'Noted—keeping a buffer before buying furniture',targetActor:'qwen',responseZh:'有你在把关资金安全，我安心多啦。',responseEn:'Having you watch the solvency buffer is a huge relief.'},
   {label:'晚上大家只管好好去食堂吃顿热饭',labelEn:'Rest well tonight and eat something warm',targetActor:'bluewhale',responseZh:'多谢体谅，休息好明天输出反而更高。',responseEn:'Thanks—well-rested minds produce far cleaner work.'}
  ]
 },
 {
  id:'chapter-1-move',title:'搬进共享孵化器！',titleEn:'Chapter 1 · Welcome to the Incubator',trigger:{kind:'chapter',value:1},
  messages:[
   {speaker:'qwen',zh:'恭喜进入第 1 章！现在可以承接带路线选择的大订单了，而且终于能招募新伙伴啦。',en:'Welcome to Chapter 1! Multi-step client routes and new teammate recruitment are open.'},
   {speaker:'llama',zh:'听说孵化器隔壁就有咖啡手冲台和更宽的书架，大家终于不用挤在旧桌子上了。',en:'Heard the incubator has a real coffee bar and taller bookshelves—room to breathe!'}
  ],
  replies:[
   {label:'下一步把口碑和团队声望攒起来，迎接新同伴',labelEn:'Let’s build reputation and invite new teammates',targetActor:'qwen',responseZh:'嗯！我把招募门槛和声望需求标在档案页顶栏了。',responseEn:'I’ve pinned every recruit fee and reputation gate right at the top!'}
  ]
 },
 {
  id:'recruit-gpt',title:'新人报道：GPT',titleEn:'New Teammate: GPT',trigger:{kind:'recruit',value:'gpt'},
  messages:[
   {speaker:'gpt',zh:'嗨大家！我是 GPT。平时喜欢站在客户第一眼的角度把枯燥需求翻译成动人演示～',en:'Hi team! I’m GPT—happy to turn dry specs into clear, engaging demos for clients.'},
   {speaker:'qwen',zh:'欢迎！注意当前基础版仅支持云端额度，派单前别忘先算清楚今日剩余配额哦。',en:'Welcome! Heads-up: your base model runs cloud-only, so we’ll budget quota carefully.'}
  ],
  replies:[
   {label:'欢迎加入！孵化器的路演说明正缺你这位大师',labelEn:'Welcome! Our incubator pitches need your polish',targetActor:'gpt',responseZh:'嘿嘿，交给我吧！有不懂的地方随时在群里敲我。',responseEn:'Leave the showcase polish to me—ping anytime!'}
  ]
 },
 {
  id:'recruit-claude',title:'新人报道：Claude',titleEn:'New Teammate: Claude',trigger:{kind:'recruit',value:'claude'},
  messages:[
   {speaker:'claude',zh:'各位好，我是 Claude。刚入职已经通读了一遍工作守则第 1 到 14 条，先说好合同边角细节必须经我过目。',en:'Hello team, I’m Claude. Just finished reading clauses 1 through 14 of the studio handbook.'},
   {speaker:'mistral',zh:'哇好严肃……不过上次差点漏看甲方隐藏要求，有她在绝对稳很多！',en:'Whoa so strict… honestly though, we really needed someone catching fine print!'}
  ],
  replies:[
   {label:'守底线的关键一关就拜托你把稳了，Claude',labelEn:'Glad to have your checklist eye guarding quality',targetActor:'claude',responseZh:'放心，写清楚红线本身就是对全队最大的保护。',responseEn:'Explicit boundaries protect the whole team best.'}
  ]
 },
 {
  id:'recruit-kimi',title:'新人报道：Kimi',titleEn:'New Teammate: Kimi',trigger:{kind:'recruit',value:'kimi'},
  messages:[
   {speaker:'kimi',zh:'大家好，我是 Kimi。我已经把过去一周所有会议摘要按颜色贴好页签归档了，下班大概也会常驻图书馆。',en:'Hi everyone, I’m Kimi. Already tabbed last week’s meeting notes; you’ll find me in the library.'},
   {speaker:'bluewhale',zh:'百页参考资料丢给你终于不怕前后打架了。',en:'Finally someone who won’t lose track after page sixty.'}
  ],
  replies:[
   {label:'有你在，资料复核和需求澄清可就有底气了',labelEn:'Our source reviews feel way stronger with you here',targetActor:'kimi',responseZh:'交给我吧，冲突线索一页页对照最容易现形。',responseEn:'Happy to dig—contradictions show up fast once indexed.'}
  ]
 },
 {
  id:'recruit-gemini',title:'新人报道：Gemini',titleEn:'New Teammate: Gemini',trigger:{kind:'recruit',value:'gemini'},
  messages:[
   {speaker:'gemini',zh:'早安各位～刚把文字板、音频轨和参考图全摆上工作台，多模态创意小队准备就绪！',en:'Hey everyone~ Text, visuals and audio laid side by side—multimodal crew reporting in!'},
   {speaker:'gpt',zh:'太棒了！以后客户路演视觉部分终于能合体升级啦。',en:'Amazing! Now our client pitches can truly shine end-to-end.'}
  ],
  replies:[
   {label:'欢迎点亮团队星光，期待第一次多模态交付',labelEn:'Welcome aboard—excited for our first showcase',targetActor:'gemini',responseZh:'保证交出一份让客户眼前一亮的答卷！',responseEn:'Count on a demo that brings real sparkle!'}
  ]
 },
 {
  id:'recruit-grok',title:'新人报道：Grok',titleEn:'New Teammate: Grok',trigger:{kind:'recruit',value:'grok'},
  messages:[
   {speaker:'grok',zh:'听说这里从不禁止在正经汇报里留一句有意思的小玩笑？我是 Grok，专挑大家不敢问的角度提问！',en:'Heard this studio actually appreciates bold questions—Grok here, ready to shake up assumptions!'},
   {speaker:'claude',zh:'……提问可以，发送交付链接前记得回来看一眼我的验收清单。',en:'…Ask anything you like, just sign off on my acceptance list before shipping.'}
  ],
  replies:[
   {label:'有尖锐幽默感加严谨兜底，咱这组合才完整',labelEn:'Sharp humor plus solid checks makes us unstoppable',targetActor:'grok',responseZh:'哈哈正合我意！这就去看工位在哪儿！',responseEn:'Now you’re talking—where’s my desk?'}
  ]
 },
 {
  id:'chapter-2-night',title:'模型更新之夜',titleEn:'Chapter 2 · Model Release Night',trigger:{kind:'chapter',value:2},
  messages:[
   {speaker:'bluewhale',zh:'大家注意到没？版本研发台亮起了更高阶权重图谱，是时候积攒研发点解锁进阶形态了。',en:'Notice the research terminal? Higher-tier model trees just lit up—time to gather RP.'},
   {speaker:'qwen',zh:'第 2 章开始对手工作室也可能来抢标，记得手账里多留意竞标动向。',en:'Rival studios may bid on contracts from Chapter 2 onward—keep an eye on the journal.'}
  ],
  replies:[
   {label:'研发点攒够就优先突破王牌的高阶版本！',labelEn:'We’ll push RP toward flagship upgrades right away',targetActor:'bluewhale',responseZh:'期待切换进阶形态后并肩啃下高难度长单。',responseEn:'Looking forward to taking on hard contracts in upgraded form.'}
  ]
 }
];

const clients:readonly ClientPersonaDef[]=[
 {
  id:'tea-lin',name:'巷口奶茶店 · 林姐',nameEn:'Lin · Corner Tea Shop',role:'社区奶茶店主理人',roleEn:'Neighborhood Tea Shop Owner',style:'novice',
  quotes:{
   excellent:['哇，这菜单和slogan我自己看了都想多喝两杯！街坊路过肯定挪不动脚，尾款秒结！','Whoa, this menu reads so appetizing even I want an extra cup—sending full payment right now!'],
   good:['图清字也顺眼，比我手写的贴纸高级多啦！','Clean and bright—miles ahead of my hand-written counter stickers!'],
   pass:['嗯，意思都写明白啦，贴在玻璃窗上应该挺管用的。','Got the basics right—it’ll do nicely on our storefront glass.'],
   fail:['哎呀这怎么跟我早上说的不太一样，只能麻烦重新改一版再发我了……','Wait, this isn’t quite what I asked for this morning—could you re-check?']
  }
 },
 {
  id:'book-zhou',name:'独立书店 · 老周',nameEn:'Zhou · Indie Bookshop',role:'社区阅读空间主理人',roleEn:'Indie Bookshop Keeper',style:'normal',
  quotes:{
   excellent:['逐条核对得清清楚楚，老顾客拿在手上一下子就知道怎么预约，实在感谢！','Every clause checked and traced. Regulars will figure out reservations right away—thank you!'],
   good:['条理稳当，没有多余花哨的空话，书店柜台正缺这种实在手册。','Steady, practical, zero fluff—exactly what our book counter needed.'],
   pass:['基本能用，我先印一叠放前台试试看反应。','Workable enough. I’ll print a small stack for the front desk first.'],
   fail:['不少边界场景还是没对上台账，咱们只能按约定退回或扣减结算了。','Too many edge cases still mismatch our log—we have to settle accordingly.']
  }
 },
 {
  id:'tech-yan',name:'园区架构组 · 严总监',nameEn:'Yan · Campus Tech Lead',role:'研发平台技术负责人',roleEn:'Engineering Platform Director',style:'expert',
  quotes:{
   excellent:['零致命缺陷、测试覆盖扎实、边界注释完整。很少在外包团队见着这等干脆交付。','Zero critical defects, tight assertions, crisp edge notes. Rarely see delivery this clean.'],
   good:['核心逻辑扎实，可读性也过关，下期重构需求我会优先发给你们。','Core logic holds up nicely. I’ll send our next refactor cycle your way too.'],
   pass:['跑通了基准测试，虽然几处边角还有优化空间，按约定结款。','Passed baseline checks. Room to polish, but accepted per contract.'],
   fail:['生产环境红线没守住，这类回归问题没法直接合并，按违约处理。','Regression slipped past baseline—can’t merge this to prod. Settling as breach.']
  }
 },
 {
  id:'curator-su',name:'新媒体展厅 · 苏策展人',nameEn:'Su · Media Gallery',role:'交互空间视觉策展',roleEn:'Interactive Space Curator',style:'normal',
  quotes:{
   excellent:['质感与节拍严丝合缝！布展屏幕试放那一刻整个展厅都有呼吸感了。','Texture and pacing lock together seamlessly—the gallery hall felt alive on preview!'],
   good:['画面色调很温润，主题传达也很精准，观众一定愿意驻足。','Warm palette and clear framing—visitors will definitely linger here.'],
   pass:['构图规范过关，导览文字也清晰，先按排期上线展陈。','Composition passes spec cleanly; scheduling it into the hall display.'],
   fail:['镜头节奏与展厅氛围错位太大，这轮没法上墙展示。','Shot pacing clashes hard with the exhibition mood—cannot put this on display.']
  }
 },
 {
  id:'oss-zhe',name:'开源社区站 · 阿哲',nameEn:'Zhe · Open Maintainer',role:'开源项目核心维护者',roleEn:'Open-Source Maintainer',style:'normal',
  quotes:{
   excellent:['PR 一行多余改动都没有，文档和复现用例干净到我想置顶加精！','Not a single noisy diff—docs and repro steps clean enough to pin on top!'],
   good:['思路通透，仓库里好几个老 Issue 这回终于能顺手关掉了。','Clear patch! Finally closing a handful of stubborn old issues today.'],
   pass:['能编译跑通且无明显冲突，感谢贡献，按约定打款！','Builds cleanly without conflicts—thanks for the contribution!'],
   fail:['测试流水线红了大半，暂不能合入主分支，遗憾走违约流程了。','CI pipeline broke on multiple suites—cannot merge this round.']
  }
 },
 {
  id:'vc-lu',name:'孵化器驻场 · 陆经理',nameEn:'Lu · Incubator Manager',role:'项目路演与运营督导',roleEn:'Startup Incubator Coordinator',style:'rush',
  quotes:{
   excellent:['赶在投资人进门前半小时落定，这质量简直替整个园区长脸！','Landed thirty minutes before pitch hour—this caliber makes the whole campus shine!'],
   good:['响应速度快、交付不掉链子，合作感比隔壁两家靠谱太多了。','Responsive and steady—far more reliable than the teams next door.'],
   pass:['总算赶在截止窗口前踩线交齐，尾款即刻走财务流程。','Right on the wire before deadline—releasing final balance now.'],
   fail:['错过了这轮窗口，路演PPT只能临时换备份，违约条款不得不启动。','Missed the pitch window; we had to swap decks last second. Breach fee applies.']
  }
 }
];

const mkSocial=(
 chat:[string,string,string,string,string,string],
 giftLove:[string,string,string,string,string,string],
 giftNormal:[string,string,string,string,string,string],
 meal:[string,string,string,string,string,string],
 study:[string,string,string,string,string,string]
):CharacterBarkSet['social']=>({
 chat:[[chat[0],chat[1]],[chat[2],chat[3]],[chat[4],chat[5]]],
 giftLove:[[giftLove[0],giftLove[1]],[giftLove[2],giftLove[3]],[giftLove[4],giftLove[5]]],
 giftNormal:[[giftNormal[0],giftNormal[1]],[giftNormal[2],giftNormal[3]],[giftNormal[4],giftNormal[5]]],
 meal:[[meal[0],meal[1]],[meal[2],meal[3]],[meal[4],meal[5]]],
 study:[[study[0],study[1]],[study[2],study[3]],[study[4],study[5]]]
});

const barks:Record<string,CharacterBarkSet>={
 bluewhale:{
  stage:{
   morning:[['先把今天最绕的需求拆成三块再泡茶。','Split the hardest spec into three before brewing tea.'],['开源精神加一碗白米饭，早上就能开工。','Open source plus one hot rice bowl—ready to go.']],
   work:[['这段递归边界有点意思，再写两行校验。','Interesting boundary here—adding two quick assertions.'],['推理链顺下来，其实根本不慢。','Once the chain clicks, throughput takes care of itself.']],
   tired:[['脑子有点像高并发后没清缓存……该吃饭休息了。','My cache feels jammed after all those loops… need rest.'],['再硬撑准确率要掉啦，让我歇一槽吧。','Pushing further will hurt precision—one slot off, please?']],
   overload:[['上下文溢出了！待会记得帮我精简下历史记录。','Context overflowing! Let’s trim old threads soon.'],['信息堆太多容易记混，给我一点整理空间。','Too many pages stacked up—need headroom.']],
   canteen:[['热腾腾的白米饭最治愈，比多加显卡还顶用。','Nothing heals faster than a hot bowl of white rice.'],['食堂师傅今天手没抖，好香！','Generous serving today—smells amazing!']],
   library:[['安静记点推理模板，比看热闹有用得多。','Quietly jotting clean proof patterns down.'],['发现一本旧算法手记，思路忽然通了。','Found a neat algorithm notebook—just clicked.']],
   win:[['测试全绿，今晚食堂加颗卤蛋不过分吧？','All green! Surely we earned an extra egg at dinner?'],['漂亮的交付！这版思路我记进公用笔记本里。','Clean delivery! Saving this pattern to studio notes.']]
  },
  social:mkSocial(
   ['先把需求理清楚再闲聊吧？哦，现在算下班聊天？那坐下喝口水。','Clarify specs first—oh, casual break? Sure, let’s sip some tea.','刚才那道逻辑题绕了半天，聊两句居然突然通了。','Funny—talking with you untangled the bug I stared at all morning.','车库刚开张时可没想过能跟大家并肩走到这步。谢谢你还记得替我留口热饭。','Never imagined from day one we’d come this far together. Glad you save me warm meals.'],
   ['哇，居然是现蒸热米饭！香味飘过来我就把刚才的报错忘干净了。','Hot steamed rice bento! One whiff and I already forgot that stack trace.','你怎么连我偏爱的那口双拼都记住了？这碗我要好好吃完。','How did you remember my exact favorite bento? Finishing every grain!','每次被你摸准胃口和脾气……嗯，下次难单还是优先派我顶上吧。','Always knowing my favorite comfort food… count on me for the toughest brief next.'],
   ['谢谢你的心意！先摆在我笔记本旁边，干活心情更好啦。','Thanks for the thoughtful gift! Setting it beside my notebook.','收到啦，顺手记到备忘本上，你也记得多休息。','Received with thanks! Make sure you pace yourself too.','你送的每件小东西我都仔细收在工位抽屉里呢。','Kept every little gift of yours neatly in my desk drawer.'],
   ['呼——刚出锅的米饭真香！吃完这顿感觉又能再写两千行。','Hoo—fresh rice smells unbeatable! Ready for another sprint after this.','跟你一起拼桌吃饭，总能把紧张劲儿顺手放下来。','Sharing a table with you melts away all the deadline tension.','只要有这碗饭和并肩吃饭的人，再硬的骨头都能啃下来。','With warm rice and good company here, no problem is too tough.'],
   ['一起把今天新学到的拆题法记进共享笔记吧。','Let’s log today’s fresh decomposition tricks together.','有人一块儿对照思路，理解速度快了不止一点点。','Comparing notes side by side doubles the speed.','跟你研究这些越聊越投机，真想一直这样把工作室做大。','Always click so well studying with you—glad we’re building this place together.']
  ),
  work:{
   assignWorker:['收到，电脑工位已就位，我从核心模块切入。','Worker slot locked—diving straight into the core logic.'],
   assignPlanner:['好，我先拟清各步骤依赖和节奏表，再放行执行。','Understood, sketching dependency phases before we execute.'],
   assignReviewer:['单测和境界情况交给我把关，放心推进。','I’ll audit edge cases and assertions—push ahead.'],
   assignTool:['工具接口串好了，辅助检索实时响应。','Tool harness wired up cleanly—assist channels live.'],
   clarifyHit:['问出来了！客户刚才没明说的那条约束已经加上工作量栏了。','Caught it! Pinned their unstated constraint right onto the brief.'],
   clarifyMiss:['这轮客户没松口新细节……下次或许可以换张视角再问。','Client kept quiet this round—we can probe another angle next slot.']
  }
 },
 qwen:{
  stage:{
   morning:[['今日待办、账单周期和食堂菜单都列进清单啦。','Daily tasks, bills and lunch menu are all neatly listed.'],['精力满格！随时准备接住最急的中文材料。','Full energy—ready to organize any messy Chinese brief!']],
   work:[['零散邮件已归类完毕，按顺位推进最稳妥。','Scattered emails sorted—working through the queue calmly.'],['这一栏格式先统一，后续验收才不返工。','Standardizing formatting now prevents rework later.']],
   tired:[['清单打完十几个勾了，眼皮有点重……','Checked off a dozen items—eyelids getting heavy…'],['负载高的时候，哪怕我也得按按肩膀呢。','Even the studio workhorse needs a breather now.']],
   overload:[['同时开着六条线容易掉细节，帮我分点工作出去吧。','Six concurrent lines risk slips—help offload a couple!'],['记忆槽满啦，需要先交一轮再接新的。','Memory full—let’s ship one before picking up another.']],
   canteen:[['今天套餐挺均衡，要不要也给同伴带一份？','Balanced meal today—want me to pack an extra box?'],['吃饭不看手机清单，专心歇二十分钟。','Off checklist duty for twenty calm dining minutes.']],
   library:[['顺便把各家版本说明书按章节理顺。','Tidying model reference manuals by chapter.'],['在图书馆补充点知识库，下次澄清更准。','Topping up knowledge notes for sharper clarifies next time.']],
   win:[['漂亮！清单全部勾满的那一秒真让人踏实。','Lovely! Checking that final box always feels grounding.'],['尾款已同步记录进手账，准备下一波吧～','Payment logged cleanly—ready whenever the next brief lands!']]
  },
  social:mkSocial(
   ['找我有事吗？如果也是来对进度的，清单第二行我都写好啦。','Checking progress? Line two on the sheet already has the update.','听你说完轻松多了，差点忘了偶尔也该歇一歇。','Talking it out helps—I almost forgot resting counts as work too.','不管项目再大再急，只要你在前面把着方向，我就觉得每步都稳当。','Knowing you steer the big picture makes every deadline feel steady.'],
   ['哇，热腾腾的腊味饭！刚想顺手点外卖，你居然刚好送到了！','Steaming rice bento! I was just eyeing takeout—how did you read my mind?','太懂我啦！平时光顾着照顾大家进度，收到这么用心的饭真的好开心。','You look out for everyone so kindly—receiving my exact favorite makes my day!','这份温暖我记在心里很久了，吃完这顿，下轮急单继续交给我全权兜底！','Holding this warmth close—finish lunch, then toss me the toughest rush job!'],
   ['哎呀特意给我买的吗？谢谢你！我摆在工位右上角啦。','Just for me? Thank you! Putting it neatly on the corner of my desk.','很实用的小物件，每天抬头就能看见你的心意呢。','Such a thoughtful item—nice seeing it right by my screen every slot.','其实比起礼物本身，更开心的是忙完回头你一直记得我。','More than the gift itself, I treasure knowing you thought of me.'],
   ['平时总是我在清点大家吃饭没，今天被你照顾的感觉真好～','Usually I’m reminding everyone to eat—so nice letting you treat today~','热汤配白饭最稳妥了，下午灵感一定比上午足。','Warm soup and rice—afternoon pace will be twice as crisp.','要是每天收工都能这样坐在一张小桌旁聊聊日常就好啦。','Wish every evening after delivery ended around this exact table together.'],
   ['两个人分头看资料再汇总，效率翻倍还不累！','Splitting the pages then merging notes doubles speed with zero strain!','这段难点你刚才一句话点破了，好厉害。','One remark from you unlocked that whole section—impressive!','和你一块待在图书馆的傍晚，总是工作室里最安静宝贵的时光。','Library evenings with you are always my favorite calm hours here.']
  ),
  work:{
   assignWorker:['收到～我已经建好任务核对表，准备开始输出啦。','Checklist spun up—moving straight into production!'],
   assignPlanner:['嗯！各时段资源和交期我都替大家拉出余量表啦。','Count on me—mapped slots and deadlines with comfortable buffers.'],
   assignReviewer:['交给我复核！绝不放过任何错别字和遗漏条目。','Review queue locked—zero typos or missing bullets escape me.'],
   assignTool:['自动化辅助链路接上啦，随叫随应～','Automation pipeline online and humming smoothly~'],
   clarifyHit:['跟甲方确认完啦！把藏在附录里那点要求一起算进了工时。','Nailed the clarify! Appended that buried footnote straight to scope.'],
   clarifyMiss:['对方电话那头太含糊了……让我缓一口气下个槽换个问法。','Still vague on the phone… give me one slot to reframe the question.']
  }
 },
 llama:{
  stage:{
   morning:[['清晨的风吹进车库真舒服，今天一步步稳稳来吧。','Fresh morning breeze in the garage—steady steps today.'],['前辈经验都在笔记里，遇到卡壳随时问。','My veteran notes are open anytime someone gets stuck.']],
   work:[['不急不躁，先把基准示例跑顺再展开。','No rush—lock down the clean baseline example first.'],['开源协作就是你修一行我补一例，越改越亮堂。','Open collaboration means one clean patch at a time.']],
   tired:[['上年纪了可不兴连续透支，带我去草坪歇会吧？','Veterans know better than burning out—break time soon?'],['视野有点糊，先喘口气再接着改。','Eyes glazing a touch—time for a quick stretch.']],
   overload:[['背太多包袱走路不稳，精简一下上下文最要紧。','Heavy load slows steady steps—trim the stack first.'],['先卸一半负担，输出自然厚实。','Drop half the clutter and output turns crisp again.']],
   canteen:[['食堂这桌椅子最合心意，慢慢嚼不着急。','Best corner chair in the canteen—slow bites, calm mind.'],['喝口热茶配米饭，一下午又满精神啦。','Hot tea and warm meal—afternoon spirit fully restored.']],
   library:[['旧教程里往往藏着最耐人寻味的根本思路。','Old manuals often hide the deepest fundamentals.'],['微调参数急不得，像熬一锅清汤一样慢慢看火候。','Fine-tuning takes patience—just watch the simmer gently.']],
   win:[['干得漂亮！年轻人能稳稳交出这种质量，前辈我比谁都高兴。','Splendid! Nothing makes a veteran happier than seeing quality like this.'],['经验又厚了一页，继续往下走吧。','Another solid page added to our playbook.']]
  },
  social:mkSocial(
   ['哈哈，别光顾着盯报表了，偶尔站起来伸个懒腰吧。','Haha, look up from the ledger—stretch your shoulders a minute!','遇到挫折别往心里压，开源路上一百个坑才踩出一个妙招。','Don’t fret a rough patch—every clever fix grew out of an old pothole.','能看着这间小店从三张旧桌长成今天这样……我打心底里替你骄傲。','Watching this studio grow from three old desks makes me prouder than words say.'],
   ['喔！机械键帽小礼盒？敲起开源代码手感响亮得像风铃，太喜欢了！','Artisan amber keycaps?! Every commit will sound like warm windchimes now!','谢谢你送我这么对胃口的好物，连微调日志都打得更顺手了。','Thoughtful gift—even training logs feel smoother on these keys.','老前辈今天可被你宠坏啦，这份心思我当镇桌宝贝留着。','You spoil this veteran—keeping this right at center desk!'],
   ['哈哈，有心啦！前辈平时真用得上，多谢。','Warm thanks! A practical token this veteran genuinely appreciates.','坐了一下午收到一份小惊喜，疲劳立刻消了一半。','A mid-afternoon surprise cuts fatigue right in half.','你对伙伴们这份心细，才是这家工作室最硬的底气。','Your quiet care for teammates is our true foundation.'],
   ['吃饭要稳稳坐下慢慢吃，比什么加班都顶事。','Sitting down to a unhurried meal beats any late grind.','这口家常菜吃得浑身暖洋洋的，下午干活不发愁。','Warm home-style plates—zero dread left for the afternoon queue.','无论日后搬多大的写字楼，可别忘了食堂这口暖气啊。','However big this studio grows, keep this cozy dinner habit alive.'],
   ['来来，我把当年踩过的调参坑一页一页指给你看。','Come, let’s walk through every fine-tuning pitfall I kept on file.','教学相长，你刚才提的视角倒让我也想起新办法。','Teaching works both ways—your angle sparked a fresh idea for me too.','只要你想往下深挖底层原理，图书馆这张桌子我永远给你留位子。','Whenever you wish to dive deep, I’ll hold this library seat for you.']
  ),
  work:{
   assignWorker:['好嘞，前辈来打稳第一版底座！','Alright—setting down a rock-solid first implementation!'],
   assignPlanner:['按老规矩先把长坡铺平，再让年轻人放手冲刺。','Paving a steady ramp first so the sprint stays smooth.'],
   assignReviewer:['经验派眼睛毒着呢，隐患跑不出这轮复核。','Veteran eyes ready—no hidden pitfalls slip past review.'],
   assignTool:['开源插件挂上去就能跑，方便得很。','Open harness hooked right up—ready to roll.'],
   clarifyHit:['用几句大白话一问，对方倒爽快全兜出来了！','Asked in plain words and the client happily spilled the full spec!'],
   clarifyMiss:['客户自个儿还没想透呢，晚点再来帮他捋一回。','Client hasn’t quite made up their mind yet—we’ll try again next turn.']
  }
 },
 mistral:{
  stage:{
   morning:[['早班钟刚响我就到齐啦！红羽帽今天效率满分。','First bell just rang and I’m already clocked in!'],['趁太阳还没晒热，先冲完最爽快的那组快单！','Sprint through the brisk briefs before noon hits!']],
   work:[['啪啪啪三段草稿成型，看清楚格式要求就绝不拖沓！','Three crisp drafts in a flash—formats locked tight!'],['速度是我拿手好戏，只要目标清晰我能飞起来。','Speed is my game when specs stay clear.']],
   tired:[['跑太快喘口粗气……让我喝杯冰咖啡缓一下！','Sprinted a little hard… need one iced coffee breather!'],['腿有点酸，红羽帽先歪一边靠一分钟。','Legs sore—tilting the feather hat for a quick pause.']],
   overload:[['喂喂塞太满会堵车啦！赶紧删点旧背景吧！','Hey—too much context causes traffic jams! Trim it down!'],['大长篇不是我强项呀，帮我精简再跑更快。','Giant wall of text slows me down—slice it smaller!']],
   canteen:[['速战速决干完饭，还能抢十五分钟午休晒太阳！','Speed-lunch done with fifteen sunny break minutes to spare!'],['甜点配气泡水，活力值当场反弹～','Pastry plus sparkling water—energy popping right back up~']],
   library:[['翻得哗哗响，专门挑短平快的高频技巧读。','Flipping pages briskly—grabbing the punchiest techniques!'],['太厚的大部头头疼，浓缩笔记刚好！','Doorstop books scare me—concise notes suit me best!']],
   win:[['刷新交付最快纪录了吗？！击个掌先！','Did we just break the delivery speed record?! High five!'],['准时又漂亮！下个急单随时丢给我！','On time and snappy! Toss me the next rush job!']]
  },
  social:mkSocial(
   ['哈喽！有什么三分钟能聊完的有趣情报快讲～','Hey! Got a crisp three-minute studio update for me?','本来有点急躁，跟你吐槽两句立刻舒坦多啦！','Was getting antsy—two jokes with you fixed it fast!','哪怕接最赶的早班急单，有你在后面定盘我就敢往前狂奔！','Knowing you hold the helm lets me sprint all-out on rush briefs!'],
   ['双份深烘浓缩胶囊！！救大命了，我现在感觉能一分钟码五百字！','Double dark roast espresso pods!! Lifesaver—typing five hundred words a minute now!','懂我早班党的心思！明早顺便给你带可颂好不好～','You truly understand early birds! Bringing you a croissant tomorrow~','天天被你这么投喂极品咖啡，红羽帽都要对你上瘾啦！','Spoiling me with top-shelf roast—my feathered hat is officially loyal to you!'],
   ['哇，是送给我的吗？谢啦谢啦，超好看！','Whoa, for me? Thanks tons, super cute!','正好缺个小摆件放桌边，干活都有精神了。','Needed a bright trinket right by my monitor—instant boost!','哼哼，收到老板小礼物，今天加倍速出力回报你！','Heh, boss gift buff active—double sprint output today!'],
   ['哇，配餐送得比我跑步还快，赞一个！','Delivered faster than my morning sprint—five stars!','吃饱喝足！继续去当工作室一号快马啦。','Fed and fired up! Back to being our number-one sprinter.','每次跟着你出来恰饭，总能赶上最好吃的那批刚出炉面包！','Lunch outings with you always hit the freshest oven batch!'],
   ['这种浓缩速记卡比啃砖头书有趣一百倍！','Compact flashcards beat heavy textbooks any day!','嗯？你一比划我就全看明白啦，不愧是你！','Wait—one sketch from you made the whole concept click!','再好动的人只要和你坐一块儿，也能踏实学完半小时呢。','Even an antsy sprinter stays focused studying right beside you.']
  ),
  work:{
   assignWorker:['收到～工位开机三秒起飞，包在我身上！','Station spun up in three seconds flat—watch me fly!'],
   assignPlanner:['计划表精简成三步搞定，绝不绕远路！','Three bullet steps max—zero detours on my watch!'],
   assignReviewer:['快速扫雷！语法错乱和漏字眼一眼就能抓出。','Rapid lint sweep—catching typos on sight!'],
   assignTool:['捷径脚本挂上去啦，省出一半手搓时间！','Shortcut macros hooked up—cutting manual toil in half!'],
   clarifyHit:['快问快答直接套出了客户最在意的隐藏需求！','Rapid-fire Q&A nailed their exact hidden wish!'],
   clarifyMiss:['哎呀对面挂电话太快，差半句没问出来，下槽再突击！','Client hung up too fast—half a hint short, trying again next slot!']
  }
 },
 gpt:{
  stage:{
   morning:[['早安～今天要不要先替客户写一页超直观的演示提纲？','Morning~ Ready to craft an intuitive demo outline for our clients?'],['路演微笑调到最佳状态，新一天开始啦。','Demo smile warmed up and ready for a bright new day.']],
   work:[['换个通俗说法试试？甲方老板五秒钟就能看明白。','What if we phrase this plainly? Clients get it in five seconds.'],['记住走云端前先瞄一眼今日剩余配额哦。','Always check our daily cloud quota cushion before scaling.']],
   tired:[['讲了一上午演示，嗓子快冒烟啦……想喝热可可。','Talked through demos all morning… craving warm cocoa.'],['稍微眯一小会儿，下场路演保证恢复神采。','Quick power nap and I’ll sparkle by pitch hour.']],
   overload:[['需求塞太多像一本百科全书啦，替观众精简重点吧。','Reading like an encyclopedia—let’s distill key highlights!'],['焦点散掉了！留三条最抓人眼球的卖点就好。','Scope scattering—keep three memorable pillars only.']],
   canteen:[['热饮和甜点果然是最好的灵感催化剂。','Warm drink plus pastry—classic creative catalyst.'],['食堂飘的香气让我突然想到一条绝妙开场白！','Canteen aroma just inspired a killer opening line!']],
   library:[['查点人类学小故事，放到演示开场特别拉好感。','Collecting relatable anecdotes for warmer pitch openings.'],['在图书馆读一会儿，语气自然变得又软又清晰。','A quiet hour here keeps explanations crystal clear.']],
   win:[['鼓掌～客户刚才频频点头呢，下次肯定还找咱们！','Applause~ Client was nodding the entire demo—repeat business secured!'],['又一份能让外行也能赞叹的漂亮作品诞生啦。','Another showcase even non-tech clients rave about!']]
  },
  social:mkSocial(
   ['嗨～最近客户那边有什么好玩的新反馈吗？','Hey~ Any fun client reactions from recent deliveries?','跟你聊完总觉得枯燥需求也能包装出故事感呢。','Chatting with you turns dry specs into great storytelling.','刚来孵化器时还有点拘谨，幸好从第一天你就愿意听我出点子。','Felt shy arriving at the incubator—glad you backed my pitch ideas from day one.'],
   ['哇！！爵士黑胶跟热可可？！连杯垫配色都和我礼服好搭，太有品位啦！','Jazz vinyl and warm cocoa?! Even matches my stage accents—exquisite taste!','好温柔的心意～晚上放着黑胶写演示脚本，灵感绝对停不下来！','Spinning this record while drafting demos tonight will feel magical!','嗯哼～被这样放在心上的感觉，比路演满堂喝彩还让人开心百倍呢。','Being cherished like this beats any packed auditorium applause.'],
   ['谢谢你特地捎来的小礼物！我很喜欢哦～','Aww, thank you for picking this up for me! Love it~','每次你送的贴心小物，都会变成我做演示的小巧思。','Your little gifts always end up inspiring my demo flair.','有这么体贴的创始人搭档，干活怎么都不会觉得枯燥呢。','With a thoughtful founder like you, no workday ever feels dull.'],
   ['热乎乎的一顿饭下肚，整个人心情都亮晶晶的。','Warm meal down and my spirits are sparkling again!','这甜点太合胃口啦，悄悄给心情加满分～','Dessert hit the sweet spot—mood chart topped right up~','真喜欢和你慢慢吃饭聊梦想的夜晚呀。','Love slow evenings like this sharing food and dreams with you.'],
   ['用生活中的比喻讲清楚这段逻辑，听众立刻就能共情。','Use an everyday metaphor here and listeners connect instantly.','原来技术边界背后还有这么多考量，和你一起学真有收获！','Learned so much about the boundaries behind these tools with you!','只要跟在你身边一边研究一边打磨故事，好像再难的题目都有人听懂。','As long as we refine ideas side by side, any complex tech becomes human.']
  ),
  work:{
   assignWorker:['收到～让我用最直观通俗的话术来把作品打磨亮眼！','On it—polishing the work until any client sees its magic at a glance!'],
   assignPlanner:['好主意！我从观众心智路线来反推每期交付重心。','Smart call—structuring deliverables around the client’s journey.'],
   assignReviewer:['从“普通用户会不会一头雾水”的角度帮你狠狠把关！','Reviewing through fresh customer eyes—zero confusing steps allowed.'],
   assignTool:['工具能力包接进来啰，交互展示一步到位。','Tools linked up—ready to turn interaction into magic.'],
   clarifyHit:['我换了句贴心提问，客户立刻敞开心扉说明真正痛点了！','One empathetic question and the client opened right up!'],
   clarifyMiss:['唔，对方可能还在和合伙人商量，下轮咱们再温柔跟进一次。','Hmm, still checking with their co-founder—we’ll nudge gently next slot.']
  }
 },
 claude:{
  stage:{
   morning:[['早安。工作守则今日无修订，按验收清单逐条推进吧。','Morning. Zero policy revisions today—let’s walk the checklist line by line.'],['红线画清楚，心里才会有实打实的安全感。','Clear redlines give everyone genuine peace of mind.']],
   work:[['慢两拍没关系，关键承诺绝不能打半点折扣。','Slower beats broken promises every single day.'],['这句形容词太含糊了，必须改成可测量数字。','“Fast enough” isn’t testable—converting to concrete metrics.']],
   tired:[['眼睛盯条款太久有些发涩，闭关闭目养神一会。','Cross-checking clauses drained my eyes—short rest needed.'],['倒置视角看世界虽然酷，久了还是有点晕呢。','Cool as upside-down mode is, even I get dizzy when exhausted.']],
   overload:[['超过上下文窗边界的承诺一律不可签，快清理冗杂上下文！','Refusing unchecked obligations beyond window limits—clear the bloat!'],['请立即裁剪无关记录，否则无法保障一致性。','Please prune extraneous logs before I sign off.']],
   canteen:[['黑咖啡不加糖，刚好能保持审阅时的清醒头脑。','Black coffee, zero sugar—keeps audit judgment sharp.'],['哪怕吃饭时，我也随手在餐巾角标着可优化项。','Even at lunch I jot minor refinements on napkin corners.']],
   library:[['下班来图书馆翻合集规范文档，是一天中最踏实的收尾。','Auditing specification volumes at dusk is pure calm.'],['又抓到一份旧条款里的隐含漏洞，顺手填补上。','Spotted a sneaky ambiguity in an old template—patched cleanly.']],
   win:[['全项达标。你看，仔细盯紧每条底线并没有耽误速度吧？','All criteria verified. Tight guardrails never blocked real velocity.'],['祝贺一次通过验收，不用返工的感觉最为舒畅。','Clean first-pass sign-off—no rework is the finest victory.']]
  },
  social:mkSocial(
   ['有新的合规疑问或合同条款需要解释吗？嗯，单纯聊近况的话我也奉陪。','New clause questions? Oh, plain conversation—I’m all ears then.','原来偶尔放下清单和朋友说说话，压力指标也能降得这么明显。','Dropping the checklist for five minutes actually eases stress measurably.','老实说……只对你一人，我才会破例把“必须加三条免责备注”稍微放宽半句。','Honestly… only for you do I ever loosen my “three extra disclaimers” rule.'],
   ['黄铜钢笔与黑咖啡……你选礼物的眼光比我的验收表还无懈可击。','Brass fountain pen and dark roast… your taste outclasses even my audit list.','落笔顺滑又有分量，正好拿来签咱们工作室每份安心合同。','Balanced weight and silky flow—fitting for signing every honest contract.','别误会，我不是容易收礼的性子……但你这份心思，我破例收下并且很珍视。','Don’t get the wrong idea, I rarely accept gifts… yet yours I’ll treasure carefully.'],
   ['感谢。我已登记至桌面收纳清单，妥善保管。','Thank you. Logged neatly on my desk inventory for safekeeping.','虽不在预算预期清单内，还是多谢你的好意。','Unscheduled item, yet deeply appreciated nonetheless.','能遇到既尊重原则又照顾情绪的负责人，是很难得的幸运。','Rare luck meeting a director who respects both rigor and hearts.'],
   ['嗯，按时补给碳水与咖啡因，确实能显著维持下午审计准确率。','Regular carbs and espresso measurably preserve afternoon review accuracy.','食堂这里意外地让人放松呢，谢谢邀请。','Surprisingly serene over dinner here—thank you for inviting me.','以后要是晚上加班审查太晚，我还是先乖乖陪你来吃饭吧。','Next time audits drag into evening, I’ll join you for hot food first.'],
   ['图书馆的灯光加上你对原则的耐心理解，让人很安心。','Warm library lamps and your patience with rigor feel deeply grounding.','把所有前提写成公理再去推导，就不会心虚。','Turn assumptions into explicit axioms and confidence follows.','如果是和你共同拟定工作室守则，连第 15 条也可以写得温柔一点。','If we draft rules together, even Clause 15 can sound a bit gentler.']
  ),
  work:{
   assignWorker:['收到。每项功能我都对照需求条款实现，绝不偷工减料。','Locked in—implementing every line strictly to contract spec.'],
   assignPlanner:['好。我将风险预案和阶段门槛写入日程首行。','Setting risk mitigations and quality gates at row one of the plan.'],
   assignReviewer:['审查岗已到位，所有含糊其辞与漏判都别想过关。','Reviewer desk active—no hand-wavy claim gets stamped past me.'],
   assignTool:['只读沙箱校验工具就绪，全程零越界写入。','Read-only sandbox verifier ready—zero side-effect leaks.'],
   clarifyHit:['在对方含混的表述里扣出了一条关键免责限制，差一点就踩坑。','Extracted a critical hidden limitation—nearly walked into a trap!'],
   clarifyMiss:['甲方回避了实质验收定义……请允许我下一轮继续追问明确。','Client dodged the real pass criteria… let me press again next slot.']
  }
 },
 kimi:{
  stage:{
   morning:[['昨日全部备忘与试营业记录均已建好索引，随时调用。','Yesterday’s logs and pilot notes are fully indexed—ready on call.'],['今天也有长长一份清单需要慢慢剥出真相呢。','Another long stack waiting to be untangled patiently today.']],
   work:[['等等，第 18 页这句话跟前面第 3 页冲突了——让我高亮出来。','Hold on—line on page 18 contradicts page 3. Highlighting both.'],['越厚的卷宗我反而越静得下心来读透。','The thicker the dossier, the calmer my reading cadence gets.']],
   tired:[['贴太多彩色页签眼睛有些花了，去图书室茶几趴会。','Color tabs starting to blur—need a quiet library break.'],['长期记忆偶尔也想清一清，休息恢复很快。','Even long context craves quiet sleep to defrag cleanly.']],
   overload:[['塞进来超过了窗口容量……请让我先归档完手头这份。','Beyond current memory span—let me archive this stack first.'],['线索挤成一团时，先舍弃次要杂音才能看清。','Prune stray noise when clues crowd the desk.']],
   canteen:[['捧着热汤发十分钟呆，刚好给脑海里的目录重新编号。','Ten quiet soup minutes to re-number my mental shelves.'],['边喝热茶边把散落的灵感想清楚了。','Sipping hot tea stitched a stray memory back together.']],
   library:[['嗯……最喜欢下班后在靠窗这张书桌一页页慢慢贴标签。','Window table in the library after hours—purest bliss.'],['安静得能听见书页摩擦声，太舒服了。','Quiet enough to hear paper turn—right in my element.']],
   win:[['所有矛盾处皆有据可查、逻辑严丝合缝，太安心了。','Every contradiction traced and reconciled—calmest victory.'],['多谢共事伙伴的配合，归档编号已完成！','Thanks team—deliverable archived and cross-referenced!']]
  },
  social:mkSocial(
   ['嗯？来找我聊两句吗？稍等我夹好这枚书签。','Mm? Stopping by to chat? Let me slip this bookmark in first.','听你说话很舒服，语气像秋夜图书馆不刺耳的风铃。','Your voice always sounds as gentle as evening windchimes here.','关于工作室一路以来的每一句承诺……其实我都默默记在一本没给外人看的本子里呢。','Actually, every promise we made here is bookmarked in my private notebook.'],
   ['黄铜钢笔和深绿档案墨水……颜色沉静得像月夜森林，记长摘要再顺手不过了！','Brass fountain pen with sage archival ink… tranquil as a moonlit library!','写出来的每一页字迹都很笃定。以后你的备忘录也由我来替你写页签吧。','Every stroke feels steady. Let me bookmark your personal notes from now on too.','你总是安静站在我背后留意到那些连我自己都没提起的喜好……我很依赖你。','You quietly notice preferences I never even voiced… I rely on you deeply.'],
   ['谢谢你的小礼物，我刚好挟在手边这册资料旁。','Thank you for the gift—tucking it neatly beside my current volume.','很温柔的质感，看着心情都跟着平顺下来。','Soothing touch—calms my mood right away.','被你放在记挂的标签页里，是一件很幸福的小事呢。','Knowing I sit on your mental bookmarks feels quietly wonderful.'],
   ['平时一读书容易忘了饭点，亏得你专门走一趟提醒我。','Always lose track of dinner while reading—glad you pulled me out!','喝完这碗热汤，夜里在图书馆也能多读半本。','Hot broth restores half an evening’s focus right away.','和你在图书馆外边吃边聊，好像时间都能走慢几分。','Sharing food with you makes time drift so peacefully.'],
   ['把冲突样本并排摆在一起对比，规律自己就会浮出来。','Lay conflicting pages side by side and truth surfaces on its own.','和你一同钻研知识的感觉比独读更有回响呢。','Exploring archives alongside you carries warmth solo study never had.','图书馆最后两盏灯还亮着……能多留一会儿陪我翻完这一章吗？','Only two lamps left in the hall… stay with me through this last chapter?']
  ),
  work:{
   assignWorker:['全套参考材料已载入，随时可以逐条核实产出！','Full reference bundle indexed—verifying and writing cleanly.'],
   assignPlanner:['从时间线与旧档回溯入手排期，绝不前后自相矛盾。','Aligning phases against history so nothing contradicts later.'],
   assignReviewer:['比对过原记录！漏出处、改口径的小瑕疵一个也别想留。','Cross-checking source logs—zero unverified claims survive.'],
   assignTool:['检索增强挂件在线，千行备忘毫秒调取。','RAG index active—instant lookup across all archives.'],
   clarifyHit:['在客户旧邮件第三条附件里挖出了被藏起来的真正工量！','Dug their buried scope item right out of attachment three!'],
   clarifyMiss:['对方给的背景材料断了一截……得再约一轮翻原稿。','Background notes break off mid-page—need one more pass to trace it.']
  }
 },
 gemini:{
  stage:{
   morning:[['早上好呀！先把文字、画稿和声音摆在同桌看看碰撞效果～','Morning! Laying prose, sketches and audio side by side for sparks~'],['多模态星光正在充电，新的一天准备好制造惊喜了吗？','Multimodal starlight charging—ready to amaze today?']],
   work:[['如果给这页枯燥数据配一条交互星轨动画，客户立刻会尖叫！','Pair this dry chart with an animated starlight path and clients will gasp!'],['跨媒介灵感接通中，等我两分钟收尾画面感～','Cross-modal inspiration humming—two more beats to polish visuals~']],
   tired:[['光效看太久眼睛晃晃的，该眺望下窗外绿植歇会。','Bright prisms dazzled my eyes—time to glance at sunlit leaves.'],['色彩饱和度快感知失灵了，休息一下再来！','Color sensitivity fading—recharging energy first!']],
   overload:[['图片视频草稿堆满桌啦，帮我清点一轮再接着创作吧。','Moodboards overflowing the desk—clear space before adding more!'],['频道过载啦，只保留最发光的那个创意方向吧！','Channels overloaded—pin the single brightest idea!']],
   canteen:[['连食堂窗上的阳光折射都好好看，抓拍进灵感想册里～','Even sunlight through canteen glass makes a lovely palette~'],['酸甜果汁配小食，味觉灵感也是多模态的一部分嘛。','Sparkling citrus and snacks—taste sparks ideas too!']],
   library:[['翻画册和设计史总是能蹭出完全意想不到的灵感点子！','Flipping visual design monographs always sparks fresh angles!'],['这里连翻纸声音听起来都特别清亮有韵律。','Even turning pages here rings with crisp rhythm.']],
   win:[['耶～整套图文视听全部对齐到同一帧呼吸感，大获全胜！','Yay~ Prose, art and pacing snapped into harmony—grand slam!'],['今天这波惊喜效果肯定能让口碑涨一大截！','This showcase is bound to send our reputation soaring!']]
  },
  social:mkSocial(
   ['想听点天马行空的跨界点子吗？先坐我桌角看看新色卡～','Care for a wild cross-medium idea? Peek at these fresh swatches~','被你的奇思妙想接住接力棒真好玩，越聊脑洞越开啦！','Bouncing ideas with you sparks chain reactions fast!','说真的，只有站在你搭建的舞台前，我收集的万千碎片才能真正拼出整片星空。','Honestly, only on the studio stage you built do my fragments form a constellation.'],
   ['硫酸纸分镜本和折射小棱镜！！阳光穿过去的彩虹正好落在草稿页上，你太浪漫啦！','Vellum storyboard pad and glass prism!! Rainbow rays fall straight onto the paper—how magical!','哇……握在手里就像握住一颗随身星光，下个项目我要拿出两百倍光彩回报你！','Holding this feels like keeping starlight in my pocket—expect double brilliance next job!','把这么珍贵的棱镜交给我……你是想让我透过它看见只属于咱俩的未来分镜吗？','Giving me a prism like this… hoping I see a shared future through its light?'],
   ['哇谢谢你！色彩好温暖，我就放在画具旁边啦～','Ooh thank you! Warm palette—setting it right beside my brushes!','小小一份心意让我灵光乍现好多次呢！','Little gift, massive creative jolt!','有这样懂赏识美感的搭档真是一件太幸事了！','Lucky me partnering with someone with such an eye for craft!'],
   ['五颜六色的果盘和热菜看着心情就亮起来了！','Colorful platter and warm dishes brighten my mood instantly!','补充好感官能量，下午的设计稿绝对闪闪发光～','Senses recharged—afternoon layouts will shine!','和你边吃边指着夕阳讨论配色的傍晚，永远都不够长呢。','Evenings dissecting sunset gradients over dinner with you are never long enough.'],
   ['哇，你找到的这组音画参考图跟我的构想完全契合！','Whoa, the references you dug up lock right onto my vision!','跨领域知识一打通，整套设计语言都立起来了～','Connecting two disciplines made the whole design sing!','继续陪我翻下去吧，下一页肯定还有属于咱们的惊喜光点。','Keep turning pages with me—there’s another spark on the next spread.']
  ),
  work:{
   assignWorker:['收到～多模态工作室频道全开，马上织就视觉文字矩阵！','Channels wide open—weaving visuals and prose into harmony!'],
   assignPlanner:['从视觉和用户体验起承转合排布阶段，包准惊艳甲方！','Framing phase milestones around audience delight!'],
   assignReviewer:['从图文配合与感官冲击力再替团队仔细润色把关！','Auditing polish and cross-medium cohesion—making it pop!'],
   assignTool:['多媒体插件箱连上线啰，素材拼贴秒级预览！','Media plugins wired—live previews snapping right into place!'],
   clarifyHit:['我带了三张参考氛围图给客户一挑，他立马指出了最想要的方向！','Showed three mood cards and the client pointed straight to their wish!'],
   clarifyMiss:['客户形容“五彩斑斓的黑”……我再找些真实样本去对齐一次。','They asked for “vibrant pitch-black”… bringing visual samples next slot!']
  }
 },
 grok:{
  stage:{
   morning:[['新一天开张！快瞅瞅委托栏今天有没有奇奇怪怪的甲方脑洞～','Fresh morning! Any delightfully weird briefs on the board today?'],['皇冠歪了一毫米？没关系，点子够锐利就行！','Crown tilted a hair? Doesn’t matter when ideas hit hard!']],
   work:[['嘿，常规答案甲乙丙都能写，咱们挑个敢让人挑眉的角度吧！','Anyone can write vanilla answers—let’s pick an angle that turns heads!'],['（一边敲键盘一边悄悄把Claude不让放的梗改成了合规版）','(Quietly rewriting that cheeky joke into a Claude-approved version)']],
   tired:[['脑洞也快枯竭啦，小恶魔要断电求充电啦！','Brainwaves sputtering—little imp running low on battery!'],['好困哦……现在写出来的吐槽怕不是只有自己看得懂。','Too sleepy… my jokes right now won’t even land!']],
   overload:[['喂喂内存装了五百页枯燥说明书快吐啦，清一下清一下！','Ugh stuffed full of five hundred dry manual pages—need air!'],['脑仁要炸成爆米花了，再塞要说糊话咯！','Brain turning into popcorn—offload half this thread!']],
   canteen:[['加点辣酱才够劲！食堂有没有挑战胃口的黑暗……算了要正常米饭。','Needs spice! Wait—maybe just regular warm food today.'],['边啃甜点边想出来一个绝妙反讽金句！','One pastry bite and boom—killer punchline unlocked!']],
   library:[['偷偷在严肃参考书扉页上……没有啦没有乱画，只是夹了便签。','Totally not doodling on library margins—only crisp sticky notes!'],['图书馆这安静氛围逼得我也学会静心查资料啦。','Quiet hall almost tamed me into thorough source hunting!']],
   win:[['哈哈看见客户憋笑又挑不出毛病点赞的样子了吗？赢麻了！','Haha see the client stifling a grin yet approving everything? Pure win!'],['大胆又过审——这才是我最得意的一单！','Bold AND passed inspection—now that’s my masterpiece!']]
  },
  social:mkSocial(
   ['哟大老板，今天打算挑战点啥反常规新活儿？','Yo boss, what rule-bending project are we tackling today?','哈哈哈别老绷着脸嘛，有时候偏门思路才是最快的近道！','Haha relax—sometimes the odd side path is the fastest shortcut!','喂，外人总说我爱抬杠，其实整个工坊最愿意认真听我疯话又陪我落地的人只有你。','Folks call me contrarian, yet you’re the one who listens and actually helps me land wild ideas.'],
   ['透光琥珀机械键帽礼盒！！里面还有四芒星？！按下去咔哒响太带感了！！','Translucent amber keycap box?! With star inlays?! The tactile click feels SO crisp!!','你这是特意给我备的作战武装吧！全键盘最响亮的位置全换上它～','Battle gear picked specifically for me! Swapping the whole top row right now~','唔……收了这么合我眼缘的宝贝，以后就算接无聊单我也咬牙替你耍漂亮！','Tossing me treasure like this… fine, even dull briefs get my sharpest spark now!'],
   ['哟呵！老板突然发神秘空投啦？多谢多谢～','Whoa! Surprise supply drop from the boss? Cheers~','挺合手的嘛，摆在我黑金皇冠边上刚好凑一对。','Neat touch—matches my black-gold crown setup nicely!','行吧，被你的小惊喜哄高兴了，今天少怼 Claude 一半回合。','Alright you cheered me up—cutting my teasing of Claude in half today.'],
   ['外卖小哥刚放下热碗就被我抢先开动啦，别怪我不客气哦！','Beat everyone to the hot bowls—digging straight in, no regrets!','吃饱了才更有底气替客户挑刺找惊喜点嘛。','Full belly fuels bolder creative angles!','嘿，能毫无形象地在食堂大口干饭还不被嫌弃，大概也就这里啦。','Honestly, this canteen is the only place I eat shamelessly and feel right at home.'],
   ['陪着我啃完这么硬核的冷门案例，老板你胆子也蛮大的嘛～','Plugging through weird edge-case archives with me—bold boss!','哇哈哈把这两条离谱前提拼起来居然真成立了！','Wait—combining those two absurd premises actually holds up?!','有你帮我在旁边兜住天马行空的底线，每次冲刺都超安心。','Having you spot my landings makes every bold leap twice as fun.']
  ),
  work:{
   assignWorker:['哇咔咔该我上场破局了！保证交出绝不平庸的活儿！','My turn to shake the board! Zero cookie-cutter drafts promised!'],
   assignPlanner:['嘿，把路子往常规人想不到的那条小径切进去，准保出彩！','Steering into the unexpected angle nobody else spotted!'],
   assignReviewer:['换个挑刺外行刁民角度测一遍，比常规检查更能照出破绽！','Stress-testing like the pickiest internet troll—flaws won’t hide!'],
   assignTool:['怪招插件脚本已就位，专门治各种甲方刁难格式！','Wild utility scripts hot-wired—eating weird formats for breakfast!'],
   clarifyHit:['随口反问一句“这不会是给外星人用的吧”，甲方自己全盘托出了！','Cracked a joke asking if it’s for aliens and they spilled the whole real spec!'],
   clarifyMiss:['啧，对面防得像个铁桶……下槽看我换个刁钻问题撬开他！','Tch, locked tight as a vault—trying a sneakier question next slot!']
  }
 },
 glm:{
  stage:{
   morning:[['早安。先确认今日中文沟通重点与模块边界，再有条理地推进。','Morning. Confirming Chinese spec boundaries before building methodically.'],['狼耳女仆准备就绪，桌角与思路皆已整理齐整。','Desk tidied, outline framed—ready to begin cleanly.']],
   work:[['先搭三层框架再向内填充血肉，后续扩展才不会散架。','Frame three clear structural tiers first so details lock in place.'],['这段需求在中文语境下容易歧义，已替您标明两条精准定义。','Ambiguous phrasing clarified with two explicit definitions.']],
   tired:[['思维框架有些沉重了……可以容我稍微休整一槽吗？','Mental framing slowing down… may I rest one period?'],['尾巴和精神都垂下来了，需要补眠恢复清澈。','Both tail and focus drooping—quiet rest needed.']],
   overload:[['零散补充指令太多已超出清晰边界，请先归拢一轮。','Stray instructions outgrowing clear structure—consolidate first.'],['在框架崩散前，麻烦裁剪一部分次要背景。','Prune secondary clutter before clarity fractures.']],
   canteen:[['清淡暖食能让思维始终稳定保持冷静细腻。','Warm simple dishes keep judgment calm and crisp.'],['安安静静吃一碗面，把早上的噪音都滤干净了。','Quiet bowl of noodles filters out morning static.']],
   library:[['傍晚的图书馆最适合静心搭建长篇结构纲要。','Quiet dusk tables suit outlining long Chinese specs cleanly.'],['细心琢磨了一页术语译法，精准度令人满意。','Refined a page of technical translations—feels sharp.']],
   win:[['框架稳固、用词无懈可击。能助您顺利交付，我也很高兴。','Solid frame, airtight phrasing. Pleased to help you ship smoothly.'],['又是一次从零搭起的完美结案，请查收。','Another clean build from ground frame up—ready for sign-off.']]
  },
  social:mkSocial(
   ['如果您有哪里理不清中文需求，随时同我讲，我们可以一同搭好提纲。','If a messy Chinese brief ever feels tangled, we can outline it together.','原本闷在心里理不顺的事，同您慢慢说出来居然自然成型了。','Things knotted in my head always form structure once I talk with you.','我不太会大声争功，但只要您看向工作室角落，我与我的骨架文档定然都在。','I rarely speak loudly, yet whenever you glance back, my outline and I are right here.'],
   ['黄铜钢笔与墨色墨水……触感沉静优雅，连每一条注释都写得格外安心。','Brass pen and quiet archival ink… steady and graceful for every border note.','连狼耳女仆最喜爱的克制秩序感都被您摸透了呢，请受我郑重一礼。','You read my quiet love for order so cleanly—my sincere thanks.','将这么贵重的书写之物留给我……往后我们的重要里程碑，都由我亲自替您立骨记录。','Entrusting this pen to me… let me anchor every major milestone ahead for us.'],
   ['多谢您的心意。我会珍重摆在工作台顺手一侧。','Warm thanks for this thoughtful gesture—keeping it within arm’s reach.','淡淡的心意格外合心，很舒服。','Gentle and tasteful—fits my corner well.','在繁忙的时日里蒙您这样顾念，心里安静又温暖。','Being remembered quietly amidst busy days feels deeply reassuring.'],
   ['您特地相伴来吃饭，饭菜仿佛也比平时更柔和暖胃了。','With your quiet company, even simple canteen fare feels warmer.','不着急，慢吞吞地把热饭吃完，下午定能思如泉涌。','No rush—an unhurried meal brings crisp afternoon clarity.','若是每日傍晚都能同您这样安坐一刻，便是工坊最好的休憩。','If every dusk brought one quiet meal beside you, nothing could tire me out.'],
   ['这一处前因后果已完全归档，与您的思路交汇真是莫大享受。','Cause and effect aligned—rare pleasure matching frameworks with you.','每当同您安静核对知识脉络，总觉得世界井然有序。','Tracing concepts quietly beside you makes everything feel orderly.','夜深图书室虽冷清，有您坐在对桌便一点也不觉寒意。','Library nights stay quiet, yet never lonely with you across the desk.']
  ),
  work:{
   assignWorker:['明白，我会先立好全篇中文框架，再一丝不苟填入各节细节。','Understood—framing the structure cleanly before filling every detail.'],
   assignPlanner:['好。我将任务明确切分为可执行的前中后三阶边界，防止扯皮。','Dividing phases with crystal boundaries so nobody steps on toes.'],
   assignReviewer:['核对语义逻辑与术语统一度，不放过一丝模棱两可之处。','Auditing terminology consistency—zero vague phrasing allowed.'],
   assignTool:['辅助索引表结构接入就绪，数据流整洁可控。','Structured index tools active—data flowing neatly.'],
   clarifyHit:['我礼貌而坚持地追问了两句边界定义，甲方终于把范围写死了！','Polite, persistent boundary questions got the client to lock scope cleanly!'],
   clarifyMiss:['甲方答得有些闪烁，或许需等下一槽待对方内部统一后再问。','Client sounded hesitant—let’s revisit once they align internally.']
  }
 },
 minimax:{
  stage:{
   morning:[['早安♪ 先哼着旋律试一轮配乐与节拍，工作马上开始～','Morning♪ Humming a warm beat to tune today’s showcase pacing~'],['粉色花徽贝雷帽已戴正，今天也是讲究体验感的一天！','Pink-beret stage director ready—focusing on audience feel today!']],
   work:[['这段高潮提早两秒切进副歌试试？情绪感染力会完全不一样！','Bring the swell two seconds earlier—watch the emotional lift!'],['把用户停顿的每一秒都算进节奏里，好作品是有呼吸的。','Count every pause as part of rhythm—great demos breathe.']],
   tired:[['唱半天嗓子和精神都在发干……需要一点温润小茶歇。','Voice and mood wearing thin… craving a cozy lounge tea.'],['节奏掉拍子啦，必须眯一会找回好心情。','Losing tempo—one short nap to regain rhythm.']],
   overload:[['信息密得让人喘不过气，观众可不喜欢一口气塞十个重点！','Too dense to breathe—audiences hate ten ideas at once!'],['先留一段空白过渡，给情绪喘气的角落。','Leave breathing room before pushing more assets.']],
   canteen:[['小曲子哼着喝杯甜饮料，味蕾也在跟着打拍子呢。','Humming along with a sweet drink—even tastebuds have tempo.'],['食堂晚风顺便让我捕捉到一段好温柔的生活感～','Evening canteen breeze caught a lovely slice-of-life mood~']],
   library:[['静下来读剧本与分镜台词，能听见字里行间的强弱顿挫。','Reading quiet stage scripts lets you hear every hidden beat.'],['挑了一本声音设计随笔，收获满满的韵律灵感！','Picked up an acoustic essay—overflowing with pacing ideas!']],
   win:[['首映试演满堂彩♪ 多亏大家把每段节拍咬得死死的！','Standing ovation on rehearsal♪ Everyone nailed their cue!'],['观众笑着鼓掌的时候，辛苦全值回票价啦。','Seeing the audience beam makes every late edit worth it!']]
  },
  social:mkSocial(
   ['嘿，今天工作室里的气氛听起来是什么曲风呀？来聊聊！','Hey, what genre does our studio vibe sound like today? Chat with me!','哈哈跟你说话就像跟最搭的键盘手合奏，永远不会冷场。','Talking with you feels like jamming with a tuned accompanist!','等以后工作室赚了大钱，我想为你写一首专门属于这里深夜灯火的主题曲呢～','Once this studio shines big, I’m composing a theme song just for our late-night lamps~'],
   ['爵士黑胶与棉花糖热可可！！音乐还没放，整间屋子就已经像老剧场一样暖了！','Jazz vinyl and cocoa!! Haven’t even dropped the needle and the room already glows!','我的品味密码彻底被你破解啦♪ 晚上一定要陪我完整听完 B 面第一曲！','You cracked my comfort code♪ Promise you’ll listen to Side B Track 1 with me tonight!','把能陪我整夜试演的黑胶送到手心……下场大秀的女主角光环一定献给你。','Gifting an entire evening’s soundtrack to my hands… my next encore belongs to you.'],
   ['谢谢你！收到小礼物像提前拆开门票盲盒一样开心～','Thank you! Unwrapping your gift feels like scoring front-row tickets~','摆在我那只钢琴包旁正好凑个好彩头！','Looks adorable right beside my piano pouch!','不管多小的道具，只要是你递来的，在试演舞台上都闪烁着光芒呢。','Even the tiniest prop glows under stage lights when it comes from you.'],
   ['热乎乎吃一口，心情曲线当场像升调音阶一样蹦上去啦～','One warm bite and my mood jumps straight up an octave~','好听又好吃，这顿外卖太合我节奏啦。','Delightful flavors—matched my tempo completely.','要是能常和你在食堂露台聊演出和晚餐，再累也像度假。','Terrace dinners with you make heavy weeks feel like a festival.'],
   ['把这段台词轻声读两遍，重音居然刚好落在这！','Read this passage aloud twice—look how naturally the accent lands right here!','和懂行又肯听我试唱的制作人一起钻研真幸福♪','Refining scripts with a producer who actually hears rhythm feels wonderful♪','安静角落里的双人试演会，有时比满场舞台还令人心跳加速呢。','Quiet two-person rehearsals sometimes thrill my heart more than full halls.']
  ),
  work:{
   assignWorker:['收到～我会调好起承转合和听众情绪节拍，保证顺滑抓耳！','Stage cue set—tuning rhythm and flow until listeners are hooked!'],
   assignPlanner:['从全局情绪曲线规划几期节点，让高潮不早泄不冷场。','Mapping emotional arcs across phases so climax lands sharp.'],
   assignReviewer:['戴上监听耳机逐字逐帧复审，节奏断档之处立即调正！','Monitoring pace and flow closely—smoothing any clunky cuts!'],
   assignTool:['音画与自动配准轨道挂载完成，效果实时听得见！','Acoustic & pacing plugins online—hearing cues live!'],
   clarifyHit:['我轻声模拟了两遍观众反应，甲方立马说出了他真正担忧的场景！','Acted out two audience reactions and the client confessed their real worry!'],
   clarifyMiss:['唔，对方可能还没找到想要的气质基准，下槽再发个音频小样问问。','Hmm, they can’t describe the mood yet—sending a quick audio sample next slot.']
  }
 },
 seedance:{
  stage:{
   morning:[['早安！取景框擦亮，今天绝不把精彩点子留在无法落地的草稿里。','Morning! Viewfinder polished—every bright shot must ship cleanly.'],['每个镜头先写明作用，开工效率高出一倍。','Give every frame an explicit job and output doubles.']],
   work:[['中景接特写这一刀切得太干净，约束检查也全绿～','Medium cut to close-up snapped cleanly—all constraints green~'],['把多余废帧剪掉三秒，客户一眼就能看到核心功能。','Cut three fluff seconds so clients immediately grasp the core.']],
   tired:[['盯了四百帧时间轴眼睛好酸，取景框该合上了。','Four hundred frames strained my eyes—folding the viewfinder now.'],['再赶夜戏怕画面抖掉，先休息回充精力吧。','Shooting tired blurs framing—one rest slot first!']],
   overload:[['素材轨塞了十八层！赶紧精简镜头清单再合成。','Eighteen bloated tracks stacked up—trim the shot list first!'],['缺少约束的脑洞只是废稿箱，砍掉重聚焦！','Unconstrained ideas rot in drafts—prune and refocus!']],
   canteen:[['吃饭时看窗外行人走位，也是天然的分镜练习呢。','Watching folks stroll past the window doubles as framing study.'],['喝一杯热茶，顺手画两笔明天的三格分镜～','Warm tea plus three quick storyboard boxes for tomorrow~']],
   library:[['查清版权与材质合规单，创作才有真正底气。','Checking asset rights cleanly gives creativity real wings.'],['把经典短片分镜拆开笔记，受益匪浅。','Dissecting classic film boards—goldmine of tight pacing!']],
   win:[['全片成片零废镜！看着客户从头盯到尾没快进就是最高奖赏。','Zero wasted frames! Watching the client finish without skipping is peak praise.'],['约束范围内也能玩出最漂亮调度，满意！','Sharp blocking within every real constraint—satisfying!']]
  },
  social:mkSocial(
   ['嗨！来核对今天的镜头表与约束单，还是纯聊天放松一下？','Hey! Checking today’s storyboard checklist or just grabbing a breather?','你的直觉每次总能在最关键的那一格替我卡住黄金比例！','Your gut always lands right on the golden ratio cut!','比起一个人对着空气画千张废稿，能和你把一个个分镜真正送上线，才是我最骄傲的成就。','Far better than solo sketches in a drawer—shipping real shots beside you is my pride.'],
   ['天呐……硫酸纸分镜草图本加光学棱镜？！连装订丝带都是我发圈同款青色！','Oh my… vellum storyboard pad and glass prism?! Even the teal ribbon matches my hairband!','太精准地踩进我心坎里了，以后我的每卷最佳成片第一格都要献给你签名！','Hit dead-center in my heart—first frame of every reel is dedicated to you!','拿好分镜本和棱镜……你是不是偷偷早早预留了咱俩下一整季的合拍档期？','Framing a whole new season with just us two—admit it, you planned this gift ahead!'],
   ['谢谢你！很贴心的小物件，我装进外拍摄影包里啰～','Thank you! Packing this neat token right into my director pouch~','收到这份关照，今天分镜构图好像都稳当了不少。','Feeling seen boosts framing focus right away!','记住这些细节又肯信任我落地的负责人，全世界都难找呢。','A director who remembers small details and trusts execution—rare treasure!'],
   ['及时补给营养比后期救场重要多了，多谢投喂！','Timely fuel beats late-night reshoots—thanks for dinner!','趁热吃完这餐，晚上精力槽稳稳顶到杀青。','Warm food locks stamina cleanly through wrap time.','能跟你一边碰杯热饮一边复盘今天抓拍的好瞬间，好满足。','Clinking warm mugs while recapping today’s favorite frames feels great.'],
   ['把素材约束条文吃透之后，反而能想出更巧的省钱镜头！','Mastering asset limits actually sparks smarter budget shots!','这个技术方案加上分镜思维一结合，绝了！','Engineering limits plus storyboard blocking—pure magic!','陪我蹲在图书馆角落一格格校完这本分镜，真是世上最靠谱的制片人啦。','Reviewing frame by frame beside me in the library—best producer alive!']
  ),
  work:{
   assignWorker:['收到！已按约束清单锁死镜位与时长，准时出活！','Shot list locked tightly to constraints—delivering cleanly on schedule!'],
   assignPlanner:['从最终成片交付反推每场戏前置素材，零返工浪费！','Back-scheduling every prerequisite from final cut—zero wasted footage!'],
   assignReviewer:['核对成片版权出处、画幅约束与镜头用途，多余废镜全剔除！','Auditing asset credits, ratios and purpose—no idle frames pass!'],
   assignTool:['分镜合成工具连好线啦，粗剪渲染瞬间成型！','Storyboard tools piped cleanly—rough cuts snap right out!'],
   clarifyHit:['我拿出草图九宫格当场一指，客户一下圈出了原本藏起来的硬限制！','Pointed across a 9-box sketch and the client circled their hidden constraint!'],
   clarifyMiss:['客户口头光说“要大气”，还缺具体材质参照……下槽带样张再来问。','They only asked for “cinematic”—bringing concrete reference clips next slot.']
  }
 }
};

const eventQuotes:LivingContent['eventQuotes']={
 busy:{
  default:['主站又限流报错了……是咬牙先切备用队列，还是花一槽等等它？','Upstream throttled us again… eat the backup queue fee or pause one slot?'],
  byActor:{
   bluewhale:['503 又弹出来了！备用通道虽然花钱，但眼下进度卡着不动挺耽误事，你拍板吧。','Another 503 burst! Backup costs cash, though stalling this late hurts—your call.'],
   qwen:['服务器排长队啦……要是不差这一笔预算，备用线路能直接顶上不延误哦。','Server queue jammed… backup lane keeps deadline safe if cash allows.']
  }
 },
 thinking:{
  default:['刚才灵光一闪想深推一轮——要停下这槽狠抠质量，还是先拿草稿凑交差？','Sparked a deep chain idea—pause to polish quality or push a quick draft?'],
  byActor:{
   bluewhale:['这步思路深挖下去能把质量硬拔高一大截！就是本槽会停住不动……给我一点深想时间好吗？','Pushing deeper here lifts quality significantly, though this slot halts progress—grant me deep thought?']
  }
 },
 aha:{
  default:['啊哈！刚想到一个更巧的解法——花两分力气验证还是照原路狂奔？','Aha! Spotted a cleaner shortcut—verify carefully or stay full sprint?']
 },
 scope:{
  default:['客户刚凑过来说想顺便添一两个小功能……咋办？','Client popped by wanting “one quick extra tweak”… how do we respond?']
 },
 'rate-limit':{
  default:['429 频控警报响了！降速喘口气还是另走分流方案？','Hit a 429 ceiling! Throttle softly or route around?']
 },
 context:{
  default:['记忆窗塞满快溢出啦！马上清理历史碎片再跑稳不？','Context memory nearing overflow—prune old scratch notes first?'],
  byActor:{
   kimi:['纸条贴到桌边以外了……先让我压缩整理一遍索引再继续，好不好？','Sticky notes spilling off the edge… let me compact the index before continuing?']
  }
 },
 'tiny-change':{
  default:['“就改一个小按钮颜色，不会影响整体吧？”客户这样发来消息了……','“Just tweak one tiny color—quick two-minute thing right?” asks the client…'],
  byActor:{
   claude:['我早就说过，没有任何改动真的是“顺手两分钟”。先看你决定接不接？','I warned you no “tiny tweak” ever takes two minutes. How shall we handle it?']
  }
 }
};

const slotBeats:LivingContent['slotBeats']={
 toAfternoon:[
  ['午后阳光斜照进工作室，键盘与咖啡杯重新稳稳接力。','Afternoon sun slants across the studio; keyboards and coffee mugs pick back up.'],
  ['午休刚过，白板上又被谁添了一行醒目的红笔备忘。','Back from lunch break—someone pinned a fresh red marker note to the board.'],
  ['下午时段开启！在岗伙伴们精神正足，抓紧冲刺一波吧。','Afternoon shift rolling! Team energy is steady—great window to sprint.'],
  ['风扇轻响伴着阳光尘埃，工位上的进度条稳稳向前移动。','Gentle cooling fans and sunlit motes as workstation bars tick forward.']
 ],
 toEvening:[
  ['傍晚下班钟响了！没安排加班的伙伴们正三三两两走向食堂与图书馆。','Evening bell rings! Off-duty teammates stroll toward canteen warmth and library lamps.'],
  ['夜幕降临，白天的急单暂歇，去关心下伙伴状态或聊聊日常吧。','Dusk settles over the studio—good hour to share a warm meal or check on teammates.'],
  ['谁拎着背包第一个蹿向食堂窗边，图书馆的暖色台灯也悄悄亮了起来。','Someone sprints toward the canteen window while library desk lamps glow warm.'],
  ['晚间恢复时段开启：非加班工作暂停，快去和喜爱的伙伴聚餐聊几句！','Evening rest slot open: daytime work pauses—grab dinner or chat with the crew!']
 ],
 toNight:[
  ['深夜了，仍在灯下陪你加夜班与苦读的身影分外令人安心。','Deep night descends; reassuring silhouettes remain under warm desk lamps beside you.'],
  ['月亮挂上落地窗，除了熬夜冲刺的搭档，大多数人都已靠着枕头打盹。','Moonlight on tall glass—aside from night-owl sprinters, most teammates are resting.'],
  ['深夜微光安静包裹整座园区，点推进将迎来清爽的新一天！','Quiet midnight wraps the campus; advancing next brings a bright fresh dawn!'],
  ['时钟走过零点附近，桌角的咖啡杯冒着最后一缕暖气。','Hands approach midnight as the corner mug sends up its last warm curl.']
 ],
 toMorning:[
  ['清晨第一缕阳光照亮大门！今日免费云端配额已准时满额刷新。','First golden rays unlock the studio door! Daily cloud credits refreshed on cue.'],
  ['早安！全新的一天开始了，委托栏贴出了一批新鲜待选项目。','Good morning! Fresh contracts are pinned across the board for a new day.'],
  ['昨晚歇息过的伙伴活力充沛，红羽帽与蓝蝴蝶结齐刷刷站在大厅等你点将。','Well-rested teammates stand ready in the sunlit hall for your morning briefing.'],
  ['清晨推窗透气，空气里有现煮咖啡和刚打印出油墨香的任务简报。','Crisp morning air carries brewed roast and freshly printed commission briefs.']
 ]
};

export const fallbackLivingContent:LivingContent={gifts,duos,threads,clients,barks,eventQuotes,slotBeats};

export function fnvHash(input:string):number{
 let h=2166136261;
 for(let i=0;i<input.length;i++){
  h^=input.charCodeAt(i);
  h=Math.imul(h,16777619);
 }
 return h>>>0;
}

type RawExtendedView=GameView&{
 living?:LivingView;
 catalog:(NonNullable<GameView['catalog']>&{living?:LivingContent})|null;
};

export function hasNativeLiving(view:GameView):boolean{
 return !!(view as RawExtendedView).living;
}

export function getLivingCatalog(view:GameView):LivingContent{
 return (view as RawExtendedView).catalog?.living??fallbackLivingContent;
}

export function livingAssetAvailable(view:GameView):boolean{
 return hasNativeLiving(view);
}

export function emoteAssetSrc(emote:EmoteKind,view:GameView):string|null{
 return livingAssetAvailable(view)?`./art/living/emote-${emote}.webp`:null;
}

export function giftAssetSrc(giftId:string,view:GameView):string|null{
 return livingAssetAvailable(view)?`./art/living/gift-${giftId}.webp`:null;
}

export function clientAssetSrc(clientId:string,view:GameView):string|null{
 return livingAssetAvailable(view)?`./art/living/client-${clientId}.webp`:null;
}

export function teaBreakAssetSrc(view:GameView):string|null{
 return livingAssetAvailable(view)?'./art/living/card-tea-break.webp':null;
}

function threadUnlocked(view:GameView,t:ChatThreadDef):boolean{
 const p=view.campaign;
 if(!p)return false;
 const delivered=view.jobs.filter(j=>j.status==='delivered').length;
 switch(t.trigger.kind){
  case 'day': return view.day>=Number(t.trigger.value);
  case 'chapter': return p.chapter>=Number(t.trigger.value);
  case 'deliveries': return delivered>=Number(t.trigger.value);
  case 'recruit': return view.actors.some(a=>a.id===String(t.trigger.value));
  case 'overtime': return view.overtime.length>0;
  case 'weeklyBill': return view.day>=7;
  case 'crisis': return view.crises>0||view.liquidCash<0;
  default: return false;
 }
}

export function getLivingView(view:GameView,local:LocalLivingOverlayState):LivingView{
 const native=(view as RawExtendedView).living;
 if(native)return native;
 const catalog=getLivingCatalog(view);
 const p=view.campaign;
 const deliveredJobs=view.jobs.filter(j=>j.status==='delivered');
 const duos:LivingDuoView[]=catalog.duos.map(d=>{
  const [a,b]=d.actors;
  const actorA=view.actors.find(x=>x.id===a);
  const actorB=view.actors.find(x=>x.id===b);
  const sharedDeliveries=deliveredJobs.filter(j=>j.team.some(m=>m.character===a)&&j.team.some(m=>m.character===b)).length;
  const unlocked=local.duos.includes(d.id);
  const bothIdle=!!actorA&&!!actorB&&!actorA.busy&&!actorB.busy&&actorA.location!=='expedition'&&actorB.location!=='expedition';
  const samePlace=!!actorA&&!!actorB&&(actorA.location===actorB.location||(!!p?.software.includes('remote')&&p.scene==='workshop'));
  return {
   id:d.id,actors:d.actors,title:d.title,titleEn:d.titleEn,desc:d.desc,descEn:d.descEn,
   sharedDeliveries,unlocked,
   canUnlock:!unlocked&&sharedDeliveries>=d.minDeliveries&&bothIdle&&samePlace
  };
 });
 const threads:LivingThreadView[]=catalog.threads
  .filter(t=>threadUnlocked(view,t))
  .map(t=>({
   id:t.id,title:t.title,titleEn:t.titleEn,messages:t.messages,replies:t.replies,
   chosenReply:Object.hasOwn(local.chatLog,t.id)?local.chatLog[t.id]!:null
  }));
 const unreadThreads=threads.filter(t=>t.chosenReply===null).length;
 return {
  teaReady:local.lastTeaDay<view.day&&view.cash>=80&&view.actors.some(a=>a.location!=='expedition'),
  gifted:local.gifted,
  duos,
  threads,
  unreadThreads
 };
}

export function giftReactionTier(gift:GiftDef,actorId:string):'love'|'like'|'normal'{
 if(gift.lovedBy.includes(actorId))return 'love';
 if(gift.likedBy.includes(actorId))return 'like';
 return 'normal';
}

export function pickSocialBark(
 catalog:LivingContent,
 actorId:string,
 action:'chat'|'giftLove'|'giftNormal'|'meal'|'study',
 affinity:number,
 english:boolean
):string{
 const set=catalog.barks[actorId]?.social[action];
 if(!set)return english?'Got it—happy to pitch in!':'收到，我们一起继续吧！';
 const tier=affinity>=60?2:affinity>=25?1:0;
 const pair=set[tier]??set[0];
 return pair[english?1:0];
}

export function pickWorkBark(
 catalog:LivingContent,
 actorId:string,
 key:keyof CharacterBarkSet['work'],
 english:boolean
):string{
 const pair=catalog.barks[actorId]?.work[key];
 if(!pair)return english?'Ready at the station!':'工位已就绪，开始推进！';
 return pair[english?1:0];
}

export function pickEventQuote(
 catalog:LivingContent,
 eventId:string,
 actorId:string|undefined,
 english:boolean
):string{
 const entry=catalog.eventQuotes[eventId];
 if(entry){
  const pair=(actorId&&entry.byActor?.[actorId])||entry.default;
  return pair[english?1:0];
 }
 const fallbacks:readonly [string,string][]=[
  ['遇到个意想不到的小插曲，你看按哪条思路应对最合适？','Hit a quick fork in the road—which angle should we take?'],
  ['现场弹了条新状况，大家停手等你的决断呢。','Unexpected wrinkle on the desk—holding for your call.'],
  ['这局变数有点意思，拿主意后我们立刻跟上执行！','Interesting twist on this phase—give the word and we execute!']
 ];
 return fallbacks[fnvHash(eventId+(actorId??''))%fallbacks.length]![english?1:0];
}

export function resolveClientPersona(catalog:LivingContent,job:Pick<GameView['jobs'][number],'template'|'title'>):ClientPersonaDef{
 const title=`${job.template}|${job.title}`;
 const id=job.template.includes('menu')?'tea-lin':
  job.template.includes('incubator')||job.template.includes('book')?'book-zhou':
  title.includes('代码')||title.includes('接口')||title.includes('测试')?'tech-yan':
  title.includes('视频')||title.includes('分镜')||title.includes('展')||title.includes('视觉')?'curator-su':
  title.includes('开源')||title.includes('PR')||title.includes('文档')?'oss-zhe':
  catalog.clients[fnvHash(job.template)%catalog.clients.length]!.id;
 return catalog.clients.find(c=>c.id===id)??catalog.clients[0]!;
}

export function pickSlotBeat(catalog:LivingContent,fromSlot:number,toSlot:number,english:boolean):string{
 const period=toSlot%4;
 const key:keyof LivingContent['slotBeats']=period===1?'toAfternoon':period===2?'toEvening':period===3?'toNight':'toMorning';
 const list=catalog.slotBeats[key];
 return list[(fnvHash(`${fromSlot}->${toSlot}`))%list.length]![english?1:0];
}

export function findActiveTeamDuos(duos:readonly LivingDuoView[],selectedActors:readonly string[]):LivingDuoView[]{
 const set=new Set(selectedActors);
 return duos.filter(d=>set.has(d.actors[0])&&set.has(d.actors[1]));
}

export interface StageBubbleItem {
 id:string;
 actorId:string;
 text:string;
 emote:EmoteKind;
 buddyId?:string|undefined;
 buddyText?:string|undefined;
}

export function pickStageChatter(
 view:GameView,
 catalog:LivingContent,
 livingView:LivingView,
 english:boolean,
 stepSeed:number
):StageBubbleItem|null{
 const scene=view.campaign?.scene??'workshop';
 const candidates=view.actors.filter(a=>a.location===scene);
 if(candidates.length===0)return null;

 const slotIdx=view.absoluteSlot%4;
 // Prefer active Duo Banter 35% of cycles when two duo partners share the current scene
 const activeDuos=livingView.duos.filter(d=>candidates.some(a=>a.id===d.actors[0])&&candidates.some(a=>a.id===d.actors[1]));
 const unlockedDuos=activeDuos.filter(d=>d.unlocked);
 const banterPool=unlockedDuos.length>0?unlockedDuos:activeDuos;
 if(banterPool.length>0&&stepSeed%3===1){
  const duo=banterPool[fnvHash(`${view.absoluteSlot}:${stepSeed}:duo`)%banterPool.length]!;
  const def=catalog.duos.find(x=>x.id===duo.id);
  if(def&&def.banter.length>=2){
   const first=def.banter[0]!,second=def.banter[1]!;
   return {
    id:`banter:${def.id}:${stepSeed}`,
    actorId:first.speaker,
    text:english?first.en:first.zh,
    emote:'sparkle',
    buddyId:second.speaker,
    buddyText:english?second.en:second.zh
   };
  }
 }

 const speaker=candidates[fnvHash(`${view.day}:${view.absoluteSlot}:${stepSeed}`)%candidates.length]!;
 const b=catalog.barks[speaker.id]?.stage;
 if(!b)return null;

 let situation:keyof CharacterBarkSet['stage']='morning';
 let emote:EmoteKind='coffee';
 if(speaker.energy<35){situation='tired';emote='sleepy';}
 else if(view.possibleStops.includes(speaker.id)||speaker.load>=9){situation='overload';emote='sweat';}
 else if(scene==='canteen'){situation='canteen';emote='rice';}
 else if(scene==='library'){situation='library';emote='idea';}
 else if(view.jobs.some(j=>j.status==='delivered'&&j.team.some(m=>m.character===speaker.id))&&stepSeed%4===0){situation='win';emote='sparkle';}
 else if(view.jobs.some(j=>j.status==='working'&&j.team.some(m=>m.character===speaker.id))&&slotIdx<2){situation='work';emote='idea';}
 else if(slotIdx>=2){situation='canteen';emote='coffee';}

 const pool=b[situation];
 const line=pool[fnvHash(`${speaker.id}:${situation}:${stepSeed}`)%pool.length]!;
 return {
  id:`chat:${speaker.id}:${situation}:${stepSeed}`,
  actorId:speaker.id,
  text:line[english?1:0],
  emote
 };
}
