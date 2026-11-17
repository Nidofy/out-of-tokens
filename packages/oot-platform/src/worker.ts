/** DOM-free encoding entry for A's Worker host. Candidate search uses the same implementation as GameSession. */
export { defaultSaveEncoder, matchesRevision, EXPERIENCE_CONTRACT } from './checkpoint-contract.js';
export type { SaveInput, SaveEncoder, WorkerSnapshot, RevisionIdentity } from './checkpoint-contract.js';

import type { Content } from 'oot-core';
import type { WorkerSnapshot } from './checkpoint-contract.js';
import type { Draft, SuggestResult } from './experience-contract.js';
/** Worker-compatible candidate function signature. */
export type SuggestAssignmentsFromSnapshot = (content: Content, snapshot: WorkerSnapshot, jobId: string, draft: Draft) => SuggestResult;
export { suggestAssignmentsFromSnapshot } from './suggestions.js';
