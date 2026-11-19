import {Container, Graphics, Sprite, Texture} from 'pixi.js';
import type {
 ActorVisualInput,
 CharacterVisualRig,
 ChibiAnchors,
 ChibiFxAnimationPreset,
 ChibiFxId,
 ChibiPoseKey,
 MapleChibiRigData
} from './chibi-types.js';
import type {LoadedChibiFxBundle} from './chibi-loader.js';
import {PaperDoll} from './paper-doll.js';
import {activityPose} from '../village-characters.js';
import type {Character} from './types.js';

/**
 * Per-pose visual head-size calibration so standing, walking, seated desk work,
 * and curled resting poses maintain pixel-consistent head proportion in-game.
 */
export const DEFAULT_POSE_SCALE: Readonly<Record<ChibiPoseKey, number>> = {
 stand_3q: 1.0,
 walk_3q: 1.0,
 work_front: 1.1,
 rest_3q: 0.94
};

interface DustPuff {
 gfx: Graphics;
 x: number;
 y: number;
 vx: number;
 age: number;
 life: number;
}

const FX_BASE_WORLD_SIZE = 40;

export function poseScaleFor(data: MapleChibiRigData, poseKey: ChibiPoseKey): number {
 return data.poses[poseKey]?.poseScale ?? DEFAULT_POSE_SCALE[poseKey];
}

export function resolvePoseAnchors(data: MapleChibiRigData, poseKey: ChibiPoseKey): ChibiAnchors {
 return data.poses[poseKey]?.anchors ?? data.anchors;
}

/**
 * 4-layer MapleStory-inspired chibi character rig:
 * L0 GroundFX (walking dust puffs)
 * L1 BodyRig (pose sprite + horizontal flip spring + MapleStory squash/stretch/hop)
 * L2 Expression FX layer (shared comic emote stickers with mirrored anchor coords)
 * L3 Prop & ambient particles (e.g. rising workstation code bits)
 */
export class MapleChibiRig implements CharacterVisualRig {
 readonly kind = 'maple-chibi' as const;
 readonly root = new Container();

 private readonly groundLayer = new Container();
 private readonly bodyLayer = new Container();
 private readonly fxLayer = new Container();
 private readonly particleLayer = new Container();

 private readonly bodySprite: Sprite;
 private readonly primaryFxSprite = new Sprite();
 private readonly secondaryFxSprite = new Sprite();
 private readonly particles: Sprite[] = [];
 private readonly dustPool: DustPuff[] = [];

 private currentPose: ChibiPoseKey = 'stand_3q';
 private facingDisplay = 1; // +1 right, -1 left (interpolated for crisp turn squeeze)
 private lastStepBucket = -1;
 private dustCursor = 0;

 constructor(
  private readonly data: MapleChibiRigData,
  private readonly textures: Record<ChibiPoseKey, Texture>,
  private readonly fxBundle?: LoadedChibiFxBundle
 ) {
  this.root.sortableChildren = true;

  this.groundLayer.zIndex = 0;
  this.bodyLayer.zIndex = 1;
  this.fxLayer.zIndex = 2;
  this.particleLayer.zIndex = 3;

  this.bodySprite = new Sprite(textures.stand_3q);
  this.bodySprite.tint = 0xfff8f0;
  this.bodyLayer.addChild(this.bodySprite);

  this.primaryFxSprite.anchor.set(0.5);
  this.primaryFxSprite.visible = false;
  this.secondaryFxSprite.anchor.set(0.5);
  this.secondaryFxSprite.visible = false;
  this.fxLayer.addChild(this.primaryFxSprite, this.secondaryFxSprite);

  for (let i = 0; i < 2; i++) {
   const sp = new Sprite();
   sp.anchor.set(0.5);
   sp.visible = false;
   this.particles.push(sp);
   this.particleLayer.addChild(sp);
  }

  for (let i = 0; i < 3; i++) {
   const gfx = new Graphics()
    .circle(0, 0, 5)
    .fill({color: 0xe6d3bc, alpha: 0.65})
    .circle(5, 1, 3.2)
    .fill({color: 0xf2e4d0, alpha: 0.5});
   gfx.visible = false;
   this.groundLayer.addChild(gfx);
   this.dustPool.push({gfx, x: 0, y: 0, vx: 0, age: 1, life: 0.34});
  }

  this.root.addChild(this.groundLayer, this.bodyLayer, this.fxLayer, this.particleLayer);
 }

 private spawnDust(facingSign: number): void {
  const puff = this.dustPool[this.dustCursor % this.dustPool.length]!;
  this.dustCursor++;
  puff.x = -facingSign * 14;
  puff.y = -2;
  puff.vx = -facingSign * 26;
  puff.age = 0;
  puff.life = 0.34;
  puff.gfx.visible = true;
  puff.gfx.position.set(puff.x, puff.y);
  puff.gfx.scale.set(0.65);
  puff.gfx.alpha = 0.72;
 }

 private stepDust(dtSec: number, still: boolean): void {
  for (const puff of this.dustPool) {
   if (still || puff.age >= puff.life) {
    puff.gfx.visible = false;
    continue;
   }
   puff.age += dtSec;
   if (puff.age >= puff.life) {
    puff.gfx.visible = false;
    continue;
   }
   const t = puff.age / puff.life;
   puff.gfx.position.set(puff.x + puff.vx * puff.age, puff.y - t * 9);
   puff.gfx.scale.set(0.65 + t * 0.75);
   puff.gfx.alpha = (1 - t) * 0.65;
  }
 }

 private applyFxSprite(
  sprite: Sprite,
  fxId: ChibiFxId | null,
  anchors: ChibiAnchors,
  feet: [number, number],
  baseScale: number,
  facingSign: number,
  sitY: number,
  elapsed: number,
  still: boolean,
  isSecondary: boolean
 ): void {
  if (!fxId || !this.fxBundle) {
   sprite.visible = false;
   return;
  }
  const tex = this.fxBundle.textures.get(fxId);
  const meta = this.fxBundle.catalog.get(fxId);
  if (!tex || !meta) {
   sprite.visible = false;
   return;
  }
  sprite.texture = tex;
  sprite.visible = true;

  const anchorName = isSecondary && meta.anchor === 'headTop' ? 'emoteRight' : meta.anchor;
  const rawAnchor = anchors[anchorName] ?? anchors.headTop;
  const relX = (rawAnchor[0] - feet[0]) * baseScale * facingSign;
  const relY = (rawAnchor[1] - feet[1]) * baseScale + sitY;

  const targetSize = FX_BASE_WORLD_SIZE * meta.scale * (isSecondary ? 0.82 : 1.0);
  const scaleBase = targetSize / Math.max(1, tex.width);
  const phase = elapsed + (isSecondary ? 0.45 : 0);

  let dx = 0;
  let dy = meta.anchor === 'headTop' ? -16 : -6;
  let sx = scaleBase;
  let sy = scaleBase;
  let rot = 0;
  let alpha = 0.96;

  if (!still) {
   const preset: ChibiFxAnimationPreset = meta.animationPreset;
   if (preset === 'pulse') {
    const p = Math.sin(phase * 5.2);
    sx = scaleBase * (1 + p * 0.1);
    sy = scaleBase * (1 + p * 0.1);
    dy -= 2 + p * 2.5;
   } else if (preset === 'drop') {
    const cycle = (phase * 1.15) % 1;
    dy += cycle * 11 - 4;
    sx = scaleBase * (1 - cycle * 0.12);
    sy = scaleBase * (1 + cycle * 0.14);
    alpha = cycle > 0.78 ? (1 - cycle) / 0.22 : 0.95;
   } else if (preset === 'shake') {
    dx += Math.sin(phase * 28) * 2.6;
    dy += Math.cos(phase * 22) * 1.3 - 4;
    rot = Math.sin(phase * 18) * 0.08;
   } else if (preset === 'float') {
    const wave = Math.sin(phase * 2.4);
    dx += Math.cos(phase * 1.5) * 2.5;
    dy += wave * 4.5 - 4;
    alpha = 0.86 + wave * 0.1;
   } else if (preset === 'pop') {
    const bounce = Math.abs(Math.sin(phase * 4.4));
    sx = scaleBase * (0.9 + bounce * 0.22);
    sy = scaleBase * (0.9 + bounce * 0.22);
    dy -= bounce * 5;
    rot = Math.sin(phase * 4.4) * 0.12;
   } else if (preset === 'rise') {
    const cycle = (phase * 0.9) % 1;
    dy -= cycle * 18;
    alpha = Math.sin(cycle * Math.PI) * 0.95;
   }
  }

  sprite.position.set(relX + dx, relY + dy);
  sprite.scale.set(sx, sy);
  sprite.rotation = rot;
  sprite.alpha = alpha;
 }

 private applyParticles(
  particleId: ChibiFxId | null,
  anchors: ChibiAnchors,
  feet: [number, number],
  baseScale: number,
  facingSign: number,
  sitY: number,
  elapsed: number,
  still: boolean
 ): void {
  if (!particleId || still || !this.fxBundle) {
   for (const sp of this.particles) sp.visible = false;
   return;
  }
  const tex = this.fxBundle.textures.get(particleId);
  if (!tex) {
   for (const sp of this.particles) sp.visible = false;
   return;
  }
  const hand = anchors.propHand ?? anchors.faceCenter;
  const originX = (hand[0] - feet[0]) * baseScale * facingSign;
  const originY = (hand[1] - feet[1]) * baseScale + sitY - 24;
  const scaleBase = 20 / Math.max(1, tex.width);

  this.particles.forEach((sp, idx) => {
   const cycle = (elapsed * 0.75 + idx * 0.5) % 1;
   sp.texture = tex;
   sp.visible = true;
   sp.position.set(
    originX + (idx === 0 ? -14 : 14) + Math.sin(cycle * Math.PI * 2 + idx) * 6,
    originY - cycle * 32
   );
   const s = scaleBase * (0.75 + Math.sin(cycle * Math.PI) * 0.35);
   sp.scale.set(s);
   sp.alpha = Math.sin(cycle * Math.PI) * 0.85;
   sp.rotation = (cycle - 0.5) * 0.35;
  });
 }

 update(input: ActorVisualInput): void {
  const {elapsed, dtMs, height, sitOffset, deskSeated, walking, facing, brain, still} = input;
  const dtSec = Math.max(0, dtMs) / 1000;
  const profile = this.data.motionProfile;

  // Choose pose: alternate stand_3q <-> walk_3q at step cadence while moving.
  let poseKey: ChibiPoseKey = brain.poseKey;
  let stepProgress = 0;
  if (walking && !still) {
   const stepCycle = elapsed * profile.stepCadenceHz;
   const stepBucket = Math.floor(stepCycle * 2);
   stepProgress = (stepCycle * 2) % 1;
   poseKey = stepBucket % 2 === 1 ? 'walk_3q' : 'stand_3q';
   if (stepBucket !== this.lastStepBucket) {
    this.lastStepBucket = stepBucket;
    if (stepBucket % 2 === 0) this.spawnDust(facing === 'right' ? 1 : -1);
   }
  } else {
   this.lastStepBucket = -1;
   if (walking && still) poseKey = 'stand_3q';
  }
  if (deskSeated) poseKey = 'work_front';

  this.currentPose = poseKey;
  const poseSpec = this.data.poses[poseKey];
  const feet = poseSpec.feet ?? this.data.feet;
  const anchors = resolvePoseAnchors(this.data, poseKey);

  // Swap texture & pivot cleanly.
  const tex = this.textures[poseKey];
  if (this.bodySprite.texture !== tex) this.bodySprite.texture = tex;
  this.bodySprite.pivot.set(feet[0], feet[1]);

  // Base scale: height relative to canonical visibleHeight, plus per-pose head-size calibration.
  const pScale = poseScaleFor(this.data, poseKey);
  const baseScale = (height / this.data.visibleHeight) * this.data.heightScale * pScale;

  // Smooth horizontal turn squeeze (work_front never mirrors).
  const defaultSign = this.data.facingDefault === 'left' ? -1 : 1;
  const desiredSign = poseSpec.mirrorable ? (facing === 'right' ? 1 : -1) * defaultSign : 1;
  if (still || dtSec <= 0) {
   this.facingDisplay = desiredSign;
  } else {
   const turnSpeed = 16; // ~0.12s full flip
   const diff = desiredSign - this.facingDisplay;
   const step = Math.sign(diff) * Math.min(Math.abs(diff), dtSec * turnSpeed);
   this.facingDisplay += step;
   if (Math.abs(this.facingDisplay) < 0.18) {
    this.facingDisplay = Math.sign(desiredSign) * 0.18;
   }
  }

  // Procedural MapleStory squash/stretch/hop/typing/rest dynamics.
  let offsetX = 0;
  let offsetY = deskSeated ? sitOffset - 6 : sitOffset;
  let dynScaleX = 1;
  let dynScaleY = 1;
  let rotation = 0;

  if (!still) {
   if (walking) {
    const hop = Math.sin(stepProgress * Math.PI);
    offsetY -= hop * profile.hopHeight;
    const squash = (1 - hop) * profile.squashAmount;
    dynScaleX = 1 + squash - hop * (profile.squashAmount * 0.5);
    dynScaleY = 1 - squash + hop * (profile.squashAmount * 0.65);
    rotation = (facing === 'right' ? 1 : -1) * (0.03 + hop * 0.025);
   } else if (brain.macroState === 'WORK') {
    if (brain.subAction === 'overloaded') {
     offsetX = Math.sin(elapsed * 34) * 1.6;
     const pulse = Math.sin(elapsed * 14);
     dynScaleX = 1 + pulse * 0.025;
     dynScaleY = 1 - pulse * 0.025;
     rotation = Math.sin(elapsed * 18) * 0.02;
    } else if (brain.subAction === 'blocked') {
     const sigh = Math.sin(elapsed * 1.8);
     dynScaleY = 0.97 + sigh * 0.015;
     dynScaleX = 1.02 - sigh * 0.01;
     rotation = -0.02 + sigh * 0.01;
    } else if (brain.subAction === 'slacking') {
     const sway = Math.sin(elapsed * 1.9);
     rotation = sway * 0.055;
     dynScaleY = 1 + Math.sin(elapsed * 3.8) * 0.015;
    } else if (brain.subAction === 'reviewing') {
     const nod = Math.sin(elapsed * 3.2);
     dynScaleY = 1 + nod * 0.02;
     rotation = Math.sin(elapsed * 1.6) * 0.03;
    } else {
     // typing: crisp MapleStory desk tapping rhythm
     const tap = Math.abs(Math.sin(elapsed * 8.5));
     offsetY -= tap * 2.2;
     dynScaleX = 1 + (1 - tap) * 0.022;
     dynScaleY = 1 - (1 - tap) * 0.022;
    }
   } else if (brain.macroState === 'REST') {
    if (brain.subAction === 'napping') {
     const cycle = (elapsed * 0.38) % 1;
     const droop = cycle < 0.85 ? cycle / 0.85 : 1 - (cycle - 0.85) / 0.15;
     dynScaleY = 1 - droop * 0.045;
     dynScaleX = 1 + droop * 0.035;
     rotation = (facing === 'right' ? 1 : -1) * droop * 0.045;
    } else {
     const breath = Math.sin(elapsed * 1.6);
     dynScaleY = 1 + breath * (profile.breathAmp * 1.25);
     dynScaleX = 1 - breath * (profile.breathAmp * 0.85);
     rotation = Math.sin(elapsed * 0.9) * 0.022;
    }
   } else if (brain.subAction === 'celebrate') {
    const hop = Math.abs(Math.sin(elapsed * 5.2));
    offsetY -= hop * (profile.hopHeight * 1.35);
    dynScaleX = 1 + (1 - hop) * 0.07 - hop * 0.04;
    dynScaleY = 1 - (1 - hop) * 0.07 + hop * 0.05;
    rotation = Math.sin(elapsed * 5.2) * 0.04;
   } else {
    // DAILY idle / inspect / social
    const breath = Math.sin(elapsed * 2.4);
    dynScaleY = 1 + breath * profile.breathAmp;
    dynScaleX = 1 - breath * (profile.breathAmp * 0.7);
    rotation = brain.subAction === 'social' ? Math.sin(elapsed * 3.1) * 0.03 : Math.sin(elapsed * 1.1) * 0.012;
   }
  }

  this.bodyLayer.position.set(offsetX, offsetY);
  this.bodyLayer.rotation = rotation;
  this.bodySprite.scale.set(baseScale * this.facingDisplay * dynScaleX, baseScale * dynScaleY);

  // Update L0 dust, L2 comic stickers, L3 ambient particles.
  this.stepDust(dtSec, still);
  const anchorSign = poseSpec.mirrorable ? (facing === 'right' ? 1 : -1) : 1;
  this.applyFxSprite(this.primaryFxSprite, brain.primaryFx, anchors, feet, baseScale, anchorSign, offsetY, elapsed, still, false);
  this.applyFxSprite(this.secondaryFxSprite, brain.secondaryFx, anchors, feet, baseScale, anchorSign, offsetY, elapsed, still, true);
  this.applyParticles(brain.particleFx, anchors, feet, baseScale, anchorSign, offsetY, elapsed, still);
 }

 getFaceBounds(): {x: number; y: number; width: number; height: number} | null {
  const poseSpec = this.data.poses[this.currentPose];
  const feet = poseSpec.feet ?? this.data.feet;
  const anchors = resolvePoseAnchors(this.data, this.currentPose);
  const scaleX = Math.abs(this.bodySprite.scale.x);
  const scaleY = Math.abs(this.bodySprite.scale.y);
  if (scaleX <= 0 || scaleY <= 0) return null;

  // Use true pose faceCenter/headTop anchors so transparent canvas padding never skews label avoidance.
  const localFaceY = (anchors.faceCenter[1] - feet[1]) * scaleY;
  const localTopY = (anchors.headTop[1] - feet[1]) * scaleY;
  const halfH = Math.max(20, (localFaceY - localTopY) * 0.72);
  const halfW = halfH * 0.92;
  const topLeft = this.bodyLayer.toGlobal({x: -halfW, y: localFaceY - halfH * 0.75});
  const bottomRight = this.bodyLayer.toGlobal({x: halfW, y: localFaceY + halfH * 0.85});
  return {
   x: Math.min(topLeft.x, bottomRight.x),
   y: Math.min(topLeft.y, bottomRight.y),
   width: Math.abs(bottomRight.x - topLeft.x),
   height: Math.abs(bottomRight.y - topLeft.y)
  };
 }

 getHeadAnchorOffset(height: number, sitOffset: number): {x: number; y: number} {
  const poseSpec = this.data.poses[this.currentPose];
  const feet = poseSpec.feet ?? this.data.feet;
  const anchors = resolvePoseAnchors(this.data, this.currentPose);
  const pScale = poseScaleFor(this.data, this.currentPose);
  const baseScale = (height / this.data.visibleHeight) * this.data.heightScale * pScale;
  const sit = this.currentPose === 'work_front' ? sitOffset - 6 : sitOffset;
  return {
   x: 0,
   y: sit + (anchors.headTop[1] - feet[1]) * baseScale
  };
 }

 destroy(): void {
  this.root.destroy({children: true});
 }
}

/**
 * Legacy PaperDoll adapter keeping 100% compatibility for unmigrated characters
 * and the short-term legacy fallback switch.
 */
export class PaperDollRigAdapter implements CharacterVisualRig {
 readonly kind = 'paper-doll' as const;
 readonly root: Container;
 private readonly paper: PaperDoll;

 constructor(character: Character, textures: Map<string, Texture>) {
  this.paper = new PaperDoll(character, textures);
  this.paper.root.tint = 0xfff5e8;
  this.paper.root.pivot.set(...character.feet);
  this.root = this.paper.root;
 }

 update(input: ActorVisualInput): void {
  const {elapsed, height, sitOffset, deskSeated, walking, activity, reaction, still} = input;
  this.paper.root.scale.set(height / this.paper.character.visibleHeight);
  this.paper.root.y = sitOffset;
  for (const leg of ['leg-left', 'leg-right']) {
   const n = this.paper.nodes.get(leg);
   if (n) n.visible = !deskSeated;
  }
  this.paper.apply(activityPose(this.paper.character, elapsed, activity, walking, reaction, still));
 }

 getFaceBounds(): {x: number; y: number; width: number; height: number} | null {
  const face = this.paper.nodes.get('face');
  if (!face) return null;
  const b = face.getBounds();
  return {x: b.x, y: b.y, width: b.width, height: b.height};
 }

 getHeadAnchorOffset(height: number, sitOffset: number): {x: number; y: number} {
  return {x: 0, y: sitOffset - height};
 }

 destroy(): void {
  this.paper.destroy();
 }
}
