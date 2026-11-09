import type {GameView} from 'oot-platform';
import {activityFor} from './scene-layout.js';
export type OfficeFocus={x:number;y:number}|null;
export const workLabelOffset=-32;
export type CameraZone='overview'|'work-left'|'work-right'|'meeting'|'lounge';
export const zoneNames:Record<CameraZone,[string,string]>={overview:['全景','Overview'],'work-left':['工作区Ⅰ','Work I'],'work-right':['工作区Ⅱ','Work II'],meeting:['会议区','Meeting'],lounge:['休闲区','Lounge']};
export function slotPoint(slot:string,chapter=0){const n=Number(slot.split('-')[1])-1;
 if(slot.startsWith('work')){const row=Math.floor(n/4),col=n%4;return {x:640+col*260+(row%2)*36,y:chapter===0?795:620+row*130};}
 if(slot.startsWith('meeting'))return chapter===0?{x:920+n*350,y:635}:{x:180+n*240,y:580};
 if(slot.startsWith('server'))return {x:1740,y:635+n*200};
 return {x:215+n%2*245,y:(chapter===0?635:780)+Math.floor(n/2)*180};
}
export function officeCamera(width:number,height:number,zone:CameraZone,focus:OfficeFocus=null){
 // AI Village contract: overlays never reserve world space or move the camera.
 // Cover the entire viewport with the same transform for background and entities.
 const centers={overview:[960,540],'work-left':[770,730],'work-right':[1350,730],meeting:[1090,590],lounge:[330,700]} as const;
 const scale=Math.max(width/1920,height/1080)*(focus?1.6:zone==='overview'||width<900?1:1.25),[cx,cy]=focus?[focus.x,focus.y]:centers[zone];
 const clamp=(n:number,min:number)=>Math.max(min,Math.min(0,n));
 return {scale,x:clamp(width/2-cx*scale,width-1920*scale),y:zone==='overview'&&!focus?height-1080*scale:clamp(height/2-cy*scale,height-1080*scale),clip:{x:0,y:0,width,height}};
}
export function idlePoint(index:number,count=4){
 if(count<=4){const pts=[{x:335,y:655},{x:490,y:655},{x:215,y:900},{x:430,y:900}] as const;return pts[index%4]!;}
 // Aisles around the furniture, rather than a grid running through desks/whiteboards.
 const pts=[{x:500,y:600},{x:1280,y:600},{x:1530,y:600},{x:1770,y:600},
  {x:170,y:835},{x:400,y:835},{x:1500,y:835},{x:1770,y:835},
  {x:570,y:955},{x:810,y:955},{x:1050,y:955},{x:1290,y:955}];
 return pts[index%pts.length]!;
}
/** Shared render anchors: locating and presence use exactly the renderer's placement. */
export function actorPlacements(view:GameView){
 const scene=view.campaign?.scene??'workshop',chapter=view.campaign?.chapter??0;
 const members=view.actors.filter(a=>a.location===scene);let idle=0;
 return members.map(a=>{
  const reservation=view.office?.reservations[a.id],item=reservation&&view.office?.items.find(i=>i.id===reservation.item),activity=activityFor(view,a.id);
  const seated=!!(scene==='workshop'&&item?.slot&&['work','review','think'].includes(activity));
  const p=seated?slotPoint(item!.slot!,chapter):scene==='workshop'?idlePoint(idle++,members.length):{x:600+(idle%4)*300,y:750+Math.floor(idle++/4)*130};
  return {id:a.id,x:p.x+(seated&&reservation?.zone==='meeting'?(reservation.seat===0?-72:72):0),y:p.y,activity,seated,zone:seated?reservation!.zone:'lounge'};
 });
}
export function actorFocus(view:GameView,id:string):OfficeFocus{
 if(view.campaign?.scene!=='workshop')return null;
 const p=actorPlacements(view).find(p=>p.id===id);return p?{x:p.x,y:p.y-110}:null;
}
export function jobFocus(view:GameView,id:string):OfficeFocus{
 if(view.campaign?.scene!=='workshop')return null;
 const r=Object.values(view.office?.reservations??{}).find(r=>r.job===id),item=r&&view.office?.items.find(i=>i.id===r.item);
 if(!item?.slot)return null;const p=slotPoint(item.slot,view.campaign.chapter);return {x:p.x,y:p.y-110};
}
export function actorOutsideFrame(x:number,y:number,height:number,scale:number,offset:{x:number;y:number},width:number,viewportHeight:number){
 const cx=offset.x+x*scale,foot=offset.y+y*scale;
 return cx-48*scale<0||cx+48*scale>width||foot-height*scale<0||foot+26>viewportHeight;
}
