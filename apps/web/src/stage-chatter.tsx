import {Icon} from './icons.js';
import {characterPosters} from './character-profiles.js';
import {names} from './presentation.js';
import type {EmoteKind,StageBubbleItem} from './living-adapter.js';
import {emoteAssetSrc} from './living-adapter.js';
import type {GameView} from 'oot-platform';

type AnchorMap=Record<string,{x:number;y:number;visible:boolean}>;

export function EmoteBadge({emote}:{emote:EmoteKind;view?:GameView}){
 return <img class="ui2-emote-img" src={emoteAssetSrc(emote)} alt=""/>;
}

export function StageChatterOverlay({
 bubble,
 step,
 anchors,
 view,
 hidden,
 onInspectActor
}:{
 bubble:StageBubbleItem|null;
 step:0|1;
 anchors:AnchorMap;
 view:GameView;
 hidden:boolean;
 onInspectActor:(id:string)=>void;
}){
 if(!bubble)return null;
 const activeId=step===1&&bubble.buddyId?bubble.buddyId:bubble.actorId;
 const text=step===1&&bubble.buddyText?bubble.buddyText:bubble.text;
 const anchor=anchors[activeId];
 if(!anchor||!anchor.visible)return null;

 const vw=typeof window!=='undefined'?window.innerWidth:1280;
 const vh=typeof window!=='undefined'?window.innerHeight:720;
 const halfW=Math.min(136,Math.floor((vw-24)/2));
 const left=Math.max(halfW+12,Math.min(vw-halfW-12,anchor.x));
 const top=Math.max(76,Math.min(vh-124,anchor.y));
 const accent=characterPosters[activeId]?.themeColor??'#8b673c';

 return (
  <div class="ui2-stage-chatter" style={{left:`${left}px`,top:`${top}px`,'--poster-color':accent,visibility:hidden?'hidden':'visible',pointerEvents:hidden?'none':undefined}}>
   <button class="ui2-stage-bubble" aria-label={`${names[activeId]??activeId}: ${text}`} onClick={()=>onInspectActor(activeId)}>
    <EmoteBadge emote={bubble.emote} view={view}/>
    <span class="ui2-bubble-copy">
     <b>{names[activeId]??activeId}{bubble.buddyId&&<i class="ui2-banter-tag">{step===0?' · 1/2':' · 2/2'}</i>}</b>
     <small>{text}</small>
    </span>
   </button>
  </div>
 );
}

export function PeriodBeatBanner({text,hidden}:{text:string|null;hidden:boolean}){
 if(!text)return null;
 return (
  <div class="ui2-period-beat" role="status" aria-live="polite" style={hidden?{visibility:'hidden',pointerEvents:'none'}:undefined}>
   <Icon name="spark"/>
   <span>{text}</span>
  </div>
 );
}
