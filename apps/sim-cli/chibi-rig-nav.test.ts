import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createInitialState,getViewModel} from 'oot-core';
import {loadFullContent} from 'oot-content';
import {resolveActorBrain} from '../web/src/art/actor-brain.js';
import {bakeOfficeNavGrid,extractOfficePois,findNavPath,isCellWalkable,pickRoamTarget} from '../web/src/office-nav.js';
import {DEFAULT_POSE_SCALE,poseScaleFor,resolvePoseAnchors,resolvePoseSpec} from '../web/src/art/maple-chibi-rig.js';
import type {ChibiFxCatalogItem,MapleChibiRigData} from '../web/src/art/chibi-types.js';
import {slotPoint} from '../web/src/office-scene-spec.js';

describe('Phase 1 & 2 MapleChibi engine: NavGrid A*, ActorBrain HFSM, back_3q and 18-FX schema', () => {
 it('routes around workstation desks without clipping through blocked footprints', () => {
  const desk = slotPoint('work-2', 0); // (900, 795)
  const grid = bakeOfficeNavGrid([
   {kind: 'basic', x: slotPoint('work-1', 0).x, y: slotPoint('work-1', 0).y},
   {kind: 'basic', x: desk.x, y: desk.y},
   {kind: 'basic', x: slotPoint('work-3', 0).x, y: slotPoint('work-3', 0).y}
  ]);

  const start = {x: desk.x, y: desk.y + 90};
  const goal = {x: desk.x, y: desk.y - 110};
  const path = findNavPath(grid, start, goal);

  expect(path.length).toBeGreaterThanOrEqual(2);
  expect(path.at(-1)).toEqual(goal);

  const all = [start, ...path];
  for (let i = 0; i < all.length - 1; i++) {
   const a = all[i]!;
   const b = all[i + 1]!;
   const steps = Math.max(4, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 16));
   for (let s = 1; s < steps; s++) {
    const t = s / steps;
    const x = a.x + (b.x - a.x) * t;
    const y = a.y + (b.y - a.y) * t;
    const insideDeskCore = Math.abs(x - desk.x) < 60 && y > desk.y - 36 && y < desk.y + 4;
    expect(insideDeskCore).toBe(false);
   }
  }
 });

 it('extracts coffee/sofa/whiteboard POIs, supports rest prioritization and peer social spots', () => {
  const items = [
   {id: 'f1', kind: 'basic', slot: 'work-1'},
   {id: 'f4', kind: 'whiteboard', slot: 'meeting-1'},
   {id: 'f5', kind: 'coffee', slot: 'lounge-1'},
   {id: 'f6', kind: 'sofa', slot: 'lounge-2'}
  ];
  const grid = bakeOfficeNavGrid(items.map(i => ({kind: i.kind, ...slotPoint(i.slot, 0)})));
  const pois = extractOfficePois(items, 0, 'workshop');

  expect(pois.some(p => p.kind === 'coffee')).toBe(true);
  expect(pois.some(p => p.kind === 'sofa')).toBe(true);
  expect(pois.some(p => p.kind === 'whiteboard')).toBe(true);

  const restPickA = pickRoamTarget({
   actorId: 'bluewhale',
   seedKey: 'slot-3',
   preferRest: true,
   origin: {x: 335, y: 655},
   grid,
   pois,
   occupied: [],
   reservedPoiIds: new Set()
  });
  const restPickB = pickRoamTarget({
   actorId: 'bluewhale',
   seedKey: 'slot-3',
   preferRest: true,
   origin: {x: 335, y: 655},
   grid,
   pois,
   occupied: [],
   reservedPoiIds: new Set()
  });

  expect(restPickA).toEqual(restPickB);
  expect(['sofa', 'coffee']).toContain(restPickA.poiKind);
  const col = Math.floor((restPickA.point.x - grid.originX) / grid.cellSize);
  const row = Math.floor((restPickA.point.y - grid.originY) / grid.cellSize);
  expect(isCellWalkable(grid, col, row)).toBe(true);

  // Verify peer social pairing triggers cleanly on deterministic seeds when an open aisle peer is available.
  let socialPick = null;
  for (let i = 0; i < 30; i++) {
   const pick = pickRoamTarget({
    actorId: 'bluewhale',
    seedKey: `social-probe-${i}`,
    preferRest: false,
    origin: {x: 335, y: 655},
    current: {x: 335, y: 655},
    grid,
    pois,
    occupied: [{x: 900, y: 920}],
    reservedPoiIds: new Set(),
    socialPeers: [{id: 'qwen', x: 900, y: 920}]
   });
   if (pick.poiKind === 'social') {
    socialPick = pick;
    break;
   }
  }
  expect(socialPick).not.toBeNull();
  expect(socialPick!.socialPartnerId).toBe('qwen');
  expect(Math.abs(socialPick!.point.x - 900)).toBeGreaterThanOrEqual(100);
 });

 it('maps DAILY, WORK, REST, back_3q rear views and full 18-FX routing without mutating view', () => {
  const c = loadFullContent();
  const s = createInitialState(c, 1);
  const view = getViewModel(s, c);
  const before = JSON.stringify(view);

  const workTyping = resolveActorBrain({
   view, actorId: 'bluewhale', activity: 'work', zone: 'work',
   deskSeated: true, walking: false, reaction: 'neutral', overloaded: false,
   poiKind: null, elapsed: 4, still: false
  });
  expect(workTyping.macroState).toBe('WORK');
  expect(workTyping.subAction).toBe('typing');
  expect(workTyping.poseKey).toBe('work_front');
  expect(workTyping.primaryFx).toBe('emote-focus');
  expect(workTyping.particleFx).toBe('prop-code_bit');

  const workReviewMeeting = resolveActorBrain({
   view, actorId: 'bluewhale', activity: 'review', zone: 'meeting',
   deskSeated: false, walking: false, reaction: 'neutral', overloaded: false,
   poiKind: null, elapsed: 4, still: false
  });
  expect(workReviewMeeting.macroState).toBe('WORK');
  expect(workReviewMeeting.subAction).toBe('reviewing');
  expect(workReviewMeeting.poseKey).toBe('back_3q');
  expect(workReviewMeeting.particleFx).toBe('prop-doc_page');

  const workOverload = resolveActorBrain({
   view, actorId: 'bluewhale', activity: 'work', zone: 'work',
   deskSeated: true, walking: false, reaction: 'surprised', overloaded: true,
   poiKind: null, elapsed: 4, still: false
  });
  expect(workOverload.macroState).toBe('WORK');
  expect(workOverload.subAction).toBe('overloaded');
  expect(workOverload.primaryFx).toBe('emote-crash');
  expect(workOverload.particleFx).toBe('prop-smoke_puff');

  const blockedView = {...view, possibleStops: ['bluewhale']};
  const workBlocked = resolveActorBrain({
   view: blockedView, actorId: 'bluewhale', activity: 'work', zone: 'work',
   deskSeated: true, walking: false, reaction: 'surprised', overloaded: false,
   poiKind: null, elapsed: 4, still: false
  });
  expect(workBlocked.subAction).toBe('blocked');
  expect(workBlocked.primaryFx).toBe('emote-alert');

  const restNap = resolveActorBrain({
   view, actorId: 'bluewhale', activity: 'rest', zone: 'lounge',
   deskSeated: false, walking: false, reaction: 'sleepy', overloaded: false,
   poiKind: 'sofa', elapsed: 4, still: false
  });
  expect(restNap.macroState).toBe('REST');
  expect(restNap.poseKey).toBe('rest_3q');
  expect(restNap.primaryFx).toBe('emote-zzz');
  expect(restNap.particleFx).toBe('prop-heal_leaf');

  const restCoffee = resolveActorBrain({
   view, actorId: 'bluewhale', activity: 'idle', zone: 'lounge',
   deskSeated: false, walking: false, reaction: 'neutral', overloaded: false,
   poiKind: 'coffee', elapsed: 4, still: false
  });
  expect(restCoffee.macroState).toBe('REST');
  expect(restCoffee.subAction).toBe('coffee_break');
  expect(restCoffee.poseKey).toBe('back_3q');
  expect(restCoffee.primaryFx).toBe('prop-coffee_cup');

  const dailyInspectWb = resolveActorBrain({
   view, actorId: 'bluewhale', activity: 'idle', zone: 'lounge',
   deskSeated: false, walking: false, reaction: 'neutral', overloaded: false,
   poiKind: 'whiteboard', elapsed: 4, still: false
  });
  expect(dailyInspectWb.macroState).toBe('DAILY');
  expect(dailyInspectWb.subAction).toBe('inspect');
  expect(dailyInspectWb.poseKey).toBe('back_3q');
  expect(dailyInspectWb.primaryFx).toBe('emote-spark');
  expect(dailyInspectWb.particleFx).toBe('prop-doc_page');

  const dailySocial = resolveActorBrain({
   view, actorId: 'bluewhale', activity: 'idle', zone: 'lounge',
   deskSeated: false, walking: false, reaction: 'neutral', overloaded: false,
   poiKind: 'social', elapsed: 4, still: false
  });
  expect(dailySocial.subAction).toBe('social');
  expect(['emote-heart', 'emote-spark']).toContain(dailySocial.primaryFx);

  const dailyCelebrate = resolveActorBrain({
   view, actorId: 'bluewhale', activity: 'idle', zone: 'lounge',
   deskSeated: false, walking: false, reaction: 'happy', overloaded: false,
   poiKind: null, elapsed: 4, still: false
  });
  expect(dailyCelebrate.macroState).toBe('DAILY');
  expect(dailyCelebrate.subAction).toBe('celebrate');
  expect(dailyCelebrate.poseKey).toBe('stand_3q');
  expect(dailyCelebrate.primaryFx).toBe('emote-excited');
  expect(dailyCelebrate.secondaryFx).toBe('emote-heart');

  const dailyWalkUp = resolveActorBrain({
   view, actorId: 'bluewhale', activity: 'idle', zone: 'lounge',
   deskSeated: false, walking: true, walkingBack: true, reaction: 'neutral', overloaded: false,
   poiKind: 'roam', elapsed: 4, still: false
  });
  expect(dailyWalkUp.subAction).toBe('roam');
  expect(dailyWalkUp.poseKey).toBe('back_3q');

  expect(JSON.stringify(view)).toBe(before);
 });

 it('loads shipped bluewhale rig.json (with back_3q) and 18-item fx/catalog.json', () => {
  const rig = JSON.parse(
   readFileSync(resolve('apps/web/public/art/chibi/characters/bluewhale/rig.json'), 'utf8')
  ) as MapleChibiRigData;
  const fx = JSON.parse(
   readFileSync(resolve('apps/web/public/art/chibi/fx/catalog.json'), 'utf8')
  ) as ChibiFxCatalogItem[];

  expect(rig.schemaVersion).toBe(2);
  expect(rig.renderer).toBe('maple-chibi');
  expect(poseScaleFor(rig, 'stand_3q')).toBe(DEFAULT_POSE_SCALE.stand_3q);
  expect(poseScaleFor(rig, 'work_front')).toBeGreaterThan(1);
  expect(poseScaleFor(rig, 'rest_3q')).toBeLessThan(1);
  expect(poseScaleFor(rig, 'back_3q')).toBe(1);
  expect(resolvePoseSpec(rig, 'back_3q').file).toBe('back_3q.webp');
  expect(resolvePoseAnchors(rig, 'work_front').headTop[1]).toBeGreaterThan(resolvePoseAnchors(rig, 'stand_3q').headTop[1]);
  expect(rig.optionalPoses?.back_3q?.file).toBe('back_3q.webp');
  expect(fx).toHaveLength(18);
  expect(new Set(fx.map(item => item.id)).size).toBe(18);
 });
});
