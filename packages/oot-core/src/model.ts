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
}
export interface Card {
    id: string;
    title: string;
    trigger?: 'bluewhale-cloud' | 'working' | 'code' | 'research' | 'data' | 'multi' | 'cloud' | 'overload' | 'novice';
    titleEn?: string;
    cooldown?: number;
    weight?: number;
    choices: {
        label: string;
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
}
export interface Member {
    character: string;
    role: 'worker' | 'planner' | 'reviewer';
    mode: 'cloud' | 'local';
}
export interface Actor {
    id: string;
    version: string;
    energy: number;
    mood: number;
    load: number;
    busyUntil: number;
}
export interface Job {
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
}
export type Command = {
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
    type: 'clarify';
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
