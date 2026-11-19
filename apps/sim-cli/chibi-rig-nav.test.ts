import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createInitialState,getViewModel} from 'oot-core';
import {loadFullContent} from 'oot-content';
import {resolveActorBrain} from '../web/src/art/actor-brain.js';
import {bakeOfficeNavGrid,extractOfficePois,findNavPath,isCellWalkable,pickRoamTarget} from '../web/src/office-nav.js';
import {DEFAULT_POSE_SCALE,poseScaleFor,resolvePoseAnchors} from '../web/src/art/maple-chibi-rig.js';
import type {ChibiFxCatalogItem,MapleChibiRigData} from '../web/src/art/chibi-types.js';
import {slotPoint} from '../web/src/office-scene-spec.js';

describe('Phase 1 MapleChibi engine: NavGrid A*, ActorBrain HFSM, and Rig schema', () => {
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

  // Sample segments between waypoints: no intermediate point may pass through the desk center footprint.
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

 it('extracts coffee/sofa/whiteboard POIs and deterministically prioritizes rest POIs when tired', () => {
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
 });

 it('maps DAILY, WORK, and REST macro states and A1 comic FX deterministically without mutating view', () => {
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

  const workOverload = resolveActorBrain({
   view, actorId: 'bluewhale', activity: 'work', zone: 'work',
   deskSeated: true, walking: false, reaction: 'surprised', overloaded: true,
   poiKind: null, elapsed: 4, still: false
  });
  expect(workOverload.macroState).toBe('WORK');
  expect(workOverload.subAction).toBe('overloaded');
  expect(workOverload.primaryFx).toBe('emote-crash');
  expect(workOverload.secondaryFx).toBe('emote-sweat');

  const restNap = resolveActorBrain({
   view, actorId: 'bluewhale', activity: 'rest', zone: 'lounge',
   deskSeated: false, walking: false, reaction: 'sleepy', overloaded: false,
   poiKind: 'sofa', elapsed: 4, still: false
  });
  expect(restNap.macroState).toBe('REST');
  expect(restNap.poseKey).toBe('rest_3q');
  expect(restNap.primaryFx).toBe('emote-zzz');

  const restCoffee = resolveActorBrain({
   view, actorId: 'bluewhale', activity: 'idle', zone: 'lounge',
   deskSeated: false, walking: false, reaction: 'neutral', overloaded: false,
   poiKind: 'coffee', elapsed: 4, still: false
  });
  expect(restCoffee.macroState).toBe('REST');
  expect(restCoffee.subAction).toBe('coffee_break');
  expect(restCoffee.poseKey).toBe('rest_3q');
  expect(restCoffee.primaryFx).toBe('prop-coffee_cup');

  const dailyCelebrate = resolveActorBrain({
   view, actorId: 'bluewhale', activity: 'idle', zone: 'lounge',
   deskSeated: false, walking: false, reaction: 'happy', overloaded: false,
   poiKind: null, elapsed: 4, still: false
  });
  expect(dailyCelebrate.macroState).toBe('DAILY');
  expect(dailyCelebrate.subAction).toBe('celebrate');
  expect(dailyCelebrate.poseKey).toBe('stand_3q');
  expect(dailyCelebrate.primaryFx).toBe('emote-excited');

  const dailyWalk = resolveActorBrain({
   view, actorId: 'bluewhale', activity: 'idle', zone: 'lounge',
   deskSeated: false, walking: true, reaction: 'neutral', overloaded: false,
   poiKind: 'roam', elapsed: 4, still: false
  });
  expect(dailyWalk.macroState).toBe('DAILY');
  expect(dailyWalk.subAction).toBe('roam');
  expect(dailyWalk.poseKey).toBe('walk_3q');

  expect(JSON.stringify(view)).toBe(before);
 });

 it('loads shipped bluewhale rig.json and fx/catalog.json with calibrated per-pose scale and anchors', () => {
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
  expect(resolvePoseAnchors(rig, 'work_front').headTop[1]).toBeGreaterThan(resolvePoseAnchors(rig, 'stand_3q').headTop[1]);
  expect(rig.optionalPoses?.back_3q?.file).toBe('back_3q.webp');
  expect(fx).toHaveLength(18);
  expect(new Set(fx.map(item => item.id)).size).toBe(18);
 });
});
