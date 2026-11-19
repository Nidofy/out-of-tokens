import type {Container} from 'pixi.js';
import type {Expression} from './types.js';
import type {chibiFxIds} from '../chibi-art.js';

export type ChibiFxId = (typeof chibiFxIds)[number];

export type ChibiPoseKey = 'stand_3q' | 'walk_3q' | 'work_front' | 'rest_3q';
export type ChibiOptionalPoseKey = 'back_3q' | 'react_front';
export type ChibiAnyPoseKey = ChibiPoseKey | ChibiOptionalPoseKey;

export type ChibiAnchorName = 'headTop' | 'faceCenter' | 'emoteLeft' | 'emoteRight' | 'propHand';
export type ChibiFxAnimationPreset = 'pulse' | 'drop' | 'shake' | 'float' | 'pop' | 'rise';

export interface ChibiAnchors {
 headTop: [number, number];
 faceCenter: [number, number];
 emoteLeft: [number, number];
 emoteRight: [number, number];
 propHand: [number, number];
 deskClipY: number;
}

export interface ChibiPoseSpec {
 file: string;
 mirrorable: boolean;
 anchors?: ChibiAnchors;
 feet?: [number, number];
 visibleHeight?: number;
 seatedOffsetY?: number;
 poseScale?: number;
 warnings?: string[];
}

export interface ChibiMotionProfile {
 walkSpeed: number;
 hopHeight: number;
 stepCadenceHz: number;
 squashAmount: number;
 breathAmp: number;
}

export interface MapleChibiRigData {
 schemaVersion: 2;
 renderer: 'maple-chibi';
 id: string;
 canvas: [number, number];
 feet: [number, number];
 visibleHeight: number;
 facingDefault: 'right' | 'left';
 heightScale: number;
 anchors: ChibiAnchors;
 poses: Record<ChibiPoseKey, ChibiPoseSpec>;
 optionalPoses?: Partial<Record<ChibiOptionalPoseKey, ChibiPoseSpec | null>>;
 faceOverrides?: Record<string, string> | null;
 motionProfile: ChibiMotionProfile;
}

export interface ChibiFxCatalogItem {
 id: ChibiFxId;
 file: string;
 anchor: ChibiAnchorName;
 animationPreset: ChibiFxAnimationPreset;
 scale: number;
 sha256: string;
 bytes: number;
}

export type MacroState = 'DAILY' | 'WORK' | 'REST';
export type SubAction =
 | 'idle'
 | 'roam'
 | 'inspect'
 | 'social'
 | 'celebrate'
 | 'typing'
 | 'reviewing'
 | 'overloaded'
 | 'blocked'
 | 'slacking'
 | 'sofa_chill'
 | 'coffee_break'
 | 'napping'
 | 'dining'
 | 'reading';

export type Facing = 'left' | 'right';
export type PoiKind = 'coffee' | 'sofa' | 'whiteboard' | 'server' | 'social' | 'roam' | null;

export interface ActorBrainState {
 macroState: MacroState;
 subAction: SubAction;
 poseKey: ChibiAnyPoseKey;
 primaryFx: ChibiFxId | null;
 secondaryFx: ChibiFxId | null;
 particleFx: ChibiFxId | null;
}

export interface ActorVisualInput {
 elapsed: number;
 dtMs: number;
 height: number;
 sitOffset: number;
 deskSeated: boolean;
 walking: boolean;
 walkingBack?: boolean;
 facing: Facing;
 activity: string;
 reaction: Expression;
 brain: ActorBrainState;
 still: boolean;
}

export interface CharacterVisualRig {
 readonly kind: 'maple-chibi' | 'paper-doll';
 readonly root: Container;
 update(input: ActorVisualInput): void;
 getFaceBounds(): {x: number; y: number; width: number; height: number} | null;
 getHeadAnchorOffset(height: number, sitOffset: number): {x: number; y: number};
 destroy(): void;
}
