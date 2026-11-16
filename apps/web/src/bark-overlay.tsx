import {Icon} from './icons.js';
import {characterPosters,stageBPortrait} from './character-profiles.js';
import {names} from './presentation.js';
import {isFlagshipUnlocked} from './ui2-logic.js';
import {EmoteBadge} from './stage-chatter.js';
import type {EmoteKind,GiftDef} from './living-adapter.js';
import {giftAssetSrc,giftReactionTier} from './living-adapter.js';
import type {GameView} from 'oot-platform';

export interface BarkPayload {
 id:number;
 actorId:string;
 partnerId?:string|undefined;
 emote:EmoteKind;
 label:string;
 text:string;
 partnerText?:string|undefined;
 deltas:string[];
}

const stageBMap:Readonly<Record<string,string>>={bluewhale:'bluewhale.r1',qwen:'qwen.qwq',llama:'llama.3.1',mistral:'mistral.large',gpt:'gpt.4o',claude:'claude.sonnet',kimi:'kimi.k2',gemini:'gemini.pro'};

export function BarkOverlay({bark,view,english,onClose}:{bark:BarkPayload|null;view:GameView;english:boolean;onClose:()=>void}){
 if(!bark)return null;
 const tr=(zh:string,en:string)=>english?en:zh;
 const accent=characterPosters[bark.actorId]?.themeColor??'#8b673c';
 const ready=isFlagshipUnlocked(view,bark.actorId,stageBMap[bark.actorId]??null);
 const art=(ready?stageBPortrait(bark.actorId):null)??`./art/ai-village/portraits/${bark.actorId}.png`;
 const partnerArt=bark.partnerId?`./art/ai-village/portraits/${bark.partnerId}.png`:null;

 return (
  <div class="ui2-bark-card" role="status" aria-live="polite" style={{'--poster-color':accent}}>
   <div class="ui2-bark-portraits">
    <img class="ui2-bark-avatar" src={art} alt=""/>
    {partnerArt&&<img class="ui2-bark-avatar is-partner" src={partnerArt} alt=""/>}
    <EmoteBadge emote={bark.emote} view={view}/>
   </div>
   <div class="ui2-bark-body">
    <header class="ui2-bark-head">
     <b>{names[bark.actorId]??bark.actorId}{bark.partnerId?` × ${names[bark.partnerId]??bark.partnerId}`:''}</b>
     <span class="ui2-bark-tag">{bark.label}</span>
    </header>
    <p>“{bark.text}”</p>
    {bark.partnerText&&<p class="ui2-bark-reply">{names[bark.partnerId!]??bark.partnerId}: “{bark.partnerText}”</p>}
    {bark.deltas.length>0&&(
     <div class="ui2-bark-deltas">{bark.deltas.map((d,i)=><em key={i}>{d}</em>)}</div>
    )}
   </div>
   <button class="ui2-bark-close" aria-label={tr('收起回应','Dismiss response')} onClick={onClose}><Icon name="close"/></button>
  </div>
 );
}

export function GiftPickerGrid({
 actorId,
 gifts,
 giftedIds,
 cash,
 disabled,
 english,
 onSelectGift
}:{
 actorId:string;
 gifts:readonly GiftDef[];
 giftedIds:readonly string[];
 view?:GameView;
 cash:number;
 disabled:boolean;
 english:boolean;
 onSelectGift:(gift:GiftDef)=>void;
}){
 const tr=(zh:string,en:string)=>english?en:zh;
 return (
  <div class="ui2-gift-grid" role="group" aria-label={tr('挑选心意好礼','Choose a signature gift')}>
   {gifts.map(g=>{
    const asset=giftAssetSrc(g.id);
    const known=giftedIds.includes(g.id);
    const tier=giftReactionTier(g,actorId);
    const affordable=cash>=g.cost;
    return (
     <button key={g.id} class="ui2-gift-card" disabled={disabled||!affordable} title={english?g.descEn:g.desc} onClick={()=>onSelectGift(g)}>
      <div class="ui2-gift-thumb">
       <img src={asset} alt=""/>
       {known&&<span class={`ui2-gift-pref is-${tier}`}><Icon name={tier==='love'?'heart':'check'}/>{tier==='love'?tr('偏爱','Loved'):tier==='like'?tr('喜欢','Liked'):tr('已赠','Given')}</span>}
      </div>
      <b>{english?g.nameEn:g.name}</b>
      <small>¥{g.cost}{!known?` · ${tr('品味待探','Taste?')}`:''}</small>
     </button>
    );
   })}
  </div>
 );
}
