import {Assets, Texture} from 'pixi.js';
import type {GameView} from 'oot-platform';
import {chibiFxArt, chibiFxIds, chibiRigPath, hasChibiRig} from '../chibi-art.js';
import type {ChibiFxCatalogItem, ChibiFxId, ChibiPoseKey, MapleChibiRigData} from './chibi-types.js';

export interface LoadedMapleChibi {
 data: MapleChibiRigData;
 textures: Record<ChibiPoseKey, Texture>;
}

export interface LoadedChibiFxBundle {
 catalog: ReadonlyMap<ChibiFxId, ChibiFxCatalogItem>;
 textures: ReadonlyMap<ChibiFxId, Texture>;
}

const DEFAULT_FX_CATALOG: readonly Omit<ChibiFxCatalogItem, 'sha256' | 'bytes'>[] = [
 {id: 'emote-focus', file: 'emote-focus.webp', anchor: 'headTop', animationPreset: 'pulse', scale: 1.0},
 {id: 'emote-sweat', file: 'emote-sweat.webp', anchor: 'emoteRight', animationPreset: 'drop', scale: 0.9},
 {id: 'emote-crash', file: 'emote-crash.webp', anchor: 'headTop', animationPreset: 'shake', scale: 1.0},
 {id: 'emote-zzz', file: 'emote-zzz.webp', anchor: 'emoteRight', animationPreset: 'float', scale: 1.0},
 {id: 'emote-excited', file: 'emote-excited.webp', anchor: 'emoteLeft', animationPreset: 'pop', scale: 1.0},
 {id: 'emote-daze', file: 'emote-daze.webp', anchor: 'headTop', animationPreset: 'float', scale: 1.0},
 {id: 'prop-code_bit', file: 'prop-code_bit.webp', anchor: 'propHand', animationPreset: 'rise', scale: 0.7},
 {id: 'prop-coffee_cup', file: 'prop-coffee_cup.webp', anchor: 'emoteRight', animationPreset: 'float', scale: 0.9}
];

const rigCache = new Map<string, Promise<LoadedMapleChibi>>();
let fxCache: Promise<LoadedChibiFxBundle> | null = null;

/**
 * Check whether the legacy PaperDoll fallback switch is active.
 * Supports URL (?chibi=0 or ?chibi=legacy), document dataset (data-chibi="legacy"),
 * and localStorage ('oot-chibi-legacy' === '1').
 */
export function isLegacyChibiFallbackActive(): boolean {
 if (typeof window === 'undefined') return false;
 try {
  const sp = new URLSearchParams(window.location.search);
  const param = sp.get('chibi');
  if (param === '0' || param === 'legacy' || param === 'off') return true;
  if (param === '1' || param === 'on') return false;
 } catch {
  // Ignore URL parsing issues in restricted environments.
 }
 if (typeof document !== 'undefined' && document.documentElement.dataset.chibi === 'legacy') return true;
 try {
  return window.localStorage.getItem('oot-chibi-legacy') === '1';
 } catch {
  return false;
 }
}

export function shouldUseChibiRig(characterId: string): boolean {
 return hasChibiRig(characterId) && !isLegacyChibiFallbackActive();
}

export function loadChibiFxBundle(): Promise<LoadedChibiFxBundle> {
 if (fxCache) return fxCache;
 const task = (async (): Promise<LoadedChibiFxBundle> => {
  const catalogMap = new Map<ChibiFxId, ChibiFxCatalogItem>();
  try {
   const res = await fetch('./art/chibi/fx/catalog.json');
   if (res.ok) {
    const items = (await res.json()) as ChibiFxCatalogItem[];
    for (const item of items) {
     if ((chibiFxIds as readonly string[]).includes(item.id)) catalogMap.set(item.id, item);
    }
   }
  } catch {
   // Fall through to built-in default metadata.
  }
  for (const fallback of DEFAULT_FX_CATALOG) {
   if (!catalogMap.has(fallback.id)) {
    catalogMap.set(fallback.id, {...fallback, sha256: '', bytes: 0});
   }
  }

  const textures = new Map<ChibiFxId, Texture>();
  await Promise.all(
   chibiFxIds.map(async id => {
    try {
     const tex = await Assets.load<Texture>(chibiFxArt(id));
     textures.set(id, tex);
    } catch {
     // Keep partial bundle usable if a single optional sticker fails.
    }
   })
  );
  return {catalog: catalogMap, textures};
 })();
 fxCache = task;
 void task.catch(() => {
  if (fxCache === task) fxCache = null;
 });
 return task;
}

export function loadMapleChibiRig(characterId: string): Promise<LoadedMapleChibi> {
 const rigUrl = chibiRigPath(characterId);
 if (!rigUrl) return Promise.reject(Error('CHIBI_RIG_UNAVAILABLE'));
 const existing = rigCache.get(characterId);
 if (existing) return existing;

 const task = (async (): Promise<LoadedMapleChibi> => {
  const response = await fetch(rigUrl);
  if (!response.ok) throw Error('CHIBI_RIG_HTTP_' + response.status);
  const data = (await response.json()) as MapleChibiRigData;
  if (data.schemaVersion !== 2 || data.renderer !== 'maple-chibi') {
   throw Error('CHIBI_RIG_SCHEMA_MISMATCH');
  }
  const base = `./art/chibi/characters/${characterId}/`;
  const poseKeys: readonly ChibiPoseKey[] = ['stand_3q', 'walk_3q', 'work_front', 'rest_3q'];
  const entries = await Promise.all(
   poseKeys.map(async key => {
    const spec = data.poses[key];
    if (!spec?.file) throw Error(`CHIBI_POSE_MISSING:${key}`);
    const tex = await Assets.load<Texture>(base + spec.file);
    return [key, tex] as const;
   })
  );
  return {
   data,
   textures: Object.fromEntries(entries) as Record<ChibiPoseKey, Texture>
  };
 })();

 rigCache.set(characterId, task);
 void task.catch(() => {
  if (rigCache.get(characterId) === task) rigCache.delete(characterId);
 });
 return task;
}

export function warmChibiAssets(view: GameView): void {
 if (isLegacyChibiFallbackActive()) return;
 const scene = view.campaign?.scene ?? 'workshop';
 let anyChibi = false;
 for (const a of view.actors) {
  if (a.location === scene && hasChibiRig(a.id)) {
   anyChibi = true;
   void loadMapleChibiRig(a.id).catch(() => {});
  }
 }
 if (anyChibi) void loadChibiFxBundle().catch(() => {});
}
