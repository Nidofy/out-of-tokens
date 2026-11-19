import type {GameView} from 'oot-platform';
import type {Expression} from './types.js';
import type {ActorBrainState, ChibiFxId, ChibiPoseKey, MacroState, PoiKind, SubAction} from './chibi-types.js';
import {fnvHash} from '../living-adapter.js';

export interface ResolveActorBrainInput {
 view: GameView;
 actorId: string;
 activity: string;
 zone: string;
 deskSeated: boolean;
 walking: boolean;
 reaction: Expression;
 overloaded: boolean;
 poiKind: PoiKind;
 elapsed: number;
 still: boolean;
}

/**
 * Pure presentation-layer HFSM router.
 * Strictly read-only on GameView and uses local fnvHash; never touches simulation RNG or save state.
 */
export function resolveActorBrain(input: ResolveActorBrainInput): ActorBrainState {
 const {view, actorId, activity, zone, deskSeated, walking, reaction, overloaded, poiKind, elapsed, still} = input;
 const actor = view.actors.find(a => a.id === actorId);
 const energy = actor?.energy ?? 100;
 const mood = actor?.mood ?? 65;
 const period = view.absoluteSlot % 4;
 const blocked = view.possibleStops.includes(actorId) || !!view.pending?.actors.includes(actorId);
 const timeBucket = still ? 0 : Math.floor(elapsed / 9);
 const roll = fnvHash(`${actorId}:${view.day}:${view.absoluteSlot}:${timeBucket}`) % 100;

 // 1. WORK macro state: workstation or meeting/review assignment.
 const isWorking = zone === 'work' || zone === 'meeting' || activity === 'work' || activity === 'review' || activity === 'think';
 if (isWorking) {
  const macroState: MacroState = 'WORK';
  const poseKey: ChibiPoseKey = walking ? 'walk_3q' : deskSeated ? 'work_front' : 'stand_3q';

  if (overloaded) {
   return {
    macroState,
    subAction: 'overloaded',
    poseKey,
    primaryFx: 'emote-crash',
    secondaryFx: 'emote-sweat',
    particleFx: null
   };
  }
  if (blocked) {
   return {
    macroState,
    subAction: 'blocked',
    poseKey,
    primaryFx: 'emote-sweat',
    secondaryFx: null,
    particleFx: null
   };
  }
  if (activity === 'review' || zone === 'meeting') {
   return {
    macroState,
    subAction: 'reviewing',
    poseKey,
    primaryFx: reaction === 'happy' ? 'emote-excited' : 'emote-focus',
    secondaryFx: null,
    particleFx: deskSeated ? 'prop-code_bit' : null
   };
  }
  // Purely visual slacking easter egg when mood/energy dips (only in live motion, never alters simulation).
  if (!still && !walking && deskSeated && (mood < 48 || energy < 48) && roll < 22) {
   return {
    macroState,
    subAction: 'slacking',
    poseKey,
    primaryFx: 'emote-daze',
    secondaryFx: null,
    particleFx: null
   };
  }
  return {
   macroState,
   subAction: 'typing',
   poseKey,
   primaryFx: reaction === 'happy' ? 'emote-excited' : 'emote-focus',
   secondaryFx: energy < 40 ? 'emote-sweat' : null,
   particleFx: deskSeated ? 'prop-code_bit' : null
  };
 }

 // 2. REST macro state: explicit rest/meal/read, low energy recovery, or visiting coffee/sofa POIs.
 const isResting =
  activity === 'rest' ||
  activity === 'meal' ||
  activity === 'read' ||
  energy < 35 ||
  (!walking && (poiKind === 'sofa' || poiKind === 'coffee'));
 if (isResting) {
  const macroState: MacroState = 'REST';
  const poseKey: ChibiPoseKey = walking ? 'walk_3q' : 'rest_3q';
  let subAction: SubAction = 'napping';
  let primaryFx: ChibiFxId | null = 'emote-zzz';

  if (activity === 'meal') {
   subAction = 'dining';
   primaryFx = 'prop-coffee_cup';
  } else if (activity === 'read') {
   subAction = 'reading';
   primaryFx = 'emote-daze';
  } else if (poiKind === 'coffee') {
   subAction = 'coffee_break';
   primaryFx = 'prop-coffee_cup';
  } else if (poiKind === 'sofa') {
   subAction = activity === 'rest' || reaction === 'sleepy' || energy < 45 || period === 3 ? 'napping' : 'sofa_chill';
   primaryFx = subAction === 'napping' ? 'emote-zzz' : 'prop-coffee_cup';
  } else if (energy < 35 || period === 3 || activity === 'rest') {
   subAction = 'napping';
   primaryFx = 'emote-zzz';
  }

  return {
   macroState,
   subAction,
   poseKey,
   primaryFx: walking ? null : primaryFx,
   secondaryFx: reaction === 'surprised' ? 'emote-sweat' : null,
   particleFx: null
  };
 }

 // 3. DAILY macro state: idle, autonomous roam, inspect, social, celebrate.
 const macroState: MacroState = 'DAILY';
 if (walking) {
  return {
   macroState,
   subAction: 'roam',
   poseKey: 'walk_3q',
   primaryFx: reaction === 'surprised' ? 'emote-sweat' : reaction === 'happy' ? 'emote-excited' : null,
   secondaryFx: null,
   particleFx: null
  };
 }
 if (reaction === 'happy') {
  return {
   macroState,
   subAction: 'celebrate',
   poseKey: 'stand_3q',
   primaryFx: 'emote-excited',
   secondaryFx: null,
   particleFx: null
  };
 }
 if (reaction === 'surprised') {
  return {
   macroState,
   subAction: 'idle',
   poseKey: 'stand_3q',
   primaryFx: 'emote-sweat',
   secondaryFx: null,
   particleFx: null
  };
 }
 if (poiKind === 'whiteboard' || poiKind === 'server') {
  return {
   macroState,
   subAction: 'inspect',
   poseKey: 'stand_3q',
   primaryFx: 'emote-daze',
   secondaryFx: null,
   particleFx: null
  };
 }
 if (poiKind === 'social') {
  return {
   macroState,
   subAction: 'social',
   poseKey: 'stand_3q',
   primaryFx: roll < 50 ? 'emote-excited' : null,
   secondaryFx: null,
   particleFx: null
  };
 }

 return {
  macroState,
  subAction: 'idle',
  poseKey: 'stand_3q',
  primaryFx: !still && roll < 18 ? 'emote-daze' : null,
  secondaryFx: null,
  particleFx: null
 };
}
