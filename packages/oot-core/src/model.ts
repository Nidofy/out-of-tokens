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
export type Command = {type:'scope';job:string;option:string} | {
    type: 'campaign';
    action: 'project-start' | 'project-next' | 'visit' | 'chat' | 'gift' | 'meal' | 'study' | 'recall' | 'recruit' | 'unlock' | 'switch' | 'train' | 'align' | 'software' | 'hardware' | 'chapter' | 'story' | 'subscribe' | 'expedition' | 'ending' | 'endless' | 'bid' | 'challenge';
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
