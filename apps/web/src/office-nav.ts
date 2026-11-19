import type {Facing, PoiKind} from './art/chibi-types.js';
import {slotPoint} from './office-scene-spec.js';
import {fnvHash} from './living-adapter.js';

export interface NavPoint {
 x: number;
 y: number;
}

export interface NavObstacle {
 kind: string;
 x: number;
 y: number;
}

export interface OfficePoi {
 id: string;
 kind: Exclude<PoiKind, null>;
 x: number;
 y: number;
 facing: Facing;
}

export interface OfficeNavGrid {
 readonly originX: number;
 readonly originY: number;
 readonly cellSize: number;
 readonly cols: number;
 readonly rows: number;
 readonly blocked: Uint8Array;
}

const NAV_ORIGIN_X = 140;
const NAV_ORIGIN_Y = 560;
const NAV_CELL = 40;
const NAV_COLS = 42; // 140..1820
const NAV_ROWS = 11; // 560..1000

const FOOTPRINTS: Readonly<Record<string, {halfW: number; back: number; front: number}>> = {
 basic: {halfW: 92, back: 46, front: 12},
 standard: {halfW: 92, back: 46, front: 12},
 whiteboard: {halfW: 86, back: 36, front: 10},
 coffee: {halfW: 60, back: 36, front: 10},
 sofa: {halfW: 94, back: 36, front: 10},
 server: {halfW: 50, back: 36, front: 10},
 dining: {halfW: 112, back: 40, front: 14},
 reading: {halfW: 112, back: 40, front: 14}
};

function clamp(v: number, min: number, max: number): number {
 return Math.max(min, Math.min(max, v));
}

function worldToCell(grid: OfficeNavGrid, p: NavPoint): {c: number; r: number} {
 return {
  c: clamp(Math.floor((p.x - grid.originX) / grid.cellSize), 0, grid.cols - 1),
  r: clamp(Math.floor((p.y - grid.originY) / grid.cellSize), 0, grid.rows - 1)
 };
}

function cellToWorld(grid: OfficeNavGrid, c: number, r: number): NavPoint {
 return {
  x: grid.originX + (c + 0.5) * grid.cellSize,
  y: grid.originY + (r + 0.5) * grid.cellSize
 };
}

function cellIndex(grid: OfficeNavGrid, c: number, r: number): number {
 return r * grid.cols + c;
}

export function bakeOfficeNavGrid(obstacles: readonly NavObstacle[]): OfficeNavGrid {
 const blocked = new Uint8Array(NAV_COLS * NAV_ROWS);
 const grid: OfficeNavGrid = {
  originX: NAV_ORIGIN_X,
  originY: NAV_ORIGIN_Y,
  cellSize: NAV_CELL,
  cols: NAV_COLS,
  rows: NAV_ROWS,
  blocked
 };

 for (const obs of obstacles) {
  const fp = FOOTPRINTS[obs.kind] ?? {halfW: 70, back: 34, front: 10};
  const minX = obs.x - fp.halfW;
  const maxX = obs.x + fp.halfW;
  const minY = obs.y - fp.back;
  const maxY = obs.y + fp.front;
  const c0 = clamp(Math.floor((minX - NAV_ORIGIN_X) / NAV_CELL), 0, NAV_COLS - 1);
  const c1 = clamp(Math.floor((maxX - NAV_ORIGIN_X) / NAV_CELL), 0, NAV_COLS - 1);
  const r0 = clamp(Math.floor((minY - NAV_ORIGIN_Y) / NAV_CELL), 0, NAV_ROWS - 1);
  const r1 = clamp(Math.floor((maxY - NAV_ORIGIN_Y) / NAV_CELL), 0, NAV_ROWS - 1);
  for (let r = r0; r <= r1; r++) {
   for (let c = c0; c <= c1; c++) {
    const center = cellToWorld(grid, c, r);
    if (center.x >= minX && center.x <= maxX && center.y >= minY && center.y <= maxY) {
     blocked[cellIndex(grid, c, r)] = 1;
    }
   }
  }
 }
 return grid;
}

export function isCellWalkable(grid: OfficeNavGrid, c: number, r: number): boolean {
 return c >= 0 && c < grid.cols && r >= 0 && r < grid.rows && grid.blocked[cellIndex(grid, c, r)] === 0;
}

function nearestWalkableCell(grid: OfficeNavGrid, c: number, r: number): {c: number; r: number} | null {
 if (isCellWalkable(grid, c, r)) return {c, r};
 for (let radius = 1; radius <= 6; radius++) {
  let best: {c: number; r: number; d: number} | null = null;
  for (let dr = -radius; dr <= radius; dr++) {
   for (let dc = -radius; dc <= radius; dc++) {
    if (Math.abs(dr) !== radius && Math.abs(dc) !== radius) continue;
    const nc = c + dc;
    const nr = r + dr;
    if (!isCellWalkable(grid, nc, nr)) continue;
    const d = dc * dc + dr * dr;
    if (!best || d < best.d) best = {c: nc, r: nr, d};
   }
  }
  if (best) return {c: best.c, r: best.r};
 }
 return null;
}

function hasLineOfSight(grid: OfficeNavGrid, a: NavPoint, b: NavPoint): boolean {
 const dist = Math.hypot(b.x - a.x, b.y - a.y);
 const steps = Math.max(1, Math.ceil(dist / (grid.cellSize * 0.45)));
 for (let i = 1; i < steps; i++) {
  const t = i / steps;
  const cell = worldToCell(grid, {x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t});
  if (!isCellWalkable(grid, cell.c, cell.r)) return false;
 }
 return true;
}

/**
 * Lightweight 8-direction A* on the 42x11 office grid with corner-cut prevention and string-pull smoothing.
 * Returns waypoints excluding start and ending at exact goal.
 */
export function findNavPath(grid: OfficeNavGrid, start: NavPoint, goal: NavPoint): NavPoint[] {
 if (Math.hypot(goal.x - start.x, goal.y - start.y) <= 2) return [{x: goal.x, y: goal.y}];
 if (hasLineOfSight(grid, start, goal)) return [{x: goal.x, y: goal.y}];

 const rawStart = worldToCell(grid, start);
 const rawGoal = worldToCell(grid, goal);
 const startCell = nearestWalkableCell(grid, rawStart.c, rawStart.r);
 const goalCell = nearestWalkableCell(grid, rawGoal.c, rawGoal.r);
 if (!startCell || !goalCell) return [{x: goal.x, y: goal.y}];

 const startIdx = cellIndex(grid, startCell.c, startCell.r);
 const goalIdx = cellIndex(grid, goalCell.c, goalCell.r);
 if (startIdx === goalIdx) return [{x: goal.x, y: goal.y}];

 const total = grid.cols * grid.rows;
 const gScore = new Float32Array(total).fill(Infinity);
 const fScore = new Float32Array(total).fill(Infinity);
 const cameFrom = new Int32Array(total).fill(-1);
 const closed = new Uint8Array(total);
 const inOpen = new Uint8Array(total);
 const open: number[] = [startIdx];

 const heuristic = (idx: number) => {
  const c = idx % grid.cols;
  const r = Math.floor(idx / grid.cols);
  return Math.hypot(c - goalCell.c, r - goalCell.r);
 };

 gScore[startIdx] = 0;
 fScore[startIdx] = heuristic(startIdx);
 inOpen[startIdx] = 1;

 const dirs: readonly [number, number, number][] = [
  [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
  [1, 1, 1.4142], [1, -1, 1.4142], [-1, 1, 1.4142], [-1, -1, 1.4142]
 ];

 while (open.length > 0) {
  let bestPos = 0;
  let current = open[0]!;
  let bestF = fScore[current]!;
  for (let i = 1; i < open.length; i++) {
   const idx = open[i]!;
   if (fScore[idx]! < bestF) {
    bestF = fScore[idx]!;
    current = idx;
    bestPos = i;
   }
  }
  if (current === goalIdx) {
   const cells: NavPoint[] = [];
   let cur = current;
   while (cur !== -1 && cur !== startIdx) {
    cells.push(cellToWorld(grid, cur % grid.cols, Math.floor(cur / grid.cols)));
    cur = cameFrom[cur]!;
   }
   cells.reverse();
   if (cells.length > 0) cells[cells.length - 1] = {x: goal.x, y: goal.y};
   else cells.push({x: goal.x, y: goal.y});

   // String-pull smoothing: drop redundant intermediate waypoints when direct LOS is clear.
   const smoothed: NavPoint[] = [];
   let anchor = start;
   let i = 0;
   while (i < cells.length) {
    let farthest = i;
    for (let j = cells.length - 1; j > i; j--) {
     if (hasLineOfSight(grid, anchor, cells[j]!)) {
      farthest = j;
      break;
     }
    }
    const nextPt = cells[farthest]!;
    smoothed.push(nextPt);
    anchor = nextPt;
    i = farthest + 1;
   }
   return smoothed;
  }

  open.splice(bestPos, 1);
  inOpen[current] = 0;
  closed[current] = 1;

  const cc = current % grid.cols;
  const cr = Math.floor(current / grid.cols);
  for (const [dc, dr, cost] of dirs) {
   const nc = cc + dc;
   const nr = cr + dr;
   if (!isCellWalkable(grid, nc, nr)) continue;
   // Prevent diagonal corner cutting across furniture corners.
   if (dc !== 0 && dr !== 0 && (!isCellWalkable(grid, cc + dc, cr) || !isCellWalkable(grid, cc, cr + dr))) continue;
   const nIdx = cellIndex(grid, nc, nr);
   if (closed[nIdx]) continue;
   const tentative = gScore[current]! + cost;
   if (tentative < gScore[nIdx]!) {
    cameFrom[nIdx] = current;
    gScore[nIdx] = tentative;
    fScore[nIdx] = tentative + heuristic(nIdx);
    if (!inOpen[nIdx]) {
     open.push(nIdx);
     inOpen[nIdx] = 1;
    }
   }
  }
 }

 return [{x: goal.x, y: goal.y}];
}

export function extractOfficePois(
 items: readonly {id: string; kind: string; slot: string | null}[],
 chapter: number,
 scene: string
): OfficePoi[] {
 const pois: OfficePoi[] = [];
 if (scene === 'workshop') {
  for (const item of items) {
   if (!item.slot) continue;
   const p = slotPoint(item.slot, chapter);
   if (item.kind === 'coffee') {
    pois.push({id: `${item.id}:coffee`, kind: 'coffee', x: clamp(p.x + 12, 170, 1770), y: clamp(p.y + 42, 580, 960), facing: 'left'});
   } else if (item.kind === 'sofa') {
    pois.push({id: `${item.id}:sofa-0`, kind: 'sofa', x: clamp(p.x - 42, 170, 1770), y: clamp(p.y + 24, 580, 960), facing: 'right'});
    pois.push({id: `${item.id}:sofa-1`, kind: 'sofa', x: clamp(p.x + 42, 170, 1770), y: clamp(p.y + 24, 580, 960), facing: 'left'});
   } else if (item.kind === 'whiteboard') {
    pois.push({id: `${item.id}:wb-0`, kind: 'whiteboard', x: clamp(p.x - 56, 170, 1770), y: clamp(p.y + 44, 580, 960), facing: 'right'});
    pois.push({id: `${item.id}:wb-1`, kind: 'whiteboard', x: clamp(p.x + 56, 170, 1770), y: clamp(p.y + 44, 580, 960), facing: 'left'});
   } else if (item.kind === 'server') {
    pois.push({id: `${item.id}:srv`, kind: 'server', x: clamp(p.x - 62, 170, 1770), y: clamp(p.y + 36, 580, 960), facing: 'right'});
   }
  }
  // Open studio aisle stroll anchors so idle characters can tour naturally even with minimal furniture.
  const aisles: readonly [number, number, Facing][] = [
   [320, 740, 'right'],
   [520, 905, 'right'],
   [880, 925, 'left'],
   [1240, 915, 'left'],
   [1520, 760, 'left']
  ];
  aisles.forEach(([x, y, facing], i) => pois.push({id: `aisle:${i}`, kind: 'roam', x, y, facing}));
 } else {
  const spots: readonly [number, number, Facing][] = [
   [460, 760, 'right'],
   [760, 860, 'right'],
   [1120, 860, 'left'],
   [1420, 760, 'left']
  ];
  spots.forEach(([x, y, facing], i) => pois.push({id: `public:${i}`, kind: 'roam', x, y, facing}));
 }
 return pois;
}

export interface PickRoamInput {
 actorId: string;
 seedKey: string;
 preferRest: boolean;
 origin: NavPoint;
 grid: OfficeNavGrid;
 pois: readonly OfficePoi[];
 occupied: readonly NavPoint[];
 reservedPoiIds: ReadonlySet<string>;
}

/**
 * Deterministic presentation-layer POI selector for autonomous roaming & resting.
 */
export function pickRoamTarget(input: PickRoamInput): {point: NavPoint; poiId: string | null; poiKind: PoiKind; facing: Facing} {
 const {actorId, seedKey, preferRest, origin, grid, pois, occupied, reservedPoiIds} = input;
 const h = fnvHash(`${actorId}:${seedKey}`);

 const isFree = (p: NavPoint) => {
  const cell = worldToCell(grid, p);
  if (!isCellWalkable(grid, cell.c, cell.r)) return false;
  return !occupied.some(o => Math.abs(o.x - p.x) < 92 && Math.abs(o.y - p.y) < 76);
 };

 // 1/4 chance to return to home lounge anchor when not explicitly seeking rest furniture.
 if (!preferRest && h % 4 === 0 && isFree(origin)) {
  return {point: {x: origin.x, y: origin.y}, poiId: null, poiKind: null, facing: h % 2 === 0 ? 'right' : 'left'};
 }

 const available = pois.filter(p => !reservedPoiIds.has(p.id) && isFree(p));
 const preferred = preferRest
  ? available.filter(p => p.kind === 'sofa' || p.kind === 'coffee')
  : available;
 const pool = preferred.length > 0 ? preferred : available;
 if (pool.length > 0) {
  const chosen = pool[h % pool.length]!;
  return {point: {x: chosen.x, y: chosen.y}, poiId: chosen.id, poiKind: chosen.kind, facing: chosen.facing};
 }

 return {point: {x: origin.x, y: origin.y}, poiId: null, poiKind: null, facing: 'right'};
}
