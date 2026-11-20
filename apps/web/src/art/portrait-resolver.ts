import {avatarPortraitArt,basePortraitArt,flagshipPortraitArt} from '../portraits-art.js';
import {stageBPortrait} from '../character-profiles.js';

export const FLAGSHIP_VERSION_BY_CHARACTER:Readonly<Record<string,string>>={
 bluewhale:'bluewhale.r1',
 qwen:'qwen.qwq',
 llama:'llama.3.1',
 mistral:'mistral.large',
 gpt:'gpt.4o',
 claude:'claude.sonnet',
 kimi:'kimi.k2',
 gemini:'gemini.pro',
 grok:'grok.3',
 glm:'glm.plus',
 minimax:'minimax.01',
 seedance:'seedance.pro'
};

/**
 * Legacy portrait fallback toggle (keeps ai-village/portraits/*.png & stage-b/*.webp short-term).
 * Supports URL (?portraits=legacy / ?portraits=0), document dataset (data-portraits="legacy"),
 * and localStorage ('oot-portraits-legacy' === '1').
 */
export function isLegacyPortraitsFallbackActive():boolean{
 if(typeof window==='undefined')return false;
 try{
  const sp=new URLSearchParams(window.location.search);
  const param=sp.get('portraits');
  if(param==='0'||param==='legacy'||param==='off')return true;
  if(param==='1'||param==='on')return false;
 }catch{
  // Ignore URL parsing errors in restricted environments.
 }
 if(typeof document!=='undefined'&&document.documentElement.dataset.portraits==='legacy')return true;
 try{
  return window.localStorage.getItem('oot-portraits-legacy')==='1';
 }catch{
  return false;
 }
}

export function isFlagshipVersion(characterId:string,versionId?:string|undefined):boolean{
 return !!versionId&&Object.hasOwn(FLAGSHIP_VERSION_BY_CHARACTER,characterId)&&FLAGSHIP_VERSION_BY_CHARACTER[characterId]===versionId;
}

export function resolveAvatarArt(characterId:string,legacyOverride?:boolean):string{
 const isLegacy=legacyOverride??isLegacyPortraitsFallbackActive();
 if(isLegacy)return `./art/ai-village/portraits/${characterId}.png`;
 return avatarPortraitArt(characterId)??`./art/ai-village/portraits/${characterId}.png`;
}

export function resolveBasePortraitArt(characterId:string,legacyOverride?:boolean):string{
 const isLegacy=legacyOverride??isLegacyPortraitsFallbackActive();
 if(isLegacy)return `./art/ai-village/portraits/${characterId}.png`;
 return basePortraitArt(characterId)??`./art/ai-village/portraits/${characterId}.png`;
}

export function resolveFlagshipPortraitArt(characterId:string,legacyOverride?:boolean):string|null{
 const isLegacy=legacyOverride??isLegacyPortraitsFallbackActive();
 if(isLegacy)return stageBPortrait(characterId);
 return flagshipPortraitArt(characterId)??stageBPortrait(characterId);
}

export interface ResolvedStageArt {
 src:string;
 tier:'base'|'flagship';
 isLegacy:boolean;
 versionBadge:string;
}

export function resolveCharacterStageArt(
 characterId:string,
 options?:{versionId?:string|undefined;forceForm?:'base'|'flagship'|undefined;legacy?:boolean|undefined}
):ResolvedStageArt{
 const isLegacy=options?.legacy??isLegacyPortraitsFallbackActive();
 const versionId=options?.versionId;
 const useFlagship=options?.forceForm==='flagship'
  ?true
  :options?.forceForm==='base'
   ?false
   :isFlagshipVersion(characterId,versionId);

 if(useFlagship){
  const flagshipSrc=resolveFlagshipPortraitArt(characterId,isLegacy);
  if(flagshipSrc){
   const badgeId=Object.hasOwn(FLAGSHIP_VERSION_BY_CHARACTER,characterId)?FLAGSHIP_VERSION_BY_CHARACTER[characterId]!:versionId;
   return {
    src:flagshipSrc,
    tier:'flagship',
    isLegacy,
    versionBadge:badgeId?badgeId.split('.').slice(1).join('.').toUpperCase():'FLAGSHIP'
   };
  }
 }

 return {
  src:resolveBasePortraitArt(characterId,isLegacy),
  tier:'base',
  isLegacy,
  versionBadge:versionId?versionId.split('.').slice(1).join('.').toUpperCase():'BASE'
 };
}
