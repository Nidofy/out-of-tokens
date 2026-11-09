import type {UiFeedback} from './presentation-events.js';
export {feedbackSurface} from './presentation-events.js';

/** Rendered in exactly one owning surface. Modal backgrounds never repeat this live region. */
export function FeedbackNotice({feedback,message,english,dismiss}:{feedback:UiFeedback|null;message:string;english:boolean;dismiss:()=>void}){
 if(!feedback)return null;
 return <div class="feedback-notice" data-kind={feedback.error?'error':feedback.receipt?'receipt':'success'}>
  <p key={feedback.id} role={feedback.error?'alert':'status'}>{feedback.receipt?.title[english?1:0]??message}</p>
  <button onClick={dismiss} aria-label={english?'Dismiss feedback':'收起反馈'}>×</button>
 </div>;
}
