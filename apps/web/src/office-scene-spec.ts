import type {GameView} from 'oot-platform';
import {activityFor} from './scene-layout.js';
export type OfficeFocus={x:number;y:number}|null;
export const workLabelOffset=-32;
/** Ignore SVG padding and low-alpha floor shadows; both layers use the shared (0,0) anchor. */
export function workFurnitureHitArea(rgba:ArrayLike<number>,width=280,height=240){
 const mask=Uint8Array.from({length:width*height},(_,i)=>rgba[i*4+3]!>=96?1:0);
 return {contains(x:number,y:number){const px=Math.floor((x+140)*width/280),py=Math.floor((y+200)*height/240);return px>=0&&py>=0&&px<width&&py<height&&mask[py*width+px]===1;}};
}
/** Resolve small same-row label collisions without shrinking the 12px text. */
export function separateOfficeLabels(rows:{id:string;x:number;y:number;width:number;height:number}[],viewportWidth:number,viewportHeight=Infinity){
 const placed:typeof rows=[];
 for(const row of [...rows].sort((a,b)=>a.y-b.y||a.x-b.x)){
  const next={...row};for(const previous of placed){if(Math.min(next.y+next.height,previous.y+previous.height)<=Math.max(next.y,previous.y))continue;const left=next.x-next.width/2,right=previous.x+previous.width/2;if(left<right+3&&next.x+next.width/2>previous.x-previous.width/2)next.x=right+3+next.width/2;}
  next.x=Math.min(viewportWidth-next.width/2,next.x);
  const overlaps=(a:typeof row,b:typeof row)=>Math.min(a.y+a.height,b.y+b.height)>Math.max(a.y,b.y)&&Math.min(a.x+a.width/2,b.x+b.width/2)>Math.max(a.x-a.width/2,b.x-b.width/2);
  if(Math.abs(next.x-row.x)>40||placed.some(p=>overlaps(next,p))){
   next.x=Math.max(row.width/2,Math.min(viewportWidth-row.width/2,row.x));next.y=row.y;
   for(let n=0;n<=placed.length;n++){const hits=placed.filter(p=>overlaps(next,p));if(!hits.length)break;next.y=Math.max(...hits.map(p=>p.y+p.height))+3;}
   if(next.y+next.height>viewportHeight){next.y=row.y;for(let n=0;n<=placed.length;n++){const hits=placed.filter(p=>overlaps(next,p));if(!hits.length)break;next.y=Math.min(...hits.map(p=>p.y))-next.height-3;}}
  }
  placed.push(next);
 }
 return placed;
}
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
/** Keep idle faces out of newly occupied meeting/lounge furniture without moving slot anchors. */
export function clearIdleFurniture(point:{x:number;y:number},furniture:{kind:string;x:number;y:number}[],others:{x:number;y:number}[]){
 const p={...point},half=(kind:string)=>kind==='whiteboard'?112:82;
 const blocks=(q:typeof p,f:typeof furniture[number])=>q.y<f.y&&q.y>f.y-200&&Math.abs(q.x-f.x)<half(f.kind)+80;
 for(const f of furniture){if(!blocks(p,f))continue;
  const candidates=[{x:f.x-half(f.kind)-80,y:p.y},{x:f.x+half(f.kind)+80,y:p.y}].sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x));
  const free=candidates.find(q=>!furniture.some(f=>blocks(q,f))&&!others.some(o=>Math.abs(o.x-q.x)<120&&Math.abs(o.y-q.y)<100));
  if(free)p.x=free.x;else p.y=f.y+100;
 }
 return p;
}
/** Shared render anchors: locating and presence use exactly the renderer's placement. */
export function actorPlacements(view:GameView){
 const scene=view.campaign?.scene??'workshop',chapter=view.campaign?.chapter??0;
 const members=view.actors.filter(a=>a.location===scene);let idle=0;
 const placements=members.map(a=>{
  const reservation=view.office?.reservations[a.id],item=reservation&&view.office?.items.find(i=>i.id===reservation.item),activity=activityFor(view,a.id);
  const seated=!!(scene==='workshop'&&item?.slot&&['work','review','think'].includes(activity));
  const p=seated?slotPoint(item!.slot!,chapter):scene==='workshop'?idlePoint(idle++,members.length):{x:600+(idle%4)*300,y:750+Math.floor(idle++/4)*130};
  return {id:a.id,x:p.x+(seated&&reservation?.zone==='meeting'?(reservation.seat===0?-72:72):0),y:p.y,activity,seated,zone:seated?reservation!.zone:'lounge'};
 });
 if(scene==='workshop'){
  const furniture=(view.office?.items??[]).filter(i=>i.slot&&['whiteboard','coffee'].includes(i.kind)).map(i=>({kind:i.kind,...slotPoint(i.slot!,chapter)}));
  for(const p of placements.filter(p=>!p.seated))Object.assign(p,clearIdleFurniture(p,furniture,placements.filter(o=>o!==p)));
 }
 return placements;
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
