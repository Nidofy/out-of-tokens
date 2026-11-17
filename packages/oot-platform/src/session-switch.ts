import type { GameSession } from './session.js';
import type { CheckpointCoordinator } from './checkpoint.js';

/** A owns confirmation/export UI. Caller creates a fresh coordinator with an explicitly read CAS revision. */
export async function switchImportedSession(session: GameSession, coordinator: CheckpointCoordinator,
    text: string, options: { lineageId?: string; confirmed?: true } = {}): Promise<{ lineageId: string; saved: false }> {
    const unlock = session.lockCommands();
    try {
        // Decode/replay first: a bad import must not abandon any queued progress.
        const commit = await session.prepareImport(text, options.lineageId);
        if (coordinator.canSwitchWithoutConfirm) {
            const status = await coordinator.drain();
            if (status.kind !== 'saved' && status.kind !== 'idle') throw Error('SWITCH_REQUIRES_CONFIRMATION');
        } else {
            if (options.confirmed !== true) throw Error('SWITCH_REQUIRES_CONFIRMATION');
            await coordinator.abandonPending(true);
        }
        commit();
        coordinator.dispose();
        return {lineageId:session.lineageId,saved:false};
    } finally { unlock(); }
}
