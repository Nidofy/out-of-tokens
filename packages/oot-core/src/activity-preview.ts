import type { Command, Content, State } from './model.js';
import { actorScene } from './campaign.js';
import { dispatchCommand, prepareClarification } from './simulation.js';

/** No advance, event choice, delivery or restart is executed to predict a future random result. */
export function activityEffects(s: State, c: Content, command: Command) {
    let next = s, error: string | null = null;
    if (['advance', 'choose', 'deliver', 'restart'].includes(command.type)) error = 'ACTIVITY_NOT_SUPPORTED';
    else if (command.type === 'clarify') {
        try {
            if (s.bankrupt) throw Error('BANKRUPT');
            if (s.campaign?.finale?.ending && !s.campaign.finale.endless) throw Error('ENDING_FINISHED');
            if (s.pending) throw Error('PENDING_CHOICE');
            // JSON-compatible domain data only; no clock or randomness.
            next = JSON.parse(JSON.stringify(s)) as State;
            prepareClarification(next, c, command);
        } catch (e) { error = e instanceof Error ? e.message : 'INVALID_COMMAND'; next = s; }
    } else {
        const result = dispatchCommand(s, command, c);
        next = result.state; error = result.error;
    }
    const actors = s.actors.flatMap(before => {
        const after = next.actors.find(a => a.id === before.id)!;
        const beforeRelation = s.campaign?.relations[before.id], afterRelation = next.campaign?.relations[before.id];
        const joinsOvertime = !s.overtime.includes(before.id) && next.overtime.includes(before.id);
        const relocated = actorScene(s, before) !== actorScene(next, after);
        const occupied = after.busyUntil !== before.busyUntil;
        const energy = after.energy-before.energy, mood = after.mood-before.mood;
        const affinity = (afterRelation?.affinity??0)-(beforeRelation?.affinity??0);
        if (!occupied && !joinsOvertime && !relocated && !energy && !mood && !affinity) return [];
        return [{actorId:before.id, occupiedSlots:occupied?Math.max(0,after.busyUntil-s.absoluteSlot):0,
            occupiesUntil:occupied?after.busyUntil:null, joinsOvertime,
            skipsNightRecovery:s.absoluteSlot%4===3&&(occupied||joinsOvertime),
            relocatesTo:relocated?actorScene(next,after):null, energy,mood,affinity}];
    });
    return { error, cash:s.cash-next.cash, research:(s.campaign?.research??0)-(next.campaign?.research??0), actors };
}
