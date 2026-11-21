import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {portraitCharacters,portraitEmotions} from '../web/src/portraits-art.js';
import {
 emotionForEmote,
 emotionForThreadContext,
 resolveExpressionAvatarArt
} from '../web/src/art/portrait-resolver.js';
import {
 TOWN_MAP_PINS,
 resolveClientAvatarArt,
 resolveCommissionOutcomeSlot,
 resolveEndingArt,
 resolveExperienceOrExpansionArt,
 resolvePaperclipMascotArt,
 resolveSoftwareIconArt,
 resolveTownMapBackdropArt,
 resolveWorldArt
} from '../web/src/art/story-expansion-resolver.js';
import {
 CANTEEN_DECOR_PLACEMENTS,
 LIBRARY_DECOR_PLACEMENTS,
 WORKSHOP_DECOR_PLACEMENTS,
 decorPlacementsForScene
} from '../web/src/art/furniture-rig.js';

describe('Art-Batch 13, 14 & 15 unified engine integration',()=>{
 it('resolves Art-Batch 13 watercolor clients, 16:9 endings, 3:2 worlds, and Paperclip mascot with legacy fallback',()=>{
  for(const clientId of ['tea-lin','book-zhou','tech-yan','curator-su','oss-zhe','vc-lu']){
   expect(resolveClientAvatarArt(clientId)).toBe(`./art/story/client-${clientId}.webp`);
   expect(resolveClientAvatarArt(clientId,true)).toBe(`./art/living/client-${clientId}.webp`);
  }
  for(const endingId of ['independent','acquired','open-source','warm-shop','paperclip']){
   expect(resolveEndingArt(endingId)).toBe(`./art/story/ending-${endingId}.webp`);
   expect(resolveEndingArt(endingId,true)).toBe(`./art/${endingId}.webp`);
  }
  for(const worldId of ['slime','paper','castle']){
   expect(resolveWorldArt(worldId)).toBe(`./art/story/world-${worldId}.webp`);
   expect(resolveWorldArt(worldId,true)).toBe(`./art/${worldId}.webp`);
  }
  expect(resolvePaperclipMascotArt('idle')).toBe('./art/story/mascot-paperclip-idle.webp');
  expect(resolvePaperclipMascotArt('alert')).toBe('./art/story/mascot-paperclip-alert.webp');
  expect(resolvePaperclipMascotArt('idle',true)).toBeNull();
 });

 it('mounts scene-specific clickable decor props across workshop, canteen, and library',()=>{
  expect(decorPlacementsForScene('workshop')).toBe(WORKSHOP_DECOR_PLACEMENTS);
  expect(decorPlacementsForScene('canteen')).toBe(CANTEEN_DECOR_PLACEMENTS);
  expect(decorPlacementsForScene('library')).toBe(LIBRARY_DECOR_PLACEMENTS);
  expect(CANTEEN_DECOR_PLACEMENTS.map(d=>d.id)).toEqual(['decor-ramen_cart','decor-bento_board']);
  expect(LIBRARY_DECOR_PLACEMENTS.map(d=>d.id)).toEqual(['decor-book_trolley','decor-library_owl']);
 });

 it('resolves Art-Batch 14 expansion outcomes, vignettes, software icons, and exact town map pins',()=>{
  // Preserves frozen Art-Batch 7 templates
  expect(resolveCommissionOutcomeSlot('menu')).toBe('outcome-tea-menu');
  expect(resolveCommissionOutcomeSlot('incubator-build')).toBe('outcome-bookshop-system');
  // Maps mid/late-game templates to Art-Batch 14 outcomes
  expect(resolveCommissionOutcomeSlot('speech')).toBe('outcome-pitch-demo');
  expect(resolveCommissionOutcomeSlot('bugs')).toBe('outcome-code-ops');
  expect(resolveCommissionOutcomeSlot('release-night')).toBe('outcome-release-night');
  expect(resolveCommissionOutcomeSlot('finale-clinic-queue')).toBe('outcome-crisis-429');
  expect(resolveCommissionOutcomeSlot('finale-museum-voices')).toBe('outcome-museum-media');
  expect(resolveCommissionOutcomeSlot('finale-open-manual')).toBe('outcome-open-dawn');
  expect(resolveCommissionOutcomeSlot('bugs',true)).toBe('outcome-workshop-display');

  expect(resolveExperienceOrExpansionArt('outcome-code-ops')).toBe('./art/expansion/outcome-code-ops.webp');
  expect(resolveExperienceOrExpansionArt('vignette-chapter-clear')).toBe('./art/expansion/vignette-chapter-clear.webp');
  expect(resolveExperienceOrExpansionArt('vignette-duo-tea')).toBe('./art/expansion/vignette-duo-tea.webp');
  expect(resolveExperienceOrExpansionArt('vignette-crisis-429')).toBe('./art/expansion/vignette-crisis-429.webp');
  expect(resolveExperienceOrExpansionArt('outcome-tea-menu')).toBe('./art/experience/outcome-tea-menu.webp');

  for(const sw of ['rag','vllm','autotest','multiagent','versioncontrol','tokenbank','prompt','remote']){
   expect(resolveSoftwareIconArt(sw)).toBe(`./art/expansion/software-${sw}.webp`);
  }
  expect(resolveSoftwareIconArt('mcp')).toBe('./art/upgrades/software-mcp.webp');
  expect(resolveSoftwareIconArt('rag',true)).toBe('./art/upgrades/software-explain.webp');

  expect(resolveTownMapBackdropArt()).toBe('./art/expansion/world-town-map.webp');
  expect(resolveTownMapBackdropArt(true)).toBeNull();

  const raw=readFileSync(resolve(process.cwd(),'apps/web/public/art/expansion/catalog.json'),'utf8');
  const catalog=JSON.parse(raw) as {assets:Array<{id:string;mapPins?:Record<string,{x:number;y:number}>}>};
  const mapEntry=catalog.assets.find(a=>a.id==='world-town-map');
  expect(mapEntry?.mapPins).toEqual(TOWN_MAP_PINS);
 });

 it('resolves Art-Batch 15A/15B expression avatars for all 12 characters and contextual emotion mappers',()=>{
  for(const id of portraitCharacters){
   expect(resolveExpressionAvatarArt(id,'default')).toBe(`./art/portraits/avatars/${id}.webp`);
   for(const emotion of portraitEmotions){
    expect(resolveExpressionAvatarArt(id,emotion)).toBe(`./art/portraits/expressions/${id}-${emotion}.webp`);
    expect(resolveExpressionAvatarArt(id,emotion,true)).toBe(`./art/ai-village/portraits/${id}.png`);
   }
  }
  expect(emotionForEmote('sparkle')).toBe('happy');
  expect(emotionForEmote('sweat')).toBe('flustered');
  expect(emotionForEmote('idea')).toBe('focused');
  expect(emotionForThreadContext('429 危机！限流告警来不及了')).toBe('flustered');
  expect(emotionForThreadContext('恭喜交付成功，今晚聚餐干杯！')).toBe('happy');
  expect(emotionForThreadContext('请帮忙复核一下架构方案清单')).toBe('focused');
 });
});
