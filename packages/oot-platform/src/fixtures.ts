/** Development data only: deliberately absent from the production root entry. */
import { EXPERIENCE_CONTRACT } from './checkpoint-contract.js';
import type { NextPeriodPreview } from './experience-contract.js';
export function experienceFixture(name: 'night-rest' | 'pending-choice'): NextPeriodPreview {
    return {
        contract: EXPERIENCE_CONTRACT, contentVersion: 'fixture-only', revision: 0, lineageId: 'fixture-only',
        slot: 3, nextSlot: 4, working: [], resting: name === 'night-rest' ? [{ reason: 'night-sleep', actorId: 'qwen', certainty: 'certain' }] : [],
        recoverySkipped: [], waiting: [], stops: [], deadlines: [], bills: [],
        blocked: name === 'pending-choice' ? 'pending-choice' : null,
    };
}
