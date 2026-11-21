import {clientArt} from '../living-art.js';
import {softwareArt} from '../generated-art.js';
import {experienceArt} from '../experience-art.js';
import {endingArt,paperclipMascotArt,storyClientArt,worldArt} from '../story-art.js';
import {expansionOutcomeArt,expansionSoftwareArt,expansionVignetteArt,worldTownMapArt} from '../expansion-art.js';
import {artSlotForJobTemplate} from '../experience-adapter.js';

export const TOWN_MAP_PINS:Readonly<Record<'workshop'|'canteen'|'library'|'expedition',{x:number;y:number}>>={
 workshop:{x:0.296875,y:0.6888888888888889},
 canteen:{x:0.4375,y:0.30833333333333335},
 library:{x:0.79765625,y:0.26944444444444443},
 expedition:{x:0.784375,y:0.6611111111111111}
};

/**
 * Legacy fallback toggle for Art-Batch 13 & 14 story/world/expansion art.
 * Supports URL (?story=legacy / ?story=0), document dataset (data-story="legacy"),
 * and localStorage ('oot-story-legacy' === '1').
 */
export function isLegacyStoryFallbackActive():boolean{
 if(typeof window==='undefined')return false;
 try{
  const sp=new URLSearchParams(window.location.search);
  const param=sp.get('story');
  if(param==='0'||param==='legacy'||param==='off')return true;
  if(param==='1'||param==='on')return false;
 }catch{
  // Ignore URL parsing errors in restricted environments.
 }
 if(typeof document!=='undefined'&&document.documentElement.dataset.story==='legacy')return true;
 try{
  return window.localStorage.getItem('oot-story-legacy')==='1';
 }catch{
  return false;
 }
}

export function resolveClientAvatarArt(clientId:string,legacyOverride?:boolean):string{
 const isLegacy=legacyOverride??isLegacyStoryFallbackActive();
 if(isLegacy)return clientArt(clientId);
 return storyClientArt(clientId)??clientArt(clientId);
}

export function resolveEndingArt(endingId:string,legacyOverride?:boolean):string{
 const isLegacy=legacyOverride??isLegacyStoryFallbackActive();
 if(isLegacy)return `./art/${endingId}.webp`;
 return endingArt(endingId)??`./art/${endingId}.webp`;
}

export function resolveWorldArt(worldId:string,legacyOverride?:boolean):string{
 const isLegacy=legacyOverride??isLegacyStoryFallbackActive();
 if(isLegacy)return `./art/${worldId}.webp`;
 return worldArt(worldId)??`./art/${worldId}.webp`;
}

export function resolvePaperclipMascotArt(pose:'idle'|'alert',legacyOverride?:boolean):string|null{
 const isLegacy=legacyOverride??isLegacyStoryFallbackActive();
 if(isLegacy)return null;
 return paperclipMascotArt(pose);
}

export function resolveSoftwareIconArt(softwareId:string,legacyOverride?:boolean):string{
 const isLegacy=legacyOverride??isLegacyStoryFallbackActive();
 if(isLegacy)return softwareArt(softwareId);
 return expansionSoftwareArt(softwareId)??softwareArt(softwareId);
}

export function resolveTownMapBackdropArt(legacyOverride?:boolean):string|null{
 const isLegacy=legacyOverride??isLegacyStoryFallbackActive();
 return isLegacy?null:worldTownMapArt;
}

/**
 * Resolves either frozen Art-Batch 7 experience slots or Art-Batch 14 expansion outcome/vignette slots.
 */
export function resolveExperienceOrExpansionArt(slotId:string,legacyOverride?:boolean):string|null{
 const isLegacy=legacyOverride??isLegacyStoryFallbackActive();
 if(!isLegacy){
  if(slotId.startsWith('outcome-')){
   const ext=expansionOutcomeArt(slotId.slice('outcome-'.length));
   if(ext)return ext;
  }
  if(slotId.startsWith('vignette-')){
   const ext=expansionVignetteArt(slotId.slice('vignette-'.length));
   if(ext)return ext;
  }
 }
 return experienceArt(slotId);
}

const EXPANSION_OUTCOME_BY_TEMPLATE:Readonly<Record<string,string>>={
 speech:'outcome-pitch-demo',
 pitch:'outcome-pitch-demo',
 bugs:'outcome-code-ops',
 backup:'outcome-code-ops',
 'weekly-script':'outcome-code-ops',
 'release-night':'outcome-release-night',
 'finale-clinic-queue':'outcome-crisis-429',
 'finale-fair-bid':'outcome-crisis-429',
 'finale-museum-voices':'outcome-museum-media',
 'finale-slime-label':'outcome-museum-media',
 'finale-open-manual':'outcome-open-dawn',
 'finale-door-return':'outcome-open-dawn',
 'finale-paperclip-limit':'outcome-open-dawn',
 'finale-archive-audit':'outcome-open-dawn'
};

/**
 * Extends artSlotForJobTemplate with Art-Batch 14 mid/late-game commission outcome cards
 * while keeping frozen Art-Batch 7 mappings intact.
 */
export function resolveCommissionOutcomeSlot(template:string|undefined,legacyOverride?:boolean):string{
 const isLegacy=legacyOverride??isLegacyStoryFallbackActive();
 const base=artSlotForJobTemplate(template);
 if(isLegacy||!template||base!=='outcome-workshop-display')return base;
 if(Object.hasOwn(EXPANSION_OUTCOME_BY_TEMPLATE,template))return EXPANSION_OUTCOME_BY_TEMPLATE[template]!;
 const lower=template.toLowerCase();
 if(/429|queue|crisis|rate|sla|incident|limit|offline/.test(lower))return 'outcome-crisis-429';
 if(/release|deploy|launch|dashboard|monitor|benchmark/.test(lower))return 'outcome-release-night';
 if(/museum|video|audio|voice|poster|exhibit|media|film|music|promo/.test(lower))return 'outcome-museum-media';
 if(/pitch|deck|proposal|speech|report|plan|slides|press/.test(lower))return 'outcome-pitch-demo';
 if(/open|manual|archive|dawn|agi|paperclip|return|policy|research/.test(lower))return 'outcome-open-dawn';
 if(/bug|code|script|backup|api|test|cli|tool|plugin|bot|sql|refactor|ops/.test(lower))return 'outcome-code-ops';
 return base;
}
