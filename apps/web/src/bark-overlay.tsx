import {Icon} from './icons.js';
import {characterPosters} from './character-profiles.js';
import {resolveAvatarArt} from './art/portrait-resolver.js';
import {names} from './presentation.js';
import {EmoteBadge} from './stage-chatter.js';
import type {EmoteKind,GiftDef} from './living-adapter.js';
import {giftAssetSrc,giftReactionTier} from './living-adapter.js';
import type {GameView,ActivityPreview} from 'oot-platform';
import type {Command} from 'oot-core';
import {describeActivityPreview} from './experience-adapter.js';

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

export function BarkOverlay({bark,view,english,inModal=false,onClose}:{bark:BarkPayload|null;view:GameView;english:boolean;inModal?:boolean;onClose:()=>void}){
 if(!bark)return null;
 const tr=(zh:string,en:string)=>english?en:zh;
 const accent=characterPosters[bark.actorId]?.themeColor??'#8b673c';
 const art=resolveAvatarArt(bark.actorId);
 const partnerArt=bark.partnerId?resolveAvatarArt(bark.partnerId):null;

 return (
  <div class="ui2-bark-card" data-in-modal={inModal?'true':'false'} role="status" aria-live="polite" style={{'--poster-color':accent}}>
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
 previewActivity,
 onSelectGift
}:{
 actorId:string;
 gifts:readonly GiftDef[];
 giftedIds:readonly string[];
 view?:GameView;
 cash:number;
 disabled:boolean;
 english:boolean;
 previewActivity?:(cmd:Command)=>ActivityPreview;
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
    const preview=previewActivity?describeActivityPreview(previewActivity({type:'campaign',action:'gift',id:actorId,target:g.id}),english):null;
    return (
     <button key={g.id} class="ui2-gift-card" disabled={disabled||!affordable} title={preview?`${english?g.descEn:g.desc} · ${preview.compactText}`:(english?g.descEn:g.desc)} onClick={()=>onSelectGift(g)}>
      <div class="ui2-gift-thumb">
       <img src={asset} alt=""/>
       {known&&<span class={`ui2-gift-pref is-${tier}`}><Icon name={tier==='love'?'heart':'check'}/>{tier==='love'?tr('偏爱','Loved'):tier==='like'?tr('喜欢','Liked'):tr('已赠','Given')}</span>}
      </div>
      <b>{english?g.nameEn:g.name}</b>
      <small>¥{g.cost}{!known?` · ${tr('品味待探','Taste?')}`:''}</small>
      {preview&&preview.skipsNightRecovery&&<small class="ui2-act-warn">{tr('将跳过今晚恢复','Skips sleep')}</small>}
     </button>
    );
   })}
  </div>
 );
}
