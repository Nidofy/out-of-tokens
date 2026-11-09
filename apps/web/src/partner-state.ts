import type {GameView} from 'oot-platform';

/** UI availability follows the existing campaign rules; assignment occupancy is separate. */
export function partnerAvailability(view:GameView,actor:GameView['actors'][number],locked=false){
 const p=view.campaign!,sameScene=actor.location===p.scene,onExpedition=actor.location==='expedition';
 const activeJobs=view.jobs.filter(j=>['working','review','accepted','waiting'].includes(j.status)&&j.team.some(m=>m.character===actor.id));
 const lifeBusy=actor.busyUntil>view.absoluteSlot||view.overtime.includes(actor.id)||(activeJobs.length>0&&view.absoluteSlot%4<2);
 const canRecall=!locked&&!onExpedition&&!lifeBusy&&actor.location!=='workshop'&&(sameScene||p.software.includes('remote'));
 const status=onExpedition?'expedition':lifeBusy?(activeJobs.length&&actor.busyUntil<=view.absoluteSlot?'work':'occupied'):!sameScene?'elsewhere':null;
 return {sameScene,onExpedition,activeJobs,lifeBusy,canRecall,status};
}
