import {Container, Graphics, Sprite, Texture} from 'pixi.js';
import type {
 ActorVisualInput,
 CharacterVisualRig,
 ChibiAnchors,
 ChibiAnyPoseKey,
 ChibiFxAnimationPreset,
 ChibiFxId,
 ChibiOptionalPoseKey,
 ChibiPoseKey,
 ChibiPoseSpec,
 MapleChibiRigData
} from './chibi-types.js';
import type {LoadedChibiFxBundle, LoadedPoseTextures} from './chibi-loader.js';
import {PaperDoll} from './paper-doll.js';
import {activityPose} from '../village-characters.js';
import type {Character} from './types.js';

/**
 * Per-pose visual head-size calibration so standing, walking, rear-view,
 * seated desk work, and curled resting poses maintain consistent head scale.
 */
export const DEFAULT_POSE_SCALE: Readonly<Record<ChibiAnyPoseKey, number>> = {
 stand_3q: 1.0,
 walk_3q: 1.0,
 work_front: 1.1,
 rest_3q: 0.94,
 back_3q: 1.0,
 react_front: 1.0
};

interface DustPuff {
 node: Container;
 x: number;
 y: number;
 vx: number;
 age: number;
 life: number;
}

const FX_BASE_WORLD_SIZE = 40;

export function resolvePoseSpec(data: MapleChibiRigData, poseKey: ChibiAnyPoseKey): ChibiPoseSpec {
 if (poseKey in data.poses) return data.poses[poseKey as ChibiPoseKey];
 const opt = data.optionalPoses?.[poseKey as ChibiOptionalPoseKey];
 return opt ?? data.poses.stand_3q;
}

export function poseScaleFor(data: MapleChibiRigData, poseKey: ChibiAnyPoseKey): number {
 return resolvePoseSpec(data, poseKey).poseScale ?? DEFAULT_POSE_SCALE[poseKey];
}

export function resolvePoseAnchors(data: MapleChibiRigData, poseKey: ChibiAnyPoseKey): ChibiAnchors {
 return resolvePoseSpec(data, poseKey).anchors ?? data.anchors;
}

/**
 * 4-layer MapleStory-inspired chibi character rig (Phase 2: back_3q + 18-FX + sprite dust/particles):
 * L0 GroundFX (prop-dust_step footstep puffs)
 * L1 BodyRig (pose sprite + horizontal turn + smooth cosine stride/work/rest dynamics)
 * L2 Expression FX layer (shared comic emote stickers with mirrored anchor coords)
 * L3 Prop & ambient particles (code_bit, doc_page, smoke_puff, heal_leaf)
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

 private currentPose: ChibiAnyPoseKey = 'stand_3q';
 private facingDisplay = 1; // +1 right, -1 left
 private walkPhase = 0;
 private walkBlend = 0;
 private lastStepBucket = -1;
 private dustCursor = 0;

 constructor(
  private readonly data: MapleChibiRigData,
  private readonly textures: LoadedPoseTextures,
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

  const dustTex = fxBundle?.textures.get('prop-dust_step');
  for (let i = 0; i < 3; i++) {
   const node = new Container();
   if (dustTex) {
    const sp = new Sprite(dustTex);
    sp.anchor.set(0.5);
    const scale = 18 / Math.max(1, dustTex.width);
    sp.scale.set(scale);
    node.addChild(sp);
   } else {
    const gfx = new Graphics()
     .circle(0, 0, 3.2)
     .fill({color: 0xe6d3bc, alpha: 0.36})
     .circle(3.5, 0.8, 2.1)
     .fill({color: 0xf2e4d0, alpha: 0.28});
    node.addChild(gfx);
   }
   node.visible = false;
   this.groundLayer.addChild(node);
   this.dustPool.push({node, x: 0, y: 0, vx: 0, age: 1, life: 0.34});
  }

  this.root.addChild(this.groundLayer, this.bodyLayer, this.fxLayer, this.particleLayer);
 }

 private spawnDust(facingSign: number): void {
  const puff = this.dustPool[this.dustCursor % this.dustPool.length]!;
  this.dustCursor++;
  puff.x = -facingSign * 14;
  puff.y = -3;
  puff.vx = -facingSign * 22;
  puff.age = 0;
  puff.life = 0.34;
  puff.node.visible = true;
  puff.node.position.set(puff.x, puff.y);
  puff.node.scale.set(facingSign * 0.65, 0.65);
  puff.node.alpha = 0.62;
 }

 private stepDust(dtSec: number, still: boolean): void {
  for (const puff of this.dustPool) {
   if (still || puff.age >= puff.life) {
    puff.node.visible = false;
    continue;
   }
   puff.age += dtSec;
   if (puff.age >= puff.life) {
    puff.node.visible = false;
    continue;
   }
   const t = puff.age / puff.life;
   const sign = puff.vx <= 0 ? 1 : -1;
   const s = 0.65 + t * 0.55;
   puff.node.position.set(puff.x + puff.vx * puff.age, puff.y - t * 8);
   puff.node.scale.set(sign * s, s);
   puff.node.alpha = (1 - t) * 0.58;
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
    const p = Math.sin(phase * 4.2);
    sx = scaleBase * (1 + p * 0.08);
    sy = scaleBase * (1 + p * 0.08);
    dy -= 2 + p * 2.0;
   } else if (preset === 'drop') {
    const cycle = (phase * 1.1) % 1;
    dy += cycle * 10 - 4;
    sx = scaleBase * (1 - cycle * 0.1);
    sy = scaleBase * (1 + cycle * 0.12);
    alpha = cycle > 0.78 ? (1 - cycle) / 0.22 : 0.95;
   } else if (preset === 'shake') {
    dx += Math.sin(phase * 22) * 2.0;
    dy += Math.cos(phase * 18) * 1.0 - 4;
    rot = Math.sin(phase * 14) * 0.06;
   } else if (preset === 'float') {
    const wave = Math.sin(phase * 2.1);
    dx += Math.cos(phase * 1.4) * 2.2;
    dy += wave * 4.0 - 4;
    alpha = 0.88 + wave * 0.08;
   } else if (preset === 'pop') {
    const lift = (1 - Math.cos(phase * 5.2)) * 0.5;
    sx = scaleBase * (0.92 + lift * 0.16);
    sy = scaleBase * (0.92 + lift * 0.16);
    dy -= lift * 4.5;
    rot = Math.sin(phase * 2.6) * 0.08;
   } else if (preset === 'rise') {
    const cycle = (phase * 0.85) % 1;
    dy -= cycle * 18;
    alpha = Math.sin(cycle * Math.PI) * 0.94;
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
  const isSmoke = particleId === 'prop-smoke_puff';
  const isHeal = particleId === 'prop-heal_leaf';
  const anchor = isSmoke ? anchors.headTop : isHeal ? anchors.faceCenter : (anchors.propHand ?? anchors.faceCenter);
  const originX = (anchor[0] - feet[0]) * baseScale * facingSign;
  const originY = (anchor[1] - feet[1]) * baseScale + sitY - (isSmoke ? 20 : isHeal ? 8 : 24);
  const targetPx = isSmoke ? 24 : isHeal ? 20 : 20;
  const scaleBase = targetPx / Math.max(1, tex.width);
  const speed = isSmoke ? 0.65 : isHeal ? 0.48 : 0.72;

  this.particles.forEach((sp, idx) => {
   const cycle = (elapsed * speed + idx * 0.5) % 1;
   sp.texture = tex;
   sp.visible = true;
   const spreadX = isSmoke ? (idx === 0 ? -10 : 12) : isHeal ? (idx === 0 ? -24 : 24) : (idx === 0 ? -14 : 14);
   const driftY = isSmoke ? 34 : isHeal ? 26 : 30;
   sp.position.set(
    originX + spreadX + Math.sin(cycle * Math.PI * 2 + idx) * (isHeal ? 7 : 5),
    originY - cycle * driftY
   );
   const s = scaleBase * (isSmoke ? 0.65 + cycle * 0.65 : 0.75 + Math.sin(cycle * Math.PI) * 0.3);
   sp.scale.set(s);
   sp.alpha = Math.sin(cycle * Math.PI) * (isSmoke ? 0.78 : 0.86);
   sp.rotation = isSmoke ? (cycle - 0.5) * 0.25 : (cycle - 0.5) * 0.3;
  });
 }

 private resolveAvailablePose(requested: ChibiAnyPoseKey): ChibiAnyPoseKey {
  if (this.textures[requested]) return requested;
  return 'stand_3q';
 }

 update(input: ActorVisualInput): void {
  const {elapsed, dtMs, height, sitOffset, deskSeated, walking, walkingBack = false, facing, brain, still} = input;
  const dtSec = Math.max(0, dtMs) / 1000;
  const profile = this.data.motionProfile;

  // Choose pose: calm, grounded stride; gracefully supports back_3q when walking up or inspecting rear POIs.
  let requestedPose: ChibiAnyPoseKey = brain.poseKey;
  if (walking && !still) {
   const strideHz = Math.max(1.2, profile.stepCadenceHz * 0.56); // ~1.8 cycles/s (~278ms per pose)
   this.walkPhase += dtSec * strideHz;
   this.walkBlend = Math.min(1, this.walkBlend + dtSec * 6.5);
   const stepBucket = Math.floor(this.walkPhase * 2);
   requestedPose = walkingBack && this.textures.back_3q
    ? 'back_3q'
    : (stepBucket % 2 === 1 ? 'walk_3q' : 'stand_3q');
   if (stepBucket !== this.lastStepBucket) {
    this.lastStepBucket = stepBucket;
    if (stepBucket % 4 === 0) this.spawnDust(facing === 'right' ? 1 : -1);
   }
  } else {
   this.walkBlend = still ? 0 : Math.max(0, this.walkBlend - dtSec * 7.5);
   if (this.walkBlend <= 0.01) {
    this.walkPhase = 0;
    this.lastStepBucket = -1;
   }
   if (walking && still) requestedPose = 'stand_3q';
  }
  if (deskSeated) {
   requestedPose = 'work_front';
   this.walkBlend = 0;
   this.walkPhase = 0;
  }

  const poseKey = this.resolveAvailablePose(requestedPose);
  this.currentPose = poseKey;
  const poseSpec = resolvePoseSpec(this.data, poseKey);
  const feet = poseSpec.feet ?? this.data.feet;
  const anchors = resolvePoseAnchors(this.data, poseKey);

  // Swap texture & pivot cleanly.
  const tex = this.textures[poseKey] ?? this.textures.stand_3q;
  if (this.bodySprite.texture !== tex) this.bodySprite.texture = tex;
  this.bodySprite.pivot.set(feet[0], feet[1]);

  // Base scale: height relative to canonical visibleHeight, plus per-pose head-size calibration.
  const pScale = poseScaleFor(this.data, poseKey);
  const baseScale = (height / this.data.visibleHeight) * this.data.heightScale * pScale;

  // Smooth horizontal turn without jarring squash (work_front never mirrors).
  const defaultSign = this.data.facingDefault === 'left' ? -1 : 1;
  const desiredSign = poseSpec.mirrorable ? (facing === 'right' ? 1 : -1) * defaultSign : 1;
  if (still || dtSec <= 0) {
   this.facingDisplay = desiredSign;
  } else {
   const turnSpeed = 14;
   const diff = desiredSign - this.facingDisplay;
   const step = Math.sign(diff) * Math.min(Math.abs(diff), dtSec * turnSpeed);
   this.facingDisplay += step;
   if (Math.abs(this.facingDisplay) < 0.35) {
    this.facingDisplay = Math.sign(desiredSign) * 0.35;
   }
  }

  // Refined, smooth C-infinity dynamics: nimble & cozy without mechanical jitter.
  let offsetX = 0;
  let offsetY = deskSeated ? sitOffset - 6 : sitOffset;
  let dynScaleX = 1;
  let dynScaleY = 1;
  let rotation = 0;

  if (!still) {
   if (walking || this.walkBlend > 0.01) {
    const b = this.walkBlend;
    const cosWave = Math.cos(this.walkPhase * Math.PI * 2);
    const smoothLift = (1 - cosWave) * 0.5;
    const hopAmp = Math.min(3.0, profile.hopHeight * 0.28);
    const squashAmp = Math.min(0.013, profile.squashAmount * 0.22);
    offsetY -= smoothLift * hopAmp * b;
    dynScaleX = 1 + cosWave * squashAmp * b;
    dynScaleY = 1 - cosWave * squashAmp * b;
    rotation = (facing === 'right' ? 1 : -1) * 0.016 * b;
   } else if (brain.macroState === 'WORK') {
    if (brain.subAction === 'overloaded') {
     offsetX = Math.sin(elapsed * 20) * 0.65;
     const pulse = Math.sin(elapsed * 8);
     dynScaleX = 1 + pulse * 0.01;
     dynScaleY = 1 - pulse * 0.01;
     rotation = Math.sin(elapsed * 10) * 0.008;
    } else if (brain.subAction === 'blocked') {
     const sigh = Math.sin(elapsed * 1.6);
     dynScaleY = 0.985 + sigh * 0.009;
     dynScaleX = 1.01 - sigh * 0.006;
     rotation = -0.012 + sigh * 0.006;
    } else if (brain.subAction === 'slacking') {
     const sway = Math.sin(elapsed * 1.6);
     rotation = sway * 0.028;
     dynScaleY = 1 + Math.sin(elapsed * 3.2) * 0.008;
    } else if (brain.subAction === 'reviewing') {
     const nod = Math.sin(elapsed * 2.4);
     dynScaleY = 1 + nod * 0.01;
     rotation = Math.sin(elapsed * 1.4) * 0.014;
    } else {
     const tap = (1 + Math.sin(elapsed * 5.0)) * 0.5;
     offsetY -= tap * 1.0;
     dynScaleX = 1 + (0.5 - tap) * 0.012;
     dynScaleY = 1 - (0.5 - tap) * 0.012;
    }
   } else if (brain.macroState === 'REST') {
    if (brain.subAction === 'napping') {
     const cycle = (elapsed * 0.34) % 1;
     const droop = cycle < 0.82 ? Math.sin((cycle / 0.82) * (Math.PI / 2)) : Math.cos(((cycle - 0.82) / 0.18) * (Math.PI / 2));
     dynScaleY = 1 - droop * 0.022;
     dynScaleX = 1 + droop * 0.016;
     rotation = (facing === 'right' ? 1 : -1) * droop * 0.024;
    } else {
     const breath = Math.sin(elapsed * 1.5);
     const amp = profile.breathAmp * 0.55;
     dynScaleY = 1 + breath * amp;
     dynScaleX = 1 - breath * (amp * 0.7);
     rotation = Math.sin(elapsed * 0.8) * 0.01;
    }
   } else if (brain.subAction === 'celebrate') {
    const lift = (1 - Math.cos(elapsed * 6.5)) * 0.5;
    offsetY -= lift * 4.5;
    dynScaleX = 1 + (0.5 - lift) * 0.03;
    dynScaleY = 1 - (0.5 - lift) * 0.03;
    rotation = Math.sin(elapsed * 3.25) * 0.02;
   } else {
    const breath = Math.sin(elapsed * 1.9);
    const amp = profile.breathAmp * 0.48;
    dynScaleY = 1 + breath * amp;
    dynScaleX = 1 - breath * (amp * 0.65);
    rotation = brain.subAction === 'social' ? Math.sin(elapsed * 2.2) * 0.014 : Math.sin(elapsed * 1.0) * 0.007;
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
  const poseSpec = resolvePoseSpec(this.data, this.currentPose);
  const feet = poseSpec.feet ?? this.data.feet;
  const anchors = resolvePoseAnchors(this.data, this.currentPose);
  const scaleX = Math.abs(this.bodySprite.scale.x);
  const scaleY = Math.abs(this.bodySprite.scale.y);
  if (scaleX <= 0 || scaleY <= 0) return null;

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
  const poseSpec = resolvePoseSpec(this.data, this.currentPose);
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
