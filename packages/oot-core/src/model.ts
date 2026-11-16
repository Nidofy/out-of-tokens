export type Skill = 'code' | 'write' | 'reason' | 'create' | 'media' | 'recall';
export interface Version {
    id: string;
    character: string;
    name: string;
    skills: Record<Skill, number>;
    speed: number;
    price: number;
    stability: number;
    context: number;
    modes: ('cloud' | 'local')[];
    rhythm: number[];
}
export interface Template {
    offerOnly?: boolean;
    proposals?: {id:string;label:string;labelEn:string;template:string}[];
    minChapter?: number;
    id: string;
    title: string;
    description: string;
    weights: Record<Skill, number>;
    workload: number;
    workSlots: number;
    reward: number;
    clarity: number;
    delivery: 'oneshot' | 'multi' | 'retainer';
    qualityLines?: [
        number,
        number,
        number
    ];
    phases?: number;
    category?: 'code' | 'write' | 'research' | 'design' | 'media' | 'data';
    client?: 'expert' | 'normal' | 'novice' | 'rush';
    titleEn?: string;
    descriptionEn?: string;
    requirements?: {label: string; labelEn: string; work: number}[];
}
export interface Card {
    minChapter?: number;
    id: string;
    title: string;
    trigger?: 'bluewhale-cloud' | 'working' | 'code' | 'write' | 'design' | 'media' | 'research' | 'data' | 'multi' | 'cloud' | 'overload' | 'novice';
    titleEn?: string;
    cooldown?: number;
    weight?: number;
    choices: {
        label: string;
        labelEn?: string;
        cost: number;
        multiplier: number;
        effects?: Effect[];
    }[];
}
export interface Content {
    version: string;
    versions: Version[];
    commissions: Template[];
    events: Card[];
    balance?: Balance;
    campaign?: CampaignContent;
}
export type Scene = 'workshop' | 'canteen' | 'library';
export interface ProjectDefinition {
    id: string; chapter: number; title: string; titleEn: string; brief: string; briefEn: string;
    requiredForChapter: boolean; retryCost: number; research: number;
    routes: {id: string; label: string; labelEn: string; description: string; descriptionEn: string;
        steps: {template: string; quality: number; feedback: string; feedbackEn: string}[]}[];
}
export interface ProjectState {route: string; step: number; job: string; attempts: number; history: string[]; completed: boolean}
export interface CampaignContent {
    living?: LivingContent;
    office?: import('./office.js').OfficeDefinition;
    projects?: ProjectDefinition[];
    openingJobs?: string[];
    starterJobs?: string[];
    initial: string[];
    recruits: { character: string; cost: number; reputation: number; minChapter?: number }[];
    software: { id: string; name: string; nameEn: string; cost: number; research: number; requires: string[] }[];
    maxHardware: number;
    maxChapter?: number;
    stories?: {id: string; character: string; affinity: number; text: string; textEn: string; choices: {label: string; labelEn: string; affinity: number; mood: number; research: number}[]}[];
}
export interface Relation {
    xp: number;
    affinity: number;
    location: Scene | null;
    locationUntil: number;
    training: { until: number; version: string; skill: Skill | 'alignment' } | null;
    bonuses: Record<string, Partial<Record<Skill | 'alignment', number>>>;
    stories: string[];
    stress: number;
    hunger: number;
}
export interface CampaignState {
    gifted?: Record<string, string[]>;
    lastTeaDay?: number;
    duos?: string[];
    chatLog?: Record<string, number>;
    office?: import('./office.js').OfficeState;
    projects?: Record<string, ProjectState>;
    finale?: import('./finale.js').FinaleState;
    chapter: number;
    chapterZero: 'pending' | 'passed' | 'missed';
    completed: number[];
    scene: Scene;
    research: number;
    software: string[];
    hardware: Record<'office' | 'compute' | 'storage' | 'network', number>;
    unlocked: string[];
    relations: Record<string, Relation>;
    chapterStarted: number;
    clarifyRng: number;
    subscription: number;
    incidents: {job:string;at:number;deadline:number;resolved:boolean}[];
}
export interface Member {
    character: string;
    role: 'worker' | 'planner' | 'reviewer' | 'tool';
    mode: 'cloud' | 'local';
}
export interface Actor {
    id: string;
    version: string;
    energy: number;
    mood: number;
    load: number;
    busyUntil: number;
    lastOvertimeSlot?: number;
}
export interface Job {
    rewardFactor?: number;
    challengeWeek?: number;
    id: string;
    template: string;
    status: 'posted' | 'accepted' | 'working' | 'review' | 'waiting' | 'delivered' | 'breached' | 'rejected' | 'expired';
    posted: number;
    deadline: number;
    duration: number;
    hidden: number;
    work: number;
    progress: number;
    weighted: number;
    review: number;
    defects: number;
    reworked: boolean;
    advance: number;
    quality: number;
    team: Member[];
    phase: number;
    resumeAt: number;
    qualityBonus: number;
    clarifyingUntil: number;
    reviewCoverage: number;
    revealed?: number;
}
export interface State {
    engineVersion: string;
    contentVersion: string;
    seed: number;
    absoluteSlot: number;
    cash: number;
    quota: number;
    purchased: number;
    localCapacity: number;
    electricity: number;
    debtPaid: boolean;
    crisisSince: number | null;
    bankrupt: boolean;
    rng: Record<'board' | 'event' | 'quality', number>;
    actors: Actor[];
    jobs: Job[];
    pending: {
        card: string;
        slot: number;
        job?: string;
    } | null;
    ledger: {
        slot: number;
        reason: string;
        amount: number;
    }[];
    tokensUsed: number;
    resources: ResourceEntry[];
    loan: number;
    crises: number[];
    reputation: number;
    peakReputation: number;
    founderXP: number;
    runs: number;
    discovered: string[];
    eventLast: Record<string, number>;
    eventHistory: {
        slot: number;
        card: string;
        job: string;
    }[];
    overtime: string[];
    loanGraceUntil?: number;
    loanGraceWeek?: number;
    campaign?: CampaignState;
}
export type Command = import('./office.js').OfficeCommand | {type:'scope';job:string;option:string} | {
    type: 'campaign';
    action: 'tea' | 'duo' | 'chat-reply' | 'project-start' | 'project-next' | 'visit' | 'chat' | 'gift' | 'meal' | 'study' | 'recall' | 'recruit' | 'unlock' | 'switch' | 'train' | 'align' | 'software' | 'hardware' | 'chapter' | 'story' | 'subscribe' | 'expedition' | 'ending' | 'endless' | 'bid' | 'challenge';
    id: string;
    target?: string;
} | {
    type: 'overtime';
    character: string;
} | {
    type: 'loan';
    amount: number;
} | {
    type: 'repay';
    amount: number;
} | {
    type: 'restart';
} | {
    type: 'advance';
} | {
    type: 'choose';
    index: number;
} | {
    type: 'accept' | 'reject' | 'deliver' | 'rework';
    job: string;
} | {
    type: 'clarify' | 'respond';
    job: string;
    character: string;
} | {
    type: 'assign';
    job: string;
    team: Member[];
} | {
    type: 'buy';
    amount: number;
};
export interface DomainEvent {
    type: string;
    message: string;
}
export interface Result {
    state: State;
    events: DomainEvent[];
    error: string | null;
}
export interface ResourceEntry {
    slot: number;
    job: string;
    character: string;
    mode: 'cloud' | 'local';
    units: number;
    quota: number;
    purchased: number;
    electricity: number;
}
export interface Balance {
    startingCash: number;
    debt: number;
    debtSlot: number;
    weekly: number;
    dailyQuota: number;
    upgradedQuota: number;
    localCapacity: number;
    loanLimit: number;
    interest: number;
    eventChance: number;
    rewardScale: number;
    crisisLength: number;
    bankruptcyFloor: number;
}
export interface Effect {
    kind: 'work' | 'quality' | 'defects' | 'mood' | 'compact' | 'reset' | 'tokenRate' | 'cashPercent';
    value: number;
}

export interface GiftDef {
  id: string;                 // 'rice-bento' | 'fountain-pen' | 'espresso-pods' | 'prism-sketchbook' | 'vinyl-coaster' | 'keycap-artisan'
  name: string;
  nameEn: string;
  cost: number;               // 45..70
  desc: string;
  descEn: string;
  lovedBy: string[];          // 2~3 位最爱该礼物的角色 ID（mood +16, affinity +10, stress -10）
  likedBy: string[];          // 2~3 位喜欢该礼物的角色 ID（mood +12, affinity +7, stress -5）
}

export interface DuoBonus {
  kind: 'efficiency' | 'quality' | 'clarify' | 'energySave' | 'defectGuard';
  value: number;              // 例如 efficiency: 0.08, quality: 5, clarify: 0.12, energySave: 2, defectGuard: 1
  mode?: 'local' | 'cloud';   // 可选限定部署模式
  category?: 'code' | 'write' | 'research' | 'design' | 'media' | 'data';
}

export interface DuoDef {
  id: string;                 // 如 'bluewhale-qwen'
  actors: [string, string];   // 字典序两位角色 ID
  title: string;              // 默契词条名（如：白板双拆解）
  titleEn: string;
  minDeliveries: number;      // 固定为 2（并肩完成 2 次委托交付后可解锁茶会）
  bonus: DuoBonus;
  desc: string;               // 机制与剧情说明
  descEn: string;
  banter: { speaker: string; zh: string; en: string }[]; // 2~3 句场景双人接力吐槽
}

export interface ChatThreadDef {
  id: string;
  title: string;
  titleEn: string;
  trigger: {
    kind: 'day' | 'chapter' | 'deliveries' | 'recruit' | 'overtime' | 'weeklyBill' | 'crisis';
    value: number | string;   // 例如 day: 1, chapter: 1, recruit: 'claude', deliveries: 3, overtime: 1, weeklyBill: 1, crisis: 1
  };
  messages: { speaker: string; zh: string; en: string }[]; // 2~4 条群聊发言（speaker 为角色 ID）
  replies: {
    label: string;
    labelEn: string;
    targetActor: string;      // 收到回应的好感加成对象（affinity +2, mood +3）
    responseZh: string;       // 玩家点选后的角色即时追评
    responseEn: string;
  }[];                        // 固定 2~3 条回复选项
}

export interface ClientPersonaDef {
  id: string;                 // 'tea-lin' | 'book-zhou' | 'tech-yan' | 'curator-su' | 'oss-zhe' | 'vc-lu'
  name: string;
  nameEn: string;
  role: string;
  roleEn: string;
  style: 'novice' | 'normal' | 'expert' | 'rush';
  quotes: Record<'excellent' | 'good' | 'pass' | 'fail', [string, string]>;
}

export interface CharacterBarkSet {
  stage: Record<'morning' | 'work' | 'tired' | 'overload' | 'canteen' | 'library' | 'win', [string, string][]>;
  social: Record<'chat' | 'giftLove' | 'giftNormal' | 'meal' | 'study', [[string, string], [string, string], [string, string]]>;
  // social 对应好感度 3 档梯度：Tier0(<25) / Tier1(25-59) / Tier2(>=60)
  work: Record<'assignWorker' | 'assignPlanner' | 'assignReviewer' | 'assignTool' | 'clarifyHit' | 'clarifyMiss', [string, string]>;
}

export interface LivingContent {
  gifts: GiftDef[];
  duos: DuoDef[];
  threads: ChatThreadDef[];
  clients: ClientPersonaDef[];
  barks: Record<string, CharacterBarkSet>; // 覆盖全部 12 名角色
  eventQuotes: Record<string, { default: [string, string]; byActor?: Record<string, [string, string]> }>;
  slotBeats: Record<'toAfternoon' | 'toEvening' | 'toNight' | 'toMorning', [string, string][]>;
}

export interface LivingView {
  teaReady: boolean;          // (p.lastTeaDay ?? 0) < Math.floor(s.absoluteSlot / 4) + 1 && s.cash >= 80
  gifted: Record<string, string[]>;
  duos: {
    id: string;
    actors: [string, string];
    title: string;
    titleEn: string;
    desc: string;
    descEn: string;
    sharedDeliveries: number; // 从 s.jobs（status==='delivered'）中统计两人同队次数
    unlocked: boolean;        // p.duos?.includes(id) ?? false
    canUnlock: boolean;       // 未解锁 && 两人皆在队 && 皆空闲且不远征 && (同场景或同在workshop) && sharedDeliveries >= minDeliveries
  }[];
  threads: {
    id: string;
    title: string;
    titleEn: string;
    messages: { speaker: string; zh: string; en: string }[];
    replies: { label: string; labelEn: string; targetActor: string; responseZh: string; responseEn: string }[];
    chosenReply: number | null;
  }[];
  unreadThreads: number;      // 已触发但 chosenReply === null 的群聊条数
}
