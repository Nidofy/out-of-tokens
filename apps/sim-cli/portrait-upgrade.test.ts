import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {loadFullContent} from 'oot-content';
import {portraitCharacters} from '../web/src/portraits-art.js';
import {
 FLAGSHIP_VERSION_BY_CHARACTER,
 isFlagshipVersion,
 resolveAvatarArt,
 resolveBasePortraitArt,
 resolveCharacterStageArt,
 resolveFlagshipPortraitArt
} from '../web/src/art/portrait-resolver.js';

describe('Art-Batch 12A/12B portrait & avatar engine integration',()=>{
 it('resolves modern base, flagship, and avatar WebP assets for all 12 characters by default',()=>{
  expect(portraitCharacters).toHaveLength(12);
  for(const id of portraitCharacters){
   expect(resolveAvatarArt(id)).toBe(`./art/portraits/avatars/${id}.webp`);
   expect(resolveBasePortraitArt(id)).toBe(`./art/portraits/base/${id}.webp`);
   expect(resolveFlagshipPortraitArt(id)).toBe(`./art/portraits/flagship/${id}.webp`);

   const baseStage=resolveCharacterStageArt(id);
   expect(baseStage).toEqual({
    src:`./art/portraits/base/${id}.webp`,
    tier:'base',
    isLegacy:false,
    versionBadge:'BASE'
   });

   const forcedFlagship=resolveCharacterStageArt(id,{forceForm:'flagship'});
   expect(forcedFlagship.src).toBe(`./art/portraits/flagship/${id}.webp`);
   expect(forcedFlagship.tier).toBe('flagship');
   expect(forcedFlagship.isLegacy).toBe(false);
  }
 });

 it('automatically switches between base and flagship illustrations across all authored content versions',()=>{
  const content=loadFullContent();
  for(const v of content.versions){
   const expectedFlagship=FLAGSHIP_VERSION_BY_CHARACTER[v.character]===v.id;
   expect(isFlagshipVersion(v.character,v.id)).toBe(expectedFlagship);

   const resolved=resolveCharacterStageArt(v.character,{versionId:v.id});
   expect(resolved.tier).toBe(expectedFlagship?'flagship':'base');
   expect(resolved.src).toBe(
    expectedFlagship
     ?`./art/portraits/flagship/${v.character}.webp`
     :`./art/portraits/base/${v.character}.webp`
   );
  }
 });

 it('cleanly reverts to legacy PaperDoll avatars and stage-b portraits when legacy fallback is active',()=>{
  for(const id of portraitCharacters){
   const flagshipVer=FLAGSHIP_VERSION_BY_CHARACTER[id]!;
   expect(resolveAvatarArt(id,true)).toBe(`./art/ai-village/portraits/${id}.png`);
   expect(resolveBasePortraitArt(id,true)).toBe(`./art/ai-village/portraits/${id}.png`);
   expect(resolveFlagshipPortraitArt(id,true)).toBe(`./art/stage-b/${flagshipVer}.webp`);

   const legacyBase=resolveCharacterStageArt(id,{versionId:`${id}.base`,legacy:true});
   expect(legacyBase.src).toBe(`./art/ai-village/portraits/${id}.png`);
   expect(legacyBase.tier).toBe('base');
   expect(legacyBase.isLegacy).toBe(true);

   const legacyFlagship=resolveCharacterStageArt(id,{versionId:flagshipVer,legacy:true});
   expect(legacyFlagship.src).toBe(`./art/stage-b/${flagshipVer}.webp`);
   expect(legacyFlagship.tier).toBe('flagship');
   expect(legacyFlagship.isLegacy).toBe(true);
  }
 });

 it('rejects unknown or prototype-pollution character IDs without misclassifying flagship versions',()=>{
  for(const bad of ['unknown','','../../bad','constructor','toString','__proto__']){
   expect(isFlagshipVersion(bad,'bluewhale.r1')).toBe(false);
   expect(resolveFlagshipPortraitArt(bad)).toBeNull();
  }
  expect(isFlagshipVersion('qwen','gpt.4o')).toBe(false);
  expect(resolveCharacterStageArt('qwen',{versionId:'gpt.4o'}).tier).toBe('base');
 });

 it('routes all upgraded UI components through portrait-resolver instead of hardcoding ai-village/portraits',()=>{
  const upgradedFiles=[
   'apps/web/src/alpha-app.tsx',
   'apps/web/src/partner-profile.tsx',
   'apps/web/src/studio-ui.tsx',
   'apps/web/src/bark-overlay.tsx',
   'apps/web/src/messenger-drawer.tsx',
   'apps/web/src/commission-workbench.tsx'
  ];
  for(const rel of upgradedFiles){
   const src=readFileSync(resolve(process.cwd(),rel),'utf8');
   expect(src,`${rel} still hardcodes ai-village/portraits/`).not.toContain('ai-village/portraits/');
  }
 });
});
