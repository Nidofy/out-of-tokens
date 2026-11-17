import {useEffect,useState} from 'preact/hooks';
import {experienceArt} from './experience-art.js';
import {Icon} from './icons.js';
import {visualReviewEnabled} from './visual-review.js';

const OBJECT_POSITIONS:Readonly<Record<string,string>>={
 'outcome-tea-menu':'50% 45%',
 'outcome-cafe-sign':'50% 50%',
 'outcome-community-web':'50% 45%',
 'outcome-bookshop-system':'50% 50%',
 'outcome-bookshop-guide':'50% 50%',
 'outcome-workshop-display':'50% 48%',
 'vignette-rest-corner':'68% 50%',
 'vignette-first-delivery':'66% 48%'
};

export interface ExperienceArtSlotProps {
 slotId:string;
 variant:'outcome'|'vignette';
 english:boolean;
 title:string;
 subtitle?:string|undefined;
 badgeText?:string|undefined;
 state?:'preview'|'delivered'|'neutral'|undefined;
}

/**
 * Renders an Art-Batch 7 outcome card (3:2) or vignette banner (3:1) strictly via Track B's experienceArt() whitelist.
 * Supports lazy decoding, CSS dark-mode scrims, and complete DOM fallback when assets are unpublished, offline, or failed.
 */
export function ExperienceArtSlot({
 slotId,
 variant,
 english,
 title,
 subtitle,
 badgeText,
 state='neutral'
}:ExperienceArtSlotProps){
 const src=experienceArt(slotId);
 const forceFault=(import.meta.env.DEV||visualReviewEnabled)&&new URLSearchParams(location.search).get('test-fault')==='art';
 const [failed,setFailed]=useState(forceFault);

 useEffect(()=>{setFailed(forceFault);},[src,forceFault]);

 const showImage=!!src&&!failed;
 const objectPosition=OBJECT_POSITIONS[slotId]??'50% 50%';
 const iconName=variant==='vignette'?'cup':state==='delivered'?'check':'briefcase';

 return (
  <figure
   class={`ui2-art-slot is-${variant}`}
   data-slot-id={slotId}
   data-variant={variant}
   data-state={state}
   data-art-state={showImage?'loaded':'fallback'}
  >
   {showImage?(
    <div class="ui2-art-frame">
     <img
      src={src!}
      alt=""
      loading="lazy"
      decoding="async"
      style={{objectPosition}}
      onError={()=>setFailed(true)}
     />
     <div class="ui2-art-scrim" aria-hidden="true"/>
     {badgeText&&variant!=='vignette'&&<span class="ui2-art-badge">{badgeText}</span>}
     {variant==='vignette'&&(
      <figcaption class="ui2-art-vignette-copy">
       {badgeText&&<span class="ui2-art-badge is-inline">{badgeText}</span>}
       <b>{title}</b>
       {subtitle&&<small>{subtitle}</small>}
      </figcaption>
     )}
    </div>
   ):(
    <div class="ui2-art-fallback" role="note" aria-label={title}>
     <Icon name={iconName}/>
     <div class="ui2-art-fallback-copy">
      {badgeText&&<span class="ui2-art-badge is-inline">{badgeText}</span>}
      <b>{title}</b>
      {subtitle&&<small>{subtitle}</small>}
      {src===null&&<small class="ui2-muted-note">{english?'Illustration pending publication; full info shown in text.':'插画待上线；完整经营结果以文本为准。'}</small>}
     </div>
    </div>
   )}
   {showImage&&variant==='outcome'&&(
    <figcaption class="ui2-art-outcome-caption">
     <b>{title}</b>
     {subtitle&&<small>{subtitle}</small>}
    </figcaption>
   )}
  </figure>
 );
}
