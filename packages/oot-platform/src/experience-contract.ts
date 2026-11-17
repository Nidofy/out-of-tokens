import type { Command, Member, Scene, forecastAssignment } from 'oot-core';
import type { RevisionIdentity, WorkerSnapshot } from './checkpoint-contract.js';

/** Shared contract v1. GameSession implements every method; Worker uses the same pure services. */
export type Condition = 'no-event-interference' | 'resources-available' | 'no-new-defects' | 'personal-condition-unchanged';
export type Certainty = { certainty: 'certain' } | { certainty: 'conditional'; conditions: readonly [Condition, ...Condition[]] };
export type Fact<R extends string = string> = Certainty & {
    reason: R; actorId?: string; jobId?: string; amount?: number;
    unit?: 'cash' | 'quota' | 'capacity' | 'slots' | 'energy' | 'mood' | 'affinity' | 'research' | 'work';
};
export interface NextPeriodPreview extends RevisionIdentity {
    slot: number; nextSlot: number;
    working: Fact<'contract-work' | 'overtime'>[];
    resting: Fact<'idle-recover' | 'night-sleep'>[];
    recoverySkipped: Fact<'sleep-skipped-by-activity'>[];
    waiting: Fact<'next-work-slot' | 'clarify-pending' | 'review-pending'>[];
    stops: Fact<'cloud-quota' | 'local-capacity'>[];
    deadlines: Fact<'due-this-slot' | 'due-next-day'>[];
    bills: Fact<'weekly-bill' | 'debt-due' | 'electricity'>[];
    blocked: null | 'pending-choice' | 'bankrupt' | 'ending' | 'arranging';
}
export interface ActorActivity {
    actorId: string; occupiedSlots: number; occupiesUntil: number | null;
    skipsNightRecovery: boolean; joinsOvertime: boolean; relocatesTo: Scene | 'expedition' | null;
}
export interface ActivityPreview extends RevisionIdentity {
    legal: boolean; error?: string; cash: number; research: number;
    actors: ActorActivity[]; gains: Fact[]; losses: Fact[];
}
export interface Draft { team: Member[]; draftKey: string }
export interface AssignmentSuggestion {
    id: string; kind: 'save-resources' | 'stable-quality' | 'fast-delivery'; team: Member[];
    forecast: ReturnType<typeof forecastAssignment>; advantages: Fact[]; costs: Fact[];
}
export interface SuggestResult extends RevisionIdentity {
    draftKey: string; suggestions: AssignmentSuggestion[]; evaluated: number; truncated: boolean; none?: Fact;
}
export interface DuoExplanation extends RevisionIdentity {
    jobId: string; draftKey: string;
    duos: { duoId: string; state: 'locked' | 'inactive' | 'active'; reason: string }[];
}
export interface CapacityExplanation extends RevisionIdentity {
    actorId: string; context: number; load: number; overloaded: boolean; activeEfficiency: number;
    stations: { jobId: string; stationId: string | null; efficiency: number; energyCost: number }[];
}
export interface FinanceExplanation extends RevisionIdentity {
    cash: number; loan: number; unfinishedAdvances: number; netSolvency: number; bills: Fact[];
    recentLedgerSummary: { count: number; inflow: number; outflow: number; net: number };
}
export interface ExperienceView extends RevisionIdentity {
    learning: { node: 'accept' | 'assign' | 'advance' | 'deliver' | 'clarify' | 'rest' | 'bill'; observed: boolean }[];
    goal: Fact | null;
    receipts: { jobId: string; phase: number; occurrence: number; participants: string[]; facts: Fact[] }[];
}
export interface ExperienceSession {
    previewNextPeriod(): NextPeriodPreview;
    previewActivity(command: Command): ActivityPreview;
    explainTeamDuos(jobId: string, draft: Draft): DuoExplanation;
    explainActorCapacity(actorId: string): CapacityExplanation;
    explainFinance(): FinanceExplanation;
    suggestAssignments(jobId: string, draft: Draft): SuggestResult;
    getExperienceView(): ExperienceView;
    workerSnapshot(): WorkerSnapshot;
}
